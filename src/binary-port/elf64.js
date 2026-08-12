const ELF_MAGIC = [0x7f, 0x45, 0x4c, 0x46];
const PT_LOAD = 1;
const EM_AARCH64 = 183;

function safeNumber(value, label) {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`${label} exceeds JavaScript's safe integer range`);
  return Number(value);
}

function readString(bytes, offset) {
  if (offset < 0 || offset >= bytes.length) return '';
  let end = offset;
  while (end < bytes.length && bytes[end] !== 0) end += 1;
  return new TextDecoder().decode(bytes.subarray(offset, end));
}

export function parseElf64(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.length < 64 || ELF_MAGIC.some((byte, index) => bytes[index] !== byte)) throw new Error('Not an ELF file');
  if (bytes[4] !== 2) throw new Error('Only ELF64 images are supported');
  if (bytes[5] !== 1) throw new Error('Only little-endian ELF images are supported');

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const machine = view.getUint16(18, true);
  if (machine !== EM_AARCH64) throw new Error(`Expected AArch64 ELF machine 183, received ${machine}`);

  const entry = safeNumber(view.getBigUint64(24, true), 'entry');
  const programOffset = safeNumber(view.getBigUint64(32, true), 'program header offset');
  const sectionOffset = safeNumber(view.getBigUint64(40, true), 'section header offset');
  const programEntrySize = view.getUint16(54, true);
  const programCount = view.getUint16(56, true);
  const sectionEntrySize = view.getUint16(58, true);
  const sectionCount = view.getUint16(60, true);
  const sectionNameIndex = view.getUint16(62, true);

  if (programOffset + programEntrySize * programCount > bytes.length) throw new Error('Program header table is truncated');
  if (sectionOffset && sectionOffset + sectionEntrySize * sectionCount > bytes.length) throw new Error('Section header table is truncated');

  const programHeaders = [];
  for (let index = 0; index < programCount; index += 1) {
    const offset = programOffset + index * programEntrySize;
    programHeaders.push({
      index,
      type: view.getUint32(offset, true),
      flags: view.getUint32(offset + 4, true),
      fileOffset: safeNumber(view.getBigUint64(offset + 8, true), 'segment file offset'),
      virtualAddress: safeNumber(view.getBigUint64(offset + 16, true), 'segment virtual address'),
      fileSize: safeNumber(view.getBigUint64(offset + 32, true), 'segment file size'),
      memorySize: safeNumber(view.getBigUint64(offset + 40, true), 'segment memory size'),
      alignment: safeNumber(view.getBigUint64(offset + 48, true), 'segment alignment'),
    });
  }

  const rawSections = [];
  for (let index = 0; index < sectionCount; index += 1) {
    const offset = sectionOffset + index * sectionEntrySize;
    rawSections.push({
      index,
      nameOffset: view.getUint32(offset, true),
      type: view.getUint32(offset + 4, true),
      flags: safeNumber(view.getBigUint64(offset + 8, true), 'section flags'),
      virtualAddress: safeNumber(view.getBigUint64(offset + 16, true), 'section virtual address'),
      fileOffset: safeNumber(view.getBigUint64(offset + 24, true), 'section file offset'),
      size: safeNumber(view.getBigUint64(offset + 32, true), 'section size'),
    });
  }

  const namesSection = rawSections[sectionNameIndex];
  const names = namesSection ? bytes.subarray(namesSection.fileOffset, namesSection.fileOffset + namesSection.size) : new Uint8Array();
  const sections = rawSections.map((section) => ({ ...section, name: readString(names, section.nameOffset) }));
  const loadSegments = programHeaders.filter((header) => header.type === PT_LOAD);
  const maximumAddress = loadSegments.reduce((maximum, segment) => Math.max(maximum, segment.virtualAddress + segment.memorySize), 0);

  return {
    bytes,
    machine,
    entry,
    programHeaders,
    loadSegments,
    sections,
    maximumAddress,
    customSections: sections.filter((section) => section.type >= 0x80000000),
  };
}
