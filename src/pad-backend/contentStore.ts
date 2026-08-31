import type {
  AccountState,
  CardInstance,
  ContentBundle,
  ContentValidationIssue,
  GachaBannerDefinition,
  GachaReceipt,
} from './model.ts';
import { validateSkillDefinition } from './skillRegistry.ts';

export function validateContentBundle(bundle: ContentBundle): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  if (!bundle.version.trim()) issues.push({ path: 'version', message: 'Content version is required.' });
  if (!Number.isFinite(Date.parse(bundle.publishedAt))) issues.push({ path: 'publishedAt', message: 'Publication time must be an ISO date.' });
  const skillIds = new Set<string>();
  const cardIds = new Set<string>();
  const enemyIds = new Set<string>();
  const bannerIds = new Set<string>();
  const skillById = new Map(bundle.skills.map((skill) => [skill.id, skill]));

  bundle.skills.forEach((skill, index) => {
    if (skillIds.has(skill.id)) issues.push({ path: `skills[${index}].id`, message: `Duplicate skill id ${skill.id}.` });
    skillIds.add(skill.id);
    validateSkillDefinition(skill).forEach((issue) => {
      issues.push({ path: `skills[${index}].${issue.path}`, message: issue.message });
    });
  });

  bundle.cards.forEach((card, index) => {
    if (cardIds.has(card.id)) issues.push({ path: `cards[${index}].id`, message: `Duplicate card id ${card.id}.` });
    cardIds.add(card.id);
    const references = [...card.skillIds, ...card.passiveSkillIds, ...(card.leaderSkillId ? [card.leaderSkillId] : [])];
    references.forEach((skillId) => {
      if (!skillIds.has(skillId)) issues.push({ path: `cards[${index}]`, message: `Unknown skill id ${skillId}.` });
    });
    card.skillIds.forEach((skillId) => {
      const category = skillById.get(skillId)?.category;
      if (category && category !== 'active') issues.push({ path: `cards[${index}].skillIds`, message: `${skillId} is not an active skill.` });
    });
    card.passiveSkillIds.forEach((skillId) => {
      const category = skillById.get(skillId)?.category;
      if (category && category !== 'passive' && category !== 'awakening') {
        issues.push({ path: `cards[${index}].passiveSkillIds`, message: `${skillId} is not a passive or awakening skill.` });
      }
    });
    if (card.leaderSkillId && skillById.get(card.leaderSkillId)?.category !== 'leader') {
      issues.push({ path: `cards[${index}].leaderSkillId`, message: `${card.leaderSkillId} is not a leader skill.` });
    }
  });

  bundle.enemies.forEach((enemy, index) => {
    if (enemyIds.has(enemy.id)) issues.push({ path: `enemies[${index}].id`, message: `Duplicate enemy id ${enemy.id}.` });
    enemyIds.add(enemy.id);
    const slots = new Set<number>();
    enemy.skillSlots.forEach((reference, referenceIndex) => {
      const path = `enemies[${index}].skillSlots[${referenceIndex}]`;
      if (!Number.isInteger(reference.slot) || reference.slot < 0 || reference.slot >= 64) {
        issues.push({ path: `${path}.slot`, message: 'Enemy skill slot must be an integer from 0 through 63.' });
      }
      if (slots.has(reference.slot)) issues.push({ path: `${path}.slot`, message: `Duplicate enemy skill slot ${reference.slot}.` });
      slots.add(reference.slot);
      const skill = skillById.get(reference.skillId);
      if (!skill) issues.push({ path: `${path}.skillId`, message: `Unknown skill id ${reference.skillId}.` });
      else if (skill.category !== 'enemy-action' && skill.category !== 'enemy-passive') {
        issues.push({ path: `${path}.skillId`, message: `${reference.skillId} is not an enemy skill.` });
      }
      if (!Number.isInteger(reference.immediateChance) || reference.immediateChance < 0 || reference.immediateChance > 255) {
        issues.push({ path: `${path}.immediateChance`, message: 'Native immediate chance must fit an unsigned byte.' });
      }
      if (!Number.isInteger(reference.fallbackWeight) || reference.fallbackWeight < 0 || reference.fallbackWeight > 255) {
        issues.push({ path: `${path}.fallbackWeight`, message: 'Native fallback weight must fit an unsigned byte.' });
      }
    });
  });

  bundle.dungeons.forEach((dungeon, index) => {
    if (!Number.isInteger(dungeon.baseBoardSize.columns) || !Number.isInteger(dungeon.baseBoardSize.rows)
        || dungeon.baseBoardSize.columns < 1 || dungeon.baseBoardSize.columns > 15
        || dungeon.baseBoardSize.rows < 1 || dungeon.baseBoardSize.rows > 15) {
      issues.push({ path: `dungeons[${index}].baseBoardSize`, message: 'Dungeon board dimensions must be integers from 1 through 15.' });
    }
    const floorIndices = new Set<number>();
    dungeon.floors.forEach((floor, floorIndex) => {
      if (floorIndices.has(floor.index)) issues.push({ path: `dungeons[${index}].floors[${floorIndex}].index`, message: `Duplicate floor index ${floor.index}.` });
      floorIndices.add(floor.index);
      floor.enemyIds.forEach((enemyId) => {
        if (!enemyIds.has(enemyId)) issues.push({ path: `dungeons[${index}].floors[${floorIndex}].enemyIds`, message: `Unknown enemy id ${enemyId}.` });
      });
    });
  });

  bundle.banners.forEach((banner, index) => {
    if (bannerIds.has(banner.id)) issues.push({ path: `banners[${index}].id`, message: `Duplicate banner id ${banner.id}.` });
    bannerIds.add(banner.id);
    if (!Number.isFinite(banner.cost) || banner.cost < 0) {
      issues.push({ path: `banners[${index}].cost`, message: 'Banner cost must be non-negative.' });
    }
    if (!Number.isFinite(Date.parse(banner.startsAt)) || !Number.isFinite(Date.parse(banner.endsAt))
        || Date.parse(banner.startsAt) >= Date.parse(banner.endsAt)) {
      issues.push({ path: `banners[${index}]`, message: 'Banner requires a valid start time before its end time.' });
    }
    if (banner.pool.length === 0) issues.push({ path: `banners[${index}].pool`, message: 'Banner pool cannot be empty.' });
    banner.pool.forEach((entry, poolIndex) => {
      if (!cardIds.has(entry.cardId)) {
        issues.push({ path: `banners[${index}].pool[${poolIndex}].cardId`, message: `Unknown card id ${entry.cardId}.` });
      }
      if (!Number.isFinite(entry.weight) || entry.weight <= 0) {
        issues.push({ path: `banners[${index}].pool[${poolIndex}].weight`, message: 'Pool weight must be positive.' });
      }
    });
  });
  return issues;
}

export interface GachaExecutionDependencies {
  now: string;
  roll: number;
  instanceId: string;
}

export interface GachaExecutionResult {
  account: AccountState;
  receipt: GachaReceipt;
  replayed: boolean;
}

function cloneAccount(account: AccountState): AccountState {
  return {
    ...account,
    currencies: { ...account.currencies },
    inventory: Object.fromEntries(Object.entries(account.inventory).map(([id, card]) => [id, { ...card }])),
    gachaReceipts: Object.fromEntries(Object.entries(account.gachaReceipts).map(([id, receipt]) => [id, {
      ...receipt,
      cardInstance: { ...receipt.cardInstance },
    }])),
  };
}

function selectPoolCard(banner: GachaBannerDefinition, roll: number): string {
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) throw new RangeError('Gacha roll must be in [0, 1).');
  const total = banner.pool.reduce((sum, entry) => sum + entry.weight, 0);
  let remaining = roll * total;
  for (const entry of banner.pool) {
    remaining -= entry.weight;
    if (remaining < 0) return entry.cardId;
  }
  return banner.pool[banner.pool.length - 1].cardId;
}

export function executeGachaPull(
  inputAccount: AccountState,
  banner: GachaBannerDefinition,
  requestId: string,
  dependencies: GachaExecutionDependencies,
): GachaExecutionResult {
  const existing = inputAccount.gachaReceipts[requestId];
  if (existing) return { account: cloneAccount(inputAccount), receipt: { ...existing, cardInstance: { ...existing.cardInstance } }, replayed: true };
  if (!requestId.trim()) throw new Error('Gacha request id is required for idempotency.');
  const now = Date.parse(dependencies.now);
  if (!Number.isFinite(now) || now < Date.parse(banner.startsAt) || now >= Date.parse(banner.endsAt)) {
    throw new Error(`Banner ${banner.id} is not active.`);
  }
  if (Object.keys(inputAccount.inventory).length >= inputAccount.inventoryCapacity) {
    throw new Error('Inventory is full.');
  }
  const balance = inputAccount.currencies[banner.currency] ?? 0;
  if (balance < banner.cost) throw new Error(`Not enough ${banner.currency}.`);
  if (inputAccount.inventory[dependencies.instanceId]) throw new Error(`Duplicate instance id ${dependencies.instanceId}.`);

  const cardInstance: CardInstance = {
    instanceId: dependencies.instanceId,
    cardId: selectPoolCard(banner, dependencies.roll),
    acquiredAt: dependencies.now,
    level: 1,
    skillLevel: 1,
    locked: false,
  };
  const receipt: GachaReceipt = {
    requestId,
    bannerId: banner.id,
    cardInstance,
    currency: banner.currency,
    cost: banner.cost,
    roll: dependencies.roll,
  };
  const account = cloneAccount(inputAccount);
  account.revision += 1;
  account.currencies[banner.currency] = balance - banner.cost;
  account.inventory[cardInstance.instanceId] = cardInstance;
  account.gachaReceipts[requestId] = receipt;
  return { account, receipt, replayed: false };
}
