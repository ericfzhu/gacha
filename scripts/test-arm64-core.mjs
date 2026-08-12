import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Arm64Runtime, LIBPAD_PROBE_ADDRESS } from '../src/binary-port/arm64Runtime.js';

const project = resolve(import.meta.dirname, '..');
const apk = resolve(project, 'jp.gungho.pad_21.9.0-21900_minAPI24(arm64-v8a).apk');
const wasm = await readFile(resolve(project, 'public/wasm/arm64_core.wasm'));
const libpad = execFileSync('unzip', ['-p', apk, 'lib/arm64-v8a/libpad.so'], { maxBuffer: 40 * 1024 * 1024 });
const sha256 = createHash('sha256').update(libpad).digest('hex');

if (sha256 !== '785ffa641837c528864cfbeb9716e340c9d948ba3a37bca3193b5cd32dda89d8') {
  throw new Error(`Unexpected libpad.so SHA-256: ${sha256}`);
}

const runtime = await Arm64Runtime.create(wasm);
const elf = runtime.loadElf(libpad);
const result = runtime.runLibpadProbe(true);

if (!result.passed) throw new Error(`ARM64 probe failed: ${JSON.stringify(result)}`);
if (runtime.peek32(LIBPAD_PROBE_ADDRESS) !== 0x52801c20) throw new Error('Unexpected first libpad instruction');
if (elf.loadSegments.length !== 2) throw new Error(`Expected 2 load segments, received ${elf.loadSegments.length}`);
if (elf.customSections.length !== 1 || elf.customSections[0].size !== 0xa7d168) throw new Error('Protected custom section was not identified');

runtime.reset(0x3323d0);
const addressHelperTrace = runtime.trace(8);
if (runtime.exports.arm64_get_status() !== 1 || runtime.exports.arm64_get_register(2) !== 0x3323dcn) {
  throw new Error(`ADR/LDR helper failed: ${JSON.stringify(addressHelperTrace)}`);
}

runtime.reset(0x3323dc);
const imageBaseTrace = runtime.trace(20);
if (runtime.exports.arm64_get_status() !== 1 || runtime.exports.arm64_get_register(0) !== 0n) {
  throw new Error(`Nested branch/stack helper failed: ${JSON.stringify(imageBaseTrace)}`);
}


runtime.reset(0x332cf0);
const constructorTrace = runtime.trace(2000);
const syscall = runtime.syscallSnapshot();
if (!syscall || syscall.number !== 56) {
  throw new Error(`Expected first constructor syscall to be openat(56): ${JSON.stringify(constructorTrace.slice(-8))}`);
}
const firstSyscallPath = runtime.readCString(Number(syscall.arguments[1]));
if (firstSyscallPath !== '/proc/self/maps') throw new Error(`Expected first openat path to be /proc/self/maps, received ${JSON.stringify(firstSyscallPath)}`);

console.log(JSON.stringify({
  sha256,
  fileBytes: libpad.length,
  loadSegments: elf.loadSegments.length,
  customSectionBytes: elf.customSections[0].size,
  probe: result,
  addressHelperInstructions: addressHelperTrace.length,
  nestedHelperInstructions: imageBaseTrace.length,
  constructorInstructionsToFirstSyscall: constructorTrace.length,
  firstSyscall: {
    number: syscall.number,
    arguments: syscall.arguments.map((value) => `0x${value.toString(16)}`),
    svcAddress: `0x${syscall.svcAddress.toString(16)}`,
    path: firstSyscallPath,
  },
}, null, 2));
