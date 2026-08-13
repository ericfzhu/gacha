import fs from 'node:fs/promises';

const { chromium } = await import(process.env.GACHA_PLAYWRIGHT_MODULE || 'playwright');
const url = process.argv[2] || 'http://127.0.0.1:4173/puzzle';
const outputPath = process.argv[3] || '/tmp/gacha-pad-puzzle.png';
const apkArgument = process.argv[4];
const apkPath = apkArgument && !apkArgument.startsWith('--') ? apkArgument : null;
const showOrbStates = process.argv.includes('--orb-states');
const renderAtlasSheet = process.argv.includes('--atlas-sheet');
const testBombResolution = process.argv.includes('--bomb-resolution');
const testThornInput = process.argv.includes('--thorn-input');
const testLargeBoard = process.argv.includes('--large-board');
const testTapTurn = process.argv.includes('--tap-turn');
const testMatchShapes = process.argv.includes('--match-shapes');
const testAttackRounds = process.argv.includes('--attack-rounds');
const testPointerIdentity = process.argv.includes('--pointer-identity');
const testMoveDeadline = process.argv.includes('--move-deadline');
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
  if (!Number.isInteger(before.rngState) || before.rngState < 0 || before.rngState > 0xffff_ffff) {
    throw new Error(`Puzzle snapshot exposed invalid native RNG state: ${before.rngState}.`);
  }

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
  if (during.rngState !== before.rngState) throw new Error('Pointer movement consumed native RNG state before a board refill.');
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
      bombPhase: engine.phase,
      hp: engine.player.hp,
      damage: engine.lastBombDamage,
      clearedCells: engine.pendingBombCells.length,
    };
    engine.advancePhase();
    resolution.clearPhase = engine.phase;
    engine.applyPlayerHpResolution();
    resolution.resolvedHp = engine.player.hp;
    engine.reset();
    engine.start();
    return resolution;
  }) : null;
  if (bombResolution && (
    bombResolution.bombPhase !== 'bomb' || bombResolution.clearPhase !== 'clear' || bombResolution.hp !== 12_000 ||
    bombResolution.resolvedHp !== 9_600 || bombResolution.damage !== 2_400 || bombResolution.clearedCells !== 10
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
    engine.applyPlayerHpResolution();
    result.resolvedHp = engine.player.hp;
    engine.reset();
    engine.start();
    return result;
  }) : null;
  if (thornInput && (
    thornInput.hp !== 12_000 || thornInput.resolvedHp !== 11_040 || thornInput.damage !== 960 ||
    thornInput.pathLength !== 2 || thornInput.thornColumn !== 1
  )) throw new Error(`Thorn input mismatch: ${JSON.stringify(thornInput)}`);

  const orbStateSample = showOrbStates ? await page.evaluate(() => {
    window.__puzzleGame.setBoardFromCodes(['XJPMRB', 'HRBGDL', 'BGHRDL', 'DLGRHB', 'HRBGLD']);
    window.__puzzleGame.setOrbState(0, 0, { enhanced: true, locked: true });
    window.__puzzleGame.setOrbState(0, 3, { enhanced: true, locked: false });
    window.__puzzleGame.setOrbState(0, 4, { enhanced: true, locked: true });
    window.__puzzleGame.setOrbState(0, 5, { thornPercent: 4 });
    return window.__puzzleGame.snapshot().boardState[0];
  }) : null;
  if (orbStateSample && (
    orbStateSample[0].code !== 'X' || orbStateSample[0].enhanced !== false || orbStateSample[0].locked !== true
  )) throw new Error(`Special locked-orb state mismatch: ${JSON.stringify(orbStateSample[0])}`);
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
  const largeBoard = testLargeBoard ? await (async () => {
    await page.getByRole('button', { name: '7 by 6 board' }).click();
    await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).boardDimensions?.columns === 7);
    const ready = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
    const startPoint = internalPoint(box, 225, 570);
    await page.mouse.click(startPoint.x, startPoint.y);
    const from = internalPoint(box, 341.67, 760.83);
    const to = internalPoint(box, 400, 760.83);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 1 });
    const duringDrag = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
    await page.mouse.up();
    const result = {
      dimensions: ready.boardDimensions,
      rowCount: ready.board.length,
      columnCount: ready.board[0].length,
      dragColumn: duringDrag.drag?.column,
      pathLength: duringDrag.drag?.pathLength,
    };
    // Changing the preset replaces window.__puzzleGame. Restore the normal
    // engine so a combined all-flags run cannot leak 7x6 dimensions into the
    // later fixed 6x5 fixtures.
    await page.getByRole('button', { name: '6 by 5 board' }).click();
    await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).boardDimensions?.columns === 6);
    return result;
  })() : null;
  if (largeBoard && (
    largeBoard.dimensions.rows !== 6 || largeBoard.dimensions.columns !== 7 ||
    largeBoard.rowCount !== 6 || largeBoard.columnCount !== 7 ||
    largeBoard.dragColumn !== 6 || largeBoard.pathLength !== 1
  )) throw new Error(`Large board mismatch: ${JSON.stringify(largeBoard)}`);
  const tapTurn = testTapTurn ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    const board = engine.snapshot().board;
    return { board, turn: engine.turn };
  }) : null;
  if (tapTurn) {
    const tapPoint = internalPoint(box, 35, 447);
    await page.mouse.click(tapPoint.x, tapPoint.y);
    const tapped = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
    if (tapped.turn !== tapTurn.turn + 1 || tapped.phase !== 'detect' ||
        JSON.stringify(tapped.board) !== JSON.stringify(tapTurn.board)) {
      throw new Error(`Zero-distance tap turn mismatch: ${JSON.stringify(tapped)}`);
    }
    tapTurn.after = { turn: tapped.turn, phase: tapped.phase, boardUnchanged: true };
  }
  const matchShape = testMatchShapes ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.setBoardFromCodes(['RRRRRR', 'BGRDLH', 'GLRHBJ', 'LDHBRG', 'DHBGGL']);
    engine.start();
    engine.phase = 'detect';
    engine.phaseTimer = 0;
    engine.advancePhase();
    return engine.snapshot().turnMatches[0];
  }) : null;
  if (matchShape && (
    matchShape.type !== 'fire' || matchShape.size !== 8 || matchShape.isRow !== true ||
    matchShape.isHorizontal !== false || matchShape.cascadeDepth !== 1
  )) throw new Error(`Turn-level match shape mismatch: ${JSON.stringify(matchShape)}`);
  const attackRounds = testAttackRounds ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.party = [
      { id: 'one', name: 'One', attribute: 'fire', attack: 30, recovery: 0 },
      { id: 'two', name: 'Two', attribute: 'fire', attack: 30, recovery: 0 },
    ];
    engine.enemies[0] = { ...engine.enemies[0], hp: 10, attribute: 'light', defense: 0 };
    engine.enemies[1] = { ...engine.enemies[1], hp: 1_000, attribute: 'light', defense: 0 };
    engine.selectEnemy(0);
    const selected = engine.snapshot();
    engine.comboCount = 1;
    engine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
    engine.resolvePlayerTurn();
    const resolved = engine.snapshot();
    const result = {
      selectedTarget: selected.targetEnemy,
      selectedManually: selected.manualTarget,
      damageTargets: engine.floatingText.filter(({ kind }) => kind === 'damage').map(({ enemy }) => enemy),
      resolvedTarget: resolved.targetEnemy,
      resolvedManually: resolved.manualTarget,
    };
    engine.reset();
    engine.allowDiagonalMoves = true;
    engine.party = [{ id: 'diagonal', name: 'Diagonal', attribute: 'fire', attack: 100, recovery: 0 }];
    engine.enemies[0] = { ...engine.enemies[0], hp: 1_000, attribute: 'light', defense: 0 };
    engine.enemies[1].hp = 0;
    engine.comboCount = 3;
    engine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
    engine.resolvePlayerTurn();
    result.diagonalComboDamage = engine.lastDamage;
    engine.reset();
    engine.party = [{ id: 'mass', name: 'Mass', attribute: 'fire', attack: 100, recovery: 0 }];
    engine.enemies[0] = { ...engine.enemies[0], hp: 10, attribute: 'light', defense: 0 };
    engine.enemies[1] = { ...engine.enemies[1], hp: 1_000, attribute: 'light', defense: 0 };
    engine.selectEnemy(0);
    engine.comboCount = 1;
    engine.turnMatches = [{ type: 'fire', size: 5, enhancedCount: 0 }];
    engine.resolvePlayerTurn();
    result.massTarget = { manual: engine.manualTarget, target: engine.targetEnemy };
    engine.allowDiagonalMoves = false;
    engine.reset();
    engine.start();
    return result;
  }) : null;
  if (attackRounds && (
    attackRounds.selectedTarget !== 0 || attackRounds.selectedManually !== true ||
    JSON.stringify(attackRounds.damageTargets) !== JSON.stringify([0, 1]) ||
    attackRounds.resolvedTarget !== 1 || attackRounds.resolvedManually !== false ||
    attackRounds.diagonalComboDamage !== 200 || attackRounds.massTarget?.manual !== false ||
    attackRounds.massTarget?.target !== 1
  )) throw new Error(`Attack round retarget mismatch: ${JSON.stringify(attackRounds)}`);
  const pointerIdentity = testPointerIdentity ? await (async () => {
    await page.evaluate(() => {
      window.__puzzleGame.reset();
      window.__puzzleGame.start();
    });
    const pointerFrom = internalPoint(box, 35, 447);
    const pointerTo = internalPoint(box, 105, 447);
    await page.mouse.move(pointerFrom.x, pointerFrom.y);
    await page.mouse.down();
    const started = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
    await page.evaluate(({ x, y }) => {
      const canvas = document.querySelector('canvas[aria-label^="Orb Battle Lab"]');
      for (const type of ['pointermove', 'pointerup']) {
        canvas.dispatchEvent(new PointerEvent(type, {
          bubbles: true,
          clientX: x,
          clientY: y,
          pointerId: 99,
          pointerType: 'touch',
        }));
      }
    }, pointerTo);
    const afterForeignPointer = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
    await page.mouse.move(pointerTo.x, pointerTo.y);
    const afterActivePointer = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
    await page.mouse.up();
    const released = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
    await page.evaluate(() => {
      window.__puzzleGame.reset();
      window.__puzzleGame.start();
    });
    return {
      startedPathLength: started.drag?.pathLength,
      foreignPathLength: afterForeignPointer.drag?.pathLength,
      foreignKeptDrag: Boolean(afterForeignPointer.drag),
      activePathLength: afterActivePointer.drag?.pathLength,
      releasedDrag: released.drag,
      releasedTurn: released.turn,
    };
  })() : null;
  if (pointerIdentity && (
    pointerIdentity.startedPathLength !== 0 || pointerIdentity.foreignPathLength !== 0 ||
    pointerIdentity.foreignKeptDrag !== true || pointerIdentity.activePathLength !== 1 ||
    pointerIdentity.releasedDrag !== null || pointerIdentity.releasedTurn !== 1
  )) throw new Error(`Pointer identity mismatch: ${JSON.stringify(pointerIdentity)}`);
  const moveDeadline = testMoveDeadline ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.startDrag(0, 0, 35, 447, 0.5, 0.5);
    engine.update(6);
    const result = { drag: engine.drag, turn: engine.turn, phase: engine.phase };
    engine.reset();
    engine.start();
    return result;
  }) : null;
  if (moveDeadline && (
    moveDeadline.drag !== null || moveDeadline.turn !== 1 || moveDeadline.phase !== 'detect'
  )) throw new Error(`Move deadline mismatch: ${JSON.stringify(moveDeadline)}`);
  await page.screenshot({ path: outputPath, fullPage: true });
  await fs.writeFile(`${outputPath}.json`, JSON.stringify({ before, during, after, bombResolution, thornInput, orbStateSample, largeBoard, tapTurn, matchShape, attackRounds, pointerIdentity, moveDeadline, consoleMessages }, null, 2));
  const atlasStatus = await page.locator('.puzzle-apk-art span').textContent();
  process.stdout.write(`${JSON.stringify({ atlasStatus, dragPathLength: during.drag.pathLength, turn: after.turn, phase: after.phase, bombResolution, thornInput, orbStateSample, largeBoard, tapTurn, matchShape, attackRounds, pointerIdentity, moveDeadline, consoleMessages }, null, 2)}\n`);
} finally {
  await browser.close();
}
