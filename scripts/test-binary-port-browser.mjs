import fs from 'node:fs/promises';

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

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
const consoleMessages = [];
page.on('console', (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
page.on('pageerror', (error) => consoleMessages.push(`pageerror: ${error.message}`));

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('#libpad-file').setInputFiles([apkPath, ...runtimeFilePaths]);
  await page.waitForFunction(() => {
    const state = JSON.parse(window.render_game_to_text?.() || '{}');
    return state.phase === 'native game running' || state.phase === 'error';
  }, null, { timeout: 300_000 });

  if (JSON.parse(await page.evaluate(() => window.render_game_to_text())).phase === 'native game running') {
    await page.waitForTimeout(3500);
    if (JSON.parse(await page.evaluate(() => window.render_game_to_text())).phase === 'native game running') {
      const game = page.locator('canvas[aria-label="Puzzle and Dragons native browser port"]');
      await game.click({ position: { x: 280, y: 700 } });
      await page.waitForTimeout(1500);
      await game.click({ position: { x: 280, y: 450 } });
      await page.waitForTimeout(1500);
    }
  }

  const state = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  await page.screenshot({ path: outputPath, fullPage: true });
  if (state.phase === 'native game running') {
    await page.locator('canvas[aria-label="Puzzle and Dragons native browser port"]').screenshot({ path: `${outputPath}.game.png` });
  }
  await fs.writeFile(`${outputPath}.json`, JSON.stringify({ state, consoleMessages }, null, 2));
  const requestedFiles = new Set(state.platform?.files?.map(({ path }) => path));
  const mountedRuntimeFiles = new Set(state.elf?.mountedRuntimeFiles || []);
  if (state.phase !== 'native game running' || !state.probe?.passed || state.elf?.lifecycleExports !== 6 ||
      state.elf?.deepInstructions < 100_000_000 || state.frame < 100 || state.drawCalls < 10_000 ||
      state.touchCount < 4 || !requestedFiles.has('/data/user/0/jp.gungho.pad/files/data048.bin') ||
      !requestedFiles.has('/data/user/0/jp.gungho.pad/cache/data030.bin')) {
    throw new Error(`Native binary-port smoke test did not reach the verified content boundary: ${JSON.stringify({
      phase: state.phase,
      probePassed: state.probe?.passed,
      lifecycleExports: state.elf?.lifecycleExports,
      deepInstructions: state.elf?.deepInstructions,
      frame: state.frame,
      drawCalls: state.drawCalls,
      touchCount: state.touchCount,
      requestedFiles: [...requestedFiles].filter((path) => /data0(?:30|48)\.bin$/.test(path)),
    })}`);
  }
  if (runtimeFilePaths.length && mountedRuntimeFiles.size !== runtimeFilePaths.length) {
    throw new Error(`Mounted ${mountedRuntimeFiles.size} runtime files; expected ${runtimeFilePaths.length}: ${JSON.stringify([...mountedRuntimeFiles])}`);
  }
  if (consoleMessages.some((message) => /error|pageerror/i.test(message))) {
    throw new Error(`Native binary-port browser errors: ${consoleMessages.join('; ')}`);
  }
  const output = summaryOnly ? {
    phase: state.phase,
    frame: state.frame,
    drawCalls: state.drawCalls,
    deepInstructions: state.elf?.deepInstructions,
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
