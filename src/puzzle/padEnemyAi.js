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
  PAD_ENEMY_SKILL_LEADER_SWAP,
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
    PAD_ENEMY_SKILL_LEADER_SWAP,
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
  if (definition.effect.type === PAD_ENEMY_SKILL_BLACK_FALL) {
    const eligible = !state.blackFallActive;
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
  if (definition.effect.type === PAD_ENEMY_SKILL_LEADER_SWAP) {
    // 0x61ab74 calls the native changeable-sub counter and only checks whether
    // it is positive. Target selection belongs to setup and consumes RNG later.
    const eligible = state.leaderSwapTurns <= 0 && state.leaderSwapCandidateCount > 0;
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
    leaderSwapTurns: Math.max(0, Math.trunc(Number(state.leaderSwapTurns) || 0)),
    leaderSwapCandidateCount: Math.max(
      0,
      Math.trunc(Number(state.leaderSwapCandidateCount) || 0),
    ),
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
