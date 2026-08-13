const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

const PAD_RUNTIME_ENTRIES = Object.freeze({
  libpad: 'lib/arm64-v8a/libpad.so',
  libopenal: 'lib/arm64-v8a/libopenal.so',
  lib6dba: 'lib/arm64-v8a/lib__6dba__.so',
  protectionData: 'assets/6dba/data1.dat',
});

import { inflateBytes } from './inflate.js';

function locateEndOfCentralDirectory(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minimum = Math.max(0, bytes.length - 0xffff - 22);
  for (let offset = bytes.length - 22; offset >= minimum; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) return offset;
  }
  throw new Error('The selected APK has no ZIP central directory.');
}

function indexZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  const end = locateEndOfCentralDirectory(bytes);
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);
  const entries = new Map();
  for (let index = 0; index < count; index += 1) {
    if (view.getUint32(offset, true) !== CENTRAL_SIGNATURE) throw new Error('Malformed APK ZIP directory.');
    const compression = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const size = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    entries.set(name, { compression, compressedSize, size, localOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function compressedEntryBytes(bytes, entry) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(entry.localOffset, true) !== LOCAL_SIGNATURE) throw new Error('Malformed APK local entry.');
  const nameLength = view.getUint16(entry.localOffset + 26, true);
  const extraLength = view.getUint16(entry.localOffset + 28, true);
  const start = entry.localOffset + 30 + nameLength + extraLength;
  return bytes.subarray(start, start + entry.compressedSize);
}

export class ApkArchive {
  constructor(bytes) {
    this.bytes = bytes;
    this.entries = indexZip(bytes);
    this.cache = new Map();
  }

  has(path) {
    return this.entries.has(path);
  }

  read(path) {
    const cached = this.cache.get(path);
    if (cached) return cached;
    const entry = this.entries.get(path);
    if (!entry) return null;
    const compressed = compressedEntryBytes(this.bytes, entry);
    let output;
    if (entry.compression === 0) output = compressed.slice();
    else if (entry.compression === 8) output = inflateBytes(compressed, -15);
    else throw new Error(`Unsupported APK compression method ${entry.compression}.`);
    if (output.length !== entry.size) throw new Error(`APK entry expanded to ${output.length} bytes; expected ${entry.size}.`);
    this.cache.set(path, output);
    return output;
  }
}

async function inflateEntry(bytes, entry) {
  const compressed = compressedEntryBytes(bytes, entry);
  if (entry.compression === 0) return compressed.slice();
  if (entry.compression !== 8 || typeof DecompressionStream === 'undefined') {
    throw new Error(`Unsupported APK compression method ${entry.compression}.`);
  }
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  const output = new Uint8Array(await new Response(stream).arrayBuffer());
  if (output.length !== entry.size) throw new Error(`APK entry expanded to ${output.length} bytes; expected ${entry.size}.`);
  return output;
}

export async function extractPadRuntimeFromApk(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const entries = indexZip(bytes);
  const output = {};
  for (const [key, path] of Object.entries(PAD_RUNTIME_ENTRIES)) {
    const entry = entries.get(path);
    if (!entry) throw new Error(`APK is missing ${path}.`);
    output[key] = await inflateEntry(bytes, entry);
  }
  // The native protection bootstrap stats and reads the installed package itself.
  // Preserve the exact signed APK rather than synthesizing an archive from entries.
  output.baseApk = bytes;
  return output;
}
