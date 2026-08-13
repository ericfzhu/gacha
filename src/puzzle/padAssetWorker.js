import { ApkArchive } from '../binary-port/apk.js';
import { inflateBytes } from '../binary-port/inflate.js';
import { decodePadTexturePixels, PadDataArchive, parsePadTexture, parseTex2 } from '../binary-port/padDataArchive.js';

function opaqueBounds(pixels, width, height) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let index = 0; index < width * height; index += 1) {
    if (!pixels[index * 4 + 3]) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }
  return right < left
    ? { x: 0, y: 0, width, height }
    : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

self.onmessage = ({ data }) => {
  try {
    const apk = new ApkArchive(new Uint8Array(data.apkBytes));
    const indexBytes = apk.read('assets/DATA000.BIN');
    const nameBytes = apk.read('assets/DATA000.NAM');
    const data001 = apk.read('assets/DATA001.BIN');
    const data002 = apk.read('assets/DATA002.BIN');
    if (!indexBytes || !nameBytes || !data001 || !data002) throw new Error('Selected APK does not contain the PAD data archives.');
    const archive = new PadDataArchive(indexBytes, nameBytes, [data001, data002]);
    const texture = parseTex2(archive.read('block2.btex'));
    if (texture.bytesPerPixel !== 4) throw new Error(`Unexpected block2.btex pixel format (${texture.bytesPerPixel} bytes per pixel).`);
    const pixels = texture.pixels.slice();
    const monsters = ['mons_001.btex', 'mons_147.btex'].map((name) => {
      const monsterTexture = parsePadTexture(archive.read(name, inflateBytes));
      const monsterPixels = decodePadTexturePixels(monsterTexture);
      return {
        name,
        sourceName: monsterTexture.sourceName,
        width: monsterTexture.width,
        height: monsterTexture.height,
        bounds: opaqueBounds(monsterPixels, monsterTexture.width, monsterTexture.height),
        pixels: monsterPixels.buffer,
      };
    });
    self.postMessage({
      type: 'atlas',
      width: texture.width,
      height: texture.height,
      sourceName: texture.sourceName,
      sprites: texture.sprites,
      pixels: pixels.buffer,
      monsters,
    }, [pixels.buffer, ...monsters.map((monster) => monster.pixels)]);
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
