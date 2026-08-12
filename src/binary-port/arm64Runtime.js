import { parseElf64 } from './elf64.js';

export const ARM64_STATUS = Object.freeze({ RUNNING: 0, HALTED: 1, SYSCALL: 2, UNKNOWN_INSTRUCTION: -1, MEMORY: -2, ALIGNMENT: -3 });
export const LIBPAD_PROBE_ADDRESS = 0x3323c0;
export const LIBPAD_CONSTRUCTOR_ADDRESS = 0x332cf0;
export const LIBPAD_PROBE_BYTES = new Uint8Array([
  0x20, 0x1c, 0x80, 0x52, // mov w0, #0xe1
  0xc0, 0x03, 0x5f, 0xd6, // ret
]);

const PAGE_BYTES = 65536;
const DEFAULT_MEMORY_PAGES = 768;
const DEFAULT_MAXIMUM_PAGES = 2048;
const DEFAULT_MEMORY_BIAS = 0x200000;
const RETURN_SENTINEL = 0xffffffffffffffffn;

function hex(value, width = 0) {
  const rendered = BigInt(value).toString(16);
  return `0x${rendered.padStart(width, '0')}`;
}

export class Arm64Runtime {
  static async create(source = '/wasm/arm64_core.wasm') {
    const memory = new WebAssembly.Memory({ initial: DEFAULT_MEMORY_PAGES, maximum: DEFAULT_MAXIMUM_PAGES });
    const bytes = typeof source === 'string'
      ? await fetch(source).then((response) => {
        if (!response.ok) throw new Error(`Unable to load ARM64 Wasm core (${response.status})`);
        return response.arrayBuffer();
      })
      : source;
    const result = await WebAssembly.instantiate(bytes, { env: { memory } });
    return new Arm64Runtime(result.instance, memory);
  }

  constructor(instance, memory, memoryBias = DEFAULT_MEMORY_BIAS) {
    this.instance = instance;
    this.memory = memory;
    this.exports = instance.exports;
    this.memoryBias = memoryBias;
    this.loadedElf = null;
    this.exports.arm64_set_memory_bias(memoryBias);
  }

  ensureCapacity(guestEnd) {
    const required = this.memoryBias + guestEnd;
    const current = this.memory.buffer.byteLength;
    if (required <= current) return;
    this.memory.grow(Math.ceil((required - current) / PAGE_BYTES));
  }

  loadBytes(virtualAddress, bytes) {
    this.ensureCapacity(virtualAddress + bytes.length);
    new Uint8Array(this.memory.buffer, this.memoryBias + virtualAddress, bytes.length).set(bytes);
  }

  loadElf(input) {
    const elf = parseElf64(input);
    this.ensureCapacity(elf.maximumAddress);
    const memoryBytes = new Uint8Array(this.memory.buffer);
    for (const segment of elf.loadSegments) {
      const start = this.memoryBias + segment.virtualAddress;
      const fileEnd = segment.fileOffset + segment.fileSize;
      if (fileEnd > elf.bytes.length) throw new Error(`PT_LOAD ${segment.index} extends beyond the file`);
      memoryBytes.fill(0, start, start + segment.memorySize);
      memoryBytes.set(elf.bytes.subarray(segment.fileOffset, fileEnd), start);
    }
    this.loadedElf = elf;
    return elf;
  }

  peek32(virtualAddress) {
    const view = new DataView(this.memory.buffer);
    return view.getUint32(this.memoryBias + virtualAddress, true);
  }

  readCString(virtualAddress, maximumBytes = 4096) {
    const bytes = new Uint8Array(this.memory.buffer);
    const start = this.memoryBias + virtualAddress;
    const available = Math.min(maximumBytes, bytes.length - start);
    let length = 0;
    while (length < available && bytes[start + length] !== 0) length += 1;
    return new TextDecoder().decode(bytes.subarray(start, start + length));
  }

  reset(pc, stackPointer = 0x1f00000n) {
    this.exports.arm64_reset(BigInt(pc));
    this.exports.arm64_set_sp(BigInt(stackPointer));
    this.exports.arm64_set_register(30, RETURN_SENTINEL);
  }

  trace(maximumSteps = 32) {
    const entries = [];
    for (let index = 0; index < maximumSteps; index += 1) {
      const pc = this.exports.arm64_get_pc();
      const instruction = this.peek32(Number(pc));
      const status = this.exports.arm64_step();
      entries.push({ pc: hex(pc, 8), instruction: `0x${instruction.toString(16).padStart(8, '0')}`, status });
      if (status !== ARM64_STATUS.RUNNING) break;
    }
    return entries;
  }

  runLibpadProbe(useLoadedElf = false) {
    if (!useLoadedElf) this.loadBytes(LIBPAD_PROBE_ADDRESS, LIBPAD_PROBE_BYTES);
    this.reset(LIBPAD_PROBE_ADDRESS);
    const trace = this.trace(8);
    return {
      passed: this.exports.arm64_get_status() === ARM64_STATUS.HALTED && this.exports.arm64_get_register(0) === 225n,
      x0: Number(this.exports.arm64_get_register(0)),
      steps: Number(this.exports.arm64_get_steps()),
      status: this.exports.arm64_get_status(),
      trace,
    };
  }

  syscallSnapshot() {
    if (this.exports.arm64_get_status() !== ARM64_STATUS.SYSCALL) return null;
    return {
      number: Number(this.exports.arm64_get_register(8)),
      arguments: Array.from({ length: 6 }, (_, index) => this.exports.arm64_get_register(index)),
      pc: this.exports.arm64_get_pc(),
      svcAddress: this.exports.arm64_get_fault_address(),
    };
  }

  runToFirstSyscall(pc = LIBPAD_CONSTRUCTOR_ADDRESS, maximumSteps = 2000) {
    this.reset(pc);
    const trace = this.trace(maximumSteps);
    const syscall = this.syscallSnapshot();
    return {
      reached: Boolean(syscall),
      steps: Number(this.exports.arm64_get_steps()),
      status: this.exports.arm64_get_status(),
      number: syscall?.number ?? null,
      path: syscall?.number === 56 ? this.readCString(Number(syscall.arguments[1])) : null,
      trace: trace.slice(-8),
    };
  }
}
