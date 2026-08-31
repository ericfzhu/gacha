export type FidelityLevel =
  | 'native-exact'
  | 'native-partial'
  | 'externally-corroborated'
  | 'inferred'
  | 'original-design';

export interface FidelityEvidence {
  level: FidelityLevel;
  summary: string;
  nativeType?: number;
  nativeSymbol?: string;
  source?: string;
}

export type SkillCategory =
  | 'active'
  | 'leader'
  | 'passive'
  | 'awakening'
  | 'enemy-action'
  | 'enemy-passive';

export type LifecycleHook =
  | 'battle.setup'
  | 'turn.start'
  | 'before.match'
  | 'after.match'
  | 'before.damage'
  | 'after.damage'
  | 'turn.end';

export interface BoardSize {
  columns: number;
  rows: number;
}

export type SkillCondition =
  | { kind: 'always' }
  | ({ kind: 'board.sizeIs' } & BoardSize)
  | { kind: 'combo.atLeast'; count: number }
  | { kind: 'player.hpAtMost'; percent: number }
  | { kind: 'player.hpAtLeast'; percent: number };

export type SkillEffect =
  | ({ kind: 'board.setBaseSize' } & BoardSize)
  | ({ kind: 'board.setTemporarySize'; durationTurns: number } & BoardSize)
  | { kind: 'board.noSkyfall'; durationTurns: number }
  | { kind: 'stats.multiply'; stat: 'attack' | 'recovery' | 'hp'; multiplier: number }
  | { kind: 'player.heal'; amount: number };

export interface SkillTrigger {
  hook: LifecycleHook;
  conditions: SkillCondition[];
  effects: SkillEffect[];
}

export interface DesignerSkillDefinition {
  id: string;
  name: string;
  category: SkillCategory;
  cooldownTurns?: number;
  triggers: SkillTrigger[];
  fidelity: FidelityEvidence;
}

export interface CardMasterDefinition {
  id: string;
  name: string;
  skillIds: string[];
  leaderSkillId?: string;
  passiveSkillIds: string[];
}

export interface EnemySkillReference {
  slot: number;
  skillId: string;
  immediateChance: number;
  fallbackWeight: number;
}

export interface EnemyMasterDefinition {
  id: string;
  name: string;
  usesNewAi: boolean;
  budgetCap: number;
  budgetRegen: number;
  skillSlots: EnemySkillReference[];
}

export interface DungeonFloorDefinition {
  index: number;
  enemyIds: string[];
}

export interface DungeonMasterDefinition {
  id: string;
  name: string;
  baseBoardSize: BoardSize;
  floors: DungeonFloorDefinition[];
}

export interface GachaPoolEntry {
  cardId: string;
  weight: number;
}

export interface GachaBannerDefinition {
  id: string;
  name: string;
  currency: string;
  cost: number;
  startsAt: string;
  endsAt: string;
  pool: GachaPoolEntry[];
  fidelity: FidelityEvidence;
}

export interface ContentBundle {
  version: string;
  publishedAt: string;
  skills: DesignerSkillDefinition[];
  cards: CardMasterDefinition[];
  enemies: EnemyMasterDefinition[];
  dungeons: DungeonMasterDefinition[];
  banners: GachaBannerDefinition[];
}

export interface CardInstance {
  instanceId: string;
  cardId: string;
  acquiredAt: string;
  level: number;
  skillLevel: number;
  locked: boolean;
}

export interface GachaReceipt {
  requestId: string;
  bannerId: string;
  cardInstance: CardInstance;
  currency: string;
  cost: number;
  roll: number;
}

export interface AccountState {
  accountId: string;
  revision: number;
  inventoryCapacity: number;
  currencies: Record<string, number>;
  inventory: Record<string, CardInstance>;
  gachaReceipts: Record<string, GachaReceipt>;
}

export interface TimedBattleStatus {
  id: string;
  kind: 'board-size-override' | 'no-skyfall';
  turnsRemaining: number;
  sourceSkillId: string;
  fidelity: FidelityLevel;
  boardSize?: BoardSize;
}

export interface BattleState {
  turn: number;
  playerHp: number;
  playerMaxHp: number;
  combos: number;
  baseBoardSize: BoardSize;
  boardSize: BoardSize;
  statMultipliers: Record<'attack' | 'recovery' | 'hp', number>;
  statuses: TimedBattleStatus[];
}

export interface TraceEntry {
  sequence: number;
  hook: LifecycleHook;
  skillId: string;
  stage: 'condition' | 'effect' | 'status';
  outcome: 'passed' | 'blocked' | 'applied' | 'expired';
  detail: string;
  fidelity: FidelityLevel;
}

export interface EvaluationResult {
  state: BattleState;
  trace: TraceEntry[];
}

export interface ContentValidationIssue {
  path: string;
  message: string;
}
