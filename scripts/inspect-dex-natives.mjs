import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const apk = resolve(import.meta.dirname, '..', 'jp.gungho.pad_21.9.0-21900_minAPI24(arm64-v8a).apk');

function uleb(bytes, cursor) {
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
  const u32 = (offset) => view.getUint32(offset, true);
  const stringCount = u32(0x38);
  const stringOffset = u32(0x3c);
  const typeCount = u32(0x40);
  const typeOffset = u32(0x44);
  const protoCount = u32(0x48);
  const protoOffset = u32(0x4c);
  const fieldCount = u32(0x50);
  const fieldOffset = u32(0x54);
  const methodCount = u32(0x58);
  const methodOffset = u32(0x5c);
  const classCount = u32(0x60);
  const classOffset = u32(0x64);
  const decoder = new TextDecoder();
  const strings = Array.from({ length: stringCount }, (_, index) => {
    const cursor = { offset: u32(stringOffset + index * 4) };
    uleb(bytes, cursor);
    const start = cursor.offset;
    while (bytes[cursor.offset]) cursor.offset += 1;
    return decoder.decode(bytes.subarray(start, cursor.offset));
  });
  const types = Array.from({ length: typeCount }, (_, index) => strings[u32(typeOffset + index * 4)]);
  const protos = Array.from({ length: protoCount }, (_, index) => {
    const offset = protoOffset + index * 12;
    const parametersOffset = u32(offset + 8);
    const parameters = parametersOffset
      ? Array.from({ length: u32(parametersOffset) }, (__, parameterIndex) => types[view.getUint16(parametersOffset + 4 + parameterIndex * 2, true)])
      : [];
    return `(${parameters.join('')})${types[u32(offset + 4)]}`;
  });
  const fields = Array.from({ length: fieldCount }, (_, index) => {
    const offset = fieldOffset + index * 8;
    return `${types[view.getUint16(offset, true)]}->${strings[u32(offset + 4)]}:${types[view.getUint16(offset + 2, true)]}`;
  });
  const methods = Array.from({ length: methodCount }, (_, index) => {
    const offset = methodOffset + index * 8;
    return {
      index,
      owner: types[view.getUint16(offset, true)],
      signature: protos[view.getUint16(offset + 2, true)],
      name: strings[u32(offset + 4)],
    };
  });
  const natives = [];
  const encodedMethods = [];
  for (let classIndex = 0; classIndex < classCount; classIndex += 1) {
    const dataOffset = u32(classOffset + classIndex * 32 + 24);
    if (!dataOffset) continue;
    const cursor = { offset: dataOffset };
    const staticFields = uleb(bytes, cursor);
    const instanceFields = uleb(bytes, cursor);
    const directMethods = uleb(bytes, cursor);
    const virtualMethods = uleb(bytes, cursor);
    for (let index = 0; index < staticFields + instanceFields; index += 1) {
      uleb(bytes, cursor);
      uleb(bytes, cursor);
    }
    let methodIndex = 0;
    for (let index = 0; index < directMethods + virtualMethods; index += 1) {
      methodIndex += uleb(bytes, cursor);
      const access = uleb(bytes, cursor);
      const codeOffset = uleb(bytes, cursor);
      encodedMethods.push({ ...methods[methodIndex], access, codeOffset });
      if (access & 0x100) natives.push({ source, access: `0x${access.toString(16)}`, ...methods[methodIndex] });
      if (index + 1 === directMethods) methodIndex = 0;
    }
  }
  const nativeIndexes = new Set(natives.map((method) => method.index));
  const nativeCallers = [];
  for (const caller of encodedMethods) {
    if (!caller.codeOffset) continue;
    const instructionCount = u32(caller.codeOffset + 12);
    const instructionOffset = caller.codeOffset + 16;
    const targets = new Set();
    for (let unit = 0; unit + 1 < instructionCount; unit += 1) {
      const opcode = view.getUint16(instructionOffset + unit * 2, true) & 0xff;
      if ((opcode >= 0x6e && opcode <= 0x72) || (opcode >= 0x74 && opcode <= 0x78)) {
        const targetIndex = view.getUint16(instructionOffset + (unit + 1) * 2, true);
        if (nativeIndexes.has(targetIndex)) targets.add(targetIndex);
      }
    }
    for (const targetIndex of targets) nativeCallers.push({
      source,
      caller: `${caller.owner}->${caller.name}${caller.signature}`,
      target: `${methods[targetIndex].owner}->${methods[targetIndex].name}${methods[targetIndex].signature}`,
    });
  }
  const methodDumps = encodedMethods.filter((method) =>
    method.owner === 'Ljp/gungho/pad/AppDelegate;' && method.name === 'onTouchEvent' && method.signature === '(Landroid/view/MotionEvent;)Z')
    .map((method) => {
      const registers = view.getUint16(method.codeOffset, true);
      const inputs = view.getUint16(method.codeOffset + 2, true);
      const instructionCount = u32(method.codeOffset + 12);
      const instructionOffset = method.codeOffset + 16;
      const units = Array.from({ length: instructionCount }, (_, unit) => view.getUint16(instructionOffset + unit * 2, true));
      const annotations = [];
      for (let unit = 0; unit < units.length; unit += 1) {
        const word = units[unit];
        const opcode = word & 0xff;
        if ((opcode >= 0x6e && opcode <= 0x72) && unit + 2 < units.length) {
          const count = word >> 12;
          const packed = units[unit + 2];
          const all = [packed & 15, (packed >> 4) & 15, (packed >> 8) & 15, (packed >> 12) & 15, (word >> 8) & 15];
          annotations.push({ unit, opcode: `0x${opcode.toString(16)}`, registers: all.slice(0, count), method: methods[units[unit + 1]] });
        } else if ((opcode >= 0x74 && opcode <= 0x78) && unit + 2 < units.length) {
          const count = word >> 8;
          const start = units[unit + 2];
          annotations.push({ unit, opcode: `0x${opcode.toString(16)}`, registers: Array.from({ length: count }, (__, index) => start + index), method: methods[units[unit + 1]] });
        } else if (opcode === 0x1a && unit + 1 < units.length) {
          annotations.push({ unit, opcode: 'const-string', register: word >> 8, value: strings[units[unit + 1]] });
        } else if (opcode >= 0x52 && opcode <= 0x5f && unit + 1 < units.length) {
          annotations.push({ unit, opcode: `0x${opcode.toString(16)}`, registers: [(word >> 8) & 15, word >> 12], field: fields[units[unit + 1]] });
        } else if (opcode >= 0x60 && opcode <= 0x6d && unit + 1 < units.length) {
          annotations.push({ unit, opcode: `0x${opcode.toString(16)}`, register: word >> 8, field: fields[units[unit + 1]] });
        }
      }
      return {
        method: `${method.owner}->${method.name}${method.signature}`,
        registers,
        inputs,
        inputRegisters: Array.from({ length: inputs }, (__, index) => registers - inputs + index),
        units: units.map((unit) => unit.toString(16).padStart(4, '0')),
        annotations,
      };
    });
  return { natives, nativeCallers, methodDumps };
}

const natives = [];
const nativeCallers = [];
const methodDumps = [];
for (const name of ['classes.dex', 'classes2.dex', 'classes3.dex', 'classes4.dex']) {
  const bytes = new Uint8Array(execFileSync('unzip', ['-p', apk, name], { maxBuffer: 16 * 1024 * 1024 }));
  const result = parseDex(bytes, name);
  natives.push(...result.natives);
  nativeCallers.push(...result.nativeCallers);
  methodDumps.push(...result.methodDumps);
}

console.log(JSON.stringify(process.argv.includes('--touch-only') ? { methodDumps } : { natives, nativeCallers, methodDumps }, null, 2));
