import assert from 'node:assert/strict';
import { PuzzleEngine } from '../src/puzzle/puzzleEngine.js';
import {
  findPadMatches,
  findPadBombDetonations,
  padApplyAttackMultipliers,
  padAttributeMultiplier,
  padBombDamage,
  padComboMultiplier,
  padDamageAfterDefense,
  padEnhancedOrbMultiplier,
  padMatchPower,
  padNativeBaseAttackPower,
  padOrbMatchMultiplier,
  padPoisonDamage,
  padThornDamage,
  tracePadDragCells,
  tracePadPointerCells,
} from '../src/puzzle/padCoreRules.js';

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
assert.equal(padMatchPower(1000, [3, 5]), 2500);
assert.equal(padNativeBaseAttackPower(101, [3, 4], 2), 285);
assert.equal(padApplyAttackMultipliers(285, [1.5, 1.5]), 642);
assert.equal(padDamageAfterDefense(101, 0.5, 40), 11);
assert.equal(padDamageAfterDefense(10, 0.5, 999), 1);
assert.equal(padEnhancedOrbMultiplier(3), 1.18);
assert.equal(padNativeBaseAttackPower(100, [{ size: 3, enhancedCount: 3 }], 1), 118);
assert.equal(padPoisonDamage(10_000, [3], []), 2_000);
assert.equal(padPoisonDamage(10_000, [4], [3]), 7_500);
assert.equal(padPoisonDamage(10_001, [3, 3], []), 4_002);
assert.equal(padPoisonDamage(10_001, [], [3]), 5_001);
assert.equal(padBombDamage(10_001, 2), 4_002);
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
poisonEngine.setBoardFromCodes(['PPPBGH', 'HHHLDB', 'BGHRDL', 'DLGRHB', 'HRBGLD']);
poisonEngine.player.hp = poisonEngine.player.maxHp;
poisonEngine.comboCount = 2;
poisonEngine.turnMatches = poisonEngine.findMatches();
poisonEngine.resolvePlayerTurn();
assert.equal(poisonEngine.lastHealing, 1_025);
assert.equal(poisonEngine.lastPoisonDamage, 2_400);
assert.equal(poisonEngine.player.hp, 10_625);

const stateEngine = new PuzzleEngine({ seed: 3 });
stateEngine.setBoardFromCodes(['GGGHRD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
stateEngine.setOrbState(0, 0, { enhanced: true, locked: true });
stateEngine.start();
stateEngine.useSkill();
assert.equal(stateEngine.board[0][0].type, 'wood');
assert.equal(stateEngine.board[0][0].enhanced, true);
assert.equal(stateEngine.board[0][0].locked, true);

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
