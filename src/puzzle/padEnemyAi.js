import { padLcgStep } from './padCoreRules.js';
import {
  PAD_ENEMY_SKILL_BLACK_FALL,
  decodePadEnemySkillDefinition,
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

function isStaticallyEligibleBlackFall(definition, state) {
  if (definition.effect.type !== PAD_ENEMY_SKILL_BLACK_FALL || !definition.effect.supported) return false;
  if (definition.budgetCost > state.aiBudget) return false;
  const hpPercent = state.maxHp > 0 ? state.currentHp / state.maxHp * 100 : 0;
  return hpPercent <= definition.hpThresholdPercent;
}

function isConditionEligibleBlackFall(definition, state) {
  return isStaticallyEligibleBlackFall(definition, state) && !state.blackFallActive;
}

function advanceRoll(state, scale) {
  const stepped = padLcgStep(state);
  return {
    state: stepped.state,
    value: Math.floor(stepped.value * scale / 0x10000),
  };
}

function immediateProbability(definition, slot) {
  const product = Math.imul(
    Math.imul(definition.immediateFactor0, definition.immediateFactor1),
    slot.immediateChance,
  );
  return Math.fround(Math.min(10_000, Math.trunc(product / 100_000)));
}

// Supported subset of chooseEnemyAiNew (0x61d450). Flow-control definitions
// and condition callbacks other than type 128 remain outside this boundary.
// The native scan performs immediate probability rolls in slot order, then a
// single weighted fallback roll across eligible +0xf1 entries.
export function selectPadEnemyAiNew(monster, definitions, state = {}) {
  const definitionMap = normalizeDefinitionMap(definitions);
  const current = {
    currentHp: Math.max(0, Number(state.currentHp) || 0),
    maxHp: Math.max(0, Number(state.maxHp) || 0),
    aiBudget: Math.max(0, Math.trunc(Number(state.aiBudget ?? monster.budgetCap) || 0)),
    blackFallActive: Boolean(state.blackFallActive),
  };
  let rngState = Number(state.rngState) >>> 0;
  let selected = null;
  const fallback = [];

  for (const slot of monster.slots) {
    const definition = definitionMap.get(slot.skillId);
    if (!definition || !isStaticallyEligibleBlackFall(definition, current)) continue;
    if (slot.fallbackWeight > 0) fallback.push({ slot, definition });
    if (!isConditionEligibleBlackFall(definition, current)) continue;
    if (slot.immediateChance === 0) continue;
    const probability = immediateProbability(definition, slot);
    if (probability <= 0) continue;
    const roll = advanceRoll(rngState, 10_000);
    rngState = roll.state;
    if (Math.fround(10_000 - probability) <= roll.value) {
      selected = definition;
      break;
    }
  }

  if (!selected && fallback.length > 0) {
    const eligibleFallback = fallback.filter((candidate) => (
      isConditionEligibleBlackFall(candidate.definition, current)
    ));
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
