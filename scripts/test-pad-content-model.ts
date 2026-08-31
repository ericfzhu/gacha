import assert from 'node:assert/strict';
import { decodePadEnemySkillDefinition } from '../src/puzzle/padEnemySkills.js';
import {
  advanceBattleTurn,
  compileNativeEnemySkill,
  createBattleState,
  evaluateSkillAtHook,
  exampleAccount,
  exampleContentBundle,
  executeGachaPull,
  expandedBoardLeader,
  healingActive,
  PAD_NATIVE_ENEMY_BOARD_SIZE_CHANGE,
  temporaryCompactBoardEnemySkill,
  validateContentBundle,
  validateSkillDefinition,
} from '../src/pad-backend/index.ts';

assert.deepEqual(validateContentBundle(exampleContentBundle), []);

const invalidPassive = {
  ...expandedBoardLeader,
  id: 'invalid.passive',
  category: 'active' as const,
};
assert.match(validateSkillDefinition(invalidPassive)[0]?.message || '', /cannot be authored/);

let result = evaluateSkillAtHook(createBattleState(), expandedBoardLeader, 'battle.setup');
assert.deepEqual(result.state.baseBoardSize, { columns: 7, rows: 6 });
assert.deepEqual(result.state.boardSize, { columns: 7, rows: 6 });
assert.equal(result.trace[0]?.fidelity, 'inferred');

const injured = { ...result.state, playerHp: 9_000 };
const healed = evaluateSkillAtHook(injured, healingActive, 'turn.start');
assert.equal(healed.state.playerHp, 10_200);
assert.match(healed.trace.at(-1)?.detail || '', /healed 1200/);

result = evaluateSkillAtHook(result.state, temporaryCompactBoardEnemySkill, 'turn.start');
assert.deepEqual(result.state.baseBoardSize, { columns: 7, rows: 6 });
assert.deepEqual(result.state.boardSize, { columns: 5, rows: 4 });
assert.equal(result.state.statuses[0]?.turnsRemaining, 2);
assert.equal(result.state.statuses[0]?.fidelity, 'native-partial');
result = advanceBattleTurn(result.state);
assert.deepEqual(result.state.boardSize, { columns: 5, rows: 4 });
result = advanceBattleTurn(result.state);
assert.deepEqual(result.state.boardSize, { columns: 7, rows: 6 });
assert.match(result.trace[0]?.detail || '', /restored 7×6/);

const compiled = compileNativeEnemySkill(temporaryCompactBoardEnemySkill, 90_001);
assert.equal(compiled.bytes.length, 0x48);
const nativeView = new DataView(compiled.bytes.buffer);
assert.equal(nativeView.getUint32(0x00, true), 90_001);
assert.equal(nativeView.getInt16(0x04, true), PAD_NATIVE_ENEMY_BOARD_SIZE_CHANGE);
assert.equal(nativeView.getInt32(0x10, true), 2);
assert.equal(nativeView.getInt32(0x14, true), 2);
assert.equal(nativeView.getInt32(0x44, true), 0);
assert.deepEqual(decodePadEnemySkillDefinition(compiled.bytes), {
  type: 126,
  kind: 'boardSizeChange',
  supported: true,
  durationTurns: 2,
  boardSizeSelector: 2,
  columns: 5,
  rows: 4,
  boardSizeCode: 0x45,
  attackWithSkillValue: 0,
});
assert.throws(() => compileNativeEnemySkill(temporaryCompactBoardEnemySkill, -1), /unsigned 32-bit/);

const banner = exampleContentBundle.banners[0];
const firstPull = executeGachaPull(exampleAccount, banner, 'request-1', {
  now: '2026-08-29T00:00:00.000Z',
  roll: 0.85,
  instanceId: 'instance-1',
});
assert.equal(firstPull.receipt.cardInstance.cardId, 'test.card.beta');
assert.equal(firstPull.account.currencies.stones, 5);
assert.equal(firstPull.account.revision, 1);
const replay = executeGachaPull(firstPull.account, banner, 'request-1', {
  now: '2026-08-29T00:00:01.000Z',
  roll: 0,
  instanceId: 'different-id-is-ignored',
});
assert.equal(replay.replayed, true);
assert.equal(replay.account.currencies.stones, 5);
assert.equal(replay.receipt.cardInstance.instanceId, 'instance-1');

console.log('PAD designer content model, native compiler, lifecycle trace, and gacha transaction checks passed.');
