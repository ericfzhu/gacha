import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ApkArchive } from '../src/binary-port/apk.js';
import { inflateBytes } from '../src/binary-port/inflate.js';
import { PadDataArchive, parseTex2 } from '../src/binary-port/padDataArchive.js';

const apkPath = resolve(process.argv.find((argument) => argument.endsWith('.apk')) ||
  'jp.gungho.pad_21.9.0-21900_minAPI24(arm64-v8a).apk');
const apk = new ApkArchive(new Uint8Array(await readFile(apkPath)));
const data = PadDataArchive.fromApk(apk);
const assetArgument = process.argv.find((argument) => argument.startsWith('--asset='));
const searchArgument = process.argv.find((argument) => argument.startsWith('--search='));
const output = { apk: apkPath, ...data.summary() };

if (searchArgument) {
  const expression = new RegExp(searchArgument.slice('--search='.length), 'i');
  output.matches = data.records.filter((record) => expression.test(record.name)).map((record) => ({
    index: record.index,
    name: record.name,
    flags: `0x${record.flags.toString(16)}`,
    kind: record.kind,
    compressed: record.compressed,
    logicalLength: record.logicalLength,
    storedLength: record.storedLength,
  }));
}

if (assetArgument) {
  const name = assetArgument.slice('--asset='.length);
  const record = data.find(name);
  if (!record) throw new Error(`No PAD asset named ${name}.`);
  output.asset = { ...record, flags: `0x${record.flags.toString(16)}` };
  if (record.kind === 'resident') {
    const bytes = data.read(record, inflateBytes);
    const magic = new TextDecoder('ascii').decode(bytes.subarray(0, 4));
    output.asset.magic = magic;
    if (magic === 'TEX2') {
      const texture = parseTex2(bytes);
      output.texture = { ...texture, pixels: `${texture.pixels.length} bytes` };
    }
  }
}

console.log(JSON.stringify(output, null, 2));
