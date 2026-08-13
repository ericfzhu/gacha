import fs from 'node:fs/promises';

const { chromium } = await import(process.env.GACHA_PLAYWRIGHT_MODULE || 'playwright');
const url = process.argv[2] || 'http://127.0.0.1:4173/puzzle';
const outputPath = process.argv[3] || '/tmp/gacha-pad-puzzle.png';
const apkPath = process.argv[4] || null;
const showOrbStates = process.argv.includes('--orb-states');
const renderAtlasSheet = process.argv.includes('--atlas-sheet');
const testBombResolution = process.argv.includes('--bomb-resolution');
const testThornInput = process.argv.includes('--thorn-input');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 980, height: 900 } });
const consoleMessages = [];
page.on('console', (message) => consoleMessages.push(`${message.type()}: ${message.text()}`));
page.on('pageerror', (error) => consoleMessages.push(`pageerror: ${error.message}`));

function internalPoint(box, x, y) {
  return { x: box.x + x * box.width / 450, y: box.y + y * box.height / 820 };
}

try {
  if (renderAtlasSheet) {
    await page.addInitScript(() => {
      const BrowserWorker = window.Worker;
      window.Worker = class InspectableWorker extends BrowserWorker {
        set onmessage(handler) {
          super.onmessage = (event) => {
            if (event.data?.type === 'atlas') window.__padAtlasData = event.data;
            handler?.call(this, event);
          };
        }

        get onmessage() { return super.onmessage; }
      };
    });
  }
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

  const bombResolution = testBombResolution ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.setBoardFromCodes(['RBGHLD', 'BGLDHR', 'GLXHRB', 'LDHRBG', 'DHRBGL']);
    engine.phase = 'detect';
    engine.phaseTimer = 0;
    engine.advancePhase();
    const resolution = {
      phase: engine.phase,
      hp: engine.player.hp,
      damage: engine.lastBombDamage,
      clearedCells: engine.pendingBombCells.length,
    };
    engine.reset();
    engine.start();
    return resolution;
  }) : null;
  if (bombResolution && (
    bombResolution.phase !== 'clear' || bombResolution.hp !== 9_600 ||
    bombResolution.damage !== 2_400 || bombResolution.clearedCells !== 10
  )) throw new Error(`Bomb resolution mismatch: ${JSON.stringify(bombResolution)}`);

  const thornInput = testThornInput ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.setBoardFromCodes(['RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
    engine.setOrbState(0, 1, { thornPercent: 4 });
    engine.start();
    engine.startDrag(0, 0, 50, 475, 0.5, 0.5);
    engine.moveDrag(0, 1, 120, 475, 1.5, 0.5);
    engine.moveDrag(0, 0, 50, 475, 0.5, 0.5);
    const result = {
      hp: engine.player.hp,
      damage: engine.lastThornDamage,
      pathLength: engine.drag.pathLength,
      thornColumn: engine.board[0].findIndex((orb) => orb.thornPercent > 0),
    };
    engine.reset();
    engine.start();
    return result;
  }) : null;
  if (thornInput && (
    thornInput.hp !== 11_040 || thornInput.damage !== 960 ||
    thornInput.pathLength !== 2 || thornInput.thornColumn !== 1
  )) throw new Error(`Thorn input mismatch: ${JSON.stringify(thornInput)}`);

  const orbStateSample = showOrbStates ? await page.evaluate(() => {
    window.__puzzleGame.setBoardFromCodes(['XJPMRB', 'HRBGDL', 'BGHRDL', 'DLGRHB', 'HRBGLD']);
    window.__puzzleGame.setOrbState(0, 3, { enhanced: true, locked: false });
    window.__puzzleGame.setOrbState(0, 4, { enhanced: true, locked: true });
    window.__puzzleGame.setOrbState(0, 5, { thornPercent: 4 });
    return window.__puzzleGame.snapshot().boardState[0];
  }) : null;
  if (renderAtlasSheet) {
    const sheet = page.locator('#pad-atlas-sheet');
    await page.evaluate(() => {
      const atlas = window.__padAtlasData;
      if (!atlas) throw new Error('PAD atlas diagnostic data was not captured.');
      const source = document.createElement('canvas');
      source.width = atlas.width;
      source.height = atlas.height;
      source.getContext('2d').putImageData(
        new ImageData(new Uint8ClampedArray(atlas.pixels), atlas.width, atlas.height), 0, 0,
      );
      const canvas = document.createElement('canvas');
      canvas.id = 'pad-atlas-sheet';
      canvas.width = 600;
      canvas.height = Math.ceil(atlas.sprites.length / 6) * 116;
      const context = canvas.getContext('2d');
      context.fillStyle = '#182235';
      context.fillRect(0, 0, canvas.width, canvas.height);
      atlas.sprites.forEach((sprite, index) => {
        const x = index % 6 * 100;
        const y = Math.floor(index / 6) * 116;
        context.fillStyle = (index + Math.floor(index / 6)) % 2 ? '#526078' : '#38465e';
        context.fillRect(x, y, 100, 92);
        const scale = Math.min(86 / sprite.width, 86 / sprite.height);
        context.drawImage(source, sprite.x, sprite.y, sprite.width, sprite.height,
          x + (100 - sprite.width * scale) / 2, y + (92 - sprite.height * scale) / 2,
          sprite.width * scale, sprite.height * scale);
        context.fillStyle = '#ffffff';
        context.font = '700 16px sans-serif';
        context.textAlign = 'center';
        context.fillText(`${index} (${sprite.width}×${sprite.height})`, x + 50, y + 109);
      });
      document.body.append(canvas);
    });
    await sheet.screenshot({ path: `${outputPath}.atlas.png` });
  }
  await page.screenshot({ path: outputPath, fullPage: true });
  await fs.writeFile(`${outputPath}.json`, JSON.stringify({ before, during, after, bombResolution, thornInput, orbStateSample, consoleMessages }, null, 2));
  const atlasStatus = await page.locator('.puzzle-apk-art span').textContent();
  process.stdout.write(`${JSON.stringify({ atlasStatus, dragPathLength: during.drag.pathLength, turn: after.turn, phase: after.phase, bombResolution, thornInput, orbStateSample, consoleMessages }, null, 2)}\n`);
} finally {
  await browser.close();
}
