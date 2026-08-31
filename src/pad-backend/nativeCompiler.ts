import type { DesignerSkillDefinition } from './model.ts';
import { validateSkillDefinition } from './skillRegistry.ts';

export const PAD_NATIVE_ENEMY_BOARD_SIZE_CHANGE = 126;
export const PAD_NATIVE_ENEMY_SKILL_RECORD_SIZE = 0x48;

export interface CompiledNativeEnemySkill {
  bytes: Uint8Array;
  type: number;
  parameters: number[];
  explanation: string;
}

function selectorForBoardSize(columns: number, rows: number): number | null {
  if (columns === 7 && rows === 6) return 1;
  if (columns === 5 && rows === 4) return 2;
  if (columns === 6 && rows === 5) return 3;
  return null;
}

export function compileNativeEnemySkill(
  skill: DesignerSkillDefinition,
  nativeSkillId: number,
): CompiledNativeEnemySkill {
  if (!Number.isInteger(nativeSkillId) || nativeSkillId < 0 || nativeSkillId > 0xffff_ffff) {
    throw new RangeError('Native enemy skill id must fit an unsigned 32-bit integer.');
  }
  const issues = validateSkillDefinition(skill);
  if (issues.length > 0) throw new Error(`Cannot compile invalid skill ${skill.id}.`);
  if (skill.category !== 'enemy-action') {
    throw new Error('Only enemy-action definitions can compile to sENESKILLS records.');
  }
  if (skill.fidelity.nativeType !== PAD_NATIVE_ENEMY_BOARD_SIZE_CHANGE) {
    throw new Error(`Native compiler does not yet support ${skill.id}.`);
  }
  const effects = skill.triggers.flatMap((trigger) => trigger.effects);
  if (effects.length !== 1 || effects[0].kind !== 'board.setTemporarySize') {
    throw new Error('Native type 126 requires exactly one temporary board-size effect.');
  }
  const effect = effects[0];
  const selector = selectorForBoardSize(effect.columns, effect.rows);
  if (selector === null) throw new Error('Native type 126 supports only 7×6, 5×4, and 6×5.');

  const bytes = new Uint8Array(PAD_NATIVE_ENEMY_SKILL_RECORD_SIZE);
  const view = new DataView(bytes.buffer);
  view.setUint32(0x00, nativeSkillId, true);
  view.setInt16(0x04, PAD_NATIVE_ENEMY_BOARD_SIZE_CHANGE, true);
  view.setInt32(0x10, effect.durationTurns, true);
  view.setInt32(0x14, selector, true);
  view.setInt32(0x44, 0, true);
  return {
    bytes,
    type: PAD_NATIVE_ENEMY_BOARD_SIZE_CHANGE,
    parameters: [effect.durationTurns, selector],
    explanation: `type 126: ${effect.durationTurns} turns, ${effect.columns}×${effect.rows} selector ${selector}`,
  };
}
