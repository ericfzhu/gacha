import fs from 'node:fs/promises';
import { basename } from 'node:path';
import { canonicalPadRuntimePath } from '../src/binary-port/padRuntimeFiles.js';
import { ARM64_CORE_BUILD } from '../src/binary-port/arm64Runtime.js';

const { chromium } = await import(process.env.GACHA_PLAYWRIGHT_MODULE || 'playwright');

const positional = [];
const runtimeFilePaths = [];
let summaryOnly = false;
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index] === '--runtime-file') {
    const path = process.argv[++index];
    if (!path) throw new Error('--runtime-file requires a path.');
    runtimeFilePaths.push(path);
  } else if (process.argv[index] === '--summary') summaryOnly = true;
  else positional.push(process.argv[index]);
}
const url = positional[0] || 'http://127.0.0.1:3000/binary-port';
const apkPath = positional[1];
const outputPath = positional[2] || '/tmp/gacha-binary-port.png';
if (!apkPath) {
  throw new Error('Usage: test-binary-port-browser.mjs <url> <apk> [screenshot] [--runtime-file <bin>]...');
}

// Set GACHA_PLAYWRIGHT_USER_DATA_DIR to reuse IndexedDB between invocations.
// The normal smoke test keeps an isolated temporary profile; a persistent
// profile makes the cold -> warm protected-snapshot path reproducible.
const userDataDir = process.env.GACHA_PLAYWRIGHT_USER_DATA_DIR;
const browser = userDataDir
  ? await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    viewport: { width: 1100, height: 760 },
  })
  : await chromium.launch({ headless: true });
const runtimeFileSpecs = await Promise.all(runtimeFilePaths.map(async (path) => ({
  path: canonicalPadRuntimePath(basename(path)),
  size: (await fs.stat(path)).size,
})));
const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
const consoleMessages = [];
page.on('console', (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
page.on('pageerror', (error) => consoleMessages.push(`pageerror: ${error.message}`));
const measureVisualPresence = async (screenshot, bounds) => page.evaluate(async ({ png, sampleBounds }) => {
  const image = new Image();
  image.src = `data:image/png;base64,${png}`;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const x = Math.max(0, Math.floor(sampleBounds.x));
  const y = Math.max(0, Math.floor(sampleBounds.y));
  const width = Math.min(image.naturalWidth - x, Math.max(1, Math.floor(sampleBounds.width)));
  const height = Math.min(image.naturalHeight - y, Math.max(1, Math.floor(sampleBounds.height)));
  const pixels = context.getImageData(x, y, width, height).data;
  let visiblePixels = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index] + pixels[index + 1] + pixels[index + 2] > 30) visiblePixels += 1;
  }
  return visiblePixels / (pixels.length / 4);
}, { png: screenshot.toString('base64'), sampleBounds: bounds });

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('#libpad-file').setInputFiles([apkPath, ...runtimeFilePaths]);
  await page.waitForFunction(() => {
    const state = JSON.parse(window.render_game_to_text?.() || '{}');
    return state.phase === 'native game running' || state.phase === 'error';
  }, null, { timeout: 300_000 });

  let initialVisualPresence = 0;
  if (JSON.parse(await page.evaluate(() => window.render_game_to_text())).phase === 'native game running') {
    await page.waitForTimeout(3500);
    if (JSON.parse(await page.evaluate(() => window.render_game_to_text())).phase === 'native game running') {
      const game = page.locator('canvas[aria-label="Puzzle and Dragons native browser port"]');
      const initialScreenshot = await page.screenshot({ path: `${outputPath}.initial.png`, fullPage: true });
      const initialBounds = await game.boundingBox();
      initialVisualPresence = initialBounds ? await measureVisualPresence(initialScreenshot, initialBounds) : 0;
      await game.click({ position: { x: 280, y: 700 } });
      await page.waitForTimeout(1500);
      await game.click({ position: { x: 280, y: 450 } });
      await page.waitForTimeout(1500);
    }
  }

  const state = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  await page.screenshot({ path: outputPath, fullPage: true });
  const gameCanvas = page.locator('canvas[aria-label="Puzzle and Dragons native browser port"]');
  if (state.phase === 'native game running') {
    await gameCanvas.screenshot({ path: `${outputPath}.game.png` });
  }
  await fs.writeFile(`${outputPath}.json`, JSON.stringify({ state, consoleMessages }, null, 2));
  const requestedFiles = new Set(state.platform?.files?.map(({ path }) => path));
  const mountedRuntimeFiles = new Set(state.elf?.mountedRuntimeFiles || []);
  if (state.decoderBuild !== ARM64_CORE_BUILD || state.phase !== 'native game running' || !state.probe?.passed || state.elf?.lifecycleExports !== 6 ||
      state.elf?.deepInstructions < 100_000_000 || state.frame < 100 || state.drawCalls < 10_000 ||
      state.touchCount < 4 || !requestedFiles.has('/data/user/0/jp.gungho.pad/files/data048.bin') ||
      !requestedFiles.has('/data/user/0/jp.gungho.pad/cache/data030.bin') || initialVisualPresence < 0.01) {
    throw new Error(`Native binary-port smoke test did not reach the verified content boundary: ${JSON.stringify({
      decoderBuild: state.decoderBuild,
      expectedDecoderBuild: ARM64_CORE_BUILD,
      phase: state.phase,
      probePassed: state.probe?.passed,
      lifecycleExports: state.elf?.lifecycleExports,
      deepInstructions: state.elf?.deepInstructions,
      frame: state.frame,
      drawCalls: state.drawCalls,
      touchCount: state.touchCount,
      initialVisualPresence,
      requestedFiles: [...requestedFiles].filter((path) => /data0(?:30|48)\.bin$/.test(path)),
    })}`);
  }
  if (runtimeFilePaths.length && mountedRuntimeFiles.size !== runtimeFilePaths.length) {
    throw new Error(`Mounted ${mountedRuntimeFiles.size} runtime files; expected ${runtimeFilePaths.length}: ${JSON.stringify([...mountedRuntimeFiles])}`);
  }
  for (const runtimeFile of runtimeFileSpecs.filter(({ path }) => /\/data0(?:30|48)\.bin$/.test(path))) {
    const fullRead = state.platform?.files?.some((event) =>
      event.name === 'read' && event.path === runtimeFile.path &&
      event.count === runtimeFile.size && event.result === runtimeFile.size);
    if (!fullRead) {
      throw new Error(`Native loader did not read the full mounted payload ${runtimeFile.path} (${runtimeFile.size} bytes).`);
    }
  }
  if (runtimeFileSpecs.length && state.platform?.compatibilityCalls?.fgetpos) {
    throw new Error('Native runtime-data loader resolved fgetpos through the generic compatibility bridge.');
  }
  if (consoleMessages.some((message) => /error|pageerror/i.test(message))) {
    throw new Error(`Native binary-port browser errors: ${consoleMessages.join('; ')}`);
  }
  const output = summaryOnly ? {
    phase: state.phase,
    frame: state.frame,
    drawCalls: state.drawCalls,
    deepInstructions: state.elf?.deepInstructions,
    protectedCacheHit: state.elf?.protectedCacheHit,
    protectedInstructionsThisRun: state.elf?.protectedInstructionsThisRun,
    initialVisualPresence,
    mountedRuntimeFiles: state.elf?.mountedRuntimeFiles,
    compatibilityCalls: state.platform?.compatibilityCalls,
    runtimeFileEvents: state.platform?.files?.filter(({ path }) => /data0(?:30|48)\.bin$/.test(path)),
    consoleMessages,
  } : { state, consoleMessages };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (state.error) process.exitCode = 1;
} finally {
  await browser.close();
}
