import { padLcgStep } from './padCoreRules.js';
import {
  PAD_ENEMY_SKILL_SOURCE_ORB_CONVERSION,
  PAD_ENEMY_SKILL_CLEAR_PLAYER_BUFFS,
  PAD_ENEMY_SKILL_HEAL_ENEMY,
  PAD_ENEMY_SKILL_ADDITIONAL_ATTACK,
  PAD_ENEMY_SKILL_SOURCE_TO_JAMMER,
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

function isStaticallyEligible(definition, state) {
  if (!definition.effect.supported || ![
    PAD_ENEMY_SKILL_SOURCE_ORB_CONVERSION,
    PAD_ENEMY_SKILL_CLEAR_PLAYER_BUFFS,
    PAD_ENEMY_SKILL_HEAL_ENEMY,
    PAD_ENEMY_SKILL_ADDITIONAL_ATTACK,
    PAD_ENEMY_SKILL_SOURCE_TO_JAMMER,
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
    PAD_ENEMY_SKILL_POISON_MASK_SWAP,
    PAD_ENEMY_SKILL_POISON_MASK_SWAP_DIRECT,
    PAD_ENEMY_SKILL_BLOCK_MINUS,
    PAD_ENEMY_SKILL_BUR_DROP,
  ].includes(definition.effect.type)) return false;
  if (definition.budgetCost > state.aiBudget) return false;
  const hpPercent = state.maxHp > 0 ? state.currentHp / state.maxHp * 100 : 0;
  return hpPercent <= definition.hpThresholdPercent;
}

function evaluateCondition(definition, state, rngState) {
  if (!isStaticallyEligible(definition, state)) {
    return { eligible: false, probabilityScale: 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_BLACK_FALL) {
    const eligible = !state.blackFallActive;
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
  if (definition.effect.type === PAD_ENEMY_SKILL_ADDITIONAL_ATTACK) {
    // 0x61b450 performs this division and izMathClipF entirely in binary32.
    const ratio = state.enemyBaseAttack > 0
      ? Math.fround(Math.fround(state.playerCurrentHp) / Math.fround(state.enemyBaseAttack))
      : state.playerCurrentHp > 0 ? 2 : 0;
    const probabilityScale = Math.fround(Math.min(2, Math.max(0, ratio)));
    return { eligible: probabilityScale > 0, probabilityScale, rngState };
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
    const eligible = state.enemies.some((enemy) => Number(enemy?.hp) <= 0);
    return { eligible, probabilityScale: eligible ? 1 : 0, rngState };
  }
  if (definition.effect.type === PAD_ENEMY_SKILL_ATTRIBUTE_ABSORB) {
    const eligible = state.attributeAbsorbTurns <= 0;
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

// Supported subset of chooseEnemyAiNew (0x61d450). Flow-control definitions
// and condition callbacks outside the explicitly decoded set remain rejected.
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
    enemyAttribute: Math.trunc(Number(state.enemyAttribute)),
    enemies: Array.isArray(state.enemies) ? state.enemies : [],
    party: Array.isArray(state.party) ? state.party : [],
    aiBudget: Math.max(0, Math.trunc(Number(state.aiBudget ?? monster.budgetCap) || 0)),
    blackFallActive: Boolean(state.blackFallActive),
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
