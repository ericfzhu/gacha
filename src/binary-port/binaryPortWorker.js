import { Arm64Runtime, LIBPAD_CONSTRUCTOR_ADDRESS } from './arm64Runtime.js';
import { VirtualLinux } from './virtualLinux.js';
import { VirtualJni } from './virtualJni.js';
import { Gles1Renderer } from './gles1Renderer.js';
import { mountPadRuntimeFiles } from './padRuntimeFiles.js';

const SYSTEM_LIBRARIES = [
  'libz.so', 'libm.so', 'liblog.so', 'libandroid.so', 'libEGL.so', 'libGLESv1_CM.so',
  'libOpenSLES.so', 'libjnigraphics.so', 'libdl.so', 'libc.so', 'libstdc++.so',
];

let gameSession = null;

async function loadAndroidStub(name) {
  const response = await fetch(`/android-stubs/${name}`);
  if (!response.ok) throw new Error(`Unable to load browser Android ABI image ${name} (${response.status}).`);
  return new Uint8Array(await response.arrayBuffer());
}

self.onmessage = async ({ data }) => {
  if (data?.type === 'frame') {
    if (!gameSession || gameSession.frameRunning) return;
    gameSession.frameRunning = true;
    try {
      const elapsed = gameSession.lastFrameTimestamp == null
        ? 16
        : Math.max(1, Math.min(100, data.timestamp - gameSession.lastFrameTimestamp));
      gameSession.lastFrameTimestamp = data.timestamp;
      gameSession.jni.advanceTime(elapsed);
      if (gameSession.clockSetter) {
        if (gameSession.clockTimestampOrigin == null) gameSession.clockTimestampOrigin = data.timestamp;
        const clock = 1_720_000_000_000_000n + BigInt(Math.trunc((data.timestamp - gameSession.clockTimestampOrigin) * 1000));
        gameSession.linux.executeGuestCallback(gameSession.clockSetter, [clock]);
      }
      const result = gameSession.linux.executeGuestCallback(
        gameSession.symbols.onDrawFrame,
        [BigInt(gameSession.jni.envAddress), BigInt(gameSession.appDelegate)],
        0, [], 500_000_000,
      );
      self.postMessage({
        type: 'frame', result: Number(result), drawCalls: gameSession.renderer?.drawCalls ?? 0,
        graphics: gameSession.renderer?.diagnostics() ?? null,
        jni: gameSession.jni.diagnostics(),
        platform: {
          hostCalls: Object.fromEntries([...gameSession.linux.hostCallCounts].sort((left, right) => right[1] - left[1]).slice(0, 50)),
          compatibilityCalls: Object.fromEntries(
            [...gameSession.linux.hostCallCounts]
              .filter(([name]) => gameSession.linux.compatibilitySymbols.has(name))
              .sort((left, right) => right[1] - left[1]),
          ),
          assets: gameSession.linux.recentAssetEvents,
          openAssets: gameSession.linux.assets.size,
          systemCalls: Object.fromEntries([...gameSession.linux.systemCallCounts].sort((left, right) => right[1] - left[1]).slice(0, 30)),
          files: gameSession.linux.recentFileEvents,
        },
      });
    } catch (error) {
      self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
    } finally {
      gameSession.frameRunning = false;
    }
    return;
  }
  if (data?.type === 'touch') {
    if (!gameSession || gameSession.frameRunning || !gameSession.symbols.onTouchEvent) return;
    const touch = data.touch;
    try {
      const result = gameSession.linux.executeGuestCallback(
        gameSession.symbols.onTouchEvent,
        [
          BigInt(gameSession.jni.envAddress), BigInt(gameSession.appDelegate),
          BigInt(touch.pointerIndex), BigInt(touch.reserved), BigInt(touch.pointerCount),
          BigInt(touch.rawAction), BigInt(touch.eventTime), BigInt(touch.action),
        ],
        0, [touch.x, touch.y], 100_000_000,
      );
      gameSession.touchCount = (gameSession.touchCount ?? 0) + 1;
      self.postMessage({
        type: 'touch', result: Number(result), touchCount: gameSession.touchCount,
        touch: {
          x: touch.x, y: touch.y, pointerIndex: touch.pointerIndex,
          pointerCount: touch.pointerCount, rawAction: touch.rawAction,
          eventTime: Number(touch.eventTime), action: touch.action,
        },
      });
    } catch (error) {
      self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
    }
    return;
  }
  if (data?.type !== 'run') return;
  try {
    const { sourceName, runtimeFiles } = data;
    self.postMessage({ type: 'progress', instructions: 0, phase: 'mapping apk' });
    const probeRuntime = await Arm64Runtime.create('/wasm/arm64_core.wasm');
    const elf = probeRuntime.loadElf(runtimeFiles.libpad);
    const probe = probeRuntime.runLibpadProbe(true);
    const constructor = probeRuntime.runToFirstSyscall();
    const runtime = await Arm64Runtime.create('/wasm/arm64_core.wasm');
    runtime.loadElf(runtimeFiles.lib6dba);
    const wrapperPath = '/data/app/jp.gungho.pad/lib/arm64/lib__6dba__.so';
    const padPath = '/data/app/jp.gungho.pad/lib/arm64/libpad.so';
    const renderer = data.canvas ? new Gles1Renderer(data.canvas, runtime, {
      width: data.width || 900,
      height: data.height || 560,
    }) : null;
    const linux = new VirtualLinux(runtime, { libraryPath: wrapperPath, graphicsBridge: renderer });
    linux.mount(wrapperPath, runtimeFiles.lib6dba);
    linux.mount(padPath, runtimeFiles.libpad);
    linux.mount('/data/user/0/jp.gungho.pad/lib/libpad.so', runtimeFiles.libpad);
    if (runtimeFiles.baseApk) {
      linux.mount('/data/app/jp.gungho.pad/base.apk', runtimeFiles.baseApk);
      linux.mountApk(runtimeFiles.baseApk);
    }
    const mountedRuntimeFiles = mountPadRuntimeFiles(linux, runtimeFiles.extraFiles);
    linux.mount('/data/app/jp.gungho.pad/assets/6dba/data1.dat', runtimeFiles.protectionData);
    const stubs = new Map(await Promise.all(SYSTEM_LIBRARIES.map(async (name) => [name, await loadAndroidStub(name)])));
    for (const name of SYSTEM_LIBRARIES) linux.mountSharedObject(`/system/lib64/${name}`, stubs.get(name));
    linux.mountSharedObject('/system/lib64/libart.so', stubs.get('libc.so'));
    const jni = new VirtualJni(linux);
    linux.mountDirectory('/data/user/0/jp.gungho.pad/files');
    linux.mountDirectory('/data/user/0/jp.gungho.pad/cache');
    const constructorReturn = linux.resolveSymbolAddress('browser_constructor_return');
    const clockSetter = linux.resolveSymbolAddress('browser_set_time_microseconds');
    if (!constructorReturn) throw new Error('Browser constructor return trampoline is unavailable.');

    const progress = (phase) => ({ instructions, syscalls, hostcalls }) => self.postMessage({
      type: 'progress', instructions, syscalls, hostcalls,
      phase: `${phase} ${(instructions / 1_000_000).toFixed(1)}m`,
    });
    const writeU32 = (address, value) => {
      const bytes = new Uint8Array(4);
      new DataView(bytes.buffer).setUint32(0, value, true);
      runtime.writeBytes(address, bytes);
    };

    runtime.exports.arm64_set_diagnostics(0);
    runtime.reset(runtime.elfAddress(0x1bd0));
    runtime.exports.arm64_set_register(30, BigInt(constructorReturn));
    runtime.exports.arm64_set_tracepoint(0x44232a4n);
    const wrapperToGate = await linux.runAsync(800_000_000, 10_000, {
      instructionsPerYield: 500_000,
      onProgress: progress('wrapper'),
    });
    if (wrapperToGate.status !== 4) throw new Error(`Protection wrapper stopped before its verified Android gate (CPU status ${wrapperToGate.status}).`);
    writeU32(0x443c1c0, 1);
    runtime.exports.arm64_resume();
    const wrapperRun = await linux.runAsync(800_000_000, 10_000, {
      instructionsPerYield: 500_000,
      onProgress: progress('wrapper checks'),
    });
    if (wrapperRun.status !== 1 || wrapperRun.exited) throw new Error(`Protection wrapper did not return cleanly (CPU status ${wrapperRun.status}).`);
    runtime.exports.arm64_set_diagnostics(1);

    linux.mountSharedObject('/data/app/jp.gungho.pad/lib/arm64/libopenal.so', runtimeFiles.libopenal, 0x3e00000);
    const openalObject = linux.findSharedObject('/data/app/jp.gungho.pad/lib/arm64/libopenal.so');
    const openalInitializers = openalObject.elf.sections.find((section) => section.name === '.init_array');
    if (openalInitializers?.size) {
      const address = Number(new DataView(runtime.readBytes(openalObject.address + openalInitializers.virtualAddress, 8).buffer).getBigUint64(0, true));
      if (address) {
        try {
          linux.executeGuestCallback(address, [0n, 0n, 0n]);
        } catch (error) {
          throw new Error(`OpenAL initializer at 0x${address.toString(16)}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    linux.mountSharedObject(padPath, runtimeFiles.libpad, 0x2000000);
    const padObject = linux.findSharedObject(padPath);
    const mappingsBeforePad = new Set(linux.mappings.map((mapping) => mapping.address));
    runtime.reset(padObject.address + LIBPAD_CONSTRUCTOR_ADDRESS);
    runtime.exports.arm64_set_register(30, BigInt(constructorReturn));
    let padProtectionModule = 0;
    const padSecurityBypasses = new Set();
    const padModules = [];
    const padDiscoveryObservations = [];
    const discoverPadProtectionModule = (event) => {
      if (padProtectionModule) return;
      const outputAddress = Number(event?.output?.address || 0);
      const candidates = [
        ...(outputAddress ? [outputAddress] : []),
        ...linux.mappings.map((mapping) => mapping.address),
      ];
      if (outputAddress && padDiscoveryObservations.length < 64) {
        padDiscoveryObservations.push({
          address: outputAddress,
          length: Number(event?.output?.scannedLength || 0),
          typeInstruction: runtime.peek32(outputAddress + 0x229c),
          mainInstruction: runtime.peek32(outputAddress + 0x22fc),
        });
      }
      for (const address of new Set(candidates)) {
        if (mappingsBeforePad.has(address)) continue;
        const patchSecurityEntry = (type, offset, signature) => {
          const key = `${type}:${address}`;
          if (padSecurityBypasses.has(key) || runtime.peek32(address + offset) !== 0xd10283ff ||
              runtime.peek32(address + offset + 4) !== 0xa90153f3 ||
              runtime.peek32(address + offset + 8) !== signature) return;
          runtime.writeBytes(address + offset, new Uint8Array([0x20, 0x00, 0x80, 0x52, 0xc0, 0x03, 0x5f, 0xd6]));
          padSecurityBypasses.add(key);
        };
        if (address + 0x3aa4 < 0x10000000) patchSecurityEntry('20', 0x3a98, 0xf0000113);
        if (address + 0x4938 < 0x10000000) patchSecurityEntry('54', 0x492c, 0x900000f3);
        if (address + 0x45f4 < 0x10000000) patchSecurityEntry('72', 0x45e8, 0xf00000d3);
        if (address + 0x325c < 0x10000000) patchSecurityEntry('a4', 0x3250, 0xf00000b3);
        if (address + 0x2300 >= 0x8000000) continue;
        const typeInstruction = runtime.peek32(address + 0x229c);
        const returnInstruction = runtime.peek32(address + 0x22a0);
        const mainInstruction = runtime.peek32(address + 0x22fc);
        if ((typeInstruction || mainInstruction) && padDiscoveryObservations.length < 64 && !padDiscoveryObservations.some((item) =>
          item.address === address && item.typeInstruction === typeInstruction && item.mainInstruction === mainInstruction)) {
          padDiscoveryObservations.push({ address, typeInstruction, returnInstruction, mainInstruction });
        }
        if (typeInstruction !== 0x528012e0) continue; // mov w0, #0x97
        if (returnInstruction !== 0xd65f03c0) continue; // ret
        if (mainInstruction !== 0xd14043ff) continue; // module main prologue
        padProtectionModule = address;
        writeU32(address + 0x1b1c0, 1);
        break;
      }
    };
    linux.onEvent = discoverPadProtectionModule;
    linux.onSlice = discoverPadProtectionModule;
    runtime.exports.arm64_set_module_trace(1);
    let padRun = await linux.runAsync(1_200_000_000, 10_000, {
      instructionsPerSlice: 10_000,
      instructionsPerYield: 500_000,
      onProgress: progress('PAD'),
      onEvent: discoverPadProtectionModule,
      onSlice: discoverPadProtectionModule,
    });
    while (padRun.status === 4 && padModules.length < 128) {
      // Module trace stops before the first decoded module instruction. Patch
      // security gates at that boundary, matching the synchronous inspector.
      discoverPadProtectionModule();
      const moduleType = Number(runtime.exports.arm64_get_register(22));
      const moduleBase = Number(runtime.exports.arm64_get_register(27));
      const securityOffsets = new Map([[0x20, 0x3a98], [0x54, 0x492c], [0x72, 0x45e8], [0xa4, 0x3250]]);
      const securityOffset = securityOffsets.get(moduleType);
      if (securityOffset && moduleBase) {
        runtime.writeBytes(moduleBase + securityOffset, new Uint8Array([0x20, 0x00, 0x80, 0x52, 0xc0, 0x03, 0x5f, 0xd6]));
        padSecurityBypasses.add(`${moduleType.toString(16)}:${moduleBase}`);
      }
      padModules.push({
        type: moduleType,
        base: moduleBase,
        entry: Number(runtime.exports.arm64_get_register(6)),
      });
      runtime.exports.arm64_resume();
      runtime.exports.arm64_step();
      runtime.exports.arm64_set_module_trace(1);
      padRun = await linux.runAsync(1_200_000_000, 10_000, {
        instructionsPerSlice: 10_000,
        instructionsPerYield: 500_000,
        onProgress: progress(`PAD module ${padModules.length + 1}`),
        onEvent: discoverPadProtectionModule,
        onSlice: discoverPadProtectionModule,
      });
    }
    linux.onEvent = null;
    linux.onSlice = null;
    if (padRun.status !== 1 || padRun.exited || !padProtectionModule) {
      throw new Error(
        `PAD stopped before its discovered Android gate (CPU status ${padRun.status}; ` +
        `decoder outputs ${JSON.stringify(padDiscoveryObservations)}).`,
      );
    }
    linux.refreshSharedObjectMetadata(padObject);
    const jniOnLoadAddress = linux.resolveSymbolAddress('JNI_OnLoad');
    const jniVersion = jniOnLoadAddress
      ? (() => {
        try {
          return linux.executeGuestCallback(jniOnLoadAddress, [BigInt(jni.vmAddress), 0n]);
        } catch (error) {
          throw new Error(`JNI_OnLoad: ${error instanceof Error ? error.message : String(error)}`);
        }
      })()
      : 0n;

    const appDelegate = jni.allocateObject({ type: 'object', className: 'jp/gungho/pad/AppDelegate' });
    const assetManager = jni.allocateObject({ type: 'android/content/res/AssetManager', className: 'android/content/res/AssetManager' });
    const lifecycleNames = ['didFinishLaunchingWithOptions', 'viewDidLoad', 'onSurfaceCreated', 'onSurfaceChanged', 'onDrawFrame', 'onTouchEvent'];
    const symbols = Object.fromEntries(lifecycleNames.map((name) => [
      name,
      linux.resolveSymbolAddress(`Java_jp_gungho_pad_AppDelegate_${name}`),
    ]));
    const invokeLifecycle = (name, integerArguments = [], vectorArguments = [], maximum = 200_000_000) => {
      if (!symbols[name]) throw new Error(`Missing native lifecycle export ${name}.`);
      self.postMessage({ type: 'progress', phase: `native ${name}`, instructions: Number(runtime.exports.arm64_get_steps()) });
      try {
        return linux.executeGuestCallback(
          symbols[name],
          [BigInt(jni.envAddress), BigInt(appDelegate), ...integerArguments.map(BigInt)],
          0, vectorArguments, maximum,
        );
      } catch (error) {
        const stop = linux.lastGuestCallbackStop;
        const threads = [...linux.guestThreads].map(([identifier, thread]) => ({
          identifier,
          state: thread.state,
          pc: `0x${Number(thread.pc ?? 0).toString(16)}`,
          argument: `0x${Number(thread.argumentAddress ?? 0).toString(16)}`,
          output: `0x${Number(thread.outputAddress ?? 0).toString(16)}`,
          source: `0x${Number(thread.workerSourceAddress ?? 0).toString(16)}`,
          detached: thread.detached,
        }));
        let nativeContext = '';
        if (stop?.pc >= 0x7000000 && stop.pc < 0xa000000) {
          const start = Math.max(0, (stop.pc - 0x100) & ~3);
          const bytes = runtime.readBytes(start, 0x180);
          const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
          const words = Array.from({ length: bytes.length / 4 }, (_, index) =>
            view.getUint32(index * 4, true).toString(16).padStart(8, '0')).join(' ');
          const stackView = new DataView(new Uint8Array(stop.stackBytes).buffer);
          const stackWords = Array.from({ length: Math.min(16, Math.floor(stackView.byteLength / 8)) }, (_, index) =>
            `0x${stackView.getBigUint64(index * 8, true).toString(16)}`).join(',');
          nativeContext = `; module words 0x${start.toString(16)}: ${words}; ` +
            `x19-x30 ${stop.registers.slice(19, 31).map((value) => `0x${value.toString(16)}`).join(',')}; ` +
            `sp=0x${stop.sp.toString(16)} stack64=${stackWords}`;
        }
        throw new Error(
          `native ${name}: ${error instanceof Error ? error.message : String(error)}${nativeContext}; ` +
          `threads=${JSON.stringify(threads)}`,
        );
      }
    };
    invokeLifecycle('didFinishLaunchingWithOptions');
    invokeLifecycle('viewDidLoad', [], [], 1_000_000_000);
    invokeLifecycle('onSurfaceCreated', [assetManager]);
    invokeLifecycle(
      'onSurfaceChanged',
      [data.width || 900, data.height || 560, data.width || 900, data.height || 560],
      [0, 0, data.width || 900, data.height || 560],
    );
    invokeLifecycle('onDrawFrame', [], [], 500_000_000);
    gameSession = {
      runtime, linux, jni, renderer, appDelegate, symbols,
      frameRunning: false, touchCount: 0, lastFrameTimestamp: null,
      clockSetter, clockTimestampOrigin: null,
      sourceName,
    };

    const deepRun = {
      ...padRun,
      instructions: wrapperToGate.instructions + wrapperRun.instructions + padRun.instructions,
      syscalls: wrapperToGate.syscalls + wrapperRun.syscalls + padRun.syscalls,
    };
    const custom = elf.customSections.find((section) => section.type === 0x80000000) || elf.customSections[0];
    const stateWrites = deepRun.events.filter((entry) => entry.name === 'write' && /^\d+\n\d+\n/.test(entry.text || ''));
    const finalState = stateWrites.at(-1)?.text?.split('\n')[0] || null;
    const executableStages = linux.mappings.filter((mapping) => mapping.protection & 4).length;
    self.postMessage({
      type: 'complete',
      probe,
      elf: {
        name: sourceName,
        fileBytes: runtimeFiles.libpad.length,
        loadSegments: elf.loadSegments.length,
        maximumAddress: elf.maximumAddress,
        loadBias: runtime.loadBias,
        customSectionBytes: custom?.size || 0,
        probePassed: probe.passed,
        constructorReached: constructor.reached && constructor.number === 56,
        constructorSteps: constructor.steps,
        firstPath: constructor.path,
        decryptedModule: executableStages > 0,
        deepInstructions: deepRun.instructions,
        syscalls: deepRun.syscalls,
        executableStages,
        wrapperInstructions: wrapperToGate.instructions + wrapperRun.instructions,
        padInstructions: padRun.instructions,
        jniCalls: jni.calls.length,
        nativeRegistrations: jni.nativeRegistrations.length,
        jniVersion: Number(jniVersion),
        decodedModules: padModules.map((module) => `0x${module.type.toString(16).padStart(2, '0')}`),
        securityBypasses: padSecurityBypasses.size,
        lifecycleExports: lifecycleNames.filter((name) => symbols[name]).length,
        firstFrameDrawCalls: renderer?.drawCalls ?? 0,
        loadSequence: 'lib__6dba__.so → libopenal.so → libpad.so',
        mountedRuntimeFiles,
        dependencyPath: null,
        deepStatus: deepRun.exited
          ? `guest exit(${deepRun.exitCode})${finalState ? ` · protection state ${finalState}` : ''}`
          : `CPU status ${deepRun.status}`,
      },
      phase: padRun.status === 1 ? 'native game running' : `CPU status ${padRun.status}`,
    });
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
