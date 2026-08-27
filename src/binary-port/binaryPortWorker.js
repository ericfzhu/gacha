import { ARM64_CORE_BUILD, Arm64Runtime, LIBPAD_CONSTRUCTOR_ADDRESS } from './arm64Runtime.js';
import { VirtualLinux } from './virtualLinux.js';
import { VirtualJni } from './virtualJni.js';
import { Gles1Renderer } from './gles1Renderer.js';
import { mountPadRuntimeFiles } from './padRuntimeFiles.js';

const SYSTEM_LIBRARIES = [
  'libz.so', 'libm.so', 'liblog.so', 'libandroid.so', 'libEGL.so', 'libGLESv1_CM.so',
  'libOpenSLES.so', 'libjnigraphics.so', 'libdl.so', 'libc.so', 'libstdc++.so',
];

let gameSession = null;

// The ARM64 core stops synchronously for syscalls, host calls, and protected
// module hand-offs.  The protected bootstrap therefore does not need a
// 100,000-instruction host polling cadence; a larger slice keeps the hot loop
// inside Wasm while retaining every observable boundary.
// Keep each protected pass inside Wasm long enough to amortize the worker ↔
// Wasm boundary.  The worker remains isolated from the UI thread, so a larger
// slice does not block canvas input; module tracepoints and syscalls still
// interrupt the run immediately when they are reached.
const PROTECTED_INSTRUCTIONS_PER_SLICE = 50_000_000;
const PROTECTED_PROGRESS_INTERVAL = 5_000_000;

async function loadAndroidStub(name) {
  const response = await fetch(`/android-stubs/${name}`);
  if (!response.ok) throw new Error(`Unable to load browser Android ABI image ${name} (${response.status}).`);
  return new Uint8Array(await response.arrayBuffer());
}

const RESTORED_CACHE_DATABASE = 'gacha-pad-binary-port';
const RESTORED_CACHE_VERSION = 1;
const RESTORED_CACHE_STORE = 'restored-elfs';
// The first cache format only persisted the restored ELF file.  A protected
// load also creates executable decoded-module mappings and mutates the loaded
// wrapper/data segments, so keep those artifacts under a distinct key until
// the complete warm-load snapshot is available.
const RESTORED_CACHE_SCHEMA = 'protected-snapshot-v2';

async function restoredCacheKey(runtimeFiles) {
  if (!globalThis.crypto?.subtle || !runtimeFiles?.libpad) return null;
  const inputs = [
    ['libpad', runtimeFiles.libpad],
    ['lib6dba', runtimeFiles.lib6dba],
    ['libopenal', runtimeFiles.libopenal],
    ['protection', runtimeFiles.protectionData],
    ...(runtimeFiles.extraFiles || [])
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((entry) => [`extra:${entry.name}`, entry.bytes]),
  ];
  const hashes = await Promise.all(inputs.map(async ([name, bytes]) => {
    const digest = bytes
      ? await crypto.subtle.digest('SHA-256', bytes)
      : null;
    const value = digest
      ? Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
      : 'none';
    return `${name}=${value}`;
  }));
  return `${ARM64_CORE_BUILD}:${RESTORED_CACHE_SCHEMA}:${hashes.join(';')}`;
}

function captureElfSegments(runtime, elf, address) {
  return elf.loadSegments.map((segment) => ({
    virtualAddress: segment.virtualAddress,
    memorySize: segment.memorySize,
    bytes: runtime.readBytes(address + segment.virtualAddress, segment.memorySize).buffer,
  }));
}

function restoreElfSegments(runtime, elf, address, segments) {
  if (!Array.isArray(segments) || segments.length !== elf.loadSegments.length) {
    throw new Error('Restored protected snapshot is missing ELF segment state.');
  }
  for (const [index, segment] of elf.loadSegments.entries()) {
    const saved = segments[index];
    if (!saved || saved.virtualAddress !== segment.virtualAddress || saved.memorySize !== segment.memorySize ||
        !saved.bytes || saved.bytes.byteLength < segment.memorySize) {
      throw new Error(`Restored protected snapshot has an invalid ELF segment ${index}.`);
    }
    runtime.writeBytes(address + segment.virtualAddress, new Uint8Array(saved.bytes, 0, segment.memorySize));
  }
}

function restoreProtectedMappings(runtime, linux, mappings) {
  if (!Array.isArray(mappings) || !mappings.length) {
    throw new Error('Restored protected snapshot has no decoded mappings.');
  }
  for (const saved of mappings) {
    const address = Number(saved?.address);
    const length = Number(saved?.length);
    if (!Number.isSafeInteger(address) || !Number.isSafeInteger(length) || address < 0 || length <= 0 ||
        !saved.bytes || saved.bytes.byteLength < length || !linux.isAddressRangeAvailable(address, length)) {
      throw new Error(`Restored protected snapshot has an invalid mapping at 0x${address.toString(16)}.`);
    }
    runtime.ensureCapacity(address + length);
    runtime.writeBytes(address, new Uint8Array(saved.bytes, 0, length));
    const mapping = {
      address,
      length,
      protection: Number(saved.protection) || 0,
      fd: Number(saved.fd ?? -1),
      fileOffset: Number(saved.fileOffset ?? 0),
    };
    if (saved.executable) Object.defineProperty(mapping, 'executableBytes', {
      value: runtime.readBytes(address, length),
      writable: true,
      configurable: true,
      enumerable: false,
    });
    linux.mappings.push(mapping);
    linux.nextMapAddress = Math.max(linux.nextMapAddress, address + length + 0x1000);
  }
}

function captureHostState(runtime, linux) {
  return {
    bridges: [...linux.hostBridges.entries()],
    compatibilitySymbols: [...linux.compatibilitySymbols],
    compatibilityData: [...linux.compatibilityData.entries()].map(([name, address]) => {
      const size = name === 'in6addr_any' ? 16 : 8;
      return {
        name,
        address,
        size,
        bytes: runtime.readBytes(address, size).buffer,
        openSlKind: linux.openSlInterfaceNames.get(address) ?? null,
      };
    }),
    hostStrings: [...linux.hostStrings.entries()].map(([value, address]) => ({ value, address })),
    nextHostBridgeAddress: linux.nextHostBridgeAddress,
    nextHostDataAddress: linux.nextHostDataAddress,
  };
}

function restoreHostState(runtime, linux, state) {
  if (!state || !Array.isArray(state.bridges) || !Array.isArray(state.compatibilitySymbols) ||
      !Array.isArray(state.compatibilityData) || !Array.isArray(state.hostStrings)) {
    throw new Error('Restored protected snapshot is missing host bridge state.');
  }
  for (const [name, rawAddress] of state.bridges) {
    const address = Number(rawAddress);
    if (!name || !Number.isSafeInteger(address) || address < 0x7c00000 || address + 8 > 0x7c10000) {
      throw new Error(`Restored protected snapshot has an invalid host bridge at 0x${address.toString(16)}.`);
    }
    linux.hostBridges.set(name, address);
    linux.hostBridgeNames.set(address, name);
    runtime.writeBytes(address, new Uint8Array([
      0x00, 0x00, 0x20, 0xd4, // brk #0
      0xc0, 0x03, 0x5f, 0xd6, // ret
    ]));
  }
  for (const name of state.compatibilitySymbols) {
    if (!name) continue;
    linux.compatibilitySymbols.add(name);
    if (!linux.hostImports.has(name)) {
      linux.registerHostImport(name, (snapshot) => linux.hostCompatibilityCall(name, snapshot));
    }
  }
  for (const saved of state.compatibilityData) {
    const address = Number(saved?.address);
    const size = Number(saved?.size);
    if (!saved?.name || !Number.isSafeInteger(address) || !Number.isSafeInteger(size) || size <= 0 ||
        !saved.bytes || saved.bytes.byteLength < size || address < 0x7c20000 || address + size > 0x7e00000) {
      throw new Error(`Restored protected snapshot has invalid compatibility data for ${saved?.name ?? 'unknown'}.`);
    }
    linux.compatibilityData.set(saved.name, address);
    if (saved.openSlKind) linux.openSlInterfaceNames.set(address, saved.openSlKind);
    runtime.writeBytes(address, new Uint8Array(saved.bytes, 0, size));
  }
  for (const saved of state.hostStrings) {
    const address = Number(saved?.address);
    if (typeof saved?.value !== 'string' || !Number.isSafeInteger(address) ||
        address < 0x7c20000 || address >= 0x7e00000) {
      throw new Error('Restored protected snapshot has invalid host string state.');
    }
    linux.hostStrings.set(saved.value, address);
    runtime.writeBytes(address, new TextEncoder().encode(`${saved.value}\0`));
  }
  linux.nextHostBridgeAddress = Math.max(
    Number(state.nextHostBridgeAddress) || linux.nextHostBridgeAddress,
    ...[...linux.hostBridges.values()].map((address) => address + 8),
  );
  linux.nextHostDataAddress = Math.max(
    Number(state.nextHostDataAddress) || linux.nextHostDataAddress,
    ...[...linux.compatibilityData.values()].map((address) => address + 8),
    ...state.hostStrings.map(({ address }) => Number(address) + 8),
  );
}

function hasBytePayload(value, minimum = 1) {
  return Boolean(value && (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) && value.byteLength >= minimum);
}

function isRestoredSnapshot(value) {
  if (!value || value.schema !== RESTORED_CACHE_SCHEMA || !hasBytePayload(value.bytes) ||
      !Array.isArray(value.mappings) || !value.mappings.length ||
      !Array.isArray(value.wrapperSegments) || !Array.isArray(value.padSegments) ||
      !value.hostState || !Array.isArray(value.hostState.bridges) ||
      !Array.isArray(value.hostState.compatibilitySymbols) ||
      !Array.isArray(value.hostState.compatibilityData) ||
      !Array.isArray(value.hostState.hostStrings)) return false;
  const ranges = [];
  for (const mapping of value.mappings) {
    const address = Number(mapping?.address);
    const length = Number(mapping?.length);
    if (!Number.isSafeInteger(address) || !Number.isSafeInteger(length) || address < 0 ||
        length <= 0 || address + length > 0x40000000 || !hasBytePayload(mapping?.bytes, length)) return false;
    ranges.push([address, address + length]);
  }
  ranges.sort(([left], [right]) => left - right);
  for (let index = 1; index < ranges.length; index += 1) {
    if (ranges[index][0] < ranges[index - 1][1]) return false;
  }
  for (const segments of [value.wrapperSegments, value.padSegments]) {
    if (!segments.length) return false;
    for (const segment of segments) {
      if (!Number.isSafeInteger(Number(segment?.virtualAddress)) ||
          !Number.isSafeInteger(Number(segment?.memorySize)) || Number(segment.memorySize) <= 0 ||
          !hasBytePayload(segment?.bytes, Number(segment.memorySize))) return false;
    }
  }
  return true;
}

function openRestoredCache() {
  if (!globalThis.indexedDB) return null;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(RESTORED_CACHE_DATABASE, RESTORED_CACHE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(RESTORED_CACHE_STORE)) {
        request.result.createObjectStore(RESTORED_CACHE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open restored ELF cache.'));
    request.onblocked = () => reject(new Error('Restored ELF cache is blocked by another browser context.'));
  });
}

async function readRestoredCache(key) {
  if (!key) return null;
  let database;
  try {
    database = await openRestoredCache();
    if (!database) return null;
    const value = await new Promise((resolve, reject) => {
      const request = database.transaction(RESTORED_CACHE_STORE, 'readonly')
        .objectStore(RESTORED_CACHE_STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Unable to read restored ELF cache.'));
    });
    return value?.bytes ? value : null;
  } catch {
    return null;
  } finally {
    database?.close();
  }
}

async function writeRestoredCache(key, value) {
  if (!key || !value?.bytes) return { ok: false, error: 'cache key or bytes unavailable' };
  let database;
  try {
    database = await openRestoredCache();
    if (!database) return { ok: false, error: 'IndexedDB unavailable' };
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(RESTORED_CACHE_STORE, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Unable to write restored ELF cache.'));
      transaction.onabort = () => reject(transaction.error || new Error('Restored ELF cache transaction aborted.'));
      const request = transaction.objectStore(RESTORED_CACHE_STORE).put(value, key);
      request.onerror = () => reject(request.error || new Error('Unable to write restored ELF cache.'));
    });
    return { ok: true, error: null };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
  } finally {
    database?.close();
  }
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
    self.postMessage({ type: 'progress', instructions: 0, phase: 'checking restored ELF cache' });
    let restoredKey = null;
    let cachedRestore = null;
    try {
      restoredKey = await restoredCacheKey(runtimeFiles);
      cachedRestore = await readRestoredCache(restoredKey);
    } catch {
      restoredKey = null;
      cachedRestore = null;
    }
    const cacheHit = isRestoredSnapshot(cachedRestore);
    self.postMessage({
      type: 'progress',
      instructions: 0,
      phase: restoredKey
        ? `restored ELF cache ${cacheHit ? 'hit' : 'miss'}`
        : 'restored ELF cache unavailable',
    });
    if (cacheHit) {
      self.postMessage({ type: 'progress', instructions: 0, phase: 'using cached restored ELF' });
    }
    const probeRuntime = await Arm64Runtime.create();
    const elf = probeRuntime.loadElf(runtimeFiles.libpad);
    const probe = probeRuntime.runLibpadProbe(true);
    const constructor = probeRuntime.runToFirstSyscall();
    const runtime = await Arm64Runtime.create();
    runtime.loadElf(runtimeFiles.lib6dba);
    if (cacheHit) restoreElfSegments(runtime, runtime.loadedElf, runtime.loadBias, cachedRestore.wrapperSegments);
    const wrapperPath = '/data/app/jp.gungho.pad/lib/arm64/lib__6dba__.so';
    const padPath = '/data/app/jp.gungho.pad/lib/arm64/libpad.so';
    const renderer = data.canvas ? new Gles1Renderer(data.canvas, runtime, {
      width: data.width || 900,
      height: data.height || 560,
    }) : null;
    const linux = new VirtualLinux(runtime, { libraryPath: wrapperPath, graphicsBridge: renderer });
    if (cacheHit) {
      restoreHostState(runtime, linux, cachedRestore.hostState);
      // VirtualLinux links the initially loaded wrapper during construction;
      // refresh those relocations after restoring the exact cold-load bridge
      // addresses so cached pointers continue to target the same host ABI.
      linux.linkElf(runtime.loadedElf, runtime.loadBias);
    }
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

    let wrapperToGate = {
      status: 1,
      instructions: 0,
      syscalls: 0,
      hostcalls: 0,
      exited: false,
    };
    let wrapperRun = {
      status: 1,
      instructions: 0,
      syscalls: 0,
      hostcalls: 0,
      exited: false,
    };
    if (!cacheHit) {
      runtime.exports.arm64_set_diagnostics(0);
      runtime.reset(runtime.elfAddress(0x1bd0));
      runtime.exports.arm64_set_register(30, BigInt(constructorReturn));
      runtime.exports.arm64_set_tracepoint(0x44232a4n);
      wrapperToGate = await linux.runAsync(800_000_000, 10_000, {
        instructionsPerYield: PROTECTED_PROGRESS_INTERVAL,
        onProgress: progress('wrapper'),
      });
      if (wrapperToGate.status !== 4) throw new Error(`Protection wrapper stopped before its verified Android gate (CPU status ${wrapperToGate.status}).`);
      writeU32(0x443c1c0, 1);
      runtime.exports.arm64_resume();
      wrapperRun = await linux.runAsync(800_000_000, 10_000, {
        instructionsPerYield: PROTECTED_PROGRESS_INTERVAL,
        onProgress: progress('wrapper checks'),
      });
      if (wrapperRun.status !== 1 || wrapperRun.exited) throw new Error(`Protection wrapper did not return cleanly (CPU status ${wrapperRun.status}).`);
      // The protected module pass is a pure guest execution phase.  Keep the
      // interpreter's optional call/register history off while it runs; that
      // history is only used to explain host events and faults, not by the
      // native code itself.  Re-enable it before JNI/lifecycle callbacks.
      runtime.exports.arm64_set_diagnostics(0);
    }

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

    const padBytes = cacheHit ? new Uint8Array(cachedRestore.bytes) : runtimeFiles.libpad;
    if (cacheHit) {
      // The cache stores the post-protection ELF image, including restored
      // text and the relocation state used by the fixed browser load address.
      // Keep both Android-visible paths in sync before mounting the object.
      linux.mount(padPath, padBytes);
      linux.mount('/data/user/0/jp.gungho.pad/lib/libpad.so', padBytes);
    }
    linux.mountSharedObject(padPath, padBytes, 0x2000000);
    const padObject = linux.findSharedObject(padPath);
    if (cacheHit) {
      restoreElfSegments(runtime, padObject.elf, padObject.address, cachedRestore.padSegments);
      restoreProtectedMappings(runtime, linux, cachedRestore.mappings);
    }
    const mappingsBeforePad = new Set(linux.mappings.map((mapping) => mapping.address));
    let padProtectionModule = cacheHit ? 1 : 0;
    const padSecurityBypasses = new Set();
    const padModules = cacheHit
      ? (Array.isArray(cachedRestore.padModules) ? cachedRestore.padModules : [])
      : [];
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
    let padRun = {
      status: 1,
      instructions: 0,
      syscalls: 0,
      hostcalls: 0,
      exited: false,
    };
    if (!cacheHit) {
      runtime.reset(padObject.address + LIBPAD_CONSTRUCTOR_ADDRESS);
      runtime.exports.arm64_set_register(30, BigInt(constructorReturn));
      linux.onEvent = discoverPadProtectionModule;
      linux.onSlice = discoverPadProtectionModule;
      runtime.exports.arm64_set_module_trace(1);
      padRun = await linux.runAsync(1_200_000_000, 10_000, {
        instructionsPerSlice: PROTECTED_INSTRUCTIONS_PER_SLICE,
        instructionsPerYield: PROTECTED_PROGRESS_INTERVAL,
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
          instructionsPerSlice: PROTECTED_INSTRUCTIONS_PER_SLICE,
          instructionsPerYield: PROTECTED_PROGRESS_INTERVAL,
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
    }
    // Capture the protector-created guest mappings before JNI/lifecycle code
    // allocates any asset buffers.  These mappings contain the decoded module
    // text that a restored ELF cache alone cannot reproduce on a warm load.
    const protectedMappingSummaries = linux.mappings.map((mapping) => ({
      address: mapping.address,
      length: mapping.length,
      protection: mapping.protection,
      fd: mapping.fd,
      fileOffset: mapping.fileOffset,
      executable: Boolean(mapping.executableBytes),
    }));
    runtime.exports.arm64_set_diagnostics(1);
    linux.refreshSharedObjectMetadata(padObject);
    const snapshotWrapperSegments = !cacheHit
      ? captureElfSegments(runtime, runtime.loadedElf, runtime.loadBias)
      : null;
    const snapshotPadSegments = !cacheHit
      ? captureElfSegments(runtime, padObject.elf, padObject.address)
      : null;
    const snapshotHostState = !cacheHit
      ? captureHostState(runtime, linux)
      : null;
    const snapshotMappings = !cacheHit
      ? linux.mappings.map((mapping) => ({
        address: mapping.address,
        length: mapping.length,
        protection: mapping.protection,
        fd: mapping.fd,
        fileOffset: mapping.fileOffset,
        executable: Boolean(mapping.executableBytes),
        bytes: runtime.readBytes(mapping.address, mapping.length).buffer,
      }))
      : null;
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
      events: padRun.events ?? [],
      instructions: wrapperToGate.instructions + wrapperRun.instructions + padRun.instructions,
      syscalls: wrapperToGate.syscalls + wrapperRun.syscalls + padRun.syscalls,
    };
    if (!cacheHit && restoredKey && padObject.restoredBytes) {
      self.postMessage({ type: 'progress', instructions: deepRun.instructions, phase: 'caching restored ELF' });
      const cacheWrite = await writeRestoredCache(restoredKey, {
        schema: RESTORED_CACHE_SCHEMA,
        version: ARM64_CORE_BUILD,
        sourceName,
        bytes: padObject.restoredBytes.buffer.slice(
          padObject.restoredBytes.byteOffset,
          padObject.restoredBytes.byteOffset + padObject.restoredBytes.byteLength,
        ),
        deepInstructions: deepRun.instructions,
        wrapperInstructions: wrapperToGate.instructions + wrapperRun.instructions,
        padInstructions: padRun.instructions,
        syscalls: deepRun.syscalls,
        executableStages: linux.mappings.filter((mapping) => mapping.protection & 4).length,
        wrapperSegments: snapshotWrapperSegments,
        padSegments: snapshotPadSegments,
        hostState: snapshotHostState,
        mappings: snapshotMappings,
        padModules,
      });
      if (!cacheWrite.ok) {
        self.postMessage({
          type: 'progress',
          instructions: deepRun.instructions,
          phase: `restored ELF cache unavailable: ${cacheWrite.error}`,
        });
      }
    }
    const cachedDeepInstructions = Number(cachedRestore?.deepInstructions) || 0;
    const reportedDeepInstructions = cacheHit ? cachedDeepInstructions : deepRun.instructions;
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
        decryptedModule: cacheHit || executableStages > 0,
        deepInstructions: reportedDeepInstructions,
        protectedInstructionsThisRun: cacheHit ? 0 : deepRun.instructions,
        protectedCacheHit: cacheHit,
        syscalls: cacheHit ? Number(cachedRestore?.syscalls) || 0 : deepRun.syscalls,
        executableStages: cacheHit
          ? Number(cachedRestore?.executableStages) || 0
          : executableStages,
        wrapperInstructions: cacheHit
          ? Number(cachedRestore?.wrapperInstructions) || 0
          : wrapperToGate.instructions + wrapperRun.instructions,
        padInstructions: cacheHit
          ? Number(cachedRestore?.padInstructions) || 0
          : padRun.instructions,
        jniCalls: jni.calls.length,
        nativeRegistrations: jni.nativeRegistrations.length,
        jniVersion: Number(jniVersion),
        decodedModules: padModules.map((module) => `0x${module.type.toString(16).padStart(2, '0')}`),
        decodedModuleRecords: padModules,
        protectedMappings: protectedMappingSummaries,
        securityBypasses: padSecurityBypasses.size,
        lifecycleExports: lifecycleNames.filter((name) => symbols[name]).length,
        firstFrameDrawCalls: renderer?.drawCalls ?? 0,
        loadSequence: cacheHit
          ? 'restored libpad.so cache → libopenal.so → JNI'
          : 'lib__6dba__.so → libopenal.so → libpad.so',
        mountedRuntimeFiles,
        dependencyPath: null,
        deepStatus: cacheHit
          ? 'restored protected ELF cache hit'
          : deepRun.exited
          ? `guest exit(${deepRun.exitCode})${finalState ? ` · protection state ${finalState}` : ''}`
          : `CPU status ${deepRun.status}`,
      },
      phase: padRun.status === 1 ? 'native game running' : `CPU status ${padRun.status}`,
    });
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
