import fs from 'node:fs/promises';

const { chromium } = await import(process.env.GACHA_PLAYWRIGHT_MODULE || 'playwright');

const url = process.argv[2] || 'http://127.0.0.1:3000/binary-port';
const apkPath = process.argv[3];
const outputPath = process.argv[4] || '/tmp/gacha-binary-port.png';
if (!apkPath) throw new Error('Usage: test-binary-port-browser.mjs <url> <apk> [screenshot]');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
const consoleMessages = [];
page.on('console', (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
page.on('pageerror', (error) => consoleMessages.push(`pageerror: ${error.message}`));

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('#libpad-file').setInputFiles(apkPath);
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
  process.stdout.write(`${JSON.stringify({ state, consoleMessages }, null, 2)}\n`);
  if (state.error) process.exitCode = 1;
} finally {
  await browser.close();
}
