const INDEX_MAGIC = 'MCD5';
const IOSC_MAGIC = 'IOSC';
const TEX2_MAGIC = 'TEX2';
const RECORD_SIZE = 16;
const FIXED_NAME_SIZE = 16;

export const PAD_DATA_RECORD_FLAGS = Object.freeze({
  RESIDENT_DATA001: 0x8000,
  EXTERNAL_DOWNLOAD: 0x8002,
  RESIDENT_DATA002: 0x18000,
  COMPRESSED_DATA002: 0x18001,
  RESIDENT_DATA003: 0x28000,
});

function ascii(bytes, offset, maximumLength) {
  let end = offset;
  const limit = Math.min(bytes.length, offset + maximumLength);
  while (end < limit && bytes[end]) end += 1;
  return new TextDecoder('ascii').decode(bytes.subarray(offset, end));
}

function requireRange(bytes, offset, length, label) {
  if (!Number.isInteger(offset) || !Number.isInteger(length) || offset < 0 || length < 0 || offset + length > bytes.length) {
    throw new Error(`${label} range ${offset}+${length} exceeds ${bytes.length} bytes.`);
  }
}

function crc16Ccitt(bytes) {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = ((crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
    }
  }
  return crc;
}

export function decodeIosc(bytes, inflate) {
  if (ascii(bytes, 0, 4) !== IOSC_MAGIC) throw new Error('Asset is not a PAD IOSC stream.');
  if (bytes.length < 12) throw new Error('PAD IOSC header is truncated.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const method = bytes[4];
  const xorKey = bytes[5];
  const expectedCrc = view.getUint16(6, true);
  const expectedLength = view.getUint32(8, true);
  const payload = bytes.slice(12);
  for (let index = 0; index < payload.length; index += 1) payload[index] ^= xorKey;

  let output;
  if (method === 0) {
    output = payload.slice(0, expectedLength);
  } else if (method === 0x68) {
    if (typeof inflate !== 'function') throw new Error('PAD IOSC DEFLATE decoder is unavailable.');
    output = inflate(payload, -15);
  } else {
    throw new Error(`Unsupported PAD IOSC compression method 0x${method.toString(16)}.`);
  }
  if (output.length !== expectedLength) {
    throw new Error(`PAD IOSC expanded to ${output.length} bytes; expected ${expectedLength}.`);
  }
  const actualCrc = crc16Ccitt(output);
  if (actualCrc !== expectedCrc) {
    throw new Error(`PAD IOSC CRC mismatch: 0x${actualCrc.toString(16)} != 0x${expectedCrc.toString(16)}.`);
  }
  return output;
}

function classifyRecord(flags) {
  switch (flags) {
    case 0:
      return { kind: 'empty', containerIndex: null, compressed: false };
    case PAD_DATA_RECORD_FLAGS.RESIDENT_DATA001:
      return { kind: 'resident', containerIndex: 0, compressed: false };
    case PAD_DATA_RECORD_FLAGS.EXTERNAL_DOWNLOAD:
      return { kind: 'external', containerIndex: null, compressed: false };
    case PAD_DATA_RECORD_FLAGS.RESIDENT_DATA002:
      return { kind: 'resident', containerIndex: 1, compressed: false };
    case PAD_DATA_RECORD_FLAGS.COMPRESSED_DATA002:
      return { kind: 'resident', containerIndex: 1, compressed: true };
    case PAD_DATA_RECORD_FLAGS.RESIDENT_DATA003:
      return { kind: 'resident', containerIndex: 2, compressed: false };
    default:
      return { kind: 'unknown', containerIndex: null, compressed: false };
  }
}

export class PadDataArchive {
  constructor(indexBytes, nameBytes, containers = []) {
    this.indexBytes = indexBytes;
    this.nameBytes = nameBytes;
    this.containers = containers;
    const view = new DataView(indexBytes.buffer, indexBytes.byteOffset, indexBytes.byteLength);
    this.headerSize = view.getUint32(0, true);
    this.containerCount = view.getUint32(4, true);
    this.recordCount = view.getUint32(8, true);
    this.magic = ascii(indexBytes, 12, 4);
    if (this.magic !== INDEX_MAGIC) throw new Error(`Unsupported PAD data index magic ${JSON.stringify(this.magic)}.`);
    if (this.headerSize < 0x20 || this.headerSize > indexBytes.length) throw new Error(`Invalid PAD data header size ${this.headerSize}.`);
    requireRange(indexBytes, this.headerSize, this.recordCount * RECORD_SIZE, 'PAD data records');
    requireRange(nameBytes, 0, this.recordCount * FIXED_NAME_SIZE, 'PAD fixed names');

    this.containerNames = Array.from({ length: this.containerCount }, (_, index) =>
      ascii(indexBytes, 0x20 + index * FIXED_NAME_SIZE, FIXED_NAME_SIZE));
    this.records = Array.from({ length: this.recordCount }, (_, index) => {
      const offset = this.headerSize + index * RECORD_SIZE;
      const flags = view.getUint32(offset, true);
      const logicalLength = view.getUint32(offset + 4, true);
      const location = view.getUint32(offset + 8, true);
      const storedLength = view.getUint32(offset + 12, true);
      const classification = classifyRecord(flags);
      const fixedName = ascii(nameBytes, index * FIXED_NAME_SIZE, FIXED_NAME_SIZE);
      const name = classification.kind === 'external'
        ? ascii(indexBytes, location, indexBytes.length - location)
        : fixedName;
      return Object.freeze({
        index,
        flags,
        ...classification,
        name,
        fixedName,
        logicalLength,
        storedLength,
        offset: classification.kind === 'resident' ? location : null,
        nameOffset: classification.kind === 'external' ? location : null,
      });
    });
    this.byName = new Map(this.records.filter((record) => record.name).map((record) => [record.name.toLowerCase(), record]));
  }

  static fromApk(apkArchive) {
    const indexBytes = apkArchive.read('assets/DATA000.BIN');
    const nameBytes = apkArchive.read('assets/DATA000.NAM');
    if (!indexBytes || !nameBytes) throw new Error('APK is missing assets/DATA000.BIN or assets/DATA000.NAM.');
    const headerView = new DataView(indexBytes.buffer, indexBytes.byteOffset, indexBytes.byteLength);
    const containerCount = headerView.getUint32(4, true);
    const containerNames = Array.from({ length: containerCount }, (_, index) =>
      ascii(indexBytes, 0x20 + index * FIXED_NAME_SIZE, FIXED_NAME_SIZE));
    const containers = containerNames.map((name) => apkArchive.read(`assets/${name}`));
    return new PadDataArchive(indexBytes, nameBytes, containers);
  }

  find(name) {
    return this.byName.get(String(name).toLowerCase()) || null;
  }

  readStored(nameOrRecord) {
    const record = typeof nameOrRecord === 'string' ? this.find(nameOrRecord) : nameOrRecord;
    if (!record) return null;
    if (record.kind === 'external') throw new Error(`${record.name} is a download-only PAD asset and is not stored in this APK.`);
    if (record.kind !== 'resident') throw new Error(`${record.name || `record ${record.index}`} is not a readable resident asset.`);
    const container = this.containers[record.containerIndex];
    if (!container) throw new Error(`Missing ${this.containerNames[record.containerIndex]}.`);
    requireRange(container, record.offset, record.storedLength, record.name);
    return container.subarray(record.offset, record.offset + record.storedLength);
  }

  read(nameOrRecord, inflate = null) {
    const record = typeof nameOrRecord === 'string' ? this.find(nameOrRecord) : nameOrRecord;
    const stored = this.readStored(record);
    if (!record.compressed) return stored;
    const output = decodeIosc(stored, inflate);
    if (record.logicalLength && output.length !== record.logicalLength) {
      throw new Error(`${record.name} expanded to ${output.length} bytes; index expects ${record.logicalLength}.`);
    }
    return output;
  }

  summary() {
    const flags = {};
    const kinds = {};
    for (const record of this.records) {
      const flag = `0x${record.flags.toString(16)}`;
      flags[flag] = (flags[flag] || 0) + 1;
      kinds[record.kind] = (kinds[record.kind] || 0) + 1;
    }
    return {
      magic: this.magic,
      records: this.recordCount,
      containers: this.containerNames.map((name, index) => ({ name, bytes: this.containers[index]?.length ?? null })),
      flags,
      kinds,
    };
  }
}

export function parseTex2(bytes) {
  if (ascii(bytes, 0, 4) !== TEX2_MAGIC) throw new Error('Asset is not a TEX2 texture.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const pixelEnd = view.getUint32(8, true);
  const spriteCount = view.getUint32(12, true);
  const pixelOffset = view.getUint32(16, true);
  const widthAndFormat = view.getUint16(20, true);
  const width = widthAndFormat & 0x3fff;
  const formatFlags = widthAndFormat & 0xc000;
  const height = view.getUint16(22, true);
  requireRange(bytes, pixelOffset, pixelEnd - pixelOffset, 'TEX2 pixels');
  requireRange(bytes, pixelEnd, spriteCount * 16, 'TEX2 sprites');
  const pixelBytes = pixelEnd - pixelOffset;
  const bytesPerPixel = pixelBytes / (width * height);
  if (!Number.isInteger(bytesPerPixel) || bytesPerPixel <= 0) {
    throw new Error(`TEX2 pixel plane ${pixelBytes} does not fit ${width}x${height}.`);
  }
  const sprites = Array.from({ length: spriteCount }, (_, index) => {
    const offset = pixelEnd + index * 16;
    return Object.freeze({
      index,
      id: view.getUint16(offset, true),
      flags: view.getUint16(offset + 2, true),
      x: view.getUint16(offset + 4, true),
      y: view.getUint16(offset + 6, true),
      width: view.getUint16(offset + 8, true),
      height: view.getUint16(offset + 10, true),
      pivotX: view.getInt16(offset + 12, true),
      pivotY: view.getInt16(offset + 14, true),
    });
  });
  return Object.freeze({
    version: view.getUint32(4, true),
    sourceName: ascii(bytes, 24, 24),
    width,
    height,
    formatFlags,
    bytesPerPixel,
    pixels: bytes.subarray(pixelOffset, pixelEnd),
    sprites,
  });
}
