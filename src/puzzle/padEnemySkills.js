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
  if (type !== PAD_ENEMY_SKILL_BLACK_FALL) {
    return Object.freeze({ type, kind: 'unsupported', supported: false });
  }
  const packedDuration = monster.getUint16(PAD_ENEMY_SKILL_RUNTIME_LAYOUT.monsterDurationOffset, true);
  const rawChance = monster.getUint32(PAD_ENEMY_SKILL_RUNTIME_LAYOUT.monsterChanceOffset, true);
  return decodeBlackFallRuntime(type, packedDuration, rawChance);
}

export function normalizePadEnemySkillRecord(record) {
  const type = Math.trunc(Number(record?.type));
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
