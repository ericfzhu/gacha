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
const renderNailState = process.argv.includes('--nail-render');
const renderBlackFallState = process.argv.includes('--black-fall-render');
const renderBindState = process.argv.includes('--bind-render');
const renderAttributeAbsorbState = process.argv.includes('--attribute-absorb-render');
const renderReviveState = process.argv.includes('--revive-render');
const renderAttributeChangeState = process.argv.includes('--attribute-change-render');
const renderSelfDestructState = process.argv.includes('--self-destruct-render');
const renderMoveTimeState = process.argv.includes('--move-time-render');
const renderStatusShieldState = process.argv.includes('--status-shield-render');
const renderAttackBoostState = process.argv.includes('--attack-boost-render');
const renderClearPlayerBuffsState = process.argv.includes('--clear-player-buffs-render');
const renderEarlyHealAttackState = process.argv.includes('--early-heal-attack-render');
const renderEarlyDefenseShieldsState = process.argv.includes('--early-defense-shields-render');
const renderEarlyPartyControlState = process.argv.includes('--early-party-control-render');
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
    engine.pendingComboDrops = 0;
    engine.comboDropBonusCount = 0;
    engine.setLockFallRules([{ typeMask: 1 << 0, chancePercent: 100 }]);
    engine.setBoardFromCodes(Array(5).fill('DDDDDD'));
    engine.setRngState(21_900);
    engine.setLockFallRngState(21_900);
    engine.board[0][0] = null;
    engine.collapseAndRefill();
    const lockFallType = engine.board[0][0].type;
    const lockFallLocked = engine.board[0][0].locked;
    const lockFallMainState = engine.rng.state;
    const lockFallRuleState = engine.lockFallRng.state;
    engine.setThornFallRule({
      typeMask: 1 << 0,
      chancePercent: 100,
      descriptor: 4,
      descriptorHighBit: true,
    });
    engine.setNailFallRule({ chancePercent: 100 });
    engine.setBoardFromCodes(Array(5).fill('DDDDDD'));
    engine.setRngState(21_900);
    engine.setLockFallRngState(21_900);
    engine.board[0][0] = null;
    engine.collapseAndRefill();
    const thornFallOrb = engine.snapshot().boardState[0][0];
    const thornFallMainState = engine.rng.state;
    const thornFallRuleState = engine.lockFallRng.state;
    engine.setThornFallRule(null);
    engine.setNailFallRule(null);
    engine.setLockFallRules([]);
    engine.setBoardFromCodes([
      'RRRHBG', 'BGLHDB', 'GLHDBG', 'LHDBGL', 'HDBGLH',
    ]);
    for (let column = 0; column < 3; column += 1) engine.setOrbState(0, column, { nail: true });
    engine.phase = 'detect';
    engine.advancePhase();
    const nailMatchCount = engine.turnNailCount;
    engine.resolvePlayerTurn();
    const nailDamage = engine.lastNailDamage;
    const nailDamageTotal = engine.lastDamage;
    engine.reset();
    engine.setEnhancedFallAwakenings([1, 0, 0, 0, 0, 0]);
    engine.setBoardFromCodes(Array(5).fill('DDDDDD'));
    engine.setRngState(21_900);
    engine.setLockFallRngState(21_900);
    engine.board[0][0] = null;
    engine.collapseAndRefill();
    const enhancedFallPower = engine.board[0][0].enhancementPower;
    const enhancedFallRuleState = engine.lockFallRng.state;
    engine.setEnhancedFallModifier({ chancePercent: 30, weakeningPowerPercent: 50 });
    engine.setBoardFromCodes(Array(5).fill('DDDDDD'));
    engine.setRngState(21_900);
    engine.setLockFallRngState(21_900);
    engine.board[0][0] = null;
    engine.collapseAndRefill();
    const weakenedFallPower = engine.board[0][0].enhancementPower;
    const weakenedFallRuleState = engine.lockFallRng.state;
    engine.setEnhancedFallAwakenings(Array(6).fill(0));
    engine.setEnhancedFallModifier(null);
    const blackFallSkillDefinition = new Uint8Array(6);
    new DataView(blackFallSkillDefinition.buffer).setInt16(4, 128, true);
    const blackFallMonsterRuntime = new Uint8Array(0x680);
    const blackFallMonsterView = new DataView(blackFallMonsterRuntime.buffer);
    blackFallMonsterView.setUint16(0x678, 2, true);
    blackFallMonsterView.setUint32(0x67c, 10_000, true);
    const blackFallSkillApplied = engine.applyEnemySkillRuntime(
      blackFallSkillDefinition,
      blackFallMonsterRuntime,
    );
    engine.setBoardFromCodes(Array(5).fill('DDDDDD'));
    engine.setRngState(21_900);
    engine.setLockFallRngState(21_900);
    engine.board[0][0] = null;
    engine.collapseAndRefill();
    const blackFallOrb = engine.snapshot().boardState[0][0];
    const blackFallRuleState = engine.lockFallRng.state;
    engine.resolveEnemyTurn();
    const blackFallAfterFresh = engine.snapshot().boardState[0][0];
    const blackFallTurnsAfterFresh = engine.blackFallRule.turnsRemaining;
    engine.resolveEnemyTurn();
    const blackFallAfterExpiry = engine.snapshot().boardState[0][0];
    const blackFallRuleAfterExpiry = { ...engine.blackFallRule };
    const scheduledBlackFallDefinition = new Uint8Array(0x48);
    const scheduledBlackFallView = new DataView(scheduledBlackFallDefinition.buffer);
    scheduledBlackFallView.setInt16(0x04, 128, true);
    scheduledBlackFallView.setInt32(0x10, 3, true);
    scheduledBlackFallView.setInt32(0x14, 75, true);
    scheduledBlackFallView.setInt32(0x44, 50, true);
    engine.setBlackFallRule(null);
    engine.setEnemySkillQueue(0, [scheduledBlackFallDefinition]);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    const scheduledBlackFallHp = engine.player.hp;
    engine.resolveEnemyTurn();
    const scheduledBlackFall = engine.snapshot();
    engine.setEnemySkillQueue(0, []);
    engine.setBlackFallRule(null);
    const enemyAiMonsterDefinition = new Uint8Array(0x2ec);
    const enemyAiMonsterView = new DataView(enemyAiMonsterDefinition.buffer);
    enemyAiMonsterView.setUint8(0xe0, 1);
    enemyAiMonsterView.setInt16(0xe2, 100, true);
    enemyAiMonsterView.setInt16(0xe4, 10, true);
    enemyAiMonsterView.setUint32(0xec, 9_001, true);
    enemyAiMonsterView.setUint8(0xf0, 100);
    const enemyAiBlackFallDefinition = scheduledBlackFallDefinition.slice();
    const enemyAiBlackFallView = new DataView(enemyAiBlackFallDefinition.buffer);
    enemyAiBlackFallView.setUint32(0x00, 9_001, true);
    enemyAiBlackFallView.setInt32(0x30, 10_000, true);
    enemyAiBlackFallView.setInt32(0x34, 1_000, true);
    enemyAiBlackFallView.setInt32(0x38, 100, true);
    enemyAiBlackFallView.setInt32(0x40, 20, true);
    engine.setEnemyAiDefinitionPool(0, enemyAiMonsterDefinition, [enemyAiBlackFallDefinition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    const selectedEnemyAiHp = engine.player.hp;
    engine.resolveEnemyTurn();
    const selectedEnemyAi = engine.snapshot();
    engine.setBlackFallRule(null);
    const blockMinusAiMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(blockMinusAiMonsterDefinition.buffer).setUint32(0xec, 9_002, true);
    const blockMinusAiDefinition = enemyAiBlackFallDefinition.slice();
    const blockMinusAiView = new DataView(blockMinusAiDefinition.buffer);
    blockMinusAiView.setUint32(0x00, 9_002, true);
    blockMinusAiView.setInt16(0x04, 151, true);
    blockMinusAiView.setUint32(0x10, 0b11, true);
    blockMinusAiView.setInt32(0x14, 50, true);
    blockMinusAiView.setInt32(0x18, 2, true);
    blockMinusAiView.setInt32(0x44, 0, true);
    engine.setEnemyAiDefinitionPool(0, blockMinusAiMonsterDefinition, [blockMinusAiDefinition]);
    engine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedBlockMinusAi = engine.snapshot();
    const selectedBlockMinusCount = selectedBlockMinusAi.boardState.flat()
      .filter((orb) => orb.enhancementPower === -0.5).length;
    const burDropAiMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(burDropAiMonsterDefinition.buffer).setUint32(0xec, 9_003, true);
    const burDropAiDefinition = blockMinusAiDefinition.slice();
    const burDropAiView = new DataView(burDropAiDefinition.buffer);
    burDropAiView.setUint32(0x00, 9_003, true);
    burDropAiView.setInt16(0x04, 153, true);
    burDropAiView.setUint32(0x14, 2, true);
    burDropAiView.setUint16(0x18, 4, true);
    engine.setEnemyAiDefinitionPool(0, burDropAiMonsterDefinition, [burDropAiDefinition]);
    engine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedBurDropAi = engine.snapshot();
    const selectedBurDropCount = selectedBurDropAi.boardState.flat()
      .filter((orb) => orb.thornActive && orb.thornDescriptor === 4).length;
    const horizontalLinesAiMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(horizontalLinesAiMonsterDefinition.buffer).setUint32(0xec, 9_004, true);
    const horizontalLinesAiDefinition = blockMinusAiDefinition.slice();
    const horizontalLinesAiView = new DataView(horizontalLinesAiDefinition.buffer);
    horizontalLinesAiView.setUint32(0x00, 9_004, true);
    horizontalLinesAiView.setInt16(0x04, 79, true);
    horizontalLinesAiView.setUint32(0x10, 0b10000, true);
    horizontalLinesAiView.setUint32(0x14, 1 << 0, true);
    horizontalLinesAiView.setUint32(0x18, 0b00100, true);
    horizontalLinesAiView.setUint32(0x1c, 1 << 1, true);
    horizontalLinesAiView.setUint32(0x20, 0b00001, true);
    horizontalLinesAiView.setUint32(0x24, 1 << 2, true);
    engine.setEnemyAiDefinitionPool(
      0,
      horizontalLinesAiMonsterDefinition,
      [horizontalLinesAiDefinition],
    );
    engine.setBoardFromCodes(['DDDDDD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedHorizontalLinesAi = engine.snapshot();
    const verticalLinesAiMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(verticalLinesAiMonsterDefinition.buffer).setUint32(0xec, 9_005, true);
    const verticalLinesAiDefinition = horizontalLinesAiDefinition.slice();
    const verticalLinesAiView = new DataView(verticalLinesAiDefinition.buffer);
    verticalLinesAiView.setUint32(0x00, 9_005, true);
    verticalLinesAiView.setInt16(0x04, 77, true);
    verticalLinesAiView.setUint32(0x10, 0b000001, true);
    verticalLinesAiView.setUint32(0x14, 1 << 0, true);
    verticalLinesAiView.setUint32(0x18, 0b000100, true);
    verticalLinesAiView.setUint32(0x1c, 1 << 1, true);
    verticalLinesAiView.setUint32(0x20, 0b100000, true);
    verticalLinesAiView.setUint32(0x24, 1 << 2, true);
    engine.setEnemyAiDefinitionPool(0, verticalLinesAiMonsterDefinition, [verticalLinesAiDefinition]);
    engine.setBoardFromCodes(['DDDDDD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedVerticalLinesAi = engine.snapshot();
    const horizontalLines4AiMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(horizontalLines4AiMonsterDefinition.buffer).setUint32(0xec, 9_007, true);
    const horizontalLines4AiDefinition = horizontalLinesAiDefinition.slice();
    const horizontalLines4AiView = new DataView(horizontalLines4AiDefinition.buffer);
    horizontalLines4AiView.setUint32(0x00, 9_007, true);
    horizontalLines4AiView.setInt16(0x04, 78, true);
    horizontalLines4AiView.setUint32(0x10, 0b10000, true);
    horizontalLines4AiView.setUint32(0x14, 1 << 0, true);
    horizontalLines4AiView.setUint32(0x18, 0b01000, true);
    horizontalLines4AiView.setUint32(0x1c, 1 << 1, true);
    horizontalLines4AiView.setUint32(0x20, 0b00010, true);
    horizontalLines4AiView.setUint32(0x24, 1 << 2, true);
    horizontalLines4AiView.setUint32(0x28, 0b00001, true);
    horizontalLines4AiView.setUint32(0x2c, 1 << 3, true);
    engine.setEnemyAiDefinitionPool(
      0,
      horizontalLines4AiMonsterDefinition,
      [horizontalLines4AiDefinition],
    );
    engine.setBoardFromCodes(['DDDDDD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedHorizontalLines4Ai = engine.snapshot();
    const verticalLines4AiMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(verticalLines4AiMonsterDefinition.buffer).setUint32(0xec, 9_008, true);
    const verticalLines4AiDefinition = horizontalLines4AiDefinition.slice();
    const verticalLines4AiView = new DataView(verticalLines4AiDefinition.buffer);
    verticalLines4AiView.setUint32(0x00, 9_008, true);
    verticalLines4AiView.setInt16(0x04, 76, true);
    verticalLines4AiView.setUint32(0x10, 0b000001, true);
    verticalLines4AiView.setUint32(0x14, 1 << 0, true);
    verticalLines4AiView.setUint32(0x18, 0b000010, true);
    verticalLines4AiView.setUint32(0x1c, 1 << 1, true);
    verticalLines4AiView.setUint32(0x20, 0b000100, true);
    verticalLines4AiView.setUint32(0x24, 1 << 2, true);
    verticalLines4AiView.setUint32(0x28, 0b100000, true);
    verticalLines4AiView.setUint32(0x2c, 1 << 3, true);
    engine.setEnemyAiDefinitionPool(0, verticalLines4AiMonsterDefinition, [verticalLines4AiDefinition]);
    engine.setBoardFromCodes(['DDDDDD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedVerticalLines4Ai = engine.snapshot();
    const poisonTypeListAiMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(poisonTypeListAiMonsterDefinition.buffer).setUint32(0xec, 9_006, true);
    const poisonTypeListAiDefinition = horizontalLinesAiDefinition.slice();
    const poisonTypeListAiView = new DataView(poisonTypeListAiDefinition.buffer);
    poisonTypeListAiView.setUint32(0x00, 9_006, true);
    poisonTypeListAiView.setInt16(0x04, 81, true);
    poisonTypeListAiView.setInt32(0x10, 12, true);
    poisonTypeListAiView.setInt32(0x14, 0, true);
    poisonTypeListAiView.setInt32(0x18, 1, true);
    poisonTypeListAiView.setInt32(0x1c, 2, true);
    poisonTypeListAiView.setInt32(0x20, -1, true);
    engine.setEnemyAiDefinitionPool(
      0,
      poisonTypeListAiMonsterDefinition,
      [poisonTypeListAiDefinition],
    );
    engine.setBoardFromCodes(['PMPMPM', 'MPMPMP', 'PMPMPM', 'MPMPMP', 'PMPMPM']);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedPoisonTypeListAi = engine.snapshot();
    const selectedPoisonTypeListCounts = ['fire', 'water', 'wood'].map((type) => (
      engine.board.flat().filter((orb) => orb.type === type).length
    ));
    const poisonTypeListDirectAiMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(poisonTypeListDirectAiMonsterDefinition.buffer).setUint32(0xec, 9_009, true);
    const poisonTypeListDirectAiDefinition = poisonTypeListAiDefinition.slice();
    const poisonTypeListDirectAiView = new DataView(poisonTypeListDirectAiDefinition.buffer);
    poisonTypeListDirectAiView.setUint32(0x00, 9_009, true);
    poisonTypeListDirectAiView.setInt16(0x04, 80, true);
    poisonTypeListDirectAiView.setInt32(0x10, 0, true);
    poisonTypeListDirectAiView.setInt32(0x14, 1, true);
    poisonTypeListDirectAiView.setInt32(0x18, 2, true);
    poisonTypeListDirectAiView.setInt32(0x1c, -1, true);
    engine.setEnemyAiDefinitionPool(
      0,
      poisonTypeListDirectAiMonsterDefinition,
      [poisonTypeListDirectAiDefinition],
    );
    engine.setBoardFromCodes(['PMPMPM', 'MPMPMP', 'PMPMPM', 'MPMPMP', 'PMPMPM']);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedPoisonTypeListDirectAi = engine.snapshot();
    const selectedPoisonTypeListDirectCounts = ['fire', 'water', 'wood'].map((type) => (
      engine.board.flat().filter((orb) => orb.type === type).length
    ));
    const poisonMaskDirectAiMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(poisonMaskDirectAiMonsterDefinition.buffer).setUint32(0xec, 9_010, true);
    const poisonMaskDirectAiDefinition = poisonTypeListDirectAiDefinition.slice();
    const poisonMaskDirectAiView = new DataView(poisonMaskDirectAiDefinition.buffer);
    poisonMaskDirectAiView.setUint32(0x00, 9_010, true);
    poisonMaskDirectAiView.setInt16(0x04, 84, true);
    poisonMaskDirectAiView.setUint32(0x10, 0b000111, true);
    engine.setEnemyAiDefinitionPool(
      0,
      poisonMaskDirectAiMonsterDefinition,
      [poisonMaskDirectAiDefinition],
    );
    engine.setBoardFromCodes(['PMPMPM', 'MPMPMP', 'PMPMPM', 'MPMPMP', 'PMPMPM']);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedPoisonMaskDirectAi = engine.snapshot();
    const selectedPoisonMaskDirectCounts = ['fire', 'water', 'wood'].map((type) => (
      engine.board.flat().filter((orb) => orb.type === type).length
    ));
    const poisonMaskAiMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(poisonMaskAiMonsterDefinition.buffer).setUint32(0xec, 9_011, true);
    const poisonMaskAiDefinition = poisonMaskDirectAiDefinition.slice();
    const poisonMaskAiView = new DataView(poisonMaskAiDefinition.buffer);
    poisonMaskAiView.setUint32(0x00, 9_011, true);
    poisonMaskAiView.setInt16(0x04, 85, true);
    poisonMaskAiView.setInt32(0x10, 12, true);
    poisonMaskAiView.setUint32(0x14, 0b000111, true);
    engine.setEnemyAiDefinitionPool(0, poisonMaskAiMonsterDefinition, [poisonMaskAiDefinition]);
    engine.setBoardFromCodes(['PMPMPM', 'MPMPMP', 'PMPMPM', 'MPMPMP', 'PMPMPM']);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedPoisonMaskAi = engine.snapshot();
    const selectedPoisonMaskCounts = ['fire', 'water', 'wood'].map((type) => (
      engine.board.flat().filter((orb) => orb.type === type).length
    ));
    const poisonBlockNAiMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(poisonBlockNAiMonsterDefinition.buffer).setUint32(0xec, 9_012, true);
    const poisonBlockNAiDefinition = poisonTypeListAiDefinition.slice();
    const poisonBlockNAiView = new DataView(poisonBlockNAiDefinition.buffer);
    poisonBlockNAiView.setUint32(0x00, 9_012, true);
    poisonBlockNAiView.setInt16(0x04, 64, true);
    poisonBlockNAiView.setInt32(0x10, 12, true);
    poisonBlockNAiView.setInt32(0x14, 5, true);
    poisonBlockNAiView.setInt32(0x18, 1, true);
    poisonBlockNAiView.setInt32(0x1c, 1, true);
    engine.setEnemyAiDefinitionPool(0, poisonBlockNAiMonsterDefinition, [poisonBlockNAiDefinition]);
    engine.setBoardFromCodes(['RHRHRH', 'BRGBRG', 'LDBRHR', 'BHLDBH', 'LRLDHR']);
    const poisonBlockNHeartCount = engine.board.flat().filter((orb) => orb.type === 'heart').length;
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedPoisonBlockNAi = engine.snapshot();
    const selectedPoisonBlockNMortalCount = engine.board.flat()
      .filter((orb) => orb.type === 'mortalPoison').length;
    const selectedPoisonBlockNHeartCount = engine.board.flat()
      .filter((orb) => orb.type === 'heart').length;
    engine.setEnemyAiDefinitionPool(0, poisonBlockNAiMonsterDefinition, [poisonBlockNAiDefinition]);
    engine.setBoardFromCodes(['PMPMPM', 'MHMHMH', 'PMPMPM', 'MHMHMH', 'PMPMPM']);
    engine.setRngState(21_900);
    const rejectedPoisonBlockNSkill = engine.takeEnemySkill(0);
    const rejectedPoisonBlockNState = engine.snapshot();
    const poisonBlocksAiMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(poisonBlocksAiMonsterDefinition.buffer).setUint32(0xec, 9_013, true);
    const poisonBlocksAiDefinition = poisonTypeListAiDefinition.slice();
    const poisonBlocksAiView = new DataView(poisonBlocksAiDefinition.buffer);
    poisonBlocksAiView.setUint32(0x00, 9_013, true);
    poisonBlocksAiView.setInt16(0x04, 57, true);
    poisonBlocksAiView.setInt32(0x10, 2, true);
    poisonBlocksAiView.setInt32(0x14, 1, true);
    engine.setEnemyAiDefinitionPool(0, poisonBlocksAiMonsterDefinition, [poisonBlocksAiDefinition]);
    engine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    const poisonBlocksHeartCount = engine.board.flat().filter((orb) => orb.type === 'heart').length;
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedPoisonBlocksAi = engine.snapshot();
    const selectedPoisonBlocksCount = engine.board.flat().filter((orb) => orb.type === 'poison').length;
    const selectedPoisonBlocksHeartCount = engine.board.flat().filter((orb) => orb.type === 'heart').length;
    const mortalPoisonBlocksAiMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(mortalPoisonBlocksAiMonsterDefinition.buffer).setUint32(0xec, 9_014, true);
    const mortalPoisonBlocksAiDefinition = poisonBlocksAiDefinition.slice();
    const mortalPoisonBlocksAiView = new DataView(mortalPoisonBlocksAiDefinition.buffer);
    mortalPoisonBlocksAiView.setUint32(0x00, 9_014, true);
    mortalPoisonBlocksAiView.setInt16(0x04, 59, true);
    engine.setEnemyAiDefinitionPool(
      0,
      mortalPoisonBlocksAiMonsterDefinition,
      [mortalPoisonBlocksAiDefinition],
    );
    engine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedMortalPoisonBlocksAi = engine.snapshot();
    const selectedMortalPoisonBlocksCount = engine.board.flat()
      .filter((orb) => orb.type === 'mortalPoison').length;
    engine.setEnemyAiDefinitionPool(0, poisonBlocksAiMonsterDefinition, [poisonBlocksAiDefinition]);
    engine.setBoardFromCodes(Array(5).fill('HHHHHH'));
    engine.setRngState(21_900);
    const rejectedPoisonBlocksSkill = engine.takeEnemySkill(0);
    const rejectedPoisonBlocksState = engine.snapshot();
    const countedPoisonMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(countedPoisonMonsterDefinition.buffer).setUint32(0xec, 9_015, true);
    const countedPoisonDefinition = poisonBlocksAiDefinition.slice();
    const countedPoisonView = new DataView(countedPoisonDefinition.buffer);
    countedPoisonView.setUint32(0x00, 9_015, true);
    countedPoisonView.setInt16(0x04, 60, true);
    countedPoisonView.setInt32(0x10, 4, true);
    countedPoisonView.setInt32(0x14, 1, true);
    engine.setEnemyAiDefinitionPool(0, countedPoisonMonsterDefinition, [countedPoisonDefinition]);
    engine.setBoardFromCodes(['RBRBHD', 'GLDHBG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
    const countedPoisonHeartCount = engine.board.flat().filter((orb) => orb.type === 'heart').length;
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedCountedPoisonAi = engine.snapshot();
    const selectedCountedPoisonCount = engine.board.flat().filter((orb) => orb.type === 'poison').length;
    const selectedCountedPoisonHeartCount = engine.board.flat().filter((orb) => orb.type === 'heart').length;
    const countedMortalMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(countedMortalMonsterDefinition.buffer).setUint32(0xec, 9_016, true);
    const countedMortalDefinition = countedPoisonDefinition.slice();
    const countedMortalView = new DataView(countedMortalDefinition.buffer);
    countedMortalView.setUint32(0x00, 9_016, true);
    countedMortalView.setInt16(0x04, 61, true);
    engine.setEnemyAiDefinitionPool(0, countedMortalMonsterDefinition, [countedMortalDefinition]);
    engine.setBoardFromCodes(['RBRBHD', 'GLDHBG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedCountedMortalAi = engine.snapshot();
    const selectedCountedMortalCount = engine.board.flat()
      .filter((orb) => orb.type === 'mortalPoison').length;
    engine.setEnemyAiDefinitionPool(0, countedPoisonMonsterDefinition, [countedPoisonDefinition]);
    engine.setBoardFromCodes(['RRRHHH', 'PMPMPM', 'MHMHMH', 'PMPMPM', 'MHMHMH']);
    engine.setRngState(21_900);
    const rejectedCountedPoisonSkill = engine.takeEnemySkill(0);
    const rejectedCountedPoisonState = engine.snapshot();
    const sourceToPoisonMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(sourceToPoisonMonsterDefinition.buffer).setUint32(0xec, 9_017, true);
    const sourceToPoisonDefinition = poisonBlocksAiDefinition.slice();
    const sourceToPoisonView = new DataView(sourceToPoisonDefinition.buffer);
    sourceToPoisonView.setUint32(0x00, 9_017, true);
    sourceToPoisonView.setInt16(0x04, 56, true);
    sourceToPoisonView.setInt32(0x10, 0, true);
    engine.setEnemyAiDefinitionPool(0, sourceToPoisonMonsterDefinition, [sourceToPoisonDefinition]);
    engine.setBoardFromCodes(['RRRBBB', 'BBBBBB', 'BBBBBB', 'BBBBBB', 'BBBBBB']);
    engine.setOrbState(0, 2, { locked: true });
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedSourceToPoisonAi = engine.snapshot();
    const selectedSourceToPoisonCount = engine.board.flat()
      .filter((orb) => orb.type === 'poison').length;
    const selectedSourceToPoisonLockedType = engine.board[0][2].type;
    engine.setEnemyAiDefinitionPool(0, sourceToPoisonMonsterDefinition, [sourceToPoisonDefinition]);
    engine.setBoardFromCodes(['RBBBBB', 'BBBBBB', 'BBBBBB', 'BBBBBB', 'BBBBBB']);
    engine.setRngState(21_900);
    const rejectedScaledSourceToPoisonSkill = engine.takeEnemySkill(0);
    const rejectedScaledSourceToPoisonState = engine.snapshot();
    const sourceToMortalPoisonMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(sourceToMortalPoisonMonsterDefinition.buffer).setUint32(0xec, 9_018, true);
    const sourceToMortalPoisonDefinition = sourceToPoisonDefinition.slice();
    const sourceToMortalPoisonView = new DataView(sourceToMortalPoisonDefinition.buffer);
    sourceToMortalPoisonView.setUint32(0x00, 9_018, true);
    sourceToMortalPoisonView.setInt16(0x04, 58, true);
    sourceToMortalPoisonView.setInt32(0x10, 1, true);
    engine.setEnemyAiDefinitionPool(
      0,
      sourceToMortalPoisonMonsterDefinition,
      [sourceToMortalPoisonDefinition],
    );
    engine.setBoardFromCodes(['BBBRRR', 'RRRRRR', 'RRRRRR', 'RRRRRR', 'RRRRRR']);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedSourceToMortalPoisonAi = engine.snapshot();
    const selectedSourceToMortalPoisonCount = engine.board.flat()
      .filter((orb) => orb.type === 'mortalPoison').length;
    const healPlayerMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(healPlayerMonsterDefinition.buffer).setUint32(0xec, 9_019, true);
    const healPlayerDefinition = sourceToPoisonDefinition.slice();
    const healPlayerView = new DataView(healPlayerDefinition.buffer);
    healPlayerView.setUint32(0x00, 9_019, true);
    healPlayerView.setInt16(0x04, 55, true);
    healPlayerView.setInt32(0x10, 25, true);
    healPlayerView.setInt32(0x14, 50, true);
    engine.setEnemyAiDefinitionPool(0, healPlayerMonsterDefinition, [healPlayerDefinition]);
    engine.player.hp = 3_059;
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedHealPlayerAi = engine.snapshot();
    engine.setEnemyAiDefinitionPool(0, healPlayerMonsterDefinition, [healPlayerDefinition]);
    engine.player.hp = 3_060;
    engine.setRngState(21_900);
    const rejectedHealPlayerSkill = engine.takeEnemySkill(0);
    const rejectedHealPlayerState = engine.snapshot();
    const statusShieldMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(statusShieldMonsterDefinition.buffer).setUint32(0xec, 9_029, true);
    const statusShieldDefinition = sourceToPoisonDefinition.slice();
    const statusShieldView = new DataView(statusShieldDefinition.buffer);
    statusShieldView.setUint32(0x00, 9_029, true);
    statusShieldView.setInt16(0x04, 20, true);
    statusShieldView.setInt32(0x10, 3, true);
    engine.reset();
    engine.setEnemyAiDefinitionPool(
      0,
      statusShieldMonsterDefinition,
      [statusShieldDefinition],
    );
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedStatusShieldAi = engine.snapshot();
    engine.setEnemyAiDefinitionPool(
      0,
      statusShieldMonsterDefinition,
      [statusShieldDefinition],
    );
    engine.setRngState(21_900);
    const rejectedStatusShieldSkill = engine.takeEnemySkill(0);
    const rejectedStatusShieldState = engine.snapshot();
    const loneAttackBoostMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(loneAttackBoostMonsterDefinition.buffer).setUint32(0xec, 9_030, true);
    const loneAttackBoostDefinition = sourceToPoisonDefinition.slice();
    const loneAttackBoostView = new DataView(loneAttackBoostDefinition.buffer);
    loneAttackBoostView.setUint32(0x00, 9_030, true);
    loneAttackBoostView.setInt16(0x04, 17, true);
    loneAttackBoostView.setInt32(0x14, 3, true);
    loneAttackBoostView.setInt32(0x18, 200, true);
    loneAttackBoostView.setInt32(0x44, 50, true);
    engine.reset();
    engine.enemies[1].hp = 0;
    engine.setEnemyAiDefinitionPool(
      0,
      loneAttackBoostMonsterDefinition,
      [loneAttackBoostDefinition],
    );
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.resolveEnemyTurn();
    const selectedLoneAttackBoostAi = engine.snapshot();
    engine.enemies[0].counter = 1;
    engine.resolveEnemyTurn();
    const boostedLoneEnemyAttack = engine.snapshot();
    engine.reset();
    engine.setEnemyAiDefinitionPool(
      0,
      loneAttackBoostMonsterDefinition,
      [loneAttackBoostDefinition],
    );
    engine.setRngState(21_900);
    const rejectedLoneAttackBoostSkill = engine.takeEnemySkill(0);
    const rejectedLoneAttackBoostState = engine.snapshot();
    const sourceOrbConversionMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(sourceOrbConversionMonsterDefinition.buffer).setUint32(0xec, 9_033, true);
    const sourceOrbConversionDefinition = sourceToPoisonDefinition.slice();
    const sourceOrbConversionView = new DataView(sourceOrbConversionDefinition.buffer);
    sourceOrbConversionView.setUint32(0x00, 9_033, true);
    sourceOrbConversionView.setInt16(0x04, 4, true);
    sourceOrbConversionView.setInt32(0x10, 1, true);
    sourceOrbConversionView.setInt32(0x14, 4, true);
    sourceOrbConversionView.setInt32(0x44, 25, true);
    engine.reset();
    engine.setBoardFromCodes(['BBBRHD', 'GLDRHG', 'RHRDGL', 'DLGRHB', 'HRRGLD']);
    engine.setEnemyAiDefinitionPool(
      0,
      sourceOrbConversionMonsterDefinition,
      [sourceOrbConversionDefinition],
    );
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedSourceOrbConversionAi = engine.snapshot();
    const selectedSourceOrbConversionWaterCount = engine.board.flat()
      .filter((orb) => orb.type === 'water').length;
    engine.reset();
    engine.setBoardFromCodes(Array(5).fill('RRRRRR'));
    engine.setEnemyAiDefinitionPool(
      0,
      sourceOrbConversionMonsterDefinition,
      [sourceOrbConversionDefinition],
    );
    engine.setRngState(21_900);
    const rejectedSourceOrbConversionSkill = engine.takeEnemySkill(0);
    const rejectedSourceOrbConversionState = engine.snapshot();
    const randomSourceOrbConversionDefinition = sourceOrbConversionDefinition.slice();
    const randomSourceOrbConversionView = new DataView(randomSourceOrbConversionDefinition.buffer);
    randomSourceOrbConversionView.setInt32(0x10, -1, true);
    randomSourceOrbConversionView.setInt32(0x14, -1, true);
    engine.setRngState(21_900);
    const randomSourceOrbConversionApplied = engine.applyEnemySkillDefinition(
      randomSourceOrbConversionDefinition,
    );
    const randomSourceOrbConversionState = engine.snapshot();
    const sourceToJammerMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(sourceToJammerMonsterDefinition.buffer).setUint32(0xec, 9_034, true);
    const sourceToJammerDefinition = sourceToPoisonDefinition.slice();
    const sourceToJammerView = new DataView(sourceToJammerDefinition.buffer);
    sourceToJammerView.setUint32(0x00, 9_034, true);
    sourceToJammerView.setInt16(0x04, 12, true);
    sourceToJammerView.setInt32(0x10, 5, true);
    sourceToJammerView.setInt32(0x44, 0, true);
    engine.reset();
    engine.setBoardFromCodes(['HHHRBD', 'GLDRBG', 'RBRDGL', 'DLGRHB', 'HRRGLD']);
    engine.setEnemyAiDefinitionPool(0, sourceToJammerMonsterDefinition, [sourceToJammerDefinition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedSourceToJammerAi = engine.snapshot();
    const selectedSourceToJammerCount = engine.board.flat()
      .filter((orb) => orb.type === 'jammer').length;
    engine.reset();
    engine.setBoardFromCodes(Array(5).fill('RRRRRR'));
    engine.setEnemyAiDefinitionPool(0, sourceToJammerMonsterDefinition, [sourceToJammerDefinition]);
    engine.setRngState(21_900);
    const rejectedSourceToJammerSkill = engine.takeEnemySkill(0);
    const rejectedSourceToJammerState = engine.snapshot();
    const statusTriggeredAttackBoostMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(statusTriggeredAttackBoostMonsterDefinition.buffer).setUint32(0xec, 9_031, true);
    const statusTriggeredAttackBoostDefinition = sourceToPoisonDefinition.slice();
    const statusTriggeredAttackBoostView = new DataView(statusTriggeredAttackBoostDefinition.buffer);
    statusTriggeredAttackBoostView.setUint32(0x00, 9_031, true);
    statusTriggeredAttackBoostView.setInt16(0x04, 18, true);
    statusTriggeredAttackBoostView.setInt32(0x10, 2, true);
    statusTriggeredAttackBoostView.setInt32(0x14, 250, true);
    statusTriggeredAttackBoostView.setInt32(0x44, 50, true);
    engine.reset();
    engine.playerAttackBoostTurns = 2;
    engine.setEnemyAiDefinitionPool(
      0,
      statusTriggeredAttackBoostMonsterDefinition,
      [statusTriggeredAttackBoostDefinition],
    );
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedStatusTriggeredAttackBoostAi = engine.snapshot();
    engine.reset();
    engine.setEnemyAiDefinitionPool(
      0,
      statusTriggeredAttackBoostMonsterDefinition,
      [statusTriggeredAttackBoostDefinition],
    );
    engine.enemies[0].transientDebuffActive = true;
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedTransientAttackBoostAi = engine.snapshot();
    engine.reset();
    engine.setEnemyAiDefinitionPool(
      0,
      statusTriggeredAttackBoostMonsterDefinition,
      [statusTriggeredAttackBoostDefinition],
    );
    engine.setRngState(21_900);
    const rejectedStatusTriggeredAttackBoostSkill = engine.takeEnemySkill(0);
    const rejectedStatusTriggeredAttackBoostState = engine.snapshot();
    const damagedTurnAttackBoostMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(damagedTurnAttackBoostMonsterDefinition.buffer).setUint32(0xec, 9_032, true);
    const damagedTurnAttackBoostDefinition = sourceToPoisonDefinition.slice();
    const damagedTurnAttackBoostView = new DataView(damagedTurnAttackBoostDefinition.buffer);
    damagedTurnAttackBoostView.setUint32(0x00, 9_032, true);
    damagedTurnAttackBoostView.setInt16(0x04, 19, true);
    damagedTurnAttackBoostView.setInt32(0x10, 2, true);
    damagedTurnAttackBoostView.setInt32(0x14, 4, true);
    damagedTurnAttackBoostView.setInt32(0x18, 300, true);
    damagedTurnAttackBoostView.setInt32(0x44, 50, true);
    engine.reset();
    engine.enemies[0].damagedTurnCount = 2;
    engine.setEnemyAiDefinitionPool(
      0,
      damagedTurnAttackBoostMonsterDefinition,
      [damagedTurnAttackBoostDefinition],
    );
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedDamagedTurnAttackBoostAi = engine.snapshot();
    engine.reset();
    engine.enemies[0].damagedTurnCount = 1;
    engine.setEnemyAiDefinitionPool(
      0,
      damagedTurnAttackBoostMonsterDefinition,
      [damagedTurnAttackBoostDefinition],
    );
    engine.setRngState(21_900);
    const rejectedDamagedTurnAttackBoostSkill = engine.takeEnemySkill(0);
    const rejectedDamagedTurnAttackBoostState = engine.snapshot();
    engine.reset();
    engine.enemies[1].hp = 0;
    engine.comboCount = 1;
    engine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
    engine.resolvePlayerTurn();
    const damagedTurnCounterState = engine.snapshot();
    const moveTimeReductionMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(moveTimeReductionMonsterDefinition.buffer).setUint32(0xec, 9_028, true);
    const moveTimeReductionDefinition = sourceToPoisonDefinition.slice();
    const moveTimeReductionView = new DataView(moveTimeReductionDefinition.buffer);
    moveTimeReductionView.setUint32(0x00, 9_028, true);
    moveTimeReductionView.setInt16(0x04, 39, true);
    moveTimeReductionView.setInt32(0x10, 2, true);
    moveTimeReductionView.setInt32(0x14, 125, true);
    moveTimeReductionView.setInt32(0x18, 0, true);
    engine.reset();
    engine.setEnemyAiDefinitionPool(
      0,
      moveTimeReductionMonsterDefinition,
      [moveTimeReductionDefinition],
    );
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedMoveTimeReductionAi = engine.snapshot();
    engine.start();
    engine.startDrag(0, 0, 50, 50);
    const moveTimeReductionDrag = engine.snapshot().drag;
    engine.drag = null;
    engine.setEnemyAiDefinitionPool(
      0,
      moveTimeReductionMonsterDefinition,
      [moveTimeReductionDefinition],
    );
    engine.setRngState(21_900);
    const rejectedMoveTimeReductionSkill = engine.takeEnemySkill(0);
    const rejectedMoveTimeReductionState = engine.snapshot();
    const selfDestructMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(selfDestructMonsterDefinition.buffer).setUint32(0xec, 9_027, true);
    const selfDestructDefinition = sourceToPoisonDefinition.slice();
    const selfDestructView = new DataView(selfDestructDefinition.buffer);
    selfDestructView.setUint32(0x00, 9_027, true);
    selfDestructView.setInt16(0x04, 40, true);
    engine.reset();
    engine.setEnemyAiDefinitionPool(
      0,
      selfDestructMonsterDefinition,
      [selfDestructDefinition],
    );
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedSelfDestructAi = engine.snapshot();
    const changeAttributeMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(changeAttributeMonsterDefinition.buffer).setUint32(0xec, 9_025, true);
    const changeAttributeDefinition = sourceToPoisonDefinition.slice();
    const changeAttributeView = new DataView(changeAttributeDefinition.buffer);
    changeAttributeView.setUint32(0x00, 9_025, true);
    changeAttributeView.setInt16(0x04, 46, true);
    [0, 2, 1, 3, 9].forEach((attribute, index) => {
      changeAttributeView.setInt32(0x10 + index * 4, attribute, true);
    });
    engine.reset();
    engine.enemies[0].attribute = 'wood';
    engine.setEnemyAiDefinitionPool(
      0,
      changeAttributeMonsterDefinition,
      [changeAttributeDefinition],
    );
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedChangeAttributeAi = engine.snapshot();
    const rejectedChangeAttributeMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(rejectedChangeAttributeMonsterDefinition.buffer).setUint32(0xec, 9_026, true);
    const rejectedChangeAttributeDefinition = changeAttributeDefinition.slice();
    const rejectedChangeAttributeView = new DataView(rejectedChangeAttributeDefinition.buffer);
    rejectedChangeAttributeView.setUint32(0x00, 9_026, true);
    [2, 2, -1, 9, 99].forEach((attribute, index) => {
      rejectedChangeAttributeView.setInt32(0x10 + index * 4, attribute, true);
    });
    engine.enemies[0].attribute = 'wood';
    engine.setEnemyAiDefinitionPool(
      0,
      rejectedChangeAttributeMonsterDefinition,
      [rejectedChangeAttributeDefinition],
    );
    engine.setRngState(21_900);
    const rejectedChangeAttributeSkill = engine.takeEnemySkill(0);
    const rejectedChangeAttributeState = engine.snapshot();
    const scaledAttackMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(scaledAttackMonsterDefinition.buffer).setUint32(0xec, 9_024, true);
    const scaledAttackDefinition = sourceToPoisonDefinition.slice();
    const scaledAttackView = new DataView(scaledAttackDefinition.buffer);
    scaledAttackView.setUint32(0x00, 9_024, true);
    scaledAttackView.setInt16(0x04, 47, true);
    scaledAttackView.setInt32(0x14, 50, true);
    engine.setEnemyAiDefinitionPool(0, scaledAttackMonsterDefinition, [scaledAttackDefinition]);
    engine.player.hp = 12_000;
    engine.enemies[0].scaledAttackGate = 0;
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedScaledAttackAi = engine.snapshot();
    engine.setEnemyAiDefinitionPool(0, scaledAttackMonsterDefinition, [scaledAttackDefinition]);
    engine.enemies[0].scaledAttackGate = 1;
    engine.setRngState(21_900);
    const rejectedScaledAttackSkill = engine.takeEnemySkill(0);
    const rejectedScaledAttackState = engine.snapshot();
    engine.enemies[0].scaledAttackGate = 0;
    const currentHpGravityMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(currentHpGravityMonsterDefinition.buffer).setUint32(0xec, 9_023, true);
    const currentHpGravityDefinition = sourceToPoisonDefinition.slice();
    const currentHpGravityView = new DataView(currentHpGravityDefinition.buffer);
    currentHpGravityView.setUint32(0x00, 9_023, true);
    currentHpGravityView.setInt16(0x04, 50, true);
    currentHpGravityView.setInt32(0x10, 25, true);
    engine.setEnemyAiDefinitionPool(
      0,
      currentHpGravityMonsterDefinition,
      [currentHpGravityDefinition],
    );
    engine.player.hp = 12_000;
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedCurrentHpGravityAi = engine.snapshot();
    const reviveEnemyMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(reviveEnemyMonsterDefinition.buffer).setUint32(0xec, 9_022, true);
    const reviveEnemyDefinition = sourceToPoisonDefinition.slice();
    const reviveEnemyView = new DataView(reviveEnemyDefinition.buffer);
    reviveEnemyView.setUint32(0x00, 9_022, true);
    reviveEnemyView.setInt16(0x04, 52, true);
    reviveEnemyView.setInt32(0x10, 37, true);
    engine.setEnemyAiDefinitionPool(0, reviveEnemyMonsterDefinition, [reviveEnemyDefinition]);
    engine.enemies[1].hp = 0;
    engine.enemies[1].counter = 1;
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.resolveEnemyTurn();
    const selectedReviveEnemyAi = engine.snapshot();
    engine.setEnemyAiDefinitionPool(0, reviveEnemyMonsterDefinition, [reviveEnemyDefinition]);
    engine.setRngState(21_900);
    const rejectedReviveEnemySkill = engine.takeEnemySkill(0);
    const rejectedReviveEnemyState = engine.snapshot();
    const bindLeaderHelperMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(bindLeaderHelperMonsterDefinition.buffer).setUint32(0xec, 9_020, true);
    const bindLeaderHelperDefinition = sourceToPoisonDefinition.slice();
    const bindLeaderHelperView = new DataView(bindLeaderHelperDefinition.buffer);
    bindLeaderHelperView.setUint32(0x00, 9_020, true);
    bindLeaderHelperView.setInt16(0x04, 54, true);
    bindLeaderHelperView.setUint8(0x10, 3);
    bindLeaderHelperView.setInt32(0x14, 2, true);
    bindLeaderHelperView.setInt32(0x18, 4, true);
    engine.party[0].bindTurns = 0;
    engine.party[5].bindTurns = 0;
    engine.setEnemyAiDefinitionPool(
      0,
      bindLeaderHelperMonsterDefinition,
      [bindLeaderHelperDefinition],
    );
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedBindLeaderHelperAi = engine.snapshot();
    engine.setEnemyAiDefinitionPool(
      0,
      bindLeaderHelperMonsterDefinition,
      [bindLeaderHelperDefinition],
    );
    engine.setRngState(21_900);
    const rejectedBindLeaderHelperSkill = engine.takeEnemySkill(0);
    const rejectedBindLeaderHelperState = engine.snapshot();
    const attributeAbsorbMonsterDefinition = enemyAiMonsterDefinition.slice();
    new DataView(attributeAbsorbMonsterDefinition.buffer).setUint32(0xec, 9_021, true);
    const attributeAbsorbDefinition = sourceToPoisonDefinition.slice();
    const attributeAbsorbView = new DataView(attributeAbsorbDefinition.buffer);
    attributeAbsorbView.setUint32(0x00, 9_021, true);
    attributeAbsorbView.setInt16(0x04, 53, true);
    attributeAbsorbView.setInt32(0x10, 2, true);
    attributeAbsorbView.setInt32(0x14, 4, true);
    attributeAbsorbView.setUint32(0x18, 0x03, true);
    engine.reset();
    engine.setEnemyAiDefinitionPool(
      0,
      attributeAbsorbMonsterDefinition,
      [attributeAbsorbDefinition],
    );
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const selectedAttributeAbsorbAi = engine.snapshot();
    engine.enemies[0].hp = 50_000;
    engine.enemies[1].hp = 0;
    engine.comboCount = 1;
    engine.turnMatches = [{
      type: 'fire', size: 3, enhancedCount: 0, enhancementMultiplier: 1, isMassAttack: false,
    }];
    engine.resolvePlayerTurn();
    const attributeAbsorbDamageState = engine.snapshot();
    engine.setEnemyAiDefinitionPool(
      0,
      attributeAbsorbMonsterDefinition,
      [attributeAbsorbDefinition],
    );
    engine.setRngState(21_900);
    const rejectedAttributeAbsorbSkill = engine.takeEnemySkill(0);
    const rejectedAttributeAbsorbState = engine.snapshot();
    engine.setEnemyAiDefinitionPool(0, null);
    engine.setBlackFallRule(null);
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
      lockFallType, lockFallLocked, lockFallMainState, lockFallRuleState,
      thornFallOrb, thornFallMainState, thornFallRuleState,
      nailMatchCount, nailDamage, nailDamageTotal,
      enhancedFallPower, enhancedFallRuleState, weakenedFallPower, weakenedFallRuleState,
      blackFallSkillApplied, blackFallOrb, blackFallRuleState, blackFallAfterFresh, blackFallTurnsAfterFresh,
      blackFallAfterExpiry, blackFallRuleAfterExpiry,
      scheduledBlackFallHp, scheduledBlackFall, selectedEnemyAiHp, selectedEnemyAi,
      selectedBlockMinusAi, selectedBlockMinusCount,
      selectedBurDropAi, selectedBurDropCount,
      selectedHorizontalLinesAi,
      selectedVerticalLinesAi,
      selectedHorizontalLines4Ai, selectedVerticalLines4Ai,
      selectedPoisonTypeListAi, selectedPoisonTypeListCounts,
      selectedPoisonTypeListDirectAi, selectedPoisonTypeListDirectCounts,
      selectedPoisonMaskDirectAi, selectedPoisonMaskDirectCounts,
      selectedPoisonMaskAi, selectedPoisonMaskCounts,
      poisonBlockNHeartCount, selectedPoisonBlockNAi,
      selectedPoisonBlockNMortalCount, selectedPoisonBlockNHeartCount,
      rejectedPoisonBlockNSkill, rejectedPoisonBlockNState,
      poisonBlocksHeartCount, selectedPoisonBlocksAi, selectedPoisonBlocksCount,
      selectedPoisonBlocksHeartCount, selectedMortalPoisonBlocksAi,
      selectedMortalPoisonBlocksCount, rejectedPoisonBlocksSkill, rejectedPoisonBlocksState,
      countedPoisonHeartCount, selectedCountedPoisonAi, selectedCountedPoisonCount,
      selectedCountedPoisonHeartCount, selectedCountedMortalAi, selectedCountedMortalCount,
      rejectedCountedPoisonSkill, rejectedCountedPoisonState,
      selectedSourceToPoisonAi, selectedSourceToPoisonCount,
      selectedSourceToPoisonLockedType,
      rejectedScaledSourceToPoisonSkill, rejectedScaledSourceToPoisonState,
      selectedSourceToMortalPoisonAi, selectedSourceToMortalPoisonCount,
      selectedHealPlayerAi, rejectedHealPlayerSkill, rejectedHealPlayerState,
      selectedStatusShieldAi, rejectedStatusShieldSkill, rejectedStatusShieldState,
      selectedLoneAttackBoostAi, boostedLoneEnemyAttack,
      rejectedLoneAttackBoostSkill, rejectedLoneAttackBoostState,
      selectedSourceOrbConversionAi, selectedSourceOrbConversionWaterCount,
      rejectedSourceOrbConversionSkill, rejectedSourceOrbConversionState,
      randomSourceOrbConversionApplied, randomSourceOrbConversionState,
      selectedSourceToJammerAi, selectedSourceToJammerCount,
      rejectedSourceToJammerSkill, rejectedSourceToJammerState,
      selectedStatusTriggeredAttackBoostAi, selectedTransientAttackBoostAi,
      rejectedStatusTriggeredAttackBoostSkill, rejectedStatusTriggeredAttackBoostState,
      selectedDamagedTurnAttackBoostAi,
      rejectedDamagedTurnAttackBoostSkill, rejectedDamagedTurnAttackBoostState,
      damagedTurnCounterState,
      selectedMoveTimeReductionAi, moveTimeReductionDrag,
      rejectedMoveTimeReductionSkill, rejectedMoveTimeReductionState,
      selectedSelfDestructAi,
      selectedChangeAttributeAi,
      rejectedChangeAttributeSkill, rejectedChangeAttributeState,
      selectedScaledAttackAi, rejectedScaledAttackSkill, rejectedScaledAttackState,
      selectedCurrentHpGravityAi,
      selectedReviveEnemyAi, rejectedReviveEnemySkill, rejectedReviveEnemyState,
      selectedBindLeaderHelperAi,
      rejectedBindLeaderHelperSkill, rejectedBindLeaderHelperState,
      selectedAttributeAbsorbAi, attributeAbsorbDamageState,
      rejectedAttributeAbsorbSkill, rejectedAttributeAbsorbState,
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
    poisonBlockSample.lockFallType !== 'fire' || !poisonBlockSample.lockFallLocked ||
    poisonBlockSample.lockFallMainState !== 394_448_415 ||
    poisonBlockSample.lockFallRuleState !== 3_803_934_822 ||
    poisonBlockSample.thornFallOrb.code !== 'R' || !poisonBlockSample.thornFallOrb.locked ||
    !poisonBlockSample.thornFallOrb.thornActive || !poisonBlockSample.thornFallOrb.nail ||
    poisonBlockSample.thornFallOrb.thornDescriptor !== 0x84 ||
    poisonBlockSample.thornFallMainState !== 394_448_415 ||
    poisonBlockSample.thornFallRuleState !== 919_597_584 ||
    poisonBlockSample.nailMatchCount !== 3 || poisonBlockSample.nailDamage !== 2_280 ||
    poisonBlockSample.nailDamageTotal <= poisonBlockSample.nailDamage ||
    Math.abs(poisonBlockSample.enhancedFallPower - 0.06) > 1e-6 ||
    poisonBlockSample.enhancedFallRuleState !== 394_448_415 ||
    poisonBlockSample.weakenedFallPower !== -0.5 ||
    poisonBlockSample.weakenedFallRuleState !== 394_448_415 ||
    poisonBlockSample.blackFallSkillApplied !== true ||
    poisonBlockSample.blackFallOrb.blockFlags !== 0x11000 ||
    poisonBlockSample.blackFallOrb.blind !== true ||
    poisonBlockSample.blackFallOrb.blindFresh !== true ||
    poisonBlockSample.blackFallOrb.blindCountdown !== 1 ||
    poisonBlockSample.blackFallRuleState !== 3_803_934_822 ||
    poisonBlockSample.blackFallAfterFresh.blockFlags !== 0x1000 ||
    poisonBlockSample.blackFallAfterFresh.blind !== true ||
    poisonBlockSample.blackFallAfterFresh.blindFresh !== false ||
    poisonBlockSample.blackFallAfterFresh.blindCountdown !== 1 ||
    poisonBlockSample.blackFallTurnsAfterFresh !== 1 ||
    poisonBlockSample.blackFallAfterExpiry.blockFlags !== 0 ||
    poisonBlockSample.blackFallAfterExpiry.blind !== false ||
    poisonBlockSample.blackFallAfterExpiry.blindCountdown !== 0 ||
    poisonBlockSample.blackFallRuleAfterExpiry.active !== false ||
    poisonBlockSample.blackFallRuleAfterExpiry.turnsRemaining !== 0 ||
    poisonBlockSample.scheduledBlackFall.player.hp !== poisonBlockSample.scheduledBlackFallHp - 925 ||
    poisonBlockSample.scheduledBlackFall.blackFallRule?.turnsRemaining !== 3 ||
    poisonBlockSample.scheduledBlackFall.blackFallRule?.chanceBasisPoints !== 7_500 ||
    poisonBlockSample.scheduledBlackFall.lastEnemyActions?.[0]?.kind !== 'skill' ||
    poisonBlockSample.scheduledBlackFall.lastEnemyActions?.[0]?.skill?.type !== 128 ||
    poisonBlockSample.scheduledBlackFall.lastEnemyActions?.[0]?.damage !== 925 ||
    poisonBlockSample.scheduledBlackFall.enemies?.[0]?.queuedEnemySkills !== 0 ||
    poisonBlockSample.selectedEnemyAi.player.hp !== poisonBlockSample.selectedEnemyAiHp - 925 ||
    poisonBlockSample.selectedEnemyAi.rngState !== 394_448_415 ||
    poisonBlockSample.selectedEnemyAi.lastEnemyActions?.[0]?.skill?.type !== 128 ||
    poisonBlockSample.selectedEnemyAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_001 ||
    poisonBlockSample.selectedEnemyAi.lastEnemyActions?.[0]?.damage !== 925 ||
    poisonBlockSample.selectedEnemyAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.selectedEnemyAi.enemies?.[0]?.enemyAiSkillSlots !== 1 ||
    poisonBlockSample.selectedBlockMinusAi.lastEnemyActions?.[0]?.skill?.type !== 151 ||
    poisonBlockSample.selectedBlockMinusAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_002 ||
    poisonBlockSample.selectedBlockMinusAi.rngState !== advanceLcg(21_900, 3) ||
    poisonBlockSample.selectedBlockMinusAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.selectedBlockMinusCount !== 2 ||
    poisonBlockSample.selectedBurDropAi.lastEnemyActions?.[0]?.skill?.type !== 153 ||
    poisonBlockSample.selectedBurDropAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_003 ||
    poisonBlockSample.selectedBurDropAi.rngState !== advanceLcg(21_900, 3) ||
    poisonBlockSample.selectedBurDropAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.selectedBurDropCount !== 2 ||
    poisonBlockSample.selectedHorizontalLinesAi.lastEnemyActions?.[0]?.skill?.type !== 79 ||
    poisonBlockSample.selectedHorizontalLinesAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_004 ||
    poisonBlockSample.selectedHorizontalLinesAi.rngState !== advanceLcg(21_900, 19) ||
    poisonBlockSample.selectedHorizontalLinesAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    JSON.stringify(poisonBlockSample.selectedHorizontalLinesAi.board) !== JSON.stringify([
      'RRRRRR', 'GLDHJG', 'BBBBBB', 'DLGHHJ', 'GGGGGG',
    ]) ||
    poisonBlockSample.selectedVerticalLinesAi.lastEnemyActions?.[0]?.skill?.type !== 77 ||
    poisonBlockSample.selectedVerticalLinesAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_005 ||
    poisonBlockSample.selectedVerticalLinesAi.rngState !== advanceLcg(21_900, 16) ||
    poisonBlockSample.selectedVerticalLinesAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    JSON.stringify(poisonBlockSample.selectedVerticalLinesAi.board) !== JSON.stringify([
      'RDBDDG', 'RLBHJG', 'RMBDGG', 'RLBHHG', 'RJBGLG',
    ]) ||
    poisonBlockSample.selectedHorizontalLines4Ai.lastEnemyActions?.[0]?.skill?.type !== 78 ||
    poisonBlockSample.selectedHorizontalLines4Ai.lastEnemyActions?.[0]?.skill?.skillId !== 9_007 ||
    poisonBlockSample.selectedHorizontalLines4Ai.rngState !== advanceLcg(21_900, 25) ||
    poisonBlockSample.selectedHorizontalLines4Ai.enemies?.[0]?.enemyAiBudget !== 80 ||
    JSON.stringify(poisonBlockSample.selectedHorizontalLines4Ai.board) !== JSON.stringify([
      'RRRRRR', 'BBBBBB', 'HMGDGL', 'GGGGGG', 'LLLLLL',
    ]) ||
    poisonBlockSample.selectedVerticalLines4Ai.lastEnemyActions?.[0]?.skill?.type !== 76 ||
    poisonBlockSample.selectedVerticalLines4Ai.lastEnemyActions?.[0]?.skill?.skillId !== 9_008 ||
    poisonBlockSample.selectedVerticalLines4Ai.rngState !== advanceLcg(21_900, 21) ||
    poisonBlockSample.selectedVerticalLines4Ai.enemies?.[0]?.enemyAiBudget !== 80 ||
    JSON.stringify(poisonBlockSample.selectedVerticalLines4Ai.board) !== JSON.stringify([
      'RBGDDL', 'RBGHJL', 'RBGDGL', 'RBGHHL', 'RBGGLL',
    ]) ||
    poisonBlockSample.selectedPoisonTypeListAi.lastEnemyActions?.[0]?.skill?.type !== 81 ||
    poisonBlockSample.selectedPoisonTypeListAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_006 ||
    poisonBlockSample.selectedPoisonTypeListAi.rngState !== advanceLcg(21_900, 31) ||
    poisonBlockSample.selectedPoisonTypeListAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    JSON.stringify(poisonBlockSample.selectedPoisonTypeListCounts) !== JSON.stringify([12, 9, 9]) ||
    /[PM]/.test(poisonBlockSample.selectedPoisonTypeListAi.board.join('')) ||
    poisonBlockSample.selectedPoisonTypeListDirectAi.lastEnemyActions?.[0]?.skill?.type !== 80 ||
    poisonBlockSample.selectedPoisonTypeListDirectAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_009 ||
    poisonBlockSample.selectedPoisonTypeListDirectAi.rngState !== advanceLcg(21_900, 31) ||
    poisonBlockSample.selectedPoisonTypeListDirectAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    JSON.stringify(poisonBlockSample.selectedPoisonTypeListDirectCounts) !== JSON.stringify([12, 9, 9]) ||
    /[PM]/.test(poisonBlockSample.selectedPoisonTypeListDirectAi.board.join('')) ||
    poisonBlockSample.selectedPoisonMaskDirectAi.lastEnemyActions?.[0]?.skill?.type !== 84 ||
    poisonBlockSample.selectedPoisonMaskDirectAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_010 ||
    poisonBlockSample.selectedPoisonMaskDirectAi.rngState !== advanceLcg(21_900, 31) ||
    poisonBlockSample.selectedPoisonMaskDirectAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    JSON.stringify(poisonBlockSample.selectedPoisonMaskDirectCounts) !== JSON.stringify([12, 9, 9]) ||
    /[PM]/.test(poisonBlockSample.selectedPoisonMaskDirectAi.board.join('')) ||
    poisonBlockSample.selectedPoisonMaskAi.lastEnemyActions?.[0]?.skill?.type !== 85 ||
    poisonBlockSample.selectedPoisonMaskAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_011 ||
    poisonBlockSample.selectedPoisonMaskAi.rngState !== advanceLcg(21_900, 31) ||
    poisonBlockSample.selectedPoisonMaskAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    JSON.stringify(poisonBlockSample.selectedPoisonMaskCounts) !== JSON.stringify([12, 9, 9]) ||
    /[PM]/.test(poisonBlockSample.selectedPoisonMaskAi.board.join('')) ||
    poisonBlockSample.selectedPoisonBlockNAi.lastEnemyActions?.[0]?.skill?.type !== 64 ||
    poisonBlockSample.selectedPoisonBlockNAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_012 ||
    poisonBlockSample.selectedPoisonBlockNAi.rngState !== advanceLcg(21_900, 11) ||
    poisonBlockSample.selectedPoisonBlockNAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.selectedPoisonBlockNMortalCount !== 5 ||
    poisonBlockSample.selectedPoisonBlockNHeartCount !== poisonBlockSample.poisonBlockNHeartCount ||
    poisonBlockSample.rejectedPoisonBlockNSkill !== null ||
    poisonBlockSample.rejectedPoisonBlockNState.rngState !== 21_900 ||
    poisonBlockSample.rejectedPoisonBlockNState.enemies?.[0]?.enemyAiBudget !== 100 ||
    poisonBlockSample.selectedPoisonBlocksAi.lastEnemyActions?.[0]?.skill?.type !== 57 ||
    poisonBlockSample.selectedPoisonBlocksAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_013 ||
    poisonBlockSample.selectedPoisonBlocksAi.rngState !== advanceLcg(21_900, 3) ||
    poisonBlockSample.selectedPoisonBlocksAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.selectedPoisonBlocksCount !== 6 ||
    poisonBlockSample.selectedPoisonBlocksHeartCount !== poisonBlockSample.poisonBlocksHeartCount ||
    poisonBlockSample.selectedMortalPoisonBlocksAi.lastEnemyActions?.[0]?.skill?.type !== 59 ||
    poisonBlockSample.selectedMortalPoisonBlocksAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_014 ||
    poisonBlockSample.selectedMortalPoisonBlocksAi.rngState !== advanceLcg(21_900, 3) ||
    poisonBlockSample.selectedMortalPoisonBlocksAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.selectedMortalPoisonBlocksCount !== 7 ||
    poisonBlockSample.rejectedPoisonBlocksSkill !== null ||
    poisonBlockSample.rejectedPoisonBlocksState.rngState !== 21_900 ||
    poisonBlockSample.selectedCountedPoisonAi.lastEnemyActions?.[0]?.skill?.type !== 60 ||
    poisonBlockSample.selectedCountedPoisonAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_015 ||
    poisonBlockSample.selectedCountedPoisonAi.rngState !== advanceLcg(21_900, 9) ||
    poisonBlockSample.selectedCountedPoisonAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.selectedCountedPoisonCount !== 4 ||
    poisonBlockSample.selectedCountedPoisonHeartCount !== poisonBlockSample.countedPoisonHeartCount ||
    poisonBlockSample.selectedCountedMortalAi.lastEnemyActions?.[0]?.skill?.type !== 61 ||
    poisonBlockSample.selectedCountedMortalAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_016 ||
    poisonBlockSample.selectedCountedMortalAi.rngState !== advanceLcg(21_900, 9) ||
    poisonBlockSample.selectedCountedMortalAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.selectedCountedMortalCount !== 4 ||
    poisonBlockSample.rejectedCountedPoisonSkill !== null ||
    poisonBlockSample.rejectedCountedPoisonState.rngState !== 21_900 ||
    poisonBlockSample.selectedSourceToPoisonAi.lastEnemyActions?.[0]?.skill?.type !== 56 ||
    poisonBlockSample.selectedSourceToPoisonAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_017 ||
    poisonBlockSample.selectedSourceToPoisonAi.rngState !== advanceLcg(21_900, 1) ||
    poisonBlockSample.selectedSourceToPoisonAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.selectedSourceToPoisonCount !== 2 ||
    poisonBlockSample.selectedSourceToPoisonLockedType !== 'fire' ||
    poisonBlockSample.rejectedScaledSourceToPoisonSkill !== null ||
    poisonBlockSample.rejectedScaledSourceToPoisonState.rngState !== advanceLcg(21_900, 1) ||
    poisonBlockSample.selectedSourceToMortalPoisonAi.lastEnemyActions?.[0]?.skill?.type !== 58 ||
    poisonBlockSample.selectedSourceToMortalPoisonAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_018 ||
    poisonBlockSample.selectedSourceToMortalPoisonAi.rngState !== advanceLcg(21_900, 1) ||
    poisonBlockSample.selectedSourceToMortalPoisonAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.selectedSourceToMortalPoisonCount !== 3 ||
    poisonBlockSample.selectedHealPlayerAi.player.hp !== 9_059 ||
    poisonBlockSample.selectedHealPlayerAi.lastEnemyActions?.[0]?.skill?.type !== 55 ||
    poisonBlockSample.selectedHealPlayerAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_019 ||
    poisonBlockSample.selectedHealPlayerAi.rngState !== advanceLcg(21_900, 1) ||
    poisonBlockSample.selectedHealPlayerAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.rejectedHealPlayerSkill !== null ||
    poisonBlockSample.rejectedHealPlayerState.rngState !== 21_900 ||
    poisonBlockSample.selectedStatusShieldAi.enemies?.[0]?.statusShieldTurns !== 3 ||
    poisonBlockSample.selectedStatusShieldAi.lastEnemyActions?.[0]?.skill?.type !== 20 ||
    poisonBlockSample.selectedStatusShieldAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_029 ||
    poisonBlockSample.selectedStatusShieldAi.rngState !== advanceLcg(21_900, 1) ||
    poisonBlockSample.selectedStatusShieldAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.rejectedStatusShieldSkill !== null ||
    poisonBlockSample.rejectedStatusShieldState.rngState !== 21_900 ||
    poisonBlockSample.selectedLoneAttackBoostAi.enemies?.[0]?.attackBoostTurns !== 3 ||
    poisonBlockSample.selectedLoneAttackBoostAi.enemies?.[0]?.attackBoostPercent !== 200 ||
    poisonBlockSample.selectedLoneAttackBoostAi.lastEnemyActions?.[0]?.skill?.type !== 17 ||
    poisonBlockSample.selectedLoneAttackBoostAi.lastEnemyActions?.[0]?.damage !== 925 ||
    poisonBlockSample.selectedLoneAttackBoostAi.rngState !== advanceLcg(21_900, 1) ||
    poisonBlockSample.boostedLoneEnemyAttack.lastEnemyActions?.[0]?.damage !== 3_700 ||
    poisonBlockSample.rejectedLoneAttackBoostSkill !== null ||
    poisonBlockSample.rejectedLoneAttackBoostState.rngState !== 21_900 ||
    poisonBlockSample.selectedSourceOrbConversionAi.lastEnemyActions?.[0]?.skill?.type !== 4 ||
    poisonBlockSample.selectedSourceOrbConversionAi.lastEnemyActions?.[0]?.damage !== 463 ||
    poisonBlockSample.selectedSourceOrbConversionAi.rngState !== advanceLcg(21_900, 1) ||
    poisonBlockSample.selectedSourceOrbConversionWaterCount !== 0 ||
    poisonBlockSample.rejectedSourceOrbConversionSkill !== null ||
    poisonBlockSample.rejectedSourceOrbConversionState.rngState !== 21_900 ||
    poisonBlockSample.randomSourceOrbConversionApplied !== true ||
    poisonBlockSample.randomSourceOrbConversionState.lastEnemySkill?.sourceType !== 0 ||
    poisonBlockSample.randomSourceOrbConversionState.lastEnemySkill?.destinationType !== 3 ||
    poisonBlockSample.randomSourceOrbConversionState.rngState !== advanceLcg(21_900, 4) ||
    poisonBlockSample.selectedSourceToJammerAi.lastEnemyActions?.[0]?.skill?.type !== 12 ||
    poisonBlockSample.selectedSourceToJammerAi.rngState !== advanceLcg(21_900, 1) ||
    poisonBlockSample.selectedSourceToJammerCount !== 5 ||
    poisonBlockSample.rejectedSourceToJammerSkill !== null ||
    poisonBlockSample.rejectedSourceToJammerState.rngState !== 21_900 ||
    poisonBlockSample.selectedStatusTriggeredAttackBoostAi.enemies?.[0]?.attackBoostTurns !== 2 ||
    poisonBlockSample.selectedStatusTriggeredAttackBoostAi.enemies?.[0]?.attackBoostPercent !== 250 ||
    poisonBlockSample.selectedStatusTriggeredAttackBoostAi.lastEnemyActions?.[0]?.skill?.type !== 18 ||
    poisonBlockSample.selectedStatusTriggeredAttackBoostAi.lastEnemyActions?.[0]?.damage !== 925 ||
    poisonBlockSample.selectedStatusTriggeredAttackBoostAi.nativePlayerBuffStatus?.attackBoostTurns !== 2 ||
    poisonBlockSample.selectedStatusTriggeredAttackBoostAi.rngState !== advanceLcg(21_900, 1) ||
    poisonBlockSample.selectedTransientAttackBoostAi.lastEnemyActions?.[0]?.skill?.type !== 18 ||
    poisonBlockSample.selectedTransientAttackBoostAi.enemies?.[0]?.transientDebuffActive !== false ||
    poisonBlockSample.rejectedStatusTriggeredAttackBoostSkill !== null ||
    poisonBlockSample.rejectedStatusTriggeredAttackBoostState.rngState !== 21_900 ||
    poisonBlockSample.selectedDamagedTurnAttackBoostAi.enemies?.[0]?.damagedTurnCount !== 2 ||
    poisonBlockSample.selectedDamagedTurnAttackBoostAi.enemies?.[0]?.attackBoostTurns !== 4 ||
    poisonBlockSample.selectedDamagedTurnAttackBoostAi.enemies?.[0]?.attackBoostPercent !== 300 ||
    poisonBlockSample.selectedDamagedTurnAttackBoostAi.lastEnemyActions?.[0]?.skill?.type !== 19 ||
    poisonBlockSample.selectedDamagedTurnAttackBoostAi.lastEnemyActions?.[0]?.damage !== 925 ||
    poisonBlockSample.selectedDamagedTurnAttackBoostAi.rngState !== advanceLcg(21_900, 1) ||
    poisonBlockSample.rejectedDamagedTurnAttackBoostSkill !== null ||
    poisonBlockSample.rejectedDamagedTurnAttackBoostState.rngState !== 21_900 ||
    poisonBlockSample.damagedTurnCounterState.enemies?.[0]?.damagedTurnCount !== 1 ||
    poisonBlockSample.selectedMoveTimeReductionAi.moveTimeSeconds !== 3.75 ||
    poisonBlockSample.selectedMoveTimeReductionAi.moveTimeReduction?.turnsRemaining !== 2 ||
    poisonBlockSample.selectedMoveTimeReductionAi.lastEnemyActions?.[0]?.skill?.type !== 39 ||
    poisonBlockSample.selectedMoveTimeReductionAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_028 ||
    poisonBlockSample.selectedMoveTimeReductionAi.rngState !== advanceLcg(21_900, 1) ||
    poisonBlockSample.selectedMoveTimeReductionAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.moveTimeReductionDrag?.remainingSeconds !== 3.75 ||
    poisonBlockSample.rejectedMoveTimeReductionSkill !== null ||
    poisonBlockSample.rejectedMoveTimeReductionState.rngState !== 21_900 ||
    poisonBlockSample.selectedSelfDestructAi.enemies?.[0]?.hp !== 0 ||
    poisonBlockSample.selectedSelfDestructAi.enemies?.[1]?.hp !== 76_000 ||
    poisonBlockSample.selectedSelfDestructAi.lastEnemyActions?.[0]?.skill?.type !== 40 ||
    poisonBlockSample.selectedSelfDestructAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_027 ||
    poisonBlockSample.selectedSelfDestructAi.rngState !== advanceLcg(21_900, 1) ||
    poisonBlockSample.selectedSelfDestructAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.selectedChangeAttributeAi.enemies?.[0]?.attribute !== 'water' ||
    poisonBlockSample.selectedChangeAttributeAi.lastEnemyActions?.[0]?.skill?.type !== 46 ||
    poisonBlockSample.selectedChangeAttributeAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_025 ||
    poisonBlockSample.selectedChangeAttributeAi.lastEnemyActions?.[0]?.skill?.targetAttribute !== 1 ||
    poisonBlockSample.selectedChangeAttributeAi.rngState !== advanceLcg(21_900, 3) ||
    poisonBlockSample.selectedChangeAttributeAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.rejectedChangeAttributeSkill !== null ||
    poisonBlockSample.rejectedChangeAttributeState.rngState !== 21_900 ||
    poisonBlockSample.selectedScaledAttackAi.player.hp !== 11_075 ||
    poisonBlockSample.selectedScaledAttackAi.lastEnemyActions?.[0]?.skill?.type !== 47 ||
    poisonBlockSample.selectedScaledAttackAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_024 ||
    poisonBlockSample.selectedScaledAttackAi.lastEnemyActions?.[0]?.damage !== 925 ||
    poisonBlockSample.selectedScaledAttackAi.rngState !== advanceLcg(21_900, 1) ||
    poisonBlockSample.selectedScaledAttackAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.rejectedScaledAttackSkill !== null ||
    poisonBlockSample.rejectedScaledAttackState.rngState !== 21_900 ||
    poisonBlockSample.selectedCurrentHpGravityAi.player.hp !== 9_000 ||
    poisonBlockSample.selectedCurrentHpGravityAi.lastEnemyActions?.[0]?.skill?.type !== 50 ||
    poisonBlockSample.selectedCurrentHpGravityAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_023 ||
    poisonBlockSample.selectedCurrentHpGravityAi.lastEnemyActions?.[0]?.damage !== 3_000 ||
    poisonBlockSample.selectedCurrentHpGravityAi.rngState !== advanceLcg(21_900, 1) ||
    poisonBlockSample.selectedCurrentHpGravityAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.selectedReviveEnemyAi.lastEnemyActions?.[0]?.skill?.type !== 52 ||
    poisonBlockSample.selectedReviveEnemyAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_022 ||
    poisonBlockSample.selectedReviveEnemyAi.lastEnemyActions?.[0]?.skill?.targetEnemyIndex !== 1 ||
    poisonBlockSample.selectedReviveEnemyAi.lastEnemySkill?.revivedHp !== 28_120 ||
    poisonBlockSample.selectedReviveEnemyAi.enemies?.[1]?.hp !== 28_120 ||
    poisonBlockSample.selectedReviveEnemyAi.enemies?.[1]?.counter !== 1 ||
    poisonBlockSample.selectedReviveEnemyAi.rngState !== advanceLcg(21_900, 2) ||
    poisonBlockSample.selectedReviveEnemyAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.rejectedReviveEnemySkill !== null ||
    poisonBlockSample.rejectedReviveEnemyState.rngState !== 21_900 ||
    poisonBlockSample.selectedBindLeaderHelperAi.lastEnemyActions?.[0]?.skill?.type !== 54 ||
    poisonBlockSample.selectedBindLeaderHelperAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_020 ||
    poisonBlockSample.selectedBindLeaderHelperAi.lastEnemyActions?.[0]?.skill?.targetMask !== 0x21 ||
    poisonBlockSample.selectedBindLeaderHelperAi.lastEnemyActions?.[0]?.skill?.setupDurationTurns !== 4 ||
    poisonBlockSample.selectedBindLeaderHelperAi.lastEnemySkill?.durationTurns !== 3 ||
    poisonBlockSample.selectedBindLeaderHelperAi.lastEnemySkill?.boundMask !== 0x21 ||
    poisonBlockSample.selectedBindLeaderHelperAi.party?.[0]?.bindTurns !== 3 ||
    poisonBlockSample.selectedBindLeaderHelperAi.party?.[5]?.bindTurns !== 3 ||
    poisonBlockSample.selectedBindLeaderHelperAi.rngState !== advanceLcg(21_900, 3) ||
    poisonBlockSample.selectedBindLeaderHelperAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.rejectedBindLeaderHelperSkill !== null ||
    poisonBlockSample.rejectedBindLeaderHelperState.rngState !== 21_900 ||
    poisonBlockSample.selectedAttributeAbsorbAi.lastEnemyActions?.[0]?.skill?.type !== 53 ||
    poisonBlockSample.selectedAttributeAbsorbAi.lastEnemyActions?.[0]?.skill?.skillId !== 9_021 ||
    poisonBlockSample.selectedAttributeAbsorbAi.lastEnemyActions?.[0]?.skill?.durationTurns !== 4 ||
    poisonBlockSample.selectedAttributeAbsorbAi.enemies?.[0]?.attributeAbsorbTurns !== 4 ||
    poisonBlockSample.selectedAttributeAbsorbAi.enemies?.[0]?.attributeAbsorbMask !== 0x03 ||
    poisonBlockSample.selectedAttributeAbsorbAi.rngState !== advanceLcg(21_900, 2) ||
    poisonBlockSample.selectedAttributeAbsorbAi.enemies?.[0]?.enemyAiBudget !== 80 ||
    poisonBlockSample.attributeAbsorbDamageState.lastDamage !== 0 ||
    poisonBlockSample.attributeAbsorbDamageState.lastAbsorbedDamage <= 0 ||
    poisonBlockSample.attributeAbsorbDamageState.enemies?.[0]?.hp <= 50_000 ||
    poisonBlockSample.rejectedAttributeAbsorbSkill !== null ||
    poisonBlockSample.rejectedAttributeAbsorbState.rngState !== 21_900 ||
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
  const nailRenderState = renderNailState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.setBoardFromCodes(['RRRHBG', 'BGLHDB', 'GLHDBG', 'LHDBGL', 'HDBGLH']);
    for (let column = 0; column < 3; column += 1) engine.setOrbState(0, column, { nail: true });
    engine.start();
    return engine.snapshot().boardState[0];
  }) : null;
  if (nailRenderState && nailRenderState.slice(0, 3).some((orb) => !orb.nail || (orb.blockFlags & 0x20000) === 0)) {
    throw new Error(`Nail render-state mismatch: ${JSON.stringify(nailRenderState)}`);
  }
  if (nailRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const blackFallRenderState = renderBlackFallState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.setBoardFromCodes(['RHGBGG', 'BBGHRL', 'LDBRHR', 'BHLDBH', 'LRLDHR']);
    for (let column = 0; column < 3; column += 1) {
      engine.setOrbState(0, column, { blind: true, blindFresh: true, blindCountdown: 1 });
    }
    engine.start();
    return engine.snapshot().boardState[0];
  }) : null;
  if (blackFallRenderState && blackFallRenderState.slice(0, 3).some((orb) => (
    !orb.blind || !orb.blindFresh || orb.blindCountdown !== 1 || (orb.blockFlags & 0x11000) !== 0x11000
  ))) throw new Error(`Black-fall render-state mismatch: ${JSON.stringify(blackFallRenderState)}`);
  if (blackFallRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const bindRenderState = renderBindState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.party[0].bindTurns = 3;
    engine.party[5].bindTurns = 3;
    return engine.snapshot().party;
  }) : null;
  if (bindRenderState && (
    bindRenderState[0]?.bindTurns !== 3 || bindRenderState[5]?.bindTurns !== 3
  )) throw new Error(`Bind render-state mismatch: ${JSON.stringify(bindRenderState)}`);
  if (bindRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const attributeAbsorbRenderState = renderAttributeAbsorbState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.enemies[0].attributeAbsorbTurns = 4;
    engine.enemies[0].attributeAbsorbMask = 0x03;
    return engine.snapshot().enemies[0];
  }) : null;
  if (attributeAbsorbRenderState && (
    attributeAbsorbRenderState.attributeAbsorbTurns !== 4
    || attributeAbsorbRenderState.attributeAbsorbMask !== 0x03
  )) throw new Error(`Attribute-absorb render-state mismatch: ${JSON.stringify(attributeAbsorbRenderState)}`);
  if (attributeAbsorbRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const reviveRenderState = renderReviveState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.enemies[1].hp = 0;
    const applied = engine.applyEnemySkillRecord({
      type: 52,
      kind: 'reviveEnemy',
      supported: true,
      targetEnemyIndex: 1,
      revivePercent: 37,
      setupMaterialized: true,
    }, 0);
    return {
      applied,
      enemy: engine.snapshot().enemies[1],
      floatingText: engine.floatingText.map((item) => ({ ...item })),
    };
  }) : null;
  if (reviveRenderState && (
    reviveRenderState.applied !== true
    || reviveRenderState.enemy?.hp !== 28_120
    || reviveRenderState.floatingText?.[0]?.kind !== 'revive'
    || reviveRenderState.floatingText?.[0]?.value !== 28_120
  )) throw new Error(`Revive render-state mismatch: ${JSON.stringify(reviveRenderState)}`);
  if (reviveRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const attributeChangeRenderState = renderAttributeChangeState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.enemies[1].attribute = 'dark';
    const applied = engine.applyEnemySkillRecord({
      type: 46,
      kind: 'changeEnemyAttribute',
      supported: true,
      candidateAttributes: [0, 2, 1, 3, 9],
      targetAttribute: 0,
      setupMaterialized: true,
    }, 1);
    return { applied, enemy: engine.snapshot().enemies[1] };
  }) : null;
  if (attributeChangeRenderState && (
    attributeChangeRenderState.applied !== true
    || attributeChangeRenderState.enemy?.attribute !== 'fire'
  )) throw new Error(`Attribute-change render-state mismatch: ${JSON.stringify(attributeChangeRenderState)}`);
  if (attributeChangeRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const selfDestructRenderState = renderSelfDestructState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    const applied = engine.applyEnemySkillRecord({
      type: 40,
      kind: 'selfDestruct',
      supported: true,
      attackWithSkillValue: 0,
    }, 0);
    return { applied, enemy: engine.snapshot().enemies[0] };
  }) : null;
  if (selfDestructRenderState && (
    selfDestructRenderState.applied !== true
    || selfDestructRenderState.enemy?.hp !== 0
  )) throw new Error(`Self-destruct render-state mismatch: ${JSON.stringify(selfDestructRenderState)}`);
  if (selfDestructRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const moveTimeRenderState = renderMoveTimeState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    const applied = engine.applyEnemySkillRecord({
      type: 39,
      kind: 'moveTimeReduction',
      supported: true,
      durationTurns: 2,
      fixedReductionCentiseconds: 125,
      percentReduction: 0,
      attackWithSkillValue: 0,
    }, 0);
    return {
      applied,
      moveTimeSeconds: engine.moveTime,
      moveTimeReduction: { ...engine.moveTimeReduction },
    };
  }) : null;
  if (moveTimeRenderState && (
    moveTimeRenderState.applied !== true
    || moveTimeRenderState.moveTimeSeconds !== 3.75
    || moveTimeRenderState.moveTimeReduction?.turnsRemaining !== 2
  )) throw new Error(`Move-time render-state mismatch: ${JSON.stringify(moveTimeRenderState)}`);
  if (moveTimeRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const statusShieldRenderState = renderStatusShieldState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    const applied = engine.applyEnemySkillRecord({
      type: 20,
      kind: 'statusShield',
      supported: true,
      durationTurns: 3,
      attackWithSkillValue: 0,
    }, 0);
    return {
      applied,
      enemy: engine.snapshot().enemies[0],
    };
  }) : null;
  if (statusShieldRenderState && (
    statusShieldRenderState.applied !== true
    || statusShieldRenderState.enemy?.statusShieldTurns !== 3
  )) throw new Error(`Status-shield render-state mismatch: ${JSON.stringify(statusShieldRenderState)}`);
  if (statusShieldRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const clearPlayerBuffsRenderState = renderClearPlayerBuffsState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.playerAuxiliaryBuffTurns = 4;
    engine.playerAttackBoostTurns = 2;
    const applied = engine.applyEnemySkillRecord({
      type: 6,
      kind: 'clearPlayerBuffs',
      supported: true,
      attackWithSkillValue: 0,
    }, 0);
    return {
      applied,
      state: engine.snapshot(),
      message: engine.message,
    };
  }) : null;
  if (clearPlayerBuffsRenderState && (
    clearPlayerBuffsRenderState.applied !== true
    || clearPlayerBuffsRenderState.state?.nativePlayerBuffStatus?.auxiliaryTurns !== 0
    || clearPlayerBuffsRenderState.state?.nativePlayerBuffStatus?.attackBoostTurns !== 0
    || clearPlayerBuffsRenderState.state?.lastEnemySkill?.type !== 6
    || clearPlayerBuffsRenderState.state?.lastEnemySkill?.clearedBuffCount !== 2
  )) throw new Error(`Player-buff dispel render-state mismatch: ${JSON.stringify(clearPlayerBuffsRenderState)}`);
  if (clearPlayerBuffsRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const earlyHealAttackRenderState = renderEarlyHealAttackState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const makeMonster = (skillId) => {
      const bytes = new Uint8Array(0x2ec);
      const view = new DataView(bytes.buffer);
      view.setUint8(0xe0, 1);
      view.setInt16(0xe2, 100, true);
      view.setInt16(0xe4, 10, true);
      view.setUint32(0xec, skillId, true);
      view.setUint8(0xf0, 100);
      return bytes;
    };
    const makeSkill = (skillId, type, minimum, maximum) => {
      const bytes = new Uint8Array(0x48);
      const view = new DataView(bytes.buffer);
      view.setUint32(0x00, skillId, true);
      view.setInt16(0x04, type, true);
      view.setInt32(0x10, minimum, true);
      view.setInt32(0x14, maximum, true);
      view.setInt32(0x30, 10_000, true);
      view.setInt32(0x34, 1_000, true);
      view.setInt32(0x38, 100, true);
      view.setInt32(0x40, 20, true);
      view.setInt32(0x44, 50, true);
      return bytes;
    };
    engine.reset();
    engine.start();
    engine.setEnemyAiDefinitionPool(0, makeMonster(9_036), [
      makeSkill(9_036, 7, 20, 30),
    ]);
    engine.enemies[0].hp = 50_000;
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.setRngState(21_900);
    engine.resolveEnemyTurn();
    const healState = engine.snapshot();
    engine.reset();
    engine.start();
    engine.setEnemyAiDefinitionPool(0, makeMonster(9_037), [
      makeSkill(9_037, 8, 120, 140),
    ]);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.setRngState(21_900);
    engine.resolveEnemyTurn();
    return { healState, attackState: engine.snapshot() };
  }) : null;
  if (earlyHealAttackRenderState && (
    earlyHealAttackRenderState.healState?.enemies?.[0]?.hp !== 76_680
    || earlyHealAttackRenderState.healState?.lastEnemyActions?.[0]?.skill?.type !== 7
    || earlyHealAttackRenderState.healState?.lastEnemyActions?.[0]?.skill?.healPercent !== 29
    || earlyHealAttackRenderState.healState?.lastEnemyActions?.[0]?.damage !== 925
    || earlyHealAttackRenderState.attackState?.lastEnemyActions?.[0]?.skill?.type !== 8
    || earlyHealAttackRenderState.attackState?.lastEnemyActions?.[0]?.skill?.damagePercent !== 138
    || earlyHealAttackRenderState.attackState?.lastEnemyActions?.[0]?.damage !== 3_478
    || earlyHealAttackRenderState.attackState?.player?.hp !== 8_522
  )) throw new Error(`Early heal/attack render-state mismatch: ${JSON.stringify(earlyHealAttackRenderState)}`);
  if (earlyHealAttackRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const earlyDefenseShieldsRenderState = renderEarlyDefenseShieldsState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const makeSkill = (skillId, type, parameter0, parameter1, parameter2) => {
      const bytes = new Uint8Array(0x48);
      const view = new DataView(bytes.buffer);
      view.setUint32(0x00, skillId, true);
      view.setInt16(0x04, type, true);
      view.setInt32(0x10, parameter0, true);
      view.setInt32(0x14, parameter1, true);
      view.setInt32(0x18, parameter2, true);
      view.setInt32(0x30, 10_000, true);
      view.setInt32(0x34, 1_000, true);
      view.setInt32(0x38, 100, true);
      view.setInt32(0x40, 20, true);
      return bytes;
    };
    engine.reset();
    engine.start();
    engine.setRngState(21_900);
    const defenseApplied = engine.applyEnemySkillDefinition(
      makeSkill(9_038, 9, 3, 150, 200),
    );
    const defenseState = engine.snapshot();
    engine.reset();
    engine.start();
    const nullifyApplied = engine.applyEnemySkillDefinition(
      makeSkill(9_040, 11, 4, 0, 4),
    );
    engine.enemies[0].hp = 50_000;
    engine.enemies[1].hp = 0;
    engine.party.forEach((member, index) => {
      if (index !== 0) member.bindTurns = 5;
    });
    engine.party[0].leaderSkill = null;
    engine.comboCount = 1;
    engine.turnMatches = [{
      type: 'fire', size: 3, enhancedCount: 0, enhancementMultiplier: 1, isMassAttack: false,
    }];
    engine.resolvePlayerTurn();
    return { defenseApplied, defenseState, nullifyApplied, nullifyState: engine.snapshot() };
  }) : null;
  if (earlyDefenseShieldsRenderState && (
    earlyDefenseShieldsRenderState.defenseApplied !== true
    || earlyDefenseShieldsRenderState.defenseState?.lastEnemySkill?.type !== 9
    || earlyDefenseShieldsRenderState.defenseState?.lastEnemySkill?.boostPercent !== 154
    || earlyDefenseShieldsRenderState.defenseState?.enemies?.[0]?.defenseBoostTurns !== 3
    || earlyDefenseShieldsRenderState.defenseState?.enemies?.[0]?.defenseBoostAmount !== 185
    || earlyDefenseShieldsRenderState.nullifyApplied !== true
    || earlyDefenseShieldsRenderState.nullifyState?.lastEnemySkill?.type !== 11
    || earlyDefenseShieldsRenderState.nullifyState?.enemies?.[0]?.attributeNullifyTurns !== 4
    || earlyDefenseShieldsRenderState.nullifyState?.enemies?.[0]?.attributeNullifyMask !== 0x11
    || earlyDefenseShieldsRenderState.nullifyState?.lastDamage !== 0
    || earlyDefenseShieldsRenderState.nullifyState?.enemies?.[0]?.hp !== 50_000
  )) throw new Error(`Early defense/shield render-state mismatch: ${JSON.stringify(earlyDefenseShieldsRenderState)}`);
  if (earlyDefenseShieldsRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const earlyPartyControlRenderState = renderEarlyPartyControlState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const makeSkill = (skillId, type, parameter0, parameter1) => {
      const bytes = new Uint8Array(0x48);
      const view = new DataView(bytes.buffer);
      view.setUint32(0x00, skillId, true);
      view.setInt16(0x04, type, true);
      view.setInt32(0x10, parameter0, true);
      view.setInt32(0x14, parameter1, true);
      view.setInt32(0x44, 0, true);
      return bytes;
    };
    engine.reset();
    engine.start();
    engine.setRngState(21_900);
    const randomBindApplied = engine.applyEnemySkillDefinition(makeSkill(9_041, 13, 2, 99));
    const randomBindState = engine.snapshot();
    engine.reset();
    engine.start();
    engine.setRngState(21_900);
    engine.setEnemySkillQueue(0, [makeSkill(9_042, 14, 2, 4)]);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const skillUseResult = engine.useSkill();
    return {
      randomBindApplied,
      randomBindState,
      skillUseResult,
      skillSealState: engine.snapshot(),
    };
  }) : null;
  if (earlyPartyControlRenderState && (
    earlyPartyControlRenderState.randomBindApplied !== true
    || earlyPartyControlRenderState.randomBindState?.lastEnemySkill?.type !== 13
    || earlyPartyControlRenderState.randomBindState?.lastEnemySkill?.targetMask !== 0x03
    || earlyPartyControlRenderState.randomBindState?.party?.[0]?.bindTurns !== 6
    || earlyPartyControlRenderState.randomBindState?.party?.[1]?.bindTurns !== 6
    || earlyPartyControlRenderState.skillUseResult !== false
    || earlyPartyControlRenderState.skillSealState?.lastEnemySkill?.type !== 14
    || earlyPartyControlRenderState.skillSealState?.skillSealTurns !== 1
    || earlyPartyControlRenderState.skillSealState?.skill?.sealed !== true
    || earlyPartyControlRenderState.skillSealState?.skill?.ready !== false
  )) throw new Error(`Early party-control render-state mismatch: ${JSON.stringify(earlyPartyControlRenderState)}`);
  if (earlyPartyControlRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const attackBoostRenderState = renderAttackBoostState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.enemies[1].hp = 0;
    const applied = engine.applyEnemySkillRecord({
      type: 17,
      kind: 'loneAttackBoost',
      supported: true,
      durationTurns: 3,
      boostPercent: 200,
      attackWithSkillValue: 0,
    }, 0);
    return {
      applied,
      enemy: engine.snapshot().enemies[0],
    };
  }) : null;
  if (attackBoostRenderState && (
    attackBoostRenderState.applied !== true
    || attackBoostRenderState.enemy?.attackBoostTurns !== 3
    || attackBoostRenderState.enemy?.attackBoostPercent !== 200
  )) throw new Error(`Attack-boost render-state mismatch: ${JSON.stringify(attackBoostRenderState)}`);
  if (attackBoostRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  await page.screenshot({ path: outputPath, fullPage: true });
  await fs.writeFile(`${outputPath}.json`, JSON.stringify({ before, during, after, bombResolution, thornInput, orbStateSample, blockPowupSample, blockMinusSample, burDropSample, lockDropSample, poisonBlockSample, largeBoard, tapTurn, matchShape, attackRounds, pointerIdentity, moveDeadline, nailRenderState, blackFallRenderState, bindRenderState, attributeAbsorbRenderState, reviveRenderState, attributeChangeRenderState, selfDestructRenderState, moveTimeRenderState, statusShieldRenderState, clearPlayerBuffsRenderState, earlyHealAttackRenderState, earlyDefenseShieldsRenderState, earlyPartyControlRenderState, attackBoostRenderState, consoleMessages }, null, 2));
  const atlasStatus = await page.locator('.puzzle-apk-art span').textContent();
  process.stdout.write(`${JSON.stringify({ atlasStatus, dragPathLength: during.drag.pathLength, turn: after.turn, phase: after.phase, bombResolution, thornInput, orbStateSample, blockPowupSample, blockMinusSample, burDropSample, lockDropSample, poisonBlockSample, largeBoard, tapTurn, matchShape, attackRounds, pointerIdentity, moveDeadline, nailRenderState, blackFallRenderState, bindRenderState, attributeAbsorbRenderState, reviveRenderState, attributeChangeRenderState, selfDestructRenderState, moveTimeRenderState, statusShieldRenderState, clearPlayerBuffsRenderState, earlyHealAttackRenderState, earlyDefenseShieldsRenderState, earlyPartyControlRenderState, attackBoostRenderState, consoleMessages }, null, 2)}\n`);
} finally {
  await browser.close();
}
