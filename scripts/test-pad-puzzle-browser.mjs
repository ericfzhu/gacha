import fs from 'node:fs/promises';

const { chromium } = await import(process.env.GACHA_PLAYWRIGHT_MODULE || 'playwright');
const url = process.argv[2] || 'http://127.0.0.1:4173/puzzle';
const outputPath = process.argv[3] || '/tmp/gacha-pad-puzzle.png';
const apkPath = process.argv[4] || null;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 980, height: 900 } });
const consoleMessages = [];
page.on('console', (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
page.on('pageerror', (error) => consoleMessages.push(`pageerror: ${error.message}`));

function internalPoint(box, x, y) {
  return { x: box.x + x * box.width / 450, y: box.y + y * box.height / 820 };
}

try {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.render_game_to_text === 'function');
  if (apkPath) {
    await page.locator('.puzzle-apk-art input').setInputFiles(apkPath);
    await page.waitForFunction(() => document.querySelector('.puzzle-apk-art span')?.textContent?.startsWith('Original BLOCK2.PNG'), null, { timeout: 120_000 });
  }
  const canvas = page.locator('canvas[aria-label^="Orb Battle Lab"]');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Puzzle canvas is not visible.');
  const start = internalPoint(box, 225, 570);
  await page.mouse.click(start.x, start.y);
  const before = JSON.parse(await page.evaluate(() => window.render_game_to_text()));

  const from = internalPoint(box, 50, 475);
  const diagonal = internalPoint(box, 120, 545);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(diagonal.x, diagonal.y, { steps: 1 });
  const during = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
  await page.mouse.up();
  await page.evaluate(() => window.advanceTime(5000));
  const after = JSON.parse(await page.evaluate(() => window.render_game_to_text()));

  const expectedRows = [...before.board];
  const first = expectedRows[0].split('');
  const second = expectedRows[1].split('');
  const held = first[0];
  first[0] = first[1];
  first[1] = second[1];
  second[1] = held;
  expectedRows[0] = first.join('');
  expectedRows[1] = second.join('');
  if (during.drag?.pathLength !== 2) throw new Error(`Diagonal coalesced move used ${during.drag?.pathLength} swaps instead of 2.`);
  if (during.board[0] !== expectedRows[0] || during.board[1] !== expectedRows[1]) {
    throw new Error(`Orthogonal drag board mismatch: ${during.board.slice(0, 2)} vs ${expectedRows.slice(0, 2)}.`);
  }
  if (after.drag) throw new Error('Released browser pointer left a native-style drag active.');
  if (after.turn !== 1) throw new Error(`Released drag produced turn ${after.turn}; expected 1.`);
  if (consoleMessages.some((message) => /error|pageerror/i.test(message))) {
    throw new Error(`Browser console errors: ${consoleMessages.join('\n')}`);
  }

  await page.screenshot({ path: outputPath, fullPage: true });
  await fs.writeFile(`${outputPath}.json`, JSON.stringify({ before, during, after, consoleMessages }, null, 2));
  const atlasStatus = await page.locator('.puzzle-apk-art span').textContent();
  process.stdout.write(`${JSON.stringify({ atlasStatus, dragPathLength: during.drag.pathLength, turn: after.turn, phase: after.phase, consoleMessages }, null, 2)}\n`);
} finally {
  await browser.close();
}
