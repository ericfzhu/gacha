const ELF_MAGIC = [0x7f, 0x45, 0x4c, 0x46];
const PT_LOAD = 1;
const PT_DYNAMIC = 2;
const EM_AARCH64 = 183;
const SHT_RELA = 4;

function safeNumber(value, label) {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`${label} exceeds JavaScript's safe integer range`);
  return Number(value);
}

function safeSignedNumber(value, label) {
  if (value > BigInt(Number.MAX_SAFE_INTEGER) || value < BigInt(Number.MIN_SAFE_INTEGER)) throw new Error(`${label} exceeds JavaScript's safe integer range`);
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
      link: view.getUint32(offset + 40, true),
      info: view.getUint32(offset + 44, true),
      alignment: safeNumber(view.getBigUint64(offset + 48, true), 'section alignment'),
      entrySize: safeNumber(view.getBigUint64(offset + 56, true), 'section entry size'),
    });
  }

  const namesSection = rawSections[sectionNameIndex];
  const names = namesSection ? bytes.subarray(namesSection.fileOffset, namesSection.fileOffset + namesSection.size) : new Uint8Array();
  const sections = rawSections.map((section) => ({ ...section, name: readString(names, section.nameOffset) }));
  const dynamicSymbols = [];
  const symbolsSection = sections.find((section) => section.name === '.dynsym');
  if (symbolsSection?.entrySize >= 24) {
    const stringsSection = sections[symbolsSection.link];
    const strings = stringsSection ? bytes.subarray(stringsSection.fileOffset, stringsSection.fileOffset + stringsSection.size) : new Uint8Array();
    for (let entryOffset = 0; entryOffset + 24 <= symbolsSection.size; entryOffset += symbolsSection.entrySize) {
      const offset = symbolsSection.fileOffset + entryOffset;
      const info = view.getUint8(offset + 4);
      dynamicSymbols.push({
        index: dynamicSymbols.length,
        name: readString(strings, view.getUint32(offset, true)),
        binding: info >> 4,
        type: info & 15,
        visibility: view.getUint8(offset + 5) & 3,
        sectionIndex: view.getUint16(offset + 6, true),
        value: safeNumber(view.getBigUint64(offset + 8, true), 'symbol value'),
        size: safeNumber(view.getBigUint64(offset + 16, true), 'symbol size'),
      });
    }
  }
  const relocations = [];
  for (const section of sections.filter((item) => item.type === SHT_RELA && item.entrySize >= 24)) {
    for (let entryOffset = 0; entryOffset + 24 <= section.size; entryOffset += section.entrySize) {
      const offset = section.fileOffset + entryOffset;
      const info = view.getBigUint64(offset + 8, true);
      relocations.push({
        section: section.name,
        offset: safeNumber(view.getBigUint64(offset, true), 'relocation offset'),
        symbol: Number(info >> 32n),
        type: Number(info & 0xffffffffn),
        addend: safeSignedNumber(view.getBigInt64(offset + 16, true), 'relocation addend'),
      });
    }
  }
  const loadSegments = programHeaders.filter((header) => header.type === PT_LOAD);
  const dynamicEntries = [];
  const dynamicHeader = programHeaders.find((header) => header.type === PT_DYNAMIC);
  if (dynamicHeader) {
    for (let offset = dynamicHeader.fileOffset; offset + 16 <= dynamicHeader.fileOffset + dynamicHeader.fileSize; offset += 16) {
      const tag = safeSignedNumber(view.getBigInt64(offset, true), 'dynamic tag');
      const value = safeNumber(view.getBigUint64(offset + 8, true), 'dynamic value');
      dynamicEntries.push({ tag, value });
      if (tag === 0) break;
    }
  }
  const maximumAddress = loadSegments.reduce((maximum, segment) => Math.max(maximum, segment.virtualAddress + segment.memorySize), 0);

  return {
    bytes,
    machine,
    entry,
    programOffset,
    programHeaders,
    loadSegments,
    dynamicEntries,
    sections,
    dynamicSymbols,
    relocations,
    maximumAddress,
    customSections: sections.filter((section) => section.type >= 0x80000000),
  };
}
