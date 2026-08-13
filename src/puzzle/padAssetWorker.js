import { ApkArchive } from '../binary-port/apk.js';
import { PadDataArchive, parseTex2 } from '../binary-port/padDataArchive.js';

self.onmessage = ({ data }) => {
  try {
    const apk = new ApkArchive(new Uint8Array(data.apkBytes));
    const indexBytes = apk.read('assets/DATA000.BIN');
    const nameBytes = apk.read('assets/DATA000.NAM');
    const data001 = apk.read('assets/DATA001.BIN');
    if (!indexBytes || !nameBytes || !data001) throw new Error('Selected APK does not contain the PAD data archives.');
    const archive = new PadDataArchive(indexBytes, nameBytes, [data001]);
    const texture = parseTex2(archive.read('block2.btex'));
    if (texture.bytesPerPixel !== 4) throw new Error(`Unexpected block2.btex pixel format (${texture.bytesPerPixel} bytes per pixel).`);
    const pixels = texture.pixels.slice();
    self.postMessage({
      type: 'atlas',
      width: texture.width,
      height: texture.height,
      sourceName: texture.sourceName,
      sprites: texture.sprites,
      pixels: pixels.buffer,
    }, [pixels.buffer]);
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
