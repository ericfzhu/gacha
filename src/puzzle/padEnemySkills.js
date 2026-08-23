export const PAD_ENEMY_SKILL_SOURCE_ORB_CONVERSION = 4;
export const PAD_ENEMY_SKILL_ENTIRE_BLIND = 5;
export const PAD_ENEMY_SKILL_ENTIRE_BLIND_ALT = 62;
export const PAD_ENEMY_SKILL_BIND_ATTACK = 63;
export const PAD_ENEMY_SKILL_CLEAR_PLAYER_BUFFS = 6;
export const PAD_ENEMY_SKILL_HEAL_ENEMY = 7;
export const PAD_ENEMY_SKILL_ADDITIONAL_ATTACK = 8;
export const PAD_ENEMY_SKILL_DEFENSE_BOOST = 9;
export const PAD_ENEMY_SKILL_ATTRIBUTE_NULLIFY = 10;
export const PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY = 11;
export const PAD_ENEMY_SKILL_SOURCE_TO_JAMMER = 12;
export const PAD_ENEMY_SKILL_RANDOM_PARTY_BIND = 13;
export const PAD_ENEMY_SKILL_ACTIVE_SKILL_SEAL = 14;
export const PAD_ENEMY_SKILL_REPEAT_ATTACK = 15;
export const PAD_ENEMY_SKILL_INACTIVITY = 16;
export const PAD_ENEMY_SKILL_LONE_ATTACK_BOOST = 17;
export const PAD_ENEMY_SKILL_STATUS_TRIGGERED_ATTACK_BOOST = 18;
export const PAD_ENEMY_SKILL_DAMAGED_TURN_ATTACK_BOOST = 19;
export const PAD_ENEMY_SKILL_STATUS_SHIELD = 20;
export const PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION = 39;
export const PAD_ENEMY_SKILL_SELF_DESTRUCT = 40;
export const PAD_ENEMY_SKILL_CHANGE_ATTRIBUTE = 46;
export const PAD_ENEMY_SKILL_SCALED_ATTACK = 47;
export const PAD_ENEMY_SKILL_CURRENT_HP_GRAVITY = 50;
export const PAD_ENEMY_SKILL_REVIVE_ENEMY = 52;
export const PAD_ENEMY_SKILL_ATTRIBUTE_ABSORB = 53;
export const PAD_ENEMY_SKILL_BIND_LEADER_HELPER = 54;
export const PAD_ENEMY_SKILL_HEAL_PLAYER = 55;
export const PAD_ENEMY_SKILL_SOURCE_TO_POISON = 56;
export const PAD_ENEMY_SKILL_POISON_BLOCKS = 57;
export const PAD_ENEMY_SKILL_SOURCE_TO_MORTAL_POISON = 58;
export const PAD_ENEMY_SKILL_MORTAL_POISON_BLOCKS = 59;
export const PAD_ENEMY_SKILL_POISON_BLOCK_N_COUNTED = 60;
export const PAD_ENEMY_SKILL_MORTAL_POISON_BLOCK_N_COUNTED = 61;
export const PAD_ENEMY_SKILL_POISON_BLOCK_N = 64;
export const PAD_ENEMY_SKILL_RANDOM_SUB_BIND = 65;
export const PAD_ENEMY_SKILL_INACTIVITY_UNCONDITIONAL = 66;
export const PAD_ENEMY_SKILL_COMBO_ABSORB = 67;
export const PAD_ENEMY_SKILL_SKYFALL_RATE = 68;
export const PAD_ENEMY_SKILL_DEATH_CRY = 69;
export const PAD_ENEMY_SKILL_INACTIVITY_PRESENTATION = 70;
export const PAD_ENEMY_SKILL_DAMAGE_VOID = 71;
export const PAD_ENEMY_SKILL_ATTRIBUTE_RESIST = 72;
export const PAD_ENEMY_SKILL_RESOLVE = 73;
export const PAD_ENEMY_SKILL_DAMAGE_SHIELD = 74;
export const PAD_ENEMY_SKILL_LEADER_SWAP = 75;
export const PAD_ENEMY_SKILL_VERTICAL_LINES_4 = 76;
export const PAD_ENEMY_SKILL_VERTICAL_LINES = 77;
export const PAD_ENEMY_SKILL_HORIZONTAL_LINES_4 = 78;
export const PAD_ENEMY_SKILL_HORIZONTAL_LINES = 79;
export const PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP_DIRECT = 80;
export const PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP = 81;
export const PAD_ENEMY_SKILL_NORMAL_ATTACK = 82;
export const PAD_ENEMY_SKILL_MULTI_ATTACK = 83;
export const PAD_ENEMY_SKILL_POISON_MASK_SWAP_DIRECT = 84;
export const PAD_ENEMY_SKILL_POISON_MASK_SWAP = 85;
export const PAD_ENEMY_SKILL_HEAL_ENEMY_UNCONDITIONAL = 86;
export const PAD_ENEMY_SKILL_DAMAGE_ABSORB = 87;
export const PAD_ENEMY_SKILL_AWAKENING_BIND = 88;
export const PAD_ENEMY_SKILL_SKILL_DELAY = 89;
export const PAD_ENEMY_SKILL_PRESENCE_CHECK = 90;
export const PAD_ENEMY_SKILL_MASKED_RANDOM_ORB_CHANGE = 92;
export const PAD_ENEMY_SKILL_NATIVE_NO_EFFECT = 93;
export const PAD_ENEMY_SKILL_LOCK_RANDOM_ORBS = 94;
export const PAD_ENEMY_SKILL_ENEMY_ESCAPE = 95;
export const PAD_ENEMY_SKILL_BLACK_FALL = 128;
export const PAD_ENEMY_SKILL_BLOCK_MINUS = 151;
export const PAD_ENEMY_SKILL_BUR_DROP = 153;

const PAD_INT32_MAX = 0x7fffffff;
const PAD_INT32_MIN = -0x80000000;

export const PAD_ENEMY_SKILL_RUNTIME_LAYOUT = Object.freeze({
  definitionTypeOffset: 0x04,
  monsterDurationOffset: 0x678,
  monsterChanceOffset: 0x67c,
});

export const PAD_ENEMY_SKILL_DEFINITION_LAYOUT = Object.freeze({
  typeOffset: 0x04,
  parameter0Offset: 0x10,
  parameter1Offset: 0x14,
  attackWithSkillOffset: 0x44,
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

function decodeBlackFallRuntime(type, packedDuration, rawChance) {
  const durationTurns = (((packedDuration & 0x03ff) << 22) >> 22);
  const chanceBasisPoints = (rawChance << 16) >> 16;
  return Object.freeze({
    type,
    kind: 'blackFall',
    supported: durationTurns > 0,
    durationTurns,
    chanceBasisPoints,
    packedDuration,
    rawChance,
  });
}

// _setupEnemyAttackSub's type-128 entry at 0x6211a0 copies the first authored
// parameter to sMONSTER+0x678. A positive second parameter is converted from a
// percentage to basis points; zero or a negative value selects the native
// 10000-basis-point default at 0x621f20.
export function decodePadEnemySkillDefinition(skillDefinition) {
  const definitionBytes = asBytes(skillDefinition, 'PAD enemy-skill definition');
  requireLength(
    definitionBytes,
    PAD_ENEMY_SKILL_DEFINITION_LAYOUT.parameter1Offset + 4,
    'PAD enemy-skill definition',
  );
  const definition = new DataView(
    definitionBytes.buffer,
    definitionBytes.byteOffset,
    definitionBytes.byteLength,
  );
  const type = definition.getInt16(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.typeOffset, true);
  const attackWithSkillValue = definitionBytes.byteLength
      >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
    ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
    : null;
  if (type === PAD_ENEMY_SKILL_SOURCE_ORB_CONVERSION) {
    return Object.freeze({
      type,
      kind: 'sourceOrbConversion',
      supported: true,
      sourceType: definition.getInt32(0x10, true),
      destinationType: definition.getInt32(0x14, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_ENTIRE_BLIND || type === PAD_ENEMY_SKILL_ENTIRE_BLIND_ALT) {
    return Object.freeze({
      type,
      kind: 'entireBlind',
      supported: true,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_BIND_ATTACK) {
    requireLength(definitionBytes, 0x24, 'PAD enemy-skill definition');
    const durationMin = definition.getInt32(0x14, true);
    const durationMax = definition.getInt32(0x18, true);
    return Object.freeze({
      type,
      kind: 'bindAttack',
      supported: durationMax >= durationMin,
      nativePresentationParameter: definition.getInt32(0x10, true),
      durationMin,
      durationMax,
      targetSelector: definition.getInt32(0x1c, true),
      targetCount: definition.getInt32(0x20, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_RANDOM_SUB_BIND) {
    requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    const durationMin = definition.getInt32(0x14, true);
    const durationMax = definition.getInt32(0x18, true);
    return Object.freeze({
      type,
      kind: 'randomSubBind',
      supported: durationMax >= durationMin,
      targetCount: definition.getInt32(0x10, true),
      durationMin,
      durationMax,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_CLEAR_PLAYER_BUFFS) {
    return Object.freeze({
      type,
      kind: 'clearPlayerBuffs',
      supported: true,
      attackWithSkillValue,
    });
  }
  if (
    type === PAD_ENEMY_SKILL_HEAL_ENEMY
    || type === PAD_ENEMY_SKILL_HEAL_ENEMY_UNCONDITIONAL
    || type === PAD_ENEMY_SKILL_ADDITIONAL_ATTACK
  ) {
    const healEnemy = type !== PAD_ENEMY_SKILL_ADDITIONAL_ATTACK;
    const percentMin = definition.getInt32(0x10, true);
    const percentMax = definition.getInt32(0x14, true);
    return Object.freeze({
      type,
      kind: healEnemy ? 'healEnemy' : 'additionalAttack',
      supported: percentMax >= percentMin,
      percentMin,
      percentMax,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_DAMAGE_ABSORB) {
    return Object.freeze({
      type,
      kind: 'damageAbsorb',
      supported: true,
      durationTurns: Math.max(0, (definition.getInt32(0x10, true) << 16) >> 16),
      damageThreshold: definition.getInt32(0x14, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_AWAKENING_BIND) {
    return Object.freeze({
      type,
      kind: 'awakeningBind',
      supported: true,
      durationTurns: definition.getInt32(0x10, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_SKILL_DELAY) {
    const delayMin = definition.getInt32(0x10, true);
    const delayMax = definition.getInt32(0x14, true);
    return Object.freeze({
      type,
      kind: 'skillDelay',
      supported: delayMax >= delayMin,
      delayMin,
      delayMax,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_PRESENCE_CHECK) {
    requireLength(definitionBytes, 0x30, 'PAD enemy-skill definition');
    const candidateCardIds = [];
    for (let offset = 0x10; offset <= 0x2c; offset += 4) {
      const cardId = definition.getInt32(offset, true);
      if (cardId <= 0) break;
      candidateCardIds.push(cardId);
    }
    return Object.freeze({
      type,
      kind: 'presenceCheck',
      supported: true,
      candidateCardIds: Object.freeze(candidateCardIds),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_MASKED_RANDOM_ORB_CHANGE) {
    requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'maskedRandomOrbChange',
      supported: true,
      perTypeCount: definition.getInt32(0x10, true),
      destinationTypeMask: definition.getUint32(0x14, true),
      excludedSourceTypeMask: definition.getUint32(0x18, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_NATIVE_NO_EFFECT) {
    return Object.freeze({
      type,
      kind: 'nativeNoEffect',
      supported: true,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_LOCK_RANDOM_ORBS) {
    requireLength(definitionBytes, 0x18, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'lockRandomOrbs',
      supported: true,
      typeMask: definition.getUint32(0x10, true),
      lockCount: definition.getInt32(0x14, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_ENEMY_ESCAPE) {
    return Object.freeze({
      type,
      kind: 'enemyEscape',
      supported: true,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_DEFENSE_BOOST) {
    requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    const percentMin = definition.getInt32(0x14, true);
    const percentMax = definition.getInt32(0x18, true);
    return Object.freeze({
      type,
      kind: 'defenseBoost',
      supported: percentMax >= percentMin,
      durationTurns: definition.getInt32(0x10, true),
      percentMin,
      percentMax,
      attackWithSkillValue,
    });
  }
  if (
    type === PAD_ENEMY_SKILL_ATTRIBUTE_NULLIFY
    || type === PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY
  ) {
    if (type === PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY) {
      requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    }
    const attributes = type === PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY
      ? [definition.getInt32(0x14, true), definition.getInt32(0x18, true)]
      : [definition.getInt32(0x14, true)];
    return Object.freeze({
      type,
      kind: 'attributeNullify',
      supported: true,
      durationTurns: definition.getInt32(0x10, true),
      attributes: Object.freeze(attributes),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_SOURCE_TO_JAMMER) {
    return Object.freeze({
      type,
      kind: 'sourceToJammer',
      supported: true,
      sourceType: definition.getInt32(0x10, true),
      destinationType: 6,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_RANDOM_PARTY_BIND) {
    return Object.freeze({
      type,
      kind: 'randomPartyBind',
      supported: true,
      targetCount: definition.getInt32(0x10, true),
      nativeParameter1: definition.getInt32(0x14, true),
      durationTurns: 6,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_ACTIVE_SKILL_SEAL) {
    const durationMin = definition.getInt32(0x10, true);
    const durationMax = definition.getInt32(0x14, true);
    return Object.freeze({
      type,
      kind: 'activeSkillSeal',
      supported: durationMax >= durationMin,
      durationMin,
      durationMax,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_REPEAT_ATTACK) {
    requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    const hitCountMin = definition.getInt32(0x10, true);
    const hitCountMax = definition.getInt32(0x14, true);
    return Object.freeze({
      type,
      kind: 'repeatAttack',
      supported: hitCountMax >= hitCountMin,
      hitCountMin,
      hitCountMax,
      damagePercent: definition.getInt32(0x18, true),
      attackWithSkillValue,
    });
  }
  if ([PAD_ENEMY_SKILL_INACTIVITY, PAD_ENEMY_SKILL_INACTIVITY_UNCONDITIONAL].includes(type)) {
    return Object.freeze({
      type,
      kind: 'inactivity',
      supported: true,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_INACTIVITY_PRESENTATION) {
    requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'inactivityPresentation',
      supported: true,
      presentationParameters: Object.freeze(Array.from(
        { length: 3 },
        (_, index) => definition.getInt32(0x10 + index * 4, true),
      )),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_DAMAGE_VOID) {
    requireLength(definitionBytes, 0x20, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'damageVoid',
      supported: true,
      nativePresentationParameter: definition.getInt32(0x10, true),
      durationTurns: definition.getInt32(0x14, true),
      nativeMode: definition.getInt32(0x18, true),
      damageThreshold: Math.max(0, definition.getInt32(0x1c, true)),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_ATTRIBUTE_RESIST) {
    requireLength(definitionBytes, 0x18, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'attributeResist',
      supported: true,
      passive: true,
      attributeMask: definition.getInt32(0x10, true) & 0x1f,
      shieldPercent: definition.getInt32(0x14, true) & 0xffff,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_RESOLVE) {
    requireLength(definitionBytes, 0x14, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'resolve',
      supported: true,
      passive: true,
      hpThresholdPercent: definition.getInt32(0x10, true) & 0xffff,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_DAMAGE_SHIELD) {
    requireLength(definitionBytes, 0x18, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'damageShield',
      supported: true,
      durationTurns: Math.max(0, (definition.getInt32(0x10, true) << 16) >> 16),
      shieldPercent: Math.min(100, Math.max(0, definition.getInt32(0x14, true))),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_LEADER_SWAP) {
    requireLength(definitionBytes, 0x14, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'leaderSwap',
      supported: true,
      durationTurns: Math.max(0, (definition.getInt32(0x10, true) << 16) >> 16),
      selectedPartyIndex: null,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_NORMAL_ATTACK) {
    return Object.freeze({
      type,
      kind: 'normalAttack',
      supported: true,
      damagePercent: 100,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_MULTI_ATTACK) {
    requireLength(definitionBytes, 0x30, 'PAD enemy-skill definition');
    const childSkillIds = [];
    for (let index = 0; index < 8; index += 1) {
      const childSkillId = definition.getInt32(0x10 + index * 4, true);
      if (childSkillId <= 0) break;
      childSkillIds.push(childSkillId);
    }
    return Object.freeze({
      type,
      kind: 'multiAttack',
      supported: childSkillIds.length > 0,
      childSkillIds: Object.freeze(childSkillIds),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_LONE_ATTACK_BOOST) {
    requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'loneAttackBoost',
      supported: true,
      durationTurns: definition.getInt32(0x14, true),
      boostPercent: definition.getInt32(0x18, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_STATUS_TRIGGERED_ATTACK_BOOST) {
    return Object.freeze({
      type,
      kind: 'statusTriggeredAttackBoost',
      supported: true,
      durationTurns: definition.getInt32(0x10, true),
      boostPercent: definition.getInt32(0x14, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_DAMAGED_TURN_ATTACK_BOOST) {
    requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'damagedTurnAttackBoost',
      supported: true,
      damagedTurnThreshold: definition.getInt32(0x10, true),
      durationTurns: definition.getInt32(0x14, true),
      boostPercent: definition.getInt32(0x18, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_STATUS_SHIELD) {
    return Object.freeze({
      type,
      kind: 'statusShield',
      supported: true,
      durationTurns: definition.getInt32(0x10, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION) {
    return Object.freeze({
      type,
      kind: 'moveTimeReduction',
      supported: true,
      durationTurns: definition.getInt32(0x10, true),
      fixedReductionCentiseconds: definition.getInt32(0x14, true),
      percentReduction: definition.getInt32(0x18, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_SELF_DESTRUCT) {
    return Object.freeze({
      type,
      kind: 'selfDestruct',
      supported: true,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_CHANGE_ATTRIBUTE) {
    requireLength(definitionBytes, 0x24, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'changeEnemyAttribute',
      supported: true,
      candidateAttributes: Object.freeze(Array.from(
        { length: 5 },
        (_, index) => definition.getInt32(0x10 + index * 4, true),
      )),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_SCALED_ATTACK) {
    return Object.freeze({
      type,
      kind: 'scaledAttack',
      supported: true,
      damagePercent: definition.getInt32(0x14, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_CURRENT_HP_GRAVITY) {
    return Object.freeze({
      type,
      kind: 'currentHpGravity',
      supported: true,
      damagePercent: definition.getInt32(0x10, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_REVIVE_ENEMY) {
    return Object.freeze({
      type,
      kind: 'reviveEnemy',
      supported: true,
      revivePercent: definition.getInt32(0x10, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_ATTRIBUTE_ABSORB) {
    requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    const durationMin = definition.getInt32(0x10, true);
    const durationMax = definition.getInt32(0x14, true);
    const attributeMask = definition.getUint32(0x18, true) & 0x3f;
    return Object.freeze({
      type,
      kind: 'attributeAbsorb',
      supported: attributeMask !== 0 && durationMax >= durationMin,
      durationMin,
      durationMax,
      attributeMask,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_COMBO_ABSORB) {
    requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    const durationMin = definition.getInt32(0x10, true);
    const durationMax = definition.getInt32(0x14, true);
    return Object.freeze({
      type,
      kind: 'comboAbsorb',
      supported: durationMax >= durationMin,
      durationMin,
      durationMax,
      comboThreshold: definition.getInt32(0x18, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_SKYFALL_RATE) {
    requireLength(definitionBytes, 0x20, 'PAD enemy-skill definition');
    const durationMin = definition.getInt32(0x14, true);
    const durationMax = definition.getInt32(0x18, true);
    return Object.freeze({
      type,
      kind: 'skyfallRate',
      supported: durationMax >= durationMin,
      typeMask: definition.getUint32(0x10, true) & 0x1ff,
      durationMin,
      durationMax,
      chancePercent: definition.getInt32(0x1c, true),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_DEATH_CRY) {
    requireLength(definitionBytes, 0x30, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'deathCry',
      supported: true,
      messageCode: definition.getInt32(0x10, true),
      presentationParameters: Object.freeze(Array.from(
        { length: 7 },
        (_, index) => definition.getInt32(0x14 + index * 4, true),
      )),
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_BIND_LEADER_HELPER) {
    requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    const targetFlags = definition.getUint8(0x10) & 0x03;
    const durationMin = definition.getInt32(0x14, true);
    const durationMax = definition.getInt32(0x18, true);
    return Object.freeze({
      type,
      kind: 'bindLeaderHelper',
      supported: targetFlags !== 0 && durationMax >= durationMin,
      targetFlags,
      durationMin,
      durationMax,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_HEAL_PLAYER) {
    return Object.freeze({
      type,
      kind: 'healPlayer',
      supported: true,
      thresholdPercent: definition.getInt32(0x10, true),
      healPercent: definition.getInt32(0x14, true),
      attackWithSkillValue,
    });
  }
  if (
    type === PAD_ENEMY_SKILL_SOURCE_TO_POISON
    || type === PAD_ENEMY_SKILL_SOURCE_TO_MORTAL_POISON
  ) {
    return Object.freeze({
      type,
      kind: 'sourceToPoison',
      supported: true,
      sourceType: definition.getInt32(0x10, true),
      destinationType: type === PAD_ENEMY_SKILL_SOURCE_TO_MORTAL_POISON ? 8 : 7,
      attackWithSkillValue,
    });
  }
  if (
    type === PAD_ENEMY_SKILL_POISON_BLOCKS
    || type === PAD_ENEMY_SKILL_MORTAL_POISON_BLOCKS
  ) {
    return Object.freeze({
      type,
      kind: 'poisonBlocks',
      supported: true,
      count: definition.getInt32(0x10, true),
      excludeHeart: definition.getInt32(0x14, true) !== 0,
      destinationType: type === PAD_ENEMY_SKILL_MORTAL_POISON_BLOCKS ? 8 : 7,
      attackWithSkillValue,
    });
  }
  if (
    type === PAD_ENEMY_SKILL_POISON_BLOCK_N_COUNTED
    || type === PAD_ENEMY_SKILL_MORTAL_POISON_BLOCK_N_COUNTED
  ) {
    const count = definition.getInt32(0x10, true);
    return Object.freeze({
      type,
      kind: 'poisonBlockNCounted',
      supported: count > 0,
      count,
      excludeHeart: definition.getInt32(0x14, true) !== 0,
      destinationType: type === PAD_ENEMY_SKILL_MORTAL_POISON_BLOCK_N_COUNTED ? 8 : 7,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_POISON_BLOCK_N) {
    requireLength(definitionBytes, 0x20, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'poisonBlockN',
      supported: true,
      presentationValue: definition.getInt32(0x10, true),
      count: definition.getInt32(0x14, true),
      excludeHeart: definition.getInt32(0x18, true) !== 0,
      destinationType: definition.getInt32(0x1c, true) === 1 ? 8 : 7,
      attackWithSkillValue,
    });
  }
  if ([
    PAD_ENEMY_SKILL_HORIZONTAL_LINES_4,
    PAD_ENEMY_SKILL_HORIZONTAL_LINES,
    PAD_ENEMY_SKILL_VERTICAL_LINES_4,
    PAD_ENEMY_SKILL_VERTICAL_LINES,
  ].includes(type)) {
    const lineSwapCount = (
      type === PAD_ENEMY_SKILL_HORIZONTAL_LINES_4
      || type === PAD_ENEMY_SKILL_VERTICAL_LINES_4
    ) ? 4 : 3;
    requireLength(definitionBytes, 0x10 + lineSwapCount * 8, 'PAD enemy-skill definition');
    const lineSwaps = [];
    for (let index = 0; index < lineSwapCount; index += 1) {
      const offset = 0x10 + index * 8;
      lineSwaps.push(Object.freeze({
        lineMask: definition.getUint32(offset, true) & 0xff,
        destinationTypeMask: definition.getUint32(offset + 4, true) & 0xffff,
      }));
    }
    return Object.freeze({
      type,
      kind: (
        type === PAD_ENEMY_SKILL_HORIZONTAL_LINES
        || type === PAD_ENEMY_SKILL_HORIZONTAL_LINES_4
      ) ? 'horizontalLines' : 'verticalLines',
      supported: true,
      lineSwaps: Object.freeze(lineSwaps),
      attackWithSkillValue,
    });
  }
  if (
    type === PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP_DIRECT
    || type === PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP
  ) {
    const destinationOffset = type === PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP_DIRECT ? 0x10 : 0x14;
    requireLength(definitionBytes, destinationOffset + 0x10, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'poisonTypeListSwap',
      supported: true,
      ...(type === PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP
        ? { presentationValue: definition.getInt32(0x10, true) }
        : {}),
      destinationTypes: Object.freeze(Array.from(
        { length: 4 },
        (_, index) => definition.getInt32(destinationOffset + index * 4, true),
      )),
      attackWithSkillValue,
    });
  }
  if (
    type === PAD_ENEMY_SKILL_POISON_MASK_SWAP_DIRECT
    || type === PAD_ENEMY_SKILL_POISON_MASK_SWAP
  ) {
    const maskOffset = type === PAD_ENEMY_SKILL_POISON_MASK_SWAP_DIRECT ? 0x10 : 0x14;
    requireLength(definitionBytes, maskOffset + 4, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'poisonMaskSwap',
      supported: true,
      ...(type === PAD_ENEMY_SKILL_POISON_MASK_SWAP
        ? { presentationValue: definition.getInt32(0x10, true) }
        : {}),
      destinationTypeMask: definition.getUint32(maskOffset, true) & 0xffff,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_BLOCK_MINUS) {
    requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    const typeMask = definition.getUint32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.parameter0Offset, true);
    const powerPercent = definition.getInt32(
      PAD_ENEMY_SKILL_DEFINITION_LAYOUT.parameter1Offset,
      true,
    );
    const limit = definition.getInt32(0x18, true);
    return Object.freeze({
      type,
      kind: 'blockMinus',
      supported: true,
      typeMask,
      powerPercent,
      power: Math.fround(Math.fround(powerPercent) / Math.fround(100)),
      limit,
      attackWithSkillValue,
    });
  }
  if (type === PAD_ENEMY_SKILL_BUR_DROP) {
    requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'burDrop',
      supported: true,
      typeMask: definition.getUint32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.parameter0Offset, true),
      count: definition.getUint32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.parameter1Offset, true),
      descriptor: definition.getUint16(0x18, true),
      clearDescriptorHighBit: true,
      attackWithSkillValue,
    });
  }
  if (type !== PAD_ENEMY_SKILL_BLACK_FALL) {
    return Object.freeze({ type, kind: 'unsupported', supported: false });
  }
  const definitionDuration = definition.getInt32(
    PAD_ENEMY_SKILL_DEFINITION_LAYOUT.parameter0Offset,
    true,
  );
  const definitionChancePercent = definition.getInt32(
    PAD_ENEMY_SKILL_DEFINITION_LAYOUT.parameter1Offset,
    true,
  );
  const rawChance = definitionChancePercent >= 1
    ? Math.imul(definitionChancePercent, 100) >>> 0
    : 10_000;
  return Object.freeze({
    ...decodeBlackFallRuntime(type, definitionDuration & 0xffff, rawChance),
    definitionDuration,
    definitionChancePercent,
    attackWithSkillValue,
  });
}

// _doEnemySkill converts the positive signed +0x44 field to an unsigned
// float32 percentage, divides it by 100, and passes that multiplier to
// _setEnemyAttackMain. The latter converts the enemy's int64 attack to
// float32, multiplies in float32, and calls izMathRound (add 0.5, truncate for
// positive values). Keep every single-precision boundary explicit here.
export function padEnemySkillAttack(baseAttack, attackWithSkillPercent) {
  return padEnemySkillBoostedAttack(baseAttack, attackWithSkillPercent, 100);
}

// _setEnemyAttackMain applies the active sMONSTER+0x850 binary32 multiplier
// to its incoming attack ratio before multiplying the enemy's protected int64
// attack. Type 17 writes this lane from a signed authored percentage / 100.
export function padEnemySkillBoostedAttack(
  baseAttack,
  attackWithSkillPercent,
  boostPercent = 100,
) {
  const attack = Math.max(0, Math.trunc(Number(baseAttack) || 0));
  const percent = Math.trunc(Number(attackWithSkillPercent) || 0);
  if (percent <= 0 || attack <= 0) return 0;
  const attackMultiplier = Math.fround(Math.fround(percent >>> 0) / Math.fround(100));
  const boostMultiplier = Math.fround(
    Math.fround(Math.trunc(Number(boostPercent) || 0)) / Math.fround(100),
  );
  const multiplier = Math.fround(attackMultiplier * boostMultiplier);
  const scaled = Math.fround(Math.fround(attack) * multiplier);
  return Math.min(PAD_INT32_MAX, Math.max(0, Math.trunc(Math.fround(scaled + 0.5))));
}

// Type 55's 0x629900 handler divides its signed percentage in float32, then
// calls izMathSint32MulAdd(0, playerMaxHp, ratio). That helper promotes the
// float32 ratio to double, saturates to signed int32, and rounds halves away
// from zero. Keeping the float32 division explicit reproduces native boundary
// values that a direct binary64 percentage calculation can miss.
export function padEnemySkillPlayerHeal(maxHp, healPercent) {
  const hp = Math.trunc(Number(maxHp) || 0);
  const percent = Math.trunc(Number(healPercent) || 0);
  const ratio = Math.fround(Math.fround(percent) / Math.fround(100));
  const scaled = Math.max(PAD_INT32_MIN, Math.min(PAD_INT32_MAX, hp * ratio));
  return Math.trunc(scaled + (scaled < 0 ? -0.5 : 0.5));
}

// chooseEnemyAiSub's type-55 callback computes currentHp * 100 / maxHp in
// binary64 and passes it through izMathRoundD before comparing it to +0x10.
export function padEnemySkillPlayerHpCondition(currentHp, maxHp, thresholdPercent) {
  const current = Math.trunc(Number(currentHp) || 0);
  const maximum = Math.trunc(Number(maxHp) || 0);
  if (maximum <= 0) return false;
  const percentage = current * 100 / maximum;
  const rounded = Math.trunc(percentage + (percentage < 0 ? -0.5 : 0.5));
  return rounded <= Math.trunc(Number(thresholdPercent) || 0);
}

// Type 52's late handler reconstructs the target monster's protected int64
// max HP, multiplies it by the signed +0x10 percentage in binary64, divides by
// 100, and calls izMathRoundD (halves away from zero) before writing current HP.
export function padEnemySkillReviveHp(maxHp, revivePercent) {
  const maximum = Math.max(0, Math.trunc(Number(maxHp) || 0));
  const percent = Math.trunc(Number(revivePercent) || 0);
  const scaled = maximum * percent / 100;
  return Math.trunc(scaled + (scaled < 0 ? -0.5 : 0.5));
}

// Type 7 multiplies the acting monster's protected int64 max HP by its signed
// runtime percentage in binary64, divides by 100, and rounds to signed int64.
export function padEnemySkillEnemyHeal(maxHp, healPercent) {
  const maximum = Math.max(0, Math.trunc(Number(maxHp) || 0));
  const percent = Math.trunc(Number(healPercent) || 0);
  const scaled = maximum * percent / 100;
  return Math.trunc(scaled + (scaled < 0 ? -0.5 : 0.5));
}

// Type 8 first performs the signed int64 attack*percentage multiplication,
// converts that product to binary32, divides by binary32 100, then izMathRound.
export function padEnemySkillAdditionalAttack(baseAttack, damagePercent) {
  const attack = Math.max(0, Math.trunc(Number(baseAttack) || 0));
  const percent = Math.trunc(Number(damagePercent) || 0);
  const scaled = Math.fround(
    Math.fround(attack * percent) / Math.fround(100),
  );
  return Math.trunc(Math.fround(scaled + (scaled < 0 ? -0.5 : 0.5)));
}

// Type 9 reconstructs the protected int64 base defense, multiplies it by the
// signed runtime percentage, converts the product to binary32, divides by
// binary32 100, and passes the result through izMathRound.
export function padEnemySkillDefenseBoost(baseDefense, boostPercent) {
  const defense = Math.max(0, Math.trunc(Number(baseDefense) || 0));
  const percent = Math.trunc(Number(boostPercent) || 0);
  const scaled = Math.fround(
    Math.fround(defense * percent) / Math.fround(100),
  );
  return Math.trunc(Math.fround(scaled + (scaled < 0 ? -0.5 : 0.5)));
}

export function padEnemySkillAttributeNullifyMask(attributes) {
  return (Array.isArray(attributes) ? attributes : []).reduce((mask, attribute) => (
    mask + ((1 << (Math.trunc(Number(attribute) || 0) & 31)) & 0xffff)
  ), 0) & 0xffff;
}

// Type 50 reads current player HP, scales it by runtime +0x678 in binary32,
// and calls izMathRound. Its 100% fast path returns current HP directly.
export function padEnemySkillCurrentHpGravity(currentHp, damagePercent) {
  const current = Math.max(0, Math.trunc(Number(currentHp) || 0));
  const percent = Math.trunc(Number(damagePercent) || 0);
  if (percent <= 0 || current <= 0) return 0;
  if (percent === 100) return current;
  const scaled = Math.fround(
    Math.fround(Math.fround(current) * Math.fround(percent)) / Math.fround(100),
  );
  return Math.max(0, Math.trunc(Math.fround(scaled + 0.5)));
}

export function padEnemySkillAttributeCandidates(candidateAttributes, currentAttribute) {
  const current = Math.trunc(Number(currentAttribute));
  const authored = Array.isArray(candidateAttributes) ? candidateAttributes : [];
  return authored
    .slice(0, 5)
    .map((attribute) => Math.trunc(Number(attribute)))
    .filter((attribute) => attribute >= 0 && attribute < 5 && attribute !== current);
}

function signedInt16(value) {
  return (Math.trunc(Number(value) || 0) << 16) >> 16;
}

function roundHalfAwayFromZero(value) {
  return value < 0 ? Math.ceil(value - 0.5) : Math.floor(value + 0.5);
}

// Type 39 stores its move-time operand through a protected signed int16. A
// nonzero third parameter selects percentage reduction; otherwise the second
// parameter is a fixed reduction in centiseconds.
export function padEnemySkillMoveTimeSeconds(
  baseMoveTimeSeconds,
  fixedReductionCentiseconds,
  percentReduction,
) {
  const baseCentiseconds = Math.max(0, roundHalfAwayFromZero(
    Number(baseMoveTimeSeconds) * 100,
  ));
  const percent = signedInt16(percentReduction);
  const reduction = percent !== 0
    ? roundHalfAwayFromZero(baseCentiseconds * percent / 100)
    : signedInt16(fixedReductionCentiseconds);
  return Math.max(0, baseCentiseconds - reduction) / 100;
}

// _doEnemySkill's second jump table dispatches signed type 128 to 0x62a854.
// That handler reads the selected definition type at +0x04, the active
// monster's packed duration at +0x678, and its chance parameter at +0x67c.
// The duration is stored in a signed ten-bit status lane; the later spawn test
// consumes the signed low 16 bits of the chance getter against roll10000.
export function decodePadEnemySkillRuntime(skillDefinition, monsterRuntime) {
  const definitionBytes = asBytes(skillDefinition, 'PAD enemy-skill definition');
  const monsterBytes = asBytes(monsterRuntime, 'PAD monster runtime');
  requireLength(
    definitionBytes,
    PAD_ENEMY_SKILL_RUNTIME_LAYOUT.definitionTypeOffset + 2,
    'PAD enemy-skill definition',
  );
  requireLength(
    monsterBytes,
    PAD_ENEMY_SKILL_RUNTIME_LAYOUT.monsterChanceOffset + 4,
    'PAD monster runtime',
  );
  const definition = new DataView(
    definitionBytes.buffer,
    definitionBytes.byteOffset,
    definitionBytes.byteLength,
  );
  const monster = new DataView(monsterBytes.buffer, monsterBytes.byteOffset, monsterBytes.byteLength);
  const type = definition.getInt16(PAD_ENEMY_SKILL_RUNTIME_LAYOUT.definitionTypeOffset, true);
  if (type === PAD_ENEMY_SKILL_SOURCE_ORB_CONVERSION) {
    return Object.freeze({
      type,
      kind: 'sourceOrbConversion',
      supported: true,
      sourceType: monster.getInt32(0x678, true),
      destinationType: monster.getInt32(0x67c, true),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_ENTIRE_BLIND || type === PAD_ENEMY_SKILL_ENTIRE_BLIND_ALT) {
    return Object.freeze({
      type,
      kind: 'entireBlind',
      supported: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_BIND_ATTACK) {
    requireLength(monsterBytes, 0x688, 'PAD monster runtime');
    return Object.freeze({
      type,
      kind: 'bindAttack',
      supported: true,
      nativePresentationParameter: monster.getInt32(0x680, true),
      durationTurns: monster.getInt32(0x684, true),
      targetMask: monster.getUint16(0x674, true) & 0x3f,
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_RANDOM_SUB_BIND) {
    requireLength(monsterBytes, 0x67c, 'PAD monster runtime');
    return Object.freeze({
      type,
      kind: 'randomSubBind',
      supported: true,
      targetCount: definition.getInt32(0x10, true),
      durationMin: definition.getInt32(0x14, true),
      durationMax: definition.getInt32(0x18, true),
      targetMask: monster.getUint16(0x674, true) & 0x3f,
      setupDurationTurns: monster.getInt32(0x678, true),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_CLEAR_PLAYER_BUFFS) {
    return Object.freeze({
      type,
      kind: 'clearPlayerBuffs',
      supported: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (
    type === PAD_ENEMY_SKILL_HEAL_ENEMY
    || type === PAD_ENEMY_SKILL_HEAL_ENEMY_UNCONDITIONAL
    || type === PAD_ENEMY_SKILL_ADDITIONAL_ATTACK
  ) {
    const healEnemy = type !== PAD_ENEMY_SKILL_ADDITIONAL_ATTACK;
    return Object.freeze({
      type,
      kind: healEnemy ? 'healEnemy' : 'additionalAttack',
      supported: true,
      ...(healEnemy
        ? { healPercent: monster.getInt32(0x678, true) }
        : { damagePercent: monster.getInt32(0x678, true) }),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_DAMAGE_ABSORB) {
    requireLength(monsterBytes, 0x680, 'PAD monster runtime');
    return Object.freeze({
      type,
      kind: 'damageAbsorb',
      supported: true,
      durationTurns: Math.max(0, (monster.getInt32(0x678, true) << 16) >> 16),
      damageThreshold: monster.getInt32(0x67c, true),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_AWAKENING_BIND) {
    return Object.freeze({
      type,
      kind: 'awakeningBind',
      supported: true,
      durationTurns: monster.getInt32(0x678, true),
      nativeSetupValue: monster.getUint16(0x674, true) & 0xff,
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_SKILL_DELAY) {
    requireLength(monsterBytes, 0x690, 'PAD monster runtime');
    return Object.freeze({
      type,
      kind: 'skillDelay',
      supported: true,
      targetMask: monster.getUint16(0x674, true) & 0x3f,
      skillDelays: Object.freeze(Array.from(
        { length: 6 },
        (_, index) => monster.getInt32(0x678 + index * 4, true),
      )),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_PRESENCE_CHECK) {
    requireLength(definitionBytes, 0x30, 'PAD enemy-skill definition');
    return decodePadEnemySkillDefinition(definitionBytes);
  }
  if (type === PAD_ENEMY_SKILL_MASKED_RANDOM_ORB_CHANGE) {
    requireLength(monsterBytes, 0x688, 'PAD monster runtime');
    return Object.freeze({
      type,
      kind: 'maskedRandomOrbChange',
      supported: true,
      perTypeCount: monster.getInt32(0x678, true),
      destinationTypeMask: monster.getUint32(0x67c, true),
      excludedSourceTypeMask: monster.getUint32(0x680, true),
      selectionSeed: monster.getUint32(0x684, true) & 0xffff,
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_NATIVE_NO_EFFECT) {
    return decodePadEnemySkillDefinition(definitionBytes);
  }
  if (type === PAD_ENEMY_SKILL_LOCK_RANDOM_ORBS) {
    requireLength(monsterBytes, 0x688, 'PAD monster runtime');
    return Object.freeze({
      type,
      kind: 'lockRandomOrbs',
      supported: true,
      typeMask: monster.getUint32(0x678, true),
      lockCount: monster.getInt32(0x67c, true),
      selectionSeed: monster.getUint32(0x684, true) & 0xffff,
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_ENEMY_ESCAPE) {
    return decodePadEnemySkillDefinition(definitionBytes);
  }
  if (type === PAD_ENEMY_SKILL_DEFENSE_BOOST) {
    return Object.freeze({
      type,
      kind: 'defenseBoost',
      supported: true,
      durationTurns: monster.getInt32(0x678, true),
      boostPercent: monster.getInt32(0x67c, true),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (
    type === PAD_ENEMY_SKILL_ATTRIBUTE_NULLIFY
    || type === PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY
  ) {
    return Object.freeze({
      type,
      kind: 'attributeNullify',
      supported: true,
      durationTurns: monster.getInt32(0x678, true),
      attributes: Object.freeze(type === PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY
        ? [monster.getInt32(0x67c, true), monster.getInt32(0x680, true)]
        : [monster.getInt32(0x67c, true)]),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_SOURCE_TO_JAMMER) {
    return Object.freeze({
      type,
      kind: 'sourceToJammer',
      supported: true,
      sourceType: monster.getInt32(0x678, true),
      destinationType: 6,
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_RANDOM_PARTY_BIND) {
    return Object.freeze({
      type,
      kind: 'randomPartyBind',
      supported: true,
      targetCount: monster.getInt32(0x678, true),
      nativeParameter1: monster.getInt32(0x67c, true),
      durationTurns: 6,
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_ACTIVE_SKILL_SEAL) {
    return Object.freeze({
      type,
      kind: 'activeSkillSeal',
      supported: true,
      durationTurns: monster.getInt32(0x678, true),
      targetMask: monster.getUint16(0x674, true) & 0x3f,
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_REPEAT_ATTACK) {
    requireLength(monsterBytes, 0x684, 'PAD monster runtime');
    return Object.freeze({
      type,
      kind: 'repeatAttack',
      supported: true,
      hitCount: monster.getInt32(0x678, true),
      completedHitMask: monster.getUint32(0x67c, true),
      damagePercent: monster.getInt32(0x680, true),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if ([PAD_ENEMY_SKILL_INACTIVITY, PAD_ENEMY_SKILL_INACTIVITY_UNCONDITIONAL].includes(type)) {
    return Object.freeze({
      type,
      kind: 'inactivity',
      supported: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_INACTIVITY_PRESENTATION) {
    requireLength(monsterBytes, 0x684, 'PAD monster runtime');
    return Object.freeze({
      type,
      kind: 'inactivityPresentation',
      supported: true,
      presentationParameters: Object.freeze(Array.from(
        { length: 3 },
        (_, index) => monster.getInt32(0x678 + index * 4, true),
      )),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_DAMAGE_VOID) {
    requireLength(definitionBytes, 0x20, 'PAD enemy-skill definition');
    requireLength(monsterBytes, 0x684, 'PAD monster runtime');
    return Object.freeze({
      type,
      kind: 'damageVoid',
      supported: true,
      nativePresentationParameter: monster.getInt32(0x678, true),
      durationTurns: monster.getInt32(0x67c, true),
      nativeMode: monster.getInt32(0x680, true),
      damageThreshold: Math.max(0, definition.getInt32(0x1c, true)),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_ATTRIBUTE_RESIST) {
    requireLength(definitionBytes, 0x18, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'attributeResist',
      supported: true,
      passive: true,
      attributeMask: definition.getInt32(0x10, true) & 0x1f,
      shieldPercent: definition.getInt32(0x14, true) & 0xffff,
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_RESOLVE) {
    requireLength(definitionBytes, 0x14, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'resolve',
      supported: true,
      passive: true,
      hpThresholdPercent: definition.getInt32(0x10, true) & 0xffff,
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_DAMAGE_SHIELD) {
    requireLength(monsterBytes, 0x680, 'PAD monster runtime');
    return Object.freeze({
      type,
      kind: 'damageShield',
      supported: true,
      durationTurns: Math.max(0, (monster.getInt32(0x678, true) << 16) >> 16),
      shieldPercent: Math.min(100, Math.max(0, monster.getInt32(0x67c, true))),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_LEADER_SWAP) {
    requireLength(monsterBytes, 0x680, 'PAD monster runtime');
    return Object.freeze({
      type,
      kind: 'leaderSwap',
      supported: true,
      durationTurns: Math.max(0, (monster.getInt32(0x678, true) << 16) >> 16),
      selectedPartyIndex: monster.getInt32(0x67c, true),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_NORMAL_ATTACK) {
    requireLength(monsterBytes, 0x674, 'PAD monster runtime');
    return Object.freeze({
      type,
      kind: 'normalAttack',
      supported: true,
      damagePercent: 100,
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_MULTI_ATTACK) {
    return Object.freeze({
      ...decodePadEnemySkillDefinition(definitionBytes),
      setupMaterialized: true,
    });
  }
  if (
    type === PAD_ENEMY_SKILL_LONE_ATTACK_BOOST
    || type === PAD_ENEMY_SKILL_STATUS_TRIGGERED_ATTACK_BOOST
    || type === PAD_ENEMY_SKILL_DAMAGED_TURN_ATTACK_BOOST
  ) {
    const kind = type === PAD_ENEMY_SKILL_LONE_ATTACK_BOOST
      ? 'loneAttackBoost'
      : type === PAD_ENEMY_SKILL_STATUS_TRIGGERED_ATTACK_BOOST
        ? 'statusTriggeredAttackBoost'
        : 'damagedTurnAttackBoost';
    return Object.freeze({
      type,
      kind,
      supported: true,
      durationTurns: monster.getInt32(0x678, true),
      boostPercent: monster.getInt32(0x67c, true),
      ...(type === PAD_ENEMY_SKILL_DAMAGED_TURN_ATTACK_BOOST
        ? { damagedTurnThreshold: definition.getInt32(0x10, true) }
        : {}),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_STATUS_SHIELD) {
    return Object.freeze({
      type,
      kind: 'statusShield',
      supported: true,
      durationTurns: monster.getInt32(0x678, true),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION) {
    return Object.freeze({
      type,
      kind: 'moveTimeReduction',
      supported: true,
      durationTurns: monster.getInt32(0x678, true),
      fixedReductionCentiseconds: monster.getInt32(0x67c, true),
      percentReduction: monster.getInt32(0x680, true),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_SELF_DESTRUCT) {
    return Object.freeze({
      type,
      kind: 'selfDestruct',
      supported: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_CHANGE_ATTRIBUTE) {
    requireLength(definitionBytes, 0x24, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'changeEnemyAttribute',
      supported: true,
      candidateAttributes: Object.freeze(Array.from(
        { length: 5 },
        (_, index) => definition.getInt32(0x10 + index * 4, true),
      )),
      targetAttribute: monster.getInt32(0x678, true),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_SCALED_ATTACK) {
    return Object.freeze({
      type,
      kind: 'scaledAttack',
      supported: true,
      damagePercent: monster.getInt32(0x678, true),
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_CURRENT_HP_GRAVITY) {
    return Object.freeze({
      type,
      kind: 'currentHpGravity',
      supported: true,
      damagePercent: monster.getInt32(0x678, true),
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_REVIVE_ENEMY) {
    requireLength(definitionBytes, 0x14, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'reviveEnemy',
      supported: true,
      targetEnemyIndex: monster.getInt32(0x678, true),
      revivePercent: monster.getInt32(0x67c, true),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_ATTRIBUTE_ABSORB) {
    requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    const durationMin = definition.getInt32(0x10, true);
    const durationMax = definition.getInt32(0x14, true);
    const attributeMask = monster.getUint32(0x67c, true) & 0x3f;
    return Object.freeze({
      type,
      kind: 'attributeAbsorb',
      supported: attributeMask !== 0 && durationMax >= durationMin,
      durationMin,
      durationMax,
      attributeMask,
      durationTurns: monster.getInt32(0x678, true),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_COMBO_ABSORB) {
    requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'comboAbsorb',
      supported: true,
      durationMin: definition.getInt32(0x10, true),
      durationMax: definition.getInt32(0x14, true),
      durationTurns: monster.getInt32(0x678, true),
      comboThreshold: monster.getInt32(0x67c, true),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_SKYFALL_RATE) {
    requireLength(monsterBytes, 0x684, 'PAD monster runtime');
    return Object.freeze({
      type,
      kind: 'skyfallRate',
      supported: true,
      typeMask: monster.getUint32(0x678, true) & 0x1ff,
      durationTurns: monster.getInt32(0x67c, true),
      chancePercent: monster.getInt32(0x680, true),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_DEATH_CRY) {
    return decodePadEnemySkillDefinition(definitionBytes);
  }
  if (type === PAD_ENEMY_SKILL_BIND_LEADER_HELPER) {
    requireLength(definitionBytes, 0x1c, 'PAD enemy-skill definition');
    const targetFlags = definition.getUint8(0x10) & 0x03;
    const durationMin = definition.getInt32(0x14, true);
    const durationMax = definition.getInt32(0x18, true);
    return Object.freeze({
      type,
      kind: 'bindLeaderHelper',
      supported: targetFlags !== 0 && durationMax >= durationMin,
      targetFlags,
      durationMin,
      durationMax,
      targetMask: monster.getUint16(0x674, true) & 0x3f,
      setupDurationTurns: monster.getInt32(0x678, true),
      setupMaterialized: true,
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type === PAD_ENEMY_SKILL_HEAL_PLAYER) {
    requireLength(definitionBytes, 0x14, 'PAD enemy-skill definition');
    return Object.freeze({
      type,
      kind: 'healPlayer',
      supported: true,
      thresholdPercent: definition.getInt32(0x10, true),
      healPercent: monster.getInt32(PAD_ENEMY_SKILL_RUNTIME_LAYOUT.monsterDurationOffset, true),
      attackWithSkillValue: definitionBytes.byteLength
          >= PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset + 4
        ? definition.getInt32(PAD_ENEMY_SKILL_DEFINITION_LAYOUT.attackWithSkillOffset, true)
        : null,
    });
  }
  if (type !== PAD_ENEMY_SKILL_BLACK_FALL) {
    return Object.freeze({ type, kind: 'unsupported', supported: false });
  }
  const packedDuration = monster.getUint16(PAD_ENEMY_SKILL_RUNTIME_LAYOUT.monsterDurationOffset, true);
  const rawChance = monster.getUint32(PAD_ENEMY_SKILL_RUNTIME_LAYOUT.monsterChanceOffset, true);
  return decodeBlackFallRuntime(type, packedDuration, rawChance);
}

export function normalizePadEnemySkillRecord(record) {
  const type = Math.trunc(Number(record?.type));
  if ([PAD_ENEMY_SKILL_ENTIRE_BLIND, PAD_ENEMY_SKILL_ENTIRE_BLIND_ALT].includes(type)
      || record?.kind === 'entireBlind') {
    return Object.freeze({
      type: type === PAD_ENEMY_SKILL_ENTIRE_BLIND_ALT
        ? PAD_ENEMY_SKILL_ENTIRE_BLIND_ALT
        : PAD_ENEMY_SKILL_ENTIRE_BLIND,
      kind: 'entireBlind',
      supported: true,
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_BIND_ATTACK || record?.kind === 'bindAttack') {
    const durationMin = Math.trunc(Number(record?.durationMin) || 0);
    const durationMax = Math.trunc(Number(record?.durationMax) || 0);
    const durationPresent = record?.durationTurns !== undefined
      && record?.durationTurns !== null;
    const targetMaskPresent = record?.targetMask !== undefined && record?.targetMask !== null;
    return Object.freeze({
      type: PAD_ENEMY_SKILL_BIND_ATTACK,
      kind: 'bindAttack',
      supported: record?.supported !== false && (durationPresent || durationMax >= durationMin),
      nativePresentationParameter: Math.trunc(Number(record?.nativePresentationParameter) || 0),
      ...(durationPresent
        ? { durationTurns: Math.trunc(Number(record.durationTurns) || 0) }
        : { durationMin, durationMax }),
      ...(targetMaskPresent
        ? { targetMask: Math.trunc(Number(record.targetMask) || 0) & 0x3f }
        : {
          targetSelector: Math.trunc(Number(record?.targetSelector) || 0),
          targetCount: Math.trunc(Number(record?.targetCount) || 0),
        }),
      setupMaterialized: Boolean(record?.setupMaterialized || durationPresent || targetMaskPresent),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_RANDOM_SUB_BIND || record?.kind === 'randomSubBind') {
    const durationMin = Math.trunc(Number(record?.durationMin) || 0);
    const durationMax = Math.trunc(Number(record?.durationMax) || 0);
    const targetMaskPresent = record?.targetMask !== undefined && record?.targetMask !== null;
    return Object.freeze({
      type: PAD_ENEMY_SKILL_RANDOM_SUB_BIND,
      kind: 'randomSubBind',
      supported: record?.supported !== false && durationMax >= durationMin,
      targetCount: Math.trunc(Number(record?.targetCount) || 0),
      durationMin,
      durationMax,
      ...(targetMaskPresent
        ? { targetMask: Math.trunc(Number(record.targetMask) || 0) & 0x3f }
        : {}),
      ...(record?.setupDurationTurns !== undefined
        ? { setupDurationTurns: Math.trunc(Number(record.setupDurationTurns) || 0) }
        : {}),
      setupMaterialized: Boolean(record?.setupMaterialized || targetMaskPresent),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_SOURCE_ORB_CONVERSION || record?.kind === 'sourceOrbConversion') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_SOURCE_ORB_CONVERSION,
      kind: 'sourceOrbConversion',
      supported: true,
      sourceType: Math.trunc(Number(record?.sourceType) || 0),
      destinationType: Math.trunc(Number(record?.destinationType) || 0),
      setupMaterialized: Boolean(record?.setupMaterialized),
      executionMaterialized: Boolean(record?.executionMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_SOURCE_TO_JAMMER || record?.kind === 'sourceToJammer') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_SOURCE_TO_JAMMER,
      kind: 'sourceToJammer',
      supported: true,
      sourceType: Math.trunc(Number(record?.sourceType) || 0),
      destinationType: 6,
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_CLEAR_PLAYER_BUFFS || record?.kind === 'clearPlayerBuffs') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_CLEAR_PLAYER_BUFFS,
      kind: 'clearPlayerBuffs',
      supported: true,
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (
    type === PAD_ENEMY_SKILL_HEAL_ENEMY
    || type === PAD_ENEMY_SKILL_HEAL_ENEMY_UNCONDITIONAL
    || type === PAD_ENEMY_SKILL_ADDITIONAL_ATTACK
    || record?.kind === 'healEnemy'
    || record?.kind === 'additionalAttack'
  ) {
    const healEnemy = type === PAD_ENEMY_SKILL_HEAL_ENEMY
      || type === PAD_ENEMY_SKILL_HEAL_ENEMY_UNCONDITIONAL
      || record?.kind === 'healEnemy';
    const percentPresent = healEnemy
      ? record?.healPercent !== undefined && record?.healPercent !== null
      : record?.damagePercent !== undefined && record?.damagePercent !== null;
    const percentMin = Math.trunc(Number(record?.percentMin) || 0);
    const percentMax = Math.trunc(Number(record?.percentMax) || 0);
    const normalizedType = !healEnemy
      ? PAD_ENEMY_SKILL_ADDITIONAL_ATTACK
      : type === PAD_ENEMY_SKILL_HEAL_ENEMY_UNCONDITIONAL
        ? PAD_ENEMY_SKILL_HEAL_ENEMY_UNCONDITIONAL
        : PAD_ENEMY_SKILL_HEAL_ENEMY;
    return Object.freeze({
      type: normalizedType,
      kind: healEnemy ? 'healEnemy' : 'additionalAttack',
      supported: percentPresent || percentMax >= percentMin,
      ...(percentPresent
        ? healEnemy
          ? { healPercent: Math.trunc(Number(record.healPercent) || 0) }
          : { damagePercent: Math.trunc(Number(record.damagePercent) || 0) }
        : { percentMin, percentMax }),
      setupMaterialized: Boolean(record?.setupMaterialized || percentPresent),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_DAMAGE_ABSORB || record?.kind === 'damageAbsorb') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_DAMAGE_ABSORB,
      kind: 'damageAbsorb',
      supported: record?.supported !== false,
      durationTurns: Math.max(0, Math.trunc(Number(record?.durationTurns) || 0)),
      damageThreshold: Math.trunc(Number(record?.damageThreshold) || 0),
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_AWAKENING_BIND || record?.kind === 'awakeningBind') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_AWAKENING_BIND,
      kind: 'awakeningBind',
      supported: record?.supported !== false,
      durationTurns: Math.trunc(Number(record?.durationTurns) || 0),
      ...(record?.nativeSetupValue === undefined
        ? {}
        : { nativeSetupValue: Math.trunc(Number(record.nativeSetupValue) || 0) & 0xff }),
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_SKILL_DELAY || record?.kind === 'skillDelay') {
    const delaysPresent = Array.isArray(record?.skillDelays);
    const delayMin = Math.trunc(Number(record?.delayMin) || 0);
    const delayMax = Math.trunc(Number(record?.delayMax) || 0);
    const skillDelays = delaysPresent
      ? Object.freeze(Array.from(
        { length: 6 },
        (_, index) => Math.max(0, Math.trunc(Number(record.skillDelays[index]) || 0)),
      ))
      : null;
    return Object.freeze({
      type: PAD_ENEMY_SKILL_SKILL_DELAY,
      kind: 'skillDelay',
      supported: record?.supported !== false && (delaysPresent || delayMax >= delayMin),
      ...(delaysPresent
        ? {
          targetMask: Math.trunc(Number(record?.targetMask) || 0) & 0x3f,
          skillDelays,
        }
        : { delayMin, delayMax }),
      setupMaterialized: Boolean(record?.setupMaterialized || delaysPresent),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_PRESENCE_CHECK || record?.kind === 'presenceCheck') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_PRESENCE_CHECK,
      kind: 'presenceCheck',
      supported: record?.supported !== false,
      candidateCardIds: Object.freeze((Array.isArray(record?.candidateCardIds)
        ? record.candidateCardIds
        : []).slice(0, 8).map((cardId) => Math.trunc(Number(cardId) || 0))),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (
    type === PAD_ENEMY_SKILL_MASKED_RANDOM_ORB_CHANGE
    || record?.kind === 'maskedRandomOrbChange'
  ) {
    const seedPresent = record?.selectionSeed !== undefined && record?.selectionSeed !== null;
    return Object.freeze({
      type: PAD_ENEMY_SKILL_MASKED_RANDOM_ORB_CHANGE,
      kind: 'maskedRandomOrbChange',
      supported: record?.supported !== false,
      perTypeCount: Math.trunc(Number(record?.perTypeCount) || 0),
      destinationTypeMask: Number(record?.destinationTypeMask) >>> 0,
      excludedSourceTypeMask: Number(record?.excludedSourceTypeMask) >>> 0,
      ...(seedPresent ? { selectionSeed: Number(record.selectionSeed) & 0xffff } : {}),
      setupMaterialized: Boolean(record?.setupMaterialized || seedPresent),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_NATIVE_NO_EFFECT || record?.kind === 'nativeNoEffect') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_NATIVE_NO_EFFECT,
      kind: 'nativeNoEffect',
      supported: record?.supported !== false,
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_LOCK_RANDOM_ORBS || record?.kind === 'lockRandomOrbs') {
    const seedPresent = record?.selectionSeed !== undefined && record?.selectionSeed !== null;
    return Object.freeze({
      type: PAD_ENEMY_SKILL_LOCK_RANDOM_ORBS,
      kind: 'lockRandomOrbs',
      supported: record?.supported !== false,
      typeMask: Number(record?.typeMask) >>> 0,
      lockCount: Math.trunc(Number(record?.lockCount) || 0),
      ...(seedPresent ? { selectionSeed: Number(record.selectionSeed) & 0xffff } : {}),
      setupMaterialized: Boolean(record?.setupMaterialized || seedPresent),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_ENEMY_ESCAPE || record?.kind === 'enemyEscape') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_ENEMY_ESCAPE,
      kind: 'enemyEscape',
      supported: record?.supported !== false,
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_DEFENSE_BOOST || record?.kind === 'defenseBoost') {
    const percentPresent = record?.boostPercent !== undefined && record?.boostPercent !== null;
    const percentMin = Math.trunc(Number(record?.percentMin) || 0);
    const percentMax = Math.trunc(Number(record?.percentMax) || 0);
    return Object.freeze({
      type: PAD_ENEMY_SKILL_DEFENSE_BOOST,
      kind: 'defenseBoost',
      supported: percentPresent || percentMax >= percentMin,
      durationTurns: Math.trunc(Number(record?.durationTurns) || 0),
      ...(percentPresent
        ? { boostPercent: Math.trunc(Number(record.boostPercent) || 0) }
        : { percentMin, percentMax }),
      setupMaterialized: Boolean(record?.setupMaterialized || percentPresent),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_RANDOM_PARTY_BIND || record?.kind === 'randomPartyBind') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_RANDOM_PARTY_BIND,
      kind: 'randomPartyBind',
      supported: true,
      targetCount: Math.trunc(Number(record?.targetCount) || 0),
      nativeParameter1: Math.trunc(Number(record?.nativeParameter1) || 0),
      durationTurns: 6,
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_ACTIVE_SKILL_SEAL || record?.kind === 'activeSkillSeal') {
    const durationPresent = record?.durationTurns !== undefined && record?.durationTurns !== null;
    const durationMin = Math.trunc(Number(record?.durationMin) || 0);
    const durationMax = Math.trunc(Number(record?.durationMax) || 0);
    return Object.freeze({
      type: PAD_ENEMY_SKILL_ACTIVE_SKILL_SEAL,
      kind: 'activeSkillSeal',
      supported: durationPresent || durationMax >= durationMin,
      ...(durationPresent
        ? { durationTurns: Math.trunc(Number(record.durationTurns) || 0) }
        : { durationMin, durationMax }),
      ...(record?.targetMask === undefined
        ? {}
        : { targetMask: Math.trunc(Number(record.targetMask) || 0) & 0x3f }),
      setupMaterialized: Boolean(record?.setupMaterialized || durationPresent),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_REPEAT_ATTACK || record?.kind === 'repeatAttack') {
    const hitCountPresent = record?.hitCount !== undefined && record?.hitCount !== null;
    const hitCountMin = Math.trunc(Number(record?.hitCountMin) || 0);
    const hitCountMax = Math.trunc(Number(record?.hitCountMax) || 0);
    return Object.freeze({
      type: PAD_ENEMY_SKILL_REPEAT_ATTACK,
      kind: 'repeatAttack',
      supported: hitCountPresent || hitCountMax >= hitCountMin,
      ...(hitCountPresent
        ? { hitCount: Math.trunc(Number(record.hitCount) || 0) }
        : { hitCountMin, hitCountMax }),
      damagePercent: Math.trunc(Number(record?.damagePercent) || 0),
      completedHitMask: Math.trunc(Number(record?.completedHitMask) || 0) >>> 0,
      setupMaterialized: Boolean(record?.setupMaterialized || hitCountPresent),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (
    [PAD_ENEMY_SKILL_INACTIVITY, PAD_ENEMY_SKILL_INACTIVITY_UNCONDITIONAL].includes(type)
    || record?.kind === 'inactivity'
  ) {
    return Object.freeze({
      type: type === PAD_ENEMY_SKILL_INACTIVITY_UNCONDITIONAL
        ? PAD_ENEMY_SKILL_INACTIVITY_UNCONDITIONAL
        : PAD_ENEMY_SKILL_INACTIVITY,
      kind: 'inactivity',
      supported: true,
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (
    type === PAD_ENEMY_SKILL_INACTIVITY_PRESENTATION
    || record?.kind === 'inactivityPresentation'
  ) {
    const authored = Array.isArray(record?.presentationParameters)
      ? record.presentationParameters
      : [];
    return Object.freeze({
      type: PAD_ENEMY_SKILL_INACTIVITY_PRESENTATION,
      kind: 'inactivityPresentation',
      supported: record?.supported !== false,
      presentationParameters: Object.freeze(Array.from(
        { length: 3 },
        (_, index) => Math.trunc(Number(authored[index]) || 0),
      )),
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_DAMAGE_VOID || record?.kind === 'damageVoid') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_DAMAGE_VOID,
      kind: 'damageVoid',
      supported: record?.supported !== false,
      nativePresentationParameter: Math.trunc(Number(record?.nativePresentationParameter) || 0),
      durationTurns: Math.max(0, Math.trunc(Number(record?.durationTurns) || 0)),
      nativeMode: Math.trunc(Number(record?.nativeMode) || 0),
      damageThreshold: Math.max(0, Math.trunc(Number(record?.damageThreshold) || 0)),
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_ATTRIBUTE_RESIST || record?.kind === 'attributeResist') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_ATTRIBUTE_RESIST,
      kind: 'attributeResist',
      supported: record?.supported !== false,
      passive: true,
      attributeMask: Math.trunc(Number(record?.attributeMask) || 0) & 0x1f,
      shieldPercent: Math.trunc(Number(record?.shieldPercent) || 0) & 0xffff,
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_RESOLVE || record?.kind === 'resolve') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_RESOLVE,
      kind: 'resolve',
      supported: record?.supported !== false,
      passive: true,
      hpThresholdPercent: Math.trunc(Number(record?.hpThresholdPercent) || 0) & 0xffff,
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_DAMAGE_SHIELD || record?.kind === 'damageShield') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_DAMAGE_SHIELD,
      kind: 'damageShield',
      supported: record?.supported !== false,
      durationTurns: Math.max(0, (Math.trunc(Number(record?.durationTurns) || 0) << 16) >> 16),
      shieldPercent: Math.min(100, Math.max(
        0,
        Math.trunc(Number(record?.shieldPercent) || 0),
      )),
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_LEADER_SWAP || record?.kind === 'leaderSwap') {
    const selectedPartyIndex = Number(record?.selectedPartyIndex);
    return Object.freeze({
      type: PAD_ENEMY_SKILL_LEADER_SWAP,
      kind: 'leaderSwap',
      supported: record?.supported !== false,
      durationTurns: Math.max(0, (Math.trunc(Number(record?.durationTurns) || 0) << 16) >> 16),
      selectedPartyIndex: Number.isInteger(selectedPartyIndex) ? selectedPartyIndex : null,
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_NORMAL_ATTACK || record?.kind === 'normalAttack') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_NORMAL_ATTACK,
      kind: 'normalAttack',
      supported: record?.supported !== false,
      damagePercent: 100,
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_MULTI_ATTACK || record?.kind === 'multiAttack') {
    const childSkillIds = Object.freeze((Array.isArray(record?.childSkillIds)
      ? record.childSkillIds
      : [])
      .slice(0, 8)
      .map((skillId) => Math.trunc(Number(skillId) || 0))
      .filter((skillId) => skillId > 0));
    return Object.freeze({
      type: PAD_ENEMY_SKILL_MULTI_ATTACK,
      kind: 'multiAttack',
      supported: record?.supported !== false && childSkillIds.length > 0,
      childSkillIds,
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (
    type === PAD_ENEMY_SKILL_ATTRIBUTE_NULLIFY
    || type === PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY
    || record?.kind === 'attributeNullify'
  ) {
    const dual = type === PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY
      || (type !== PAD_ENEMY_SKILL_ATTRIBUTE_NULLIFY && record?.attributes?.length > 1);
    return Object.freeze({
      type: dual ? PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY : PAD_ENEMY_SKILL_ATTRIBUTE_NULLIFY,
      kind: 'attributeNullify',
      supported: true,
      durationTurns: Math.trunc(Number(record?.durationTurns) || 0),
      attributes: Object.freeze((Array.isArray(record?.attributes) ? record.attributes : [])
        .slice(0, dual ? 2 : 1)
        .map((attribute) => Math.trunc(Number(attribute) || 0))),
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_LONE_ATTACK_BOOST || record?.kind === 'loneAttackBoost') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_LONE_ATTACK_BOOST,
      kind: 'loneAttackBoost',
      supported: true,
      durationTurns: Math.trunc(Number(record?.durationTurns) || 0),
      boostPercent: Math.trunc(Number(record?.boostPercent) || 0),
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (
    type === PAD_ENEMY_SKILL_STATUS_TRIGGERED_ATTACK_BOOST
    || record?.kind === 'statusTriggeredAttackBoost'
  ) {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_STATUS_TRIGGERED_ATTACK_BOOST,
      kind: 'statusTriggeredAttackBoost',
      supported: true,
      durationTurns: Math.trunc(Number(record?.durationTurns) || 0),
      boostPercent: Math.trunc(Number(record?.boostPercent) || 0),
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (
    type === PAD_ENEMY_SKILL_DAMAGED_TURN_ATTACK_BOOST
    || record?.kind === 'damagedTurnAttackBoost'
  ) {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_DAMAGED_TURN_ATTACK_BOOST,
      kind: 'damagedTurnAttackBoost',
      supported: true,
      damagedTurnThreshold: Math.trunc(Number(record?.damagedTurnThreshold) || 0),
      durationTurns: Math.trunc(Number(record?.durationTurns) || 0),
      boostPercent: Math.trunc(Number(record?.boostPercent) || 0),
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_STATUS_SHIELD || record?.kind === 'statusShield') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_STATUS_SHIELD,
      kind: 'statusShield',
      supported: true,
      durationTurns: Math.trunc(Number(record?.durationTurns) || 0),
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION || record?.kind === 'moveTimeReduction') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION,
      kind: 'moveTimeReduction',
      supported: true,
      durationTurns: Math.trunc(Number(record?.durationTurns) || 0),
      fixedReductionCentiseconds: Math.trunc(Number(record?.fixedReductionCentiseconds) || 0),
      percentReduction: Math.trunc(Number(record?.percentReduction) || 0),
      setupMaterialized: Boolean(record?.setupMaterialized),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_SELF_DESTRUCT || record?.kind === 'selfDestruct') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_SELF_DESTRUCT,
      kind: 'selfDestruct',
      supported: true,
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_CHANGE_ATTRIBUTE || record?.kind === 'changeEnemyAttribute') {
    const authored = Array.isArray(record?.candidateAttributes) ? record.candidateAttributes : [];
    const targetPresent = record?.targetAttribute !== undefined && record?.targetAttribute !== null;
    return Object.freeze({
      type: PAD_ENEMY_SKILL_CHANGE_ATTRIBUTE,
      kind: 'changeEnemyAttribute',
      supported: true,
      candidateAttributes: Object.freeze(Array.from(
        { length: 5 },
        (_, index) => Math.trunc(Number(authored[index] ?? -1)),
      )),
      ...(targetPresent
        ? { targetAttribute: Math.trunc(Number(record.targetAttribute)) }
        : {}),
      setupMaterialized: Boolean(record?.setupMaterialized || targetPresent),
    });
  }
  if (type === PAD_ENEMY_SKILL_SCALED_ATTACK || record?.kind === 'scaledAttack') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_SCALED_ATTACK,
      kind: 'scaledAttack',
      supported: true,
      damagePercent: Math.trunc(Number(record?.damagePercent) || 0),
    });
  }
  if (type === PAD_ENEMY_SKILL_CURRENT_HP_GRAVITY || record?.kind === 'currentHpGravity') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_CURRENT_HP_GRAVITY,
      kind: 'currentHpGravity',
      supported: true,
      damagePercent: Math.trunc(Number(record?.damagePercent) || 0),
    });
  }
  if (type === PAD_ENEMY_SKILL_REVIVE_ENEMY || record?.kind === 'reviveEnemy') {
    const targetPresent = record?.targetEnemyIndex !== undefined
      && record?.targetEnemyIndex !== null;
    return Object.freeze({
      type: PAD_ENEMY_SKILL_REVIVE_ENEMY,
      kind: 'reviveEnemy',
      supported: true,
      revivePercent: Math.trunc(Number(record?.revivePercent) || 0),
      ...(targetPresent
        ? { targetEnemyIndex: Math.trunc(Number(record.targetEnemyIndex) || 0) }
        : {}),
      setupMaterialized: Boolean(record?.setupMaterialized || targetPresent),
    });
  }
  if (type === PAD_ENEMY_SKILL_ATTRIBUTE_ABSORB || record?.kind === 'attributeAbsorb') {
    const durationMin = Math.trunc(Number(record?.durationMin) || 0);
    const durationMax = Math.trunc(Number(record?.durationMax) || 0);
    const attributeMask = Math.trunc(Number(record?.attributeMask) || 0) & 0x3f;
    const durationPresent = record?.durationTurns !== undefined && record?.durationTurns !== null;
    return Object.freeze({
      type: PAD_ENEMY_SKILL_ATTRIBUTE_ABSORB,
      kind: 'attributeAbsorb',
      supported: attributeMask !== 0 && durationMax >= durationMin,
      durationMin,
      durationMax,
      attributeMask,
      ...(durationPresent
        ? { durationTurns: Math.trunc(Number(record.durationTurns) || 0) }
        : {}),
      setupMaterialized: Boolean(record?.setupMaterialized || durationPresent),
    });
  }
  if (type === PAD_ENEMY_SKILL_COMBO_ABSORB || record?.kind === 'comboAbsorb') {
    const durationMin = Math.trunc(Number(record?.durationMin) || 0);
    const durationMax = Math.trunc(Number(record?.durationMax) || 0);
    const durationPresent = record?.durationTurns !== undefined && record?.durationTurns !== null;
    return Object.freeze({
      type: PAD_ENEMY_SKILL_COMBO_ABSORB,
      kind: 'comboAbsorb',
      supported: record?.supported !== false && durationMax >= durationMin,
      durationMin,
      durationMax,
      comboThreshold: Math.trunc(Number(record?.comboThreshold) || 0),
      ...(durationPresent
        ? { durationTurns: Math.trunc(Number(record.durationTurns) || 0) }
        : {}),
      setupMaterialized: Boolean(record?.setupMaterialized || durationPresent),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_SKYFALL_RATE || record?.kind === 'skyfallRate') {
    const durationMin = Math.trunc(Number(record?.durationMin) || 0);
    const durationMax = Math.trunc(Number(record?.durationMax) || 0);
    const durationPresent = record?.durationTurns !== undefined && record?.durationTurns !== null;
    return Object.freeze({
      type: PAD_ENEMY_SKILL_SKYFALL_RATE,
      kind: 'skyfallRate',
      supported: record?.supported !== false && durationMax >= durationMin,
      typeMask: Math.trunc(Number(record?.typeMask) || 0) & 0x1ff,
      ...(durationPresent
        ? { durationTurns: Math.trunc(Number(record.durationTurns) || 0) }
        : { durationMin, durationMax }),
      chancePercent: Math.trunc(Number(record?.chancePercent) || 0),
      setupMaterialized: Boolean(record?.setupMaterialized || durationPresent),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_DEATH_CRY || record?.kind === 'deathCry') {
    const authored = Array.isArray(record?.presentationParameters)
      ? record.presentationParameters
      : [];
    return Object.freeze({
      type: PAD_ENEMY_SKILL_DEATH_CRY,
      kind: 'deathCry',
      supported: record?.supported !== false,
      messageCode: Math.trunc(Number(record?.messageCode) || 0),
      presentationParameters: Object.freeze(Array.from(
        { length: 7 },
        (_, index) => Math.trunc(Number(authored[index]) || 0),
      )),
      attackWithSkillValue: record?.attackWithSkillValue == null
        ? null
        : Math.trunc(Number(record.attackWithSkillValue)),
    });
  }
  if (type === PAD_ENEMY_SKILL_BIND_LEADER_HELPER || record?.kind === 'bindLeaderHelper') {
    const durationMin = Math.trunc(Number(record?.durationMin) || 0);
    const durationMax = Math.trunc(Number(record?.durationMax) || 0);
    const targetFlags = Math.trunc(Number(record?.targetFlags) || 0) & 0x03;
    const targetMaskPresent = record?.targetMask !== undefined && record?.targetMask !== null;
    return Object.freeze({
      type: PAD_ENEMY_SKILL_BIND_LEADER_HELPER,
      kind: 'bindLeaderHelper',
      supported: targetFlags !== 0 && durationMax >= durationMin,
      targetFlags,
      durationMin,
      durationMax,
      ...(targetMaskPresent ? { targetMask: Number(record.targetMask) & 0x3f } : {}),
      ...(record?.setupDurationTurns !== undefined
        ? { setupDurationTurns: Math.trunc(Number(record.setupDurationTurns) || 0) }
        : {}),
      setupMaterialized: Boolean(record?.setupMaterialized || targetMaskPresent),
    });
  }
  if (type === PAD_ENEMY_SKILL_HEAL_PLAYER || record?.kind === 'healPlayer') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_HEAL_PLAYER,
      kind: 'healPlayer',
      supported: true,
      thresholdPercent: Math.trunc(Number(record?.thresholdPercent) || 0),
      healPercent: Math.trunc(Number(record?.healPercent) || 0),
    });
  }
  if (
    type === PAD_ENEMY_SKILL_SOURCE_TO_POISON
    || type === PAD_ENEMY_SKILL_SOURCE_TO_MORTAL_POISON
    || record?.kind === 'sourceToPoison'
  ) {
    const sourcePoisonType = type === PAD_ENEMY_SKILL_SOURCE_TO_MORTAL_POISON
      || Number(record?.destinationType) === 8
      ? PAD_ENEMY_SKILL_SOURCE_TO_MORTAL_POISON
      : PAD_ENEMY_SKILL_SOURCE_TO_POISON;
    return Object.freeze({
      type: sourcePoisonType,
      kind: 'sourceToPoison',
      supported: true,
      sourceType: Math.trunc(Number(record?.sourceType) || 0),
      destinationType: sourcePoisonType === PAD_ENEMY_SKILL_SOURCE_TO_MORTAL_POISON ? 8 : 7,
    });
  }
  if (
    type === PAD_ENEMY_SKILL_POISON_BLOCKS
    || type === PAD_ENEMY_SKILL_MORTAL_POISON_BLOCKS
    || record?.kind === 'poisonBlocks'
  ) {
    const poisonBlocksType = type === PAD_ENEMY_SKILL_MORTAL_POISON_BLOCKS
      || Number(record?.destinationType) === 8
      ? PAD_ENEMY_SKILL_MORTAL_POISON_BLOCKS
      : PAD_ENEMY_SKILL_POISON_BLOCKS;
    return Object.freeze({
      type: poisonBlocksType,
      kind: 'poisonBlocks',
      supported: true,
      count: Math.trunc(Number(record?.count) || 0),
      excludeHeart: Boolean(record?.excludeHeart),
      destinationType: poisonBlocksType === PAD_ENEMY_SKILL_MORTAL_POISON_BLOCKS ? 8 : 7,
    });
  }
  if (
    type === PAD_ENEMY_SKILL_POISON_BLOCK_N_COUNTED
    || type === PAD_ENEMY_SKILL_MORTAL_POISON_BLOCK_N_COUNTED
    || record?.kind === 'poisonBlockNCounted'
  ) {
    const countedType = type === PAD_ENEMY_SKILL_MORTAL_POISON_BLOCK_N_COUNTED
      || Number(record?.destinationType) === 8
      ? PAD_ENEMY_SKILL_MORTAL_POISON_BLOCK_N_COUNTED
      : PAD_ENEMY_SKILL_POISON_BLOCK_N_COUNTED;
    const count = Math.trunc(Number(record?.count) || 0);
    return Object.freeze({
      type: countedType,
      kind: 'poisonBlockNCounted',
      supported: count > 0,
      count,
      excludeHeart: Boolean(record?.excludeHeart),
      destinationType: countedType === PAD_ENEMY_SKILL_MORTAL_POISON_BLOCK_N_COUNTED ? 8 : 7,
    });
  }
  if (type === PAD_ENEMY_SKILL_POISON_BLOCK_N || record?.kind === 'poisonBlockN') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_POISON_BLOCK_N,
      kind: 'poisonBlockN',
      supported: true,
      presentationValue: Math.trunc(Number(record?.presentationValue) || 0),
      count: Math.trunc(Number(record?.count) || 0),
      excludeHeart: Boolean(record?.excludeHeart),
      destinationType: Number(record?.destinationType) === 8 ? 8 : 7,
    });
  }
  if (
    type === PAD_ENEMY_SKILL_HORIZONTAL_LINES
    || type === PAD_ENEMY_SKILL_HORIZONTAL_LINES_4
    || type === PAD_ENEMY_SKILL_VERTICAL_LINES
    || type === PAD_ENEMY_SKILL_VERTICAL_LINES_4
    || record?.kind === 'horizontalLines'
    || record?.kind === 'verticalLines'
  ) {
    const horizontal = (
      type === PAD_ENEMY_SKILL_HORIZONTAL_LINES
      || type === PAD_ENEMY_SKILL_HORIZONTAL_LINES_4
      || record?.kind === 'horizontalLines'
    );
    const lineSwapCount = (
      type === PAD_ENEMY_SKILL_HORIZONTAL_LINES_4
      || type === PAD_ENEMY_SKILL_VERTICAL_LINES_4
    ) ? 4 : 3;
    const authoredSwaps = Array.isArray(record?.lineSwaps) ? record.lineSwaps : [];
    const lineSwaps = Array.from({ length: lineSwapCount }, (_, index) => Object.freeze({
      lineMask: Number(authoredSwaps[index]?.lineMask) & 0xff,
      destinationTypeMask: Number(authoredSwaps[index]?.destinationTypeMask) & 0xffff,
    }));
    const lineType = [
      PAD_ENEMY_SKILL_HORIZONTAL_LINES_4,
      PAD_ENEMY_SKILL_HORIZONTAL_LINES,
      PAD_ENEMY_SKILL_VERTICAL_LINES_4,
      PAD_ENEMY_SKILL_VERTICAL_LINES,
    ].includes(type)
      ? type
      : horizontal ? PAD_ENEMY_SKILL_HORIZONTAL_LINES : PAD_ENEMY_SKILL_VERTICAL_LINES;
    return Object.freeze({
      type: lineType,
      kind: horizontal ? 'horizontalLines' : 'verticalLines',
      supported: true,
      lineSwaps: Object.freeze(lineSwaps),
    });
  }
  if (
    type === PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP_DIRECT
    || type === PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP
    || record?.kind === 'poisonTypeListSwap'
  ) {
    const authoredTypes = Array.isArray(record?.destinationTypes) ? record.destinationTypes : [];
    const poisonType = type === PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP_DIRECT
      ? PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP_DIRECT
      : PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP;
    return Object.freeze({
      type: poisonType,
      kind: 'poisonTypeListSwap',
      supported: true,
      ...(poisonType === PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP
        ? { presentationValue: Math.trunc(Number(record?.presentationValue) || 0) }
        : {}),
      destinationTypes: Object.freeze(Array.from(
        { length: 4 },
        (_, index) => Math.trunc(Number(authoredTypes[index] ?? -1)),
      )),
    });
  }
  if (
    type === PAD_ENEMY_SKILL_POISON_MASK_SWAP_DIRECT
    || type === PAD_ENEMY_SKILL_POISON_MASK_SWAP
    || record?.kind === 'poisonMaskSwap'
  ) {
    const poisonMaskType = type === PAD_ENEMY_SKILL_POISON_MASK_SWAP_DIRECT
      ? PAD_ENEMY_SKILL_POISON_MASK_SWAP_DIRECT
      : PAD_ENEMY_SKILL_POISON_MASK_SWAP;
    return Object.freeze({
      type: poisonMaskType,
      kind: 'poisonMaskSwap',
      supported: true,
      ...(poisonMaskType === PAD_ENEMY_SKILL_POISON_MASK_SWAP
        ? { presentationValue: Math.trunc(Number(record?.presentationValue) || 0) }
        : {}),
      destinationTypeMask: Number(record?.destinationTypeMask) & 0xffff,
    });
  }
  if (type === PAD_ENEMY_SKILL_BLOCK_MINUS || record?.kind === 'blockMinus') {
    const powerPercent = Math.trunc(Number(record?.powerPercent) || 0);
    return Object.freeze({
      type: PAD_ENEMY_SKILL_BLOCK_MINUS,
      kind: 'blockMinus',
      supported: true,
      typeMask: Number(record?.typeMask) >>> 0,
      powerPercent,
      power: record?.power === undefined
        ? Math.fround(Math.fround(powerPercent) / Math.fround(100))
        : Math.fround(Number(record.power) || 0),
      limit: Math.trunc(Number(record?.limit) || 0),
    });
  }
  if (type === PAD_ENEMY_SKILL_BUR_DROP || record?.kind === 'burDrop') {
    return Object.freeze({
      type: PAD_ENEMY_SKILL_BUR_DROP,
      kind: 'burDrop',
      supported: true,
      typeMask: Number(record?.typeMask) >>> 0,
      count: Number(record?.count) >>> 0,
      descriptor: Math.trunc(Number(record?.descriptor) || 0) & 0xffff,
      clearDescriptorHighBit: record?.clearDescriptorHighBit === undefined
        ? true
        : Boolean(record.clearDescriptorHighBit),
    });
  }
  if (type !== PAD_ENEMY_SKILL_BLACK_FALL && record?.kind !== 'blackFall') {
    return Object.freeze({ type, kind: 'unsupported', supported: false });
  }
  const durationTurns = Math.trunc(Number(record?.durationTurns) || 0);
  const chanceBasisPoints = (Math.trunc(Number(record?.chanceBasisPoints) || 0) << 16) >> 16;
  return Object.freeze({
    type: PAD_ENEMY_SKILL_BLACK_FALL,
    kind: 'blackFall',
    supported: durationTurns > 0,
    durationTurns,
    chanceBasisPoints,
  });
}
