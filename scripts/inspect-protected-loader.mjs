import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Arm64Runtime, LIBPAD_CONSTRUCTOR_ADDRESS } from '../src/binary-port/arm64Runtime.js';
import { VirtualLinux } from '../src/binary-port/virtualLinux.js';
import { VirtualJni } from '../src/binary-port/virtualJni.js';

const project = resolve(import.meta.dirname, '..');
const apk = resolve(project, 'jp.gungho.pad_21.9.0-21900_minAPI24(arm64-v8a).apk');
const wasm = await readFile(resolve(project, 'public/wasm/arm64_core.wasm'));

function extract(path) {
  return new Uint8Array(execFileSync('unzip', ['-p', apk, path], { maxBuffer: 40 * 1024 * 1024 }));
}

function hex(value, width = 8) {
  return `0x${BigInt.asUintN(64, BigInt(value)).toString(16).padStart(width, '0')}`;
}

function words(runtime, address, count) {
  return Array.from({ length: count }, (_, index) => ({
    address: hex(address + index * 4),
    instruction: hex(runtime.peek32(address + index * 4)),
  }));
}

const libpad = extract('lib/arm64-v8a/libpad.so');
const libopenal = extract('lib/arm64-v8a/libopenal.so');
const lib6dba = extract('lib/arm64-v8a/lib__6dba__.so');
const protectionData = extract('assets/6dba/data1.dat');
const apkBytes = new Uint8Array(await readFile(apk));
const useEntryWrapper = process.argv.includes('--entry-wrapper');
const primaryLibrary = useEntryWrapper ? lib6dba : libpad;
const primaryPath = useEntryWrapper
  ? '/data/app/jp.gungho.pad/lib/arm64/lib__6dba__.so'
  : '/data/app/jp.gungho.pad/lib/arm64/libpad.so';
const runtime = await Arm64Runtime.create(wasm);
runtime.loadElf(primaryLibrary);
const maximumArgument = process.argv.find((argument) => argument.startsWith('--max='));
const maximumInstructions = maximumArgument ? Number(maximumArgument.slice('--max='.length)) : 250_000_000;
const lifecycleMaximumArgument = process.argv.find((argument) => argument.startsWith('--lifecycle-max='));
const lifecycleMaximumInstructions = lifecycleMaximumArgument
  ? Number(lifecycleMaximumArgument.slice('--lifecycle-max='.length))
  : 200_000_000;
const lifecycleTraceArgument = process.argv.find((argument) => argument.startsWith('--lifecycle-trace='));
const [lifecycleTraceName, lifecycleTraceAddress] = lifecycleTraceArgument
  ? lifecycleTraceArgument.slice('--lifecycle-trace='.length).split(':')
  : [];

const linux = new VirtualLinux(runtime, { libraryPath: primaryPath });
linux.mount(primaryPath, primaryLibrary);
linux.mount('/data/app/jp.gungho.pad/lib/arm64/libpad.so', libpad);
linux.mount('/data/user/0/jp.gungho.pad/lib/libpad.so', libpad);
linux.mount('/data/app/jp.gungho.pad/base.apk', apkBytes);
linux.mountApk(apkBytes);
if (!useEntryWrapper) linux.mount('/data/app/jp.gungho.pad/lib/arm64/lib__6dba__.so', lib6dba);
linux.mount('/data/app/jp.gungho.pad/assets/6dba/data1.dat', protectionData);
if (!useEntryWrapper) linux.mountSharedObject('/data/app/jp.gungho.pad/lib/arm64/libopenal.so', libopenal);

const systemLibraries = [
  'libz.so',
  'libm.so',
  'liblog.so',
  'libandroid.so',
  'libEGL.so',
  'libGLESv1_CM.so',
  'libOpenSLES.so',
  'libjnigraphics.so',
  'libdl.so',
  'libc.so',
  'libstdc++.so',
];
for (const name of systemLibraries) {
  linux.mountSharedObject(`/system/lib64/${name}`, await readFile(`/tmp/browser-${name}`));
}
linux.mountSharedObject('/system/lib64/libart.so', await readFile('/tmp/browser-libc.so'));
const jni = new VirtualJni(linux);

const primaryConstructorAddress = useEntryWrapper ? 0x1bd0 : LIBPAD_CONSTRUCTOR_ADDRESS;
runtime.reset(runtime.elfAddress(primaryConstructorAddress));
const constructorReturn = linux.resolveSymbolAddress('browser_constructor_return');
if (!constructorReturn) throw new Error('Browser constructor return trampoline is unavailable');
runtime.exports.arm64_set_register(30, BigInt(constructorReturn));
const watchArgument = process.argv.find((argument) => argument.startsWith('--watch='));
const watchValueArgument = process.argv.find((argument) => argument.startsWith('--watch-value='));
const watchLowByte = process.argv.includes('--watch-low-byte');
const deferWatch = process.argv.includes('--defer-watch');
const watchAddress = watchArgument ? Number(BigInt(watchArgument.slice('--watch='.length))) : 0;
if (watchArgument && !deferWatch) runtime.exports.arm64_set_watchpoint(BigInt(watchArgument.slice('--watch='.length)));
const traceArgument = process.argv.find((argument) => argument.startsWith('--trace='));
const traceLinkArgument = process.argv.find((argument) => argument.startsWith('--trace-lr='));
const traceNextArgument = process.argv.find((argument) => argument.startsWith('--trace-next='));
const traceAddress = traceArgument ? BigInt(traceArgument.slice('--trace='.length)) : 0n;
const traceLink = traceLinkArgument ? BigInt(traceLinkArgument.slice('--trace-lr='.length)) : 0n;
let traceHits = 0;
let watchHits = 0;
let result;
let firstTraceRegisters = null;
let firstTracePointerMemory = null;
const constructorRuns = [];
const loadSequence = [];
const detachedThreadRuns = [];
const padInitializerRuns = [];
let padTraceState = null;
let padNextTraceState = null;
let padTraceHits = 0;
const padTraceSequence = [];
let padWatchState = null;
let padProtectionModule = 0;
let padJniOnLoad = null;
let padExportSummary = [];
const padLifecycleRuns = [];
const padSecurityBypasses = [];
const runDetachedThreads = (phase) => {
  for (const [identifier, thread] of [...linux.guestThreads]) {
    if (thread.state !== 'suspended') continue;
    const outcome = linux.runGuestThread(identifier, 0, 0n, maximumInstructions);
    detachedThreadRuns.push({
      phase,
      identifier,
      state: outcome.state,
      result: hex(outcome.result, 16),
      pc: outcome.pc === undefined ? null : hex(outcome.pc),
      exited: linux.exited,
      exitCode: linux.exitCode,
    });
  }
};
if (traceAddress) runtime.exports.arm64_set_tracepoint(traceAddress);
for (;;) {
  result = linux.run(maximumInstructions);
  if (result.status !== 4 || !traceLink || runtime.exports.arm64_get_register(30) === traceLink) break;
  traceHits += 1;
  runtime.exports.arm64_resume();
  runtime.exports.arm64_step();
  runtime.exports.arm64_set_tracepoint(traceAddress);
}
const tracePokeArgument = process.argv.find((argument) => argument.startsWith('--trace-poke='));
if (tracePokeArgument && result.status === 4) {
  const [rawAddress, rawValue] = tracePokeArgument.slice('--trace-poke='.length).split(':');
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, Number(BigInt(rawValue)), true);
  runtime.writeBytes(Number(BigInt(rawAddress)), bytes);
  runtime.exports.arm64_resume();
  const tracePokeNextArgument = process.argv.find((argument) => argument.startsWith('--trace-poke-next='));
  if (tracePokeNextArgument) runtime.exports.arm64_set_tracepoint(BigInt(tracePokeNextArgument.slice('--trace-poke-next='.length)));
  result = linux.run(maximumInstructions);
}
if (useEntryWrapper && process.argv.includes('--load-pad-after-entry') && result.status === 1 && !linux.exited) {
  if (process.argv.includes('--run-detached-threads')) runDetachedThreads('lib__6dba__.so');
  const runInitializers = (object, label) => {
    const initArray = object.elf.sections.find((section) => section.name === '.init_array');
    if (!initArray) return;
    for (let index = 0; index < initArray.size / 8; index += 1) {
      const address = Number(new DataView(runtime.readBytes(object.address + initArray.virtualAddress + index * 8, 8).buffer).getBigUint64(0, true));
      if (!address) continue;
      const value = linux.executeGuestCallback(address, [0n, 0n, 0n]);
      loadSequence.push({ library: label, kind: 'constructor', index, address: hex(address), result: hex(value, 16) });
    }
  };

  linux.mountSharedObject('/data/app/jp.gungho.pad/lib/arm64/libopenal.so', libopenal, 0x3e00000);
  const openalObject = linux.findSharedObject('/data/app/jp.gungho.pad/lib/arm64/libopenal.so');
  runInitializers(openalObject, 'libopenal.so');
  linux.mountSharedObject('/data/app/jp.gungho.pad/lib/arm64/libpad.so', libpad, 0x2000000);
  const padObject = linux.findSharedObject('/data/app/jp.gungho.pad/lib/arm64/libpad.so');
  const mappingsBeforePad = new Set(linux.mappings.map((mapping) => mapping.address));
  const autoGate = process.argv.includes('--pad-auto-gate');
  const bypassSecurity = process.argv.includes('--pad-bypass-security');
  const padWatchDlsymArgument = process.argv.find((argument) => argument.startsWith('--pad-watch-after-dlsym='));
  const [padWatchDlsymSymbol, padWatchDlsymAddress] = padWatchDlsymArgument
    ? padWatchDlsymArgument.slice('--pad-watch-after-dlsym='.length).split(':')
    : [];
  let padWatchDlsymArmed = false;
  const discoverPadProtectionModule = () => {
    for (const mapping of linux.mappings) {
      const address = mapping.address;
      if (mappingsBeforePad.has(address)) continue;
      if (bypassSecurity && mapping.length >= 0x3aa4 &&
          runtime.peek32(address + 0x3a98) === 0xd10283ff &&
          runtime.peek32(address + 0x3a9c) === 0xa90153f3 &&
          runtime.peek32(address + 0x3aa0) === 0xf0000113) {
        const bytes = new Uint8Array(8);
        const view = new DataView(bytes.buffer);
        view.setUint32(0, 0x52800020, true);
        view.setUint32(4, 0xd65f03c0, true);
        runtime.writeBytes(address + 0x3a98, bytes);
        padSecurityBypasses.push({ type: '0x20', module: hex(address), entry: hex(address + 0x3a98) });
      }
      if (bypassSecurity && mapping.length >= 0x4938 &&
          runtime.peek32(address + 0x492c) === 0xd10283ff &&
          runtime.peek32(address + 0x4930) === 0xa90153f3 &&
          runtime.peek32(address + 0x4934) === 0x900000f3) {
        const bytes = new Uint8Array(8);
        const view = new DataView(bytes.buffer);
        view.setUint32(0, 0x52800020, true);
        view.setUint32(4, 0xd65f03c0, true);
        runtime.writeBytes(address + 0x492c, bytes);
        padSecurityBypasses.push({ type: '0x54', module: hex(address), entry: hex(address + 0x492c) });
      }
      if (bypassSecurity && mapping.length >= 0x45f4 &&
          runtime.peek32(address + 0x45e8) === 0xd10283ff &&
          runtime.peek32(address + 0x45ec) === 0xa90153f3 &&
          runtime.peek32(address + 0x45f0) === 0xf00000d3) {
        const bytes = new Uint8Array(8);
        const view = new DataView(bytes.buffer);
        view.setUint32(0, 0x52800020, true);
        view.setUint32(4, 0xd65f03c0, true);
        runtime.writeBytes(address + 0x45e8, bytes);
        padSecurityBypasses.push({ type: '0x72', module: hex(address), entry: hex(address + 0x45e8) });
      }
      if (bypassSecurity && mapping.length >= 0x325c &&
          runtime.peek32(address + 0x3250) === 0xd10283ff &&
          runtime.peek32(address + 0x3254) === 0xa90153f3 &&
          runtime.peek32(address + 0x3258) === 0xf00000b3) {
        const bytes = new Uint8Array(8);
        const view = new DataView(bytes.buffer);
        view.setUint32(0, 0x52800020, true);
        view.setUint32(4, 0xd65f03c0, true);
        runtime.writeBytes(address + 0x3250, bytes);
        padSecurityBypasses.push({ type: '0xa4', module: hex(address), entry: hex(address + 0x3250) });
      }
      if (autoGate && !padProtectionModule && mapping.length >= 0x1b1c4 &&
          runtime.peek32(address + 0x229c) === 0x528012e0 &&
          runtime.peek32(address + 0x22a0) === 0xd65f03c0 &&
          runtime.peek32(address + 0x22fc) === 0xd14043ff) {
        const bytes = new Uint8Array(4);
        new DataView(bytes.buffer).setUint32(0, 1, true);
        runtime.writeBytes(address + 0x1b1c0, bytes);
        padProtectionModule = address;
      }
    }
  };
  if (autoGate || bypassSecurity || padWatchDlsymArgument) {
    linux.onEvent = (event) => {
      discoverPadProtectionModule();
      if (!padWatchDlsymArmed && event?.name === 'hostcall' && event.symbol === 'dlsym' &&
          event.queriedSymbol === padWatchDlsymSymbol) {
        runtime.exports.arm64_set_watchpoint(BigInt(padWatchDlsymAddress));
        padWatchDlsymArmed = true;
      }
    };
    linux.onSlice = discoverPadProtectionModule;
  }
  runtime.reset(padObject.address + LIBPAD_CONSTRUCTOR_ADDRESS);
  runtime.exports.arm64_set_register(30, BigInt(constructorReturn));
  const padTraceArgument = process.argv.find((argument) => argument.startsWith('--pad-trace='));
  const padModuleTrace = process.argv.includes('--pad-module-trace');
  const padWatchArgument = process.argv.find((argument) => argument.startsWith('--pad-watch='));
  const padWriteWatchArgument = process.argv.find((argument) => argument.startsWith('--pad-write-watch='));
  const padReadWatchArgument = process.argv.find((argument) => argument.startsWith('--pad-read-watch='));
  const padTraceRegisterArgument = process.argv.find((argument) => argument.startsWith('--pad-trace-register='));
  const padTraceSequenceArgument = process.argv.find((argument) => argument.startsWith('--pad-trace-sequence='));
  const padTraceSequenceLimit = padTraceSequenceArgument
    ? Math.max(1, Math.min(128, Number(padTraceSequenceArgument.slice('--pad-trace-sequence='.length))))
    : 1;
  if (padWatchArgument) runtime.exports.arm64_set_watchpoint(BigInt(padWatchArgument.slice('--pad-watch='.length)));
  if (padWriteWatchArgument) {
    const [rawAddress, rawLength] = padWriteWatchArgument.slice('--pad-write-watch='.length).split(':');
    runtime.exports.arm64_set_watchpoint_range(BigInt(rawAddress), BigInt(rawLength));
  }
  if (padReadWatchArgument) {
    const [rawAddress, rawLength] = padReadWatchArgument.slice('--pad-read-watch='.length).split(':');
    if (rawLength) runtime.exports.arm64_set_read_watchpoint_range(BigInt(rawAddress), BigInt(rawLength));
    else runtime.exports.arm64_set_read_watchpoint(BigInt(rawAddress));
  }
  if (padTraceArgument) runtime.exports.arm64_set_tracepoint(BigInt(padTraceArgument.slice('--pad-trace='.length)));
  if (padModuleTrace) runtime.exports.arm64_set_module_trace(1);
  result = linux.run(maximumInstructions);
  if ((padWatchArgument || padWriteWatchArgument || padReadWatchArgument || padWatchDlsymArgument) && result.status === 5) {
    const accessAddress = runtime.exports.arm64_get_watchpoint_store_address();
    padWatchState = {
      pc: hex(result.faultAddress),
      operation: runtime.exports.arm64_get_watchpoint_is_load() ? 'load' : 'store',
      accessAddress: hex(accessAddress),
      storeAddress: hex(accessAddress),
      value: hex(runtime.exports.arm64_get_watchpoint_value(), 16),
      size: runtime.exports.arm64_get_watchpoint_size(),
      registers: Array.from({ length: 31 }, (_, index) => hex(runtime.exports.arm64_get_register(index), 16)),
      instructions: words(runtime, Math.max(0, Number(result.faultAddress) - 64), 48),
    };
  }
  if (padTraceArgument || padModuleTrace) {
    const [rawRegister, rawValue] = padTraceRegisterArgument
      ? padTraceRegisterArgument.slice('--pad-trace-register='.length).split(':')
      : [];
    const register = rawRegister ? Number(rawRegister.replace(/^x|w/, '')) : null;
    const registerMask = rawRegister?.startsWith('w') ? 0xffffffffn : 0xffffffffffffffffn;
    const expected = rawValue ? BigInt(rawValue) : null;
    while (result.status === 4) {
      const traceRegisters = Array.from({ length: 31 }, (_, index) => runtime.exports.arm64_get_register(index));
      padTraceSequence.push({
        pc: hex(result.pc),
        type: hex(traceRegisters[22]),
        target: hex(traceRegisters[6]),
        record: hex(traceRegisters[19]),
        recordBytes: traceRegisters[19] && traceRegisters[19] < 0x8000000
          ? Array.from(runtime.readBytes(Number(traceRegisters[19]), 92), (value) => value.toString(16).padStart(2, '0')).join('')
          : null,
        moduleBase: hex(traceRegisters[27]),
        moduleLength: hex(traceRegisters[28]),
        entryInstructions: traceRegisters[6] && traceRegisters[6] < 0x10000000n
          ? words(runtime, Number(traceRegisters[6]), 8)
          : [],
        arguments: traceRegisters.slice(0, 8).map((value) => hex(value, 16)),
        link: hex(traceRegisters[30], 16),
      });
      const matches = register !== null && (runtime.exports.arm64_get_register(register) & registerMask) === expected;
      if (matches || padTraceSequence.length >= padTraceSequenceLimit) break;
      padTraceHits += 1;
      runtime.exports.arm64_resume();
      runtime.exports.arm64_step();
      if (padTraceArgument) runtime.exports.arm64_set_tracepoint(BigInt(padTraceArgument.slice('--pad-trace='.length)));
      if (padModuleTrace) runtime.exports.arm64_set_module_trace(1);
      result = linux.run(maximumInstructions);
    }
  }
  if (result.status === 4) {
    const padTraceRegisters = Array.from({ length: 31 }, (_, index) => Number(runtime.exports.arm64_get_register(index)));
    padTraceState = {
      pc: hex(result.pc),
      registers: padTraceRegisters.map((value) => hex(value, 16)),
      skippedHits: padTraceHits,
      pointerMemory: Object.fromEntries(padTraceRegisters.slice(0, 8).map((address, index) => [
        `x${index}`,
        address && address < 0x8000000
          ? Array.from(runtime.readBytes(address, 128), (value) => value.toString(16).padStart(2, '0')).join('')
          : null,
      ])),
      moduleRecord: padTraceRegisters[19] && padTraceRegisters[19] < 0x8000000
        ? Array.from(runtime.readBytes(padTraceRegisters[19], 128), (value) => value.toString(16).padStart(2, '0')).join('')
        : null,
      instructions: words(runtime, Math.max(0, Number(result.pc) - 64), 48),
      callerInstructions: padTraceRegisters[30]
        ? words(runtime, Math.max(0, padTraceRegisters[30] - 64), 48)
        : [],
      moduleDescriptors: padTraceRegisters[0] && padTraceRegisters[0] < 0x8000000
        ? Array.from({ length: 128 }, (_, index) => {
          const address = padTraceRegisters[0] + index * 24;
          const bytes = runtime.readBytes(address, 24);
          const view = new DataView(bytes.buffer);
          return {
            index,
            typeAndFlags: hex(view.getBigUint64(0, true), 16),
            address: hex(view.getBigUint64(8, true), 16),
            length: hex(view.getBigUint64(16, true), 16),
          };
        }).filter((entry) => entry.typeAndFlags !== '0x0000000000000000' || entry.address !== '0x0000000000000000' || entry.length !== '0x0000000000000000')
        : [],
    };
  }
  if (result.status === 1 && !linux.exited) {
    linux.refreshSharedObjectMetadata(padObject);
    if (process.argv.includes('--dump-restored')) {
      await writeFile('/tmp/libpad-restored.so', padObject.restoredBytes);
    }
    padExportSummary = padObject.elf.dynamicSymbols
      .filter((symbol) => symbol.sectionIndex && (symbol.name === 'JNI_OnLoad' || symbol.name.startsWith('Java_')))
      .map((symbol) => ({ name: symbol.name, address: hex(padObject.address + symbol.value) }));
    const jniOnLoadAddress = linux.resolveSymbolAddress('JNI_OnLoad');
    if (jniOnLoadAddress) {
      const value = linux.executeGuestCallback(jniOnLoadAddress, [BigInt(jni.vmAddress), 0n]);
      padJniOnLoad = { address: hex(jniOnLoadAddress), result: hex(value, 16) };
      result = {
        ...result,
        totalInstructions: Number(runtime.exports.arm64_get_steps()),
        pc: runtime.exports.arm64_get_pc(),
      };
      if (process.argv.includes('--run-lifecycle')) {
        const assetManager = jni.allocateObject({
          type: 'android/content/res/AssetManager',
          className: 'android/content/res/AssetManager',
        });
        const appDelegate = jni.allocateObject({
          type: 'object',
          className: 'jp/gungho/pad/AppDelegate',
        });
        const lifecycleFramesArgument = process.argv.find((argument) => argument.startsWith('--lifecycle-frames='));
        const lifecycleFrames = lifecycleFramesArgument ? Math.max(1, Number(lifecycleFramesArgument.split('=')[1])) : 1;
        const lifecycleCalls = [
          { name: 'didFinishLaunchingWithOptions' },
          { name: 'viewDidLoad' },
          { name: 'onSurfaceCreated', integerArguments: [assetManager] },
          {
            name: 'onSurfaceChanged',
            integerArguments: [900, 560, 900, 560],
            vectorArguments: [0, 0, 900, 560],
          },
          ...Array.from({ length: lifecycleFrames }, (_, frame) => ({ name: 'onDrawFrame', frame: frame + 1 })),
          ...(process.argv.includes('--lifecycle-touch') ? [
            { name: 'onTouchEvent', frame: 'down', integerArguments: [0, 0, 1, 0, 1000, 0], vectorArguments: [450, 280] },
            { name: 'onTouchEvent', frame: 'move', integerArguments: [0, 0, 1, 2, 1016, 2], vectorArguments: [480, 300] },
            { name: 'onTouchEvent', frame: 'up', integerArguments: [0, 0, 1, 1, 1032, 1], vectorArguments: [480, 300] },
          ] : []),
        ];
        for (const { name, frame = null, integerArguments = [], vectorArguments = [] } of lifecycleCalls) {
          const symbolName = `Java_jp_gungho_pad_AppDelegate_${name}`;
          const address = linux.resolveSymbolAddress(symbolName);
          const eventStart = linux.events.length;
          const jniStart = jni.calls.length;
          const skippedInstructions = [];
          if (lifecycleTraceAddress && (!lifecycleTraceName || lifecycleTraceName === name)) {
            runtime.exports.arm64_set_tracepoint(BigInt(lifecycleTraceAddress));
          }
          if (process.argv.includes('--skip-lifecycle-unknown')) {
            linux.guestCallbackFaultHandler = (callbackRun) => {
              if (callbackRun.status !== -1 || skippedInstructions.length >= 256) return false;
              skippedInstructions.push({
                address: hex(callbackRun.faultAddress),
                instruction: hex(callbackRun.lastInstruction),
              });
              return true;
            };
          }
          try {
            const lifecycleResult = linux.executeGuestCallback(
              address,
              [BigInt(jni.envAddress), BigInt(appDelegate), ...integerArguments.map(BigInt)],
              0,
              vectorArguments,
              name === 'viewDidLoad' ? 1_000_000_000 : lifecycleMaximumInstructions,
            );
            padLifecycleRuns.push({
              name,
              frame,
              address: hex(address),
              result: hex(lifecycleResult, 16),
              events: linux.events.slice(eventStart).map(serializeEvent),
              jniCalls: jni.calls.slice(jniStart),
              skippedInstructions,
            });
          } catch (error) {
            padLifecycleRuns.push({
              name,
              frame,
              address: hex(address),
              error: error instanceof Error ? error.message : String(error),
              pc: hex(runtime.exports.arm64_get_pc()),
              fault: hex(runtime.exports.arm64_get_fault_address()),
              instruction: hex(runtime.exports.arm64_get_last_instruction()),
              stoppedRegisters: linux.lastGuestCallbackStop?.registers.map((value) => hex(value, 16)),
              stoppedSp: linux.lastGuestCallbackStop ? hex(linux.lastGuestCallbackStop.sp, 16) : null,
              stoppedStack: linux.lastGuestCallbackStop?.stackBytes
                .map((value) => value.toString(16).padStart(2, '0')).join(''),
              events: linux.events.slice(eventStart).map(serializeEvent),
              jniCalls: jni.calls.slice(jniStart),
              skippedInstructions,
            });
            break;
          } finally {
            linux.guestCallbackFaultHandler = null;
          }
        }
      }
    }
  }
  if (autoGate || bypassSecurity) {
    linux.onEvent = null;
    linux.onSlice = null;
  }
  const padWatchAfterTraceArgument = process.argv.find((argument) => argument.startsWith('--pad-watch-after-trace='));
  if (padWatchAfterTraceArgument && result.status === 4) {
    runtime.exports.arm64_resume();
    runtime.exports.arm64_set_watchpoint(BigInt(padWatchAfterTraceArgument.slice('--pad-watch-after-trace='.length)));
    result = linux.run(maximumInstructions);
    if (result.status === 5) {
      padWatchState = {
        pc: hex(result.faultAddress),
        storeAddress: hex(runtime.exports.arm64_get_watchpoint_store_address()),
        value: hex(runtime.exports.arm64_get_watchpoint_value(), 16),
        size: runtime.exports.arm64_get_watchpoint_size(),
        registers: Array.from({ length: 31 }, (_, index) => hex(runtime.exports.arm64_get_register(index), 16)),
        instructions: words(runtime, Math.max(0, Number(result.faultAddress) - 64), 48),
      };
    }
  }
  const padPokeArgument = process.argv.find((argument) => argument.startsWith('--pad-poke='));
  if (padPokeArgument && result.status === 4) {
    for (const assignment of padPokeArgument.slice('--pad-poke='.length).split(',')) {
      const [rawAddress, rawValue] = assignment.split(':');
      const bytes = new Uint8Array(4);
      new DataView(bytes.buffer).setUint32(0, Number(BigInt(rawValue)), true);
      runtime.writeBytes(Number(BigInt(rawAddress)), bytes);
    }
    runtime.exports.arm64_resume();
    const padNextTraceArgument = process.argv.find((argument) => argument.startsWith('--pad-next-trace='));
    if (padNextTraceArgument) runtime.exports.arm64_set_tracepoint(BigInt(padNextTraceArgument.slice('--pad-next-trace='.length)));
    result = linux.run(maximumInstructions);
    if (result.status === 4 && padNextTraceArgument) {
      padNextTraceState = {
        pc: hex(result.pc),
        registers: Array.from({ length: 31 }, (_, index) => hex(runtime.exports.arm64_get_register(index), 16)),
      };
    }
  }
  if (process.argv.includes('--run-pad-initializers-after-gate') && result.status === 1 && !linux.exited) {
    const initArray = padObject.elf.sections.find((section) => section.name === '.init_array');
    for (let index = 1; initArray && index < initArray.size / 8; index += 1) {
      const slot = padObject.address + initArray.virtualAddress + index * 8;
      const address = Number(new DataView(runtime.readBytes(slot, 8).buffer).getBigUint64(0, true));
      if (!address) continue;
      try {
        const value = linux.executeGuestCallback(address, [0n, 0n, 0n]);
        padInitializerRuns.push({ index, address: hex(address), result: hex(value, 16), status: 'returned' });
      } catch (error) {
        const faultAddress = Number(runtime.exports.arm64_get_fault_address());
        padInitializerRuns.push({
          index,
          address: hex(address),
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          faultAddress: hex(faultAddress),
          bridge: linux.hostBridgeNames.get(faultAddress) ?? null,
          faultBytes: faultAddress
            ? Array.from(runtime.readBytes(faultAddress, 16), (value) => value.toString(16).padStart(2, '0')).join('')
            : null,
        });
        break;
      }
    }
  }
  if (process.argv.includes('--run-pad-detached-thread')) {
    const identifier = linux.nextGuestThread - 1;
    const thread = linux.guestThreads.get(identifier);
    if (thread?.state === 'suspended') {
      const outcome = linux.runGuestThread(identifier, 0, 0n, maximumInstructions);
      detachedThreadRuns.push({
        phase: 'libpad.so',
        identifier,
        state: outcome.state,
        result: hex(outcome.result, 16),
        pc: outcome.pc === undefined ? null : hex(outcome.pc),
        exited: linux.exited,
        exitCode: linux.exitCode,
      });
    }
  }
  if (process.argv.includes('--run-detached-threads')) runDetachedThreads('libpad.so');
  loadSequence.push({ library: 'libpad.so', kind: 'constructor', address: hex(padObject.address + LIBPAD_CONSTRUCTOR_ADDRESS), status: result.status });
}
if (process.argv.includes('--resume-parent') && result.status === 4) {
  runtime.exports.arm64_set_register(1, 0xffffffffffffffffn);
  runtime.exports.arm64_resume();
  result = linux.run(maximumInstructions);
}
if (process.argv.includes('--run-constructors') && result.status === 1) {
  const initArray = runtime.loadedElf.sections.find((section) => section.name === '.init_array');
  const constructorMaximumArgument = process.argv.find((argument) => argument.startsWith('--constructor-max='));
  const constructorMaximum = constructorMaximumArgument
    ? Number(constructorMaximumArgument.slice('--constructor-max='.length))
    : 100_000_000;
  if (!initArray) throw new Error('libpad has no .init_array section');
  for (let index = 1; index < initArray.size / 8; index += 1) {
    const slot = runtime.loadBias + initArray.virtualAddress + index * 8;
    const address = Number(new DataView(runtime.readBytes(slot, 8).buffer).getBigUint64(0, true));
    linux.exited = false;
    linux.exitCode = null;
    runtime.reset(address);
    result = linux.run(constructorMaximum);
    constructorRuns.push({ index, address: hex(address), ...result });
    if (result.status !== 1) break;
  }
}
if (deferWatch && watchAddress && result.status === 4) {
  runtime.exports.arm64_resume();
  runtime.exports.arm64_set_watchpoint(BigInt(watchAddress));
  result = linux.run(maximumInstructions);
}
if (watchAddress && watchValueArgument) {
  const expected = Number(BigInt(watchValueArgument.slice('--watch-value='.length))) & 0xff;
  const watchMatches = () => {
    const size = runtime.exports.arm64_get_watchpoint_size();
    if (watchLowByte) return Number(runtime.exports.arm64_get_watchpoint_value() & 0xffn) === expected;
    if (size > 4) return false;
    const bits = BigInt(size * 8);
    const mask = (1n << bits) - 1n;
    return (runtime.exports.arm64_get_watchpoint_value() & mask) === BigInt(expected);
  };
  while (result.status === 5 && !watchMatches()) {
    watchHits += 1;
    runtime.exports.arm64_resume();
    runtime.exports.arm64_set_watchpoint(BigInt(watchAddress));
    result = linux.run(maximumInstructions);
  }
}
if (traceNextArgument && result.status === 4) {
  firstTraceRegisters = Array.from({ length: 31 }, (_, index) => Number(runtime.exports.arm64_get_register(index)));
  firstTracePointerMemory = Object.fromEntries([0, 1, 19, 20, 21, 22, 24].map((index) => [
    `x${index}`,
    Array.from(runtime.readBytes(firstTraceRegisters[index], 32), (value) => value.toString(16).padStart(2, '0')).join(''),
  ]));
  runtime.exports.arm64_resume();
  runtime.exports.arm64_set_tracepoint(BigInt(traceNextArgument.slice('--trace-next='.length)));
  result = linux.run(maximumInstructions);
}
if (process.argv.includes('--repeat-until-x0-nonzero') && traceAddress && traceNextArgument) {
  while (result.status === 4 && runtime.exports.arm64_get_register(0) === 0n) {
    runtime.exports.arm64_resume();
    runtime.exports.arm64_set_tracepoint(traceAddress);
    result = linux.run(maximumInstructions);
    if (result.status !== 4) break;
    runtime.exports.arm64_resume();
    runtime.exports.arm64_set_tracepoint(BigInt(traceNextArgument.slice('--trace-next='.length)));
    result = linux.run(maximumInstructions);
  }
}
const pc = Number(result.pc);
const returnAddress = Number(runtime.exports.arm64_get_register(30));
const registers = Object.fromEntries(Array.from({ length: 31 }, (_, index) => [
  `x${index}`,
  hex(runtime.exports.arm64_get_register(index), 16),
]));
registers.sp = hex(runtime.exports.arm64_get_sp(), 16);
const registerWritePcs = Object.fromEntries(Array.from({ length: 31 }, (_, index) => [
  `x${index}`,
  hex(runtime.exports.arm64_get_register_write_pc(index)),
]));
const callHistoryArgument = process.argv.find((argument) => argument.startsWith('--call-history='));
const callHistoryLength = callHistoryArgument ? Math.min(65536, Number(callHistoryArgument.slice('--call-history='.length))) : 64;
const finalRecentCalls = Array.from({ length: callHistoryLength }, (_, age) => ({
  pc: runtime.exports.arm64_get_recent_call_pc(age),
  target: runtime.exports.arm64_get_recent_call_target(age),
})).filter(({ pc, target }) => pc || target).map(({ pc, target }) => ({
  pc: hex(pc),
  target: hex(target),
}));
const currentPointerMemory = Object.fromEntries([0, 1, 2, 3, 4, 19, 20, 21, 22, 24].map((index) => {
  const address = Number(runtime.exports.arm64_get_register(index));
  return [`x${index}`, address && address < 0x8000000
    ? Array.from(runtime.readBytes(address, 96), (value) => value.toString(16).padStart(2, '0')).join('')
    : null];
}));
const executableMappings = linux.mappings.filter((mapping) => mapping.protection & 4);
const mappingSummaries = linux.mappings.map((mapping) => {
  const bytes = new Uint8Array(runtime.memory.buffer, runtime.memoryBias + mapping.address, mapping.length);
  let nonzero = 0;
  for (const value of bytes) if (value) nonzero += 1;
  const opened = linux.events.find((event) => event.name === 'openat' && event.result === BigInt(mapping.fd));
  return {
    address: hex(mapping.address),
    length: mapping.length,
    protection: mapping.protection,
    fd: mapping.fd,
    fileOffset: mapping.fileOffset,
    path: opened?.path ?? null,
    nonzero,
    firstBytes: Array.from(bytes.subarray(0, 32), (value) => value.toString(16).padStart(2, '0')).join(''),
  };
});
const threadResultsAddress = linux.resolveSymbolAddress('browser_thread_results');
const threadArgumentsAddress = linux.resolveSymbolAddress('browser_thread_arguments');
const threadStartsAddress = linux.resolveSymbolAddress('browser_thread_starts');
const threadCallersAddress = linux.resolveSymbolAddress('browser_thread_callers');
const threadSnapshotsAddress = linux.resolveSymbolAddress('browser_thread_argument_snapshots');
const dlsymEvents = linux.events.filter((event) => event.name === 'hostcall' && event.symbol === 'dlsym');
function serializeEvent(event) {
  return Object.fromEntries(Object.entries(event).map(([key, value]) => [
    key,
    typeof value === 'bigint' ? hex(value, 16) : value,
  ]));
}
const diagnosticValue = (name) => {
  const address = linux.resolveSymbolAddress(name);
  return address ? hex(new DataView(runtime.readBytes(address, 8).buffer).getBigUint64(0, true), 16) : null;
};
const diagnosticString = (name) => {
  const address = linux.resolveSymbolAddress(name);
  return address ? runtime.readCString(address, 2048) : null;
};
const searchArgument = process.argv.find((argument) => argument.startsWith('--search='));
const peekArgument = process.argv.find((argument) => argument.startsWith('--peek='));
const peekLengthArgument = process.argv.find((argument) => argument.startsWith('--peek-length='));
const peekLength = peekLengthArgument ? Math.min(65536, Number(peekLengthArgument.slice('--peek-length='.length))) : 128;
const memoryPeeks = peekArgument ? Object.fromEntries(peekArgument.slice('--peek='.length).split(',').map((rawAddress) => {
  const address = Number(BigInt(rawAddress));
  return [hex(address), Array.from(runtime.readBytes(address, peekLength), (value) => value.toString(16).padStart(2, '0')).join('')];
})) : {};
const memorySearchResults = {};
const searchHexArgument = process.argv.find((argument) => argument.startsWith('--search-hex='));
if (searchArgument || searchHexArgument) {
  const needles = [
    ...(searchArgument ? searchArgument.slice('--search='.length).split(',').filter(Boolean).map((value) => ({ label: value, encoded: new TextEncoder().encode(value) })) : []),
    ...(searchHexArgument ? searchHexArgument.slice('--search-hex='.length).split(',').filter(Boolean).map((value) => ({
      label: `hex:${value}`,
      encoded: Uint8Array.from(value.replace(/^0x/, '').match(/../g) ?? [], (byte) => Number.parseInt(byte, 16)),
    })) : []),
  ];
  const ranges = [
    { address: 0x1000000, length: 0x3000000 },
    ...linux.mappings.map(({ address, length }) => ({ address, length })),
  ];
  for (const { label, encoded } of needles) {
    const hits = [];
    for (const range of ranges) {
      const bytes = new Uint8Array(runtime.memory.buffer, runtime.memoryBias + range.address, range.length);
      for (let offset = 0; offset + encoded.length <= bytes.length; offset += 1) {
        let matched = true;
        for (let index = 0; index < encoded.length; index += 1) {
          if (bytes[offset + index] !== encoded[index]) { matched = false; break; }
        }
        if (matched) hits.push(hex(range.address + offset));
      }
    }
    memorySearchResults[label] = [...new Set(hits)];
  }
}
const initializerEntries = (object) => {
  const section = object?.elf.sections.find((candidate) => candidate.name === '.init_array');
  if (!section) return [];
  return Array.from({ length: section.size / 8 }, (_, index) => {
    const slotAddress = object.address + section.virtualAddress + index * 8;
    return {
      index,
      slotAddress: hex(slotAddress),
      functionAddress: hex(new DataView(runtime.readBytes(slotAddress, 8).buffer).getBigUint64(0, true)),
    };
  });
};
const padObjectForReport = linux.findSharedObject('/data/app/jp.gungho.pad/lib/arm64/libpad.so');
const padDynamicMutation = padObjectForReport ? Object.fromEntries(['.text', '.init_array', '.dynsym', '.dynstr', '.gnu.hash'].map((name) => {
  const section = padObjectForReport.elf.sections.find((candidate) => candidate.name === name);
  if (!section) return [name, null];
  const memoryBytes = runtime.readBytes(padObjectForReport.address + section.virtualAddress, section.size);
  const fileBytes = libpad.subarray(section.fileOffset, section.fileOffset + section.size);
  const differences = [];
  let differenceCount = 0;
  for (let index = 0; index < section.size; index += 1) {
    if (memoryBytes[index] === fileBytes[index]) continue;
    differenceCount += 1;
    if (differences.length < 32) differences.push({
      offset: hex(index),
      file: fileBytes[index],
      memory: memoryBytes[index],
    });
  }
  return [name, { differenceCount, firstDifferences: differences }];
})) : {};

if (process.argv.includes('--dump')) {
  for (const mapping of executableMappings) {
    await writeFile(`/tmp/libpad-guest-${mapping.address.toString(16)}.bin`, mapping.executableBytes || runtime.readBytes(mapping.address, mapping.length));
  }
}
const dumpRangeArgument = process.argv.find((argument) => argument.startsWith('--dump-range='));
if (dumpRangeArgument) {
  const [rawAddress, rawLength, path] = dumpRangeArgument.slice('--dump-range='.length).split(':');
  const address = Number(BigInt(rawAddress));
  const length = Number(BigInt(rawLength));
  await writeFile(path || `/tmp/libpad-range-${address.toString(16)}.bin`, runtime.readBytes(address, length));
}

const report = {
  result: {
    ...result,
    pc: hex(result.pc),
    faultAddress: hex(result.faultAddress),
    lastInstruction: hex(result.lastInstruction),
    events: undefined,
  },
  watchpoint: watchArgument ? {
    hitsBeforeMatch: watchHits,
    instructionPc: hex(result.faultAddress),
    storeAddress: hex(runtime.exports.arm64_get_watchpoint_store_address()),
    value: hex(runtime.exports.arm64_get_watchpoint_value(), 16),
    size: runtime.exports.arm64_get_watchpoint_size(),
  } : null,
  traceHits,
  firstTraceRegisters: firstTraceRegisters?.map((value) => hex(value, 16)) ?? null,
  firstTracePointerMemory,
  returnedPointerMemory: firstTraceRegisters ? Object.fromEntries([19, 20, 21, 22, 24].map((index) => [
    `x${index}`,
    Array.from(runtime.readBytes(firstTraceRegisters[index], 32), (value) => value.toString(16).padStart(2, '0')).join(''),
  ])) : null,
  registers,
  registerWritePcs,
  finalRecentCalls,
  currentPointerMemory,
  executableMappings,
  mappingSummaries,
  abiCallers: Object.fromEntries(['write', 'sprintf', 'system', 'exit', 'abort'].map((name) => [
    name,
    diagnosticValue(`browser_last_${name}_caller`),
  ])),
  lastMprotect: {
    caller: diagnosticValue('browser_last_mprotect_caller'),
    address: diagnosticValue('browser_last_mprotect_address'),
    length: diagnosticValue('browser_last_mprotect_length'),
    protection: diagnosticValue('browser_last_mprotect_protection'),
  },
  lastSystemCommand: diagnosticString('browser_last_system_command'),
  processCalls: {
    forkCount: diagnosticValue('browser_fork_count'),
    forkCaller: diagnosticValue('browser_last_fork_caller'),
    waitpidCount: diagnosticValue('browser_waitpid_count'),
    waitpidCaller: diagnosticValue('browser_last_waitpid_caller'),
    threadCreates: diagnosticValue('browser_thread_create_count'),
    threadJoins: diagnosticValue('browser_thread_join_count'),
  },
  threadResults: threadResultsAddress ? Array.from({ length: 32 }, (_, index) =>
    hex(new DataView(runtime.readBytes(threadResultsAddress + index * 8, 8).buffer).getBigUint64(0, true), 16)) : [],
  threadStarts: threadStartsAddress ? Array.from({ length: 32 }, (_, index) =>
    hex(new DataView(runtime.readBytes(threadStartsAddress + index * 8, 8).buffer).getBigUint64(0, true), 16)) : [],
  threadCallers: threadCallersAddress ? Array.from({ length: 32 }, (_, index) =>
    hex(new DataView(runtime.readBytes(threadCallersAddress + index * 8, 8).buffer).getBigUint64(0, true), 16)) : [],
  threadArguments: threadArgumentsAddress ? Array.from({ length: 16 }, (_, index) => {
    const address = Number(new DataView(runtime.readBytes(threadArgumentsAddress + index * 8, 8).buffer).getBigUint64(0, true));
    return { address: hex(address, 16), words: address ? Array.from(new Uint32Array(runtime.readBytes(address, 64).buffer), (value) => hex(value)) : [] };
  }) : [],
  threadSnapshots: threadSnapshotsAddress ? Array.from({ length: 16 }, (_, index) =>
    Array.from(new Uint32Array(runtime.readBytes(threadSnapshotsAddress + index * 48, 48).buffer), (value) => hex(value))) : [],
  currentCode: pc >= 32 ? words(runtime, pc - 32, 16) : [],
  currentCallerCode: returnAddress >= 32 ? words(runtime, returnAddress - 32, 16) : [],
  callerCode: words(runtime, 0x4bb58e0, 12),
  pltCode: words(runtime, 0x4bb46b0, 8),
  got: {
    cells: Array.from({ length: 6 }, (_, index) => {
      const address = 0x4bc7fb8 + index * 8;
      return {
        address: hex(address),
        value: hex(new DataView(runtime.readBytes(address, 8).buffer).getBigUint64(0, true), 16),
      };
    }),
  },
  guestStrings: Object.fromEntries(['x0', 'x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x21', 'x24', 'x25'].map((name) => [
    name,
    runtime.readCString(Number(runtime.exports.arm64_get_register(Number(name.slice(1))))),
  ])),
  hostcalls: linux.events.filter((event) => event.name === 'hostcall').slice(-40).map((event) => ({
    ...event,
    result: hex(event.result, 16),
  })),
  writes: linux.events.filter((event) => event.name === 'write').map(serializeEvent),
  pathChecks: linux.events.filter((event) => (event.name === 'openat' || event.name === 'newfstatat') && event.path)
    .map(serializeEvent),
  dlsymSummary: [...new Set(dlsymEvents.map((event) => event.queriedSymbol))].map((name) => ({
    name,
    resolvedResults: [...new Set(dlsymEvents.filter((event) => event.queriedSymbol === name).map((event) => hex(event.result, 16)))],
  })),
  eventTail: linux.events.slice(-30).map(serializeEvent),
  unknownSyscalls: [...new Set(linux.events.filter((event) => event.name === 'unknown').map((event) => event.number))].map((number) => ({
    number,
    count: linux.events.filter((event) => event.name === 'unknown' && event.number === number).length,
  })),
  memorySearchResults,
  memoryPeeks,
  jni: {
    envAddress: hex(jni.envAddress),
    vmAddress: hex(jni.vmAddress),
    nativeRegistrations: jni.nativeRegistrations,
    calls: jni.calls,
  },
  loadedObjects: [
    { path: primaryPath, address: runtime.loadBias, maximumAddress: runtime.loadedElf.maximumAddress },
    ...linux.sharedObjects.map((object) => ({
      path: object.path,
      address: object.address,
      maximumAddress: object.elf.maximumAddress,
    })),
  ],
  padInitializers: initializerEntries(linux.findSharedObject('/data/app/jp.gungho.pad/lib/arm64/libpad.so')),
  padInitializerRuns,
  padDynamicMutation,
  detachedThreadRuns,
  padTraceState,
  padTraceSequence,
  padWatchState,
  padNextTraceState,
  padProtectionModule: padProtectionModule ? hex(padProtectionModule) : null,
  padSecurityBypasses,
  padJniOnLoad,
  padExportSummary,
  padLifecycleRuns,
  guestThreads: [...linux.guestThreads.entries()].map(([identifier, thread]) => ({
    identifier,
    state: thread.state,
    start: thread.start ? hex(thread.start) : null,
    pc: thread.pc === undefined ? null : hex(thread.pc),
    argumentAddress: thread.argumentAddress ? hex(thread.argumentAddress) : null,
    outputAddress: thread.outputAddress ? hex(thread.outputAddress) : null,
    outputLength: thread.outputLength ?? null,
    detached: thread.detached ?? null,
  })),
  constructorRuns: constructorRuns.map((entry) => ({
    ...entry,
    pc: hex(entry.pc),
    faultAddress: hex(entry.faultAddress),
    lastInstruction: hex(entry.lastInstruction),
    events: undefined,
  })),
};

if (process.argv.includes('--lifecycle-state')) {
  console.log(JSON.stringify({ lifecycle: report.padLifecycleRuns }, (_, value) =>
    typeof value === 'bigint' ? hex(value, 16) : value, 2));
} else if (process.argv.includes('--loader-brief')) {
  console.log(JSON.stringify({
    result: report.result,
    lastCalls: report.finalRecentCalls.slice(0, 12),
    modules: report.padTraceSequence.map((entry) => ({ type: entry.type, moduleBase: entry.moduleBase, target: entry.target })),
    textDifferences: report.padDynamicMutation['.text']?.differenceCount ?? null,
    jniOnLoad: report.padJniOnLoad,
    padExports: report.padExportSummary,
    lifecycle: report.padLifecycleRuns.map((entry) => ({
      name: entry.name,
      address: entry.address,
      result: entry.result,
      error: entry.error,
      pc: entry.pc,
      fault: entry.fault,
      instruction: entry.instruction,
      stoppedRegisters: entry.stoppedRegisters,
      stoppedSp: entry.stoppedSp,
      stoppedStack: entry.stoppedStack,
      eventCount: entry.events?.length ?? 0,
      graphicsCalls: entry.events?.filter((event) => event.name === 'hostcall' && /^gl[A-Z]/.test(event.symbol))
        .map((event) => event.symbol),
      openSlCalls: entry.events?.filter((event) => event.name === 'hostcall' &&
        (event.symbol === 'slCreateEngine' || event.api === 'OpenSL'))
        .map((event) => ({ symbol: event.symbol, interface: event.interface, slot: event.slot, requested: event.requested })),
      soundListAllocationCalls: entry.events?.filter((event) => event.name === 'hostcall' &&
        event.caller === '0x0000000002374a00'),
      jniCalls: entry.jniCalls?.map((call) => ({
        name: call.name,
        methodName: call.methodName,
        descriptor: call.descriptor,
      })),
      skippedInstructions: [...new Map((entry.skippedInstructions ?? []).map((item) => [item.instruction, item])).values()],
    })),
    jniRegistrations: report.jni.nativeRegistrations,
    threads: report.guestThreads,
    hostcalls: report.hostcalls.slice(-20).map((event) => ({
      symbol: event.symbol,
      queriedSymbol: event.queriedSymbol,
      identifier: event.identifier,
      threadResult: event.threadResult,
      result: event.result,
    })),
    unknownSyscalls: report.unknownSyscalls,
    unresolvedDlsym: [...new Set(linux.events.filter((event) => event.name === 'hostcall' &&
      event.symbol === 'dlsym' && event.result === 0n).map((event) => event.queriedSymbol))],
  }, (_, value) => typeof value === 'bigint' ? hex(value, 16) : value, 2));
} else if (process.argv.includes('--loader-state')) {
  console.log(JSON.stringify({
    result: report.result,
    padWatchState: report.padWatchState,
    registers: report.registers,
    registerWritePcs: report.registerWritePcs,
    currentCode: report.currentCode,
    currentCallerCode: report.currentCallerCode,
    finalRecentCalls: report.finalRecentCalls.slice(0, 20),
    memoryPeeks: report.memoryPeeks,
    memoryEvents: linux.events.filter((event) => event.name === 'mmap' || event.name === 'munmap' || event.name === 'mprotect').slice(-30).map(serializeEvent),
    mappings: report.mappingSummaries.slice(-30),
    padDynamicMutation: report.padDynamicMutation,
    padTraceSequence: report.padTraceSequence.slice(-24),
    padSecurityBypasses: report.padSecurityBypasses,
    threads: report.guestThreads,
    hostcallTail: report.hostcalls.slice(-16).map((event) => ({
      symbol: event.symbol,
      queriedSymbol: event.queriedSymbol,
      result: event.result,
      identifier: event.identifier,
      threadResult: event.threadResult,
    })),
    pthreadCreateLookups: linux.events.filter((event) => event.name === 'hostcall' &&
      event.symbol === 'dlsym' && event.queriedSymbol === 'pthread_create').map(serializeEvent),
    unresolvedDlsym: [...new Set(linux.events.filter((event) => event.name === 'hostcall' &&
      event.symbol === 'dlsym' && event.result === 0n).map((event) => event.queriedSymbol))],
  }, (_, value) => typeof value === 'bigint' ? hex(value, 16) : value, 2));
} else if (process.argv.includes('--summary')) {
  const lifecycleSymbols = new Set(['fork', 'waitpid', 'system', '_exit', 'exit', 'pthread_create', 'pthread_join']);
  console.log(JSON.stringify({
    result: report.result,
    processCalls: report.processCalls,
    lastSystemCommand: report.lastSystemCommand,
    writes: report.writes.map((event) => event.text),
    writeEvents: report.writes,
    eventTail: report.eventTail,
    pathChecks: report.pathChecks,
    hostcalls: report.hostcalls.map((event) => ({
      symbol: event.symbol,
      property: event.property,
      value: event.value,
      path: event.path,
      result: event.result,
    })),
    unknownSyscalls: report.unknownSyscalls,
    dlsymSummary: report.dlsymSummary,
    inflateCalls: linux.events.filter((event) => event.name === 'hostcall' && event.symbol.startsWith('inflate')).map(serializeEvent),
    mappings: report.mappingSummaries,
    protectedBufferIo: linux.events.filter((event) => event.name === 'read' && event.address >= 0x04081000 && event.address < 0x04b00000).map(serializeEvent),
    abiCallers: report.abiCallers,
    lastMprotect: report.lastMprotect,
    registerWritePcs: report.registerWritePcs,
    finalRecentCalls: report.finalRecentCalls,
    threads: report.threadStarts.map((start, index) => ({
      start,
      caller: report.threadCallers[index],
      argument: report.threadArguments[index]?.address,
      result: report.threadResults[index],
    })).filter(({ start }) => start !== '0x0000000000000000'),
    constructorRuns: report.constructorRuns,
    memorySearchResults: report.memorySearchResults,
    memoryPeeks: report.memoryPeeks,
    lifecycle: linux.events.filter((event) => event.name === 'hostcall' && lifecycleSymbols.has(event.symbol)).map(serializeEvent),
    loadSequence,
    jni: report.jni,
    loadedObjects: report.loadedObjects.map((object) => ({
      ...object,
      address: hex(object.address),
      endAddress: hex(object.address + object.maximumAddress),
    })),
    padInitializers: report.padInitializers,
    padInitializerRuns: report.padInitializerRuns,
    padDynamicMutation: report.padDynamicMutation,
    detachedThreadRuns: report.detachedThreadRuns,
    padTraceState: report.padTraceState,
    padTraceSequence: report.padTraceSequence,
    padWatchState: report.padWatchState,
    padNextTraceState: report.padNextTraceState,
    padProtectionModule: report.padProtectionModule,
    padSecurityBypasses: report.padSecurityBypasses,
    guestThreads: report.guestThreads,
  }, (_, value) => typeof value === 'bigint' ? hex(value, 16) : value, 2));
} else if (process.argv.includes('--compact')) {
  console.log(JSON.stringify({
    result: report.result,
    watchpoint: report.watchpoint,
    firstTraceRegisters: report.firstTraceRegisters,
    firstTracePointerMemory: report.firstTracePointerMemory,
    registers: report.registers,
    registerWritePcs: report.registerWritePcs,
    finalRecentCalls: report.finalRecentCalls,
    currentPointerMemory: report.currentPointerMemory,
    returnedPointerMemory: report.returnedPointerMemory,
    writes: report.writes,
    hostcalls: report.hostcalls,
    unknownSyscalls: report.unknownSyscalls,
  }, (_, value) => typeof value === 'bigint' ? hex(value, 16) : value, 2));
} else {
  console.log(JSON.stringify(report, null, 2));
}
