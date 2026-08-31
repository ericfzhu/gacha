import {
  advanceBattleTurn,
  compileNativeEnemySkill,
  createBattleState,
  evaluateSkillAtHook,
  expandedBoardLeader,
  temporaryCompactBoardEnemySkill,
} from '../src/pad-backend/index.ts';

const setup = evaluateSkillAtHook(createBattleState(), expandedBoardLeader, 'battle.setup');
const override = evaluateSkillAtHook(setup.state, temporaryCompactBoardEnemySkill, 'turn.start');
const firstTurn = advanceBattleTurn(override.state);
const secondTurn = advanceBattleTurn(firstTurn.state);
const compiled = compileNativeEnemySkill(temporaryCompactBoardEnemySkill, 90_001);

console.log(JSON.stringify({
  definitions: [expandedBoardLeader, temporaryCompactBoardEnemySkill],
  nativeCompilation: {
    type: compiled.type,
    parameters: compiled.parameters,
    explanation: compiled.explanation,
    recordBytes: compiled.bytes.length,
  },
  timeline: [
    { stage: 'leader setup', board: setup.state.boardSize, trace: setup.trace },
    { stage: 'enemy override', board: override.state.boardSize, trace: override.trace },
    { stage: 'one turn elapsed', board: firstTurn.state.boardSize, trace: firstTurn.trace },
    { stage: 'override expired', board: secondTurn.state.boardSize, trace: secondTurn.trace },
  ],
}, null, 2));

