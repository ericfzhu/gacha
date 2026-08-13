const JNI_VERSION_1_6 = 0x00010006n;
const JNI_OK = 0n;
const JNI_ERR = -1n;

const ENV_SLOTS = 233;
const VM_SLOTS = 8;

const ENV_INDEX = Object.freeze({
  GetVersion: 4,
  FindClass: 6,
  ExceptionOccurred: 15,
  ExceptionDescribe: 16,
  ExceptionClear: 17,
  NewGlobalRef: 21,
  DeleteGlobalRef: 22,
  DeleteLocalRef: 23,
  IsSameObject: 24,
  NewLocalRef: 25,
  GetObjectClass: 31,
  IsInstanceOf: 32,
  GetMethodID: 33,
  CallObjectMethodV: 35,
  CallBooleanMethodV: 38,
  CallIntMethodV: 50,
  CallLongMethodV: 53,
  CallFloatMethodV: 56,
  CallDoubleMethodV: 59,
  CallVoidMethodV: 62,
  GetArrayLength: 171,
  NewByteArray: 176,
  NewIntArray: 179,
  GetByteArrayElements: 184,
  GetIntArrayElements: 187,
  ReleaseByteArrayElements: 192,
  ReleaseIntArrayElements: 195,
  GetByteArrayRegion: 200,
  GetIntArrayRegion: 203,
  SetByteArrayRegion: 208,
  SetIntArrayRegion: 211,
  NewStringUTF: 167,
  GetStringUTFLength: 168,
  GetStringUTFChars: 169,
  ReleaseStringUTFChars: 170,
  RegisterNatives: 215,
  UnregisterNatives: 216,
  GetJavaVM: 219,
  GetPrimitiveArrayCritical: 222,
  ReleasePrimitiveArrayCritical: 223,
  ExceptionCheck: 228,
});

const VM_INDEX = Object.freeze({
  DestroyJavaVM: 3,
  AttachCurrentThread: 4,
  DetachCurrentThread: 5,
  GetEnv: 6,
  AttachCurrentThreadAsDaemon: 7,
});

export class VirtualJni {
  constructor(linux, options = {}) {
    this.linux = linux;
    this.runtime = linux.runtime;
    this.baseAddress = options.baseAddress ?? 0x7d00000;
    this.envTableAddress = this.baseAddress;
    this.envAddress = this.baseAddress + 0x1000;
    this.vmTableAddress = this.baseAddress + 0x2000;
    this.vmAddress = this.baseAddress + 0x3000;
    this.nextObjectAddress = this.baseAddress + 0x4000;
    this.nextNativeAddress = this.baseAddress + 0x10000;
    this.objects = new Map();
    this.classHandles = new Map();
    this.methodHandles = new Map();
    this.stringHandles = new Map();
    this.nativeRegistrations = [];
    this.calls = [];
    this.elapsedRealtime = options.elapsedRealtimeStart ?? 1_000_000;
    this.elapsedRealtimeStep = options.elapsedRealtimeStep ?? 1;
    this.systemFont = {
      width: 64,
      height: 64,
      textSize: 16,
      color: [0, 0, 0, 255],
      boldStroke: false,
      canvas: null,
      context: null,
      cache: new Map(),
    };
    this.install();
  }

  resolveString(handle) {
    return this.objects.get(Number(handle))?.value ?? '';
  }

  stringHandle(value) {
    const string = String(value);
    let handle = this.stringHandles.get(string);
    if (!handle) {
      handle = this.allocateObject({ type: 'string', value: string, className: 'java/lang/String' });
      this.stringHandles.set(string, handle);
    }
    return handle;
  }

  applicationPath(kind, childHandle) {
    const root = kind === 'cache'
      ? '/data/user/0/jp.gungho.pad/cache/'
      : '/data/user/0/jp.gungho.pad/files/';
    const child = childHandle ? this.resolveString(childHandle).replace(/^\/+/, '') : '';
    return `${root}${child}`;
  }

  systemFontContext() {
    if (this.systemFont.context) return this.systemFont.context;
    if (typeof OffscreenCanvas !== 'function') return null;
    this.systemFont.canvas = new OffscreenCanvas(this.systemFont.width, this.systemFont.height);
    this.systemFont.context = this.systemFont.canvas.getContext('2d', { willReadFrequently: true });
    return this.systemFont.context;
  }

  resetSystemFontBitmap() {
    this.systemFont.canvas = null;
    this.systemFont.context = null;
    this.systemFont.cache.clear();
  }

  configureSystemFontContext(context) {
    context.font = `${this.systemFont.textSize}px sans-serif`;
    context.textBaseline = 'alphabetic';
    context.textAlign = 'left';
  }

  measureSystemText(value) {
    const context = this.systemFontContext();
    if (!context) return Math.trunc(String(value).length * this.systemFont.textSize * 0.56);
    this.configureSystemFontContext(context);
    return Math.trunc(context.measureText(String(value)).width);
  }

  systemFontHeight() {
    const context = this.systemFontContext();
    if (!context) return Math.ceil(this.systemFont.textSize * 1.25);
    this.configureSystemFontContext(context);
    const metrics = context.measureText('Mg');
    const ascent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent ?? this.systemFont.textSize;
    const descent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent ?? this.systemFont.textSize * 0.25;
    return Math.trunc(Math.abs(ascent) + Math.abs(descent));
  }

  drawSystemFont(value, x, y) {
    const text = String(value);
    const key = `${this.systemFont.width}:${this.systemFont.height}:${this.systemFont.textSize}:${this.systemFont.color.join(',')}:${this.systemFont.boldStroke}:${x}:${y}:${text}`;
    const cached = this.systemFont.cache.get(key);
    if (cached) return cached;
    const byteLength = this.systemFont.width * this.systemFont.height * 4;
    const pixels = new Uint8Array(byteLength);
    const context = this.systemFontContext();
    if (context) {
      context.clearRect(0, 0, this.systemFont.width, this.systemFont.height);
      this.configureSystemFontContext(context);
      const [red, green, blue, alpha] = this.systemFont.color;
      context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;
      context.fillText(text, x, this.systemFont.textSize - y);
      if (this.systemFont.boldStroke) {
        context.strokeStyle = context.fillStyle;
        context.lineWidth = 1.2;
        context.strokeText(text, x, this.systemFont.textSize - y);
      }
      const rgba = context.getImageData(0, 0, this.systemFont.width, this.systemFont.height).data;
      // Android ARGB_8888 bitmap storage is BGRA in little-endian memory. The
      // native engine consumes copyPixelsToBuffer() directly.
      for (let index = 0; index < rgba.length; index += 4) {
        pixels[index] = rgba[index + 2];
        pixels[index + 1] = rgba[index + 1];
        pixels[index + 2] = rgba[index];
        pixels[index + 3] = rgba[index + 3];
      }
    }
    const handle = this.newPrimitiveArray('byte', byteLength);
    this.objects.get(handle).data.set(pixels);
    this.systemFont.cache.set(key, handle);
    return handle;
  }

  diagnostics() {
    const methodCounts = new Map();
    const unimplementedSlots = new Map();
    for (const call of this.calls) {
      if (call.methodName) methodCounts.set(call.methodName, (methodCounts.get(call.methodName) ?? 0) + 1);
      if (call.implemented === false) {
        const key = `${call.table}:${call.index}`;
        unimplementedSlots.set(key, (unimplementedSlots.get(key) ?? 0) + 1);
      }
    }
    return {
      calls: this.calls.length,
      methods: Object.fromEntries([...methodCounts].sort((left, right) => right[1] - left[1]).slice(0, 40)),
      unimplementedSlots: Object.fromEntries(unimplementedSlots),
      recentMethods: this.calls.filter((call) => call.methodName).slice(-20).map((call) => ({
        name: call.methodName,
        descriptor: call.descriptor,
        arguments: call.decodedArguments?.map((argument) => argument.value) ?? [],
      })),
      font: {
        width: this.systemFont.width,
        height: this.systemFont.height,
        textSize: this.systemFont.textSize,
        color: this.systemFont.color,
        cachedGlyphRuns: this.systemFont.cache.size,
      },
    };
  }

  advanceTime(milliseconds) {
    this.elapsedRealtime += Math.max(0, Math.trunc(milliseconds));
  }

  allocateObject(value) {
    const address = this.nextObjectAddress;
    this.nextObjectAddress += 8;
    this.runtime.ensureCapacity(this.nextObjectAddress);
    this.runtime.writeUint64(address, 0n);
    this.objects.set(address, value);
    return address;
  }

  classHandle(name) {
    let handle = this.classHandles.get(name);
    if (!handle) {
      handle = this.allocateObject({ type: 'class', name });
      this.classHandles.set(name, handle);
    }
    return handle;
  }

  methodHandle(classHandle, name, descriptor) {
    const key = `${classHandle}:${name}:${descriptor}`;
    let handle = this.methodHandles.get(key);
    if (!handle) {
      handle = this.allocateObject({
        type: 'method',
        className: this.objects.get(classHandle)?.name ?? 'java/lang/Object',
        name,
        descriptor,
      });
      this.methodHandles.set(key, handle);
    }
    return handle;
  }

  allocateNativeBytes(length, alignment = 8) {
    const address = Math.ceil(this.nextNativeAddress / alignment) * alignment;
    this.nextNativeAddress = address + Math.max(1, length);
    this.runtime.ensureCapacity(this.nextNativeAddress);
    this.runtime.fillBytes(address, Math.max(1, length), 0);
    return address;
  }

  newPrimitiveArray(type, length) {
    if (length < 0 || length > 0x10000000) return 0;
    const bytesPerElement = type === 'int' ? 4 : 1;
    return this.allocateObject({
      type: `${type}Array`,
      length,
      bytesPerElement,
      data: new Uint8Array(length * bytesPerElement),
      nativeAddress: 0,
    });
  }

  primitiveArrayRegion(snapshot, type, set) {
    const array = this.objects.get(Number(snapshot.arguments[1]));
    const start = Number(snapshot.arguments[2]);
    const length = Number(snapshot.arguments[3]);
    const sourceOrDestination = Number(snapshot.arguments[4]);
    const bytesPerElement = type === 'int' ? 4 : 1;
    if (!array || array.type !== `${type}Array` || start < 0 || length < 0 || start + length > array.length) return 0n;
    const byteStart = start * bytesPerElement;
    const byteLength = length * bytesPerElement;
    if (set) array.data.set(this.runtime.readBytes(sourceOrDestination, byteLength), byteStart);
    else this.runtime.writeBytes(sourceOrDestination, array.data.subarray(byteStart, byteStart + byteLength));
    return 0n;
  }

  primitiveArrayElements(snapshot, type) {
    const array = this.objects.get(Number(snapshot.arguments[1]));
    if (!array || array.type !== `${type}Array`) return 0n;
    if (!array.nativeAddress) array.nativeAddress = this.allocateNativeBytes(array.data.length);
    this.runtime.writeBytes(array.nativeAddress, array.data);
    if (snapshot.arguments[2]) this.runtime.writeBytes(Number(snapshot.arguments[2]), new Uint8Array([1]));
    return BigInt(array.nativeAddress);
  }

  releasePrimitiveArrayElements(snapshot, type) {
    const array = this.objects.get(Number(snapshot.arguments[1]));
    const address = Number(snapshot.arguments[2]);
    const mode = Number(snapshot.arguments[3]);
    if (array?.type === `${type}Array` && address && mode !== 2) {
      array.data.set(this.runtime.readBytes(address, array.data.length));
    }
    return 0n;
  }

  decodeMethodArguments(descriptor, vaList) {
    if (!descriptor || !vaList) return [];
    const types = [];
    for (let index = descriptor.indexOf('(') + 1; index < descriptor.indexOf(')');) {
      const start = index;
      while (descriptor[index] === '[') index += 1;
      if (descriptor[index] === 'L') index = descriptor.indexOf(';', index) + 1;
      else index += 1;
      types.push(descriptor.slice(start, index));
    }
    let { stack, grTop, vrTop, grOffset, vrOffset } = vaList;
    const readGeneral = () => {
      let address;
      if (grOffset < 0) { address = grTop + grOffset; grOffset += 8; }
      else { address = stack; stack += 8; }
      return new DataView(this.runtime.readBytes(address, 8).buffer).getBigUint64(0, true);
    };
    const readFloat = () => {
      let address;
      if (vrOffset < 0) { address = vrTop + vrOffset; vrOffset += 16; }
      else { address = stack; stack += 8; }
      return new DataView(this.runtime.readBytes(address, 8).buffer).getFloat64(0, true);
    };
    return types.map((type) => {
      if (type === 'F' || type === 'D') return { type, value: readFloat() };
      const raw = readGeneral();
      if (type === 'J') return { type, value: raw.toString() };
      if (type.startsWith('L') || type.startsWith('[')) return { type, value: Number(raw) };
      return { type, value: Number(BigInt.asIntN(32, raw)) };
    });
  }

  callMethod(snapshot, returnType) {
    const receiver = Number(snapshot.arguments[1]);
    const methodHandle = Number(snapshot.arguments[2]);
    const method = this.objects.get(methodHandle);
    const call = {
      table: 'jni',
      name: `Call${returnType}MethodV`,
      receiver,
      methodHandle,
      methodName: method?.name ?? null,
      descriptor: method?.descriptor ?? null,
      argumentsAddress: Number(snapshot.arguments[3]),
    };
    if (call.argumentsAddress) {
      const bytes = this.runtime.readBytes(call.argumentsAddress, 32);
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      call.vaList = {
        stack: Number(view.getBigUint64(0, true)),
        grTop: Number(view.getBigUint64(8, true)),
        vrTop: Number(view.getBigUint64(16, true)),
        grOffset: view.getInt32(24, true),
        vrOffset: view.getInt32(28, true),
      };
      call.decodedArguments = this.decodeMethodArguments(method?.descriptor, call.vaList);
    }
    this.calls.push(call);
    const decoded = call.decodedArguments ?? [];
    if (returnType === 'Void') {
      if (method?.name === '_izFontInitCGBitmapContextCreate') {
        this.systemFont.width = Math.max(1, decoded[1]?.value ?? 64);
        this.systemFont.height = Math.max(1, decoded[2]?.value ?? 64);
        this.resetSystemFontBitmap();
      } else if (method?.name === '_izFontInit' || method?.name === '_izFontExit') {
        this.resetSystemFontBitmap();
      } else if (method?.name === 'setColor' && decoded.length === 1) {
        const packed = decoded[0].value >>> 0;
        this.systemFont.color = [
          (packed >>> 16) & 0xff,
          (packed >>> 8) & 0xff,
          packed & 0xff,
          (packed >>> 24) & 0xff,
        ];
        this.systemFont.cache.clear();
      } else if (method?.name === 'setColor' && decoded.length === 4) {
        this.systemFont.color = [decoded[0].value, decoded[1].value, decoded[2].value, decoded[3].value]
          .map((component) => Math.max(0, Math.min(255, component)));
        this.systemFont.cache.clear();
      } else if (method?.name === 'setSize') {
        this.systemFont.boldStroke = decoded[0]?.value !== 0;
        this.systemFont.textSize = decoded[1]?.value < 0 ? 10 : Math.max(0.1, decoded[1]?.value ?? 16);
        this.systemFont.cache.clear();
      } else if (method?.name === '_izFileCreateNewFileDoc') {
        const path = this.applicationPath('files', decoded[0]?.value);
        const length = Math.max(0, decoded[1]?.value ?? 0);
        this.linux.mount(path, new Uint8Array(length));
      }
      return 0n;
    }
    if (returnType === 'Object') {
      if (!method) return 0n;
      if (method.name === '_drawSysFont') {
        const text = this.resolveString(decoded[0]?.value);
        return BigInt(this.drawSystemFont(text, decoded[1]?.value ?? 0, decoded[2]?.value ?? 0));
      }
      if (method.name === '_izFileGetPathDoc') {
        return BigInt(this.stringHandle(this.applicationPath('files', decoded[0]?.value)));
      }
      if (method.name === '_izFileGetPathCache' || method.name === '_izFileMakePathForCache') {
        return BigInt(this.stringHandle(this.applicationPath('cache', decoded[0]?.value)));
      }
      if (!method.resultHandle) {
        const isString = method.descriptor?.endsWith('Ljava/lang/String;');
        const isByteArray = method.descriptor?.endsWith('[B');
        const stringValues = {
          _izDevGetBuild_MODEL: 'Pixel 7',
          _izDevGetBuild_PRODUCT: 'panther',
          _izGetLanguage: 'ja',
          _izFileGetPathDoc: '/data/user/0/jp.gungho.pad/files',
        };
        method.resultHandle = isByteArray
          ? this.newPrimitiveArray('byte', 4)
          : this.allocateObject(isString
            ? { type: 'string', value: stringValues[method.name] ?? '', className: 'java/lang/String' }
            : { type: 'object', className: 'java/lang/Object', methodName: method.name });
      }
      return BigInt(method.resultHandle);
    }
    if (returnType === 'Float' || returnType === 'Double') {
      const encoded = new DataView(new ArrayBuffer(8));
      if (returnType === 'Float') encoded.setFloat32(0, method?.name === '_izDevGetDensity' ? 1 : 0, true);
      else encoded.setFloat64(0, 0, true);
      this.runtime.exports.arm64_set_vector_lo(0, encoded.getBigUint64(0, true));
      this.runtime.exports.arm64_set_vector_hi(0, 0n);
      return 0n;
    }
    if (returnType === 'Int') {
      if (method?.name === 'getHeight') return BigInt(this.systemFontHeight());
      if (method?.name === 'getWidth') return BigInt(this.measureSystemText(this.resolveString(decoded[0]?.value)));
      const values = { _izDevGetBuild_SDK_INT: 33, _izDevGetOsVerMajor: 13, _izDevGetOsVerMinor: 0 };
      return BigInt(values[method?.name] ?? 0);
    }
    if (returnType === 'Long' && method?.name === 'cTIMER_elapsedRealtime') {
      const value = this.elapsedRealtime;
      this.elapsedRealtime += this.elapsedRealtimeStep;
      return BigInt(value);
    }
    return 0n;
  }

  installTable(prefix, tableAddress, slots, handlers) {
    this.runtime.ensureCapacity(tableAddress + slots * 8);
    for (let index = 0; index < slots; index += 1) {
      const name = `${prefix}_${index}`;
      const handler = handlers.get(index) ?? ((snapshot) => {
        this.calls.push({ table: prefix, index, arguments: snapshot.arguments.map(Number), implemented: false });
        return 0n;
      });
      this.runtime.writeUint64(tableAddress + index * 8, BigInt(this.linux.registerHostImport(name, handler)));
    }
  }

  install() {
    const envHandlers = new Map([
      [ENV_INDEX.GetVersion, () => JNI_VERSION_1_6],
      [ENV_INDEX.FindClass, (snapshot) => {
        const name = this.runtime.readCString(Number(snapshot.arguments[1]));
        const result = BigInt(this.classHandle(name));
        this.calls.push({ table: 'jni', name: 'FindClass', className: name, result: Number(result) });
        return result;
      }],
      [ENV_INDEX.ExceptionOccurred, () => 0n],
      [ENV_INDEX.ExceptionDescribe, () => 0n],
      [ENV_INDEX.ExceptionClear, () => 0n],
      [ENV_INDEX.NewGlobalRef, (snapshot) => snapshot.arguments[1]],
      [ENV_INDEX.DeleteGlobalRef, () => 0n],
      [ENV_INDEX.DeleteLocalRef, () => 0n],
      [ENV_INDEX.IsSameObject, (snapshot) => snapshot.arguments[1] === snapshot.arguments[2] ? 1n : 0n],
      [ENV_INDEX.NewLocalRef, (snapshot) => snapshot.arguments[1]],
      [ENV_INDEX.GetObjectClass, (snapshot) => {
        const object = this.objects.get(Number(snapshot.arguments[1]));
        return BigInt(this.classHandle(object?.className ?? 'java/lang/Object'));
      }],
      [ENV_INDEX.IsInstanceOf, () => 1n],
      [ENV_INDEX.GetMethodID, (snapshot) => {
        const classHandle = Number(snapshot.arguments[1]);
        const name = this.runtime.readCString(Number(snapshot.arguments[2]));
        const descriptor = this.runtime.readCString(Number(snapshot.arguments[3]));
        const result = this.methodHandle(classHandle, name, descriptor);
        this.calls.push({
          table: 'jni',
          name: 'GetMethodID',
          className: this.objects.get(classHandle)?.name ?? null,
          methodName: name,
          descriptor,
          result,
        });
        return BigInt(result);
      }],
      [ENV_INDEX.CallObjectMethodV, (snapshot) => this.callMethod(snapshot, 'Object')],
      [ENV_INDEX.CallBooleanMethodV, (snapshot) => this.callMethod(snapshot, 'Boolean')],
      [ENV_INDEX.CallIntMethodV, (snapshot) => this.callMethod(snapshot, 'Int')],
      [ENV_INDEX.CallLongMethodV, (snapshot) => this.callMethod(snapshot, 'Long')],
      [ENV_INDEX.CallFloatMethodV, (snapshot) => this.callMethod(snapshot, 'Float')],
      [ENV_INDEX.CallDoubleMethodV, (snapshot) => this.callMethod(snapshot, 'Double')],
      [ENV_INDEX.CallVoidMethodV, (snapshot) => this.callMethod(snapshot, 'Void')],
      [ENV_INDEX.GetArrayLength, (snapshot) => BigInt(this.objects.get(Number(snapshot.arguments[1]))?.length ?? 0)],
      [ENV_INDEX.NewByteArray, (snapshot) => BigInt(this.newPrimitiveArray('byte', Number(snapshot.arguments[1])))],
      [ENV_INDEX.NewIntArray, (snapshot) => BigInt(this.newPrimitiveArray('int', Number(snapshot.arguments[1])))],
      [ENV_INDEX.GetByteArrayElements, (snapshot) => this.primitiveArrayElements(snapshot, 'byte')],
      [ENV_INDEX.GetIntArrayElements, (snapshot) => this.primitiveArrayElements(snapshot, 'int')],
      [ENV_INDEX.ReleaseByteArrayElements, (snapshot) => this.releasePrimitiveArrayElements(snapshot, 'byte')],
      [ENV_INDEX.ReleaseIntArrayElements, (snapshot) => this.releasePrimitiveArrayElements(snapshot, 'int')],
      [ENV_INDEX.GetByteArrayRegion, (snapshot) => this.primitiveArrayRegion(snapshot, 'byte', false)],
      [ENV_INDEX.GetIntArrayRegion, (snapshot) => this.primitiveArrayRegion(snapshot, 'int', false)],
      [ENV_INDEX.SetByteArrayRegion, (snapshot) => this.primitiveArrayRegion(snapshot, 'byte', true)],
      [ENV_INDEX.SetIntArrayRegion, (snapshot) => this.primitiveArrayRegion(snapshot, 'int', true)],
      [ENV_INDEX.NewStringUTF, (snapshot) => {
        const value = this.runtime.readCString(Number(snapshot.arguments[1]));
        return BigInt(this.allocateObject({ type: 'string', value }));
      }],
      [ENV_INDEX.GetStringUTFLength, (snapshot) => {
        const value = this.objects.get(Number(snapshot.arguments[1]))?.value ?? '';
        return BigInt(new TextEncoder().encode(value).length);
      }],
      [ENV_INDEX.GetStringUTFChars, (snapshot) => {
        const value = this.objects.get(Number(snapshot.arguments[1]))?.value ?? '';
        if (snapshot.arguments[2]) this.runtime.writeBytes(Number(snapshot.arguments[2]), new Uint8Array([1]));
        return BigInt(this.linux.hostString(value));
      }],
      [ENV_INDEX.ReleaseStringUTFChars, () => 0n],
      [ENV_INDEX.RegisterNatives, (snapshot) => this.registerNatives(snapshot)],
      [ENV_INDEX.UnregisterNatives, () => JNI_OK],
      [ENV_INDEX.GetJavaVM, (snapshot) => {
        if (!snapshot.arguments[1]) return JNI_ERR;
        this.runtime.writeUint64(Number(snapshot.arguments[1]), BigInt(this.vmAddress));
        return JNI_OK;
      }],
      [ENV_INDEX.GetPrimitiveArrayCritical, (snapshot) => {
        const array = this.objects.get(Number(snapshot.arguments[1]));
        const type = array?.type === 'intArray' ? 'int' : 'byte';
        return this.primitiveArrayElements(snapshot, type);
      }],
      [ENV_INDEX.ReleasePrimitiveArrayCritical, (snapshot) => {
        const array = this.objects.get(Number(snapshot.arguments[1]));
        const type = array?.type === 'intArray' ? 'int' : 'byte';
        return this.releasePrimitiveArrayElements(snapshot, type);
      }],
      [ENV_INDEX.ExceptionCheck, () => 0n],
    ]);
    const attach = (snapshot) => {
      if (!snapshot.arguments[1]) return JNI_ERR;
      this.runtime.writeUint64(Number(snapshot.arguments[1]), BigInt(this.envAddress));
      return JNI_OK;
    };
    const vmHandlers = new Map([
      [VM_INDEX.DestroyJavaVM, () => JNI_OK],
      [VM_INDEX.AttachCurrentThread, attach],
      [VM_INDEX.DetachCurrentThread, () => JNI_OK],
      [VM_INDEX.GetEnv, attach],
      [VM_INDEX.AttachCurrentThreadAsDaemon, attach],
    ]);

    this.installTable('jni', this.envTableAddress, ENV_SLOTS, envHandlers);
    this.installTable('jvm', this.vmTableAddress, VM_SLOTS, vmHandlers);
    this.runtime.writeUint64(this.envAddress, BigInt(this.envTableAddress));
    this.runtime.writeUint64(this.vmAddress, BigInt(this.vmTableAddress));
  }

  registerNatives(snapshot) {
    const classHandle = Number(snapshot.arguments[1]);
    const methodsAddress = Number(snapshot.arguments[2]);
    const count = Number(snapshot.arguments[3]);
    if (!methodsAddress || count < 0 || count > 4096) return JNI_ERR;
    const className = this.objects.get(classHandle)?.name ?? null;
    for (let index = 0; index < count; index += 1) {
      const entry = methodsAddress + index * 24;
      const nameAddress = Number(new DataView(this.runtime.readBytes(entry, 8).buffer).getBigUint64(0, true));
      const descriptorAddress = Number(new DataView(this.runtime.readBytes(entry + 8, 8).buffer).getBigUint64(0, true));
      const functionAddress = Number(new DataView(this.runtime.readBytes(entry + 16, 8).buffer).getBigUint64(0, true));
      this.nativeRegistrations.push({
        className,
        name: this.runtime.readCString(nameAddress),
        descriptor: this.runtime.readCString(descriptorAddress),
        functionAddress,
      });
    }
    this.calls.push({ table: 'jni', name: 'RegisterNatives', className, count });
    return JNI_OK;
  }
}

export { ENV_INDEX as JNI_ENV_INDEX, VM_INDEX as JNI_VM_INDEX };
