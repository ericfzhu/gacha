import { padLcgStep } from './padCoreRules.js';
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
  PAD_ENEMY_SKILL_ADDITIONAL_ATTACK,
  PAD_ENEMY_SKILL_DEFENSE_BOOST,
  PAD_ENEMY_SKILL_ATTRIBUTE_NULLIFY,
  PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY,
  PAD_ENEMY_SKILL_SOURCE_TO_JAMMER,
  PAD_ENEMY_SKILL_RANDOM_PARTY_BIND,
  PAD_ENEMY_SKILL_ACTIVE_SKILL_SEAL,
  PAD_ENEMY_SKILL_REPEAT_ATTACK,
  PAD_ENEMY_SKILL_INACTIVITY,
  PAD_ENEMY_SKILL_INACTIVITY_UNCONDITIONAL,
  PAD_ENEMY_SKILL_COMBO_ABSORB,
  PAD_ENEMY_SKILL_SKYFALL_RATE,
  PAD_ENEMY_SKILL_INACTIVITY_PRESENTATION,
  PAD_ENEMY_SKILL_DAMAGE_VOID,
  PAD_ENEMY_SKILL_DAMAGE_SHIELD,
  PAD_ENEMY_SKILL_DAMAGE_IMMUNITY,
  PAD_ENEMY_SKILL_DAMAGE_IMMUNITY_ALT,
  PAD_ENEMY_SKILL_DAMAGE_IMMUNITY_OFF,
  PAD_ENEMY_SKILL_REMAINING_ENEMIES_TURN_CHANGE,
  PAD_ENEMY_SKILL_NO_SKYFALL,
  PAD_ENEMY_SKILL_LEADER_SWAP,
  PAD_ENEMY_SKILL_LEADER_ALTER,
  PAD_ENEMY_SKILL_NORMAL_ATTACK,
  PAD_ENEMY_SKILL_LONE_ATTACK_BOOST,
  PAD_ENEMY_SKILL_STATUS_TRIGGERED_ATTACK_BOOST,
  PAD_ENEMY_SKILL_DAMAGED_TURN_ATTACK_BOOST,
  PAD_ENEMY_SKILL_STATUS_SHIELD,
  PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION,
  PAD_ENEMY_SKILL_SELF_DESTRUCT,
  PAD_ENEMY_SKILL_CHANGE_ATTRIBUTE,
  PAD_ENEMY_SKILL_SCALED_ATTACK,
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
  PAD_ENEMY_SKILL_MULTI_ATTACK,
  PAD_ENEMY_SKILL_POISON_MASK_SWAP,
  PAD_ENEMY_SKILL_POISON_MASK_SWAP_DIRECT,
  PAD_ENEMY_SKILL_BLOCK_MINUS,
  PAD_ENEMY_SKILL_BUR_DROP,
  decodePadEnemySkillDefinition,
  padEnemySkillAttributeCandidates,
  padEnemySkillPlayerHpCondition,
  padEnemySkillMaxHpParameter,
} from './padEnemySkills.js';

export const PAD_ENEMY_AI_MONSTER_LAYOUT = Object.freeze({
  modeFlagsOffset: 0xe0,
  budgetCapOffset: 0xe2,
  budgetRegenOffset: 0xe4,
  legacyScaleOffset: 0xe6,
  slotsOffset: 0xec,
  slotStride: 8,
  slotCount: 64,
  slotSkillIdOffset: 0,
  slotImmediateChanceOffset: 4,
  slotFallbackWeightOffset: 5,
});

export const PAD_ENEMY_AI_SKILL_LAYOUT = Object.freeze({
  skillIdOffset: 0x00,
  immediateFactor0Offset: 0x30,
  immediateFactor1Offset: 0x34,
  hpThresholdPercentOffset: 0x38,
  // The legacy selector masks this signed field with 0x3fff and uses bit
  // 0x4000 to choose whether the resulting ratio is inverted.  The native
  // parser does not expose a semantic name for the operand, so keep the
  // evidence-bounded "condition" wording in the browser API.
  legacyConditionValueOffset: 0x3c,
  budgetCostOffset: 0x40,
});

function asBytes(value, label) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  throw new TypeError(`${label} must be an ArrayBuffer or typed-array view.`);
}

function requireLength(bytes, minimum, label) {
  if (bytes.byteLength < minimum) {
    throw new RangeError(`${label} requires at least ${minimum} bytes; received ${bytes.byteLength}.`);
  }
}

export function decodePadEnemyAiMonsterDefinition(monsterDefinition) {
  const bytes = asBytes(monsterDefinition, 'PAD enemy AI monster definition');
  const { slotsOffset, slotStride, slotCount } = PAD_ENEMY_AI_MONSTER_LAYOUT;
  requireLength(bytes, slotsOffset + slotStride * slotCount, 'PAD enemy AI monster definition');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const slots = [];
  for (let index = 0; index < slotCount; index += 1) {
    const offset = slotsOffset + index * slotStride;
    const skillId = view.getUint32(offset + PAD_ENEMY_AI_MONSTER_LAYOUT.slotSkillIdOffset, true);
    if (skillId === 0) continue;
    slots.push(Object.freeze({
      index,
      skillId,
      immediateChance: view.getUint8(
        offset + PAD_ENEMY_AI_MONSTER_LAYOUT.slotImmediateChanceOffset,
      ),
      fallbackWeight: view.getUint8(
        offset + PAD_ENEMY_AI_MONSTER_LAYOUT.slotFallbackWeightOffset,
      ),
    }));
  }
  return Object.freeze({
    usesNewAi: (view.getUint8(PAD_ENEMY_AI_MONSTER_LAYOUT.modeFlagsOffset) & 1) !== 0,
    budgetCap: Math.max(0, view.getInt16(PAD_ENEMY_AI_MONSTER_LAYOUT.budgetCapOffset, true)),
    budgetRegen: view.getInt16(PAD_ENEMY_AI_MONSTER_LAYOUT.budgetRegenOffset, true),
    legacyScale: view.getInt16(PAD_ENEMY_AI_MONSTER_LAYOUT.legacyScaleOffset, true),
    slots: Object.freeze(slots),
  });
}

export function decodePadEnemyAiSkillDefinition(skillDefinition) {
  const bytes = asBytes(skillDefinition, 'PAD enemy AI skill definition');
  requireLength(bytes, 0x48, 'PAD enemy AI skill definition');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Object.freeze({
    skillId: view.getUint32(PAD_ENEMY_AI_SKILL_LAYOUT.skillIdOffset, true),
    immediateFactor0: view.getInt32(PAD_ENEMY_AI_SKILL_LAYOUT.immediateFactor0Offset, true),
    immediateFactor1: view.getInt32(PAD_ENEMY_AI_SKILL_LAYOUT.immediateFactor1Offset, true),
    hpThresholdPercent: view.getInt32(
      PAD_ENEMY_AI_SKILL_LAYOUT.hpThresholdPercentOffset,
      true,
    ),
    legacyConditionValue: view.getInt32(
      PAD_ENEMY_AI_SKILL_LAYOUT.legacyConditionValueOffset,
      true,
    ),
    legacyConditionMode: (
      view.getUint32(PAD_ENEMY_AI_SKILL_LAYOUT.legacyConditionValueOffset, true) & 0x4000
    ) !== 0,
    budgetCost: view.getInt32(PAD_ENEMY_AI_SKILL_LAYOUT.budgetCostOffset, true),
    effect: decodePadEnemySkillDefinition(bytes),
  });
}

function normalizeDefinitionMap(definitions) {
  const records = definitions instanceof Map ? [...definitions.values()] : definitions;
  if (!Array.isArray(records)) throw new TypeError('PAD enemy AI skill definitions must be an array or Map.');
  return new Map(records.map((record) => {
    const decoded = record?.effect ? record : decodePadEnemyAiSkillDefinition(record);
    return [decoded.skillId, decoded];
  }));
}

const PAD_SUPPORTED_ENEMY_AI_TYPES = Object.freeze([
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
    PAD_ENEMY_SKILL_ADDITIONAL_ATTACK,
    PAD_ENEMY_SKILL_DEFENSE_BOOST,
    PAD_ENEMY_SKILL_ATTRIBUTE_NULLIFY,
    PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY,
    PAD_ENEMY_SKILL_SOURCE_TO_JAMMER,
    PAD_ENEMY_SKILL_RANDOM_PARTY_BIND,
    PAD_ENEMY_SKILL_ACTIVE_SKILL_SEAL,
    PAD_ENEMY_SKILL_REPEAT_ATTACK,
    PAD_ENEMY_SKILL_INACTIVITY,
    PAD_ENEMY_SKILL_INACTIVITY_UNCONDITIONAL,
    PAD_ENEMY_SKILL_COMBO_ABSORB,
    PAD_ENEMY_SKILL_SKYFALL_RATE,
    PAD_ENEMY_SKILL_INACTIVITY_PRESENTATION,
    PAD_ENEMY_SKILL_DAMAGE_VOID,
    PAD_ENEMY_SKILL_DAMAGE_SHIELD,
    PAD_ENEMY_SKILL_DAMAGE_IMMUNITY,
    PAD_ENEMY_SKILL_DAMAGE_IMMUNITY_ALT,
    PAD_ENEMY_SKILL_DAMAGE_IMMUNITY_OFF,
    PAD_ENEMY_SKILL_REMAINING_ENEMIES_TURN_CHANGE,
    PAD_ENEMY_SKILL_NO_SKYFALL,
    PAD_ENEMY_SKILL_LEADER_SWAP,
    PAD_ENEMY_SKILL_LEADER_ALTER,
    PAD_ENEMY_SKILL_NORMAL_ATTACK,
    PAD_ENEMY_SKILL_LONE_ATTACK_BOOST,
    PAD_ENEMY_SKILL_STATUS_TRIGGERED_ATTACK_BOOST,
    PAD_ENEMY_SKILL_DAMAGED_TURN_ATTACK_BOOST,
    PAD_ENEMY_SKILL_STATUS_SHIELD,
    PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION,
    PAD_ENEMY_SKILL_SELF_DESTRUCT,
    PAD_ENEMY_SKILL_CHANGE_ATTRIBUTE,
    PAD_ENEMY_SKILL_SCALED_ATTACK,
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
    PAD_ENEMY_SKILL_MULTI_ATTACK,
    PAD_ENEMY_SKILL_POISON_MASK_SWAP,
    PAD_ENEMY_SKILL_POISON_MASK_SWAP_DIRECT,
    PAD_ENEMY_SKILL_BLOCK_MINUS,
    PAD_ENEMY_SKILL_BUR_DROP,
]);

function isSupportedDefinition(definition) {
  return Boolean(definition?.effect?.supported)
    && PAD_SUPPORTED_ENEMY_AI_TYPES.includes(definition.effect.type);
}

function isStaticallyEligible(definition, state) {
  if (!isSupportedDefinition(definition)) return false;
  if (definition.budgetCost > state.aiBudget) return false;
  const hpPercent = state.maxHp > 0 ? state.currentHp / state.maxHp * 100 : 0;
  return hpPercent <= definition.hpThresholdPercent;
}

function evaluateCondition(definition, state, rngState, applyStaticEligibility = true) {
  if (!(applyStaticEligibility
    ? isStaticallyEligible(definition, state)
    : isSupportedDefinition(definition))) {
    return { eligible: false, probabilityScale: 0, rngState };
  }
  // Passive records are installed by _checkPassiveSkills and share the native
  // always-false 0x61c01c action condition; they never enter the attack picker.
  if (definition.effect.passive) {
    return { eligible: false, probabilityScale: 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_BLACK_FALL) {
    const eligible = !state.blackFallActive;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_NO_SKYFALL) {
    // Native 0x61ba58 also gates on a monster-local presentation lane.  The
    // gameplay-visible part of that predicate is the protected global
    // no-skyfall counter: an already active counter rejects reapplication and
    // consumes no LCG state.
    const eligible = Math.max(0, Math.trunc(Number(state.noSkyfallTurns) || 0)) <= 0;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if ([PAD_ENEMY_SKILL_ENTIRE_BLIND, PAD_ENEMY_SKILL_ENTIRE_BLIND_ALT]
    .includes(definition.effect.type)) {
    // Type 5's 0x61b31c callback returns the binary32 visible-cell fraction.
    // Type 62's 0x61ae4c callback scans the same bit 0x4 but returns exactly
    // one whenever any cell is visible. Neither callback consumes RNG.
    const boardCellCount = Math.max(0, Math.trunc(Number(state.boardCellCount) || 0));
    const blackBlockCount = Math.max(
      0,
      Math.min(boardCellCount, Math.trunc(Number(state.blackBlockCount) || 0)),
    );
    const probabilityScale = definition.effect.type === PAD_ENEMY_SKILL_ENTIRE_BLIND_ALT
      ? Math.fround(Number(boardCellCount > blackBlockCount))
      : boardCellCount > 0
        ? Math.fround(Math.fround(1) - Math.fround(
          Math.fround(blackBlockCount) / Math.fround(boardCellCount),
        ))
        : Math.fround(0);
    return { eligible: probabilityScale > 0, probabilityScale, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_BIND_ATTACK) {
    const selector = Math.trunc(Number(definition.effect.targetSelector) || 0);
    const targetIndices = selector === 1
      ? [0]
      : selector === 2
        ? [5]
        : selector === 3
          ? [0, 5]
          : selector === 4
            ? [1, 2, 3, 4]
            : [0, 1, 2, 3, 4, 5];
    const eligible = targetIndices.some((index) => (
      state.party[index]?.present !== false
      && Number(state.party[index]?.bindTurns || 0) <= 0
    ));
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_RANDOM_SUB_BIND) {
    const eligible = [1, 2, 3, 4].some((index) => (
      state.party[index]?.present !== false
      && Number(state.party[index]?.bindTurns || 0) <= 0
    ));
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_CLEAR_PLAYER_BUFFS) {
    // Type 6's callback calls _getCountClearParams. For the two recovered
    // positive-player-status lanes represented by this engine, the native
    // helper returns their count as float32. An active +0x870 monster status
    // shield bypasses these lanes, so it also suppresses their probability.
    const clearableCount = state.enemyStatusShieldTurns > 0 ? 0 : (
      Number(state.playerAuxiliaryBuffTurns > 0)
      + Number(state.playerAttackBoostTurns > 0)
    );
    return {
      eligible: clearableCount > 0,
      probabilityScale: Math.fround(clearableCount),
      rngState,
    };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_HEAL_ENEMY) {
    // 0x61b418 compares signed player current HP with the low 32 bits of the
    // acting monster's protected int64 base attack, returning the incoming
    // scale unchanged on success and zero otherwise.
    const eligible = state.playerCurrentHp >= (state.enemyBaseAttack | 0);
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_HEAL_ENEMY_UNCONDITIONAL) {
    // Type 86 shares type 7's setup and execution handlers, but maps to the
    // unconditional 0x61a630 condition instead of the player-survival gate.
    return { eligible: true, probabilityScale: 1, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_DAMAGE_ABSORB) {
    // 0x61af94 admits only while protected signed-int16 sMONSTER+0x960 is < 1.
    const eligible = state.enemyDamageAbsorbTurns <= 0;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_AWAKENING_BIND) {
    // 0x61b56c shifts the packed low-ten-bit counter by six, sign-extends it,
    // and admits only values below 0x40. Ordinary durations are therefore
    // eligible only while the awakening-bind counter is zero.
    const eligible = state.awakeningBindTurns <= 0;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_SKILL_DELAY) {
    // Type 89 maps to the unconditional 0x61a630 callback. Setup can
    // materialize an all-zero target mask when no active skill has charge.
    return { eligible: true, probabilityScale: 1, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_PRESENCE_CHECK) {
    // In 21.9's new-AI tables type 90 points directly at the common epilogue,
    // which returns the incoming float32 scale without inspecting the list.
    return { eligible: true, probabilityScale: 1, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_NATIVE_NO_EFFECT) {
    // Type 93's 0x61bb1c callback clears an internal control slot and falls
    // through to the epilogue that returns the incoming float32 scale.
    return { eligible: true, probabilityScale: 1, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_ENEMY_ESCAPE) {
    // Type 95 points at the common epilogue and preserves its incoming scale.
    return { eligible: true, probabilityScale: 1, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_ADDITIONAL_ATTACK) {
    // 0x61b450 performs this division and izMathClipF entirely in binary32.
    const ratio = state.enemyBaseAttack > 0
      ? Math.fround(Math.fround(state.playerCurrentHp) / Math.fround(state.enemyBaseAttack))
      : state.playerCurrentHp > 0 ? 2 : 0;
    const probabilityScale = Math.fround(Math.min(2, Math.max(0, ratio)));
    return { eligible: probabilityScale > 0, probabilityScale, rngState };
  }
  if (
    definition.effect.type === PAD_ENEMY_SKILL_DEFENSE_BOOST
    || definition.effect.type === PAD_ENEMY_SKILL_ATTRIBUTE_NULLIFY
    || definition.effect.type === PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY
  ) {
    // Types 9-11 all map to 0x61bb98, which returns the incoming float32
    // probability scale unchanged and consumes no RNG.
    return { eligible: true, probabilityScale: 1, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_RANDOM_PARTY_BIND) {
    const bindableCount = state.party.filter((member) => (
      member?.present !== false && Number(member?.bindTurns || 0) <= 0
    )).length;
    const eligible = bindableCount >= definition.effect.targetCount;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_ACTIVE_SKILL_SEAL) {
    // 0x61aca4 sign-extends the protected low-ten-bit counter and rejects
    // only values greater than 63. Existing ordinary seals therefore remain
    // eligible and _doVoidActSkill extends them.
    const eligible = state.skillSealTurns <= 63;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_REPEAT_ATTACK) {
    // Type 15's 0x61b49c callback compares current player HP with the signed
    // 32-bit product of base attack and the authored maximum hit count. A
    // potentially lethal sequence forces the condition scale to 1.0;
    // otherwise it preserves the incoming scale (1.0 at this recovered new-AI
    // boundary). The callback itself consumes no RNG.
    const lethalDamage = Math.imul(
      definition.effect.hitCountMax | 0,
      state.enemyBaseAttack | 0,
    );
    const incomingScale = Math.fround(1);
    const probabilityScale = state.playerCurrentHp < lethalDamage
      ? Math.fround(1)
      : incomingScale;
    return { eligible: true, probabilityScale, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_INACTIVITY) {
    // Type 16's 0x61acbc callback returns 1.0 for a water-attribute acting
    // monster and 1.0 minus the incoming scale otherwise. Both recovered
    // chooseEnemyAiNew call sites supply an incoming scale of 1.0, making the
    // inactivity record eligible only for water at this boundary. No RNG is
    // consumed by the condition itself.
    const incomingScale = Math.fround(1);
    const probabilityScale = state.enemyAttribute === 1
      ? Math.fround(1)
      : Math.fround(Math.fround(1) - incomingScale);
    return { eligible: probabilityScale > 0, probabilityScale, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_INACTIVITY_UNCONDITIONAL) {
    return { eligible: true, probabilityScale: 1, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_INACTIVITY_PRESENTATION) {
    // Type 70's 0x61b558 callback admits the record only while the transient
    // presentation controller at sMONSTER+0x910 reports zero. That controller
    // resolves inside the native enemy-action presentation phase.
    const eligible = !state.enemyInactivityPresentationActive;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_DAMAGE_VOID) {
    const eligible = state.enemyDamageVoidTurns <= 0;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_DAMAGE_SHIELD) {
    const eligible = state.enemyDamageShieldTurns <= 0;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (
    definition.effect.type === PAD_ENEMY_SKILL_DAMAGE_IMMUNITY
    || definition.effect.type === PAD_ENEMY_SKILL_DAMAGE_IMMUNITY_ALT
  ) {
    // Type 119's 0x61a670 condition reads protected signed-int16
    // sMONSTER+0x9c0 and admits the record only while it is below one. Type
    // 123 reuses the same condition and only changes the presentation lane.
    const eligible = state.enemyDamageImmunityTurns <= 0;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_DAMAGE_IMMUNITY_OFF) {
    // Type 121's 0x61afc8 condition is the inverse of type 119: it preserves
    // the incoming scale only while protected signed-int16 +0x9c0 is active.
    const eligible = state.enemyDamageImmunityTurns >= 1;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_LEADER_SWAP) {
    // 0x61ab74 calls the native changeable-sub counter and only checks whether
    // it is positive. Target selection belongs to setup and consumes RNG later.
    const eligible = state.leaderSwapTurns <= 0 && state.leaderSwapCandidateCount > 0;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_LEADER_ALTER) {
    // 0x61bae8 first checks the active +0x84780 status lane.  No active
    // leader-alter status admits the record; an active status is rejected
    // only when its +0x84770 target card id matches this authored target.
    // The condition itself does not consume the shared LCG state.
    const activeTurns = Math.max(0, Math.trunc(Number(state.leaderAlterTurns) || 0));
    const activeTarget = state.leaderAlterTargetCardId == null
      ? null
      : Math.trunc(Number(state.leaderAlterTargetCardId));
    const targetCardId = Math.trunc(Number(definition.effect.targetCardId) || 0);
    const eligible = activeTurns <= 0 || activeTarget !== targetCardId;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_NORMAL_ATTACK) {
    return { eligible: true, probabilityScale: 1, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_MULTI_ATTACK) {
    // Type 83 maps to the unconditional 0x61a630 condition entry. Child
    // conditions are evaluated later by _setupDoubleAttack with scale 1.0.
    return { eligible: true, probabilityScale: 1, rngState };
  }
  if (
    definition.effect.type === PAD_ENEMY_SKILL_SOURCE_ORB_CONVERSION
    || definition.effect.type === PAD_ENEMY_SKILL_SOURCE_TO_JAMMER
    || definition.effect.type === PAD_ENEMY_SKILL_ATTACK_ORB_CHANGE
  ) {
    if (typeof state.evaluateCondition !== 'function') {
      return { eligible: false, probabilityScale: 0, rngState };
    }
    const result = state.evaluateCondition(definition, rngState) || {};
    return {
      eligible: Boolean(result.eligible),
      probabilityScale: Math.fround(Number(result.probabilityScale ?? (
        result.eligible ? 1 : 0
      )) || 0),
      rngState: Number(result.rngState ?? rngState) >>> 0,
    };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_LONE_ATTACK_BOOST) {
    const eligible = state.enemyAttackBoostTurns <= 0
      && state.enemies.filter((enemy) => Number(enemy?.hp) > 0).length === 1;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_STATUS_TRIGGERED_ATTACK_BOOST) {
    // 0x61ad7c rejects an already-active sMONSTER+0x860 boost, then accepts
    // when any of these native status lanes is active: sGAMEWORK+0x86bd4,
    // sGAMEWORK+0x86c3c, or the per-monster byte at +0x07.
    const eligible = state.enemyAttackBoostTurns <= 0 && (
      state.playerAuxiliaryBuffTurns > 0
      || state.playerAttackBoostTurns > 0
      || state.enemyTransientDebuffActive
    );
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_DAMAGED_TURN_ATTACK_BOOST) {
    // calcFinalDamage increments sMONSTER+0x7d0 only for the first positive
    // damage event of a player turn. The type-19 callback compares +0x10 to
    // that unsigned 16-bit counter and does not advance the RNG.
    const eligible = state.enemyAttackBoostTurns <= 0
      && definition.effect.damagedTurnThreshold <= state.enemyDamagedTurnCount;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_STATUS_SHIELD) {
    const eligible = state.enemyStatusShieldTurns <= 0;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION) {
    const eligible = state.moveTimeReductionTurns <= 0;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (
    definition.effect.type === PAD_ENEMY_SKILL_SELF_DESTRUCT
    || definition.effect.type === PAD_ENEMY_SKILL_CURRENT_HP_GRAVITY
  ) {
    return { eligible: true, probabilityScale: 1, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_CHANGE_ATTRIBUTE) {
    const candidates = padEnemySkillAttributeCandidates(
      definition.effect.candidateAttributes,
      state.enemyAttribute,
    );
    if (candidates.length === 0) {
      return { eligible: false, probabilityScale: 0, rngState };
    }
    return { eligible: true, probabilityScale: 1, rngState: padLcgStep(rngState).state };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_SCALED_ATTACK) {
    const eligible = state.scaledAttackGate === 0;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_REVIVE_ENEMY) {
    const eligible = state.enemies.some((enemy) => (
      Number(enemy?.hp) <= 0 && !enemy?.escaped
    ));
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_ATTRIBUTE_ABSORB) {
    const eligible = state.attributeAbsorbTurns <= 0;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_COMBO_ABSORB) {
    const eligible = state.comboAbsorbTurns <= 0;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_SKYFALL_RATE) {
    const naturalMask = definition.effect.typeMask & 0x3f;
    const hazardMask = definition.effect.typeMask & 0x1c0;
    const naturalEligible = naturalMask !== 0 && (
      state.skyfallNaturalTurns <= 0 || state.skyfallNaturalMask !== naturalMask
    );
    const hazardEligible = hazardMask !== 0 && (
      state.skyfallHazardTurns <= 0 || state.skyfallHazardMask !== hazardMask
    );
    const eligible = naturalEligible || hazardEligible;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_LOCKED_SKYFALL) {
    const requestedMask = definition.effect.typeMask & 0xffff;
    const identicalActiveRule = state.lockFallRules.some((rule) => (
      (rule.typeMask & 0xffff) === requestedMask
      && rule.source === 'enemySkill'
      && (rule.turnsRemaining == null || rule.turnsRemaining > 0)
    ));
    return {
      eligible: !identicalActiveRule,
      probabilityScale: identicalActiveRule ? 0 : 1,
      rngState,
    };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_STICKY_BLIND_RANDOM) {
    // 0x61a630 is the unconditional binary32 1.0 condition target.
    return { eligible: true, probabilityScale: 1, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_STICKY_BLIND_FIXED) {
    return { eligible: true, probabilityScale: 1, rngState };
  }
  if ([PAD_ENEMY_SKILL_ORB_SEAL_COLUMNS, PAD_ENEMY_SKILL_ORB_SEAL_ROWS]
    .includes(definition.effect.type)) {
    // Types 99 and 100 share 0x61a678. The protected row and column status
    // lanes are mutually exclusive, so either active tape rejects this skill.
    const eligible = !state.orbSealActive;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_FIXED_START) {
    // 0x61abac admits only while protected force-start column is signed -1.
    const eligible = !state.forcedStartActive;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if ([PAD_ENEMY_SKILL_RANDOM_BOMBS, PAD_ENEMY_SKILL_FIXED_BOMBS]
    .includes(definition.effect.type)) {
    return { eligible: true, probabilityScale: 1, rngState };
  }
  if ([PAD_ENEMY_SKILL_RANDOM_SPINNERS, PAD_ENEMY_SKILL_FIXED_SPINNERS]
    .includes(definition.effect.type)) {
    return { eligible: true, probabilityScale: 1, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_MAX_HP_CHANGE) {
    const requested = padEnemySkillMaxHpParameter(
      definition.effect.maxHpPercent,
      definition.effect.fixedMaxHp,
    );
    const eligible = Number(state.maxHpChangeTurns || 0) <= 0
      || Math.trunc(Number(state.maxHpChangeParameter) || 0) !== requested;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_FIXED_TARGET) {
    const eligible = Number(state.fixedTargetTurns || 0) <= 0
      || Math.trunc(Number(state.fixedTargetEnemyIndex) || 0)
        !== Math.trunc(Number(state.actingEnemyIndex) || 0);
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_BOARD_SIZE_CHANGE) {
    // Type 126's 0x61a8f4 callback admits the skill only when the current
    // native board-size code already equals its selector's target code:
    // 0x67 (7×6), 0x45 (5×4), or 0x56 (6×5).  The preceding protected status
    // gate is represented by the engine's current board-size state; no RNG is
    // consumed by this callback.
    const selector = Math.trunc(Number(definition.effect.boardSizeSelector) || 0);
    const targetCode = selector === 3
      ? 0x56
      : selector === 2
        ? 0x45
        : selector === 1
          ? 0x67
          : 0;
    const currentCode = state.boardSizeCode !== undefined
      ? Math.trunc(Number(state.boardSizeCode) || 0) & 0xff
      : ((Math.trunc(Number(state.boardRows) || 0) << 4)
        | (Math.trunc(Number(state.boardColumns) || 0))) & 0xff;
    const eligible = targetCode !== 0 && currentCode === targetCode;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_CLOUD) {
    const eligible = !state.cloudActive;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_RECOVERY_DEBUFF) {
    const eligible = Number(state.playerRecovery || 0) <= 0
      || Number(state.recoveryMultiplier ?? 1) >= 1;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_ATTRIBUTE_BLOCK) {
    // Type 107's 0x61afac condition rejects an already-active protected
    // low-ten-bit counter and otherwise preserves the incoming 1.0 scale.
    // It does not consume the gameplay RNG.
    const eligible = !state.attributeBlockActive;
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_BIND_LEADER_HELPER) {
    const party = Array.isArray(state.party) ? state.party : [];
    const eligible = (
      (definition.effect.targetFlags & 1) !== 0
      && Boolean(party[0])
      && party[0]?.present !== false
      && Number(party[0]?.bindTurns || 0) <= 0
    ) || (
      (definition.effect.targetFlags & 2) !== 0
      && Boolean(party[5])
      && party[5]?.present !== false
      && Number(party[5]?.bindTurns || 0) <= 0
    );
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_HEAL_PLAYER) {
    const eligible = padEnemySkillPlayerHpCondition(
      state.playerCurrentHp,
      state.playerMaxHp,
      definition.effect.thresholdPercent,
    );
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  // The decoded line and poison-list transformations all map to the
  // unconditional 1.0 handler at 0x61a630, with no board dry run.
  if (
    definition.effect.type === PAD_ENEMY_SKILL_HORIZONTAL_LINES
    || definition.effect.type === PAD_ENEMY_SKILL_HORIZONTAL_LINES_4
    || definition.effect.type === PAD_ENEMY_SKILL_VERTICAL_LINES
    || definition.effect.type === PAD_ENEMY_SKILL_VERTICAL_LINES_4
    || definition.effect.type === PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP
    || definition.effect.type === PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP_DIRECT
    || definition.effect.type === PAD_ENEMY_SKILL_POISON_MASK_SWAP
    || definition.effect.type === PAD_ENEMY_SKILL_POISON_MASK_SWAP_DIRECT
  ) {
    return { eligible: true, probabilityScale: 1, rngState };
  }
  if (typeof state.evaluateCondition === 'function') {
    const result = state.evaluateCondition(definition, rngState) || {};
    return {
      eligible: Boolean(result.eligible),
      probabilityScale: Math.fround(Number(result.probabilityScale ?? (
        result.eligible ? 1 : 0
      )) || 0),
      rngState: Number(result.rngState ?? rngState) >>> 0,
    };
  }
  return { eligible: false, probabilityScale: 0, rngState };
}

function advanceRoll(state, scale) {
  const stepped = padLcgStep(state);
  return {
    state: stepped.state,
    value: Math.floor(stepped.value * scale / 0x10000),
  };
}

function immediateProbability(definition, slot, conditionScale = 1) {
  const product = Math.imul(
    Math.imul(definition.immediateFactor0, definition.immediateFactor1),
    slot.immediateChance,
  );
  const base = Math.fround(Math.trunc(product / 100_000));
  const scaled = Math.fround(base * Math.fround(conditionScale));
  return Math.fround(Math.min(10_000, scaled));
}

// _setupDoubleAttack (0x62224c) invokes chooseEnemyAiSub for each type-83
// child with an incoming float32 scale of 1.0. It deliberately bypasses the
// child's slot probability, HP threshold, and AI-budget fields; only the
// child's type-specific condition callback (and any RNG it owns) participates.
export function evaluatePadEnemyAiSub(definition, state = {}, rngState = state.rngState) {
  const decoded = definition?.effect ? definition : decodePadEnemyAiSkillDefinition(definition);
  return Object.freeze(evaluateCondition(decoded, state, Number(rngState) >>> 0, false));
}

// Supported subset of chooseEnemyAiNew (0x61d450). Type 83 is selected as an
// ordinary structural record; its children are resolved by evaluatePadEnemyAiSub
// after selection. Condition callbacks outside the decoded set remain rejected.
// The native scan multiplies immediate chance by chooseEnemyAiSub's float32
// return, but uses that return only as a positive gate for the later unscaled
// +0xf1 weighted fallback.
export function selectPadEnemyAiNew(monster, definitions, state = {}) {
  const definitionMap = normalizeDefinitionMap(definitions);
  const current = {
    currentHp: Math.max(0, Number(state.currentHp) || 0),
    maxHp: Math.max(0, Number(state.maxHp) || 0),
    playerCurrentHp: Math.max(0, Number(state.playerCurrentHp) || 0),
    playerMaxHp: Math.max(0, Number(state.playerMaxHp) || 0),
    maxHpChangeTurns: Math.max(0, Math.trunc(Number(state.maxHpChangeTurns) || 0)),
    maxHpChangeParameter: Math.trunc(Number(state.maxHpChangeParameter) || 0),
    fixedTargetTurns: Math.max(0, Math.trunc(Number(state.fixedTargetTurns) || 0)),
    fixedTargetEnemyIndex: Math.trunc(Number(state.fixedTargetEnemyIndex) || 0),
    boardColumns: Math.max(0, Math.trunc(Number(state.boardColumns) || 0)),
    boardRows: Math.max(0, Math.trunc(Number(state.boardRows) || 0)),
    boardSizeCode: state.boardSizeCode === undefined
      ? ((Math.trunc(Number(state.boardRows) || 0) << 4)
        | Math.trunc(Number(state.boardColumns) || 0)) & 0xff
      : Math.trunc(Number(state.boardSizeCode) || 0) & 0xff,
    actingEnemyIndex: Math.trunc(Number(state.actingEnemyIndex) || 0),
    attributeAbsorbTurns: Math.max(0, Math.trunc(Number(state.attributeAbsorbTurns) || 0)),
    comboAbsorbTurns: Math.max(0, Math.trunc(Number(state.comboAbsorbTurns) || 0)),
    enemyDamageAbsorbTurns: Math.max(
      0,
      Math.trunc(Number(state.enemyDamageAbsorbTurns) || 0),
    ),
    enemyDamageVoidTurns: Math.max(
      0,
      Math.trunc(Number(state.enemyDamageVoidTurns) || 0),
    ),
    enemyDamageShieldTurns: Math.max(
      0,
      Math.trunc(Number(state.enemyDamageShieldTurns) || 0),
    ),
    enemyDamageImmunityTurns: Math.max(
      0,
      Math.trunc(Number(state.enemyDamageImmunityTurns) || 0),
    ),
    leaderSwapTurns: Math.max(0, Math.trunc(Number(state.leaderSwapTurns) || 0)),
    leaderSwapCandidateCount: Math.max(
      0,
      Math.trunc(Number(state.leaderSwapCandidateCount) || 0),
    ),
    leaderAlterTurns: Math.max(0, Math.trunc(Number(state.leaderAlterTurns) || 0)),
    leaderAlterTargetCardId: state.leaderAlterTargetCardId == null
      ? null
      : Math.trunc(Number(state.leaderAlterTargetCardId)),
    enemyInactivityPresentationActive: Boolean(state.enemyInactivityPresentationActive),
    skyfallNaturalTurns: Math.max(0, Math.trunc(Number(state.skyfallNaturalTurns) || 0)),
    skyfallNaturalMask: Math.trunc(Number(state.skyfallNaturalMask) || 0) & 0x3f,
    skyfallHazardTurns: Math.max(0, Math.trunc(Number(state.skyfallHazardTurns) || 0)),
    skyfallHazardMask: Math.trunc(Number(state.skyfallHazardMask) || 0) & 0x1c0,
    lockFallRules: (Array.isArray(state.lockFallRules) ? state.lockFallRules : []).map((rule) => ({
      typeMask: Math.trunc(Number(rule?.typeMask) || 0) & 0xffff,
      source: rule?.source == null ? null : String(rule.source),
      turnsRemaining: rule?.turnsRemaining == null
        ? null
        : Math.max(0, Math.trunc(Number(rule.turnsRemaining) || 0)),
    })),
    orbSealActive: Boolean(state.orbSealActive),
    forcedStartActive: Boolean(state.forcedStartActive),
    cloudActive: Boolean(state.cloudActive),
    attributeBlockActive: Boolean(state.attributeBlockActive),
    playerRecovery: Math.max(0, Math.trunc(Number(state.playerRecovery) || 0)),
    recoveryMultiplier: Number(state.recoveryMultiplier ?? 1),
    scaledAttackGate: Math.trunc(Number(state.scaledAttackGate) || 0),
    enemyAttackBoostTurns: Math.max(0, Math.trunc(Number(state.enemyAttackBoostTurns) || 0)),
    enemyBaseAttack: Math.max(0, Math.trunc(Number(state.enemyBaseAttack) || 0)),
    enemyDamagedTurnCount: Math.max(
      0,
      Math.min(0xffff, Math.trunc(Number(state.enemyDamagedTurnCount) || 0)),
    ),
    playerAuxiliaryBuffTurns: Math.max(
      0,
      Math.trunc(Number(state.playerAuxiliaryBuffTurns) || 0),
    ),
    playerAttackBoostTurns: Math.max(
      0,
      Math.trunc(Number(state.playerAttackBoostTurns) || 0),
    ),
    enemyTransientDebuffActive: Boolean(state.enemyTransientDebuffActive),
    enemyStatusShieldTurns: Math.max(0, Math.trunc(Number(state.enemyStatusShieldTurns) || 0)),
    moveTimeReductionTurns: Math.max(0, Math.trunc(Number(state.moveTimeReductionTurns) || 0)),
    skillSealTurns: Math.trunc(Number(state.skillSealTurns) || 0),
    awakeningBindTurns: Math.trunc(Number(state.awakeningBindTurns) || 0),
    enemyAttribute: Math.trunc(Number(state.enemyAttribute)),
    enemies: Array.isArray(state.enemies) ? state.enemies : [],
    party: Array.isArray(state.party) ? state.party : [],
    aiBudget: Math.max(0, Math.trunc(Number(state.aiBudget ?? monster.budgetCap) || 0)),
    blackFallActive: Boolean(state.blackFallActive),
    noSkyfallTurns: Math.max(0, Math.trunc(Number(state.noSkyfallTurns) || 0)),
    boardCellCount: Math.max(0, Math.trunc(Number(state.boardCellCount) || 0)),
    blackBlockCount: Math.max(0, Math.trunc(Number(state.blackBlockCount) || 0)),
    evaluateCondition: state.evaluateCondition,
  };
  let rngState = Number(state.rngState) >>> 0;
  let selected = null;
  const fallback = [];

  for (const slot of monster.slots) {
    const definition = definitionMap.get(slot.skillId);
    if (!definition || !isStaticallyEligible(definition, current)) continue;
    if (slot.fallbackWeight > 0) fallback.push({ slot, definition });
    if (slot.immediateChance === 0) continue;
    const condition = evaluateCondition(definition, current, rngState);
    rngState = condition.rngState;
    if (!condition.eligible) continue;
    const probability = immediateProbability(definition, slot, condition.probabilityScale);
    if (probability <= 0) continue;
    const roll = advanceRoll(rngState, 10_000);
    rngState = roll.state;
    if (Math.fround(10_000 - probability) <= roll.value) {
      selected = definition;
      break;
    }
  }

  if (!selected && fallback.length > 0) {
    const eligibleFallback = [];
    for (const candidate of fallback) {
      const condition = evaluateCondition(candidate.definition, current, rngState);
      rngState = condition.rngState;
      if (condition.eligible) eligibleFallback.push(candidate);
    }
    const totalWeight = eligibleFallback.reduce((total, candidate) => (
      total + candidate.slot.fallbackWeight
    ), 0);
    const roll = advanceRoll(rngState, totalWeight);
    rngState = roll.state;
    let remaining = roll.value;
    for (const candidate of eligibleFallback) {
      remaining -= candidate.slot.fallbackWeight;
      if (remaining < 0) {
        selected = candidate.definition;
        break;
      }
    }
  }

  const regeneratedBudget = Math.min(
    monster.budgetCap,
    Math.max(0, current.aiBudget + monster.budgetRegen),
  );
  return Object.freeze({
    skillId: selected?.skillId ?? null,
    effect: selected?.effect ?? null,
    rngState,
    aiBudget: regeneratedBudget - (selected?.budgetCost || 0),
  });
}

// The pre-21.9 selector (cGAMEMAIN::_chooseEnemyAi, 0x61dd68) shares the
// table/record layout with the new selector, but its ordinary path has one
// extra condition stage. It derives a float32 scale from the protected
// current HP, a monster-local damage baseline, and sENESKILLS+0x3c before
// calling _chooseEnemyAiSub. If that pass does not return a skill, native
// enters a second 64-slot status/fallback pass at 0x61e300. The recovered
// fallback epilogue at 0x61f08c is deliberately kept separate from the
// ordinary probability helper: it multiplies only factor0 by +0xf1, converts
// the product through binary32, truncates with fcvtzs, and advances the shared
// LCG for every positive fallback weight.

// _chooseEnemyAi's recovered jump table lives at VA/file 0xd3c8e2 and
// dispatches types 1..92 to handlers in the 0x61e354..0x61f08c range. These
// are the lanes whose target is the unconditional zero or one scale. Types
// outside the table fall through to the common epilogue with its initialized
// scale of one. Keeping the sets numeric avoids coupling this low-level table
// to the much larger skill-definition constant list.
const LEGACY_FALLBACK_SCALE_ZERO_TYPES = new Set([
  ...Array.from({ length: 18 }, (_, index) => index + 21),
  47,
  49,
  69,
]);

const LEGACY_FALLBACK_SCALE_ONE_TYPES = new Set([
  50,
  76,
  77,
  78,
  79,
  80,
  81,
  83,
  84,
  85,
  86,
  89,
  92,
]);

function normalizeLegacySelectorState(state, monster) {
  const numeric = (value, fallback = 0) => {
    const candidate = Number(value);
    return Number.isFinite(candidate) ? candidate : fallback;
  };
  const integer = (value, fallback = 0) => Math.trunc(numeric(value, fallback));
  const nonNegative = (value, fallback = 0) => Math.max(0, integer(value, fallback));
  return {
    currentHp: nonNegative(state.currentHp),
    maxHp: nonNegative(state.maxHp),
    playerCurrentHp: nonNegative(state.playerCurrentHp),
    playerMaxHp: nonNegative(state.playerMaxHp),
    maxHpChangeTurns: nonNegative(state.maxHpChangeTurns),
    maxHpChangeParameter: integer(state.maxHpChangeParameter),
    fixedTargetTurns: nonNegative(state.fixedTargetTurns),
    fixedTargetEnemyIndex: integer(state.fixedTargetEnemyIndex),
    boardColumns: nonNegative(state.boardColumns),
    boardRows: nonNegative(state.boardRows),
    boardSizeCode: state.boardSizeCode === undefined
      ? ((nonNegative(state.boardRows) << 4) | nonNegative(state.boardColumns)) & 0xff
      : integer(state.boardSizeCode) & 0xff,
    actingEnemyIndex: integer(state.actingEnemyIndex),
    attributeAbsorbTurns: nonNegative(state.attributeAbsorbTurns),
    comboAbsorbTurns: nonNegative(state.comboAbsorbTurns),
    enemyDamageAbsorbTurns: nonNegative(state.enemyDamageAbsorbTurns),
    enemyDamageVoidTurns: nonNegative(state.enemyDamageVoidTurns),
    enemyDamageShieldTurns: nonNegative(state.enemyDamageShieldTurns),
    enemyDamageImmunityTurns: nonNegative(state.enemyDamageImmunityTurns),
    leaderSwapTurns: nonNegative(state.leaderSwapTurns),
    leaderSwapCandidateCount: nonNegative(state.leaderSwapCandidateCount),
    leaderAlterTurns: nonNegative(state.leaderAlterTurns),
    leaderAlterTargetCardId: state.leaderAlterTargetCardId == null
      ? null
      : integer(state.leaderAlterTargetCardId),
    enemyInactivityPresentationActive: Boolean(state.enemyInactivityPresentationActive),
    skyfallNaturalTurns: nonNegative(state.skyfallNaturalTurns),
    skyfallNaturalMask: integer(state.skyfallNaturalMask) & 0x3f,
    skyfallHazardTurns: nonNegative(state.skyfallHazardTurns),
    skyfallHazardMask: integer(state.skyfallHazardMask) & 0x1c0,
    lockFallRules: (Array.isArray(state.lockFallRules) ? state.lockFallRules : []).map((rule) => ({
      typeMask: integer(rule?.typeMask) & 0xffff,
      source: rule?.source == null ? null : String(rule.source),
      turnsRemaining: rule?.turnsRemaining == null
        ? null
        : nonNegative(rule.turnsRemaining),
    })),
    orbSealActive: Boolean(state.orbSealActive),
    forcedStartActive: Boolean(state.forcedStartActive),
    cloudActive: Boolean(state.cloudActive),
    attributeBlockActive: Boolean(state.attributeBlockActive),
    playerRecovery: nonNegative(state.playerRecovery),
    recoveryMultiplier: numeric(state.recoveryMultiplier, 1),
    scaledAttackGate: integer(state.scaledAttackGate),
    enemyAttackBoostTurns: nonNegative(state.enemyAttackBoostTurns),
    enemyBaseAttack: nonNegative(state.enemyBaseAttack),
    enemyDamagedTurnCount: Math.min(0xffff, nonNegative(state.enemyDamagedTurnCount)),
    playerAuxiliaryBuffTurns: nonNegative(state.playerAuxiliaryBuffTurns),
    playerAttackBoostTurns: nonNegative(state.playerAttackBoostTurns),
    enemyTransientDebuffActive: Boolean(state.enemyTransientDebuffActive),
    enemyStatusShieldTurns: nonNegative(state.enemyStatusShieldTurns),
    moveTimeReductionTurns: nonNegative(state.moveTimeReductionTurns),
    skillSealTurns: integer(state.skillSealTurns),
    awakeningBindTurns: integer(state.awakeningBindTurns),
    enemyAttribute: integer(state.enemyAttribute, -1),
    enemies: Array.isArray(state.enemies) ? state.enemies : [],
    party: Array.isArray(state.party) ? state.party : [],
    aiBudget: nonNegative(state.aiBudget === undefined ? monster.budgetCap : state.aiBudget),
    blackFallActive: Boolean(state.blackFallActive),
    noSkyfallTurns: nonNegative(state.noSkyfallTurns),
    boardCellCount: nonNegative(state.boardCellCount),
    blackBlockCount: nonNegative(state.blackBlockCount),
    // This is the derived native baseline: +0x7c0/+0x7d0 after damage, or a
    // status-scan value on the no-damage path. Its semantic source is not
    // recoverable from the public browser state, so callers can provide a
    // per-monster value. The current HP fallback keeps legacy demos playable
    // while the returned metadata makes the approximation visible.
    legacyConditionBase: numeric(state.legacyConditionBase, NaN),
    // Native chooseEnemyAiSub type 47 checks sMONSTER+0x6c0, which _doEnemyAi
    // increments after each AI decision. Keep the lane optional so direct
    // callers can reproduce either the first-use or subsequent-use result.
    enemyAiUseCount: nonNegative(state.enemyAiUseCount),
    // The native post-callback guard forces the condition result to 1.0 when
    // the wave-record mode byte is not one and the scaled operand exceeds
    // 9998. A host can expose that byte as this explicit capability flag.
    legacyConditionForceOne: Boolean(state.legacyConditionForceOne),
    // The status/fallback pass contains a handful of native lanes whose
    // backing sMONSTER/sGAMEWORK fields are not represented in the compact
    // browser state yet. Keep the hook and optional per-skill/type scale map
    // intact so a host with those fields can provide the native result
    // without replacing the selector.
    legacyFallbackCondition: typeof state.legacyFallbackCondition === 'function'
      ? state.legacyFallbackCondition
      : null,
    legacyFallbackScales: state.legacyFallbackScales instanceof Map
      || (state.legacyFallbackScales
        && typeof state.legacyFallbackScales === 'object')
      ? state.legacyFallbackScales
      : null,
    evaluateCondition: state.evaluateCondition,
  };
}

function roundNativeLegacyScale(rawValue, legacyScale) {
  const raw = Math.max(0, rawValue | 0);
  const scale = legacyScale | 0;
  if (scale < 1) return raw;
  // Native code converts the product and divisor through binary32 before
  // izMathRound.  Legacy authored operands are non-negative, so floor(x+.5)
  // matches the observed helper for every representable table value.
  const scaled = Math.fround(Math.fround(Math.fround(raw) * Math.fround(scale)) / Math.fround(100));
  return Math.max(0, Math.min(0x7fffffff, Math.floor(scaled + 0.5)));
}

function legacyConditionScale(definition, monster, state) {
  const raw = Number(definition.legacyConditionValue) | 0;
  const rawMagnitude = raw & 0x3fff;
  if (rawMagnitude <= 0) {
    return {
      valid: false,
      scale: 0,
      reason: 'legacy-condition-value-zero',
      raw,
      rawMagnitude,
      adjustedValue: 0,
      approximate: false,
    };
  }
  const adjustedValue = roundNativeLegacyScale(rawMagnitude, monster.legacyScale);
  if (adjustedValue <= 0) {
    return {
      valid: false,
      scale: 0,
      reason: 'legacy-condition-value-rounded-zero',
      raw,
      rawMagnitude,
      adjustedValue,
      approximate: false,
    };
  }
  const hasBase = Number.isFinite(state.legacyConditionBase)
    && state.legacyConditionBase > 0;
  const base = hasBase ? state.legacyConditionBase : Math.max(1, state.currentHp);
  // The numerator is the protected current-HP value read from sMONSTER+0x3c
  // / +0x4c.  It is not the authored +0x3c operand (that field is only used
  // for the denominator and polarity bit).
  const value = state.currentHp;
  const denominator = Math.fround(Math.fround(base) * Math.fround(adjustedValue));
  if (!(denominator > 0) || !Number.isFinite(denominator)) {
    return {
      valid: false,
      scale: 0,
      reason: 'legacy-condition-denominator-invalid',
      raw,
      rawMagnitude,
      adjustedValue,
      approximate: !hasBase,
    };
  }
  const ratio = Math.fround(Math.fround(value) / denominator);
  const scale = (raw & 0x4000) !== 0
    ? ratio
    : Math.fround(Math.fround(1) - ratio);
  return {
    valid: Number.isFinite(scale),
    scale: Math.fround(scale),
    raw,
    rawMagnitude,
    adjustedValue,
    base,
    value,
    ratio,
    approximate: !hasBase,
    ...(hasBase ? {} : { reason: 'legacy-condition-base-inferred-from-current-hp' }),
  };
}

// _chooseEnemyAiSub returns one of three shapes at the recovered callback
// boundary: a constant 1.0 (0x61a630), the incoming scale unchanged
// (0x61bb98), or a callback-local value multiplied by the incoming scale
// (0x61c014).  Keep the table deliberately small and evidence-backed.  The
// remaining handlers are evaluated with the same multiply convention but are
// marked approximate by the caller until their status lanes are decoded.
const LEGACY_CALLBACK_CONSTANT_TYPES = new Set([
  // Direct 0x61a630 table targets.
  40, 50, 66,
  76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86,
  89, 97, 98, 102, 103, 109, 110,
  // These callbacks have an independently recovered eligibility predicate
  // and return the native constant-one branch after it succeeds.
  20, 125, 127, 128,
]);

const LEGACY_CALLBACK_PRESERVE_TYPES = new Set([
  7, 9, 10, 11, 13, 14, 15,
]);

const LEGACY_CALLBACK_MULTIPLY_TYPES = new Set([
  4, 5, 6, 8, 12, 56, 57, 58, 59, 60, 61, 62,
]);

function legacyCallbackScale(definition, conditionGate, incomingScale, state) {
  if (!conditionGate.eligible) {
    return { scale: 0, exact: true, mode: 'rejected' };
  }
  const type = definition.effect?.type;
  const incoming = Math.fround(incomingScale);
  if (type === 16) {
    // 0x61acbc writes 1.0 for the water-attribute branch and 1.0 - s8 for
    // every other attribute.  Unlike 0x61c014 this handler does not multiply
    // a callback-local value by s8 a second time.
    const scale = state.enemyAttribute === 1
      ? Math.fround(1)
      : Math.fround(Math.fround(1) - incoming);
    return { scale, exact: true, mode: 'direct-complement' };
  }
  if (type === 47) {
    // 0x61b54c returns the initialized 1.0 branch only while +0x6c0 is
    // zero; subsequent _doEnemyAi calls arrive at the zero epilogue.
    const scale = currentLegacyUseCount(state) === 0 ? Math.fround(1) : Math.fround(0);
    return { scale, exact: true, mode: 'first-use-only' };
  }
  if (LEGACY_CALLBACK_CONSTANT_TYPES.has(type)) {
    return { scale: Math.fround(1), exact: true, mode: 'constant-one' };
  }
  if (LEGACY_CALLBACK_PRESERVE_TYPES.has(type)) {
    return { scale: incoming, exact: true, mode: 'preserve-incoming' };
  }
  const callbackScale = Number(conditionGate.probabilityScale);
  const local = Number.isFinite(callbackScale) ? Math.fround(callbackScale) : 0;
  if (LEGACY_CALLBACK_MULTIPLY_TYPES.has(type)) {
    return {
      scale: Math.fround(local * incoming),
      exact: true,
      mode: 'multiply-incoming',
    };
  }
  return {
    scale: Math.fround(local * incoming),
    exact: false,
    mode: 'multiply-incoming-approximation',
  };
}

function normalizeLegacyFallbackScaleResult(result, defaultMode = 'host') {
  if (result === undefined || result === null) return null;
  if (typeof result === 'boolean') {
    return {
      scale: result ? Math.fround(1) : Math.fround(0),
      exact: true,
      mode: result ? `${defaultMode}-eligible` : `${defaultMode}-rejected`,
      consumesRoll: true,
    };
  }
  if (typeof result === 'number') {
    return {
      scale: Math.fround(result),
      exact: true,
      mode: defaultMode,
      consumesRoll: true,
    };
  }
  if (typeof result !== 'object') return null;
  const eligible = result.eligible === undefined ? true : Boolean(result.eligible);
  const rawScale = result.scale ?? result.probabilityScale ?? (eligible ? 1 : 0);
  const scale = Number(rawScale);
  if (!Number.isFinite(scale)) {
    return {
      scale: Math.fround(0),
      exact: false,
      mode: result.mode || `${defaultMode}-invalid`,
      consumesRoll: result.consumesRoll !== false,
      invalid: true,
    };
  }
  return {
    scale: Math.fround(scale),
    exact: result.exact === undefined ? true : Boolean(result.exact),
    mode: result.mode || defaultMode,
    consumesRoll: result.consumesRoll !== false,
    ...(result.rngState === undefined ? {} : {
      rngState: Number(result.rngState) >>> 0,
    }),
    ...(result.reason ? { reason: String(result.reason) } : {}),
  };
}

function readLegacyFallbackScaleSource(source, definition, state, context, mode) {
  const value = typeof source === 'function'
    ? source(definition, state, context)
    : source;
  return normalizeLegacyFallbackScaleResult(value, mode);
}

function lookupLegacyFallbackScale(table, definition, type) {
  if (!table) return undefined;
  if (table instanceof Map) {
    if (table.has(definition.skillId)) return table.get(definition.skillId);
    if (table.has(type)) return table.get(type);
    return undefined;
  }
  if (Object.prototype.hasOwnProperty.call(table, definition.skillId)) {
    return table[definition.skillId];
  }
  if (Object.prototype.hasOwnProperty.call(table, type)) return table[type];
  return undefined;
}

function legacyFallbackBuiltinScale(definition, state) {
  const type = Number(definition.effect?.type);
  if (LEGACY_FALLBACK_SCALE_ZERO_TYPES.has(type)) {
    return { scale: Math.fround(0), exact: true, mode: 'native-zero' };
  }
  if (LEGACY_FALLBACK_SCALE_ONE_TYPES.has(type)) {
    return { scale: Math.fround(1), exact: true, mode: 'native-one' };
  }

  // These handlers were recovered directly from their status loads in the
  // 0x61e300 jump table. They gate reapplication while the corresponding
  // protected status is active, then continue through the common epilogue.
  if (type === 67) {
    const eligible = state.comboAbsorbTurns <= 0;
    return {
      scale: eligible ? Math.fround(1) : Math.fround(0),
      exact: true,
      mode: eligible ? 'combo-absorb-inactive' : 'combo-absorb-active',
    };
  }
  if (type === 68) {
    const naturalMask = state.skyfallNaturalMask & 0x3f;
    const hazardMask = state.skyfallHazardMask & 0x1c0;
    const requestedNaturalMask = Math.trunc(Number(definition.effect?.typeMask) || 0) & 0x3f;
    const requestedHazardMask = Math.trunc(Number(definition.effect?.typeMask) || 0) & 0x1c0;
    const naturalEligible = requestedNaturalMask !== 0 && (
      state.skyfallNaturalTurns <= 0 || naturalMask !== requestedNaturalMask
    );
    const hazardEligible = requestedHazardMask !== 0 && (
      state.skyfallHazardTurns <= 0 || hazardMask !== requestedHazardMask
    );
    const eligible = naturalEligible || hazardEligible;
    return {
      scale: eligible ? Math.fround(1) : Math.fround(0),
      exact: false,
      mode: eligible ? 'skyfall-status-eligible' : 'skyfall-status-active',
    };
  }
  if (type === 70) {
    const eligible = !state.enemyInactivityPresentationActive;
    return {
      scale: eligible ? Math.fround(1) : Math.fround(0),
      exact: true,
      mode: eligible ? 'inactivity-presentation-inactive' : 'inactivity-presentation-active',
    };
  }
  if (type === 71) {
    // 0x61ef24 selects zero when protected +0x8d0 is positive, one otherwise.
    const eligible = state.enemyDamageVoidTurns <= 0;
    return {
      scale: eligible ? Math.fround(1) : Math.fround(0),
      exact: true,
      mode: eligible ? 'damage-void-inactive' : 'damage-void-active',
    };
  }
  if (type === 74) {
    // 0x61ef2c is the same reapplication gate for protected +0x940.
    const eligible = state.enemyDamageShieldTurns <= 0;
    return {
      scale: eligible ? Math.fround(1) : Math.fround(0),
      exact: true,
      mode: eligible ? 'damage-shield-inactive' : 'damage-shield-active',
    };
  }
  if (type === 75) {
    // The helper at 0x322250 returns the count of currently changeable party
    // members. The compact state exposes the same count and active duration.
    const eligible = state.leaderSwapTurns <= 0 && state.leaderSwapCandidateCount > 0;
    return {
      scale: eligible ? Math.fround(1) : Math.fround(0),
      exact: false,
      mode: eligible ? 'leader-swap-candidates' : 'leader-swap-unavailable',
    };
  }
  if (type === 87) {
    // 0x61ef64 reads protected +0x960 and reaches one only while it is below
    // one. This is the native damage-absorb reapplication gate.
    const eligible = state.enemyDamageAbsorbTurns <= 0;
    return {
      scale: eligible ? Math.fround(1) : Math.fround(0),
      exact: true,
      mode: eligible ? 'damage-absorb-inactive' : 'damage-absorb-active',
    };
  }
  if (type === 88) {
    // 0x61ef78 compares the protected low-ten-bit status counter with 64;
    // ordinary browser durations map directly to that lane.
    const eligible = state.awakeningBindTurns <= 63;
    return {
      scale: eligible ? Math.fround(1) : Math.fround(0),
      exact: false,
      mode: eligible ? 'awakening-bind-available' : 'awakening-bind-active',
    };
  }
  if (type === 52) {
    const eligible = state.enemies.some((enemy) => (
      Number(enemy?.hp) <= 0 && !enemy?.escaped
    ));
    return {
      scale: eligible ? Math.fround(1) : Math.fround(0),
      exact: false,
      mode: eligible ? 'revive-target-present' : 'revive-target-absent',
    };
  }
  if (type === 53) {
    const eligible = state.attributeAbsorbTurns <= 0;
    return {
      scale: eligible ? Math.fround(1) : Math.fround(0),
      exact: false,
      mode: eligible ? 'attribute-absorb-inactive' : 'attribute-absorb-active',
    };
  }
  if (type === 54) {
    const targetFlags = Math.trunc(Number(definition.effect?.targetFlags) || 0) & 0x03;
    const party = Array.isArray(state.party) ? state.party : [];
    const eligible = (
      (targetFlags & 1) !== 0
      && party[0]?.present !== false
      && Number(party[0]?.bindTurns || 0) <= 0
    ) || (
      (targetFlags & 2) !== 0
      && party[5]?.present !== false
      && Number(party[5]?.bindTurns || 0) <= 0
    );
    return {
      scale: eligible ? Math.fround(1) : Math.fround(0),
      exact: false,
      mode: eligible ? 'leader-helper-target-present' : 'leader-helper-target-absent',
    };
  }
  // Types whose handler still reads an unnamed global/status lane remain
  // playable with the native-initialized one scale. The result reports this
  // as approximate and a host can override it through the hook/map above.
  return { scale: Math.fround(1), exact: false, mode: 'native-default-one' };
}

function legacyFallbackConditionScale(definition, slot, monster, state, rngState) {
  const type = Number(definition.effect?.type);
  const context = Object.freeze({
    definition,
    slot,
    monster,
    type,
    fallbackWeight: slot.fallbackWeight,
    rngState,
  });
  if (typeof state.legacyFallbackCondition === 'function') {
    const custom = readLegacyFallbackScaleSource(
      state.legacyFallbackCondition,
      definition,
      state,
      context,
      'host-fallback-condition',
    );
    if (custom) return custom;
  }
  const configured = lookupLegacyFallbackScale(state.legacyFallbackScales, definition, type);
  if (configured !== undefined) {
    const mapped = readLegacyFallbackScaleSource(
      configured,
      definition,
      state,
      context,
      'configured-fallback-scale',
    );
    if (mapped) return mapped;
  }
  return legacyFallbackBuiltinScale(definition, state);
}

function legacyFallbackProbability(definition, slot, conditionScale) {
  // Native 0x61f08c performs a signed 32-bit multiply, converts that result
  // to binary32, multiplies the condition scale in binary32, and truncates
  // toward zero with fcvtzs. It does not cap the result at 10000.
  const product = Math.imul(
    Math.trunc(Number(definition.immediateFactor0) || 0),
    Math.trunc(Number(slot.fallbackWeight) || 0),
  );
  const scaled = Math.fround(Math.fround(product) * Math.fround(conditionScale));
  if (!Number.isFinite(scaled)) return scaled > 0 ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
  return Math.trunc(scaled);
}

function selectLegacyFallback(monster, candidates, state, current, rngState) {
  let selected = null;
  let selectedScale = null;
  let selectedType = null;
  let selectedProbability = null;
  let fallbackRngState = rngState;
  let fallbackAborted = false;
  let fallbackUnsupported = false;
  let fallbackApproximation = false;
  let fallbackConsumedRoll = false;
  const approximateTypes = new Set();
  const fallbackTypes = new Set();
  const unsupportedSkillIds = [];

  for (const candidate of candidates) {
    const { slot, definition } = candidate;
    const type = Number(definition.effect?.type);
    // The second pass compares the slot's authored skill ID (not the effect
    // type) with 36 and returns the top-level no-skill result immediately.
    // Effect type 36 itself is a normal jump-table lane and resolves through
    // the constant-zero handler below.
    if (definition.skillId === 36) {
      fallbackAborted = true;
      break;
    }
    if (definition.effect?.controlFlow) {
      fallbackUnsupported = true;
      unsupportedSkillIds.push(definition.skillId);
      continue;
    }
    if (definition.budgetCost > current.aiBudget) continue;
    const fallbackWeight = Math.trunc(Number(slot.fallbackWeight) || 0);
    if (fallbackWeight <= 0) continue;
    fallbackTypes.add(type);
    const condition = legacyFallbackConditionScale(
      definition,
      slot,
      monster,
      current,
      fallbackRngState,
    );
    if (condition.rngState !== undefined) fallbackRngState = condition.rngState;
    if (!condition.exact) {
      fallbackApproximation = true;
      approximateTypes.add(type);
    }
    const probability = legacyFallbackProbability(definition, slot, condition.scale);
    if (condition.invalid) fallbackUnsupported = true;
    if (condition.consumesRoll !== false) {
      const roll = advanceRoll(fallbackRngState, 10_000);
      fallbackRngState = roll.state;
      fallbackConsumedRoll = true;
      // Native selects when probability is strictly greater than the 0..9999
      // roll (the branch is `if (probability <= roll) continue`).
      if (probability <= roll.value) continue;
    }
    if (!isSupportedDefinition(definition)) {
      // Returning an undecoded effect would make PuzzleEngine dispatch a
      // record it cannot execute. Keep the native RNG decision visible while
      // leaving the selection unresolved and reporting the unsupported id.
      fallbackUnsupported = true;
      unsupportedSkillIds.push(definition.skillId);
      continue;
    }
    selected = definition;
    selectedScale = condition.scale;
    selectedType = type;
    selectedProbability = probability;
    break;
  }

  return {
    selected,
    selectedScale,
    selectedType,
    selectedProbability,
    rngState: fallbackRngState,
    fallbackAborted,
    fallbackUnsupported,
    fallbackApproximation,
    fallbackConsumedRoll,
    fallbackTypes,
    approximateTypes,
    unsupportedSkillIds,
  };
}

function currentLegacyUseCount(state) {
  return Math.max(0, Math.trunc(Number(state.enemyAiUseCount) || 0));
}

function legacyResult(monster, current, rngState, selected, diagnostics = {}) {
  const regeneratedBudget = Math.min(
    monster.budgetCap,
    Math.max(0, current.aiBudget + monster.budgetRegen),
  );
  return Object.freeze({
    skillId: selected?.skillId ?? null,
    effect: selected?.effect ?? null,
    rngState,
    aiBudget: regeneratedBudget - (selected?.budgetCost || 0),
    aiMode: 'legacy',
    fidelity: selected
      ? diagnostics.legacyFallbackSelected
        ? diagnostics.legacyFallbackApproximation
          ? 'legacy-fallback-approximate'
          : 'legacy-fallback-recovered'
        : diagnostics.legacyCallbackApproximation || diagnostics.legacyConditionApproximation
          ? 'legacy-ordinary-approximate'
          : 'legacy-ordinary-recovered'
      : diagnostics.legacyFallbackEncountered || diagnostics.legacyFallbackAborted
        ? 'legacy-fallback-no-selection'
        : 'legacy-ordinary-no-selection',
    ...diagnostics,
  });
}

// Conservative implementation of the recovered ordinary and fallback
// branches. It keeps the native scan order, static HP/budget gates, +0x3c
// mode bit, float32 scaling, immediate probability arithmetic, fallback
// factor/weight arithmetic, and LCG comparisons exact. Status lanes that do
// not yet have a named browser field use the explicit hook/map above and are
// marked approximate when the native-initialized scale is used.
export function selectPadEnemyAiLegacy(monster, definitions, state = {}) {
  if (!monster || monster.usesNewAi) {
    throw new Error('selectPadEnemyAiLegacy requires a legacy (mode bit 0 clear) monster definition.');
  }
  const definitionMap = normalizeDefinitionMap(definitions);
  const current = normalizeLegacySelectorState(state, monster);
  let rngState = Number(state.rngState) >>> 0;
  let selected = null;
  const unsupportedSkillIds = [];
  const approximateCallbackTypes = new Set();
  // The native fallback pass always restarts at slot zero. Build its complete
  // decoded view before the ordinary scan so an early effect-type-36 transfer
  // can force that pass without losing the slots that follow it.
  const fallbackCandidates = [];
  for (const slot of monster.slots) {
    const definition = definitionMap.get(slot.skillId);
    if (definition) fallbackCandidates.push({ slot, definition });
  }
  let sawFallback = fallbackCandidates.some(({ slot }) => slot.fallbackWeight > 0);
  let sawControlFlow = false;
  let sawUnsupportedRecord = false;
  let sawConditionValueProblem = false;
  let forceFallback = false;

  for (const slot of monster.slots) {
    const definition = definitionMap.get(slot.skillId);
    if (!definition) continue;
    // Legacy tables can contain records whose effect decoder is not complete
    // yet.  Apply the recovered scalar gates before classifying such a record
    // so the result reports it instead of failing the whole pool load.
    const hpPercent = current.maxHp > 0 ? current.currentHp / current.maxHp * 100 : 0;
    const type = definition.effect?.type;
    // The native flag table marks legacy types 21..38 and 43..45 as scalar
    // bypasses as well. Those records still remain unsupported here, but
    // classifying them after the bypass preserves diagnostics even when the
    // authored HP threshold would otherwise hide them.
    const bypassScalarGates = type === 47
      || (type >= 21 && type <= 38)
      || (type >= 43 && type <= 45);
    // The native effect-type-36 branch is reached before the ordinary
    // budget/HP gates and jumps directly to 0x61e300. Effect type 49 is
    // likewise omitted from the ordinary probability path. Keep those
    // control transfers ahead of the local gates so a later ordinary record
    // cannot win first.
    if (type === 36) {
      forceFallback = true;
      break;
    }
    if (type === 49) {
      continue;
    }
    if (definition.budgetCost > current.aiBudget
      || (!bypassScalarGates && hpPercent > definition.hpThresholdPercent)) {
      continue;
    }
    if (definition.effect?.controlFlow) {
      sawControlFlow = true;
      sawUnsupportedRecord = true;
      unsupportedSkillIds.push(slot.skillId);
      continue;
    }
    if (!isSupportedDefinition(definition)) {
      sawUnsupportedRecord = true;
      unsupportedSkillIds.push(slot.skillId);
      continue;
    }
    // Type 47 reaches the probability epilogue even when +0xf0 is zero; the
    // resulting probability is still zero, so no LCG state is consumed.
    if (slot.immediateChance === 0 && !bypassScalarGates) continue;
    // Type 16 consumes the incoming legacy scale itself; evaluating it with
    // the new-AI default scale would incorrectly reject every non-water
    // monster.  The callback helper below applies its exact complement.
    const conditionGate = type === 16
      ? { eligible: true, probabilityScale: 1, rngState }
      : evaluateCondition(definition, current, rngState, !bypassScalarGates);
    rngState = conditionGate.rngState;
    if (!conditionGate.eligible) continue;
    const condition = legacyConditionScale(definition, monster, current);
    if (!condition.valid || condition.scale <= 0) {
      sawConditionValueProblem = true;
      continue;
    }
    const callbackBase = legacyCallbackScale(
      definition,
      conditionGate,
      condition.scale,
      current,
    );
    const callback = current.legacyConditionForceOne && condition.adjustedValue > 9_998
      ? { scale: Math.fround(1), exact: true, mode: 'native-large-condition-forced-one' }
      : callbackBase;
    if (!callback.exact) approximateCallbackTypes.add(type);
    const effectiveScale = callback.scale;
    if (effectiveScale <= 0) continue;
    const probability = immediateProbability(definition, slot, effectiveScale);
    if (probability <= 0) continue;
    const roll = advanceRoll(rngState, 10_000);
    rngState = roll.state;
    if (Math.fround(10_000 - probability) <= roll.value) {
      selected = definition;
      break;
    }
  }

  let fallbackSelection = {
    selected: null,
    selectedScale: null,
    selectedType: null,
    selectedProbability: null,
    rngState,
    fallbackAborted: false,
    fallbackUnsupported: false,
    fallbackApproximation: false,
    fallbackConsumedRoll: false,
    fallbackTypes: new Set(),
    approximateTypes: new Set(),
    unsupportedSkillIds: [],
  };
  if (!selected && (forceFallback || fallbackCandidates.length > 0)) {
    fallbackSelection = selectLegacyFallback(
      monster,
      fallbackCandidates,
      current,
      current,
      rngState,
    );
    rngState = fallbackSelection.rngState;
    selected = fallbackSelection.selected;
    if (fallbackSelection.fallbackUnsupported) sawUnsupportedRecord = true;
    unsupportedSkillIds.push(...fallbackSelection.unsupportedSkillIds);
  }

  const unsupportedReason = sawControlFlow
    ? 'legacy-flow-control-not-decoded'
    : fallbackSelection.fallbackAborted
      ? 'legacy-fallback-skill-id36-sentinel'
      : fallbackSelection.fallbackUnsupported
        ? 'legacy-fallback-unsupported-record'
        : sawUnsupportedRecord && !sawFallback
          ? 'legacy-unsupported-record'
          : sawConditionValueProblem && !sawFallback
            ? 'legacy-condition-scale-rejected'
            : null;
  const diagnostics = {
    legacyUnsupported: !selected && (
      sawControlFlow
      || sawUnsupportedRecord
      || sawConditionValueProblem
      || fallbackSelection.fallbackUnsupported
    ),
    ...(sawFallback || forceFallback || fallbackSelection.fallbackAborted ? {
      legacyFallbackEncountered: true,
    } : {}),
    ...(fallbackSelection.fallbackAborted ? {
      legacyFallbackAborted: true,
    } : {}),
    ...(fallbackSelection.fallbackUnsupported ? {
      legacyFallbackUnsupported: true,
    } : {}),
    ...(fallbackSelection.fallbackApproximation ? {
      legacyFallbackApproximation: true,
      approximateFallbackTypes: Object.freeze([
        ...fallbackSelection.approximateTypes,
      ]),
    } : {}),
    ...(fallbackSelection.fallbackTypes.size > 0 ? {
      legacyFallbackTypes: Object.freeze([...fallbackSelection.fallbackTypes]),
    } : {}),
    ...(fallbackSelection.selected ? {
      legacyFallbackSelected: true,
      legacyFallbackType: fallbackSelection.selectedType,
      legacyFallbackScale: fallbackSelection.selectedScale,
      legacyFallbackProbability: fallbackSelection.selectedProbability,
    } : {}),
    ...(unsupportedSkillIds.length > 0 ? {
      unsupportedSkillIds: Object.freeze([...new Set(unsupportedSkillIds)]),
    } : {}),
    ...(unsupportedReason ? { unsupportedReason } : {}),
    ...(approximateCallbackTypes.size > 0 ? {
      legacyCallbackApproximation: true,
      approximateCallbackTypes: Object.freeze([...approximateCallbackTypes]),
    } : {}),
  };
  if (selected && !fallbackSelection.selected && !Number.isFinite(current.legacyConditionBase)) {
    diagnostics.legacyConditionApproximation = true;
  }
  const result = legacyResult(monster, current, rngState, selected, diagnostics);
  return Object.freeze({
    ...result,
  });
}
