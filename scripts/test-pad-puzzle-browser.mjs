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
const renderComboAbsorbState = process.argv.includes('--combo-absorb-render');
const renderSkyfallRateState = process.argv.includes('--skyfall-rate-render');
const renderDeathCryState = process.argv.includes('--death-cry-render');
const renderDamageVoidState = process.argv.includes('--damage-void-render');
const renderDamageAbsorbState = process.argv.includes('--damage-absorb-render');
const renderAwakeningBindState = process.argv.includes('--awakening-bind-render');
const renderSkillDelayState = process.argv.includes('--skill-delay-render');
const renderPresenceCheckState = process.argv.includes('--presence-check-render');
const renderMaskedRandomOrbChangeState = process.argv.includes('--masked-random-orb-change-render');
const renderNativeNoEffectState = process.argv.includes('--native-no-effect-render');
const renderLockRandomOrbsState = process.argv.includes('--lock-random-orbs-render');
const renderEnemyEscapeState = process.argv.includes('--enemy-escape-render');
const renderLockedSkyfallState = process.argv.includes('--locked-skyfall-render');
const renderStickyBlindRandomState = process.argv.includes('--sticky-blind-random-render');
const renderStickyBlindFixedState = process.argv.includes('--sticky-blind-fixed-render');
const renderOrbSealColumnsState = process.argv.includes('--orb-seal-columns-render');
const renderOrbSealRowsState = process.argv.includes('--orb-seal-rows-render');
const renderFixedStartState = process.argv.includes('--fixed-start-render');
const renderRandomBombsState = process.argv.includes('--random-bombs-render');
const renderFixedBombsState = process.argv.includes('--fixed-bombs-render');
const renderCloudState = process.argv.includes('--cloud-render');
const renderRecoveryDebuffState = process.argv.includes('--recovery-debuff-render');
const renderTurnChangeState = process.argv.includes('--turn-change-render');
const renderAttributeBlockState = process.argv.includes('--attribute-block-render');
const renderAttackOrbChangeState = process.argv.includes('--attack-orb-change-render');
const renderRandomSpinnersState = process.argv.includes('--random-spinners-render');
const renderFixedSpinnersState = process.argv.includes('--fixed-spinners-render');
const renderMaxHpChangeState = process.argv.includes('--max-hp-change-render');
const renderFixedTargetState = process.argv.includes('--fixed-target-render');
const renderComboBranchState = process.argv.includes('--combo-branch-render');
const renderAttackAttributeBranchState = process.argv.includes('--attack-attribute-branch-render');
const renderSkillUseBranchState = process.argv.includes('--skill-use-branch-render');
const renderDamageBranchState = process.argv.includes('--damage-branch-render');
const renderErasedAttributeBranchState = process.argv.includes('--erased-attribute-branch-render');
const renderTypeResistState = process.argv.includes('--type-resist-render');
const renderDamageImmunityState = process.argv.includes('--damage-immunity-render');
const renderRemainingEnemiesBranchState = process.argv.includes('--remaining-enemies-branch-render');
const renderAttributeResistState = process.argv.includes('--attribute-resist-render');
const renderResolveState = process.argv.includes('--resolve-render');
const renderDamageShieldState = process.argv.includes('--damage-shield-render');
const renderLeaderSwapState = process.argv.includes('--leader-swap-render');
const renderNormalAttackState = process.argv.includes('--normal-attack-render');
const renderMultiAttackState = process.argv.includes('--multi-attack-render');
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
const renderRepeatAttackState = process.argv.includes('--repeat-attack-render');
const renderInactivityState = process.argv.includes('--inactivity-render');
const renderEntireBlindState = process.argv.includes('--entire-blind-render');
const renderBindAttackState = process.argv.includes('--bind-attack-render');
const renderRandomSubBindState = process.argv.includes('--random-sub-bind-render');
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
  const comboAbsorbRenderState = renderComboAbsorbState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_046, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_046, true);
    view.setInt16(0x04, 67, true);
    view.setInt32(0x10, 2, true);
    view.setInt32(0x14, 4, true);
    view.setInt32(0x18, 3, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    return engine.snapshot();
  }) : null;
  if (comboAbsorbRenderState && (
    comboAbsorbRenderState.lastEnemyActions?.[0]?.skill?.type !== 67
    || comboAbsorbRenderState.enemies?.[0]?.comboAbsorbTurns !== 4
    || comboAbsorbRenderState.enemies?.[0]?.comboAbsorbThreshold !== 3
    || comboAbsorbRenderState.player?.hp !== 12_000
    || comboAbsorbRenderState.rngState !== 3_803_934_822
  )) throw new Error(`Combo-absorb render-state mismatch: ${JSON.stringify(comboAbsorbRenderState)}`);
  if (comboAbsorbRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const skyfallRateRenderState = renderSkyfallRateState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_047, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_047, true);
    view.setInt16(0x04, 68, true);
    view.setUint32(0x10, 0x81, true);
    view.setInt32(0x14, 2, true);
    view.setInt32(0x18, 4, true);
    view.setInt32(0x1c, 25, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    return engine.snapshot();
  }) : null;
  if (skyfallRateRenderState && (
    skyfallRateRenderState.lastEnemyActions?.[0]?.skill?.type !== 68
    || skyfallRateRenderState.skyfallRateRules?.natural?.typeMask !== 0x01
    || skyfallRateRenderState.skyfallRateRules?.natural?.turnsRemaining !== 4
    || skyfallRateRenderState.skyfallRateRules?.hazard?.typeMask !== 0x80
    || skyfallRateRenderState.skyfallRateRules?.hazard?.turnsRemaining !== 4
    || skyfallRateRenderState.dropRates?.[0] !== 0.25
    || skyfallRateRenderState.dropRates?.[7] !== 0.25
    || skyfallRateRenderState.rngState !== 3_803_934_822
  )) throw new Error(`Skyfall-rate render-state mismatch: ${JSON.stringify(skyfallRateRenderState)}`);
  if (skyfallRateRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const deathCryRenderState = renderDeathCryState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_048, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_048, true);
    view.setInt16(0x04, 69, true);
    view.setInt32(0x10, 41, true);
    view.setInt32(0x14, 7, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.enemies[0].hp = 0;
    engine.phase = 'attack';
    const rngBefore = engine.rng.state;
    engine.advancePhase();
    return { ...engine.snapshot(), rngBefore };
  }) : null;
  if (deathCryRenderState && (
    deathCryRenderState.phase !== 'death'
    || deathCryRenderState.enemies?.[0]?.deathResolved !== true
    || deathCryRenderState.lastEnemyDeathAction?.enemy !== 0
    || deathCryRenderState.lastEnemyDeathAction?.skillId !== 9_048
    || deathCryRenderState.lastEnemyDeathAction?.skill?.type !== 69
    || deathCryRenderState.lastEnemyDeathAction?.skill?.messageCode !== 41
    || deathCryRenderState.rngState !== deathCryRenderState.rngBefore
  )) throw new Error(`Death-cry render-state mismatch: ${JSON.stringify(deathCryRenderState)}`);
  if (deathCryRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const damageVoidRenderState = renderDamageVoidState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_050, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_050, true);
    view.setInt16(0x04, 71, true);
    view.setInt32(0x14, 3, true);
    view.setInt32(0x18, 1_055, true);
    view.setInt32(0x1c, 1, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    engine.enemies[1].hp = 0;
    engine.comboCount = 1;
    engine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
    engine.resolvePlayerTurn();
    return engine.snapshot();
  }) : null;
  if (damageVoidRenderState && (
    damageVoidRenderState.lastEnemyActions?.[0]?.skill?.type !== 71
    || damageVoidRenderState.enemies?.[0]?.damageVoidTurns !== 3
    || damageVoidRenderState.enemies?.[0]?.damageVoidThreshold !== 1
    || damageVoidRenderState.enemies?.[0]?.hp !== damageVoidRenderState.enemies?.[0]?.maxHp
    || damageVoidRenderState.lastDamage !== 0
    || !(damageVoidRenderState.lastVoidedDamage > 0)
    || damageVoidRenderState.enemies?.[0]?.damagedTurnCount !== 0
    || damageVoidRenderState.rngState !== 394_448_415
  )) throw new Error(`Damage-void render-state mismatch: ${JSON.stringify(damageVoidRenderState)}`);
  if (damageVoidRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const damageAbsorbRenderState = renderDamageAbsorbState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_068, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_068, true);
    view.setInt16(0x04, 87, true);
    view.setInt32(0x10, 3, true);
    view.setInt32(0x14, 1_660, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.enemies[0].hp = 50_000;
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.setRngState(21_900);
    engine.resolveEnemyTurn();
    engine.enemies[1].hp = 0;
    engine.party.forEach((member, index) => { member.bindTurns = index === 0 ? 0 : 1; });
    engine.comboCount = 1;
    engine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
    engine.resolvePlayerTurn();
    return engine.snapshot();
  }) : null;
  if (damageAbsorbRenderState && (
    damageAbsorbRenderState.lastEnemyActions?.[0]?.skill?.type !== 87
    || damageAbsorbRenderState.enemies?.[0]?.damageAbsorbTurns !== 3
    || damageAbsorbRenderState.enemies?.[0]?.damageAbsorbThreshold !== 1_660
    || damageAbsorbRenderState.enemies?.[0]?.hp !== 51_660
    || damageAbsorbRenderState.lastDamage !== 0
    || damageAbsorbRenderState.lastAbsorbedDamage !== 1_660
    || damageAbsorbRenderState.enemies?.[0]?.damagedTurnCount !== 0
    || damageAbsorbRenderState.rngState !== 394_448_415
  )) throw new Error(`Damage-absorb render-state mismatch: ${JSON.stringify(damageAbsorbRenderState)}`);
  if (damageAbsorbRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const awakeningBindRenderState = renderAwakeningBindState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_069, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_069, true);
    view.setInt16(0x04, 88, true);
    view.setInt32(0x10, 4, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.setRngState(21_900);
    engine.resolveEnemyTurn();
    return engine.snapshot();
  }) : null;
  if (awakeningBindRenderState && (
    awakeningBindRenderState.lastEnemyActions?.[0]?.skill?.type !== 88
    || awakeningBindRenderState.awakeningBindTurns !== 3
    || awakeningBindRenderState.player?.hp !== 12_000
    || awakeningBindRenderState.rngState !== 394_448_415
  )) throw new Error(`Awakening-bind render-state mismatch: ${JSON.stringify(awakeningBindRenderState)}`);
  if (awakeningBindRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const skillDelayRenderState = renderSkillDelayState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_070, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_070, true);
    view.setInt16(0x04, 89, true);
    view.setInt32(0x10, 2, true);
    view.setInt32(0x14, 4, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.setRngState(21_900);
    engine.resolveEnemyTurn();
    return engine.snapshot();
  }) : null;
  if (skillDelayRenderState && (
    skillDelayRenderState.lastEnemyActions?.[0]?.skill?.type !== 89
    || skillDelayRenderState.lastEnemyActions?.[0]?.skill?.targetMask !== 1
    || skillDelayRenderState.lastEnemyActions?.[0]?.skill?.skillDelays?.join('/') !== '4/0/0/0/0/0'
    || skillDelayRenderState.skill?.cooldown !== 4
    || skillDelayRenderState.player?.hp !== 12_000
    || skillDelayRenderState.rngState !== 3_803_934_822
  )) throw new Error(`Skill-delay render-state mismatch: ${JSON.stringify(skillDelayRenderState)}`);
  if (skillDelayRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const presenceCheckRenderState = renderPresenceCheckState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_071, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_071, true);
    view.setInt16(0x04, 90, true);
    view.setInt32(0x10, 1_234, true);
    view.setInt32(0x14, 5_678, true);
    view.setInt32(0x18, 9_012, true);
    view.setInt32(0x1c, 0, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.setRngState(21_900);
    engine.resolveEnemyTurn();
    return engine.snapshot();
  }) : null;
  if (presenceCheckRenderState && (
    presenceCheckRenderState.lastEnemyActions?.[0]?.skill?.type !== 90
    || presenceCheckRenderState.lastEnemyActions?.[0]?.skill?.candidateCardIds?.join('/') !== '1234/5678/9012'
    || presenceCheckRenderState.lastEnemyActions?.[0]?.damage !== undefined
    || presenceCheckRenderState.player?.hp !== 12_000
    || presenceCheckRenderState.rngState !== 394_448_415
    || presenceCheckRenderState.message !== 'Verdant Shell checks the party and takes no action.'
  )) throw new Error(`Presence-check render-state mismatch: ${JSON.stringify(presenceCheckRenderState)}`);
  if (presenceCheckRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const maskedRandomOrbChangeRenderState = renderMaskedRandomOrbChangeState
    ? await page.evaluate(() => {
      const engine = window.__puzzleGame;
      const monsterDefinition = new Uint8Array(0x2ec);
      const monsterView = new DataView(monsterDefinition.buffer);
      monsterView.setUint8(0xe0, 1);
      monsterView.setInt16(0xe2, 100, true);
      monsterView.setInt16(0xe4, 10, true);
      monsterView.setUint32(0xec, 9_072, true);
      monsterView.setUint8(0xf0, 100);
      const definition = new Uint8Array(0x48);
      const view = new DataView(definition.buffer);
      view.setUint32(0x00, 9_072, true);
      view.setInt16(0x04, 92, true);
      view.setInt32(0x10, 2, true);
      view.setUint32(0x14, 0xc0, true);
      view.setUint32(0x18, 0x1a0, true);
      view.setInt32(0x30, 10_000, true);
      view.setInt32(0x34, 1_000, true);
      view.setInt32(0x38, 100, true);
      view.setInt32(0x40, 20, true);
      view.setInt32(0x44, 0, true);
      engine.reset();
      engine.start();
      engine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
      engine.setEnemySkillQueue(0, []);
      engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
      engine.enemies[0].counter = 1;
      engine.enemies[1].counter = 99;
      engine.setRngState(21_900);
      engine.resolveEnemyTurn();
      return {
        ...engine.snapshot(),
        changedOrbCount: engine.lastEnemySkill?.changedOrbCount,
      };
    }) : null;
  if (maskedRandomOrbChangeRenderState && (
    maskedRandomOrbChangeRenderState.lastEnemyActions?.[0]?.skill?.type !== 92
    || maskedRandomOrbChangeRenderState.lastEnemyActions?.[0]?.skill?.selectionSeed !== 58_043
    || maskedRandomOrbChangeRenderState.changedOrbCount !== 4
    || maskedRandomOrbChangeRenderState.board?.[4] !== 'HPPGLJ'
    || maskedRandomOrbChangeRenderState.player?.hp !== 12_000
    || maskedRandomOrbChangeRenderState.rngState !== 3_803_934_822
    || maskedRandomOrbChangeRenderState.message !== '4 random orbs changed.'
  )) throw new Error(`Masked-random-orb-change render-state mismatch: ${JSON.stringify(maskedRandomOrbChangeRenderState)}`);
  if (maskedRandomOrbChangeRenderState) {
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  const nativeNoEffectRenderState = renderNativeNoEffectState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_073, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_073, true);
    view.setInt16(0x04, 93, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    const boardBefore = engine.snapshot().board;
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.setRngState(21_900);
    engine.resolveEnemyTurn();
    return { ...engine.snapshot(), boardBefore };
  }) : null;
  if (nativeNoEffectRenderState && (
    nativeNoEffectRenderState.lastEnemyActions?.[0]?.skill?.type !== 93
    || nativeNoEffectRenderState.lastEnemyActions?.[0]?.damage !== undefined
    || nativeNoEffectRenderState.player?.hp !== 12_000
    || nativeNoEffectRenderState.rngState !== 394_448_415
    || nativeNoEffectRenderState.board?.join('/') !== nativeNoEffectRenderState.boardBefore?.join('/')
    || nativeNoEffectRenderState.message !== 'Verdant Shell takes no special action.'
  )) throw new Error(`Native-no-effect render-state mismatch: ${JSON.stringify(nativeNoEffectRenderState)}`);
  if (nativeNoEffectRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const lockRandomOrbsRenderState = renderLockRandomOrbsState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_074, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_074, true);
    view.setInt16(0x04, 94, true);
    view.setUint32(0x10, 0b11, true);
    view.setInt32(0x14, 4, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    engine.setOrbState(0, 1, { locked: true });
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.setRngState(21_900);
    engine.resolveEnemyTurn();
    return engine.snapshot();
  }) : null;
  if (lockRandomOrbsRenderState && (
    lockRandomOrbsRenderState.lastEnemyActions?.[0]?.skill?.type !== 94
    || lockRandomOrbsRenderState.lastEnemyActions?.[0]?.skill?.selectionSeed !== 58_043
    || lockRandomOrbsRenderState.lastEnemySkill?.lockedOrbCount !== 3
    || lockRandomOrbsRenderState.boardState?.[0]?.slice(0, 4).some((orb) => !orb.locked)
    || lockRandomOrbsRenderState.player?.hp !== 12_000
    || lockRandomOrbsRenderState.rngState !== 3_803_934_822
    || lockRandomOrbsRenderState.message !== '3 orbs locked.'
  )) throw new Error(`Lock-random-orbs render-state mismatch: ${JSON.stringify(lockRandomOrbsRenderState)}`);
  if (lockRandomOrbsRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const enemyEscapeRenderState = renderEnemyEscapeState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_075, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_075, true);
    view.setInt16(0x04, 95, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.setRngState(21_900);
    engine.resolveEnemyTurn();
    return engine.snapshot();
  }) : null;
  if (enemyEscapeRenderState && (
    enemyEscapeRenderState.lastEnemyActions?.[0]?.skill?.type !== 95
    || enemyEscapeRenderState.enemies?.[0]?.hp !== 0
    || enemyEscapeRenderState.enemies?.[0]?.escaped !== true
    || enemyEscapeRenderState.enemies?.[0]?.deathResolved !== true
    || enemyEscapeRenderState.enemies?.[1]?.hp !== 76_000
    || enemyEscapeRenderState.player?.hp !== 12_000
    || enemyEscapeRenderState.rngState !== 394_448_415
    || enemyEscapeRenderState.message !== 'Verdant Shell escaped.'
  )) throw new Error(`Enemy-escape render-state mismatch: ${JSON.stringify(enemyEscapeRenderState)}`);
  if (enemyEscapeRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const lockedSkyfallRenderState = renderLockedSkyfallState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_076, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_076, true);
    view.setInt16(0x04, 96, true);
    view.setUint32(0x10, 1, true);
    view.setInt32(0x14, 2, true);
    view.setInt32(0x18, 4, true);
    view.setInt32(0x1c, 100, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.setRngState(21_900);
    engine.resolveEnemyTurn();
    return engine.snapshot();
  }) : null;
  if (lockedSkyfallRenderState && (
    lockedSkyfallRenderState.lastEnemyActions?.[0]?.skill?.type !== 96
    || lockedSkyfallRenderState.lastEnemyActions?.[0]?.skill?.durationTurns !== 4
    || lockedSkyfallRenderState.lockFallRules?.[0]?.typeMask !== 1
    || lockedSkyfallRenderState.lockFallRules?.[0]?.chancePercent !== 100
    || lockedSkyfallRenderState.lockFallRules?.[0]?.turnsRemaining !== 4
    || lockedSkyfallRenderState.player?.hp !== 12_000
    || lockedSkyfallRenderState.rngState !== 3_803_934_822
    || lockedSkyfallRenderState.message !== 'Selected orbs may fall locked for 4 turns.'
  )) throw new Error(`Locked-skyfall render-state mismatch: ${JSON.stringify(lockedSkyfallRenderState)}`);
  if (lockedSkyfallRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const stickyBlindRandomRenderState = renderStickyBlindRandomState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_077, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_077, true);
    view.setInt16(0x04, 97, true);
    view.setInt32(0x10, 3, true);
    view.setInt32(0x14, 2, true);
    view.setInt32(0x18, 4, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.setRngState(21_900);
    engine.resolveEnemyTurn();
    return engine.snapshot();
  }) : null;
  if (stickyBlindRandomRenderState && (
    stickyBlindRandomRenderState.lastEnemyActions?.[0]?.skill?.type !== 97
    || stickyBlindRandomRenderState.lastEnemyActions?.[0]?.skill?.blindCount !== 4
    || stickyBlindRandomRenderState.lastEnemyActions?.[0]?.skill?.selectionSeed !== 29_441
    || stickyBlindRandomRenderState.lastEnemySkill?.blindedOrbCount !== 4
    || stickyBlindRandomRenderState.boardState?.flat().filter((orb) => orb.blind).length !== 4
    || stickyBlindRandomRenderState.player?.hp !== 12_000
    || stickyBlindRandomRenderState.rngState !== 1_929_471_377
    || stickyBlindRandomRenderState.message !== '4 orbs were obscured.'
  )) throw new Error(`Sticky-blind-random render-state mismatch: ${JSON.stringify(stickyBlindRandomRenderState)}`);
  if (stickyBlindRandomRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const stickyBlindFixedRenderState = renderStickyBlindFixedState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
    engine.setRngState(21_900);
    const applied = engine.applyEnemySkillRecord({
      type: 98,
      kind: 'stickyBlindFixed',
      supported: true,
      durationTurns: 2,
      rowMasks: [1, 2, 4, 8, 48],
      attackWithSkillValue: 0,
    }, 0);
    return { applied, snapshot: engine.snapshot() };
  }) : null;
  if (stickyBlindFixedRenderState && (
    stickyBlindFixedRenderState.applied !== true
    || stickyBlindFixedRenderState.snapshot?.lastEnemySkill?.type !== 98
    || stickyBlindFixedRenderState.snapshot?.lastEnemySkill?.blindedOrbCount !== 6
    || stickyBlindFixedRenderState.snapshot?.boardState?.flat().filter((orb) => orb.blind).length !== 6
    || stickyBlindFixedRenderState.snapshot?.rngState !== 21_900
    || stickyBlindFixedRenderState.snapshot?.message !== '6 orbs were obscured.'
  )) throw new Error(`Sticky-blind-fixed render-state mismatch: ${JSON.stringify(stickyBlindFixedRenderState)}`);
  if (stickyBlindFixedRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const orbSealColumnsRenderState = renderOrbSealColumnsState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.setBoardFromCodes(['RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
    engine.setRngState(21_900);
    const applied = engine.applyEnemySkillRecord({
      type: 99,
      kind: 'orbSealColumns',
      supported: true,
      positionMask: 0b001010,
      durationTurns: 3,
      attackWithSkillValue: 0,
    }, 0);
    const blockedStart = engine.startDrag(0, 1, 105, 447, 1.5, 0.5);
    const allowedStart = engine.startDrag(0, 0, 35, 447, 0.5, 0.5);
    const blockedCrossing = engine.moveDrag(0, 2, 175, 447, 2.5, 0.5);
    return {
      applied,
      blockedStart,
      allowedStart,
      blockedCrossing,
      snapshot: engine.snapshot(),
    };
  }) : null;
  if (orbSealColumnsRenderState && (
    orbSealColumnsRenderState.applied !== true
    || orbSealColumnsRenderState.blockedStart !== false
    || orbSealColumnsRenderState.allowedStart !== true
    || orbSealColumnsRenderState.blockedCrossing !== false
    || orbSealColumnsRenderState.snapshot?.orbSealColumns?.positionMask !== 0b001010
    || orbSealColumnsRenderState.snapshot?.orbSealColumns?.turnsRemaining !== 3
    || orbSealColumnsRenderState.snapshot?.drag?.column !== 0
    || orbSealColumnsRenderState.snapshot?.drag?.pathLength !== 0
    || orbSealColumnsRenderState.snapshot?.rngState !== 21_900
  )) throw new Error(`Orb-seal-columns render-state mismatch: ${JSON.stringify(orbSealColumnsRenderState)}`);
  if (orbSealColumnsRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const orbSealRowsRenderState = renderOrbSealRowsState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.setBoardFromCodes(['RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
    engine.setRngState(21_900);
    const applied = engine.applyEnemySkillRecord({
      type: 100,
      kind: 'orbSealRows',
      supported: true,
      positionMask: 0b01010,
      durationTurns: 2,
      attackWithSkillValue: 0,
    }, 0);
    const blockedStart = engine.startDrag(1, 0, 35, 517, 0.5, 1.5);
    const allowedStart = engine.startDrag(0, 0, 35, 447, 0.5, 0.5);
    const blockedCrossing = engine.moveDrag(2, 0, 35, 587, 0.5, 2.5);
    return {
      applied,
      blockedStart,
      allowedStart,
      blockedCrossing,
      snapshot: engine.snapshot(),
    };
  }) : null;
  if (orbSealRowsRenderState && (
    orbSealRowsRenderState.applied !== true
    || orbSealRowsRenderState.blockedStart !== false
    || orbSealRowsRenderState.allowedStart !== true
    || orbSealRowsRenderState.blockedCrossing !== false
    || orbSealRowsRenderState.snapshot?.orbSealRows?.positionMask !== 0b01010
    || orbSealRowsRenderState.snapshot?.orbSealRows?.turnsRemaining !== 2
    || orbSealRowsRenderState.snapshot?.drag?.row !== 0
    || orbSealRowsRenderState.snapshot?.drag?.pathLength !== 0
    || orbSealRowsRenderState.snapshot?.rngState !== 21_900
  )) throw new Error(`Orb-seal-rows render-state mismatch: ${JSON.stringify(orbSealRowsRenderState)}`);
  if (orbSealRowsRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const fixedStartRenderState = renderFixedStartState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.setBoardFromCodes(['RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
    engine.setRngState(21_900);
    const applied = engine.applyEnemySkillRecord({
      type: 101,
      kind: 'fixedStart',
      supported: true,
      randomPosition: true,
      authoredColumn: 0,
      authoredRowFromBottom: 0,
      attackWithSkillValue: 0,
    }, 0);
    const blockedStart = engine.startDrag(0, 0, 35, 447, 0.5, 0.5);
    const allowedStart = engine.startDrag(4, 0, 35, 727, 0.5, 4.5);
    return { applied, blockedStart, allowedStart, snapshot: engine.snapshot() };
  }) : null;
  if (fixedStartRenderState && (
    fixedStartRenderState.applied !== true
    || fixedStartRenderState.blockedStart !== false
    || fixedStartRenderState.allowedStart !== true
    || fixedStartRenderState.snapshot?.forcedStart?.row !== 4
    || fixedStartRenderState.snapshot?.forcedStart?.column !== 0
    || fixedStartRenderState.snapshot?.drag?.row !== 4
    || fixedStartRenderState.snapshot?.drag?.column !== 0
    || fixedStartRenderState.snapshot?.rngState !== 3_803_934_822
  )) throw new Error(`Fixed-start render-state mismatch: ${JSON.stringify(fixedStartRenderState)}`);
  if (fixedStartRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const randomBombsRenderState = renderRandomBombsState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.setBoardFromCodes(['RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
    engine.setOrbState(3, 4, { locked: true });
    const preservedCode = engine.snapshot().boardState[3][4].code;
    engine.setRngState(21_900);
    const applied = engine.applyEnemySkillRecord({
      type: 102,
      kind: 'randomBombs',
      supported: true,
      bombCount: 4,
      lockedBombs: true,
      attackWithSkillValue: 0,
    }, 0);
    const snapshot = engine.snapshot();
    const bombs = snapshot.boardState.flatMap((row, rowIndex) => row.flatMap(
      (orb, columnIndex) => orb.code === 'X'
        ? [{ row: rowIndex, column: columnIndex, locked: orb.locked, flags: orb.blockFlags }]
        : [],
    ));
    return {
      applied,
      preservedCode,
      preservedLockedCell: snapshot.boardState[3][4],
      changedOrbCount: engine.lastEnemySkill?.changedOrbCount,
      selectionSeed: engine.lastEnemySkill?.selectionSeed,
      bombs,
      snapshot,
    };
  }) : null;
  if (randomBombsRenderState && (
    randomBombsRenderState.applied !== true
    || randomBombsRenderState.selectionSeed !== 6_018
    || randomBombsRenderState.changedOrbCount !== 3
    || randomBombsRenderState.snapshot?.rngState !== 394_448_415
    || randomBombsRenderState.snapshot?.message !== '3 locked bombs appeared.'
    || randomBombsRenderState.preservedLockedCell?.code !== randomBombsRenderState.preservedCode
    || randomBombsRenderState.bombs?.map(({ row, column }) => `${row},${column}`).join('/')
      !== '0,5/2,3/4,2'
    || !randomBombsRenderState.bombs?.every((orb) => orb.locked && (orb.flags & 0x800) !== 0)
  )) throw new Error(`Random-bombs render-state mismatch: ${JSON.stringify(randomBombsRenderState)}`);
  if (randomBombsRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const fixedBombsRenderState = renderFixedBombsState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.setBoardFromCodes(['RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
    engine.setOrbState(2, 2, { locked: true });
    const preservedCode = engine.snapshot().boardState[2][2].code;
    engine.setRngState(21_900);
    const applied = engine.applyEnemySkillRecord({
      type: 103,
      kind: 'fixedBombs',
      supported: true,
      rowMasks: [0b110000, 0b001000, 0b000100, 0b000010, 0b000001],
      lockedBombs: true,
      attackWithSkillValue: 0,
    }, 0);
    const snapshot = engine.snapshot();
    const bombs = snapshot.boardState.flatMap((row, rowIndex) => row.flatMap(
      (orb, columnIndex) => orb.code === 'X'
        ? [{ row: rowIndex, column: columnIndex, locked: orb.locked, flags: orb.blockFlags }]
        : [],
    ));
    return {
      applied,
      preservedCode,
      preservedLockedCell: snapshot.boardState[2][2],
      changedOrbCount: engine.lastEnemySkill?.changedOrbCount,
      bombs,
      snapshot,
    };
  }) : null;
  if (fixedBombsRenderState && (
    fixedBombsRenderState.applied !== true
    || fixedBombsRenderState.changedOrbCount !== 5
    || fixedBombsRenderState.snapshot?.rngState !== 21_900
    || fixedBombsRenderState.snapshot?.message !== '5 locked bombs appeared.'
    || fixedBombsRenderState.preservedLockedCell?.code !== fixedBombsRenderState.preservedCode
    || fixedBombsRenderState.bombs?.map(({ row, column }) => `${row},${column}`).join('/')
      !== '0,4/0,5/1,3/3,1/4,0'
    || !fixedBombsRenderState.bombs?.every((orb) => orb.locked && (orb.flags & 0x800) !== 0)
  )) throw new Error(`Fixed-bombs render-state mismatch: ${JSON.stringify(fixedBombsRenderState)}`);
  if (fixedBombsRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const cloudRenderState = renderCloudState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.setBoardFromCodes(['RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
    engine.setRngState(21_900);
    const applied = engine.applyEnemySkillRecord({
      type: 104,
      kind: 'cloud',
      supported: true,
      durationTurns: 3,
      cloudHeightRows: 2,
      cloudWidthColumns: 3,
      authoredOriginY: 0,
      authoredOriginX: 0,
      attackWithSkillValue: 0,
    }, 0);
    const cloudMessage = engine.message;
    const dragStartedUnderCloud = engine.startDrag(0, 0, 35, 447, 0.5, 0.5);
    engine.drag = null;
    return { applied, cloudMessage, dragStartedUnderCloud, snapshot: engine.snapshot() };
  }) : null;
  if (cloudRenderState && (
    cloudRenderState.applied !== true
    || cloudRenderState.dragStartedUnderCloud !== true
    || cloudRenderState.snapshot?.cloud?.row !== 0
    || cloudRenderState.snapshot?.cloud?.column !== 0
    || cloudRenderState.snapshot?.cloud?.heightRows !== 2
    || cloudRenderState.snapshot?.cloud?.widthColumns !== 3
    || cloudRenderState.snapshot?.cloud?.turnsRemaining !== 3
    || cloudRenderState.snapshot?.rngState !== 3_803_934_822
    || cloudRenderState.cloudMessage !== 'Clouds obscured a 3 × 2 area for 3 turns.'
  )) throw new Error(`Cloud render-state mismatch: ${JSON.stringify(cloudRenderState)}`);
  if (cloudRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const recoveryDebuffRenderState = renderRecoveryDebuffState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.setRngState(21_900);
    engine.player.hp = 1_000;
    engine.enemies[1].hp = 0;
    const applied = engine.applyEnemySkillRecord({
      type: 105,
      kind: 'recoveryDebuff',
      supported: true,
      durationTurns: 3,
      recoveryPercent: 50,
      attackWithSkillValue: 0,
    }, 0);
    engine.comboCount = 1;
    engine.turnMatches = [{ type: 'heart', size: 3, enhancedCount: 0 }];
    engine.resolvePlayerTurn();
    return { applied, snapshot: engine.snapshot() };
  }) : null;
  if (recoveryDebuffRenderState && (
    recoveryDebuffRenderState.applied !== true
    || recoveryDebuffRenderState.snapshot?.recoveryDebuff?.turnsRemaining !== 3
    || recoveryDebuffRenderState.snapshot?.recoveryDebuff?.recoveryPercent !== 50
    || recoveryDebuffRenderState.snapshot?.recoveryDebuff?.multiplier !== 0.5
    || recoveryDebuffRenderState.snapshot?.lastHealing !== 410
    || recoveryDebuffRenderState.snapshot?.player?.hp !== 1_410
    || recoveryDebuffRenderState.snapshot?.rngState !== 21_900
  )) throw new Error(`Recovery-debuff render-state mismatch: ${JSON.stringify(recoveryDebuffRenderState)}`);
  if (recoveryDebuffRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const turnChangeRenderState = renderTurnChangeState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_086, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_086, true);
    view.setInt16(0x04, 106, true);
    view.setInt32(0x10, 50, true);
    view.setInt32(0x14, 1, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    engine.enemies[0].hp = 48_000;
    engine.enemies[1].hp = 0;
    engine.party.forEach((member, index) => { member.bindTurns = index === 0 ? 0 : 1; });
    engine.comboCount = 1;
    engine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
    engine.resolvePlayerTurn();
    return engine.snapshot();
  }) : null;
  if (turnChangeRenderState && (
    turnChangeRenderState.lastDamage !== 1_660
    || turnChangeRenderState.enemies?.[0]?.hp !== 46_340
    || turnChangeRenderState.enemies?.[0]?.baseMaxCounter !== 2
    || turnChangeRenderState.enemies?.[0]?.maxCounter !== 1
    || turnChangeRenderState.enemies?.[0]?.counter !== 1
    || turnChangeRenderState.enemies?.[0]?.turnChangeThresholdPercent !== 50
    || turnChangeRenderState.enemies?.[0]?.turnChangeCounter !== 1
    || turnChangeRenderState.enemies?.[0]?.turnChangeActive !== true
    || turnChangeRenderState.rngState !== 21_900
  )) throw new Error(`Turn-change render-state mismatch: ${JSON.stringify(turnChangeRenderState)}`);
  if (turnChangeRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const attributeBlockRenderState = renderAttributeBlockState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.setBoardFromCodes([
      'RRRBGH',
      'BBBLDH',
      'GLDHBR',
      'LDHBRG',
      'DHBRGL',
    ]);
    engine.setRngState(21_900);
    const applied = engine.applyEnemySkillRecord({
      type: 107,
      kind: 'attributeBlock',
      supported: true,
      durationTurns: 3,
      typeMask: 0x11,
      attackWithSkillValue: 0,
    });
    const matches = engine.findMatches();
    return {
      applied,
      snapshot: engine.snapshot(),
      matchTypes: matches.map((match) => match.type),
    };
  }) : null;
  if (attributeBlockRenderState && (
    attributeBlockRenderState.applied !== true
    || attributeBlockRenderState.snapshot?.attributeBlock?.turnsRemaining !== 3
    || attributeBlockRenderState.snapshot?.attributeBlock?.typeMask !== 0x11
    || attributeBlockRenderState.snapshot?.lastEnemySkill?.type !== 107
    || attributeBlockRenderState.snapshot?.rngState !== 21_900
    || attributeBlockRenderState.matchTypes?.join('/') !== 'water'
  )) throw new Error(`Attribute-block render-state mismatch: ${JSON.stringify(attributeBlockRenderState)}`);
  if (attributeBlockRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const attackOrbChangeRenderState = renderAttackOrbChangeState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.setBoardFromCodes([
      'RRRBGH',
      'BGLDHR',
      'GLDHBR',
      'LDHBRG',
      'DHBRGL',
    ]);
    engine.setRngState(21_900);
    const applied = engine.applyEnemySkillRecord({
      type: 108,
      kind: 'attackOrbChange',
      supported: true,
      damagePercent: 150,
      sourceTypeMask: 0x01,
      destinationTypeMask: 0x02,
      attackWithSkillValue: 0,
    });
    return { applied, snapshot: engine.snapshot() };
  }) : null;
  if (attackOrbChangeRenderState && (
    attackOrbChangeRenderState.applied !== true
    || attackOrbChangeRenderState.snapshot?.board?.join('/') !== 'BBBBGH/BGLDHB/GLDHBB/LDHBBG/DHBBGL'
    || attackOrbChangeRenderState.snapshot?.lastEnemySkill?.type !== 108
    || attackOrbChangeRenderState.snapshot?.lastEnemySkill?.changedOrbCount !== 7
    || attackOrbChangeRenderState.snapshot?.rngState !== 891_458_469
  )) throw new Error(`Attack-orb-change render-state mismatch: ${JSON.stringify(attackOrbChangeRenderState)}`);
  if (attackOrbChangeRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const randomSpinnersRenderState = renderRandomSpinnersState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.setBoardFromCodes([
      'RRRBGH',
      'BGLDHR',
      'GLDHBR',
      'LDHBRG',
      'DHBRGL',
    ]);
    engine.setRngState(21_900);
    const applied = engine.applyEnemySkillRecord({
      type: 109,
      kind: 'randomSpinners',
      supported: true,
      durationTurns: 3,
      speedCentiseconds: 100,
      spinnerCount: 3,
      selectionSeed: 6_018,
      setupMaterialized: true,
      attackWithSkillValue: 0,
    });
    engine.updateSpinnerOrbs(1.01);
    return { applied, snapshot: engine.snapshot() };
  }) : null;
  if (randomSpinnersRenderState && (
    randomSpinnersRenderState.applied !== true
    || randomSpinnersRenderState.snapshot?.boardState?.flat()?.filter((orb) => orb.spinner).length !== 3
    || randomSpinnersRenderState.snapshot?.lastEnemySkill?.type !== 109
    || randomSpinnersRenderState.snapshot?.lastEnemySkill?.selectionSeed !== 6_018
    || randomSpinnersRenderState.snapshot?.board?.[4]?.[2] !== 'G'
    || randomSpinnersRenderState.snapshot?.board?.[3]?.[4] !== 'B'
    || randomSpinnersRenderState.snapshot?.board?.[2]?.[3] !== 'R'
  )) throw new Error(`Random-spinners render-state mismatch: ${JSON.stringify(randomSpinnersRenderState)}`);
  if (randomSpinnersRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const fixedSpinnersRenderState = renderFixedSpinnersState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.setBoardFromCodes([
      'RRRBGH',
      'BGLDHR',
      'GLDHBR',
      'LDHBRG',
      'DHBRGL',
    ]);
    engine.setRngState(21_900);
    const applied = engine.applyEnemySkillRecord({
      type: 110,
      kind: 'fixedSpinners',
      supported: true,
      durationTurns: 4,
      speedCentiseconds: 50,
      rowMasks: [0b010000, 0b001000, 0b000100, 0b000010, 0b000001],
      attackWithSkillValue: 0,
    });
    engine.updateSpinnerOrbs(0.51);
    return { applied, snapshot: engine.snapshot() };
  }) : null;
  if (fixedSpinnersRenderState && (
    fixedSpinnersRenderState.applied !== true
    || fixedSpinnersRenderState.snapshot?.boardState?.flat()?.filter((orb) => orb.spinner).length !== 5
    || fixedSpinnersRenderState.snapshot?.lastEnemySkill?.type !== 110
    || fixedSpinnersRenderState.snapshot?.lastEnemySkill?.spinnerCount !== 5
    || fixedSpinnersRenderState.snapshot?.board?.[0]?.[4] !== 'L'
    || fixedSpinnersRenderState.snapshot?.board?.[1]?.[3] !== 'H'
    || fixedSpinnersRenderState.snapshot?.board?.[4]?.[0] !== 'H'
    || fixedSpinnersRenderState.snapshot?.rngState !== 21_900
  )) throw new Error(`Fixed-spinners render-state mismatch: ${JSON.stringify(fixedSpinnersRenderState)}`);
  if (fixedSpinnersRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const maxHpChangeRenderState = renderMaxHpChangeState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.setRngState(21_900);
    const applied = engine.applyEnemySkillRecord({
      type: 111,
      kind: 'maxHpChange',
      supported: true,
      maxHpPercent: 50,
      fixedMaxHp: 0,
      durationTurns: 3,
      attackWithSkillValue: 0,
    });
    return { applied, snapshot: engine.snapshot() };
  }) : null;
  if (maxHpChangeRenderState && (
    maxHpChangeRenderState.applied !== true
    || maxHpChangeRenderState.snapshot?.lastEnemySkill?.type !== 111
    || maxHpChangeRenderState.snapshot?.lastEnemySkill?.maxHpParameter !== -50
    || maxHpChangeRenderState.snapshot?.player?.baseMaxHp !== 12_000
    || maxHpChangeRenderState.snapshot?.player?.maxHp !== 6_000
    || maxHpChangeRenderState.snapshot?.player?.hp !== 6_000
    || maxHpChangeRenderState.snapshot?.maxHpChange?.turnsRemaining !== 3
    || maxHpChangeRenderState.snapshot?.rngState !== 21_900
  )) throw new Error(`Max-HP-change render-state mismatch: ${JSON.stringify(maxHpChangeRenderState)}`);
  if (maxHpChangeRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const fixedTargetRenderState = renderFixedTargetState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    engine.setRngState(21_900);
    const applied = engine.applyEnemySkillRecord({
      type: 112,
      kind: 'fixedTarget',
      supported: true,
      durationTurns: 3,
      attackWithSkillValue: 0,
    }, 1);
    engine.selectEnemy(0);
    return { applied, chosenTarget: engine.chooseAttackTarget('fire', 1_000), snapshot: engine.snapshot() };
  }) : null;
  if (fixedTargetRenderState && (
    fixedTargetRenderState.applied !== true
    || fixedTargetRenderState.chosenTarget !== 1
    || fixedTargetRenderState.snapshot?.lastEnemySkill?.type !== 112
    || fixedTargetRenderState.snapshot?.fixedTarget?.turnsRemaining !== 3
    || fixedTargetRenderState.snapshot?.fixedTarget?.enemyIndex !== 1
    || fixedTargetRenderState.snapshot?.targetEnemy !== 1
    || fixedTargetRenderState.snapshot?.manualTarget !== false
    || fixedTargetRenderState.snapshot?.rngState !== 21_900
  )) throw new Error(`Fixed-target render-state mismatch: ${JSON.stringify(fixedTargetRenderState)}`);
  if (fixedTargetRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const comboBranchRenderState = renderComboBranchState ? await page.evaluate(() => {
    const makeDefinition = (skillId, type, parameter0 = 0, parameter1 = 0) => {
      const bytes = new Uint8Array(0x48);
      const view = new DataView(bytes.buffer);
      view.setUint32(0x00, skillId, true);
      view.setInt16(0x04, type, true);
      view.setInt32(0x10, parameter0, true);
      view.setInt32(0x14, parameter1, true);
      view.setInt32(0x44, 0, true);
      return bytes;
    };
    const run = (lastComboCount) => {
      const engine = window.__puzzleGame;
      engine.reset();
      engine.start();
      engine.setRngState(21_900);
      engine.enemies[0].counter = 1;
      engine.enemies[1].hp = 0;
      engine.setEnemySkillQueue(0, [
        { definition: makeDefinition(9_093, 113), enemyAi: 5, enemyRnd: 2 },
        makeDefinition(9_094, 82),
        makeDefinition(9_095, 47, 0, 150),
      ]);
      engine.lastComboCount = lastComboCount;
      engine.resolveEnemyTurn();
      return {
        lastComboCount,
        queuePosition: engine.enemySkillQueues[0].position,
        snapshot: engine.snapshot(),
      };
    };
    const below = run(4);
    const exact = run(5);
    return { below, exact };
  }) : null;
  if (comboBranchRenderState && (
    comboBranchRenderState.below?.snapshot?.lastEnemyActions?.[0]?.skill?.type !== 82
    || comboBranchRenderState.below?.snapshot?.player?.hp !== 10_150
    || comboBranchRenderState.below?.queuePosition !== 2
    || comboBranchRenderState.below?.snapshot?.rngState !== 21_900
    || comboBranchRenderState.exact?.snapshot?.lastEnemyActions?.[0]?.skill?.type !== 47
    || comboBranchRenderState.exact?.snapshot?.lastEnemyActions?.[0]?.damage !== 2_775
    || comboBranchRenderState.exact?.snapshot?.player?.hp !== 9_225
    || comboBranchRenderState.exact?.queuePosition !== 3
    || comboBranchRenderState.exact?.snapshot?.rngState !== 21_900
  )) throw new Error(`Combo-branch render-state mismatch: ${JSON.stringify(comboBranchRenderState)}`);
  if (comboBranchRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const attackAttributeBranchRenderState = renderAttackAttributeBranchState
    ? await page.evaluate(() => {
      const makeDefinition = (skillId, type, parameter0 = 0, parameter1 = 0) => {
        const bytes = new Uint8Array(0x48);
        const view = new DataView(bytes.buffer);
        view.setUint32(0x00, skillId, true);
        view.setInt16(0x04, type, true);
        view.setInt32(0x10, parameter0, true);
        view.setInt32(0x14, parameter1, true);
        view.setInt32(0x44, 0, true);
        return bytes;
      };
      const engine = window.__puzzleGame;
      engine.reset();
      engine.start();
      engine.comboCount = 2;
      engine.turnMatches = [
        { type: 'fire', size: 3, enhancedCount: 0 },
        { type: 'water', size: 3, enhancedCount: 0 },
      ];
      engine.resolvePlayerTurn();
      const trackedMask = engine.snapshot().lastAttackAttributeMask;
      const run = (lastAttackAttributeMask) => {
        engine.reset();
        engine.start();
        engine.setRngState(21_900);
        engine.enemies[0].counter = 1;
        engine.enemies[1].hp = 0;
        engine.setEnemySkillQueue(0, [
          { definition: makeDefinition(9_096, 114, 0, 0b00011), enemyAi: 0, enemyRnd: 2 },
          makeDefinition(9_097, 82),
          makeDefinition(9_098, 47, 0, 150),
        ]);
        engine.lastAttackAttributeMask = lastAttackAttributeMask;
        engine.resolveEnemyTurn();
        return {
          lastAttackAttributeMask,
          queuePosition: engine.enemySkillQueues[0].position,
          snapshot: engine.snapshot(),
        };
      };
      return { trackedMask, nonExact: run(0b00001), exact: run(0b00011) };
    }) : null;
  if (attackAttributeBranchRenderState && (
    attackAttributeBranchRenderState.trackedMask !== 0b00011
    || attackAttributeBranchRenderState.nonExact?.snapshot?.lastEnemyActions?.[0]?.skill?.type !== 82
    || attackAttributeBranchRenderState.nonExact?.snapshot?.player?.hp !== 10_150
    || attackAttributeBranchRenderState.nonExact?.queuePosition !== 2
    || attackAttributeBranchRenderState.nonExact?.snapshot?.rngState !== 21_900
    || attackAttributeBranchRenderState.exact?.snapshot?.lastEnemyActions?.[0]?.skill?.type !== 47
    || attackAttributeBranchRenderState.exact?.snapshot?.lastEnemyActions?.[0]?.damage !== 2_775
    || attackAttributeBranchRenderState.exact?.snapshot?.player?.hp !== 9_225
    || attackAttributeBranchRenderState.exact?.queuePosition !== 3
    || attackAttributeBranchRenderState.exact?.snapshot?.rngState !== 21_900
  )) throw new Error(
    `Attack-attribute-branch render-state mismatch: ${JSON.stringify(attackAttributeBranchRenderState)}`,
  );
  if (attackAttributeBranchRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const skillUseBranchRenderState = renderSkillUseBranchState ? await page.evaluate(() => {
    const makeDefinition = (skillId, type, parameter0 = 0, parameter1 = 0) => {
      const bytes = new Uint8Array(0x48);
      const view = new DataView(bytes.buffer);
      view.setUint32(0x00, skillId, true);
      view.setInt16(0x04, type, true);
      view.setInt32(0x10, parameter0, true);
      view.setInt32(0x14, parameter1, true);
      view.setInt32(0x44, 0, true);
      return bytes;
    };
    const engine = window.__puzzleGame;
    engine.reset();
    engine.start();
    const skillApplied = engine.useSkill();
    const duringPlayerTurn = engine.snapshot().currentTurnSkillUseCount;
    engine.resolvePlayerTurn();
    const trackedCount = engine.snapshot().lastSkillUseCount;
    const currentAfterResolution = engine.snapshot().currentTurnSkillUseCount;
    const run = (lastSkillUseCount) => {
      engine.reset();
      engine.start();
      engine.setRngState(21_900);
      engine.enemies[0].counter = 1;
      engine.enemies[1].hp = 0;
      engine.setEnemySkillQueue(0, [
        { definition: makeDefinition(9_099, 115), enemyAi: 1, enemyRnd: 2 },
        makeDefinition(9_100, 82),
        makeDefinition(9_101, 47, 0, 150),
      ]);
      engine.lastSkillUseCount = lastSkillUseCount;
      engine.resolveEnemyTurn();
      return {
        lastSkillUseCount,
        queuePosition: engine.enemySkillQueues[0].position,
        snapshot: engine.snapshot(),
      };
    };
    return {
      skillApplied,
      duringPlayerTurn,
      trackedCount,
      currentAfterResolution,
      below: run(0),
      exact: run(1),
    };
  }) : null;
  if (skillUseBranchRenderState && (
    skillUseBranchRenderState.skillApplied !== true
    || skillUseBranchRenderState.duringPlayerTurn !== 1
    || skillUseBranchRenderState.trackedCount !== 1
    || skillUseBranchRenderState.currentAfterResolution !== 0
    || skillUseBranchRenderState.below?.snapshot?.lastEnemyActions?.[0]?.skill?.type !== 82
    || skillUseBranchRenderState.below?.snapshot?.player?.hp !== 10_150
    || skillUseBranchRenderState.below?.queuePosition !== 2
    || skillUseBranchRenderState.below?.snapshot?.rngState !== 21_900
    || skillUseBranchRenderState.exact?.snapshot?.lastEnemyActions?.[0]?.skill?.type !== 47
    || skillUseBranchRenderState.exact?.snapshot?.lastEnemyActions?.[0]?.damage !== 2_775
    || skillUseBranchRenderState.exact?.snapshot?.player?.hp !== 9_225
    || skillUseBranchRenderState.exact?.queuePosition !== 3
    || skillUseBranchRenderState.exact?.snapshot?.rngState !== 21_900
  )) throw new Error(`Skill-use-branch render-state mismatch: ${JSON.stringify(skillUseBranchRenderState)}`);
  if (skillUseBranchRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const damageBranchRenderState = renderDamageBranchState ? await page.evaluate(() => {
    const makeDefinition = (skillId, type, parameter0 = 0, parameter1 = 0) => {
      const bytes = new Uint8Array(0x48);
      const view = new DataView(bytes.buffer);
      view.setUint32(0x00, skillId, true);
      view.setInt16(0x04, type, true);
      view.setInt32(0x10, parameter0, true);
      view.setInt32(0x14, parameter1, true);
      view.setInt32(0x44, 0, true);
      return bytes;
    };
    const run = (lastDamage) => {
      const engine = window.__puzzleGame;
      engine.reset();
      engine.start();
      engine.setRngState(21_900);
      engine.enemies[0].counter = 1;
      engine.enemies[1].hp = 0;
      engine.setEnemySkillQueue(0, [
        { definition: makeDefinition(9_102, 116, 0, 1_660), enemyAi: 0, enemyRnd: 2 },
        makeDefinition(9_103, 82),
        makeDefinition(9_104, 47, 0, 150),
      ]);
      engine.lastDamage = lastDamage;
      engine.resolveEnemyTurn();
      return {
        lastDamage,
        queuePosition: engine.enemySkillQueues[0].position,
        snapshot: engine.snapshot(),
      };
    };
    return { below: run(1_659), exact: run(1_660) };
  }) : null;
  if (damageBranchRenderState && (
    damageBranchRenderState.below?.snapshot?.lastEnemyActions?.[0]?.skill?.type !== 82
    || damageBranchRenderState.below?.snapshot?.player?.hp !== 10_150
    || damageBranchRenderState.below?.queuePosition !== 2
    || damageBranchRenderState.below?.snapshot?.rngState !== 21_900
    || damageBranchRenderState.exact?.snapshot?.lastEnemyActions?.[0]?.skill?.type !== 47
    || damageBranchRenderState.exact?.snapshot?.lastEnemyActions?.[0]?.damage !== 2_775
    || damageBranchRenderState.exact?.snapshot?.player?.hp !== 9_225
    || damageBranchRenderState.exact?.queuePosition !== 3
    || damageBranchRenderState.exact?.snapshot?.rngState !== 21_900
  )) throw new Error(`Damage-branch render-state mismatch: ${JSON.stringify(damageBranchRenderState)}`);
  if (damageBranchRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const erasedAttributeBranchRenderState = renderErasedAttributeBranchState
    ? await page.evaluate(() => {
      const makeDefinition = (skillId, type, parameter0 = 0, parameter1 = 0) => {
        const bytes = new Uint8Array(0x48);
        const view = new DataView(bytes.buffer);
        view.setUint32(0x00, skillId, true);
        view.setInt16(0x04, type, true);
        view.setInt32(0x10, parameter0, true);
        view.setInt32(0x14, parameter1, true);
        view.setInt32(0x44, 0, true);
        return bytes;
      };
      const engine = window.__puzzleGame;
      engine.reset();
      engine.start();
      engine.comboCount = 2;
      engine.turnMatches = [
        { type: 'fire', size: 3, enhancedCount: 0 },
        { type: 'heart', size: 3, enhancedCount: 0 },
      ];
      engine.resolvePlayerTurn();
      const tracked = {
        erased: engine.snapshot().lastErasedAttributeMask,
        attacked: engine.snapshot().lastAttackAttributeMask,
      };
      const run = (lastErasedAttributeMask) => {
        engine.reset();
        engine.start();
        engine.setRngState(21_900);
        engine.enemies[0].counter = 1;
        engine.enemies[1].hp = 0;
        engine.setEnemySkillQueue(0, [
          { definition: makeDefinition(9_105, 117, 0, 0b100001), enemyAi: 0, enemyRnd: 2 },
          makeDefinition(9_106, 82),
          makeDefinition(9_107, 47, 0, 150),
        ]);
        engine.lastErasedAttributeMask = lastErasedAttributeMask;
        engine.resolveEnemyTurn();
        return {
          lastErasedAttributeMask,
          queuePosition: engine.enemySkillQueues[0].position,
          snapshot: engine.snapshot(),
        };
      };
      return { tracked, nonExact: run(0b000001), exact: run(0b100001) };
    }) : null;
  if (erasedAttributeBranchRenderState && (
    erasedAttributeBranchRenderState.tracked?.erased !== 0b100001
    || erasedAttributeBranchRenderState.tracked?.attacked !== 0b000001
    || erasedAttributeBranchRenderState.nonExact?.snapshot?.lastEnemyActions?.[0]?.skill?.type !== 82
    || erasedAttributeBranchRenderState.nonExact?.snapshot?.player?.hp !== 10_150
    || erasedAttributeBranchRenderState.nonExact?.queuePosition !== 2
    || erasedAttributeBranchRenderState.nonExact?.snapshot?.rngState !== 21_900
    || erasedAttributeBranchRenderState.exact?.snapshot?.lastEnemyActions?.[0]?.skill?.type !== 47
    || erasedAttributeBranchRenderState.exact?.snapshot?.lastEnemyActions?.[0]?.damage !== 2_775
    || erasedAttributeBranchRenderState.exact?.snapshot?.player?.hp !== 9_225
    || erasedAttributeBranchRenderState.exact?.queuePosition !== 3
    || erasedAttributeBranchRenderState.exact?.snapshot?.rngState !== 21_900
  )) throw new Error(
    `Erased-attribute-branch render-state mismatch: ${JSON.stringify(erasedAttributeBranchRenderState)}`,
  );
  if (erasedAttributeBranchRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const typeResistRenderState = renderTypeResistState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_118, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_118, true);
    view.setInt16(0x04, 118, true);
    view.setInt32(0x10, (1 << 6) | (1 << 7), true);
    view.setInt32(0x14, 25, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.enemies[1].hp = 0;
    engine.party.forEach((member, index) => {
      member.bindTurns = index === 0 ? 0 : 1;
    });
    engine.party[0].monsterTypes = [6, 7];
    engine.comboCount = 1;
    engine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
    engine.setRngState(21_900);
    engine.resolvePlayerTurn();
    return engine.snapshot();
  }) : null;
  if (typeResistRenderState && (
    typeResistRenderState.lastDamage !== 104
    || typeResistRenderState.enemies?.[0]?.hp !== 91_896
    || typeResistRenderState.enemies?.[0]?.typeDamagePercentages?.[6] !== 25
    || typeResistRenderState.enemies?.[0]?.typeDamagePercentages?.[7] !== 25
    || typeResistRenderState.party?.[0]?.monsterTypes?.join('/') !== '6/7'
    || typeResistRenderState.rngState !== 21_900
  )) throw new Error(`Type-resist render-state mismatch: ${JSON.stringify(typeResistRenderState)}`);
  if (typeResistRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const damageImmunityRenderState = renderDamageImmunityState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_119, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_119, true);
    view.setInt16(0x04, 119, true);
    view.setInt32(0x10, 3, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    engine.enemies[1].hp = 0;
    engine.comboCount = 1;
    engine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
    engine.resolvePlayerTurn();
    return engine.snapshot();
  }) : null;
  if (damageImmunityRenderState && (
    damageImmunityRenderState.lastEnemyActions?.[0]?.skill?.type !== 119
    || damageImmunityRenderState.enemies?.[0]?.damageImmunityTurns !== 3
    || damageImmunityRenderState.enemies?.[0]?.hp !== 92_000
    || damageImmunityRenderState.lastDamage !== 0
    || damageImmunityRenderState.lastAbsorbedDamage !== 0
    || damageImmunityRenderState.lastVoidedDamage !== 0
    || damageImmunityRenderState.enemies?.[0]?.damagedTurnCount !== 0
    || damageImmunityRenderState.rngState !== 394_448_415
  )) throw new Error(
    `Damage-immunity render-state mismatch: ${JSON.stringify(damageImmunityRenderState)}`,
  );
  if (damageImmunityRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const remainingEnemiesBranchRenderState = renderRemainingEnemiesBranchState
    ? await page.evaluate(() => {
      const makeDefinition = (skillId, type, parameter0 = 0, parameter1 = 0) => {
        const bytes = new Uint8Array(0x48);
        const view = new DataView(bytes.buffer);
        view.setUint32(0x00, skillId, true);
        view.setInt16(0x04, type, true);
        view.setInt32(0x10, parameter0, true);
        view.setInt32(0x14, parameter1, true);
        view.setInt32(0x44, 0, true);
        return bytes;
      };
      const run = (remainingEnemyCount) => {
        const engine = window.__puzzleGame;
        engine.reset();
        engine.start();
        engine.setRngState(21_900);
        engine.enemies[0].counter = 1;
        engine.enemies[1].counter = 99;
        if (remainingEnemyCount === 1) engine.enemies[1].hp = 0;
        engine.setEnemySkillQueue(0, [
          { definition: makeDefinition(9_120, 120), enemyAi: 1, enemyRnd: 2 },
          makeDefinition(9_121, 82),
          makeDefinition(9_122, 47, 0, 150),
        ]);
        engine.resolveEnemyTurn();
        return {
          remainingEnemyCount,
          queuePosition: engine.enemySkillQueues[0].position,
          snapshot: engine.snapshot(),
        };
      };
      return { above: run(2), exact: run(1) };
    }) : null;
  if (remainingEnemiesBranchRenderState && (
    remainingEnemiesBranchRenderState.above?.snapshot?.lastEnemyActions?.[0]?.skill?.type !== 82
    || remainingEnemiesBranchRenderState.above?.snapshot?.player?.hp !== 10_150
    || remainingEnemiesBranchRenderState.above?.queuePosition !== 2
    || remainingEnemiesBranchRenderState.above?.snapshot?.rngState !== 21_900
    || remainingEnemiesBranchRenderState.exact?.snapshot?.lastEnemyActions?.[0]?.skill?.type !== 47
    || remainingEnemiesBranchRenderState.exact?.snapshot?.lastEnemyActions?.[0]?.damage !== 2_775
    || remainingEnemiesBranchRenderState.exact?.snapshot?.player?.hp !== 9_225
    || remainingEnemiesBranchRenderState.exact?.queuePosition !== 3
    || remainingEnemiesBranchRenderState.exact?.snapshot?.rngState !== 21_900
  )) throw new Error(
    `Remaining-enemies-branch render-state mismatch: ${JSON.stringify(remainingEnemiesBranchRenderState)}`,
  );
  if (remainingEnemiesBranchRenderState) {
    await page.evaluate(() => new Promise(requestAnimationFrame));
  }
  const attributeResistRenderState = renderAttributeResistState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_051, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_051, true);
    view.setInt16(0x04, 72, true);
    view.setInt32(0x10, 0x05, true);
    view.setInt32(0x14, 50, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    const selected = engine.takeEnemySkill(0);
    engine.enemies[1].hp = 0;
    engine.comboCount = 1;
    engine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
    engine.resolvePlayerTurn();
    return { ...engine.snapshot(), selected };
  }) : null;
  if (attributeResistRenderState && (
    attributeResistRenderState.selected !== null
    || attributeResistRenderState.enemies?.[0]?.attributeResistPercentages?.join('/')
      !== '50/100/50/100/100'
    || attributeResistRenderState.enemies?.[0]?.hp !== 90_026
    || attributeResistRenderState.lastDamage !== 1_974
    || attributeResistRenderState.lastVoidedDamage !== 0
    || attributeResistRenderState.rngState !== 21_900
  )) throw new Error(`Attribute-resist render-state mismatch: ${JSON.stringify(attributeResistRenderState)}`);
  if (attributeResistRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const resolveRenderState = renderResolveState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_052, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_052, true);
    view.setInt16(0x04, 73, true);
    view.setInt32(0x10, 50, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    const selected = engine.takeEnemySkill(0);
    engine.enemies[1].hp = 0;
    engine.party.forEach((member, index) => {
      member.bindTurns = index === 0 ? 0 : 1;
    });
    engine.party[0].attack = 100_000;
    engine.comboCount = 1;
    engine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
    engine.resolvePlayerTurn();
    return { ...engine.snapshot(), selected };
  }) : null;
  if (resolveRenderState && (
    resolveRenderState.selected !== null
    || resolveRenderState.enemies?.[0]?.resolveThresholdPercent !== 50
    || resolveRenderState.enemies?.[0]?.hp !== 1
    || resolveRenderState.lastDamage !== 199_880
    || resolveRenderState.rngState !== 21_900
  )) throw new Error(`Resolve render-state mismatch: ${JSON.stringify(resolveRenderState)}`);
  if (resolveRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const damageShieldRenderState = renderDamageShieldState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_053, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_053, true);
    view.setInt16(0x04, 74, true);
    view.setInt32(0x10, 3, true);
    view.setInt32(0x14, 50, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    engine.enemies[1].hp = 0;
    engine.comboCount = 1;
    engine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
    engine.resolvePlayerTurn();
    return engine.snapshot();
  }) : null;
  if (damageShieldRenderState && (
    damageShieldRenderState.lastEnemyActions?.[0]?.skill?.type !== 74
    || damageShieldRenderState.enemies?.[0]?.damageShieldTurns !== 3
    || damageShieldRenderState.enemies?.[0]?.damageShieldPercent !== 50
    || damageShieldRenderState.enemies?.[0]?.hp !== 90_026
    || damageShieldRenderState.lastDamage !== 1_974
    || damageShieldRenderState.rngState !== 394_448_415
  )) throw new Error(`Damage-shield render-state mismatch: ${JSON.stringify(damageShieldRenderState)}`);
  if (damageShieldRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const leaderSwapRenderState = renderLeaderSwapState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_054, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_054, true);
    view.setInt16(0x04, 75, true);
    view.setInt32(0x10, 3, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    return engine.snapshot();
  }) : null;
  if (leaderSwapRenderState && (
    leaderSwapRenderState.lastEnemyActions?.[0]?.skill?.type !== 75
    || leaderSwapRenderState.lastEnemyActions?.[0]?.skill?.selectedPartyIndex !== 4
    || leaderSwapRenderState.leaderSwapTurns !== 3
    || leaderSwapRenderState.leaderSwapIndex !== 4
    || leaderSwapRenderState.party?.[0]?.id !== 'nyx'
    || leaderSwapRenderState.party?.[4]?.id !== 'ember'
    || leaderSwapRenderState.rngState !== 3_803_934_822
  )) throw new Error(`Leader-swap render-state mismatch: ${JSON.stringify(leaderSwapRenderState)}`);
  if (leaderSwapRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const normalAttackRenderState = renderNormalAttackState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_060, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_060, true);
    view.setInt16(0x04, 82, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    return engine.snapshot();
  }) : null;
  if (normalAttackRenderState && (
    normalAttackRenderState.lastEnemyActions?.[0]?.skill?.type !== 82
    || normalAttackRenderState.lastEnemyActions?.[0]?.damage !== 1_850
    || normalAttackRenderState.player?.hp !== 10_150
    || normalAttackRenderState.rngState !== 394_448_415
  )) throw new Error(`Normal-attack render-state mismatch: ${JSON.stringify(normalAttackRenderState)}`);
  if (normalAttackRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const multiAttackRenderState = renderMultiAttackState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_061, true);
    monsterView.setUint8(0xf0, 100);
    const definition = (skillId, type) => {
      const bytes = new Uint8Array(0x48);
      const view = new DataView(bytes.buffer);
      view.setUint32(0x00, skillId, true);
      view.setInt16(0x04, type, true);
      view.setInt32(0x30, 10_000, true);
      view.setInt32(0x34, 1_000, true);
      view.setInt32(0x38, 100, true);
      view.setInt32(0x40, 20, true);
      return { bytes, view };
    };
    const parent = definition(9_061, 83);
    parent.view.setInt32(0x10, 9_062, true);
    parent.view.setInt32(0x14, 9_063, true);
    parent.view.setInt32(0x18, 9_064, true);
    parent.view.setInt32(0x1c, 0, true);
    parent.view.setInt32(0x44, 777, true);
    const inactivity = definition(9_062, 66);
    inactivity.view.setInt32(0x38, 0, true);
    inactivity.view.setInt32(0x40, 999, true);
    inactivity.view.setInt32(0x44, 0, true);
    const gravity = definition(9_063, 50);
    gravity.view.setInt32(0x10, 25, true);
    gravity.view.setInt32(0x44, 0, true);
    const normal = definition(9_064, 82);
    normal.view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [
      parent.bytes, inactivity.bytes, gravity.bytes, normal.bytes,
    ]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    return engine.snapshot();
  }) : null;
  if (multiAttackRenderState && (
    multiAttackRenderState.lastEnemyActions?.length !== 3
    || multiAttackRenderState.lastEnemyActions?.[0]?.skill?.type !== 66
    || multiAttackRenderState.lastEnemyActions?.[1]?.skill?.type !== 50
    || multiAttackRenderState.lastEnemyActions?.[1]?.damage !== 3_000
    || multiAttackRenderState.lastEnemyActions?.[2]?.skill?.type !== 82
    || multiAttackRenderState.lastEnemyActions?.[2]?.damage !== 1_850
    || multiAttackRenderState.player?.hp !== 7_150
    || multiAttackRenderState.enemies?.[0]?.enemyAiBudget !== 80
    || multiAttackRenderState.rngState !== 394_448_415
  )) throw new Error(`Multi-attack render-state mismatch: ${JSON.stringify(multiAttackRenderState)}`);
  if (multiAttackRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
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
    const attackState = engine.snapshot();
    engine.reset();
    engine.start();
    const unconditionalHeal = makeSkill(9_067, 86, 20, 30);
    new DataView(unconditionalHeal.buffer).setInt32(0x44, 0, true);
    engine.setEnemyAiDefinitionPool(0, makeMonster(9_067), [unconditionalHeal]);
    engine.player.hp = 1;
    engine.enemies[0].hp = 50_000;
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.setRngState(21_900);
    engine.resolveEnemyTurn();
    return { healState, attackState, unconditionalHealState: engine.snapshot() };
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
    || earlyHealAttackRenderState.unconditionalHealState?.lastEnemyActions?.[0]?.skill?.type !== 86
    || earlyHealAttackRenderState.unconditionalHealState?.lastEnemyActions?.[0]?.skill?.healPercent !== 29
    || earlyHealAttackRenderState.unconditionalHealState?.lastEnemyActions?.[0]?.damage !== undefined
    || earlyHealAttackRenderState.unconditionalHealState?.enemies?.[0]?.hp !== 76_680
    || earlyHealAttackRenderState.unconditionalHealState?.player?.hp !== 1
    || earlyHealAttackRenderState.unconditionalHealState?.rngState !== 3_803_934_822
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
  const bindAttackRenderState = renderBindAttackState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_043, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_043, true);
    view.setInt16(0x04, 63, true);
    view.setInt32(0x10, 50, true);
    view.setInt32(0x14, 2, true);
    view.setInt32(0x18, 4, true);
    view.setInt32(0x1c, 4, true);
    view.setInt32(0x20, 2, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 50, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    return {
      ...engine.snapshot(),
      floatingText: engine.floatingText.map((item) => ({ ...item })),
    };
  }) : null;
  if (bindAttackRenderState && (
    bindAttackRenderState.lastEnemyActions?.[0]?.skill?.type !== 63
    || bindAttackRenderState.lastEnemyActions?.[0]?.damage !== 925
    || bindAttackRenderState.lastEnemySkill?.targetMask !== 0x12
    || bindAttackRenderState.lastEnemySkill?.boundMask !== 0x12
    || bindAttackRenderState.lastEnemySkill?.durationTurns !== 2
    || bindAttackRenderState.party?.[1]?.bindTurns !== 2
    || bindAttackRenderState.party?.[4]?.bindTurns !== 2
    || bindAttackRenderState.player?.hp !== 11_075
    || bindAttackRenderState.rngState !== 919_597_584
    || bindAttackRenderState.floatingText?.[0]?.kind !== 'playerDamage'
    || bindAttackRenderState.floatingText?.[0]?.enemy !== -1
    || bindAttackRenderState.floatingText?.[0]?.sourceEnemy !== 0
  )) throw new Error(`Bind-attack render-state mismatch: ${JSON.stringify(bindAttackRenderState)}`);
  if (bindAttackRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const randomSubBindRenderState = renderRandomSubBindState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_044, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_044, true);
    view.setInt16(0x04, 65, true);
    view.setInt32(0x10, 2, true);
    view.setInt32(0x14, 2, true);
    view.setInt32(0x18, 4, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 50, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    return {
      ...engine.snapshot(),
      floatingText: engine.floatingText.map((item) => ({ ...item })),
    };
  }) : null;
  if (randomSubBindRenderState && (
    randomSubBindRenderState.lastEnemyActions?.[0]?.skill?.type !== 65
    || randomSubBindRenderState.lastEnemyActions?.[0]?.damage !== 925
    || randomSubBindRenderState.lastEnemySkill?.targetMask !== 0x12
    || randomSubBindRenderState.lastEnemySkill?.boundMask !== 0x12
    || randomSubBindRenderState.lastEnemySkill?.setupDurationTurns !== 2
    || randomSubBindRenderState.lastEnemySkill?.durationTurns !== 3
    || randomSubBindRenderState.party?.[1]?.bindTurns !== 3
    || randomSubBindRenderState.party?.[4]?.bindTurns !== 3
    || randomSubBindRenderState.player?.hp !== 11_075
    || randomSubBindRenderState.rngState !== 1_848_838_291
    || randomSubBindRenderState.floatingText?.[0]?.kind !== 'playerDamage'
    || randomSubBindRenderState.floatingText?.[0]?.enemy !== -1
    || randomSubBindRenderState.floatingText?.[0]?.sourceEnemy !== 0
  )) throw new Error(`Random-sub-bind render-state mismatch: ${JSON.stringify(randomSubBindRenderState)}`);
  if (randomSubBindRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const repeatAttackRenderState = renderRepeatAttackState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_039, true);
    view.setInt16(0x04, 15, true);
    view.setInt32(0x10, 3, true);
    view.setInt32(0x14, 5, true);
    view.setInt32(0x18, 40, true);
    view.setInt32(0x44, 50, true);
    engine.reset();
    engine.start();
    engine.setRngState(21_900);
    engine.setEnemySkillQueue(0, [definition]);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    return engine.snapshot();
  }) : null;
  if (repeatAttackRenderState && (
    repeatAttackRenderState.lastEnemyActions?.[0]?.skill?.type !== 15
    || repeatAttackRenderState.lastEnemyActions?.[0]?.skill?.hitCount !== 3
    || repeatAttackRenderState.lastEnemyActions?.[0]?.skill?.damagePercent !== 40
    || repeatAttackRenderState.lastEnemyActions?.[0]?.skill?.hitDamages?.join(',') !== '740,740,740'
    || repeatAttackRenderState.lastEnemyActions?.[0]?.damage !== 3_145
    || repeatAttackRenderState.player?.hp !== 8_855
  )) throw new Error(`Repeat-attack render-state mismatch: ${JSON.stringify(repeatAttackRenderState)}`);
  if (repeatAttackRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const entireBlindRenderState = renderEntireBlindState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_041, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_041, true);
    view.setInt16(0x04, 5, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 50, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const turnState = engine.snapshot();
    engine.startDrag(0, 0, 50, 475, 0.5, 0.5);
    engine.moveDrag(0, 1, 120, 475, 1.5, 0.5);
    const movedState = engine.snapshot();
    engine.drag = null;
    const altDefinition = definition.slice();
    const altView = new DataView(altDefinition.buffer);
    altView.setUint32(0x00, 9_042, true);
    altView.setInt16(0x04, 62, true);
    altView.setInt32(0x10, 7, true);
    monsterView.setUint32(0xec, 9_042, true);
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [altDefinition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const altState = engine.snapshot();
    return { turnState, movedState, altState, renderState: altState };
  }) : null;
  if (entireBlindRenderState && (
    entireBlindRenderState.turnState?.lastEnemyActions?.[0]?.skill?.type !== 5
    || entireBlindRenderState.turnState?.lastEnemyActions?.[0]?.damage !== 925
    || entireBlindRenderState.turnState?.player?.hp !== 11_075
    || entireBlindRenderState.turnState?.rngState !== 394_448_415
    || entireBlindRenderState.turnState?.boardState?.flat()?.filter((orb) => orb.entireBlind).length !== 30
    || entireBlindRenderState.turnState?.boardState?.flat()?.some((orb) => (
      !orb.blind || (orb.blockFlags & 0x0c) !== 0x0c || orb.blindCountdown !== 0
    ))
    || entireBlindRenderState.movedState?.boardState?.flat()?.filter((orb) => orb.entireBlind).length !== 28
    || entireBlindRenderState.altState?.lastEnemyActions?.[0]?.skill?.type !== 62
    || entireBlindRenderState.altState?.lastEnemyActions?.[0]?.damage !== 925
    || entireBlindRenderState.altState?.lastEnemySkill?.newlyBlinded !== 2
    || entireBlindRenderState.altState?.player?.hp !== 10_150
    || entireBlindRenderState.altState?.rngState !== 394_448_415
    || entireBlindRenderState.renderState?.boardState?.flat()?.filter((orb) => orb.entireBlind).length !== 30
    || entireBlindRenderState.renderState?.message !== 'Enemies attacked for 925 damage.'
  )) throw new Error(`Entire-blind render-state mismatch: ${JSON.stringify(entireBlindRenderState)}`);
  if (entireBlindRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
  const inactivityRenderState = renderInactivityState ? await page.evaluate(() => {
    const engine = window.__puzzleGame;
    const monsterDefinition = new Uint8Array(0x2ec);
    const monsterView = new DataView(monsterDefinition.buffer);
    monsterView.setUint8(0xe0, 1);
    monsterView.setInt16(0xe2, 100, true);
    monsterView.setInt16(0xe4, 10, true);
    monsterView.setUint32(0xec, 9_040, true);
    monsterView.setUint8(0xf0, 100);
    const definition = new Uint8Array(0x48);
    const view = new DataView(definition.buffer);
    view.setUint32(0x00, 9_040, true);
    view.setInt16(0x04, 16, true);
    view.setInt32(0x30, 10_000, true);
    view.setInt32(0x34, 1_000, true);
    view.setInt32(0x38, 100, true);
    view.setInt32(0x40, 20, true);
    view.setInt32(0x44, 0, true);
    engine.reset();
    engine.start();
    engine.enemies[0].attribute = 'water';
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const conditionalState = engine.snapshot();
    monsterView.setUint32(0xec, 9_045, true);
    view.setUint32(0x00, 9_045, true);
    view.setInt16(0x04, 66, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    const unconditionalState = engine.snapshot();
    monsterView.setUint32(0xec, 9_049, true);
    view.setUint32(0x00, 9_049, true);
    view.setInt16(0x04, 70, true);
    view.setInt32(0x10, 12, true);
    view.setInt32(0x14, 34, true);
    view.setInt32(0x18, 56, true);
    engine.reset();
    engine.start();
    engine.setEnemySkillQueue(0, []);
    engine.setEnemyAiDefinitionPool(0, monsterDefinition, [definition]);
    engine.setRngState(21_900);
    engine.enemies[0].counter = 1;
    engine.enemies[1].counter = 99;
    engine.resolveEnemyTurn();
    return { conditionalState, unconditionalState, presentationState: engine.snapshot() };
  }) : null;
  if (inactivityRenderState && (
    inactivityRenderState.conditionalState?.lastEnemyActions?.[0]?.skill?.type !== 16
    || inactivityRenderState.conditionalState?.lastEnemyActions?.[0]?.damage !== undefined
    || inactivityRenderState.conditionalState?.player?.hp !== 12_000
    || inactivityRenderState.conditionalState?.rngState !== 394_448_415
    || inactivityRenderState.conditionalState?.message !== 'Verdant Shell does nothing.'
    || inactivityRenderState.unconditionalState?.enemies?.[0]?.attribute !== 'wood'
    || inactivityRenderState.unconditionalState?.lastEnemyActions?.[0]?.skill?.type !== 66
    || inactivityRenderState.unconditionalState?.lastEnemyActions?.[0]?.damage !== undefined
    || inactivityRenderState.unconditionalState?.player?.hp !== 12_000
    || inactivityRenderState.unconditionalState?.rngState !== 394_448_415
    || inactivityRenderState.unconditionalState?.message !== 'Verdant Shell does nothing.'
    || inactivityRenderState.presentationState?.lastEnemyActions?.[0]?.skill?.type !== 70
    || inactivityRenderState.presentationState?.lastEnemyActions?.[0]?.damage !== undefined
    || inactivityRenderState.presentationState?.lastEnemyActions?.[0]?.skill?.presentationParameters?.join('/') !== '12/34/56'
    || inactivityRenderState.presentationState?.player?.hp !== 12_000
    || inactivityRenderState.presentationState?.rngState !== 394_448_415
    || inactivityRenderState.presentationState?.message !== 'Verdant Shell pauses with effect 12/34/56.'
  )) throw new Error(`Inactivity render-state mismatch: ${JSON.stringify(inactivityRenderState)}`);
  if (inactivityRenderState) await page.evaluate(() => new Promise(requestAnimationFrame));
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
  await fs.writeFile(`${outputPath}.json`, JSON.stringify({ before, during, after, bombResolution, thornInput, orbStateSample, blockPowupSample, blockMinusSample, burDropSample, lockDropSample, poisonBlockSample, largeBoard, tapTurn, matchShape, attackRounds, pointerIdentity, moveDeadline, nailRenderState, blackFallRenderState, bindRenderState, attributeAbsorbRenderState, comboAbsorbRenderState, skyfallRateRenderState, deathCryRenderState, damageVoidRenderState, damageAbsorbRenderState, awakeningBindRenderState, skillDelayRenderState, presenceCheckRenderState, maskedRandomOrbChangeRenderState, nativeNoEffectRenderState, lockRandomOrbsRenderState, enemyEscapeRenderState, lockedSkyfallRenderState, stickyBlindRandomRenderState, stickyBlindFixedRenderState, orbSealColumnsRenderState, orbSealRowsRenderState, fixedStartRenderState, randomBombsRenderState, fixedBombsRenderState, cloudRenderState, recoveryDebuffRenderState, turnChangeRenderState, attributeBlockRenderState, attackOrbChangeRenderState, randomSpinnersRenderState, fixedSpinnersRenderState, maxHpChangeRenderState, fixedTargetRenderState, comboBranchRenderState, attackAttributeBranchRenderState, skillUseBranchRenderState, damageBranchRenderState, erasedAttributeBranchRenderState, typeResistRenderState, damageImmunityRenderState, remainingEnemiesBranchRenderState, attributeResistRenderState, resolveRenderState, damageShieldRenderState, leaderSwapRenderState, normalAttackRenderState, multiAttackRenderState, reviveRenderState, attributeChangeRenderState, selfDestructRenderState, moveTimeRenderState, statusShieldRenderState, clearPlayerBuffsRenderState, earlyHealAttackRenderState, earlyDefenseShieldsRenderState, earlyPartyControlRenderState, bindAttackRenderState, randomSubBindRenderState, repeatAttackRenderState, entireBlindRenderState, inactivityRenderState, attackBoostRenderState, consoleMessages }, null, 2));
  const atlasStatus = await page.locator('.puzzle-apk-art span').textContent();
  process.stdout.write(`${JSON.stringify({ atlasStatus, dragPathLength: during.drag.pathLength, turn: after.turn, phase: after.phase, bombResolution, thornInput, orbStateSample, blockPowupSample, blockMinusSample, burDropSample, lockDropSample, poisonBlockSample, largeBoard, tapTurn, matchShape, attackRounds, pointerIdentity, moveDeadline, nailRenderState, blackFallRenderState, bindRenderState, attributeAbsorbRenderState, comboAbsorbRenderState, skyfallRateRenderState, deathCryRenderState, damageVoidRenderState, damageAbsorbRenderState, awakeningBindRenderState, skillDelayRenderState, presenceCheckRenderState, maskedRandomOrbChangeRenderState, nativeNoEffectRenderState, lockRandomOrbsRenderState, enemyEscapeRenderState, lockedSkyfallRenderState, stickyBlindRandomRenderState, stickyBlindFixedRenderState, orbSealColumnsRenderState, orbSealRowsRenderState, fixedStartRenderState, randomBombsRenderState, fixedBombsRenderState, cloudRenderState, recoveryDebuffRenderState, turnChangeRenderState, attributeBlockRenderState, attackOrbChangeRenderState, randomSpinnersRenderState, fixedSpinnersRenderState, maxHpChangeRenderState, fixedTargetRenderState, comboBranchRenderState, attackAttributeBranchRenderState, skillUseBranchRenderState, damageBranchRenderState, erasedAttributeBranchRenderState, typeResistRenderState, damageImmunityRenderState, remainingEnemiesBranchRenderState, attributeResistRenderState, resolveRenderState, damageShieldRenderState, leaderSwapRenderState, normalAttackRenderState, multiAttackRenderState, reviveRenderState, attributeChangeRenderState, selfDestructRenderState, moveTimeRenderState, statusShieldRenderState, clearPlayerBuffsRenderState, earlyHealAttackRenderState, earlyDefenseShieldsRenderState, earlyPartyControlRenderState, bindAttackRenderState, randomSubBindRenderState, repeatAttackRenderState, entireBlindRenderState, inactivityRenderState, attackBoostRenderState, consoleMessages }, null, 2)}\n`);
} finally {
  await browser.close();
}
