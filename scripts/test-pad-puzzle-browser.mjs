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
    window.__puzzleGame.setOrbState(0, 4, { enhancementPower: 2.5, locked: true });
    window.__puzzleGame.setOrbState(0, 5, { thornPercent: 4 });
    return window.__puzzleGame.snapshot().boardState[0];
  }) : null;
  if (orbStateSample && (
    orbStateSample[0].code !== 'X' || orbStateSample[0].enhanced !== false || orbStateSample[0].enhancementPower !== 0 ||
    orbStateSample[0].locked !== true || orbStateSample[4].enhancementPower !== 2.5
  )) throw new Error(`Numeric orb-state mismatch: ${JSON.stringify(orbStateSample)}`);
  const blockPowupSample = showOrbStates ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.setBoardFromCodes(['RRRBHD', 'GLDBHG', 'BHGDGL', 'DLGHHB', 'HBGGLD']);
    engine.setOrbState(0, 1, { enhancementPower: 0.25 });
    engine.setOrbState(0, 2, { enhancementPower: -0.5 });
    const before = engine.hasBlockPowup('fire');
    const changed = engine.setBlockPowup('fire', 0.1);
    const after = engine.hasBlockPowup(0);
    const invalid = engine.hasBlockPowup(6);
    const rejected = engine.setBlockPowup('jammer', 0.1);
    const powers = engine.snapshot().boardState[0].slice(0, 3).map((orb) => orb.enhancementPower);
    engine.reset();
    engine.start();
    return { before, changed, after, invalid, rejected, powers };
  }) : null;
  if (blockPowupSample && (
    blockPowupSample.before !== true || blockPowupSample.changed !== 2 ||
    blockPowupSample.after !== false || blockPowupSample.invalid !== true || blockPowupSample.rejected !== 0 ||
    blockPowupSample.powers[0] !== Math.fround(0.1) || blockPowupSample.powers[1] !== 0.25 ||
    blockPowupSample.powers[2] !== Math.fround(0.1)
  )) throw new Error(`Block-powup mismatch: ${JSON.stringify(blockPowupSample)}`);
  const blockMinusSample = showOrbStates ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    const startState = engine.rng.state;
    const dryCount = engine.doBlockMinus(false, 0b11, 0.2);
    const dryState = engine.rng.state;
    engine.setOrbState(0, 2, { enhancementPower: -0.5 });
    const cappedCount = engine.doBlockMinus(true, 0b11, 0.2, 2);
    const cappedState = engine.rng.state;
    const cappedNegatives = engine.snapshot().boardState[0].filter((orb) => orb.enhancementPower < 0).length;
    const allCount = engine.doBlockMinus(true, 0b11, 0.1);
    const allNegatives = engine.snapshot().boardState[0].filter((orb) => orb.enhancementPower < 0).length;
    engine.reset();
    engine.start();
    return { startState, dryCount, dryState, cappedCount, cappedState, cappedNegatives, allCount, allNegatives };
  }) : null;
  const expectedBlockMinusState = blockMinusSample
    ? (Math.imul(blockMinusSample.startState, 0x343fd) + 0x269ec3) >>> 0
    : null;
  if (blockMinusSample && (
    blockMinusSample.dryCount !== 4 || blockMinusSample.dryState !== blockMinusSample.startState ||
    blockMinusSample.cappedCount !== 2 || blockMinusSample.cappedState !== expectedBlockMinusState ||
    blockMinusSample.cappedNegatives !== 3 ||
    blockMinusSample.allCount !== 1 || blockMinusSample.allNegatives !== 4
  )) throw new Error(`Block-minus mismatch: ${JSON.stringify(blockMinusSample)}`);
  const burDropSample = showOrbStates ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    const startState = engine.rng.state;
    const zeroCount = engine.doMakeBurDrop(true, 0b11, 0, 4);
    const zeroState = engine.rng.state;
    const dryCount = engine.doMakeBurDrop(false, 0b11, 2, 4);
    const dryState = engine.rng.state;
    const applyCount = engine.doMakeBurDrop(true, 0b11, 2, 4);
    const applyState = engine.rng.state;
    const firstDescriptors = engine.snapshot().boardState[0]
      .filter((orb) => orb.thornActive)
      .map((orb) => orb.thornDescriptor);
    const remainingCount = engine.doMakeBurDrop(true, 0b11, 10, 5, true);
    const finalState = engine.rng.state;
    const finalStateOrbs = engine.snapshot().boardState[0].filter((orb) => orb.thornActive);
    engine.reset();
    engine.start();
    return {
      startState, zeroCount, zeroState, dryCount, dryState, applyCount, applyState,
      firstDescriptors, remainingCount, finalState,
      activeCount: finalStateOrbs.length,
      clearHighBitCount: finalStateOrbs.filter((orb) => orb.thornDescriptor === 5).length,
    };
  }) : null;
  const stepLcg = (state) => (Math.imul(state, 0x343fd) + 0x269ec3) >>> 0;
  if (burDropSample && (
    burDropSample.zeroCount !== 0 || burDropSample.zeroState !== burDropSample.startState ||
    burDropSample.dryCount !== 2 || burDropSample.dryState !== stepLcg(burDropSample.startState) ||
    burDropSample.applyCount !== 2 || burDropSample.applyState !== stepLcg(burDropSample.dryState) ||
    burDropSample.firstDescriptors.some((descriptor) => descriptor !== 0x84) ||
    burDropSample.remainingCount !== 2 || burDropSample.finalState !== stepLcg(burDropSample.applyState) ||
    burDropSample.activeCount !== 4 || burDropSample.clearHighBitCount !== 2
  )) throw new Error(`Burst-drop mismatch: ${JSON.stringify(burDropSample)}`);
  const lockDropSample = showOrbStates ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    engine.setOrbState(0, 1, { locked: true });
    engine.setOrbState(0, 2, { enhancementPower: 0.25 });
    const startState = engine.rng.state;
    const zeroResult = engine.doLockDropBits(0b11, 0, 21_900);
    const zeroLocked = engine.snapshot().boardState[0].filter((orb) => orb.locked).length;
    const applyResult = engine.doLockDropBits(0b11, 2, 21_900);
    const naturalState = engine.snapshot().boardState[0];
    const endState = engine.rng.state;
    engine.setBoardFromCodes(['JPMXHD', 'GLDHRG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
    for (let column = 0; column < 4; column += 1) {
      engine.setOrbState(0, column, { blockFlags: 0x28000, enhancementPower: 0.5 });
    }
    const specialResult = engine.doLockDropBits(0x3c0, 4, 0xbeef);
    const specialState = engine.snapshot().boardState[0].slice(0, 4);
    engine.reset();
    engine.start();
    return { startState, zeroResult, zeroLocked, applyResult, naturalState, endState, specialResult, specialState };
  }) : null;
  if (lockDropSample && (
    lockDropSample.zeroResult !== true || lockDropSample.zeroLocked !== 1 ||
    lockDropSample.applyResult !== true || lockDropSample.endState !== lockDropSample.startState ||
    lockDropSample.naturalState.filter((orb) => orb.locked).length !== 3 ||
    !lockDropSample.naturalState[2].locked || lockDropSample.naturalState[2].enhancementPower !== 0.25 ||
    !lockDropSample.naturalState[3].locked || lockDropSample.specialResult !== true ||
    lockDropSample.specialState.some((orb) => (
      !orb.locked || (orb.blockFlags & 0x800) !== 0x800 ||
      (orb.blockFlags & 0x28000) !== 0 || orb.enhancementPower !== 0
    ))
  )) throw new Error(`Lock-drop mismatch: ${JSON.stringify(lockDropSample)}`);
  const poisonBlockSample = showOrbStates ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const board = ['RHPBRD', 'GMDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD'];
    engine.reset();
    engine.setBoardFromCodes(board);
    engine.board.forEach((row, rowIndex) => row.forEach((orb, columnIndex) => {
      if (!['poison', 'mortalPoison', 'heart'].includes(orb.type)) {
        engine.setOrbState(rowIndex, columnIndex, { locked: true });
      }
    }));
    const lockedStartState = engine.rng.state;
    const lockedChanged = engine.doPoisonBlockN('poison', 3, true);
    const lockedEndState = engine.rng.state;
    engine.setBoardFromCodes(board);
    const startState = engine.rng.state;
    const beforeMortal = engine.board.flat().filter((orb) => orb.type === 'mortalPoison').length;
    const changed = engine.doPoisonBlockN(8, 5, true);
    const endState = engine.rng.state;
    const afterMortal = engine.board.flat().filter((orb) => orb.type === 'mortalPoison').length;
    engine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    engine.setFaceTypes([0, 1, 2, 3, 4, 5]);
    engine.setRngState(21_900);
    engine.setOrbState(0, 1, { locked: true });
    const bulkStartState = engine.rng.state;
    const bulkChanged = engine.doPoisonBlocks(7, 2);
    const bulkEndState = engine.rng.state;
    const bulkPoison = engine.board.flat().filter((orb) => orb.type === 'poison').length;
    const bulkLockedType = engine.board[0][1].type;
    engine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    engine.setRngState(21_900);
    engine.setOrbState(0, 3, { locked: true });
    const maskedDryCount = engine.doPoisonBlockN2(2, 0xc0, 0x1a0, true);
    const maskedDryState = engine.rng.state;
    const maskedAttempted = engine.doPoisonBlockN2(2, 0xc0, 0x1a0);
    const maskedEndState = engine.rng.state;
    const maskedTypes = [[3, 5], [0, 3], [2, 4], [0, 5]]
      .map(([row, column]) => engine.board[row][column].type);
    engine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    engine.setRngState(21_900);
    const selectedRows = new Uint16Array(5);
    const mappedAttempted = engine.doPoisonBlockN2(2, 0xc0, 0xffff_ffff, false, false, selectedRows);
    const mappedTypes = [[2, 5], [0, 3], [2, 0], [4, 3]]
      .map(([row, column]) => engine.board[row][column].type);
    engine.setBoardFromCodes(['JPMXHD', 'GLDHRG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
    engine.setOrbState(0, 1, { locked: true });
    const blockCounts = {
      poisonMask: engine.countBlockBits(1 << 7),
      mortalMask: engine.countBlockBits(1 << 8),
      bombMask: engine.countBlockBits(1 << 9),
      nonPoison: engine.countNonPoisonBlocks(),
      nonPoisonNoHeart: engine.countNonPoisonBlocks(true),
    };
    engine.setBoardFromCodes(['DDDDHD', 'GLDHRG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
    engine.setRngState(21_900);
    engine.setOrbState(0, 1, { locked: true });
    engine.setOrbState(0, 2, { enhancementPower: 0.5 });
    const randomReplaceFlags = engine.doBitReplace([0b1111, 0, 0, 0, 0], -1, 8);
    const randomReplaceState = engine.rng.state;
    const randomReplaceTypes = engine.board[0].slice(0, 4).map((orb) => orb.type);
    engine.setOrbState(0, 0, { blockFlags: 0xa8000, enhancementPower: 0.5 });
    const poisonReplaceFlags = engine.doBitReplace([0b11, 0, 0, 0, 0], 7, 4);
    const poisonReplaceState = engine.rng.state;
    const poisonReplaceOrb = engine.snapshot().boardState[0][0];
    engine.setBoardFromCodes(['RRRRHD', 'GLDHJG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
    engine.setRngState(21_900);
    engine.setOrbState(0, 1, { locked: true });
    const maskSwapFlags = engine.doBlockSwap5(1, (1 << 1) | (1 << 2));
    const maskSwapState = engine.rng.state;
    const maskSwapTypes = engine.board[0].slice(0, 4).map((orb) => orb.type);
    engine.setBoardFromCodes(['PMJGHD', 'GLDHRG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
    engine.setRngState(21_900);
    engine.setOrbState(0, 1, { locked: true });
    const poisonSwapFlags = engine.doBlockSwap4((1 << 0) | (1 << 1), 4);
    const poisonSwapState = engine.rng.state;
    const poisonSwapTypes = engine.board[0].slice(0, 2).map((orb) => orb.type);
    engine.setBoardFromCodes(['PMJGHD', 'GLDHRG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
    engine.setRngState(21_900);
    engine.setOrbState(0, 1, { locked: true });
    const explicitSwapFlags = engine.doBlockSwap2(2, 3, -1, 9, 4);
    const explicitSwapState = engine.rng.state;
    const explicitSwapTypes = engine.board[0].slice(0, 2).map((orb) => orb.type);
    engine.setBoardFromCodes(Array(5).fill('XXXXXX'));
    engine.setRngState(21_900);
    engine.setOrbState(0, 0, { locked: true });
    engine.setOrbState(0, 1, { enhancementPower: 0.5 });
    const skillSwapChanged = engine.doBlockSwap3({ types: [0, 1, 2, -1, 9] });
    const skillSwapState = engine.rng.state;
    const skillSwapCounts = ['fire', 'water', 'wood', 'bomb'].map((type) => (
      engine.board.flat().filter((orb) => orb.type === type).length
    ));
    const skillSwapFirst = engine.snapshot().boardState[0].slice(0, 2);
    engine.setBoardFromCodes(['DDDDHD', 'GLDHRG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
    engine.setRngState(21_900);
    engine.setOrbState(2, 3, { locked: true });
    const verticalSwapFlags = engine.doBlockSwapV(0b1001, (1 << 0) | (1 << 5), 8);
    const verticalSwapState = engine.rng.state;
    const verticalSwapTypes = [[0, 0], [0, 3], [2, 3]]
      .map(([row, column]) => engine.board[row][column].type);
    engine.setBoardFromCodes(['DDDDHD', 'GLDHRG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
    engine.setRngState(21_900);
    engine.setOrbState(0, 0, { locked: true });
    const horizontalSwapFlags = engine.doBlockSwapH(0b10001, (1 << 6) | (1 << 7), 1);
    const horizontalSwapState = engine.rng.state;
    const horizontalSwapTypes = [[0, 0], [0, 1], [4, 0]]
      .map(([row, column]) => engine.board[row][column].type);
    engine.setBoardFromCodes(Array(5).fill('DDDDDD'));
    engine.setRngState(21_900);
    const passiveBlockFlag = { poisonResist: true, jammerResist: true };
    const passivePoisonFlags = engine.doBitReplace([0b11, 0, 0, 0, 0], 7, 4, passiveBlockFlag);
    const passiveJammerFlags = engine.doBitReplace([0b11, 0, 0, 0, 0], 6, 2, passiveBlockFlag);
    const passiveFixedState = engine.rng.state;
    const passiveFixedTypes = engine.board[0].slice(0, 2).map((orb) => orb.type);
    const passiveBlockFlagByte = passiveBlockFlag.byte;
    const passiveLineFlag = { poisonResist: true };
    const passiveLineFlags = engine.doBlockSwapV(1, 1 << 7, 8, passiveLineFlag);
    const passiveLineState = engine.rng.state;
    const passiveLineTypes = engine.board.map((row) => row[0].type);
    const passiveLineFlagByte = passiveLineFlag.byte;
    engine.setBoardFromCodes(Array(5).fill('DDDDDD'));
    engine.setRngState(21_900);
    engine.board[0][0] = null;
    engine.collapseAndRefill();
    const skyfallType = engine.board[0][0].type;
    const skyfallState = engine.rng.state;
    engine.setDropRates([0.1]);
    engine.setRngState(21_900);
    engine.board[0][0] = null;
    engine.collapseAndRefill();
    const weightedSkyfallType = engine.board[0][0].type;
    const weightedSkyfallState = engine.rng.state;
    engine.setDropRates([]);
    engine.skyfallExclusionMask = 1 << 0;
    engine.setRngState(21_900);
    engine.board[0][0] = null;
    engine.collapseAndRefill();
    const excludedSkyfallType = engine.board[0][0].type;
    const excludedSkyfallState = engine.rng.state;
    engine.skyfallExclusionMask = 0;
    engine.setBoardFromCodes(Array(5).fill('DDDDDD'));
    engine.setRngState(21_900);
    engine.board[1][0] = null;
    engine.board[3][0] = null;
    engine.collapseAndRefill();
    const orderedSkyfallTypes = engine.board.map((row) => row[0].type);
    const orderedSkyfallState = engine.rng.state;
    engine.setBoardFromCodes(Array(5).fill('DDDDDD'));
    engine.setRngState(21_900);
    engine.pendingComboDrops = 2;
    engine.board[1][0] = null;
    engine.board[3][0] = null;
    engine.collapseAndRefill();
    const comboDropSkyfallFlags = engine.board.slice(0, 2).map((row) => row[0].blockFlags);
    const comboDropSkyfallState = engine.rng.state;
    engine.setTopLineDropTypes([2, 3, 4, 5, 0, 1]);
    engine.setBoardFromCodes(Array(5).fill('DDDDDD'));
    engine.setRngState(21_900);
    engine.board[1][0] = null;
    engine.board[3][0] = null;
    engine.collapseAndRefill();
    const topLineSkyfallTypes = engine.board.map((row) => row[0].type);
    const topLineSkyfallState = engine.rng.state;
    engine.setTopLineDropTypes(null);
    engine.setComboDropAwakenings([2, 0, 0, 0, 0]);
    engine.setBoardFromCodes([
      'RRRRRR', 'RRRRBG', 'BGLHDB', 'GLHDBG', 'LHDBGL',
    ]);
    engine.phase = 'detect';
    engine.advancePhase();
    const comboDropAwakeningMatchSize = engine.pendingMatches[0]?.size;
    const comboDropAwakeningCombos = engine.comboCount;
    const comboDropAwakeningBonus = engine.comboDropBonusCount;
    const comboDropAwakeningPending = engine.pendingComboDrops;
    engine.setComboDropAwakenings([0, 0, 0, 0, 0]);
    engine.reset();
    const initialBoard = engine.snapshot().board;
    const initialBoardState = engine.rng.state;
    engine.start();
    return {
      lockedStartState, lockedChanged, lockedEndState, startState, changed, endState,
      beforeMortal, afterMortal, bulkStartState, bulkChanged, bulkEndState, bulkPoison, bulkLockedType,
      maskedDryCount, maskedDryState, maskedAttempted, maskedEndState, maskedTypes,
      mappedAttempted, selectedRows: [...selectedRows], mappedTypes, blockCounts,
      randomReplaceFlags, randomReplaceState, randomReplaceTypes,
      poisonReplaceFlags, poisonReplaceState, poisonReplaceOrb,
      maskSwapFlags, maskSwapState, maskSwapTypes,
      poisonSwapFlags, poisonSwapState, poisonSwapTypes,
      explicitSwapFlags, explicitSwapState, explicitSwapTypes,
      skillSwapChanged, skillSwapState, skillSwapCounts, skillSwapFirst,
      verticalSwapFlags, verticalSwapState, verticalSwapTypes,
      horizontalSwapFlags, horizontalSwapState, horizontalSwapTypes,
      passivePoisonFlags, passiveJammerFlags, passiveFixedState, passiveFixedTypes,
      passiveBlockFlagByte, passiveLineFlags, passiveLineState, passiveLineTypes, passiveLineFlagByte,
      skyfallType, skyfallState, weightedSkyfallType, weightedSkyfallState,
      excludedSkyfallType, excludedSkyfallState,
      orderedSkyfallTypes, orderedSkyfallState,
      comboDropSkyfallFlags, comboDropSkyfallState,
      topLineSkyfallTypes, topLineSkyfallState,
      comboDropAwakeningMatchSize, comboDropAwakeningCombos,
      comboDropAwakeningBonus, comboDropAwakeningPending,
      initialBoard, initialBoardState,
    };
  }) : null;
  const advanceLcg = (state, count) => {
    let next = state;
    for (let index = 0; index < count; index += 1) next = stepLcg(next);
    return next;
  };
  if (poisonBlockSample && (
    poisonBlockSample.lockedChanged !== 0 ||
    poisonBlockSample.lockedEndState !== advanceLcg(poisonBlockSample.lockedStartState, 6) ||
    poisonBlockSample.changed !== 5 ||
    poisonBlockSample.endState !== advanceLcg(poisonBlockSample.startState, 10) ||
    poisonBlockSample.afterMortal - poisonBlockSample.beforeMortal !== 5 ||
    poisonBlockSample.bulkChanged !== 5 ||
    poisonBlockSample.bulkEndState !== advanceLcg(poisonBlockSample.bulkStartState, 2) ||
    poisonBlockSample.bulkPoison !== 5 || poisonBlockSample.bulkLockedType !== 'water' ||
    poisonBlockSample.maskedDryCount !== 23 || poisonBlockSample.maskedDryState !== 21_900 ||
    poisonBlockSample.maskedAttempted !== 4 || poisonBlockSample.maskedEndState !== 3_803_934_822 ||
    JSON.stringify(poisonBlockSample.maskedTypes) !== JSON.stringify(['jammer', 'water', 'poison', 'poison']) ||
    poisonBlockSample.mappedAttempted !== 4 ||
    JSON.stringify(poisonBlockSample.selectedRows) !== JSON.stringify([0x08, 0, 0x21, 0, 0x08]) ||
    JSON.stringify(poisonBlockSample.mappedTypes) !== JSON.stringify(['jammer', 'jammer', 'poison', 'poison']) ||
    JSON.stringify(poisonBlockSample.blockCounts) !== JSON.stringify({
      poisonMask: 2, mortalMask: 1, bombMask: 1, nonPoison: 28, nonPoisonNoHeart: 22,
    }) || poisonBlockSample.randomReplaceFlags !== 9 ||
    poisonBlockSample.randomReplaceState !== 1_929_471_377 ||
    JSON.stringify(poisonBlockSample.randomReplaceTypes) !== JSON.stringify(['fire', 'dark', 'heart', 'wood']) ||
    poisonBlockSample.poisonReplaceFlags !== 6 ||
    poisonBlockSample.poisonReplaceState !== poisonBlockSample.randomReplaceState ||
    poisonBlockSample.poisonReplaceOrb.code !== 'P' ||
    poisonBlockSample.poisonReplaceOrb.blockFlags !== 0x80000 ||
    poisonBlockSample.poisonReplaceOrb.enhancementPower !== 0 ||
    poisonBlockSample.maskSwapFlags !== 1 || poisonBlockSample.maskSwapState !== 1_569_558_794 ||
    JSON.stringify(poisonBlockSample.maskSwapTypes) !== JSON.stringify(['wood', 'fire', 'wood', 'water']) ||
    poisonBlockSample.poisonSwapFlags !== 5 || poisonBlockSample.poisonSwapState !== 919_597_584 ||
    JSON.stringify(poisonBlockSample.poisonSwapTypes) !== JSON.stringify(['fire', 'mortalPoison']) ||
    poisonBlockSample.explicitSwapFlags !== 5 || poisonBlockSample.explicitSwapState !== 919_597_584 ||
    JSON.stringify(poisonBlockSample.explicitSwapTypes) !== JSON.stringify(['wood', 'mortalPoison']) ||
    poisonBlockSample.skillSwapChanged !== 29 || poisonBlockSample.skillSwapState !== 4_172_709_003 ||
    JSON.stringify(poisonBlockSample.skillSwapCounts) !== JSON.stringify([12, 9, 8, 1]) ||
    poisonBlockSample.skillSwapFirst[0].code !== 'X' || !poisonBlockSample.skillSwapFirst[0].locked ||
    poisonBlockSample.skillSwapFirst[1].code !== 'G' ||
    poisonBlockSample.skillSwapFirst[1].enhancementPower !== 0.5 ||
    poisonBlockSample.verticalSwapFlags !== 9 || poisonBlockSample.verticalSwapState !== 4_221_117_678 ||
    JSON.stringify(poisonBlockSample.verticalSwapTypes) !== JSON.stringify(['fire', 'heart', 'dark']) ||
    poisonBlockSample.horizontalSwapFlags !== 7 || poisonBlockSample.horizontalSwapState !== 2_782_038_744 ||
    JSON.stringify(poisonBlockSample.horizontalSwapTypes) !== JSON.stringify(['dark', 'poison', 'jammer']) ||
    poisonBlockSample.passivePoisonFlags !== 4 || poisonBlockSample.passiveJammerFlags !== 2 ||
    poisonBlockSample.passiveFixedState !== 21_900 ||
    JSON.stringify(poisonBlockSample.passiveFixedTypes) !== JSON.stringify(['dark', 'dark']) ||
    poisonBlockSample.passiveBlockFlagByte !== 0xbb || poisonBlockSample.passiveLineFlags !== 8 ||
    poisonBlockSample.passiveLineState !== advanceLcg(21_900, 5) ||
    JSON.stringify(poisonBlockSample.passiveLineTypes) !== JSON.stringify(Array(5).fill('dark')) ||
    poisonBlockSample.passiveLineFlagByte !== 0x0b || poisonBlockSample.skyfallType !== 'fire' ||
    poisonBlockSample.skyfallState !== 394_448_415 ||
    poisonBlockSample.weightedSkyfallType !== 'fire' ||
    poisonBlockSample.weightedSkyfallState !== 3_803_934_822 ||
    poisonBlockSample.excludedSkyfallType !== 'water' ||
    poisonBlockSample.excludedSkyfallState !== 394_448_415 ||
    JSON.stringify(poisonBlockSample.orderedSkyfallTypes) !== JSON.stringify([
      'fire', 'heart', 'dark', 'dark', 'dark',
    ]) || poisonBlockSample.orderedSkyfallState !== 3_803_934_822 ||
    JSON.stringify(poisonBlockSample.comboDropSkyfallFlags) !== JSON.stringify([0x8000, 0x8000]) ||
    poisonBlockSample.comboDropSkyfallState !== 919_597_584 ||
    JSON.stringify(poisonBlockSample.topLineSkyfallTypes) !== JSON.stringify([
      'wood', 'wood', 'dark', 'dark', 'dark',
    ]) || poisonBlockSample.topLineSkyfallState !== 21_900 ||
    poisonBlockSample.comboDropAwakeningMatchSize !== 10 ||
    poisonBlockSample.comboDropAwakeningCombos !== 3 ||
    poisonBlockSample.comboDropAwakeningBonus !== 2 ||
    poisonBlockSample.comboDropAwakeningPending !== 2 ||
    JSON.stringify(poisonBlockSample.initialBoard) !== JSON.stringify([
      'RHGBGG', 'BBGHRL', 'LDBRHR', 'BHLDBH', 'LRLDHR',
    ]) || poisonBlockSample.initialBoardState !== 79_238_434
  )) throw new Error(`Poison-block mismatch: ${JSON.stringify(poisonBlockSample)}`);
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
  await fs.writeFile(`${outputPath}.json`, JSON.stringify({ before, during, after, bombResolution, thornInput, orbStateSample, blockPowupSample, blockMinusSample, burDropSample, lockDropSample, poisonBlockSample, largeBoard, tapTurn, matchShape, attackRounds, pointerIdentity, moveDeadline, consoleMessages }, null, 2));
  const atlasStatus = await page.locator('.puzzle-apk-art span').textContent();
  process.stdout.write(`${JSON.stringify({ atlasStatus, dragPathLength: during.drag.pathLength, turn: after.turn, phase: after.phase, bombResolution, thornInput, orbStateSample, blockPowupSample, blockMinusSample, burDropSample, lockDropSample, poisonBlockSample, largeBoard, tapTurn, matchShape, attackRounds, pointerIdentity, moveDeadline, consoleMessages }, null, 2)}\n`);
} finally {
  await browser.close();
}
