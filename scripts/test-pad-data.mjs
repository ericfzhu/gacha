import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ApkArchive } from '../src/binary-port/apk.js';
import { PadDataArchive, parseTex2 } from '../src/binary-port/padDataArchive.js';

const apkBytes = new Uint8Array(await readFile(new URL('../jp.gungho.pad_21.9.0-21900_minAPI24(arm64-v8a).apk', import.meta.url)));
const archive = PadDataArchive.fromApk(new ApkArchive(apkBytes));
assert.equal(archive.magic, 'MCD5');
assert.equal(archive.recordCount, 4328);
assert.deepEqual(archive.containerNames, ['DATA001.BIN', 'DATA002.BIN', 'DATA003.BIN']);
assert.deepEqual(archive.summary().flags, {
  '0x0': 1531,
  '0x8000': 97,
  '0x8002': 1520,
  '0x18000': 3,
  '0x18001': 945,
  '0x28000': 232,
});

const block = archive.find('block2.btex');
assert.equal(block.kind, 'resident');
assert.equal(block.containerIndex, 0);
assert.equal(block.offset, 42_788_416);
assert.equal(block.storedLength, 1_049_040);
const texture = parseTex2(archive.read(block));
assert.equal(texture.sourceName, 'BLOCK2.PNG');
assert.equal(texture.width, 512);
assert.equal(texture.height, 512);
assert.equal(texture.bytesPerPixel, 4);
assert.equal(texture.pixels.length, 1_048_576);
assert.equal(texture.sprites.length, 26);
assert.deepEqual(texture.sprites[2], {
  index: 2, id: 0xffff, flags: 0, x: 2, y: 2, width: 100, height: 100, pivotX: 0, pivotY: 0,
});

const external = archive.records.find((record) => record.kind === 'external');
assert.equal(external.name, 'dung249_mthigh.btex');
assert.throws(() => archive.read(external), /download-only/);
const cardPlaceholder = archive.find('cardph.btex');
assert.equal(cardPlaceholder.containerIndex, 1);
assert.equal(new TextDecoder('ascii').decode(archive.read(cardPlaceholder).subarray(0, 4)), 'TEX1');
const compressed = archive.find('mons_001.btex');
assert.equal(compressed.containerIndex, 1);
assert.equal(compressed.compressed, true);
assert.throws(() => archive.read(compressed), /IOSChyQ/);
console.log('PAD data index, resident streams, external names, and TEX2 atlas checks passed.');
