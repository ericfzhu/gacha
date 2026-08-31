import type {
  BattleState,
  BoardSize,
  ContentValidationIssue,
  DesignerSkillDefinition,
  EvaluationResult,
  FidelityLevel,
  LifecycleHook,
  SkillCategory,
  SkillCondition,
  SkillEffect,
  TraceEntry,
} from './model.ts';

interface EffectContract {
  categories: readonly SkillCategory[];
  hooks: readonly LifecycleHook[];
}

const EFFECT_CONTRACTS: Record<SkillEffect['kind'], EffectContract> = {
  'board.setBaseSize': {
    categories: ['leader', 'passive'],
    hooks: ['battle.setup'],
  },
  'board.setTemporarySize': {
    categories: ['active', 'enemy-action'],
    hooks: ['turn.start', 'after.match'],
  },
  'board.noSkyfall': {
    categories: ['active', 'enemy-action'],
    hooks: ['turn.start', 'after.match'],
  },
  'stats.multiply': {
    categories: ['leader', 'passive', 'awakening', 'enemy-passive'],
    hooks: ['battle.setup', 'before.damage'],
  },
  'player.heal': {
    categories: ['active', 'leader', 'passive'],
    hooks: ['turn.start', 'after.match', 'turn.end'],
  },
};

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function boardSizeIsValid(size: BoardSize): boolean {
  return isPositiveInteger(size.columns)
    && isPositiveInteger(size.rows)
    && size.columns <= 15
    && size.rows <= 15;
}

function describeSize(size: BoardSize): string {
  return `${size.columns}×${size.rows}`;
}

function cloneState(state: BattleState): BattleState {
  return {
    ...state,
    baseBoardSize: { ...state.baseBoardSize },
    boardSize: { ...state.boardSize },
    statMultipliers: { ...state.statMultipliers },
    statuses: state.statuses.map((status) => ({
      ...status,
      boardSize: status.boardSize ? { ...status.boardSize } : undefined,
    })),
  };
}

function validateCondition(condition: SkillCondition, path: string): ContentValidationIssue[] {
  if (condition.kind === 'board.sizeIs' && !boardSizeIsValid(condition)) {
    return [{ path, message: 'Board dimensions must be integers from 1 through 15.' }];
  }
  if (condition.kind === 'combo.atLeast' && !isPositiveInteger(condition.count)) {
    return [{ path, message: 'Combo threshold must be a positive integer.' }];
  }
  if ((condition.kind === 'player.hpAtMost' || condition.kind === 'player.hpAtLeast')
      && (!Number.isFinite(condition.percent) || condition.percent < 0 || condition.percent > 100)) {
    return [{ path, message: 'HP percentage must be between 0 and 100.' }];
  }
  return [];
}

function validateEffect(
  effect: SkillEffect,
  skill: DesignerSkillDefinition,
  hook: LifecycleHook,
  path: string,
): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  const contract = EFFECT_CONTRACTS[effect.kind];
  if (!contract.categories.includes(skill.category)) {
    issues.push({
      path,
      message: `${effect.kind} cannot be authored for ${skill.category} skills.`,
    });
  }
  if (!contract.hooks.includes(hook)) {
    issues.push({ path, message: `${effect.kind} cannot run at ${hook}.` });
  }
  if ((effect.kind === 'board.setBaseSize' || effect.kind === 'board.setTemporarySize')
      && !boardSizeIsValid(effect)) {
    issues.push({ path, message: 'Board dimensions must be integers from 1 through 15.' });
  }
  if ((effect.kind === 'board.setTemporarySize' || effect.kind === 'board.noSkyfall')
      && !isPositiveInteger(effect.durationTurns)) {
    issues.push({ path, message: 'Timed effects require a positive integer duration.' });
  }
  if (effect.kind === 'stats.multiply'
      && (!Number.isFinite(effect.multiplier) || effect.multiplier < 0)) {
    issues.push({ path, message: 'Stat multiplier must be a finite non-negative number.' });
  }
  if (effect.kind === 'player.heal'
      && (!Number.isFinite(effect.amount) || effect.amount < 0)) {
    issues.push({ path, message: 'Healing amount must be a finite non-negative number.' });
  }
  return issues;
}

export function validateSkillDefinition(skill: DesignerSkillDefinition): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  if (!skill.id.trim()) issues.push({ path: 'id', message: 'Skill id is required.' });
  if (!skill.name.trim()) issues.push({ path: 'name', message: 'Skill name is required.' });
  if (skill.triggers.length === 0) {
    issues.push({ path: 'triggers', message: 'A skill must define at least one trigger.' });
  }
  skill.triggers.forEach((trigger, triggerIndex) => {
    const triggerPath = `triggers[${triggerIndex}]`;
    if (trigger.effects.length === 0) {
      issues.push({ path: `${triggerPath}.effects`, message: 'A trigger must contain an effect.' });
    }
    trigger.conditions.forEach((condition, conditionIndex) => {
      issues.push(...validateCondition(condition, `${triggerPath}.conditions[${conditionIndex}]`));
    });
    trigger.effects.forEach((effect, effectIndex) => {
      issues.push(...validateEffect(effect, skill, trigger.hook, `${triggerPath}.effects[${effectIndex}]`));
    });
  });
  return issues;
}

interface ConditionResult {
  passed: boolean;
  detail: string;
}

function evaluateCondition(condition: SkillCondition, state: BattleState): ConditionResult {
  if (condition.kind === 'always') return { passed: true, detail: 'Always eligible.' };
  if (condition.kind === 'board.sizeIs') {
    const passed = state.boardSize.columns === condition.columns && state.boardSize.rows === condition.rows;
    return {
      passed,
      detail: `Current board ${describeSize(state.boardSize)} ${passed ? 'matches' : 'does not match'} ${describeSize(condition)}.`,
    };
  }
  if (condition.kind === 'combo.atLeast') {
    const passed = state.combos >= condition.count;
    return { passed, detail: `${state.combos} combos ${passed ? 'meets' : 'is below'} ${condition.count}.` };
  }
  const hpPercent = state.playerMaxHp > 0 ? state.playerHp * 100 / state.playerMaxHp : 0;
  if (condition.kind === 'player.hpAtMost') {
    const passed = hpPercent <= condition.percent;
    return { passed, detail: `Player HP ${hpPercent.toFixed(2)}% ${passed ? 'is at most' : 'exceeds'} ${condition.percent}%.` };
  }
  const passed = hpPercent >= condition.percent;
  return { passed, detail: `Player HP ${hpPercent.toFixed(2)}% ${passed ? 'is at least' : 'is below'} ${condition.percent}%.` };
}

function traceEntry(
  trace: TraceEntry[],
  hook: LifecycleHook,
  skillId: string,
  fidelity: FidelityLevel,
  stage: TraceEntry['stage'],
  outcome: TraceEntry['outcome'],
  detail: string,
): void {
  trace.push({ sequence: trace.length + 1, hook, skillId, fidelity, stage, outcome, detail });
}

function replaceStatus(state: BattleState, status: BattleState['statuses'][number]): void {
  state.statuses = state.statuses.filter((candidate) => candidate.kind !== status.kind);
  state.statuses.push(status);
}

function applyEffect(
  effect: SkillEffect,
  skill: DesignerSkillDefinition,
  hook: LifecycleHook,
  state: BattleState,
  trace: TraceEntry[],
): void {
  if (effect.kind === 'board.setBaseSize') {
    state.baseBoardSize = { columns: effect.columns, rows: effect.rows };
    if (!state.statuses.some((status) => status.kind === 'board-size-override')) {
      state.boardSize = { ...state.baseBoardSize };
    }
    traceEntry(trace, hook, skill.id, skill.fidelity.level, 'effect', 'applied',
      `Base board size set to ${describeSize(effect)}.`);
    return;
  }
  if (effect.kind === 'board.setTemporarySize') {
    state.boardSize = { columns: effect.columns, rows: effect.rows };
    replaceStatus(state, {
      id: `board-size:${skill.id}`,
      kind: 'board-size-override',
      turnsRemaining: effect.durationTurns,
      sourceSkillId: skill.id,
      fidelity: skill.fidelity.level,
      boardSize: { columns: effect.columns, rows: effect.rows },
    });
    traceEntry(trace, hook, skill.id, skill.fidelity.level, 'effect', 'applied',
      `Temporary ${describeSize(effect)} board installed for ${effect.durationTurns} turns.`);
    return;
  }
  if (effect.kind === 'board.noSkyfall') {
    replaceStatus(state, {
      id: `no-skyfall:${skill.id}`,
      kind: 'no-skyfall',
      turnsRemaining: effect.durationTurns,
      sourceSkillId: skill.id,
      fidelity: skill.fidelity.level,
    });
    traceEntry(trace, hook, skill.id, skill.fidelity.level, 'effect', 'applied',
      `Skyfall matching disabled for ${effect.durationTurns} turns.`);
    return;
  }
  if (effect.kind === 'stats.multiply') {
    state.statMultipliers[effect.stat] *= effect.multiplier;
    traceEntry(trace, hook, skill.id, skill.fidelity.level, 'effect', 'applied',
      `${effect.stat} multiplier ×${effect.multiplier}.`);
    return;
  }
  const before = state.playerHp;
  state.playerHp = Math.min(state.playerMaxHp, state.playerHp + effect.amount);
  traceEntry(trace, hook, skill.id, skill.fidelity.level, 'effect', 'applied',
    `Player healed ${state.playerHp - before} HP.`);
}

export function createBattleState(baseBoardSize: BoardSize = { columns: 6, rows: 5 }): BattleState {
  if (!boardSizeIsValid(baseBoardSize)) throw new RangeError('Invalid base board size.');
  return {
    turn: 0,
    playerHp: 12_000,
    playerMaxHp: 12_000,
    combos: 0,
    baseBoardSize: { ...baseBoardSize },
    boardSize: { ...baseBoardSize },
    statMultipliers: { attack: 1, recovery: 1, hp: 1 },
    statuses: [],
  };
}

export function evaluateSkillAtHook(
  inputState: BattleState,
  skill: DesignerSkillDefinition,
  hook: LifecycleHook,
): EvaluationResult {
  const issues = validateSkillDefinition(skill);
  if (issues.length > 0) {
    throw new Error(`Invalid skill ${skill.id}: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ')}`);
  }
  const state = cloneState(inputState);
  const trace: TraceEntry[] = [];
  for (const trigger of skill.triggers.filter((candidate) => candidate.hook === hook)) {
    let eligible = true;
    for (const condition of trigger.conditions) {
      const result = evaluateCondition(condition, state);
      traceEntry(trace, hook, skill.id, skill.fidelity.level, 'condition',
        result.passed ? 'passed' : 'blocked', result.detail);
      if (!result.passed) eligible = false;
    }
    if (!eligible) continue;
    for (const effect of trigger.effects) applyEffect(effect, skill, hook, state, trace);
  }
  return { state, trace };
}

export function advanceBattleTurn(inputState: BattleState): EvaluationResult {
  const state = cloneState(inputState);
  const trace: TraceEntry[] = [];
  state.turn += 1;
  state.statuses = state.statuses.flatMap((status) => {
    const next = { ...status, turnsRemaining: status.turnsRemaining - 1 };
    if (next.turnsRemaining > 0) return [next];
    if (status.kind === 'board-size-override') state.boardSize = { ...state.baseBoardSize };
    traceEntry(trace, 'turn.end', status.sourceSkillId, status.fidelity, 'status', 'expired',
      status.kind === 'board-size-override'
        ? `Temporary board expired; restored ${describeSize(state.baseBoardSize)}.`
        : 'No-skyfall status expired.');
    return [];
  });
  return { state, trace };
}
