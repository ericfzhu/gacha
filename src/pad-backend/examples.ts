import type { AccountState, ContentBundle, DesignerSkillDefinition } from './model.ts';

export const expandedBoardLeader: DesignerSkillDefinition = {
  id: 'leader.expanded-board',
  name: 'Expanded Board',
  category: 'leader',
  triggers: [{
    hook: 'battle.setup',
    conditions: [{ kind: 'always' }],
    effects: [{ kind: 'board.setBaseSize', columns: 7, rows: 6 }],
  }],
  fidelity: {
    level: 'inferred',
    summary: 'Native base-board storage is verified; the player leader-skill record encoding is not yet recovered.',
    nativeSymbol: 'cGAMEMAIN::_getBoardSize',
  },
};

export const temporaryCompactBoardEnemySkill: DesignerSkillDefinition = {
  id: 'enemy.compact-board',
  name: 'Cramped Field',
  category: 'enemy-action',
  triggers: [{
    hook: 'turn.start',
    conditions: [{ kind: 'always' }],
    effects: [{ kind: 'board.setTemporarySize', columns: 5, rows: 4, durationTurns: 2 }],
  }],
  fidelity: {
    level: 'native-partial',
    nativeType: 126,
    nativeSymbol: 'cGAMEMAIN::_chgBoardSizeTo',
    summary: 'Type-126 encoding, dispatch, and expiry are exact; this semantic demo invokes it directly and does not reproduce its unusual native AI admission condition.',
  },
};

export const comboLeader: DesignerSkillDefinition = {
  id: 'leader.combo-seven',
  name: 'Seven-Combo Formation',
  category: 'leader',
  triggers: [{
    hook: 'before.damage',
    conditions: [{ kind: 'combo.atLeast', count: 7 }],
    effects: [{ kind: 'stats.multiply', stat: 'attack', multiplier: 3.5 }],
  }],
  fidelity: {
    level: 'native-partial',
    summary: 'Threshold-based leader multiplication is represented; the complete 21.9 leader dispatch catalog is unresolved.',
  },
};

export const healingActive: DesignerSkillDefinition = {
  id: 'active.test-heal',
  name: 'Test Recovery',
  category: 'active',
  cooldownTurns: 5,
  triggers: [{
    hook: 'turn.start',
    conditions: [{ kind: 'player.hpAtMost', percent: 80 }],
    effects: [{ kind: 'player.heal', amount: 1_200 }],
  }],
  fidelity: {
    level: 'original-design',
    summary: 'An invented skill used to exercise active-skill authoring and traces.',
  },
};

export const exampleContentBundle: ContentBundle = {
  version: 'designer-model-v1',
  publishedAt: '2026-08-29T00:00:00.000Z',
  skills: [expandedBoardLeader, temporaryCompactBoardEnemySkill, comboLeader, healingActive],
  cards: [
    {
      id: 'test.card.alpha',
      name: 'Test Card Alpha',
      skillIds: [healingActive.id],
      leaderSkillId: expandedBoardLeader.id,
      passiveSkillIds: [],
    },
    {
      id: 'test.card.beta',
      name: 'Test Card Beta',
      skillIds: [],
      leaderSkillId: comboLeader.id,
      passiveSkillIds: [],
    },
  ],
  enemies: [{
    id: 'enemy.test-orbiter',
    name: 'Test Orbiter',
    usesNewAi: true,
    budgetCap: 100,
    budgetRegen: 10,
    skillSlots: [{
      slot: 0,
      skillId: temporaryCompactBoardEnemySkill.id,
      immediateChance: 100,
      fallbackWeight: 0,
    }],
  }],
  dungeons: [{
    id: 'dungeon.structural-test',
    name: 'Structural Test Dungeon',
    baseBoardSize: { columns: 6, rows: 5 },
    floors: [{ index: 1, enemyIds: ['enemy.test-orbiter'] }],
  }],
  banners: [{
    id: 'banner.test',
    name: 'Structural Test Banner',
    currency: 'stones',
    cost: 5,
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2027-01-01T00:00:00.000Z',
    pool: [
      { cardId: 'test.card.alpha', weight: 80 },
      { cardId: 'test.card.beta', weight: 20 },
    ],
    fidelity: {
      level: 'original-design',
      summary: 'The transaction structure is reconstructed; these weights and cards are invented test content.',
    },
  }],
};

export const exampleAccount: AccountState = {
  accountId: 'account.local-example',
  revision: 0,
  inventoryCapacity: 100,
  currencies: { stones: 10 },
  inventory: {},
  gachaReceipts: {},
};
