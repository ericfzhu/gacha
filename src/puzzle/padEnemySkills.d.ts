export interface DecodedPadEnemySkillDefinition {
  readonly type: number;
  readonly kind: string;
  readonly supported?: boolean;
  readonly [key: string]: unknown;
}

export function decodePadEnemySkillDefinition(
  skillDefinition: ArrayBuffer | ArrayBufferView,
): DecodedPadEnemySkillDefinition;
