import assert from 'node:assert/strict';
import { PuzzleEngine } from '../src/puzzle/puzzleEngine.js';
import {
  findPadMatches,
  padApplyAttackMultipliers,
  padAttributeMultiplier,
  padComboMultiplier,
  padDamageAfterDefense,
  padEnhancedOrbMultiplier,
  padMatchPower,
  padNativeBaseAttackPower,
  padOrbMatchMultiplier,
  padPoisonDamage,
  tracePadDragCells,
  tracePadPointerCells,
} from '../src/puzzle/padCoreRules.js';

assert.deepEqual(tracePadDragCells(0, 0, 1, 1), [{ row: 0, column: 1 }, { row: 1, column: 1 }]);
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
assert.equal(padAttributeMultiplier('fire', 'wood'), 2);
assert.equal(padAttributeMultiplier('fire', 'water'), 0.5);
assert.equal(padAttributeMultiplier('light', 'dark'), 2);
assert.equal(padAttributeMultiplier('light', 'fire'), 1);

const engine = new PuzzleEngine({ seed: 1 });
engine.setBoardFromCodes(['RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
engine.start();
assert.equal(engine.startDrag(0, 0, 50, 50), true);
assert.equal(engine.moveDrag(1, 1, 120, 120), true);
assert.equal(engine.drag.pathLength, 2);
assert.deepEqual(engine.snapshot().board.slice(0, 2), ['BLGHLD', 'GRDBHR']);

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
console.log('PAD orthogonal drag, connected match, and classic multiplier checks passed.');
