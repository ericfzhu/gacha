import { ARM64_STATUS } from './arm64Runtime.js';
import { parseElf64 } from './elf64.js';
import { inflateBytes, isIncompleteInflate } from './inflate.js';
import { ApkArchive } from './apk.js';

const PAGE_SIZE = 0x1000;
const AT_FDCWD = -100n;
const SEEK_SET = 0;
const SEEK_CUR = 1;
const SEEK_END = 2;
const O_CREAT = 0x40;
const O_TRUNC = 0x200;
const R_AARCH64_ABS64 = 257;
const R_AARCH64_GLOB_DAT = 1025;
const R_AARCH64_JUMP_SLOT = 1026;
const R_AARCH64_RELATIVE = 1027;
const HOST_BRIDGE_BASE = 0x7c00000;
const HOST_BRIDGE_LIMIT = 0x7c10000;
const HOST_DATA_BASE = 0x7c20000;
const HOST_RUNTIME_LIMIT = 0x7e00000;

export const AARCH64_SYSCALL = Object.freeze({
  FCNTL: 25,
  INOTIFY_INIT1: 26,
  INOTIFY_ADD_WATCH: 27,
  INOTIFY_RM_WATCH: 28,
  UNLINKAT: 35,
  MKDIRAT: 34,
  NEWFSTATAT: 79,
  FSTAT: 80,
  EXIT: 93,
  EXIT_GROUP: 94,
  CLOSE: 57,
  FCHMOD: 52,
  GETDENTS64: 61,
  OPENAT: 56,
  LSEEK: 62,
  READ: 63,
  WRITE: 64,
  MUNMAP: 215,
  MMAP: 222,
  MPROTECT: 226,
  GETPID: 172,
  GETTID: 178,
  CLOCK_GETTIME: 113,
  NANOSLEEP: 101,
  KILL: 129,
  SETRLIMIT: 164,
});

function alignUp(value, alignment = PAGE_SIZE) {
  return Math.ceil(value / alignment) * alignment;
}

function signed(value) {
  return BigInt.asIntN(64, value);
}

function normalizePath(path) {
  const parts = [];
  for (const part of path.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop(); else parts.push(part);
  }
  return `/${parts.join('/')}`;
}

function createProcessElfImage() {
  const bytes = new Uint8Array(65536);
  const view = new DataView(bytes.buffer);
  bytes.set([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1, 3], 0); // ELF64, little-endian, Linux/Android ABI.
  view.setUint16(16, 3, true); // ET_DYN (PIE app_process64)
  view.setUint16(18, 183, true); // EM_AARCH64
  view.setUint32(20, 1, true);
  view.setBigUint64(32, 64n, true); // e_phoff
  view.setUint16(52, 64, true);
  view.setUint16(54, 56, true);
  view.setUint16(56, 1, true);
  return bytes;
}

export class VirtualLinux {
  constructor(runtime, options = {}) {
    this.runtime = runtime;
    this.files = new Map();
    this.directories = new Set([
      '/',
      '/system',
      '/system/lib',
      '/system/lib64',
      '/data',
      '/data/app',
      '/data/data',
      '/data/data/jp.gungho.pad',
      '/data/user',
      '/data/user/0',
      '/data/user/0/jp.gungho.pad',
      '/proc',
      '/proc/self',
    ]);
    this.descriptors = new Map();
    this.descriptorFlags = new Map();
    this.nextDescriptor = 3;
    this.nextMapAddress = options.mmapBase ?? 0x4000000;
    this.mappings = [];
    this.sharedObjects = [];
    this.nextSharedObjectAddress = options.sharedObjectBase ?? 0x6000000;
    this.events = [];
    this.pid = options.pid ?? 4242;
    this.processName = options.processName ?? 'jp.gungho.pad';
    this.directories.add(`/proc/${this.pid}`);
    this.exited = false;
    this.exitCode = null;
    this.libraryPath = options.libraryPath ?? '/data/app/jp.gungho.pad/lib/arm64/libpad.so';
    this.environment = options.environment ?? [
      'ANDROID_ROOT=/system',
      'ANDROID_DATA=/data',
      'PATH=/system/bin:/system/xbin',
      'TMPDIR=/data/local/tmp',
    ];
    this.hostBridges = new Map();
    this.hostBridgeNames = new Map();
    this.nextHostBridgeAddress = options.hostBridgeBase ?? HOST_BRIDGE_BASE;
    this.nextHostDataAddress = options.hostDataBase ?? HOST_DATA_BASE;
    this.hostStrings = new Map();
    this.compatibilityData = new Map();
    this.openSlInterfaceNames = new Map();
    this.openSlInterfaces = new Map();
    this.nextGraphicsHandle = 1;
    this.graphicsBridge = options.graphicsBridge ?? null;
    this.apkArchive = null;
    this.assets = new Map();
    this.nextAssetHandle = 1;
    this.hostCallCounts = new Map();
    this.recentAssetEvents = [];
    this.systemCallCounts = new Map();
    this.recentFileEvents = [];
    this.inflateStreams = new Map();
    this.guestThreads = new Map();
    this.nextGuestThread = 1;
    this.guestCallbackDepth = 0;
    this.guestCallbackFaultHandler = options.guestCallbackFaultHandler ?? null;
    // Keep cooperative pthread stacks below the normal 0x1000000 ELF load bias.
    // The old 0x3c00000 arena was eventually overwritten when libpad was loaded
    // after the protection wrapper, because the native image extends to ~0x3d30000.
    this.guestThreadStack = options.threadStack ?? 0x0f00000;
    this.guestThreadStackSize = options.threadStackSize ?? 0x20000;
    const encode = (value) => new TextEncoder().encode(value);
    const status = `Name:\t${this.processName}\nState:\tR (running)\nTgid:\t${this.pid}\nPid:\t${this.pid}\nPPid:\t1\nTracerPid:\t0\nUid:\t10000\t10000\t10000\t10000\nGid:\t10000\t10000\t10000\t10000\n`;
    const buildProperties = [
      'ro.build.type=user',
      'ro.secure=1',
      'ro.debuggable=0',
      'ro.hardware=panther',
      'ro.product.manufacturer=Google',
      'ro.product.model=Pixel 7',
      'ro.build.id=TQ3A.230805.001',
      'ro.build.version.release=13',
      'ro.build.version.sdk=33',
      'ro.build.fingerprint=google/panther/panther:13/TQ3A.230805.001/10316531:user/release-keys',
    ].join('\n');
    this.mount('/proc/self/exe', createProcessElfImage());
    this.mount('/proc/self/status', encode(status));
    this.mount(`/proc/${this.pid}/status`, encode(status));
    this.mount('/system/build.prop', encode(`${buildProperties}\n`));
    this.mount('/default.prop', encode('ro.secure=1\nro.debuggable=0\npersist.sys.usb.config=mtp\n'));
    this.installHostImports();
    if (runtime.loadedElf) this.linkElf(runtime.loadedElf, runtime.loadBias);
  }

  installHostImports() {
    this.hostImports = new Map([
      ['dlopen', (snapshot) => this.hostDlopen(snapshot)],
      ['dlsym', (snapshot) => this.hostDlsym(snapshot)],
      ['dlclose', () => 0n],
      ['dlerror', () => 0n],
      ['dladdr', (snapshot) => this.hostDladdr(snapshot)],
      ['dl_iterate_phdr', (snapshot) => this.hostDlIteratePhdr(snapshot)],
      ['__system_property_get', (snapshot) => this.hostSystemPropertyGet(snapshot)],
      ['inflateInit2_', (snapshot) => this.hostInflateInit(snapshot)],
      ['inflate', (snapshot) => this.hostInflate(snapshot)],
      ['inflateEnd', (snapshot) => this.hostInflateEnd(snapshot)],
      ['pthread_create', (snapshot) => this.hostPthreadCreate(snapshot)],
      ['pthread_join', (snapshot) => this.hostPthreadJoin(snapshot)],
    ]);
  }

  mountApk(bytes) {
    this.apkArchive = new ApkArchive(bytes);
    return this;
  }

  registerHostImport(name, handler) {
    this.hostImports.set(name, handler);
    return this.bridgeAddress(name);
  }

  guestThreadStackPointer(identifier) {
    const stackPointer = this.guestThreadStack - (identifier - 1) * this.guestThreadStackSize;
    if (stackPointer <= this.guestThreadStackSize) {
      throw new Error(`Guest thread ${identifier} exceeds the configured stack arena`);
    }
    return stackPointer;
  }

  bridgeAddress(name) {
    if (!this.hostImports.has(name)) return 0;
    const existing = this.hostBridges.get(name);
    if (existing) return existing;
    const address = this.nextHostBridgeAddress;
    if (address + 8 > HOST_BRIDGE_LIMIT) throw new Error('Host bridge address space exhausted');
    this.nextHostBridgeAddress += 8;
    this.runtime.writeBytes(address, new Uint8Array([
      0x00, 0x00, 0x20, 0xd4, // brk #0
      0xc0, 0x03, 0x5f, 0xd6, // ret
    ]));
    this.hostBridges.set(name, address);
    this.hostBridgeNames.set(address, name);
    return address;
  }

  resolveSymbolAddress(name) {
    const mainSymbol = this.runtime.loadedElf?.dynamicSymbols.find((symbol) => symbol.name === name && symbol.sectionIndex);
    if (mainSymbol) return this.runtime.loadBias + mainSymbol.value;
    for (const object of this.sharedObjects) {
      const symbol = object.elf.dynamicSymbols.find((candidate) => candidate.name === name && candidate.sectionIndex);
      if (symbol) return object.address + symbol.value;
    }
    return this.bridgeAddress(name);
  }

  linkElf(elf, address) {
    for (const relocation of elf.relocations) {
      if (relocation.type !== R_AARCH64_ABS64 && relocation.type !== R_AARCH64_GLOB_DAT && relocation.type !== R_AARCH64_JUMP_SLOT) continue;
      const symbol = elf.dynamicSymbols[relocation.symbol];
      if (!symbol || symbol.sectionIndex) continue;
      // Android loads these DSOs with eager binding. Resolve every imported
      // function to either a real guest symbol or an observable browser ABI
      // bridge, including imports that are only reached after the protector
      // has restored the original libpad text.
      const resolved = this.resolveSymbolAddress(symbol.name) || this.compatibilitySymbolAddress(symbol.name);
      if (!resolved) continue;
      const addend = relocation.type === R_AARCH64_ABS64 ? relocation.addend : 0;
      this.runtime.writeUint64(address + relocation.offset, BigInt(resolved) + BigInt(addend));
    }
  }

  mount(path, bytes) {
    const normalized = normalizePath(path);
    const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    this.files.set(normalized, data);
    const parts = normalized.split('/').filter(Boolean);
    let parent = '';
    for (const part of parts.slice(0, -1)) {
      parent += `/${part}`;
      this.directories.add(parent);
    }
    return this;
  }

  mountDirectory(path) {
    this.directories.add(normalizePath(path));
    return this;
  }

  buildProcEnviron() {
    return new TextEncoder().encode(`${this.environment.join('\0')}\0`);
  }

  buildProcMounts() {
    return new TextEncoder().encode([
      'rootfs / rootfs ro,seclabel,relatime 0 0',
      'tmpfs /dev tmpfs rw,seclabel,nosuid,relatime,size=1900000k,nr_inodes=475000,mode=755 0 0',
      'proc /proc proc rw,relatime,gid=3009,hidepid=2 0 0',
      'sysfs /sys sysfs rw,seclabel,relatime 0 0',
      '/dev/block/platform/soc/624000.ufshc/by-name/system /system ext4 ro,seclabel,relatime,data=ordered 0 0',
      '/dev/block/platform/soc/624000.ufshc/by-name/userdata /data ext4 rw,seclabel,nosuid,nodev,noatime,data=ordered 0 0',
      '',
    ].join('\n'));
  }

  directoryEntries(path) {
    const prefix = path === '/' ? '/' : `${path}/`;
    const entries = new Map();
    for (const candidate of [...this.directories, ...this.files.keys()]) {
      if (!candidate.startsWith(prefix) || candidate === path) continue;
      const remainder = candidate.slice(prefix.length);
      const name = remainder.split('/')[0];
      if (!name) continue;
      const fullPath = normalizePath(`${prefix}${name}`);
      entries.set(name, this.directories.has(fullPath) ? 4 : 8);
    }
    return [...entries.entries()].sort(([left], [right]) => left.localeCompare(right));
  }

  mountLibpad(bytes) {
    this.mount(this.libraryPath, bytes);
    this.mount('/data/user/0/jp.gungho.pad/lib/libpad.so', bytes);
    return this;
  }

  mountSharedObject(path, bytes, requestedAddress = 0) {
    const normalized = normalizePath(path);
    const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const elf = parseElf64(data);
    const address = requestedAddress || alignUp(this.nextSharedObjectAddress, 0x200000);
    this.nextSharedObjectAddress = alignUp(address + elf.maximumAddress, 0x200000);
    this.mount(normalized, data);
    for (const segment of elf.loadSegments) {
      const guestAddress = address + segment.virtualAddress;
      this.runtime.fillBytes(guestAddress, segment.memorySize, 0);
      this.runtime.writeBytes(guestAddress, data.subarray(segment.fileOffset, segment.fileOffset + segment.fileSize));
    }
    for (const relocation of elf.relocations) {
      if (relocation.type === R_AARCH64_RELATIVE) this.runtime.writeUint64(address + relocation.offset, BigInt(address) + BigInt(relocation.addend));
      else if (relocation.type === R_AARCH64_ABS64 || relocation.type === R_AARCH64_GLOB_DAT || relocation.type === R_AARCH64_JUMP_SLOT) {
        const symbol = elf.dynamicSymbols[relocation.symbol];
        if (symbol?.sectionIndex) {
          const addend = relocation.type === R_AARCH64_ABS64 ? relocation.addend : 0;
          this.runtime.writeUint64(address + relocation.offset, BigInt(address + symbol.value + addend));
        }
      }
    }
    this.sharedObjects.push({ path: normalized, address, elf });
    // A few libc entry points must be visible to the guest's own dynamic
    // linker while still crossing into the browser host. Such entries are
    // concrete ELF symbols whose first instruction is `brk #0`; register the
    // loaded address as an alias of the normal host bridge.
    for (const [name] of this.hostImports) {
      const symbol = elf.dynamicSymbols.find((candidate) => candidate.name === name && candidate.sectionIndex);
      if (symbol && this.runtime.peek32(address + symbol.value) === 0xd4200000) {
        this.hostBridgeNames.set(address + symbol.value, name);
      }
    }
    this.linkElf(elf, address);
    if (this.runtime.loadedElf) this.linkElf(this.runtime.loadedElf, this.runtime.loadBias);
    for (const object of this.sharedObjects) this.linkElf(object.elf, object.address);
    return this;
  }

  occupiedAddressRanges() {
    const ranges = [
      { address: HOST_BRIDGE_BASE, length: HOST_RUNTIME_LIMIT - HOST_BRIDGE_BASE },
      ...this.mappings,
    ];
    if (this.runtime.loadedElf) {
      for (const segment of this.runtime.loadedElf.loadSegments) ranges.push({
        address: this.runtime.loadBias + segment.virtualAddress,
        length: segment.memorySize,
      });
    }
    for (const object of this.sharedObjects) {
      for (const segment of object.elf.loadSegments) ranges.push({
        address: object.address + segment.virtualAddress,
        length: segment.memorySize,
      });
    }
    return ranges;
  }

  isAddressRangeAvailable(address, length) {
    const end = address + length;
    return !this.occupiedAddressRanges().some((range) =>
      address < range.address + range.length && end > range.address);
  }

  findAvailableMapAddress(length, start = this.nextMapAddress) {
    let address = alignUp(start);
    for (;;) {
      const collision = this.occupiedAddressRanges()
        .filter((range) => address < range.address + range.length && address + length > range.address)
        .sort((left, right) => left.address - right.address)[0];
      if (!collision) return address;
      address = alignUp(collision.address + collision.length);
    }
  }

  findSharedObject(path) {
    const basename = path.split('/').pop();
    return this.sharedObjects.find((object) => object.path === path || object.path.endsWith(`/${basename}`));
  }

  refreshSharedObjectMetadata(object) {
    if (!object) return null;
    const mounted = this.files.get(object.path);
    if (!mounted) return null;
    const restored = mounted.slice();
    for (const segment of object.elf.loadSegments) {
      restored.set(
        this.runtime.readBytes(object.address + segment.virtualAddress, segment.fileSize),
        segment.fileOffset,
      );
    }
    object.elf = parseElf64(restored);
    object.restoredBytes = restored;
    this.linkElf(object.elf, object.address);
    return object;
  }

  hostDlopen(snapshot) {
    const pathAddress = Number(snapshot.arguments[0]);
    const path = pathAddress ? this.runtime.readCString(pathAddress) : '';
    this.currentHostDetail = { path, flags: Number(snapshot.arguments[1]) };
    const object = path ? this.findSharedObject(path) : null;
    return BigInt(object?.address ?? (path ? 0 : this.runtime.loadBias));
  }

  hostDlsym(snapshot) {
    const name = this.runtime.readCString(Number(snapshot.arguments[1]));
    this.currentHostDetail = { handle: Number(snapshot.arguments[0]), queriedSymbol: name };
    return BigInt(this.resolveSymbolAddress(name) || this.compatibilitySymbolAddress(name));
  }

  compatibilitySymbolAddress(name) {
    if (name === 'in6addr_any' || name === 'stderr' || name.startsWith('SL_IID_')) {
      const existing = this.compatibilityData.get(name);
      if (existing) return existing;
      const size = name === 'in6addr_any' ? 16 : 8;
      const address = this.nextHostDataAddress;
      this.nextHostDataAddress = alignUp(address + size, 8);
      this.runtime.fillBytes(address, size, 0);
      // OpenSL exports its interface IDs as pointer-valued data symbols.  A
      // unique self-pointer preserves the identity comparisons made by the
      // native client and lets GetInterface select the requested vtable.
      if (name.startsWith('SL_IID_')) {
        this.runtime.writeUint64(address, BigInt(address));
        this.openSlInterfaceNames.set(address, name.slice('SL_IID_'.length));
      }
      this.compatibilityData.set(name, address);
      return address;
    }
    const isGraphics = /^gl[A-Z]/.test(name);
    const isAudio = /^(al|alc)[A-Z]/.test(name) || name === 'slCreateEngine';
    const isAndroidAsset = /^(AAsset|AndroidBitmap)_?/.test(name);
    if (!name) return 0;
    if (!this.hostImports.has(name)) this.registerHostImport(name, (snapshot) => this.hostCompatibilityCall(name, snapshot));
    return this.bridgeAddress(name);
  }

  hostCompatibilityCall(name, snapshot) {
    this.currentHostDetail = { api: name };
    const argument = (index) => Number(snapshot.arguments[index]);
    if (name === '__stack_chk_fail') {
      const register = (index) => this.runtime.exports.arm64_get_register(index);
      const tlsBase = Number(register(20));
      const framePointer = Number(register(29));
      const soundState = Number(register(21));
      const read64 = (address) => new DataView(this.runtime.readBytes(address, 8).buffer).getBigUint64(0, true);
      const tlsCanary = tlsBase ? read64(tlsBase + 0x28) : 0n;
      const savedCanary = framePointer ? read64(framePointer - 0x28) : 0n;
      throw new Error(
        `Guest stack canary failed at 0x${Number(snapshot.pc).toString(16)} ` +
        `(caller 0x${Number(register(30)).toString(16)}, ` +
        `tls=0x${tlsBase.toString(16)}, fp=0x${framePointer.toString(16)}, ` +
        `x19=0x${register(19).toString(16)}, soundState=0x${soundState.toString(16)}, ` +
        `groups=${soundState ? this.runtime.readBytes(soundState + 0x34a, 1)[0] : -1}, ` +
        `live=0x${tlsCanary.toString(16)}, saved=0x${savedCanary.toString(16)}, ` +
        `x8=0x${register(8).toString(16)}, x9=0x${register(9).toString(16)})`,
      );
    }
    if (name === 'AAssetManager_open') {
      const requestedName = this.runtime.readCString(argument(1));
      const candidates = [requestedName, `assets/${requestedName.replace(/^\/+/, '')}`];
      const path = candidates.find((candidate) => this.apkArchive?.has(candidate));
      if (!path) {
        this.currentHostDetail = { api: name, requestedName, path: null };
        return 0n;
      }
      const data = this.apkArchive.read(path);
      const handle = 0x70000000 + this.nextAssetHandle++ * 8;
      this.assets.set(handle, { path, data, offset: 0, bufferAddress: 0 });
      this.currentHostDetail = { api: name, requestedName, path, length: data.length, handle };
      return BigInt(handle);
    }
    if (name === 'AAsset_read') {
      const asset = this.assets.get(argument(0));
      const capacity = Math.max(0, argument(2));
      if (!asset) return -1n;
      const count = Math.min(capacity, asset.data.length - asset.offset);
      if (count > 0) this.runtime.writeBytes(argument(1), asset.data.subarray(asset.offset, asset.offset + count));
      asset.offset += count;
      this.currentHostDetail = { api: name, path: asset.path, count, offset: asset.offset };
      return BigInt(count);
    }
    if (name === 'AAsset_seek' || name === 'AAsset_seek64') {
      const asset = this.assets.get(argument(0));
      if (!asset) return -1n;
      const offset = Number(BigInt.asIntN(64, snapshot.arguments[1]));
      const whence = argument(2);
      const base = whence === SEEK_CUR ? asset.offset : whence === SEEK_END ? asset.data.length : 0;
      const position = base + offset;
      if (position < 0 || position > asset.data.length) return -1n;
      asset.offset = position;
      this.currentHostDetail = { api: name, path: asset.path, offset: position };
      return BigInt(position);
    }
    if (name === 'AAsset_getLength' || name === 'AAsset_getLength64' ||
        name === 'AAsset_getRemainingLength' || name === 'AAsset_getRemainingLength64') {
      const asset = this.assets.get(argument(0));
      if (!asset) return 0n;
      const remaining = name.includes('Remaining') ? asset.data.length - asset.offset : asset.data.length;
      this.currentHostDetail = { api: name, path: asset.path, length: remaining };
      return BigInt(remaining);
    }
    if (name === 'AAsset_getBuffer') {
      const asset = this.assets.get(argument(0));
      if (!asset) return 0n;
      if (!asset.bufferAddress) {
        const length = alignUp(Math.max(1, asset.data.length));
        asset.bufferAddress = this.findAvailableMapAddress(length);
        this.nextMapAddress = Math.max(this.nextMapAddress, asset.bufferAddress + length + PAGE_SIZE);
        this.runtime.ensureCapacity(asset.bufferAddress + length);
        this.runtime.writeBytes(asset.bufferAddress, asset.data);
        this.mappings.push({ address: asset.bufferAddress, length, protection: 1, fd: -1, fileOffset: 0 });
      }
      this.currentHostDetail = { api: name, path: asset.path, address: asset.bufferAddress };
      return BigInt(asset.bufferAddress);
    }
    if (name === 'AAsset_openFileDescriptor' || name === 'AAsset_openFileDescriptor64') {
      const asset = this.assets.get(argument(0));
      if (!asset) return -1n;
      const descriptor = this.nextDescriptor++;
      this.descriptors.set(descriptor, { path: asset.path, data: asset.data, offset: 0, directory: false });
      if (argument(1)) this.runtime.writeUint64(argument(1), 0n);
      if (argument(2)) this.runtime.writeUint64(argument(2), BigInt(asset.data.length));
      this.currentHostDetail = { api: name, path: asset.path, descriptor, length: asset.data.length };
      return BigInt(descriptor);
    }
    if (name === 'AAsset_close') {
      const asset = this.assets.get(argument(0));
      this.assets.delete(argument(0));
      this.currentHostDetail = { api: name, path: asset?.path ?? null };
      return 0n;
    }
    if (name === 'memcpy' || name === 'memmove') {
      const destination = argument(0);
      const source = argument(1);
      const length = argument(2);
      if (destination && source && length >= 0 && length < 0x40000000) {
        this.runtime.writeBytes(destination, this.runtime.readBytes(source, length));
      }
      return BigInt(destination);
    }
    if (name === 'memset') {
      const destination = argument(0);
      const length = argument(2);
      if (destination && length >= 0 && length < 0x40000000) {
        this.runtime.fillBytes(destination, length, argument(1) & 0xff);
      }
      this.currentHostDetail = { api: name, destination, value: argument(1) & 0xff, length };
      return BigInt(destination);
    }
    if (name === 'memcmp') {
      const left = this.runtime.readBytes(argument(0), argument(2));
      const right = this.runtime.readBytes(argument(1), argument(2));
      for (let index = 0; index < left.length; index++) {
        if (left[index] !== right[index]) return BigInt(left[index] - right[index]);
      }
      return 0n;
    }
    if (name === 'memchr') {
      const address = argument(0);
      const bytes = this.runtime.readBytes(address, argument(2));
      const index = bytes.indexOf(argument(1) & 0xff);
      return BigInt(index < 0 ? 0 : address + index);
    }
    if (name === 'strncmp' || name === 'strcasecmp' || name === 'strncasecmp') {
      const limit = name === 'strcasecmp' ? Number.MAX_SAFE_INTEGER : argument(2);
      let left = this.runtime.readCString(argument(0));
      let right = this.runtime.readCString(argument(1));
      if (name !== 'strncmp') { left = left.toLowerCase(); right = right.toLowerCase(); }
      const leftSlice = left.slice(0, limit);
      const rightSlice = right.slice(0, limit);
      return BigInt(leftSlice < rightSlice ? -1 : leftSlice > rightSlice ? 1 : 0);
    }
    if (name === 'strncpy') {
      const destination = argument(0);
      const capacity = argument(2);
      const encoded = new TextEncoder().encode(this.runtime.readCString(argument(1)));
      const output = new Uint8Array(capacity);
      output.set(encoded.subarray(0, capacity));
      this.runtime.writeBytes(destination, output);
      return BigInt(destination);
    }
    if (name === 'strncat') {
      const destination = argument(0);
      const current = new TextEncoder().encode(this.runtime.readCString(destination));
      const suffix = new TextEncoder().encode(this.runtime.readCString(argument(1))).subarray(0, argument(2));
      this.runtime.writeBytes(destination, new Uint8Array([...current, ...suffix, 0]));
      return BigInt(destination);
    }
    if (name === 'strrchr') {
      const address = argument(0);
      const value = argument(1) & 0xff;
      const bytes = new TextEncoder().encode(this.runtime.readCString(address));
      const index = bytes.lastIndexOf(value);
      return BigInt(index < 0 ? 0 : address + index);
    }
    if (name === 'atoi' || name === 'strtol' || name === 'strtoul') {
      const parsed = Number.parseInt(this.runtime.readCString(argument(0)).trim(), name === 'atoi' ? 10 : argument(2) || 10);
      return BigInt(Number.isFinite(parsed) ? parsed : 0);
    }
    if (name === 'strerror' || name === 'gai_strerror') return BigInt(this.hostString('browser compatibility error'));
    if (name === 'toupper') {
      const value = argument(0);
      return BigInt(value >= 0x61 && value <= 0x7a ? value - 0x20 : value);
    }
    const doubleMath = new Map([
      ['sin', Math.sin], ['cos', Math.cos], ['acos', Math.acos], ['atan2', Math.atan2],
      ['pow', Math.pow], ['exp', Math.exp], ['log10', Math.log10], ['fmod', (x, y) => x % y],
    ]);
    const floatMath = new Map([
      ['sinf', Math.sin], ['cosf', Math.cos], ['acosf', Math.acos], ['asinf', Math.asin],
      ['atanf', Math.atan], ['atan2f', Math.atan2], ['powf', Math.pow], ['exp2f', (x) => 2 ** x],
      ['sqrtf', Math.sqrt], ['sinhf', Math.sinh], ['coshf', Math.cosh], ['tanhf', Math.tanh],
    ]);
    if (doubleMath.has(name) || floatMath.has(name) || name === 'atof' || name === 'strtod') {
      const float = floatMath.has(name);
      const view = new DataView(new ArrayBuffer(8));
      let value;
      if (name === 'atof' || name === 'strtod') value = Number.parseFloat(this.runtime.readCString(argument(0))) || 0;
      else {
        view.setBigUint64(0, BigInt.asUintN(64, this.runtime.exports.arm64_get_vector_lo(0)), true);
        const left = float ? view.getFloat32(0, true) : view.getFloat64(0, true);
        view.setBigUint64(0, BigInt.asUintN(64, this.runtime.exports.arm64_get_vector_lo(1)), true);
        const right = float ? view.getFloat32(0, true) : view.getFloat64(0, true);
        value = (float ? floatMath : doubleMath).get(name)(left, right);
      }
      if (float) view.setFloat32(0, value, true); else view.setFloat64(0, value, true);
      this.runtime.exports.arm64_set_vector_lo(0, view.getBigUint64(0, true));
      this.runtime.exports.arm64_set_vector_hi(0, 0n);
      return 0n;
    }
    if (name === 'alGetError') return 0n;
    if (name === 'AAssetManager_fromJava') return 1n;
    if (name === 'slCreateEngine') {
      const output = argument(0);
      const engineObject = this.createOpenSlObject('ENGINE');
      if (!output) return 1n; // SL_RESULT_PARAMETER_INVALID
      this.runtime.writeUint64(output, BigInt(engineObject));
      this.currentHostDetail = { api: name, engineObject };
      return 0n;
    }
    if (/^glGen/.test(name) || /^alGen/.test(name)) {
      const count = Number(snapshot.arguments[0]);
      const output = Number(snapshot.arguments[1]);
      if (output && count > 0 && count < 0x10000) {
        for (let index = 0; index < count; index++) {
          const bytes = new Uint8Array(4);
          new DataView(bytes.buffer).setUint32(0, this.nextGraphicsHandle++, true);
          this.runtime.writeBytes(output + index * 4, bytes);
        }
      }
    }
    if (/^gl[A-Z]/.test(name) && this.graphicsBridge) {
      this.currentHostDetail = {
        api: name,
        arguments: snapshot.arguments.slice(0, 8).map((value) => Number(value)),
      };
      const response = this.graphicsBridge.call(name, snapshot);
      if (response?.handled) return BigInt(response.result ?? 0);
    }
    if (name === 'glGetError') return 0n;
    if (name === 'glCheckFramebufferStatusOES') return 0x8cd5n; // GL_FRAMEBUFFER_COMPLETE
    return 0n;
  }

  allocateHostData(size, alignment = 8) {
    const address = alignUp(this.nextHostDataAddress, alignment);
    this.nextHostDataAddress = address + Math.max(1, size);
    this.runtime.fillBytes(address, Math.max(1, size), 0);
    return address;
  }

  createOpenSlInterface(kind, slots = 32) {
    const key = `${kind}:${slots}`;
    const cached = this.openSlInterfaces.get(key);
    if (cached) return cached;
    const vtable = this.allocateHostData(slots * 8);
    for (let slot = 0; slot < slots; slot += 1) {
      const bridgeName = `opensl_${kind}_${slot}`;
      const bridge = this.registerHostImport(
        bridgeName,
        (snapshot) => this.hostOpenSlCall(kind, slot, snapshot),
      );
      this.runtime.writeUint64(vtable + slot * 8, BigInt(bridge));
    }
    const handle = this.allocateHostData(8);
    this.runtime.writeUint64(handle, BigInt(vtable));
    const result = { kind, handle, vtable };
    this.openSlInterfaces.set(key, result);
    return result;
  }

  createOpenSlObject(kind) {
    // SLObjectItf is itself an interface whose GetInterface method exposes the
    // engine/player/output-mix interfaces owned by this object.
    const object = this.createOpenSlInterface(`OBJECT_${kind}`, 10);
    return object.handle;
  }

  completeDeferredOpenSlSoundGroups() {
    const libpad = this.sharedObjects.find((object) => object.path.endsWith('/libpad.so'));
    if (!libpad) return null;
    const read16 = (address) => new DataView(this.runtime.readBytes(address, 2).buffer).getUint16(0, true);
    const read64 = (address) => Number(new DataView(this.runtime.readBytes(address, 8).buffer).getBigUint64(0, true));
    const soundState = read64(libpad.address + 0xf6e160);
    if (!soundState) return null;
    const polyGroups = read64(soundState + 0x330);
    const polyGroupCount = read16(soundState + 0x338);
    let computedGroupCount = 0;
    if (polyGroups && polyGroupCount > 0 && polyGroupCount <= 0x10000) {
      for (let index = 0; index < polyGroupCount; index += 1) {
        computedGroupCount += this.runtime.readBytes(polyGroups + index * 2, 1)[0];
      }
    }
    // libpad documents 32 as the maximum immediately after its vector sum.
    // If the pending list has not been attached yet, Android's completion
    // callback leaves the engine configured for that full table capacity.
    const groupCount = computedGroupCount > 0 && computedGroupCount <= 32 ? computedGroupCount : 32;
    this.runtime.writeBytes(soundState + 0x34a, new Uint8Array([groupCount]));
    return { soundState, polyGroups, polyGroupCount, computedGroupCount, groupCount };
  }

  hostOpenSlCall(kind, slot, snapshot) {
    const argument = (index) => Number(snapshot.arguments[index]);
    this.currentHostDetail = { api: 'OpenSL', interface: kind, slot };
    if (kind.startsWith('OBJECT_')) {
      if (kind === 'OBJECT_OUTPUTMIX' && slot === 0) {
        const soundGroups = this.completeDeferredOpenSlSoundGroups();
        this.currentHostDetail = { ...this.currentHostDetail, soundGroups };
      } else if (slot === 2 && argument(1)) { // GetState
        this.runtime.writeBytes(argument(1), new Uint8Array([2, 0, 0, 0])); // SL_OBJECT_STATE_REALIZED
      } else if (slot === 3) { // GetInterface
        const requested = this.openSlInterfaceNames.get(argument(1)) ?? 'GENERIC';
        const output = argument(2);
        if (!output) return 1n;
        const owner = kind.slice('OBJECT_'.length);
        const interfaceKind = requested === 'ENGINE' ? 'ENGINE' : `${owner}_${requested}`;
        const selected = this.createOpenSlInterface(interfaceKind);
        this.runtime.writeUint64(output, BigInt(selected.handle));
        this.currentHostDetail = { ...this.currentHostDetail, requested, output: selected.handle };
      }
      return 0n;
    }
    if (kind === 'ENGINE') {
      if (slot === 2 || slot === 3 || slot === 4 || slot === 7 || slot === 9) {
        // All Engine creation methods place the new SLObjectItf in x1.
        const output = argument(1);
        if (!output) return 1n;
        const objectKind = slot === 2 ? 'PLAYER' : slot === 3 ? 'RECORDER' : slot === 7 ? 'OUTPUTMIX' : 'DEVICE';
        const created = this.createOpenSlObject(objectKind);
        this.runtime.writeUint64(output, BigInt(created));
        this.currentHostDetail = { ...this.currentHostDetail, created: objectKind, output: created };
      } else if ((slot === 10 || slot === 12) && argument(1)) {
        this.runtime.writeBytes(argument(1), new Uint8Array(4));
      } else if (slot === 14 && argument(2)) {
        this.runtime.writeBytes(argument(2), new Uint8Array(4));
      }
      return 0n;
    }
    // The play, buffer-queue, volume, recorder, and effect interfaces are
    // stateful in Android.  Initialization only needs successful setters,
    // queue registration, and deterministic zero-valued getters.  WebAudio
    // consumes the queued PCM data later at this same bridge.
    if (/BUFFERQUEUE/.test(kind) && slot === 2 && argument(1)) {
      this.runtime.fillBytes(argument(1), 8, 0);
    } else if (/BUFFERQUEUE/.test(kind) && slot === 0) {
      this.currentHostDetail = { ...this.currentHostDetail, buffer: argument(1), byteLength: argument(2) };
    } else if ((slot === 1 || slot === 2) && argument(1)) {
      this.runtime.fillBytes(argument(1), 8, 0);
    }
    return 0n;
  }

  hostString(value) {
    const existing = this.hostStrings.get(value);
    if (existing) return existing;
    const bytes = new TextEncoder().encode(`${value}\0`);
    const address = this.nextHostDataAddress;
    this.nextHostDataAddress = alignUp(address + bytes.length, 8);
    this.runtime.writeBytes(address, bytes);
    this.hostStrings.set(value, address);
    return address;
  }

  objectForAddress(address) {
    const main = this.runtime.loadedElf;
    if (main?.loadSegments.some((segment) => {
      const start = this.runtime.loadBias + segment.virtualAddress;
      return address >= start && address < start + segment.memorySize;
    })) return { path: this.libraryPath, address: this.runtime.loadBias, elf: main };
    return this.sharedObjects.find((object) => object.elf.loadSegments.some((segment) => {
      const start = object.address + segment.virtualAddress;
      return address >= start && address < start + segment.memorySize;
    })) ?? null;
  }

  hostDladdr(snapshot) {
    const queriedAddress = Number(snapshot.arguments[0]);
    const infoAddress = Number(snapshot.arguments[1]);
    const object = this.objectForAddress(queriedAddress);
    this.currentHostDetail = { queriedAddress, objectPath: object?.path ?? null };
    if (!object || !infoAddress) return 0n;
    const symbol = object.elf.dynamicSymbols
      .filter((candidate) => candidate.sectionIndex && object.address + candidate.value <= queriedAddress)
      .sort((left, right) => right.value - left.value)[0];
    this.runtime.writeUint64(infoAddress, this.hostString(object.path));
    this.runtime.writeUint64(infoAddress + 8, object.address);
    this.runtime.writeUint64(infoAddress + 16, symbol?.name ? this.hostString(symbol.name) : 0);
    this.runtime.writeUint64(infoAddress + 24, symbol ? object.address + symbol.value : 0);
    return 1n;
  }

  executeGuestCallback(address, argumentsList, stackPointer = 0, vectorArguments = [], maximumInstructions = 100_000_000) {
    const callbackArguments = Array.from({ length: 8 }, (_, index) => BigInt(argumentsList[index] ?? 0));
    if (!this.runtime.exports.arm64_begin_callback(BigInt(address), ...callbackArguments)) throw new Error('Nested guest callbacks are unsupported');
    if (stackPointer) {
      this.runtime.ensureCapacity(stackPointer);
      this.runtime.exports.arm64_set_sp(BigInt(stackPointer));
    }
    for (let index = 0; index < vectorArguments.length && index < 8; index += 1) {
      const argument = vectorArguments[index];
      let bits;
      if (typeof argument === 'bigint') bits = argument;
      else {
        const encoded = new DataView(new ArrayBuffer(8));
        encoded.setFloat32(0, Number(argument), true);
        bits = encoded.getBigUint64(0, true);
      }
      this.runtime.exports.arm64_set_vector_lo(index, bits);
      this.runtime.exports.arm64_set_vector_hi(index, 0n);
    }
    this.guestCallbackDepth += 1;
    let callbackRun;
    try {
      callbackRun = this.run(maximumInstructions, 10_000);
      while (callbackRun.status !== ARM64_STATUS.HALTED &&
        this.guestCallbackFaultHandler?.(callbackRun) === true) {
        if (callbackRun.status < ARM64_STATUS.RUNNING) this.runtime.exports.arm64_skip_fault();
        else this.runtime.exports.arm64_resume();
        callbackRun = this.run(maximumInstructions, 10_000);
      }
    } catch (error) {
      this.runtime.exports.arm64_end_callback();
      throw error;
    } finally {
      this.guestCallbackDepth -= 1;
    }
    if (callbackRun.status !== ARM64_STATUS.HALTED) {
      const stoppedStackPointer = Number(this.runtime.exports.arm64_get_sp());
      const maximumGuestAddress = this.runtime.memory.buffer.byteLength - this.runtime.memoryBias;
      this.lastGuestCallbackStop = {
        address,
        status: callbackRun.status,
        pc: Number(callbackRun.pc),
        faultAddress: Number(callbackRun.faultAddress),
        lastInstruction: Number(callbackRun.lastInstruction),
        sp: stoppedStackPointer,
        registers: Array.from({ length: 31 }, (_, index) =>
          Number(this.runtime.exports.arm64_get_register(index))),
        stackBytes: stoppedStackPointer >= 0 && stoppedStackPointer + 0x120 <= maximumGuestAddress
          ? Array.from(this.runtime.readBytes(stoppedStackPointer, 0x120))
          : [],
      };
      this.runtime.exports.arm64_end_callback();
      if (this.processExit) {
        const mapping = this.mappings.find((entry) =>
          this.processExit.pc >= entry.address && this.processExit.pc < entry.address + entry.length);
        const recent = this.processExit.recentCalls.slice(0, 8)
          .map((call) => `0x${call.pc.toString(16)}→0x${call.target.toString(16)}`).join(', ');
        throw new Error(
          `guest requested exit_group(${this.processExit.code}) at 0x${this.processExit.pc.toString(16)}` +
          ` (caller 0x${this.processExit.caller.toString(16)}, ` +
          `mapping ${mapping ? `0x${mapping.address.toString(16)}+0x${(this.processExit.pc - mapping.address).toString(16)}` : 'unknown'}, ` +
          `calls ${recent})`,
        );
      }
      throw new Error(
        `Guest callback at 0x${address.toString(16)} stopped with CPU status ${callbackRun.status}` +
        ` at PC 0x${Number(callbackRun.pc).toString(16)}` +
        ` (fault 0x${Number(callbackRun.faultAddress).toString(16)}, instruction 0x${Number(callbackRun.lastInstruction).toString(16)})`,
      );
    }
    return this.runtime.exports.arm64_end_callback();
  }

  runGuestThread(identifier, start = 0, argument = 0n, maximumInstructions = 10_000_000) {
    const thread = this.guestThreads.get(identifier);
    const isStarting = !thread;
    if (isStarting) {
      if (!this.runtime.exports.arm64_begin_callback(BigInt(start), BigInt(argument), 0n, 0n, 0n, 0n, 0n, 0n, 0n)) {
        throw new Error('Nested guest callbacks are unsupported');
      }
      const stackPointer = this.guestThreadStackPointer(identifier);
      this.runtime.ensureCapacity(stackPointer);
      this.runtime.exports.arm64_set_sp(BigInt(stackPointer));
    } else if (!this.runtime.exports.arm64_resume_callback(identifier)) {
      throw new Error(`Unable to resume guest thread ${identifier}`);
    }

    this.guestCallbackDepth += 1;
    let callbackRun;
    try {
      callbackRun = this.run(maximumInstructions, 10_000);
    } finally {
      this.guestCallbackDepth -= 1;
    }

    if (callbackRun.status === ARM64_STATUS.HALTED) {
      const result = this.runtime.exports.arm64_end_callback();
      this.runtime.exports.arm64_discard_suspended_callback(identifier);
      const completed = { ...thread, result, state: 'completed' };
      this.guestThreads.set(identifier, completed);
      return completed;
    }
    if (callbackRun.status === ARM64_STATUS.RUNNING) {
      if (!this.runtime.exports.arm64_suspend_callback(identifier)) {
        throw new Error(`Unable to suspend guest thread ${identifier}`);
      }
      const suspended = { ...thread, result: 0n, state: 'suspended', pc: callbackRun.pc };
      this.guestThreads.set(identifier, suspended);
      return suspended;
    }

    this.runtime.exports.arm64_end_callback();
    throw new Error(`Guest thread ${identifier} stopped with CPU status ${callbackRun.status} ` +
      `(pc=0x${Number(callbackRun.pc).toString(16)}, fault=0x${Number(callbackRun.faultAddress).toString(16)}, ` +
      `instruction=0x${BigInt.asUintN(32, BigInt(callbackRun.lastInstruction)).toString(16)})`);
  }

  hostPthreadCreate(snapshot) {
    const threadAddress = Number(snapshot.arguments[0]);
    const attributesAddress = Number(snapshot.arguments[1]);
    const start = Number(snapshot.arguments[2]);
    const argument = snapshot.arguments[3];
    if (!threadAddress || !start) return 22n;
    let identifier = 0;
    for (let candidate = 1; candidate < 64; candidate += 1) {
      if (!this.guestThreads.has(candidate)) { identifier = candidate; break; }
    }
    if (!identifier) return 11n;
    this.nextGuestThread = identifier + 1;
    const detached = attributesAddress && attributesAddress + 8 < 0x8000000
      ? Number(this.readUint64(attributesAddress)) === 1
      : false;
    this.runtime.writeUint64(threadAddress, BigInt(identifier));
    if (!this.runtime.exports.arm64_begin_callback(BigInt(start), argument, 0n, 0n, 0n, 0n, 0n, 0n, 0n)) {
      throw new Error('Nested guest callbacks are unsupported');
    }
    const stackPointer = this.guestThreadStackPointer(identifier);
    this.runtime.ensureCapacity(stackPointer);
    this.runtime.exports.arm64_set_sp(BigInt(stackPointer));
    if (!this.runtime.exports.arm64_suspend_callback(identifier)) {
      throw new Error(`Unable to queue guest thread ${identifier}`);
    }
    const argumentAddress = Number(argument);
    const outputAddress = argumentAddress && argumentAddress + 16 < 0x8000000
      ? Number(this.readUint64(argumentAddress + 8))
      : 0;
    const outputLength = argumentAddress && argumentAddress + 24 < 0x8000000
      ? Number(this.readUint64(argumentAddress + 16))
      : 0;
    const workerSourceAddress = argumentAddress && argumentAddress + 32 < 0x8000000
      ? Number(this.readUint64(argumentAddress + 24))
      : 0;
    const thread = {
      result: 0n,
      state: 'suspended',
      pc: BigInt(start),
      argumentAddress,
      outputAddress,
      outputLength,
      workerSourceAddress,
      detached,
    };
    this.guestThreads.set(identifier, thread);
    let scheduledThread = thread;
    if (outputAddress && outputLength) {
      while (scheduledThread.state === 'suspended') {
        scheduledThread = this.runGuestThread(identifier, 0, 0n, 100_000_000);
      }
    }
    if (detached && scheduledThread.state === 'completed') this.guestThreads.delete(identifier);
    this.currentHostDetail = {
      identifier,
      attributes: attributesAddress,
      detached,
      start,
      argument: Number(argument),
      argumentBytes: argument && Number(argument) < 0x8000000
        ? Array.from(this.runtime.readBytes(Number(argument), 96), (value) => value.toString(16).padStart(2, '0')).join('')
        : null,
      workerSourceAddress,
      workerSourceBytes: workerSourceAddress && workerSourceAddress < 0x8000000
        ? Array.from(this.runtime.readBytes(workerSourceAddress, 128), (value) => value.toString(16).padStart(2, '0')).join('')
        : null,
      threadState: scheduledThread.state,
      threadResult: scheduledThread.result,
      threadPc: scheduledThread.pc,
    };
    return 0n;
  }

  hostPthreadJoin(snapshot) {
    const identifier = Number(snapshot.arguments[0]);
    const resultAddress = Number(snapshot.arguments[1]);
    let thread = this.guestThreads.get(identifier);
    if (!thread) return 3n;
    while (thread.state === 'suspended') thread = this.runGuestThread(identifier, 0, 0n, 100_000_000);
    if (resultAddress) this.runtime.writeUint64(resultAddress, thread.result);
    const summarizeBytes = (address, length, scanLength = length) => {
      if (!address || address >= 0x8000000) return null;
      const bytes = this.runtime.readBytes(address, Math.min(scanLength, 32 * 1024 * 1024));
      let nonzero = 0;
      let firstNonzeroOffset = -1;
      for (const value of bytes) if (value) nonzero += 1;
      for (let index = 0; index < bytes.length; index += 1) {
        if (bytes[index]) { firstNonzeroOffset = index; break; }
      }
      return {
        address,
        nonzero,
        scannedLength: bytes.length,
        firstNonzeroOffset,
        firstBytes: Array.from(bytes.subarray(0, length), (value) => value.toString(16).padStart(2, '0')).join(''),
        firstNonzeroBytes: firstNonzeroOffset >= 0
          ? Array.from(bytes.subarray(firstNonzeroOffset, firstNonzeroOffset + length), (value) => value.toString(16).padStart(2, '0')).join('')
          : null,
      };
    };
    this.guestThreads.delete(identifier);
    this.currentHostDetail = {
      identifier,
      threadResult: thread.result,
      output: summarizeBytes(thread.outputAddress, 128, thread.outputLength),
      workerSource: summarizeBytes(thread.workerSourceAddress, 128),
    };
    return 0n;
  }

  hostDlIteratePhdr(snapshot) {
    const callback = Number(snapshot.arguments[0]);
    const data = snapshot.arguments[1];
    if (!callback) return 0n;
    const objects = [
      { path: this.libraryPath, address: this.runtime.loadBias, elf: this.runtime.loadedElf },
      ...this.sharedObjects,
    ].filter((object) => object.elf);
    let result = 0n;
    for (const object of objects) {
      const info = this.nextHostDataAddress;
      this.nextHostDataAddress = alignUp(info + 64, 8);
      this.runtime.fillBytes(info, 64, 0);
      this.runtime.writeUint64(info, BigInt(object.address));
      this.runtime.writeUint64(info + 8, BigInt(this.hostString(object.path)));
      this.runtime.writeUint64(info + 16, BigInt(object.address + object.elf.programOffset));
      const phnum = new Uint8Array(2);
      new DataView(phnum.buffer).setUint16(0, object.elf.programHeaders.length, true);
      this.runtime.writeBytes(info + 24, phnum);
      result = this.executeGuestCallback(callback, [BigInt(info), 64n, data]);
      if (result || this.exited) break;
    }
    this.currentHostDetail = { callback, objectCount: objects.length, callbackResult: result };
    return result;
  }

  hostSystemPropertyGet(snapshot) {
    const name = this.runtime.readCString(Number(snapshot.arguments[0]));
    const values = {
      'ro.build.version.release': '13',
      'ro.build.version.sdk': '33',
      'ro.build.id': 'TQ3A.230805.001',
      'ro.product.cpu.abi': 'arm64-v8a',
      'ro.hardware': 'panther',
      'ro.build.type': 'user',
      'ro.secure': '1',
      'ro.debuggable': '0',
      'ro.product.manufacturer': 'Google',
      'ro.product.model': 'Pixel 7',
      'ro.build.fingerprint': 'google/panther/panther:13/TQ3A.230805.001/10316531:user/release-keys',
    };
    const value = values[name] ?? '';
    this.currentHostDetail = { property: name, value };
    const bytes = new TextEncoder().encode(`${value}\0`);
    this.runtime.writeBytes(Number(snapshot.arguments[1]), bytes);
    return BigInt(bytes.length - 1);
  }

  readUint32(address) {
    return new DataView(this.runtime.readBytes(address, 4).buffer).getUint32(0, true);
  }

  writeUint32(address, value) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value, true);
    this.runtime.writeBytes(address, bytes);
  }

  readUint64(address) {
    return new DataView(this.runtime.readBytes(address, 8).buffer).getBigUint64(0, true);
  }

  hostInflateInit(snapshot) {
    const streamAddress = Number(snapshot.arguments[0]);
    const windowBits = Number(BigInt.asIntN(32, snapshot.arguments[1]));
    const streamSize = Number(snapshot.arguments[3]);
    this.currentHostDetail = { streamAddress, windowBits, streamSize };
    if (!streamAddress || streamSize < 104) return -2n;
    this.inflateStreams.set(streamAddress, {
      windowBits,
      compressed: new Uint8Array(),
      decoded: null,
      emitted: 0,
    });
    this.runtime.writeUint64(streamAddress + 56, BigInt(streamAddress));
    return 0n;
  }

  hostInflate(snapshot) {
    const streamAddress = Number(snapshot.arguments[0]);
    const stream = this.inflateStreams.get(streamAddress);
    if (!stream) return -2n;
    const inputAddress = Number(this.readUint64(streamAddress));
    const inputLength = this.readUint32(streamAddress + 8);
    const outputAddress = Number(this.readUint64(streamAddress + 24));
    const outputLength = this.readUint32(streamAddress + 32);
    if (inputLength) {
      const combined = new Uint8Array(stream.compressed.length + inputLength);
      combined.set(stream.compressed);
      combined.set(this.runtime.readBytes(inputAddress, inputLength), stream.compressed.length);
      stream.compressed = combined;
      this.runtime.writeUint64(streamAddress, BigInt(inputAddress + inputLength));
      this.writeUint32(streamAddress + 8, 0);
      this.runtime.writeUint64(streamAddress + 16, this.readUint64(streamAddress + 16) + BigInt(inputLength));
    }
    if (!stream.decoded) {
      try {
        stream.decoded = inflateBytes(stream.compressed, stream.windowBits);
      } catch (error) {
        if (isIncompleteInflate(error)) return inputLength ? 0n : -5n;
        this.currentHostDetail = { streamAddress, error: error instanceof Error ? error.message : String(error) };
        return -3n;
      }
    }
    const count = Math.min(outputLength, stream.decoded.length - stream.emitted);
    if (count) this.runtime.writeBytes(outputAddress, stream.decoded.subarray(stream.emitted, stream.emitted + count));
    stream.emitted += count;
    this.runtime.writeUint64(streamAddress + 24, BigInt(outputAddress + count));
    this.writeUint32(streamAddress + 32, outputLength - count);
    this.runtime.writeUint64(streamAddress + 40, BigInt(stream.emitted));
    this.currentHostDetail = { streamAddress, inputLength, outputLength: count, totalOutput: stream.decoded.length };
    return stream.emitted === stream.decoded.length ? 1n : 0n;
  }

  hostInflateEnd(snapshot) {
    const streamAddress = Number(snapshot.arguments[0]);
    const existed = this.inflateStreams.delete(streamAddress);
    if (streamAddress) this.runtime.writeUint64(streamAddress + 56, 0n);
    return existed ? 0n : -2n;
  }

  serviceHostcall(snapshot) {
    const address = Number(snapshot.address);
    const name = this.hostBridgeNames.get(address);
    const handler = name ? this.hostImports.get(name) : null;
    if (!handler) throw new Error(`Unknown host bridge at 0x${address.toString(16)}`);
    this.currentHostDetail = null;
    const result = BigInt(handler(snapshot));
    const event = {
      name: 'hostcall',
      symbol: name,
      result,
      pc: snapshot.pc,
      caller: this.runtime.exports.arm64_get_register(30),
      ...this.currentHostDetail,
    };
    this.hostCallCounts.set(name, (this.hostCallCounts.get(name) ?? 0) + 1);
    if (name.startsWith('AAsset')) {
      this.recentAssetEvents.push({
        symbol: name,
        requestedName: event.requestedName ?? null,
        path: event.path ?? null,
        length: event.length ?? null,
        result: Number(result),
      });
      if (this.recentAssetEvents.length > 30) this.recentAssetEvents.shift();
    }
    this.events.push(event);
    this.onEvent?.(event);
    this.runtime.exports.arm64_set_register(0, result);
    this.runtime.exports.arm64_resume();
  }

  buildProcMaps() {
    const entries = (this.runtime.loadedElf?.loadSegments || []).map((segment) => {
      const start = this.runtime.loadBias + segment.virtualAddress;
      const permissions = `${segment.flags & 4 ? 'r' : '-'}${segment.flags & 2 ? 'w' : '-'}${segment.flags & 1 ? 'x' : '-'}p`;
      return { address: start, line: `${start.toString(16).padStart(8, '0')}-${(start + segment.memorySize).toString(16).padStart(8, '0')} ${permissions} ${segment.fileOffset.toString(16).padStart(8, '0')} 00:00 0 ${this.libraryPath}` };
    });
    entries.push(...this.sharedObjects.flatMap((object) => object.elf.loadSegments.map((segment) => {
      const start = object.address + segment.virtualAddress;
      const permissions = `${segment.flags & 4 ? 'r' : '-'}${segment.flags & 2 ? 'w' : '-'}${segment.flags & 1 ? 'x' : '-'}p`;
      return { address: start, line: `${start.toString(16).padStart(8, '0')}-${(start + segment.memorySize).toString(16).padStart(8, '0')} ${permissions} ${segment.fileOffset.toString(16).padStart(8, '0')} 00:00 0 ${object.path}` };
    })));
    entries.push({ address: 0x3d00000, line: '03d00000-04000000 rw-p 00000000 00:00 0 [stack]' });
    entries.push(...this.mappings.map((mapping) => {
        const permissions = `${mapping.protection & 1 ? 'r' : '-'}${mapping.protection & 2 ? 'w' : '-'}${mapping.protection & 4 ? 'x' : '-'}p`;
        return { address: mapping.address, line: `${mapping.address.toString(16).padStart(8, '0')}-${(mapping.address + mapping.length).toString(16).padStart(8, '0')} ${permissions} 00000000 00:00 0` };
      }));
    entries.sort((left, right) => left.address - right.address);
    return new TextEncoder().encode(`${entries.map((entry) => entry.line).join('\n')}\n`);
  }

  resolveOpenPath(directoryFd, path) {
    if (path.startsWith('/')) return normalizePath(path);
    if (directoryFd === AT_FDCWD) return normalizePath(`/${path}`);
    const directory = this.descriptors.get(Number(directoryFd));
    return normalizePath(`${directory?.path || '/'}/${path}`);
  }

  isValidGuestRange(address, length) {
    return Number.isSafeInteger(address) && Number.isSafeInteger(length) &&
      address >= 0 && length >= 0 && address + length <= 0x7fffffff;
  }

  writeStat(address, size, directory = false) {
    // Linux arm64 struct stat is 128 bytes. The shell mostly needs a stable size.
    const bytes = new Uint8Array(128);
    const view = new DataView(bytes.buffer);
    view.setBigUint64(48, BigInt(size), true); // st_size
    view.setUint32(16, directory ? 0x41ed : 0x81a4, true); // directory 0755 or regular file 0644
    this.runtime.writeBytes(address, bytes);
  }

  service(snapshot) {
    const [x0, x1, x2, x3, x4, x5] = snapshot.arguments;
    const event = {
      number: snapshot.number,
      name: 'unknown',
      result: -38n,
      pc: Number(snapshot.pc),
      svcAddress: Number(snapshot.svcAddress),
    };
    let result = -38n; // ENOSYS
    let shouldResume = true;

    switch (snapshot.number) {
      case AARCH64_SYSCALL.MKDIRAT: {
        event.name = 'mkdirat';
        const path = this.resolveOpenPath(signed(x0), this.runtime.readCString(Number(x1)));
        event.path = path;
        if (this.directories.has(path)) result = -17n;
        else { this.directories.add(path); result = 0n; }
        break;
      }
      case AARCH64_SYSCALL.UNLINKAT: {
        event.name = 'unlinkat';
        const path = this.resolveOpenPath(signed(x0), this.runtime.readCString(Number(x1)));
        const removeDirectory = (Number(x2) & 0x200) !== 0;
        Object.assign(event, { path, removeDirectory });
        if (removeDirectory) {
          if (!this.directories.has(path)) result = -2n;
          else if (this.directoryEntries(path).length) result = -39n;
          else { this.directories.delete(path); result = 0n; }
        } else if (!this.files.has(path)) result = -2n;
        else { this.files.delete(path); result = 0n; }
        break;
      }
      case AARCH64_SYSCALL.OPENAT: {
        event.name = 'openat';
        const requested = this.runtime.readCString(Number(x1));
        const path = this.resolveOpenPath(signed(x0), requested);
        const flags = Number(x2);
        let data = path === '/proc/self/maps' ? this.buildProcMaps()
          : path === '/proc/self/environ' ? this.buildProcEnviron()
            : path === '/proc/self/mounts' || path === '/proc/mounts' ? this.buildProcMounts()
            : path === '/proc/self/cmdline' || path === `/proc/${this.pid}/cmdline` ? new TextEncoder().encode(`${this.processName}\0`)
            : this.files.get(path);
        const directory = this.directories.has(path);
        event.path = path;
        event.flags = flags;
        event.fileSize = data?.length ?? (directory ? 0 : null);
        if (!data && !directory && (flags & O_CREAT)) {
          data = new Uint8Array();
          this.files.set(path, data);
        } else if (data && !directory && (flags & O_TRUNC)) {
          data = new Uint8Array();
          this.files.set(path, data);
          for (const openDescriptor of this.descriptors.values()) {
            if (!openDescriptor.directory && openDescriptor.path === path) openDescriptor.data = data;
          }
        }
        if (data || directory) {
          const fd = this.nextDescriptor++;
          this.descriptors.set(fd, { path, data: data ?? new Uint8Array(), offset: 0, directory, openFlags: flags });
          this.descriptorFlags.set(fd, 0);
          result = BigInt(fd);
        } else result = -2n;
        break;
      }
      case AARCH64_SYSCALL.READ: {
        event.name = 'read';
        const fd = Number(x0);
        const descriptor = this.descriptors.get(fd);
        event.fd = fd;
        event.path = descriptor?.path ?? null;
        event.address = Number(x1);
        event.count = Number(x2);
        event.fileOffset = descriptor?.offset ?? null;
        if (!descriptor) result = -9n;
        else if (descriptor.directory) result = -21n;
        else {
          const count = Math.min(Number(x2), descriptor.data.length - descriptor.offset);
          event.firstBytes = Array.from(
            descriptor.data.subarray(descriptor.offset, descriptor.offset + Math.min(count, 32)),
            (value) => value.toString(16).padStart(2, '0'),
          ).join('');
          this.runtime.writeBytes(Number(x1), descriptor.data.subarray(descriptor.offset, descriptor.offset + count));
          descriptor.offset += count;
          result = BigInt(count);
        }
        break;
      }
      case AARCH64_SYSCALL.GETDENTS64: {
        event.name = 'getdents64';
        const fd = Number(x0);
        const descriptor = this.descriptors.get(fd);
        event.fd = fd;
        if (!descriptor) result = -9n;
        else if (!descriptor.directory) result = -20n;
        else {
          const entries = this.directoryEntries(descriptor.path);
          const entry = entries[descriptor.offset];
          if (!entry) result = 0n;
          else {
            const name = new TextEncoder().encode(`${entry[0]}\0`);
            const recordLength = alignUp(19 + name.length, 8);
            if (recordLength > Number(x2)) result = -22n;
            else {
              const bytes = new Uint8Array(recordLength);
              const view = new DataView(bytes.buffer);
              view.setBigUint64(0, BigInt(descriptor.offset + 1), true);
              view.setBigInt64(8, BigInt(descriptor.offset + 1), true);
              view.setUint16(16, recordLength, true);
              view.setUint8(18, entry[1]);
              bytes.set(name, 19);
              this.runtime.writeBytes(Number(x1), bytes);
              descriptor.offset += 1;
              result = BigInt(recordLength);
              event.entry = entry[0];
            }
          }
        }
        break;
      }
      case AARCH64_SYSCALL.LSEEK: {
        event.name = 'lseek';
        const fd = Number(x0);
        const descriptor = this.descriptors.get(fd);
        const offset = Number(signed(x1));
        const whence = Number(x2);
        event.fd = fd;
        event.path = descriptor?.path ?? null;
        event.fileOffset = descriptor?.offset ?? null;
        if (!descriptor) result = -9n;
        else {
          const base = whence === SEEK_SET ? 0 : whence === SEEK_CUR ? descriptor.offset : whence === SEEK_END ? descriptor.data.length : null;
          if (base === null || base + offset < 0) result = -22n;
          else {
            descriptor.offset = base + offset;
            event.nextFileOffset = descriptor.offset;
            result = BigInt(descriptor.offset);
          }
        }
        break;
      }
      case AARCH64_SYSCALL.CLOSE: {
        event.name = 'close';
        const fd = Number(x0);
        event.path = this.descriptors.get(fd)?.path ?? null;
        result = this.descriptors.delete(fd) ? 0n : -9n;
        this.descriptorFlags.delete(fd);
        event.fd = fd;
        break;
      }
      case AARCH64_SYSCALL.FCNTL: {
        event.name = 'fcntl';
        const fd = Number(x0);
        const command = Number(x1);
        const argument = Number(x2);
        const descriptor = this.descriptors.get(fd);
        Object.assign(event, { fd, command, argument });
        if (!descriptor) {
          result = -9n;
          break;
        }
        switch (command) {
          case 0: // F_DUPFD
          case 1030: { // F_DUPFD_CLOEXEC
            if (argument < 0) {
              result = -22n;
              break;
            }
            let duplicate = Math.max(3, argument);
            while (this.descriptors.has(duplicate)) duplicate += 1;
            this.descriptors.set(duplicate, descriptor);
            this.descriptorFlags.set(duplicate, command === 1030 ? 1 : 0);
            this.nextDescriptor = Math.max(this.nextDescriptor, duplicate + 1);
            result = BigInt(duplicate);
            event.duplicate = duplicate;
            break;
          }
          case 1: // F_GETFD
            result = BigInt(this.descriptorFlags.get(fd) ?? 0);
            break;
          case 2: // F_SETFD
            this.descriptorFlags.set(fd, argument & 1);
            result = 0n;
            break;
          case 3: // F_GETFL
            result = BigInt(descriptor.openFlags ?? 0);
            break;
          case 4: // F_SETFL
            descriptor.openFlags = (descriptor.openFlags ?? 0) & 3 | argument & ~3;
            result = 0n;
            break;
          default:
            result = -22n;
            break;
        }
        break;
      }
      case AARCH64_SYSCALL.INOTIFY_INIT1: {
        event.name = 'inotify_init1';
        event.flags = Number(x0);
        const fd = this.nextDescriptor++;
        this.descriptors.set(fd, {
          path: '[inotify]',
          data: new Uint8Array(),
          offset: 0,
          directory: false,
          openFlags: event.flags,
          inotify: true,
          watches: new Map(),
          nextWatch: 1,
        });
        this.descriptorFlags.set(fd, event.flags & 0x80000 ? 1 : 0);
        result = BigInt(fd);
        event.fd = fd;
        break;
      }
      case AARCH64_SYSCALL.INOTIFY_ADD_WATCH: {
        event.name = 'inotify_add_watch';
        const fd = Number(x0);
        const descriptor = this.descriptors.get(fd);
        const path = this.runtime.readCString(Number(x1));
        Object.assign(event, { fd, path, mask: Number(x2) });
        if (!descriptor?.inotify) result = -9n;
        else if (!path) result = -2n;
        else {
          const existing = [...descriptor.watches.entries()].find(([, watch]) => watch.path === path);
          const watch = existing?.[0] ?? descriptor.nextWatch++;
          descriptor.watches.set(watch, { path, mask: Number(x2) });
          result = BigInt(watch);
          event.watch = watch;
        }
        break;
      }
      case AARCH64_SYSCALL.INOTIFY_RM_WATCH: {
        event.name = 'inotify_rm_watch';
        const fd = Number(x0);
        const watch = Number(x1);
        const descriptor = this.descriptors.get(fd);
        Object.assign(event, { fd, watch });
        if (!descriptor?.inotify) result = -9n;
        else result = descriptor.watches.delete(watch) ? 0n : -22n;
        break;
      }
      case AARCH64_SYSCALL.FCHMOD:
        event.name = 'fchmod';
        event.fd = Number(x0);
        event.mode = Number(x1);
        result = this.descriptors.has(event.fd) ? 0n : -9n;
        break;
      case AARCH64_SYSCALL.MMAP: {
        event.name = 'mmap';
        const requested = Number(x0);
        const length = alignUp(Number(x1));
        const protection = Number(x2);
        const flags = Number(x3);
        const fd = Number(signed(x4));
        const fileOffset = Number(x5);
        const fixed = (flags & 0x10) !== 0;
        if (!Number.isSafeInteger(length) || length <= 0 || length > 0x40000000) {
          throw new Error(
            `invalid guest mmap at 0x${Number(event.pc).toString(16)}: ` +
            `requested=0x${requested.toString(16)}, length=0x${length.toString(16)}, ` +
            `protection=0x${protection.toString(16)}, flags=0x${flags.toString(16)}, ` +
            `fd=${fd}, offset=0x${fileOffset.toString(16)}, ` +
            `caller=0x${Number(this.runtime.exports.arm64_get_register(30)).toString(16)}`,
          );
        }
        const address = fixed && requested
          ? requested
          : requested && this.isAddressRangeAvailable(requested, length)
            ? requested
            : this.findAvailableMapAddress(length);
        if (!Number.isSafeInteger(address) || address < 0 || address + length > 0x40000000) {
          throw new Error(
            `out-of-range guest mmap at 0x${Number(event.pc).toString(16)}: ` +
            `requested=0x${requested.toString(16)}, selected=0x${address.toString(16)}, length=0x${length.toString(16)}, ` +
            `protection=0x${protection.toString(16)}, flags=0x${flags.toString(16)}, ` +
            `fd=${fd}, offset=0x${fileOffset.toString(16)}, ` +
            `caller=0x${Number(this.runtime.exports.arm64_get_register(30)).toString(16)}`,
          );
        }
        this.nextMapAddress = Math.max(this.nextMapAddress, address + length + PAGE_SIZE);
        this.runtime.ensureCapacity(address + length);
        this.runtime.fillBytes(address, length, 0);
        const descriptor = this.descriptors.get(fd);
        if (descriptor && fileOffset < descriptor.data.length) {
          this.runtime.writeBytes(address, descriptor.data.subarray(fileOffset, Math.min(fileOffset + length, descriptor.data.length)));
        }
        this.mappings.push({ address, length, protection, fd, fileOffset });
        Object.assign(event, { address, length, protection, flags, fd });
        result = BigInt(address);
        break;
      }
      case AARCH64_SYSCALL.MPROTECT: {
        event.name = 'mprotect';
        const address = Number(x0);
        const length = alignUp(Number(x1));
        const mapping = this.mappings.find((item) => address >= item.address && address < item.address + item.length);
        if (mapping) {
          mapping.protection = Number(x2);
          if (mapping.protection & 4) Object.defineProperty(mapping, 'executableBytes', {
            value: this.runtime.readBytes(mapping.address, mapping.length),
            writable: true,
            configurable: true,
            enumerable: false,
          });
        }
        Object.assign(event, { address, length, protection: Number(x2) });
        result = 0n;
        break;
      }
      case AARCH64_SYSCALL.MUNMAP: {
        event.name = 'munmap';
        const address = Number(x0);
        const requestedLength = Number(signed(x1));
        const length = requestedLength > 0 ? alignUp(requestedLength) : requestedLength;
        Object.assign(event, { address, length });
        if (!this.isValidGuestRange(address, length)) result = -22n;
        else {
          this.mappings = this.mappings.filter((item) => item.address !== address);
          this.runtime.fillBytes(address, length, 0);
          result = 0n;
        }
        break;
      }
      case AARCH64_SYSCALL.FSTAT: {
        event.name = 'fstat';
        const descriptor = this.descriptors.get(Number(x0));
        event.path = descriptor?.path ?? null;
        event.fileSize = descriptor?.data.length ?? null;
        if (!descriptor) result = -9n;
        else { this.writeStat(Number(x1), descriptor.data.length, descriptor.directory); result = 0n; }
        break;
      }
      case AARCH64_SYSCALL.NEWFSTATAT: {
        event.name = 'newfstatat';
        const path = this.resolveOpenPath(signed(x0), this.runtime.readCString(Number(x1)));
        const data = this.files.get(path);
        const directory = this.directories.has(path);
        event.path = path;
        event.fileSize = data?.length ?? (directory ? 0 : null);
        if (!data && !directory) result = -2n;
        else { this.writeStat(Number(x2), data?.length ?? 0, directory); result = 0n; }
        break;
      }
      case AARCH64_SYSCALL.GETPID:
      case AARCH64_SYSCALL.GETTID:
        event.name = snapshot.number === AARCH64_SYSCALL.GETPID ? 'getpid' : 'gettid';
        result = BigInt(this.pid);
        break;
      case AARCH64_SYSCALL.CLOCK_GETTIME: {
        event.name = 'clock_gettime';
        const now = 1720000000n;
        const view = new DataView(new ArrayBuffer(16));
        view.setBigInt64(0, now, true);
        view.setBigInt64(8, 0n, true);
        this.runtime.writeBytes(Number(x1), new Uint8Array(view.buffer));
        result = 0n;
        break;
      }
      case AARCH64_SYSCALL.NANOSLEEP:
        event.name = 'nanosleep';
        result = 0n;
        break;
      case AARCH64_SYSCALL.KILL:
        event.name = 'kill';
        event.pid = Number(signed(x0));
        event.signal = Number(x1);
        if (event.pid === this.pid && event.signal) {
          this.exited = true;
          this.exitCode = 128 + event.signal;
        }
        result = event.pid === this.pid ? 0n : -3n;
        break;
      case AARCH64_SYSCALL.SETRLIMIT:
        event.name = 'setrlimit';
        result = 0n;
        break;
      case AARCH64_SYSCALL.WRITE:
        event.name = 'write';
        event.fd = Number(x0);
        event.path = this.descriptors.get(event.fd)?.path ?? null;
        event.count = Number(x2);
        event.linkRegister = this.runtime.exports.arm64_get_register(30);
        event.recentCalls = Array.from({ length: 32 }, (_, age) => ({
          pc: Number(this.runtime.exports.arm64_get_recent_call_pc(age)),
          target: Number(this.runtime.exports.arm64_get_recent_call_target(age)),
        })).filter((call) => call.pc);
        event.registers = Array.from({ length: 31 }, (_, index) => Number(this.runtime.exports.arm64_get_register(index)));
        event.registerWritePcs = Array.from({ length: 31 }, (_, index) => Number(this.runtime.exports.arm64_get_register_write_pc(index)));
        event.recentValue60Writes = Array.from({ length: 32 }, (_, age) => ({
          pc: Number(this.runtime.exports.arm64_get_recent_value_60_write_pc(age)),
          register: Number(this.runtime.exports.arm64_get_recent_value_60_write_register(age)),
        })).filter((write) => write.pc);
        event.firstX28Value60WritePc = Number(this.runtime.exports.arm64_get_first_x28_value_60_write_pc());
        event.text = new TextDecoder().decode(this.runtime.readBytes(Number(x1), Number(x2)));
        if (this.descriptors.has(event.fd)) {
          const descriptor = this.descriptors.get(event.fd);
          if (descriptor.directory) result = -21n;
          else {
            const incoming = this.runtime.readBytes(Number(x1), event.count);
            const required = descriptor.offset + incoming.length;
            if (required > descriptor.data.length) {
              const expanded = new Uint8Array(required);
              expanded.set(descriptor.data);
              descriptor.data = expanded;
              for (const openDescriptor of this.descriptors.values()) {
                if (!openDescriptor.directory && openDescriptor.path === descriptor.path) {
                  openDescriptor.data = expanded;
                }
              }
            }
            descriptor.data.set(incoming, descriptor.offset);
            descriptor.offset += incoming.length;
            this.files.set(descriptor.path, descriptor.data);
            result = BigInt(incoming.length);
          }
        } else result = x2;
        break;
      case AARCH64_SYSCALL.EXIT:
        event.name = 'exit';
        if (this.guestCallbackDepth > 0 && this.runtime.exports.arm64_terminate_callback(x0)) {
          event.threadLocal = true;
          result = 0n;
          shouldResume = false;
          break;
        }
        // SYS_exit terminates only the calling Linux thread. The emulated native
        // thread lives inside an Android process whose other runtime threads are
        // outside this CPU instance, so halt this context without exit_group.
        this.runtime.exports.arm64_halt(x0);
        event.threadLocal = true;
        result = 0n;
        shouldResume = false;
        break;
      case AARCH64_SYSCALL.EXIT_GROUP:
        event.name = 'exit_group';
        this.exited = true;
        this.exitCode = Number(x0);
        this.processExit = {
          code: this.exitCode,
          pc: Number(event.pc),
          caller: Number(this.runtime.exports.arm64_get_register(30)),
          recentCalls: Array.from({ length: 32 }, (_, age) => ({
            pc: Number(this.runtime.exports.arm64_get_recent_call_pc(age)),
            target: Number(this.runtime.exports.arm64_get_recent_call_target(age)),
          })).filter((call) => call.pc),
        };
        this.runtime.exports.arm64_halt(x0);
        result = 0n;
        shouldResume = false;
        break;
      default:
        break;
    }

    event.result = result;
    this.systemCallCounts.set(event.name, (this.systemCallCounts.get(event.name) ?? 0) + 1);
    if (['openat', 'read', 'write', 'close', 'unlinkat', 'mkdirat', 'fstat', 'newfstatat', 'lseek'].includes(event.name) && event.path) {
      this.recentFileEvents.push({
        name: event.name,
        path: event.path,
        flags: event.flags ?? null,
        count: event.count ?? null,
        fileSize: event.fileSize ?? null,
        fileOffset: event.fileOffset ?? null,
        nextFileOffset: event.nextFileOffset ?? null,
        firstBytes: event.firstBytes ?? null,
        result: Number(result),
      });
      if (this.recentFileEvents.length > 50) this.recentFileEvents.shift();
    }
    this.events.push(event);
    this.onEvent?.(event);
    if (shouldResume) {
      this.runtime.exports.arm64_set_register(0, result);
      this.runtime.exports.arm64_resume();
    }
    return event;
  }

  run(maximumInstructions = 5_000_000, maximumSyscalls = 10_000) {
    const startingSteps = Number(this.runtime.exports.arm64_get_steps());
    let syscalls = 0;
    let hostcalls = 0;
    while (!this.exited && syscalls < maximumSyscalls) {
      const consumed = Number(this.runtime.exports.arm64_get_steps()) - startingSteps;
      const remaining = maximumInstructions - consumed;
      if (remaining <= 0) break;
      const status = this.runtime.exports.arm64_run(Math.min(remaining, this.onSlice ? 10_000 : 100_000));
      this.onSlice?.({ status, instructions: Number(this.runtime.exports.arm64_get_steps()) - startingSteps });
      if (status === ARM64_STATUS.SYSCALL) {
        this.service(this.runtime.syscallSnapshot());
        syscalls += 1;
        continue;
      }
      if (status === ARM64_STATUS.HOSTCALL) {
        this.serviceHostcall(this.runtime.hostcallSnapshot());
        hostcalls += 1;
        continue;
      }
      if (status !== ARM64_STATUS.RUNNING) break;
    }
    return {
      status: this.runtime.exports.arm64_get_status(),
      instructions: Number(this.runtime.exports.arm64_get_steps()) - startingSteps,
      totalInstructions: Number(this.runtime.exports.arm64_get_steps()),
      syscalls,
      hostcalls,
      exited: this.exited,
      exitCode: this.exitCode,
      pc: this.runtime.exports.arm64_get_pc(),
      faultAddress: this.runtime.exports.arm64_get_fault_address(),
      lastInstruction: this.runtime.exports.arm64_get_last_instruction(),
      events: this.events,
    };
  }

  async runAsync(maximumInstructions = 5_000_000, maximumSyscalls = 10_000, options = {}) {
    const startingSteps = Number(this.runtime.exports.arm64_get_steps());
    const instructionsPerYield = options.instructionsPerYield ?? 1_000_000;
    const instructionsPerSlice = options.instructionsPerSlice ?? 100_000;
    let nextYield = instructionsPerYield;
    let syscalls = 0;
    let hostcalls = 0;
    while (!this.exited && syscalls < maximumSyscalls) {
      const consumed = Number(this.runtime.exports.arm64_get_steps()) - startingSteps;
      const remaining = maximumInstructions - consumed;
      if (remaining <= 0) break;
      const status = this.runtime.exports.arm64_run(Math.min(remaining, instructionsPerSlice));
      if (status === ARM64_STATUS.SYSCALL) {
        const event = this.service(this.runtime.syscallSnapshot());
        options.onEvent?.(event);
        syscalls += 1;
      } else if (status === ARM64_STATUS.HOSTCALL) {
        this.serviceHostcall(this.runtime.hostcallSnapshot());
        options.onEvent?.(this.events.at(-1));
        hostcalls += 1;
      } else if (status !== ARM64_STATUS.RUNNING) break;
      options.onSlice?.({ status, instructions: Number(this.runtime.exports.arm64_get_steps()) - startingSteps });

      const current = Number(this.runtime.exports.arm64_get_steps()) - startingSteps;
      if (current >= nextYield) {
        options.onProgress?.({ instructions: current, syscalls, hostcalls });
        nextYield = current + instructionsPerYield;
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    return {
      status: this.runtime.exports.arm64_get_status(),
      instructions: Number(this.runtime.exports.arm64_get_steps()) - startingSteps,
      totalInstructions: Number(this.runtime.exports.arm64_get_steps()),
      syscalls,
      hostcalls,
      exited: this.exited,
      exitCode: this.exitCode,
      pc: this.runtime.exports.arm64_get_pc(),
      faultAddress: this.runtime.exports.arm64_get_fault_address(),
      lastInstruction: this.runtime.exports.arm64_get_last_instruction(),
      events: this.events,
    };
  }
}
