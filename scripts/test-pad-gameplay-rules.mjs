import assert from 'node:assert/strict';
import { PuzzleEngine } from '../src/puzzle/puzzleEngine.js';
import {
  PAD_ENEMY_SKILL_SOURCE_ORB_CONVERSION,
  PAD_ENEMY_SKILL_ENTIRE_BLIND,
  PAD_ENEMY_SKILL_ENTIRE_BLIND_ALT,
  PAD_ENEMY_SKILL_BIND_ATTACK,
  PAD_ENEMY_SKILL_RANDOM_SUB_BIND,
  PAD_ENEMY_SKILL_CLEAR_PLAYER_BUFFS,
  PAD_ENEMY_SKILL_HEAL_ENEMY,
  PAD_ENEMY_SKILL_HEAL_ENEMY_UNCONDITIONAL,
  PAD_ENEMY_SKILL_DAMAGE_ABSORB,
  PAD_ENEMY_SKILL_AWAKENING_BIND,
  PAD_ENEMY_SKILL_SKILL_DELAY,
  PAD_ENEMY_SKILL_PRESENCE_CHECK,
  PAD_ENEMY_SKILL_MASKED_RANDOM_ORB_CHANGE,
  PAD_ENEMY_SKILL_NATIVE_NO_EFFECT,
  PAD_ENEMY_SKILL_LOCK_RANDOM_ORBS,
  PAD_ENEMY_SKILL_ENEMY_ESCAPE,
  PAD_ENEMY_SKILL_LOCKED_SKYFALL,
  PAD_ENEMY_SKILL_STICKY_BLIND_RANDOM,
  PAD_ENEMY_SKILL_STICKY_BLIND_FIXED,
  PAD_ENEMY_SKILL_ORB_SEAL_COLUMNS,
  PAD_ENEMY_SKILL_ORB_SEAL_ROWS,
  PAD_ENEMY_SKILL_FIXED_START,
  PAD_ENEMY_SKILL_RANDOM_BOMBS,
  PAD_ENEMY_SKILL_FIXED_BOMBS,
  PAD_ENEMY_SKILL_CLOUD,
  PAD_ENEMY_SKILL_RECOVERY_DEBUFF,
  PAD_ENEMY_SKILL_TURN_CHANGE,
  PAD_ENEMY_SKILL_ATTRIBUTE_BLOCK,
  PAD_ENEMY_SKILL_ATTACK_ORB_CHANGE,
  PAD_ENEMY_SKILL_RANDOM_SPINNERS,
  PAD_ENEMY_SKILL_FIXED_SPINNERS,
  PAD_ENEMY_SKILL_MAX_HP_CHANGE,
  PAD_ENEMY_SKILL_FIXED_TARGET,
  PAD_ENEMY_SKILL_BOARD_SIZE_CHANGE,
  PAD_ENEMY_SKILL_BRANCH_COMBO,
  PAD_ENEMY_SKILL_BRANCH_ATTACK_ATTRIBUTES,
  PAD_ENEMY_SKILL_BRANCH_SKILL_USE,
  PAD_ENEMY_SKILL_BRANCH_DAMAGE,
  PAD_ENEMY_SKILL_BRANCH_ERASED_ATTRIBUTES,
  PAD_ENEMY_SKILL_TYPE_RESIST,
  PAD_ENEMY_SKILL_DAMAGE_IMMUNITY,
  PAD_ENEMY_SKILL_DAMAGE_IMMUNITY_ALT,
  PAD_ENEMY_SKILL_BRANCH_REMAINING_ENEMIES,
  PAD_ENEMY_SKILL_DAMAGE_IMMUNITY_OFF,
  PAD_ENEMY_SKILL_REMAINING_ENEMIES_TURN_CHANGE,
  PAD_ENEMY_SKILL_NO_SKYFALL,
  PAD_ENEMY_SKILL_ADDITIONAL_ATTACK,
  PAD_ENEMY_SKILL_DEFENSE_BOOST,
  PAD_ENEMY_SKILL_ATTRIBUTE_NULLIFY,
  PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY,
  PAD_ENEMY_SKILL_SOURCE_TO_JAMMER,
  PAD_ENEMY_SKILL_ACTIVE_SKILL_SEAL,
  PAD_ENEMY_SKILL_REPEAT_ATTACK,
  PAD_ENEMY_SKILL_INACTIVITY,
  PAD_ENEMY_SKILL_INACTIVITY_UNCONDITIONAL,
  PAD_ENEMY_SKILL_COMBO_ABSORB,
  PAD_ENEMY_SKILL_SKYFALL_RATE,
  PAD_ENEMY_SKILL_DEATH_CRY,
  PAD_ENEMY_SKILL_INACTIVITY_PRESENTATION,
  PAD_ENEMY_SKILL_DAMAGE_VOID,
  PAD_ENEMY_SKILL_ATTRIBUTE_RESIST,
  PAD_ENEMY_SKILL_RESOLVE,
  PAD_ENEMY_SKILL_DAMAGE_SHIELD,
  PAD_ENEMY_SKILL_LEADER_SWAP,
  PAD_ENEMY_SKILL_LEADER_ALTER,
  PAD_ENEMY_SKILL_NORMAL_ATTACK,
  PAD_ENEMY_SKILL_MULTI_ATTACK,
  PAD_ENEMY_SKILL_LONE_ATTACK_BOOST,
  PAD_ENEMY_SKILL_STATUS_TRIGGERED_ATTACK_BOOST,
  PAD_ENEMY_SKILL_DAMAGED_TURN_ATTACK_BOOST,
  PAD_ENEMY_SKILL_STATUS_SHIELD,
  PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION,
  PAD_ENEMY_SKILL_SELF_DESTRUCT,
  PAD_ENEMY_SKILL_CHANGE_ATTRIBUTE,
  PAD_ENEMY_SKILL_SCALED_ATTACK,
  PAD_ENEMY_SKILL_ORB_CHANGE_ATTACK,
  PAD_ENEMY_SKILL_CURRENT_HP_GRAVITY,
  PAD_ENEMY_SKILL_REVIVE_ENEMY,
  PAD_ENEMY_SKILL_ATTRIBUTE_ABSORB,
  PAD_ENEMY_SKILL_BIND_LEADER_HELPER,
  PAD_ENEMY_SKILL_HEAL_PLAYER,
  PAD_ENEMY_SKILL_BLACK_FALL,
  PAD_ENEMY_SKILL_SOURCE_TO_POISON,
  PAD_ENEMY_SKILL_SOURCE_TO_MORTAL_POISON,
  PAD_ENEMY_SKILL_POISON_BLOCKS,
  PAD_ENEMY_SKILL_MORTAL_POISON_BLOCKS,
  PAD_ENEMY_SKILL_POISON_BLOCK_N_COUNTED,
  PAD_ENEMY_SKILL_MORTAL_POISON_BLOCK_N_COUNTED,
  PAD_ENEMY_SKILL_POISON_BLOCK_N,
  PAD_ENEMY_SKILL_HORIZONTAL_LINES,
  PAD_ENEMY_SKILL_HORIZONTAL_LINES_4,
  PAD_ENEMY_SKILL_VERTICAL_LINES,
  PAD_ENEMY_SKILL_VERTICAL_LINES_4,
  PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP,
  PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP_DIRECT,
  PAD_ENEMY_SKILL_POISON_MASK_SWAP,
  PAD_ENEMY_SKILL_POISON_MASK_SWAP_DIRECT,
  PAD_ENEMY_SKILL_BLOCK_MINUS,
  PAD_ENEMY_SKILL_BUR_DROP,
  decodePadEnemySkillDefinition,
  decodePadEnemySkillRuntime,
  padEnemySkillAttack,
  padEnemySkillAdditionalAttack,
  padEnemySkillAttributeNullifyMask,
  padEnemySkillBoostedAttack,
  padEnemySkillAttributeCandidates,
  padEnemySkillCurrentHpGravity,
  padEnemySkillEnemyHeal,
  padEnemySkillDefenseBoost,
  padEnemySkillMoveTimeSeconds,
  padEnemySkillPlayerHeal,
  padEnemySkillPlayerHpCondition,
  padEnemySkillReviveHp,
  padEnemyTurnChangeTriggered,
  padEnemyRemainingEnemiesTurnChangeTriggered,
  padEnemySkillMaxHpParameter,
  padEnemySkillChangedMaxHp,
} from '../src/puzzle/padEnemySkills.js';
import {
  decodePadEnemyAiMonsterDefinition,
  decodePadEnemyAiSkillDefinition,
  selectPadEnemyAiLegacy,
  selectPadEnemyAiNew,
} from '../src/puzzle/padEnemyAi.js';
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
  padEnemyAttributeResistDamage,
  padEnemyDamageAfterShields,
  padEnemyTypeResistRatio,
  padEnemyResolveThresholdHp,
  padEnhancementPowerMultiplier,
  padEnhancedOrbMultiplier,
  padGetRandomBlock,
  padGetRandomBlockOnFace,
  padMatchPower,
  padNativeBaseAttackPower,
  padNativeRecoveryPower,
  padNailDamage,
  padOrbMatchMultiplier,
  padPoisonDamage,
  padResolveBlackFall,
  padResolveBitReplacements,
  padResolveBlockSwapPassive,
  padResolveComboDropAwakenings,
  padResolveComboDropSpawns,
  padResolveEnhancementFall,
  padResolveLockFall,
  padResolveNailFall,
  padResolveThornFall,
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
assert.deepEqual(padResolveComboDropAwakenings([
  { type: 'fire', size: 10 },
  { type: 'water', size: 12 },
  { type: 'heart', size: 30 },
], [3, 3, 9, 9, 9]), {
  pendingCount: 6,
  bonusCombos: 4,
});
assert.deepEqual(padResolveThornFall(21_900, 0, {
  active: true,
  typeMask: 1 << 0,
  chancePercent: 100,
  descriptor: 4,
  descriptorHighBit: true,
}, 0x8000), {
  state: 394_448_415,
  blockFlags: 0x88000,
  thornDescriptor: 0x84,
  clearEnhancement: false,
  applied: true,
  attempts: 1,
});
assert.deepEqual(padResolveThornFall(21_900, 1, {
  active: true,
  typeMask: 1 << 0,
  chancePercent: 100,
  descriptor: 4,
}), {
  state: 394_448_415,
  blockFlags: 0,
  thornDescriptor: 0,
  clearEnhancement: false,
  applied: false,
  attempts: 1,
});
assert.deepEqual(padResolveThornFall(21_900, 6, {
  active: true,
  typeMask: 0,
  chancePercent: 100,
  descriptor: 5,
}, 0x28000), {
  state: 394_448_415,
  blockFlags: 0x80000,
  thornDescriptor: 5,
  clearEnhancement: true,
  applied: true,
  attempts: 1,
});
assert.deepEqual(padResolveNailFall(21_900, 0, {
  active: true,
  chancePercent: 10,
}, 0x8000), {
  state: 394_448_415,
  blockFlags: 0x28000,
  applied: true,
  attempts: 1,
});
assert.deepEqual(padResolveNailFall(21_900, 0, {
  active: true,
  chancePercent: 9,
}), {
  state: 394_448_415,
  blockFlags: 0,
  applied: false,
  attempts: 1,
});
assert.deepEqual(padResolveNailFall(21_900, 6, {
  active: true,
  chancePercent: 100,
}), {
  state: 21_900,
  blockFlags: 0,
  applied: false,
  attempts: 0,
});
assert.deepEqual(padResolveBlackFall(21_900, 0, null, 0x8000), {
  state: 21_900,
  blockFlags: 0x8000,
  blindCountdown: 0,
  blindFresh: false,
  clearEnhancement: false,
  applied: false,
  attempts: 0,
});
assert.deepEqual(padResolveBlackFall(21_900, 0, {
  active: true,
  chanceBasisPoints: 10_000,
}), {
  state: 394_448_415,
  blockFlags: 0x11000,
  blindCountdown: 1,
  blindFresh: true,
  clearEnhancement: false,
  applied: true,
  attempts: 1,
});
assert.deepEqual(padResolveBlackFall(21_900, 6, {
  active: true,
  chanceBasisPoints: 10_000,
}, 0x28000), {
  state: 394_448_415,
  blockFlags: 0x11000,
  blindCountdown: 1,
  blindFresh: true,
  clearEnhancement: true,
  applied: true,
  attempts: 1,
});
assert.deepEqual(padResolveBlackFall(21_900, 0, {
  active: true,
  chanceBasisPoints: 0,
  skipInitialCountdown: false,
}), {
  state: 394_448_415,
  blockFlags: 0,
  blindCountdown: 0,
  blindFresh: false,
  clearEnhancement: false,
  applied: false,
  attempts: 1,
});
const blackFallSkillDefinition = new Uint8Array(6);
new DataView(blackFallSkillDefinition.buffer).setInt16(4, PAD_ENEMY_SKILL_BLACK_FALL, true);
const blackFallMonsterRuntime = new Uint8Array(0x680);
const blackFallMonsterView = new DataView(blackFallMonsterRuntime.buffer);
blackFallMonsterView.setUint16(0x678, 3, true);
blackFallMonsterView.setUint32(0x67c, 7_500, true);
assert.deepEqual(decodePadEnemySkillRuntime(blackFallSkillDefinition, blackFallMonsterRuntime), {
  type: 128,
  kind: 'blackFall',
  supported: true,
  durationTurns: 3,
  chanceBasisPoints: 7_500,
  packedDuration: 3,
  rawChance: 7_500,
});
const noSkyfallSkillDefinition = new Uint8Array(0x48);
const noSkyfallSkillView = new DataView(noSkyfallSkillDefinition.buffer);
noSkyfallSkillView.setInt16(0x04, PAD_ENEMY_SKILL_NO_SKYFALL, true);
noSkyfallSkillView.setInt32(0x10, 0x1234, true);
noSkyfallSkillView.setInt32(0x14, 3, true);
noSkyfallSkillView.setInt32(0x44, 0, true);
assert.deepEqual(decodePadEnemySkillDefinition(noSkyfallSkillDefinition), {
  type: PAD_ENEMY_SKILL_NO_SKYFALL,
  kind: 'noSkyfall',
  supported: true,
  nativeParameter0: 0x1234,
  durationTurns: 3,
  nativeStatusOffset: 0x7754,
  attackWithSkillValue: 0,
});
assert.deepEqual(decodePadEnemySkillRuntime(
  noSkyfallSkillDefinition,
  new Uint8Array(0x680),
), {
  type: PAD_ENEMY_SKILL_NO_SKYFALL,
  kind: 'noSkyfall',
  supported: true,
  nativeParameter0: 0x1234,
  durationTurns: 3,
  nativeStatusOffset: 0x7754,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const boardSizeSkillDefinition = new Uint8Array(0x48);
const boardSizeSkillView = new DataView(boardSizeSkillDefinition.buffer);
boardSizeSkillView.setInt16(0x04, PAD_ENEMY_SKILL_BOARD_SIZE_CHANGE, true);
boardSizeSkillView.setInt32(0x10, 7, true);
boardSizeSkillView.setInt32(0x14, 2, true);
boardSizeSkillView.setInt32(0x18, 99, true);
boardSizeSkillView.setInt32(0x44, 125, true);
const boardSizeMonsterRuntime = new Uint8Array(0x684);
const boardSizeMonsterView = new DataView(boardSizeMonsterRuntime.buffer);
boardSizeMonsterView.setInt32(0x678, 9, true);
boardSizeMonsterView.setInt32(0x67c, 2, true);
boardSizeMonsterView.setInt32(0x680, 99, true);
assert.deepEqual(decodePadEnemySkillDefinition(boardSizeSkillDefinition), {
  type: PAD_ENEMY_SKILL_BOARD_SIZE_CHANGE,
  kind: 'boardSizeChange',
  supported: true,
  durationTurns: 7,
  boardSizeSelector: 2,
  columns: 5,
  rows: 4,
  boardSizeCode: 0x45,
  attackWithSkillValue: 125,
});
assert.deepEqual(decodePadEnemySkillRuntime(boardSizeSkillDefinition, boardSizeMonsterRuntime), {
  type: PAD_ENEMY_SKILL_BOARD_SIZE_CHANGE,
  kind: 'boardSizeChange',
  supported: true,
  durationTurns: 9,
  boardSizeSelector: 2,
  columns: 5,
  rows: 4,
  boardSizeCode: 0x45,
  setupMaterialized: true,
  attackWithSkillValue: 125,
});
new DataView(blackFallSkillDefinition.buffer).setInt16(4, PAD_ENEMY_SKILL_BLACK_FALL, true);
const authoredBlackFallDefinition = new Uint8Array(0x48);
const authoredBlackFallView = new DataView(authoredBlackFallDefinition.buffer);
authoredBlackFallView.setInt16(0x04, PAD_ENEMY_SKILL_BLACK_FALL, true);
authoredBlackFallView.setInt32(0x10, 3, true);
authoredBlackFallView.setInt32(0x14, 75, true);
assert.deepEqual(decodePadEnemySkillDefinition(authoredBlackFallDefinition), {
  type: 128,
  kind: 'blackFall',
  supported: true,
  durationTurns: 3,
  chanceBasisPoints: 7_500,
  packedDuration: 3,
  rawChance: 7_500,
  definitionDuration: 3,
  definitionChancePercent: 75,
  attackWithSkillValue: 0,
});
authoredBlackFallView.setInt32(0x14, 0, true);
assert.equal(decodePadEnemySkillDefinition(authoredBlackFallDefinition).chanceBasisPoints, 10_000);
authoredBlackFallView.setInt32(0x14, 75, true);
assert.equal(padEnemySkillAttack(1_850, 50), 925);
assert.equal(padEnemySkillAttack(10_000_001, 33), 3_300_001);
assert.equal(padEnemySkillAttack(1_850, 0), 0);
assert.equal(padEnemySkillPlayerHeal(12_000, 50), 6_000);
assert.equal(padEnemySkillPlayerHeal(12_000, -50), -6_000);
assert.equal(padEnemySkillPlayerHeal(0x7fffffff, 200), 0x7fffffff);
assert.equal(padEnemySkillPlayerHpCondition(3_059, 12_000, 25), true);
assert.equal(padEnemySkillPlayerHpCondition(3_060, 12_000, 25), false);
assert.equal(padEnemySkillReviveHp(76_001, 50), 38_001);
assert.equal(padEnemySkillReviveHp(76_000, 37), 28_120);
assert.equal(padEnemySkillCurrentHpGravity(12_000, 25), 3_000);
assert.equal(padEnemySkillCurrentHpGravity(12_000, 100), 12_000);
assert.equal(padEnemySkillCurrentHpGravity(16_777_219, 33), 5_536_483);
assert.equal(padEnemySkillCurrentHpGravity(12_000, -25), 0);
assert.equal(padEnemySkillEnemyHeal(92_000, 23), 21_160);
assert.equal(padEnemySkillAdditionalAttack(1_850, 127), 2_350);
authoredBlackFallView.setInt32(0x44, 0, true);

const enemyAiMonsterDefinition = new Uint8Array(0x2ec);
const enemyAiMonsterView = new DataView(enemyAiMonsterDefinition.buffer);
enemyAiMonsterView.setUint8(0xe0, 1);
enemyAiMonsterView.setInt16(0xe2, 100, true);
enemyAiMonsterView.setInt16(0xe4, 10, true);
enemyAiMonsterView.setUint32(0xec, 9_001, true);
enemyAiMonsterView.setUint8(0xf0, 100);
const enemyAiBlackFallDefinition = authoredBlackFallDefinition.slice();
const enemyAiBlackFallView = new DataView(enemyAiBlackFallDefinition.buffer);
enemyAiBlackFallView.setUint32(0x00, 9_001, true);
enemyAiBlackFallView.setInt32(0x30, 10_000, true);
enemyAiBlackFallView.setInt32(0x34, 1_000, true);
enemyAiBlackFallView.setInt32(0x38, 100, true);
enemyAiBlackFallView.setInt32(0x40, 20, true);
enemyAiBlackFallView.setInt32(0x44, 50, true);
const decodedEnemyAiMonster = decodePadEnemyAiMonsterDefinition(enemyAiMonsterDefinition);
const decodedEnemyAiSkill = decodePadEnemyAiSkillDefinition(enemyAiBlackFallDefinition);
assert.deepEqual(decodedEnemyAiMonster.slots, [{
  index: 0,
  skillId: 9_001,
  immediateChance: 100,
  fallbackWeight: 0,
}]);
assert.deepEqual({
  usesNewAi: decodedEnemyAiMonster.usesNewAi,
  budgetCap: decodedEnemyAiMonster.budgetCap,
  budgetRegen: decodedEnemyAiMonster.budgetRegen,
}, { usesNewAi: true, budgetCap: 100, budgetRegen: 10 });
assert.deepEqual({
  skillId: decodedEnemyAiSkill.skillId,
  immediateFactor0: decodedEnemyAiSkill.immediateFactor0,
  immediateFactor1: decodedEnemyAiSkill.immediateFactor1,
  hpThresholdPercent: decodedEnemyAiSkill.hpThresholdPercent,
  budgetCost: decodedEnemyAiSkill.budgetCost,
}, {
  skillId: 9_001,
  immediateFactor0: 10_000,
  immediateFactor1: 1_000,
  hpThresholdPercent: 100,
  budgetCost: 20,
});
const selectedEnemyAi = selectPadEnemyAiNew(
  decodedEnemyAiMonster,
  [decodedEnemyAiSkill],
  { currentHp: 92_000, maxHp: 92_000, aiBudget: 100, rngState: 21_900 },
);
assert.equal(selectedEnemyAi.skillId, 9_001);
assert.equal(selectedEnemyAi.effect.attackWithSkillValue, 50);
assert.equal(selectedEnemyAi.rngState, 394_448_415);
assert.equal(selectedEnemyAi.aiBudget, 80);
const inactiveEnemyAi = selectPadEnemyAiNew(
  decodedEnemyAiMonster,
  [decodedEnemyAiSkill],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    blackFallActive: true,
    rngState: 21_900,
  },
);
assert.equal(inactiveEnemyAi.skillId, null);
assert.equal(inactiveEnemyAi.rngState, 21_900);
assert.equal(inactiveEnemyAi.aiBudget, 100);
const weightedEnemyAiMonsterDefinition = enemyAiMonsterDefinition.slice();
const weightedEnemyAiMonsterView = new DataView(weightedEnemyAiMonsterDefinition.buffer);
weightedEnemyAiMonsterView.setUint8(0xf0, 0);
weightedEnemyAiMonsterView.setUint8(0xf1, 1);
const weightedEnemyAiMonster = decodePadEnemyAiMonsterDefinition(weightedEnemyAiMonsterDefinition);
const weightedEnemyAi = selectPadEnemyAiNew(
  weightedEnemyAiMonster,
  [decodedEnemyAiSkill],
  { currentHp: 92_000, maxHp: 92_000, aiBudget: 100, rngState: 21_900 },
);
assert.equal(weightedEnemyAi.skillId, 9_001);
assert.equal(weightedEnemyAi.rngState, 394_448_415);
const blockedWeightedEnemyAi = selectPadEnemyAiNew(
  weightedEnemyAiMonster,
  [decodedEnemyAiSkill],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    blackFallActive: true,
    rngState: 21_900,
  },
);
assert.equal(blockedWeightedEnemyAi.skillId, null);
assert.equal(blockedWeightedEnemyAi.rngState, 394_448_415);
const legacyEnemyAiMonsterDefinition = enemyAiMonsterDefinition.slice();
const legacyEnemyAiMonsterView = new DataView(legacyEnemyAiMonsterDefinition.buffer);
legacyEnemyAiMonsterView.setUint8(0xe0, 0);
legacyEnemyAiMonsterView.setInt16(0xe6, 100, true);
const legacyEnemyAiSkillDefinition = enemyAiBlackFallDefinition.slice();
const legacyEnemyAiSkillView = new DataView(legacyEnemyAiSkillDefinition.buffer);
// Native legacy _chooseEnemyAi masks +0x3c with 0x3fff and uses bit 0x4000
// as the ratio polarity.  The test supplies the recovered +0x7c0 baseline so
// the ordinary branch is deterministic rather than relying on its browser
// current-HP fallback.
legacyEnemyAiSkillView.setInt32(0x3c, 1_000, true);
const decodedLegacyEnemyAiMonster = decodePadEnemyAiMonsterDefinition(
  legacyEnemyAiMonsterDefinition,
);
const decodedLegacyEnemyAiSkill = decodePadEnemyAiSkillDefinition(legacyEnemyAiSkillDefinition);
assert.equal(decodedLegacyEnemyAiMonster.usesNewAi, false);
assert.equal(decodedLegacyEnemyAiSkill.legacyConditionValue, 1_000);
assert.equal(decodedLegacyEnemyAiSkill.legacyConditionMode, false);
const selectedLegacyEnemyAi = selectPadEnemyAiLegacy(
  decodedLegacyEnemyAiMonster,
  [decodedLegacyEnemyAiSkill],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    rngState: 21_900,
    legacyConditionBase: 1_000_000,
  },
);
assert.equal(selectedLegacyEnemyAi.skillId, 9_001);
assert.equal(selectedLegacyEnemyAi.effect.attackWithSkillValue, 50);
assert.equal(selectedLegacyEnemyAi.rngState, 394_448_415);
assert.equal(selectedLegacyEnemyAi.aiBudget, 80);
const legacyClearPlayerBuffsDefinition = legacyEnemyAiSkillDefinition.slice();
new DataView(legacyClearPlayerBuffsDefinition.buffer).setInt16(
  0x04,
  PAD_ENEMY_SKILL_CLEAR_PLAYER_BUFFS,
  true,
);
const selectedLegacyClearPlayerBuffs = selectPadEnemyAiLegacy(
  decodedLegacyEnemyAiMonster,
  [decodePadEnemyAiSkillDefinition(legacyClearPlayerBuffsDefinition)],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    rngState: 21_900,
    legacyConditionBase: 1_000_000,
    clearableBuffCount: 2,
  },
);
assert.equal(selectedLegacyClearPlayerBuffs.skillId, 9_001);
assert.equal(selectedLegacyClearPlayerBuffs.fidelity, 'legacy-ordinary-recovered');
const approximatedLegacyClearPlayerBuffs = selectPadEnemyAiLegacy(
  decodedLegacyEnemyAiMonster,
  [decodePadEnemyAiSkillDefinition(legacyClearPlayerBuffsDefinition)],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    rngState: 21_900,
    legacyConditionBase: 1_000_000,
    playerAuxiliaryBuffTurns: 1,
  },
);
assert.equal(approximatedLegacyClearPlayerBuffs.skillId, 9_001);
assert.equal(approximatedLegacyClearPlayerBuffs.legacyCallbackApproximation, true);
assert.deepEqual(approximatedLegacyClearPlayerBuffs.approximateCallbackTypes, [6]);
assert.equal(approximatedLegacyClearPlayerBuffs.fidelity, 'legacy-ordinary-approximate');
const invertedLegacyEnemyAiSkillDefinition = legacyEnemyAiSkillDefinition.slice();
const invertedLegacyEnemyAiSkillView = new DataView(invertedLegacyEnemyAiSkillDefinition.buffer);
// Use the recovered preserve-incoming callback (types 9–11) so the polarity
// bit is observable in the final immediate probability.  Black-fall/type-128
// uses the constant-one callback and would intentionally ignore this scale.
invertedLegacyEnemyAiSkillView.setInt16(0x04, 9, true);
invertedLegacyEnemyAiSkillView.setInt32(0x18, 75, true);
invertedLegacyEnemyAiSkillView.setInt32(0x3c, 0x4000 | 1_000, true);
const invertedLegacyEnemyAi = selectPadEnemyAiLegacy(
  decodedLegacyEnemyAiMonster,
  [decodePadEnemyAiSkillDefinition(invertedLegacyEnemyAiSkillDefinition)],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    rngState: 21_900,
    legacyConditionBase: 1_000_000,
  },
);
assert.equal(invertedLegacyEnemyAi.skillId, null);
assert.equal(invertedLegacyEnemyAi.rngState, 394_448_415);
const inferredLegacyEnemyAi = selectPadEnemyAiLegacy(
  decodedLegacyEnemyAiMonster,
  [decodedLegacyEnemyAiSkill],
  { currentHp: 92_000, maxHp: 92_000, aiBudget: 100, rngState: 21_900 },
);
assert.equal(inferredLegacyEnemyAi.skillId, 9_001);
assert.equal(inferredLegacyEnemyAi.legacyConditionApproximation, true);
const legacyFirstUseSkillDefinition = legacyEnemyAiSkillDefinition.slice();
const legacyFirstUseSkillView = new DataView(legacyFirstUseSkillDefinition.buffer);
legacyFirstUseSkillView.setInt16(0x04, 47, true);
// Type 47 bypasses the authored HP threshold but still requires the budget
// gate. Its native callback is one only while +0x6c0 is zero.
legacyFirstUseSkillView.setInt32(0x38, 0, true);
const firstUseLegacyEnemyAi = selectPadEnemyAiLegacy(
  decodedLegacyEnemyAiMonster,
  [decodePadEnemyAiSkillDefinition(legacyFirstUseSkillDefinition)],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    rngState: 21_900,
    enemyAiUseCount: 0,
    legacyConditionBase: 1_000_000,
  },
);
assert.equal(firstUseLegacyEnemyAi.skillId, 9_001);
assert.equal(firstUseLegacyEnemyAi.rngState, 394_448_415);
const laterUseLegacyEnemyAi = selectPadEnemyAiLegacy(
  decodedLegacyEnemyAiMonster,
  [decodePadEnemyAiSkillDefinition(legacyFirstUseSkillDefinition)],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    rngState: 21_900,
    enemyAiUseCount: 1,
    legacyConditionBase: 1_000_000,
  },
);
assert.equal(laterUseLegacyEnemyAi.skillId, null);
assert.equal(laterUseLegacyEnemyAi.rngState, 21_900);
const legacyFallbackMonsterDefinition = legacyEnemyAiMonsterDefinition.slice();
const legacyFallbackMonsterView = new DataView(legacyFallbackMonsterDefinition.buffer);
legacyFallbackMonsterView.setUint32(0xec, 9_002, true);
legacyFallbackMonsterView.setUint8(0xf0, 0);
legacyFallbackMonsterView.setUint8(0xf1, 1);
const legacyFallbackType50Definition = enemyAiBlackFallDefinition.slice();
const legacyFallbackType50View = new DataView(legacyFallbackType50Definition.buffer);
legacyFallbackType50View.setUint32(0x00, 9_002, true);
legacyFallbackType50View.setInt16(0x04, 50, true);
legacyFallbackType50View.setInt32(0x10, 3, true);
legacyFallbackType50View.setInt32(0x40, 20, true);
const decodedLegacyFallbackMonster = decodePadEnemyAiMonsterDefinition(
  legacyFallbackMonsterDefinition,
);
const decodedLegacyFallbackType50 = decodePadEnemyAiSkillDefinition(
  legacyFallbackType50Definition,
);
const selectedLegacyFallback = selectPadEnemyAiLegacy(
  decodedLegacyFallbackMonster,
  [decodedLegacyFallbackType50],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    rngState: 21_900,
  },
);
assert.equal(selectedLegacyFallback.skillId, 9_002);
assert.equal(selectedLegacyFallback.effect.kind, 'currentHpGravity');
assert.equal(selectedLegacyFallback.rngState, 394_448_415);
assert.equal(selectedLegacyFallback.aiBudget, 80);
assert.equal(selectedLegacyFallback.fidelity, 'legacy-fallback-recovered');
assert.equal(selectedLegacyFallback.legacyFallbackSelected, true);
assert.equal(selectedLegacyFallback.legacyFallbackScale, 1);
assert.equal(selectedLegacyFallback.legacyFallbackProbability, 10_000);
// Type 48 has a dedicated legacy fallback gate: a positive source type must
// be represented on the live board, while a negative source enters the native
// random-source path and bypasses that count check. The fallback pass still
// consumes its ordinary 0..9999 roll before applying the strict comparison.
const legacyFallbackOrbChangeDefinition = legacyFallbackType50Definition.slice();
const legacyFallbackOrbChangeView = new DataView(legacyFallbackOrbChangeDefinition.buffer);
legacyFallbackOrbChangeView.setUint32(0x00, 9_048, true);
legacyFallbackOrbChangeView.setInt16(0x04, PAD_ENEMY_SKILL_ORB_CHANGE_ATTACK, true);
legacyFallbackOrbChangeView.setInt32(0x10, 150, true);
legacyFallbackOrbChangeView.setInt32(0x14, 1, true);
legacyFallbackOrbChangeView.setInt32(0x18, 2, true);
const decodedLegacyFallbackOrbChange = decodePadEnemyAiSkillDefinition(
  legacyFallbackOrbChangeDefinition,
);
const legacyFallbackOrbChangeMonsterDefinition = legacyFallbackMonsterDefinition.slice();
new DataView(legacyFallbackOrbChangeMonsterDefinition.buffer).setUint32(0xec, 9_048, true);
const decodedLegacyFallbackOrbChangeMonster = decodePadEnemyAiMonsterDefinition(
  legacyFallbackOrbChangeMonsterDefinition,
);
const selectedLegacyFallbackOrbChange = selectPadEnemyAiLegacy(
  decodedLegacyFallbackOrbChangeMonster,
  [decodedLegacyFallbackOrbChange],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    rngState: 21_900,
    boardTypeCounts: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  },
);
assert.equal(selectedLegacyFallbackOrbChange.skillId, 9_048);
assert.equal(selectedLegacyFallbackOrbChange.effect.kind, 'orbChangeAttack');
assert.equal(selectedLegacyFallbackOrbChange.effect.sourceType, 1);
assert.equal(selectedLegacyFallbackOrbChange.effect.destinationType, 2);
assert.equal(selectedLegacyFallbackOrbChange.legacyFallbackType, PAD_ENEMY_SKILL_ORB_CHANGE_ATTACK);
assert.equal(selectedLegacyFallbackOrbChange.legacyFallbackScale, 1);
assert.equal(selectedLegacyFallbackOrbChange.legacyFallbackProbability, 10_000);
assert.equal(selectedLegacyFallbackOrbChange.legacyFallbackApproximation, undefined);
assert.equal(selectedLegacyFallbackOrbChange.fidelity, 'legacy-fallback-recovered');
assert.equal(selectedLegacyFallbackOrbChange.rngState, 394_448_415);
const rejectedLegacyFallbackOrbChange = selectPadEnemyAiLegacy(
  decodedLegacyFallbackOrbChangeMonster,
  [decodedLegacyFallbackOrbChange],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    rngState: 21_900,
    boardTypeCounts: Array(10).fill(0),
  },
);
assert.equal(rejectedLegacyFallbackOrbChange.skillId, null);
assert.equal(rejectedLegacyFallbackOrbChange.legacyFallbackScale, undefined);
assert.equal(rejectedLegacyFallbackOrbChange.legacyFallbackApproximation, undefined);
assert.equal(rejectedLegacyFallbackOrbChange.legacyFallbackTypes.includes(48), true);
assert.equal(rejectedLegacyFallbackOrbChange.rngState, 394_448_415);
assert.equal(rejectedLegacyFallbackOrbChange.fidelity, 'legacy-fallback-no-selection');
const missingLegacyFallbackOrbChange = selectPadEnemyAiLegacy(
  decodedLegacyFallbackOrbChangeMonster,
  [decodedLegacyFallbackOrbChange],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    rngState: 21_900,
  },
);
assert.equal(missingLegacyFallbackOrbChange.skillId, 9_048);
assert.equal(missingLegacyFallbackOrbChange.legacyFallbackScale, 1);
assert.equal(missingLegacyFallbackOrbChange.legacyFallbackApproximation, true);
assert.deepEqual(missingLegacyFallbackOrbChange.approximateFallbackTypes, [48]);
assert.equal(missingLegacyFallbackOrbChange.fidelity, 'legacy-fallback-approximate');
const randomSourceLegacyFallbackOrbChangeDefinition = legacyFallbackOrbChangeDefinition.slice();
new DataView(randomSourceLegacyFallbackOrbChangeDefinition.buffer).setInt32(0x14, -1, true);
const randomSourceLegacyFallbackOrbChange = selectPadEnemyAiLegacy(
  decodedLegacyFallbackOrbChangeMonster,
  [decodePadEnemyAiSkillDefinition(randomSourceLegacyFallbackOrbChangeDefinition)],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    rngState: 21_900,
  },
);
assert.equal(randomSourceLegacyFallbackOrbChange.skillId, 9_048);
assert.equal(randomSourceLegacyFallbackOrbChange.legacyFallbackScale, 1);
assert.equal(randomSourceLegacyFallbackOrbChange.legacyFallbackApproximation, undefined);
assert.equal(randomSourceLegacyFallbackOrbChange.fidelity, 'legacy-fallback-recovered');
assert.equal(randomSourceLegacyFallbackOrbChange.rngState, 394_448_415);
// Type 82 is not handled by the dedicated 0x61ee9c constant-one routine in
// the legacy jump table. Its entry branches directly to the common fallback
// epilogue at 0x61f08c, which receives the pass's initialized scale of one.
const legacyFallbackCommonOneDefinition = legacyFallbackType50Definition.slice();
const legacyFallbackCommonOneView = new DataView(legacyFallbackCommonOneDefinition.buffer);
legacyFallbackCommonOneView.setUint32(0x00, 9_012, true);
legacyFallbackCommonOneView.setInt16(0x04, PAD_ENEMY_SKILL_NORMAL_ATTACK, true);
legacyFallbackCommonOneView.setInt32(0x44, 50, true);
const legacyFallbackCommonOneMonsterDefinition = legacyFallbackMonsterDefinition.slice();
new DataView(legacyFallbackCommonOneMonsterDefinition.buffer).setUint32(0xec, 9_012, true);
const selectedLegacyFallbackCommonOne = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackCommonOneMonsterDefinition),
  [decodePadEnemyAiSkillDefinition(legacyFallbackCommonOneDefinition)],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    rngState: 21_900,
  },
);
assert.equal(selectedLegacyFallbackCommonOne.skillId, 9_012);
assert.equal(selectedLegacyFallbackCommonOne.effect.kind, 'normalAttack');
assert.equal(selectedLegacyFallbackCommonOne.legacyFallbackType, PAD_ENEMY_SKILL_NORMAL_ATTACK);
assert.equal(selectedLegacyFallbackCommonOne.legacyFallbackScale, 1);
assert.equal(selectedLegacyFallbackCommonOne.legacyFallbackProbability, 10_000);
assert.equal(selectedLegacyFallbackCommonOne.legacyFallbackApproximation, undefined);
assert.equal(selectedLegacyFallbackCommonOne.fidelity, 'legacy-fallback-recovered');
assert.equal(selectedLegacyFallbackCommonOne.rngState, 394_448_415);
const makeLegacyFallbackSelection = (skillId, type, configure = () => {}, state = {}) => {
  const definition = legacyFallbackType50Definition.slice();
  const definitionView = new DataView(definition.buffer);
  definitionView.setUint32(0x00, skillId, true);
  definitionView.setInt16(0x04, type, true);
  configure(definitionView);
  const monsterDefinition = legacyFallbackMonsterDefinition.slice();
  new DataView(monsterDefinition.buffer).setUint32(0xec, skillId, true);
  return selectPadEnemyAiLegacy(
    decodePadEnemyAiMonsterDefinition(monsterDefinition),
    [decodePadEnemyAiSkillDefinition(definition)],
    {
      currentHp: 92_000,
      maxHp: 92_000,
      aiBudget: 100,
      rngState: 21_900,
      playerCurrentHp: 12_000,
      playerMaxHp: 92_000,
      enemyAttackBoostTurns: 0,
      enemyDamagedTurnCount: 3,
      playerAuxiliaryBuffTurns: 1,
      playerAttackBoostTurns: 0,
      enemyTransientDebuffActive: false,
      enemyStatusShieldTurns: 0,
      enemies: [
        { hp: 92_000, escaped: false, unavailable: false },
        { hp: 0, escaped: false, unavailable: false },
      ],
      ...state,
    },
  );
};
const selectedLegacyFallbackLoneBoost = makeLegacyFallbackSelection(
  9_013,
  PAD_ENEMY_SKILL_LONE_ATTACK_BOOST,
  (view) => {
    view.setInt32(0x14, 3, true);
    view.setInt32(0x18, 200, true);
  },
);
assert.equal(selectedLegacyFallbackLoneBoost.skillId, 9_013);
assert.equal(selectedLegacyFallbackLoneBoost.legacyFallbackScale, 1);
assert.equal(selectedLegacyFallbackLoneBoost.legacyFallbackApproximation, undefined);
assert.equal(selectedLegacyFallbackLoneBoost.fidelity, 'legacy-fallback-recovered');
const selectedLegacyFallbackStatusBoost = makeLegacyFallbackSelection(
  9_014,
  PAD_ENEMY_SKILL_STATUS_TRIGGERED_ATTACK_BOOST,
  (view) => {
    view.setInt32(0x10, 2, true);
    view.setInt32(0x14, 250, true);
  },
);
assert.equal(selectedLegacyFallbackStatusBoost.skillId, 9_014);
assert.equal(selectedLegacyFallbackStatusBoost.legacyFallbackScale, 1);
assert.equal(selectedLegacyFallbackStatusBoost.legacyFallbackApproximation, undefined);
assert.equal(selectedLegacyFallbackStatusBoost.fidelity, 'legacy-fallback-recovered');
const selectedLegacyFallbackDamagedBoost = makeLegacyFallbackSelection(
  9_015,
  PAD_ENEMY_SKILL_DAMAGED_TURN_ATTACK_BOOST,
  (view) => {
    view.setInt32(0x10, 3, true);
    view.setInt32(0x14, 4, true);
    view.setInt32(0x18, 300, true);
  },
);
assert.equal(selectedLegacyFallbackDamagedBoost.skillId, 9_015);
assert.equal(selectedLegacyFallbackDamagedBoost.legacyFallbackScale, 1);
assert.equal(selectedLegacyFallbackDamagedBoost.legacyFallbackApproximation, undefined);
assert.equal(selectedLegacyFallbackDamagedBoost.fidelity, 'legacy-fallback-recovered');
const selectedLegacyFallbackStatusShield = makeLegacyFallbackSelection(
  9_016,
  PAD_ENEMY_SKILL_STATUS_SHIELD,
  (view) => view.setInt32(0x10, 3, true),
  { enemyStatusShieldTurns: 5 },
);
assert.equal(selectedLegacyFallbackStatusShield.skillId, 9_016);
assert.equal(selectedLegacyFallbackStatusShield.legacyFallbackScale, 1);
assert.equal(selectedLegacyFallbackStatusShield.legacyFallbackApproximation, undefined);
assert.equal(selectedLegacyFallbackStatusShield.fidelity, 'legacy-fallback-recovered');
const selectedLegacyFallbackPlayerHeal = makeLegacyFallbackSelection(
  9_017,
  PAD_ENEMY_SKILL_HEAL_PLAYER,
  (view) => {
    view.setInt32(0x10, 25, true);
    view.setInt32(0x14, 50, true);
  },
);
assert.equal(selectedLegacyFallbackPlayerHeal.skillId, 9_017);
assert.equal(selectedLegacyFallbackPlayerHeal.legacyFallbackScale, 1);
assert.equal(selectedLegacyFallbackPlayerHeal.legacyFallbackApproximation, undefined);
assert.equal(selectedLegacyFallbackPlayerHeal.fidelity, 'legacy-fallback-recovered');
// Type 6 calls cGAMEMAIN::_getCountClearParams in the legacy fallback pass.
// An explicit recovered count is exact; an omitted count keeps the selector
// playable but is marked approximate because the native helper scans more
// status lanes than the compact browser state currently exposes.
const selectedLegacyFallbackClearCount = makeLegacyFallbackSelection(
  9_027,
  6,
  () => {},
  { clearableBuffCount: 2 },
);
assert.equal(selectedLegacyFallbackClearCount.skillId, 9_027);
assert.equal(selectedLegacyFallbackClearCount.legacyFallbackScale, 1);
assert.equal(selectedLegacyFallbackClearCount.legacyFallbackApproximation, undefined);
assert.equal(selectedLegacyFallbackClearCount.fidelity, 'legacy-fallback-recovered');
const rejectedLegacyFallbackClearCount = makeLegacyFallbackSelection(
  9_028,
  6,
  () => {},
  { clearableBuffCount: 0 },
);
assert.equal(rejectedLegacyFallbackClearCount.skillId, null);
assert.equal(rejectedLegacyFallbackClearCount.legacyFallbackApproximation, undefined);
assert.equal(rejectedLegacyFallbackClearCount.rngState, 394_448_415);
assert.equal(rejectedLegacyFallbackClearCount.fidelity, 'legacy-fallback-no-selection');
const missingLegacyFallbackClearCount = makeLegacyFallbackSelection(9_029, 6);
assert.equal(missingLegacyFallbackClearCount.skillId, 9_029);
assert.equal(missingLegacyFallbackClearCount.legacyFallbackScale, 1);
assert.equal(missingLegacyFallbackClearCount.legacyFallbackApproximation, true);
assert.deepEqual(missingLegacyFallbackClearCount.approximateFallbackTypes, [6]);
assert.equal(missingLegacyFallbackClearCount.fidelity, 'legacy-fallback-approximate');
// Type 13's legacy callback returns the represented-face fraction only after
// its authored minimum is met. Empty/insufficient face coverage rejects the
// slot; omitted board/face state remains a visible approximation.
const selectedLegacyFallbackRandomJammer = makeLegacyFallbackSelection(
  9_030,
  13,
  (view) => view.setInt32(0x10, 2, true),
  {
    boardTypeCounts: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    faceTypes: [0, 1, 2, 3, 4, 5],
  },
);
assert.equal(selectedLegacyFallbackRandomJammer.skillId, 9_030);
assert.equal(selectedLegacyFallbackRandomJammer.effect.kind, 'randomJammer');
assert.equal(selectedLegacyFallbackRandomJammer.legacyFallbackScale, Math.fround(1 / 3));
assert.equal(selectedLegacyFallbackRandomJammer.legacyFallbackApproximation, undefined);
assert.equal(selectedLegacyFallbackRandomJammer.fidelity, 'legacy-fallback-recovered');
const rejectedLegacyFallbackRandomJammer = makeLegacyFallbackSelection(
  9_031,
  13,
  (view) => view.setInt32(0x10, 2, true),
  {
    boardTypeCounts: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    faceTypes: [0, 1, 2, 3, 4, 5],
  },
);
assert.equal(rejectedLegacyFallbackRandomJammer.skillId, null);
assert.equal(rejectedLegacyFallbackRandomJammer.legacyFallbackApproximation, undefined);
const missingLegacyFallbackRandomJammer = makeLegacyFallbackSelection(9_032, 13, (view) => {
  view.setInt32(0x10, 2, true);
});
assert.equal(missingLegacyFallbackRandomJammer.skillId, 9_032);
assert.equal(missingLegacyFallbackRandomJammer.legacyFallbackScale, 1);
assert.equal(missingLegacyFallbackRandomJammer.legacyFallbackApproximation, true);
assert.deepEqual(missingLegacyFallbackRandomJammer.approximateFallbackTypes, [13]);
assert.equal(missingLegacyFallbackRandomJammer.fidelity, 'legacy-fallback-approximate');
// Types 12, 56, and 58 share the restored 0x61e6cc fallback handler.  The
// native _countBlockType call is a positive gate only on this pass (unlike
// the ordinary path's count/3 probability), and source 7/8 use one combined
// poison-family count.
const makeLegacyFallbackBoardSelection = (skillId, type, sourceType, boardTypeCounts) => {
  const definition = legacyFallbackType50Definition.slice();
  const view = new DataView(definition.buffer);
  view.setUint32(0x00, skillId, true);
  view.setInt16(0x04, type, true);
  view.setInt32(0x10, sourceType, true);
  const monsterDefinition = legacyFallbackMonsterDefinition.slice();
  new DataView(monsterDefinition.buffer).setUint32(0xec, skillId, true);
  return selectPadEnemyAiLegacy(
    decodePadEnemyAiMonsterDefinition(monsterDefinition),
    [decodePadEnemyAiSkillDefinition(definition)],
    {
      currentHp: 92_000,
      maxHp: 92_000,
      aiBudget: 100,
      rngState: 21_900,
      boardTypeCounts,
    },
  );
};
const selectedLegacyFallbackJammer = makeLegacyFallbackBoardSelection(
  9_018,
  PAD_ENEMY_SKILL_SOURCE_TO_JAMMER,
  0,
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
);
assert.equal(selectedLegacyFallbackJammer.skillId, 9_018);
assert.equal(selectedLegacyFallbackJammer.effect.kind, 'sourceToJammer');
assert.equal(selectedLegacyFallbackJammer.legacyFallbackScale, 1);
assert.equal(selectedLegacyFallbackJammer.legacyFallbackProbability, 10_000);
assert.equal(selectedLegacyFallbackJammer.legacyFallbackApproximation, undefined);
assert.equal(selectedLegacyFallbackJammer.fidelity, 'legacy-fallback-recovered');
const selectedLegacyFallbackPoison = makeLegacyFallbackBoardSelection(
  9_019,
  PAD_ENEMY_SKILL_SOURCE_TO_POISON,
  7,
  [0, 0, 0, 0, 0, 0, 0, 2, 0, 0],
);
assert.equal(selectedLegacyFallbackPoison.skillId, 9_019);
assert.equal(selectedLegacyFallbackPoison.effect.kind, 'sourceToPoison');
assert.equal(selectedLegacyFallbackPoison.effect.destinationType, 7);
assert.equal(selectedLegacyFallbackPoison.legacyFallbackScale, 1);
assert.equal(selectedLegacyFallbackPoison.legacyFallbackApproximation, undefined);
const selectedLegacyFallbackMortalPoison = makeLegacyFallbackBoardSelection(
  9_020,
  PAD_ENEMY_SKILL_SOURCE_TO_MORTAL_POISON,
  8,
  [0, 0, 0, 0, 0, 0, 0, 2, 0, 0],
);
assert.equal(selectedLegacyFallbackMortalPoison.skillId, 9_020);
assert.equal(selectedLegacyFallbackMortalPoison.effect.kind, 'sourceToPoison');
assert.equal(selectedLegacyFallbackMortalPoison.effect.destinationType, 8);
assert.equal(selectedLegacyFallbackMortalPoison.legacyFallbackScale, 1);
assert.equal(selectedLegacyFallbackMortalPoison.legacyFallbackApproximation, undefined);
const rejectedLegacyFallbackBoardCount = makeLegacyFallbackBoardSelection(
  9_021,
  PAD_ENEMY_SKILL_SOURCE_TO_JAMMER,
  0,
  Array(10).fill(0),
);
assert.equal(rejectedLegacyFallbackBoardCount.skillId, null);
assert.equal(rejectedLegacyFallbackBoardCount.rngState, 394_448_415);
assert.equal(rejectedLegacyFallbackBoardCount.legacyFallbackApproximation, undefined);
assert.equal(rejectedLegacyFallbackBoardCount.fidelity, 'legacy-fallback-no-selection');
// Omitted board state remains a visible, playable approximation for direct
// hosts that have not connected their board model yet.
const missingLegacyFallbackBoardCount = makeLegacyFallbackBoardSelection(
  9_022,
  PAD_ENEMY_SKILL_SOURCE_TO_JAMMER,
  0,
  undefined,
);
assert.equal(missingLegacyFallbackBoardCount.skillId, 9_022);
assert.equal(missingLegacyFallbackBoardCount.legacyFallbackScale, 1);
assert.equal(missingLegacyFallbackBoardCount.legacyFallbackApproximation, true);
assert.deepEqual(missingLegacyFallbackBoardCount.approximateFallbackTypes, [12]);
const selectedLegacyFallbackMoveTime = makeLegacyFallbackSelection(
  9_023,
  PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION,
  (view) => {
    view.setInt32(0x10, 2, true);
    view.setInt32(0x14, 125, true);
    view.setInt32(0x18, 0, true);
  },
  {
    moveTimeReductionTurns: 0,
    moveTimeReductionOverrideActive: false,
  },
);
assert.equal(selectedLegacyFallbackMoveTime.skillId, 9_023);
assert.equal(selectedLegacyFallbackMoveTime.legacyFallbackScale, 1);
assert.equal(selectedLegacyFallbackMoveTime.legacyFallbackApproximation, undefined);
assert.equal(selectedLegacyFallbackMoveTime.fidelity, 'legacy-fallback-recovered');
const blockedLegacyFallbackMoveTime = makeLegacyFallbackSelection(
  9_024,
  PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION,
  (view) => {
    view.setInt32(0x10, 2, true);
    view.setInt32(0x14, 125, true);
    view.setInt32(0x18, 0, true);
  },
  {
    moveTimeReductionTurns: 2,
  },
);
assert.equal(blockedLegacyFallbackMoveTime.skillId, null);
assert.equal(blockedLegacyFallbackMoveTime.legacyFallbackScale, undefined);
assert.equal(blockedLegacyFallbackMoveTime.legacyFallbackApproximation, true);
assert.deepEqual(blockedLegacyFallbackMoveTime.approximateFallbackTypes, [39]);
assert.equal(blockedLegacyFallbackMoveTime.rngState, 394_448_415);
// The native shift/sign-extension boundary is strict: packed duration 1
// becomes counter 64, so it remains blocked without the explicit override.
const boundaryLegacyFallbackMoveTime = makeLegacyFallbackSelection(
  9_026,
  PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION,
  (view) => {
    view.setInt32(0x10, 2, true);
    view.setInt32(0x14, 125, true);
    view.setInt32(0x18, 0, true);
  },
  {
    moveTimeReductionTurns: 1,
    moveTimeReductionOverrideActive: false,
  },
);
assert.equal(boundaryLegacyFallbackMoveTime.skillId, null);
assert.equal(boundaryLegacyFallbackMoveTime.legacyFallbackApproximation, undefined);
assert.equal(boundaryLegacyFallbackMoveTime.rngState, 394_448_415);
const overriddenLegacyFallbackMoveTime = makeLegacyFallbackSelection(
  9_025,
  PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION,
  (view) => {
    view.setInt32(0x10, 2, true);
    view.setInt32(0x14, 125, true);
    view.setInt32(0x18, 0, true);
  },
  {
    moveTimeReductionTurns: 2,
    moveTimeReductionOverrideActive: true,
  },
);
assert.equal(overriddenLegacyFallbackMoveTime.skillId, 9_025);
assert.equal(overriddenLegacyFallbackMoveTime.legacyFallbackScale, 1);
assert.equal(overriddenLegacyFallbackMoveTime.legacyFallbackApproximation, undefined);
assert.equal(overriddenLegacyFallbackMoveTime.fidelity, 'legacy-fallback-recovered');
// Types 60/61 share native 0x61e4d0: count non-poison cells, optionally
// excluding Heart, and admit only when the authored request is met.
const countedNonPoisonBoard = [4, 0, 0, 0, 0, 2, 0, 3, 3, 0];
const selectedLegacyFallbackCountedPoison = makeLegacyFallbackSelection(
  9_101,
  PAD_ENEMY_SKILL_POISON_BLOCK_N_COUNTED,
  (view) => {
    view.setInt32(0x10, 4, true);
    view.setInt32(0x14, 1, true);
  },
  { boardTypeCounts: countedNonPoisonBoard },
);
assert.equal(selectedLegacyFallbackCountedPoison.skillId, 9_101);
assert.equal(selectedLegacyFallbackCountedPoison.legacyFallbackScale, 1);
assert.equal(selectedLegacyFallbackCountedPoison.legacyFallbackApproximation, undefined);
assert.equal(selectedLegacyFallbackCountedPoison.fidelity, 'legacy-fallback-recovered');
const blockedLegacyFallbackCountedPoison = makeLegacyFallbackSelection(
  9_102,
  PAD_ENEMY_SKILL_POISON_BLOCK_N_COUNTED,
  (view) => {
    view.setInt32(0x10, 5, true);
    view.setInt32(0x14, 1, true);
  },
  { boardTypeCounts: countedNonPoisonBoard },
);
assert.equal(blockedLegacyFallbackCountedPoison.skillId, null);
assert.equal(blockedLegacyFallbackCountedPoison.legacyFallbackScale, undefined);
assert.equal(blockedLegacyFallbackCountedPoison.legacyFallbackApproximation, undefined);
assert.equal(blockedLegacyFallbackCountedPoison.rngState, 394_448_415);
const selectedLegacyFallbackCountedMortalPoison = makeLegacyFallbackSelection(
  9_103,
  PAD_ENEMY_SKILL_MORTAL_POISON_BLOCK_N_COUNTED,
  (view) => {
    view.setInt32(0x10, 5, true);
    view.setInt32(0x14, 0, true);
  },
  { boardTypeCounts: countedNonPoisonBoard },
);
assert.equal(selectedLegacyFallbackCountedMortalPoison.skillId, 9_103);
assert.equal(selectedLegacyFallbackCountedMortalPoison.legacyFallbackScale, 1);
assert.equal(selectedLegacyFallbackCountedMortalPoison.legacyFallbackApproximation, undefined);
assert.equal(selectedLegacyFallbackCountedMortalPoison.fidelity, 'legacy-fallback-recovered');
// Types 57/59 share native 0x61e448: represented face colors determine the
// fallback fraction, while Heart exclusion is only an admission gate.
const representedFaceBoardCounts = [2, 2, 0, 0, 0, 1, 0, 0, 0, 0];
const representedFaceTypes = [0, 1, 2, 3, 4, 5];
const selectedLegacyFallbackPoisonBlocks = makeLegacyFallbackSelection(
  9_104,
  PAD_ENEMY_SKILL_POISON_BLOCKS,
  (view) => {
    view.setInt32(0x10, 2, true);
    view.setInt32(0x14, 1, true);
  },
  {
    boardTypeCounts: representedFaceBoardCounts,
    faceTypes: representedFaceTypes,
  },
);
assert.equal(selectedLegacyFallbackPoisonBlocks.skillId, 9_104);
assert.equal(selectedLegacyFallbackPoisonBlocks.legacyFallbackScale, 0.5);
assert.equal(selectedLegacyFallbackPoisonBlocks.legacyFallbackProbability, 5_000);
assert.equal(selectedLegacyFallbackPoisonBlocks.legacyFallbackApproximation, undefined);
assert.equal(selectedLegacyFallbackPoisonBlocks.fidelity, 'legacy-fallback-recovered');
const rejectedLegacyFallbackPoisonBlocks = makeLegacyFallbackSelection(
  9_105,
  PAD_ENEMY_SKILL_POISON_BLOCKS,
  (view) => {
    view.setInt32(0x10, 2, true);
    view.setInt32(0x14, 1, true);
  },
  {
    boardTypeCounts: [0, 0, 0, 0, 0, 4, 0, 0, 0, 0],
    faceTypes: representedFaceTypes,
  },
);
assert.equal(rejectedLegacyFallbackPoisonBlocks.skillId, null);
assert.equal(rejectedLegacyFallbackPoisonBlocks.legacyFallbackApproximation, undefined);
assert.equal(rejectedLegacyFallbackPoisonBlocks.rngState, 394_448_415);
const selectedLegacyFallbackMortalPoisonBlocks = makeLegacyFallbackSelection(
  9_106,
  PAD_ENEMY_SKILL_MORTAL_POISON_BLOCKS,
  (view) => {
    view.setInt32(0x10, 2, true);
    view.setInt32(0x14, 0, true);
  },
  {
    boardTypeCounts: representedFaceBoardCounts,
    faceTypes: representedFaceTypes,
  },
);
assert.equal(selectedLegacyFallbackMortalPoisonBlocks.skillId, 9_106);
assert.equal(selectedLegacyFallbackMortalPoisonBlocks.legacyFallbackScale, 0.5);
assert.equal(selectedLegacyFallbackMortalPoisonBlocks.legacyFallbackProbability, 5_000);
assert.equal(selectedLegacyFallbackMortalPoisonBlocks.legacyFallbackApproximation, undefined);
assert.equal(selectedLegacyFallbackMortalPoisonBlocks.fidelity, 'legacy-fallback-recovered');
// Effect type 36 is a native ordinary-path transfer: it jumps to the fallback
// pass immediately, so a later ordinary type-50 record must not win first.
// In the fallback jump table the effect type itself is just a zero-scale lane.
const legacyFallbackSentinelMonsterDefinition = legacyFallbackMonsterDefinition.slice();
const legacyFallbackSentinelMonsterView = new DataView(
  legacyFallbackSentinelMonsterDefinition.buffer,
);
legacyFallbackSentinelMonsterView.setUint32(0xec, 9_005, true);
legacyFallbackSentinelMonsterView.setUint8(0xf0, 0);
legacyFallbackSentinelMonsterView.setUint8(0xf1, 0);
legacyFallbackSentinelMonsterView.setUint32(0xf4, 9_002, true);
legacyFallbackSentinelMonsterView.setUint8(0xf8, 100);
legacyFallbackSentinelMonsterView.setUint8(0xf9, 0);
const legacyFallbackSentinelDefinition = legacyFallbackType50Definition.slice();
const legacyFallbackSentinelView = new DataView(legacyFallbackSentinelDefinition.buffer);
legacyFallbackSentinelView.setUint32(0x00, 9_005, true);
legacyFallbackSentinelView.setInt16(0x04, 36, true);
const legacyFallbackSentinel = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackSentinelMonsterDefinition),
  [
    decodePadEnemyAiSkillDefinition(legacyFallbackSentinelDefinition),
    decodedLegacyFallbackType50,
  ],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    rngState: 21_900,
  },
);
assert.equal(legacyFallbackSentinel.skillId, null);
assert.equal(legacyFallbackSentinel.rngState, 21_900);
assert.equal(legacyFallbackSentinel.legacyFallbackAborted, undefined);
assert.equal(legacyFallbackSentinel.legacyFallbackEncountered, true);
assert.equal(legacyFallbackSentinel.legacyUnsupported, false);
assert.equal(legacyFallbackSentinel.fidelity, 'legacy-fallback-no-selection');
// The second pass has a separate hard sentinel: an authored slot skill ID of
// 36 returns the top-level no-skill result before its effect is decoded.
const legacyFallbackSkillIdSentinelMonsterDefinition = legacyFallbackSentinelMonsterDefinition.slice();
const legacyFallbackSkillIdSentinelMonsterView = new DataView(
  legacyFallbackSkillIdSentinelMonsterDefinition.buffer,
);
legacyFallbackSkillIdSentinelMonsterView.setUint32(0xf4, 36, true);
const legacyFallbackSkillIdSentinelDefinition = legacyFallbackType50Definition.slice();
const legacyFallbackSkillIdSentinelView = new DataView(
  legacyFallbackSkillIdSentinelDefinition.buffer,
);
legacyFallbackSkillIdSentinelView.setUint32(0x00, 36, true);
const legacyFallbackSkillIdSentinel = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackSkillIdSentinelMonsterDefinition),
  [
    decodePadEnemyAiSkillDefinition(legacyFallbackSentinelDefinition),
    decodePadEnemyAiSkillDefinition(legacyFallbackSkillIdSentinelDefinition),
  ],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    rngState: 21_900,
  },
);
assert.equal(legacyFallbackSkillIdSentinel.skillId, null);
assert.equal(legacyFallbackSkillIdSentinel.rngState, 21_900);
assert.equal(legacyFallbackSkillIdSentinel.legacyFallbackAborted, true);
assert.equal(legacyFallbackSkillIdSentinel.legacyUnsupported, false);
assert.equal(legacyFallbackSkillIdSentinel.fidelity, 'legacy-fallback-no-selection');
const legacyFallbackComboDefinition = legacyFallbackType50Definition.slice();
const legacyFallbackComboView = new DataView(legacyFallbackComboDefinition.buffer);
legacyFallbackComboView.setUint32(0x00, 9_003, true);
legacyFallbackComboView.setInt16(0x04, PAD_ENEMY_SKILL_COMBO_ABSORB, true);
legacyFallbackComboView.setInt32(0x10, 1, true);
legacyFallbackComboView.setInt32(0x14, 1, true);
legacyFallbackComboView.setInt32(0x18, 7, true);
const legacyFallbackComboMonsterDefinition = legacyFallbackMonsterDefinition.slice();
new DataView(legacyFallbackComboMonsterDefinition.buffer).setUint32(0xec, 9_003, true);
const decodedLegacyFallbackCombo = decodePadEnemyAiSkillDefinition(legacyFallbackComboDefinition);
const decodedLegacyFallbackComboMonster = decodePadEnemyAiMonsterDefinition(
  legacyFallbackComboMonsterDefinition,
);
const blockedLegacyFallback = selectPadEnemyAiLegacy(
  decodedLegacyFallbackComboMonster,
  [decodedLegacyFallbackCombo],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    comboAbsorbTurns: 1,
    rngState: 21_900,
  },
);
assert.equal(blockedLegacyFallback.skillId, null);
// A positive fallback weight still advances the native LCG when the status
// lane supplies a zero scale.
assert.equal(blockedLegacyFallback.rngState, 394_448_415);
assert.equal(blockedLegacyFallback.fidelity, 'legacy-fallback-no-selection');
assert.equal(blockedLegacyFallback.legacyUnsupported, false);
const openLegacyFallback = selectPadEnemyAiLegacy(
  decodedLegacyFallbackComboMonster,
  [decodedLegacyFallbackCombo],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    comboAbsorbTurns: 0,
    rngState: 21_900,
  },
);
assert.equal(openLegacyFallback.skillId, 9_003);
assert.equal(openLegacyFallback.rngState, 394_448_415);
assert.equal(openLegacyFallback.fidelity, 'legacy-fallback-recovered');
const legacyFallbackAttributeAbsorbDefinition = legacyFallbackType50Definition.slice();
const legacyFallbackAttributeAbsorbView = new DataView(
  legacyFallbackAttributeAbsorbDefinition.buffer,
);
legacyFallbackAttributeAbsorbView.setUint32(0x00, 9_006, true);
legacyFallbackAttributeAbsorbView.setInt16(0x04, PAD_ENEMY_SKILL_ATTRIBUTE_ABSORB, true);
legacyFallbackAttributeAbsorbView.setInt32(0x10, 2, true);
legacyFallbackAttributeAbsorbView.setInt32(0x14, 4, true);
legacyFallbackAttributeAbsorbView.setUint32(0x18, 0x03, true);
const legacyFallbackAttributeAbsorbMonsterDefinition = legacyFallbackMonsterDefinition.slice();
new DataView(legacyFallbackAttributeAbsorbMonsterDefinition.buffer).setUint32(0xec, 9_006, true);
const decodedLegacyFallbackAttributeAbsorb = decodePadEnemyAiSkillDefinition(
  legacyFallbackAttributeAbsorbDefinition,
);
const blockedLegacyFallbackAttributeAbsorb = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackAttributeAbsorbMonsterDefinition),
  [decodedLegacyFallbackAttributeAbsorb],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    attributeAbsorbTurns: 1,
    rngState: 21_900,
  },
);
assert.equal(blockedLegacyFallbackAttributeAbsorb.skillId, null);
assert.equal(blockedLegacyFallbackAttributeAbsorb.rngState, 394_448_415);
assert.equal(blockedLegacyFallbackAttributeAbsorb.legacyUnsupported, false);
const openLegacyFallbackAttributeAbsorb = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackAttributeAbsorbMonsterDefinition),
  [decodedLegacyFallbackAttributeAbsorb],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    attributeAbsorbTurns: 0,
    rngState: 21_900,
  },
);
assert.equal(openLegacyFallbackAttributeAbsorb.skillId, 9_006);
assert.equal(openLegacyFallbackAttributeAbsorb.legacyFallbackScale, 1);
assert.equal(openLegacyFallbackAttributeAbsorb.legacyFallbackProbability, 10_000);
assert.equal(openLegacyFallbackAttributeAbsorb.fidelity, 'legacy-fallback-recovered');
const legacyFallbackSkyfallDefinition = legacyFallbackType50Definition.slice();
const legacyFallbackSkyfallView = new DataView(legacyFallbackSkyfallDefinition.buffer);
legacyFallbackSkyfallView.setUint32(0x00, 9_009, true);
legacyFallbackSkyfallView.setInt16(0x04, PAD_ENEMY_SKILL_SKYFALL_RATE, true);
legacyFallbackSkyfallView.setUint32(0x10, 0x81, true);
legacyFallbackSkyfallView.setInt32(0x14, 2, true);
legacyFallbackSkyfallView.setInt32(0x18, 4, true);
legacyFallbackSkyfallView.setInt32(0x1c, 25, true);
const legacyFallbackSkyfallMonsterDefinition = legacyFallbackMonsterDefinition.slice();
new DataView(legacyFallbackSkyfallMonsterDefinition.buffer).setUint32(0xec, 9_009, true);
const decodedLegacyFallbackSkyfall = decodePadEnemyAiSkillDefinition(
  legacyFallbackSkyfallDefinition,
);
const blockedLegacyFallbackSkyfall = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackSkyfallMonsterDefinition),
  [decodedLegacyFallbackSkyfall],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    skyfallNaturalTurns: 2,
    skyfallNaturalMask: 0x01,
    skyfallHazardTurns: 2,
    skyfallHazardMask: 0x80,
    rngState: 21_900,
  },
);
assert.equal(blockedLegacyFallbackSkyfall.skillId, null);
assert.equal(blockedLegacyFallbackSkyfall.rngState, 394_448_415);
assert.equal(blockedLegacyFallbackSkyfall.legacyFallbackApproximation, undefined);
assert.equal(blockedLegacyFallbackSkyfall.fidelity, 'legacy-fallback-no-selection');
const replacedLegacyFallbackSkyfall = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackSkyfallMonsterDefinition),
  [decodedLegacyFallbackSkyfall],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    skyfallNaturalTurns: 2,
    skyfallNaturalMask: 0x01,
    skyfallHazardTurns: 2,
    skyfallHazardMask: 0x40,
    rngState: 21_900,
  },
);
assert.equal(replacedLegacyFallbackSkyfall.skillId, 9_009);
assert.equal(replacedLegacyFallbackSkyfall.legacyFallbackScale, 1);
assert.equal(replacedLegacyFallbackSkyfall.legacyFallbackProbability, 10_000);
assert.equal(replacedLegacyFallbackSkyfall.legacyFallbackApproximation, undefined);
assert.equal(replacedLegacyFallbackSkyfall.fidelity, 'legacy-fallback-recovered');
const missingLegacyFallbackSkyfall = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackSkyfallMonsterDefinition),
  [decodedLegacyFallbackSkyfall],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    skyfallNaturalTurns: 2,
    skyfallNaturalMask: 0x01,
    rngState: 21_900,
  },
);
assert.equal(missingLegacyFallbackSkyfall.skillId, 9_009);
assert.equal(missingLegacyFallbackSkyfall.legacyFallbackScale, 1);
assert.equal(missingLegacyFallbackSkyfall.legacyFallbackApproximation, true);
assert.deepEqual(missingLegacyFallbackSkyfall.approximateFallbackTypes, [68]);
assert.equal(missingLegacyFallbackSkyfall.fidelity, 'legacy-fallback-approximate');
const legacyFallbackReviveDefinition = legacyFallbackType50Definition.slice();
const legacyFallbackReviveView = new DataView(legacyFallbackReviveDefinition.buffer);
legacyFallbackReviveView.setUint32(0x00, 9_010, true);
legacyFallbackReviveView.setInt16(0x04, PAD_ENEMY_SKILL_REVIVE_ENEMY, true);
legacyFallbackReviveView.setInt32(0x10, 37, true);
const legacyFallbackReviveMonsterDefinition = legacyFallbackMonsterDefinition.slice();
new DataView(legacyFallbackReviveMonsterDefinition.buffer).setUint32(0xec, 9_010, true);
const decodedLegacyFallbackRevive = decodePadEnemyAiSkillDefinition(
  legacyFallbackReviveDefinition,
);
const unavailableLegacyFallbackRevive = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackReviveMonsterDefinition),
  [decodedLegacyFallbackRevive],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    enemies: [{ hp: 5_000, escaped: false, unavailable: true }],
    rngState: 21_900,
  },
);
assert.equal(unavailableLegacyFallbackRevive.skillId, 9_010);
assert.equal(unavailableLegacyFallbackRevive.legacyFallbackScale, 1);
assert.equal(unavailableLegacyFallbackRevive.legacyFallbackApproximation, undefined);
assert.equal(unavailableLegacyFallbackRevive.fidelity, 'legacy-fallback-recovered');
const missingLegacyFallbackRevive = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackReviveMonsterDefinition),
  [decodedLegacyFallbackRevive],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    enemies: [{ hp: 5_000, escaped: false }],
    rngState: 21_900,
  },
);
assert.equal(missingLegacyFallbackRevive.skillId, null);
assert.equal(missingLegacyFallbackRevive.rngState, 394_448_415);
assert.equal(missingLegacyFallbackRevive.legacyFallbackApproximation, true);
assert.deepEqual(missingLegacyFallbackRevive.approximateFallbackTypes, [52]);
assert.equal(missingLegacyFallbackRevive.fidelity, 'legacy-fallback-no-selection');
const escapedLegacyFallbackRevive = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackReviveMonsterDefinition),
  [decodedLegacyFallbackRevive],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    enemies: [{ hp: 0, escaped: true, unavailable: false }],
    rngState: 21_900,
  },
);
assert.equal(escapedLegacyFallbackRevive.skillId, null);
assert.equal(escapedLegacyFallbackRevive.rngState, 394_448_415);
assert.equal(escapedLegacyFallbackRevive.legacyFallbackApproximation, undefined);
assert.equal(escapedLegacyFallbackRevive.fidelity, 'legacy-fallback-no-selection');
const legacyFallbackLeaderSwapDefinition = legacyFallbackType50Definition.slice();
const legacyFallbackLeaderSwapView = new DataView(legacyFallbackLeaderSwapDefinition.buffer);
legacyFallbackLeaderSwapView.setUint32(0x00, 9_011, true);
legacyFallbackLeaderSwapView.setInt16(0x04, PAD_ENEMY_SKILL_LEADER_SWAP, true);
legacyFallbackLeaderSwapView.setInt32(0x10, 3, true);
const legacyFallbackLeaderSwapMonsterDefinition = legacyFallbackMonsterDefinition.slice();
new DataView(legacyFallbackLeaderSwapMonsterDefinition.buffer).setUint32(0xec, 9_011, true);
const decodedLegacyFallbackLeaderSwap = decodePadEnemyAiSkillDefinition(
  legacyFallbackLeaderSwapDefinition,
);
const exactLegacyFallbackLeaderSwap = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackLeaderSwapMonsterDefinition),
  [decodedLegacyFallbackLeaderSwap],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    leaderSwapTurns: 0,
    party: Array.from({ length: 6 }, (_, index) => ({
      present: true,
      leaderSwapEligible: index === 1 || index === 4,
    })),
    rngState: 21_900,
  },
);
assert.equal(exactLegacyFallbackLeaderSwap.skillId, 9_011);
assert.equal(exactLegacyFallbackLeaderSwap.legacyFallbackScale, 1);
assert.equal(exactLegacyFallbackLeaderSwap.legacyFallbackApproximation, undefined);
assert.equal(exactLegacyFallbackLeaderSwap.fidelity, 'legacy-fallback-recovered');
const noCandidateLegacyFallbackLeaderSwap = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackLeaderSwapMonsterDefinition),
  [decodedLegacyFallbackLeaderSwap],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    leaderSwapTurns: 0,
    party: Array.from({ length: 6 }, () => ({
      present: true,
      leaderSwapEligible: false,
    })),
    rngState: 21_900,
  },
);
assert.equal(noCandidateLegacyFallbackLeaderSwap.skillId, null);
assert.equal(noCandidateLegacyFallbackLeaderSwap.rngState, 394_448_415);
assert.equal(noCandidateLegacyFallbackLeaderSwap.legacyFallbackApproximation, undefined);
assert.equal(noCandidateLegacyFallbackLeaderSwap.fidelity, 'legacy-fallback-no-selection');
const missingLegacyFallbackLeaderSwap = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackLeaderSwapMonsterDefinition),
  [decodedLegacyFallbackLeaderSwap],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    leaderSwapTurns: 0,
    leaderSwapCandidateCount: 2,
    party: Array.from({ length: 6 }, () => ({ present: true })),
    rngState: 21_900,
  },
);
assert.equal(missingLegacyFallbackLeaderSwap.skillId, 9_011);
assert.equal(missingLegacyFallbackLeaderSwap.legacyFallbackScale, 1);
assert.equal(missingLegacyFallbackLeaderSwap.legacyFallbackApproximation, true);
assert.deepEqual(missingLegacyFallbackLeaderSwap.approximateFallbackTypes, [75]);
assert.equal(missingLegacyFallbackLeaderSwap.fidelity, 'legacy-fallback-approximate');
const legacyFallbackAwakeningBindDefinition = legacyFallbackType50Definition.slice();
const legacyFallbackAwakeningBindView = new DataView(
  legacyFallbackAwakeningBindDefinition.buffer,
);
legacyFallbackAwakeningBindView.setUint32(0x00, 9_007, true);
legacyFallbackAwakeningBindView.setInt16(0x04, PAD_ENEMY_SKILL_AWAKENING_BIND, true);
legacyFallbackAwakeningBindView.setInt32(0x10, 3, true);
const legacyFallbackAwakeningBindMonsterDefinition = legacyFallbackMonsterDefinition.slice();
new DataView(legacyFallbackAwakeningBindMonsterDefinition.buffer).setUint32(0xec, 9_007, true);
const decodedLegacyFallbackAwakeningBind = decodePadEnemyAiSkillDefinition(
  legacyFallbackAwakeningBindDefinition,
);
const blockedLegacyFallbackAwakeningBind = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackAwakeningBindMonsterDefinition),
  [decodedLegacyFallbackAwakeningBind],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    awakeningBindTurns: 64,
    rngState: 21_900,
  },
);
assert.equal(blockedLegacyFallbackAwakeningBind.skillId, null);
assert.equal(blockedLegacyFallbackAwakeningBind.rngState, 394_448_415);
assert.equal(blockedLegacyFallbackAwakeningBind.legacyUnsupported, false);
const openLegacyFallbackAwakeningBind = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackAwakeningBindMonsterDefinition),
  [decodedLegacyFallbackAwakeningBind],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    awakeningBindTurns: 63,
    rngState: 21_900,
  },
);
assert.equal(openLegacyFallbackAwakeningBind.skillId, 9_007);
assert.equal(openLegacyFallbackAwakeningBind.legacyFallbackScale, 1);
assert.equal(openLegacyFallbackAwakeningBind.fidelity, 'legacy-fallback-recovered');
const legacyFallbackBindLeaderHelperDefinition = legacyFallbackType50Definition.slice();
const legacyFallbackBindLeaderHelperView = new DataView(
  legacyFallbackBindLeaderHelperDefinition.buffer,
);
legacyFallbackBindLeaderHelperView.setUint32(0x00, 9_008, true);
legacyFallbackBindLeaderHelperView.setInt16(0x04, PAD_ENEMY_SKILL_BIND_LEADER_HELPER, true);
legacyFallbackBindLeaderHelperView.setUint8(0x10, 3);
legacyFallbackBindLeaderHelperView.setInt32(0x14, 2, true);
legacyFallbackBindLeaderHelperView.setInt32(0x18, 4, true);
const legacyFallbackBindLeaderHelperMonsterDefinition = legacyFallbackMonsterDefinition.slice();
const legacyFallbackBindLeaderHelperMonsterView = new DataView(
  legacyFallbackBindLeaderHelperMonsterDefinition.buffer,
);
legacyFallbackBindLeaderHelperMonsterView.setUint32(0xec, 9_008, true);
legacyFallbackBindLeaderHelperMonsterView.setUint8(0xf1, 2);
const decodedLegacyFallbackBindLeaderHelper = decodePadEnemyAiSkillDefinition(
  legacyFallbackBindLeaderHelperDefinition,
);
const fallbackPartyWithBoundHelper = Array.from({ length: 6 }, (_, index) => ({
  present: true,
  bindTurns: index === 5 ? 1 : 0,
}));
const blockedLegacyFallbackBindLeaderHelper = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackBindLeaderHelperMonsterDefinition),
  [decodedLegacyFallbackBindLeaderHelper],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    party: fallbackPartyWithBoundHelper,
    rngState: 21_900,
  },
);
assert.equal(blockedLegacyFallbackBindLeaderHelper.skillId, 9_008);
assert.equal(blockedLegacyFallbackBindLeaderHelper.legacyFallbackScale, 0.5);
assert.equal(blockedLegacyFallbackBindLeaderHelper.legacyFallbackProbability, 10_000);
assert.equal(blockedLegacyFallbackBindLeaderHelper.fidelity, 'legacy-fallback-recovered');
const fullyBoundFallbackParty = fallbackPartyWithBoundHelper.map((member) => ({
  ...member,
  bindTurns: 1,
}));
const fullyBlockedLegacyFallbackBindLeaderHelper = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackBindLeaderHelperMonsterDefinition),
  [decodedLegacyFallbackBindLeaderHelper],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    party: fullyBoundFallbackParty,
    rngState: 21_900,
  },
);
assert.equal(fullyBlockedLegacyFallbackBindLeaderHelper.skillId, null);
assert.equal(fullyBlockedLegacyFallbackBindLeaderHelper.legacyFallbackScale, undefined);
assert.equal(fullyBlockedLegacyFallbackBindLeaderHelper.rngState, 394_448_415);
assert.equal(fullyBlockedLegacyFallbackBindLeaderHelper.legacyUnsupported, false);
const legacyFallbackPresentationDefinition = legacyFallbackType50Definition.slice();
const legacyFallbackPresentationView = new DataView(legacyFallbackPresentationDefinition.buffer);
legacyFallbackPresentationView.setUint32(0x00, 9_004, true);
legacyFallbackPresentationView.setInt16(0x04, PAD_ENEMY_SKILL_INACTIVITY_PRESENTATION, true);
const legacyFallbackPresentationMonsterDefinition = legacyFallbackMonsterDefinition.slice();
new DataView(legacyFallbackPresentationMonsterDefinition.buffer).setUint32(0xec, 9_004, true);
const blockedLegacyFallbackPresentation = selectPadEnemyAiLegacy(
  decodePadEnemyAiMonsterDefinition(legacyFallbackPresentationMonsterDefinition),
  [decodePadEnemyAiSkillDefinition(legacyFallbackPresentationDefinition)],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    enemyInactivityPresentationActive: true,
    rngState: 21_900,
  },
);
assert.equal(blockedLegacyFallbackPresentation.skillId, null);
assert.equal(blockedLegacyFallbackPresentation.rngState, 394_448_415);
const hookedLegacyFallback = selectPadEnemyAiLegacy(
  decodedLegacyFallbackMonster,
  [decodedLegacyFallbackType50],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    rngState: 21_900,
    legacyFallbackCondition: () => ({ scale: 2, exact: true, mode: 'test-hook' }),
  },
);
assert.equal(hookedLegacyFallback.skillId, 9_002);
assert.equal(hookedLegacyFallback.legacyFallbackScale, 2);
assert.equal(hookedLegacyFallback.fidelity, 'legacy-fallback-recovered');
const legacyEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: legacyEnemyAiMonsterDefinition,
    skillDefinitions: [legacyEnemyAiSkillDefinition],
    legacyConditionBase: 1_000_000,
  }],
});
assert.equal(legacyEngine.enemyAiPools[0].monster.usesNewAi, false);
const legacyEngineSkill = legacyEngine.takeEnemySkill(0);
assert.equal(legacyEngineSkill.kind, 'blackFall');
assert.equal(legacyEngine.enemies[0].aiUseCount, 1);
assert.equal(legacyEngine.lastEnemySkill, null);
const enemyAiBlockMinusDefinition = new Uint8Array(0x48);
const enemyAiBlockMinusView = new DataView(enemyAiBlockMinusDefinition.buffer);
enemyAiBlockMinusView.setUint32(0x00, 9_002, true);
enemyAiBlockMinusView.setInt16(0x04, PAD_ENEMY_SKILL_BLOCK_MINUS, true);
enemyAiBlockMinusView.setUint32(0x10, 0b11, true);
enemyAiBlockMinusView.setInt32(0x14, 50, true);
enemyAiBlockMinusView.setInt32(0x18, 2, true);
enemyAiBlockMinusView.setInt32(0x30, 10_000, true);
enemyAiBlockMinusView.setInt32(0x34, 1_000, true);
enemyAiBlockMinusView.setInt32(0x38, 100, true);
enemyAiBlockMinusView.setInt32(0x40, 20, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiBlockMinusDefinition), {
  type: 151,
  kind: 'blockMinus',
  supported: true,
  typeMask: 0b11,
  powerPercent: 50,
  power: 0.5,
  limit: 2,
  attackWithSkillValue: 0,
});
const enemyAiBurDropDefinition = enemyAiBlockMinusDefinition.slice();
const enemyAiBurDropView = new DataView(enemyAiBurDropDefinition.buffer);
enemyAiBurDropView.setUint32(0x00, 9_003, true);
enemyAiBurDropView.setInt16(0x04, PAD_ENEMY_SKILL_BUR_DROP, true);
enemyAiBurDropView.setUint32(0x10, 0b11, true);
enemyAiBurDropView.setUint32(0x14, 2, true);
enemyAiBurDropView.setUint16(0x18, 4, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiBurDropDefinition), {
  type: 153,
  kind: 'burDrop',
  supported: true,
  typeMask: 0b11,
  count: 2,
  descriptor: 4,
  clearDescriptorHighBit: true,
  attackWithSkillValue: 0,
});
const enemyAiHorizontalLinesDefinition = enemyAiBlockMinusDefinition.slice();
const enemyAiHorizontalLinesView = new DataView(enemyAiHorizontalLinesDefinition.buffer);
enemyAiHorizontalLinesView.setUint32(0x00, 9_004, true);
enemyAiHorizontalLinesView.setInt16(0x04, PAD_ENEMY_SKILL_HORIZONTAL_LINES, true);
enemyAiHorizontalLinesView.setUint32(0x10, 0b10000, true);
enemyAiHorizontalLinesView.setUint32(0x14, 1 << 0, true);
enemyAiHorizontalLinesView.setUint32(0x18, 0b00100, true);
enemyAiHorizontalLinesView.setUint32(0x1c, 1 << 1, true);
enemyAiHorizontalLinesView.setUint32(0x20, 0b00001, true);
enemyAiHorizontalLinesView.setUint32(0x24, 1 << 2, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiHorizontalLinesDefinition), {
  type: 79,
  kind: 'horizontalLines',
  supported: true,
  lineSwaps: [
    { lineMask: 0b10000, destinationTypeMask: 1 << 0 },
    { lineMask: 0b00100, destinationTypeMask: 1 << 1 },
    { lineMask: 0b00001, destinationTypeMask: 1 << 2 },
  ],
  attackWithSkillValue: 0,
});
const enemyAiVerticalLinesDefinition = enemyAiHorizontalLinesDefinition.slice();
const enemyAiVerticalLinesView = new DataView(enemyAiVerticalLinesDefinition.buffer);
enemyAiVerticalLinesView.setUint32(0x00, 9_005, true);
enemyAiVerticalLinesView.setInt16(0x04, PAD_ENEMY_SKILL_VERTICAL_LINES, true);
enemyAiVerticalLinesView.setUint32(0x10, 0b000001, true);
enemyAiVerticalLinesView.setUint32(0x14, 1 << 0, true);
enemyAiVerticalLinesView.setUint32(0x18, 0b000100, true);
enemyAiVerticalLinesView.setUint32(0x1c, 1 << 1, true);
enemyAiVerticalLinesView.setUint32(0x20, 0b100000, true);
enemyAiVerticalLinesView.setUint32(0x24, 1 << 2, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiVerticalLinesDefinition), {
  type: 77,
  kind: 'verticalLines',
  supported: true,
  lineSwaps: [
    { lineMask: 0b000001, destinationTypeMask: 1 << 0 },
    { lineMask: 0b000100, destinationTypeMask: 1 << 1 },
    { lineMask: 0b100000, destinationTypeMask: 1 << 2 },
  ],
  attackWithSkillValue: 0,
});
const enemyAiHorizontalLines4Definition = enemyAiHorizontalLinesDefinition.slice();
const enemyAiHorizontalLines4View = new DataView(enemyAiHorizontalLines4Definition.buffer);
enemyAiHorizontalLines4View.setUint32(0x00, 9_007, true);
enemyAiHorizontalLines4View.setInt16(0x04, PAD_ENEMY_SKILL_HORIZONTAL_LINES_4, true);
enemyAiHorizontalLines4View.setUint32(0x10, 0b10000, true);
enemyAiHorizontalLines4View.setUint32(0x14, 1 << 0, true);
enemyAiHorizontalLines4View.setUint32(0x18, 0b01000, true);
enemyAiHorizontalLines4View.setUint32(0x1c, 1 << 1, true);
enemyAiHorizontalLines4View.setUint32(0x20, 0b00010, true);
enemyAiHorizontalLines4View.setUint32(0x24, 1 << 2, true);
enemyAiHorizontalLines4View.setUint32(0x28, 0b00001, true);
enemyAiHorizontalLines4View.setUint32(0x2c, 1 << 3, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiHorizontalLines4Definition), {
  type: 78,
  kind: 'horizontalLines',
  supported: true,
  lineSwaps: [
    { lineMask: 0b10000, destinationTypeMask: 1 << 0 },
    { lineMask: 0b01000, destinationTypeMask: 1 << 1 },
    { lineMask: 0b00010, destinationTypeMask: 1 << 2 },
    { lineMask: 0b00001, destinationTypeMask: 1 << 3 },
  ],
  attackWithSkillValue: 0,
});
const enemyAiVerticalLines4Definition = enemyAiHorizontalLines4Definition.slice();
const enemyAiVerticalLines4View = new DataView(enemyAiVerticalLines4Definition.buffer);
enemyAiVerticalLines4View.setUint32(0x00, 9_008, true);
enemyAiVerticalLines4View.setInt16(0x04, PAD_ENEMY_SKILL_VERTICAL_LINES_4, true);
enemyAiVerticalLines4View.setUint32(0x10, 0b000001, true);
enemyAiVerticalLines4View.setUint32(0x14, 1 << 0, true);
enemyAiVerticalLines4View.setUint32(0x18, 0b000010, true);
enemyAiVerticalLines4View.setUint32(0x1c, 1 << 1, true);
enemyAiVerticalLines4View.setUint32(0x20, 0b000100, true);
enemyAiVerticalLines4View.setUint32(0x24, 1 << 2, true);
enemyAiVerticalLines4View.setUint32(0x28, 0b100000, true);
enemyAiVerticalLines4View.setUint32(0x2c, 1 << 3, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiVerticalLines4Definition), {
  type: 76,
  kind: 'verticalLines',
  supported: true,
  lineSwaps: [
    { lineMask: 0b000001, destinationTypeMask: 1 << 0 },
    { lineMask: 0b000010, destinationTypeMask: 1 << 1 },
    { lineMask: 0b000100, destinationTypeMask: 1 << 2 },
    { lineMask: 0b100000, destinationTypeMask: 1 << 3 },
  ],
  attackWithSkillValue: 0,
});
const enemyAiPoisonTypeListDefinition = enemyAiHorizontalLinesDefinition.slice();
const enemyAiPoisonTypeListView = new DataView(enemyAiPoisonTypeListDefinition.buffer);
enemyAiPoisonTypeListView.setUint32(0x00, 9_006, true);
enemyAiPoisonTypeListView.setInt16(0x04, PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP, true);
enemyAiPoisonTypeListView.setInt32(0x10, 12, true);
enemyAiPoisonTypeListView.setInt32(0x14, 0, true);
enemyAiPoisonTypeListView.setInt32(0x18, 1, true);
enemyAiPoisonTypeListView.setInt32(0x1c, 2, true);
enemyAiPoisonTypeListView.setInt32(0x20, -1, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiPoisonTypeListDefinition), {
  type: 81,
  kind: 'poisonTypeListSwap',
  supported: true,
  presentationValue: 12,
  destinationTypes: [0, 1, 2, -1],
  attackWithSkillValue: 0,
});
const enemyAiPoisonTypeListDirectDefinition = enemyAiPoisonTypeListDefinition.slice();
const enemyAiPoisonTypeListDirectView = new DataView(enemyAiPoisonTypeListDirectDefinition.buffer);
enemyAiPoisonTypeListDirectView.setUint32(0x00, 9_009, true);
enemyAiPoisonTypeListDirectView.setInt16(0x04, PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP_DIRECT, true);
enemyAiPoisonTypeListDirectView.setInt32(0x10, 0, true);
enemyAiPoisonTypeListDirectView.setInt32(0x14, 1, true);
enemyAiPoisonTypeListDirectView.setInt32(0x18, 2, true);
enemyAiPoisonTypeListDirectView.setInt32(0x1c, -1, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiPoisonTypeListDirectDefinition), {
  type: 80,
  kind: 'poisonTypeListSwap',
  supported: true,
  destinationTypes: [0, 1, 2, -1],
  attackWithSkillValue: 0,
});
const enemyAiPoisonMaskDirectDefinition = enemyAiPoisonTypeListDefinition.slice();
const enemyAiPoisonMaskDirectView = new DataView(enemyAiPoisonMaskDirectDefinition.buffer);
enemyAiPoisonMaskDirectView.setUint32(0x00, 9_010, true);
enemyAiPoisonMaskDirectView.setInt16(0x04, PAD_ENEMY_SKILL_POISON_MASK_SWAP_DIRECT, true);
enemyAiPoisonMaskDirectView.setUint32(0x10, 0b111, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiPoisonMaskDirectDefinition), {
  type: 84,
  kind: 'poisonMaskSwap',
  supported: true,
  destinationTypeMask: 0b111,
  attackWithSkillValue: 0,
});
const enemyAiPoisonMaskDefinition = enemyAiPoisonMaskDirectDefinition.slice();
const enemyAiPoisonMaskView = new DataView(enemyAiPoisonMaskDefinition.buffer);
enemyAiPoisonMaskView.setUint32(0x00, 9_011, true);
enemyAiPoisonMaskView.setInt16(0x04, PAD_ENEMY_SKILL_POISON_MASK_SWAP, true);
enemyAiPoisonMaskView.setInt32(0x10, 12, true);
enemyAiPoisonMaskView.setUint32(0x14, 0b111, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiPoisonMaskDefinition), {
  type: 85,
  kind: 'poisonMaskSwap',
  supported: true,
  presentationValue: 12,
  destinationTypeMask: 0b111,
  attackWithSkillValue: 0,
});
const enemyAiPoisonBlockNDefinition = enemyAiPoisonTypeListDefinition.slice();
const enemyAiPoisonBlockNView = new DataView(enemyAiPoisonBlockNDefinition.buffer);
enemyAiPoisonBlockNView.setUint32(0x00, 9_012, true);
enemyAiPoisonBlockNView.setInt16(0x04, PAD_ENEMY_SKILL_POISON_BLOCK_N, true);
enemyAiPoisonBlockNView.setInt32(0x10, 12, true);
enemyAiPoisonBlockNView.setInt32(0x14, 5, true);
enemyAiPoisonBlockNView.setInt32(0x18, 1, true);
enemyAiPoisonBlockNView.setInt32(0x1c, 1, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiPoisonBlockNDefinition), {
  type: 64,
  kind: 'poisonBlockN',
  supported: true,
  presentationValue: 12,
  count: 5,
  excludeHeart: true,
  destinationType: 8,
  attackWithSkillValue: 0,
});
const enemyAiPoisonBlocksDefinition = enemyAiPoisonTypeListDefinition.slice();
const enemyAiPoisonBlocksView = new DataView(enemyAiPoisonBlocksDefinition.buffer);
enemyAiPoisonBlocksView.setUint32(0x00, 9_013, true);
enemyAiPoisonBlocksView.setInt16(0x04, PAD_ENEMY_SKILL_POISON_BLOCKS, true);
enemyAiPoisonBlocksView.setInt32(0x10, 2, true);
enemyAiPoisonBlocksView.setInt32(0x14, 1, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiPoisonBlocksDefinition), {
  type: 57,
  kind: 'poisonBlocks',
  supported: true,
  count: 2,
  excludeHeart: true,
  destinationType: 7,
  attackWithSkillValue: 0,
});
const enemyAiMortalPoisonBlocksDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiMortalPoisonBlocksView = new DataView(enemyAiMortalPoisonBlocksDefinition.buffer);
enemyAiMortalPoisonBlocksView.setUint32(0x00, 9_014, true);
enemyAiMortalPoisonBlocksView.setInt16(0x04, PAD_ENEMY_SKILL_MORTAL_POISON_BLOCKS, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiMortalPoisonBlocksDefinition), {
  type: 59,
  kind: 'poisonBlocks',
  supported: true,
  count: 2,
  excludeHeart: true,
  destinationType: 8,
  attackWithSkillValue: 0,
});
const enemyAiSourceToPoisonDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiSourceToPoisonView = new DataView(enemyAiSourceToPoisonDefinition.buffer);
enemyAiSourceToPoisonView.setUint32(0x00, 9_017, true);
enemyAiSourceToPoisonView.setInt16(0x04, PAD_ENEMY_SKILL_SOURCE_TO_POISON, true);
enemyAiSourceToPoisonView.setInt32(0x10, 0, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiSourceToPoisonDefinition), {
  type: 56,
  kind: 'sourceToPoison',
  supported: true,
  sourceType: 0,
  destinationType: 7,
  attackWithSkillValue: 0,
});
const enemyAiSourceToMortalPoisonDefinition = enemyAiSourceToPoisonDefinition.slice();
const enemyAiSourceToMortalPoisonView = new DataView(
  enemyAiSourceToMortalPoisonDefinition.buffer,
);
enemyAiSourceToMortalPoisonView.setUint32(0x00, 9_018, true);
enemyAiSourceToMortalPoisonView.setInt16(
  0x04,
  PAD_ENEMY_SKILL_SOURCE_TO_MORTAL_POISON,
  true,
);
enemyAiSourceToMortalPoisonView.setInt32(0x10, 1, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiSourceToMortalPoisonDefinition), {
  type: 58,
  kind: 'sourceToPoison',
  supported: true,
  sourceType: 1,
  destinationType: 8,
  attackWithSkillValue: 0,
});
const enemyAiHealPlayerDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiHealPlayerView = new DataView(enemyAiHealPlayerDefinition.buffer);
enemyAiHealPlayerView.setUint32(0x00, 9_019, true);
enemyAiHealPlayerView.setInt16(0x04, PAD_ENEMY_SKILL_HEAL_PLAYER, true);
enemyAiHealPlayerView.setInt32(0x10, 25, true);
enemyAiHealPlayerView.setInt32(0x14, 50, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiHealPlayerDefinition), {
  type: 55,
  kind: 'healPlayer',
  supported: true,
  thresholdPercent: 25,
  healPercent: 50,
  attackWithSkillValue: 0,
});
const healPlayerMonsterRuntime = new Uint8Array(0x680);
new DataView(healPlayerMonsterRuntime.buffer).setInt32(0x678, 37, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiHealPlayerDefinition, healPlayerMonsterRuntime),
  {
    type: 55,
    kind: 'healPlayer',
    supported: true,
    thresholdPercent: 25,
    healPercent: 37,
    attackWithSkillValue: 0,
  },
);
const enemyAiScaledAttackDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiScaledAttackView = new DataView(enemyAiScaledAttackDefinition.buffer);
enemyAiScaledAttackView.setUint32(0x00, 9_024, true);
enemyAiScaledAttackView.setInt16(0x04, PAD_ENEMY_SKILL_SCALED_ATTACK, true);
enemyAiScaledAttackView.setInt32(0x14, 50, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiScaledAttackDefinition), {
  type: 47,
  kind: 'scaledAttack',
  supported: true,
  damagePercent: 50,
  attackWithSkillValue: 0,
});
const scaledAttackMonsterRuntime = new Uint8Array(0x680);
new DataView(scaledAttackMonsterRuntime.buffer).setInt32(0x678, 75, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiScaledAttackDefinition, scaledAttackMonsterRuntime),
  {
    type: 47,
    kind: 'scaledAttack',
    supported: true,
    damagePercent: 75,
    attackWithSkillValue: 0,
  },
);
const enemyAiStatusShieldDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiStatusShieldView = new DataView(enemyAiStatusShieldDefinition.buffer);
enemyAiStatusShieldView.setUint32(0x00, 9_029, true);
enemyAiStatusShieldView.setInt16(0x04, PAD_ENEMY_SKILL_STATUS_SHIELD, true);
enemyAiStatusShieldView.setInt32(0x10, 3, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiStatusShieldDefinition), {
  type: 20,
  kind: 'statusShield',
  supported: true,
  durationTurns: 3,
  attackWithSkillValue: 0,
});
const statusShieldMonsterRuntime = new Uint8Array(0x680);
new DataView(statusShieldMonsterRuntime.buffer).setInt32(0x678, 5, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiStatusShieldDefinition, statusShieldMonsterRuntime),
  {
    type: 20,
    kind: 'statusShield',
    supported: true,
    durationTurns: 5,
    setupMaterialized: true,
    attackWithSkillValue: 0,
  },
);
const statusShieldRuntimeEngine = new PuzzleEngine({ seed: 21_900 });
assert.equal(statusShieldRuntimeEngine.applyEnemySkillRuntime(
  enemyAiStatusShieldDefinition,
  statusShieldMonsterRuntime,
), true);
assert.equal(statusShieldRuntimeEngine.enemies[0].statusShieldTurns, 5);
const enemyAiSourceOrbConversionDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiSourceOrbConversionView = new DataView(enemyAiSourceOrbConversionDefinition.buffer);
enemyAiSourceOrbConversionView.setUint32(0x00, 9_033, true);
enemyAiSourceOrbConversionView.setInt16(0x04, PAD_ENEMY_SKILL_SOURCE_ORB_CONVERSION, true);
enemyAiSourceOrbConversionView.setInt32(0x10, 1, true);
enemyAiSourceOrbConversionView.setInt32(0x14, 4, true);
enemyAiSourceOrbConversionView.setInt32(0x44, 25, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiSourceOrbConversionDefinition), {
  type: 4,
  kind: 'sourceOrbConversion',
  supported: true,
  sourceType: 1,
  destinationType: 4,
  attackWithSkillValue: 25,
});
const sourceOrbConversionMonsterRuntime = new Uint8Array(0x680);
const sourceOrbConversionMonsterRuntimeView = new DataView(sourceOrbConversionMonsterRuntime.buffer);
sourceOrbConversionMonsterRuntimeView.setInt32(0x678, 2, true);
sourceOrbConversionMonsterRuntimeView.setInt32(0x67c, 5, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(
    enemyAiSourceOrbConversionDefinition,
    sourceOrbConversionMonsterRuntime,
  ),
  {
    type: 4,
    kind: 'sourceOrbConversion',
    supported: true,
    sourceType: 2,
    destinationType: 5,
    setupMaterialized: true,
    attackWithSkillValue: 25,
  },
);
const sourceOrbConversionEngine = new PuzzleEngine({ seed: 21_900 });
sourceOrbConversionEngine.setBoardFromCodes(['BBBRHD', 'GLDBHG', 'BHGDGL', 'DLGHHB', 'HBGGLD']);
assert.equal(sourceOrbConversionEngine.applyEnemySkillDefinition(
  enemyAiSourceOrbConversionDefinition,
), true);
assert.equal(sourceOrbConversionEngine.board.flat().filter((orb) => orb.type === 'water').length, 0);
assert.equal(sourceOrbConversionEngine.board.flat().filter((orb) => orb.type === 'dark').length, 12);
const enemyAiClearPlayerBuffsDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiClearPlayerBuffsView = new DataView(enemyAiClearPlayerBuffsDefinition.buffer);
enemyAiClearPlayerBuffsView.setUint32(0x00, 9_035, true);
enemyAiClearPlayerBuffsView.setInt16(0x04, PAD_ENEMY_SKILL_CLEAR_PLAYER_BUFFS, true);
enemyAiClearPlayerBuffsView.setInt32(0x30, 5_000, true);
enemyAiClearPlayerBuffsView.setInt32(0x34, 1_000, true);
enemyAiClearPlayerBuffsView.setInt32(0x38, 100, true);
enemyAiClearPlayerBuffsView.setInt32(0x40, 20, true);
enemyAiClearPlayerBuffsView.setInt32(0x44, 0, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiClearPlayerBuffsDefinition), {
  type: 6,
  kind: 'clearPlayerBuffs',
  supported: true,
  attackWithSkillValue: 0,
});
assert.deepEqual(
  decodePadEnemySkillRuntime(
    enemyAiClearPlayerBuffsDefinition,
    new Uint8Array(0x680),
  ),
  {
    type: 6,
    kind: 'clearPlayerBuffs',
    supported: true,
    attackWithSkillValue: 0,
  },
);
const clearPlayerBuffsEngine = new PuzzleEngine({
  seed: 21_900,
  playerAuxiliaryBuffTurns: 4,
  playerAttackBoostTurns: 2,
});
assert.equal(clearPlayerBuffsEngine.applyEnemySkillDefinition(
  enemyAiClearPlayerBuffsDefinition,
), true);
assert.deepEqual(clearPlayerBuffsEngine.snapshot().nativePlayerBuffStatus, {
  auxiliaryTurns: 0,
  attackBoostTurns: 0,
});
assert.equal(clearPlayerBuffsEngine.lastEnemySkill.clearedBuffCount, 2);
const enemyAiHealEnemyDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiHealEnemyView = new DataView(enemyAiHealEnemyDefinition.buffer);
enemyAiHealEnemyView.setUint32(0x00, 9_036, true);
enemyAiHealEnemyView.setInt16(0x04, PAD_ENEMY_SKILL_HEAL_ENEMY, true);
enemyAiHealEnemyView.setInt32(0x10, 20, true);
enemyAiHealEnemyView.setInt32(0x14, 30, true);
enemyAiHealEnemyView.setInt32(0x30, 10_000, true);
enemyAiHealEnemyView.setInt32(0x34, 1_000, true);
enemyAiHealEnemyView.setInt32(0x38, 100, true);
enemyAiHealEnemyView.setInt32(0x40, 20, true);
enemyAiHealEnemyView.setInt32(0x44, 50, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiHealEnemyDefinition), {
  type: 7,
  kind: 'healEnemy',
  supported: true,
  percentMin: 20,
  percentMax: 30,
  attackWithSkillValue: 50,
});
const healEnemyMonsterRuntime = new Uint8Array(0x680);
new DataView(healEnemyMonsterRuntime.buffer).setInt32(0x678, 27, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiHealEnemyDefinition,
  healEnemyMonsterRuntime,
), {
  type: 7,
  kind: 'healEnemy',
  supported: true,
  healPercent: 27,
  setupMaterialized: true,
  attackWithSkillValue: 50,
});
const directHealEnemyEngine = new PuzzleEngine({ seed: 21_900 });
directHealEnemyEngine.enemies[0].hp = 50_000;
directHealEnemyEngine.setRngState(21_900);
assert.equal(directHealEnemyEngine.applyEnemySkillDefinition(enemyAiHealEnemyDefinition), true);
assert.equal(directHealEnemyEngine.enemies[0].hp, 69_320);
assert.equal(directHealEnemyEngine.lastEnemySkill.healPercent, 21);
assert.equal(directHealEnemyEngine.lastEnemySkill.healedHp, 19_320);
assert.equal(directHealEnemyEngine.rng.state, padLcgStep(21_900).state);
const enemyAiUnconditionalHealDefinition = enemyAiHealEnemyDefinition.slice();
const enemyAiUnconditionalHealView = new DataView(enemyAiUnconditionalHealDefinition.buffer);
enemyAiUnconditionalHealView.setUint32(0x00, 9_067, true);
enemyAiUnconditionalHealView.setInt16(
  0x04,
  PAD_ENEMY_SKILL_HEAL_ENEMY_UNCONDITIONAL,
  true,
);
enemyAiUnconditionalHealView.setInt32(0x44, 0, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiUnconditionalHealDefinition), {
  type: 86,
  kind: 'healEnemy',
  supported: true,
  percentMin: 20,
  percentMax: 30,
  attackWithSkillValue: 0,
});
const enemyAiPresenceCheckDefinition = enemyAiUnconditionalHealDefinition.slice();
const enemyAiPresenceCheckView = new DataView(enemyAiPresenceCheckDefinition.buffer);
enemyAiPresenceCheckView.setUint32(0x00, 9_071, true);
enemyAiPresenceCheckView.setInt16(0x04, PAD_ENEMY_SKILL_PRESENCE_CHECK, true);
[1_234, 5_678, 9_012, 0, 99, 0, 0, 0].forEach((cardId, index) => {
  enemyAiPresenceCheckView.setInt32(0x10 + index * 4, cardId, true);
});
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiPresenceCheckDefinition), {
  type: 90,
  kind: 'presenceCheck',
  supported: true,
  candidateCardIds: [1_234, 5_678, 9_012],
  attackWithSkillValue: 0,
});
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiPresenceCheckDefinition,
  new Uint8Array(0x680),
), {
  type: 90,
  kind: 'presenceCheck',
  supported: true,
  candidateCardIds: [1_234, 5_678, 9_012],
  attackWithSkillValue: 0,
});
const enemyAiMaskedRandomOrbChangeDefinition = enemyAiPresenceCheckDefinition.slice();
const enemyAiMaskedRandomOrbChangeView = new DataView(
  enemyAiMaskedRandomOrbChangeDefinition.buffer,
);
enemyAiMaskedRandomOrbChangeView.setUint32(0x00, 9_072, true);
enemyAiMaskedRandomOrbChangeView.setInt16(
  0x04,
  PAD_ENEMY_SKILL_MASKED_RANDOM_ORB_CHANGE,
  true,
);
enemyAiMaskedRandomOrbChangeView.setInt32(0x10, 2, true);
enemyAiMaskedRandomOrbChangeView.setUint32(0x14, 0xc0, true);
enemyAiMaskedRandomOrbChangeView.setUint32(0x18, 0x1a0, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiMaskedRandomOrbChangeDefinition), {
  type: 92,
  kind: 'maskedRandomOrbChange',
  supported: true,
  perTypeCount: 2,
  destinationTypeMask: 0xc0,
  excludedSourceTypeMask: 0x1a0,
  attackWithSkillValue: 0,
});
const maskedRandomOrbChangeRuntime = new Uint8Array(0x688);
const maskedRandomOrbChangeRuntimeView = new DataView(maskedRandomOrbChangeRuntime.buffer);
maskedRandomOrbChangeRuntimeView.setInt32(0x678, 2, true);
maskedRandomOrbChangeRuntimeView.setUint32(0x67c, 0xc0, true);
maskedRandomOrbChangeRuntimeView.setUint32(0x680, 0x1a0, true);
maskedRandomOrbChangeRuntimeView.setUint32(0x684, 6_018, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiMaskedRandomOrbChangeDefinition,
  maskedRandomOrbChangeRuntime,
), {
  type: 92,
  kind: 'maskedRandomOrbChange',
  supported: true,
  perTypeCount: 2,
  destinationTypeMask: 0xc0,
  excludedSourceTypeMask: 0x1a0,
  selectionSeed: 6_018,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const enemyAiNativeNoEffectDefinition = enemyAiMaskedRandomOrbChangeDefinition.slice();
const enemyAiNativeNoEffectView = new DataView(enemyAiNativeNoEffectDefinition.buffer);
enemyAiNativeNoEffectView.setUint32(0x00, 9_073, true);
enemyAiNativeNoEffectView.setInt16(0x04, PAD_ENEMY_SKILL_NATIVE_NO_EFFECT, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiNativeNoEffectDefinition), {
  type: 93,
  kind: 'nativeNoEffect',
  supported: true,
  attackWithSkillValue: 0,
});
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiNativeNoEffectDefinition,
  new Uint8Array(0x680),
), {
  type: 93,
  kind: 'nativeNoEffect',
  supported: true,
  attackWithSkillValue: 0,
});
const enemyAiLockRandomOrbsDefinition = enemyAiNativeNoEffectDefinition.slice();
const enemyAiLockRandomOrbsView = new DataView(enemyAiLockRandomOrbsDefinition.buffer);
enemyAiLockRandomOrbsView.setUint32(0x00, 9_074, true);
enemyAiLockRandomOrbsView.setInt16(0x04, PAD_ENEMY_SKILL_LOCK_RANDOM_ORBS, true);
enemyAiLockRandomOrbsView.setUint32(0x10, 0b11, true);
enemyAiLockRandomOrbsView.setInt32(0x14, 4, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiLockRandomOrbsDefinition), {
  type: 94,
  kind: 'lockRandomOrbs',
  supported: true,
  typeMask: 0b11,
  lockCount: 4,
  attackWithSkillValue: 0,
});
const lockRandomOrbsRuntime = new Uint8Array(0x688);
const lockRandomOrbsRuntimeView = new DataView(lockRandomOrbsRuntime.buffer);
lockRandomOrbsRuntimeView.setUint32(0x678, 0b11, true);
lockRandomOrbsRuntimeView.setInt32(0x67c, 4, true);
lockRandomOrbsRuntimeView.setUint32(0x684, 6_018, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiLockRandomOrbsDefinition,
  lockRandomOrbsRuntime,
), {
  type: 94,
  kind: 'lockRandomOrbs',
  supported: true,
  typeMask: 0b11,
  lockCount: 4,
  selectionSeed: 6_018,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const enemyAiEnemyEscapeDefinition = enemyAiLockRandomOrbsDefinition.slice();
const enemyAiEnemyEscapeView = new DataView(enemyAiEnemyEscapeDefinition.buffer);
enemyAiEnemyEscapeView.setUint32(0x00, 9_075, true);
enemyAiEnemyEscapeView.setInt16(0x04, PAD_ENEMY_SKILL_ENEMY_ESCAPE, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiEnemyEscapeDefinition), {
  type: 95,
  kind: 'enemyEscape',
  supported: true,
  attackWithSkillValue: 0,
});
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiEnemyEscapeDefinition,
  new Uint8Array(0x680),
), {
  type: 95,
  kind: 'enemyEscape',
  supported: true,
  attackWithSkillValue: 0,
});
const enemyAiLockedSkyfallDefinition = enemyAiEnemyEscapeDefinition.slice();
const enemyAiLockedSkyfallView = new DataView(enemyAiLockedSkyfallDefinition.buffer);
enemyAiLockedSkyfallView.setUint32(0x00, 9_076, true);
enemyAiLockedSkyfallView.setInt16(0x04, PAD_ENEMY_SKILL_LOCKED_SKYFALL, true);
enemyAiLockedSkyfallView.setUint32(0x10, 0b1, true);
enemyAiLockedSkyfallView.setInt32(0x14, 2, true);
enemyAiLockedSkyfallView.setInt32(0x18, 4, true);
enemyAiLockedSkyfallView.setInt32(0x1c, 100, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiLockedSkyfallDefinition), {
  type: 96,
  kind: 'lockedSkyfall',
  supported: true,
  typeMask: 0b1,
  durationMin: 2,
  durationMax: 4,
  chancePercent: 100,
  attackWithSkillValue: 0,
});
const lockedSkyfallRuntime = new Uint8Array(0x684);
const lockedSkyfallRuntimeView = new DataView(lockedSkyfallRuntime.buffer);
lockedSkyfallRuntimeView.setUint32(0x678, 0b1, true);
lockedSkyfallRuntimeView.setInt32(0x67c, 4, true);
lockedSkyfallRuntimeView.setInt32(0x680, 100, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiLockedSkyfallDefinition,
  lockedSkyfallRuntime,
), {
  type: 96,
  kind: 'lockedSkyfall',
  supported: true,
  typeMask: 0b1,
  durationTurns: 4,
  chancePercent: 100,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const enemyAiStickyBlindRandomDefinition = enemyAiLockedSkyfallDefinition.slice();
const enemyAiStickyBlindRandomView = new DataView(enemyAiStickyBlindRandomDefinition.buffer);
enemyAiStickyBlindRandomView.setUint32(0x00, 9_077, true);
enemyAiStickyBlindRandomView.setInt16(0x04, PAD_ENEMY_SKILL_STICKY_BLIND_RANDOM, true);
enemyAiStickyBlindRandomView.setInt32(0x10, 3, true);
enemyAiStickyBlindRandomView.setInt32(0x14, 2, true);
enemyAiStickyBlindRandomView.setInt32(0x18, 4, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiStickyBlindRandomDefinition), {
  type: 97,
  kind: 'stickyBlindRandom',
  supported: true,
  durationTurns: 3,
  countMin: 2,
  countMax: 4,
  attackWithSkillValue: 0,
});
const stickyBlindRandomRuntime = new Uint8Array(0x684);
const stickyBlindRandomRuntimeView = new DataView(stickyBlindRandomRuntime.buffer);
stickyBlindRandomRuntimeView.setInt32(0x678, 3, true);
stickyBlindRandomRuntimeView.setInt32(0x67c, 4, true);
stickyBlindRandomRuntimeView.setUint32(0x680, 29_441, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiStickyBlindRandomDefinition,
  stickyBlindRandomRuntime,
), {
  type: 97,
  kind: 'stickyBlindRandom',
  supported: true,
  durationTurns: 3,
  blindCount: 4,
  selectionSeed: 29_441,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const enemyAiStickyBlindFixedDefinition = enemyAiStickyBlindRandomDefinition.slice();
const enemyAiStickyBlindFixedView = new DataView(enemyAiStickyBlindFixedDefinition.buffer);
enemyAiStickyBlindFixedView.setUint32(0x00, 9_078, true);
enemyAiStickyBlindFixedView.setInt16(0x04, PAD_ENEMY_SKILL_STICKY_BLIND_FIXED, true);
enemyAiStickyBlindFixedView.setInt32(0x10, 2, true);
[1, 2, 4, 8, 48].forEach((mask, row) => (
  enemyAiStickyBlindFixedView.setUint32(0x14 + row * 4, mask, true)
));
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiStickyBlindFixedDefinition), {
  type: 98,
  kind: 'stickyBlindFixed',
  supported: true,
  durationTurns: 2,
  rowMasks: [1, 2, 4, 8, 48],
  attackWithSkillValue: 0,
});
const stickyBlindFixedRuntime = new Uint8Array(0x688);
const stickyBlindFixedRuntimeView = new DataView(stickyBlindFixedRuntime.buffer);
stickyBlindFixedRuntimeView.setInt32(0x678, 2, true);
stickyBlindFixedRuntimeView.setUint32(0x67c, 1, true);
stickyBlindFixedRuntimeView.setUint32(0x684, 0, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiStickyBlindFixedDefinition,
  stickyBlindFixedRuntime,
), {
  type: 98,
  kind: 'stickyBlindFixed',
  supported: true,
  durationTurns: 2,
  rowMasks: [1, 2, 4, 8, 48],
  runtimeControl: 0,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const enemyAiOrbSealColumnsDefinition = enemyAiStickyBlindFixedDefinition.slice();
const enemyAiOrbSealColumnsView = new DataView(enemyAiOrbSealColumnsDefinition.buffer);
enemyAiOrbSealColumnsView.setUint32(0x00, 9_079, true);
enemyAiOrbSealColumnsView.setInt16(0x04, PAD_ENEMY_SKILL_ORB_SEAL_COLUMNS, true);
enemyAiOrbSealColumnsView.setUint32(0x10, 0b001010, true);
enemyAiOrbSealColumnsView.setInt32(0x14, 3, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiOrbSealColumnsDefinition), {
  type: 99,
  kind: 'orbSealColumns',
  supported: true,
  positionMask: 0b001010,
  durationTurns: 3,
  attackWithSkillValue: 0,
});
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiOrbSealColumnsDefinition,
  new Uint8Array(0x680),
), {
  type: 99,
  kind: 'orbSealColumns',
  supported: true,
  positionMask: 0b001010,
  durationTurns: 3,
  attackWithSkillValue: 0,
});
const enemyAiOrbSealRowsDefinition = enemyAiOrbSealColumnsDefinition.slice();
const enemyAiOrbSealRowsView = new DataView(enemyAiOrbSealRowsDefinition.buffer);
enemyAiOrbSealRowsView.setUint32(0x00, 9_080, true);
enemyAiOrbSealRowsView.setInt16(0x04, PAD_ENEMY_SKILL_ORB_SEAL_ROWS, true);
enemyAiOrbSealRowsView.setUint32(0x10, 0b01010, true);
enemyAiOrbSealRowsView.setInt32(0x14, 2, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiOrbSealRowsDefinition), {
  type: 100,
  kind: 'orbSealRows',
  supported: true,
  positionMask: 0b01010,
  durationTurns: 2,
  attackWithSkillValue: 0,
});
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiOrbSealRowsDefinition,
  new Uint8Array(0x680),
), {
  type: 100,
  kind: 'orbSealRows',
  supported: true,
  positionMask: 0b01010,
  durationTurns: 2,
  attackWithSkillValue: 0,
});
const enemyAiFixedStartDefinition = enemyAiOrbSealRowsDefinition.slice();
const enemyAiFixedStartView = new DataView(enemyAiFixedStartDefinition.buffer);
enemyAiFixedStartView.setUint32(0x00, 9_081, true);
enemyAiFixedStartView.setInt16(0x04, PAD_ENEMY_SKILL_FIXED_START, true);
enemyAiFixedStartView.setInt32(0x10, 1, true);
enemyAiFixedStartView.setInt32(0x14, 0, true);
enemyAiFixedStartView.setInt32(0x18, 0, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiFixedStartDefinition), {
  type: 101,
  kind: 'fixedStart',
  supported: true,
  randomPosition: true,
  authoredColumn: 0,
  authoredRowFromBottom: 0,
  attackWithSkillValue: 0,
});
const fixedStartRuntime = new Uint8Array(0x680);
const fixedStartRuntimeView = new DataView(fixedStartRuntime.buffer);
fixedStartRuntimeView.setInt32(0x678, 5, true);
fixedStartRuntimeView.setInt32(0x67c, 2, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiFixedStartDefinition,
  fixedStartRuntime,
), {
  type: 101,
  kind: 'fixedStart',
  supported: true,
  fixedColumn: 5,
  fixedRow: 2,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const enemyAiRandomBombsDefinition = enemyAiFixedStartDefinition.slice();
const enemyAiRandomBombsView = new DataView(enemyAiRandomBombsDefinition.buffer);
enemyAiRandomBombsView.setUint32(0x00, 9_082, true);
enemyAiRandomBombsView.setInt16(0x04, PAD_ENEMY_SKILL_RANDOM_BOMBS, true);
enemyAiRandomBombsView.setInt32(0x14, 4, true);
enemyAiRandomBombsView.setInt32(0x2c, 1, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiRandomBombsDefinition), {
  type: 102,
  kind: 'randomBombs',
  supported: true,
  bombCount: 4,
  lockedBombs: true,
  attackWithSkillValue: 0,
});
const randomBombsRuntime = new Uint8Array(0x680);
new DataView(randomBombsRuntime.buffer).setUint32(0x678, 6_018, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiRandomBombsDefinition,
  randomBombsRuntime,
), {
  type: 102,
  kind: 'randomBombs',
  supported: true,
  bombCount: 4,
  lockedBombs: true,
  selectionSeed: 6_018,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const enemyAiFixedBombsDefinition = enemyAiRandomBombsDefinition.slice();
const enemyAiFixedBombsView = new DataView(enemyAiFixedBombsDefinition.buffer);
enemyAiFixedBombsView.setUint32(0x00, 9_083, true);
enemyAiFixedBombsView.setInt16(0x04, PAD_ENEMY_SKILL_FIXED_BOMBS, true);
enemyAiFixedBombsView.setInt32(0x14, 0b000001, true);
enemyAiFixedBombsView.setInt32(0x18, 0b000010, true);
enemyAiFixedBombsView.setInt32(0x1c, 0b000100, true);
enemyAiFixedBombsView.setInt32(0x20, 0b001000, true);
enemyAiFixedBombsView.setInt32(0x24, 0b110000, true);
enemyAiFixedBombsView.setInt32(0x2c, 1, true);
const expectedFixedBombsDefinition = {
  type: 103,
  kind: 'fixedBombs',
  supported: true,
  rowMasks: [0b110000, 0b001000, 0b000100, 0b000010, 0b000001],
  lockedBombs: true,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiFixedBombsDefinition),
  expectedFixedBombsDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiFixedBombsDefinition, new Uint8Array(0x680)),
  expectedFixedBombsDefinition,
);
const enemyAiCloudDefinition = enemyAiFixedBombsDefinition.slice();
const enemyAiCloudView = new DataView(enemyAiCloudDefinition.buffer);
enemyAiCloudView.setUint32(0x00, 9_084, true);
enemyAiCloudView.setInt16(0x04, PAD_ENEMY_SKILL_CLOUD, true);
enemyAiCloudView.setInt32(0x10, 3, true);
enemyAiCloudView.setInt32(0x14, 2, true);
enemyAiCloudView.setInt32(0x18, 3, true);
enemyAiCloudView.setInt32(0x1c, 0, true);
enemyAiCloudView.setInt32(0x20, 0, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiCloudDefinition), {
  type: 104,
  kind: 'cloud',
  supported: true,
  durationTurns: 3,
  cloudHeightRows: 2,
  cloudWidthColumns: 3,
  authoredOriginY: 0,
  authoredOriginX: 0,
  attackWithSkillValue: 0,
});
const cloudRuntime = new Uint8Array(0x680);
const cloudRuntimeView = new DataView(cloudRuntime.buffer);
cloudRuntimeView.setUint32(0x678, 0, true);
cloudRuntimeView.setUint32(0x67c, 3, true);
assert.deepEqual(decodePadEnemySkillRuntime(enemyAiCloudDefinition, cloudRuntime), {
  type: 104,
  kind: 'cloud',
  supported: true,
  durationTurns: 3,
  cloudHeightRows: 2,
  cloudWidthColumns: 3,
  authoredOriginY: 0,
  authoredOriginX: 0,
  originRow: 0,
  originColumnFromRight: 3,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const enemyAiRecoveryDebuffDefinition = enemyAiCloudDefinition.slice();
const enemyAiRecoveryDebuffView = new DataView(enemyAiRecoveryDebuffDefinition.buffer);
enemyAiRecoveryDebuffView.setUint32(0x00, 9_085, true);
enemyAiRecoveryDebuffView.setInt16(0x04, PAD_ENEMY_SKILL_RECOVERY_DEBUFF, true);
enemyAiRecoveryDebuffView.setInt32(0x10, 3, true);
enemyAiRecoveryDebuffView.setInt32(0x14, 50, true);
const expectedRecoveryDebuffDefinition = {
  type: 105,
  kind: 'recoveryDebuff',
  supported: true,
  durationTurns: 3,
  recoveryPercent: 50,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiRecoveryDebuffDefinition),
  expectedRecoveryDebuffDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiRecoveryDebuffDefinition, new Uint8Array(0x680)),
  expectedRecoveryDebuffDefinition,
);
const enemyAiTurnChangeDefinition = enemyAiRecoveryDebuffDefinition.slice();
const enemyAiTurnChangeView = new DataView(enemyAiTurnChangeDefinition.buffer);
enemyAiTurnChangeView.setUint32(0x00, 9_086, true);
enemyAiTurnChangeView.setInt16(0x04, PAD_ENEMY_SKILL_TURN_CHANGE, true);
enemyAiTurnChangeView.setInt32(0x10, 50, true);
enemyAiTurnChangeView.setInt32(0x14, 1, true);
const expectedTurnChangeDefinition = {
  type: 106,
  kind: 'turnChangePassive',
  supported: true,
  passive: true,
  hpThresholdPercent: 50,
  turnCounter: 1,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiTurnChangeDefinition),
  expectedTurnChangeDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiTurnChangeDefinition, new Uint8Array(0x680)),
  { ...expectedTurnChangeDefinition, setupMaterialized: true },
);
assert.equal(padEnemyTurnChangeTriggered(46_340, 92_000, 50), true);
assert.equal(padEnemyTurnChangeTriggered(46_461, 92_000, 50), false);
assert.equal(padEnemyTurnChangeTriggered(1, 92_000, 0), false);
const enemyAiRemainingEnemiesTurnChangeDefinition = enemyAiTurnChangeDefinition.slice();
const enemyAiRemainingEnemiesTurnChangeView = new DataView(
  enemyAiRemainingEnemiesTurnChangeDefinition.buffer,
);
enemyAiRemainingEnemiesTurnChangeView.setUint32(0x00, 9_122, true);
enemyAiRemainingEnemiesTurnChangeView.setInt16(
  0x04,
  PAD_ENEMY_SKILL_REMAINING_ENEMIES_TURN_CHANGE,
  true,
);
enemyAiRemainingEnemiesTurnChangeView.setInt16(0x10, 1, true);
enemyAiRemainingEnemiesTurnChangeView.setInt16(0x14, -2, true);
const expectedRemainingEnemiesTurnChangeDefinition = {
  type: 122,
  kind: 'remainingEnemiesTurnChangePassive',
  supported: true,
  passive: true,
  remainingEnemiesThreshold: 1,
  turnCounter: -2,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiRemainingEnemiesTurnChangeDefinition),
  expectedRemainingEnemiesTurnChangeDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(
    enemyAiRemainingEnemiesTurnChangeDefinition,
    new Uint8Array(0x680),
  ),
  { ...expectedRemainingEnemiesTurnChangeDefinition, setupMaterialized: true },
);
assert.equal(padEnemyRemainingEnemiesTurnChangeTriggered(2, 1), false);
assert.equal(padEnemyRemainingEnemiesTurnChangeTriggered(1, 1), true);
assert.equal(padEnemyRemainingEnemiesTurnChangeTriggered(0, 1), false);
assert.equal(padEnemyRemainingEnemiesTurnChangeTriggered(1, 0), false);
const enemyAiAttributeBlockDefinition = enemyAiTurnChangeDefinition.slice();
const enemyAiAttributeBlockView = new DataView(enemyAiAttributeBlockDefinition.buffer);
enemyAiAttributeBlockView.setUint32(0x00, 9_087, true);
enemyAiAttributeBlockView.setInt16(0x04, PAD_ENEMY_SKILL_ATTRIBUTE_BLOCK, true);
enemyAiAttributeBlockView.setInt32(0x10, 3, true);
enemyAiAttributeBlockView.setInt32(0x14, 0x11, true);
const expectedAttributeBlockDefinition = {
  type: 107,
  kind: 'attributeBlock',
  supported: true,
  durationTurns: 3,
  typeMask: 0x11,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiAttributeBlockDefinition),
  expectedAttributeBlockDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiAttributeBlockDefinition, new Uint8Array(0x680)),
  expectedAttributeBlockDefinition,
);
const enemyAiOrbChangeAttackDefinition = enemyAiAttributeBlockDefinition.slice();
const enemyAiOrbChangeAttackView = new DataView(enemyAiOrbChangeAttackDefinition.buffer);
enemyAiOrbChangeAttackView.setUint32(0x00, 9_087, true);
enemyAiOrbChangeAttackView.setInt16(0x04, PAD_ENEMY_SKILL_ORB_CHANGE_ATTACK, true);
enemyAiOrbChangeAttackView.setInt32(0x10, 150, true);
enemyAiOrbChangeAttackView.setInt32(0x14, 1, true);
enemyAiOrbChangeAttackView.setInt32(0x18, 2, true);
const expectedOrbChangeAttackDefinition = {
  type: 48,
  kind: 'orbChangeAttack',
  supported: true,
  damagePercent: 150,
  sourceType: 1,
  destinationType: 2,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiOrbChangeAttackDefinition),
  expectedOrbChangeAttackDefinition,
);
const orbChangeAttackRuntime = new Uint8Array(0x68c);
const orbChangeAttackRuntimeView = new DataView(orbChangeAttackRuntime.buffer);
orbChangeAttackRuntimeView.setInt32(0x680, 150, true);
orbChangeAttackRuntimeView.setInt32(0x684, 1, true);
orbChangeAttackRuntimeView.setInt32(0x688, 2, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiOrbChangeAttackDefinition, orbChangeAttackRuntime),
  { ...expectedOrbChangeAttackDefinition, setupMaterialized: true },
);
const enemyAiAttackOrbChangeDefinition = enemyAiAttributeBlockDefinition.slice();
const enemyAiAttackOrbChangeView = new DataView(enemyAiAttackOrbChangeDefinition.buffer);
enemyAiAttackOrbChangeView.setUint32(0x00, 9_088, true);
enemyAiAttackOrbChangeView.setInt16(0x04, PAD_ENEMY_SKILL_ATTACK_ORB_CHANGE, true);
enemyAiAttackOrbChangeView.setInt32(0x10, 150, true);
enemyAiAttackOrbChangeView.setInt32(0x14, 0x01, true);
enemyAiAttackOrbChangeView.setInt32(0x18, 0x02, true);
const expectedAttackOrbChangeDefinition = {
  type: 108,
  kind: 'attackOrbChange',
  supported: true,
  damagePercent: 150,
  sourceTypeMask: 0x01,
  destinationTypeMask: 0x02,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiAttackOrbChangeDefinition),
  expectedAttackOrbChangeDefinition,
);
const attackOrbChangeRuntime = new Uint8Array(0x694);
const attackOrbChangeRuntimeView = new DataView(attackOrbChangeRuntime.buffer);
attackOrbChangeRuntimeView.setInt32(0x690, 150, true);
attackOrbChangeRuntimeView.setInt32(0x688, 0x01, true);
attackOrbChangeRuntimeView.setInt32(0x68c, 0x02, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiAttackOrbChangeDefinition, attackOrbChangeRuntime),
  { ...expectedAttackOrbChangeDefinition, setupMaterialized: true },
);
const enemyAiRandomSpinnersDefinition = enemyAiAttackOrbChangeDefinition.slice();
const enemyAiRandomSpinnersView = new DataView(enemyAiRandomSpinnersDefinition.buffer);
enemyAiRandomSpinnersView.setUint32(0x00, 9_089, true);
enemyAiRandomSpinnersView.setInt16(0x04, PAD_ENEMY_SKILL_RANDOM_SPINNERS, true);
enemyAiRandomSpinnersView.setInt32(0x10, 3, true);
enemyAiRandomSpinnersView.setInt32(0x14, 100, true);
enemyAiRandomSpinnersView.setInt32(0x18, 3, true);
const expectedRandomSpinnersDefinition = {
  type: 109,
  kind: 'randomSpinners',
  supported: true,
  durationTurns: 3,
  speedCentiseconds: 100,
  spinnerCount: 3,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiRandomSpinnersDefinition),
  expectedRandomSpinnersDefinition,
);
const randomSpinnersRuntime = new Uint8Array(0x680);
new DataView(randomSpinnersRuntime.buffer).setUint32(0x678, 6_018, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiRandomSpinnersDefinition, randomSpinnersRuntime),
  {
    ...expectedRandomSpinnersDefinition,
    selectionSeed: 6_018,
    setupMaterialized: true,
  },
);
const enemyAiFixedSpinnersDefinition = enemyAiRandomSpinnersDefinition.slice();
const enemyAiFixedSpinnersView = new DataView(enemyAiFixedSpinnersDefinition.buffer);
enemyAiFixedSpinnersView.setUint32(0x00, 9_090, true);
enemyAiFixedSpinnersView.setInt16(0x04, PAD_ENEMY_SKILL_FIXED_SPINNERS, true);
enemyAiFixedSpinnersView.setInt32(0x10, 4, true);
enemyAiFixedSpinnersView.setInt32(0x14, 50, true);
enemyAiFixedSpinnersView.setInt32(0x18, 0b000001, true);
enemyAiFixedSpinnersView.setInt32(0x1c, 0b000010, true);
enemyAiFixedSpinnersView.setInt32(0x20, 0b000100, true);
enemyAiFixedSpinnersView.setInt32(0x24, 0b001000, true);
enemyAiFixedSpinnersView.setInt32(0x28, 0b010000, true);
const expectedFixedSpinnersDefinition = {
  type: 110,
  kind: 'fixedSpinners',
  supported: true,
  durationTurns: 4,
  speedCentiseconds: 50,
  rowMasks: [0b010000, 0b001000, 0b000100, 0b000010, 0b000001],
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiFixedSpinnersDefinition),
  expectedFixedSpinnersDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiFixedSpinnersDefinition, new Uint8Array(0x680)),
  expectedFixedSpinnersDefinition,
);
const enemyAiMaxHpChangeDefinition = enemyAiFixedSpinnersDefinition.slice();
const enemyAiMaxHpChangeView = new DataView(enemyAiMaxHpChangeDefinition.buffer);
enemyAiMaxHpChangeView.setUint32(0x00, 9_091, true);
enemyAiMaxHpChangeView.setInt16(0x04, PAD_ENEMY_SKILL_MAX_HP_CHANGE, true);
enemyAiMaxHpChangeView.setInt32(0x10, 50, true);
enemyAiMaxHpChangeView.setInt32(0x14, 0, true);
enemyAiMaxHpChangeView.setInt32(0x18, 3, true);
const expectedMaxHpChangeDefinition = {
  type: 111,
  kind: 'maxHpChange',
  supported: true,
  maxHpPercent: 50,
  fixedMaxHp: 0,
  durationTurns: 3,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiMaxHpChangeDefinition),
  expectedMaxHpChangeDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiMaxHpChangeDefinition, new Uint8Array(0x680)),
  expectedMaxHpChangeDefinition,
);
assert.equal(padEnemySkillMaxHpParameter(50, 0), -50);
assert.equal(padEnemySkillMaxHpParameter(0, 8_000), 8_000);
assert.equal(padEnemySkillChangedMaxHp(12_001, -50), 6_001);
assert.equal(padEnemySkillChangedMaxHp(12_001, 8_000), 8_000);
assert.equal(padEnemySkillChangedMaxHp(12_001, 0), 12_001);
const enemyAiFixedTargetDefinition = enemyAiMaxHpChangeDefinition.slice();
const enemyAiFixedTargetView = new DataView(enemyAiFixedTargetDefinition.buffer);
enemyAiFixedTargetView.setUint32(0x00, 9_092, true);
enemyAiFixedTargetView.setInt16(0x04, PAD_ENEMY_SKILL_FIXED_TARGET, true);
enemyAiFixedTargetView.setInt32(0x10, 3, true);
const expectedFixedTargetDefinition = {
  type: 112,
  kind: 'fixedTarget',
  supported: true,
  durationTurns: 3,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiFixedTargetDefinition),
  expectedFixedTargetDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiFixedTargetDefinition, new Uint8Array(0x680)),
  expectedFixedTargetDefinition,
);
const enemyAiBoardSizeDefinition = enemyAiBlackFallDefinition.slice();
const enemyAiBoardSizeView = new DataView(enemyAiBoardSizeDefinition.buffer);
enemyAiBoardSizeView.setUint32(0x00, 9_093, true);
enemyAiBoardSizeView.setInt16(0x04, PAD_ENEMY_SKILL_BOARD_SIZE_CHANGE, true);
enemyAiBoardSizeView.setInt32(0x10, 7, true);
enemyAiBoardSizeView.setInt32(0x14, 2, true);
enemyAiBoardSizeView.setInt32(0x44, 125, true);
const expectedBoardSizeDefinition = {
  type: PAD_ENEMY_SKILL_BOARD_SIZE_CHANGE,
  kind: 'boardSizeChange',
  supported: true,
  durationTurns: 7,
  boardSizeSelector: 2,
  columns: 5,
  rows: 4,
  boardSizeCode: 0x45,
  attackWithSkillValue: 125,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiBoardSizeDefinition),
  expectedBoardSizeDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiBoardSizeDefinition, boardSizeMonsterRuntime),
  {
    ...expectedBoardSizeDefinition,
    durationTurns: 9,
    setupMaterialized: true,
  },
);
const boardSizeAiMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(boardSizeAiMonsterDefinition.buffer).setUint32(0xec, 9_093, true);
const selectedBoardSizeAi = selectPadEnemyAiNew(
  decodePadEnemyAiMonsterDefinition(boardSizeAiMonsterDefinition),
  [decodePadEnemyAiSkillDefinition(enemyAiBoardSizeDefinition)],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    boardSizeCode: 0x45,
    rngState: 21_900,
  },
);
assert.equal(selectedBoardSizeAi.skillId, 9_093);
assert.equal(selectedBoardSizeAi.effect.boardSizeCode, 0x45);
assert.equal(selectedBoardSizeAi.rngState, 394_448_415);
const blockedBoardSizeAi = selectPadEnemyAiNew(
  decodePadEnemyAiMonsterDefinition(boardSizeAiMonsterDefinition),
  [decodePadEnemyAiSkillDefinition(enemyAiBoardSizeDefinition)],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    boardSizeCode: 0x56,
    rngState: 21_900,
  },
);
assert.equal(blockedBoardSizeAi.skillId, null);
assert.equal(blockedBoardSizeAi.rngState, 21_900);
const enemyAiBranchComboDefinition = enemyAiFixedTargetDefinition.slice();
const enemyAiBranchComboView = new DataView(enemyAiBranchComboDefinition.buffer);
enemyAiBranchComboView.setUint32(0x00, 9_093, true);
enemyAiBranchComboView.setInt16(0x04, PAD_ENEMY_SKILL_BRANCH_COMBO, true);
const expectedBranchComboDefinition = {
  type: 113,
  kind: 'branchCombo',
  supported: true,
  controlFlow: true,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiBranchComboDefinition),
  expectedBranchComboDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiBranchComboDefinition, new Uint8Array(0x680)),
  expectedBranchComboDefinition,
);
const enemyAiBranchAttackAttributesDefinition = enemyAiBranchComboDefinition.slice();
const enemyAiBranchAttackAttributesView = new DataView(
  enemyAiBranchAttackAttributesDefinition.buffer,
);
enemyAiBranchAttackAttributesView.setUint32(0x00, 9_094, true);
enemyAiBranchAttackAttributesView.setInt16(
  0x04,
  PAD_ENEMY_SKILL_BRANCH_ATTACK_ATTRIBUTES,
  true,
);
enemyAiBranchAttackAttributesView.setInt32(0x14, 0b00011, true);
const expectedBranchAttackAttributesDefinition = {
  type: 114,
  kind: 'branchAttackAttributes',
  supported: true,
  controlFlow: true,
  attributeMask: 0b00011,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiBranchAttackAttributesDefinition),
  expectedBranchAttackAttributesDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(
    enemyAiBranchAttackAttributesDefinition,
    new Uint8Array(0x680),
  ),
  expectedBranchAttackAttributesDefinition,
);
const enemyAiBranchSkillUseDefinition = enemyAiBranchAttackAttributesDefinition.slice();
const enemyAiBranchSkillUseView = new DataView(enemyAiBranchSkillUseDefinition.buffer);
enemyAiBranchSkillUseView.setUint32(0x00, 9_095, true);
enemyAiBranchSkillUseView.setInt16(0x04, PAD_ENEMY_SKILL_BRANCH_SKILL_USE, true);
const expectedBranchSkillUseDefinition = {
  type: 115,
  kind: 'branchSkillUse',
  supported: true,
  controlFlow: true,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiBranchSkillUseDefinition),
  expectedBranchSkillUseDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiBranchSkillUseDefinition, new Uint8Array(0x680)),
  expectedBranchSkillUseDefinition,
);
const enemyAiBranchDamageDefinition = enemyAiBranchSkillUseDefinition.slice();
const enemyAiBranchDamageView = new DataView(enemyAiBranchDamageDefinition.buffer);
enemyAiBranchDamageView.setUint32(0x00, 9_096, true);
enemyAiBranchDamageView.setInt16(0x04, PAD_ENEMY_SKILL_BRANCH_DAMAGE, true);
enemyAiBranchDamageView.setInt32(0x14, 1_660, true);
const expectedBranchDamageDefinition = {
  type: 116,
  kind: 'branchDamage',
  supported: true,
  controlFlow: true,
  damageThreshold: 1_660,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiBranchDamageDefinition),
  expectedBranchDamageDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiBranchDamageDefinition, new Uint8Array(0x680)),
  expectedBranchDamageDefinition,
);
const enemyAiBranchErasedAttributesDefinition = enemyAiBranchDamageDefinition.slice();
const enemyAiBranchErasedAttributesView = new DataView(
  enemyAiBranchErasedAttributesDefinition.buffer,
);
enemyAiBranchErasedAttributesView.setUint32(0x00, 9_097, true);
enemyAiBranchErasedAttributesView.setInt16(
  0x04,
  PAD_ENEMY_SKILL_BRANCH_ERASED_ATTRIBUTES,
  true,
);
enemyAiBranchErasedAttributesView.setInt32(0x14, 0b100001, true);
const expectedBranchErasedAttributesDefinition = {
  type: 117,
  kind: 'branchErasedAttributes',
  supported: true,
  controlFlow: true,
  attributeMask: 0b100001,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiBranchErasedAttributesDefinition),
  expectedBranchErasedAttributesDefinition,
);
const enemyAiBranchRemainingEnemiesDefinition = enemyAiBranchErasedAttributesDefinition.slice();
const enemyAiBranchRemainingEnemiesView = new DataView(
  enemyAiBranchRemainingEnemiesDefinition.buffer,
);
enemyAiBranchRemainingEnemiesView.setUint32(0x00, 9_120, true);
enemyAiBranchRemainingEnemiesView.setInt16(
  0x04,
  PAD_ENEMY_SKILL_BRANCH_REMAINING_ENEMIES,
  true,
);
const expectedBranchRemainingEnemiesDefinition = {
  type: 120,
  kind: 'branchRemainingEnemies',
  supported: true,
  controlFlow: true,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiBranchRemainingEnemiesDefinition),
  expectedBranchRemainingEnemiesDefinition,
);
const enemyAiDamageImmunityOffDefinition = enemyAiBranchRemainingEnemiesDefinition.slice();
const enemyAiDamageImmunityOffView = new DataView(enemyAiDamageImmunityOffDefinition.buffer);
enemyAiDamageImmunityOffView.setUint32(0x00, 9_121, true);
enemyAiDamageImmunityOffView.setInt16(0x04, PAD_ENEMY_SKILL_DAMAGE_IMMUNITY_OFF, true);
const expectedDamageImmunityOffDefinition = {
  type: 121,
  kind: 'damageImmunityOff',
  supported: true,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiDamageImmunityOffDefinition),
  expectedDamageImmunityOffDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiDamageImmunityOffDefinition, new Uint8Array(0x680)),
  expectedDamageImmunityOffDefinition,
);
const directDamageImmunityOffEngine = new PuzzleEngine({ seed: 21_900 });
directDamageImmunityOffEngine.enemies[0].damageImmunityTurns = 3;
assert.equal(directDamageImmunityOffEngine.applyEnemySkillDefinition(
  enemyAiDamageImmunityOffDefinition,
), true);
assert.equal(directDamageImmunityOffEngine.enemies[0].damageImmunityTurns, 0);
const enemyAiDamageImmunityAltDefinition = enemyAiDamageImmunityOffDefinition.slice();
const enemyAiDamageImmunityAltView = new DataView(enemyAiDamageImmunityAltDefinition.buffer);
enemyAiDamageImmunityAltView.setUint32(0x00, 9_123, true);
enemyAiDamageImmunityAltView.setInt16(0x04, PAD_ENEMY_SKILL_DAMAGE_IMMUNITY_ALT, true);
enemyAiDamageImmunityAltView.setInt32(0x10, 3, true);
const expectedDamageImmunityAltDefinition = {
  type: 123,
  kind: 'damageImmunityAlt',
  supported: true,
  durationTurns: 3,
  presentationControllerValue: 1,
  attackWithSkillValue: 0,
};
assert.deepEqual(
  decodePadEnemySkillDefinition(enemyAiDamageImmunityAltDefinition),
  expectedDamageImmunityAltDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(
    enemyAiDamageImmunityAltDefinition,
    new Uint8Array(0x680),
  ),
  {
    ...expectedDamageImmunityAltDefinition,
    setupMaterialized: true,
  },
);
const directDamageImmunityAltEngine = new PuzzleEngine({ seed: 21_900 });
assert.equal(directDamageImmunityAltEngine.applyEnemySkillDefinition(
  enemyAiDamageImmunityAltDefinition,
), true);
assert.equal(directDamageImmunityAltEngine.enemies[0].damageImmunityTurns, 3);
assert.equal(directDamageImmunityAltEngine.enemies[0].damageImmunityPresentation, 1);
assert.deepEqual(directDamageImmunityAltEngine.snapshot().lastEnemySkill, {
  ...expectedDamageImmunityAltDefinition,
  setupMaterialized: false,
});
assert.deepEqual(
  decodePadEnemySkillRuntime(
    enemyAiBranchRemainingEnemiesDefinition,
    new Uint8Array(0x680),
  ),
  expectedBranchRemainingEnemiesDefinition,
);
assert.deepEqual(
  decodePadEnemySkillRuntime(
    enemyAiBranchErasedAttributesDefinition,
    new Uint8Array(0x680),
  ),
  expectedBranchErasedAttributesDefinition,
);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiUnconditionalHealDefinition,
  healEnemyMonsterRuntime,
), {
  type: 86,
  kind: 'healEnemy',
  supported: true,
  healPercent: 27,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const enemyAiDamageAbsorbDefinition = enemyAiUnconditionalHealDefinition.slice();
const enemyAiDamageAbsorbView = new DataView(enemyAiDamageAbsorbDefinition.buffer);
enemyAiDamageAbsorbView.setUint32(0x00, 9_068, true);
enemyAiDamageAbsorbView.setInt16(0x04, PAD_ENEMY_SKILL_DAMAGE_ABSORB, true);
enemyAiDamageAbsorbView.setInt32(0x10, 3, true);
enemyAiDamageAbsorbView.setInt32(0x14, 1_660, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiDamageAbsorbDefinition), {
  type: 87,
  kind: 'damageAbsorb',
  supported: true,
  durationTurns: 3,
  damageThreshold: 1_660,
  attackWithSkillValue: 0,
});
const damageAbsorbRuntime = new Uint8Array(0x680);
const damageAbsorbRuntimeView = new DataView(damageAbsorbRuntime.buffer);
damageAbsorbRuntimeView.setInt32(0x678, 3, true);
damageAbsorbRuntimeView.setInt32(0x67c, 1_660, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiDamageAbsorbDefinition,
  damageAbsorbRuntime,
), {
  type: 87,
  kind: 'damageAbsorb',
  supported: true,
  durationTurns: 3,
  damageThreshold: 1_660,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const signedDamageAbsorbDefinition = enemyAiDamageAbsorbDefinition.slice();
new DataView(signedDamageAbsorbDefinition.buffer).setInt32(0x14, -1, true);
assert.equal(
  decodePadEnemySkillDefinition(signedDamageAbsorbDefinition).damageThreshold,
  -1,
);
const enemyAiAwakeningBindDefinition = enemyAiDamageAbsorbDefinition.slice();
const enemyAiAwakeningBindView = new DataView(enemyAiAwakeningBindDefinition.buffer);
enemyAiAwakeningBindView.setUint32(0x00, 9_069, true);
enemyAiAwakeningBindView.setInt16(0x04, PAD_ENEMY_SKILL_AWAKENING_BIND, true);
enemyAiAwakeningBindView.setInt32(0x10, 4, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiAwakeningBindDefinition), {
  type: 88,
  kind: 'awakeningBind',
  supported: true,
  durationTurns: 4,
  attackWithSkillValue: 0,
});
const awakeningBindRuntime = new Uint8Array(0x680);
const awakeningBindRuntimeView = new DataView(awakeningBindRuntime.buffer);
awakeningBindRuntimeView.setUint16(0x674, 0x12ab, true);
awakeningBindRuntimeView.setInt32(0x678, 4, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiAwakeningBindDefinition,
  awakeningBindRuntime,
), {
  type: 88,
  kind: 'awakeningBind',
  supported: true,
  durationTurns: 4,
  nativeSetupValue: 0xab,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const enemyAiSkillDelayDefinition = enemyAiDamageAbsorbDefinition.slice();
const enemyAiSkillDelayView = new DataView(enemyAiSkillDelayDefinition.buffer);
enemyAiSkillDelayView.setUint32(0x00, 9_070, true);
enemyAiSkillDelayView.setInt16(0x04, PAD_ENEMY_SKILL_SKILL_DELAY, true);
enemyAiSkillDelayView.setInt32(0x10, 2, true);
enemyAiSkillDelayView.setInt32(0x14, 4, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiSkillDelayDefinition), {
  type: 89,
  kind: 'skillDelay',
  supported: true,
  delayMin: 2,
  delayMax: 4,
  attackWithSkillValue: 0,
});
const skillDelayRuntime = new Uint8Array(0x690);
const skillDelayRuntimeView = new DataView(skillDelayRuntime.buffer);
skillDelayRuntimeView.setUint16(0x674, 0x21, true);
[2, 0, 0, 0, 0, 4].forEach((delay, index) => {
  skillDelayRuntimeView.setInt32(0x678 + index * 4, delay, true);
});
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiSkillDelayDefinition,
  skillDelayRuntime,
), {
  type: 89,
  kind: 'skillDelay',
  supported: true,
  targetMask: 0x21,
  skillDelays: [2, 0, 0, 0, 0, 4],
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const enemyAiAdditionalAttackDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiAdditionalAttackView = new DataView(enemyAiAdditionalAttackDefinition.buffer);
enemyAiAdditionalAttackView.setUint32(0x00, 9_037, true);
enemyAiAdditionalAttackView.setInt16(0x04, PAD_ENEMY_SKILL_ADDITIONAL_ATTACK, true);
enemyAiAdditionalAttackView.setInt32(0x10, 120, true);
enemyAiAdditionalAttackView.setInt32(0x14, 140, true);
enemyAiAdditionalAttackView.setInt32(0x30, 10_000, true);
enemyAiAdditionalAttackView.setInt32(0x34, 1_000, true);
enemyAiAdditionalAttackView.setInt32(0x38, 100, true);
enemyAiAdditionalAttackView.setInt32(0x40, 20, true);
enemyAiAdditionalAttackView.setInt32(0x44, 50, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiAdditionalAttackDefinition), {
  type: 8,
  kind: 'additionalAttack',
  supported: true,
  percentMin: 120,
  percentMax: 140,
  attackWithSkillValue: 50,
});
const additionalAttackMonsterRuntime = new Uint8Array(0x680);
new DataView(additionalAttackMonsterRuntime.buffer).setInt32(0x678, 135, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiAdditionalAttackDefinition,
  additionalAttackMonsterRuntime,
), {
  type: 8,
  kind: 'additionalAttack',
  supported: true,
  damagePercent: 135,
  setupMaterialized: true,
  attackWithSkillValue: 50,
});
const enemyAiDefenseBoostDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiDefenseBoostView = new DataView(enemyAiDefenseBoostDefinition.buffer);
enemyAiDefenseBoostView.setUint32(0x00, 9_038, true);
enemyAiDefenseBoostView.setInt16(0x04, PAD_ENEMY_SKILL_DEFENSE_BOOST, true);
enemyAiDefenseBoostView.setInt32(0x10, 3, true);
enemyAiDefenseBoostView.setInt32(0x14, 150, true);
enemyAiDefenseBoostView.setInt32(0x18, 200, true);
enemyAiDefenseBoostView.setInt32(0x30, 10_000, true);
enemyAiDefenseBoostView.setInt32(0x34, 1_000, true);
enemyAiDefenseBoostView.setInt32(0x38, 100, true);
enemyAiDefenseBoostView.setInt32(0x40, 20, true);
enemyAiDefenseBoostView.setInt32(0x44, 0, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiDefenseBoostDefinition), {
  type: 9,
  kind: 'defenseBoost',
  supported: true,
  durationTurns: 3,
  percentMin: 150,
  percentMax: 200,
  attackWithSkillValue: 0,
});
const defenseBoostMonsterRuntime = new Uint8Array(0x680);
const defenseBoostMonsterRuntimeView = new DataView(defenseBoostMonsterRuntime.buffer);
defenseBoostMonsterRuntimeView.setInt32(0x678, 3, true);
defenseBoostMonsterRuntimeView.setInt32(0x67c, 175, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiDefenseBoostDefinition,
  defenseBoostMonsterRuntime,
), {
  type: 9,
  kind: 'defenseBoost',
  supported: true,
  durationTurns: 3,
  boostPercent: 175,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
assert.equal(padEnemySkillDefenseBoost(120, 175), 210);
const defenseBoostEngine = new PuzzleEngine({ seed: 21_900 });
defenseBoostEngine.setRngState(21_900);
assert.equal(defenseBoostEngine.applyEnemySkillDefinition(enemyAiDefenseBoostDefinition), true);
assert.equal(defenseBoostEngine.enemies[0].defenseBoostTurns, 3);
assert.equal(defenseBoostEngine.enemies[0].defenseBoostAmount, 185);
assert.equal(defenseBoostEngine.lastEnemySkill.boostPercent, 154);
assert.equal(defenseBoostEngine.rng.state, padLcgStep(21_900).state);
const enemyAiAttributeNullifyDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiAttributeNullifyView = new DataView(enemyAiAttributeNullifyDefinition.buffer);
enemyAiAttributeNullifyView.setUint32(0x00, 9_039, true);
enemyAiAttributeNullifyView.setInt16(0x04, PAD_ENEMY_SKILL_ATTRIBUTE_NULLIFY, true);
enemyAiAttributeNullifyView.setInt32(0x10, 4, true);
enemyAiAttributeNullifyView.setInt32(0x14, 0, true);
enemyAiAttributeNullifyView.setInt32(0x44, 0, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiAttributeNullifyDefinition), {
  type: 10,
  kind: 'attributeNullify',
  supported: true,
  durationTurns: 4,
  attributes: [0],
  attackWithSkillValue: 0,
});
const attributeNullifyMonsterRuntime = new Uint8Array(0x680);
const attributeNullifyMonsterRuntimeView = new DataView(attributeNullifyMonsterRuntime.buffer);
attributeNullifyMonsterRuntimeView.setInt32(0x678, 4, true);
attributeNullifyMonsterRuntimeView.setInt32(0x67c, 0, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiAttributeNullifyDefinition,
  attributeNullifyMonsterRuntime,
), {
  type: 10,
  kind: 'attributeNullify',
  supported: true,
  durationTurns: 4,
  attributes: [0],
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const enemyAiDualAttributeNullifyDefinition = enemyAiAttributeNullifyDefinition.slice();
const enemyAiDualAttributeNullifyView = new DataView(enemyAiDualAttributeNullifyDefinition.buffer);
enemyAiDualAttributeNullifyView.setUint32(0x00, 9_040, true);
enemyAiDualAttributeNullifyView.setInt16(0x04, PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY, true);
enemyAiDualAttributeNullifyView.setInt32(0x14, 0, true);
enemyAiDualAttributeNullifyView.setInt32(0x18, 4, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiDualAttributeNullifyDefinition), {
  type: 11,
  kind: 'attributeNullify',
  supported: true,
  durationTurns: 4,
  attributes: [0, 4],
  attackWithSkillValue: 0,
});
assert.equal(padEnemySkillAttributeNullifyMask([0, 4]), 0x11);
const attributeNullifyEngine = new PuzzleEngine({ seed: 21_900 });
assert.equal(attributeNullifyEngine.applyEnemySkillDefinition(
  enemyAiDualAttributeNullifyDefinition,
), true);
assert.equal(attributeNullifyEngine.enemies[0].attributeNullifyTurns, 4);
assert.equal(attributeNullifyEngine.enemies[0].attributeNullifyMask, 0x11);
attributeNullifyEngine.enemies[0].hp = 50_000;
attributeNullifyEngine.enemies[1].hp = 0;
attributeNullifyEngine.party.forEach((member, index) => {
  if (index !== 0) member.bindTurns = 5;
});
attributeNullifyEngine.party[0].leaderSkill = null;
attributeNullifyEngine.comboCount = 1;
attributeNullifyEngine.turnMatches = [{
  type: 'fire', size: 3, enhancedCount: 0, enhancementMultiplier: 1, isMassAttack: false,
}];
attributeNullifyEngine.resolvePlayerTurn();
assert.equal(attributeNullifyEngine.lastDamage, 0);
assert.equal(attributeNullifyEngine.enemies[0].hp, 50_000);
const randomSourceOrbConversionDefinition = enemyAiSourceOrbConversionDefinition.slice();
const randomSourceOrbConversionView = new DataView(randomSourceOrbConversionDefinition.buffer);
randomSourceOrbConversionView.setInt32(0x10, -1, true);
randomSourceOrbConversionView.setInt32(0x14, -1, true);
const randomSourceOrbConversionEngine = new PuzzleEngine({ seed: 21_900 });
randomSourceOrbConversionEngine.setBoardFromCodes(Array(5).fill('RRRRRR'));
randomSourceOrbConversionEngine.setRngState(21_900);
assert.equal(randomSourceOrbConversionEngine.applyEnemySkillDefinition(
  randomSourceOrbConversionDefinition,
), true);
assert.equal(randomSourceOrbConversionEngine.lastEnemySkill.sourceType, 0);
assert.ok(randomSourceOrbConversionEngine.lastEnemySkill.destinationType >= 1);
assert.ok(randomSourceOrbConversionEngine.lastEnemySkill.destinationType <= 4);
assert.equal(randomSourceOrbConversionEngine.board.flat()
  .every((orb) => orb.type !== 'fire'), true);
assert.equal(randomSourceOrbConversionEngine.rng.state,
  Array.from({ length: 4 }).reduce((state) => padLcgStep(state).state, 21_900));
const enemyAiSourceToJammerDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiSourceToJammerView = new DataView(enemyAiSourceToJammerDefinition.buffer);
enemyAiSourceToJammerView.setUint32(0x00, 9_034, true);
enemyAiSourceToJammerView.setInt16(0x04, PAD_ENEMY_SKILL_SOURCE_TO_JAMMER, true);
enemyAiSourceToJammerView.setInt32(0x10, 5, true);
enemyAiSourceToJammerView.setInt32(0x44, 0, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiSourceToJammerDefinition), {
  type: 12,
  kind: 'sourceToJammer',
  supported: true,
  sourceType: 5,
  destinationType: 6,
  attackWithSkillValue: 0,
});
const sourceToJammerMonsterRuntime = new Uint8Array(0x680);
new DataView(sourceToJammerMonsterRuntime.buffer).setInt32(0x678, 4, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiSourceToJammerDefinition,
  sourceToJammerMonsterRuntime,
), {
  type: 12,
  kind: 'sourceToJammer',
  supported: true,
  sourceType: 4,
  destinationType: 6,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const sourceToJammerEngine = new PuzzleEngine({ seed: 21_900 });
sourceToJammerEngine.setBoardFromCodes(['HHHRBD', 'GLDRBG', 'RBRDGL', 'DLGRHB', 'HRRGLD']);
assert.equal(sourceToJammerEngine.applyEnemySkillDefinition(enemyAiSourceToJammerDefinition), true);
assert.equal(sourceToJammerEngine.board.flat().filter((orb) => orb.type === 'heart').length, 0);
assert.equal(sourceToJammerEngine.board.flat().filter((orb) => orb.type === 'jammer').length, 5);
assert.equal(padEnemySkillBoostedAttack(1_850, 100, 200), 3_700);
assert.equal(padEnemySkillBoostedAttack(1_850, 50, 200), 1_850);
const enemyAiLoneAttackBoostDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiLoneAttackBoostView = new DataView(enemyAiLoneAttackBoostDefinition.buffer);
enemyAiLoneAttackBoostView.setUint32(0x00, 9_030, true);
enemyAiLoneAttackBoostView.setInt16(0x04, PAD_ENEMY_SKILL_LONE_ATTACK_BOOST, true);
enemyAiLoneAttackBoostView.setInt32(0x14, 3, true);
enemyAiLoneAttackBoostView.setInt32(0x18, 200, true);
enemyAiLoneAttackBoostView.setInt32(0x44, 50, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiLoneAttackBoostDefinition), {
  type: 17,
  kind: 'loneAttackBoost',
  supported: true,
  durationTurns: 3,
  boostPercent: 200,
  attackWithSkillValue: 50,
});
const loneAttackBoostMonsterRuntime = new Uint8Array(0x680);
const loneAttackBoostMonsterRuntimeView = new DataView(loneAttackBoostMonsterRuntime.buffer);
loneAttackBoostMonsterRuntimeView.setInt32(0x678, 5, true);
loneAttackBoostMonsterRuntimeView.setInt32(0x67c, 175, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(
    enemyAiLoneAttackBoostDefinition,
    loneAttackBoostMonsterRuntime,
  ),
  {
    type: 17,
    kind: 'loneAttackBoost',
    supported: true,
    durationTurns: 5,
    boostPercent: 175,
    setupMaterialized: true,
    attackWithSkillValue: 50,
  },
);
const enemyAiStatusTriggeredAttackBoostDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiStatusTriggeredAttackBoostView = new DataView(
  enemyAiStatusTriggeredAttackBoostDefinition.buffer,
);
enemyAiStatusTriggeredAttackBoostView.setUint32(0x00, 9_031, true);
enemyAiStatusTriggeredAttackBoostView.setInt16(
  0x04,
  PAD_ENEMY_SKILL_STATUS_TRIGGERED_ATTACK_BOOST,
  true,
);
enemyAiStatusTriggeredAttackBoostView.setInt32(0x10, 2, true);
enemyAiStatusTriggeredAttackBoostView.setInt32(0x14, 250, true);
enemyAiStatusTriggeredAttackBoostView.setInt32(0x44, 50, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiStatusTriggeredAttackBoostDefinition), {
  type: 18,
  kind: 'statusTriggeredAttackBoost',
  supported: true,
  durationTurns: 2,
  boostPercent: 250,
  attackWithSkillValue: 50,
});
const statusTriggeredAttackBoostMonsterRuntime = new Uint8Array(0x680);
const statusTriggeredAttackBoostMonsterRuntimeView = new DataView(
  statusTriggeredAttackBoostMonsterRuntime.buffer,
);
statusTriggeredAttackBoostMonsterRuntimeView.setInt32(0x678, 4, true);
statusTriggeredAttackBoostMonsterRuntimeView.setInt32(0x67c, 225, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(
    enemyAiStatusTriggeredAttackBoostDefinition,
    statusTriggeredAttackBoostMonsterRuntime,
  ),
  {
    type: 18,
    kind: 'statusTriggeredAttackBoost',
    supported: true,
    durationTurns: 4,
    boostPercent: 225,
    setupMaterialized: true,
    attackWithSkillValue: 50,
  },
);
const enemyAiDamagedTurnAttackBoostDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiDamagedTurnAttackBoostView = new DataView(
  enemyAiDamagedTurnAttackBoostDefinition.buffer,
);
enemyAiDamagedTurnAttackBoostView.setUint32(0x00, 9_032, true);
enemyAiDamagedTurnAttackBoostView.setInt16(
  0x04,
  PAD_ENEMY_SKILL_DAMAGED_TURN_ATTACK_BOOST,
  true,
);
enemyAiDamagedTurnAttackBoostView.setInt32(0x10, 2, true);
enemyAiDamagedTurnAttackBoostView.setInt32(0x14, 4, true);
enemyAiDamagedTurnAttackBoostView.setInt32(0x18, 300, true);
enemyAiDamagedTurnAttackBoostView.setInt32(0x44, 50, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiDamagedTurnAttackBoostDefinition), {
  type: 19,
  kind: 'damagedTurnAttackBoost',
  supported: true,
  damagedTurnThreshold: 2,
  durationTurns: 4,
  boostPercent: 300,
  attackWithSkillValue: 50,
});
const damagedTurnAttackBoostMonsterRuntime = new Uint8Array(0x680);
const damagedTurnAttackBoostMonsterRuntimeView = new DataView(
  damagedTurnAttackBoostMonsterRuntime.buffer,
);
damagedTurnAttackBoostMonsterRuntimeView.setInt32(0x678, 6, true);
damagedTurnAttackBoostMonsterRuntimeView.setInt32(0x67c, 275, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(
    enemyAiDamagedTurnAttackBoostDefinition,
    damagedTurnAttackBoostMonsterRuntime,
  ),
  {
    type: 19,
    kind: 'damagedTurnAttackBoost',
    supported: true,
    durationTurns: 6,
    boostPercent: 275,
    damagedTurnThreshold: 2,
    setupMaterialized: true,
    attackWithSkillValue: 50,
  },
);
assert.equal(padEnemySkillMoveTimeSeconds(5, 125, 0), 3.75);
assert.equal(padEnemySkillMoveTimeSeconds(5, 125, 40), 3);
assert.equal(padEnemySkillMoveTimeSeconds(5, -100, 0), 6);
const enemyAiMoveTimeReductionDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiMoveTimeReductionView = new DataView(enemyAiMoveTimeReductionDefinition.buffer);
enemyAiMoveTimeReductionView.setUint32(0x00, 9_028, true);
enemyAiMoveTimeReductionView.setInt16(0x04, PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION, true);
enemyAiMoveTimeReductionView.setInt32(0x10, 2, true);
enemyAiMoveTimeReductionView.setInt32(0x14, 125, true);
enemyAiMoveTimeReductionView.setInt32(0x18, 0, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiMoveTimeReductionDefinition), {
  type: 39,
  kind: 'moveTimeReduction',
  supported: true,
  durationTurns: 2,
  fixedReductionCentiseconds: 125,
  percentReduction: 0,
  attackWithSkillValue: 0,
});
const moveTimeReductionMonsterRuntime = new Uint8Array(0x684);
const moveTimeReductionMonsterRuntimeView = new DataView(
  moveTimeReductionMonsterRuntime.buffer,
);
moveTimeReductionMonsterRuntimeView.setInt32(0x678, 3, true);
moveTimeReductionMonsterRuntimeView.setInt32(0x67c, 100, true);
moveTimeReductionMonsterRuntimeView.setInt32(0x680, 40, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(
    enemyAiMoveTimeReductionDefinition,
    moveTimeReductionMonsterRuntime,
  ),
  {
    type: 39,
    kind: 'moveTimeReduction',
    supported: true,
    durationTurns: 3,
    fixedReductionCentiseconds: 100,
    percentReduction: 40,
    setupMaterialized: true,
    attackWithSkillValue: 0,
  },
);
const moveTimeReductionRuntimeEngine = new PuzzleEngine({ seed: 21_900 });
moveTimeReductionRuntimeEngine.setRngState(21_900);
assert.equal(moveTimeReductionRuntimeEngine.applyEnemySkillRuntime(
  enemyAiMoveTimeReductionDefinition,
  moveTimeReductionMonsterRuntime,
), true);
assert.equal(moveTimeReductionRuntimeEngine.moveTime, 3);
assert.equal(moveTimeReductionRuntimeEngine.moveTimeReduction.turnsRemaining, 3);
assert.equal(moveTimeReductionRuntimeEngine.moveTimeReduction.percentMode, true);
assert.equal(moveTimeReductionRuntimeEngine.rng.state, 21_900);
const enemyAiSelfDestructDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiSelfDestructView = new DataView(enemyAiSelfDestructDefinition.buffer);
enemyAiSelfDestructView.setUint32(0x00, 9_027, true);
enemyAiSelfDestructView.setInt16(0x04, PAD_ENEMY_SKILL_SELF_DESTRUCT, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiSelfDestructDefinition), {
  type: 40,
  kind: 'selfDestruct',
  supported: true,
  attackWithSkillValue: 0,
});
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiSelfDestructDefinition, new Uint8Array(0x680)),
  {
    type: 40,
    kind: 'selfDestruct',
    supported: true,
    attackWithSkillValue: 0,
  },
);
const selfDestructRuntimeEngine = new PuzzleEngine({ seed: 21_900 });
selfDestructRuntimeEngine.setRngState(21_900);
assert.equal(selfDestructRuntimeEngine.applyEnemySkillRuntime(
  enemyAiSelfDestructDefinition,
  new Uint8Array(0x680),
), true);
assert.equal(selfDestructRuntimeEngine.enemies[0].hp, 0);
assert.equal(selfDestructRuntimeEngine.rng.state, 21_900);
const enemyAiChangeAttributeDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiChangeAttributeView = new DataView(enemyAiChangeAttributeDefinition.buffer);
enemyAiChangeAttributeView.setUint32(0x00, 9_025, true);
enemyAiChangeAttributeView.setInt16(0x04, PAD_ENEMY_SKILL_CHANGE_ATTRIBUTE, true);
[0, 2, 1, 3, 9].forEach((attribute, index) => {
  enemyAiChangeAttributeView.setInt32(0x10 + index * 4, attribute, true);
});
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiChangeAttributeDefinition), {
  type: 46,
  kind: 'changeEnemyAttribute',
  supported: true,
  candidateAttributes: [0, 2, 1, 3, 9],
  attackWithSkillValue: 0,
});
assert.deepEqual(padEnemySkillAttributeCandidates([0, 0, 2, 1, 9], 2), [0, 0, 1]);
const changeAttributeMonsterRuntime = new Uint8Array(0x680);
new DataView(changeAttributeMonsterRuntime.buffer).setInt32(0x678, 4, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiChangeAttributeDefinition, changeAttributeMonsterRuntime),
  {
    type: 46,
    kind: 'changeEnemyAttribute',
    supported: true,
    candidateAttributes: [0, 2, 1, 3, 9],
    targetAttribute: 4,
    setupMaterialized: true,
    attackWithSkillValue: 0,
  },
);
const changeAttributeRuntimeEngine = new PuzzleEngine({ seed: 21_900 });
changeAttributeRuntimeEngine.setRngState(21_900);
assert.equal(changeAttributeRuntimeEngine.applyEnemySkillRuntime(
  enemyAiChangeAttributeDefinition,
  changeAttributeMonsterRuntime,
  0,
), true);
assert.equal(changeAttributeRuntimeEngine.enemies[0].attribute, 'dark');
assert.equal(changeAttributeRuntimeEngine.rng.state, 21_900);
const changeAttributeTargetEngine = new PuzzleEngine({ seed: 21_900 });
changeAttributeTargetEngine.setRngState(21_900);
const untouchedAttribute = changeAttributeTargetEngine.enemies[0].attribute;
changeAttributeTargetEngine.enemies[1].attribute = 'dark';
assert.equal(changeAttributeTargetEngine.applyEnemySkillRecord(
  decodePadEnemySkillDefinition(enemyAiChangeAttributeDefinition),
  1,
), true);
assert.equal(changeAttributeTargetEngine.enemies[0].attribute, untouchedAttribute);
assert.equal(changeAttributeTargetEngine.enemies[1].attribute, 'fire');
assert.equal(changeAttributeTargetEngine.rng.state, padLcgStep(21_900).state);
const enemyAiCurrentHpGravityDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiCurrentHpGravityView = new DataView(enemyAiCurrentHpGravityDefinition.buffer);
enemyAiCurrentHpGravityView.setUint32(0x00, 9_023, true);
enemyAiCurrentHpGravityView.setInt16(0x04, PAD_ENEMY_SKILL_CURRENT_HP_GRAVITY, true);
enemyAiCurrentHpGravityView.setInt32(0x10, 25, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiCurrentHpGravityDefinition), {
  type: 50,
  kind: 'currentHpGravity',
  supported: true,
  damagePercent: 25,
  attackWithSkillValue: 0,
});
const currentHpGravityMonsterRuntime = new Uint8Array(0x680);
new DataView(currentHpGravityMonsterRuntime.buffer).setInt32(0x678, 37, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(
    enemyAiCurrentHpGravityDefinition,
    currentHpGravityMonsterRuntime,
  ),
  {
    type: 50,
    kind: 'currentHpGravity',
    supported: true,
    damagePercent: 37,
    attackWithSkillValue: 0,
  },
);
const enemyAiReviveEnemyDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiReviveEnemyView = new DataView(enemyAiReviveEnemyDefinition.buffer);
enemyAiReviveEnemyView.setUint32(0x00, 9_022, true);
enemyAiReviveEnemyView.setInt16(0x04, PAD_ENEMY_SKILL_REVIVE_ENEMY, true);
enemyAiReviveEnemyView.setInt32(0x10, 37, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiReviveEnemyDefinition), {
  type: 52,
  kind: 'reviveEnemy',
  supported: true,
  revivePercent: 37,
  attackWithSkillValue: 0,
});
const reviveEnemyMonsterRuntime = new Uint8Array(0x680);
const reviveEnemyMonsterRuntimeView = new DataView(reviveEnemyMonsterRuntime.buffer);
reviveEnemyMonsterRuntimeView.setInt32(0x678, 1, true);
reviveEnemyMonsterRuntimeView.setInt32(0x67c, 37, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiReviveEnemyDefinition, reviveEnemyMonsterRuntime),
  {
    type: 52,
    kind: 'reviveEnemy',
    supported: true,
    targetEnemyIndex: 1,
    revivePercent: 37,
    setupMaterialized: true,
    attackWithSkillValue: 0,
  },
);
const reviveRuntimeEngine = new PuzzleEngine({ seed: 21_900 });
reviveRuntimeEngine.setRngState(21_900);
reviveRuntimeEngine.enemies[1].hp = 0;
reviveRuntimeEngine.enemies[1].counter = 1;
assert.equal(reviveRuntimeEngine.applyEnemySkillRuntime(
  enemyAiReviveEnemyDefinition,
  reviveEnemyMonsterRuntime,
), true);
assert.equal(reviveRuntimeEngine.enemies[1].hp, 28_120);
assert.equal(reviveRuntimeEngine.enemies[1].counter, 1);
assert.equal(reviveRuntimeEngine.lastEnemySkill.revivedHp, 28_120);
assert.equal(reviveRuntimeEngine.rng.state, 21_900);
const enemyAiBindLeaderHelperDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiBindLeaderHelperView = new DataView(enemyAiBindLeaderHelperDefinition.buffer);
enemyAiBindLeaderHelperView.setUint32(0x00, 9_020, true);
enemyAiBindLeaderHelperView.setInt16(0x04, PAD_ENEMY_SKILL_BIND_LEADER_HELPER, true);
enemyAiBindLeaderHelperView.setUint8(0x10, 3);
enemyAiBindLeaderHelperView.setInt32(0x14, 2, true);
enemyAiBindLeaderHelperView.setInt32(0x18, 4, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiBindLeaderHelperDefinition), {
  type: 54,
  kind: 'bindLeaderHelper',
  supported: true,
  targetFlags: 3,
  durationMin: 2,
  durationMax: 4,
  attackWithSkillValue: 0,
});
const bindLeaderHelperMonsterRuntime = new Uint8Array(0x680);
const bindLeaderHelperMonsterRuntimeView = new DataView(bindLeaderHelperMonsterRuntime.buffer);
bindLeaderHelperMonsterRuntimeView.setUint16(0x674, 0x21, true);
bindLeaderHelperMonsterRuntimeView.setInt32(0x678, 4, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(
    enemyAiBindLeaderHelperDefinition,
    bindLeaderHelperMonsterRuntime,
  ),
  {
    type: 54,
    kind: 'bindLeaderHelper',
    supported: true,
    targetFlags: 3,
    durationMin: 2,
    durationMax: 4,
    targetMask: 0x21,
    setupDurationTurns: 4,
    setupMaterialized: true,
    attackWithSkillValue: 0,
  },
);
const bindRuntimeEngine = new PuzzleEngine({ seed: 21_900 });
bindRuntimeEngine.setRngState(21_900);
assert.equal(bindRuntimeEngine.applyEnemySkillRuntime(
  enemyAiBindLeaderHelperDefinition,
  bindLeaderHelperMonsterRuntime,
), true);
assert.equal(bindRuntimeEngine.party[0].bindTurns, 2);
assert.equal(bindRuntimeEngine.party[5].bindTurns, 2);
assert.equal(bindRuntimeEngine.lastEnemySkill.setupDurationTurns, 4);
assert.equal(bindRuntimeEngine.lastEnemySkill.durationTurns, 2);
assert.equal(bindRuntimeEngine.rng.state, padLcgStep(21_900).state);
const enemyAiEntireBlindDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiEntireBlindView = new DataView(enemyAiEntireBlindDefinition.buffer);
enemyAiEntireBlindView.setUint32(0x00, 9_041, true);
enemyAiEntireBlindView.setInt16(0x04, PAD_ENEMY_SKILL_ENTIRE_BLIND, true);
enemyAiEntireBlindView.setInt32(0x30, 10_000, true);
enemyAiEntireBlindView.setInt32(0x34, 1_000, true);
enemyAiEntireBlindView.setInt32(0x38, 100, true);
enemyAiEntireBlindView.setInt32(0x40, 20, true);
enemyAiEntireBlindView.setInt32(0x44, 50, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiEntireBlindDefinition), {
  type: 5,
  kind: 'entireBlind',
  supported: true,
  attackWithSkillValue: 50,
});
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiEntireBlindDefinition, new Uint8Array(0x680)),
  {
    type: 5,
    kind: 'entireBlind',
    supported: true,
    attackWithSkillValue: 50,
  },
);
const enemyAiEntireBlindAltDefinition = enemyAiEntireBlindDefinition.slice();
const enemyAiEntireBlindAltView = new DataView(enemyAiEntireBlindAltDefinition.buffer);
enemyAiEntireBlindAltView.setUint32(0x00, 9_042, true);
enemyAiEntireBlindAltView.setInt16(0x04, PAD_ENEMY_SKILL_ENTIRE_BLIND_ALT, true);
enemyAiEntireBlindAltView.setInt32(0x10, 7, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiEntireBlindAltDefinition), {
  type: 62,
  kind: 'entireBlind',
  supported: true,
  attackWithSkillValue: 50,
});
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiEntireBlindAltDefinition, new Uint8Array(0x680)),
  {
    type: 62,
    kind: 'entireBlind',
    supported: true,
    attackWithSkillValue: 50,
  },
);
const directEntireBlindAltEngine = new PuzzleEngine({ seed: 21_900 });
assert.equal(directEntireBlindAltEngine.applyEnemySkillDefinition(
  enemyAiEntireBlindAltDefinition,
), true);
assert.equal(directEntireBlindAltEngine.lastEnemySkill.type, 62);
assert.equal(directEntireBlindAltEngine.snapshot().boardState.flat()
  .filter((orb) => orb.entireBlind).length, 30);
const enemyAiBindAttackDefinition = enemyAiEntireBlindDefinition.slice();
const enemyAiBindAttackView = new DataView(enemyAiBindAttackDefinition.buffer);
enemyAiBindAttackView.setUint32(0x00, 9_043, true);
enemyAiBindAttackView.setInt16(0x04, PAD_ENEMY_SKILL_BIND_ATTACK, true);
enemyAiBindAttackView.setInt32(0x10, 50, true);
enemyAiBindAttackView.setInt32(0x14, 2, true);
enemyAiBindAttackView.setInt32(0x18, 4, true);
enemyAiBindAttackView.setInt32(0x1c, 4, true);
enemyAiBindAttackView.setInt32(0x20, 2, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiBindAttackDefinition), {
  type: 63,
  kind: 'bindAttack',
  supported: true,
  nativePresentationParameter: 50,
  durationMin: 2,
  durationMax: 4,
  targetSelector: 4,
  targetCount: 2,
  attackWithSkillValue: 50,
});
const bindAttackRuntime = new Uint8Array(0x688);
const bindAttackRuntimeView = new DataView(bindAttackRuntime.buffer);
bindAttackRuntimeView.setUint16(0x674, 0x0a, true);
bindAttackRuntimeView.setInt32(0x680, 50, true);
bindAttackRuntimeView.setInt32(0x684, 3, true);
assert.deepEqual(decodePadEnemySkillRuntime(enemyAiBindAttackDefinition, bindAttackRuntime), {
  type: 63,
  kind: 'bindAttack',
  supported: true,
  nativePresentationParameter: 50,
  durationTurns: 3,
  targetMask: 0x0a,
  setupMaterialized: true,
  attackWithSkillValue: 50,
});
const directBindAttackEngine = new PuzzleEngine({ seed: 21_900 });
directBindAttackEngine.setRngState(21_900);
assert.equal(directBindAttackEngine.applyEnemySkillDefinition(enemyAiBindAttackDefinition), true);
const directBindAttackState = directBindAttackEngine.snapshot();
assert.equal(directBindAttackState.lastEnemySkill.type, 63);
assert.equal(directBindAttackState.lastEnemySkill.boundMask, directBindAttackState.lastEnemySkill.targetMask);
assert.equal(directBindAttackState.lastEnemySkill.targetMask, 0x06);
assert.equal(directBindAttackState.lastEnemySkill.durationTurns, 3);
assert.equal(directBindAttackState.lastEnemySkill.boundMask.toString(2).replaceAll('0', '').length, 2);
assert.equal(directBindAttackState.party[0].bindTurns, 0);
assert.equal(directBindAttackState.party[5].bindTurns, 0);
assert.equal(directBindAttackState.party.slice(1, 5)
  .filter((member) => member.bindTurns === directBindAttackState.lastEnemySkill.durationTurns).length, 2);
assert(directBindAttackState.lastEnemySkill.durationTurns >= 2);
assert(directBindAttackState.lastEnemySkill.durationTurns <= 4);
const bindAttackSetupState = padLcgStep(padLcgStep(padLcgStep(21_900).state).state).state;
assert.equal(directBindAttackState.rngState, bindAttackSetupState);
const enemyAiRandomSubBindDefinition = enemyAiEntireBlindDefinition.slice();
const enemyAiRandomSubBindView = new DataView(enemyAiRandomSubBindDefinition.buffer);
enemyAiRandomSubBindView.setUint32(0x00, 9_044, true);
enemyAiRandomSubBindView.setInt16(0x04, PAD_ENEMY_SKILL_RANDOM_SUB_BIND, true);
enemyAiRandomSubBindView.setInt32(0x10, 2, true);
enemyAiRandomSubBindView.setInt32(0x14, 2, true);
enemyAiRandomSubBindView.setInt32(0x18, 4, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiRandomSubBindDefinition), {
  type: 65,
  kind: 'randomSubBind',
  supported: true,
  targetCount: 2,
  durationMin: 2,
  durationMax: 4,
  attackWithSkillValue: 50,
});
const randomSubBindRuntime = new Uint8Array(0x680);
const randomSubBindRuntimeView = new DataView(randomSubBindRuntime.buffer);
randomSubBindRuntimeView.setUint16(0x674, 0x12, true);
randomSubBindRuntimeView.setInt32(0x678, 2, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiRandomSubBindDefinition,
  randomSubBindRuntime,
), {
  type: 65,
  kind: 'randomSubBind',
  supported: true,
  targetCount: 2,
  durationMin: 2,
  durationMax: 4,
  targetMask: 0x12,
  setupDurationTurns: 2,
  setupMaterialized: true,
  attackWithSkillValue: 50,
});
const directRandomSubBindEngine = new PuzzleEngine({ seed: 21_900 });
directRandomSubBindEngine.setRngState(21_900);
assert.equal(directRandomSubBindEngine.applyEnemySkillDefinition(
  enemyAiRandomSubBindDefinition,
), true);
const directRandomSubBindState = directRandomSubBindEngine.snapshot();
assert.equal(directRandomSubBindState.lastEnemySkill.type, 65);
assert.equal(directRandomSubBindState.lastEnemySkill.targetMask, 0x06);
assert.equal(directRandomSubBindState.lastEnemySkill.setupDurationTurns, 3);
assert.equal(directRandomSubBindState.lastEnemySkill.durationTurns, 2);
assert.deepEqual(
  directRandomSubBindState.party.map((member) => member.bindTurns),
  [0, 2, 2, 0, 0, 0],
);
assert.equal(
  directRandomSubBindState.rngState,
  padLcgStep(padLcgStep(padLcgStep(padLcgStep(21_900).state).state).state).state,
);
const directEntireBlindEngine = new PuzzleEngine({ seed: 21_900 });
directEntireBlindEngine.setBoardFromCodes(['JBGHLD', 'BGLDHR', 'GLXHRB', 'LDHRBG', 'DHRBGL']);
directEntireBlindEngine.setOrbState(0, 0, {
  blockFlags: 0x28000,
  enhancementPower: 2.5,
  nail: true,
});
directEntireBlindEngine.setOrbState(0, 1, {
  blockFlags: 0x11000,
  blindCountdown: 1,
});
assert.equal(directEntireBlindEngine.applyEnemySkillDefinition(enemyAiEntireBlindDefinition), true);
assert.equal(directEntireBlindEngine.lastEnemySkill.newlyBlinded, 30);
assert.equal(directEntireBlindEngine.message, 'The board was blinded.');
let directEntireBlindState = directEntireBlindEngine.snapshot();
assert.equal(directEntireBlindState.boardState.flat().filter((orb) => orb.entireBlind).length, 30);
assert.equal(directEntireBlindState.boardState.flat().filter((orb) => orb.blind).length, 30);
assert(directEntireBlindState.boardState.flat().every((orb) => (orb.blockFlags & 0x0c) === 0x0c));
assert(directEntireBlindState.boardState.flat().every((orb) => orb.blindCountdown === 0));
assert.equal(directEntireBlindState.boardState[0][0].enhancementPower, 0);
assert.equal(directEntireBlindState.boardState[0][0].nail, false);
assert.equal(directEntireBlindState.boardState[0][0].blockFlags & 0x28000, 0);
directEntireBlindEngine.advanceBlackOrbCountdowns();
assert.equal(directEntireBlindEngine.snapshot().boardState.flat().filter((orb) => orb.entireBlind).length, 30);
assert.equal(directEntireBlindEngine.snapshot().boardState[0][1].blockFlags, 0x100c);
directEntireBlindEngine.advanceBlackOrbCountdowns();
assert.equal(directEntireBlindEngine.snapshot().boardState[0][1].blockFlags, 0x0c);
assert.equal(directEntireBlindEngine.snapshot().boardState[0][1].blind, true);
directEntireBlindEngine.start();
assert.equal(directEntireBlindEngine.startDrag(0, 0), true);
assert.equal(directEntireBlindEngine.moveDrag(0, 1), true);
directEntireBlindState = directEntireBlindEngine.snapshot();
assert.equal(directEntireBlindState.boardState.flat().filter((orb) => orb.entireBlind).length, 28);
assert.equal(directEntireBlindState.boardState[0][0].blockFlags & 0x04, 0);
assert.equal(directEntireBlindState.boardState[0][1].blockFlags & 0x04, 0);
const enemyAiRandomJammerDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiRandomJammerView = new DataView(enemyAiRandomJammerDefinition.buffer);
enemyAiRandomJammerView.setUint32(0x00, 9_023, true);
enemyAiRandomJammerView.setInt16(0x04, 13, true);
enemyAiRandomJammerView.setInt32(0x10, 2, true);
enemyAiRandomJammerView.setInt32(0x14, 99, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiRandomJammerDefinition), {
  type: 13,
  kind: 'randomJammer',
  supported: true,
  count: 2,
  nativeParameter1: 99,
  destinationType: 6,
  attackWithSkillValue: 0,
});
const randomJammerMonsterRuntime = new Uint8Array(0x680);
const randomJammerMonsterRuntimeView = new DataView(randomJammerMonsterRuntime.buffer);
randomJammerMonsterRuntimeView.setInt32(0x678, 2, true);
randomJammerMonsterRuntimeView.setInt32(0x67c, 99, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiRandomJammerDefinition, randomJammerMonsterRuntime),
  {
    type: 13,
    kind: 'randomJammer',
    supported: true,
    count: 2,
    nativeParameter1: 99,
    destinationType: 6,
    setupMaterialized: true,
    attackWithSkillValue: 0,
  },
);
const randomJammerEngine = new PuzzleEngine({ seed: 21_900 });
randomJammerEngine.setBoardFromCodes(['RGBHLD', 'BGLDHR', 'GLXHRB', 'LDHRBG', 'DHRBGL']);
randomJammerEngine.setRngState(21_900);
assert.equal(randomJammerEngine.applyEnemySkillDefinition(
  enemyAiRandomJammerDefinition,
), true);
assert.deepEqual(randomJammerEngine.lastEnemySkill.selectedFaceTypes, [1, 3]);
assert.equal(randomJammerEngine.lastEnemySkill.changedOrbCount, 10);
assert.equal(randomJammerEngine.lastEnemySkill.effectFlags, 4);
assert.deepEqual(randomJammerEngine.board.flat().map((orb) => orb.type).filter((type) => type === 'jammer').length, 10);
assert.equal(randomJammerEngine.rng.state, padLcgStep(padLcgStep(21_900).state).state);
const enemyAiActiveSkillSealDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiActiveSkillSealView = new DataView(enemyAiActiveSkillSealDefinition.buffer);
enemyAiActiveSkillSealView.setUint32(0x00, 9_024, true);
enemyAiActiveSkillSealView.setInt16(0x04, PAD_ENEMY_SKILL_ACTIVE_SKILL_SEAL, true);
enemyAiActiveSkillSealView.setInt32(0x10, 2, true);
enemyAiActiveSkillSealView.setInt32(0x14, 4, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiActiveSkillSealDefinition), {
  type: 14,
  kind: 'activeSkillSeal',
  supported: true,
  durationMin: 2,
  durationMax: 4,
  attackWithSkillValue: 0,
});
const activeSkillSealMonsterRuntime = new Uint8Array(0x680);
const activeSkillSealMonsterRuntimeView = new DataView(activeSkillSealMonsterRuntime.buffer);
activeSkillSealMonsterRuntimeView.setUint16(0x674, 0x3f, true);
activeSkillSealMonsterRuntimeView.setInt32(0x678, 4, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiActiveSkillSealDefinition, activeSkillSealMonsterRuntime),
  {
    type: 14,
    kind: 'activeSkillSeal',
    supported: true,
    durationTurns: 4,
    targetMask: 0x3f,
    setupMaterialized: true,
    attackWithSkillValue: 0,
  },
);
const activeSkillSealEngine = new PuzzleEngine({ seed: 21_900 });
activeSkillSealEngine.setRngState(21_900);
assert.equal(activeSkillSealEngine.applyEnemySkillDefinition(
  enemyAiActiveSkillSealDefinition,
), true);
assert.equal(activeSkillSealEngine.skillSealTurns, 2);
activeSkillSealEngine.start();
assert.equal(activeSkillSealEngine.useSkill(), false);
assert.equal(activeSkillSealEngine.rng.state, padLcgStep(21_900).state);
const resistedActiveSkillSealEngine = new PuzzleEngine({
  seed: 21_900,
  skillSealResistAwakenings: 5,
});
resistedActiveSkillSealEngine.setRngState(21_900);
assert.equal(resistedActiveSkillSealEngine.applyEnemySkillRuntime(
  enemyAiActiveSkillSealDefinition,
  activeSkillSealMonsterRuntime,
), true);
assert.equal(resistedActiveSkillSealEngine.skillSealTurns, 0);
assert.equal(resistedActiveSkillSealEngine.lastEnemySkill.resisted, true);
assert.equal(resistedActiveSkillSealEngine.rng.state, padLcgStep(21_900).state);
const enemyAiRepeatAttackDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiRepeatAttackView = new DataView(enemyAiRepeatAttackDefinition.buffer);
enemyAiRepeatAttackView.setUint32(0x00, 9_039, true);
enemyAiRepeatAttackView.setInt16(0x04, PAD_ENEMY_SKILL_REPEAT_ATTACK, true);
enemyAiRepeatAttackView.setInt32(0x10, 3, true);
enemyAiRepeatAttackView.setInt32(0x14, 5, true);
enemyAiRepeatAttackView.setInt32(0x18, 40, true);
enemyAiRepeatAttackView.setInt32(0x30, 10_000, true);
enemyAiRepeatAttackView.setInt32(0x34, 1_000, true);
enemyAiRepeatAttackView.setInt32(0x38, 100, true);
enemyAiRepeatAttackView.setInt32(0x40, 20, true);
enemyAiRepeatAttackView.setInt32(0x44, 50, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiRepeatAttackDefinition), {
  type: 15,
  kind: 'repeatAttack',
  supported: true,
  hitCountMin: 3,
  hitCountMax: 5,
  damagePercent: 40,
  attackWithSkillValue: 50,
});
const repeatAttackMonsterRuntime = new Uint8Array(0x684);
const repeatAttackMonsterRuntimeView = new DataView(repeatAttackMonsterRuntime.buffer);
repeatAttackMonsterRuntimeView.setInt32(0x678, 4, true);
repeatAttackMonsterRuntimeView.setUint32(0x67c, 0b0101, true);
repeatAttackMonsterRuntimeView.setInt32(0x680, 40, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiRepeatAttackDefinition, repeatAttackMonsterRuntime),
  {
    type: 15,
    kind: 'repeatAttack',
    supported: true,
    hitCount: 4,
    completedHitMask: 0b0101,
    damagePercent: 40,
    setupMaterialized: true,
    attackWithSkillValue: 50,
  },
);
const cappedRepeatAttackDefinition = enemyAiRepeatAttackDefinition.slice();
const cappedRepeatAttackView = new DataView(cappedRepeatAttackDefinition.buffer);
cappedRepeatAttackView.setInt32(0x10, 16, true);
cappedRepeatAttackView.setInt32(0x14, 18, true);
const cappedRepeatAttackEngine = new PuzzleEngine({ seed: 21_900 });
cappedRepeatAttackEngine.setRngState(21_900);
assert.equal(cappedRepeatAttackEngine.applyEnemySkillDefinition(cappedRepeatAttackDefinition), true);
assert.equal(cappedRepeatAttackEngine.lastEnemySkill.hitCount, 15);
assert.equal(cappedRepeatAttackEngine.lastEnemySkill.completedHitMask, 0);
assert.equal(cappedRepeatAttackEngine.rng.state, padLcgStep(21_900).state);
const enemyAiInactivityDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiInactivityView = new DataView(enemyAiInactivityDefinition.buffer);
enemyAiInactivityView.setUint32(0x00, 9_040, true);
enemyAiInactivityView.setInt16(0x04, PAD_ENEMY_SKILL_INACTIVITY, true);
enemyAiInactivityView.setInt32(0x30, 10_000, true);
enemyAiInactivityView.setInt32(0x34, 1_000, true);
enemyAiInactivityView.setInt32(0x38, 100, true);
enemyAiInactivityView.setInt32(0x40, 20, true);
enemyAiInactivityView.setInt32(0x44, 0, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiInactivityDefinition), {
  type: 16,
  kind: 'inactivity',
  supported: true,
  attackWithSkillValue: 0,
});
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiInactivityDefinition, new Uint8Array(0x680)),
  {
    type: 16,
    kind: 'inactivity',
    supported: true,
    attackWithSkillValue: 0,
  },
);
const directInactivityEngine = new PuzzleEngine({ seed: 21_900 });
assert.equal(directInactivityEngine.applyEnemySkillDefinition(enemyAiInactivityDefinition), true);
assert.equal(directInactivityEngine.lastEnemySkill.kind, 'inactivity');
assert.equal(directInactivityEngine.message, 'Verdant Shell does nothing.');
const enemyAiInactivityUnconditionalDefinition = enemyAiInactivityDefinition.slice();
const enemyAiInactivityUnconditionalView = new DataView(
  enemyAiInactivityUnconditionalDefinition.buffer,
);
enemyAiInactivityUnconditionalView.setUint32(0x00, 9_045, true);
enemyAiInactivityUnconditionalView.setInt16(
  0x04,
  PAD_ENEMY_SKILL_INACTIVITY_UNCONDITIONAL,
  true,
);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiInactivityUnconditionalDefinition), {
  type: 66,
  kind: 'inactivity',
  supported: true,
  attackWithSkillValue: 0,
});
assert.deepEqual(
  decodePadEnemySkillRuntime(
    enemyAiInactivityUnconditionalDefinition,
    new Uint8Array(0x680),
  ),
  {
    type: 66,
    kind: 'inactivity',
    supported: true,
    attackWithSkillValue: 0,
  },
);
const directInactivityUnconditionalEngine = new PuzzleEngine({ seed: 21_900 });
assert.equal(directInactivityUnconditionalEngine.applyEnemySkillDefinition(
  enemyAiInactivityUnconditionalDefinition,
), true);
assert.equal(directInactivityUnconditionalEngine.lastEnemySkill.type, 66);
assert.equal(directInactivityUnconditionalEngine.message, 'Verdant Shell does nothing.');
const enemyAiComboAbsorbDefinition = enemyAiInactivityDefinition.slice();
const enemyAiComboAbsorbView = new DataView(enemyAiComboAbsorbDefinition.buffer);
enemyAiComboAbsorbView.setUint32(0x00, 9_046, true);
enemyAiComboAbsorbView.setInt16(0x04, PAD_ENEMY_SKILL_COMBO_ABSORB, true);
enemyAiComboAbsorbView.setInt32(0x10, 2, true);
enemyAiComboAbsorbView.setInt32(0x14, 4, true);
enemyAiComboAbsorbView.setInt32(0x18, 3, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiComboAbsorbDefinition), {
  type: 67,
  kind: 'comboAbsorb',
  supported: true,
  durationMin: 2,
  durationMax: 4,
  comboThreshold: 3,
  attackWithSkillValue: 0,
});
const comboAbsorbRuntime = new Uint8Array(0x680);
const comboAbsorbRuntimeView = new DataView(comboAbsorbRuntime.buffer);
comboAbsorbRuntimeView.setInt32(0x678, 4, true);
comboAbsorbRuntimeView.setInt32(0x67c, 3, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiComboAbsorbDefinition,
  comboAbsorbRuntime,
), {
  type: 67,
  kind: 'comboAbsorb',
  supported: true,
  durationMin: 2,
  durationMax: 4,
  durationTurns: 4,
  comboThreshold: 3,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const directComboAbsorbEngine = new PuzzleEngine({ seed: 21_900 });
directComboAbsorbEngine.setRngState(21_900);
assert.equal(directComboAbsorbEngine.applyEnemySkillDefinition(
  enemyAiComboAbsorbDefinition,
), true);
assert.equal(directComboAbsorbEngine.enemies[0].comboAbsorbTurns, 2);
assert.equal(directComboAbsorbEngine.enemies[0].comboAbsorbThreshold, 3);
assert.equal(directComboAbsorbEngine.rng.state, padLcgStep(21_900).state);
const enemyAiSkyfallRateDefinition = enemyAiInactivityDefinition.slice();
const enemyAiSkyfallRateView = new DataView(enemyAiSkyfallRateDefinition.buffer);
enemyAiSkyfallRateView.setUint32(0x00, 9_047, true);
enemyAiSkyfallRateView.setInt16(0x04, PAD_ENEMY_SKILL_SKYFALL_RATE, true);
enemyAiSkyfallRateView.setUint32(0x10, 0x81, true);
enemyAiSkyfallRateView.setInt32(0x14, 2, true);
enemyAiSkyfallRateView.setInt32(0x18, 4, true);
enemyAiSkyfallRateView.setInt32(0x1c, 25, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiSkyfallRateDefinition), {
  type: 68,
  kind: 'skyfallRate',
  supported: true,
  typeMask: 0x81,
  durationMin: 2,
  durationMax: 4,
  chancePercent: 25,
  attackWithSkillValue: 0,
});
const skyfallRateRuntime = new Uint8Array(0x684);
const skyfallRateRuntimeView = new DataView(skyfallRateRuntime.buffer);
skyfallRateRuntimeView.setUint32(0x678, 0x81, true);
skyfallRateRuntimeView.setInt32(0x67c, 4, true);
skyfallRateRuntimeView.setInt32(0x680, 25, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiSkyfallRateDefinition,
  skyfallRateRuntime,
), {
  type: 68,
  kind: 'skyfallRate',
  supported: true,
  typeMask: 0x81,
  durationTurns: 4,
  chancePercent: 25,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const directSkyfallRateEngine = new PuzzleEngine({ seed: 21_900 });
directSkyfallRateEngine.setRngState(21_900);
assert.equal(directSkyfallRateEngine.applyEnemySkillDefinition(
  enemyAiSkyfallRateDefinition,
), true);
assert.deepEqual(directSkyfallRateEngine.skyfallRateRules, {
  natural: { typeMask: 0x01, chancePercent: 25, turnsRemaining: 2 },
  hazard: { typeMask: 0x80, chancePercent: 25, turnsRemaining: 2 },
});
assert.equal(directSkyfallRateEngine.dropRates[0], 0.25);
assert.equal(directSkyfallRateEngine.dropRates[7], 0.25);
assert.equal(directSkyfallRateEngine.rng.state, padLcgStep(21_900).state);
const enemyAiDeathCryDefinition = enemyAiInactivityDefinition.slice();
const enemyAiDeathCryView = new DataView(enemyAiDeathCryDefinition.buffer);
enemyAiDeathCryView.setUint32(0x00, 9_048, true);
enemyAiDeathCryView.setInt16(0x04, PAD_ENEMY_SKILL_DEATH_CRY, true);
enemyAiDeathCryView.setInt32(0x10, 41, true);
enemyAiDeathCryView.setInt32(0x14, 7, true);
enemyAiDeathCryView.setInt32(0x18, 2, true);
enemyAiDeathCryView.setInt32(0x1c, 3, true);
enemyAiDeathCryView.setInt32(0x20, 1, true);
enemyAiDeathCryView.setInt32(0x24, 5, true);
enemyAiDeathCryView.setInt32(0x28, 11, true);
enemyAiDeathCryView.setInt32(0x2c, 13, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiDeathCryDefinition), {
  type: 69,
  kind: 'deathCry',
  supported: true,
  messageCode: 41,
  presentationParameters: [7, 2, 3, 1, 5, 11, 13],
  attackWithSkillValue: 0,
});
const deathCryMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(deathCryMonsterDefinition.buffer).setUint32(0xec, 9_048, true);
const deathCryEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: deathCryMonsterDefinition,
    skillDefinitions: [enemyAiDeathCryDefinition],
  }],
});
deathCryEngine.start();
deathCryEngine.enemies[0].hp = 0;
deathCryEngine.phase = 'attack';
const deathCryRngBefore = deathCryEngine.rng.state;
deathCryEngine.advancePhase();
assert.equal(deathCryEngine.phase, 'death');
assert.deepEqual(deathCryEngine.lastEnemyDeathAction, {
  enemy: 0,
  skillId: 9_048,
  skill: decodePadEnemySkillDefinition(enemyAiDeathCryDefinition),
});
assert.equal(deathCryEngine.rng.state, deathCryRngBefore);
deathCryEngine.advancePhase();
assert.equal(deathCryEngine.phase, 'enemy');
assert.equal(deathCryEngine.resolveNextEnemyDeathAction(), null);
assert.equal(deathCryEngine.enemies[0].deathResolved, true);
assert.equal(deathCryEngine.applyEnemySkillRecord({
  type: PAD_ENEMY_SKILL_REVIVE_ENEMY,
  kind: 'reviveEnemy',
  supported: true,
  targetEnemyIndex: 0,
  revivePercent: 10,
  setupMaterialized: true,
}, 1), true);
assert.equal(deathCryEngine.enemies[0].deathResolved, false);
deathCryEngine.enemies[0].hp = 0;
assert.equal(deathCryEngine.resolveNextEnemyDeathAction()?.skillId, 9_048);
deathCryEngine.reset();
deathCryEngine.start();
deathCryEngine.enemies.forEach((enemy) => { enemy.hp = 0; });
deathCryEngine.phase = 'attack';
deathCryEngine.advancePhase();
assert.equal(deathCryEngine.phase, 'death');
deathCryEngine.advancePhase();
assert.equal(deathCryEngine.mode, 'victory');
assert.equal(deathCryEngine.phase, 'complete');
const enemyAiInactivityPresentationDefinition = enemyAiInactivityDefinition.slice();
const enemyAiInactivityPresentationView = new DataView(
  enemyAiInactivityPresentationDefinition.buffer,
);
enemyAiInactivityPresentationView.setUint32(0x00, 9_049, true);
enemyAiInactivityPresentationView.setInt16(
  0x04,
  PAD_ENEMY_SKILL_INACTIVITY_PRESENTATION,
  true,
);
enemyAiInactivityPresentationView.setInt32(0x10, 12, true);
enemyAiInactivityPresentationView.setInt32(0x14, 34, true);
enemyAiInactivityPresentationView.setInt32(0x18, 56, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiInactivityPresentationDefinition), {
  type: 70,
  kind: 'inactivityPresentation',
  supported: true,
  presentationParameters: [12, 34, 56],
  attackWithSkillValue: 0,
});
const inactivityPresentationRuntime = new Uint8Array(0x684);
const inactivityPresentationRuntimeView = new DataView(inactivityPresentationRuntime.buffer);
inactivityPresentationRuntimeView.setInt32(0x678, 12, true);
inactivityPresentationRuntimeView.setInt32(0x67c, 34, true);
inactivityPresentationRuntimeView.setInt32(0x680, 56, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiInactivityPresentationDefinition,
  inactivityPresentationRuntime,
), {
  type: 70,
  kind: 'inactivityPresentation',
  supported: true,
  presentationParameters: [12, 34, 56],
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const enemyAiDamageVoidDefinition = enemyAiInactivityDefinition.slice();
const enemyAiDamageVoidView = new DataView(enemyAiDamageVoidDefinition.buffer);
enemyAiDamageVoidView.setUint32(0x00, 9_050, true);
enemyAiDamageVoidView.setInt16(0x04, PAD_ENEMY_SKILL_DAMAGE_VOID, true);
enemyAiDamageVoidView.setInt32(0x10, 0, true);
enemyAiDamageVoidView.setInt32(0x14, 3, true);
enemyAiDamageVoidView.setInt32(0x18, 1_055, true);
enemyAiDamageVoidView.setInt32(0x1c, 1_000, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiDamageVoidDefinition), {
  type: 71,
  kind: 'damageVoid',
  supported: true,
  nativePresentationParameter: 0,
  durationTurns: 3,
  nativeMode: 1_055,
  damageThreshold: 1_000,
  attackWithSkillValue: 0,
});
const damageVoidRuntime = new Uint8Array(0x684);
const damageVoidRuntimeView = new DataView(damageVoidRuntime.buffer);
damageVoidRuntimeView.setInt32(0x678, 0, true);
damageVoidRuntimeView.setInt32(0x67c, 3, true);
damageVoidRuntimeView.setInt32(0x680, 1_055, true);
assert.deepEqual(decodePadEnemySkillRuntime(enemyAiDamageVoidDefinition, damageVoidRuntime), {
  type: 71,
  kind: 'damageVoid',
  supported: true,
  nativePresentationParameter: 0,
  durationTurns: 3,
  nativeMode: 1_055,
  damageThreshold: 1_000,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const directDamageVoidEngine = new PuzzleEngine({ seed: 21_900 });
assert.equal(directDamageVoidEngine.applyEnemySkillDefinition(enemyAiDamageVoidDefinition), true);
assert.equal(directDamageVoidEngine.enemies[0].damageVoidTurns, 3);
assert.equal(directDamageVoidEngine.enemies[0].damageVoidThreshold, 1_000);
const enemyAiAttributeResistDefinition = enemyAiInactivityDefinition.slice();
const enemyAiAttributeResistView = new DataView(enemyAiAttributeResistDefinition.buffer);
enemyAiAttributeResistView.setUint32(0x00, 9_051, true);
enemyAiAttributeResistView.setInt16(0x04, PAD_ENEMY_SKILL_ATTRIBUTE_RESIST, true);
enemyAiAttributeResistView.setInt32(0x10, 0x05, true);
enemyAiAttributeResistView.setInt32(0x14, 50, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiAttributeResistDefinition), {
  type: 72,
  kind: 'attributeResist',
  supported: true,
  passive: true,
  attributeMask: 0x05,
  shieldPercent: 50,
  attackWithSkillValue: 0,
});
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiAttributeResistDefinition,
  new Uint8Array(0x680),
), {
  type: 72,
  kind: 'attributeResist',
  supported: true,
  passive: true,
  attributeMask: 0x05,
  shieldPercent: 50,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
assert.equal(padEnemyAttributeResistDamage(3_949, 50), 1_975);
assert.equal(padEnemyAttributeResistDamage(3_949, 0), 3_949);
assert.equal(padEnemyAttributeResistDamage(3_949, 100), 3_949);
const directAttributeResistEngine = new PuzzleEngine({ seed: 21_900 });
assert.equal(directAttributeResistEngine.applyEnemySkillDefinition(
  enemyAiAttributeResistDefinition,
), false);
assert.throws(
  () => new PuzzleEngine({ enemySkillQueues: [[enemyAiAttributeResistDefinition]] }),
  /passive enemy skills must be installed through monster skill slots/,
);
const enemyAiTypeResistDefinition = enemyAiInactivityDefinition.slice();
const enemyAiTypeResistView = new DataView(enemyAiTypeResistDefinition.buffer);
enemyAiTypeResistView.setUint32(0x00, 9_118, true);
enemyAiTypeResistView.setInt16(0x04, PAD_ENEMY_SKILL_TYPE_RESIST, true);
enemyAiTypeResistView.setInt32(0x10, (1 << 6) | (1 << 7), true);
enemyAiTypeResistView.setInt32(0x14, 25, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiTypeResistDefinition), {
  type: 118,
  kind: 'typeResist',
  supported: true,
  passive: true,
  monsterTypeMask: 0x00c0,
  damagePercent: 25,
  attackWithSkillValue: 0,
});
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiTypeResistDefinition,
  new Uint8Array(0x680),
), {
  type: 118,
  kind: 'typeResist',
  supported: true,
  passive: true,
  monsterTypeMask: 0x00c0,
  damagePercent: 25,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
assert.equal(padEnemyTypeResistRatio(
  [100, 100, 100, 100, 100, 100, 25, 40, ...Array(8).fill(100)],
  [6, 7],
), Math.fround(Math.fround(0.25) * Math.fround(0.4)));
assert.equal(padEnemyTypeResistRatio(
  [100, 100, 100, 100, 100, 100, 25, 40, ...Array(8).fill(100)],
  [6],
  1 << 7,
), Math.fround(Math.fround(0.25) * Math.fround(0.4)));
assert.equal(padEnemyDamageAfterShields(3_949, 50, 50, Math.fround(0.25)), 247);
assert.equal(new PuzzleEngine({ seed: 21_900 }).applyEnemySkillDefinition(
  enemyAiTypeResistDefinition,
), false);
assert.throws(
  () => new PuzzleEngine({ enemySkillQueues: [[enemyAiTypeResistDefinition]] }),
  /passive enemy skills must be installed through monster skill slots/,
);
const enemyAiDamageImmunityDefinition = enemyAiInactivityDefinition.slice();
const enemyAiDamageImmunityView = new DataView(enemyAiDamageImmunityDefinition.buffer);
enemyAiDamageImmunityView.setUint32(0x00, 9_119, true);
enemyAiDamageImmunityView.setInt16(0x04, PAD_ENEMY_SKILL_DAMAGE_IMMUNITY, true);
enemyAiDamageImmunityView.setInt32(0x10, 3, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiDamageImmunityDefinition), {
  type: 119,
  kind: 'damageImmunity',
  supported: true,
  durationTurns: 3,
  attackWithSkillValue: 0,
});
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiDamageImmunityDefinition,
  new Uint8Array(0x680),
), {
  type: 119,
  kind: 'damageImmunity',
  supported: true,
  durationTurns: 3,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const directDamageImmunityEngine = new PuzzleEngine({ seed: 21_900 });
assert.equal(directDamageImmunityEngine.applyEnemySkillDefinition(
  enemyAiDamageImmunityDefinition,
), true);
assert.equal(directDamageImmunityEngine.enemies[0].damageImmunityTurns, 3);
assert.deepEqual(directDamageImmunityEngine.snapshot().lastEnemySkill, {
  type: 119,
  kind: 'damageImmunity',
  supported: true,
  durationTurns: 3,
  setupMaterialized: false,
  attackWithSkillValue: 0,
});
const enemyAiResolveDefinition = enemyAiInactivityDefinition.slice();
const enemyAiResolveView = new DataView(enemyAiResolveDefinition.buffer);
enemyAiResolveView.setUint32(0x00, 9_052, true);
enemyAiResolveView.setInt16(0x04, PAD_ENEMY_SKILL_RESOLVE, true);
enemyAiResolveView.setInt32(0x10, 50, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiResolveDefinition), {
  type: 73,
  kind: 'resolve',
  supported: true,
  passive: true,
  hpThresholdPercent: 50,
  attackWithSkillValue: 0,
});
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiResolveDefinition,
  new Uint8Array(0x680),
), {
  type: 73,
  kind: 'resolve',
  supported: true,
  passive: true,
  hpThresholdPercent: 50,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
assert.equal(padEnemyResolveThresholdHp(92_001, 50), 46_001);
assert.equal(padEnemyResolveThresholdHp(92_000, 0), 0);
assert.equal(new PuzzleEngine({ seed: 21_900 }).applyEnemySkillDefinition(
  enemyAiResolveDefinition,
), false);
const enemyAiDamageShieldDefinition = enemyAiInactivityDefinition.slice();
const enemyAiDamageShieldView = new DataView(enemyAiDamageShieldDefinition.buffer);
enemyAiDamageShieldView.setUint32(0x00, 9_053, true);
enemyAiDamageShieldView.setInt16(0x04, PAD_ENEMY_SKILL_DAMAGE_SHIELD, true);
enemyAiDamageShieldView.setInt32(0x10, 3, true);
enemyAiDamageShieldView.setInt32(0x14, 50, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiDamageShieldDefinition), {
  type: 74,
  kind: 'damageShield',
  supported: true,
  durationTurns: 3,
  shieldPercent: 50,
  attackWithSkillValue: 0,
});
const damageShieldRuntime = new Uint8Array(0x680);
const damageShieldRuntimeView = new DataView(damageShieldRuntime.buffer);
damageShieldRuntimeView.setInt32(0x678, 3, true);
damageShieldRuntimeView.setInt32(0x67c, 140, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiDamageShieldDefinition,
  damageShieldRuntime,
), {
  type: 74,
  kind: 'damageShield',
  supported: true,
  durationTurns: 3,
  shieldPercent: 100,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
assert.equal(padEnemyDamageAfterShields(3_949, 50, 50), 988);
assert.equal(padEnemyDamageAfterShields(3_949, 100, 50), 1_975);
assert.equal(padEnemyDamageAfterShields(3_949, 100, 100), 0);
const directDamageShieldEngine = new PuzzleEngine({ seed: 21_900 });
assert.equal(directDamageShieldEngine.applyEnemySkillDefinition(
  enemyAiDamageShieldDefinition,
), true);
assert.equal(directDamageShieldEngine.enemies[0].damageShieldTurns, 3);
assert.equal(directDamageShieldEngine.enemies[0].damageShieldPercent, 50);
const enemyAiLeaderSwapDefinition = enemyAiInactivityDefinition.slice();
const enemyAiLeaderSwapView = new DataView(enemyAiLeaderSwapDefinition.buffer);
enemyAiLeaderSwapView.setUint32(0x00, 9_054, true);
enemyAiLeaderSwapView.setInt16(0x04, PAD_ENEMY_SKILL_LEADER_SWAP, true);
enemyAiLeaderSwapView.setInt32(0x10, 3, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiLeaderSwapDefinition), {
  type: 75,
  kind: 'leaderSwap',
  supported: true,
  durationTurns: 3,
  selectedPartyIndex: null,
  attackWithSkillValue: 0,
});
const leaderSwapRuntime = new Uint8Array(0x680);
const leaderSwapRuntimeView = new DataView(leaderSwapRuntime.buffer);
leaderSwapRuntimeView.setInt32(0x678, 3, true);
leaderSwapRuntimeView.setInt32(0x67c, 4, true);
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiLeaderSwapDefinition,
  leaderSwapRuntime,
), {
  type: 75,
  kind: 'leaderSwap',
  supported: true,
  durationTurns: 3,
  selectedPartyIndex: 4,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const directLeaderSwapEngine = new PuzzleEngine({ seed: 21_900 });
directLeaderSwapEngine.setRngState(21_900);
assert.equal(directLeaderSwapEngine.applyEnemySkillDefinition(
  enemyAiLeaderSwapDefinition,
), true);
assert.equal(directLeaderSwapEngine.rng.state, padLcgStep(21_900).state);
assert.equal(directLeaderSwapEngine.leaderSwapTurns, 3);
assert.equal(directLeaderSwapEngine.leaderSwapIndex, 1);
assert.deepEqual(directLeaderSwapEngine.party.slice(0, 2).map(({ id }) => id), [
  'marina', 'ember',
]);
directLeaderSwapEngine.reset();
assert.equal(directLeaderSwapEngine.leaderSwapTurns, 0);
assert.equal(directLeaderSwapEngine.leaderSwapIndex, null);
assert.deepEqual(directLeaderSwapEngine.party.slice(0, 2).map(({ id }) => id), [
  'ember', 'marina',
]);
const leaderAlterDefinition = enemyAiInactivityDefinition.slice();
const leaderAlterView = new DataView(leaderAlterDefinition.buffer);
leaderAlterView.setUint32(0x00, 9_055, true);
leaderAlterView.setInt16(0x04, PAD_ENEMY_SKILL_LEADER_ALTER, true);
leaderAlterView.setInt32(0x10, 4, true);
leaderAlterView.setUint32(0x14, 777, true);
leaderAlterView.setInt32(0x44, 0, true);
assert.deepEqual(decodePadEnemySkillDefinition(leaderAlterDefinition), {
  type: 125,
  kind: 'leaderAlter',
  supported: true,
  durationTurns: 4,
  targetCardId: 777,
  nativeStatusOffset: 0x84780,
  nativeTargetOffset: 0x84770,
  nativeDurationBias: 10_000,
  nativeSetupEffectId: 80,
  attackWithSkillValue: 0,
});
assert.deepEqual(decodePadEnemySkillRuntime(
  leaderAlterDefinition,
  new Uint8Array(0x680),
), {
  type: 125,
  kind: 'leaderAlter',
  supported: true,
  durationTurns: 4,
  targetCardId: 777,
  nativeStatusOffset: 0x84780,
  nativeTargetOffset: 0x84770,
  nativeDurationBias: 10_000,
  nativeSetupEffectId: 80,
  attackWithSkillValue: 0,
  setupMaterialized: true,
});
const directLeaderAlterEngine = new PuzzleEngine({ seed: 21_900 });
directLeaderAlterEngine.party[0].leaderSkill = null;
directLeaderAlterEngine.party[2].cardId = 777;
directLeaderAlterEngine.party[2].leaderSkill = {
  type: 'comboAttack',
  thresholds: [{ combos: 4, multiplier: 2 }],
};
const directLeaderAlterRng = directLeaderAlterEngine.rng.state;
assert.equal(directLeaderAlterEngine.applyEnemySkillDefinition(leaderAlterDefinition), true);
assert.equal(directLeaderAlterEngine.rng.state, directLeaderAlterRng);
assert.deepEqual(directLeaderAlterEngine.party.map(({ id }) => id), [
  'ember', 'marina', 'briar', 'sol', 'nyx', 'helper',
]);
assert.deepEqual(directLeaderAlterEngine.snapshot().leaderAlterRule, {
  active: true,
  turnsRemaining: 4,
  targetCardId: 777,
  targetResolved: true,
  nativeStatusOffset: 0x84780,
  nativeTargetOffset: 0x84770,
  nativeDurationBias: 10_000,
  nativeStatusValue: 10_004,
  nativeSetupEffectId: 80,
  skipInitialCountdown: true,
});
assert.equal(directLeaderAlterEngine.snapshot().lastEnemySkill.targetResolved, true);
directLeaderAlterEngine.comboCount = 4;
directLeaderAlterEngine.turnMatches = [];
directLeaderAlterEngine.resolvePlayerTurn();
assert.equal(directLeaderAlterEngine.lastLeaderMultiplier, 4);
assert.equal(directLeaderAlterEngine.applyEnemySkillDefinition(leaderAlterDefinition), false);
directLeaderAlterEngine.advanceLeaderAlterTurns();
assert.equal(directLeaderAlterEngine.leaderAlterRule.turnsRemaining, 3);
directLeaderAlterEngine.advanceLeaderAlterTurns();
directLeaderAlterEngine.advanceLeaderAlterTurns();
directLeaderAlterEngine.advanceLeaderAlterTurns();
assert.deepEqual(directLeaderAlterEngine.snapshot().leaderAlterRule, {
  active: false,
  turnsRemaining: 0,
  targetCardId: 777,
  targetResolved: true,
  nativeStatusOffset: 0x84780,
  nativeTargetOffset: 0x84770,
  nativeDurationBias: 10_000,
  nativeStatusValue: 10_004,
  nativeSetupEffectId: 80,
  skipInitialCountdown: true,
});
const leaderAlterAiDefinition = leaderAlterDefinition.slice();
const leaderAlterAiView = new DataView(leaderAlterAiDefinition.buffer);
leaderAlterAiView.setInt32(0x30, 10_000, true);
leaderAlterAiView.setInt32(0x34, 1_000, true);
leaderAlterAiView.setInt32(0x38, 100, true);
leaderAlterAiView.setInt32(0x40, 20, true);
const leaderAlterMonsterDefinition = enemyAiMonsterDefinition.slice();
const leaderAlterMonsterView = new DataView(leaderAlterMonsterDefinition.buffer);
leaderAlterMonsterView.setUint32(0xec, 9_055, true);
const leaderAlterMonster = decodePadEnemyAiMonsterDefinition(leaderAlterMonsterDefinition);
const leaderAlterAi = decodePadEnemyAiSkillDefinition(leaderAlterAiDefinition);
assert.equal(selectPadEnemyAiNew(
  leaderAlterMonster,
  [leaderAlterAi],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    leaderAlterTurns: 0,
    leaderAlterTargetCardId: null,
    rngState: 21_900,
  },
).skillId, 9_055);
const leaderAlterSameTarget = selectPadEnemyAiNew(
  leaderAlterMonster,
  [leaderAlterAi],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    leaderAlterTurns: 2,
    leaderAlterTargetCardId: 777,
    rngState: 21_900,
  },
);
assert.equal(leaderAlterSameTarget.skillId, null);
assert.equal(leaderAlterSameTarget.rngState, 21_900);
const leaderAlterDifferentTarget = selectPadEnemyAiNew(
  leaderAlterMonster,
  [leaderAlterAi],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    leaderAlterTurns: 2,
    leaderAlterTargetCardId: 778,
    rngState: 21_900,
  },
);
assert.equal(leaderAlterDifferentTarget.skillId, 9_055);
assert.equal(leaderAlterDifferentTarget.rngState, padLcgStep(21_900).state);
const enemyAiNormalAttackDefinition = enemyAiInactivityDefinition.slice();
const enemyAiNormalAttackView = new DataView(enemyAiNormalAttackDefinition.buffer);
enemyAiNormalAttackView.setUint32(0x00, 9_060, true);
enemyAiNormalAttackView.setInt16(0x04, PAD_ENEMY_SKILL_NORMAL_ATTACK, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiNormalAttackDefinition), {
  type: 82,
  kind: 'normalAttack',
  supported: true,
  damagePercent: 100,
  attackWithSkillValue: 0,
});
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiNormalAttackDefinition,
  new Uint8Array(0x680),
), {
  type: 82,
  kind: 'normalAttack',
  supported: true,
  damagePercent: 100,
  setupMaterialized: true,
  attackWithSkillValue: 0,
});
const enemyAiMultiAttackDefinition = new Uint8Array(0x48);
const enemyAiMultiAttackView = new DataView(enemyAiMultiAttackDefinition.buffer);
enemyAiMultiAttackView.setUint32(0x00, 9_061, true);
enemyAiMultiAttackView.setInt16(0x04, PAD_ENEMY_SKILL_MULTI_ATTACK, true);
enemyAiMultiAttackView.setInt32(0x10, 9_062, true);
enemyAiMultiAttackView.setInt32(0x14, 9_063, true);
enemyAiMultiAttackView.setInt32(0x18, 9_064, true);
enemyAiMultiAttackView.setInt32(0x1c, 0, true);
// These are AI metadata, not additional child IDs.
enemyAiMultiAttackView.setInt32(0x30, 10_000, true);
enemyAiMultiAttackView.setInt32(0x34, 1_000, true);
enemyAiMultiAttackView.setInt32(0x38, 100, true);
enemyAiMultiAttackView.setInt32(0x40, 20, true);
enemyAiMultiAttackView.setInt32(0x44, 777, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiMultiAttackDefinition), {
  type: 83,
  kind: 'multiAttack',
  supported: true,
  childSkillIds: [9_062, 9_063, 9_064],
  attackWithSkillValue: 777,
});
assert.deepEqual(decodePadEnemySkillRuntime(
  enemyAiMultiAttackDefinition,
  new Uint8Array(0x680),
), {
  type: 83,
  kind: 'multiAttack',
  supported: true,
  childSkillIds: [9_062, 9_063, 9_064],
  attackWithSkillValue: 777,
  setupMaterialized: true,
});
const enemyAiMultiInactivityDefinition = enemyAiInactivityUnconditionalDefinition.slice();
const enemyAiMultiInactivityView = new DataView(enemyAiMultiInactivityDefinition.buffer);
enemyAiMultiInactivityView.setUint32(0x00, 9_062, true);
enemyAiMultiInactivityView.setInt32(0x38, 0, true);
enemyAiMultiInactivityView.setInt32(0x40, 999, true);
enemyAiMultiInactivityView.setInt32(0x44, 0, true);
const enemyAiMultiGravityDefinition = enemyAiCurrentHpGravityDefinition.slice();
const enemyAiMultiGravityView = new DataView(enemyAiMultiGravityDefinition.buffer);
enemyAiMultiGravityView.setUint32(0x00, 9_063, true);
enemyAiMultiGravityView.setInt32(0x10, 25, true);
enemyAiMultiGravityView.setInt32(0x44, 0, true);
const enemyAiMultiNormalDefinition = enemyAiNormalAttackDefinition.slice();
new DataView(enemyAiMultiNormalDefinition.buffer).setUint32(0x00, 9_064, true);
const enemyAiAttributeAbsorbDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiAttributeAbsorbView = new DataView(enemyAiAttributeAbsorbDefinition.buffer);
enemyAiAttributeAbsorbView.setUint32(0x00, 9_021, true);
enemyAiAttributeAbsorbView.setInt16(0x04, PAD_ENEMY_SKILL_ATTRIBUTE_ABSORB, true);
enemyAiAttributeAbsorbView.setInt32(0x10, 2, true);
enemyAiAttributeAbsorbView.setInt32(0x14, 4, true);
enemyAiAttributeAbsorbView.setUint32(0x18, 0x03, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiAttributeAbsorbDefinition), {
  type: 53,
  kind: 'attributeAbsorb',
  supported: true,
  durationMin: 2,
  durationMax: 4,
  attributeMask: 0x03,
  attackWithSkillValue: 0,
});
const attributeAbsorbMonsterRuntime = new Uint8Array(0x680);
const attributeAbsorbMonsterRuntimeView = new DataView(attributeAbsorbMonsterRuntime.buffer);
attributeAbsorbMonsterRuntimeView.setInt32(0x678, 3, true);
attributeAbsorbMonsterRuntimeView.setUint32(0x67c, 0x05, true);
assert.deepEqual(
  decodePadEnemySkillRuntime(enemyAiAttributeAbsorbDefinition, attributeAbsorbMonsterRuntime),
  {
    type: 53,
    kind: 'attributeAbsorb',
    supported: true,
    durationMin: 2,
    durationMax: 4,
    attributeMask: 0x05,
    durationTurns: 3,
    setupMaterialized: true,
    attackWithSkillValue: 0,
  },
);
const attributeAbsorbRuntimeEngine = new PuzzleEngine({ seed: 21_900 });
attributeAbsorbRuntimeEngine.setRngState(21_900);
assert.equal(attributeAbsorbRuntimeEngine.applyEnemySkillRuntime(
  enemyAiAttributeAbsorbDefinition,
  attributeAbsorbMonsterRuntime,
), true);
assert.equal(attributeAbsorbRuntimeEngine.enemies[0].attributeAbsorbTurns, 3);
assert.equal(attributeAbsorbRuntimeEngine.enemies[0].attributeAbsorbMask, 0x05);
assert.equal(attributeAbsorbRuntimeEngine.rng.state, 21_900);
const enemyAiPoisonBlockNCountedDefinition = enemyAiPoisonBlocksDefinition.slice();
const enemyAiPoisonBlockNCountedView = new DataView(enemyAiPoisonBlockNCountedDefinition.buffer);
enemyAiPoisonBlockNCountedView.setUint32(0x00, 9_015, true);
enemyAiPoisonBlockNCountedView.setInt16(0x04, PAD_ENEMY_SKILL_POISON_BLOCK_N_COUNTED, true);
enemyAiPoisonBlockNCountedView.setInt32(0x10, 4, true);
enemyAiPoisonBlockNCountedView.setInt32(0x14, 1, true);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiPoisonBlockNCountedDefinition), {
  type: 60,
  kind: 'poisonBlockNCounted',
  supported: true,
  count: 4,
  excludeHeart: true,
  destinationType: 7,
  attackWithSkillValue: 0,
});
const enemyAiMortalPoisonBlockNCountedDefinition = enemyAiPoisonBlockNCountedDefinition.slice();
const enemyAiMortalPoisonBlockNCountedView = new DataView(
  enemyAiMortalPoisonBlockNCountedDefinition.buffer,
);
enemyAiMortalPoisonBlockNCountedView.setUint32(0x00, 9_016, true);
enemyAiMortalPoisonBlockNCountedView.setInt16(
  0x04,
  PAD_ENEMY_SKILL_MORTAL_POISON_BLOCK_N_COUNTED,
  true,
);
assert.deepEqual(decodePadEnemySkillDefinition(enemyAiMortalPoisonBlockNCountedDefinition), {
  type: 61,
  kind: 'poisonBlockNCounted',
  supported: true,
  count: 4,
  excludeHeart: true,
  destinationType: 8,
  attackWithSkillValue: 0,
});
assert.deepEqual(padResolveEnhancementFall(21_900, 0, Array(6).fill(0)), {
  state: 394_448_415,
  enhancementPower: 0,
  netChancePercent: 0,
  applied: false,
  processed: true,
});
assert.deepEqual(padResolveEnhancementFall(21_900, 6, Array(6).fill(5)), {
  state: 21_900,
  enhancementPower: 0,
  netChancePercent: 0,
  applied: false,
  processed: false,
});
assert.deepEqual(padResolveEnhancementFall(21_900, 0, [1, 0, 0, 0, 0, 0]), {
  state: 394_448_415,
  enhancementPower: Math.fround(0.06),
  netChancePercent: 20,
  applied: true,
  processed: true,
});
assert.deepEqual(padResolveEnhancementFall(
  21_900,
  0,
  [1, 0, 0, 0, 0, 0],
  { active: true, chancePercent: 30, weakeningPowerPercent: 50 },
), {
  state: 394_448_415,
  enhancementPower: -0.5,
  netChancePercent: -10,
  applied: true,
  processed: true,
});
assert.deepEqual(padResolveEnhancementFall(
  21_900,
  0,
  Array(6).fill(0),
  { active: true, chancePercent: 10, weakeningPowerPercent: 0 },
), {
  state: 394_448_415,
  enhancementPower: Math.fround(0.06),
  netChancePercent: 10,
  applied: true,
  processed: true,
});
assert.deepEqual(padResolveLockFall(21_900, 0, [
  { typeMask: 1 << 0, chancePercent: 0 },
  { typeMask: 1 << 0, chancePercent: 100 },
]), {
  state: 3_803_934_822,
  blockFlags: 0x800,
  attempts: 2,
});
assert.deepEqual(padResolveLockFall(21_900, 1, [
  { typeMask: 1 << 0, chancePercent: 100 },
]), {
  state: 21_900,
  blockFlags: 0,
  attempts: 0,
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
const topLineSkyfallEngine = new PuzzleEngine({
  seed: 21_900,
  topLineDropTypes: [2, 3, 4, 5, 0, 1],
});
topLineSkyfallEngine.setBoardFromCodes(Array(5).fill('DDDDDD'));
topLineSkyfallEngine.setRngState(21_900);
topLineSkyfallEngine.board[1][0] = null;
topLineSkyfallEngine.board[3][0] = null;
topLineSkyfallEngine.collapseAndRefill();
assert.deepEqual(topLineSkyfallEngine.board.map((row) => row[0].type), [
  'wood', 'wood', 'dark', 'dark', 'dark',
]);
assert.equal(topLineSkyfallEngine.rng.state, 21_900);
assert.deepEqual(topLineSkyfallEngine.snapshot().topLineDropTypes, [2, 3, 4, 5, 0, 1]);
const comboDropAwakeningEngine = new PuzzleEngine({
  seed: 21_900,
  comboDropAwakenings: [2, 0, 0, 0, 0],
});
comboDropAwakeningEngine.setBoardFromCodes([
  'RRRRRR',
  'RRRRBG',
  'BGLHDB',
  'GLHDBG',
  'LHDBGL',
]);
comboDropAwakeningEngine.start();
comboDropAwakeningEngine.phase = 'detect';
comboDropAwakeningEngine.advancePhase();
assert.equal(comboDropAwakeningEngine.pendingMatches.length, 1);
assert.equal(comboDropAwakeningEngine.pendingMatches[0].size, 10);
assert.equal(comboDropAwakeningEngine.comboCount, 3);
assert.equal(comboDropAwakeningEngine.comboDropBonusCount, 2);
assert.equal(comboDropAwakeningEngine.pendingComboDrops, 2);
const awakeningBoundComboDropEngine = new PuzzleEngine({
  seed: 21_900,
  comboDropAwakenings: [2, 0, 0, 0, 0],
});
awakeningBoundComboDropEngine.setBoardFromCodes([
  'RRRRRR',
  'RRRRBG',
  'BGLHDB',
  'GLHDBG',
  'LHDBGL',
]);
awakeningBoundComboDropEngine.awakeningBindTurns = 3;
awakeningBoundComboDropEngine.start();
awakeningBoundComboDropEngine.phase = 'detect';
awakeningBoundComboDropEngine.advancePhase();
assert.equal(awakeningBoundComboDropEngine.comboCount, 1);
assert.equal(awakeningBoundComboDropEngine.comboDropBonusCount, 0);
assert.equal(awakeningBoundComboDropEngine.pendingComboDrops, 0);
const lockFallEngine = new PuzzleEngine({
  seed: 21_900,
  lockFallSeed: 21_900,
  lockFallRules: [{ typeMask: 1 << 0, chancePercent: 100 }],
});
lockFallEngine.setBoardFromCodes(Array(5).fill('DDDDDD'));
lockFallEngine.setRngState(21_900);
lockFallEngine.setLockFallRngState(21_900);
lockFallEngine.board[0][0] = null;
lockFallEngine.collapseAndRefill();
assert.equal(lockFallEngine.board[0][0].type, 'fire');
assert.equal(lockFallEngine.board[0][0].locked, true);
assert.equal(lockFallEngine.rng.state, 394_448_415);
assert.equal(lockFallEngine.lockFallRng.state, 3_803_934_822);
const thornFallEngine = new PuzzleEngine({
  seed: 21_900,
  lockFallSeed: 21_900,
  thornFallRule: {
    typeMask: 1 << 0,
    chancePercent: 100,
    descriptor: 4,
    descriptorHighBit: true,
  },
  lockFallRules: [{ typeMask: 1 << 0, chancePercent: 100 }],
});
thornFallEngine.setBoardFromCodes(Array(5).fill('DDDDDD'));
thornFallEngine.setRngState(21_900);
thornFallEngine.setLockFallRngState(21_900);
thornFallEngine.board[0][0] = null;
thornFallEngine.collapseAndRefill();
assert.equal(thornFallEngine.board[0][0].type, 'fire');
assert.equal(thornFallEngine.board[0][0].locked, true);
assert.equal(thornFallEngine.board[0][0].thornActive, true);
assert.equal(thornFallEngine.board[0][0].thornDescriptor, 0x84);
assert.equal(thornFallEngine.rng.state, 394_448_415);
assert.equal(thornFallEngine.lockFallRng.state, 1_929_471_377);
assert.deepEqual(thornFallEngine.snapshot().thornFallRule, {
  active: true,
  typeMask: 1,
  chancePercent: 100,
  descriptor: 4,
  descriptorHighBit: true,
});
const nailFallEngine = new PuzzleEngine({
  seed: 21_900,
  lockFallSeed: 21_900,
  thornFallRule: {
    typeMask: 1 << 0,
    chancePercent: 100,
    descriptor: 4,
    descriptorHighBit: true,
  },
  nailFallRule: { chancePercent: 100 },
  lockFallRules: [{ typeMask: 1 << 0, chancePercent: 100 }],
});
nailFallEngine.setBoardFromCodes(Array(5).fill('DDDDDD'));
nailFallEngine.setRngState(21_900);
nailFallEngine.setLockFallRngState(21_900);
nailFallEngine.board[0][0] = null;
nailFallEngine.collapseAndRefill();
assert.equal(nailFallEngine.board[0][0].nail, true);
assert.equal(nailFallEngine.board[0][0].blockFlags, 0xa0800);
assert.equal(nailFallEngine.rng.state, 394_448_415);
assert.equal(nailFallEngine.lockFallRng.state, 919_597_584);
assert.deepEqual(nailFallEngine.snapshot().nailFallRule, {
  active: true,
  chancePercent: 100,
});
const enhancedFallEngine = new PuzzleEngine({
  seed: 21_900,
  lockFallSeed: 21_900,
  enhancedFallAwakenings: [1, 0, 0, 0, 0, 0],
  enhancedFallModifier: { chancePercent: 30, weakeningPowerPercent: 50 },
});
enhancedFallEngine.setBoardFromCodes(Array(5).fill('DDDDDD'));
enhancedFallEngine.setRngState(21_900);
enhancedFallEngine.setLockFallRngState(21_900);
enhancedFallEngine.board[0][0] = null;
enhancedFallEngine.collapseAndRefill();
assert.equal(enhancedFallEngine.board[0][0].enhancementPower, -0.5);
assert.equal(enhancedFallEngine.lockFallRng.state, 394_448_415);
assert.deepEqual(enhancedFallEngine.snapshot().enhancedFallAwakenings, [1, 0, 0, 0, 0, 0]);
assert.deepEqual(enhancedFallEngine.snapshot().enhancedFallModifier, {
  active: true,
  chancePercent: 30,
  weakeningPowerPercent: 50,
});
const awakeningBoundEnhancedFallEngine = new PuzzleEngine({
  seed: 21_900,
  lockFallSeed: 21_900,
  enhancedFallAwakenings: [5, 0, 0, 0, 0, 0],
});
awakeningBoundEnhancedFallEngine.setBoardFromCodes(Array(5).fill('DDDDDD'));
awakeningBoundEnhancedFallEngine.setRngState(21_900);
awakeningBoundEnhancedFallEngine.setLockFallRngState(21_900);
awakeningBoundEnhancedFallEngine.awakeningBindTurns = 3;
awakeningBoundEnhancedFallEngine.board[0][0] = null;
awakeningBoundEnhancedFallEngine.collapseAndRefill();
assert.equal(awakeningBoundEnhancedFallEngine.board[0][0].type, 'fire');
assert.equal(awakeningBoundEnhancedFallEngine.board[0][0].enhancementPower, 0);
assert.equal(awakeningBoundEnhancedFallEngine.lockFallRng.state, 394_448_415);
const blackFallEngine = new PuzzleEngine({
  seed: 21_900,
  lockFallSeed: 21_900,
  thornFallRule: {
    typeMask: 1 << 0,
    chancePercent: 100,
    descriptor: 4,
    descriptorHighBit: true,
  },
  nailFallRule: { chancePercent: 100 },
  lockFallRules: [{ typeMask: 1 << 0, chancePercent: 100 }],
});
blackFallMonsterView.setUint16(0x678, 2, true);
blackFallMonsterView.setUint32(0x67c, 10_000, true);
assert.equal(blackFallEngine.applyEnemySkillRuntime(
  blackFallSkillDefinition,
  blackFallMonsterRuntime,
), true);
assert.deepEqual(blackFallEngine.snapshot().lastEnemySkill, {
  type: 128,
  kind: 'blackFall',
  supported: true,
  durationTurns: 2,
  chanceBasisPoints: 10_000,
});
blackFallEngine.setBoardFromCodes(Array(5).fill('DDDDDD'));
blackFallEngine.setRngState(21_900);
blackFallEngine.setLockFallRngState(21_900);
blackFallEngine.board[0][0] = null;
blackFallEngine.collapseAndRefill();
assert.equal(blackFallEngine.board[0][0].blind, true);
assert.equal(blackFallEngine.board[0][0].blindFresh, true);
assert.equal(blackFallEngine.board[0][0].blindCountdown, 1);
assert.equal(blackFallEngine.board[0][0].blockFlags, 0xb1800);
assert.equal(blackFallEngine.lockFallRng.state, 1_848_838_291);
blackFallEngine.resolveEnemyTurn();
assert.equal(blackFallEngine.board[0][0].blind, true);
assert.equal(blackFallEngine.board[0][0].blindFresh, false);
assert.equal(blackFallEngine.blackFallRule.turnsRemaining, 1);
blackFallEngine.resolveEnemyTurn();
assert.equal(blackFallEngine.board[0][0].blind, false);
assert.equal(blackFallEngine.board[0][0].blindCountdown, 0);
assert.equal(blackFallEngine.blackFallRule.active, false);
blackFallEngine.setBoardFromCodes(['JDDDDD', ...Array(4).fill('DDDDDD')]);
blackFallEngine.setOrbState(0, 0, {
  blockFlags: 0x28000,
  blind: true,
  enhancementPower: 0.5,
});
assert.equal(blackFallEngine.board[0][0].blockFlags, 0x1000);
assert.equal(blackFallEngine.board[0][0].enhancementPower, 0);

const directNoSkyfallEngine = new PuzzleEngine({ seed: 21_900 });
assert.equal(directNoSkyfallEngine.applyEnemySkillDefinition(noSkyfallSkillDefinition), true);
assert.deepEqual(directNoSkyfallEngine.snapshot().noSkyfallRule, {
  active: true,
  turnsRemaining: 3,
  skipInitialCountdown: true,
});
assert.equal(directNoSkyfallEngine.snapshot().lastEnemySkill.nativeStatusOffset, 0x7754);
directNoSkyfallEngine.advanceNoSkyfallTurns();
assert.equal(directNoSkyfallEngine.snapshot().noSkyfallRule.turnsRemaining, 2);
directNoSkyfallEngine.advanceNoSkyfallTurns();
directNoSkyfallEngine.advanceNoSkyfallTurns();
assert.deepEqual(directNoSkyfallEngine.snapshot().noSkyfallRule, {
  active: false,
  turnsRemaining: 0,
  skipInitialCountdown: true,
});

// Refill still consumes the normal drop path, but no-skyfall skips the
// follow-up match scan that would otherwise turn a refill into another combo.
const noSkyfallInputEngine = new PuzzleEngine({ seed: 21_900 });
noSkyfallInputEngine.start();
noSkyfallInputEngine.setBoardFromCodes([
  'RRRDLG', 'BLGDHB', 'LGDBLR', 'DBHLGD', 'HBLGDB',
]);
noSkyfallInputEngine.applyEnemySkillDefinition(noSkyfallSkillDefinition);
assert.equal(noSkyfallInputEngine.startDrag(0, 0), true);
assert.equal(noSkyfallInputEngine.endDrag(), true);
noSkyfallInputEngine.advancePhase();
assert.equal(noSkyfallInputEngine.phase, 'clear');
noSkyfallInputEngine.advancePhase();
assert.equal(noSkyfallInputEngine.phase, 'fall');
noSkyfallInputEngine.advancePhase();
assert.equal(noSkyfallInputEngine.phase, 'attack');
assert.equal(noSkyfallInputEngine.comboCount, 1);
assert.equal(noSkyfallInputEngine.board.flat().length, 30);

const noSkyfallAiDefinition = noSkyfallSkillDefinition.slice();
const noSkyfallAiView = new DataView(noSkyfallAiDefinition.buffer);
noSkyfallAiView.setUint32(0x00, 9_094, true);
noSkyfallAiView.setInt32(0x30, 10_000, true);
noSkyfallAiView.setInt32(0x34, 1_000, true);
noSkyfallAiView.setInt32(0x38, 100, true);
noSkyfallAiView.setInt32(0x40, 20, true);
const noSkyfallAiMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(noSkyfallAiMonsterDefinition.buffer).setUint32(0xec, 9_094, true);
const selectedNoSkyfallAi = selectPadEnemyAiNew(
  decodePadEnemyAiMonsterDefinition(noSkyfallAiMonsterDefinition),
  [decodePadEnemyAiSkillDefinition(noSkyfallAiDefinition)],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    noSkyfallTurns: 0,
    rngState: 21_900,
  },
);
assert.equal(selectedNoSkyfallAi.skillId, 9_094);
const rejectedNoSkyfallAi = selectPadEnemyAiNew(
  decodePadEnemyAiMonsterDefinition(noSkyfallAiMonsterDefinition),
  [decodePadEnemyAiSkillDefinition(noSkyfallAiDefinition)],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    noSkyfallTurns: 2,
    rngState: 21_900,
  },
);
assert.equal(rejectedNoSkyfallAi.skillId, null);

const scheduledSkillEngine = new PuzzleEngine({
  enemySkillQueues: [{ definitions: [authoredBlackFallDefinition] }],
});
scheduledSkillEngine.enemies[0].counter = 1;
scheduledSkillEngine.enemies[1].counter = 99;
const scheduledHp = scheduledSkillEngine.player.hp;
authoredBlackFallView.setInt32(0x44, 50, true);
scheduledSkillEngine.setEnemySkillQueue(0, [authoredBlackFallDefinition]);
scheduledSkillEngine.resolveEnemyTurn();
const scheduledSkillDamage = padEnemySkillAttack(scheduledSkillEngine.enemies[0].attack, 50);
assert.equal(scheduledSkillEngine.player.hp, scheduledHp - scheduledSkillDamage);
assert.deepEqual(scheduledSkillEngine.blackFallRule, {
  active: true,
  chanceBasisPoints: 7_500,
  turnsRemaining: 3,
  skipInitialCountdown: true,
});
assert.deepEqual(scheduledSkillEngine.snapshot().lastEnemyActions, [{
  enemy: 0,
  kind: 'skill',
  skill: {
    type: 128,
    kind: 'blackFall',
    supported: true,
    durationTurns: 3,
    chanceBasisPoints: 7_500,
    packedDuration: 3,
    rawChance: 7_500,
    definitionDuration: 3,
    definitionChancePercent: 75,
    attackWithSkillValue: 50,
  },
  damage: scheduledSkillDamage,
}]);
assert.equal(scheduledSkillEngine.snapshot().enemies[0].queuedEnemySkills, 0);
scheduledSkillEngine.resolveEnemyTurn();
assert.equal(scheduledSkillEngine.blackFallRule.turnsRemaining, 2);
assert.deepEqual(scheduledSkillEngine.lastEnemyActions, []);
scheduledSkillEngine.resolveEnemyTurn();
assert.equal(
  scheduledSkillEngine.player.hp,
  scheduledHp - scheduledSkillDamage - scheduledSkillEngine.enemies[0].attack,
);
assert.deepEqual(scheduledSkillEngine.lastEnemyActions, [{
  enemy: 0,
  kind: 'attack',
  damage: scheduledSkillEngine.enemies[0].attack,
}]);

const selectedAiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: enemyAiMonsterDefinition,
    skillDefinitions: [enemyAiBlackFallDefinition],
  }],
});
selectedAiEngine.setRngState(21_900);
selectedAiEngine.enemies[0].counter = 1;
selectedAiEngine.enemies[1].counter = 99;
const selectedAiHp = selectedAiEngine.player.hp;
selectedAiEngine.resolveEnemyTurn();
assert.equal(selectedAiEngine.player.hp, selectedAiHp - 925);
assert.equal(selectedAiEngine.rng.state, 394_448_415);
assert.equal(selectedAiEngine.snapshot().enemies[0].enemyAiBudget, 80);
assert.equal(selectedAiEngine.snapshot().enemies[0].enemyAiSkillSlots, 1);
assert.equal(selectedAiEngine.lastEnemyActions[0].skill.type, 128);
assert.equal(selectedAiEngine.lastEnemyActions[0].skill.skillId, 9_001);
assert.equal(selectedAiEngine.lastEnemyActions[0].damage, 925);

const blockMinusAiMonsterDefinition = enemyAiMonsterDefinition.slice();
const blockMinusAiMonsterView = new DataView(blockMinusAiMonsterDefinition.buffer);
blockMinusAiMonsterView.setUint32(0xec, 9_002, true);
const selectedBlockMinusAiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: blockMinusAiMonsterDefinition,
    skillDefinitions: [enemyAiBlockMinusDefinition],
  }],
});
selectedBlockMinusAiEngine.setBoardFromCodes([
  'RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD',
]);
selectedBlockMinusAiEngine.setRngState(21_900);
selectedBlockMinusAiEngine.enemies[0].counter = 1;
selectedBlockMinusAiEngine.enemies[1].counter = 99;
selectedBlockMinusAiEngine.resolveEnemyTurn();
const blockMinusAiState = selectedBlockMinusAiEngine.snapshot();
assert.equal(blockMinusAiState.lastEnemyActions[0].skill.type, 151);
assert.equal(blockMinusAiState.lastEnemyActions[0].skill.skillId, 9_002);
assert.equal(blockMinusAiState.boardState.flat().filter((orb) => orb.enhancementPower === -0.5).length, 2);
assert.equal(
  selectedBlockMinusAiEngine.rng.state,
  padLcgStep(padLcgStep(padLcgStep(21_900).state).state).state,
);
assert.equal(blockMinusAiState.enemies[0].enemyAiBudget, 80);

const burDropAiMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(burDropAiMonsterDefinition.buffer).setUint32(0xec, 9_003, true);
const selectedBurDropAiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: burDropAiMonsterDefinition,
    skillDefinitions: [enemyAiBurDropDefinition],
  }],
});
selectedBurDropAiEngine.setBoardFromCodes([
  'RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD',
]);
selectedBurDropAiEngine.setRngState(21_900);
selectedBurDropAiEngine.enemies[0].counter = 1;
selectedBurDropAiEngine.enemies[1].counter = 99;
selectedBurDropAiEngine.resolveEnemyTurn();
const burDropAiState = selectedBurDropAiEngine.snapshot();
assert.equal(burDropAiState.lastEnemyActions[0].skill.type, 153);
assert.equal(burDropAiState.lastEnemyActions[0].skill.skillId, 9_003);
assert.equal(burDropAiState.boardState.flat().filter((orb) => orb.thornActive).length, 2);
assert.equal(burDropAiState.boardState.flat().filter((orb) => orb.thornDescriptor === 4).length, 2);
assert.equal(
  selectedBurDropAiEngine.rng.state,
  padLcgStep(padLcgStep(padLcgStep(21_900).state).state).state,
);
assert.equal(burDropAiState.enemies[0].enemyAiBudget, 80);
const horizontalLinesAiMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(horizontalLinesAiMonsterDefinition.buffer).setUint32(0xec, 9_004, true);
const selectedHorizontalLinesAiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: horizontalLinesAiMonsterDefinition,
    skillDefinitions: [enemyAiHorizontalLinesDefinition],
  }],
});
selectedHorizontalLinesAiEngine.setBoardFromCodes([
  'DDDDDD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD',
]);
selectedHorizontalLinesAiEngine.setRngState(21_900);
selectedHorizontalLinesAiEngine.enemies[0].counter = 1;
selectedHorizontalLinesAiEngine.enemies[1].counter = 99;
selectedHorizontalLinesAiEngine.resolveEnemyTurn();
const horizontalLinesAiState = selectedHorizontalLinesAiEngine.snapshot();
assert.equal(horizontalLinesAiState.lastEnemyActions[0].skill.type, 79);
assert.equal(horizontalLinesAiState.lastEnemyActions[0].skill.skillId, 9_004);
assert.deepEqual(horizontalLinesAiState.board, [
  'RRRRRR', 'GLDHJG', 'BBBBBB', 'DLGHHJ', 'GGGGGG',
]);
let horizontalLinesExpectedState = 21_900;
for (let index = 0; index < 19; index += 1) {
  horizontalLinesExpectedState = padLcgStep(horizontalLinesExpectedState).state;
}
assert.equal(selectedHorizontalLinesAiEngine.rng.state, horizontalLinesExpectedState);
assert.equal(horizontalLinesAiState.enemies[0].enemyAiBudget, 80);
const verticalLinesAiMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(verticalLinesAiMonsterDefinition.buffer).setUint32(0xec, 9_005, true);
const selectedVerticalLinesAiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: verticalLinesAiMonsterDefinition,
    skillDefinitions: [enemyAiVerticalLinesDefinition],
  }],
});
selectedVerticalLinesAiEngine.setBoardFromCodes([
  'DDDDDD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD',
]);
selectedVerticalLinesAiEngine.setRngState(21_900);
selectedVerticalLinesAiEngine.enemies[0].counter = 1;
selectedVerticalLinesAiEngine.enemies[1].counter = 99;
selectedVerticalLinesAiEngine.resolveEnemyTurn();
const verticalLinesAiState = selectedVerticalLinesAiEngine.snapshot();
assert.equal(verticalLinesAiState.lastEnemyActions[0].skill.type, 77);
assert.equal(verticalLinesAiState.lastEnemyActions[0].skill.skillId, 9_005);
assert.deepEqual(verticalLinesAiState.board, [
  'RDBDDG', 'RLBHJG', 'RMBDGG', 'RLBHHG', 'RJBGLG',
]);
let verticalLinesExpectedState = 21_900;
for (let index = 0; index < 16; index += 1) {
  verticalLinesExpectedState = padLcgStep(verticalLinesExpectedState).state;
}
assert.equal(selectedVerticalLinesAiEngine.rng.state, verticalLinesExpectedState);
assert.equal(verticalLinesAiState.enemies[0].enemyAiBudget, 80);
const horizontalLines4AiMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(horizontalLines4AiMonsterDefinition.buffer).setUint32(0xec, 9_007, true);
const selectedHorizontalLines4AiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: horizontalLines4AiMonsterDefinition,
    skillDefinitions: [enemyAiHorizontalLines4Definition],
  }],
});
selectedHorizontalLines4AiEngine.setBoardFromCodes([
  'DDDDDD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD',
]);
selectedHorizontalLines4AiEngine.setRngState(21_900);
selectedHorizontalLines4AiEngine.enemies[0].counter = 1;
selectedHorizontalLines4AiEngine.enemies[1].counter = 99;
selectedHorizontalLines4AiEngine.resolveEnemyTurn();
const horizontalLines4AiState = selectedHorizontalLines4AiEngine.snapshot();
assert.equal(horizontalLines4AiState.lastEnemyActions[0].skill.type, 78);
assert.equal(horizontalLines4AiState.lastEnemyActions[0].skill.skillId, 9_007);
assert.deepEqual(horizontalLines4AiState.board, [
  'RRRRRR', 'BBBBBB', 'HMGDGL', 'GGGGGG', 'LLLLLL',
]);
let horizontalLines4ExpectedState = 21_900;
for (let index = 0; index < 25; index += 1) {
  horizontalLines4ExpectedState = padLcgStep(horizontalLines4ExpectedState).state;
}
assert.equal(selectedHorizontalLines4AiEngine.rng.state, horizontalLines4ExpectedState);
assert.equal(horizontalLines4AiState.enemies[0].enemyAiBudget, 80);
const verticalLines4AiMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(verticalLines4AiMonsterDefinition.buffer).setUint32(0xec, 9_008, true);
const selectedVerticalLines4AiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: verticalLines4AiMonsterDefinition,
    skillDefinitions: [enemyAiVerticalLines4Definition],
  }],
});
selectedVerticalLines4AiEngine.setBoardFromCodes([
  'DDDDDD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD',
]);
selectedVerticalLines4AiEngine.setRngState(21_900);
selectedVerticalLines4AiEngine.enemies[0].counter = 1;
selectedVerticalLines4AiEngine.enemies[1].counter = 99;
selectedVerticalLines4AiEngine.resolveEnemyTurn();
const verticalLines4AiState = selectedVerticalLines4AiEngine.snapshot();
assert.equal(verticalLines4AiState.lastEnemyActions[0].skill.type, 76);
assert.equal(verticalLines4AiState.lastEnemyActions[0].skill.skillId, 9_008);
assert.deepEqual(verticalLines4AiState.board, [
  'RBGDDL', 'RBGHJL', 'RBGDGL', 'RBGHHL', 'RBGGLL',
]);
let verticalLines4ExpectedState = 21_900;
for (let index = 0; index < 21; index += 1) {
  verticalLines4ExpectedState = padLcgStep(verticalLines4ExpectedState).state;
}
assert.equal(selectedVerticalLines4AiEngine.rng.state, verticalLines4ExpectedState);
assert.equal(verticalLines4AiState.enemies[0].enemyAiBudget, 80);
const poisonTypeListAiMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(poisonTypeListAiMonsterDefinition.buffer).setUint32(0xec, 9_006, true);
const selectedPoisonTypeListAiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: poisonTypeListAiMonsterDefinition,
    skillDefinitions: [enemyAiPoisonTypeListDefinition],
  }],
});
selectedPoisonTypeListAiEngine.setBoardFromCodes([
  'PMPMPM', 'MPMPMP', 'PMPMPM', 'MPMPMP', 'PMPMPM',
]);
selectedPoisonTypeListAiEngine.setRngState(21_900);
selectedPoisonTypeListAiEngine.enemies[0].counter = 1;
selectedPoisonTypeListAiEngine.enemies[1].counter = 99;
selectedPoisonTypeListAiEngine.resolveEnemyTurn();
const poisonTypeListAiState = selectedPoisonTypeListAiEngine.snapshot();
assert.equal(poisonTypeListAiState.lastEnemyActions[0].skill.type, 81);
assert.equal(poisonTypeListAiState.lastEnemyActions[0].skill.skillId, 9_006);
assert.deepEqual(['fire', 'water', 'wood'].map((type) => (
  selectedPoisonTypeListAiEngine.board.flat().filter((orb) => orb.type === type).length
)), [12, 9, 9]);
assert.equal(selectedPoisonTypeListAiEngine.board.flat().some((orb) => (
  orb.type === 'poison' || orb.type === 'mortalPoison'
)), false);
let poisonTypeListExpectedState = 21_900;
for (let index = 0; index < 31; index += 1) {
  poisonTypeListExpectedState = padLcgStep(poisonTypeListExpectedState).state;
}
assert.equal(selectedPoisonTypeListAiEngine.rng.state, poisonTypeListExpectedState);
assert.equal(poisonTypeListAiState.enemies[0].enemyAiBudget, 80);
const poisonTypeListDirectAiMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(poisonTypeListDirectAiMonsterDefinition.buffer).setUint32(0xec, 9_009, true);
const selectedPoisonTypeListDirectAiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: poisonTypeListDirectAiMonsterDefinition,
    skillDefinitions: [enemyAiPoisonTypeListDirectDefinition],
  }],
});
selectedPoisonTypeListDirectAiEngine.setBoardFromCodes([
  'PMPMPM', 'MPMPMP', 'PMPMPM', 'MPMPMP', 'PMPMPM',
]);
selectedPoisonTypeListDirectAiEngine.setRngState(21_900);
selectedPoisonTypeListDirectAiEngine.enemies[0].counter = 1;
selectedPoisonTypeListDirectAiEngine.enemies[1].counter = 99;
selectedPoisonTypeListDirectAiEngine.resolveEnemyTurn();
const poisonTypeListDirectAiState = selectedPoisonTypeListDirectAiEngine.snapshot();
assert.equal(poisonTypeListDirectAiState.lastEnemyActions[0].skill.type, 80);
assert.equal(poisonTypeListDirectAiState.lastEnemyActions[0].skill.skillId, 9_009);
assert.deepEqual(['fire', 'water', 'wood'].map((type) => (
  selectedPoisonTypeListDirectAiEngine.board.flat().filter((orb) => orb.type === type).length
)), [12, 9, 9]);
assert.equal(selectedPoisonTypeListDirectAiEngine.rng.state, poisonTypeListExpectedState);
assert.equal(poisonTypeListDirectAiState.enemies[0].enemyAiBudget, 80);
const poisonMaskDirectAiMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(poisonMaskDirectAiMonsterDefinition.buffer).setUint32(0xec, 9_010, true);
const selectedPoisonMaskDirectAiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: poisonMaskDirectAiMonsterDefinition,
    skillDefinitions: [enemyAiPoisonMaskDirectDefinition],
  }],
});
selectedPoisonMaskDirectAiEngine.setBoardFromCodes([
  'PMPMPM', 'MPMPMP', 'PMPMPM', 'MPMPMP', 'PMPMPM',
]);
selectedPoisonMaskDirectAiEngine.setRngState(21_900);
selectedPoisonMaskDirectAiEngine.enemies[0].counter = 1;
selectedPoisonMaskDirectAiEngine.enemies[1].counter = 99;
selectedPoisonMaskDirectAiEngine.resolveEnemyTurn();
const poisonMaskDirectAiState = selectedPoisonMaskDirectAiEngine.snapshot();
assert.equal(poisonMaskDirectAiState.lastEnemyActions[0].skill.type, 84);
assert.equal(poisonMaskDirectAiState.lastEnemyActions[0].skill.skillId, 9_010);
assert.deepEqual(['fire', 'water', 'wood'].map((type) => (
  selectedPoisonMaskDirectAiEngine.board.flat().filter((orb) => orb.type === type).length
)), [12, 9, 9]);
assert.equal(selectedPoisonMaskDirectAiEngine.rng.state, poisonTypeListExpectedState);
assert.equal(poisonMaskDirectAiState.enemies[0].enemyAiBudget, 80);
const poisonMaskAiMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(poisonMaskAiMonsterDefinition.buffer).setUint32(0xec, 9_011, true);
const selectedPoisonMaskAiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: poisonMaskAiMonsterDefinition,
    skillDefinitions: [enemyAiPoisonMaskDefinition],
  }],
});
selectedPoisonMaskAiEngine.setBoardFromCodes([
  'PMPMPM', 'MPMPMP', 'PMPMPM', 'MPMPMP', 'PMPMPM',
]);
selectedPoisonMaskAiEngine.setRngState(21_900);
selectedPoisonMaskAiEngine.enemies[0].counter = 1;
selectedPoisonMaskAiEngine.enemies[1].counter = 99;
selectedPoisonMaskAiEngine.resolveEnemyTurn();
const poisonMaskAiState = selectedPoisonMaskAiEngine.snapshot();
assert.equal(poisonMaskAiState.lastEnemyActions[0].skill.type, 85);
assert.equal(poisonMaskAiState.lastEnemyActions[0].skill.skillId, 9_011);
assert.deepEqual(['fire', 'water', 'wood'].map((type) => (
  selectedPoisonMaskAiEngine.board.flat().filter((orb) => orb.type === type).length
)), [12, 9, 9]);
assert.equal(selectedPoisonMaskAiEngine.rng.state, poisonTypeListExpectedState);
assert.equal(poisonMaskAiState.enemies[0].enemyAiBudget, 80);
const poisonBlockNAiMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(poisonBlockNAiMonsterDefinition.buffer).setUint32(0xec, 9_012, true);
const selectedPoisonBlockNAiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: poisonBlockNAiMonsterDefinition,
    skillDefinitions: [enemyAiPoisonBlockNDefinition],
  }],
});
selectedPoisonBlockNAiEngine.setBoardFromCodes([
  'RHRHRH', 'BRGBRG', 'LDBRHR', 'BHLDBH', 'LRLDHR',
]);
const poisonBlockNHeartCount = selectedPoisonBlockNAiEngine.board.flat()
  .filter((orb) => orb.type === 'heart').length;
selectedPoisonBlockNAiEngine.setRngState(21_900);
selectedPoisonBlockNAiEngine.enemies[0].counter = 1;
selectedPoisonBlockNAiEngine.enemies[1].counter = 99;
selectedPoisonBlockNAiEngine.resolveEnemyTurn();
const poisonBlockNAiState = selectedPoisonBlockNAiEngine.snapshot();
assert.equal(poisonBlockNAiState.lastEnemyActions[0].skill.type, 64);
assert.equal(poisonBlockNAiState.lastEnemyActions[0].skill.skillId, 9_012);
assert.equal(selectedPoisonBlockNAiEngine.board.flat()
  .filter((orb) => orb.type === 'mortalPoison').length, 5);
assert.equal(selectedPoisonBlockNAiEngine.board.flat()
  .filter((orb) => orb.type === 'heart').length, poisonBlockNHeartCount);
let poisonBlockNExpectedState = 21_900;
for (let index = 0; index < 11; index += 1) {
  poisonBlockNExpectedState = padLcgStep(poisonBlockNExpectedState).state;
}
assert.equal(selectedPoisonBlockNAiEngine.rng.state, poisonBlockNExpectedState);
assert.equal(poisonBlockNAiState.enemies[0].enemyAiBudget, 80);
const rejectedPoisonBlockNAiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: poisonBlockNAiMonsterDefinition,
    skillDefinitions: [enemyAiPoisonBlockNDefinition],
  }],
});
rejectedPoisonBlockNAiEngine.setBoardFromCodes([
  'PMPMPM', 'MHMHMH', 'PMPMPM', 'MHMHMH', 'PMPMPM',
]);
rejectedPoisonBlockNAiEngine.setRngState(21_900);
assert.equal(rejectedPoisonBlockNAiEngine.takeEnemySkill(0), null);
assert.equal(rejectedPoisonBlockNAiEngine.rng.state, 21_900);
assert.equal(rejectedPoisonBlockNAiEngine.snapshot().enemies[0].enemyAiBudget, 100);
const poisonBlocksAiMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(poisonBlocksAiMonsterDefinition.buffer).setUint32(0xec, 9_013, true);
const selectedPoisonBlocksAiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: poisonBlocksAiMonsterDefinition,
    skillDefinitions: [enemyAiPoisonBlocksDefinition],
  }],
});
selectedPoisonBlocksAiEngine.setBoardFromCodes([
  'RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD',
]);
const poisonBlocksHeartCount = selectedPoisonBlocksAiEngine.board.flat()
  .filter((orb) => orb.type === 'heart').length;
selectedPoisonBlocksAiEngine.setRngState(21_900);
selectedPoisonBlocksAiEngine.enemies[0].counter = 1;
selectedPoisonBlocksAiEngine.enemies[1].counter = 99;
selectedPoisonBlocksAiEngine.resolveEnemyTurn();
const poisonBlocksAiState = selectedPoisonBlocksAiEngine.snapshot();
assert.equal(poisonBlocksAiState.lastEnemyActions[0].skill.type, 57);
assert.equal(poisonBlocksAiState.lastEnemyActions[0].skill.skillId, 9_013);
assert.equal(selectedPoisonBlocksAiEngine.board.flat()
  .filter((orb) => orb.type === 'poison').length, 6);
assert.equal(selectedPoisonBlocksAiEngine.board.flat()
  .filter((orb) => orb.type === 'heart').length, poisonBlocksHeartCount);
assert.equal(selectedPoisonBlocksAiEngine.rng.state,
  padLcgStep(padLcgStep(padLcgStep(21_900).state).state).state);
assert.equal(poisonBlocksAiState.enemies[0].enemyAiBudget, 80);
const mortalPoisonBlocksAiMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(mortalPoisonBlocksAiMonsterDefinition.buffer).setUint32(0xec, 9_014, true);
const selectedMortalPoisonBlocksAiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: mortalPoisonBlocksAiMonsterDefinition,
    skillDefinitions: [enemyAiMortalPoisonBlocksDefinition],
  }],
});
selectedMortalPoisonBlocksAiEngine.setBoardFromCodes([
  'RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD',
]);
selectedMortalPoisonBlocksAiEngine.setRngState(21_900);
selectedMortalPoisonBlocksAiEngine.enemies[0].counter = 1;
selectedMortalPoisonBlocksAiEngine.enemies[1].counter = 99;
selectedMortalPoisonBlocksAiEngine.resolveEnemyTurn();
const mortalPoisonBlocksAiState = selectedMortalPoisonBlocksAiEngine.snapshot();
assert.equal(mortalPoisonBlocksAiState.lastEnemyActions[0].skill.type, 59);
assert.equal(mortalPoisonBlocksAiState.lastEnemyActions[0].skill.skillId, 9_014);
assert.equal(selectedMortalPoisonBlocksAiEngine.board.flat()
  .filter((orb) => orb.type === 'mortalPoison').length, 7);
assert.equal(selectedMortalPoisonBlocksAiEngine.rng.state,
  padLcgStep(padLcgStep(padLcgStep(21_900).state).state).state);
assert.equal(mortalPoisonBlocksAiState.enemies[0].enemyAiBudget, 80);
const rejectedPoisonBlocksAiEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: poisonBlocksAiMonsterDefinition,
    skillDefinitions: [enemyAiPoisonBlocksDefinition],
  }],
});
rejectedPoisonBlocksAiEngine.setBoardFromCodes(Array(5).fill('HHHHHH'));
rejectedPoisonBlocksAiEngine.setRngState(21_900);
assert.equal(rejectedPoisonBlocksAiEngine.takeEnemySkill(0), null);
assert.equal(rejectedPoisonBlocksAiEngine.rng.state, 21_900);
const poisonBlockNCountedMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(poisonBlockNCountedMonsterDefinition.buffer).setUint32(0xec, 9_015, true);
const selectedPoisonBlockNCountedEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: poisonBlockNCountedMonsterDefinition,
    skillDefinitions: [enemyAiPoisonBlockNCountedDefinition],
  }],
});
selectedPoisonBlockNCountedEngine.setBoardFromCodes([
  'RBRBHD', 'GLDHBG', 'HBGDGL', 'DLGHHB', 'HBGGLD',
]);
const countedHeartCount = selectedPoisonBlockNCountedEngine.board.flat()
  .filter((orb) => orb.type === 'heart').length;
selectedPoisonBlockNCountedEngine.setRngState(21_900);
selectedPoisonBlockNCountedEngine.enemies[0].counter = 1;
selectedPoisonBlockNCountedEngine.enemies[1].counter = 99;
selectedPoisonBlockNCountedEngine.resolveEnemyTurn();
const poisonBlockNCountedState = selectedPoisonBlockNCountedEngine.snapshot();
assert.equal(poisonBlockNCountedState.lastEnemyActions[0].skill.type, 60);
assert.equal(poisonBlockNCountedState.lastEnemyActions[0].skill.skillId, 9_015);
assert.equal(selectedPoisonBlockNCountedEngine.board.flat()
  .filter((orb) => orb.type === 'poison').length, 4);
assert.equal(selectedPoisonBlockNCountedEngine.board.flat()
  .filter((orb) => orb.type === 'heart').length, countedHeartCount);
let poisonBlockNCountedExpectedState = 21_900;
for (let index = 0; index < 9; index += 1) {
  poisonBlockNCountedExpectedState = padLcgStep(poisonBlockNCountedExpectedState).state;
}
assert.equal(selectedPoisonBlockNCountedEngine.rng.state, poisonBlockNCountedExpectedState);
assert.equal(poisonBlockNCountedState.enemies[0].enemyAiBudget, 80);
const mortalPoisonBlockNCountedMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(mortalPoisonBlockNCountedMonsterDefinition.buffer).setUint32(0xec, 9_016, true);
const selectedMortalPoisonBlockNCountedEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: mortalPoisonBlockNCountedMonsterDefinition,
    skillDefinitions: [enemyAiMortalPoisonBlockNCountedDefinition],
  }],
});
selectedMortalPoisonBlockNCountedEngine.setBoardFromCodes([
  'RBRBHD', 'GLDHBG', 'HBGDGL', 'DLGHHB', 'HBGGLD',
]);
selectedMortalPoisonBlockNCountedEngine.setRngState(21_900);
selectedMortalPoisonBlockNCountedEngine.enemies[0].counter = 1;
selectedMortalPoisonBlockNCountedEngine.enemies[1].counter = 99;
selectedMortalPoisonBlockNCountedEngine.resolveEnemyTurn();
const mortalPoisonBlockNCountedState = selectedMortalPoisonBlockNCountedEngine.snapshot();
assert.equal(mortalPoisonBlockNCountedState.lastEnemyActions[0].skill.type, 61);
assert.equal(mortalPoisonBlockNCountedState.lastEnemyActions[0].skill.skillId, 9_016);
assert.equal(selectedMortalPoisonBlockNCountedEngine.board.flat()
  .filter((orb) => orb.type === 'mortalPoison').length, 4);
assert.equal(selectedMortalPoisonBlockNCountedEngine.rng.state, poisonBlockNCountedExpectedState);
assert.equal(mortalPoisonBlockNCountedState.enemies[0].enemyAiBudget, 80);
const rejectedPoisonBlockNCountedEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: poisonBlockNCountedMonsterDefinition,
    skillDefinitions: [enemyAiPoisonBlockNCountedDefinition],
  }],
});
rejectedPoisonBlockNCountedEngine.setBoardFromCodes([
  'RRRHHH', 'PMPMPM', 'MHMHMH', 'PMPMPM', 'MHMHMH',
]);
rejectedPoisonBlockNCountedEngine.setRngState(21_900);
assert.equal(rejectedPoisonBlockNCountedEngine.takeEnemySkill(0), null);
assert.equal(rejectedPoisonBlockNCountedEngine.rng.state, 21_900);
const sourceToPoisonMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(sourceToPoisonMonsterDefinition.buffer).setUint32(0xec, 9_017, true);
const selectedSourceToPoisonEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: sourceToPoisonMonsterDefinition,
    skillDefinitions: [enemyAiSourceToPoisonDefinition],
  }],
});
selectedSourceToPoisonEngine.setBoardFromCodes([
  'RRRBBB', 'BBBBBB', 'BBBBBB', 'BBBBBB', 'BBBBBB',
]);
selectedSourceToPoisonEngine.setOrbState(0, 2, { locked: true });
selectedSourceToPoisonEngine.setRngState(21_900);
selectedSourceToPoisonEngine.enemies[0].counter = 1;
selectedSourceToPoisonEngine.enemies[1].counter = 99;
selectedSourceToPoisonEngine.resolveEnemyTurn();
const sourceToPoisonState = selectedSourceToPoisonEngine.snapshot();
assert.equal(sourceToPoisonState.lastEnemyActions[0].skill.type, 56);
assert.equal(sourceToPoisonState.lastEnemyActions[0].skill.skillId, 9_017);
assert.equal(selectedSourceToPoisonEngine.board.flat()
  .filter((orb) => orb.type === 'poison').length, 2);
assert.equal(selectedSourceToPoisonEngine.board[0][2].type, 'fire');
assert.equal(selectedSourceToPoisonEngine.rng.state, padLcgStep(21_900).state);
assert.equal(sourceToPoisonState.enemies[0].enemyAiBudget, 80);
const rejectedScaledSourceToPoisonEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: sourceToPoisonMonsterDefinition,
    skillDefinitions: [enemyAiSourceToPoisonDefinition],
  }],
});
rejectedScaledSourceToPoisonEngine.setBoardFromCodes([
  'RBBBBB', 'BBBBBB', 'BBBBBB', 'BBBBBB', 'BBBBBB',
]);
rejectedScaledSourceToPoisonEngine.setRngState(21_900);
assert.equal(rejectedScaledSourceToPoisonEngine.takeEnemySkill(0), null);
assert.equal(rejectedScaledSourceToPoisonEngine.rng.state, padLcgStep(21_900).state);
const fallbackSourceToPoisonMonsterDefinition = sourceToPoisonMonsterDefinition.slice();
const fallbackSourceToPoisonMonsterView = new DataView(
  fallbackSourceToPoisonMonsterDefinition.buffer,
);
fallbackSourceToPoisonMonsterView.setUint8(0xf1, 1);
const fallbackSourceToPoisonEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: fallbackSourceToPoisonMonsterDefinition,
    skillDefinitions: [enemyAiSourceToPoisonDefinition],
  }],
});
fallbackSourceToPoisonEngine.setBoardFromCodes([
  'RBBBBB', 'BBBBBB', 'BBBBBB', 'BBBBBB', 'BBBBBB',
]);
fallbackSourceToPoisonEngine.setRngState(21_900);
const fallbackSourceToPoisonSkill = fallbackSourceToPoisonEngine.takeEnemySkill(0);
assert.equal(fallbackSourceToPoisonSkill.type, 56);
assert.equal(fallbackSourceToPoisonSkill.skillId, 9_017);
assert.equal(fallbackSourceToPoisonEngine.rng.state,
  padLcgStep(padLcgStep(21_900).state).state);
const sourceToMortalPoisonMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(sourceToMortalPoisonMonsterDefinition.buffer).setUint32(0xec, 9_018, true);
const selectedSourceToMortalPoisonEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: sourceToMortalPoisonMonsterDefinition,
    skillDefinitions: [enemyAiSourceToMortalPoisonDefinition],
  }],
});
selectedSourceToMortalPoisonEngine.setBoardFromCodes([
  'BBBRRR', 'RRRRRR', 'RRRRRR', 'RRRRRR', 'RRRRRR',
]);
selectedSourceToMortalPoisonEngine.setRngState(21_900);
selectedSourceToMortalPoisonEngine.enemies[0].counter = 1;
selectedSourceToMortalPoisonEngine.enemies[1].counter = 99;
selectedSourceToMortalPoisonEngine.resolveEnemyTurn();
const sourceToMortalPoisonState = selectedSourceToMortalPoisonEngine.snapshot();
assert.equal(sourceToMortalPoisonState.lastEnemyActions[0].skill.type, 58);
assert.equal(sourceToMortalPoisonState.lastEnemyActions[0].skill.skillId, 9_018);
assert.equal(selectedSourceToMortalPoisonEngine.board.flat()
  .filter((orb) => orb.type === 'mortalPoison').length, 3);
assert.equal(selectedSourceToMortalPoisonEngine.rng.state, padLcgStep(21_900).state);
const healPlayerMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(healPlayerMonsterDefinition.buffer).setUint32(0xec, 9_019, true);
const selectedHealPlayerEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: healPlayerMonsterDefinition,
    skillDefinitions: [enemyAiHealPlayerDefinition],
  }],
});
selectedHealPlayerEngine.player.hp = 3_059;
selectedHealPlayerEngine.setRngState(21_900);
selectedHealPlayerEngine.enemies[0].counter = 1;
selectedHealPlayerEngine.enemies[1].counter = 99;
selectedHealPlayerEngine.resolveEnemyTurn();
const selectedHealPlayerState = selectedHealPlayerEngine.snapshot();
assert.equal(selectedHealPlayerState.player.hp, 9_059);
assert.equal(selectedHealPlayerState.lastEnemyActions[0].skill.type, 55);
assert.equal(selectedHealPlayerState.lastEnemyActions[0].skill.skillId, 9_019);
assert.equal(selectedHealPlayerState.enemies[0].enemyAiBudget, 80);
assert.equal(selectedHealPlayerEngine.rng.state, padLcgStep(21_900).state);
const rejectedHealPlayerEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: healPlayerMonsterDefinition,
    skillDefinitions: [enemyAiHealPlayerDefinition],
  }],
});
rejectedHealPlayerEngine.player.hp = 3_060;
rejectedHealPlayerEngine.setRngState(21_900);
assert.equal(rejectedHealPlayerEngine.takeEnemySkill(0), null);
assert.equal(rejectedHealPlayerEngine.rng.state, 21_900);
const moveTimeReductionMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(moveTimeReductionMonsterDefinition.buffer).setUint32(0xec, 9_028, true);
const selectedMoveTimeReductionEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: moveTimeReductionMonsterDefinition,
    skillDefinitions: [enemyAiMoveTimeReductionDefinition],
  }],
});
selectedMoveTimeReductionEngine.setRngState(21_900);
selectedMoveTimeReductionEngine.enemies[0].counter = 1;
selectedMoveTimeReductionEngine.enemies[1].counter = 99;
selectedMoveTimeReductionEngine.resolveEnemyTurn();
const selectedMoveTimeReductionState = selectedMoveTimeReductionEngine.snapshot();
assert.equal(selectedMoveTimeReductionState.moveTimeSeconds, 3.75);
assert.equal(selectedMoveTimeReductionState.moveTimeReduction.turnsRemaining, 2);
assert.equal(selectedMoveTimeReductionState.lastEnemyActions[0].skill.type, 39);
assert.equal(selectedMoveTimeReductionState.lastEnemyActions[0].skill.skillId, 9_028);
assert.equal(selectedMoveTimeReductionState.enemies[0].enemyAiBudget, 80);
assert.equal(selectedMoveTimeReductionEngine.rng.state, padLcgStep(21_900).state);
selectedMoveTimeReductionEngine.start();
assert.equal(selectedMoveTimeReductionEngine.startDrag(0, 0, 50, 50), true);
assert.equal(selectedMoveTimeReductionEngine.drag.remaining, 3.75);
selectedMoveTimeReductionEngine.drag = null;
selectedMoveTimeReductionEngine.enemies[0].counter = 99;
selectedMoveTimeReductionEngine.resolveEnemyTurn();
assert.equal(selectedMoveTimeReductionEngine.moveTimeReduction.turnsRemaining, 1);
selectedMoveTimeReductionEngine.resolveEnemyTurn();
assert.equal(selectedMoveTimeReductionEngine.moveTimeReduction, null);
assert.equal(selectedMoveTimeReductionEngine.moveTime, 5);
const rejectedMoveTimeReductionEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: moveTimeReductionMonsterDefinition,
    skillDefinitions: [enemyAiMoveTimeReductionDefinition],
  }],
});
assert.equal(rejectedMoveTimeReductionEngine.applyEnemySkillDefinition(
  enemyAiMoveTimeReductionDefinition,
), true);
rejectedMoveTimeReductionEngine.setRngState(21_900);
assert.equal(rejectedMoveTimeReductionEngine.takeEnemySkill(0), null);
assert.equal(rejectedMoveTimeReductionEngine.rng.state, 21_900);
const statusShieldMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(statusShieldMonsterDefinition.buffer).setUint32(0xec, 9_029, true);
const selectedStatusShieldEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: statusShieldMonsterDefinition,
    skillDefinitions: [enemyAiStatusShieldDefinition],
  }],
});
selectedStatusShieldEngine.setRngState(21_900);
selectedStatusShieldEngine.enemies[0].counter = 1;
selectedStatusShieldEngine.enemies[1].counter = 99;
selectedStatusShieldEngine.resolveEnemyTurn();
const selectedStatusShieldState = selectedStatusShieldEngine.snapshot();
assert.equal(selectedStatusShieldState.enemies[0].statusShieldTurns, 3);
assert.equal(selectedStatusShieldState.lastEnemyActions[0].skill.type, 20);
assert.equal(selectedStatusShieldState.lastEnemyActions[0].skill.skillId, 9_029);
assert.equal(selectedStatusShieldState.enemies[0].enemyAiBudget, 80);
assert.equal(selectedStatusShieldEngine.rng.state, padLcgStep(21_900).state);
selectedStatusShieldEngine.enemies[0].counter = 99;
selectedStatusShieldEngine.resolveEnemyTurn();
assert.equal(selectedStatusShieldEngine.enemies[0].statusShieldTurns, 2);
const rejectedStatusShieldEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: statusShieldMonsterDefinition,
    skillDefinitions: [enemyAiStatusShieldDefinition],
  }],
});
assert.equal(rejectedStatusShieldEngine.applyEnemySkillDefinition(
  enemyAiStatusShieldDefinition,
), true);
rejectedStatusShieldEngine.setRngState(21_900);
assert.equal(rejectedStatusShieldEngine.takeEnemySkill(0), null);
assert.equal(rejectedStatusShieldEngine.rng.state, 21_900);
const loneAttackBoostMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(loneAttackBoostMonsterDefinition.buffer).setUint32(0xec, 9_030, true);
const selectedLoneAttackBoostEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: loneAttackBoostMonsterDefinition,
    skillDefinitions: [enemyAiLoneAttackBoostDefinition],
  }],
});
selectedLoneAttackBoostEngine.enemies[1].hp = 0;
selectedLoneAttackBoostEngine.setRngState(21_900);
selectedLoneAttackBoostEngine.enemies[0].counter = 1;
selectedLoneAttackBoostEngine.resolveEnemyTurn();
const selectedLoneAttackBoostState = selectedLoneAttackBoostEngine.snapshot();
assert.equal(selectedLoneAttackBoostState.enemies[0].attackBoostTurns, 3);
assert.equal(selectedLoneAttackBoostState.enemies[0].attackBoostPercent, 200);
assert.equal(selectedLoneAttackBoostState.lastEnemyActions[0].skill.type, 17);
assert.equal(selectedLoneAttackBoostState.lastEnemyActions[0].damage, 925);
assert.equal(selectedLoneAttackBoostState.player.hp, 11_075);
assert.equal(selectedLoneAttackBoostEngine.rng.state, padLcgStep(21_900).state);
selectedLoneAttackBoostEngine.enemies[0].counter = 1;
selectedLoneAttackBoostEngine.resolveEnemyTurn();
const boostedEnemyAttack = selectedLoneAttackBoostEngine.snapshot();
assert.equal(boostedEnemyAttack.enemies[0].attackBoostTurns, 2);
assert.equal(boostedEnemyAttack.lastEnemyActions[0].kind, 'attack');
assert.equal(boostedEnemyAttack.lastEnemyActions[0].damage, 3_700);
const rejectedLoneAttackBoostEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: loneAttackBoostMonsterDefinition,
    skillDefinitions: [enemyAiLoneAttackBoostDefinition],
  }],
});
rejectedLoneAttackBoostEngine.setRngState(21_900);
assert.equal(rejectedLoneAttackBoostEngine.takeEnemySkill(0), null);
assert.equal(rejectedLoneAttackBoostEngine.rng.state, 21_900);
const sourceOrbConversionMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(sourceOrbConversionMonsterDefinition.buffer).setUint32(0xec, 9_033, true);
const selectedSourceOrbConversionEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: sourceOrbConversionMonsterDefinition,
    skillDefinitions: [enemyAiSourceOrbConversionDefinition],
  }],
});
selectedSourceOrbConversionEngine.setBoardFromCodes([
  'BBBRHD', 'GLDRHG', 'RHRDGL', 'DLGRHB', 'HRRGLD',
]);
selectedSourceOrbConversionEngine.setRngState(21_900);
selectedSourceOrbConversionEngine.enemies[0].counter = 1;
selectedSourceOrbConversionEngine.enemies[1].counter = 99;
selectedSourceOrbConversionEngine.resolveEnemyTurn();
const selectedSourceOrbConversionState = selectedSourceOrbConversionEngine.snapshot();
assert.equal(selectedSourceOrbConversionState.lastEnemyActions[0].skill.type, 4);
assert.equal(selectedSourceOrbConversionState.lastEnemyActions[0].damage, 463);
assert.equal(selectedSourceOrbConversionEngine.board.flat()
  .some((orb) => orb.type === 'water'), false);
assert.equal(selectedSourceOrbConversionEngine.rng.state, padLcgStep(21_900).state);
const rejectedSourceOrbConversionEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: sourceOrbConversionMonsterDefinition,
    skillDefinitions: [enemyAiSourceOrbConversionDefinition],
  }],
});
rejectedSourceOrbConversionEngine.setBoardFromCodes(Array(5).fill('RRRRRR'));
rejectedSourceOrbConversionEngine.setRngState(21_900);
assert.equal(rejectedSourceOrbConversionEngine.takeEnemySkill(0), null);
assert.equal(rejectedSourceOrbConversionEngine.rng.state, 21_900);
const sourceToJammerMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(sourceToJammerMonsterDefinition.buffer).setUint32(0xec, 9_034, true);
const selectedSourceToJammerEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: sourceToJammerMonsterDefinition,
    skillDefinitions: [enemyAiSourceToJammerDefinition],
  }],
});
selectedSourceToJammerEngine.setBoardFromCodes([
  'HHHRBD', 'GLDRBG', 'RBRDGL', 'DLGRHB', 'HRRGLD',
]);
selectedSourceToJammerEngine.setRngState(21_900);
selectedSourceToJammerEngine.enemies[0].counter = 1;
selectedSourceToJammerEngine.enemies[1].counter = 99;
selectedSourceToJammerEngine.resolveEnemyTurn();
assert.equal(selectedSourceToJammerEngine.lastEnemySkill.type, 12);
assert.equal(selectedSourceToJammerEngine.board.flat()
  .filter((orb) => orb.type === 'jammer').length, 5);
assert.equal(selectedSourceToJammerEngine.rng.state, padLcgStep(21_900).state);
const rejectedSourceToJammerEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: sourceToJammerMonsterDefinition,
    skillDefinitions: [enemyAiSourceToJammerDefinition],
  }],
});
rejectedSourceToJammerEngine.setBoardFromCodes(Array(5).fill('RRRRRR'));
rejectedSourceToJammerEngine.setRngState(21_900);
assert.equal(rejectedSourceToJammerEngine.takeEnemySkill(0), null);
assert.equal(rejectedSourceToJammerEngine.rng.state, 21_900);
const clearPlayerBuffsMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(clearPlayerBuffsMonsterDefinition.buffer).setUint32(0xec, 9_035, true);
const oneBuffClearPlayerBuffsEngine = new PuzzleEngine({
  seed: 21_900,
  playerAttackBoostTurns: 2,
  enemyAiPools: [{
    monsterDefinition: clearPlayerBuffsMonsterDefinition,
    skillDefinitions: [enemyAiClearPlayerBuffsDefinition],
  }],
});
oneBuffClearPlayerBuffsEngine.setRngState(21_900);
assert.equal(oneBuffClearPlayerBuffsEngine.takeEnemySkill(0), null);
assert.equal(oneBuffClearPlayerBuffsEngine.rng.state, padLcgStep(21_900).state);
const selectedClearPlayerBuffsEngine = new PuzzleEngine({
  seed: 21_900,
  playerAuxiliaryBuffTurns: 4,
  playerAttackBoostTurns: 2,
  enemyAiPools: [{
    monsterDefinition: clearPlayerBuffsMonsterDefinition,
    skillDefinitions: [enemyAiClearPlayerBuffsDefinition],
  }],
});
selectedClearPlayerBuffsEngine.setRngState(21_900);
selectedClearPlayerBuffsEngine.enemies[0].counter = 1;
selectedClearPlayerBuffsEngine.enemies[1].counter = 99;
selectedClearPlayerBuffsEngine.resolveEnemyTurn();
const selectedClearPlayerBuffsState = selectedClearPlayerBuffsEngine.snapshot();
assert.equal(selectedClearPlayerBuffsState.lastEnemyActions[0].skill.type, 6);
assert.equal(selectedClearPlayerBuffsState.lastEnemyActions[0].skill.skillId, 9_035);
assert.equal(selectedClearPlayerBuffsState.lastEnemySkill.clearedBuffCount, 2);
assert.deepEqual(selectedClearPlayerBuffsState.nativePlayerBuffStatus, {
  auxiliaryTurns: 0,
  attackBoostTurns: 0,
});
assert.equal(selectedClearPlayerBuffsEngine.rng.state, padLcgStep(21_900).state);
const shieldedClearPlayerBuffsEngine = new PuzzleEngine({
  seed: 21_900,
  playerAuxiliaryBuffTurns: 4,
  playerAttackBoostTurns: 2,
  enemyAiPools: [{
    monsterDefinition: clearPlayerBuffsMonsterDefinition,
    skillDefinitions: [enemyAiClearPlayerBuffsDefinition],
  }],
});
shieldedClearPlayerBuffsEngine.enemies[0].statusShieldTurns = 1;
shieldedClearPlayerBuffsEngine.setRngState(21_900);
assert.equal(shieldedClearPlayerBuffsEngine.takeEnemySkill(0), null);
assert.equal(shieldedClearPlayerBuffsEngine.rng.state, 21_900);
const healEnemyMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(healEnemyMonsterDefinition.buffer).setUint32(0xec, 9_036, true);
const selectedHealEnemyEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: healEnemyMonsterDefinition,
    skillDefinitions: [enemyAiHealEnemyDefinition],
  }],
});
selectedHealEnemyEngine.enemies[0].hp = 50_000;
selectedHealEnemyEngine.enemies[0].counter = 1;
selectedHealEnemyEngine.enemies[1].counter = 99;
selectedHealEnemyEngine.setRngState(21_900);
selectedHealEnemyEngine.resolveEnemyTurn();
const selectedHealEnemyState = selectedHealEnemyEngine.snapshot();
assert.equal(selectedHealEnemyState.enemies[0].hp, 76_680);
assert.equal(selectedHealEnemyState.lastEnemyActions[0].skill.type, 7);
assert.equal(selectedHealEnemyState.lastEnemyActions[0].skill.healPercent, 29);
assert.equal(selectedHealEnemyState.lastEnemyActions[0].damage, 925);
assert.equal(selectedHealEnemyState.player.hp, 11_075);
assert.equal(selectedHealEnemyState.rngState,
  padLcgStep(padLcgStep(21_900).state).state);
const rejectedHealEnemyEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: healEnemyMonsterDefinition,
    skillDefinitions: [enemyAiHealEnemyDefinition],
  }],
});
rejectedHealEnemyEngine.player.hp = 1_849;
rejectedHealEnemyEngine.setRngState(21_900);
assert.equal(rejectedHealEnemyEngine.takeEnemySkill(0), null);
assert.equal(rejectedHealEnemyEngine.rng.state, 21_900);
const unconditionalHealMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(unconditionalHealMonsterDefinition.buffer).setUint32(0xec, 9_067, true);
const selectedUnconditionalHealEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: unconditionalHealMonsterDefinition,
    skillDefinitions: [enemyAiUnconditionalHealDefinition],
  }],
});
selectedUnconditionalHealEngine.player.hp = 1;
selectedUnconditionalHealEngine.enemies[0].hp = 50_000;
selectedUnconditionalHealEngine.enemies[0].counter = 1;
selectedUnconditionalHealEngine.enemies[1].counter = 99;
selectedUnconditionalHealEngine.setRngState(21_900);
selectedUnconditionalHealEngine.resolveEnemyTurn();
const selectedUnconditionalHealState = selectedUnconditionalHealEngine.snapshot();
assert.equal(selectedUnconditionalHealState.lastEnemyActions[0].skill.type, 86);
assert.equal(selectedUnconditionalHealState.lastEnemyActions[0].skill.healPercent, 29);
assert.equal(selectedUnconditionalHealState.lastEnemyActions[0].damage, undefined);
assert.equal(selectedUnconditionalHealState.enemies[0].hp, 76_680);
assert.equal(selectedUnconditionalHealState.player.hp, 1);
assert.equal(
  selectedUnconditionalHealState.rngState,
  padLcgStep(padLcgStep(21_900).state).state,
);
const damageAbsorbMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(damageAbsorbMonsterDefinition.buffer).setUint32(0xec, 9_068, true);
const selectedDamageAbsorbEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: damageAbsorbMonsterDefinition,
    skillDefinitions: [enemyAiDamageAbsorbDefinition],
  }],
});
selectedDamageAbsorbEngine.enemies[0].counter = 1;
selectedDamageAbsorbEngine.enemies[1].counter = 99;
selectedDamageAbsorbEngine.setRngState(21_900);
selectedDamageAbsorbEngine.resolveEnemyTurn();
const selectedDamageAbsorbState = selectedDamageAbsorbEngine.snapshot();
assert.equal(selectedDamageAbsorbState.lastEnemyActions[0].skill.type, 87);
assert.equal(selectedDamageAbsorbState.enemies[0].damageAbsorbTurns, 3);
assert.equal(selectedDamageAbsorbState.enemies[0].damageAbsorbThreshold, 1_660);
assert.equal(selectedDamageAbsorbState.player.hp, 12_000);
assert.equal(selectedDamageAbsorbState.rngState, padLcgStep(21_900).state);
selectedDamageAbsorbEngine.setRngState(selectedDamageAbsorbState.rngState);
assert.equal(selectedDamageAbsorbEngine.takeEnemySkill(0), null);
assert.equal(selectedDamageAbsorbEngine.rng.state, selectedDamageAbsorbState.rngState);
selectedDamageAbsorbEngine.enemies[0].counter = 99;
selectedDamageAbsorbEngine.resolveEnemyTurn();
assert.equal(selectedDamageAbsorbEngine.enemies[0].damageAbsorbTurns, 2);

const awakeningBindMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(awakeningBindMonsterDefinition.buffer).setUint32(0xec, 9_069, true);
const selectedAwakeningBindEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: awakeningBindMonsterDefinition,
    skillDefinitions: [enemyAiAwakeningBindDefinition],
  }],
});
selectedAwakeningBindEngine.enemies[0].counter = 1;
selectedAwakeningBindEngine.enemies[1].counter = 99;
selectedAwakeningBindEngine.setRngState(21_900);
selectedAwakeningBindEngine.resolveEnemyTurn();
const selectedAwakeningBindState = selectedAwakeningBindEngine.snapshot();
assert.equal(selectedAwakeningBindState.lastEnemyActions[0].skill.type, 88);
assert.equal(selectedAwakeningBindState.awakeningBindTurns, 3);
assert.equal(selectedAwakeningBindState.player.hp, 12_000);
assert.equal(selectedAwakeningBindState.rngState, padLcgStep(21_900).state);
assert.equal(selectedAwakeningBindEngine.takeEnemySkill(0), null);
assert.equal(selectedAwakeningBindEngine.rng.state, selectedAwakeningBindState.rngState);
assert.equal(selectedAwakeningBindEngine.applyEnemySkillRuntime(
  enemyAiAwakeningBindDefinition,
  awakeningBindRuntime,
), true);
assert.equal(selectedAwakeningBindEngine.awakeningBindTurns, 7);
selectedAwakeningBindEngine.enemies[0].counter = 99;
selectedAwakeningBindEngine.resolveEnemyTurn();
assert.equal(selectedAwakeningBindEngine.awakeningBindTurns, 7);
selectedAwakeningBindEngine.resolveEnemyTurn();
assert.equal(selectedAwakeningBindEngine.awakeningBindTurns, 6);

const awakeningBoundResistanceEngine = new PuzzleEngine({
  seed: 21_900,
  skillSealResistAwakenings: 5,
});
awakeningBoundResistanceEngine.awakeningBindTurns = 3;
awakeningBoundResistanceEngine.setRngState(21_900);
assert.equal(awakeningBoundResistanceEngine.applyEnemySkillRuntime(
  enemyAiActiveSkillSealDefinition,
  activeSkillSealMonsterRuntime,
), true);
assert.equal(awakeningBoundResistanceEngine.lastEnemySkill.resisted, false);
assert.equal(awakeningBoundResistanceEngine.skillSealTurns, 4);
assert.equal(awakeningBoundResistanceEngine.rng.state, 21_900);
awakeningBoundResistanceEngine.party[0].superBindResist = true;
const awakeningBoundCardBind = awakeningBoundResistanceEngine.doBind(1, 3);
assert.equal(awakeningBoundCardBind.boundMask, 1);
assert.equal(awakeningBoundCardBind.resistedMask, 0);
assert.equal(awakeningBoundResistanceEngine.party[0].bindTurns, 3);

const directSkillDelayEngine = new PuzzleEngine({ seed: 21_900 });
directSkillDelayEngine.skill.cooldown = 2;
directSkillDelayEngine.setRngState(21_900);
assert.equal(directSkillDelayEngine.applyEnemySkillDefinition(enemyAiSkillDelayDefinition), true);
assert.equal(directSkillDelayEngine.skill.cooldown, 4);
assert.deepEqual(directSkillDelayEngine.lastEnemySkill.skillDelays, [2, 0, 0, 0, 0, 0]);
assert.equal(directSkillDelayEngine.lastEnemySkill.targetMask, 1);
assert.equal(directSkillDelayEngine.lastEnemySkill.appliedDelay, 2);
assert.equal(directSkillDelayEngine.rng.state, padLcgStep(21_900).state);

const emptySkillGaugeDelayEngine = new PuzzleEngine({ seed: 21_900 });
emptySkillGaugeDelayEngine.skill.cooldown = emptySkillGaugeDelayEngine.skill.maxCooldown;
emptySkillGaugeDelayEngine.setRngState(21_900);
assert.equal(emptySkillGaugeDelayEngine.applyEnemySkillDefinition(enemyAiSkillDelayDefinition), true);
assert.equal(emptySkillGaugeDelayEngine.skill.cooldown, 5);
assert.equal(emptySkillGaugeDelayEngine.lastEnemySkill.targetMask, 0);
assert.deepEqual(emptySkillGaugeDelayEngine.lastEnemySkill.skillDelays, [0, 0, 0, 0, 0, 0]);
assert.equal(emptySkillGaugeDelayEngine.rng.state, 21_900);

const protectedSkillDelayEngine = new PuzzleEngine({ seed: 21_900 });
protectedSkillDelayEngine.skill.skillDelayResistLatents = 2;
protectedSkillDelayEngine.setRngState(21_900);
assert.equal(protectedSkillDelayEngine.applyEnemySkillDefinition(enemyAiSkillDelayDefinition), true);
assert.equal(protectedSkillDelayEngine.skill.cooldown, 0);
assert.equal(protectedSkillDelayEngine.lastEnemySkill.targetMask, 0);
protectedSkillDelayEngine.awakeningBindTurns = 3;
protectedSkillDelayEngine.setRngState(21_900);
assert.equal(protectedSkillDelayEngine.applyEnemySkillDefinition(enemyAiSkillDelayDefinition), true);
assert.equal(protectedSkillDelayEngine.skill.cooldown, 2);
assert.equal(protectedSkillDelayEngine.lastEnemySkill.targetMask, 1);

const skillDelayMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(skillDelayMonsterDefinition.buffer).setUint32(0xec, 9_070, true);
const selectedSkillDelayEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: skillDelayMonsterDefinition,
    skillDefinitions: [enemyAiSkillDelayDefinition],
  }],
});
selectedSkillDelayEngine.enemies[0].counter = 1;
selectedSkillDelayEngine.enemies[1].counter = 99;
selectedSkillDelayEngine.setRngState(21_900);
selectedSkillDelayEngine.resolveEnemyTurn();
const selectedSkillDelayState = selectedSkillDelayEngine.snapshot();
assert.equal(selectedSkillDelayState.lastEnemyActions[0].skill.type, 89);
assert.deepEqual(selectedSkillDelayState.lastEnemyActions[0].skill.skillDelays, [4, 0, 0, 0, 0, 0]);
assert.equal(selectedSkillDelayState.lastEnemyActions[0].damage, undefined);
assert.equal(selectedSkillDelayState.skill.cooldown, 4);
assert.equal(selectedSkillDelayState.player.hp, 12_000);
assert.equal(
  selectedSkillDelayState.rngState,
  padLcgStep(padLcgStep(21_900).state).state,
);

const presenceCheckMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(presenceCheckMonsterDefinition.buffer).setUint32(0xec, 9_071, true);
const selectedPresenceCheckEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: presenceCheckMonsterDefinition,
    skillDefinitions: [enemyAiPresenceCheckDefinition],
  }],
});
selectedPresenceCheckEngine.enemies[0].counter = 1;
selectedPresenceCheckEngine.enemies[1].counter = 99;
selectedPresenceCheckEngine.setRngState(21_900);
selectedPresenceCheckEngine.resolveEnemyTurn();
const selectedPresenceCheckState = selectedPresenceCheckEngine.snapshot();
assert.equal(selectedPresenceCheckState.lastEnemyActions[0].skill.type, 90);
assert.deepEqual(
  selectedPresenceCheckState.lastEnemyActions[0].skill.candidateCardIds,
  [1_234, 5_678, 9_012],
);
assert.equal(selectedPresenceCheckState.lastEnemyActions[0].damage, undefined);
assert.equal(selectedPresenceCheckState.player.hp, 12_000);
assert.equal(selectedPresenceCheckState.rngState, padLcgStep(21_900).state);
assert.equal(
  selectedPresenceCheckState.message,
  'Verdant Shell checks the party and takes no action.',
);

const directMaskedRandomOrbChangeEngine = new PuzzleEngine({ seed: 21_900 });
directMaskedRandomOrbChangeEngine.setBoardFromCodes([
  'RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD',
]);
directMaskedRandomOrbChangeEngine.setRngState(21_900);
assert.equal(directMaskedRandomOrbChangeEngine.applyEnemySkillDefinition(
  enemyAiMaskedRandomOrbChangeDefinition,
), true);
assert.equal(directMaskedRandomOrbChangeEngine.lastEnemySkill.selectionSeed, 6_018);
assert.equal(directMaskedRandomOrbChangeEngine.lastEnemySkill.changedOrbCount, 4);
assert.equal(directMaskedRandomOrbChangeEngine.rng.state, padLcgStep(21_900).state);
assert.equal(directMaskedRandomOrbChangeEngine.board[0][0].type, 'jammer');
assert.equal(directMaskedRandomOrbChangeEngine.board[4][3].type, 'poison');
assert.equal(directMaskedRandomOrbChangeEngine.board[4][4].type, 'poison');

const maskedRandomOrbChangeMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(maskedRandomOrbChangeMonsterDefinition.buffer).setUint32(0xec, 9_072, true);
const selectedMaskedRandomOrbChangeEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: maskedRandomOrbChangeMonsterDefinition,
    skillDefinitions: [enemyAiMaskedRandomOrbChangeDefinition],
  }],
});
selectedMaskedRandomOrbChangeEngine.setBoardFromCodes([
  'RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD',
]);
selectedMaskedRandomOrbChangeEngine.enemies[0].counter = 1;
selectedMaskedRandomOrbChangeEngine.enemies[1].counter = 99;
selectedMaskedRandomOrbChangeEngine.setRngState(21_900);
selectedMaskedRandomOrbChangeEngine.resolveEnemyTurn();
const selectedMaskedRandomOrbChangeState = selectedMaskedRandomOrbChangeEngine.snapshot();
assert.equal(selectedMaskedRandomOrbChangeState.lastEnemyActions[0].skill.type, 92);
assert.equal(selectedMaskedRandomOrbChangeState.lastEnemyActions[0].skill.selectionSeed, 58_043);
assert.equal(selectedMaskedRandomOrbChangeEngine.lastEnemySkill.changedOrbCount, 4);
assert.equal(selectedMaskedRandomOrbChangeState.player.hp, 12_000);
assert.equal(
  selectedMaskedRandomOrbChangeState.rngState,
  padLcgStep(padLcgStep(21_900).state).state,
);
assert.equal(selectedMaskedRandomOrbChangeEngine.board[4][1].type, 'poison');
assert.equal(selectedMaskedRandomOrbChangeEngine.board[4][2].type, 'poison');
assert.equal(selectedMaskedRandomOrbChangeEngine.board[4][5].type, 'jammer');

const rejectedMaskedRandomOrbChangeEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: maskedRandomOrbChangeMonsterDefinition,
    skillDefinitions: [enemyAiMaskedRandomOrbChangeDefinition],
  }],
});
rejectedMaskedRandomOrbChangeEngine.setBoardFromCodes(Array(5).fill('HHHHHH'));
rejectedMaskedRandomOrbChangeEngine.enemies[0].counter = 1;
rejectedMaskedRandomOrbChangeEngine.enemies[1].counter = 99;
rejectedMaskedRandomOrbChangeEngine.setRngState(21_900);
rejectedMaskedRandomOrbChangeEngine.resolveEnemyTurn();
const rejectedMaskedRandomOrbChangeState = rejectedMaskedRandomOrbChangeEngine.snapshot();
assert.equal(rejectedMaskedRandomOrbChangeState.lastEnemyActions[0].kind, 'attack');
assert.equal(rejectedMaskedRandomOrbChangeState.rngState, 21_900);
assert.equal(rejectedMaskedRandomOrbChangeState.player.hp, 10_150);

const directNativeNoEffectEngine = new PuzzleEngine({ seed: 21_900 });
const directNativeNoEffectBoard = directNativeNoEffectEngine.snapshot().board;
directNativeNoEffectEngine.setRngState(21_900);
assert.equal(directNativeNoEffectEngine.applyEnemySkillDefinition(
  enemyAiNativeNoEffectDefinition,
), true);
assert.equal(directNativeNoEffectEngine.lastEnemySkill.type, 93);
assert.equal(directNativeNoEffectEngine.rng.state, 21_900);
assert.deepEqual(directNativeNoEffectEngine.snapshot().board, directNativeNoEffectBoard);

const nativeNoEffectMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(nativeNoEffectMonsterDefinition.buffer).setUint32(0xec, 9_073, true);
const selectedNativeNoEffectEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: nativeNoEffectMonsterDefinition,
    skillDefinitions: [enemyAiNativeNoEffectDefinition],
  }],
});
selectedNativeNoEffectEngine.enemies[0].counter = 1;
selectedNativeNoEffectEngine.enemies[1].counter = 99;
selectedNativeNoEffectEngine.setRngState(21_900);
selectedNativeNoEffectEngine.resolveEnemyTurn();
const selectedNativeNoEffectState = selectedNativeNoEffectEngine.snapshot();
assert.equal(selectedNativeNoEffectState.lastEnemyActions[0].skill.type, 93);
assert.equal(selectedNativeNoEffectState.lastEnemyActions[0].damage, undefined);
assert.equal(selectedNativeNoEffectState.player.hp, 12_000);
assert.equal(selectedNativeNoEffectState.rngState, padLcgStep(21_900).state);
assert.equal(
  selectedNativeNoEffectState.message,
  'Verdant Shell takes no special action.',
);

const directLockRandomOrbsEngine = new PuzzleEngine({ seed: 21_900 });
directLockRandomOrbsEngine.setBoardFromCodes([
  'RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD',
]);
directLockRandomOrbsEngine.setOrbState(0, 1, { locked: true });
directLockRandomOrbsEngine.setRngState(21_900);
assert.equal(directLockRandomOrbsEngine.applyEnemySkillDefinition(
  enemyAiLockRandomOrbsDefinition,
), true);
assert.equal(directLockRandomOrbsEngine.lastEnemySkill.selectionSeed, 6_018);
assert.equal(directLockRandomOrbsEngine.lastEnemySkill.lockedOrbCount, 3);
assert.equal(directLockRandomOrbsEngine.rng.state, padLcgStep(21_900).state);
assert.equal(directLockRandomOrbsEngine.board[0].slice(0, 4).every((orb) => orb.locked), true);

const lockRandomOrbsMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(lockRandomOrbsMonsterDefinition.buffer).setUint32(0xec, 9_074, true);
const selectedLockRandomOrbsEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: lockRandomOrbsMonsterDefinition,
    skillDefinitions: [enemyAiLockRandomOrbsDefinition],
  }],
});
selectedLockRandomOrbsEngine.setBoardFromCodes([
  'RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD',
]);
selectedLockRandomOrbsEngine.setOrbState(0, 1, { locked: true });
selectedLockRandomOrbsEngine.enemies[0].counter = 1;
selectedLockRandomOrbsEngine.enemies[1].counter = 99;
selectedLockRandomOrbsEngine.setRngState(21_900);
selectedLockRandomOrbsEngine.resolveEnemyTurn();
const selectedLockRandomOrbsState = selectedLockRandomOrbsEngine.snapshot();
assert.equal(selectedLockRandomOrbsState.lastEnemyActions[0].skill.type, 94);
assert.equal(selectedLockRandomOrbsState.lastEnemyActions[0].skill.selectionSeed, 58_043);
assert.equal(selectedLockRandomOrbsEngine.lastEnemySkill.lockedOrbCount, 3);
assert.equal(selectedLockRandomOrbsState.player.hp, 12_000);
assert.equal(selectedLockRandomOrbsState.rngState, padLcgStep(padLcgStep(21_900).state).state);
assert.equal(selectedLockRandomOrbsEngine.board[0].slice(0, 4).every((orb) => orb.locked), true);

const rejectedLockRandomOrbsEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: lockRandomOrbsMonsterDefinition,
    skillDefinitions: [enemyAiLockRandomOrbsDefinition],
  }],
});
rejectedLockRandomOrbsEngine.setBoardFromCodes(Array(5).fill('GGGGGG'));
rejectedLockRandomOrbsEngine.enemies[0].counter = 1;
rejectedLockRandomOrbsEngine.enemies[1].counter = 99;
rejectedLockRandomOrbsEngine.setRngState(21_900);
rejectedLockRandomOrbsEngine.resolveEnemyTurn();
const rejectedLockRandomOrbsState = rejectedLockRandomOrbsEngine.snapshot();
assert.equal(rejectedLockRandomOrbsState.lastEnemyActions[0].kind, 'attack');
assert.equal(rejectedLockRandomOrbsState.rngState, 21_900);
assert.equal(rejectedLockRandomOrbsState.player.hp, 10_150);

const directEnemyEscapeEngine = new PuzzleEngine({ seed: 21_900 });
directEnemyEscapeEngine.setRngState(21_900);
assert.equal(directEnemyEscapeEngine.applyEnemySkillDefinition(
  enemyAiEnemyEscapeDefinition,
), true);
assert.equal(directEnemyEscapeEngine.enemies[0].hp, 0);
assert.equal(directEnemyEscapeEngine.enemies[0].escaped, true);
assert.equal(directEnemyEscapeEngine.enemies[0].deathResolved, true);
assert.equal(directEnemyEscapeEngine.rng.state, 21_900);

const enemyEscapeMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(enemyEscapeMonsterDefinition.buffer).setUint32(0xec, 9_075, true);
const selectedEnemyEscapeEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: enemyEscapeMonsterDefinition,
    skillDefinitions: [enemyAiEnemyEscapeDefinition],
  }],
});
selectedEnemyEscapeEngine.enemies[0].counter = 1;
selectedEnemyEscapeEngine.enemies[1].counter = 99;
selectedEnemyEscapeEngine.setRngState(21_900);
selectedEnemyEscapeEngine.resolveEnemyTurn();
const selectedEnemyEscapeState = selectedEnemyEscapeEngine.snapshot();
assert.equal(selectedEnemyEscapeState.lastEnemyActions[0].skill.type, 95);
assert.equal(selectedEnemyEscapeState.enemies[0].hp, 0);
assert.equal(selectedEnemyEscapeState.enemies[0].escaped, true);
assert.equal(selectedEnemyEscapeState.enemies[0].deathResolved, true);
assert.equal(selectedEnemyEscapeState.enemies[1].hp, 76_000);
assert.equal(selectedEnemyEscapeState.player.hp, 12_000);
assert.equal(selectedEnemyEscapeState.rngState, padLcgStep(21_900).state);
assert.equal(selectedEnemyEscapeState.message, 'Verdant Shell escaped.');

const lockedSkyfallMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(lockedSkyfallMonsterDefinition.buffer).setUint32(0xec, 9_076, true);
const selectedLockedSkyfallEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: lockedSkyfallMonsterDefinition,
    skillDefinitions: [enemyAiLockedSkyfallDefinition],
  }],
});
selectedLockedSkyfallEngine.enemies[0].counter = 1;
selectedLockedSkyfallEngine.enemies[1].counter = 99;
selectedLockedSkyfallEngine.setRngState(21_900);
selectedLockedSkyfallEngine.resolveEnemyTurn();
const selectedLockedSkyfallState = selectedLockedSkyfallEngine.snapshot();
assert.equal(selectedLockedSkyfallState.lastEnemyActions[0].skill.type, 96);
assert.equal(selectedLockedSkyfallState.lastEnemyActions[0].skill.durationTurns, 4);
assert.deepEqual(selectedLockedSkyfallState.lockFallRules, [{
  typeMask: 1,
  chancePercent: 100,
  turnsRemaining: 4,
  source: 'enemySkill',
}]);
assert.equal(selectedLockedSkyfallState.player.hp, 12_000);
assert.equal(selectedLockedSkyfallState.rngState, padLcgStep(padLcgStep(21_900).state).state);
selectedLockedSkyfallEngine.setBoardFromCodes(Array(5).fill('DDDDDD'));
selectedLockedSkyfallEngine.setTopLineDropTypes(Array(6).fill(0));
selectedLockedSkyfallEngine.board[0][0] = null;
selectedLockedSkyfallEngine.collapseAndRefill();
assert.equal(selectedLockedSkyfallEngine.board[0][0].type, 'fire');
assert.equal(selectedLockedSkyfallEngine.board[0][0].locked, true);
selectedLockedSkyfallEngine.advanceLockFallRules();
selectedLockedSkyfallEngine.advanceLockFallRules();
selectedLockedSkyfallEngine.advanceLockFallRules();
selectedLockedSkyfallEngine.advanceLockFallRules();
assert.deepEqual(selectedLockedSkyfallEngine.lockFallRules, []);
selectedLockedSkyfallEngine.applyEnemySkillDefinition(enemyAiLockedSkyfallDefinition);
assert.equal(selectedLockedSkyfallEngine.lockFallRules.length, 1);
selectedLockedSkyfallEngine.reset();
assert.deepEqual(selectedLockedSkyfallEngine.lockFallRules, []);

const rejectedLockedSkyfallEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: lockedSkyfallMonsterDefinition,
    skillDefinitions: [enemyAiLockedSkyfallDefinition],
  }],
});
rejectedLockedSkyfallEngine.setLockFallRules([{
  typeMask: 1,
  chancePercent: 50,
  turnsRemaining: 3,
  source: 'enemySkill',
}]);
rejectedLockedSkyfallEngine.enemies[0].counter = 1;
rejectedLockedSkyfallEngine.enemies[1].counter = 99;
rejectedLockedSkyfallEngine.setRngState(21_900);
rejectedLockedSkyfallEngine.resolveEnemyTurn();
const rejectedLockedSkyfallState = rejectedLockedSkyfallEngine.snapshot();
assert.equal(rejectedLockedSkyfallState.lastEnemyActions[0].kind, 'attack');
assert.equal(rejectedLockedSkyfallState.rngState, 21_900);
assert.equal(rejectedLockedSkyfallState.lockFallRules.length, 1);

const stickyBlindRandomMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(stickyBlindRandomMonsterDefinition.buffer).setUint32(0xec, 9_077, true);
const selectedStickyBlindRandomEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: stickyBlindRandomMonsterDefinition,
    skillDefinitions: [enemyAiStickyBlindRandomDefinition],
  }],
});
selectedStickyBlindRandomEngine.setBoardFromCodes([
  'RBRBHD', 'GLDHJG', 'HMGDGL', 'DLGHHJ', 'HJGGLD',
]);
selectedStickyBlindRandomEngine.enemies[0].counter = 1;
selectedStickyBlindRandomEngine.enemies[1].counter = 99;
selectedStickyBlindRandomEngine.setRngState(21_900);
selectedStickyBlindRandomEngine.resolveEnemyTurn();
const selectedStickyBlindRandomState = selectedStickyBlindRandomEngine.snapshot();
assert.equal(selectedStickyBlindRandomState.lastEnemyActions[0].skill.type, 97);
assert.equal(selectedStickyBlindRandomState.lastEnemyActions[0].skill.blindCount, 4);
assert.equal(selectedStickyBlindRandomState.lastEnemyActions[0].skill.selectionSeed, 29_441);
assert.equal(selectedStickyBlindRandomState.lastEnemySkill.blindedOrbCount, 4);
assert.equal(selectedStickyBlindRandomState.rngState, padLcgStep(
  padLcgStep(padLcgStep(21_900).state).state,
).state);
assert.deepEqual(selectedStickyBlindRandomState.boardState.flatMap((row, rowIndex) => (
  row.map((orb, columnIndex) => ({ orb, row: rowIndex, column: columnIndex }))
)).filter(({ orb }) => orb.blind).map(({ row, column }) => [row, column]), [
  [2, 5], [3, 4], [4, 0], [4, 2],
]);
assert.equal(selectedStickyBlindRandomState.boardState[2][5].blindCountdown, 3);
assert.equal(selectedStickyBlindRandomState.player.hp, 12_000);

const stickyBlindFixedMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(stickyBlindFixedMonsterDefinition.buffer).setUint32(0xec, 9_078, true);
const selectedStickyBlindFixedEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: stickyBlindFixedMonsterDefinition,
    skillDefinitions: [enemyAiStickyBlindFixedDefinition],
  }],
});
selectedStickyBlindFixedEngine.enemies[0].counter = 1;
selectedStickyBlindFixedEngine.enemies[1].counter = 99;
selectedStickyBlindFixedEngine.setRngState(21_900);
selectedStickyBlindFixedEngine.resolveEnemyTurn();
const selectedStickyBlindFixedState = selectedStickyBlindFixedEngine.snapshot();
assert.equal(selectedStickyBlindFixedState.lastEnemyActions[0].skill.type, 98);
assert.equal(selectedStickyBlindFixedState.lastEnemySkill.blindedOrbCount, 6);
assert.equal(selectedStickyBlindFixedState.rngState, padLcgStep(21_900).state);
assert.deepEqual(selectedStickyBlindFixedState.boardState.flatMap((row, rowIndex) => (
  row.map((orb, columnIndex) => ({ orb, row: rowIndex, column: columnIndex }))
)).filter(({ orb }) => orb.blind).map(({ row, column }) => [row, column]), [
  [0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [4, 5],
]);
assert.equal(selectedStickyBlindFixedState.boardState[4][5].blindCountdown, 2);
assert.equal(selectedStickyBlindFixedState.player.hp, 12_000);

const directOrbSealColumnsEngine = new PuzzleEngine({ seed: 21_900 });
directOrbSealColumnsEngine.setBoardFromCodes([
  'RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD',
]);
directOrbSealColumnsEngine.setRngState(21_900);
assert.equal(directOrbSealColumnsEngine.applyEnemySkillDefinition(
  enemyAiOrbSealColumnsDefinition,
), true);
assert.deepEqual(directOrbSealColumnsEngine.snapshot().orbSealColumns, {
  positionMask: 0b001010,
  turnsRemaining: 3,
});
assert.equal(directOrbSealColumnsEngine.rng.state, 21_900);
directOrbSealColumnsEngine.start();
assert.equal(directOrbSealColumnsEngine.startDrag(0, 1), false);
const orbSealBoardBeforeBlockedMove = directOrbSealColumnsEngine.snapshot().board;
assert.equal(directOrbSealColumnsEngine.startDrag(0, 0, 35, 447, 0.5, 0.5), true);
assert.equal(directOrbSealColumnsEngine.moveDrag(0, 2, 175, 447, 2.5, 0.5), false);
assert.equal(directOrbSealColumnsEngine.drag.column, 0);
assert.equal(directOrbSealColumnsEngine.drag.pathLength, 0);
assert.deepEqual(directOrbSealColumnsEngine.snapshot().board, orbSealBoardBeforeBlockedMove);
directOrbSealColumnsEngine.advanceOrbSealTurns();
directOrbSealColumnsEngine.advanceOrbSealTurns();
directOrbSealColumnsEngine.advanceOrbSealTurns();
assert.deepEqual(directOrbSealColumnsEngine.snapshot().orbSealColumns, {
  positionMask: 0,
  turnsRemaining: 0,
});
assert.equal(directOrbSealColumnsEngine.moveDrag(0, 2, 175, 447, 2.5, 0.5), true);
assert.equal(directOrbSealColumnsEngine.drag.column, 2);
assert.equal(directOrbSealColumnsEngine.drag.pathLength, 2);

const orbSealColumnsMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(orbSealColumnsMonsterDefinition.buffer).setUint32(0xec, 9_079, true);
const selectedOrbSealColumnsEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: orbSealColumnsMonsterDefinition,
    skillDefinitions: [enemyAiOrbSealColumnsDefinition],
  }],
});
selectedOrbSealColumnsEngine.enemies[0].counter = 1;
selectedOrbSealColumnsEngine.enemies[1].counter = 99;
selectedOrbSealColumnsEngine.setRngState(21_900);
selectedOrbSealColumnsEngine.resolveEnemyTurn();
const selectedOrbSealColumnsState = selectedOrbSealColumnsEngine.snapshot();
assert.equal(selectedOrbSealColumnsState.lastEnemyActions[0].skill.type, 99);
assert.deepEqual(selectedOrbSealColumnsState.orbSealColumns, {
  positionMask: 0b001010,
  turnsRemaining: 3,
});
assert.equal(selectedOrbSealColumnsState.rngState, padLcgStep(21_900).state);
assert.equal(selectedOrbSealColumnsState.player.hp, 12_000);
assert.equal(selectedOrbSealColumnsState.message, '2 columns sealed for 3 turns.');

const rejectedOrbSealColumnsEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: orbSealColumnsMonsterDefinition,
    skillDefinitions: [enemyAiOrbSealColumnsDefinition],
  }],
});
rejectedOrbSealColumnsEngine.orbSealColumnMask = 1;
rejectedOrbSealColumnsEngine.orbSealColumnTurns = 2;
rejectedOrbSealColumnsEngine.enemies[0].counter = 1;
rejectedOrbSealColumnsEngine.enemies[1].counter = 99;
rejectedOrbSealColumnsEngine.setRngState(21_900);
rejectedOrbSealColumnsEngine.resolveEnemyTurn();
const rejectedOrbSealColumnsState = rejectedOrbSealColumnsEngine.snapshot();
assert.equal(rejectedOrbSealColumnsState.lastEnemyActions[0].kind, 'attack');
assert.equal(rejectedOrbSealColumnsState.rngState, 21_900);
assert.deepEqual(rejectedOrbSealColumnsState.orbSealColumns, {
  positionMask: 1,
  turnsRemaining: 1,
});

const directOrbSealRowsEngine = new PuzzleEngine({ seed: 21_900 });
directOrbSealRowsEngine.setBoardFromCodes([
  'RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD',
]);
directOrbSealRowsEngine.setRngState(21_900);
assert.equal(directOrbSealRowsEngine.applyEnemySkillDefinition(
  enemyAiOrbSealRowsDefinition,
), true);
assert.deepEqual(directOrbSealRowsEngine.snapshot().orbSealRows, {
  positionMask: 0b01010,
  turnsRemaining: 2,
});
assert.equal(directOrbSealRowsEngine.rng.state, 21_900);
directOrbSealRowsEngine.start();
assert.equal(directOrbSealRowsEngine.startDrag(1, 0), false);
const orbSealRowBoardBeforeBlockedMove = directOrbSealRowsEngine.snapshot().board;
assert.equal(directOrbSealRowsEngine.startDrag(0, 0, 35, 447, 0.5, 0.5), true);
assert.equal(directOrbSealRowsEngine.moveDrag(2, 0, 35, 587, 0.5, 2.5), false);
assert.equal(directOrbSealRowsEngine.drag.row, 0);
assert.equal(directOrbSealRowsEngine.drag.pathLength, 0);
assert.deepEqual(directOrbSealRowsEngine.snapshot().board, orbSealRowBoardBeforeBlockedMove);
directOrbSealRowsEngine.advanceOrbSealTurns();
directOrbSealRowsEngine.advanceOrbSealTurns();
assert.deepEqual(directOrbSealRowsEngine.snapshot().orbSealRows, {
  positionMask: 0,
  turnsRemaining: 0,
});
assert.equal(directOrbSealRowsEngine.moveDrag(2, 0, 35, 587, 0.5, 2.5), true);
assert.equal(directOrbSealRowsEngine.drag.row, 2);
assert.equal(directOrbSealRowsEngine.drag.pathLength, 2);

const orbSealRowsMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(orbSealRowsMonsterDefinition.buffer).setUint32(0xec, 9_080, true);
const selectedOrbSealRowsEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: orbSealRowsMonsterDefinition,
    skillDefinitions: [enemyAiOrbSealRowsDefinition],
  }],
});
selectedOrbSealRowsEngine.enemies[0].counter = 1;
selectedOrbSealRowsEngine.enemies[1].counter = 99;
selectedOrbSealRowsEngine.setRngState(21_900);
selectedOrbSealRowsEngine.resolveEnemyTurn();
const selectedOrbSealRowsState = selectedOrbSealRowsEngine.snapshot();
assert.equal(selectedOrbSealRowsState.lastEnemyActions[0].skill.type, 100);
assert.deepEqual(selectedOrbSealRowsState.orbSealRows, {
  positionMask: 0b01010,
  turnsRemaining: 2,
});
assert.equal(selectedOrbSealRowsState.rngState, padLcgStep(21_900).state);
assert.equal(selectedOrbSealRowsState.player.hp, 12_000);
assert.equal(selectedOrbSealRowsState.message, '2 rows sealed for 2 turns.');

const rejectedOrbSealRowsEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: orbSealRowsMonsterDefinition,
    skillDefinitions: [enemyAiOrbSealRowsDefinition],
  }],
});
rejectedOrbSealRowsEngine.orbSealColumnMask = 1;
rejectedOrbSealRowsEngine.orbSealColumnTurns = 2;
rejectedOrbSealRowsEngine.enemies[0].counter = 1;
rejectedOrbSealRowsEngine.enemies[1].counter = 99;
rejectedOrbSealRowsEngine.setRngState(21_900);
rejectedOrbSealRowsEngine.resolveEnemyTurn();
const rejectedOrbSealRowsState = rejectedOrbSealRowsEngine.snapshot();
assert.equal(rejectedOrbSealRowsState.lastEnemyActions[0].kind, 'attack');
assert.equal(rejectedOrbSealRowsState.rngState, 21_900);
assert.deepEqual(rejectedOrbSealRowsState.orbSealColumns, {
  positionMask: 1,
  turnsRemaining: 1,
});
assert.deepEqual(rejectedOrbSealRowsState.orbSealRows, {
  positionMask: 0,
  turnsRemaining: 0,
});

const directFixedStartEngine = new PuzzleEngine({ seed: 21_900 });
directFixedStartEngine.orbSealRowMask = 0b01010;
directFixedStartEngine.orbSealRowTurns = 2;
directFixedStartEngine.setRngState(21_900);
assert.equal(directFixedStartEngine.applyEnemySkillDefinition(
  enemyAiFixedStartDefinition,
), true);
assert.deepEqual(directFixedStartEngine.snapshot().forcedStart, { row: 0, column: 5 });
assert.equal(directFixedStartEngine.rng.state, padLcgStep(padLcgStep(21_900).state).state);
directFixedStartEngine.start();
assert.equal(directFixedStartEngine.startDrag(0, 4), false);
assert.equal(directFixedStartEngine.startDrag(0, 5), true);
assert.equal(directFixedStartEngine.endDrag(), true);
assert.equal(directFixedStartEngine.snapshot().forcedStart, null);

const fixedCoordinateStartDefinition = enemyAiFixedStartDefinition.slice();
const fixedCoordinateStartView = new DataView(fixedCoordinateStartDefinition.buffer);
fixedCoordinateStartView.setInt32(0x10, 0, true);
fixedCoordinateStartView.setInt32(0x14, 3, true);
fixedCoordinateStartView.setInt32(0x18, 2, true);
const fixedCoordinateStartEngine = new PuzzleEngine({ seed: 21_900 });
fixedCoordinateStartEngine.setRngState(21_900);
assert.equal(fixedCoordinateStartEngine.applyEnemySkillDefinition(
  fixedCoordinateStartDefinition,
), true);
assert.deepEqual(fixedCoordinateStartEngine.snapshot().forcedStart, { row: 3, column: 2 });
assert.equal(fixedCoordinateStartEngine.rng.state, 21_900);

const fixedStartMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(fixedStartMonsterDefinition.buffer).setUint32(0xec, 9_081, true);
const selectedFixedStartEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: fixedStartMonsterDefinition,
    skillDefinitions: [enemyAiFixedStartDefinition],
  }],
});
selectedFixedStartEngine.enemies[0].counter = 1;
selectedFixedStartEngine.enemies[1].counter = 99;
selectedFixedStartEngine.setRngState(21_900);
selectedFixedStartEngine.resolveEnemyTurn();
const selectedFixedStartState = selectedFixedStartEngine.snapshot();
assert.equal(selectedFixedStartState.lastEnemyActions[0].skill.type, 101);
assert.deepEqual(selectedFixedStartState.forcedStart, { row: 2, column: 5 });
assert.equal(selectedFixedStartState.rngState, padLcgStep(
  padLcgStep(padLcgStep(21_900).state).state,
).state);
assert.equal(selectedFixedStartState.player.hp, 12_000);
assert.equal(selectedFixedStartState.message, 'Your next move must start at row 3, column 6.');

const rejectedFixedStartEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: fixedStartMonsterDefinition,
    skillDefinitions: [enemyAiFixedStartDefinition],
  }],
});
rejectedFixedStartEngine.forcedStart = { row: 0, column: 0 };
rejectedFixedStartEngine.enemies[0].counter = 1;
rejectedFixedStartEngine.enemies[1].counter = 99;
rejectedFixedStartEngine.setRngState(21_900);
rejectedFixedStartEngine.resolveEnemyTurn();
const rejectedFixedStartState = rejectedFixedStartEngine.snapshot();
assert.equal(rejectedFixedStartState.lastEnemyActions[0].kind, 'attack');
assert.equal(rejectedFixedStartState.rngState, 21_900);
assert.deepEqual(rejectedFixedStartState.forcedStart, { row: 0, column: 0 });

const directRandomBombsEngine = new PuzzleEngine({ seed: 21_900 });
directRandomBombsEngine.setBoardFromCodes([
  'RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD',
]);
directRandomBombsEngine.board[3][4].locked = true;
directRandomBombsEngine.board[3][4].blockFlags |= 0x800;
const preservedLockedOrbType = directRandomBombsEngine.board[3][4].type;
directRandomBombsEngine.setRngState(21_900);
assert.equal(directRandomBombsEngine.applyEnemySkillDefinition(
  enemyAiRandomBombsDefinition,
), true);
assert.equal(directRandomBombsEngine.lastEnemySkill.selectionSeed, 6_018);
assert.equal(directRandomBombsEngine.lastEnemySkill.changedOrbCount, 3);
assert.equal(directRandomBombsEngine.rng.state, 394_448_415);
assert.equal(directRandomBombsEngine.board[3][4].type, preservedLockedOrbType);
assert.deepEqual(
  directRandomBombsEngine.board.flatMap((row, rowIndex) => row.flatMap(
    (orb, columnIndex) => orb.type === 'bomb' ? [{ row: rowIndex, column: columnIndex }] : [],
  )),
  [{ row: 0, column: 5 }, { row: 2, column: 3 }, { row: 4, column: 2 }],
);
assert.equal(
  directRandomBombsEngine.board.flat().filter((orb) => orb.type === 'bomb').every(
    (orb) => orb.locked && (orb.blockFlags & 0x800) !== 0,
  ),
  true,
);
assert.equal(directRandomBombsEngine.snapshot().message, '3 locked bombs appeared.');

const unlockedRandomBombsDefinition = enemyAiRandomBombsDefinition.slice();
new DataView(unlockedRandomBombsDefinition.buffer).setInt32(0x2c, 0, true);
const unlockedRandomBombsEngine = new PuzzleEngine({ seed: 21_900 });
unlockedRandomBombsEngine.setRngState(21_900);
assert.equal(unlockedRandomBombsEngine.applyEnemySkillDefinition(
  unlockedRandomBombsDefinition,
), true);
assert.equal(
  unlockedRandomBombsEngine.board.flat().filter((orb) => orb.type === 'bomb').every(
    (orb) => !orb.locked && (orb.blockFlags & 0x800) === 0,
  ),
  true,
);

const randomBombsMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(randomBombsMonsterDefinition.buffer).setUint32(0xec, 9_082, true);
const selectedRandomBombsEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: randomBombsMonsterDefinition,
    skillDefinitions: [enemyAiRandomBombsDefinition],
  }],
});
selectedRandomBombsEngine.enemies[0].counter = 1;
selectedRandomBombsEngine.enemies[1].counter = 99;
selectedRandomBombsEngine.setRngState(21_900);
selectedRandomBombsEngine.resolveEnemyTurn();
const selectedRandomBombsState = selectedRandomBombsEngine.snapshot();
assert.equal(selectedRandomBombsState.lastEnemyActions[0].skill.type, 102);
assert.equal(selectedRandomBombsState.lastEnemyActions[0].skill.selectionSeed, 58_043);
assert.equal(selectedRandomBombsEngine.lastEnemySkill.changedOrbCount, 4);
assert.equal(selectedRandomBombsState.rngState, 3_803_934_822);
assert.deepEqual(
  selectedRandomBombsEngine.board.flatMap((row, rowIndex) => row.flatMap(
    (orb, columnIndex) => orb.type === 'bomb' ? [{ row: rowIndex, column: columnIndex }] : [],
  )),
  [{ row: 1, column: 5 }, { row: 2, column: 2 }, { row: 2, column: 3 }, { row: 3, column: 3 }],
);
assert.equal(selectedRandomBombsState.player.hp, 12_000);
assert.equal(selectedRandomBombsState.message, '4 locked bombs appeared.');

const directFixedBombsEngine = new PuzzleEngine({ seed: 21_900 });
directFixedBombsEngine.setBoardFromCodes([
  'RBGHLD', 'GLDBHR', 'BHRDGL', 'DLGRHB', 'HRBGLD',
]);
directFixedBombsEngine.board[2][2].locked = true;
directFixedBombsEngine.board[2][2].blockFlags |= 0x800;
const fixedBombsPreservedType = directFixedBombsEngine.board[2][2].type;
directFixedBombsEngine.setRngState(21_900);
assert.equal(directFixedBombsEngine.applyEnemySkillDefinition(
  enemyAiFixedBombsDefinition,
), true);
assert.equal(directFixedBombsEngine.lastEnemySkill.changedOrbCount, 5);
assert.equal(directFixedBombsEngine.rng.state, 21_900);
assert.equal(directFixedBombsEngine.board[2][2].type, fixedBombsPreservedType);
assert.deepEqual(
  directFixedBombsEngine.board.flatMap((row, rowIndex) => row.flatMap(
    (orb, columnIndex) => orb.type === 'bomb' ? [{ row: rowIndex, column: columnIndex }] : [],
  )),
  [
    { row: 0, column: 4 }, { row: 0, column: 5 }, { row: 1, column: 3 },
    { row: 3, column: 1 }, { row: 4, column: 0 },
  ],
);
assert.equal(
  directFixedBombsEngine.board.flat().filter((orb) => orb.type === 'bomb').every(
    (orb) => orb.locked && (orb.blockFlags & 0x800) !== 0,
  ),
  true,
);
assert.equal(directFixedBombsEngine.snapshot().message, '5 locked bombs appeared.');

const fixedBombsMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(fixedBombsMonsterDefinition.buffer).setUint32(0xec, 9_083, true);
const selectedFixedBombsEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: fixedBombsMonsterDefinition,
    skillDefinitions: [enemyAiFixedBombsDefinition],
  }],
});
selectedFixedBombsEngine.enemies[0].counter = 1;
selectedFixedBombsEngine.enemies[1].counter = 99;
selectedFixedBombsEngine.setRngState(21_900);
selectedFixedBombsEngine.resolveEnemyTurn();
const selectedFixedBombsState = selectedFixedBombsEngine.snapshot();
assert.equal(selectedFixedBombsState.lastEnemyActions[0].skill.type, 103);
assert.deepEqual(selectedFixedBombsState.lastEnemyActions[0].skill.rowMasks, [48, 8, 4, 2, 1]);
assert.equal(selectedFixedBombsEngine.lastEnemySkill.changedOrbCount, 6);
assert.equal(selectedFixedBombsState.rngState, 394_448_415);
assert.deepEqual(
  selectedFixedBombsEngine.board.flatMap((row, rowIndex) => row.flatMap(
    (orb, columnIndex) => orb.type === 'bomb' ? [{ row: rowIndex, column: columnIndex }] : [],
  )),
  [
    { row: 0, column: 4 }, { row: 0, column: 5 }, { row: 1, column: 3 },
    { row: 2, column: 2 }, { row: 3, column: 1 }, { row: 4, column: 0 },
  ],
);
assert.equal(selectedFixedBombsState.player.hp, 12_000);
assert.equal(selectedFixedBombsState.message, '6 locked bombs appeared.');

const directCloudEngine = new PuzzleEngine({ seed: 21_900 });
directCloudEngine.setRngState(21_900);
assert.equal(directCloudEngine.applyEnemySkillDefinition(enemyAiCloudDefinition), true);
assert.deepEqual(directCloudEngine.snapshot().cloud, {
  row: 0,
  column: 0,
  heightRows: 2,
  widthColumns: 3,
  turnsRemaining: 3,
});
assert.equal(directCloudEngine.rng.state, 3_803_934_822);
directCloudEngine.start();
assert.equal(directCloudEngine.startDrag(0, 0), true);
assert.equal(directCloudEngine.snapshot().drag.row, 0);
directCloudEngine.drag = null;
directCloudEngine.advanceCloudTurns();
directCloudEngine.advanceCloudTurns();
assert.equal(directCloudEngine.snapshot().cloud.turnsRemaining, 1);
directCloudEngine.advanceCloudTurns();
assert.equal(directCloudEngine.snapshot().cloud, null);

const fixedCloudDefinition = enemyAiCloudDefinition.slice();
const fixedCloudView = new DataView(fixedCloudDefinition.buffer);
fixedCloudView.setInt32(0x1c, 2, true);
fixedCloudView.setInt32(0x20, 2, true);
const fixedCloudEngine = new PuzzleEngine({ seed: 21_900 });
fixedCloudEngine.setRngState(21_900);
assert.equal(fixedCloudEngine.applyEnemySkillDefinition(fixedCloudDefinition), true);
assert.deepEqual(fixedCloudEngine.snapshot().cloud, {
  row: 1,
  column: 2,
  heightRows: 2,
  widthColumns: 3,
  turnsRemaining: 3,
});
assert.equal(fixedCloudEngine.rng.state, 21_900);

const cloudMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(cloudMonsterDefinition.buffer).setUint32(0xec, 9_084, true);
const selectedCloudEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: cloudMonsterDefinition,
    skillDefinitions: [enemyAiCloudDefinition],
  }],
});
selectedCloudEngine.enemies[0].counter = 1;
selectedCloudEngine.enemies[1].counter = 99;
selectedCloudEngine.setRngState(21_900);
selectedCloudEngine.resolveEnemyTurn();
const selectedCloudState = selectedCloudEngine.snapshot();
assert.equal(selectedCloudState.lastEnemyActions[0].skill.type, 104);
assert.deepEqual(selectedCloudState.cloud, {
  row: 3,
  column: 2,
  heightRows: 2,
  widthColumns: 3,
  turnsRemaining: 3,
});
assert.equal(selectedCloudState.rngState, 1_929_471_377);
assert.equal(selectedCloudState.player.hp, 12_000);
assert.equal(selectedCloudState.message, 'Clouds obscured a 3 × 2 area for 3 turns.');

const rejectedCloudEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: cloudMonsterDefinition,
    skillDefinitions: [enemyAiCloudDefinition],
  }],
});
rejectedCloudEngine.cloud = {
  row: 0, column: 0, heightRows: 1, widthColumns: 1, turnsRemaining: 2,
};
rejectedCloudEngine.enemies[0].counter = 1;
rejectedCloudEngine.enemies[1].counter = 99;
rejectedCloudEngine.setRngState(21_900);
rejectedCloudEngine.resolveEnemyTurn();
const rejectedCloudState = rejectedCloudEngine.snapshot();
assert.equal(rejectedCloudState.lastEnemyActions[0].kind, 'attack');
assert.equal(rejectedCloudState.rngState, 21_900);
assert.equal(rejectedCloudState.cloud.turnsRemaining, 1);

const directRecoveryDebuffEngine = new PuzzleEngine({ seed: 21_900 });
directRecoveryDebuffEngine.setRngState(21_900);
assert.equal(directRecoveryDebuffEngine.applyEnemySkillDefinition(
  enemyAiRecoveryDebuffDefinition,
), true);
assert.deepEqual(directRecoveryDebuffEngine.snapshot().recoveryDebuff, {
  turnsRemaining: 3,
  recoveryPercent: 50,
  multiplier: 0.5,
});
assert.equal(directRecoveryDebuffEngine.rng.state, 21_900);
directRecoveryDebuffEngine.player.hp = 1_000;
directRecoveryDebuffEngine.comboCount = 1;
directRecoveryDebuffEngine.turnMatches = [{ type: 'heart', size: 3, enhancedCount: 0 }];
directRecoveryDebuffEngine.enemies.forEach((enemy) => { enemy.hp = 0; });
directRecoveryDebuffEngine.resolvePlayerTurn();
assert.equal(directRecoveryDebuffEngine.lastHealing, 410);
assert.equal(directRecoveryDebuffEngine.player.hp, 1_410);
directRecoveryDebuffEngine.advanceRecoveryDebuffTurns();
directRecoveryDebuffEngine.advanceRecoveryDebuffTurns();
assert.equal(directRecoveryDebuffEngine.snapshot().recoveryDebuff.turnsRemaining, 1);
directRecoveryDebuffEngine.advanceRecoveryDebuffTurns();
assert.equal(directRecoveryDebuffEngine.snapshot().recoveryDebuff, null);

const recoveryDebuffMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(recoveryDebuffMonsterDefinition.buffer).setUint32(0xec, 9_085, true);
const selectedRecoveryDebuffEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: recoveryDebuffMonsterDefinition,
    skillDefinitions: [enemyAiRecoveryDebuffDefinition],
  }],
});
selectedRecoveryDebuffEngine.enemies[0].counter = 1;
selectedRecoveryDebuffEngine.enemies[1].counter = 99;
selectedRecoveryDebuffEngine.setRngState(21_900);
selectedRecoveryDebuffEngine.resolveEnemyTurn();
const selectedRecoveryDebuffState = selectedRecoveryDebuffEngine.snapshot();
assert.equal(selectedRecoveryDebuffState.lastEnemyActions[0].skill.type, 105);
assert.deepEqual(selectedRecoveryDebuffState.recoveryDebuff, {
  turnsRemaining: 3,
  recoveryPercent: 50,
  multiplier: 0.5,
});
assert.equal(selectedRecoveryDebuffState.rngState, 394_448_415);
assert.equal(selectedRecoveryDebuffState.player.hp, 12_000);
assert.equal(selectedRecoveryDebuffState.message, 'Recovery changed to 50% for 3 turns.');

const rejectedRecoveryDebuffEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: recoveryDebuffMonsterDefinition,
    skillDefinitions: [enemyAiRecoveryDebuffDefinition],
  }],
});
rejectedRecoveryDebuffEngine.recoveryDebuff = {
  turnsRemaining: 2, recoveryPercent: 50, multiplier: 0.5,
};
rejectedRecoveryDebuffEngine.enemies[0].counter = 1;
rejectedRecoveryDebuffEngine.enemies[1].counter = 99;
rejectedRecoveryDebuffEngine.setRngState(21_900);
rejectedRecoveryDebuffEngine.resolveEnemyTurn();
const rejectedRecoveryDebuffState = rejectedRecoveryDebuffEngine.snapshot();
assert.equal(rejectedRecoveryDebuffState.lastEnemyActions[0].kind, 'attack');
assert.equal(rejectedRecoveryDebuffState.rngState, 21_900);
assert.equal(rejectedRecoveryDebuffState.recoveryDebuff.turnsRemaining, 1);

assert.equal(new PuzzleEngine({ seed: 21_900 }).applyEnemySkillDefinition(
  enemyAiTurnChangeDefinition,
), false);
assert.throws(
  () => new PuzzleEngine({ enemySkillQueues: [[enemyAiTurnChangeDefinition]] }),
  /passive enemy skills must be installed through monster skill slots/,
);
const turnChangeMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(turnChangeMonsterDefinition.buffer).setUint32(0xec, 9_086, true);
const turnChangeEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: turnChangeMonsterDefinition,
    skillDefinitions: [enemyAiTurnChangeDefinition],
  }],
});
turnChangeEngine.enemies[0].hp = 48_000;
turnChangeEngine.enemies[1].hp = 0;
turnChangeEngine.party.forEach((member, index) => {
  member.bindTurns = index === 0 ? 0 : 1;
});
turnChangeEngine.comboCount = 1;
turnChangeEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
turnChangeEngine.setRngState(21_900);
turnChangeEngine.resolvePlayerTurn();
const triggeredTurnChangeState = turnChangeEngine.snapshot();
assert.equal(triggeredTurnChangeState.lastDamage, 1_660);
assert.equal(triggeredTurnChangeState.enemies[0].hp, 46_340);
assert.equal(triggeredTurnChangeState.enemies[0].baseMaxCounter, 2);
assert.equal(triggeredTurnChangeState.enemies[0].maxCounter, 1);
assert.equal(triggeredTurnChangeState.enemies[0].counter, 1);
assert.equal(triggeredTurnChangeState.enemies[0].turnChangeThresholdPercent, 50);
assert.equal(triggeredTurnChangeState.enemies[0].turnChangeCounter, 1);
assert.equal(triggeredTurnChangeState.enemies[0].turnChangeActive, true);
assert.equal(triggeredTurnChangeState.rngState, 21_900);
turnChangeEngine.enemies[0].hp = turnChangeEngine.enemies[0].maxHp;
assert.equal(turnChangeEngine.updateEnemyTurnChangePassive(turnChangeEngine.enemies[0]), false);
assert.equal(turnChangeEngine.enemies[0].turnChangeActive, true);
turnChangeEngine.resolveEnemyTurn();
const activeTurnChangeState = turnChangeEngine.snapshot();
assert.equal(activeTurnChangeState.lastEnemyActions[0].kind, 'attack');
assert.equal(activeTurnChangeState.lastEnemyActions[0].damage, 1_850);
assert.equal(activeTurnChangeState.enemies[0].counter, 1);
assert.equal(activeTurnChangeState.enemies[0].turnChangeActive, true);
assert.equal(activeTurnChangeState.rngState, 21_900);

const remainingEnemiesTurnChangeEngineDefinition =
  enemyAiRemainingEnemiesTurnChangeDefinition.slice();
new DataView(remainingEnemiesTurnChangeEngineDefinition.buffer).setInt16(0x14, 1, true);
const remainingEnemiesTurnChangeMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(remainingEnemiesTurnChangeMonsterDefinition.buffer).setUint32(0xec, 9_122, true);
const remainingEnemiesTurnChangeEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: remainingEnemiesTurnChangeMonsterDefinition,
    skillDefinitions: [remainingEnemiesTurnChangeEngineDefinition],
  }],
});
assert.equal(
  remainingEnemiesTurnChangeEngine.enemies[0].remainingEnemiesTurnChangeThreshold,
  1,
);
assert.equal(remainingEnemiesTurnChangeEngine.enemies[0].remainingEnemiesTurnChangeCounter, 1);
assert.equal(remainingEnemiesTurnChangeEngine.enemies[0].remainingEnemiesTurnChangeActive, false);
remainingEnemiesTurnChangeEngine.enemies[1].hp = 0;
remainingEnemiesTurnChangeEngine.party.forEach((member, index) => {
  member.bindTurns = index === 0 ? 0 : 1;
});
remainingEnemiesTurnChangeEngine.comboCount = 1;
remainingEnemiesTurnChangeEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
remainingEnemiesTurnChangeEngine.setRngState(21_900);
remainingEnemiesTurnChangeEngine.resolvePlayerTurn();
const triggeredRemainingEnemiesTurnChangeState = remainingEnemiesTurnChangeEngine.snapshot();
assert.equal(triggeredRemainingEnemiesTurnChangeState.lastDamage, 1_660);
assert.equal(triggeredRemainingEnemiesTurnChangeState.enemies[0].hp, 90_340);
assert.equal(
  triggeredRemainingEnemiesTurnChangeState.enemies[0].remainingEnemiesTurnChangeActive,
  true,
);
assert.equal(triggeredRemainingEnemiesTurnChangeState.enemies[0].turnChangeActive, true);
assert.equal(triggeredRemainingEnemiesTurnChangeState.enemies[0].maxCounter, 1);
assert.equal(triggeredRemainingEnemiesTurnChangeState.enemies[0].counter, 1);
assert.equal(triggeredRemainingEnemiesTurnChangeState.enemies[0].remainingEnemiesTurnChangeSkillId, 9_122);
assert.equal(triggeredRemainingEnemiesTurnChangeState.rngState, 21_900);
remainingEnemiesTurnChangeEngine.enemies[0].remainingEnemiesTurnChangeThreshold = 2;
assert.equal(
  remainingEnemiesTurnChangeEngine.updateEnemyRemainingEnemiesTurnChangePassive(
    remainingEnemiesTurnChangeEngine.enemies[0],
  ),
  false,
);
const shieldedRemainingEnemiesTurnChangeEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: remainingEnemiesTurnChangeMonsterDefinition,
    skillDefinitions: [remainingEnemiesTurnChangeEngineDefinition],
  }],
});
shieldedRemainingEnemiesTurnChangeEngine.enemies[1].hp = 0;
shieldedRemainingEnemiesTurnChangeEngine.enemies[0].statusShieldTurns = 2;
assert.equal(
  shieldedRemainingEnemiesTurnChangeEngine.updateEnemyRemainingEnemiesTurnChangePassive(
    shieldedRemainingEnemiesTurnChangeEngine.enemies[0],
  ),
  false,
);
assert.equal(
  shieldedRemainingEnemiesTurnChangeEngine.enemies[0].remainingEnemiesTurnChangeActive,
  false,
);
remainingEnemiesTurnChangeEngine.setEnemyAiDefinitionPool(0, null, []);
assert.equal(remainingEnemiesTurnChangeEngine.enemies[0].remainingEnemiesTurnChangeThreshold, 0);
assert.equal(remainingEnemiesTurnChangeEngine.enemies[0].remainingEnemiesTurnChangeActive, false);

const directAttributeBlockEngine = new PuzzleEngine({ seed: 21_900 });
directAttributeBlockEngine.setRngState(21_900);
assert.equal(directAttributeBlockEngine.applyEnemySkillDefinition(
  enemyAiAttributeBlockDefinition,
), true);
assert.deepEqual(directAttributeBlockEngine.snapshot().attributeBlock, {
  turnsRemaining: 3,
  typeMask: 0x11,
});
assert.equal(directAttributeBlockEngine.rng.state, 21_900);
directAttributeBlockEngine.setBoardFromCodes([
  'RRRBGH',
  'BBBLDH',
  'GLDHBR',
  'LDHBRG',
  'DHBRGL',
]);
const attributeBlockMatches = directAttributeBlockEngine.findMatches();
assert.equal(attributeBlockMatches.length, 1);
assert.equal(attributeBlockMatches[0].type, 'water');
assert.equal(directAttributeBlockEngine.isOrbTypeBlocked('fire'), true);
assert.equal(directAttributeBlockEngine.isOrbTypeBlocked('dark'), true);
assert.equal(directAttributeBlockEngine.isOrbTypeBlocked('water'), false);
directAttributeBlockEngine.advanceAttributeBlockTurns();
directAttributeBlockEngine.advanceAttributeBlockTurns();
assert.equal(directAttributeBlockEngine.snapshot().attributeBlock.turnsRemaining, 1);
directAttributeBlockEngine.advanceAttributeBlockTurns();
assert.equal(directAttributeBlockEngine.snapshot().attributeBlock, null);

const blockedBombEngine = new PuzzleEngine({ seed: 21_900 });
blockedBombEngine.setBoardFromCodes([
  'RBGHLD',
  'GLDBHR',
  'BHXDGL',
  'DLGRHB',
  'HRBGLD',
]);
assert.equal(blockedBombEngine.applyEnemySkillRecord({
  type: PAD_ENEMY_SKILL_ATTRIBUTE_BLOCK,
  kind: 'attributeBlock',
  supported: true,
  durationTurns: 2,
  typeMask: 1 << 9,
  attackWithSkillValue: 0,
}), true);
blockedBombEngine.start();
blockedBombEngine.phase = 'detect';
blockedBombEngine.phaseTimer = 0;
blockedBombEngine.advancePhase();
assert.equal(blockedBombEngine.lastBombDamage, 0);
assert.equal(blockedBombEngine.pendingBombCells.length, 0);

const attributeBlockMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(attributeBlockMonsterDefinition.buffer).setUint32(0xec, 9_087, true);
const selectedAttributeBlockEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: attributeBlockMonsterDefinition,
    skillDefinitions: [enemyAiAttributeBlockDefinition],
  }],
});
selectedAttributeBlockEngine.enemies[0].counter = 1;
selectedAttributeBlockEngine.enemies[1].counter = 99;
selectedAttributeBlockEngine.setRngState(21_900);
selectedAttributeBlockEngine.resolveEnemyTurn();
const selectedAttributeBlockState = selectedAttributeBlockEngine.snapshot();
assert.equal(selectedAttributeBlockState.lastEnemyActions[0].skill.type, 107);
assert.deepEqual(selectedAttributeBlockState.attributeBlock, {
  turnsRemaining: 3,
  typeMask: 0x11,
});
assert.equal(selectedAttributeBlockState.rngState, 394_448_415);
assert.equal(selectedAttributeBlockState.player.hp, 12_000);
assert.equal(
  selectedAttributeBlockState.message,
  'Fire, Dark cannot be matched for 3 turns.',
);

const rejectedAttributeBlockEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: attributeBlockMonsterDefinition,
    skillDefinitions: [enemyAiAttributeBlockDefinition],
  }],
});
rejectedAttributeBlockEngine.attributeBlock = { turnsRemaining: 2, typeMask: 0x02 };
rejectedAttributeBlockEngine.enemies[0].counter = 1;
rejectedAttributeBlockEngine.enemies[1].counter = 99;
rejectedAttributeBlockEngine.setRngState(21_900);
rejectedAttributeBlockEngine.resolveEnemyTurn();
const rejectedAttributeBlockState = rejectedAttributeBlockEngine.snapshot();
assert.equal(rejectedAttributeBlockState.lastEnemyActions[0].kind, 'attack');
assert.equal(rejectedAttributeBlockState.rngState, 21_900);
assert.deepEqual(rejectedAttributeBlockState.attributeBlock, {
  turnsRemaining: 1,
  typeMask: 0x02,
});

const attackOrbChangeBoard = [
  'RRRBGH',
  'BGLDHR',
  'GLDHBR',
  'LDHBRG',
  'DHBRGL',
];
const directOrbChangeAttackEngine = new PuzzleEngine({ seed: 21_900 });
directOrbChangeAttackEngine.setBoardFromCodes(attackOrbChangeBoard);
directOrbChangeAttackEngine.setRngState(21_900);
assert.equal(directOrbChangeAttackEngine.applyEnemySkillDefinition(
  enemyAiOrbChangeAttackDefinition,
), true);
const directOrbChangeAttackState = directOrbChangeAttackEngine.snapshot();
assert.deepEqual(directOrbChangeAttackState.board, [
  'RRRGGH',
  'GGLDHR',
  'GLDHGR',
  'LDHGRG',
  'DHGRGL',
]);
assert.equal(directOrbChangeAttackState.lastEnemySkill.changedOrbCount, 5);
assert.equal(directOrbChangeAttackState.lastEnemySkill.effectFlags, 1);
assert.equal(directOrbChangeAttackState.rngState, 21_900);

const orbChangeAttackMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(orbChangeAttackMonsterDefinition.buffer).setUint32(0xec, 9_087, true);
const selectedOrbChangeAttackEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: orbChangeAttackMonsterDefinition,
    skillDefinitions: [enemyAiOrbChangeAttackDefinition],
  }],
});
selectedOrbChangeAttackEngine.setBoardFromCodes(attackOrbChangeBoard);
selectedOrbChangeAttackEngine.enemies[0].counter = 1;
selectedOrbChangeAttackEngine.enemies[1].counter = 99;
selectedOrbChangeAttackEngine.setRngState(21_900);
selectedOrbChangeAttackEngine.resolveEnemyTurn();
const selectedOrbChangeAttackState = selectedOrbChangeAttackEngine.snapshot();
assert.equal(selectedOrbChangeAttackState.lastEnemyActions[0].skill.type, 48);
assert.equal(selectedOrbChangeAttackState.lastEnemyActions[0].damage, 2_775);
assert.equal(selectedOrbChangeAttackState.player.hp, 9_225);
assert.equal(selectedOrbChangeAttackState.lastEnemySkill.changedOrbCount, 5);

const rejectedOrbChangeAttackEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: orbChangeAttackMonsterDefinition,
    skillDefinitions: [enemyAiOrbChangeAttackDefinition],
  }],
});
rejectedOrbChangeAttackEngine.setBoardFromCodes(Array(5).fill('RRRGGG'));
rejectedOrbChangeAttackEngine.enemies[0].counter = 1;
rejectedOrbChangeAttackEngine.enemies[1].counter = 99;
rejectedOrbChangeAttackEngine.setRngState(21_900);
rejectedOrbChangeAttackEngine.resolveEnemyTurn();
const rejectedOrbChangeAttackState = rejectedOrbChangeAttackEngine.snapshot();
assert.equal(rejectedOrbChangeAttackState.lastEnemyActions[0].kind, 'attack');
assert.equal(rejectedOrbChangeAttackState.lastEnemyActions[0].damage, 1_850);
assert.equal(rejectedOrbChangeAttackState.rngState, 21_900);

const directAttackOrbChangeEngine = new PuzzleEngine({ seed: 21_900 });
directAttackOrbChangeEngine.setBoardFromCodes(attackOrbChangeBoard);
directAttackOrbChangeEngine.setRngState(21_900);
assert.equal(directAttackOrbChangeEngine.applyEnemySkillDefinition(
  enemyAiAttackOrbChangeDefinition,
), true);
assert.deepEqual(directAttackOrbChangeEngine.snapshot().board, [
  'BBBBGH',
  'BGLDHB',
  'GLDHBB',
  'LDHBBG',
  'DHBBGL',
]);
assert.equal(directAttackOrbChangeEngine.snapshot().lastEnemySkill.changedOrbCount, 7);
assert.equal(directAttackOrbChangeEngine.snapshot().lastEnemySkill.effectFlags, 1);
assert.equal(directAttackOrbChangeEngine.snapshot().rngState, 891_458_469);

const poisonFoldAttackOrbChangeEngine = new PuzzleEngine({ seed: 21_900 });
poisonFoldAttackOrbChangeEngine.setBoardFromCodes([
  'PBGHLD',
  'GLDBHR',
  'BHRDGL',
  'DLGRHB',
  'HRBGLD',
]);
poisonFoldAttackOrbChangeEngine.setRngState(21_900);
assert.equal(poisonFoldAttackOrbChangeEngine.applyEnemySkillDefinition(
  enemyAiAttackOrbChangeDefinition,
), true);
assert.equal(poisonFoldAttackOrbChangeEngine.snapshot().board[0][0], 'B');

const attackOrbChangeMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(attackOrbChangeMonsterDefinition.buffer).setUint32(0xec, 9_088, true);
const selectedAttackOrbChangeEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: attackOrbChangeMonsterDefinition,
    skillDefinitions: [enemyAiAttackOrbChangeDefinition],
  }],
});
selectedAttackOrbChangeEngine.setBoardFromCodes(attackOrbChangeBoard);
selectedAttackOrbChangeEngine.enemies[0].counter = 1;
selectedAttackOrbChangeEngine.enemies[1].counter = 99;
selectedAttackOrbChangeEngine.setRngState(21_900);
selectedAttackOrbChangeEngine.resolveEnemyTurn();
const selectedAttackOrbChangeState = selectedAttackOrbChangeEngine.snapshot();
assert.equal(selectedAttackOrbChangeState.lastEnemyActions[0].skill.type, 108);
assert.equal(selectedAttackOrbChangeState.lastEnemyActions[0].damage, 2_775);
assert.equal(selectedAttackOrbChangeState.player.hp, 9_225);
assert.equal(selectedAttackOrbChangeState.lastEnemySkill.changedOrbCount, 7);
assert.equal(selectedAttackOrbChangeState.rngState, 1_256_568_788);

const rejectedAttackOrbChangeEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: attackOrbChangeMonsterDefinition,
    skillDefinitions: [enemyAiAttackOrbChangeDefinition],
  }],
});
rejectedAttackOrbChangeEngine.setBoardFromCodes(Array(5).fill('BBBBBB'));
rejectedAttackOrbChangeEngine.enemies[0].counter = 1;
rejectedAttackOrbChangeEngine.enemies[1].counter = 99;
rejectedAttackOrbChangeEngine.setRngState(21_900);
rejectedAttackOrbChangeEngine.resolveEnemyTurn();
const rejectedAttackOrbChangeState = rejectedAttackOrbChangeEngine.snapshot();
assert.equal(rejectedAttackOrbChangeState.lastEnemyActions[0].kind, 'attack');
assert.equal(rejectedAttackOrbChangeState.lastEnemyActions[0].damage, 1_850);
assert.equal(rejectedAttackOrbChangeState.rngState, 21_900);

const directRandomSpinnersEngine = new PuzzleEngine({ seed: 21_900 });
directRandomSpinnersEngine.setBoardFromCodes(attackOrbChangeBoard);
directRandomSpinnersEngine.setRngState(21_900);
assert.equal(directRandomSpinnersEngine.applyEnemySkillDefinition(
  enemyAiRandomSpinnersDefinition,
), true);
let directRandomSpinnersState = directRandomSpinnersEngine.snapshot();
assert.deepEqual(directRandomSpinnersState.lastEnemySkill.selectedCells, [
  { row: 4, column: 2 },
  { row: 3, column: 4 },
  { row: 2, column: 3 },
]);
assert.equal(directRandomSpinnersState.rngState, 394_448_415);
assert.equal(directRandomSpinnersState.boardState.flat().filter((orb) => orb.spinner).length, 3);
directRandomSpinnersEngine.updateSpinnerOrbs(0.99);
assert.deepEqual(directRandomSpinnersEngine.snapshot().board, attackOrbChangeBoard);
directRandomSpinnersEngine.updateSpinnerOrbs(0.02);
directRandomSpinnersState = directRandomSpinnersEngine.snapshot();
assert.equal(directRandomSpinnersState.board[4][2], 'G');
assert.equal(directRandomSpinnersState.board[3][4], 'B');
assert.equal(directRandomSpinnersState.board[2][3], 'R');
directRandomSpinnersEngine.advanceSpinnerTurns();
directRandomSpinnersEngine.advanceSpinnerTurns();
assert.equal(
  directRandomSpinnersEngine.snapshot().boardState.flat().filter((orb) => orb.spinner).length,
  3,
);
directRandomSpinnersEngine.advanceSpinnerTurns();
assert.equal(
  directRandomSpinnersEngine.snapshot().boardState.flat().filter((orb) => orb.spinner).length,
  0,
);

const randomSpinnersMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(randomSpinnersMonsterDefinition.buffer).setUint32(0xec, 9_089, true);
const selectedRandomSpinnersEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: randomSpinnersMonsterDefinition,
    skillDefinitions: [enemyAiRandomSpinnersDefinition],
  }],
});
selectedRandomSpinnersEngine.setBoardFromCodes(attackOrbChangeBoard);
selectedRandomSpinnersEngine.enemies[0].counter = 1;
selectedRandomSpinnersEngine.enemies[1].counter = 99;
selectedRandomSpinnersEngine.setRngState(21_900);
selectedRandomSpinnersEngine.resolveEnemyTurn();
const selectedRandomSpinnersState = selectedRandomSpinnersEngine.snapshot();
assert.equal(selectedRandomSpinnersState.lastEnemyActions[0].skill.type, 109);
assert.equal(selectedRandomSpinnersState.lastEnemyActions[0].damage, undefined);
assert.equal(selectedRandomSpinnersState.player.hp, 12_000);
assert.equal(selectedRandomSpinnersState.lastEnemySkill.spinnerCount, 3);
assert.equal(selectedRandomSpinnersState.lastEnemySkill.selectionSeed, 58_043);
assert.equal(selectedRandomSpinnersState.rngState, 3_803_934_822);

const directFixedSpinnersEngine = new PuzzleEngine({ seed: 21_900 });
directFixedSpinnersEngine.setBoardFromCodes(attackOrbChangeBoard);
directFixedSpinnersEngine.setRngState(21_900);
assert.equal(directFixedSpinnersEngine.applyEnemySkillDefinition(
  enemyAiFixedSpinnersDefinition,
), true);
let directFixedSpinnersState = directFixedSpinnersEngine.snapshot();
assert.deepEqual(directFixedSpinnersState.lastEnemySkill.selectedCells, [
  { row: 0, column: 4 },
  { row: 1, column: 3 },
  { row: 2, column: 2 },
  { row: 3, column: 1 },
  { row: 4, column: 0 },
]);
assert.equal(directFixedSpinnersState.rngState, 21_900);
assert.equal(directFixedSpinnersState.boardState.flat().filter((orb) => orb.spinner).length, 5);
directFixedSpinnersEngine.updateSpinnerOrbs(0.49);
assert.deepEqual(directFixedSpinnersEngine.snapshot().board, attackOrbChangeBoard);
directFixedSpinnersEngine.updateSpinnerOrbs(0.02);
directFixedSpinnersState = directFixedSpinnersEngine.snapshot();
assert.equal(directFixedSpinnersState.board[0][4], 'L');
assert.equal(directFixedSpinnersState.board[1][3], 'H');
assert.equal(directFixedSpinnersState.board[4][0], 'H');

const fixedSpinnersMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(fixedSpinnersMonsterDefinition.buffer).setUint32(0xec, 9_090, true);
const selectedFixedSpinnersEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: fixedSpinnersMonsterDefinition,
    skillDefinitions: [enemyAiFixedSpinnersDefinition],
  }],
});
selectedFixedSpinnersEngine.setBoardFromCodes(attackOrbChangeBoard);
selectedFixedSpinnersEngine.enemies[0].counter = 1;
selectedFixedSpinnersEngine.enemies[1].counter = 99;
selectedFixedSpinnersEngine.setRngState(21_900);
selectedFixedSpinnersEngine.resolveEnemyTurn();
const selectedFixedSpinnersState = selectedFixedSpinnersEngine.snapshot();
assert.equal(selectedFixedSpinnersState.lastEnemyActions[0].skill.type, 110);
assert.equal(selectedFixedSpinnersState.lastEnemyActions[0].damage, undefined);
assert.equal(selectedFixedSpinnersState.player.hp, 12_000);
assert.equal(selectedFixedSpinnersState.lastEnemySkill.spinnerCount, 5);
assert.equal(selectedFixedSpinnersState.rngState, 394_448_415);

const directMaxHpChangeEngine = new PuzzleEngine({ seed: 21_900 });
directMaxHpChangeEngine.setRngState(21_900);
assert.equal(directMaxHpChangeEngine.applyEnemySkillDefinition(
  enemyAiMaxHpChangeDefinition,
), true);
let directMaxHpChangeState = directMaxHpChangeEngine.snapshot();
assert.equal(directMaxHpChangeState.player.baseMaxHp, 12_000);
assert.equal(directMaxHpChangeState.player.maxHp, 6_000);
assert.equal(directMaxHpChangeState.player.hp, 6_000);
assert.deepEqual(directMaxHpChangeState.maxHpChange, {
  turnsRemaining: 3,
  parameter: -50,
  maxHpPercent: 50,
  fixedMaxHp: 0,
});
assert.equal(directMaxHpChangeState.rngState, 21_900);
directMaxHpChangeEngine.advanceMaxHpChangeTurns();
directMaxHpChangeEngine.advanceMaxHpChangeTurns();
assert.equal(directMaxHpChangeEngine.snapshot().player.maxHp, 6_000);
directMaxHpChangeEngine.advanceMaxHpChangeTurns();
directMaxHpChangeState = directMaxHpChangeEngine.snapshot();
assert.equal(directMaxHpChangeState.maxHpChange, null);
assert.equal(directMaxHpChangeState.player.maxHp, 12_000);
assert.equal(directMaxHpChangeState.player.hp, 6_000);
directMaxHpChangeEngine.player.hp = 12_000;
assert.equal(directMaxHpChangeEngine.applyEnemySkillRecord({
  type: 111,
  kind: 'maxHpChange',
  supported: true,
  maxHpPercent: 0,
  fixedMaxHp: 8_000,
  durationTurns: 2,
}), true);
assert.equal(directMaxHpChangeEngine.snapshot().player.maxHp, 8_000);
assert.equal(directMaxHpChangeEngine.snapshot().player.hp, 8_000);

const maxHpChangeMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(maxHpChangeMonsterDefinition.buffer).setUint32(0xec, 9_091, true);
const selectedMaxHpChangeEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: maxHpChangeMonsterDefinition,
    skillDefinitions: [enemyAiMaxHpChangeDefinition],
  }],
});
selectedMaxHpChangeEngine.enemies[0].counter = 1;
selectedMaxHpChangeEngine.enemies[1].counter = 99;
selectedMaxHpChangeEngine.setRngState(21_900);
selectedMaxHpChangeEngine.resolveEnemyTurn();
let selectedMaxHpChangeState = selectedMaxHpChangeEngine.snapshot();
assert.equal(selectedMaxHpChangeState.lastEnemyActions[0].skill.type, 111);
assert.equal(selectedMaxHpChangeState.player.maxHp, 6_000);
assert.equal(selectedMaxHpChangeState.player.hp, 6_000);
assert.equal(selectedMaxHpChangeState.rngState, 394_448_415);
selectedMaxHpChangeEngine.enemies[0].counter = 1;
selectedMaxHpChangeEngine.resolveEnemyTurn();
selectedMaxHpChangeState = selectedMaxHpChangeEngine.snapshot();
assert.equal(selectedMaxHpChangeState.lastEnemyActions[0].kind, 'attack');
assert.equal(selectedMaxHpChangeState.maxHpChange.turnsRemaining, 2);

const directFixedTargetEngine = new PuzzleEngine({ seed: 21_900 });
directFixedTargetEngine.setRngState(21_900);
assert.equal(directFixedTargetEngine.applyEnemySkillRecord(
  expectedFixedTargetDefinition,
  1,
), true);
let directFixedTargetState = directFixedTargetEngine.snapshot();
assert.deepEqual(directFixedTargetState.fixedTarget, { turnsRemaining: 3, enemyIndex: 1 });
assert.equal(directFixedTargetState.targetEnemy, 1);
assert.equal(directFixedTargetState.manualTarget, false);
assert.equal(directFixedTargetState.rngState, 21_900);
directFixedTargetEngine.selectEnemy(0);
assert.equal(directFixedTargetEngine.snapshot().targetEnemy, 1);
assert.equal(directFixedTargetEngine.chooseAttackTarget('fire', 1_000), 1);
directFixedTargetEngine.advanceFixedTargetTurns();
directFixedTargetEngine.advanceFixedTargetTurns();
assert.equal(directFixedTargetEngine.snapshot().fixedTarget.turnsRemaining, 1);
directFixedTargetEngine.advanceFixedTargetTurns();
assert.equal(directFixedTargetEngine.snapshot().fixedTarget, null);
directFixedTargetEngine.applyEnemySkillRecord(expectedFixedTargetDefinition, 1);
directFixedTargetEngine.enemies[1].hp = 0;
assert.notEqual(directFixedTargetEngine.chooseAttackTarget('fire', 1_000), 1);
assert.equal(directFixedTargetEngine.snapshot().fixedTarget, null);

const directBoardSizeEngine = new PuzzleEngine({ seed: 21_900 });
directBoardSizeEngine.setBoardFromCodes([
  'RBGHLD',
  'GLDBHR',
  'BHRDGL',
  'DLGRHB',
  'HRBGLD',
]);
const preservedBoardOrb = directBoardSizeEngine.board[4][5];
directBoardSizeEngine.setRngState(21_900);
assert.equal(directBoardSizeEngine.applyEnemySkillRecord(expectedBoardSizeDefinition), true);
let directBoardSizeState = directBoardSizeEngine.snapshot();
assert.deepEqual(directBoardSizeState.boardDimensions, { rows: 4, columns: 5 });
assert.equal(directBoardSizeState.boardSizeCode, 0x45);
assert.deepEqual(directBoardSizeState.boardSizeChange, {
  turnsRemaining: 7,
  boardSizeSelector: 2,
  columns: 5,
  rows: 4,
  boardSizeCode: 0x45,
  restoreColumns: 6,
  restoreRows: 5,
});
assert.equal(directBoardSizeEngine.board.length, 4);
assert.equal(directBoardSizeEngine.board[0].length, 5);
// Type 126 sets the native skip bit, so its authored duration is not consumed
// by the same post-enemy boundary that applied the skill.
directBoardSizeEngine.advanceBoardSizeChangeTurnsPostEnemyAttack();
assert.equal(directBoardSizeEngine.snapshot().boardSizeChange.turnsRemaining, 7);
for (let index = 0; index < 7; index += 1) {
  directBoardSizeEngine.advanceBoardSizeChangeTurnsPostEnemyAttack();
}
directBoardSizeState = directBoardSizeEngine.snapshot();
assert.deepEqual(directBoardSizeState.boardDimensions, { rows: 5, columns: 6 });
assert.equal(directBoardSizeState.boardSizeCode, 0x56);
assert.equal(directBoardSizeState.boardSizeChange, null);
assert.equal(directBoardSizeEngine.board[4][5], preservedBoardOrb);

const zeroTurnBoardSizeEngine = new PuzzleEngine({ seed: 21_900 });
assert.equal(zeroTurnBoardSizeEngine.applyEnemySkillRecord({
  ...expectedBoardSizeDefinition,
  durationTurns: 0,
}), true);
assert.deepEqual(zeroTurnBoardSizeEngine.snapshot().boardDimensions, { rows: 4, columns: 5 });
zeroTurnBoardSizeEngine.advanceBoardSizeChangeTurnsPostEnemyAttack();
assert.deepEqual(zeroTurnBoardSizeEngine.snapshot().boardDimensions, { rows: 5, columns: 6 });
assert.equal(zeroTurnBoardSizeEngine.snapshot().boardSizeChange, null);

const fixedTargetMonster0 = enemyAiMonsterDefinition.slice();
const fixedTargetMonster1 = enemyAiMonsterDefinition.slice();
new DataView(fixedTargetMonster0.buffer).setUint32(0xec, 9_092, true);
new DataView(fixedTargetMonster1.buffer).setUint32(0xec, 9_092, true);
const selectedFixedTargetEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [
    { monsterDefinition: fixedTargetMonster0, skillDefinitions: [enemyAiFixedTargetDefinition] },
    { monsterDefinition: fixedTargetMonster1, skillDefinitions: [enemyAiFixedTargetDefinition] },
  ],
});
selectedFixedTargetEngine.enemies[0].counter = 1;
selectedFixedTargetEngine.enemies[1].counter = 1;
selectedFixedTargetEngine.setRngState(21_900);
selectedFixedTargetEngine.resolveEnemyTurn();
const selectedFixedTargetState = selectedFixedTargetEngine.snapshot();
assert.deepEqual(selectedFixedTargetState.fixedTarget, { turnsRemaining: 3, enemyIndex: 1 });
assert.equal(selectedFixedTargetState.lastEnemyActions[0].skill.type, 112);
assert.equal(selectedFixedTargetState.lastEnemyActions[1].skill.type, 112);
assert.equal(selectedFixedTargetState.rngState, 3_803_934_822);

const belowComboBranchEngine = new PuzzleEngine({ seed: 21_900 });
belowComboBranchEngine.setRngState(21_900);
belowComboBranchEngine.setEnemySkillQueue(0, [
  { definition: enemyAiBranchComboDefinition, enemyAi: 5, enemyRnd: 2 },
  enemyAiNormalAttackDefinition,
  enemyAiScaledAttackDefinition,
]);
belowComboBranchEngine.lastComboCount = 4;
assert.equal(belowComboBranchEngine.takeEnemySkill(0).kind, 'normalAttack');
assert.equal(belowComboBranchEngine.enemySkillQueues[0].position, 2);
assert.equal(belowComboBranchEngine.snapshot().rngState, 21_900);

const exactComboBranchEngine = new PuzzleEngine({ seed: 21_900 });
exactComboBranchEngine.setRngState(21_900);
exactComboBranchEngine.setEnemySkillQueue(0, [
  { skillDefinition: enemyAiBranchComboDefinition, enemyAi: 5, enemyRnd: 2 },
  enemyAiNormalAttackDefinition,
  enemyAiScaledAttackDefinition,
]);
exactComboBranchEngine.lastComboCount = 5;
assert.equal(exactComboBranchEngine.takeEnemySkill(0).kind, 'scaledAttack');
assert.equal(exactComboBranchEngine.enemySkillQueues[0].position, 3);
assert.equal(exactComboBranchEngine.snapshot().rngState, 21_900);
assert.throws(
  () => exactComboBranchEngine.setEnemySkillQueue(0, [enemyAiBranchComboDefinition]),
  /require a skill-reference record/,
);
assert.throws(
  () => exactComboBranchEngine.setEnemySkillQueue(0, [{
    definition: enemyAiBranchComboDefinition,
    enemyAi: 5,
  }]),
  /require enemyAi and enemyRnd operands/,
);

const cyclicComboBranchEngine = new PuzzleEngine({ seed: 21_900 });
cyclicComboBranchEngine.setRngState(21_900);
cyclicComboBranchEngine.setEnemySkillQueue(0, [
  { definition: enemyAiBranchComboDefinition, enemyAi: 0, enemyRnd: 0 },
]);
assert.throws(
  () => cyclicComboBranchEngine.takeEnemySkill(0),
  /exceeded 1000 control-flow steps/,
);

const trackedAttackAttributesEngine = new PuzzleEngine({ seed: 21_900 });
trackedAttackAttributesEngine.comboCount = 2;
trackedAttackAttributesEngine.turnMatches = [
  { type: 'fire', size: 3, enhancedCount: 0 },
  { type: 'water', size: 3, enhancedCount: 0 },
];
trackedAttackAttributesEngine.resolvePlayerTurn();
assert.equal(trackedAttackAttributesEngine.snapshot().lastAttackAttributeMask, 0b00011);

const belowAttackAttributesBranchEngine = new PuzzleEngine({ seed: 21_900 });
belowAttackAttributesBranchEngine.setRngState(21_900);
belowAttackAttributesBranchEngine.setEnemySkillQueue(0, [
  {
    definition: enemyAiBranchAttackAttributesDefinition,
    enemyAi: 0,
    enemyRnd: 2,
  },
  enemyAiNormalAttackDefinition,
  enemyAiScaledAttackDefinition,
]);
belowAttackAttributesBranchEngine.lastAttackAttributeMask = 0b00001;
assert.equal(belowAttackAttributesBranchEngine.takeEnemySkill(0).kind, 'normalAttack');
assert.equal(belowAttackAttributesBranchEngine.enemySkillQueues[0].position, 2);
assert.equal(belowAttackAttributesBranchEngine.snapshot().rngState, 21_900);

const exactAttackAttributesBranchEngine = new PuzzleEngine({ seed: 21_900 });
exactAttackAttributesBranchEngine.setRngState(21_900);
exactAttackAttributesBranchEngine.setEnemySkillQueue(0, [
  {
    definition: enemyAiBranchAttackAttributesDefinition,
    enemyAi: 0,
    enemyRnd: 2,
  },
  enemyAiNormalAttackDefinition,
  enemyAiScaledAttackDefinition,
]);
exactAttackAttributesBranchEngine.lastAttackAttributeMask = 0b00011;
assert.equal(exactAttackAttributesBranchEngine.takeEnemySkill(0).kind, 'scaledAttack');
assert.equal(exactAttackAttributesBranchEngine.enemySkillQueues[0].position, 3);
assert.equal(exactAttackAttributesBranchEngine.snapshot().rngState, 21_900);

const trackedSkillUseEngine = new PuzzleEngine({ seed: 21_900 });
trackedSkillUseEngine.start();
assert.equal(trackedSkillUseEngine.useSkill(), true);
assert.equal(trackedSkillUseEngine.snapshot().currentTurnSkillUseCount, 1);
trackedSkillUseEngine.resolvePlayerTurn();
assert.equal(trackedSkillUseEngine.snapshot().currentTurnSkillUseCount, 0);
assert.equal(trackedSkillUseEngine.snapshot().lastSkillUseCount, 1);

const belowSkillUseBranchEngine = new PuzzleEngine({ seed: 21_900 });
belowSkillUseBranchEngine.setRngState(21_900);
belowSkillUseBranchEngine.setEnemySkillQueue(0, [
  { definition: enemyAiBranchSkillUseDefinition, enemyAi: 1, enemyRnd: 2 },
  enemyAiNormalAttackDefinition,
  enemyAiScaledAttackDefinition,
]);
belowSkillUseBranchEngine.lastSkillUseCount = 0;
assert.equal(belowSkillUseBranchEngine.takeEnemySkill(0).kind, 'normalAttack');
assert.equal(belowSkillUseBranchEngine.enemySkillQueues[0].position, 2);
assert.equal(belowSkillUseBranchEngine.snapshot().rngState, 21_900);

const exactSkillUseBranchEngine = new PuzzleEngine({ seed: 21_900 });
exactSkillUseBranchEngine.setRngState(21_900);
exactSkillUseBranchEngine.setEnemySkillQueue(0, [
  { definition: enemyAiBranchSkillUseDefinition, enemyAi: 1, enemyRnd: 2 },
  enemyAiNormalAttackDefinition,
  enemyAiScaledAttackDefinition,
]);
exactSkillUseBranchEngine.lastSkillUseCount = 1;
assert.equal(exactSkillUseBranchEngine.takeEnemySkill(0).kind, 'scaledAttack');
assert.equal(exactSkillUseBranchEngine.enemySkillQueues[0].position, 3);
assert.equal(exactSkillUseBranchEngine.snapshot().rngState, 21_900);

const belowDamageBranchEngine = new PuzzleEngine({ seed: 21_900 });
belowDamageBranchEngine.setRngState(21_900);
belowDamageBranchEngine.setEnemySkillQueue(0, [
  { definition: enemyAiBranchDamageDefinition, enemyAi: 0, enemyRnd: 2 },
  enemyAiNormalAttackDefinition,
  enemyAiScaledAttackDefinition,
]);
belowDamageBranchEngine.lastDamage = 1_659;
assert.equal(belowDamageBranchEngine.takeEnemySkill(0).kind, 'normalAttack');
assert.equal(belowDamageBranchEngine.enemySkillQueues[0].position, 2);
assert.equal(belowDamageBranchEngine.snapshot().rngState, 21_900);

const exactDamageBranchEngine = new PuzzleEngine({ seed: 21_900 });
exactDamageBranchEngine.setRngState(21_900);
exactDamageBranchEngine.setEnemySkillQueue(0, [
  { definition: enemyAiBranchDamageDefinition, enemyAi: 0, enemyRnd: 2 },
  enemyAiNormalAttackDefinition,
  enemyAiScaledAttackDefinition,
]);
exactDamageBranchEngine.lastDamage = 1_660;
assert.equal(exactDamageBranchEngine.takeEnemySkill(0).kind, 'scaledAttack');
assert.equal(exactDamageBranchEngine.enemySkillQueues[0].position, 3);
assert.equal(exactDamageBranchEngine.snapshot().rngState, 21_900);

const trackedErasedAttributesEngine = new PuzzleEngine({ seed: 21_900 });
trackedErasedAttributesEngine.comboCount = 2;
trackedErasedAttributesEngine.turnMatches = [
  { type: 'fire', size: 3, enhancedCount: 0 },
  { type: 'heart', size: 3, enhancedCount: 0 },
];
trackedErasedAttributesEngine.resolvePlayerTurn();
assert.equal(trackedErasedAttributesEngine.snapshot().lastErasedAttributeMask, 0b100001);
assert.equal(trackedErasedAttributesEngine.snapshot().lastAttackAttributeMask, 0b000001);

const belowErasedAttributesBranchEngine = new PuzzleEngine({ seed: 21_900 });
belowErasedAttributesBranchEngine.setRngState(21_900);
belowErasedAttributesBranchEngine.setEnemySkillQueue(0, [
  {
    definition: enemyAiBranchErasedAttributesDefinition,
    enemyAi: 0,
    enemyRnd: 2,
  },
  enemyAiNormalAttackDefinition,
  enemyAiScaledAttackDefinition,
]);
belowErasedAttributesBranchEngine.lastErasedAttributeMask = 0b000001;
assert.equal(belowErasedAttributesBranchEngine.takeEnemySkill(0).kind, 'normalAttack');
assert.equal(belowErasedAttributesBranchEngine.enemySkillQueues[0].position, 2);
assert.equal(belowErasedAttributesBranchEngine.snapshot().rngState, 21_900);

const exactErasedAttributesBranchEngine = new PuzzleEngine({ seed: 21_900 });
exactErasedAttributesBranchEngine.setRngState(21_900);
exactErasedAttributesBranchEngine.setEnemySkillQueue(0, [
  {
    definition: enemyAiBranchErasedAttributesDefinition,
    enemyAi: 0,
    enemyRnd: 2,
  },
  enemyAiNormalAttackDefinition,
  enemyAiScaledAttackDefinition,
]);
exactErasedAttributesBranchEngine.lastErasedAttributeMask = 0b100001;
assert.equal(exactErasedAttributesBranchEngine.takeEnemySkill(0).kind, 'scaledAttack');
assert.equal(exactErasedAttributesBranchEngine.enemySkillQueues[0].position, 3);
assert.equal(exactErasedAttributesBranchEngine.snapshot().rngState, 21_900);

const aboveRemainingEnemiesBranchEngine = new PuzzleEngine({ seed: 21_900 });
aboveRemainingEnemiesBranchEngine.setRngState(21_900);
aboveRemainingEnemiesBranchEngine.setEnemySkillQueue(0, [
  {
    definition: enemyAiBranchRemainingEnemiesDefinition,
    enemyAi: 1,
    enemyRnd: 2,
  },
  enemyAiNormalAttackDefinition,
  enemyAiScaledAttackDefinition,
]);
assert.equal(aboveRemainingEnemiesBranchEngine.takeEnemySkill(0).kind, 'normalAttack');
assert.equal(aboveRemainingEnemiesBranchEngine.enemySkillQueues[0].position, 2);
assert.equal(aboveRemainingEnemiesBranchEngine.snapshot().rngState, 21_900);

const exactRemainingEnemiesBranchEngine = new PuzzleEngine({ seed: 21_900 });
exactRemainingEnemiesBranchEngine.enemies[1].hp = 0;
exactRemainingEnemiesBranchEngine.setRngState(21_900);
exactRemainingEnemiesBranchEngine.setEnemySkillQueue(0, [
  {
    definition: enemyAiBranchRemainingEnemiesDefinition,
    enemyAi: 1,
    enemyRnd: 2,
  },
  enemyAiNormalAttackDefinition,
  enemyAiScaledAttackDefinition,
]);
assert.equal(exactRemainingEnemiesBranchEngine.takeEnemySkill(0).kind, 'scaledAttack');
assert.equal(exactRemainingEnemiesBranchEngine.enemySkillQueues[0].position, 3);
assert.equal(exactRemainingEnemiesBranchEngine.snapshot().rngState, 21_900);

const belowRemainingEnemiesBranchEngine = new PuzzleEngine({ seed: 21_900 });
belowRemainingEnemiesBranchEngine.enemies[1].hp = 0;
belowRemainingEnemiesBranchEngine.setEnemySkillQueue(0, [
  {
    definition: enemyAiBranchRemainingEnemiesDefinition,
    enemyAi: 2,
    enemyRnd: 2,
  },
  enemyAiNormalAttackDefinition,
  enemyAiScaledAttackDefinition,
]);
assert.equal(belowRemainingEnemiesBranchEngine.takeEnemySkill(0).kind, 'scaledAttack');
assert.throws(
  () => new PuzzleEngine({ seed: 21_900 }).setEnemySkillQueue(
    0,
    [enemyAiBranchRemainingEnemiesDefinition],
  ),
  /type-120 branches require a skill-reference record/,
);

const exactDamageAbsorbEngine = new PuzzleEngine({ seed: 21_900 });
exactDamageAbsorbEngine.enemies[0].hp = 50_000;
exactDamageAbsorbEngine.enemies[0].damageAbsorbTurns = 3;
exactDamageAbsorbEngine.enemies[0].damageAbsorbThreshold = 1_660;
exactDamageAbsorbEngine.enemies[1].hp = 0;
exactDamageAbsorbEngine.party.forEach((member, index) => {
  member.bindTurns = index === 0 ? 0 : 1;
});
exactDamageAbsorbEngine.comboCount = 1;
exactDamageAbsorbEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
exactDamageAbsorbEngine.resolvePlayerTurn();
assert.equal(exactDamageAbsorbEngine.lastDamage, 0);
assert.equal(exactDamageAbsorbEngine.lastAbsorbedDamage, 1_660);
assert.equal(exactDamageAbsorbEngine.enemies[0].hp, 51_660);
assert.equal(exactDamageAbsorbEngine.enemies[0].damagedTurnCount, 0);

const belowDamageAbsorbEngine = new PuzzleEngine({ seed: 21_900 });
belowDamageAbsorbEngine.enemies[0].hp = 50_000;
belowDamageAbsorbEngine.enemies[0].damageAbsorbTurns = 3;
belowDamageAbsorbEngine.enemies[0].damageAbsorbThreshold = 1_661;
belowDamageAbsorbEngine.enemies[1].hp = 0;
belowDamageAbsorbEngine.party.forEach((member, index) => {
  member.bindTurns = index === 0 ? 0 : 1;
});
belowDamageAbsorbEngine.comboCount = 1;
belowDamageAbsorbEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
belowDamageAbsorbEngine.resolvePlayerTurn();
assert.equal(belowDamageAbsorbEngine.lastAbsorbedDamage, 0);
assert.equal(belowDamageAbsorbEngine.lastDamage, 1_660);
assert.equal(belowDamageAbsorbEngine.enemies[0].hp, 48_340);

const damageAbsorbBeforeVoidEngine = new PuzzleEngine({ seed: 21_900 });
damageAbsorbBeforeVoidEngine.enemies[0].hp = 50_000;
damageAbsorbBeforeVoidEngine.enemies[0].damageAbsorbTurns = 3;
damageAbsorbBeforeVoidEngine.enemies[0].damageAbsorbThreshold = 1_660;
damageAbsorbBeforeVoidEngine.enemies[0].damageVoidTurns = 3;
damageAbsorbBeforeVoidEngine.enemies[0].damageVoidThreshold = 1;
damageAbsorbBeforeVoidEngine.enemies[1].hp = 0;
damageAbsorbBeforeVoidEngine.party.forEach((member, index) => {
  member.bindTurns = index === 0 ? 0 : 1;
});
damageAbsorbBeforeVoidEngine.comboCount = 1;
damageAbsorbBeforeVoidEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
damageAbsorbBeforeVoidEngine.resolvePlayerTurn();
assert.equal(damageAbsorbBeforeVoidEngine.lastAbsorbedDamage, 1_660);
assert.equal(damageAbsorbBeforeVoidEngine.lastVoidedDamage, 0);
assert.equal(damageAbsorbBeforeVoidEngine.enemies[0].hp, 51_660);

const shieldBeforeDamageAbsorbEngine = new PuzzleEngine({ seed: 21_900 });
shieldBeforeDamageAbsorbEngine.enemies[0].hp = 50_000;
shieldBeforeDamageAbsorbEngine.enemies[0].damageShieldTurns = 3;
shieldBeforeDamageAbsorbEngine.enemies[0].damageShieldPercent = 50;
shieldBeforeDamageAbsorbEngine.enemies[0].damageAbsorbTurns = 3;
shieldBeforeDamageAbsorbEngine.enemies[0].damageAbsorbThreshold = 831;
shieldBeforeDamageAbsorbEngine.enemies[1].hp = 0;
shieldBeforeDamageAbsorbEngine.party.forEach((member, index) => {
  member.bindTurns = index === 0 ? 0 : 1;
});
shieldBeforeDamageAbsorbEngine.comboCount = 1;
shieldBeforeDamageAbsorbEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
shieldBeforeDamageAbsorbEngine.resolvePlayerTurn();
assert.equal(shieldBeforeDamageAbsorbEngine.lastAbsorbedDamage, 0);
assert.equal(shieldBeforeDamageAbsorbEngine.lastDamage, 830);
assert.equal(shieldBeforeDamageAbsorbEngine.enemies[0].hp, 49_170);
const additionalAttackMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(additionalAttackMonsterDefinition.buffer).setUint32(0xec, 9_037, true);
const selectedAdditionalAttackEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: additionalAttackMonsterDefinition,
    skillDefinitions: [enemyAiAdditionalAttackDefinition],
  }],
});
selectedAdditionalAttackEngine.enemies[0].counter = 1;
selectedAdditionalAttackEngine.enemies[1].counter = 99;
selectedAdditionalAttackEngine.setRngState(21_900);
selectedAdditionalAttackEngine.resolveEnemyTurn();
const selectedAdditionalAttackState = selectedAdditionalAttackEngine.snapshot();
assert.equal(selectedAdditionalAttackState.lastEnemyActions[0].skill.type, 8);
assert.equal(selectedAdditionalAttackState.lastEnemyActions[0].skill.damagePercent, 138);
assert.equal(selectedAdditionalAttackState.lastEnemyActions[0].damage, 3_478);
assert.equal(selectedAdditionalAttackState.player.hp, 8_522);
assert.equal(selectedAdditionalAttackState.rngState,
  padLcgStep(padLcgStep(21_900).state).state);
const scaledAdditionalAttackEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: additionalAttackMonsterDefinition,
    skillDefinitions: [enemyAiAdditionalAttackDefinition],
  }],
});
scaledAdditionalAttackEngine.player.hp = 925;
scaledAdditionalAttackEngine.setRngState(21_900);
assert.equal(scaledAdditionalAttackEngine.takeEnemySkill(0), null);
assert.equal(scaledAdditionalAttackEngine.rng.state, padLcgStep(21_900).state);
const defenseBoostMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(defenseBoostMonsterDefinition.buffer).setUint32(0xec, 9_038, true);
const selectedDefenseBoostEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: defenseBoostMonsterDefinition,
    skillDefinitions: [enemyAiDefenseBoostDefinition],
  }],
});
selectedDefenseBoostEngine.setRngState(21_900);
selectedDefenseBoostEngine.enemies[0].counter = 1;
selectedDefenseBoostEngine.enemies[1].counter = 99;
selectedDefenseBoostEngine.resolveEnemyTurn();
const selectedDefenseBoostState = selectedDefenseBoostEngine.snapshot();
assert.equal(selectedDefenseBoostState.lastEnemyActions[0].skill.type, 9);
assert.equal(selectedDefenseBoostState.lastEnemyActions[0].skill.boostPercent, 195);
assert.equal(selectedDefenseBoostState.enemies[0].defenseBoostTurns, 3);
assert.equal(selectedDefenseBoostState.enemies[0].defenseBoostAmount, 234);
assert.equal(selectedDefenseBoostState.rngState,
  padLcgStep(padLcgStep(21_900).state).state);
selectedDefenseBoostEngine.enemies[0].counter = 99;
selectedDefenseBoostEngine.resolveEnemyTurn();
assert.equal(selectedDefenseBoostEngine.enemies[0].defenseBoostTurns, 2);
const attributeNullifyMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(attributeNullifyMonsterDefinition.buffer).setUint32(0xec, 9_039, true);
const selectedAttributeNullifyEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: attributeNullifyMonsterDefinition,
    skillDefinitions: [enemyAiAttributeNullifyDefinition],
  }],
});
selectedAttributeNullifyEngine.setRngState(21_900);
selectedAttributeNullifyEngine.enemies[0].counter = 1;
selectedAttributeNullifyEngine.enemies[1].counter = 99;
selectedAttributeNullifyEngine.resolveEnemyTurn();
const selectedAttributeNullifyState = selectedAttributeNullifyEngine.snapshot();
assert.equal(selectedAttributeNullifyState.lastEnemyActions[0].skill.type, 10);
assert.equal(selectedAttributeNullifyState.enemies[0].attributeNullifyTurns, 4);
assert.equal(selectedAttributeNullifyState.enemies[0].attributeNullifyMask, 0x01);
assert.equal(selectedAttributeNullifyState.rngState, padLcgStep(21_900).state);
const dualAttributeNullifyMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(dualAttributeNullifyMonsterDefinition.buffer).setUint32(0xec, 9_040, true);
const selectedDualAttributeNullifyEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: dualAttributeNullifyMonsterDefinition,
    skillDefinitions: [enemyAiDualAttributeNullifyDefinition],
  }],
});
selectedDualAttributeNullifyEngine.setRngState(21_900);
selectedDualAttributeNullifyEngine.enemies[0].counter = 1;
selectedDualAttributeNullifyEngine.enemies[1].counter = 99;
selectedDualAttributeNullifyEngine.resolveEnemyTurn();
const selectedDualAttributeNullifyState = selectedDualAttributeNullifyEngine.snapshot();
assert.equal(selectedDualAttributeNullifyState.lastEnemyActions[0].skill.type, 11);
assert.equal(selectedDualAttributeNullifyState.enemies[0].attributeNullifyTurns, 4);
assert.equal(selectedDualAttributeNullifyState.enemies[0].attributeNullifyMask, 0x11);
assert.equal(selectedDualAttributeNullifyState.rngState, padLcgStep(21_900).state);
const statusTriggeredAttackBoostMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(statusTriggeredAttackBoostMonsterDefinition.buffer).setUint32(0xec, 9_031, true);
const selectedStatusTriggeredAttackBoostEngine = new PuzzleEngine({
  seed: 21_900,
  playerAttackBoostTurns: 2,
  enemyAiPools: [{
    monsterDefinition: statusTriggeredAttackBoostMonsterDefinition,
    skillDefinitions: [enemyAiStatusTriggeredAttackBoostDefinition],
  }],
});
selectedStatusTriggeredAttackBoostEngine.setRngState(21_900);
selectedStatusTriggeredAttackBoostEngine.enemies[0].counter = 1;
selectedStatusTriggeredAttackBoostEngine.enemies[1].counter = 99;
selectedStatusTriggeredAttackBoostEngine.resolveEnemyTurn();
const selectedStatusTriggeredAttackBoostState = selectedStatusTriggeredAttackBoostEngine.snapshot();
assert.equal(selectedStatusTriggeredAttackBoostState.enemies[0].attackBoostTurns, 2);
assert.equal(selectedStatusTriggeredAttackBoostState.enemies[0].attackBoostPercent, 250);
assert.equal(selectedStatusTriggeredAttackBoostState.lastEnemyActions[0].skill.type, 18);
assert.equal(selectedStatusTriggeredAttackBoostState.lastEnemyActions[0].damage, 925);
assert.equal(selectedStatusTriggeredAttackBoostState.nativePlayerBuffStatus.attackBoostTurns, 2);
assert.equal(selectedStatusTriggeredAttackBoostEngine.rng.state, padLcgStep(21_900).state);
const transientStatusTriggeredAttackBoostEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: statusTriggeredAttackBoostMonsterDefinition,
    skillDefinitions: [enemyAiStatusTriggeredAttackBoostDefinition],
  }],
});
transientStatusTriggeredAttackBoostEngine.enemies[0].transientDebuffActive = true;
transientStatusTriggeredAttackBoostEngine.enemies[0].counter = 1;
transientStatusTriggeredAttackBoostEngine.enemies[1].counter = 99;
transientStatusTriggeredAttackBoostEngine.resolveEnemyTurn();
assert.equal(transientStatusTriggeredAttackBoostEngine.lastEnemySkill.type, 18);
assert.equal(transientStatusTriggeredAttackBoostEngine.enemies[0].transientDebuffActive, false);
const rejectedStatusTriggeredAttackBoostEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: statusTriggeredAttackBoostMonsterDefinition,
    skillDefinitions: [enemyAiStatusTriggeredAttackBoostDefinition],
  }],
});
rejectedStatusTriggeredAttackBoostEngine.setRngState(21_900);
assert.equal(rejectedStatusTriggeredAttackBoostEngine.takeEnemySkill(0), null);
assert.equal(rejectedStatusTriggeredAttackBoostEngine.rng.state, 21_900);
const damagedTurnCounterEngine = new PuzzleEngine({ seed: 21_900 });
damagedTurnCounterEngine.enemies[1].hp = 0;
damagedTurnCounterEngine.comboCount = 1;
damagedTurnCounterEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
damagedTurnCounterEngine.resolvePlayerTurn();
assert.equal(damagedTurnCounterEngine.enemies[0].damagedTurnCount, 1);
damagedTurnCounterEngine.resolvePlayerTurn();
assert.equal(damagedTurnCounterEngine.enemies[0].damagedTurnCount, 2);
const damagedTurnAttackBoostMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(damagedTurnAttackBoostMonsterDefinition.buffer).setUint32(0xec, 9_032, true);
const selectedDamagedTurnAttackBoostEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: damagedTurnAttackBoostMonsterDefinition,
    skillDefinitions: [enemyAiDamagedTurnAttackBoostDefinition],
  }],
});
selectedDamagedTurnAttackBoostEngine.enemies[0].damagedTurnCount = 2;
selectedDamagedTurnAttackBoostEngine.setRngState(21_900);
selectedDamagedTurnAttackBoostEngine.enemies[0].counter = 1;
selectedDamagedTurnAttackBoostEngine.enemies[1].counter = 99;
selectedDamagedTurnAttackBoostEngine.resolveEnemyTurn();
const selectedDamagedTurnAttackBoostState = selectedDamagedTurnAttackBoostEngine.snapshot();
assert.equal(selectedDamagedTurnAttackBoostState.enemies[0].damagedTurnCount, 2);
assert.equal(selectedDamagedTurnAttackBoostState.enemies[0].attackBoostTurns, 4);
assert.equal(selectedDamagedTurnAttackBoostState.enemies[0].attackBoostPercent, 300);
assert.equal(selectedDamagedTurnAttackBoostState.lastEnemyActions[0].skill.type, 19);
assert.equal(selectedDamagedTurnAttackBoostState.lastEnemyActions[0].damage, 925);
assert.equal(selectedDamagedTurnAttackBoostEngine.rng.state, padLcgStep(21_900).state);
const rejectedDamagedTurnAttackBoostEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: damagedTurnAttackBoostMonsterDefinition,
    skillDefinitions: [enemyAiDamagedTurnAttackBoostDefinition],
  }],
});
rejectedDamagedTurnAttackBoostEngine.enemies[0].damagedTurnCount = 1;
rejectedDamagedTurnAttackBoostEngine.setRngState(21_900);
assert.equal(rejectedDamagedTurnAttackBoostEngine.takeEnemySkill(0), null);
assert.equal(rejectedDamagedTurnAttackBoostEngine.rng.state, 21_900);
const selfDestructMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(selfDestructMonsterDefinition.buffer).setUint32(0xec, 9_027, true);
const selectedSelfDestructEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: selfDestructMonsterDefinition,
    skillDefinitions: [enemyAiSelfDestructDefinition],
  }],
});
selectedSelfDestructEngine.setRngState(21_900);
selectedSelfDestructEngine.enemies[0].counter = 1;
selectedSelfDestructEngine.enemies[1].counter = 99;
selectedSelfDestructEngine.resolveEnemyTurn();
const selectedSelfDestructState = selectedSelfDestructEngine.snapshot();
assert.equal(selectedSelfDestructState.enemies[0].hp, 0);
assert.equal(selectedSelfDestructState.enemies[1].hp, 76_000);
assert.equal(selectedSelfDestructState.lastEnemyActions[0].skill.type, 40);
assert.equal(selectedSelfDestructState.lastEnemyActions[0].skill.skillId, 9_027);
assert.equal(selectedSelfDestructState.enemies[0].enemyAiBudget, 80);
assert.equal(selectedSelfDestructEngine.rng.state, padLcgStep(21_900).state);
const selfDestructVictoryEngine = new PuzzleEngine({
  seed: 21_900,
  enemySkillQueues: [[enemyAiSelfDestructDefinition], [enemyAiSelfDestructDefinition]],
});
selfDestructVictoryEngine.start();
selfDestructVictoryEngine.turn = 1;
selfDestructVictoryEngine.phase = 'enemy';
selfDestructVictoryEngine.phaseTimer = 0;
selfDestructVictoryEngine.enemies[0].counter = 1;
selfDestructVictoryEngine.enemies[1].counter = 1;
selfDestructVictoryEngine.update(0.01);
assert.equal(selfDestructVictoryEngine.mode, 'victory');
assert.equal(selfDestructVictoryEngine.phase, 'complete');
assert.equal(selfDestructVictoryEngine.enemies[0].hp, 0);
assert.equal(selfDestructVictoryEngine.enemies[1].hp, 0);
const changeAttributeMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(changeAttributeMonsterDefinition.buffer).setUint32(0xec, 9_025, true);
const selectedChangeAttributeEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: changeAttributeMonsterDefinition,
    skillDefinitions: [enemyAiChangeAttributeDefinition],
  }],
});
selectedChangeAttributeEngine.enemies[0].attribute = 'wood';
selectedChangeAttributeEngine.setRngState(21_900);
selectedChangeAttributeEngine.enemies[0].counter = 1;
selectedChangeAttributeEngine.enemies[1].counter = 99;
selectedChangeAttributeEngine.resolveEnemyTurn();
const selectedChangeAttributeState = selectedChangeAttributeEngine.snapshot();
assert.equal(selectedChangeAttributeState.enemies[0].attribute, 'water');
assert.equal(selectedChangeAttributeState.lastEnemyActions[0].skill.type, 46);
assert.equal(selectedChangeAttributeState.lastEnemyActions[0].skill.skillId, 9_025);
assert.equal(selectedChangeAttributeState.lastEnemyActions[0].skill.targetAttribute, 1);
assert.equal(selectedChangeAttributeState.enemies[0].enemyAiBudget, 80);
assert.equal(
  selectedChangeAttributeEngine.rng.state,
  padLcgStep(padLcgStep(padLcgStep(21_900).state).state).state,
);
const rejectedChangeAttributeDefinition = enemyAiChangeAttributeDefinition.slice();
const rejectedChangeAttributeView = new DataView(rejectedChangeAttributeDefinition.buffer);
rejectedChangeAttributeView.setUint32(0x00, 9_026, true);
[2, 2, -1, 9, 99].forEach((attribute, index) => {
  rejectedChangeAttributeView.setInt32(0x10 + index * 4, attribute, true);
});
const rejectedChangeAttributeMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(rejectedChangeAttributeMonsterDefinition.buffer).setUint32(0xec, 9_026, true);
const rejectedChangeAttributeEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: rejectedChangeAttributeMonsterDefinition,
    skillDefinitions: [rejectedChangeAttributeDefinition],
  }],
});
rejectedChangeAttributeEngine.enemies[0].attribute = 'wood';
rejectedChangeAttributeEngine.setRngState(21_900);
assert.equal(rejectedChangeAttributeEngine.takeEnemySkill(0), null);
assert.equal(rejectedChangeAttributeEngine.rng.state, 21_900);
const scaledAttackMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(scaledAttackMonsterDefinition.buffer).setUint32(0xec, 9_024, true);
const selectedScaledAttackEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: scaledAttackMonsterDefinition,
    skillDefinitions: [enemyAiScaledAttackDefinition],
  }],
});
selectedScaledAttackEngine.setRngState(21_900);
selectedScaledAttackEngine.enemies[0].counter = 1;
selectedScaledAttackEngine.enemies[1].counter = 99;
selectedScaledAttackEngine.resolveEnemyTurn();
const selectedScaledAttackState = selectedScaledAttackEngine.snapshot();
assert.equal(selectedScaledAttackState.player.hp, 11_075);
assert.equal(selectedScaledAttackState.lastEnemyActions[0].skill.type, 47);
assert.equal(selectedScaledAttackState.lastEnemyActions[0].skill.skillId, 9_024);
assert.equal(selectedScaledAttackState.lastEnemyActions[0].damage, 925);
assert.equal(selectedScaledAttackState.enemies[0].enemyAiBudget, 80);
assert.equal(selectedScaledAttackEngine.rng.state, padLcgStep(21_900).state);
const rejectedScaledAttackEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: scaledAttackMonsterDefinition,
    skillDefinitions: [enemyAiScaledAttackDefinition],
  }],
});
rejectedScaledAttackEngine.enemies[0].scaledAttackGate = 1;
rejectedScaledAttackEngine.setRngState(21_900);
assert.equal(rejectedScaledAttackEngine.takeEnemySkill(0), null);
assert.equal(rejectedScaledAttackEngine.rng.state, 21_900);
const currentHpGravityMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(currentHpGravityMonsterDefinition.buffer).setUint32(0xec, 9_023, true);
const selectedCurrentHpGravityEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: currentHpGravityMonsterDefinition,
    skillDefinitions: [enemyAiCurrentHpGravityDefinition],
  }],
});
selectedCurrentHpGravityEngine.setRngState(21_900);
selectedCurrentHpGravityEngine.enemies[0].counter = 1;
selectedCurrentHpGravityEngine.enemies[1].counter = 99;
selectedCurrentHpGravityEngine.resolveEnemyTurn();
const selectedCurrentHpGravityState = selectedCurrentHpGravityEngine.snapshot();
assert.equal(selectedCurrentHpGravityState.player.hp, 9_000);
assert.equal(selectedCurrentHpGravityState.lastEnemyActions[0].skill.type, 50);
assert.equal(selectedCurrentHpGravityState.lastEnemyActions[0].skill.skillId, 9_023);
assert.equal(selectedCurrentHpGravityState.lastEnemyActions[0].damage, 3_000);
assert.equal(selectedCurrentHpGravityState.enemies[0].enemyAiBudget, 80);
assert.equal(selectedCurrentHpGravityEngine.rng.state, padLcgStep(21_900).state);
const sequentialCurrentHpGravityEngine = new PuzzleEngine({
  seed: 21_900,
  enemySkillQueues: [[enemyAiCurrentHpGravityDefinition], [enemyAiCurrentHpGravityDefinition]],
});
sequentialCurrentHpGravityEngine.player.hp = 12_000;
sequentialCurrentHpGravityEngine.enemies[0].counter = 1;
sequentialCurrentHpGravityEngine.enemies[1].counter = 1;
sequentialCurrentHpGravityEngine.resolveEnemyTurn();
assert.equal(sequentialCurrentHpGravityEngine.lastEnemyActions[0].damage, 3_000);
assert.equal(sequentialCurrentHpGravityEngine.lastEnemyActions[1].damage, 2_250);
assert.equal(sequentialCurrentHpGravityEngine.player.hp, 6_750);
const reviveEnemyMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(reviveEnemyMonsterDefinition.buffer).setUint32(0xec, 9_022, true);
const selectedReviveEnemyEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: reviveEnemyMonsterDefinition,
    skillDefinitions: [enemyAiReviveEnemyDefinition],
  }],
});
selectedReviveEnemyEngine.enemies[1].hp = 0;
selectedReviveEnemyEngine.enemies[1].counter = 1;
selectedReviveEnemyEngine.setRngState(21_900);
selectedReviveEnemyEngine.enemies[0].counter = 1;
selectedReviveEnemyEngine.resolveEnemyTurn();
const selectedReviveEnemyState = selectedReviveEnemyEngine.snapshot();
assert.equal(selectedReviveEnemyState.lastEnemyActions[0].skill.type, 52);
assert.equal(selectedReviveEnemyState.lastEnemyActions[0].skill.skillId, 9_022);
assert.equal(selectedReviveEnemyState.lastEnemyActions[0].skill.targetEnemyIndex, 1);
assert.equal(selectedReviveEnemyState.lastEnemySkill.revivedHp, 28_120);
assert.equal(selectedReviveEnemyState.enemies[1].hp, 28_120);
assert.equal(selectedReviveEnemyState.enemies[1].counter, 1);
assert.equal(selectedReviveEnemyState.enemies[0].enemyAiBudget, 80);
assert.equal(
  selectedReviveEnemyEngine.rng.state,
  padLcgStep(padLcgStep(21_900).state).state,
);
const unavailableReviveEnemyEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: reviveEnemyMonsterDefinition,
    skillDefinitions: [enemyAiReviveEnemyDefinition],
  }],
});
unavailableReviveEnemyEngine.enemies[1].unavailable = true;
unavailableReviveEnemyEngine.enemies[1].counter = 1;
unavailableReviveEnemyEngine.enemies[0].counter = 1;
unavailableReviveEnemyEngine.setRngState(21_900);
unavailableReviveEnemyEngine.resolveEnemyTurn();
const unavailableReviveEnemyState = unavailableReviveEnemyEngine.snapshot();
assert.equal(unavailableReviveEnemyState.lastEnemyActions[0].skill.type, 52);
assert.equal(unavailableReviveEnemyState.lastEnemyActions[0].skill.targetEnemyIndex, 1);
assert.equal(unavailableReviveEnemyState.lastEnemySkill.revivedHp, 28_120);
assert.equal(unavailableReviveEnemyState.enemies[1].hp, 28_120);
assert.equal(unavailableReviveEnemyState.enemies[1].unavailable, false);
assert.equal(unavailableReviveEnemyState.enemies[1].counter, 1);
assert.equal(unavailableReviveEnemyEngine.rng.state, padLcgStep(padLcgStep(21_900).state).state);
const rejectedReviveEnemyEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: reviveEnemyMonsterDefinition,
    skillDefinitions: [enemyAiReviveEnemyDefinition],
  }],
});
rejectedReviveEnemyEngine.setRngState(21_900);
assert.equal(rejectedReviveEnemyEngine.takeEnemySkill(0), null);
assert.equal(rejectedReviveEnemyEngine.rng.state, 21_900);
const entireBlindMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(entireBlindMonsterDefinition.buffer).setUint32(0xec, 9_041, true);
const selectedEntireBlindEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: entireBlindMonsterDefinition,
    skillDefinitions: [enemyAiEntireBlindDefinition],
  }],
});
selectedEntireBlindEngine.setRngState(21_900);
selectedEntireBlindEngine.enemies[0].counter = 1;
selectedEntireBlindEngine.enemies[1].counter = 99;
selectedEntireBlindEngine.resolveEnemyTurn();
const selectedEntireBlindState = selectedEntireBlindEngine.snapshot();
assert.equal(selectedEntireBlindState.lastEnemyActions[0].skill.type, 5);
assert.equal(selectedEntireBlindState.lastEnemyActions[0].damage, 925);
assert.equal(selectedEntireBlindState.player.hp, 11_075);
assert.equal(selectedEntireBlindState.boardState.flat().filter((orb) => orb.entireBlind).length, 30);
assert.equal(selectedEntireBlindState.rngState, padLcgStep(21_900).state);
const rejectedEntireBlindEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: entireBlindMonsterDefinition,
    skillDefinitions: [enemyAiEntireBlindDefinition],
  }],
});
assert.equal(rejectedEntireBlindEngine.applyEnemySkillDefinition(enemyAiEntireBlindDefinition), true);
rejectedEntireBlindEngine.setRngState(21_900);
assert.equal(rejectedEntireBlindEngine.takeEnemySkill(0), null);
assert.equal(rejectedEntireBlindEngine.rng.state, 21_900);
const partialEntireBlindMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(partialEntireBlindMonsterDefinition.buffer).setUint32(0xec, 9_041, true);
const partialEntireBlindSelection = selectPadEnemyAiNew(
  decodePadEnemyAiMonsterDefinition(partialEntireBlindMonsterDefinition),
  [decodePadEnemyAiSkillDefinition(enemyAiEntireBlindDefinition)],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    boardCellCount: 30,
    blackBlockCount: 15,
    rngState: 21_900,
  },
);
assert.equal(partialEntireBlindSelection.skillId, null);
assert.equal(partialEntireBlindSelection.rngState, padLcgStep(21_900).state);
const partialEntireBlindAltMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(partialEntireBlindAltMonsterDefinition.buffer).setUint32(0xec, 9_042, true);
const partialEntireBlindAltSelection = selectPadEnemyAiNew(
  decodePadEnemyAiMonsterDefinition(partialEntireBlindAltMonsterDefinition),
  [decodePadEnemyAiSkillDefinition(enemyAiEntireBlindAltDefinition)],
  {
    currentHp: 92_000,
    maxHp: 92_000,
    aiBudget: 100,
    boardCellCount: 30,
    blackBlockCount: 15,
    rngState: 21_900,
  },
);
assert.equal(partialEntireBlindAltSelection.skillId, 9_042);
assert.equal(partialEntireBlindAltSelection.effect.type, 62);
assert.equal(partialEntireBlindAltSelection.rngState, padLcgStep(21_900).state);
const bindAttackMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(bindAttackMonsterDefinition.buffer).setUint32(0xec, 9_043, true);
const selectedBindAttackEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: bindAttackMonsterDefinition,
    skillDefinitions: [enemyAiBindAttackDefinition],
  }],
});
selectedBindAttackEngine.setRngState(21_900);
selectedBindAttackEngine.enemies[0].counter = 1;
selectedBindAttackEngine.enemies[1].counter = 99;
selectedBindAttackEngine.resolveEnemyTurn();
const selectedBindAttackState = selectedBindAttackEngine.snapshot();
assert.equal(selectedBindAttackState.lastEnemyActions[0].skill.type, 63);
assert.equal(selectedBindAttackState.lastEnemyActions[0].damage, 925);
assert.equal(selectedBindAttackState.player.hp, 11_075);
assert.equal(selectedBindAttackState.lastEnemySkill.targetMask, 0x12);
assert.equal(selectedBindAttackState.lastEnemySkill.durationTurns, 2);
assert.equal(selectedBindAttackState.lastEnemySkill.boundMask.toString(2)
  .replaceAll('0', '').length, 2);
assert.equal(selectedBindAttackState.party.slice(1, 5)
  .filter((member) => member.bindTurns === selectedBindAttackState.lastEnemySkill.durationTurns).length, 2);
const bindAttackTurnState = padLcgStep(padLcgStep(padLcgStep(
  padLcgStep(21_900).state,
).state).state).state;
assert.equal(selectedBindAttackState.rngState, bindAttackTurnState);
const rejectedBindAttackEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: bindAttackMonsterDefinition,
    skillDefinitions: [enemyAiBindAttackDefinition],
  }],
});
rejectedBindAttackEngine.party.slice(1, 5).forEach((member) => {
  member.bindTurns = 5;
});
rejectedBindAttackEngine.setRngState(21_900);
assert.equal(rejectedBindAttackEngine.takeEnemySkill(0), null);
assert.equal(rejectedBindAttackEngine.rng.state, 21_900);
const randomSubBindMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(randomSubBindMonsterDefinition.buffer).setUint32(0xec, 9_044, true);
const selectedRandomSubBindEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: randomSubBindMonsterDefinition,
    skillDefinitions: [enemyAiRandomSubBindDefinition],
  }],
});
selectedRandomSubBindEngine.setRngState(21_900);
selectedRandomSubBindEngine.enemies[0].counter = 1;
selectedRandomSubBindEngine.enemies[1].counter = 99;
selectedRandomSubBindEngine.resolveEnemyTurn();
const selectedRandomSubBindState = selectedRandomSubBindEngine.snapshot();
assert.equal(selectedRandomSubBindState.lastEnemyActions[0].skill.type, 65);
assert.equal(selectedRandomSubBindState.lastEnemyActions[0].damage, 925);
assert.equal(selectedRandomSubBindState.player.hp, 11_075);
assert.deepEqual(selectedRandomSubBindEngine.floatingText, [{
  kind: 'playerDamage',
  value: 925,
  enemy: -1,
  sourceEnemy: 0,
  age: 0,
}]);
assert.equal(selectedRandomSubBindState.lastEnemySkill.targetMask, 0x12);
assert.equal(selectedRandomSubBindState.lastEnemySkill.setupDurationTurns, 2);
assert.equal(selectedRandomSubBindState.lastEnemySkill.durationTurns, 3);
assert.deepEqual(
  selectedRandomSubBindState.party.map((member) => member.bindTurns),
  [0, 3, 0, 0, 3, 0],
);
assert.equal(
  selectedRandomSubBindState.rngState,
  padLcgStep(padLcgStep(padLcgStep(padLcgStep(
    padLcgStep(21_900).state,
  ).state).state).state).state,
);
const rejectedRandomSubBindEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: randomSubBindMonsterDefinition,
    skillDefinitions: [enemyAiRandomSubBindDefinition],
  }],
});
rejectedRandomSubBindEngine.party.slice(1, 5).forEach((member) => {
  member.bindTurns = 5;
});
rejectedRandomSubBindEngine.setRngState(21_900);
assert.equal(rejectedRandomSubBindEngine.takeEnemySkill(0), null);
assert.equal(rejectedRandomSubBindEngine.rng.state, 21_900);
const randomJammerMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(randomJammerMonsterDefinition.buffer).setUint32(0xec, 9_023, true);
const selectedRandomJammerEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: randomJammerMonsterDefinition,
    skillDefinitions: [enemyAiRandomJammerDefinition],
  }],
});
selectedRandomJammerEngine.setBoardFromCodes(['RGBHLD', 'BGLDHR', 'GLXHRB', 'LDHRBG', 'DHRBGL']);
selectedRandomJammerEngine.setRngState(21_900);
selectedRandomJammerEngine.enemies[0].counter = 1;
selectedRandomJammerEngine.enemies[1].counter = 99;
selectedRandomJammerEngine.resolveEnemyTurn();
const selectedRandomJammerState = selectedRandomJammerEngine.snapshot();
assert.equal(selectedRandomJammerState.lastEnemyActions[0].skill.type, 13);
assert.deepEqual(selectedRandomJammerState.lastEnemySkill.selectedFaceTypes, [3, 5]);
assert.equal(selectedRandomJammerState.lastEnemySkill.changedOrbCount, 10);
assert.equal(selectedRandomJammerState.lastEnemySkill.effectFlags, 4);
assert.equal(
  selectedRandomJammerEngine.rng.state,
  padLcgStep(padLcgStep(padLcgStep(21_900).state).state).state,
);
const rejectedRandomJammerEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: randomJammerMonsterDefinition,
    skillDefinitions: [enemyAiRandomJammerDefinition],
  }],
});
rejectedRandomJammerEngine.setBoardFromCodes(['RRRRRR', 'RRRRRR', 'RRRRRR', 'RRRRRR', 'RRRRRR']);
rejectedRandomJammerEngine.setRngState(21_900);
assert.equal(rejectedRandomJammerEngine.takeEnemySkill(0), null);
assert.equal(rejectedRandomJammerEngine.rng.state, 21_900);
const activeSkillSealMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(activeSkillSealMonsterDefinition.buffer).setUint32(0xec, 9_024, true);
const selectedActiveSkillSealEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: activeSkillSealMonsterDefinition,
    skillDefinitions: [enemyAiActiveSkillSealDefinition],
  }],
});
selectedActiveSkillSealEngine.setRngState(21_900);
selectedActiveSkillSealEngine.enemies[0].counter = 1;
selectedActiveSkillSealEngine.enemies[1].counter = 99;
selectedActiveSkillSealEngine.resolveEnemyTurn();
const selectedActiveSkillSealState = selectedActiveSkillSealEngine.snapshot();
assert.equal(selectedActiveSkillSealState.lastEnemyActions[0].skill.type, 14);
assert.equal(selectedActiveSkillSealState.skillSealTurns, 3);
assert.equal(selectedActiveSkillSealState.skill.sealed, true);
assert.equal(selectedActiveSkillSealState.skill.ready, false);
selectedActiveSkillSealEngine.enemies[0].counter = 1;
selectedActiveSkillSealEngine.resolveEnemyTurn();
assert.equal(selectedActiveSkillSealEngine.skillSealTurns, 5);
const repeatAttackMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(repeatAttackMonsterDefinition.buffer).setUint32(0xec, 9_039, true);
const selectedRepeatAttackEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: repeatAttackMonsterDefinition,
    skillDefinitions: [enemyAiRepeatAttackDefinition],
  }],
});
selectedRepeatAttackEngine.setRngState(21_900);
selectedRepeatAttackEngine.enemies[0].counter = 1;
selectedRepeatAttackEngine.enemies[1].counter = 99;
selectedRepeatAttackEngine.resolveEnemyTurn();
const selectedRepeatAttackState = selectedRepeatAttackEngine.snapshot();
assert.equal(selectedRepeatAttackState.lastEnemyActions[0].skill.type, 15);
assert.equal(selectedRepeatAttackState.lastEnemyActions[0].skill.hitCount, 5);
assert.deepEqual(
  selectedRepeatAttackState.lastEnemyActions[0].skill.hitDamages,
  [740, 740, 740, 740, 740],
);
assert.equal(selectedRepeatAttackState.lastEnemyActions[0].damage, 4_625);
assert.equal(selectedRepeatAttackState.player.hp, 7_375);
assert.equal(
  selectedRepeatAttackState.rngState,
  padLcgStep(padLcgStep(21_900).state).state,
);
const inactivityMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(inactivityMonsterDefinition.buffer).setUint32(0xec, 9_040, true);
const selectedInactivityEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: inactivityMonsterDefinition,
    skillDefinitions: [enemyAiInactivityDefinition],
  }],
});
selectedInactivityEngine.enemies[0].attribute = 'water';
selectedInactivityEngine.setRngState(21_900);
selectedInactivityEngine.enemies[0].counter = 1;
selectedInactivityEngine.enemies[1].counter = 99;
selectedInactivityEngine.resolveEnemyTurn();
const selectedInactivityState = selectedInactivityEngine.snapshot();
assert.equal(selectedInactivityState.lastEnemyActions[0].skill.type, 16);
assert.equal(selectedInactivityState.lastEnemyActions[0].damage, undefined);
assert.equal(selectedInactivityState.player.hp, 12_000);
assert.equal(selectedInactivityState.message, 'Verdant Shell does nothing.');
assert.equal(selectedInactivityState.rngState, padLcgStep(21_900).state);
const rejectedInactivityEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: inactivityMonsterDefinition,
    skillDefinitions: [enemyAiInactivityDefinition],
  }],
});
rejectedInactivityEngine.setRngState(21_900);
assert.equal(rejectedInactivityEngine.takeEnemySkill(0), null);
assert.equal(rejectedInactivityEngine.rng.state, 21_900);
const inactivityUnconditionalMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(inactivityUnconditionalMonsterDefinition.buffer).setUint32(0xec, 9_045, true);
const selectedInactivityUnconditionalEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: inactivityUnconditionalMonsterDefinition,
    skillDefinitions: [enemyAiInactivityUnconditionalDefinition],
  }],
});
selectedInactivityUnconditionalEngine.setRngState(21_900);
selectedInactivityUnconditionalEngine.enemies[0].counter = 1;
selectedInactivityUnconditionalEngine.enemies[1].counter = 99;
selectedInactivityUnconditionalEngine.resolveEnemyTurn();
const selectedInactivityUnconditionalState = selectedInactivityUnconditionalEngine.snapshot();
assert.equal(selectedInactivityUnconditionalState.enemies[0].attribute, 'wood');
assert.equal(selectedInactivityUnconditionalState.lastEnemyActions[0].skill.type, 66);
assert.equal(selectedInactivityUnconditionalState.lastEnemyActions[0].damage, undefined);
assert.equal(selectedInactivityUnconditionalState.player.hp, 12_000);
assert.equal(selectedInactivityUnconditionalState.message, 'Verdant Shell does nothing.');
assert.equal(selectedInactivityUnconditionalState.rngState, padLcgStep(21_900).state);
const inactivityPresentationMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(inactivityPresentationMonsterDefinition.buffer).setUint32(0xec, 9_049, true);
const selectedInactivityPresentationEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: inactivityPresentationMonsterDefinition,
    skillDefinitions: [enemyAiInactivityPresentationDefinition],
  }],
});
selectedInactivityPresentationEngine.setRngState(21_900);
selectedInactivityPresentationEngine.enemies[0].counter = 1;
selectedInactivityPresentationEngine.enemies[1].counter = 99;
selectedInactivityPresentationEngine.resolveEnemyTurn();
const selectedInactivityPresentationState = selectedInactivityPresentationEngine.snapshot();
assert.equal(selectedInactivityPresentationState.lastEnemyActions[0].skill.type, 70);
assert.deepEqual(
  selectedInactivityPresentationState.lastEnemyActions[0].skill.presentationParameters,
  [12, 34, 56],
);
assert.equal(selectedInactivityPresentationState.lastEnemyActions[0].damage, undefined);
assert.equal(selectedInactivityPresentationState.player.hp, 12_000);
assert.equal(selectedInactivityPresentationState.rngState, padLcgStep(21_900).state);
const damageVoidMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(damageVoidMonsterDefinition.buffer).setUint32(0xec, 9_050, true);
const selectedDamageVoidEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: damageVoidMonsterDefinition,
    skillDefinitions: [enemyAiDamageVoidDefinition],
  }],
});
selectedDamageVoidEngine.setRngState(21_900);
selectedDamageVoidEngine.enemies[0].counter = 1;
selectedDamageVoidEngine.enemies[1].counter = 99;
selectedDamageVoidEngine.resolveEnemyTurn();
const selectedDamageVoidState = selectedDamageVoidEngine.snapshot();
assert.equal(selectedDamageVoidState.lastEnemyActions[0].skill.type, 71);
assert.equal(selectedDamageVoidState.enemies[0].damageVoidTurns, 3);
assert.equal(selectedDamageVoidState.enemies[0].damageVoidThreshold, 1_000);
assert.equal(selectedDamageVoidState.player.hp, 12_000);
assert.equal(selectedDamageVoidState.rngState, padLcgStep(21_900).state);
selectedDamageVoidEngine.enemies[0].counter = 99;
selectedDamageVoidEngine.resolveEnemyTurn();
assert.equal(selectedDamageVoidEngine.enemies[0].damageVoidTurns, 2);
const damageVoidCombatEngine = new PuzzleEngine({ seed: 21_900 });
damageVoidCombatEngine.enemies[0].damageVoidTurns = 3;
damageVoidCombatEngine.enemies[0].damageVoidThreshold = 1;
damageVoidCombatEngine.enemies[1].hp = 0;
damageVoidCombatEngine.comboCount = 1;
damageVoidCombatEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
damageVoidCombatEngine.resolvePlayerTurn();
assert.equal(damageVoidCombatEngine.enemies[0].hp, damageVoidCombatEngine.enemies[0].maxHp);
assert.equal(damageVoidCombatEngine.lastDamage, 0);
assert.ok(damageVoidCombatEngine.lastVoidedDamage > 0);
assert.equal(damageVoidCombatEngine.enemies[0].damagedTurnCount, 0);
const attributeResistMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(attributeResistMonsterDefinition.buffer).setUint32(0xec, 9_051, true);
const passiveAttributeResistEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: attributeResistMonsterDefinition,
    skillDefinitions: [enemyAiAttributeResistDefinition],
  }],
});
assert.deepEqual(
  passiveAttributeResistEngine.enemies[0].attributeResistPercentages,
  [50, 100, 50, 100, 100],
);
passiveAttributeResistEngine.setRngState(21_900);
assert.equal(passiveAttributeResistEngine.takeEnemySkill(0), null);
assert.equal(passiveAttributeResistEngine.rng.state, 21_900);
passiveAttributeResistEngine.enemies[1].hp = 0;
passiveAttributeResistEngine.comboCount = 1;
passiveAttributeResistEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
passiveAttributeResistEngine.resolvePlayerTurn();
assert.equal(passiveAttributeResistEngine.lastDamage, 1_974);
assert.equal(
  passiveAttributeResistEngine.enemies[0].hp,
  passiveAttributeResistEngine.enemies[0].maxHp - 1_974,
);
assert.deepEqual(
  passiveAttributeResistEngine.snapshot().enemies[0].attributeResistPercentages,
  [50, 100, 50, 100, 100],
);
passiveAttributeResistEngine.setEnemyAiDefinitionPool(0, null, []);
assert.deepEqual(
  passiveAttributeResistEngine.enemies[0].attributeResistPercentages,
  [100, 100, 100, 100, 100],
);
const typeResistMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(typeResistMonsterDefinition.buffer).setUint32(0xec, 9_118, true);
const passiveTypeResistEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: typeResistMonsterDefinition,
    skillDefinitions: [enemyAiTypeResistDefinition],
  }],
});
assert.deepEqual(
  passiveTypeResistEngine.enemies[0].typeDamagePercentages,
  [...Array(6).fill(100), 25, 25, ...Array(8).fill(100)],
);
passiveTypeResistEngine.setRngState(21_900);
assert.equal(passiveTypeResistEngine.takeEnemySkill(0), null);
assert.equal(passiveTypeResistEngine.rng.state, 21_900);
passiveTypeResistEngine.enemies[1].hp = 0;
passiveTypeResistEngine.party.forEach((member, index) => {
  member.bindTurns = index === 0 ? 0 : 1;
});
passiveTypeResistEngine.party[0].monsterTypes = [6, 7];
passiveTypeResistEngine.comboCount = 1;
passiveTypeResistEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
passiveTypeResistEngine.resolvePlayerTurn();
assert.equal(passiveTypeResistEngine.lastDamage, 104);
assert.equal(
  passiveTypeResistEngine.enemies[0].hp,
  passiveTypeResistEngine.enemies[0].maxHp - 104,
);
assert.deepEqual(
  passiveTypeResistEngine.snapshot().enemies[0].typeDamagePercentages,
  [...Array(6).fill(100), 25, 25, ...Array(8).fill(100)],
);
passiveTypeResistEngine.setEnemyAiDefinitionPool(0, null, []);
assert.deepEqual(
  passiveTypeResistEngine.enemies[0].typeDamagePercentages,
  Array(16).fill(100),
);
const damageImmunityMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(damageImmunityMonsterDefinition.buffer).setUint32(0xec, 9_119, true);
const selectedDamageImmunityEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: damageImmunityMonsterDefinition,
    skillDefinitions: [enemyAiDamageImmunityDefinition],
  }],
});
selectedDamageImmunityEngine.setRngState(21_900);
selectedDamageImmunityEngine.enemies[0].counter = 1;
selectedDamageImmunityEngine.enemies[1].counter = 99;
selectedDamageImmunityEngine.resolveEnemyTurn();
assert.equal(selectedDamageImmunityEngine.snapshot().lastEnemyActions[0].skill.type, 119);
assert.equal(selectedDamageImmunityEngine.enemies[0].damageImmunityTurns, 3);
assert.equal(selectedDamageImmunityEngine.rng.state, padLcgStep(21_900).state);
const activeDamageImmunityRng = selectedDamageImmunityEngine.rng.state;
assert.equal(selectedDamageImmunityEngine.takeEnemySkill(0), null);
assert.equal(selectedDamageImmunityEngine.rng.state, activeDamageImmunityRng);
selectedDamageImmunityEngine.enemies[0].counter = 99;
selectedDamageImmunityEngine.resolveEnemyTurn();
assert.equal(selectedDamageImmunityEngine.enemies[0].damageImmunityTurns, 2);
const damageImmunityAltMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(damageImmunityAltMonsterDefinition.buffer).setUint32(0xec, 9_123, true);
const selectedDamageImmunityAltEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: damageImmunityAltMonsterDefinition,
    skillDefinitions: [enemyAiDamageImmunityAltDefinition],
  }],
});
selectedDamageImmunityAltEngine.setRngState(21_900);
selectedDamageImmunityAltEngine.enemies[0].counter = 1;
selectedDamageImmunityAltEngine.enemies[1].counter = 99;
selectedDamageImmunityAltEngine.resolveEnemyTurn();
assert.equal(selectedDamageImmunityAltEngine.snapshot().lastEnemyActions[0].skill.type, 123);
assert.equal(selectedDamageImmunityAltEngine.snapshot().lastEnemyActions[0].skill.kind, 'damageImmunityAlt');
assert.equal(selectedDamageImmunityAltEngine.enemies[0].damageImmunityTurns, 3);
assert.equal(selectedDamageImmunityAltEngine.enemies[0].damageImmunityPresentation, 1);
assert.equal(selectedDamageImmunityAltEngine.rng.state, padLcgStep(21_900).state);
const damageImmunityCombatEngine = new PuzzleEngine({ seed: 21_900 });
damageImmunityCombatEngine.enemies[0].damageImmunityTurns = 3;
damageImmunityCombatEngine.enemies[1].hp = 0;
damageImmunityCombatEngine.comboCount = 1;
damageImmunityCombatEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
damageImmunityCombatEngine.turnNailCount = 2;
damageImmunityCombatEngine.resolvePlayerTurn();
assert.equal(damageImmunityCombatEngine.lastDamage, 0);
assert.equal(damageImmunityCombatEngine.lastNailDamage, 0);
assert.equal(damageImmunityCombatEngine.lastAbsorbedDamage, 0);
assert.equal(damageImmunityCombatEngine.lastVoidedDamage, 0);
assert.equal(damageImmunityCombatEngine.enemies[0].hp, damageImmunityCombatEngine.enemies[0].maxHp);
assert.equal(damageImmunityCombatEngine.enemies[0].damagedTurnCount, 0);
const damageImmunityOffMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(damageImmunityOffMonsterDefinition.buffer).setUint32(0xec, 9_121, true);
const inactiveDamageImmunityOffEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: damageImmunityOffMonsterDefinition,
    skillDefinitions: [enemyAiDamageImmunityOffDefinition],
  }],
});
inactiveDamageImmunityOffEngine.setRngState(21_900);
assert.equal(inactiveDamageImmunityOffEngine.takeEnemySkill(0), null);
assert.equal(inactiveDamageImmunityOffEngine.rng.state, 21_900);
const selectedDamageImmunityOffEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: damageImmunityOffMonsterDefinition,
    skillDefinitions: [enemyAiDamageImmunityOffDefinition],
  }],
});
selectedDamageImmunityOffEngine.enemies[0].damageImmunityTurns = 3;
selectedDamageImmunityOffEngine.enemies[0].counter = 1;
selectedDamageImmunityOffEngine.enemies[1].counter = 99;
selectedDamageImmunityOffEngine.setRngState(21_900);
selectedDamageImmunityOffEngine.resolveEnemyTurn();
assert.equal(selectedDamageImmunityOffEngine.snapshot().lastEnemyActions[0].skill.type, 121);
assert.equal(selectedDamageImmunityOffEngine.enemies[0].damageImmunityTurns, 0);
assert.equal(selectedDamageImmunityOffEngine.player.hp, selectedDamageImmunityOffEngine.player.maxHp);
assert.equal(selectedDamageImmunityOffEngine.rng.state, padLcgStep(21_900).state);
selectedDamageImmunityOffEngine.enemies[1].hp = 0;
selectedDamageImmunityOffEngine.comboCount = 1;
selectedDamageImmunityOffEngine.turnMatches = [
  { type: 'fire', size: 3, enhancedCount: 0 },
];
selectedDamageImmunityOffEngine.resolvePlayerTurn();
assert.equal(selectedDamageImmunityOffEngine.lastDamage, 3_948);
const resolveMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(resolveMonsterDefinition.buffer).setUint32(0xec, 9_052, true);
const passiveResolveEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: resolveMonsterDefinition,
    skillDefinitions: [enemyAiResolveDefinition],
  }],
});
assert.equal(passiveResolveEngine.enemies[0].resolveThresholdPercent, 50);
passiveResolveEngine.setRngState(21_900);
assert.equal(passiveResolveEngine.takeEnemySkill(0), null);
assert.equal(passiveResolveEngine.rng.state, 21_900);
passiveResolveEngine.enemies[1].hp = 0;
passiveResolveEngine.party.forEach((member, index) => {
  member.bindTurns = index === 0 ? 0 : 1;
});
passiveResolveEngine.party[0].attack = 100_000;
passiveResolveEngine.comboCount = 1;
passiveResolveEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
passiveResolveEngine.resolvePlayerTurn();
assert.equal(passiveResolveEngine.enemies[0].hp, 1);
passiveResolveEngine.comboCount = 1;
passiveResolveEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
passiveResolveEngine.resolvePlayerTurn();
assert.equal(passiveResolveEngine.enemies[0].hp, 0);
passiveResolveEngine.setEnemyAiDefinitionPool(0, null, []);
assert.equal(passiveResolveEngine.enemies[0].resolveThresholdPercent, 0);
const belowResolveEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: resolveMonsterDefinition,
    skillDefinitions: [enemyAiResolveDefinition],
  }],
});
belowResolveEngine.enemies[0].hp = 45_999;
belowResolveEngine.enemies[1].hp = 0;
belowResolveEngine.party.forEach((member, index) => {
  member.bindTurns = index === 0 ? 0 : 2;
});
belowResolveEngine.party[0].attack = 100_000;
belowResolveEngine.comboCount = 1;
belowResolveEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
belowResolveEngine.resolvePlayerTurn();
assert.equal(belowResolveEngine.enemies[0].hp, 0);
const damageShieldMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(damageShieldMonsterDefinition.buffer).setUint32(0xec, 9_053, true);
const selectedDamageShieldEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: damageShieldMonsterDefinition,
    skillDefinitions: [enemyAiDamageShieldDefinition],
  }],
});
selectedDamageShieldEngine.setRngState(21_900);
selectedDamageShieldEngine.enemies[0].counter = 1;
selectedDamageShieldEngine.enemies[1].counter = 99;
selectedDamageShieldEngine.resolveEnemyTurn();
assert.equal(selectedDamageShieldEngine.snapshot().lastEnemyActions[0].skill.type, 74);
assert.equal(selectedDamageShieldEngine.enemies[0].damageShieldTurns, 3);
assert.equal(selectedDamageShieldEngine.enemies[0].damageShieldPercent, 50);
assert.equal(selectedDamageShieldEngine.rng.state, padLcgStep(21_900).state);
const activeDamageShieldRng = selectedDamageShieldEngine.rng.state;
assert.equal(selectedDamageShieldEngine.takeEnemySkill(0), null);
assert.equal(selectedDamageShieldEngine.rng.state, activeDamageShieldRng);
selectedDamageShieldEngine.enemies[0].counter = 99;
selectedDamageShieldEngine.resolveEnemyTurn();
assert.equal(selectedDamageShieldEngine.enemies[0].damageShieldTurns, 2);
const damageShieldCombatEngine = new PuzzleEngine({ seed: 21_900 });
damageShieldCombatEngine.enemies[0].damageShieldTurns = 3;
damageShieldCombatEngine.enemies[0].damageShieldPercent = 50;
damageShieldCombatEngine.enemies[1].hp = 0;
damageShieldCombatEngine.comboCount = 1;
damageShieldCombatEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
damageShieldCombatEngine.resolvePlayerTurn();
assert.equal(damageShieldCombatEngine.lastDamage, 1_974);
assert.equal(
  damageShieldCombatEngine.enemies[0].hp,
  damageShieldCombatEngine.enemies[0].maxHp - 1_974,
);
assert.equal(damageShieldCombatEngine.snapshot().enemies[0].damageShieldPercent, 50);
const shieldBeforeVoidEngine = new PuzzleEngine({ seed: 21_900 });
shieldBeforeVoidEngine.enemies[0].damageShieldTurns = 3;
shieldBeforeVoidEngine.enemies[0].damageShieldPercent = 50;
shieldBeforeVoidEngine.enemies[0].damageVoidTurns = 3;
shieldBeforeVoidEngine.enemies[0].damageVoidThreshold = 3_000;
shieldBeforeVoidEngine.enemies[1].hp = 0;
shieldBeforeVoidEngine.comboCount = 1;
shieldBeforeVoidEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
shieldBeforeVoidEngine.resolvePlayerTurn();
assert.equal(shieldBeforeVoidEngine.lastDamage, 1_974);
assert.equal(shieldBeforeVoidEngine.lastVoidedDamage, 0);
const leaderSwapMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(leaderSwapMonsterDefinition.buffer).setUint32(0xec, 9_054, true);
const selectedLeaderSwapEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: leaderSwapMonsterDefinition,
    skillDefinitions: [enemyAiLeaderSwapDefinition],
  }],
});
const noLeaderSwapCandidateEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: leaderSwapMonsterDefinition,
    skillDefinitions: [enemyAiLeaderSwapDefinition],
  }],
});
noLeaderSwapCandidateEngine.party.slice(1, 5).forEach((member) => {
  member.present = false;
});
noLeaderSwapCandidateEngine.setRngState(21_900);
assert.equal(noLeaderSwapCandidateEngine.takeEnemySkill(0), null);
assert.equal(noLeaderSwapCandidateEngine.rng.state, 21_900);
selectedLeaderSwapEngine.setRngState(21_900);
selectedLeaderSwapEngine.enemies[0].counter = 1;
selectedLeaderSwapEngine.enemies[1].counter = 99;
selectedLeaderSwapEngine.resolveEnemyTurn();
const selectedLeaderSwapState = selectedLeaderSwapEngine.snapshot();
assert.equal(selectedLeaderSwapState.lastEnemyActions[0].skill.type, 75);
assert.equal(selectedLeaderSwapState.lastEnemyActions[0].skill.selectedPartyIndex, 4);
assert.equal(selectedLeaderSwapState.leaderSwapTurns, 3);
assert.equal(selectedLeaderSwapState.leaderSwapIndex, 4);
assert.deepEqual(selectedLeaderSwapState.party.map(({ id }) => id), [
  'nyx', 'marina', 'briar', 'sol', 'ember', 'helper',
]);
assert.equal(
  selectedLeaderSwapEngine.rng.state,
  padLcgStep(padLcgStep(21_900).state).state,
);
const activeLeaderSwapRng = selectedLeaderSwapEngine.rng.state;
assert.equal(selectedLeaderSwapEngine.takeEnemySkill(0), null);
assert.equal(selectedLeaderSwapEngine.rng.state, activeLeaderSwapRng);
selectedLeaderSwapEngine.enemies[0].counter = 99;
selectedLeaderSwapEngine.resolveEnemyTurn();
assert.equal(selectedLeaderSwapEngine.leaderSwapTurns, 2);
selectedLeaderSwapEngine.comboCount = 7;
selectedLeaderSwapEngine.turnMatches = [];
selectedLeaderSwapEngine.resolvePlayerTurn();
assert.equal(selectedLeaderSwapEngine.lastLeaderMultiplier, 3.5);
selectedLeaderSwapEngine.resolveEnemyTurn();
selectedLeaderSwapEngine.resolveEnemyTurn();
assert.equal(selectedLeaderSwapEngine.leaderSwapTurns, 0);
assert.equal(selectedLeaderSwapEngine.leaderSwapIndex, null);
assert.deepEqual(selectedLeaderSwapEngine.party.map(({ id }) => id), [
  'ember', 'marina', 'briar', 'sol', 'nyx', 'helper',
]);
const normalAttackMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(normalAttackMonsterDefinition.buffer).setUint32(0xec, 9_060, true);
const selectedNormalAttackEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: normalAttackMonsterDefinition,
    skillDefinitions: [enemyAiNormalAttackDefinition],
  }],
});
selectedNormalAttackEngine.setRngState(21_900);
selectedNormalAttackEngine.enemies[0].counter = 1;
selectedNormalAttackEngine.enemies[1].counter = 99;
selectedNormalAttackEngine.resolveEnemyTurn();
const selectedNormalAttackState = selectedNormalAttackEngine.snapshot();
assert.equal(selectedNormalAttackState.lastEnemyActions[0].skill.type, 82);
assert.equal(selectedNormalAttackState.lastEnemyActions[0].damage, 1_850);
assert.equal(selectedNormalAttackState.player.hp, 10_150);
assert.equal(selectedNormalAttackState.rngState, padLcgStep(21_900).state);
assert.equal(selectedNormalAttackState.enemies[0].enemyAiBudget, 80);
const multiAttackMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(multiAttackMonsterDefinition.buffer).setUint32(0xec, 9_061, true);
const selectedMultiAttackEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: multiAttackMonsterDefinition,
    skillDefinitions: [
      enemyAiMultiAttackDefinition,
      enemyAiMultiInactivityDefinition,
      enemyAiMultiGravityDefinition,
      enemyAiMultiNormalDefinition,
    ],
  }],
});
selectedMultiAttackEngine.setRngState(21_900);
selectedMultiAttackEngine.enemies[0].counter = 1;
selectedMultiAttackEngine.enemies[1].counter = 99;
selectedMultiAttackEngine.resolveEnemyTurn();
const selectedMultiAttackState = selectedMultiAttackEngine.snapshot();
assert.deepEqual(
  selectedMultiAttackState.lastEnemyActions.map(({ skill }) => skill.type),
  [66, 50, 82],
);
assert.deepEqual(
  selectedMultiAttackState.lastEnemyActions.map(({ skill }) => skill.multiAttackCursor),
  [0, 1, 2],
);
assert.equal(selectedMultiAttackState.lastEnemyActions[0].damage, undefined);
assert.equal(selectedMultiAttackState.lastEnemyActions[1].damage, 3_000);
assert.equal(selectedMultiAttackState.lastEnemyActions[2].damage, 1_850);
assert.equal(selectedMultiAttackState.player.hp, 7_150);
assert.equal(selectedMultiAttackState.rngState, padLcgStep(21_900).state);
assert.equal(selectedMultiAttackState.enemies[0].enemyAiBudget, 80);
assert.equal(selectedMultiAttackEngine.enemyAiPools[0].multiAttack, null);

const rejectedMultiAttackDefinition = enemyAiMultiAttackDefinition.slice();
const rejectedMultiAttackView = new DataView(rejectedMultiAttackDefinition.buffer);
rejectedMultiAttackView.setUint32(0x00, 9_065, true);
rejectedMultiAttackView.setInt32(0x10, 9_029, true);
rejectedMultiAttackView.setInt32(0x14, 9_063, true);
rejectedMultiAttackView.setInt32(0x18, 0, true);
const rejectedMultiAttackMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(rejectedMultiAttackMonsterDefinition.buffer).setUint32(0xec, 9_065, true);
const rejectedMultiAttackEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: rejectedMultiAttackMonsterDefinition,
    skillDefinitions: [
      rejectedMultiAttackDefinition,
      enemyAiStatusShieldDefinition,
      enemyAiMultiGravityDefinition,
    ],
  }],
});
rejectedMultiAttackEngine.enemies[0].statusShieldTurns = 2;
rejectedMultiAttackEngine.setRngState(21_900);
rejectedMultiAttackEngine.enemies[0].counter = 1;
rejectedMultiAttackEngine.enemies[1].counter = 99;
rejectedMultiAttackEngine.resolveEnemyTurn();
const rejectedMultiAttackState = rejectedMultiAttackEngine.snapshot();
assert.equal(rejectedMultiAttackState.lastEnemyActions.length, 1);
assert.equal(rejectedMultiAttackState.lastEnemyActions[0].skill.type, 82);
assert.equal(rejectedMultiAttackState.lastEnemyActions[0].skill.rejectedChildSkillId, 9_029);
assert.equal(rejectedMultiAttackState.lastEnemyActions[0].damage, 1_850);
assert.equal(rejectedMultiAttackState.player.hp, 10_150);
assert.equal(rejectedMultiAttackEngine.enemyAiPools[0].multiAttack, null);

const missingMultiAttackDefinition = enemyAiMultiAttackDefinition.slice();
const missingMultiAttackView = new DataView(missingMultiAttackDefinition.buffer);
missingMultiAttackView.setUint32(0x00, 9_066, true);
missingMultiAttackView.setInt32(0x10, 99_999, true);
missingMultiAttackView.setInt32(0x14, 0, true);
const missingMultiAttackMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(missingMultiAttackMonsterDefinition.buffer).setUint32(0xec, 9_066, true);
const missingMultiAttackEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: missingMultiAttackMonsterDefinition,
    skillDefinitions: [missingMultiAttackDefinition],
  }],
});
missingMultiAttackEngine.setRngState(21_900);
missingMultiAttackEngine.enemies[0].counter = 1;
missingMultiAttackEngine.enemies[1].counter = 99;
missingMultiAttackEngine.resolveEnemyTurn();
assert.equal(missingMultiAttackEngine.snapshot().lastEnemyActions.length, 0);
assert.equal(missingMultiAttackEngine.player.hp, 12_000);
assert.equal(missingMultiAttackEngine.enemyAiPools[0].multiAttack, null);
const comboAbsorbMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(comboAbsorbMonsterDefinition.buffer).setUint32(0xec, 9_046, true);
const selectedComboAbsorbEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: comboAbsorbMonsterDefinition,
    skillDefinitions: [enemyAiComboAbsorbDefinition],
  }],
});
selectedComboAbsorbEngine.setRngState(21_900);
selectedComboAbsorbEngine.enemies[0].counter = 1;
selectedComboAbsorbEngine.enemies[1].counter = 99;
selectedComboAbsorbEngine.resolveEnemyTurn();
const selectedComboAbsorbState = selectedComboAbsorbEngine.snapshot();
assert.equal(selectedComboAbsorbState.lastEnemyActions[0].skill.type, 67);
assert.equal(selectedComboAbsorbState.enemies[0].comboAbsorbTurns, 4);
assert.equal(selectedComboAbsorbState.enemies[0].comboAbsorbThreshold, 3);
assert.equal(selectedComboAbsorbState.player.hp, 12_000);
assert.equal(
  selectedComboAbsorbState.rngState,
  padLcgStep(padLcgStep(21_900).state).state,
);
const rejectedComboAbsorbEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: comboAbsorbMonsterDefinition,
    skillDefinitions: [enemyAiComboAbsorbDefinition],
  }],
});
rejectedComboAbsorbEngine.enemies[0].comboAbsorbTurns = 1;
rejectedComboAbsorbEngine.setRngState(21_900);
assert.equal(rejectedComboAbsorbEngine.takeEnemySkill(0), null);
assert.equal(rejectedComboAbsorbEngine.rng.state, 21_900);
const comboAbsorbDamageEngine = new PuzzleEngine({ seed: 21_900 });
comboAbsorbDamageEngine.enemies[0].hp = 50_000;
comboAbsorbDamageEngine.enemies[0].comboAbsorbTurns = 2;
comboAbsorbDamageEngine.enemies[0].comboAbsorbThreshold = 3;
comboAbsorbDamageEngine.enemies[1].hp = 0;
comboAbsorbDamageEngine.comboCount = 3;
comboAbsorbDamageEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
comboAbsorbDamageEngine.resolvePlayerTurn();
assert.equal(comboAbsorbDamageEngine.lastDamage, 0);
assert.ok(comboAbsorbDamageEngine.lastAbsorbedDamage > 0);
assert.ok(comboAbsorbDamageEngine.enemies[0].hp > 50_000);
comboAbsorbDamageEngine.enemies[0].hp = 50_000;
comboAbsorbDamageEngine.comboCount = 4;
comboAbsorbDamageEngine.turnMatches = [{ type: 'fire', size: 3, enhancedCount: 0 }];
comboAbsorbDamageEngine.resolvePlayerTurn();
assert.ok(comboAbsorbDamageEngine.lastDamage > 0);
assert.equal(comboAbsorbDamageEngine.lastAbsorbedDamage, 0);
assert.ok(comboAbsorbDamageEngine.enemies[0].hp < 50_000);
const skyfallRateMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(skyfallRateMonsterDefinition.buffer).setUint32(0xec, 9_047, true);
const selectedSkyfallRateEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: skyfallRateMonsterDefinition,
    skillDefinitions: [enemyAiSkyfallRateDefinition],
  }],
});
selectedSkyfallRateEngine.setRngState(21_900);
selectedSkyfallRateEngine.enemies[0].counter = 1;
selectedSkyfallRateEngine.enemies[1].counter = 99;
selectedSkyfallRateEngine.resolveEnemyTurn();
const selectedSkyfallRateState = selectedSkyfallRateEngine.snapshot();
assert.equal(selectedSkyfallRateState.lastEnemyActions[0].skill.type, 68);
assert.deepEqual(selectedSkyfallRateState.skyfallRateRules, {
  natural: { typeMask: 0x01, chancePercent: 25, turnsRemaining: 4 },
  hazard: { typeMask: 0x80, chancePercent: 25, turnsRemaining: 4 },
});
assert.equal(selectedSkyfallRateState.dropRates[0], 0.25);
assert.equal(selectedSkyfallRateState.dropRates[7], 0.25);
assert.equal(
  selectedSkyfallRateState.rngState,
  padLcgStep(padLcgStep(21_900).state).state,
);
selectedSkyfallRateEngine.setRngState(21_900);
assert.equal(selectedSkyfallRateEngine.takeEnemySkill(0), null);
assert.equal(selectedSkyfallRateEngine.rng.state, 21_900);
selectedSkyfallRateEngine.enemyAiPools[0].definitions = new Map([[
  9_047,
  {
    ...decodePadEnemyAiSkillDefinition(enemyAiSkyfallRateDefinition),
    effect: {
      ...decodePadEnemyAiSkillDefinition(enemyAiSkyfallRateDefinition).effect,
      typeMask: 0x82,
    },
  },
]]);
selectedSkyfallRateEngine.setRngState(21_900);
const replacementSkyfallRate = selectedSkyfallRateEngine.takeEnemySkill(0);
assert.equal(replacementSkyfallRate.typeMask, 0x82);
assert.equal(replacementSkyfallRate.durationTurns, 4);
assert.equal(
  selectedSkyfallRateEngine.rng.state,
  padLcgStep(padLcgStep(21_900).state).state,
);
selectedSkyfallRateEngine.skyfallRateRules.natural.turnsRemaining = 1;
selectedSkyfallRateEngine.skyfallRateRules.hazard.turnsRemaining = 1;
selectedSkyfallRateEngine.enemies[0].counter = 99;
selectedSkyfallRateEngine.resolveEnemyTurn();
assert.deepEqual(selectedSkyfallRateEngine.skyfallRateRules, {
  natural: null,
  hazard: null,
});
assert.deepEqual(selectedSkyfallRateEngine.dropRates, Array(10).fill(0));
const bindLeaderHelperMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(bindLeaderHelperMonsterDefinition.buffer).setUint32(0xec, 9_020, true);
const selectedBindLeaderHelperEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: bindLeaderHelperMonsterDefinition,
    skillDefinitions: [enemyAiBindLeaderHelperDefinition],
  }],
});
selectedBindLeaderHelperEngine.setRngState(21_900);
selectedBindLeaderHelperEngine.enemies[0].counter = 1;
selectedBindLeaderHelperEngine.enemies[1].counter = 99;
selectedBindLeaderHelperEngine.resolveEnemyTurn();
const selectedBindLeaderHelperState = selectedBindLeaderHelperEngine.snapshot();
assert.equal(selectedBindLeaderHelperState.lastEnemyActions[0].skill.type, 54);
assert.equal(selectedBindLeaderHelperState.lastEnemyActions[0].skill.skillId, 9_020);
assert.equal(selectedBindLeaderHelperState.lastEnemyActions[0].skill.targetMask, 0x21);
assert.equal(selectedBindLeaderHelperState.lastEnemyActions[0].skill.setupDurationTurns, 4);
assert.equal(selectedBindLeaderHelperState.lastEnemySkill.durationTurns, 3);
assert.equal(selectedBindLeaderHelperState.lastEnemySkill.boundMask, 0x21);
assert.equal(selectedBindLeaderHelperState.lastEnemySkill.resistedMask, 0);
assert.equal(selectedBindLeaderHelperState.party[0].bindTurns, 3);
assert.equal(selectedBindLeaderHelperState.party[5].bindTurns, 3);
assert.equal(selectedBindLeaderHelperState.enemies[0].enemyAiBudget, 80);
assert.equal(
  selectedBindLeaderHelperEngine.rng.state,
  padLcgStep(padLcgStep(padLcgStep(21_900).state).state).state,
);
const rejectedBindLeaderHelperEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: bindLeaderHelperMonsterDefinition,
    skillDefinitions: [enemyAiBindLeaderHelperDefinition],
  }],
});
rejectedBindLeaderHelperEngine.party[0].bindTurns = 1;
rejectedBindLeaderHelperEngine.party[5].bindTurns = 1;
rejectedBindLeaderHelperEngine.setRngState(21_900);
assert.equal(rejectedBindLeaderHelperEngine.takeEnemySkill(0), null);
assert.equal(rejectedBindLeaderHelperEngine.rng.state, 21_900);
const resistedBindLeaderHelperEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: bindLeaderHelperMonsterDefinition,
    skillDefinitions: [enemyAiBindLeaderHelperDefinition],
  }],
});
resistedBindLeaderHelperEngine.party[0].bindResist = true;
resistedBindLeaderHelperEngine.setRngState(21_900);
resistedBindLeaderHelperEngine.enemies[0].counter = 1;
resistedBindLeaderHelperEngine.enemies[1].counter = 99;
resistedBindLeaderHelperEngine.resolveEnemyTurn();
const resistedBindLeaderHelperState = resistedBindLeaderHelperEngine.snapshot();
assert.equal(resistedBindLeaderHelperState.lastEnemySkill.durationTurns, 3);
assert.equal(resistedBindLeaderHelperState.lastEnemySkill.boundMask, 0x20);
assert.equal(resistedBindLeaderHelperState.lastEnemySkill.resistedMask, 0x01);
assert.equal(resistedBindLeaderHelperState.party[0].bindTurns, 0);
assert.equal(resistedBindLeaderHelperState.party[5].bindTurns, 3);
assert.equal(
  resistedBindLeaderHelperEngine.rng.state,
  padLcgStep(padLcgStep(padLcgStep(padLcgStep(21_900).state).state).state).state,
);
const extendedBindEngine = new PuzzleEngine({ seed: 21_900 });
extendedBindEngine.party[0].bindTurns = 98;
const extendedBindRngState = extendedBindEngine.rng.state;
assert.deepEqual(extendedBindEngine.doBind(1, 3), {
  boundMask: 1,
  resistedMask: 0,
  durationTurns: 3,
});
assert.equal(extendedBindEngine.party[0].bindTurns, 99);
assert.equal(extendedBindEngine.rng.state, extendedBindRngState);
const bindTurnEngine = new PuzzleEngine({ seed: 21_900 });
bindTurnEngine.party[0].bindTurns = 2;
bindTurnEngine.party[5].bindTurns = 2;
bindTurnEngine.comboCount = 4;
bindTurnEngine.turnMatches = [];
bindTurnEngine.resolvePlayerTurn();
assert.equal(bindTurnEngine.lastLeaderMultiplier, 1);
assert.equal(bindTurnEngine.party[0].bindTurns, 1);
assert.equal(bindTurnEngine.party[5].bindTurns, 1);
const attributeAbsorbMonsterDefinition = enemyAiMonsterDefinition.slice();
new DataView(attributeAbsorbMonsterDefinition.buffer).setUint32(0xec, 9_021, true);
const selectedAttributeAbsorbEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: attributeAbsorbMonsterDefinition,
    skillDefinitions: [enemyAiAttributeAbsorbDefinition],
  }],
});
selectedAttributeAbsorbEngine.setRngState(21_900);
selectedAttributeAbsorbEngine.enemies[0].counter = 1;
selectedAttributeAbsorbEngine.enemies[1].counter = 99;
selectedAttributeAbsorbEngine.resolveEnemyTurn();
const selectedAttributeAbsorbState = selectedAttributeAbsorbEngine.snapshot();
assert.equal(selectedAttributeAbsorbState.lastEnemyActions[0].skill.type, 53);
assert.equal(selectedAttributeAbsorbState.lastEnemyActions[0].skill.skillId, 9_021);
assert.equal(selectedAttributeAbsorbState.lastEnemyActions[0].skill.durationTurns, 4);
assert.equal(selectedAttributeAbsorbState.enemies[0].attributeAbsorbTurns, 4);
assert.equal(selectedAttributeAbsorbState.enemies[0].attributeAbsorbMask, 0x03);
assert.equal(selectedAttributeAbsorbState.enemies[0].enemyAiBudget, 80);
assert.equal(
  selectedAttributeAbsorbEngine.rng.state,
  padLcgStep(padLcgStep(21_900).state).state,
);
const rejectedAttributeAbsorbEngine = new PuzzleEngine({
  seed: 21_900,
  enemyAiPools: [{
    monsterDefinition: attributeAbsorbMonsterDefinition,
    skillDefinitions: [enemyAiAttributeAbsorbDefinition],
  }],
});
rejectedAttributeAbsorbEngine.enemies[0].attributeAbsorbTurns = 1;
rejectedAttributeAbsorbEngine.setRngState(21_900);
assert.equal(rejectedAttributeAbsorbEngine.takeEnemySkill(0), null);
assert.equal(rejectedAttributeAbsorbEngine.rng.state, 21_900);
const attributeAbsorbDamageEngine = new PuzzleEngine({ seed: 21_900 });
attributeAbsorbDamageEngine.enemies[0].hp = 50_000;
attributeAbsorbDamageEngine.enemies[0].attributeAbsorbTurns = 2;
attributeAbsorbDamageEngine.enemies[0].attributeAbsorbMask = 1 << 0;
attributeAbsorbDamageEngine.enemies[1].hp = 0;
attributeAbsorbDamageEngine.comboCount = 1;
attributeAbsorbDamageEngine.turnMatches = [{
  type: 'fire', size: 3, enhancedCount: 0, enhancementMultiplier: 1, isMassAttack: false,
}];
attributeAbsorbDamageEngine.resolvePlayerTurn();
assert.equal(attributeAbsorbDamageEngine.lastDamage, 0);
assert.ok(attributeAbsorbDamageEngine.lastAbsorbedDamage > 0);
assert.ok(attributeAbsorbDamageEngine.enemies[0].hp > 50_000);
assert.equal(attributeAbsorbDamageEngine.enemies[0].attributeAbsorbTurns, 2);
attributeAbsorbDamageEngine.enemies[0].counter = 99;
attributeAbsorbDamageEngine.resolveEnemyTurn();
assert.equal(attributeAbsorbDamageEngine.enemies[0].attributeAbsorbTurns, 1);
const poisonFamilySwapEngine = new PuzzleEngine({ seed: 21_900 });
poisonFamilySwapEngine.setBoardFromCodes([
  'PMBBBB', 'BBBBBB', 'BBBBBB', 'BBBBBB', 'BBBBBB',
]);
poisonFamilySwapEngine.setOrbState(0, 1, { locked: true });
const poisonFamilySwapSeed = poisonFamilySwapEngine.rng.state;
assert.equal(poisonFamilySwapEngine.doBlockSwap(8, 0), 1);
assert.equal(poisonFamilySwapEngine.board[0][0].type, 'fire');
assert.equal(poisonFamilySwapEngine.board[0][1].type, 'mortalPoison');
assert.equal(poisonFamilySwapEngine.rng.state, poisonFamilySwapSeed);
assert.equal(blackFallEngine.board[0][0].nail, false);

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
assert.equal(padNativeRecoveryPower([100], [{ size: 3, enhancedCount: 0 }], 3, 0.5, 0.5), 100);
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
assert.equal(padNailDamage(92_000, 2), 1_840);
assert.equal(padNailDamage(50, 1), 1);
assert.equal(padNailDamage(150, 1), 2);
assert.equal(padNailDamage(92_000, 0), 0);
assert.equal(padAttributeMultiplier('fire', 'wood'), 2);
assert.equal(padAttributeMultiplier('fire', 'water'), 0.5);
assert.equal(padAttributeMultiplier('light', 'dark'), 2);
assert.equal(padAttributeMultiplier('light', 'fire'), 1);

const nailDamageEngine = new PuzzleEngine({ seed: 21_900 });
nailDamageEngine.turnMatches = [{
  type: 'heart',
  size: 3,
  enhancedCount: 0,
  enhancementMultiplier: 1,
}];
nailDamageEngine.turnNailCount = 2;
nailDamageEngine.comboCount = 1;
nailDamageEngine.resolvePlayerTurn();
assert.equal(nailDamageEngine.lastNailDamage, 3_360);
assert.equal(nailDamageEngine.lastDamage, 3_360);
assert.deepEqual(nailDamageEngine.enemies.map((enemy) => enemy.hp), [90_160, 74_480]);
assert.equal(nailDamageEngine.floatingText.filter((item) => item.kind === 'nail').length, 2);

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
