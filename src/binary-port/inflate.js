class InflateNeedMore extends Error {}

class BitReader {
  constructor(bytes) {
    this.bytes = bytes;
    this.offset = 0;
    this.buffer = 0;
    this.bits = 0;
  }

  read(count) {
    while (this.bits < count) {
      if (this.offset >= this.bytes.length) throw new InflateNeedMore('Truncated DEFLATE stream');
      this.buffer |= this.bytes[this.offset++] << this.bits;
      this.bits += 8;
    }
    const mask = (1 << count) - 1;
    const value = this.buffer & mask;
    this.buffer >>>= count;
    this.bits -= count;
    return value;
  }

  alignByte() {
    this.buffer = 0;
    this.bits = 0;
  }
}

function reverseCode(code, bits) {
  let output = 0;
  for (let index = 0; index < bits; index += 1) output = (output << 1) | ((code >> index) & 1);
  return output;
}

function buildHuffman(lengths) {
  const counts = new Uint16Array(16);
  let maximum = 0;
  for (const length of lengths) {
    if (length > 15) throw new Error('Invalid DEFLATE Huffman length');
    if (length) { counts[length] += 1; maximum = Math.max(maximum, length); }
  }
  const next = new Uint16Array(16);
  let code = 0;
  for (let bits = 1; bits <= 15; bits += 1) {
    code = (code + counts[bits - 1]) << 1;
    next[bits] = code;
  }
  const tables = Array.from({ length: maximum + 1 }, () => new Map());
  lengths.forEach((length, symbol) => {
    if (length) tables[length].set(reverseCode(next[length]++, length), symbol);
  });
  return { tables, maximum };
}

function decodeSymbol(reader, tree) {
  let code = 0;
  for (let length = 1; length <= tree.maximum; length += 1) {
    code |= reader.read(1) << (length - 1);
    const symbol = tree.tables[length].get(code);
    if (symbol !== undefined) return symbol;
  }
  throw new Error('Invalid DEFLATE Huffman code');
}

class OutputBuffer {
  constructor() {
    this.bytes = new Uint8Array(65536);
    this.length = 0;
  }

  ensure(extra) {
    if (this.length + extra <= this.bytes.length) return;
    let capacity = this.bytes.length;
    while (capacity < this.length + extra) capacity *= 2;
    const expanded = new Uint8Array(capacity);
    expanded.set(this.bytes);
    this.bytes = expanded;
  }

  push(value) {
    this.ensure(1);
    this.bytes[this.length++] = value;
  }

  copy(distance, count) {
    if (!distance || distance > this.length) throw new Error('Invalid DEFLATE back-reference');
    this.ensure(count);
    for (let index = 0; index < count; index += 1) {
      this.bytes[this.length] = this.bytes[this.length - distance];
      this.length += 1;
    }
  }

  finish() {
    return this.bytes.slice(0, this.length);
  }
}

const LENGTH_BASE = new Uint16Array([
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258,
]);
const LENGTH_EXTRA = new Uint8Array([
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2,
  3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0,
]);
const DISTANCE_BASE = new Uint16Array([
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289,
  16385, 24577,
]);
const DISTANCE_EXTRA = new Uint8Array([
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
  7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13,
]);

function fixedTrees() {
  const literals = new Uint8Array(288);
  literals.fill(8, 0, 144);
  literals.fill(9, 144, 256);
  literals.fill(7, 256, 280);
  literals.fill(8, 280);
  return { literals: buildHuffman(literals), distances: buildHuffman(new Uint8Array(32).fill(5)) };
}

const FIXED_TREES = fixedTrees();

function dynamicTrees(reader) {
  const literalCount = reader.read(5) + 257;
  const distanceCount = reader.read(5) + 1;
  const codeCount = reader.read(4) + 4;
  const order = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
  const codeLengths = new Uint8Array(19);
  for (let index = 0; index < codeCount; index += 1) codeLengths[order[index]] = reader.read(3);
  const codeTree = buildHuffman(codeLengths);
  const lengths = [];
  while (lengths.length < literalCount + distanceCount) {
    const symbol = decodeSymbol(reader, codeTree);
    if (symbol <= 15) lengths.push(symbol);
    else if (symbol === 16) {
      if (!lengths.length) throw new Error('Invalid repeated DEFLATE length');
      const count = reader.read(2) + 3;
      const previous = lengths[lengths.length - 1];
      for (let index = 0; index < count; index += 1) lengths.push(previous);
    } else {
      const count = reader.read(symbol === 17 ? 3 : 7) + (symbol === 17 ? 3 : 11);
      for (let index = 0; index < count; index += 1) lengths.push(0);
    }
    if (lengths.length > literalCount + distanceCount) throw new Error('DEFLATE code lengths overflow');
  }
  return {
    literals: buildHuffman(lengths.slice(0, literalCount)),
    distances: buildHuffman(lengths.slice(literalCount)),
  };
}

function decodeCompressed(reader, output, trees) {
  for (;;) {
    const symbol = decodeSymbol(reader, trees.literals);
    if (symbol < 256) output.push(symbol);
    else if (symbol === 256) return;
    else {
      const lengthIndex = symbol - 257;
      if (lengthIndex >= LENGTH_BASE.length) throw new Error('Invalid DEFLATE length symbol');
      const length = LENGTH_BASE[lengthIndex] + reader.read(LENGTH_EXTRA[lengthIndex]);
      const distanceSymbol = decodeSymbol(reader, trees.distances);
      if (distanceSymbol >= DISTANCE_BASE.length) throw new Error('Invalid DEFLATE distance symbol');
      const distance = DISTANCE_BASE[distanceSymbol] + reader.read(DISTANCE_EXTRA[distanceSymbol]);
      output.copy(distance, length);
    }
  }
}

function unwrap(bytes, windowBits) {
  let start = 0;
  if (windowBits >= 24 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    if (bytes.length < 10) throw new InflateNeedMore('Truncated gzip header');
    const flags = bytes[3];
    start = 10;
    if (flags & 4) {
      if (start + 2 > bytes.length) throw new InflateNeedMore('Truncated gzip extra header');
      const length = bytes[start] | (bytes[start + 1] << 8);
      start += 2 + length;
    }
    for (const flag of [8, 16]) if (flags & flag) {
      while (start < bytes.length && bytes[start++]) { }
      if (start > bytes.length) throw new InflateNeedMore('Truncated gzip string');
    }
    if (flags & 2) start += 2;
  } else if (windowBits >= 0) {
    if (bytes.length < 2) throw new InflateNeedMore('Truncated zlib header');
    if ((bytes[0] & 0x0f) !== 8 || ((bytes[0] << 8) + bytes[1]) % 31) throw new Error('Invalid zlib header');
    start = 2 + ((bytes[1] & 0x20) ? 4 : 0);
  }
  if (start > bytes.length) throw new InflateNeedMore('Truncated compressed wrapper');
  return bytes.subarray(start);
}

export function inflateBytes(bytes, windowBits = 15) {
  const reader = new BitReader(unwrap(bytes, windowBits));
  const output = new OutputBuffer();
  let final = 0;
  while (!final) {
    final = reader.read(1);
    const type = reader.read(2);
    if (type === 0) {
      reader.alignByte();
      if (reader.offset + 4 > reader.bytes.length) throw new InflateNeedMore('Truncated stored DEFLATE block');
      const length = reader.bytes[reader.offset] | (reader.bytes[reader.offset + 1] << 8);
      const inverse = reader.bytes[reader.offset + 2] | (reader.bytes[reader.offset + 3] << 8);
      reader.offset += 4;
      if ((length ^ 0xffff) !== inverse) throw new Error('Invalid stored DEFLATE block length');
      if (reader.offset + length > reader.bytes.length) throw new InflateNeedMore('Truncated stored DEFLATE payload');
      for (let index = 0; index < length; index += 1) output.push(reader.bytes[reader.offset++]);
    } else if (type === 1) decodeCompressed(reader, output, FIXED_TREES);
    else if (type === 2) decodeCompressed(reader, output, dynamicTrees(reader));
    else throw new Error('Reserved DEFLATE block type');
  }
  return output.finish();
}

export function isIncompleteInflate(error) {
  return error instanceof InflateNeedMore;
}
