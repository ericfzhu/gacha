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
  padCreateInitialBoard,
  padCountBlockBits,
  padCountNonPoisonBlocks,
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
  padResolveBitReplacements,
  padResolveBlockSwapPassive,
  padResolveComboDropSpawns,
  padResolveBlockSwapNew,
  padResolveLineBlockSwaps,
  padResolveSkillBoardSwap,
  padRelocateBoardXBits,
  padRelocateBoardYBits,
  padSecondaryAttributeAttack,
  padSelectPoisonBlockCandidates,
  padSelectPoisonBlockTypes,
  padSelectMaskedBlockChanges,
  padShuffleBlockCandidates,
  padShuffleBlockMinusCandidates,
  padShuffleBurDropCandidates,
  padShuffleLockDropCandidates,
  padSpawnNewBlock,
  padSpawnNewBlockInBits,
  padSummarizeDropRates,
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
assert.deepEqual(padSpawnNewBlock(21_900, [], [0, 1, 2, 3, 4, 5]), {
  state: 394_448_415,
  type: 0,
  spawnFlags: 0,
  weighted: false,
  scripted: false,
});
assert.deepEqual(padSummarizeDropRates([0.1, 0.2]), {
  rates: [Math.fround(0.1), Math.fround(0.2), 0, 0, 0, 0, 0, 0, 0, 0],
  total: Math.fround(Math.fround(0.1) + Math.fround(0.2)),
  units: 30_001,
  positiveMask: 0b11,
});
assert.equal(padSummarizeDropRates([1]).units, 100_000);
assert.equal(padSummarizeDropRates([1]).positiveMask, 1);
assert.deepEqual(padSpawnNewBlock(21_900, [0.1], [0, 1, 2, 3, 4, 5]), {
  state: 3_803_934_822,
  type: 0,
  spawnFlags: 0,
  weighted: true,
  scripted: false,
});
assert.equal(padSpawnNewBlock(21_900, [], [0, 1, 2, 3, 4, 5], 1 << 0).type, 1);
assert.deepEqual(padSpawnNewBlock(21_900, [], [0, 1, 2, 3, 4, 5], 0, 7), {
  state: 21_900,
  type: 7,
  spawnFlags: 0,
  weighted: false,
  scripted: true,
});
assert.deepEqual(padSpawnNewBlockInBits(21_900, 0b101010, [0, 1, 2, 3, 4, 5]), {
  state: 394_448_415,
  type: 1,
  usedFaceFallback: false,
});
assert.deepEqual(padResolveComboDropSpawns(21_900, [6, 1], {
  pendingCount: 1,
}), {
  state: 394_448_415,
  marked: [false, true],
  desiredCount: 1,
});
assert.deepEqual(padResolveComboDropSpawns(3_803_934_822, [0, 5], {
  chanceBasisPoints: 5_000,
  remainingCapacity: 2,
}), {
  state: 1_569_558_794,
  marked: [true, true],
  desiredCount: 2,
});
assert.deepEqual(padSpawnNewBlockInBits(394_448_415, (1 << 0) | (1 << 6), [0, 1, 2, 3, 4, 5]), {
  state: 1_929_471_377,
  type: 2,
  usedFaceFallback: true,
});
assert.deepEqual(padSpawnNewBlockInBits(21_900, 0, [0, 1, 2, 3, 4, 5]), {
  state: 3_803_934_822,
  type: 5,
  usedFaceFallback: true,
});
assert.deepEqual(padCreateInitialBoard(12, 1, 3, [], [0, 1, 2, 3, 4, 5]), {
  state: 408_447_505,
  board: [[0, 0, 1]],
});
assert.deepEqual(padCreateInitialBoard(12, 3, 1, [], [0, 1, 2, 3, 4, 5]), {
  state: 408_447_505,
  board: [[0], [0], [1]],
});
assert.deepEqual(padCreateInitialBoard(21_900, 5, 6, [], [0, 1, 2, 3, 4, 5]), {
  state: 79_238_434,
  board: [
    [0, 5, 2, 1, 2, 2],
    [1, 1, 2, 5, 0, 3],
    [3, 4, 1, 0, 5, 0],
    [1, 5, 3, 4, 1, 5],
    [3, 0, 3, 4, 5, 0],
  ],
});
assert.deepEqual(padCreateInitialBoard(21_900, 1, 1, [0.1], [0, 1, 2, 3, 4, 5]), {
  state: 3_803_934_822,
  board: [[0]],
});
assert.deepEqual(padCreateInitialBoard(21_900, 1, 1, [-2, 1], [0, 1, 2, 3, 4, 5]), {
  state: 394_448_415,
  board: [[1]],
});
assert.deepEqual(padShuffleBlockCandidates(21_900, [0, 1, 2, 3, 4, 5]), {
  state: 3_803_934_822,
  candidates: [1, 3, 2, 4, 5, 0],
});
assert.deepEqual(padShuffleBlockCandidates(21_900, ['heart']), {
  state: 3_803_934_822,
  candidates: ['heart'],
});
assert.deepEqual(padShuffleBlockMinusCandidates(21_900, [0, 1, 2, 3, 4]), {
  state: 394_448_415,
  candidates: [3, 0, 4, 2, 1],
});
assert.deepEqual(padShuffleBlockMinusCandidates(21_900, []), {
  state: 394_448_415,
  candidates: [],
});
assert.deepEqual(padShuffleBurDropCandidates(21_900, [0, 1, 2, 3, 4]), {
  state: 394_448_415,
  candidates: [3, 0, 4, 2, 1],
});
assert.deepEqual(padShuffleBurDropCandidates(21_900, []), {
  state: 394_448_415,
  candidates: [],
});
assert.deepEqual(padShuffleLockDropCandidates(21_900, [0, 2, 3]), [2, 3, 0]);
assert.deepEqual(padSelectPoisonBlockCandidates(21_900, [
  [0, 5, 7, 1, 0, 4],
  [2, 8, 4, 5, 6, 2],
  [5, 8, 2, 4, 2, 3],
  [4, 3, 2, 5, 5, 6],
  [5, 6, 2, 2, 3, 4],
], 5, true), {
  state: 4_221_117_678,
  candidates: [
    { row: 4, column: 1 },
    { row: 1, column: 2 },
    { row: 1, column: 4 },
    { row: 1, column: 5 },
    { row: 4, column: 2 },
  ],
});
assert.deepEqual(padSelectPoisonBlockTypes(21_900, [0, 1, 2, 3, 4, 5], [
  [0, 1, 0, 1, 5, 4],
  [2, 3, 4, 5, 6, 2],
], 2), {
  state: 3_803_934_822,
  types: [1, 3],
});
assert.deepEqual(padSelectPoisonBlockTypes(21_900, [0, 1, 2, 3, 4, 5], [[0]], 0), {
  state: 3_803_934_822,
  types: [],
});
assert.deepEqual(padSelectPoisonBlockTypes(21_900, [5], [[5]], 1, true), {
  state: 21_900,
  types: [],
});
const maskedChangeBoard = [
  [0, 1, 0, 1, 5, 4],
  [2, 3, 4, 5, 6, 2],
  [5, 8, 2, 4, 2, 3],
  [4, 3, 2, 5, 5, 6],
  [5, 6, 2, 2, 3, 4],
];
assert.deepEqual(padSelectMaskedBlockChanges(
  21_900,
  maskedChangeBoard,
  2,
  (1 << 6) | (1 << 7),
  (1 << 5) | (1 << 7) | (1 << 8),
), {
  state: 3_803_934_822,
  candidateCount: 23,
  assignments: [
    { row: 3, column: 5, type: 6 },
    { row: 0, column: 3, type: 6 },
    { row: 2, column: 4, type: 7 },
    { row: 0, column: 5, type: 7 },
  ],
  selectedRows: null,
});
assert.deepEqual(padSelectMaskedBlockChanges(
  21_900,
  maskedChangeBoard,
  2,
  (1 << 6) | (1 << 7),
  (1 << 5) | (1 << 7) | (1 << 8),
  true,
), {
  state: 21_900,
  candidateCount: 23,
  assignments: [],
  selectedRows: null,
});
assert.deepEqual(padSelectMaskedBlockChanges(
  21_900,
  maskedChangeBoard,
  2,
  (1 << 6) | (1 << 7),
  0xffff_ffff,
  false,
  [0, 0, 0, 0x20, 0],
), {
  state: 3_803_934_822,
  candidateCount: 29,
  assignments: [
    { row: 2, column: 5, type: 6 },
    { row: 0, column: 3, type: 6 },
    { row: 2, column: 0, type: 7 },
    { row: 4, column: 4, type: 7 },
  ],
  selectedRows: [0x08, 0, 0x21, 0x20, 0x10],
});
assert.equal(padSelectMaskedBlockChanges(21_900, [[0]], 0, 0, 0).state, 3_803_934_822);
assert.equal(padSelectMaskedBlockChanges(21_900, [[0]], -1, 0, 0).state, 3_803_934_822);
assert.equal(padSelectMaskedBlockChanges(21_900, [[0]], 1, 1, 1).state, 3_803_934_822);
assert.equal(padSelectMaskedBlockChanges(21_900, [], 1, 1, 0).state, 3_803_934_822);
assert.equal(padCountBlockBits(maskedChangeBoard, 1 << 5), 6);
assert.equal(padCountBlockBits(maskedChangeBoard, 1 << 7), 1);
assert.equal(padCountBlockBits(maskedChangeBoard, 1 << 8), 1);
assert.equal(padCountBlockBits(maskedChangeBoard, (1 << 7) | (1 << 8)), 1);
assert.equal(padCountBlockBits([[7, 8, 8, 6]], 1 << 7), 3);
assert.equal(padCountBlockBits([[7, 8, 8, 6]], 1 << 8), 2);
assert.equal(padCountBlockBits([[7, 8, 8, 6]], 1 << 6), 1);
assert.equal(padCountBlockBits([[7, 8, 8, 6]], 0), 0);
assert.equal(padCountNonPoisonBlocks(maskedChangeBoard), 29);
assert.equal(padCountNonPoisonBlocks(maskedChangeBoard, true), 23);
assert.deepEqual(padResolveBitReplacements(
  21_900,
  [0b1111],
  [[4, 4, 4, 4]],
  -1,
  [0b0010],
  8,
), {
  state: 1_929_471_377,
  effectFlags: 9,
  assignments: [
    { row: 0, column: 0, type: 0 },
    { row: 0, column: 2, type: 5 },
    { row: 0, column: 3, type: 2 },
  ],
});
assert.deepEqual(padResolveBitReplacements(21_900, [0b101], [[0, 1, 2]], 7, null, 4), {
  state: 21_900,
  effectFlags: 6,
  assignments: [
    { row: 0, column: 0, type: 7 },
    { row: 0, column: 2, type: 7 },
  ],
});
assert.deepEqual(padResolveBitReplacements(21_900, [0b1], [[0]], 6), {
  state: 21_900,
  effectFlags: 4,
  assignments: [{ row: 0, column: 0, type: 6 }],
});
assert.deepEqual(padResolveBlockSwapNew(
  21_900,
  [1, 2],
  [[0, 0, 0, 0]],
  1,
  [0b0010],
  8,
), {
  state: 1_569_558_794,
  effectFlags: 9,
  assignments: [
    { row: 0, column: 0, type: 2 },
    { row: 0, column: 2, type: 2 },
    { row: 0, column: 3, type: 1 },
  ],
  effectiveSourceMask: 0x181,
});
assert.deepEqual(padResolveBlockSwapNew(
  21_900,
  [0, 1],
  [[7, 8, 6, 0]],
  0,
  [0b0010],
  4,
), {
  state: 919_597_584,
  effectFlags: 5,
  assignments: [{ row: 0, column: 0, type: 0 }],
  effectiveSourceMask: 0x180,
});
const balancedSwap = padResolveBlockSwapNew(
  21_900,
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  Array.from({ length: 5 }, () => Array(6).fill(0)),
  1,
);
assert.equal(balancedSwap.state, 3_099_008_172);
assert.equal(balancedSwap.effectFlags, 7);
assert.deepEqual(Array.from({ length: 10 }, (_, type) => (
  balancedSwap.assignments.filter((assignment) => assignment.type === type).length
)), Array(10).fill(3));
assert.equal(padRelocateBoardXBits(0b101000, 7), 0b1010000);
assert.equal(padRelocateBoardXBits(0b101000, 6), 0b101000);
assert.equal(padRelocateBoardXBits(0b101000, 5), 0b10100);
assert.equal(padRelocateBoardYBits(0b10100, 6), 0b101000);
assert.equal(padRelocateBoardYBits(0b10100, 5), 0b10100);
assert.equal(padRelocateBoardYBits(0b10100, 4), 0b01100);
const lineSwapBoard = Array.from({ length: 5 }, () => Array(6).fill(4));
assert.deepEqual(padResolveLineBlockSwaps(
  21_900,
  0b1001,
  (1 << 0) | (1 << 5),
  lineSwapBoard,
  'vertical',
  [0, 0, 0b1000, 0, 0],
  8,
), {
  state: 4_221_117_678,
  effectFlags: 9,
  assignments: [
    { row: 0, column: 0, type: 0 },
    { row: 0, column: 3, type: 5 },
    { row: 1, column: 0, type: 0 },
    { row: 1, column: 3, type: 0 },
    { row: 2, column: 0, type: 0 },
    { row: 3, column: 0, type: 0 },
    { row: 3, column: 3, type: 0 },
    { row: 4, column: 0, type: 0 },
    { row: 4, column: 3, type: 5 },
  ],
  relocatedMask: 0b1001,
});
const horizontalLineSwap = padResolveLineBlockSwaps(
  21_900,
  0b10001,
  (1 << 6) | (1 << 7),
  lineSwapBoard,
  'horizontal',
  [0b1, 0, 0, 0, 0],
  1,
);
assert.equal(horizontalLineSwap.state, 2_782_038_744);
assert.equal(horizontalLineSwap.effectFlags, 7);
assert.equal(horizontalLineSwap.assignments.length, 11);
assert.ok(horizontalLineSwap.assignments.every(({ row }) => row === 0 || row === 4));
assert.deepEqual(padResolveLineBlockSwaps(21_900, 0, 1, [[0]], 'vertical', null, 7), {
  state: 21_900, effectFlags: 0, assignments: [], relocatedMask: 0,
});

const poisonPassiveFlag = { poisonResist: true };
assert.deepEqual(padResolveBlockSwapPassive([
  { row: 0, column: 0, type: 7 },
  { row: 0, column: 1, type: 8 },
], 4, poisonPassiveFlag), {
  assignments: [],
  effectFlags: 4,
  blockFlag: 0x0b,
});
assert.equal(poisonPassiveFlag.byte, 0x0b);
const jammerPassiveFlag = { jammerResist: true };
assert.deepEqual(padResolveBlockSwapPassive([
  { row: 0, column: 0, type: 6 },
  { row: 0, column: 1, type: 6 },
], 2, jammerPassiveFlag), {
  assignments: [],
  effectFlags: 2,
  blockFlag: 0xb0,
});
assert.equal(jammerPassiveFlag.byte, 0xb0);
const checkedPassiveFlag = {};
assert.deepEqual(padResolveBlockSwapPassive([
  { row: 0, column: 0, type: 7 },
  { row: 0, column: 1, type: 6 },
], 0, checkedPassiveFlag), {
  assignments: [
    { row: 0, column: 0, type: 7 },
    { row: 0, column: 1, type: 6 },
  ],
  effectFlags: 6,
  blockFlag: 0x88,
});
assert.equal(checkedPassiveFlag.byte, 0x88);
assert.deepEqual(padResolveBlockSwapPassive(
  [{ row: 0, column: 0, type: 1 }],
  0,
  { jammerResist: true, poisonResist: true },
), {
  assignments: [{ row: 0, column: 0, type: 1 }],
  effectFlags: 1,
  blockFlag: 0,
});
const skillBoardSwap = padResolveSkillBoardSwap(
  21_900,
  [0, 1, 2, -1, 9],
  Array.from({ length: 5 }, () => Array(6).fill(9)),
  [1, 0, 0, 0, 0],
);
assert.equal(skillBoardSwap.state, 4_172_709_003);
assert.equal(skillBoardSwap.assignments.length, 29);
assert.deepEqual(skillBoardSwap.distribution, [
  0, 2, 0, 0, 0, 1, 1, 0, 2, 0, 2, 2, 0, 1, 2,
  0, 0, 2, 0, 2, 1, 1, 1, 2, 0, 1, 1, 0, 1, 0,
]);
assert.deepEqual(Array.from({ length: 3 }, (_, type) => (
  skillBoardSwap.distribution.filter((value) => value === type).length
)), [13, 9, 8]);
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

const skyfallEngine = new PuzzleEngine({ seed: 21_900 });
skyfallEngine.setBoardFromCodes(Array(5).fill('DDDDDD'));
skyfallEngine.setRngState(21_900);
skyfallEngine.board[0][0] = null;
skyfallEngine.collapseAndRefill();
assert.equal(skyfallEngine.board[0][0].type, 'fire');
assert.equal(skyfallEngine.rng.state, 394_448_415);
assert.deepEqual(skyfallEngine.snapshot().dropRates, Array(10).fill(0));
assert.equal(skyfallEngine.snapshot().skyfallExclusionMask, 0);
const weightedSkyfallEngine = new PuzzleEngine({ seed: 21_900, dropRates: [0.1] });
weightedSkyfallEngine.setBoardFromCodes(Array(5).fill('DDDDDD'));
weightedSkyfallEngine.setRngState(21_900);
weightedSkyfallEngine.board[0][0] = null;
weightedSkyfallEngine.collapseAndRefill();
assert.equal(weightedSkyfallEngine.board[0][0].type, 'fire');
assert.equal(weightedSkyfallEngine.rng.state, 3_803_934_822);
const excludedSkyfallEngine = new PuzzleEngine({ seed: 21_900, skyfallExclusionMask: 1 << 0 });
excludedSkyfallEngine.setBoardFromCodes(Array(5).fill('DDDDDD'));
excludedSkyfallEngine.setRngState(21_900);
excludedSkyfallEngine.board[0][0] = null;
excludedSkyfallEngine.collapseAndRefill();
assert.equal(excludedSkyfallEngine.board[0][0].type, 'water');
assert.equal(excludedSkyfallEngine.rng.state, 394_448_415);
const orderedSkyfallEngine = new PuzzleEngine({ seed: 21_900 });
orderedSkyfallEngine.setBoardFromCodes(Array(5).fill('DDDDDD'));
orderedSkyfallEngine.setRngState(21_900);
orderedSkyfallEngine.board[1][0] = null;
orderedSkyfallEngine.board[3][0] = null;
orderedSkyfallEngine.collapseAndRefill();
assert.deepEqual(orderedSkyfallEngine.board.map((row) => row[0].type), [
  'fire', 'heart', 'dark', 'dark', 'dark',
]);
assert.equal(orderedSkyfallEngine.rng.state, 3_803_934_822);
const comboDropSkyfallEngine = new PuzzleEngine({ seed: 21_900 });
comboDropSkyfallEngine.setBoardFromCodes(Array(5).fill('DDDDDD'));
comboDropSkyfallEngine.setRngState(21_900);
comboDropSkyfallEngine.pendingComboDrops = 2;
comboDropSkyfallEngine.board[1][0] = null;
comboDropSkyfallEngine.board[3][0] = null;
comboDropSkyfallEngine.collapseAndRefill();
assert.deepEqual(comboDropSkyfallEngine.board.slice(0, 2).map((row) => (
  row[0].blockFlags & 0x8000
)), [0x8000, 0x8000]);
assert.equal(comboDropSkyfallEngine.pendingComboDrops, 0);
assert.equal(comboDropSkyfallEngine.rng.state, 919_597_584);

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
assert.equal(blockPowupEngine.hasBlockPowup('fire'), true);
assert.equal(blockPowupEngine.setBlockPowup('fire', 0.1), 2);
assert.equal(blockPowupEngine.board[0][0].enhancementPower, Math.fround(0.1));
assert.equal(blockPowupEngine.board[0][1].enhancementPower, 0.25);
assert.equal(blockPowupEngine.board[0][2].enhancementPower, Math.fround(0.1));
assert.equal(blockPowupEngine.setBlockPowup(0, 0.1), 2);
assert.equal(blockPowupEngine.hasBlockPowup(0), false);
assert.equal(blockPowupEngine.hasBlockPowup('water'), true);
assert.equal(blockPowupEngine.hasBlockPowup(6), true);
assert.equal(blockPowupEngine.hasBlockPowup(-1), true);
assert.equal(blockPowupEngine.setBlockPowup('jammer', 0.1), 0);
assert.equal(blockPowupEngine.setBlockPowup(6, 0.1), 0);

const blockMinusEngine = new PuzzleEngine({ seed: 4 });
blockMinusEngine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
const blockMinusStartState = blockMinusEngine.rng.state;
assert.equal(blockMinusEngine.doBlockMinus(false, 0b11, 0.2), 4);
assert.equal(blockMinusEngine.rng.state, blockMinusStartState);
assert.equal(blockMinusEngine.board[0].filter((orb) => orb.enhancementPower < 0).length, 0);
blockMinusEngine.setOrbState(0, 2, { enhancementPower: -0.5 });
assert.equal(blockMinusEngine.doBlockMinus(true, 0b11, 0.2, 2), 2);
assert.equal(blockMinusEngine.rng.state, padLcgStep(blockMinusStartState).state);
assert.equal(blockMinusEngine.board[0].filter((orb) => orb.enhancementPower < 0).length, 3);
assert.equal(blockMinusEngine.doBlockMinus(true, 0b11, 0.1), 1);
assert.equal(blockMinusEngine.board[0].filter((orb) => orb.enhancementPower < 0).length, 4);

const burDropEngine = new PuzzleEngine({ seed: 21_900 });
burDropEngine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
const burDropStartState = burDropEngine.rng.state;
assert.equal(burDropEngine.doMakeBurDrop(true, 0b11, 0, 4), 0);
assert.equal(burDropEngine.rng.state, burDropStartState);
assert.equal(burDropEngine.doMakeBurDrop(false, 0b11, 2, 4), 2);
assert.equal(burDropEngine.rng.state, padLcgStep(burDropStartState).state);
assert.equal(burDropEngine.board[0].filter((orb) => orb.thornActive).length, 0);
assert.equal(burDropEngine.doMakeBurDrop(true, 0b11, 2, 4), 2);
assert.equal(burDropEngine.rng.state, padLcgStep(padLcgStep(burDropStartState).state).state);
assert.equal(burDropEngine.board[0].filter((orb) => orb.thornActive).length, 2);
assert.deepEqual(
  burDropEngine.board[0].filter((orb) => orb.thornActive).map((orb) => [orb.thornDescriptor, orb.thornPercent]),
  [[0x84, 4], [0x84, 4]],
);
assert.equal(burDropEngine.doMakeBurDrop(true, 0b11, 10, 5, true), 2);
assert.equal(burDropEngine.board[0].filter((orb) => orb.thornActive).length, 4);
assert.deepEqual(
  burDropEngine.board[0].filter((orb) => orb.thornDescriptor === 5).map((orb) => orb.thornPercent),
  [5, 5],
);
const noBurDropCandidatesState = burDropEngine.rng.state;
assert.equal(burDropEngine.doMakeBurDrop(true, 0b11, 1, 6), 0);
assert.equal(burDropEngine.rng.state, padLcgStep(noBurDropCandidatesState).state);

const lockDropEngine = new PuzzleEngine({ seed: 7 });
lockDropEngine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
lockDropEngine.setOrbState(0, 1, { locked: true });
lockDropEngine.setOrbState(0, 2, { enhancementPower: 0.25 });
const lockDropRngState = lockDropEngine.rng.state;
assert.equal(lockDropEngine.doLockDropBits(0b11, 0, 21_900), true);
assert.equal(lockDropEngine.board[0].filter((orb) => orb.locked).length, 1);
assert.equal(lockDropEngine.doLockDropBits(0b11, 2, 21_900), true);
assert.equal(lockDropEngine.rng.state, lockDropRngState);
assert.equal(lockDropEngine.board[0][2].locked, true);
assert.equal(lockDropEngine.board[0][2].enhancementPower, 0.25);
assert.equal(lockDropEngine.board[0][3].locked, true);
assert.equal(lockDropEngine.board[0].filter((orb) => orb.locked).length, 3);
assert.equal(lockDropEngine.doLockDropBits(0b11, 10, 0), true);
assert.equal(lockDropEngine.doLockDropBits(0b11, 10, 0), false);

const specialLockEngine = new PuzzleEngine({ seed: 8 });
specialLockEngine.setBoardFromCodes(['JPMXHD', 'GLDHRG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
for (let column = 0; column < 4; column += 1) {
  specialLockEngine.setOrbState(0, column, { blockFlags: 0x28000, enhancementPower: 0.5 });
}

const poisonBlockEngine = new PuzzleEngine({ seed: 21_900 });
poisonBlockEngine.setBoardFromCodes(['RHPBRD', 'GMDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
poisonBlockEngine.setRngState(21_900);
poisonBlockEngine.setOrbState(4, 1, { locked: true });
assert.equal(poisonBlockEngine.doPoisonBlockN(7, 5, true), 4);
assert.equal(poisonBlockEngine.rng.state, 4_221_117_678);
assert.equal(poisonBlockEngine.board[4][1].type, 'jammer');
for (const [row, column] of [[1, 2], [1, 4], [1, 5], [4, 2]]) {
  assert.equal(poisonBlockEngine.board[row][column].type, 'poison');
}
const poisonZeroState = poisonBlockEngine.rng.state;
assert.equal(poisonBlockEngine.doPoisonBlockN('mortalPoison', 0), 0);
assert.equal(poisonBlockEngine.rng.state, poisonZeroState);
assert.equal(poisonBlockEngine.doPoisonBlockN('bomb', 2), 0);
assert.equal(poisonBlockEngine.rng.state, poisonZeroState);

const poisonBlocksEngine = new PuzzleEngine({ seed: 21_900 });
poisonBlocksEngine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
poisonBlocksEngine.setRngState(21_900);
poisonBlocksEngine.setOrbState(0, 1, { locked: true });
assert.equal(poisonBlocksEngine.doPoisonBlocks(7, 2), 5);
assert.equal(poisonBlocksEngine.rng.state, 3_803_934_822);
assert.equal(poisonBlocksEngine.board[0][1].type, 'water');
assert.equal(poisonBlocksEngine.board.flat().filter((orb) => orb.type === 'poison').length, 5);
const poisonBlocksZeroState = poisonBlocksEngine.rng.state;
assert.equal(poisonBlocksEngine.doPoisonBlocks('mortalPoison', 0), 0);
assert.equal(poisonBlocksEngine.rng.state, padShuffleBlockCandidates(poisonBlocksZeroState, [0]).state);
poisonBlocksEngine.setFaceTypes([5]);
const poisonBlocksNoCandidateState = poisonBlocksEngine.rng.state;
assert.equal(poisonBlocksEngine.doPoisonBlocks(8, 1, true), 0);
assert.equal(poisonBlocksEngine.rng.state, poisonBlocksNoCandidateState);

const maskedChangeEngine = new PuzzleEngine({ seed: 21_900 });
maskedChangeEngine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
maskedChangeEngine.setRngState(21_900);
maskedChangeEngine.setOrbState(0, 3, { locked: true });
maskedChangeEngine.setOrbState(3, 5, { enhancementPower: 0.5, blockFlags: 0x80000 });
const maskedDryState = maskedChangeEngine.rng.state;
assert.equal(maskedChangeEngine.doPoisonBlockN2(
  2,
  (1 << 6) | (1 << 7),
  (1 << 5) | (1 << 7) | (1 << 8),
  true,
), 23);
assert.equal(maskedChangeEngine.rng.state, maskedDryState);
assert.equal(maskedChangeEngine.doPoisonBlockN2(
  2,
  (1 << 6) | (1 << 7),
  (1 << 5) | (1 << 7) | (1 << 8),
  false,
  false,
), 4);
assert.equal(maskedChangeEngine.rng.state, 3_803_934_822);
assert.equal(maskedChangeEngine.board[3][5].type, 'jammer');
assert.equal(maskedChangeEngine.board[3][5].enhancementPower, 0);
assert.equal(maskedChangeEngine.board[3][5].blockFlags & 0x80000, 0x80000);
assert.equal(maskedChangeEngine.board[0][3].type, 'water');
assert.equal(maskedChangeEngine.board[2][4].type, 'poison');
assert.equal(maskedChangeEngine.board[0][5].type, 'poison');

const mappedChangeEngine = new PuzzleEngine({ seed: 21_900 });
mappedChangeEngine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
mappedChangeEngine.setRngState(21_900);
const selectedRows = new Uint16Array(5);
assert.equal(mappedChangeEngine.doPoisonBlockN2(2, 0xc0, 0xffff_ffff, false, true, selectedRows), 4);
assert.deepEqual([...selectedRows], [0x08, 0, 0x21, 0, 0x08]);
assert.equal(mappedChangeEngine.board[2][5].type, 'jammer');
assert.equal(mappedChangeEngine.board[0][3].type, 'jammer');
assert.equal(mappedChangeEngine.board[2][0].type, 'poison');
assert.equal(mappedChangeEngine.board[4][3].type, 'poison');

const naturalMaskedChangeEngine = new PuzzleEngine({ seed: 21_900 });
naturalMaskedChangeEngine.setBoardFromCodes(['RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD']);
naturalMaskedChangeEngine.setRngState(21_900);
naturalMaskedChangeEngine.setOrbState(2, 5, { enhancementPower: 0.5 });
assert.equal(naturalMaskedChangeEngine.doPoisonBlockN2(1, 1, 0), 1);
assert.equal(naturalMaskedChangeEngine.board[2][5].type, 'fire');
assert.equal(naturalMaskedChangeEngine.board[2][5].enhancementPower, 0.5);
const blockCountEngine = new PuzzleEngine({ seed: 21_900 });
blockCountEngine.setBoardFromCodes(['JPMXHD', 'GLDHRG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
blockCountEngine.setOrbState(0, 1, { locked: true });
assert.equal(blockCountEngine.countBlockBits(1 << 7), 2);
assert.equal(blockCountEngine.countBlockBits(1 << 8), 1);
assert.equal(blockCountEngine.countBlockBits(1 << 9), 1);
assert.equal(blockCountEngine.countNonPoisonBlocks(), 28);
assert.equal(blockCountEngine.countNonPoisonBlocks(true), 22);
const bitReplaceEngine = new PuzzleEngine({ seed: 21_900 });
bitReplaceEngine.setBoardFromCodes(['DDDDHD', 'GLDHRG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
bitReplaceEngine.setRngState(21_900);
bitReplaceEngine.setOrbState(0, 1, { locked: true });
bitReplaceEngine.setOrbState(0, 2, { enhancementPower: 0.5 });
assert.equal(bitReplaceEngine.doBitReplace([0b1111, 0, 0, 0, 0], -1, 8), 9);
assert.equal(bitReplaceEngine.rng.state, 1_929_471_377);
assert.deepEqual(bitReplaceEngine.board[0].slice(0, 4).map((orb) => orb.type), [
  'fire', 'dark', 'heart', 'wood',
]);
assert.equal(bitReplaceEngine.board[0][2].enhancementPower, 0.5);
bitReplaceEngine.setOrbState(0, 0, { blockFlags: 0xa8000, enhancementPower: 0.5 });
assert.equal(bitReplaceEngine.doBitReplace([0b11, 0, 0, 0, 0], 7, 4), 6);
assert.equal(bitReplaceEngine.rng.state, 1_929_471_377);
assert.equal(bitReplaceEngine.board[0][0].type, 'poison');
assert.equal(bitReplaceEngine.board[0][0].blockFlags, 0x80000);
assert.equal(bitReplaceEngine.board[0][0].enhancementPower, 0);
assert.equal(bitReplaceEngine.board[0][1].type, 'dark');
const blockSwapEngine = new PuzzleEngine({ seed: 21_900 });
blockSwapEngine.setBoardFromCodes(['RRRRHD', 'GLDHJG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
blockSwapEngine.setRngState(21_900);
blockSwapEngine.setOrbState(0, 1, { locked: true });
assert.equal(blockSwapEngine.doBlockSwap5(1, (1 << 1) | (1 << 2)), 1);
assert.equal(blockSwapEngine.rng.state, 1_569_558_794);
assert.deepEqual(blockSwapEngine.board[0].slice(0, 4).map((orb) => orb.type), [
  'wood', 'fire', 'wood', 'water',
]);
const poisonSwapEngine = new PuzzleEngine({ seed: 21_900 });
poisonSwapEngine.setBoardFromCodes(['PMJGHD', 'GLDHRG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
poisonSwapEngine.setRngState(21_900);
poisonSwapEngine.setOrbState(0, 1, { locked: true });
assert.equal(poisonSwapEngine.doBlockSwap4((1 << 0) | (1 << 1), 4), 5);
assert.equal(poisonSwapEngine.rng.state, 919_597_584);
assert.equal(poisonSwapEngine.board[0][0].type, 'fire');
assert.equal(poisonSwapEngine.board[0][1].type, 'mortalPoison');
poisonSwapEngine.setBoardFromCodes(['PMJGHD', 'GLDHRG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
poisonSwapEngine.setRngState(21_900);
poisonSwapEngine.setOrbState(0, 1, { locked: true });
assert.equal(poisonSwapEngine.doBlockSwap2(2, 3, -1, 9, 4), 5);
assert.equal(poisonSwapEngine.rng.state, 919_597_584);
assert.equal(poisonSwapEngine.board[0][0].type, 'wood');
assert.equal(poisonSwapEngine.board[0][1].type, 'mortalPoison');
poisonSwapEngine.setBoardFromCodes(['PMJGHD', 'GLDHRG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
poisonSwapEngine.setRngState(21_900);
assert.equal(poisonSwapEngine.doBlockSwap2(2, 2), 1);
assert.equal(poisonSwapEngine.board[0][0].type, 'wood');
assert.equal(poisonSwapEngine.board[0][1].type, 'wood');
const skillSwapEngine = new PuzzleEngine({ seed: 21_900 });
skillSwapEngine.setBoardFromCodes(Array(5).fill('XXXXXX'));
skillSwapEngine.setRngState(21_900);
skillSwapEngine.setOrbState(0, 0, { locked: true });
skillSwapEngine.setOrbState(0, 1, { enhancementPower: 0.5 });
assert.equal(skillSwapEngine.doBlockSwap3({ types: [0, 1, 2, -1, 9] }), 29);
assert.equal(skillSwapEngine.rng.state, 4_172_709_003);
assert.equal(skillSwapEngine.board[0][0].type, 'bomb');
assert.equal(skillSwapEngine.board[0][1].type, 'wood');
assert.equal(skillSwapEngine.board[0][1].enhancementPower, 0.5);
assert.deepEqual(['fire', 'water', 'wood', 'bomb'].map((type) => (
  skillSwapEngine.board.flat().filter((orb) => orb.type === type).length
)), [12, 9, 8, 1]);
const lineSwapEngine = new PuzzleEngine({ seed: 21_900 });
lineSwapEngine.setBoardFromCodes(['DDDDHD', 'GLDHRG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
lineSwapEngine.setRngState(21_900);
lineSwapEngine.setOrbState(2, 3, { locked: true });
assert.equal(lineSwapEngine.doBlockSwapV(0b1001, (1 << 0) | (1 << 5), 8), 9);
assert.equal(lineSwapEngine.rng.state, 4_221_117_678);
assert.equal(lineSwapEngine.board[0][0].type, 'fire');
assert.equal(lineSwapEngine.board[0][3].type, 'heart');
assert.equal(lineSwapEngine.board[2][3].type, 'dark');
lineSwapEngine.setBoardFromCodes(['DDDDHD', 'GLDHRG', 'HBGDGL', 'DLGHHB', 'HBGGLD']);
lineSwapEngine.setRngState(21_900);
lineSwapEngine.setOrbState(0, 0, { locked: true });
assert.equal(lineSwapEngine.doBlockSwapH(0b10001, (1 << 6) | (1 << 7), 1), 7);
assert.equal(lineSwapEngine.rng.state, 2_782_038_744);
assert.equal(lineSwapEngine.board[0][0].type, 'dark');
assert.equal(lineSwapEngine.board[0][1].type, 'poison');
assert.equal(lineSwapEngine.board[4][0].type, 'jammer');
assert.equal(lineSwapEngine.doBlockSwapV(0, 1 << 0, 7, { jammerResist: true }), 0);

const passiveSwapEngine = new PuzzleEngine({ seed: 21_900 });
passiveSwapEngine.setBoardFromCodes(Array(5).fill('DDDDDD'));
passiveSwapEngine.setRngState(21_900);
const passiveBlockFlag = { poisonResist: true, jammerResist: true };
assert.equal(passiveSwapEngine.doBitReplace([0b11, 0, 0, 0, 0], 7, 4, passiveBlockFlag), 4);
assert.deepEqual(passiveSwapEngine.board[0].slice(0, 2).map((orb) => orb.type), ['dark', 'dark']);
assert.equal(passiveSwapEngine.rng.state, 21_900);
assert.equal(passiveBlockFlag.byte, 0x0b);
assert.equal(passiveSwapEngine.doBitReplace([0b11, 0, 0, 0, 0], 6, 2, passiveBlockFlag), 2);
assert.deepEqual(passiveSwapEngine.board[0].slice(0, 2).map((orb) => orb.type), ['dark', 'dark']);
assert.equal(passiveSwapEngine.rng.state, 21_900);
assert.equal(passiveBlockFlag.byte, 0xbb);
const linePassiveFlag = { poisonResist: true };
assert.equal(passiveSwapEngine.doBlockSwapV(1, 1 << 7, 8, linePassiveFlag), 8);
assert.deepEqual(passiveSwapEngine.board.map((row) => row[0].type), Array(5).fill('dark'));
let passiveLineExpectedState = 21_900;
for (let index = 0; index < 5; index += 1) passiveLineExpectedState = padLcgStep(passiveLineExpectedState).state;
assert.equal(passiveSwapEngine.rng.state, passiveLineExpectedState);
assert.equal(linePassiveFlag.byte, 0x0b);
assert.equal(specialLockEngine.doLockDropBits(0x3c0, 4, 0xbeef), true);
for (let column = 0; column < 4; column += 1) {
  const orb = specialLockEngine.board[0][column];
  assert.equal(orb.locked, true);
  assert.equal(orb.blockFlags & 0x800, 0x800);
  assert.equal(orb.blockFlags & 0x28000, 0);
  assert.equal(orb.enhancementPower, 0);
}

const thornEngine = new PuzzleEngine({ seed: 5 });
thornEngine.setBoardFromCodes(['RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD']);
thornEngine.setOrbState(0, 1, { thornPercent: 4 });
thornEngine.start();
thornEngine.startDrag(0, 0, 50, 50, 0.5, 0.5);
thornEngine.moveDrag(0, 1, 120, 50, 1.5, 0.5);
assert.equal(thornEngine.lastThornDamage, 480);
assert.equal(thornEngine.player.hp, 12_000);
assert.equal(thornEngine.board[0][0].thornPercent, 4);
assert.equal(thornEngine.board[0][0].thornActive, true);
assert.equal(thornEngine.board[0][0].thornDescriptor, 4);
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
