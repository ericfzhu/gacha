export const PAD_ENEMY_SKILL_BLACK_FALL = 128;

export const PAD_ENEMY_SKILL_RUNTIME_LAYOUT = Object.freeze({
  definitionTypeOffset: 0x04,
  monsterDurationOffset: 0x678,
  monsterChanceOffset: 0x67c,
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
  const durationTurns = ((packedDuration & 0x03ff) << 22) >> 22;
  const rawChance = monster.getUint32(PAD_ENEMY_SKILL_RUNTIME_LAYOUT.monsterChanceOffset, true);
  const chanceBasisPoints = (rawChance << 16) >> 16;
  return Object.freeze({
    type,
    kind: 'blackFall',
    supported: true,
    durationTurns,
    chanceBasisPoints,
    packedDuration,
    rawChance,
  });
}

export function normalizePadEnemySkillRecord(record) {
  const type = Math.trunc(Number(record?.type));
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
