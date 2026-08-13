import assert from 'node:assert/strict';
import { PuzzleEngine } from '../src/puzzle/puzzleEngine.js';
import {
  findPadMatches,
  padAttributeMultiplier,
  padComboMultiplier,
  padMatchPower,
  padOrbMatchMultiplier,
  tracePadDragCells,
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
console.log('PAD orthogonal drag, connected match, and classic multiplier checks passed.');
