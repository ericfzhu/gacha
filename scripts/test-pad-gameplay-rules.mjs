import assert from 'node:assert/strict';
import { PuzzleEngine } from '../src/puzzle/puzzleEngine.js';
import {
  createPadLcg,
  createPadRng,
  findPadMatches,
  findPadBombDetonations,
  padApplyAttackMultipliers,
  padAttributeMultiplier,
  padBombDamage,
  padComboMultiplier,
  padComboLeaderMultiplier,
  padDamageAfterDefense,
  padEnhancementPowerMultiplier,
  padEnhancedOrbMultiplier,
  padGetRandomBlock,
  padGetRandomBlockOnFace,
  padMatchPower,
  padNativeBaseAttackPower,
  padNativeRecoveryPower,
  padOrbMatchMultiplier,
  padPoisonDamage,
  padSecondaryAttributeAttack,
  padShuffleBlockCandidates,
  padTertiaryAttributeAttack,
  padLcgStep,
  padThornDamage,
  tracePadDragCells,
  tracePadPointerCells,
} from '../src/puzzle/padCoreRules.js';

assert.deepEqual(padLcgStep(21_900), { state: 394_448_415, value: 6_018 });
const nativeRng = createPadLcg(21_900);
assert.deepEqual(
  Array.from({ length: 5 }, () => nativeRng()),
  [6_018, 58_043, 29_441, 14_031, 28_211].map((value) => value / 65_536),
);
const statefulNativeRng = createPadRng(21_900);
assert.equal(statefulNativeRng.state, 21_900);
assert.equal(statefulNativeRng.nextUint16(), 6_018);
assert.equal(statefulNativeRng.state, 394_448_415);
assert.equal(statefulNativeRng.nextFloat(), 58_043 / 65_536);
assert.equal(statefulNativeRng.state, 3_803_934_822);
assert.deepEqual(statefulNativeRng.shuffleBlockCandidates([0, 1, 2]), [2, 1, 0]);
assert.equal(statefulNativeRng.state, 919_597_584);
assert.equal(statefulNativeRng.getRandomBlock(), 3);
assert.equal(statefulNativeRng.state, 1_569_558_794);
assert.deepEqual(padShuffleBlockCandidates(21_900, [0, 1, 2, 3, 4, 5]), {
  state: 3_803_934_822,
  candidates: [1, 3, 2, 4, 5, 0],
});
assert.deepEqual(padShuffleBlockCandidates(21_900, ['heart']), {
  state: 3_803_934_822,
  candidates: ['heart'],
});
assert.deepEqual(padGetRandomBlock(21_900), { state: 3_803_934_822, type: 1 });
assert.deepEqual(padGetRandomBlock(21_900, 1), { state: 3_803_934_822, type: 2 });
assert.deepEqual(padGetRandomBlock(21_900, -1, true, true), { state: 3_803_934_822, type: 1 });
assert.deepEqual(padGetRandomBlock(21_900, -1, false, false), { state: 3_803_934_822, type: 1 });
assert.deepEqual(padGetRandomBlockOnFace(21_900, [1, 1, 1, 1, 1, 1]), {
  state: 3_803_934_822,
  type: 1,
  alternateType: 3,
});
assert.deepEqual(padGetRandomBlockOnFace(21_900, [0, 4, 0, 2, 0, 9], false), {
  state: 3_803_934_822,
  type: 3,
  alternateType: 1,
});
assert.deepEqual(padGetRandomBlockOnFace(21_900, new Map([[4, 2]])), {
  state: 3_803_934_822,
  type: 4,
  alternateType: null,
});
assert.deepEqual(padGetRandomBlockOnFace(21_900, {}), {
  state: 21_900,
  type: -1,
  alternateType: null,
});
const faceRng = createPadRng(21_900);
assert.deepEqual(faceRng.getRandomBlockOnFace([1, 1, 1, 1, 1, 1]), { type: 1, alternateType: 3 });
assert.equal(faceRng.state, 3_803_934_822);
assert.deepEqual(new PuzzleEngine({ seed: 21_900 }).snapshot().board, [
  'RHGBGG',
  'BBGHRL',
  'LDBRHR',
  'BHLDBH',
  'LRLDHR',
]);
assert.equal(new PuzzleEngine({ seed: 21_900 }).snapshot().rngState, 79_238_434);

assert.deepEqual(tracePadDragCells(0, 0, 1, 1), [{ row: 0, column: 1 }, { row: 1, column: 1 }]);
assert.deepEqual(tracePadDragCells(0, 0, 2, 2, true), [{ row: 1, column: 1 }, { row: 2, column: 2 }]);
assert.deepEqual(tracePadDragCells(4, 5, 1, 3), [
  { row: 3, column: 5 },
  { row: 3, column: 4 },
  { row: 2, column: 4 },
  { row: 2, column: 3 },
  { row: 1, column: 3 },
]);
for (const path of [tracePadDragCells(0, 0, 4, 5), tracePadDragCells(4, 5, 0, 0)]) {
  let previous = path[0];
  for (const cell of path.slice(1)) {
    assert.equal(Math.abs(cell.row - previous.row) + Math.abs(cell.column - previous.column), 1);
    previous = cell;
  }
}
assert.deepEqual(tracePadPointerCells(0, 0, 0.9, 0.2, 1.1, 1.9), [
  { row: 1, column: 0 },
  { row: 1, column: 1 },
]);
assert.deepEqual(tracePadPointerCells(0, 0, 0.5, 0.5, 2.5, 2.5, 5, 6, true), [
  { row: 1, column: 1 },
  { row: 2, column: 2 },
]);
assert.deepEqual(tracePadPointerCells(0, 0, 0.5, 0.5, 8, -2), [
  { row: 0, column: 1 },
  { row: 0, column: 2 },
  { row: 0, column: 3 },
  { row: 0, column: 4 },
  { row: 0, column: 5 },
]);

const board = [
  ['R', 'R', 'R', 'B', 'G', 'L'],
  ['B', 'G', 'R', 'D', 'L', 'H'],
  ['G', 'R', 'R', 'R', 'B', 'D'],
  ['L', 'D', 'R', 'H', 'G', 'B'],
  ['H', 'B', 'G', 'L', 'D', 'H'],
];
const matches = findPadMatches(board, (cell) => cell);
assert.equal(matches.length, 1);
assert.equal(matches[0].type, 'R');
assert.equal(matches[0].size, 8);
assert.equal(matches[0].isMassAttack, true);
assert.equal(matches[0].isRow, false);

const horizontalMatches = findPadMatches([
  ['R', 'R', 'R', 'B', 'G', 'L'],
  ['B', 'G', 'L', 'D', 'H', 'R'],
  ['G', 'L', 'D', 'H', 'R', 'B'],
], (cell) => cell);
assert.equal(horizontalMatches[0].isHorizontal, true);
assert.equal(horizontalMatches[0].isRow, false);

const fullRowMatches = findPadMatches([
  ['R', 'R', 'R', 'R', 'R', 'R'],
  ['B', 'G', 'R', 'D', 'H', 'B'],
  ['G', 'L', 'R', 'H', 'B', 'G'],
], (cell) => cell);
assert.equal(fullRowMatches[0].size, 8);
assert.equal(fullRowMatches[0].isHorizontal, false);
assert.equal(fullRowMatches[0].isRow, true);

const shapeEngine = new PuzzleEngine({ seed: 10 });
shapeEngine.setBoardFromCodes(['RRRRRR', 'BGRDLH', 'GLRHBJ', 'LDHBRG', 'DHBGGL']);
shapeEngine.start();
shapeEngine.phase = 'detect';
shapeEngine.phaseTimer = 0;
shapeEngine.advancePhase();
assert.equal(shapeEngine.turnMatches.length, 1);
assert.deepEqual(shapeEngine.snapshot().turnMatches[0], {
  type: 'fire',
  size: 8,
  enhancedCount: 0,
  enhancementMultiplier: 1,
  isMassAttack: true,
  isHorizontal: false,
  isVertical: false,
  isRow: true,
  isColumn: false,
  isBox: false,
  isCross: false,
  isL: false,
  cascadeDepth: 1,
});

assert.equal(padOrbMatchMultiplier(3), 1);
assert.equal(padOrbMatchMultiplier(5), 1.5);
assert.equal(padComboMultiplier(1), 1);
assert.equal(padComboMultiplier(7), 2.5);
assert.equal(padComboMultiplier(3, 0.5), 2);
const comboLeader = { type: 'comboAttack', thresholds: [{ combos: 4, multiplier: 2 }, { combos: 7, multiplier: 3.5 }] };
assert.equal(padComboLeaderMultiplier(3, comboLeader), 1);
assert.equal(padComboLeaderMultiplier(4, comboLeader), 2);
assert.equal(padComboLeaderMultiplier(7, comboLeader), 3.5);
assert.equal(padComboLeaderMultiplier(12, null), 1);
assert.equal(padMatchPower(1000, [3, 5]), 2500);
assert.equal(padNativeBaseAttackPower(101, [3, 4], 2), 285);
assert.equal(padNativeBaseAttackPower(1, [3, 3], 2), 3);
assert.equal(padNativeBaseAttackPower(101, [4], 2), 159);
assert.equal(padApplyAttackMultipliers(285, [1.5, 1.5]), 642);
assert.equal(padDamageAfterDefense(101, 0.5, 40), 11);
assert.equal(padDamageAfterDefense(10, 0.5, 999), 1);
assert.equal(padDamageAfterDefense(3_000_000_000, 2, 100), 2_147_483_547);
assert.equal(padDamageAfterDefense(3_000_000_000, 2, 100, 10_000_000_000), 5_999_999_900);
assert.equal(padDamageAfterDefense(10, 0.5, 999, 2_147_483_647, 0), 0);
assert.equal(padEnhancedOrbMultiplier(3), 1.179999828338623);
assert.equal(padEnhancementPowerMultiplier([2.5, 0.25, -0.5]), 3.25);
assert.equal(padNativeBaseAttackPower(100, [{ size: 3, enhancedCount: 3 }], 1), 118);
assert.equal(padNativeBaseAttackPower(100, [{ size: 3, enhancementMultiplier: 3.25 }], 1), 325);
assert.equal(padNativeBaseAttackPower(93_789, [{ size: 3, enhancedCount: 3 }], 1), 110_671);
assert.equal(padNativeBaseAttackPower(101, [{ size: 3, enhancedCount: 3 }], 1), 120);
assert.equal(padNativeBaseAttackPower(75, [{ size: 3, enhancedCount: 2 }], 1), 84);
assert.equal(padNativeBaseAttackPower(100, [{ size: 3, enhancedCount: 0 }], 3, 0.5), 200);
assert.equal(padNativeRecoveryPower([2], [{ size: 9, enhancedCount: 6 }], 7), 16);
assert.equal(padNativeRecoveryPower([1, 2], [{ size: 13, enhancedCount: 10 }], 12), 62);
assert.equal(padNativeRecoveryPower(3, [{ size: 13, enhancedCount: 10 }], 12), 62);
assert.equal(padNativeRecoveryPower([100], [{ size: 3, enhancedCount: 0 }], 3, 0.5), 200);
assert.equal(padSecondaryAttributeAttack(900, 'fire', 'fire'), 90);
assert.equal(padSecondaryAttributeAttack(900, 'fire', 'water'), 300);
assert.equal(padSecondaryAttributeAttack(900, 'fire', 'fire', true), 135);
assert.equal(padSecondaryAttributeAttack(900, 'fire', null), 0);
assert.equal(padTertiaryAttributeAttack(900, 'fire'), 45);
assert.equal(padTertiaryAttributeAttack(901, 'water'), 46);
assert.equal(padTertiaryAttributeAttack(900, null), 0);
assert.equal(padPoisonDamage(10_000, [3], []), 2_000);
assert.equal(padPoisonDamage(10_000, [4], [3]), 7_500);
assert.equal(padPoisonDamage(10_001, [3, 3], []), 4_002);
assert.equal(padPoisonDamage(10_001, [], [3]), 5_001);
assert.equal(padPoisonDamage(12, [4], []), 3);
assert.equal(padPoisonDamage(2_147_483_647, [3, 3, 3, 3, 3, 3], []), 2_147_483_647);
assert.equal(padBombDamage(10_001, 2), 4_002);
assert.equal(padBombDamage(2_147_483_647, 10), 2_147_483_647);
assert.equal(padThornDamage(10_001, 4), 401);
assert.equal(padAttributeMultiplier('fire', 'wood'), 2);
assert.equal(padAttributeMultiplier('fire', 'water'), 0.5);
assert.equal(padAttributeMultiplier('light', 'dark'), 2);
assert.equal(padAttributeMultiplier('light', 'fire'), 1);

const bombBoard = [
  ['R', 'B', 'G', 'L', 'D', 'H'],
  ['B', 'G', 'L', 'D', 'H', 'R'],
  ['G', 'L', 'X', 'H', 'R', 'B'],
  ['L', 'D', 'H', 'R', 'B', 'G'],
  ['D', 'H', 'R', 'B', 'G', 'L'],
];
const bombResolution = findPadBombDetonations(
  bombBoard,
  findPadMatches(bombBoard, (cell) => cell),
  (cell) => cell,
  'X',
);
assert.deepEqual(bombResolution.bombs, [{ row: 2, column: 2 }]);
assert.equal(bombResolution.cells.length, 10);
assert(bombResolution.cells.some(({ row, column }) => row === 2 && column === 0));
assert(bombResolution.cells.some(({ row, column }) => row === 4 && column === 2));

const matchedBombBoard = bombBoard.map((row) => [...row]);
matchedBombBoard[0] = ['X', 'X', 'X', 'L', 'D', 'H'];
const matchedBombs = findPadMatches(matchedBombBoard, (cell) => cell);
const matchedBombResolution = findPadBombDetonations(matchedBombBoard, matchedBombs, (cell) => cell, 'X');
assert.equal(matchedBombs[0].type, 'X');
assert.equal(matchedBombResolution.bombs.length, 1);
assert.deepEqual(matchedBombResolution.bombs[0], { row: 2, column: 2 });

const doubleBombBoard = bombBoard.map((row) => [...row]);
doubleBombBoard[2][4] = 'X';
const doubleBombResolution = findPadBombDetonations(doubleBombBoard, [], (cell) => cell, 'X');
assert.equal(doubleBombResolution.bombs.length, 2);
assert.equal(doubleBombResolution.cells.length, 14);
assert.equal(padBombDamage(12_000, doubleBombResolution.bombs.length), 4_800);

const engine = new PuzzleEngine({ seed: 1 });
engine.setBoardFromCodes(['RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
engine.start();
assert.equal(engine.startDrag(0, 0, 50, 50), true);
assert.equal(engine.moveDrag(1, 1, 120, 120), true);
assert.equal(engine.drag.pathLength, 2);
assert.deepEqual(engine.snapshot().board.slice(0, 2), ['BLGHLD', 'GRDBHR']);

const tapEngine = new PuzzleEngine({ seed: 9 });
tapEngine.setBoardFromCodes(['RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
tapEngine.start();
const tapBoard = tapEngine.snapshot().board;
assert.equal(tapEngine.startDrag(0, 0, 50, 50), true);
assert.equal(tapEngine.endDrag(), true);
assert.equal(tapEngine.turn, 1);
assert.equal(tapEngine.phase, 'detect');
assert.deepEqual(tapEngine.snapshot().board, tapBoard);

const deadlineEngine = new PuzzleEngine({ seed: 14, moveTime: 5 });
deadlineEngine.start();
deadlineEngine.startDrag(0, 0, 35, 447, 0.5, 0.5);
deadlineEngine.update(6);
assert.equal(deadlineEngine.drag, null);
assert.equal(deadlineEngine.turn, 1);
assert.equal(deadlineEngine.phase, 'detect');

const largeBoardEngine = new PuzzleEngine({ seed: 7, columns: 7, rows: 6 });
largeBoardEngine.setBoardFromCodes([
  'RBGHLDR',
  'GLDBHRG',
  'BHRDGLB',
  'DLGRHBD',
  'HRBGLDH',
  'RGLDBHR',
]);
assert.deepEqual(largeBoardEngine.snapshot().boardDimensions, { rows: 6, columns: 7 });
largeBoardEngine.start();
assert.equal(largeBoardEngine.startDrag(5, 5, 385, 735, 5.5, 5.5), true);
assert.equal(largeBoardEngine.moveDrag(5, 6, 420, 735, 6.5, 5.5), true);
assert.equal(largeBoardEngine.drag.column, 6);
assert.equal(largeBoardEngine.drag.pathLength, 1);
assert.equal(largeBoardEngine.snapshot().board[5], 'RGLDBRH');
assert.throws(() => new PuzzleEngine({ columns: 16, rows: 6 }), /1 through 15/);

const diagonalEngine = new PuzzleEngine({ seed: 8, allowDiagonalMoves: true });
diagonalEngine.setBoardFromCodes(['RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
diagonalEngine.setOrbState(1, 1, { thornPercent: 4 });
diagonalEngine.start();
diagonalEngine.startDrag(0, 0, 50, 475, 0.5, 0.5);
diagonalEngine.moveDrag(1, 1, 120, 545, 1.5, 1.5);
assert.equal(diagonalEngine.drag.pathLength, 1);
assert.deepEqual({ row: diagonalEngine.drag.row, column: diagonalEngine.drag.column }, { row: 1, column: 1 });
assert.equal(diagonalEngine.lastThornDamage, 480);
assert.equal(diagonalEngine.snapshot().moveAdjacency, 'eight-way');

const poisonEngine = new PuzzleEngine({ seed: 2 });
assert.equal(poisonEngine.party.length, 6);
assert.equal(poisonEngine.party.reduce((total, member) => total + member.recovery, 0), poisonEngine.player.recovery);
poisonEngine.setBoardFromCodes(['PPPBGH', 'HHHLDB', 'BGHRDL', 'DLGRHB', 'HRBGLD']);
poisonEngine.player.hp = poisonEngine.player.maxHp;
poisonEngine.comboCount = 2;
poisonEngine.turnMatches = poisonEngine.findMatches();
poisonEngine.resolvePlayerTurn();
assert.equal(poisonEngine.lastHealing, 1_025);
assert.equal(poisonEngine.lastPoisonDamage, 2_400);
assert.equal(poisonEngine.player.hp, 10_625);

const secondaryAttackEngine = new PuzzleEngine({ seed: 6 });
secondaryAttackEngine.party = [{
  id: 'dual',
  name: 'Dual',
  attribute: 'fire',
  secondaryAttribute: 'water',
  tertiaryAttribute: 'wood',
  attack: 90,
  recovery: 0,
}];
secondaryAttackEngine.enemies[0] = { ...secondaryAttackEngine.enemies[0], attribute: 'light', defense: 0 };
secondaryAttackEngine.enemies[1].hp = 0;
secondaryAttackEngine.comboCount = 2;
secondaryAttackEngine.turnMatches = [
  { type: 'fire', size: 3, enhancedCount: 0 },
  { type: 'water', size: 3, enhancedCount: 0 },
  { type: 'wood', size: 3, enhancedCount: 0 },
];
secondaryAttackEngine.resolvePlayerTurn();
assert.equal(secondaryAttackEngine.lastDamage, 158);
assert.deepEqual(
  secondaryAttackEngine.floatingText.filter(({ kind }) => kind === 'damage').map(({ attribute, value }) => ({ attribute, value })),
  [{ attribute: 'fire', value: 113 }, { attribute: 'wood', value: 7 }, { attribute: 'water', value: 38 }],
);

const attackOrderEngine = new PuzzleEngine({ seed: 11 });
attackOrderEngine.party = [
  { id: 'one', name: 'One', attribute: 'fire', tertiaryAttribute: 'wood', secondaryAttribute: 'water', attack: 90, recovery: 0 },
  { id: 'two', name: 'Two', attribute: 'water', tertiaryAttribute: 'light', secondaryAttribute: 'dark', attack: 90, recovery: 0 },
];
attackOrderEngine.enemies[0] = { ...attackOrderEngine.enemies[0], attribute: 'light', defense: 0 };
attackOrderEngine.enemies[1].hp = 0;
attackOrderEngine.comboCount = 5;
attackOrderEngine.turnMatches = ['fire', 'water', 'wood', 'light', 'dark'].map((type) => ({ type, size: 3, enhancedCount: 0 }));
attackOrderEngine.resolvePlayerTurn();
assert.deepEqual(
  attackOrderEngine.floatingText.filter(({ kind }) => kind === 'damage').map(({ attribute }) => attribute),
  ['fire', 'water', 'wood', 'light', 'water', 'dark'],
);

const retargetEngine = new PuzzleEngine({ seed: 12 });
retargetEngine.party = [
  { id: 'one', name: 'One', attribute: 'fire', attack: 30, recovery: 0 },
  { id: 'two', name: 'Two', attribute: 'fire', attack: 30, recovery: 0 },
];
retargetEngine.enemies[0] = { ...retargetEngine.enemies[0], hp: 10, attribute: 'light', defense: 0 };
retargetEngine.enemies[1] = { ...retargetEngine.enemies[1], hp: 1_000, attribute: 'light', defense: 0 };
retargetEngine.selectEnemy(0);
retargetEngine.comboCount = 1;
retargetEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
retargetEngine.resolvePlayerTurn();
assert.deepEqual(
  retargetEngine.floatingText.filter(({ kind }) => kind === 'damage').map(({ enemy }) => enemy),
  [0, 1],
);
assert.equal(retargetEngine.manualTarget, false);

const autoTargetEngine = new PuzzleEngine({ seed: 13 });
autoTargetEngine.enemies[0] = { ...autoTargetEngine.enemies[0], hp: 10, attribute: 'light', defense: 0 };
autoTargetEngine.enemies[1] = { ...autoTargetEngine.enemies[1], hp: 20, attribute: 'light', defense: 0 };
assert.equal(autoTargetEngine.chooseAttackTarget('fire', 30), 1);
autoTargetEngine.enemies[0] = { ...autoTargetEngine.enemies[0], hp: 1_000, attribute: 'wood', defense: 0 };
autoTargetEngine.enemies[1] = { ...autoTargetEngine.enemies[1], hp: 100, attribute: 'light', defense: 0 };
assert.equal(autoTargetEngine.chooseAttackTarget('fire', 30), 0);

const damageCapEngine = new PuzzleEngine({ seed: 16 });
damageCapEngine.party = [{ id: 'capped', name: 'Capped', attribute: 'fire', attack: 100, recovery: 0, damageCap: 50 }];
damageCapEngine.enemies[0] = { ...damageCapEngine.enemies[0], hp: 1_000, attribute: 'light', defense: 10 };
damageCapEngine.enemies[1].hp = 0;
damageCapEngine.comboCount = 1;
damageCapEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
damageCapEngine.resolvePlayerTurn();
assert.equal(damageCapEngine.lastDamage, 40);
assert.equal(damageCapEngine.enemies[0].hp, 960);
assert.equal(damageCapEngine.snapshot().party[0].damageCap, 50);

const massTargetEngine = new PuzzleEngine({ seed: 15 });
massTargetEngine.party = [{ id: 'mass', name: 'Mass', attribute: 'fire', attack: 100, recovery: 0 }];
massTargetEngine.enemies[0] = { ...massTargetEngine.enemies[0], hp: 10, attribute: 'light', defense: 0 };
massTargetEngine.enemies[1] = { ...massTargetEngine.enemies[1], hp: 1_000, attribute: 'light', defense: 0 };
massTargetEngine.selectEnemy(0);
massTargetEngine.comboCount = 1;
massTargetEngine.turnMatches = [{ type: 'fire', size: 5, enhancedCount: 0 }];
massTargetEngine.resolvePlayerTurn();
assert.equal(massTargetEngine.enemies[0].hp, 0);
assert.equal(massTargetEngine.enemies[1].hp, 850);
assert.equal(massTargetEngine.manualTarget, false);
assert.equal(massTargetEngine.targetEnemy, 1);

const stateEngine = new PuzzleEngine({ seed: 3 });
stateEngine.setBoardFromCodes(['GGGHRD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
stateEngine.setOrbState(0, 0, { enhanced: true, locked: true });
stateEngine.start();
stateEngine.useSkill();
assert.equal(stateEngine.board[0][0].type, 'wood');
assert.equal(stateEngine.board[0][0].enhanced, true);
assert.equal(stateEngine.board[0][0].locked, true);

stateEngine.setBoardFromCodes(['XPMJRD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
stateEngine.setOrbState(0, 0, { enhancementPower: 2.5, locked: false });
assert.equal(stateEngine.board[0][0].enhanced, true);
assert.equal(stateEngine.board[0][0].enhancementPower, 2.5);
stateEngine.setOrbState(0, 0, { locked: true });
assert.equal(stateEngine.board[0][0].enhanced, false);
assert.equal(stateEngine.board[0][0].enhancementPower, 0);
assert.equal(stateEngine.board[0][0].locked, true);
stateEngine.setOrbState(0, 4, { enhancementPower: 1.75 });
assert.equal(stateEngine.board[0][4].enhanced, true);
assert.equal(stateEngine.snapshot().boardState[0][4].enhancementPower, 1.75);

const enhancementPowerEngine = new PuzzleEngine({ seed: 4 });
enhancementPowerEngine.setBoardFromCodes(['RRRHRD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
enhancementPowerEngine.setOrbState(0, 0, { enhancementPower: 2.5 });
enhancementPowerEngine.setOrbState(0, 1, { enhancementPower: 0.25 });
enhancementPowerEngine.setOrbState(0, 2, { enhancementPower: -0.5 });
enhancementPowerEngine.start();
enhancementPowerEngine.phase = 'detect';
enhancementPowerEngine.advancePhase();
const poweredFireMatch = enhancementPowerEngine.turnMatches.find((match) => match.type === 'fire');
assert.equal(enhancementPowerEngine.board[0][2].enhanced, false);
assert.equal(enhancementPowerEngine.board[0][2].enhancementPower, -0.5);
assert.equal(poweredFireMatch.enhancedCount, 2);
assert.equal(poweredFireMatch.enhancementMultiplier, 3.25);
assert.equal(padNativeBaseAttackPower(100, [poweredFireMatch], 1), 325);

const blockPowupEngine = new PuzzleEngine({ seed: 4 });
blockPowupEngine.setBoardFromCodes(['RRRBHD', 'GLDBHG', 'BHGDGL', 'DLGHHB', 'HBGGLD']);
blockPowupEngine.setOrbState(0, 1, { enhancementPower: 0.25 });
blockPowupEngine.setOrbState(0, 2, { enhancementPower: -0.5 });
assert.equal(blockPowupEngine.setBlockPowup('fire', 0.1), 2);
assert.equal(blockPowupEngine.board[0][0].enhancementPower, Math.fround(0.1));
assert.equal(blockPowupEngine.board[0][1].enhancementPower, 0.25);
assert.equal(blockPowupEngine.board[0][2].enhancementPower, Math.fround(0.1));
assert.equal(blockPowupEngine.setBlockPowup(0, 0.1), 2);
assert.equal(blockPowupEngine.setBlockPowup('jammer', 0.1), 0);
assert.equal(blockPowupEngine.setBlockPowup(6, 0.1), 0);

const thornEngine = new PuzzleEngine({ seed: 5 });
thornEngine.setBoardFromCodes(['RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
thornEngine.setOrbState(0, 1, { thornPercent: 4 });
thornEngine.start();
thornEngine.startDrag(0, 0, 50, 50, 0.5, 0.5);
thornEngine.moveDrag(0, 1, 120, 50, 1.5, 0.5);
assert.equal(thornEngine.lastThornDamage, 480);
assert.equal(thornEngine.player.hp, 12_000);
assert.equal(thornEngine.board[0][0].thornPercent, 4);
thornEngine.moveDrag(0, 0, 50, 50, 0.5, 0.5);
assert.equal(thornEngine.lastThornDamage, 960);
assert.equal(thornEngine.player.hp, 12_000);
thornEngine.applyPlayerHpResolution();
assert.equal(thornEngine.player.hp, 11_040);
thornEngine.board[0][2] = thornEngine.createOrb('jammer', { enhanced: true });
thornEngine.setOrbState(0, 2, { thornPercent: 4 });
assert.equal(thornEngine.board[0][2].enhanced, false);

const bombEngine = new PuzzleEngine({ seed: 4 });
bombEngine.setBoardFromCodes(bombBoard.map((row) => row.join('')));
bombEngine.start();
bombEngine.phase = 'detect';
bombEngine.phaseTimer = 0;
bombEngine.advancePhase();
assert.equal(bombEngine.phase, 'bomb');
assert.equal(bombEngine.lastBombDamage, 2_400);
assert.equal(bombEngine.player.hp, 12_000);
assert.equal(bombEngine.pendingBombCells.length, 10);
bombEngine.advancePhase();
assert.equal(bombEngine.phase, 'clear');
bombEngine.applyPlayerHpResolution();
assert.equal(bombEngine.player.hp, 9_600);

const mixedBombEngine = new PuzzleEngine({ seed: 7 });
mixedBombEngine.setBoardFromCodes(['HHHRXD', 'BGLDHR', 'GLDHRB', 'LDHRBG', 'DHRBGL']);
mixedBombEngine.start();
mixedBombEngine.phase = 'detect';
mixedBombEngine.phaseTimer = 0;
mixedBombEngine.advancePhase();
assert.equal(mixedBombEngine.phase, 'bomb');
assert.equal(mixedBombEngine.pendingMatches.length, 1);
assert.equal(mixedBombEngine.pendingBombCells.length, 10);
assert.equal(mixedBombEngine.board.flat().some((orb) => orb === null), false);
mixedBombEngine.advancePhase();
assert.equal(mixedBombEngine.phase, 'clear');
assert.equal(mixedBombEngine.pendingMatches.length, 1);
assert.equal(mixedBombEngine.pendingBombCells.length, 10);
mixedBombEngine.advancePhase();
assert.equal(mixedBombEngine.phase, 'fall');
assert.equal(mixedBombEngine.board[0].every((orb) => orb === null), true);
assert.equal(mixedBombEngine.board.slice(1).every((row) => row[4] === null), true);

const netHpEngine = new PuzzleEngine({ seed: 6 });
netHpEngine.setBoardFromCodes(['HHHRBG', 'BGLDHR', 'GLXHRB', 'LDHRBG', 'DHRBGL']);
netHpEngine.player.hp = 1_000;
netHpEngine.player.recovery = 3_000;
netHpEngine.comboCount = 1;
netHpEngine.turnMatches = netHpEngine.findMatches().map((match) => ({
  type: match.type,
  size: match.size,
  enhancedCount: 0,
  isMassAttack: match.isMassAttack,
}));
netHpEngine.lastBombDamage = 2_400;
netHpEngine.resolvePlayerTurn();
assert.equal(netHpEngine.lastHealing, 3_000);
assert.equal(netHpEngine.player.hp, 1_600);
console.log('PAD orthogonal drag, connected match, and classic multiplier checks passed.');
