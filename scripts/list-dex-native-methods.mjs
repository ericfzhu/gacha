import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const apkArgument = process.argv.slice(2).find((argument) => !argument.startsWith('--'));
const apk = resolve(apkArgument ?? 'jp.gungho.pad_21.9.0-21900_minAPI24(arm64-v8a).apk');
const classFilterArgument = process.argv.find((argument) => argument.startsWith('--class='));
const classFilter = classFilterArgument?.slice('--class='.length) ?? '';
const entries = execFileSync('unzip', ['-Z1', apk], { encoding: 'utf8' })
  .split('\n')
  .filter((name) => /^classes\d*\.dex$/.test(name));

function readUleb128(bytes, cursor) {
  let value = 0;
  let shift = 0;
  for (;;) {
    const byte = bytes[cursor.offset++];
    value |= (byte & 0x7f) << shift;
    if (!(byte & 0x80)) return value >>> 0;
    shift += 7;
  }
}

function parseDex(bytes, source) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  const u32 = (offset) => view.getUint32(offset, true);
  if (decoder.decode(bytes.subarray(0, 4)) !== 'dex\n') throw new Error(`${source} is not a DEX file`);

  const stringCount = u32(0x38);
  const stringOffset = u32(0x3c);
  const strings = Array.from({ length: stringCount }, (_, index) => {
    const cursor = { offset: u32(stringOffset + index * 4) };
    readUleb128(bytes, cursor);
    const start = cursor.offset;
    while (bytes[cursor.offset]) cursor.offset += 1;
    return decoder.decode(bytes.subarray(start, cursor.offset));
  });

  const typeCount = u32(0x40);
  const typeOffset = u32(0x44);
  const types = Array.from({ length: typeCount }, (_, index) => strings[u32(typeOffset + index * 4)]);

  const protoCount = u32(0x48);
  const protoOffset = u32(0x4c);
  const protos = Array.from({ length: protoCount }, (_, index) => {
    const offset = protoOffset + index * 12;
    const parametersOffset = u32(offset + 8);
    const parameters = parametersOffset
      ? Array.from({ length: u32(parametersOffset) }, (__, parameter) => types[view.getUint16(parametersOffset + 4 + parameter * 2, true)])
      : [];
    return `(${parameters.join('')})${types[u32(offset + 4)]}`;
  });

  const methodCount = u32(0x58);
  const methodOffset = u32(0x5c);
  const methods = Array.from({ length: methodCount }, (_, index) => {
    const offset = methodOffset + index * 8;
    return {
      className: types[view.getUint16(offset, true)],
      descriptor: protos[view.getUint16(offset + 2, true)],
      name: strings[u32(offset + 4)],
    };
  });

  const nativeMethods = [];
  const classMethods = [];
  const classCount = u32(0x60);
  const classOffset = u32(0x64);
  for (let classIndex = 0; classIndex < classCount; classIndex += 1) {
    const classDataOffset = u32(classOffset + classIndex * 32 + 24);
    if (!classDataOffset) continue;
    const cursor = { offset: classDataOffset };
    const staticFields = readUleb128(bytes, cursor);
    const instanceFields = readUleb128(bytes, cursor);
    const directMethods = readUleb128(bytes, cursor);
    const virtualMethods = readUleb128(bytes, cursor);
    for (let field = 0; field < staticFields + instanceFields; field += 1) {
      readUleb128(bytes, cursor);
      readUleb128(bytes, cursor);
    }
    for (const count of [directMethods, virtualMethods]) {
      let methodIndex = 0;
      for (let encoded = 0; encoded < count; encoded += 1) {
        methodIndex += readUleb128(bytes, cursor);
        const accessFlags = readUleb128(bytes, cursor);
        const codeOffset = readUleb128(bytes, cursor);
        const method = methods[methodIndex];
        if (accessFlags & 0x100) nativeMethods.push({ source, ...method, accessFlags, codeOffset });
        if (classFilter && method.className === classFilter) {
          const references = [];
          if (codeOffset) {
            const instructionCount = u32(codeOffset + 12);
            const instructionsOffset = codeOffset + 16;
            for (let unit = 0; unit < instructionCount; unit += 1) {
              const instruction = view.getUint16(instructionsOffset + unit * 2, true);
              const opcode = instruction & 0xff;
              if (opcode === 0x1a && unit + 1 < instructionCount) {
                const stringIndex = view.getUint16(instructionsOffset + (unit + 1) * 2, true);
                references.push({ unit, opcode: 'const-string', value: strings[stringIndex] });
              } else if (opcode === 0x1b && unit + 2 < instructionCount) {
                const stringIndex = u32(instructionsOffset + (unit + 1) * 2);
                references.push({ unit, opcode: 'const-string/jumbo', value: strings[stringIndex] });
              } else if (((opcode >= 0x6e && opcode <= 0x72) || (opcode >= 0x74 && opcode <= 0x78)) && unit + 1 < instructionCount) {
                const calledMethod = methods[view.getUint16(instructionsOffset + (unit + 1) * 2, true)];
                if (calledMethod) references.push({ unit, opcode: `invoke-0x${opcode.toString(16)}`, method: calledMethod });
              }
            }
          }
          classMethods.push({ source, ...method, accessFlags, codeOffset, references });
        }
      }
    }
  }
  return { nativeMethods, classMethods };
}

const parsed = entries.map((entry) => {
  const bytes = execFileSync('unzip', ['-p', apk, entry], { maxBuffer: 16 * 1024 * 1024 });
  return parseDex(bytes, entry);
});

console.log(JSON.stringify(classFilter ? parsed.flatMap((entry) => entry.classMethods) : parsed.flatMap((entry) => entry.nativeMethods), null, 2));
