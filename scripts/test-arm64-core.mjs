import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { deflateRawSync, deflateSync, gzipSync } from 'node:zlib';
import { ARM64_STATUS, Arm64Runtime, LIBPAD_CONSTRUCTOR_ADDRESS, LIBPAD_PROBE_ADDRESS } from '../src/binary-port/arm64Runtime.js';
import { AARCH64_SYSCALL, VirtualLinux } from '../src/binary-port/virtualLinux.js';
import { VirtualJni } from '../src/binary-port/virtualJni.js';
import { ANDROID_TOUCH_ACTION, PadBrowserInputModel, createPadTouchFrame } from '../src/binary-port/padInputModel.js';
import { inflateBytes } from '../src/binary-port/inflate.js';
import { canonicalPadRuntimePath, mountPadRuntimeFiles } from '../src/binary-port/padRuntimeFiles.js';

const project = resolve(import.meta.dirname, '..');
const apk = resolve(project, 'jp.gungho.pad_21.9.0-21900_minAPI24(arm64-v8a).apk');
const wasm = await readFile(resolve(project, 'public/wasm/arm64_core.wasm'));
const libpad = execFileSync('unzip', ['-p', apk, 'lib/arm64-v8a/libpad.so'], { maxBuffer: 40 * 1024 * 1024 });
const sha256 = createHash('sha256').update(libpad).digest('hex');

if (canonicalPadRuntimePath('DATA030.BIN') !== '/data/user/0/jp.gungho.pad/cache/data030.bin' ||
    canonicalPadRuntimePath('retained/DATA048.BIN') !== '/data/user/0/jp.gungho.pad/files/data048.bin' ||
    canonicalPadRuntimePath('boot.bin') !== '/data/user/0/jp.gungho.pad/files/boot.bin') {
  throw new Error('PAD supplementary runtime paths were not canonicalized to native private storage');
}
const mountProbe = { paths: [], mount(path, bytes) { this.paths.push([path, bytes.length]); } };
const mountedProbePaths = mountPadRuntimeFiles(mountProbe, [
  { name: 'DATA030.BIN', bytes: new Uint8Array(3) },
  { name: 'DATA048.BIN', bytes: new Uint8Array(4) },
]);
if (mountedProbePaths[0] !== '/data/user/0/jp.gungho.pad/cache/data030.bin' ||
    mountedProbePaths[1] !== '/data/user/0/jp.gungho.pad/files/data048.bin' ||
    mountProbe.paths[0][1] !== 3 || mountProbe.paths[1][1] !== 4) {
  throw new Error('PAD supplementary runtime files were not mounted at their native paths');
}

const inflateFixture = new TextEncoder().encode('libpad browser inflate fixture '.repeat(2048));
for (const [compressed, windowBits] of [
  [deflateRawSync(inflateFixture), -15],
  [deflateSync(inflateFixture), 15],
  [gzipSync(inflateFixture), 31],
]) {
  const expanded = inflateBytes(compressed, windowBits);
  if (expanded.length !== inflateFixture.length || expanded.some((value, index) => value !== inflateFixture[index])) {
    throw new Error(`Browser DEFLATE implementation failed for windowBits ${windowBits}`);
  }
}

const touchFrame = createPadTouchFrame({ x: 120, y: 300, rawAction: 0x105, pointerCount: 2, eventTime: 1234 }, {
  viewScale: 1.5,
  statusBarHeight: 24,
});
if (touchFrame.y !== 273 || touchFrame.pointerIndex !== 0 || touchFrame.reserved !== 0 ||
    touchFrame.action !== ANDROID_TOUCH_ACTION.POINTER_DOWN || touchFrame.eventTime !== 1234n) {
  throw new Error(`PAD touch-frame transform failed: ${JSON.stringify(touchFrame, (_, value) => typeof value === 'bigint' ? value.toString() : value)}`);
}
const browserInput = new PadBrowserInputModel({ viewScale: 1, statusBarHeight: 20 });
const primaryDown = browserInput.begin(7, 50, 90, 10);
const secondaryDown = browserInput.begin(8, 200, 210, 11);
const secondaryUp = browserInput.end(8, 205, 215, 12);
if (primaryDown.rawAction !== 0 || secondaryDown.rawAction !== 0x105 || secondaryDown.pointerCount !== 2 ||
    secondaryDown.x !== 50 || secondaryDown.y !== 68 || secondaryUp.rawAction !== 0x106) {
  throw new Error('Browser pointer adaptation does not match the AppDelegate slot-0 input model');
}

if (sha256 !== '785ffa641837c528864cfbeb9716e340c9d948ba3a37bca3193b5cd32dda89d8') {
  throw new Error(`Unexpected libpad.so SHA-256: ${sha256}`);
}

const runtime = await Arm64Runtime.create(wasm);
const elf = runtime.loadElf(libpad);
const featureProbe = runtime.runCoreFeatureProbe();
if (!featureProbe.passed) throw new Error(`ARM64 capability probe failed: ${JSON.stringify(featureProbe, (_, value) => typeof value === 'bigint' ? value.toString() : value)}`);
const result = runtime.runLibpadProbe(true);

const allocatorLinux = new VirtualLinux(runtime, { mmapBase: 0x5ff0000 });
allocatorLinux.mountSharedObject('/system/lib64/liblog.so', await readFile(resolve(project, 'public/android-stubs/liblog.so')), 0x6000000);
allocatorLinux.mountSharedObject('/system/lib64/libc.so', await readFile(resolve(project, 'public/android-stubs/libc.so')), 0x6200000);
if (!allocatorLinux.resolveSymbolAddress('fcntl') || !allocatorLinux.resolveSymbolAddress('inotify_add_watch') ||
    !allocatorLinux.resolveSymbolAddress('gettimeofday') || !allocatorLinux.resolveSymbolAddress('sigaction') ||
    !allocatorLinux.resolveSymbolAddress('rewinddir') || !allocatorLinux.resolveSymbolAddress('fgetpos') ||
    !allocatorLinux.resolveSymbolAddress('pthread_exit') ||
    !allocatorLinux.resolveSymbolAddress('sendmsg') || !allocatorLinux.resolveSymbolAddress('strstr') ||
    !allocatorLinux.resolveSymbolAddress('pthread_once') || !allocatorLinux.resolveSymbolAddress('realloc') ||
    !allocatorLinux.resolveSymbolAddress('recvmsg') || !allocatorLinux.resolveSymbolAddress('__cmsg_nxthdr')) {
  throw new Error('Browser libc is missing a required loader descriptor API');
}
const afterSharedObject = allocatorLinux.findAvailableMapAddress(0x300000);
if (afterSharedObject < 0x6003000) throw new Error('Virtual mmap allocator overlapped a loaded shared object');
const afterHostRuntime = allocatorLinux.findAvailableMapAddress(0x300000, 0x7bf0000);
if (afterHostRuntime < 0x7e00000) throw new Error('Virtual mmap allocator overlapped the host bridge/JNI arena');

allocatorLinux.descriptors.set(10, { path: '/fcntl-probe', data: new Uint8Array(4), offset: 0, directory: false, openFlags: 0x8000 });
allocatorLinux.descriptorFlags.set(10, 0);
const fcntlSnapshot = (command, argument = 0, fd = 10) => ({
  number: AARCH64_SYSCALL.FCNTL,
  arguments: [BigInt(fd), BigInt(command), BigInt(argument), 0n, 0n, 0n],
  pc: 0n,
  svcAddress: 0n,
});
if (allocatorLinux.service(fcntlSnapshot(2, 1)).result !== 0n ||
    allocatorLinux.service(fcntlSnapshot(1)).result !== 1n ||
    allocatorLinux.service(fcntlSnapshot(3)).result !== 0x8000n) {
  throw new Error('Virtual fcntl flag operations failed');
}
const duplicateFd = Number(allocatorLinux.service(fcntlSnapshot(1030, 20)).result);
if (duplicateFd !== 20 || allocatorLinux.descriptors.get(20) !== allocatorLinux.descriptors.get(10) ||
    allocatorLinux.service(fcntlSnapshot(1, 0, duplicateFd)).result !== 1n) {
  throw new Error('Virtual F_DUPFD_CLOEXEC semantics failed');
}
const inotifyInit = allocatorLinux.service({ ...fcntlSnapshot(0), number: AARCH64_SYSCALL.INOTIFY_INIT1 });
const inotifyFd = Number(inotifyInit.result);
const inotifyPathAddress = 0x2eff000;
runtime.writeBytes(inotifyPathAddress, new TextEncoder().encode('/data/user/0/jp.gungho.pad\0'));
const inotifyWatch = allocatorLinux.service({
  number: AARCH64_SYSCALL.INOTIFY_ADD_WATCH,
  arguments: [BigInt(inotifyFd), BigInt(inotifyPathAddress), 0xfffn, 0n, 0n, 0n],
  pc: 0n,
  svcAddress: 0n,
});
if (inotifyFd < 3 || inotifyWatch.result !== 1n) throw new Error('Virtual inotify watch registration failed');

if (!result.passed) throw new Error(`ARM64 probe failed: ${JSON.stringify(result)}`);
if (runtime.peek32(runtime.elfAddress(LIBPAD_PROBE_ADDRESS)) !== 0x52801c20) throw new Error('Unexpected first libpad instruction');
if (elf.loadSegments.length !== 2) throw new Error(`Expected 2 load segments, received ${elf.loadSegments.length}`);
if (elf.customSections.length !== 1 || elf.customSections[0].size !== 0xa7d168) throw new Error('Protected custom section was not identified');
if (elf.dynamicEntries.find((entry) => entry.tag === 27)?.value !== 416) throw new Error('Expected the 52-entry DT_INIT_ARRAYSZ value');

const readWatchProbeAddress = 0x2f00000;
const readWatchDataAddress = readWatchProbeAddress + 0x100;
runtime.loadBytes(readWatchProbeAddress, new Uint8Array([
  0x20, 0x00, 0x00, 0xf9, // str x0, [x1] (must not trigger a read watchpoint)
  0x22, 0x00, 0x40, 0xf9, // ldr x2, [x1]
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(readWatchProbeAddress);
runtime.exports.arm64_set_register(0, 0x1122334455667788n);
runtime.exports.arm64_set_register(1, BigInt(readWatchDataAddress));
runtime.exports.arm64_set_read_watchpoint_range(BigInt(readWatchDataAddress - 0x20), 0x40n);
const readWatchTrace = runtime.trace(4);
if (readWatchTrace.length !== 2 || runtime.exports.arm64_get_status() !== ARM64_STATUS.WATCHPOINT ||
    runtime.exports.arm64_get_watchpoint_is_load() !== 1 ||
    runtime.exports.arm64_get_watchpoint_store_address() !== BigInt(readWatchDataAddress) ||
    runtime.exports.arm64_get_watchpoint_value() !== 0x1122334455667788n) {
  throw new Error(`Read watchpoint failed: ${JSON.stringify(readWatchTrace)}`);
}
runtime.reset(readWatchProbeAddress);
runtime.exports.arm64_set_register(0, 0x8877665544332211n);
runtime.exports.arm64_set_register(1, BigInt(readWatchDataAddress));
runtime.exports.arm64_set_watchpoint_range(BigInt(readWatchDataAddress - 0x20), 0x40n);
const writeWatchTrace = runtime.trace(2);
if (writeWatchTrace.length !== 1 || runtime.exports.arm64_get_status() !== ARM64_STATUS.WATCHPOINT ||
    runtime.exports.arm64_get_watchpoint_is_load() !== 0 ||
    BigInt.asUintN(64, runtime.exports.arm64_get_watchpoint_value()) !== 0x8877665544332211n) {
  throw new Error(`Write watchpoint range failed: ${JSON.stringify({
    trace: writeWatchTrace,
    operation: runtime.exports.arm64_get_watchpoint_is_load(),
    address: runtime.exports.arm64_get_watchpoint_store_address().toString(16),
    value: runtime.exports.arm64_get_watchpoint_value().toString(16),
  })}`);
}

const stackCounterProbeAddress = readWatchProbeAddress + 0x40;
const stackCounterAddress = 0x3ef0000;
runtime.loadBytes(stackCounterProbeAddress, new Uint8Array([
  0xe0, 0x1f, 0x40, 0xf9, // ldr x0, [sp, #56]
  0x00, 0x04, 0x00, 0x91, // add x0, x0, #1
  0xe0, 0x1f, 0x00, 0xf9, // str x0, [sp, #56]
  0xe1, 0x1f, 0x40, 0xf9, // ldr x1, [sp, #56]
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.writeUint64(stackCounterAddress + 56, 2n);
runtime.reset(stackCounterProbeAddress, BigInt(stackCounterAddress));
runtime.trace(8);
if (runtime.exports.arm64_get_register(0) !== 3n || runtime.exports.arm64_get_register(1) !== 3n ||
    new DataView(runtime.readBytes(stackCounterAddress + 56, 8).buffer).getBigUint64(0, true) !== 3n) {
  throw new Error('SP-relative 64-bit LDR/ADD/STR counter semantics failed');
}

runtime.reset(runtime.elfAddress(0x3323d0));
const addressHelperTrace = runtime.trace(8);
if (runtime.exports.arm64_get_status() !== 1 || runtime.exports.arm64_get_register(2) !== 0x3323dcn) {
  throw new Error(`ADR/LDR helper failed: ${JSON.stringify(addressHelperTrace)}`);
}

runtime.reset(runtime.elfAddress(0x3323dc));
const imageBaseTrace = runtime.trace(20);
if (runtime.exports.arm64_get_status() !== 1 || runtime.exports.arm64_get_register(0) !== BigInt(runtime.loadBias)) {
  throw new Error(`Nested branch/stack helper failed: ${JSON.stringify(imageBaseTrace)}`);
}

const bitfieldProbeAddress = 0x3000000;
runtime.loadBytes(bitfieldProbeAddress, new Uint8Array([
  0x00, 0x78, 0x1f, 0x53, // lsl w0, w0, #1 (UBFM wrap form)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(bitfieldProbeAddress);
runtime.exports.arm64_set_register(0, 0x40000000n);
runtime.trace(4);
if (runtime.exports.arm64_get_register(0) !== 0x80000000n) throw new Error('UBFM wrap/LSL semantics cleared the high result bit');

const divisionProbeAddress = bitfieldProbeAddress + 0x20;
runtime.loadBytes(divisionProbeAddress, new Uint8Array([
  0x09, 0x09, 0xca, 0x9a, // udiv x9, x8, x10
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(divisionProbeAddress);
runtime.exports.arm64_set_register(8, 123n);
runtime.exports.arm64_set_register(10, 10n);
runtime.trace(4);
if (runtime.exports.arm64_get_register(9) !== 12n) throw new Error('UDIV semantics failed');

const extractProbeAddress = divisionProbeAddress + 0x10;
runtime.loadBytes(extractProbeAddress, new Uint8Array([
  0x05, 0x18, 0x80, 0x13, // extr w5, w0, w0, #6 (ror w5, w0, #6)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(extractProbeAddress);
runtime.exports.arm64_set_register(0, 0x80000001n);
runtime.trace(4);
if (runtime.exports.arm64_get_register(5) !== 0x06000000n) throw new Error('EXTR/ROR-immediate semantics failed');

runtime.loadBytes(extractProbeAddress, new Uint8Array([
  0xad, 0x09, 0xc0, 0x5a, // rev w13, w13
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(extractProbeAddress);
runtime.exports.arm64_set_register(13, 0x12345678n);
runtime.trace(4);
if (runtime.exports.arm64_get_register(13) !== 0x78563412n) throw new Error('REV semantics failed');

const conditionalCompareProbeAddress = extractProbeAddress + 0x10;
runtime.loadBytes(conditionalCompareProbeAddress, new Uint8Array([
  0x1a, 0x04, 0x80, 0x52, // mov w26, #0x20
  0x1f, 0x04, 0x00, 0x71, // cmp w0, #1
  0x44, 0x1b, 0x50, 0x7a, // ccmp w26, #0x10, #4, ne (exact native-frame fault opcode)
  0x20, 0x00, 0x80, 0x52, // mov w0, #1
  0x42, 0x00, 0x00, 0x54, // b.cs +8
  0x00, 0x00, 0x80, 0x52, // mov w0, #0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(conditionalCompareProbeAddress);
runtime.exports.arm64_set_register(0, 0n);
runtime.trace(10);
if (runtime.exports.arm64_get_register(0) !== 1n) throw new Error('CCMP immediate true-condition semantics failed');
runtime.reset(conditionalCompareProbeAddress);
runtime.exports.arm64_set_register(0, 1n);
runtime.trace(10);
if (runtime.exports.arm64_get_register(0) !== 0n) throw new Error('CCMP immediate fallback-NZCV semantics failed');

const signedPairProbeAddress = conditionalCompareProbeAddress + 0x20;
const signedPairDataAddress = signedPairProbeAddress + 0x20;
runtime.loadBytes(signedPairProbeAddress, new Uint8Array([
  0x02, 0xd1, 0x42, 0x69, // ldpsw x2, x20, [x8, #20] (exact native-frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.loadBytes(signedPairDataAddress, new Uint8Array([
  0x00, 0x00, 0x00, 0x80,
  0xff, 0xff, 0xff, 0x7f,
]));
runtime.reset(signedPairProbeAddress);
runtime.exports.arm64_set_register(8, BigInt(signedPairDataAddress - 20));
runtime.trace(5);
if (BigInt.asUintN(64, runtime.exports.arm64_get_register(2)) !== 0xffffffff80000000n ||
    runtime.exports.arm64_get_register(20) !== 0x7fffffffn) throw new Error('LDPSW pair semantics failed');

const signedBitfieldProbeAddress = divisionProbeAddress + 0x20;
runtime.loadBytes(signedBitfieldProbeAddress, new Uint8Array([
  0x84, 0x7c, 0x7c, 0x93, // sbfiz x4, x4, #4, #32
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(signedBitfieldProbeAddress);
runtime.exports.arm64_set_register(4, 14n);
runtime.trace(4);
if (runtime.exports.arm64_get_register(4) !== 224n) throw new Error('SBFM wrap/SBFIZ semantics failed');

const vectorZeroProbeAddress = signedBitfieldProbeAddress + 0x20;
runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x40, 0xd0, 0x3b, 0xd5, // mrs x0, TPIDR_EL0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 0x07d80000n) throw new Error('TPIDR_EL0 semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x00, 0x04, 0x00, 0x4f, // movi v0.4s, #0
  0x00, 0x00, 0x66, 0x9e, // fmov x0, d0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 0n) throw new Error('NEON MOVI zero semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x40, 0x04, 0x00, 0x0f, // movi v0.2s, #2
  0x00, 0x00, 0x66, 0x9e, // fmov x0, d0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_hi(0, 0xffffffffffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 0x200000002n || runtime.exports.arm64_get_vector_hi(0) !== 0n) {
  throw new Error('NEON MOVI 2S semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x41, 0x34, 0x00, 0x4f, // orr v1.4s, #2, lsl #8 (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(1, 0x0000000100000001n);
runtime.exports.arm64_set_vector_hi(1, 0x0000000400000004n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(1) !== 0x0000020100000201n ||
    runtime.exports.arm64_get_vector_hi(1) !== 0x0000020400000204n) {
  throw new Error('NEON ORR 4S shifted-immediate semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x41, 0x34, 0x00, 0x0f, // orr v1.2s, #2, lsl #8
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(1, 0x0000000100000001n);
runtime.exports.arm64_set_vector_hi(1, 0xffffffffffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(1) !== 0x0000020100000201n ||
    runtime.exports.arm64_get_vector_hi(1) !== 0n) {
  throw new Error('NEON ORR 2S shifted-immediate semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xe0, 0x87, 0x03, 0x6f, // mvni v0.8h, #127 (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.trace(5);
if (BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(0)) !== 0xff80ff80ff80ff80n ||
    BigInt.asUintN(64, runtime.exports.arm64_get_vector_hi(0)) !== 0xff80ff80ff80ff80n) {
  throw new Error('NEON MVNI 8H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x41, 0xb4, 0x00, 0x2f, // bic v1.4h, #2, lsl #8
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(1, 0x1234ffff0201abcdn);
runtime.exports.arm64_set_vector_hi(1, 0xffffffffffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(1) !== 0x1034fdff0001a9cdn ||
    runtime.exports.arm64_get_vector_hi(1) !== 0n) {
  throw new Error('NEON BIC 4H shifted-immediate semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x01, 0xe4, 0x00, 0x6f, // movi v1.2d, #0
  0x20, 0x00, 0x66, 0x9e, // fmov x0, d1
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(1, 0xffffffffffffffffn);
runtime.exports.arm64_set_vector_hi(1, 0xffffffffffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 0n || runtime.exports.arm64_get_vector_hi(1) !== 0n) {
  throw new Error('NEON MOVI 2D zero semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x21, 0xe5, 0x04, 0x2f, // movi d1, #0xff000000ff0000ff
  0x20, 0x00, 0x66, 0x9e, // fmov x0, d1
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_hi(1, 0xffffffffffffffffn);
runtime.trace(5);
if (BigInt.asUintN(64, runtime.exports.arm64_get_register(0)) !== 0xff000000ff0000ffn ||
    runtime.exports.arm64_get_vector_hi(1) !== 0n) {
  throw new Error('NEON MOVI D byte-mask semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x00, 0xf6, 0x03, 0x4f, // fmov v0.4s, #1.0
  0x00, 0x00, 0x66, 0x9e, // fmov x0, d0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 0x3f8000003f800000n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0x3f8000003f800000n) {
  throw new Error('NEON FMOV 4S immediate semantics failed');
}

const acquireReleaseAddress = vectorZeroProbeAddress + 0x180;
runtime.loadBytes(acquireReleaseAddress, new Uint8Array([0x7a]));
runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x09, 0xfd, 0xdf, 0x08, // ldarb w9, [x8]
  0x00, 0x01, 0x40, 0x39, // ldrb w0, [x8]
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_register(8, BigInt(acquireReleaseAddress));
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 0x7an || runtime.exports.arm64_get_register(9) !== 0x7an) {
  throw new Error('LDARB semantics failed');
}
runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x09, 0xfd, 0x9f, 0x08, // stlrb w9, [x8]
  0x00, 0x01, 0x40, 0x39, // ldrb w0, [x8]
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_register(8, BigInt(acquireReleaseAddress));
runtime.exports.arm64_set_register(9, 0x35n);
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 0x35n) throw new Error('STLRB semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x60, 0x00, 0x00, 0x58, // ldr x0, #12
  0xc0, 0x03, 0x5f, 0xd6, // ret
  0x00, 0x00, 0x00, 0x00,
  0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11,
]));
runtime.reset(vectorZeroProbeAddress);
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 0x1122334455667788n) throw new Error('LDR literal semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xc1, 0x1d, 0x18, 0x4e, // mov v1.d[1], x14
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_register(14, 0x1122334455667788n);
runtime.exports.arm64_set_vector_lo(1, 0xaabbccddeeff0011n);
runtime.exports.arm64_set_vector_hi(1, 0n);
runtime.trace(5);
if (BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(1)) !== 0xaabbccddeeff0011n ||
    runtime.exports.arm64_get_vector_hi(1) !== 0x1122334455667788n) {
  throw new Error('NEON INS D element semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x62, 0x1c, 0xa3, 0x4e, // mov v2.16b, v3.16b
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(3, 0x1020304050607080n);
runtime.exports.arm64_set_vector_hi(3, 0x0102030405060708n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(2) !== 0x1020304050607080n ||
    runtime.exports.arm64_get_vector_hi(2) !== 0x0102030405060708n) {
  throw new Error('NEON ORR/MOV 16B semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x03, 0x40, 0x00, 0x6e, // ext v3.16b, v0.16b, v0.16b, #8 (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0x0706050403020100n);
runtime.exports.arm64_set_vector_hi(0, 0x0f0e0d0c0b0a0908n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(3) !== 0x0f0e0d0c0b0a0908n ||
    runtime.exports.arm64_get_vector_hi(3) !== 0x0706050403020100n) {
  throw new Error('NEON EXT 16B semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x03, 0x20, 0x01, 0x2e, // ext v3.8b, v0.8b, v1.8b, #4
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0x0706050403020100n);
runtime.exports.arm64_set_vector_lo(1, 0x0f0e0d0c0b0a0908n);
runtime.exports.arm64_set_vector_hi(3, 0xffffffffffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(3) !== 0x0b0a090807060504n ||
    runtime.exports.arm64_get_vector_hi(3) !== 0n) {
  throw new Error('NEON EXT 8B semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x02, 0x80, 0x65, 0x2e, // umlal v2.4s, v0.4h, v5.4h (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0x0005000400030002n);
runtime.exports.arm64_set_vector_hi(0, 0xffffffffffffffffn);
runtime.exports.arm64_set_vector_lo(5, 0x0011000d000b0007n);
runtime.exports.arm64_set_vector_hi(5, 0xffffffffffffffffn);
runtime.exports.arm64_set_vector_lo(2, 0x000000c800000064n);
runtime.exports.arm64_set_vector_hi(2, 0x000001900000012cn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(2) !== 0x000000e900000072n ||
    runtime.exports.arm64_get_vector_hi(2) !== 0x000001e500000160n) {
  throw new Error('NEON UMLAL 4S semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x02, 0x80, 0x65, 0x6e, // umlal2 v2.4s, v0.8h, v5.8h
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0xffffffffffffffffn);
runtime.exports.arm64_set_vector_hi(0, 0x0005000400030002n);
runtime.exports.arm64_set_vector_lo(5, 0xffffffffffffffffn);
runtime.exports.arm64_set_vector_hi(5, 0x0011000d000b0007n);
runtime.exports.arm64_set_vector_lo(2, 0x000000c800000064n);
runtime.exports.arm64_set_vector_hi(2, 0x000001900000012cn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(2) !== 0x000000e900000072n ||
    runtime.exports.arm64_get_vector_hi(2) !== 0x000001e500000160n) {
  throw new Error('NEON UMLAL2 4S semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x40, 0x84, 0x14, 0x0f, // shrn v0.4h, v2.4s, #12 (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(2, 0x23456def12345abcn);
runtime.exports.arm64_set_vector_hi(2, 0x456789ab34567890n);
runtime.exports.arm64_set_vector_hi(0, 0xffffffffffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(0) !== 0x5678456734562345n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0n) {
  throw new Error('NEON SHRN 4H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x40, 0x84, 0x14, 0x4f, // shrn2 v0.8h, v2.4s, #12
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(2, 0x23456def12345abcn);
runtime.exports.arm64_set_vector_hi(2, 0x456789ab34567890n);
runtime.exports.arm64_set_vector_lo(0, 0x0706050403020100n);
runtime.exports.arm64_set_vector_hi(0, 0n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(0) !== 0x0706050403020100n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0x5678456734562345n) {
  throw new Error('NEON SHRN2 8H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x00, 0x9e, 0x60, 0x4e, // mul v0.8h, v16.8h, v0.8h (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(16, 0x0005000400030002n);
runtime.exports.arm64_set_vector_hi(16, 0x0009000800070006n);
runtime.exports.arm64_set_vector_lo(0, 0x000d000c000b000an);
runtime.exports.arm64_set_vector_hi(0, 0x00110010000f000en);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(0) !== 0x0041003000210014n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0x0099008000690054n) {
  throw new Error('NEON MUL 8H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x00, 0x9e, 0x60, 0x0e, // mul v0.4h, v16.4h, v0.4h
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(16, 0x0005000400030002n);
runtime.exports.arm64_set_vector_lo(0, 0x000d000c000b000an);
runtime.exports.arm64_set_vector_hi(0, 0xffffffffffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(0) !== 0x0041003000210014n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0n) {
  throw new Error('NEON MUL 4H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x98, 0x96, 0x67, 0x0e, // mla v24.4h, v20.4h, v7.4h (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(20, 0x0005000400030002n);
runtime.exports.arm64_set_vector_lo(7, 0x0011000d000b0007n);
runtime.exports.arm64_set_vector_lo(24, 0x0190012c00c80064n);
runtime.exports.arm64_set_vector_hi(24, 0xffffffffffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(24) !== 0x01e5016000e90072n ||
    runtime.exports.arm64_get_vector_hi(24) !== 0n) {
  throw new Error('NEON MLA 4H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x98, 0x96, 0x67, 0x4e, // mla v24.8h, v20.8h, v7.8h
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(20, 0x0005000400030002n);
runtime.exports.arm64_set_vector_hi(20, 0x0005000400030002n);
runtime.exports.arm64_set_vector_lo(7, 0x0011000d000b0007n);
runtime.exports.arm64_set_vector_hi(7, 0x0011000d000b0007n);
runtime.exports.arm64_set_vector_lo(24, 0x0190012c00c80064n);
runtime.exports.arm64_set_vector_hi(24, 0x0190012c00c80064n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(24) !== 0x01e5016000e90072n ||
    runtime.exports.arm64_get_vector_hi(24) !== 0x01e5016000e90072n) {
  throw new Error('NEON MLA 8H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x80, 0x96, 0x67, 0x2e, // mls v0.4h, v20.4h, v7.4h (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(20, 0x0005000400030002n);
runtime.exports.arm64_set_vector_lo(7, 0x0011000d000b0007n);
runtime.exports.arm64_set_vector_lo(0, 0x0190012c00c80064n);
runtime.exports.arm64_set_vector_hi(0, 0xffffffffffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(0) !== 0x013b00f800a70056n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0n) {
  throw new Error('NEON MLS 4H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x17, 0x10, 0x34, 0x2e, // uaddw v23.8h, v0.8h, v20.8b (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0x0100010001000100n);
runtime.exports.arm64_set_vector_hi(0, 0x0100010001000100n);
runtime.exports.arm64_set_vector_lo(20, 0x0807060504030201n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(23) !== 0x0104010301020101n ||
    runtime.exports.arm64_get_vector_hi(23) !== 0x0108010701060105n) {
  throw new Error('NEON UADDW 8H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x83, 0x30, 0x25, 0x4e, // ssubw2 v3.8h, v4.8h, v5.16b
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(4, 0x1000100010001000n);
runtime.exports.arm64_set_vector_hi(4, 0x1000100010001000n);
runtime.exports.arm64_set_vector_hi(5, 0x040302017f80feffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(3) !== 0x0f81108010021001n ||
    runtime.exports.arm64_get_vector_hi(3) !== 0x0ffc0ffd0ffe0fffn) {
  throw new Error('NEON SSUBW2 8H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x74, 0xc2, 0x61, 0x0e, // smull v20.4s, v19.4h, v1.4h
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(19, 0xfffb0004fffd0002n);
runtime.exports.arm64_set_vector_lo(1, 0xffeffff3000b0007n);
runtime.trace(5);
if (BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(20)) !== 0xffffffdf0000000en ||
    runtime.exports.arm64_get_vector_hi(20) !== 0x00000055ffffffccn) {
  throw new Error('NEON SMULL 4S semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x54, 0xa2, 0x64, 0x0e, // smlsl v20.4s, v18.4h, v4.4h
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(20, 0x000000c800000064n);
runtime.exports.arm64_set_vector_hi(20, 0x000001900000012cn);
runtime.exports.arm64_set_vector_lo(18, 0x0005000400030002n);
runtime.exports.arm64_set_vector_lo(4, 0x0011000d000b0007n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(20) !== 0x000000a700000056n ||
    runtime.exports.arm64_get_vector_hi(20) !== 0x0000013b000000f8n) {
  throw new Error('NEON SMLSL 4S semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x94, 0x8e, 0x11, 0x0f, // rshrn v20.4h, v20.4s, #15
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(20, 0x0000400000003fffn);
runtime.exports.arm64_set_vector_hi(20, 0x0000c0000000bfffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(20) !== 0x0002000100010000n ||
    runtime.exports.arm64_get_vector_hi(20) !== 0n) {
  throw new Error('NEON RSHRN 4H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x20, 0xb4, 0x62, 0x6e, // sqrdmulh v0.8h, v1.8h, v2.8h
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(1, 0x0001000100010001n);
runtime.exports.arm64_set_vector_hi(1, 0x0001000100010001n);
runtime.exports.arm64_set_vector_lo(2, 0x4000400040004000n);
runtime.exports.arm64_set_vector_hi(2, 0x4000400040004000n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(0) !== 0x0001000100010001n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0x0001000100010001n) {
  throw new Error('NEON SQRDMULH 8H rounding semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x20, 0x28, 0x21, 0x2e, // sqxtun v0.8b, v1.8h
  0x20, 0x28, 0x21, 0x6e, // sqxtun2 v0.16b, v1.8h
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(1, 0x00ff00010000ffffn);
runtime.exports.arm64_set_vector_hi(1, 0x002a80007fff0100n);
runtime.trace(6);
if (BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(0)) !== 0x2a00ffffff010000n ||
    BigInt.asUintN(64, runtime.exports.arm64_get_vector_hi(0)) !== 0x2a00ffffff010000n) {
  throw new Error('NEON SQXTUN/SQXTUN2 byte semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x25, 0x28, 0x43, 0x4e, // trn1 v5.8h, v1.8h, v3.8h (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(1, 0x0004000300020001n);
runtime.exports.arm64_set_vector_hi(1, 0x0008000700060005n);
runtime.exports.arm64_set_vector_lo(3, 0x000e000d000c000bn);
runtime.exports.arm64_set_vector_hi(3, 0x001200110010000fn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(5) !== 0x000d0003000b0001n ||
    runtime.exports.arm64_get_vector_hi(5) !== 0x00110007000f0005n) {
  throw new Error('NEON TRN1 8H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x25, 0x28, 0x43, 0x0e, // trn1 v5.4h, v1.4h, v3.4h
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(1, 0x0004000300020001n);
runtime.exports.arm64_set_vector_lo(3, 0x000e000d000c000bn);
runtime.exports.arm64_set_vector_hi(5, 0xffffffffffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(5) !== 0x000d0003000b0001n ||
    runtime.exports.arm64_get_vector_hi(5) !== 0n) {
  throw new Error('NEON TRN1 4H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x21, 0x68, 0x43, 0x4e, // trn2 v1.8h, v1.8h, v3.8h (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(1, 0x0004000300020001n);
runtime.exports.arm64_set_vector_hi(1, 0x0008000700060005n);
runtime.exports.arm64_set_vector_lo(3, 0x000e000d000c000bn);
runtime.exports.arm64_set_vector_hi(3, 0x001200110010000fn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(1) !== 0x000e0004000c0002n ||
    runtime.exports.arm64_get_vector_hi(1) !== 0x0012000800100006n) {
  throw new Error('NEON TRN2 8H alias semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x32, 0x3a, 0x86, 0x4e, // zip1 v18.4s, v17.4s, v6.4s (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(17, 0x0000000200000001n);
runtime.exports.arm64_set_vector_hi(17, 0x0000000400000003n);
runtime.exports.arm64_set_vector_lo(6, 0x0000000c0000000bn);
runtime.exports.arm64_set_vector_hi(6, 0x0000000e0000000dn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(18) !== 0x0000000b00000001n ||
    runtime.exports.arm64_get_vector_hi(18) !== 0x0000000c00000002n) {
  throw new Error('NEON ZIP1 4S semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x31, 0x7a, 0x86, 0x4e, // zip2 v17.4s, v17.4s, v6.4s
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(17, 0x0000000200000001n);
runtime.exports.arm64_set_vector_hi(17, 0x0000000400000003n);
runtime.exports.arm64_set_vector_lo(6, 0x0000000c0000000bn);
runtime.exports.arm64_set_vector_hi(6, 0x0000000e0000000dn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(17) !== 0x0000000d00000003n ||
    runtime.exports.arm64_get_vector_hi(17) !== 0x0000000e00000004n) {
  throw new Error('NEON ZIP2 4S alias semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xa2, 0xa6, 0x01, 0x4f, // movi v2.8h, #53, lsl #8 (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(2) !== 0x3500350035003500n ||
    runtime.exports.arm64_get_vector_hi(2) !== 0x3500350035003500n) {
  throw new Error('NEON MOVI 8H shifted-immediate semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xa2, 0xb6, 0x01, 0x0f, // orr v2.4h, #53, lsl #8
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(2, 0x0004000300020001n);
runtime.exports.arm64_set_vector_hi(2, 0xffffffffffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(2) !== 0x3504350335023501n ||
    runtime.exports.arm64_get_vector_hi(2) !== 0n) {
  throw new Error('NEON ORR 4H shifted-immediate semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xc1, 0x84, 0x72, 0x4e, // add v1.8h, v6.8h, v18.8h (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(6, 0x0004000300020001n);
runtime.exports.arm64_set_vector_hi(6, 0x0008000700060005n);
runtime.exports.arm64_set_vector_lo(18, 0x0028001e0014000an);
runtime.exports.arm64_set_vector_hi(18, 0x00500046003c0032n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(1) !== 0x002c00210016000bn ||
    runtime.exports.arm64_get_vector_hi(1) !== 0x0058004d00420037n) {
  throw new Error('NEON ADD 8H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xc1, 0x84, 0x72, 0x2e, // sub v1.4h, v6.4h, v18.4h
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(6, 0x0028001e0014000an);
runtime.exports.arm64_set_vector_lo(18, 0x0004000300020001n);
runtime.exports.arm64_set_vector_hi(1, 0xffffffffffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(1) !== 0x0024001b00120009n ||
    runtime.exports.arm64_get_vector_hi(1) !== 0n) {
  throw new Error('NEON SUB 4H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x70, 0xb4, 0x62, 0x4e, // sqdmulh v16.8h, v3.8h, v2.8h (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(3, 0x7fffc00040008000n);
runtime.exports.arm64_set_vector_hi(3, 0x7fffc00040008000n);
runtime.exports.arm64_set_vector_lo(2, 0x7fff400040008000n);
runtime.exports.arm64_set_vector_hi(2, 0x7fff400040008000n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(16) !== 0x7ffee00020007fffn ||
    runtime.exports.arm64_get_vector_hi(16) !== 0x7ffee00020007fffn) {
  throw new Error('NEON SQDMULH 8H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x70, 0xb4, 0x62, 0x0e, // sqdmulh v16.4h, v3.4h, v2.4h
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(3, 0x7fffc00040008000n);
runtime.exports.arm64_set_vector_lo(2, 0x7fff400040008000n);
runtime.exports.arm64_set_vector_hi(16, 0xffffffffffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(16) !== 0x7ffee00020007fffn ||
    runtime.exports.arm64_get_vector_hi(16) !== 0n) {
  throw new Error('NEON SQDMULH 4H semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xa5, 0x54, 0x11, 0x4f, // shl v5.8h, v5.8h, #1 (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(5, 0x8000400000020001n);
runtime.exports.arm64_set_vector_hi(5, 0x8000400000020001n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(5) !== 0x0000800000040002n ||
    runtime.exports.arm64_get_vector_hi(5) !== 0x0000800000040002n) {
  throw new Error('NEON SHL 8H immediate semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xa5, 0x54, 0x11, 0x0f, // shl v5.4h, v5.4h, #1
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(5, 0x8000400000020001n);
runtime.exports.arm64_set_vector_hi(5, 0xffffffffffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(5) !== 0x0000800000040002n ||
    runtime.exports.arm64_get_vector_hi(5) !== 0n) {
  throw new Error('NEON SHL 4H immediate semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xe7, 0x94, 0x0b, 0x0f, // sqshrn v7.8b, v7.8h, #5 (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(7, 0xf0000fe080007fffn);
runtime.exports.arm64_set_vector_hi(7, 0x00400000ffe00020n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(7) !== 0x0200ff01807f807fn ||
    runtime.exports.arm64_get_vector_hi(7) !== 0n) {
  throw new Error('NEON SQSHRN 8B semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xe7, 0x94, 0x0b, 0x4f, // sqshrn2 v7.16b, v7.8h, #5
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(7, 0xf0000fe080007fffn);
runtime.exports.arm64_set_vector_hi(7, 0x00400000ffe00020n);
runtime.trace(5);
if (BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(7)) !== 0xf0000fe080007fffn ||
    runtime.exports.arm64_get_vector_hi(7) !== 0x0200ff01807f807fn) {
  throw new Error('NEON SQSHRN2 16B semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x80, 0x02, 0x23, 0x1e, // ucvtf s0, w20
  0x00, 0x00, 0x26, 0x1e, // fmov w0, s0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_register(20, 42n);
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 0x42280000n) throw new Error('UCVTF S,W semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x00, 0x01, 0x22, 0x1e, // scvtf s0, w8
  0x00, 0x00, 0x26, 0x1e, // fmov w0, s0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_register(8, 0xfffffffen);
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 0xc0000000n) throw new Error('SCVTF S,W semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x00, 0x00, 0x38, 0x1e, // fcvtzs w0, s0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0x40600000n); // 3.5
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 3n) throw new Error('FCVTZS W,S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x01, 0xd0, 0x27, 0x1e, // fmov s1, #30.0
  0x20, 0x00, 0x26, 0x1e, // fmov w0, s1
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 0x41f00000n) throw new Error('FMOV S immediate semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x60, 0xd5, 0x02, 0x2f, // mvni v0.2s, #75, msl #16
  0x00, 0x00, 0x66, 0x9e, // fmov x0, d0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.trace(5);
if (BigInt.asUintN(64, runtime.exports.arm64_get_register(0)) !== 0xffb40000ffb40000n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0n) {
  throw new Error('NEON MVNI 2S MSL semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x01, 0xd5, 0x06, 0x0f, // movi v1.2s, #200, msl #16
  0x20, 0x00, 0x66, 0x9e, // fmov x0, d1
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 0x00c8ffff00c8ffffn ||
    runtime.exports.arm64_get_vector_hi(1) !== 0n) {
  throw new Error('NEON MOVI 2S MSL semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x01, 0x18, 0x21, 0x1e, // fdiv s1, s0, s1
  0x20, 0x00, 0x26, 0x1e, // fmov w0, s1
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0x41f00000n); // 30.0
runtime.exports.arm64_set_vector_lo(1, 0x40000000n); // 2.0
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 0x41700000n) throw new Error('FDIV S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x22, 0x40, 0x21, 0x1e, // fneg s2, s1
  0x40, 0xc0, 0x20, 0x1e, // fabs s0, s2
  0x00, 0x00, 0x26, 0x1e, // fmov w0, s0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(1, 0x3fa00000n); // 1.25f
runtime.trace(8);
if (runtime.exports.arm64_get_register(0) !== 0x3fa00000n ||
    runtime.exports.arm64_get_vector_lo(2) !== 0xbfa00000n) {
  throw new Error('Scalar FNEG/FABS S semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x00, 0xc0, 0x22, 0x1e, // fcvt d0, s0
  0x01, 0x40, 0x62, 0x1e, // fcvt s1, d0
  0x20, 0x00, 0x26, 0x1e, // fmov w0, s1
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0xc1480000n); // -12.5f
runtime.trace(8);
if (runtime.exports.arm64_get_register(0) !== 0xc1480000n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0n || runtime.exports.arm64_get_vector_hi(1) !== 0n) {
  throw new Error('Scalar FCVT S/D round-trip semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x08, 0x00, 0x38, 0x9e, // fcvtzs x8, s0
  0x00, 0x01, 0x22, 0x9e, // scvtf s0, x8
  0x00, 0x20, 0x22, 0x1e, // fcmp s0, s2
  0xe0, 0x17, 0x9f, 0x1a, // cset w0, eq
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0x40e00000n); // 7.0f
runtime.exports.arm64_set_vector_lo(2, 0x40e00000n);
runtime.trace(10);
if (runtime.exports.arm64_get_register(0) !== 1n) {
  throw new Error('FCVTZS X,S / SCVTF S,X / FCMP S,S semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x28, 0x20, 0x20, 0x1e, // fcmp s1, #0.0
  0xe0, 0x17, 0x9f, 0x1a, // cset w0, eq
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(1, 0n);
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 1n) throw new Error('FCMP S zero semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x08, 0x20, 0x20, 0x1e, // fcmp s0, #0.0
  0x41, 0xbc, 0x21, 0x1e, // fcsel s1, s2, s1, lt
  0x20, 0x00, 0x26, 0x1e, // fmov w0, s1
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0xbf800000n); // -1.0
runtime.exports.arm64_set_vector_lo(1, 0x40000000n); // 2.0
runtime.exports.arm64_set_vector_lo(2, 0x40400000n); // 3.0
runtime.trace(6);
if (runtime.exports.arm64_get_register(0) !== 0x40400000n) throw new Error('FCSEL S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x13, 0x05, 0x00, 0x4f, // movi v19.4s, #0x8
  0x60, 0x02, 0x66, 0x9e, // fmov x0, d19
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 0x800000008n) throw new Error('NEON MOVI replicated immediate semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x0a, 0x0c, 0x01, 0x0e, // dup v10.8b, w0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_register(0, 0xa5n);
runtime.exports.arm64_set_vector_hi(10, 0xffffffffffffffffn);
runtime.trace(5);
if (BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(10)) !== 0xa5a5a5a5a5a5a5a5n ||
    runtime.exports.arm64_get_vector_hi(10) !== 0n) throw new Error('NEON DUP 8B semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x0a, 0x0c, 0x01, 0x4e, // dup v10.16b, w0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_register(0, 0x3cn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(10) !== 0x3c3c3c3c3c3c3c3cn ||
    runtime.exports.arm64_get_vector_hi(10) !== 0x3c3c3c3c3c3c3c3cn) throw new Error('NEON DUP 16B semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x40, 0x3d, 0x01, 0x0e, // umov w0, v10.b[0]
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(10, 0x88776655443322a5n);
runtime.trace(5);
if (runtime.exports.arm64_get_register(0) !== 0xa5n) throw new Error('NEON UMOV byte-lane semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x01, 0x05, 0x00, 0x4f, // movi v1.4s, #8
  0xbc, 0x05, 0x00, 0x4f, // movi v28.4s, #13
  0x24, 0x84, 0xfc, 0x4e, // add v4.2d, v1.2d, v28.2d
  0x80, 0x00, 0x66, 0x9e, // fmov x0, d4
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.trace(8);
if (runtime.exports.arm64_get_register(0) !== 0x1500000015n) throw new Error('NEON ADD 2D semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x01, 0x05, 0x00, 0x4f, // movi v1.4s, #8
  0x23, 0x28, 0xa1, 0x0e, // xtn v3.2s, v1.2d
  0x60, 0x00, 0x66, 0x9e, // fmov x0, d3
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.trace(7);
if (runtime.exports.arm64_get_register(0) !== 0x800000008n) throw new Error('NEON XTN 2S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x01, 0x05, 0x00, 0x4f, // movi v1.4s, #8
  0xbc, 0x05, 0x00, 0x4f, // movi v28.4s, #13
  0x84, 0x87, 0xfc, 0x4e, // add v4.2d, v28.2d, v28.2d
  0x23, 0x28, 0xa1, 0x0e, // xtn v3.2s, v1.2d
  0x83, 0x28, 0xa1, 0x4e, // xtn2 v3.4s, v4.2d
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.trace(9);
if (runtime.exports.arm64_get_vector_lo(3) !== 0x800000008n ||
    runtime.exports.arm64_get_vector_hi(3) !== 0x1a0000001an) throw new Error('NEON XTN2 4S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x46, 0xa4, 0x08, 0x2f, // ushll v6.8h, v2.8b, #0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(2, 0x0807060504030201n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(6) !== 0x0004000300020001n ||
    runtime.exports.arm64_get_vector_hi(6) !== 0x0008000700060005n) throw new Error('NEON USHLL 8H semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x42, 0xa4, 0x08, 0x6f, // ushll2 v2.8h, v2.16b, #0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_hi(2, 0x100f0e0d0c0b0a09n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(2) !== 0x000c000b000a0009n ||
    runtime.exports.arm64_get_vector_hi(2) !== 0x0010000f000e000dn) throw new Error('NEON USHLL2 8H semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xc3, 0xa4, 0x10, 0x2f, // ushll v3.4s, v6.4h, #0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(6, 0x0004000300020001n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(3) !== 0x0000000200000001n ||
    runtime.exports.arm64_get_vector_hi(3) !== 0x0000000400000003n) throw new Error('NEON USHLL 4S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xa0, 0x84, 0xa0, 0x4e, // add v0.4s, v5.4s, v0.4s
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0xffffffff00000001n);
runtime.exports.arm64_set_vector_hi(0, 0x0000000300000002n);
runtime.exports.arm64_set_vector_lo(5, 0x0000000200000003n);
runtime.exports.arm64_set_vector_hi(5, 0xfffffffdfffffffen);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(0) !== 0x0000000100000004n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0n) throw new Error('NEON ADD 4S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x14, 0x84, 0xb3, 0x6e, // sub v20.4s, v0.4s, v19.4s
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0x0000000000000001n);
runtime.exports.arm64_set_vector_hi(0, 0x800000007fffffffn);
runtime.exports.arm64_set_vector_lo(19, 0x00000001ffffffffn);
runtime.exports.arm64_set_vector_hi(19, 0x00000001ffffffffn);
runtime.trace(5);
if (BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(20)) !== 0xffffffff00000002n ||
    runtime.exports.arm64_get_vector_hi(20) !== 0x7fffffff80000000n) throw new Error('NEON SUB 4S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x00, 0xb8, 0xb1, 0x4e, // addv s0, v0.4s
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0x0000000200000001n);
runtime.exports.arm64_set_vector_hi(0, 0x0000000400000003n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(0) !== 10n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0n) throw new Error('NEON ADDV 4S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x00, 0xb8, 0xf1, 0x5e, // addp d0, v0.2d (exact native-frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0xfffffffffffffff0n);
runtime.exports.arm64_set_vector_hi(0, 0x21n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(0) !== 0x11n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0n) throw new Error('Advanced SIMD scalar ADDP 2D semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x43, 0x98, 0xa0, 0x0e, // cmeq v3.2s, v2.2s, #0
  0x63, 0x58, 0x20, 0x2e, // mvn v3.8b, v3.8b
  0x43, 0x8c, 0xa0, 0x0e, // cmtst v3.2s, v2.2s, v0.2s
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(2, 0x0000000400000000n);
runtime.exports.arm64_set_vector_hi(2, 0xffffffffffffffffn);
runtime.exports.arm64_set_vector_lo(0, 0x000000040000ffffn);
runtime.exports.arm64_set_vector_hi(0, 0xffffffffffffffffn);
runtime.trace(8);
if (BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(3)) !== 0xffffffff00000000n ||
    runtime.exports.arm64_get_vector_hi(3) !== 0n) {
  throw new Error('NEON CMEQ/MVN/CMTST 2S semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x44, 0x84, 0x21, 0x6e, // sub v4.16b, v2.16b, v1.16b
  0x43, 0x98, 0x20, 0x4e, // cmeq v3.16b, v2.16b, #0
  0x84, 0x84, 0x20, 0x4e, // add v4.16b, v4.16b, v0.16b
  0x23, 0x1c, 0x64, 0x6e, // bsl v3.16b, v1.16b, v4.16b
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0x0101010101010101n);
runtime.exports.arm64_set_vector_hi(0, 0x0101010101010101n);
runtime.exports.arm64_set_vector_lo(1, 0x0807060504030201n);
runtime.exports.arm64_set_vector_hi(1, 0x100f0e0d0c0b0a09n);
runtime.exports.arm64_set_vector_lo(2, 0x0010080005000300n);
runtime.exports.arm64_set_vector_hi(2, 0x2010000d18000a09n);
runtime.trace(10);
if (BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(3)) !== 0x080a030502030201n ||
    BigInt.asUintN(64, runtime.exports.arm64_get_vector_hi(3)) !== 0x11020e010d0b0101n) {
  throw new Error('NEON byte ADD/SUB/CMEQ/BSL semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x00, 0xd8, 0x21, 0x0e, // scvtf v0.2s, v0.2s
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0x00000003fffffffEn);
runtime.exports.arm64_set_vector_hi(0, 0x123456789abcdef0n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(0) !== 0x40400000c0000000n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0n) throw new Error('NEON SCVTF 2S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x62, 0x04, 0x0c, 0x4e, // dup v2.4s, v3.s[1]
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(3, 0x89abcdef01234567n);
runtime.exports.arm64_set_vector_hi(3, 0x8877665544332211n);
runtime.trace(5);
if (BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(2)) !== 0x89abcdef89abcdefn ||
    BigInt.asUintN(64, runtime.exports.arm64_get_vector_hi(2)) !== 0x89abcdef89abcdefn) {
  throw new Error('NEON DUP vector-element 4S semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x20, 0xd4, 0x21, 0x0e, // fadd v0.2s, v1.2s, v1.2s
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(1, 0x404000003f800000n);
runtime.exports.arm64_set_vector_hi(1, 0x123456789abcdef0n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(0) !== 0x40c0000040000000n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0n) throw new Error('NEON FADD 2S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x00, 0xb8, 0xa1, 0x0e, // fcvtzs v0.2s, v0.2s
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0xc00666663ff33333n);
runtime.exports.arm64_set_vector_hi(0, 0x123456789abcdef0n);
runtime.trace(5);
if (BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(0)) !== 0xfffffffe00000001n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0n) throw new Error('NEON FCVTZS 2S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x03, 0x66, 0x00, 0x4f, // movi v3.4s, #0x10, lsl #24
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(3) !== 0x1000000010000000n ||
    runtime.exports.arm64_get_vector_hi(3) !== 0x1000000010000000n) throw new Error('NEON MOVI 4S LSL #24 semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x00, 0x04, 0x14, 0x5e, // mov s0, v0.s[2]
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0x2222222211111111n);
runtime.exports.arm64_set_vector_hi(0, 0x4444444433333333n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(0) !== 0x33333333n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0n) throw new Error('Advanced SIMD scalar DUP semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x01, 0x64, 0x14, 0x6e, // mov v1.s[2], v0.s[3]
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_hi(0, 0xaabbccdd11223344n);
runtime.exports.arm64_set_vector_lo(1, 0x2222222211111111n);
runtime.exports.arm64_set_vector_hi(1, 0x4444444433333333n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(1) !== 0x2222222211111111n ||
    BigInt.asUintN(64, runtime.exports.arm64_get_vector_hi(1)) !== 0x44444444aabbccddn) {
  throw new Error('NEON INS vector-element semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x21, 0xa4, 0x10, 0x0f, // sshll v1.4s, v1.4h, #0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(1, 0x8000ffff7fff0001n);
runtime.trace(5);
if (BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(1)) !== 0x00007fff00000001n ||
    BigInt.asUintN(64, runtime.exports.arm64_get_vector_hi(1)) !== 0xffff8000ffffffffn) {
  throw new Error('NEON SSHLL 4S semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x21, 0xd8, 0x21, 0x5e, // scvtf s1, s1
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(1, 0xffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(1) !== 0xbf800000n ||
    runtime.exports.arm64_get_vector_hi(1) !== 0n) throw new Error('Advanced SIMD scalar SCVTF semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x01, 0x01, 0x62, 0x9e, // scvtf d1, x8
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_register(8, -2n);
runtime.trace(5);
if (BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(1)) !== 0xc000000000000000n ||
    runtime.exports.arm64_get_vector_hi(1) !== 0n) throw new Error('SCVTF D,X semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x00, 0xd8, 0x61, 0x5e, // scvtf d0, d0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, -3n);
runtime.trace(5);
if (BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(0)) !== 0xc008000000000000n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0n) throw new Error('Advanced SIMD scalar SCVTF D semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x00, 0x18, 0x62, 0x1e, // fdiv d0, d0, d2
  0x00, 0xc0, 0x60, 0x1e, // fabs d0, d0
  0x08, 0x00, 0x79, 0x1e, // fcvtzu w8, d0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0xc020000000000000n); // -8.0
runtime.exports.arm64_set_vector_lo(2, 0x4000000000000000n); // 2.0
runtime.trace(8);
if (runtime.exports.arm64_get_register(8) !== 4n) throw new Error('Scalar double FP arithmetic/conversion semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x21, 0xd8, 0x21, 0x7e, // ucvtf s1, s1
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(1, 3n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(1) !== 0x40400000n) throw new Error('Advanced SIMD scalar UCVTF semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x80, 0xe5, 0x01, 0x4f, // movi v0.16b, #0x2c
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(0) !== 0x2c2c2c2c2c2c2c2cn ||
    runtime.exports.arm64_get_vector_hi(0) !== 0x2c2c2c2c2c2c2c2cn) throw new Error('NEON MOVI 16B semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x63, 0xb8, 0xa0, 0x6e, // neg v3.4s, v3.4s
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(3, 0xffffffff00000001n);
runtime.exports.arm64_set_vector_hi(3, 0x800000007fffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(3) !== 0x00000001ffffffffn ||
    BigInt.asUintN(64, runtime.exports.arm64_get_vector_hi(3)) !== 0x8000000080000001n) throw new Error('NEON NEG 4S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x42, 0xb8, 0xa0, 0x2e, // neg v2.2s, v2.2s (exact native-frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(2, 0xffffffff00000001n);
runtime.exports.arm64_set_vector_hi(2, 0x800000007fffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(2) !== 0x00000001ffffffffn ||
    runtime.exports.arm64_get_vector_hi(2) !== 0n) throw new Error('NEON NEG 2S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x00, 0x44, 0xa2, 0x2e, // ushl v0.2s, v0.2s, v2.2s (exact native-frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0x000000f080000000n);
runtime.exports.arm64_set_vector_hi(0, 0xffffffffffffffffn);
runtime.exports.arm64_set_vector_lo(2, 0x00000004ffffffffn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(0) !== 0x00000f0040000000n ||
    runtime.exports.arm64_get_vector_hi(0) !== 0n) throw new Error('NEON USHL 2S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x02, 0x3c, 0x04, 0x0e, // mov w2, v0.s[0]
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(0, 0x1234567889abcdefn);
runtime.trace(5);
if (runtime.exports.arm64_get_register(2) !== 0x89abcdefn) throw new Error('NEON UMOV S[0] semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x65, 0x1c, 0x32, 0x4e, // and v5.16b, v3.16b, v18.16b
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(3, 0xff00ff00ff00ff00n);
runtime.exports.arm64_set_vector_hi(3, 0xaaaaaaaaaaaaaaaan);
runtime.exports.arm64_set_vector_lo(18, 0x0f0f0f0f0f0f0f0fn);
runtime.exports.arm64_set_vector_hi(18, 0x5555555555555555n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(5) !== 0x0f000f000f000f00n ||
    runtime.exports.arm64_get_vector_hi(5) !== 0n) throw new Error('NEON AND 16B semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x63, 0x1c, 0x34, 0x6e, // eor v3.16b, v3.16b, v20.16b
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(3, 0xff00ff00ff00ff00n);
runtime.exports.arm64_set_vector_hi(3, 0xaaaaaaaaaaaaaaaan);
runtime.exports.arm64_set_vector_lo(20, 0x0f0f0f0f0f0f0f0fn);
runtime.exports.arm64_set_vector_hi(20, 0x5555555555555555n);
runtime.trace(5);
if (BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(3)) !== 0xf00ff00ff00ff00fn ||
    BigInt.asUintN(64, runtime.exports.arm64_get_vector_hi(3)) !== 0xffffffffffffffffn) throw new Error('NEON EOR 16B semantics failed');

const structureMemoryAddress = vectorZeroProbeAddress + 0x200;
runtime.writeUint64(structureMemoryAddress, 0n);
runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xa2, 0x85, 0x00, 0x4d, // st1 {v2.d}[1], [x13] (exact post-touch frame fault opcode)
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_register(13, BigInt(structureMemoryAddress));
runtime.exports.arm64_set_vector_lo(2, 0xaabbccddeeff0011n);
runtime.exports.arm64_set_vector_hi(2, 0x1122334455667788n);
runtime.trace(5);
if (new DataView(runtime.readBytes(structureMemoryAddress, 8).buffer).getBigUint64(0, true) !== 0x1122334455667788n) {
  throw new Error('NEON ST1 D[1] single-lane semantics failed');
}

runtime.loadBytes(structureMemoryAddress, new Uint8Array([0x34, 0x12]));
runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xa2, 0x59, 0xdf, 0x4d, // ld1 {v2.h}[7], [x13], #2
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_register(13, BigInt(structureMemoryAddress));
runtime.exports.arm64_set_vector_lo(2, 0x0706050403020100n);
runtime.exports.arm64_set_vector_hi(2, 0x000e0d0c0b0a0908n);
runtime.trace(5);
if (runtime.exports.arm64_get_register(13) !== BigInt(structureMemoryAddress + 2) ||
    runtime.exports.arm64_get_vector_lo(2) !== 0x0706050403020100n ||
    runtime.exports.arm64_get_vector_hi(2) !== 0x12340d0c0b0a0908n) {
  throw new Error('NEON LD1 H[7] post-index semantics failed');
}

runtime.writeUint64(structureMemoryAddress, 0x1111222233334444n);
runtime.writeUint64(structureMemoryAddress + 8, 0x5555666677778888n);
runtime.writeUint64(structureMemoryAddress + 16, 0x9999aaaabbbbccccn);
runtime.writeUint64(structureMemoryAddress + 24, 0xddddeeeeffff0000n);
runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x42, 0xa0, 0x40, 0x4c, // ld1 {v2.16b, v3.16b}, [x2]
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_register(2, BigInt(structureMemoryAddress));
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(2) !== 0x1111222233334444n ||
    runtime.exports.arm64_get_vector_hi(2) !== 0x5555666677778888n ||
    BigInt.asUintN(64, runtime.exports.arm64_get_vector_lo(3)) !== 0x9999aaaabbbbccccn ||
    BigInt.asUintN(64, runtime.exports.arm64_get_vector_hi(3)) !== 0xddddeeeeffff0000n) {
  throw new Error('NEON LD1 two-register structure semantics failed');
}
const interleaveMemoryAddress = structureMemoryAddress + 0x40;
runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x82, 0x80, 0x9f, 0x4c, // st2 {v2.16b, v3.16b}, [x4], #32
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_register(4, BigInt(interleaveMemoryAddress));
runtime.exports.arm64_set_vector_lo(2, 0x0706050403020100n);
runtime.exports.arm64_set_vector_hi(2, 0x0f0e0d0c0b0a0908n);
runtime.exports.arm64_set_vector_lo(3, 0x1716151413121110n);
runtime.exports.arm64_set_vector_hi(3, 0x1f1e1d1c1b1a1918n);
runtime.trace(5);
const interleaved = runtime.readBytes(interleaveMemoryAddress, 32);
if (runtime.exports.arm64_get_register(4) !== BigInt(interleaveMemoryAddress + 32) ||
    interleaved.some((value, index) => value !== ((index & 1) ? 0x10 + (index >> 1) : index >> 1))) {
  throw new Error('NEON ST2 byte interleave semantics failed');
}
runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x44, 0x02, 0x9f, 0x4c, // st4 {v4.16b-v7.16b}, [x18], #64
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_register(18, BigInt(interleaveMemoryAddress));
for (let register = 4; register <= 7; register += 1) {
  runtime.exports.arm64_set_vector_lo(register, BigInt(register - 4) * 0x0101010101010101n);
  runtime.exports.arm64_set_vector_hi(register, BigInt(register + 4) * 0x0101010101010101n);
}
runtime.trace(5);
const interleavedFour = runtime.readBytes(interleaveMemoryAddress, 64);
if (runtime.exports.arm64_get_register(18) !== BigInt(interleaveMemoryAddress + 64) ||
    interleavedFour.some((value, index) => value !== ((index >> 5) * 8 + (index & 3)))) {
  throw new Error('NEON ST4 byte interleave semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x73, 0x35, 0x20, 0x0d, // st4 {v19.b-v22.b}[5], [x11]
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_register(11, BigInt(interleaveMemoryAddress));
for (let register = 19; register <= 22; register += 1) {
  runtime.exports.arm64_set_vector_lo(register, BigInt(register - 18) << 40n);
}
runtime.trace(5);
const singleInterleavedFour = runtime.readBytes(interleaveMemoryAddress, 4);
if (singleInterleavedFour.some((value, index) => value !== index + 1)) {
  throw new Error('NEON ST4 single-byte lane semantics failed');
}

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x65, 0x44, 0xa5, 0x4e, // sshl v5.4s, v3.4s, v5.4s
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(3, 0x0000000280000000n);
runtime.exports.arm64_set_vector_hi(3, 0x00000001fffffffcn);
runtime.exports.arm64_set_vector_lo(5, 0xffffffff00000001n);
runtime.exports.arm64_set_vector_hi(5, 0x0000001ffffffffen);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(5) !== 0x0000000100000000n ||
    BigInt.asUintN(64, runtime.exports.arm64_get_vector_hi(5)) !== 0x80000000ffffffffn) throw new Error('NEON SSHL 4S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0x43, 0x46, 0xa3, 0x6e, // ushl v3.4s, v18.4s, v3.4s
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(18, 0x8000000040000000n);
runtime.exports.arm64_set_vector_hi(18, 0x0000000180000000n);
runtime.exports.arm64_set_vector_lo(3, 0xffffffe000000001n);
runtime.exports.arm64_set_vector_hi(3, 0x00000020fffffffcn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(3) !== 0x0000000080000000n ||
    runtime.exports.arm64_get_vector_hi(3) !== 0x0000000008000000n) throw new Error('NEON USHL 4S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xa5, 0x9c, 0xb0, 0x4e, // mul v5.4s, v5.4s, v16.4s
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(5, 0x0000000300000002n);
runtime.exports.arm64_set_vector_hi(5, 0x80000000ffffffffn);
runtime.exports.arm64_set_vector_lo(16, 0x0000000500000004n);
runtime.exports.arm64_set_vector_hi(16, 0x0000000200000002n);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(5) !== 0x0000000f00000008n ||
    BigInt.asUintN(64, runtime.exports.arm64_get_vector_hi(5)) !== 0x00000000fffffffen) throw new Error('NEON MUL 4S semantics failed');

runtime.loadBytes(vectorZeroProbeAddress, new Uint8Array([
  0xe5, 0x97, 0xb1, 0x4e, // mla v5.4s, v31.4s, v17.4s
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(vectorZeroProbeAddress);
runtime.exports.arm64_set_vector_lo(5, 0x0000000200000001n);
runtime.exports.arm64_set_vector_hi(5, 0x0000000400000003n);
runtime.exports.arm64_set_vector_lo(31, 0x0000000600000005n);
runtime.exports.arm64_set_vector_hi(31, 0x0000000800000007n);
runtime.exports.arm64_set_vector_lo(17, 0x0000000a00000009n);
runtime.exports.arm64_set_vector_hi(17, 0x0000000c0000000bn);
runtime.trace(5);
if (runtime.exports.arm64_get_vector_lo(5) !== 0x0000003e0000002en ||
    runtime.exports.arm64_get_vector_hi(5) !== 0x0000006400000050n) throw new Error('NEON MLA 4S semantics failed');

const addShiftProbeAddress = vectorZeroProbeAddress + 0x20;
runtime.loadBytes(addShiftProbeAddress, new Uint8Array([
  0x21, 0x44, 0x41, 0x8b, // add x1, x1, x1, lsr #17
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(addShiftProbeAddress);
runtime.exports.arm64_set_register(1, 0x20000n);
runtime.trace(4);
if (runtime.exports.arm64_get_register(1) !== 0x20001n) throw new Error('ADD shifted-register LSR semantics failed');

const multiplyHighProbeAddress = addShiftProbeAddress + 0x20;
runtime.loadBytes(multiplyHighProbeAddress, new Uint8Array([
  0x63, 0x7c, 0xc0, 0x9b, // umulh x3, x3, x0
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(multiplyHighProbeAddress);
runtime.exports.arm64_set_register(0, 2n);
runtime.exports.arm64_set_register(3, 0xffffffffffffffffn);
runtime.trace(4);
if (runtime.exports.arm64_get_register(3) !== 1n) throw new Error('UMULH semantics failed');

const suspendedThreadProbeAddress = multiplyHighProbeAddress + 0x20;
runtime.loadBytes(suspendedThreadProbeAddress, new Uint8Array([
  0x40, 0x05, 0x80, 0x52, // mov w0, #42
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(addShiftProbeAddress);
runtime.exports.arm64_set_register(5, 0x1234n);
const parentPc = runtime.exports.arm64_get_pc();
if (!runtime.exports.arm64_begin_callback(BigInt(suspendedThreadProbeAddress), 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n)) throw new Error('Unable to create suspended thread probe');
if (!runtime.exports.arm64_suspend_callback(1)) throw new Error('Unable to suspend thread probe');
if (runtime.exports.arm64_get_pc() !== parentPc || runtime.exports.arm64_get_register(5) !== 0x1234n) {
  throw new Error('Suspending a guest thread did not restore its parent CPU context');
}
if (!runtime.exports.arm64_resume_callback(1)) throw new Error('Unable to resume thread probe');
runtime.trace(4);
if (runtime.exports.arm64_get_status() !== ARM64_STATUS.HALTED) throw new Error('Resumed guest thread did not halt at its return sentinel');
if (runtime.exports.arm64_end_callback() !== 42n) throw new Error('Resumed guest thread returned the wrong result');
runtime.exports.arm64_discard_suspended_callback(1);
if (runtime.exports.arm64_get_pc() !== parentPc || runtime.exports.arm64_get_register(5) !== 0x1234n) {
  throw new Error('Completing a guest thread did not restore its parent CPU context');
}

const nestedCallbackProbeAddress = suspendedThreadProbeAddress + 0x20;
runtime.loadBytes(nestedCallbackProbeAddress, new Uint8Array([
  0xe0, 0x00, 0x80, 0x52, // mov w0, #7
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.reset(addShiftProbeAddress);
if (!runtime.exports.arm64_begin_callback(BigInt(suspendedThreadProbeAddress), 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n) ||
    !runtime.exports.arm64_begin_callback(BigInt(nestedCallbackProbeAddress), 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n)) {
  throw new Error('Unable to create nested guest callback frames');
}
runtime.trace(4);
if (runtime.exports.arm64_end_callback() !== 7n || runtime.exports.arm64_get_status() !== ARM64_STATUS.RUNNING) {
  throw new Error('Inner guest callback did not restore its callback parent');
}
runtime.trace(4);
if (runtime.exports.arm64_end_callback() !== 42n || runtime.exports.arm64_get_pc() !== parentPc) {
  throw new Error('Outer guest callback did not restore the root CPU context');
}


runtime.reset(runtime.elfAddress(LIBPAD_CONSTRUCTOR_ADDRESS));
const constructorTrace = runtime.trace(2000);
const syscall = runtime.syscallSnapshot();
if (!syscall || syscall.number !== 56) {
  throw new Error(`Expected first constructor syscall to be openat(56): ${JSON.stringify(constructorTrace.slice(-8))}`);
}
const firstSyscallPath = runtime.readCString(Number(syscall.arguments[1]));
if (firstSyscallPath !== '/proc/self/maps') throw new Error(`Expected first openat path to be /proc/self/maps, received ${JSON.stringify(firstSyscallPath)}`);

runtime.reset(runtime.elfAddress(LIBPAD_CONSTRUCTOR_ADDRESS));
const linux = new VirtualLinux(runtime).mountLibpad(libpad);
if (!linux.directories.has('/data/user/0/jp.gungho.pad/lib')) throw new Error('Mounting libpad did not materialize its parent directories');
const jni = new VirtualJni(linux);
const jniProbeAddress = jni.baseAddress + 0x7000;
const jniMethodsAddress = jni.baseAddress + 0x8000;
const jniNameAddress = jni.baseAddress + 0x8100;
const jniDescriptorAddress = jni.baseAddress + 0x8140;
runtime.writeBytes(jniProbeAddress, new Uint8Array([
  0x08, 0x00, 0x40, 0xf9, // ldr x8, [x0] (JNIEnv function table)
  0x08, 0x5d, 0x43, 0xf9, // ldr x8, [x8, #0x6b8] (RegisterNatives, slot 215)
  0xe9, 0x03, 0x1e, 0xaa, // mov x9, x30
  0x00, 0x01, 0x3f, 0xd6, // blr x8
  0xfe, 0x03, 0x09, 0xaa, // mov x30, x9
  0xc0, 0x03, 0x5f, 0xd6, // ret
]));
runtime.writeBytes(jniNameAddress, new TextEncoder().encode('onDrawFrame\0'));
runtime.writeBytes(jniDescriptorAddress, new TextEncoder().encode('()V\0'));
runtime.writeUint64(jniMethodsAddress, BigInt(jniNameAddress));
runtime.writeUint64(jniMethodsAddress + 8, BigInt(jniDescriptorAddress));
runtime.writeUint64(jniMethodsAddress + 16, 0x12345678n);
const jniResult = linux.executeGuestCallback(jniProbeAddress, [
  BigInt(jni.envAddress),
  BigInt(jni.classHandle('jp/gungho/pad/AppDelegate')),
  BigInt(jniMethodsAddress),
  1n,
]);
if (jniResult !== 0n || jni.nativeRegistrations.length !== 1 ||
    jni.nativeRegistrations[0].name !== 'onDrawFrame' ||
    jni.nativeRegistrations[0].descriptor !== '()V' ||
    jni.nativeRegistrations[0].functionAddress !== 0x12345678) {
  throw new Error(`JNI RegisterNatives bridge failed: ${JSON.stringify({ registrations: jni.nativeRegistrations, calls: jni.calls.slice(-8), events: linux.events.slice(-8) }, (_, value) => typeof value === 'bigint' ? value.toString() : value)}`);
}
const constructorRun = linux.run(10_000_000);
if (constructorRun.instructions < 4_500_000) throw new Error(`Protected constructor stopped too early: ${constructorRun.instructions} instructions`);
if (constructorRun.exited || constructorRun.status !== ARM64_STATUS.HALTED) {
  throw new Error(`Expected the dependency-missing Android thread to halt cleanly: status=${constructorRun.status}, exited=${constructorRun.exited}`);
}
if (!constructorRun.events.some((event) => event.name === 'mprotect' && event.protection === 7)) throw new Error('Decrypted module was not mapped executable');
if (!constructorRun.events.some((event) => event.path === '/proc/self/environ' && event.result >= 0n)) throw new Error('Unpacked loader did not read virtual /proc/self/environ');
if (!constructorRun.events.some((event) => event.path === '/system/lib64/libc.so')) throw new Error('Unpacked loader did not reach the Android dependency scan');

console.log(JSON.stringify({
  sha256,
  fileBytes: libpad.length,
  loadSegments: elf.loadSegments.length,
  customSectionBytes: elf.customSections[0].size,
  featureProbe,
  probe: result,
  addressHelperInstructions: addressHelperTrace.length,
  nestedHelperInstructions: imageBaseTrace.length,
  constructorInstructionsToFirstSyscall: constructorTrace.length,
  constructorInstructionsThroughDependencyScan: constructorRun.instructions,
  virtualLinuxSyscalls: constructorRun.syscalls,
  jniRegisteredMethod: jni.nativeRegistrations[0],
  firstSyscall: {
    number: syscall.number,
    arguments: syscall.arguments.map((value) => `0x${value.toString(16)}`),
    svcAddress: `0x${syscall.svcAddress.toString(16)}`,
    path: firstSyscallPath,
  },
}, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
