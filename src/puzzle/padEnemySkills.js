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
export const PAD_ENEMY_SKILL_VERTICAL_LINES_4 = 76;
export const PAD_ENEMY_SKILL_VERTICAL_LINES = 77;
export const PAD_ENEMY_SKILL_HORIZONTAL_LINES_4 = 78;
export const PAD_ENEMY_SKILL_HORIZONTAL_LINES = 79;
export const PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP_DIRECT = 80;
export const PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP = 81;
export const PAD_ENEMY_SKILL_POISON_MASK_SWAP_DIRECT = 84;
export const PAD_ENEMY_SKILL_POISON_MASK_SWAP = 85;
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
  const attack = Math.max(0, Math.trunc(Number(baseAttack) || 0));
  const percent = Math.trunc(Number(attackWithSkillPercent) || 0);
  if (percent <= 0 || attack <= 0) return 0;
  const multiplier = Math.fround(Math.fround(percent >>> 0) / Math.fround(100));
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
