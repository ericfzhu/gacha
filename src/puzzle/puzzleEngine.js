import {
  PAD_BOARD_COLUMNS,
  PAD_BOARD_ROWS,
  PAD_DEFAULT_MOVE_TIME_SECONDS,
  PAD_ENHANCED_ORB_BONUS,
  PAD_INT32_MAX,
  createPadRng,
  findPadBombDetonations,
  findPadMatches,
  padApplyAttackMultipliers,
  padAttributeMultiplier,
  padBombDamage,
  padComboLeaderMultiplier,
  padCountBlockBits,
  padCountNonPoisonBlocks,
  padDamageAfterDefense,
  padEnemyDamageAfterShields,
  padEnemyResolveThresholdHp,
  padNativeBaseAttackPower,
  padNativeRecoveryPower,
  padNailDamage,
  padLcgStep,
  padPoisonDamage,
  padResolveBlackFall,
  padResolveBlockSwapPassive,
  padResolveComboDropAwakenings,
  padResolveComboDropSpawns,
  padResolveEnhancementFall,
  padResolveLockFall,
  padResolveNailFall,
  padResolveThornFall,
  padSecondaryAttributeAttack,
  padShuffleLockDropCandidates,
  padTertiaryAttributeAttack,
  padThornDamage,
  tracePadPointerCells,
} from './padCoreRules.js';
import {
  PAD_ENEMY_SKILL_SOURCE_ORB_CONVERSION,
  PAD_ENEMY_SKILL_ENTIRE_BLIND,
  PAD_ENEMY_SKILL_ENTIRE_BLIND_ALT,
  PAD_ENEMY_SKILL_BIND_ATTACK,
  PAD_ENEMY_SKILL_RANDOM_SUB_BIND,
  PAD_ENEMY_SKILL_CLEAR_PLAYER_BUFFS,
  PAD_ENEMY_SKILL_HEAL_ENEMY,
  PAD_ENEMY_SKILL_HEAL_ENEMY_UNCONDITIONAL,
  PAD_ENEMY_SKILL_DAMAGE_ABSORB,
  PAD_ENEMY_SKILL_AWAKENING_BIND,
  PAD_ENEMY_SKILL_SKILL_DELAY,
  PAD_ENEMY_SKILL_PRESENCE_CHECK,
  PAD_ENEMY_SKILL_MASKED_RANDOM_ORB_CHANGE,
  PAD_ENEMY_SKILL_NATIVE_NO_EFFECT,
  PAD_ENEMY_SKILL_LOCK_RANDOM_ORBS,
  PAD_ENEMY_SKILL_ENEMY_ESCAPE,
  PAD_ENEMY_SKILL_LOCKED_SKYFALL,
  PAD_ENEMY_SKILL_STICKY_BLIND_RANDOM,
  PAD_ENEMY_SKILL_STICKY_BLIND_FIXED,
  PAD_ENEMY_SKILL_ORB_SEAL_COLUMNS,
  PAD_ENEMY_SKILL_ORB_SEAL_ROWS,
  PAD_ENEMY_SKILL_FIXED_START,
  PAD_ENEMY_SKILL_RANDOM_BOMBS,
  PAD_ENEMY_SKILL_FIXED_BOMBS,
  PAD_ENEMY_SKILL_CLOUD,
  PAD_ENEMY_SKILL_RECOVERY_DEBUFF,
  PAD_ENEMY_SKILL_TURN_CHANGE,
  PAD_ENEMY_SKILL_ATTRIBUTE_BLOCK,
  PAD_ENEMY_SKILL_ADDITIONAL_ATTACK,
  PAD_ENEMY_SKILL_DEFENSE_BOOST,
  PAD_ENEMY_SKILL_ATTRIBUTE_NULLIFY,
  PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY,
  PAD_ENEMY_SKILL_SOURCE_TO_JAMMER,
  PAD_ENEMY_SKILL_RANDOM_PARTY_BIND,
  PAD_ENEMY_SKILL_ACTIVE_SKILL_SEAL,
  PAD_ENEMY_SKILL_REPEAT_ATTACK,
  PAD_ENEMY_SKILL_INACTIVITY,
  PAD_ENEMY_SKILL_INACTIVITY_UNCONDITIONAL,
  PAD_ENEMY_SKILL_COMBO_ABSORB,
  PAD_ENEMY_SKILL_SKYFALL_RATE,
  PAD_ENEMY_SKILL_DEATH_CRY,
  PAD_ENEMY_SKILL_INACTIVITY_PRESENTATION,
  PAD_ENEMY_SKILL_DAMAGE_VOID,
  PAD_ENEMY_SKILL_ATTRIBUTE_RESIST,
  PAD_ENEMY_SKILL_RESOLVE,
  PAD_ENEMY_SKILL_DAMAGE_SHIELD,
  PAD_ENEMY_SKILL_LEADER_SWAP,
  PAD_ENEMY_SKILL_NORMAL_ATTACK,
  PAD_ENEMY_SKILL_LONE_ATTACK_BOOST,
  PAD_ENEMY_SKILL_STATUS_TRIGGERED_ATTACK_BOOST,
  PAD_ENEMY_SKILL_DAMAGED_TURN_ATTACK_BOOST,
  PAD_ENEMY_SKILL_STATUS_SHIELD,
  PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION,
  PAD_ENEMY_SKILL_SELF_DESTRUCT,
  PAD_ENEMY_SKILL_CHANGE_ATTRIBUTE,
  PAD_ENEMY_SKILL_SCALED_ATTACK,
  PAD_ENEMY_SKILL_CURRENT_HP_GRAVITY,
  PAD_ENEMY_SKILL_REVIVE_ENEMY,
  PAD_ENEMY_SKILL_ATTRIBUTE_ABSORB,
  PAD_ENEMY_SKILL_BIND_LEADER_HELPER,
  PAD_ENEMY_SKILL_HEAL_PLAYER,
  PAD_ENEMY_SKILL_BLACK_FALL,
  PAD_ENEMY_SKILL_SOURCE_TO_POISON,
  PAD_ENEMY_SKILL_SOURCE_TO_MORTAL_POISON,
  PAD_ENEMY_SKILL_POISON_BLOCKS,
  PAD_ENEMY_SKILL_MORTAL_POISON_BLOCKS,
  PAD_ENEMY_SKILL_POISON_BLOCK_N_COUNTED,
  PAD_ENEMY_SKILL_MORTAL_POISON_BLOCK_N_COUNTED,
  PAD_ENEMY_SKILL_POISON_BLOCK_N,
  PAD_ENEMY_SKILL_HORIZONTAL_LINES,
  PAD_ENEMY_SKILL_HORIZONTAL_LINES_4,
  PAD_ENEMY_SKILL_VERTICAL_LINES,
  PAD_ENEMY_SKILL_VERTICAL_LINES_4,
  PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP,
  PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP_DIRECT,
  PAD_ENEMY_SKILL_MULTI_ATTACK,
  PAD_ENEMY_SKILL_POISON_MASK_SWAP,
  PAD_ENEMY_SKILL_POISON_MASK_SWAP_DIRECT,
  PAD_ENEMY_SKILL_BLOCK_MINUS,
  PAD_ENEMY_SKILL_BUR_DROP,
  decodePadEnemySkillDefinition,
  decodePadEnemySkillRuntime,
  normalizePadEnemySkillRecord,
  padEnemySkillAttributeCandidates,
  padEnemySkillAdditionalAttack,
  padEnemySkillAttributeNullifyMask,
  padEnemySkillBoostedAttack,
  padEnemySkillCurrentHpGravity,
  padEnemySkillMoveTimeSeconds,
  padEnemySkillEnemyHeal,
  padEnemySkillDefenseBoost,
  padEnemySkillPlayerHeal,
  padEnemySkillReviveHp,
  padEnemyTurnChangeTriggered,
} from './padEnemySkills.js';
import {
  decodePadEnemyAiMonsterDefinition,
  decodePadEnemyAiSkillDefinition,
  evaluatePadEnemyAiSub,
  selectPadEnemyAiNew,
} from './padEnemyAi.js';

export const BOARD_COLUMNS = PAD_BOARD_COLUMNS;
export const BOARD_ROWS = PAD_BOARD_ROWS;

export const ORB_TYPES = Object.freeze([
  { id: 'fire', code: 'R', label: 'Fire', color: '#ef5a4f', highlight: '#ffb09e' },
  { id: 'water', code: 'B', label: 'Water', color: '#42a7ef', highlight: '#b9e5ff' },
  { id: 'wood', code: 'G', label: 'Wood', color: '#59bd67', highlight: '#c8f4bd' },
  { id: 'light', code: 'L', label: 'Light', color: '#f2c94c', highlight: '#fff4b0' },
  { id: 'dark', code: 'D', label: 'Dark', color: '#8d65cf', highlight: '#dac8ff' },
  { id: 'heart', code: 'H', label: 'Heart', color: '#ed72a7', highlight: '#ffd0e2' },
  { id: 'jammer', code: 'J', label: 'Jammer', color: '#26354e', highlight: '#7092be' },
  { id: 'poison', code: 'P', label: 'Poison', color: '#6b2d88', highlight: '#d49be8' },
  { id: 'mortalPoison', code: 'M', label: 'Mortal Poison', color: '#32213f', highlight: '#f0e3f8' },
  { id: 'bomb', code: 'X', label: 'Bomb', color: '#8f99a8', highlight: '#ffffff' },
]);

const NATURAL_ORB_TYPES = ORB_TYPES.slice(0, 6);
const PAD_BLOCK_LOCKED_FLAG = 0x800;
const PAD_BLOCK_ENTIRE_BLIND_FLAG = 0x4;
const PAD_BLOCK_ENTIRE_BLIND_FRESH_FLAG = 0x8;
const PAD_BLOCK_BLIND_FLAG = 0x1000;
const PAD_BLOCK_COMBO_DROP_FLAG = 0x8000;
const PAD_BLOCK_BLIND_FRESH_FLAG = 0x10000;
const PAD_BLOCK_NAIL_FLAG = 0x20000;
const PAD_BLOCK_SPECIAL_LOCK_CLEAR_FLAGS = 0x28000;
const PAD_BLOCK_BURST_FLAG = 0x80000;

export const ORB_BY_ID = Object.freeze(Object.fromEntries(ORB_TYPES.map((orb) => [orb.id, orb])));
export const ORB_BY_CODE = Object.freeze(Object.fromEntries(ORB_TYPES.map((orb) => [orb.code, orb])));
const PAD_ATTRIBUTE_INDEX = Object.freeze(Object.fromEntries(
  ORB_TYPES.slice(0, 6).map((orb, index) => [orb.id, index]),
));

const DEMO_COMBO_LEADER = Object.freeze({
  type: 'comboAttack',
  thresholds: Object.freeze([
    Object.freeze({ combos: 4, multiplier: 2 }),
    Object.freeze({ combos: 7, multiplier: 3.5 }),
  ]),
});

const PARTY = Object.freeze([
  { id: 'ember', name: 'Ember', attribute: 'fire', secondaryAttribute: 'dark', attack: 890, recovery: 140, bindTurns: 0, bindResist: false, superBindResist: false, leaderSkill: DEMO_COMBO_LEADER },
  { id: 'marina', name: 'Marina', attribute: 'water', secondaryAttribute: 'light', attack: 940, recovery: 155, bindTurns: 0, bindResist: false, superBindResist: false },
  { id: 'briar', name: 'Briar', attribute: 'wood', secondaryAttribute: 'fire', attack: 850, recovery: 145, bindTurns: 0, bindResist: false, superBindResist: false },
  { id: 'sol', name: 'Sol', attribute: 'light', secondaryAttribute: 'light', attack: 910, recovery: 130, bindTurns: 0, bindResist: false, superBindResist: false },
  { id: 'nyx', name: 'Nyx', attribute: 'dark', secondaryAttribute: 'water', attack: 900, recovery: 120, bindTurns: 0, bindResist: false, superBindResist: false },
  { id: 'helper', name: 'Helper', attribute: 'fire', secondaryAttribute: 'wood', tertiaryAttribute: 'light', attack: 980, recovery: 130, bindTurns: 0, bindResist: false, superBindResist: false, helper: true, leaderSkill: DEMO_COMBO_LEADER },
]);

const ENEMY_TEMPLATE = Object.freeze([
  { id: 'verdant-shell', name: 'Verdant Shell', attribute: 'wood', maxHp: 92000, defense: 120, attack: 1850, maxCounter: 2, scaledAttackGate: 0, attackBoostTurns: 0, attackBoostPercent: 100, defenseBoostTurns: 0, defenseBoostAmount: 0, attributeNullifyTurns: 0, attributeNullifyMask: 0, damagedTurnCount: 0, transientDebuffActive: false, statusShieldTurns: 0, attributeAbsorbTurns: 0, attributeAbsorbMask: 0, comboAbsorbTurns: 0, comboAbsorbThreshold: 0, damageAbsorbTurns: 0, damageAbsorbThreshold: 0, damageVoidTurns: 0, damageVoidThreshold: 0, damageShieldTurns: 0, damageShieldPercent: 0 },
  { id: 'umbra-eye', name: 'Umbra Eye', attribute: 'dark', maxHp: 76000, defense: 90, attack: 1450, maxCounter: 3, scaledAttackGate: 0, attackBoostTurns: 0, attackBoostPercent: 100, defenseBoostTurns: 0, defenseBoostAmount: 0, attributeNullifyTurns: 0, attributeNullifyMask: 0, damagedTurnCount: 0, transientDebuffActive: false, statusShieldTurns: 0, attributeAbsorbTurns: 0, attributeAbsorbMask: 0, comboAbsorbTurns: 0, comboAbsorbThreshold: 0, damageAbsorbTurns: 0, damageAbsorbThreshold: 0, damageVoidTurns: 0, damageVoidThreshold: 0, damageShieldTurns: 0, damageShieldPercent: 0 },
]);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeEnhancementPower(value) {
  const numeric = Number(value);
  return Math.fround(Number.isFinite(numeric) ? numeric : 0);
}

function copyEnemies() {
  return ENEMY_TEMPLATE.map((enemy) => ({
    ...enemy,
    hp: enemy.maxHp,
    counter: enemy.maxCounter,
    baseMaxCounter: enemy.maxCounter,
    attributeResistPercentages: Array(5).fill(100),
    resolveThresholdPercent: 0,
    turnChangeThresholdPercent: 0,
    turnChangeCounter: 0,
    turnChangeActive: false,
  }));
}

export class PuzzleEngine {
  constructor({
    seed = 21900,
    moveTime = PAD_DEFAULT_MOVE_TIME_SECONDS,
    columns = PAD_BOARD_COLUMNS,
    rows = PAD_BOARD_ROWS,
    allowDiagonalMoves = false,
    faceTypes = [0, 1, 2, 3, 4, 5],
    dropRates = Array(10).fill(0),
    skyfallExclusionMask = 0,
    comboDropChanceBasisPoints = 0,
    comboDropCap = 12,
    comboDropAwakenings = Array(5).fill(0),
    topLineDropTypes = null,
    blackFallRule = null,
    thornFallRule = null,
    nailFallRule = null,
    enhancedFallAwakenings = Array(6).fill(0),
    enhancedFallModifier = null,
    passiveEnhancementFallsEnabled = true,
    lockFallRules = [],
    lockFallSeed = seed,
    enemySkillQueues = [],
    enemyAiPools = [],
    playerAuxiliaryBuffTurns = 0,
    playerAttackBoostTurns = 0,
    skillSealResistAwakenings = 0,
    skillSealBadgeResistance = 0,
  } = {}) {
    if (![columns, rows].every(Number.isInteger) || columns < 1 || columns > 15 || rows < 1 || rows > 15) {
      throw new Error('PAD board dimensions must be integers from 1 through 15.');
    }
    this.seed = seed;
    this.baseMoveTime = Math.max(0, Number(moveTime) || 0);
    this.moveTime = this.baseMoveTime;
    this.columns = columns;
    this.rows = rows;
    this.allowDiagonalMoves = Boolean(allowDiagonalMoves);
    this.setFaceTypes(faceTypes);
    this.skyfallRateRules = { natural: null, hazard: null };
    this.setDropRates(dropRates);
    this.skyfallExclusionMask = Number(skyfallExclusionMask) >>> 0;
    this.comboDropChanceBasisPoints = Math.max(0, Math.trunc(Number(comboDropChanceBasisPoints) || 0));
    this.comboDropCap = Math.max(0, Math.trunc(Number(comboDropCap) || 0));
    this.setComboDropAwakenings(comboDropAwakenings);
    this.setTopLineDropTypes(topLineDropTypes);
    this.setBlackFallRule(blackFallRule);
    this.setThornFallRule(thornFallRule);
    this.setNailFallRule(nailFallRule);
    this.setEnhancedFallAwakenings(enhancedFallAwakenings);
    this.setEnhancedFallModifier(enhancedFallModifier);
    this.passiveEnhancementFallsEnabled = Boolean(passiveEnhancementFallsEnabled);
    this.setLockFallRules(lockFallRules);
    this.lockFallSeed = Number(lockFallSeed) >>> 0;
    this.enemySkillQueues = ENEMY_TEMPLATE.map(() => ({ records: [], position: 0, repeat: false }));
    if (!Array.isArray(enemySkillQueues)) throw new Error('PAD enemy skill queues must be an array.');
    enemySkillQueues.forEach((queue, enemyIndex) => {
      if (queue !== null && queue !== undefined) {
        this.setEnemySkillQueue(enemyIndex, queue.definitions || queue, { repeat: queue.repeat });
      }
    });
    this.enemyAiPools = ENEMY_TEMPLATE.map(() => null);
    if (!Array.isArray(enemyAiPools)) throw new Error('PAD enemy AI pools must be an array.');
    enemyAiPools.forEach((pool, enemyIndex) => {
      if (pool !== null && pool !== undefined) {
        this.setEnemyAiDefinitionPool(enemyIndex, pool.monsterDefinition, pool.skillDefinitions);
      }
    });
    this.initialPlayerAuxiliaryBuffTurns = Math.max(
      0,
      Math.trunc(Number(playerAuxiliaryBuffTurns) || 0),
    );
    this.initialPlayerAttackBoostTurns = Math.max(
      0,
      Math.trunc(Number(playerAttackBoostTurns) || 0),
    );
    this.skillSealResistAwakenings = Math.max(
      0,
      Math.trunc(Number(skillSealResistAwakenings) || 0),
    );
    this.skillSealBadgeResistance = Math.max(
      0,
      Math.trunc(Number(skillSealBadgeResistance) || 0),
    );
    this.rng = createPadRng(seed);
    this.orbSerial = 0;
    this.visualTime = 0;
    this.reset();
  }

  reset() {
    this.rng = createPadRng(this.seed);
    this.lockFallRng = createPadRng(this.lockFallSeed);
    this.orbSerial = 0;
    this.mode = 'ready';
    this.phase = 'input';
    this.phaseTimer = 0;
    this.phaseAfterDeath = null;
    this.turn = 0;
    this.comboCount = 0;
    this.cascadeDepth = 0;
    this.lastComboCount = 0;
    this.lastDamage = 0;
    this.lastAbsorbedDamage = 0;
    this.lastVoidedDamage = 0;
    this.lastNailDamage = 0;
    this.lastHealing = 0;
    this.lastPoisonDamage = 0;
    this.lastBombDamage = 0;
    this.lastThornDamage = 0;
    this.lastEnemySkill = null;
    this.lastEnemyDeathAction = null;
    this.lastEnemyActions = [];
    this.moveTime = this.baseMoveTime;
    this.moveTimeReduction = null;
    this.playerAuxiliaryBuffTurns = this.initialPlayerAuxiliaryBuffTurns;
    this.playerAttackBoostTurns = this.initialPlayerAttackBoostTurns;
    this.skillSealTurns = 0;
    this.skillSealSkipPostEnemyCountdown = false;
    this.awakeningBindTurns = 0;
    this.awakeningBindSkipPostEnemyCountdown = false;
    this.orbSealColumnMask = 0;
    this.orbSealColumnTurns = 0;
    this.orbSealRowMask = 0;
    this.orbSealRowTurns = 0;
    this.forcedStart = null;
    this.cloud = null;
    this.recoveryDebuff = null;
    this.attributeBlock = null;
    this.leaderSwapTurns = 0;
    this.leaderSwapIndex = null;
    this.enemySkillQueues.forEach((queue) => { queue.position = 0; });
    this.enemyAiPools.forEach((pool) => {
      if (pool) {
        pool.aiBudget = pool.monster.budgetCap;
        pool.multiAttack = null;
      }
    });
    this.pendingComboDrops = 0;
    this.comboDropBonusCount = 0;
    this.turnNailCount = 0;
    this.skyfallRateRules = { natural: null, hazard: null };
    this.lockFallRules = this.lockFallRules
      .filter((rule) => rule.source !== 'enemySkill')
      .map((rule) => ({ ...rule }));
    this.recomputeDropRates();
    this.hpResolutionApplied = false;
    this.lastLeaderMultiplier = 1;
    this.message = 'Drag one orb through the board to rearrange the whole path.';
    this.party = PARTY.map((member) => ({ ...member }));
    this.player = {
      hp: 12000,
      maxHp: 12000,
      recovery: this.party.reduce((total, member) => total + member.recovery, 0),
    };
    this.enemies = copyEnemies().map((enemy) => ({
      ...enemy,
      deathResolved: false,
      escaped: false,
    }));
    this.enemyAiPools.forEach((_, enemyIndex) => this.applyEnemyPassiveSkills(enemyIndex));
    this.targetEnemy = 0;
    this.manualTarget = false;
    this.skill = {
      name: 'Tide Shift',
      cooldown: 0,
      maxCooldown: 5,
      skillDelayResistLatents: 0,
    };
    this.drag = null;
    this.pendingMatches = [];
    this.pendingBombCells = [];
    this.turnMatches = [];
    this.floatingText = [];
    this.board = this.createStableBoard();
  }

  start() {
    if (this.mode === 'playing') return;
    this.mode = 'playing';
    this.phase = 'input';
    this.message = 'Your move — touch and drag any orb.';
  }

  createOrb(type, state = {}) {
    let enhancementPower = normalizeEnhancementPower(
      state.enhancementPower === undefined ? (state.enhanced ? PAD_ENHANCED_ORB_BONUS : 0) : state.enhancementPower,
    );
    const descriptorInput = state.thornDescriptor === undefined
      ? Math.max(0, Math.min(0x7f, Math.trunc(Number(state.thornPercent) || 0)))
      : Math.max(0, Math.min(0xff, Math.trunc(Number(state.thornDescriptor) || 0)));
    const thornPercent = state.thornPercent === undefined
      ? descriptorInput & 0x7f
      : Math.max(0, Math.min(0x7f, Math.trunc(Number(state.thornPercent) || 0)));
    const thornDescriptor = (descriptorInput & 0x80) | thornPercent;
    const requestedBlockFlags = Number(state.blockFlags) >>> 0;
    const locked = state.locked === undefined
      ? (requestedBlockFlags & PAD_BLOCK_LOCKED_FLAG) !== 0
      : Boolean(state.locked);
    const thornActive = state.thornActive === undefined
      ? thornDescriptor !== 0 || (requestedBlockFlags & PAD_BLOCK_BURST_FLAG) !== 0
      : Boolean(state.thornActive);
    let nail = state.nail === undefined
      ? (requestedBlockFlags & PAD_BLOCK_NAIL_FLAG) !== 0
      : Boolean(state.nail);
    const entireBlind = state.entireBlind === undefined
      ? (requestedBlockFlags & PAD_BLOCK_ENTIRE_BLIND_FLAG) !== 0
      : Boolean(state.entireBlind);
    const blackFallBlind = state.blind === undefined
      ? (requestedBlockFlags & PAD_BLOCK_BLIND_FLAG) !== 0
      : Boolean(state.blind) && !entireBlind;
    const blind = entireBlind || blackFallBlind;
    const entireBlindFresh = entireBlind && (requestedBlockFlags
      & PAD_BLOCK_ENTIRE_BLIND_FRESH_FLAG) !== 0;
    const blackFallBlindFresh = blackFallBlind && (state.blindFresh === undefined
      ? (requestedBlockFlags & PAD_BLOCK_BLIND_FRESH_FLAG) !== 0
      : Boolean(state.blindFresh));
    const blindFresh = entireBlindFresh || blackFallBlindFresh;
    const blindCountdown = blackFallBlind
      ? Math.max(0, Math.min(0x7f, Math.trunc(Number(state.blindCountdown) || 1)))
      : 0;
    let blockFlags = (requestedBlockFlags
      & ~(PAD_BLOCK_ENTIRE_BLIND_FLAG | PAD_BLOCK_ENTIRE_BLIND_FRESH_FLAG
        | PAD_BLOCK_LOCKED_FLAG | PAD_BLOCK_BLIND_FLAG | PAD_BLOCK_COMBO_DROP_FLAG
        | PAD_BLOCK_BLIND_FRESH_FLAG | PAD_BLOCK_NAIL_FLAG | PAD_BLOCK_BURST_FLAG))
      | (entireBlind ? PAD_BLOCK_ENTIRE_BLIND_FLAG : 0)
      | (entireBlindFresh ? PAD_BLOCK_ENTIRE_BLIND_FRESH_FLAG : 0)
      | (locked ? PAD_BLOCK_LOCKED_FLAG : 0)
      | (blackFallBlind ? PAD_BLOCK_BLIND_FLAG : 0)
      | ((requestedBlockFlags & PAD_BLOCK_COMBO_DROP_FLAG) !== 0 ? PAD_BLOCK_COMBO_DROP_FLAG : 0)
      | (blackFallBlindFresh ? PAD_BLOCK_BLIND_FRESH_FLAG : 0)
      | (nail ? PAD_BLOCK_NAIL_FLAG : 0)
      | (thornActive ? PAD_BLOCK_BURST_FLAG : 0);
    const nativeType = ORB_TYPES.findIndex((candidate) => candidate.id === type);
    if (blind && nativeType >= 6 && nativeType <= 9) {
      blockFlags &= ~PAD_BLOCK_SPECIAL_LOCK_CLEAR_FLAGS;
      enhancementPower = 0;
      nail = false;
    }
    return {
      id: ++this.orbSerial,
      type,
      ...state,
      blockFlags,
      enhancementPower,
      enhanced: enhancementPower > 0,
      locked,
      blind,
      blindFresh,
      blindCountdown,
      nail,
      thornActive,
      thornDescriptor,
      thornPercent,
    };
  }

  createStableBoard() {
    return this.rng.createInitialBoard(
      this.rows,
      this.columns,
      this.dropRates,
      this.faceTypes,
    ).map((row) => row.map((type) => this.createOrb(ORB_TYPES[type]?.id || NATURAL_ORB_TYPES[0].id)));
  }

  startDrag(row, column, pointerX = 0, pointerY = 0, gridColumn = column + 0.5, gridRow = row + 0.5) {
    if (this.mode !== 'playing' || this.phase !== 'input' || this.drag) return false;
    if (!this.isCell(row, column) || this.isOrbSealed(row, column)) return false;
    if (this.forcedStart && (
      row !== this.forcedStart.row || column !== this.forcedStart.column
    )) return false;
    this.lastThornDamage = 0;
    this.hpResolutionApplied = false;
    this.drag = { row, column, pointerX, pointerY, gridColumn, gridRow, remaining: this.moveTime, pathLength: 0 };
    this.message = 'Keep moving — every crossed cell swaps with the held orb.';
    return true;
  }

  moveDrag(row, column, pointerX = 0, pointerY = 0, gridColumn = column + 0.5, gridRow = row + 0.5) {
    if (!this.drag) return false;
    this.drag.pointerX = pointerX;
    this.drag.pointerY = pointerY;
    if (![gridColumn, gridRow].every(Number.isFinite)) return false;

    let fromRow = this.drag.row;
    let fromColumn = this.drag.column;
    const path = tracePadPointerCells(
      fromRow,
      fromColumn,
      this.drag.gridColumn,
      this.drag.gridRow,
      gridColumn,
      gridRow,
      this.rows,
      this.columns,
      this.allowDiagonalMoves,
    );
    if (!path.length) return false;
    let moved = false;
    for (const { row: nextRow, column: nextColumn } of path) {
      if (this.isOrbSealed(nextRow, nextColumn)) {
        // Keep the traced pointer origin on the last reachable cell. Advancing
        // it to the physical pointer would let the next event jump past tape.
        this.drag.gridColumn = fromColumn + 0.5;
        this.drag.gridRow = fromRow + 0.5;
        this.drag.pointerX = pointerX;
        this.drag.pointerY = pointerY;
        this.drag.row = fromRow;
        this.drag.column = fromColumn;
        return moved;
      }
      const crossedOrb = this.board[nextRow][nextColumn];
      if (crossedOrb.thornActive && crossedOrb.thornPercent > 0) {
        const damage = padThornDamage(this.player.maxHp, crossedOrb.thornPercent);
        this.lastThornDamage = Math.min(PAD_INT32_MAX, this.lastThornDamage + damage);
      }
      this.revealEntireBlindOrb(this.board[fromRow][fromColumn]);
      this.revealEntireBlindOrb(crossedOrb);
      [this.board[fromRow][fromColumn], this.board[nextRow][nextColumn]] = [this.board[nextRow][nextColumn], this.board[fromRow][fromColumn]];
      fromRow = nextRow;
      fromColumn = nextColumn;
      this.drag.pathLength += 1;
      moved = true;
    }
    this.drag.gridColumn = Math.max(0, Math.min(this.columns - Number.EPSILON * this.columns, gridColumn));
    this.drag.gridRow = Math.max(0, Math.min(this.rows - Number.EPSILON * this.rows, gridRow));
    this.drag.row = fromRow;
    this.drag.column = fromColumn;
    return moved;
  }

  endDrag() {
    if (!this.drag) return false;
    // Native _gamePhaseMove ends the move whenever sPAD+0xb2 is no longer the
    // active-touch value 1. Its swap counter only drives movement effects, so
    // releasing the selected orb without crossing a cell still spends a turn.
    this.drag = null;
    this.forcedStart = null;
    this.turn += 1;
    this.comboCount = 0;
    this.cascadeDepth = 0;
    this.turnMatches = [];
    this.pendingMatches = [];
    this.pendingBombCells = [];
    this.lastDamage = 0;
    this.lastAbsorbedDamage = 0;
    this.lastVoidedDamage = 0;
    this.lastNailDamage = 0;
    this.lastHealing = 0;
    this.lastPoisonDamage = 0;
    this.lastBombDamage = 0;
    this.pendingComboDrops = 0;
    this.comboDropBonusCount = 0;
    this.turnNailCount = 0;
    this.phase = 'detect';
    this.phaseTimer = 0.12;
    this.message = 'Checking matches…';
    return true;
  }

  selectEnemy(index) {
    if (this.enemies[index]?.hp <= 0) return;
    if (this.manualTarget && this.targetEnemy === index) {
      this.manualTarget = false;
      return;
    }
    this.targetEnemy = index;
    this.manualTarget = true;
  }

  chooseAttackTarget(attribute, attack, damageCap = PAD_INT32_MAX) {
    if (this.manualTarget && this.enemies[this.targetEnemy]?.hp > 0) return this.targetEnemy;
    this.manualTarget = false;
    const candidates = this.enemies.map((enemy, index) => {
      if (enemy.hp <= 0) return null;
      const attributeMultiplier = padAttributeMultiplier(attribute, enemy.attribute);
      const attributeIndex = PAD_ATTRIBUTE_INDEX[attribute];
      const nullified = Number(enemy.attributeNullifyTurns || 0) > 0
        && Number.isInteger(attributeIndex)
        && attributeIndex <= 4
        && (Number(enemy.attributeNullifyMask || 0) & (1 << attributeIndex)) !== 0;
      const effectiveDefense = Number(enemy.defense || 0) + (
        Number(enemy.defenseBoostTurns || 0) > 0 ? Number(enemy.defenseBoostAmount || 0) : 0
      );
      const defendedDamage = nullified ? 0 : padDamageAfterDefense(
        attack, attributeMultiplier, effectiveDefense, damageCap,
      );
      const damage = padEnemyDamageAfterShields(
        defendedDamage,
        Number.isInteger(attributeIndex) && attributeIndex <= 4
          ? enemy.attributeResistPercentages?.[attributeIndex] ?? 100
          : 100,
        Number(enemy.damageShieldTurns || 0) > 0 ? enemy.damageShieldPercent : null,
      );
      return {
        index,
        hp: enemy.hp,
        damage,
        lethal: damage >= enemy.hp,
        advantageous: attributeMultiplier > 1,
        ratio: damage / enemy.hp,
      };
    }).filter(Boolean);
    // The ordinary branch of _calcChoiceAtkTarget first keeps the largest-HP
    // enemy this hit can defeat. If none is killable, it prefers elemental
    // advantage and only then compares projected-damage/current-HP ratios.
    candidates.sort((left, right) =>
      Number(right.lethal) - Number(left.lethal) ||
      (left.lethal && right.lethal ? right.hp - left.hp : 0) ||
      Number(right.advantageous) - Number(left.advantageous) ||
      right.ratio - left.ratio ||
      left.index - right.index);
    this.targetEnemy = candidates[0]?.index ?? 0;
    return this.targetEnemy;
  }

  useSkill() {
    if (
      this.mode !== 'playing'
      || this.phase !== 'input'
      || this.drag
      || this.skill.cooldown > 0
      || this.skillSealTurns > 0
    ) return false;
    const candidates = [];
    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        if (this.board[row][column].type !== 'water' && !this.board[row][column].locked) candidates.push([row, column]);
      }
    }
    candidates.sort((a, b) => {
      const aPriority = this.board[a[0]][a[1]].type === 'wood' ? 0 : this.board[a[0]][a[1]].type === 'heart' ? 1 : 2;
      const bPriority = this.board[b[0]][b[1]].type === 'wood' ? 0 : this.board[b[0]][b[1]].type === 'heart' ? 1 : 2;
      return aPriority - bPriority || a[0] - b[0] || a[1] - b[1];
    });
    candidates.slice(0, 4).forEach(([row, column]) => {
      this.board[row][column] = { ...this.board[row][column], type: 'water' };
    });
    this.skill.cooldown = this.skill.maxCooldown;
    this.message = 'Tide Shift changed four orbs to Water. Skills do not consume the turn.';
    return true;
  }

  update(deltaSeconds) {
    const elapsed = Math.max(0, Number(deltaSeconds) || 0);
    const dt = clamp(elapsed, 0, 0.1);
    this.visualTime += dt;
    this.floatingText = this.floatingText.map((item) => ({ ...item, age: item.age + dt })).filter((item) => item.age < 1.15);

    if (this.mode !== 'playing') return;
    if (this.drag) {
      // Keep effect animation bounded after a delayed frame, but do not grant
      // extra movement time: native _gamePhaseMove compares elapsed move time,
      // not a maximum of 100 ms per rendered frame.
      this.drag.remaining = Math.max(0, this.drag.remaining - elapsed);
      if (this.drag.remaining === 0) this.endDrag();
      return;
    }
    if (this.phase === 'input') return;

    this.phaseTimer -= dt;
    let guard = 0;
    while (this.phaseTimer <= 0 && this.phase !== 'input' && this.mode === 'playing' && guard < 8) {
      this.advancePhase();
      guard += 1;
    }
  }

  advancePhase() {
    if (this.phase === 'detect') {
      const matches = this.findMatches();
      const bombResolution = findPadBombDetonations(
        this.board,
        matches,
        (cell) => this.matchableOrbType(cell),
      );
      if (bombResolution.bombs.length) {
        const damage = padBombDamage(this.player.maxHp, bombResolution.bombs.length);
        this.lastBombDamage += damage;
        this.pendingBombCells = bombResolution.cells;
      }
      if (matches.length || bombResolution.cells.length) {
        this.pendingMatches = matches;
        this.turnMatches.push(...matches.map((match) => {
          const enhancement = match.cells.reduce((state, { row, column }) => {
            const power = normalizeEnhancementPower(this.board[row][column]?.enhancementPower);
            return {
              enhancedCount: state.enhancedCount + (power > 0 ? 1 : 0),
              enhancementMultiplier: Math.fround(state.enhancementMultiplier + power),
            };
          }, { enhancedCount: 0, enhancementMultiplier: Math.fround(1) });
          return {
            type: match.type,
            size: match.size,
            ...enhancement,
            isMassAttack: match.isMassAttack,
            isHorizontal: match.isHorizontal,
            isVertical: match.isVertical,
            isRow: match.isRow,
            isColumn: match.isColumn,
            isBox: match.isBox,
            isCross: match.isCross,
            isL: match.isL,
            cascadeDepth: this.cascadeDepth + 1,
          };
        }));
        const comboDropAwakening = padResolveComboDropAwakenings(
          matches,
          this.awakeningBindTurns > 0 ? [] : this.comboDropAwakenings,
        );
        this.turnNailCount += matches.reduce((total, match) => total + match.cells.reduce((count, { row, column }) => (
          count + (((Number(this.board[row][column]?.blockFlags) >>> 0) & PAD_BLOCK_NAIL_FLAG) !== 0 ? 1 : 0)
        ), 0), 0);
        this.pendingComboDrops = (this.pendingComboDrops + comboDropAwakening.pendingCount) & 0xff;
        this.comboDropBonusCount += comboDropAwakening.bonusCombos;
        this.comboCount += matches.length + comboDropAwakening.bonusCombos;
        if (matches.length) this.cascadeDepth += 1;
        // libpad marks ordinary matches and unmatched-bomb blast cells in one
        // _checkBomb pass, then waits for effect 0x38 before erasing them. The
        // wait is visual: it must not introduce a fall or another match scan.
        this.phase = bombResolution.bombs.length ? 'bomb' : 'clear';
        this.phaseTimer = bombResolution.bombs.length ? 0.28 : 0.34;
        this.message = matches.length
          ? `${this.comboCount} combo${this.comboCount === 1 ? '' : 's'}${this.cascadeDepth > 1 ? ` · cascade ${this.cascadeDepth}` : ''}${bombResolution.bombs.length ? ` · ${bombResolution.bombs.length} bomb${bombResolution.bombs.length === 1 ? '' : 's'}` : ''}`
          : `${bombResolution.bombs.length} bomb${bombResolution.bombs.length === 1 ? '' : 's'} detonated`;
      } else if (this.turnMatches.length) {
        this.resolvePlayerTurn();
        this.phase = 'attack';
        this.phaseTimer = 0.72;
      } else {
        this.applyPlayerHpResolution();
        if (this.player.hp <= 0) {
          this.mode = 'defeat';
          this.phase = 'complete';
          this.message = 'Defeat — bomb damage reduced party HP to zero.';
          return;
        }
        this.phase = 'enemy';
        this.phaseTimer = 0.42;
        this.message = 'No match — the turn still advances.';
      }
      return;
    }
    if (this.phase === 'bomb') {
      this.phase = 'clear';
      this.phaseTimer = 0.34;
      return;
    }
    if (this.phase === 'clear') {
      this.pendingMatches.forEach((match) => match.cells.forEach(({ row, column }) => { this.board[row][column] = null; }));
      this.pendingBombCells.forEach(({ row, column }) => { this.board[row][column] = null; });
      this.pendingMatches = [];
      this.pendingBombCells = [];
      this.phase = 'fall';
      this.phaseTimer = 0.24;
      return;
    }
    if (this.phase === 'fall') {
      this.collapseAndRefill();
      this.phase = 'detect';
      this.phaseTimer = 0.28;
      return;
    }
    if (this.phase === 'attack') {
      if (this.enterEnemyDeathPhase('enemy')) return;
      if (this.finishVictory()) return;
      this.phase = 'enemy';
      this.phaseTimer = 0.46;
      return;
    }
    if (this.phase === 'enemy') {
      this.resolveEnemyTurn();
      if (this.enterEnemyDeathPhase('postEnemy')) return;
      this.finishEnemyTurn();
      return;
    }
    if (this.phase === 'death') {
      if (this.enterEnemyDeathPhase(this.phaseAfterDeath)) return;
      const destination = this.phaseAfterDeath;
      this.phaseAfterDeath = null;
      if (this.finishVictory()) return;
      if (destination === 'enemy') {
        this.phase = 'enemy';
        this.phaseTimer = 0.46;
        return;
      }
      this.finishEnemyTurn();
    }
  }

  finishVictory() {
    if (!this.enemies.every((enemy) => enemy.hp <= 0)) return false;
    this.mode = 'victory';
    this.phase = 'complete';
    this.message = `Victory in ${this.turn} turn${this.turn === 1 ? '' : 's'}!`;
    return true;
  }

  finishEnemyTurn() {
    if (this.finishVictory()) return;
    if (this.player.hp <= 0) {
      this.mode = 'defeat';
      this.phase = 'complete';
      this.message = 'Defeat — the party HP reached zero.';
      return;
    }
    this.skill.cooldown = Math.max(0, this.skill.cooldown - 1);
    this.phase = 'input';
    this.phaseTimer = 0;
    this.message = this.skill.cooldown === 0 ? 'Your move — Tide Shift is ready.' : 'Your move — plan the path before touching an orb.';
  }

  enterEnemyDeathPhase(destination) {
    const action = this.resolveNextEnemyDeathAction();
    if (!action) return false;
    this.phase = 'death';
    this.phaseAfterDeath = destination;
    this.phaseTimer = 0.65;
    return true;
  }

  resolveNextEnemyDeathAction() {
    for (let enemyIndex = 0; enemyIndex < this.enemies.length; enemyIndex += 1) {
      const enemy = this.enemies[enemyIndex];
      if (enemy.hp > 0 || enemy.deathResolved) continue;
      enemy.deathResolved = true;
      const pool = this.enemyAiPools[enemyIndex];
      if (!pool) continue;
      for (const slot of pool.monster.slots) {
        const definition = pool.definitionsById.get(slot.skillId);
        if (definition?.effect?.type !== PAD_ENEMY_SKILL_DEATH_CRY) continue;
        const skill = normalizePadEnemySkillRecord(definition.effect);
        const action = Object.freeze({ enemy: enemyIndex, skillId: slot.skillId, skill });
        this.lastEnemyDeathAction = action;
        this.message = skill.messageCode
          ? `${enemy.name} used death message ${skill.messageCode}.`
          : `${enemy.name} showed its death effect.`;
        return action;
      }
    }
    return null;
  }

  findMatches() {
    return findPadMatches(this.board, (cell) => this.matchableOrbType(cell));
  }

  isOrbTypeBlocked(type) {
    if (!this.attributeBlock || this.attributeBlock.turnsRemaining <= 0) return false;
    const typeIndex = ORB_TYPES.findIndex((candidate) => candidate.id === type);
    return typeIndex >= 0 && (this.attributeBlock.typeMask & (1 << typeIndex)) !== 0;
  }

  matchableOrbType(cell) {
    return cell && !this.isOrbTypeBlocked(cell.type) ? cell.type : null;
  }

  collapseAndRefill() {
    const generated = [];
    let existingComboDrops = 0;
    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        if ((Number(this.board[row][column]?.blockFlags) & PAD_BLOCK_COMBO_DROP_FLAG) !== 0) {
          existingComboDrops += 1;
        }
      }
    }
    for (let column = 0; column < this.columns; column += 1) {
      const survivors = [];
      for (let row = this.rows - 1; row >= 0; row -= 1) if (this.board[row][column]) survivors.push(this.board[row][column]);
      const missingCount = this.rows - survivors.length;
      const columnGenerated = Array.from({ length: missingCount }, (_, row) => {
        const type = this.topLineDropTypes
          ? this.topLineDropTypes[column]
          : this.rng.spawnNewBlock(this.dropRates, this.faceTypes, this.skyfallExclusionMask);
        const entry = { row, column, type };
        generated.push(entry);
        return entry;
      });
      for (let row = 0; row < this.rows; row += 1) {
        this.board[row][column] = row < missingCount
          ? columnGenerated[row]
          : survivors[this.rows - 1 - row];
      }
    }
    const pendingCount = Math.max(0, Math.min(
      Number(this.pendingComboDrops) || 0,
      8 - existingComboDrops,
    ));
    const comboDropResolution = padResolveComboDropSpawns(
      this.rng.state,
      generated.map((entry) => entry.type),
      {
        pendingCount,
        chanceBasisPoints: this.comboDropChanceBasisPoints,
        remainingCapacity: this.comboDropCap - existingComboDrops - pendingCount,
      },
    );
    this.rng.setState(comboDropResolution.state);
    this.pendingComboDrops = 0;
    generated.forEach((entry, index) => {
      const blackFall = padResolveBlackFall(
        this.lockFallRng.state,
        entry.type,
        this.blackFallRule,
        comboDropResolution.marked[index] ? PAD_BLOCK_COMBO_DROP_FLAG : 0,
      );
      this.lockFallRng.setState(blackFall.state);
      const thornFall = padResolveThornFall(
        this.lockFallRng.state,
        entry.type,
        this.thornFallRule,
        blackFall.blockFlags,
      );
      this.lockFallRng.setState(thornFall.state);
      const nailFall = padResolveNailFall(
        this.lockFallRng.state,
        entry.type,
        this.nailFallRule,
        thornFall.blockFlags,
      );
      this.lockFallRng.setState(nailFall.state);
      const enhancementFall = padResolveEnhancementFall(
        this.lockFallRng.state,
        entry.type,
        this.awakeningBindTurns > 0 ? [] : this.enhancedFallAwakenings,
        this.enhancedFallModifier,
        this.passiveEnhancementFallsEnabled,
      );
      this.lockFallRng.setState(enhancementFall.state);
      const lockFall = padResolveLockFall(
        this.lockFallRng.state,
        entry.type,
        this.lockFallRules,
        nailFall.blockFlags,
      );
      this.lockFallRng.setState(lockFall.state);
      this.board[entry.row][entry.column] = this.createOrb(ORB_TYPES[entry.type]?.id || NATURAL_ORB_TYPES[0].id, {
        blockFlags: lockFall.blockFlags,
        enhancementPower: blackFall.clearEnhancement || thornFall.clearEnhancement
          ? 0
          : enhancementFall.enhancementPower,
        blindCountdown: blackFall.blindCountdown,
        blindFresh: blackFall.blindFresh,
        thornDescriptor: thornFall.thornDescriptor,
      });
    });
  }

  resolvePlayerTurn() {
    const leader = Number(this.party[0]?.bindTurns || 0) > 0
      ? 1 : padComboLeaderMultiplier(this.comboCount, this.party[0]?.leaderSkill);
    const helper = Number(this.party[5]?.bindTurns || 0) > 0
      ? 1 : padComboLeaderMultiplier(this.comboCount, this.party[5]?.leaderSkill);
    const leaderPair = leader * helper;
    this.lastLeaderMultiplier = leaderPair;
    this.lastComboCount = this.comboCount;

    const byType = new Map();
    this.turnMatches.forEach((match) => {
      if (!byType.has(match.type)) byType.set(match.type, []);
      byType.get(match.type).push(match);
    });

    const heartMatches = byType.get('heart') || [];
    const partyRecovery = this.party.reduce((total, member) => total + member.recovery, 0);
    const recoveryLanes = this.player.recovery === partyRecovery
      ? this.party.filter((member) => Number(member.bindTurns || 0) <= 0)
        .map((member) => member.recovery)
      : [this.player.recovery];
    const extraComboBonus = this.allowDiagonalMoves ? 0.5 : 0.25;
    const healing = padNativeRecoveryPower(
      recoveryLanes,
      heartMatches,
      this.comboCount,
      extraComboBonus,
      this.recoveryDebuff?.multiplier ?? 1,
    );
    const poisonDamage = padPoisonDamage(
      this.player.maxHp,
      (byType.get('poison') || []).map((match) => match.size),
      (byType.get('mortalPoison') || []).map((match) => match.size),
    );
    this.applyPlayerHpResolution(healing, poisonDamage);

    let totalDamage = 0;
    let absorbedDamage = 0;
    let voidedDamage = 0;
    const damagedThisTurn = new Set();
    const attackRounds = [
      (member) => ({ attribute: member.attribute, attack: member.attack }),
      (member) => ({
        attribute: member.tertiaryAttribute,
        attack: padTertiaryAttributeAttack(member.attack, member.tertiaryAttribute),
      }),
      (member) => ({
        attribute: this.awakeningBindTurns > 0 && member.secondaryAttributeChanged
          ? null
          : member.secondaryAttribute,
        attack: this.awakeningBindTurns > 0 && member.secondaryAttributeChanged
          ? 0
          : padSecondaryAttributeAttack(
            member.attack,
            member.attribute,
            member.secondaryAttribute,
            member.secondaryAttributeChanged,
          ),
      }),
    ];
    attackRounds.forEach((getLane) => {
      this.party.forEach((member) => {
        if (Number(member.bindTurns || 0) > 0) return;
        const lane = getLane(member);
        const matches = byType.get(lane.attribute) || [];
        if (!lane.attack || !matches.length) return;
        const matchAttack = padNativeBaseAttackPower(lane.attack, matches, this.comboCount, extraComboBonus);
        const raw = padApplyAttackMultipliers(matchAttack, [leader, helper]);
        const isMassAttack = matches.some((match) => match.size >= 5);
        const target = isMassAttack ? -1 : this.chooseAttackTarget(lane.attribute, raw, member.damageCap);
        this.enemies.forEach((enemy, enemyIndex) => {
          if (enemy.hp <= 0 || (!isMassAttack && enemyIndex !== target)) return;
          const attributeIndex = PAD_ATTRIBUTE_INDEX[lane.attribute];
          const nullified = Number(enemy.attributeNullifyTurns || 0) > 0
            && Number.isInteger(attributeIndex)
            && attributeIndex <= 4
            && (Number(enemy.attributeNullifyMask || 0) & (1 << attributeIndex)) !== 0;
          const effectiveDefense = Number(enemy.defense || 0) + (
            Number(enemy.defenseBoostTurns || 0) > 0
              ? Number(enemy.defenseBoostAmount || 0)
              : 0
          );
          const defendedDamage = nullified ? 0 : padDamageAfterDefense(
            raw, padAttributeMultiplier(lane.attribute, enemy.attribute), effectiveDefense,
            member.damageCap,
          );
          const damage = padEnemyDamageAfterShields(
            defendedDamage,
            Number.isInteger(attributeIndex) && attributeIndex <= 4
              ? enemy.attributeResistPercentages?.[attributeIndex] ?? 100
              : 100,
            Number(enemy.damageShieldTurns || 0) > 0 ? enemy.damageShieldPercent : null,
          );
          if (
            (Number(enemy.comboAbsorbTurns || 0) > 0
              && this.comboCount <= Number(enemy.comboAbsorbThreshold || 0))
            || (Number(enemy.attributeAbsorbTurns || 0) > 0
            && Number.isInteger(attributeIndex)
            && (Number(enemy.attributeAbsorbMask || 0) & (1 << attributeIndex)) !== 0)
            || (damage > 0
            && Number(enemy.damageAbsorbTurns || 0) > 0
            && damage >= Number(enemy.damageAbsorbThreshold || 0))
          ) {
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + damage);
            absorbedDamage += damage;
            this.floatingText.push({ kind: 'absorb', value: damage, enemy: enemyIndex, attribute: lane.attribute, age: 0 });
            return;
          }
          if (
            damage > 0
            && Number(enemy.damageVoidTurns || 0) > 0
            && damage >= Number(enemy.damageVoidThreshold || 0)
          ) {
            voidedDamage += damage;
            this.floatingText.push({ kind: 'void', value: damage, enemy: enemyIndex, attribute: lane.attribute, age: 0 });
            return;
          }
          if (damage > 0) damagedThisTurn.add(enemyIndex);
          const resolveThresholdHp = padEnemyResolveThresholdHp(
            enemy.maxHp,
            enemy.resolveThresholdPercent,
          );
          const resolveTriggered = damage >= enemy.hp
            && resolveThresholdHp > 0
            && enemy.hp >= resolveThresholdHp;
          enemy.hp = resolveTriggered ? 1 : Math.max(0, enemy.hp - damage);
          totalDamage += damage;
          if (damage > 0) {
            this.floatingText.push({ kind: 'damage', value: damage, enemy: enemyIndex, attribute: lane.attribute, age: 0 });
          }
        });
      });
    });
    let nailDamage = 0;
    if (this.turnNailCount > 0) {
      this.enemies.forEach((enemy, enemyIndex) => {
        if (enemy.hp <= 0) return;
        const damage = padNailDamage(enemy.maxHp, this.turnNailCount);
        enemy.hp = Math.max(0, enemy.hp - damage);
        nailDamage += damage;
        this.floatingText.push({ kind: 'nail', value: damage, enemy: enemyIndex, age: 0 });
      });
    }
    if (this.manualTarget && this.enemies[this.targetEnemy]?.hp <= 0) {
      this.manualTarget = false;
      const nextAlive = this.enemies.findIndex((enemy) => enemy.hp > 0);
      if (nextAlive >= 0) this.targetEnemy = nextAlive;
    }
    this.lastNailDamage = nailDamage;
    this.lastAbsorbedDamage = absorbedDamage;
    this.lastVoidedDamage = voidedDamage;
    this.lastDamage = totalDamage + nailDamage;
    damagedThisTurn.forEach((enemyIndex) => {
      const enemy = this.enemies[enemyIndex];
      if (enemy) enemy.damagedTurnCount = (Math.trunc(Number(enemy.damagedTurnCount) || 0) + 1) & 0xffff;
    });
    this.enemies.forEach((enemy) => this.updateEnemyTurnChangePassive(enemy));
    this.advancePartyBindTurns();
    this.message = `${this.comboCount} combo${this.comboCount === 1 ? '' : 's'} · ${this.lastDamage.toLocaleString()} total damage${this.lastAbsorbedDamage ? ` · ${this.lastAbsorbedDamage.toLocaleString()} absorbed` : ''}${this.lastVoidedDamage ? ` · ${this.lastVoidedDamage.toLocaleString()} voided` : ''}${this.lastNailDamage ? ` · ${this.lastNailDamage.toLocaleString()} nails` : ''}${this.lastHealing ? ` · +${this.lastHealing.toLocaleString()} HP` : ''}${this.lastPoisonDamage ? ` · -${this.lastPoisonDamage.toLocaleString()} poison` : ''}${this.lastBombDamage ? ` · -${this.lastBombDamage.toLocaleString()} bombs` : ''}${this.lastThornDamage ? ` · -${this.lastThornDamage.toLocaleString()} thorns` : ''}`;
  }

  applyPlayerHpResolution(healing = 0, poisonDamage = 0) {
    if (this.hpResolutionApplied) return;
    this.hpResolutionApplied = true;
    this.lastHealing = Math.max(0, Math.trunc(Number(healing) || 0));
    this.lastPoisonDamage = Math.max(0, Math.trunc(Number(poisonDamage) || 0));
    const pendingDamage = Math.min(
      PAD_INT32_MAX,
      this.lastPoisonDamage + this.lastBombDamage + this.lastThornDamage,
    );
    this.player.hp = clamp(this.player.hp + this.lastHealing - pendingDamage, 0, this.player.maxHp);
    if (this.lastHealing > 0) this.floatingText.push({ kind: 'heal', value: this.lastHealing, enemy: -1, age: 0 });
    if (this.lastPoisonDamage > 0) this.floatingText.push({ kind: 'poison', value: this.lastPoisonDamage, enemy: -1, age: 0 });
    if (this.lastBombDamage > 0) this.floatingText.push({ kind: 'bomb', value: this.lastBombDamage, enemy: -1, age: 0 });
    if (this.lastThornDamage > 0) this.floatingText.push({ kind: 'thorn', value: this.lastThornDamage, enemy: -1, age: 0 });
  }

  resolveEnemyTurn() {
    let total = 0;
    this.lastEnemyActions = [];
    const aliveAtTurnStart = this.enemies.map((enemy) => enemy.hp > 0);
    // Native _incEneTurn advances existing statuses before _setupEnemyAttack
    // admits monsters whose sMONSTER+0x120 counter has reached zero. Keeping
    // this order prevents a newly executed enemy skill from losing a turn
    // immediately on the same action boundary.
    this.advanceEnemyStatusShieldTurns();
    this.advanceEnemyAttackBoostTurns();
    this.advanceEnemyDefenseBoostTurns();
    this.advanceEnemyAttributeNullifyTurns();
    this.advanceEnemyAttributeAbsorbTurns();
    this.advanceEnemyComboAbsorbTurns();
    this.advanceEnemyDamageAbsorbTurns();
    this.advanceEnemyDamageVoidTurns();
    this.advanceEnemyDamageShieldTurns();
    this.advanceLeaderSwapTurns();
    this.advanceSkyfallRateRules();
    this.advanceLockFallRules();
    this.advanceMoveTimeReductionTurns();
    this.advanceBlackOrbCountdowns();
    this.advanceOrbSealTurns();
    this.advanceCloudTurns();
    this.advanceRecoveryDebuffTurns();
    this.advanceAttributeBlockTurns();
    if (this.blackFallRule?.active && this.blackFallRule.turnsRemaining !== null) {
      this.blackFallRule.turnsRemaining = Math.max(0, this.blackFallRule.turnsRemaining - 1);
      if (this.blackFallRule.turnsRemaining === 0) this.blackFallRule.active = false;
    }
    this.enemies.forEach((enemy, index) => {
      if (!aliveAtTurnStart[index] || enemy.hp <= 0) return;
      enemy.counter -= 1;
      if (enemy.counter <= 0) {
        enemy.counter = enemy.maxCounter;
        let skill = this.takeEnemySkill(index);
        let resolvedSkillCount = 0;
        let structuralEnd = false;
        while (skill && resolvedSkillCount < 9) {
          if (skill.kind === 'multiAttackEnd') {
            structuralEnd = true;
            break;
          }
          const activeBoostPercent = enemy.attackBoostTurns > 0
            ? enemy.attackBoostPercent
            : 100;
          let damage = padEnemySkillBoostedAttack(
            enemy.attack,
            skill.kind === 'multiAttack'
              ? 0
              : skill.kind === 'normalAttack' ? 100 : skill.attackWithSkillValue,
            activeBoostPercent,
          );
          this.applyEnemySkillRecord(skill, index);
          if (skill.kind === 'currentHpGravity') {
            damage = padEnemySkillCurrentHpGravity(this.player.hp, skill.damagePercent);
          } else if (skill.kind === 'scaledAttack') {
            damage = padEnemySkillBoostedAttack(
              enemy.attack,
              skill.damagePercent,
              activeBoostPercent,
            );
          } else if (skill.kind === 'additionalAttack') {
            damage += padEnemySkillAdditionalAttack(enemy.attack, skill.damagePercent);
          } else if (skill.kind === 'repeatAttack') {
            const hitCount = Math.max(0, Math.min(15, Math.trunc(skill.hitCount)));
            const hitDamage = padEnemySkillBoostedAttack(
              enemy.attack,
              skill.damagePercent,
              activeBoostPercent,
            );
            const hitDamages = Object.freeze(Array(hitCount).fill(hitDamage));
            damage += hitDamage * hitCount;
            skill = Object.freeze({ ...skill, hitDamages });
          }
          total += damage;
          this.lastEnemyActions.push({
            enemy: index,
            kind: 'skill',
            skill: { ...skill },
            ...(damage > 0 ? { damage } : {}),
          });
          if (damage > 0) {
            this.player.hp = Math.max(0, this.player.hp - damage);
            this.floatingText.push({
              kind: 'playerDamage', value: damage, enemy: -1, sourceEnemy: index, age: 0,
            });
          }
          resolvedSkillCount += 1;
          if (!this.enemyAiPools[index]?.multiAttack || !skill.multiAttackParentSkillId) break;
          skill = this.takeEnemySkill(index);
        }
        if (resolvedSkillCount > 0 || structuralEnd) {
          // monsterEndOfAttack clears sMONSTER+0x07 after the complete
          // structural chain, not between its child actions.
          enemy.transientDebuffActive = false;
          return;
        }
        const damage = padEnemySkillBoostedAttack(
          enemy.attack,
          100,
          enemy.attackBoostTurns > 0 ? enemy.attackBoostPercent : 100,
        );
        total += damage;
        this.player.hp = Math.max(0, this.player.hp - damage);
        this.lastEnemyActions.push({ enemy: index, kind: 'attack', damage });
        this.floatingText.push({
          kind: 'playerDamage', value: damage, enemy: -1, sourceEnemy: index, age: 0,
        });
        enemy.transientDebuffActive = false;
      }
    });
    if (total) {
      this.message = `Enemies attacked for ${total.toLocaleString()} damage.`;
    }
    // _doOnPostEnemyAttack owns both protected low-ten-bit player-status
    // counters. Reapplication sets bit 0x400 and skips this one decrement; a
    // newly applied status does not, so its authored count drops immediately.
    this.advanceSkillSealTurnsPostEnemyAttack();
    this.advanceAwakeningBindTurnsPostEnemyAttack();
  }

  enemyAiState(enemyIndex, pool = this.enemyAiPools[enemyIndex]) {
    const enemy = this.enemies[enemyIndex];
    return {
      currentHp: enemy.hp,
      maxHp: enemy.maxHp,
      attributeAbsorbTurns: enemy.attributeAbsorbTurns,
      comboAbsorbTurns: enemy.comboAbsorbTurns,
      enemyDamageAbsorbTurns: enemy.damageAbsorbTurns,
      enemyDamageVoidTurns: enemy.damageVoidTurns,
      enemyDamageShieldTurns: enemy.damageShieldTurns,
      leaderSwapTurns: this.leaderSwapTurns,
      leaderSwapCandidateCount: this.leaderSwapCandidateIndices().length,
      skyfallNaturalTurns: this.skyfallRateRules.natural?.turnsRemaining || 0,
      skyfallNaturalMask: this.skyfallRateRules.natural?.typeMask || 0,
      skyfallHazardTurns: this.skyfallRateRules.hazard?.turnsRemaining || 0,
      skyfallHazardMask: this.skyfallRateRules.hazard?.typeMask || 0,
      defenseBoostTurns: enemy.defenseBoostTurns,
      attributeNullifyTurns: enemy.attributeNullifyTurns,
      scaledAttackGate: enemy.scaledAttackGate,
      enemyAttackBoostTurns: enemy.attackBoostTurns,
      enemyBaseAttack: enemy.attack,
      enemyDamagedTurnCount: enemy.damagedTurnCount,
      enemyTransientDebuffActive: enemy.transientDebuffActive,
      playerAuxiliaryBuffTurns: this.playerAuxiliaryBuffTurns,
      playerAttackBoostTurns: this.playerAttackBoostTurns,
      enemyStatusShieldTurns: enemy.statusShieldTurns,
      moveTimeReductionTurns: this.moveTimeReduction?.turnsRemaining || 0,
      skillSealTurns: this.skillSealTurns,
      awakeningBindTurns: this.awakeningBindTurns,
      orbSealActive: this.orbSealColumnTurns > 0 || this.orbSealRowTurns > 0,
      forcedStartActive: Boolean(this.forcedStart),
      cloudActive: Boolean(this.cloud?.turnsRemaining > 0),
      attributeBlockActive: Boolean(this.attributeBlock?.turnsRemaining > 0),
      playerRecovery: this.player.recovery,
      recoveryMultiplier: this.recoveryDebuff?.multiplier ?? 1,
      enemyAttribute: PAD_ATTRIBUTE_INDEX[enemy.attribute] ?? -1,
      playerCurrentHp: this.player.hp,
      playerMaxHp: this.player.maxHp,
      party: this.party.map((member) => ({
        present: member.present !== false,
        bindTurns: Math.max(0, Math.trunc(Number(member.bindTurns) || 0)),
      })),
      enemies: this.enemies.map((candidate) => ({
        hp: candidate.hp,
        escaped: Boolean(candidate.escaped),
      })),
      lockFallRules: this.lockFallRules.map((rule) => ({ ...rule })),
      aiBudget: pool?.aiBudget ?? 0,
      blackFallActive: Boolean(this.blackFallRule?.active),
      boardCellCount: this.rows * this.columns,
      blackBlockCount: this.board.reduce((total, row) => total + row.reduce((count, orb) => (
        count + Number(((Number(orb?.blockFlags) >>> 0) & PAD_BLOCK_ENTIRE_BLIND_FLAG) !== 0)
      ), 0), 0),
      rngState: this.rng.state,
      evaluateCondition: (definition, rngState) => {
        this.rng.setState(rngState);
        if (definition.effect.kind === 'sourceOrbConversion') {
          const source = definition.effect.sourceType;
          const destination = definition.effect.destinationType;
          const sourceCount = source < 0
            ? [0, 1, 2, 3, 4].reduce(
              (count, type) => count + this.countBlockBits(1 << type),
              0,
            )
            : source < 16 ? this.countBlockBits(1 << source) : 0;
          const probabilityScale = sourceCount < 1
            ? 0
            : source < 0 || destination < 0
              ? 1
              : Math.fround(Math.fround(sourceCount) / Math.fround(3));
          return {
            eligible: probabilityScale > 0,
            probabilityScale,
            rngState: this.rng.state,
          };
        }
        if (definition.effect.kind === 'sourceToJammer') {
          const sourceType = definition.effect.sourceType;
          const sourceMask = sourceType === 7 || sourceType === 8
            ? 1 << 7
            : sourceType >= 0 && sourceType < 16 ? 1 << sourceType : 0;
          const count = sourceMask === 0 ? 0 : this.countBlockBits(sourceMask);
          const probabilityScale = count < 1
            ? 0
            : Math.fround(Math.min(1, Math.fround(Math.fround(count) / Math.fround(3))));
          return { eligible: probabilityScale > 0, probabilityScale, rngState: this.rng.state };
        }
        if (definition.effect.kind === 'blockMinus') {
          const eligible = this.doBlockMinus(
            false,
            definition.effect.typeMask,
            definition.effect.power,
            definition.effect.limit,
          ) >= 1;
          return { eligible, rngState: this.rng.state };
        }
        if (definition.effect.kind === 'burDrop') {
          const eligible = this.doMakeBurDrop(
            false,
            definition.effect.typeMask,
            definition.effect.count,
            definition.effect.descriptor,
            definition.effect.clearDescriptorHighBit,
          ) >= 1;
          return { eligible, rngState: this.rng.state };
        }
        if (definition.effect.kind === 'poisonBlockN') {
          const eligible = this.board.some((row) => row.some((orb) => (
            orb.type !== 'poison'
            && orb.type !== 'mortalPoison'
            && (!definition.effect.excludeHeart || orb.type !== 'heart')
          )));
          return { eligible, rngState: this.rng.state };
        }
        if (definition.effect.kind === 'poisonBlocks') {
          const represented = this.faceTypes.filter((type) => (
            this.countBlockBits(1 << type) > 0
          ));
          const eligible = represented.some((type) => (
            !definition.effect.excludeHeart || type !== 5
          )) && represented.length >= definition.effect.count;
          return { eligible, rngState: this.rng.state };
        }
        if (definition.effect.kind === 'poisonBlockNCounted') {
          const eligible = this.countNonPoisonBlocks(definition.effect.excludeHeart)
            >= definition.effect.count;
          return { eligible, rngState: this.rng.state };
        }
        if (definition.effect.kind === 'sourceToPoison') {
          const sourceType = definition.effect.sourceType;
          const sourceMask = sourceType === 7 || sourceType === 8
            ? 1 << 7
            : sourceType >= 0 && sourceType < 16 ? 1 << sourceType : 0;
          const count = sourceMask === 0 ? 0 : this.countBlockBits(sourceMask);
          const probabilityScale = count < 1
            ? 0
            : Math.fround(Math.min(1, Math.fround(Math.fround(count) / Math.fround(3))));
          return {
            eligible: probabilityScale > 0,
            probabilityScale,
            rngState: this.rng.state,
          };
        }
        if (definition.effect.kind === 'maskedRandomOrbChange') {
          const eligible = this.doPoisonBlockN2(
            definition.effect.perTypeCount,
            definition.effect.destinationTypeMask,
            definition.effect.excludedSourceTypeMask,
            true,
          ) >= 1;
          return { eligible, probabilityScale: eligible ? 1 : 0, rngState: this.rng.state };
        }
        if (definition.effect.kind === 'lockRandomOrbs') {
          const typeMask = Number(definition.effect.typeMask) >>> 0;
          const eligible = this.board.some((row) => row.some((orb) => {
            const type = ORB_TYPES.findIndex((candidate) => candidate.id === orb.type);
            return type >= 0
              && (typeMask & (1 << type)) !== 0
              && ((Number(orb.blockFlags) >>> 0) & PAD_BLOCK_LOCKED_FLAG) === 0;
          }));
          return { eligible, probabilityScale: eligible ? 1 : 0, rngState: this.rng.state };
        }
        return { eligible: false, rngState: this.rng.state };
      },
    };
  }

  takeEnemySkill(enemyIndex) {
    const queue = this.enemySkillQueues[enemyIndex];
    if (queue?.records.length) {
      if (queue.position >= queue.records.length) {
        if (queue.repeat) queue.position = 0;
      }
      if (queue.position < queue.records.length) {
        const skill = queue.records[queue.position];
        queue.position += 1;
        return this.materializeEnemySkillRecord(skill, enemyIndex);
      }
    }
    const pool = this.enemyAiPools[enemyIndex];
    if (!pool) return null;
    if (pool.multiAttack) return this.takeEnemyMultiAttackSkill(enemyIndex, pool);
    const selection = selectPadEnemyAiNew(
      pool.monster,
      pool.definitions,
      this.enemyAiState(enemyIndex, pool),
    );
    this.rng.setState(selection.rngState);
    pool.aiBudget = selection.aiBudget;
    if (selection.effect?.kind === 'multiAttack') {
      pool.multiAttack = {
        parentSkillId: selection.skillId,
        childSkillIds: selection.effect.childSkillIds,
        cursor: 0,
      };
      return this.takeEnemyMultiAttackSkill(enemyIndex, pool);
    }
    return selection.effect
      ? this.materializeEnemySkillRecord(
        { ...selection.effect, skillId: selection.skillId },
        enemyIndex,
      )
      : null;
  }

  takeEnemyMultiAttackSkill(enemyIndex, pool = this.enemyAiPools[enemyIndex]) {
    const chain = pool?.multiAttack;
    if (!chain || chain.cursor >= chain.childSkillIds.length || chain.cursor >= 8) {
      if (pool) pool.multiAttack = null;
      return Object.freeze({
        type: PAD_ENEMY_SKILL_MULTI_ATTACK,
        kind: 'multiAttackEnd',
        supported: true,
        attackWithSkillValue: 0,
        parentSkillId: chain?.parentSkillId ?? null,
      });
    }
    const cursor = chain.cursor;
    const childSkillId = chain.childSkillIds[cursor];
    chain.cursor += 1;
    const child = pool.definitionsById.get(childSkillId);
    if (!child) {
      pool.multiAttack = null;
      return Object.freeze({
        type: PAD_ENEMY_SKILL_MULTI_ATTACK,
        kind: 'multiAttackEnd',
        supported: true,
        attackWithSkillValue: 0,
        parentSkillId: chain.parentSkillId,
        missingChildSkillId: childSkillId,
      });
    }

    // _setupDoubleAttack uses -1.0 and selected-skill -1 for both an explicit
    // type-82 child and a child whose chooseEnemyAiSub callback rejects it.
    // The surrounding controller therefore performs one ordinary attack and
    // ends the structural chain in either case.
    if (child.effect.type === PAD_ENEMY_SKILL_NORMAL_ATTACK) {
      pool.multiAttack = null;
      return this.materializeEnemySkillRecord({
        ...child.effect,
        skillId: childSkillId,
        multiAttackParentSkillId: chain.parentSkillId,
        multiAttackCursor: cursor,
      }, enemyIndex);
    }
    const condition = evaluatePadEnemyAiSub(
      child,
      this.enemyAiState(enemyIndex, pool),
      this.rng.state,
    );
    this.rng.setState(condition.rngState);
    if (!condition.eligible) {
      pool.multiAttack = null;
      return Object.freeze({
        type: PAD_ENEMY_SKILL_NORMAL_ATTACK,
        kind: 'normalAttack',
        supported: true,
        damagePercent: 100,
        attackWithSkillValue: 0,
        setupMaterialized: true,
        multiAttackParentSkillId: chain.parentSkillId,
        rejectedChildSkillId: childSkillId,
        multiAttackCursor: cursor,
      });
    }
    return this.materializeEnemySkillRecord({
      ...child.effect,
      skillId: childSkillId,
      multiAttackParentSkillId: chain.parentSkillId,
      multiAttackCursor: cursor,
    }, enemyIndex);
  }

  rollEnemySkillDuration(durationMin, durationMax) {
    const minimum = Math.trunc(Number(durationMin) || 0);
    const maximum = Math.trunc(Number(durationMax) || 0);
    const width = (maximum - minimum + 1) | 0;
    const roll = this.rng.nextUint16();
    return (minimum + (Math.imul(roll, width) >>> 16)) | 0;
  }

  materializeEnemySkillRecord(record, enemyIndex = 0) {
    const skill = normalizePadEnemySkillRecord(record);
    if (skill.supported && [
      'healEnemy',
      'additionalAttack',
      'defenseBoost',
    ].includes(skill.kind) && !skill.setupMaterialized) {
      const percent = this.rollEnemySkillDuration(skill.percentMin, skill.percentMax);
      return Object.freeze({
        ...record,
        ...(skill.kind === 'healEnemy'
          ? { healPercent: percent }
          : skill.kind === 'additionalAttack'
            ? { damagePercent: percent }
            : { boostPercent: percent }),
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'repeatAttack' && !skill.setupMaterialized) {
      const selectedHitCount = this.rollEnemySkillDuration(skill.hitCountMin, skill.hitCountMax);
      return Object.freeze({
        ...record,
        hitCount: Math.min(selectedHitCount, 15),
        completedHitMask: 0,
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'leaderSwap' && !skill.setupMaterialized) {
      const candidates = this.leaderSwapCandidateIndices();
      const roll = this.rng.nextUint16();
      const selectedPartyIndex = candidates.length > 0
        ? candidates[Math.imul(roll, candidates.length) >>> 16]
        : -1;
      return Object.freeze({
        ...record,
        selectedPartyIndex,
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'sourceOrbConversion' && !skill.executionMaterialized) {
      const faceCounts = Array.from({ length: 6 }, (_, type) => this.countBlockBits(1 << type));
      const sourceType = skill.sourceType < 0
        ? this.rng.getRandomBlockOnFace(faceCounts, false).type
        : skill.sourceType;
      const destinationType = skill.destinationType < 0
        ? this.rng.getRandomBlock(sourceType, false, false)
        : skill.destinationType;
      return Object.freeze({
        ...record,
        sourceType,
        destinationType,
        setupMaterialized: true,
        executionMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'changeEnemyAttribute' && !skill.setupMaterialized) {
      const index = Math.trunc(Number(enemyIndex));
      const enemy = this.enemies[index] || this.enemies[0];
      const currentAttribute = PAD_ATTRIBUTE_INDEX[enemy?.attribute] ?? -1;
      const candidates = padEnemySkillAttributeCandidates(
        skill.candidateAttributes,
        currentAttribute,
      );
      const targetAttribute = candidates.length > 0
        ? candidates[Math.imul(this.rng.nextUint16(), candidates.length) >>> 16]
        : 0;
      return Object.freeze({
        ...record,
        targetAttribute,
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'reviveEnemy' && !skill.setupMaterialized) {
      const candidates = this.enemies
        .map((enemy, index) => ({ enemy, index }))
        .filter(({ enemy }) => Number(enemy.hp) <= 0 && !enemy.escaped);
      if (candidates.length === 0) {
        return Object.freeze({
          ...record,
          targetEnemyIndex: -1,
          setupMaterialized: true,
        });
      }
      const roll = this.rng.nextUint16();
      const candidateIndex = Math.imul(roll, candidates.length) >>> 16;
      return Object.freeze({
        ...record,
        targetEnemyIndex: candidates[candidateIndex].index,
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'attributeAbsorb' && !skill.setupMaterialized) {
      return Object.freeze({
        ...record,
        durationTurns: this.rollEnemySkillDuration(skill.durationMin, skill.durationMax),
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'comboAbsorb' && !skill.setupMaterialized) {
      return Object.freeze({
        ...record,
        durationTurns: this.rollEnemySkillDuration(skill.durationMin, skill.durationMax),
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'skyfallRate' && !skill.setupMaterialized) {
      return Object.freeze({
        ...record,
        durationTurns: this.rollEnemySkillDuration(skill.durationMin, skill.durationMax),
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'lockedSkyfall' && !skill.setupMaterialized) {
      return Object.freeze({
        ...record,
        durationTurns: this.rollEnemySkillDuration(skill.durationMin, skill.durationMax),
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'stickyBlindRandom' && !skill.setupMaterialized) {
      const blindCount = this.rollEnemySkillDuration(skill.countMin, skill.countMax);
      const selectionSeed = this.rng.nextUint16();
      return Object.freeze({
        ...record,
        blindCount,
        selectionSeed,
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'stickyBlindFixed' && !skill.setupMaterialized) {
      return Object.freeze({ ...record, runtimeControl: 0, setupMaterialized: true });
    }
    if (skill.supported && skill.kind === 'fixedStart' && !skill.setupMaterialized) {
      if (!skill.randomPosition) {
        return Object.freeze({
          ...record,
          fixedColumn: Math.max(0, Math.min(this.columns - 1, skill.authoredColumn - 1)),
          fixedRow: Math.max(0, Math.min(
            this.rows - 1,
            this.rows - skill.authoredRowFromBottom,
          )),
          setupMaterialized: true,
        });
      }
      const choose = (candidates) => {
        const roll = this.rng.nextUint16();
        return candidates[Math.imul(roll, candidates.length) >>> 16];
      };
      let fixedColumn;
      let fixedRow;
      if (this.orbSealColumnTurns > 0) {
        const candidates = Array.from({ length: this.columns }, (_, column) => column)
          .filter((column) => (this.orbSealColumnMask & (1 << column)) === 0);
        fixedColumn = choose(candidates.length > 0
          ? candidates : Array.from({ length: this.columns }, (_, column) => column));
        fixedRow = choose(Array.from({ length: this.rows }, (_, row) => row));
      } else if (this.orbSealRowTurns > 0) {
        const candidates = Array.from({ length: this.rows }, (_, row) => row)
          .filter((row) => (this.orbSealRowMask & (1 << row)) === 0);
        fixedRow = choose(candidates.length > 0
          ? candidates : Array.from({ length: this.rows }, (_, row) => row));
        fixedColumn = choose(Array.from({ length: this.columns }, (_, column) => column));
      } else {
        fixedColumn = choose(Array.from({ length: this.columns }, (_, column) => column));
        fixedRow = choose(Array.from({ length: this.rows }, (_, row) => row));
      }
      return Object.freeze({ ...record, fixedColumn, fixedRow, setupMaterialized: true });
    }
    if (skill.supported && skill.kind === 'randomBombs' && !skill.setupMaterialized) {
      return Object.freeze({
        ...record,
        selectionSeed: this.rng.nextUint16(),
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'cloud' && !skill.setupMaterialized) {
      const height = Math.max(0, Math.min(this.rows, skill.cloudHeightRows));
      const width = Math.max(0, Math.min(this.columns, skill.cloudWidthColumns));
      let originRow;
      let originColumnFromRight;
      if (skill.authoredOriginY >= 1 && skill.authoredOriginX >= 1) {
        originRow = Math.max(0, Math.min(this.rows - height, skill.authoredOriginY - 1));
        originColumnFromRight = Math.max(
          0,
          Math.min(this.columns - width, skill.authoredOriginX - 1),
        );
      } else {
        const rowPositions = Math.max(1, this.rows - height + 1);
        const columnPositions = Math.max(1, this.columns - width + 1);
        originRow = Math.imul(this.rng.nextUint16(), rowPositions) >>> 16;
        originColumnFromRight = Math.imul(this.rng.nextUint16(), columnPositions) >>> 16;
      }
      return Object.freeze({
        ...record,
        cloudHeightRows: height,
        cloudWidthColumns: width,
        originRow,
        originColumnFromRight,
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'activeSkillSeal' && !skill.setupMaterialized) {
      return Object.freeze({
        ...record,
        durationTurns: this.rollEnemySkillDuration(skill.durationMin, skill.durationMax),
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'skillDelay' && !skill.setupMaterialized) {
      // setupEnemySkillGaugeDown walks six party slots. The compact demo has
      // one modeled active skill, owned by slot zero; unmodeled slots are the
      // native equivalent of cards without a usable skill gauge.
      const skillDelays = Array(6).fill(0);
      const currentCharge = Math.max(0, this.skill.maxCooldown - this.skill.cooldown);
      let targetMask = 0;
      if (this.party[0]?.present !== false && currentCharge > 0) {
        const rolledDelay = this.rollEnemySkillDuration(skill.delayMin, skill.delayMax);
        const awakeningProtection = this.awakeningBindTurns > 0
          ? 0
          : Math.max(0, Math.trunc(Number(this.skill.skillDelayResistLatents) || 0));
        const appliedDelay = Math.min(currentCharge, Math.max(0, rolledDelay - awakeningProtection));
        skillDelays[0] = appliedDelay;
        if (appliedDelay > 0) targetMask |= 1;
      }
      return Object.freeze({
        ...record,
        targetMask,
        skillDelays: Object.freeze(skillDelays),
        setupMaterialized: true,
      });
    }
    if (
      skill.supported
      && skill.kind === 'maskedRandomOrbChange'
      && !skill.setupMaterialized
    ) {
      return Object.freeze({
        ...record,
        selectionSeed: this.rng.nextUint16(),
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'lockRandomOrbs' && !skill.setupMaterialized) {
      return Object.freeze({
        ...record,
        selectionSeed: this.rng.nextUint16(),
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'bindAttack' && !skill.setupMaterialized) {
      const selector = Math.trunc(Number(skill.targetSelector) || 0);
      let targetMask;
      if (selector === 1) targetMask = 1;
      else if (selector === 2) targetMask = 1 << 5;
      else {
        const candidateIndices = selector === 3
          ? [0, 5]
          : selector === 4
            ? [1, 2, 3, 4]
            : [0, 1, 2, 3, 4, 5];
        const targets = this.selectRandomBindablePartyTargets(
          skill.targetCount,
          candidateIndices,
        );
        targetMask = targets.reduce((mask, index) => mask | (1 << index), 0);
      }
      return Object.freeze({
        ...record,
        targetMask,
        durationTurns: this.rollEnemySkillDuration(skill.durationMin, skill.durationMax),
        setupMaterialized: true,
      });
    }
    if (skill.supported && skill.kind === 'randomSubBind' && !skill.setupMaterialized) {
      const targets = this.selectRandomBindablePartyTargets(
        skill.targetCount,
        [1, 2, 3, 4],
      );
      return Object.freeze({
        ...record,
        targetMask: targets.reduce((mask, index) => mask | (1 << index), 0),
        setupDurationTurns: this.rollEnemySkillDuration(skill.durationMin, skill.durationMax),
        setupMaterialized: true,
      });
    }
    if (!skill.supported || skill.kind !== 'bindLeaderHelper' || skill.setupMaterialized) {
      return record;
    }
    const setupDurationTurns = this.rollEnemySkillDuration(skill.durationMin, skill.durationMax);
    let targetMask = 0;
    if (
      (skill.targetFlags & 1) !== 0
      && this.party[0]?.present !== false
      && Number(this.party[0]?.bindTurns || 0) <= 0
    ) targetMask |= 1;
    if (
      (skill.targetFlags & 2) !== 0
      && this.party[5]?.present !== false
      && Number(this.party[5]?.bindTurns || 0) <= 0
    ) targetMask |= 1 << 5;
    return Object.freeze({
      ...record,
      targetMask,
      setupDurationTurns,
      setupMaterialized: true,
    });
  }

  selectRandomBindablePartyTargets(
    targetCount,
    candidateIndices = [0, 1, 2, 3, 4, 5],
  ) {
    const eligible = candidateIndices
      .map((index) => ({ member: this.party[index], index }))
      .filter(({ member }) => (
        member?.present !== false && Number(member?.bindTurns || 0) <= 0
      ))
      .map(({ index }) => index);
    if (eligible.length === 0) return Object.freeze([]);

    // Type 13 advances the shared LCG twice, stores that second state, then
    // shuffles with a private state made from step one's low half and step
    // two's high half. The private Fisher-Yates steps do not escape back into
    // sGAMEWORK+0x66a10.
    const first = padLcgStep(this.rng.state);
    const second = padLcgStep(first.state);
    this.rng.setState(second.state);
    let localState = ((first.state & 0xffff) | (second.state & 0xffff0000)) >>> 0;
    for (let index = 1; index < eligible.length; index += 1) {
      localState = padLcgStep(localState).state;
      const swapIndex = Math.imul(localState >>> 16, index + 1) >>> 16;
      [eligible[index], eligible[swapIndex]] = [eligible[swapIndex], eligible[index]];
    }
    return Object.freeze(eligible.slice(0, Math.max(
      0,
      Math.min(eligible.length, Math.trunc(Number(targetCount) || 0)),
    )));
  }

  doBind(
    targetMask,
    durationTurns,
    teamBadgeResistance = 0,
    targetOrder = [0, 5, 1, 2, 3, 4],
  ) {
    const mask = Math.trunc(Number(targetMask) || 0) & 0x3f;
    const duration = Math.trunc(Number(durationTurns) || 0);
    const badgeResistance = Math.max(0, Math.trunc(Number(teamBadgeResistance) || 0));
    let boundMask = 0;
    let resistedMask = 0;
    for (const index of targetOrder) {
      const bit = 1 << index;
      const member = this.party[index];
      if ((mask & bit) === 0 || !member || member.present === false) continue;
      const current = Math.max(0, Math.trunc(Number(member.bindTurns) || 0));
      if (current > 0) {
        member.bindTurns = Math.min(99, current + duration);
        boundMask |= bit;
        continue;
      }
      const resistance = (
        (this.awakeningBindTurns > 0 ? 0 : (member.bindResist ? 50 : 0))
        + (this.awakeningBindTurns > 0 ? 0 : (member.superBindResist ? 100 : 0))
        + badgeResistance
      );
      if (resistance >= 1) {
        const resistanceRoll = Math.imul(this.rng.nextUint16(), 100) >>> 16;
        if (resistance >= resistanceRoll) {
          resistedMask |= bit;
          continue;
        }
      }
      member.bindTurns = Math.min(99, Math.max(0, duration));
      boundMask |= bit;
    }
    return Object.freeze({ boundMask, resistedMask, durationTurns: duration });
  }

  applyActiveSkillSeal(durationTurns) {
    const resistance = (
      (this.awakeningBindTurns > 0 ? 0 : this.skillSealResistAwakenings * 20)
      + this.skillSealBadgeResistance
    );
    if (resistance >= 1) {
      const resistanceRoll = Math.imul(this.rng.nextUint16(), 100) >>> 16;
      if (resistance >= resistanceRoll) {
        return Object.freeze({ resisted: true, durationTurns: 0 });
      }
    }
    const current = Math.trunc(Number(this.skillSealTurns) || 0);
    this.skillSealSkipPostEnemyCountdown = current > 0;
    const packed = (current + Math.trunc(Number(durationTurns) || 0)) & 0x3ff;
    this.skillSealTurns = (packed << 22) >> 22;
    return Object.freeze({ resisted: false, durationTurns: this.skillSealTurns });
  }

  advanceSkillSealTurnsPostEnemyAttack() {
    if (!this.skillSealSkipPostEnemyCountdown && this.skillSealTurns >= 1) {
      this.skillSealTurns -= 1;
    }
    this.skillSealSkipPostEnemyCountdown = false;
  }

  applyAwakeningBind(durationTurns) {
    const current = Math.trunc(Number(this.awakeningBindTurns) || 0);
    this.awakeningBindSkipPostEnemyCountdown = current > 0;
    const packed = (current + Math.trunc(Number(durationTurns) || 0)) & 0x3ff;
    this.awakeningBindTurns = (packed << 22) >> 22;
    return Object.freeze({ durationTurns: this.awakeningBindTurns });
  }

  advanceAwakeningBindTurnsPostEnemyAttack() {
    if (!this.awakeningBindSkipPostEnemyCountdown && this.awakeningBindTurns >= 1) {
      this.awakeningBindTurns -= 1;
    }
    this.awakeningBindSkipPostEnemyCountdown = false;
  }

  advancePartyBindTurns() {
    this.party.forEach((member) => {
      member.bindTurns = Math.max(0, Math.trunc(Number(member.bindTurns) || 0) - 1);
    });
  }

  advanceEnemyAttributeAbsorbTurns() {
    this.enemies.forEach((enemy) => {
      enemy.attributeAbsorbTurns = Math.max(
        0,
        Math.trunc(Number(enemy.attributeAbsorbTurns) || 0) - 1,
      );
    });
  }

  advanceEnemyComboAbsorbTurns() {
    this.enemies.forEach((enemy) => {
      enemy.comboAbsorbTurns = Math.max(
        0,
        Math.trunc(Number(enemy.comboAbsorbTurns) || 0) - 1,
      );
    });
  }

  advanceEnemyDamageAbsorbTurns() {
    this.enemies.forEach((enemy) => {
      enemy.damageAbsorbTurns = Math.max(
        0,
        Math.trunc(Number(enemy.damageAbsorbTurns) || 0) - 1,
      );
      if (enemy.damageAbsorbTurns === 0) enemy.damageAbsorbThreshold = 0;
    });
  }

  advanceEnemyDamageVoidTurns() {
    this.enemies.forEach((enemy) => {
      enemy.damageVoidTurns = Math.max(
        0,
        Math.trunc(Number(enemy.damageVoidTurns) || 0) - 1,
      );
      if (enemy.damageVoidTurns === 0) enemy.damageVoidThreshold = 0;
    });
  }

  advanceEnemyDamageShieldTurns() {
    this.enemies.forEach((enemy) => {
      enemy.damageShieldTurns = Math.max(
        0,
        Math.trunc(Number(enemy.damageShieldTurns) || 0) - 1,
      );
      if (enemy.damageShieldTurns === 0) enemy.damageShieldPercent = 0;
    });
  }

  leaderSwapCandidateIndices() {
    return [1, 2, 3, 4].filter((index) => (
      Boolean(this.party[index]) && this.party[index].present !== false
    ));
  }

  advanceLeaderSwapTurns() {
    if (this.leaderSwapTurns <= 0) return;
    this.leaderSwapTurns = Math.max(0, Math.trunc(Number(this.leaderSwapTurns) || 0) - 1);
    if (this.leaderSwapTurns !== 0) return;
    const index = Math.trunc(Number(this.leaderSwapIndex));
    if (index >= 1 && index <= 4 && this.party[index]) {
      [this.party[0], this.party[index]] = [this.party[index], this.party[0]];
    }
    this.leaderSwapIndex = null;
  }

  advanceSkyfallRateRules() {
    for (const category of ['natural', 'hazard']) {
      const rule = this.skyfallRateRules[category];
      if (!rule) continue;
      rule.turnsRemaining = Math.max(0, Math.trunc(Number(rule.turnsRemaining) || 0) - 1);
      if (rule.turnsRemaining === 0) this.skyfallRateRules[category] = null;
    }
    this.recomputeDropRates();
  }

  advanceLockFallRules() {
    this.lockFallRules = this.lockFallRules.filter((rule) => {
      if (rule.turnsRemaining == null) return true;
      rule.turnsRemaining = Math.max(
        0,
        Math.trunc(Number(rule.turnsRemaining) || 0) - 1,
      );
      return rule.turnsRemaining > 0;
    });
  }

  advanceEnemyStatusShieldTurns() {
    this.enemies.forEach((enemy) => {
      enemy.statusShieldTurns = Math.max(
        0,
        Math.trunc(Number(enemy.statusShieldTurns) || 0) - 1,
      );
    });
  }

  advanceEnemyAttackBoostTurns() {
    this.enemies.forEach((enemy) => {
      enemy.attackBoostTurns = Math.max(
        0,
        Math.trunc(Number(enemy.attackBoostTurns) || 0) - 1,
      );
      if (enemy.attackBoostTurns === 0) enemy.attackBoostPercent = 100;
    });
  }

  advanceEnemyDefenseBoostTurns() {
    this.enemies.forEach((enemy) => {
      enemy.defenseBoostTurns = Math.max(
        0,
        Math.trunc(Number(enemy.defenseBoostTurns) || 0) - 1,
      );
      if (enemy.defenseBoostTurns === 0) enemy.defenseBoostAmount = 0;
    });
  }

  advanceEnemyAttributeNullifyTurns() {
    this.enemies.forEach((enemy) => {
      enemy.attributeNullifyTurns = Math.max(
        0,
        Math.trunc(Number(enemy.attributeNullifyTurns) || 0) - 1,
      );
      if (enemy.attributeNullifyTurns === 0) enemy.attributeNullifyMask = 0;
    });
  }

  advanceMoveTimeReductionTurns() {
    if (!this.moveTimeReduction) return;
    this.moveTimeReduction.turnsRemaining = Math.max(
      0,
      Math.trunc(Number(this.moveTimeReduction.turnsRemaining) || 0) - 1,
    );
    if (this.moveTimeReduction.turnsRemaining === 0) {
      this.moveTimeReduction = null;
      this.moveTime = this.baseMoveTime;
    }
  }

  revealEntireBlindOrb(orb) {
    if (!orb) return false;
    const flags = Number(orb.blockFlags) >>> 0;
    if ((flags & PAD_BLOCK_ENTIRE_BLIND_FLAG) === 0) return false;
    orb.blockFlags = flags & ~PAD_BLOCK_ENTIRE_BLIND_FLAG;
    orb.blind = (orb.blockFlags & PAD_BLOCK_BLIND_FLAG) !== 0;
    return true;
  }

  advanceBlackOrbCountdowns() {
    this.board.forEach((row) => row.forEach((orb) => {
      // Classic whole-board blind (bit 0x4) is movement-revealed and has no
      // turn countdown. Only black-fall blind (bit 0x1000) advances here.
      const flags = Number(orb.blockFlags) >>> 0;
      if ((flags & PAD_BLOCK_BLIND_FLAG) === 0) return;
      if ((flags & PAD_BLOCK_BLIND_FRESH_FLAG) !== 0) {
        orb.blockFlags = flags & ~PAD_BLOCK_BLIND_FRESH_FLAG;
        orb.blindFresh = (orb.blockFlags & PAD_BLOCK_ENTIRE_BLIND_FRESH_FLAG) !== 0;
        return;
      }
      orb.blindCountdown = Math.max(0, Math.trunc(Number(orb.blindCountdown) || 0) - 1);
      if (orb.blindCountdown === 0) {
        orb.blockFlags = flags & ~PAD_BLOCK_BLIND_FLAG;
        orb.blind = (orb.blockFlags & PAD_BLOCK_ENTIRE_BLIND_FLAG) !== 0;
      }
    }));
  }

  setBoardFromCodes(rows) {
    if (!Array.isArray(rows) || rows.length !== this.rows || rows.some((row) => typeof row !== 'string' || row.length !== this.columns)) {
      throw new Error(`Board must be ${this.rows} strings of ${this.columns} orb codes.`);
    }
    this.board = rows.map((row) => [...row].map((code) => {
      const type = ORB_BY_CODE[code]?.id;
      if (!type) throw new Error(`Unknown orb code: ${code}`);
      return this.createOrb(type);
    }));
  }

  setRngState(state) {
    this.rng = createPadRng(Number(state) >>> 0);
  }

  setLockFallRngState(state) {
    this.lockFallRng = createPadRng(Number(state) >>> 0);
  }

  setFaceTypes(types) {
    if (!Array.isArray(types) || types.length > 16 || types.some((type) => (
      !Number.isInteger(Number(type)) || Number(type) < 0 || Number(type) >= ORB_TYPES.length
    ))) throw new Error('PAD face types must contain at most 16 native orb type indices.');
    this.faceTypes = types.map((type) => Number(type));
  }

  setDropRates(rates) {
    if (!Array.isArray(rates) || rates.length > 10 || rates.some((rate) => !Number.isFinite(Number(rate)))) {
      throw new Error('PAD drop rates must contain at most ten finite numeric lanes.');
    }
    this.baseDropRates = Array.from(
      { length: 10 },
      (_, index) => Math.fround(Number(rates[index]) || 0),
    );
    this.recomputeDropRates();
  }

  recomputeDropRates() {
    this.dropRates = [...(this.baseDropRates || Array(10).fill(0))];
    Object.values(this.skyfallRateRules || {}).forEach((rule) => {
      if (!rule || Number(rule.turnsRemaining) <= 0) return;
      const rate = Math.fround(Number(rule.chancePercent) / 100);
      for (let type = 0; type <= 8; type += 1) {
        if ((rule.typeMask & (1 << type)) !== 0) {
          this.dropRates[type] = Math.fround(this.dropRates[type] + rate);
        }
      }
    });
  }

  setComboDropAwakenings(counts) {
    if (!Array.isArray(counts) || counts.length !== 5 || counts.some((count) => (
      !Number.isInteger(Number(count)) || Number(count) < 0
    ))) throw new Error('PAD combo-drop awakenings must contain five nonnegative elemental counts.');
    this.comboDropAwakenings = counts.map((count) => Number(count));
  }

  setTopLineDropTypes(types) {
    if (types === null || types === undefined) {
      this.topLineDropTypes = null;
      return;
    }
    if (!Array.isArray(types) || types.length !== this.columns || types.some((type) => (
      !Number.isInteger(Number(type)) || Number(type) < 0 || Number(type) >= ORB_TYPES.length
    ))) throw new Error(`PAD top-line drop types must contain exactly ${this.columns} native orb type indices.`);
    this.topLineDropTypes = types.map((type) => Number(type));
  }

  setThornFallRule(rule) {
    if (rule === null || rule === undefined) {
      this.thornFallRule = null;
      return;
    }
    if (![rule.typeMask, rule.chancePercent, rule.descriptor].every((value) => Number.isInteger(Number(value)))) {
      throw new Error('PAD thorn-fall rule requires integer typeMask, chancePercent, and descriptor values.');
    }
    this.thornFallRule = {
      active: rule.active === undefined ? true : Boolean(rule.active),
      typeMask: Number(rule.typeMask) >>> 0,
      chancePercent: Number(rule.chancePercent) & 0xffff,
      descriptor: Number(rule.descriptor) & 0x7f,
      descriptorHighBit: Boolean(rule.descriptorHighBit),
    };
  }

  setNailFallRule(rule) {
    if (rule === null || rule === undefined) {
      this.nailFallRule = null;
      return;
    }
    if (!Number.isInteger(Number(rule.chancePercent))) {
      throw new Error('PAD nail-fall rule requires an integer chancePercent value.');
    }
    this.nailFallRule = {
      active: rule.active === undefined ? true : Boolean(rule.active),
      chancePercent: Number(rule.chancePercent) & 0xff,
    };
  }

  setBlackFallRule(rule) {
    if (rule === null || rule === undefined) {
      this.blackFallRule = null;
      return;
    }
    if (!Number.isInteger(Number(rule.chanceBasisPoints)) || (
      rule.turnsRemaining !== undefined && rule.turnsRemaining !== null
      && (!Number.isInteger(Number(rule.turnsRemaining)) || Number(rule.turnsRemaining) < 0)
    )) throw new Error('PAD black-fall rule requires integer chanceBasisPoints and nonnegative turnsRemaining values.');
    const turnsRemaining = rule.turnsRemaining === undefined || rule.turnsRemaining === null
      ? null
      : Number(rule.turnsRemaining);
    this.blackFallRule = {
      active: rule.active === undefined ? turnsRemaining === null || turnsRemaining > 0 : Boolean(rule.active),
      chanceBasisPoints: (Number(rule.chanceBasisPoints) << 16) >> 16,
      turnsRemaining,
      skipInitialCountdown: rule.skipInitialCountdown === undefined
        ? true
        : Boolean(rule.skipInitialCountdown),
    };
  }

  applyEnemySkillRecord(record, enemyIndex = 0) {
    const materialized = this.materializeEnemySkillRecord(record, enemyIndex);
    const skill = normalizePadEnemySkillRecord(materialized);
    this.lastEnemySkill = skill;
    if (skill.supported && skill.kind === 'entireBlind') {
      let newlyBlinded = 0;
      this.board.forEach((row) => row.forEach((orb) => {
        const flags = Number(orb.blockFlags) >>> 0;
        if ((flags & PAD_BLOCK_ENTIRE_BLIND_FLAG) === 0) {
          orb.blockFlags = flags
            | PAD_BLOCK_ENTIRE_BLIND_FLAG
            | PAD_BLOCK_ENTIRE_BLIND_FRESH_FLAG;
          newlyBlinded += 1;
        } else {
          orb.blockFlags = flags | PAD_BLOCK_ENTIRE_BLIND_FLAG;
        }
        if (['jammer', 'poison', 'mortalPoison', 'bomb'].includes(orb.type)) {
          // _doBlock2Black clears the same incompatible special-orb state as
          // the native block-state helpers before installing classic blind.
          orb.blockFlags &= ~PAD_BLOCK_SPECIAL_LOCK_CLEAR_FLAGS;
          orb.enhancementPower = 0;
          orb.enhanced = false;
          orb.nail = false;
        }
        orb.blind = true;
        orb.blindCountdown = 0;
      }));
      this.lastEnemySkill = Object.freeze({ ...skill, newlyBlinded });
      this.message = 'The board was blinded.';
      return true;
    }
    if (skill.supported && skill.kind === 'stickyBlindRandom') {
      const candidates = [];
      this.board.forEach((row, rowIndex) => row.forEach((orb, columnIndex) => {
        candidates.push({ row: rowIndex, column: columnIndex });
      }));
      const selected = padShuffleLockDropCandidates(skill.selectionSeed, candidates)
        .slice(0, Math.max(0, Math.min(candidates.length, skill.blindCount)));
      selected.forEach(({ row, column }) => {
        const orb = this.board[row][column];
        orb.blockFlags = (Number(orb.blockFlags) >>> 0)
          | PAD_BLOCK_BLIND_FLAG
          | PAD_BLOCK_BLIND_FRESH_FLAG;
        orb.blind = true;
        orb.blindFresh = true;
        orb.blindCountdown = Math.max(0, skill.durationTurns);
      });
      this.lastEnemySkill = Object.freeze({ ...skill, blindedOrbCount: selected.length });
      this.message = `${selected.length} orb${selected.length === 1 ? '' : 's'} were obscured.`;
      return true;
    }
    if (skill.supported && skill.kind === 'stickyBlindFixed') {
      let blindedOrbCount = 0;
      this.board.forEach((row, rowIndex) => row.forEach((orb, columnIndex) => {
        if (((skill.rowMasks?.[rowIndex] || 0) & (1 << columnIndex)) === 0) return;
        orb.blockFlags = (Number(orb.blockFlags) >>> 0)
          | PAD_BLOCK_BLIND_FLAG
          | PAD_BLOCK_BLIND_FRESH_FLAG;
        orb.blind = true;
        orb.blindFresh = true;
        orb.blindCountdown = Math.max(0, skill.durationTurns);
        blindedOrbCount += 1;
      }));
      this.lastEnemySkill = Object.freeze({ ...skill, blindedOrbCount });
      this.message = `${blindedOrbCount} orb${blindedOrbCount === 1 ? '' : 's'} were obscured.`;
      return true;
    }
    if (skill.supported && skill.kind === 'orbSealColumns') {
      this.orbSealColumnMask = skill.positionMask & ((1 << this.columns) - 1);
      this.orbSealColumnTurns = Math.max(0, skill.durationTurns) & 0x3ff;
      this.lastEnemySkill = Object.freeze({
        ...skill,
        positionMask: this.orbSealColumnMask,
        durationTurns: this.orbSealColumnTurns,
      });
      let count = 0;
      for (let bits = this.orbSealColumnMask; bits !== 0; bits >>>= 1) count += bits & 1;
      this.message = `${count} column${count === 1 ? '' : 's'} sealed for ${this.orbSealColumnTurns} turn${this.orbSealColumnTurns === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'orbSealRows') {
      this.orbSealRowMask = skill.positionMask & ((1 << this.rows) - 1);
      this.orbSealRowTurns = Math.max(0, skill.durationTurns) & 0x3ff;
      this.lastEnemySkill = Object.freeze({
        ...skill,
        positionMask: this.orbSealRowMask,
        durationTurns: this.orbSealRowTurns,
      });
      let count = 0;
      for (let bits = this.orbSealRowMask; bits !== 0; bits >>>= 1) count += bits & 1;
      this.message = `${count} row${count === 1 ? '' : 's'} sealed for ${this.orbSealRowTurns} turn${this.orbSealRowTurns === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'fixedStart') {
      const column = Math.max(0, Math.min(this.columns - 1, skill.fixedColumn));
      const row = Math.max(0, Math.min(this.rows - 1, skill.fixedRow));
      this.forcedStart = { row, column };
      this.lastEnemySkill = Object.freeze({ ...skill, fixedColumn: column, fixedRow: row });
      this.message = `Your next move must start at row ${row + 1}, column ${column + 1}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'randomBombs') {
      const candidates = [];
      this.board.forEach((row, rowIndex) => row.forEach((orb, columnIndex) => {
        candidates.push({ row: rowIndex, column: columnIndex });
      }));
      const selected = padShuffleLockDropCandidates(skill.selectionSeed, candidates)
        .slice(0, Math.max(0, Math.min(candidates.length, skill.bombCount)));
      let changedOrbCount = 0;
      selected.forEach(({ row, column }) => {
        const orb = this.board[row][column];
        if (orb.locked) return;
        orb.type = 'bomb';
        orb.blockFlags = (Number(orb.blockFlags) >>> 0) & ~PAD_BLOCK_SPECIAL_LOCK_CLEAR_FLAGS;
        orb.enhancementPower = 0;
        orb.enhanced = false;
        orb.nail = false;
        orb.locked = skill.lockedBombs;
        if (skill.lockedBombs) orb.blockFlags |= PAD_BLOCK_LOCKED_FLAG;
        changedOrbCount += 1;
      });
      this.lastEnemySkill = Object.freeze({ ...skill, changedOrbCount });
      this.message = `${changedOrbCount} ${skill.lockedBombs ? 'locked ' : ''}bomb${changedOrbCount === 1 ? '' : 's'} appeared.`;
      return true;
    }
    if (skill.supported && skill.kind === 'fixedBombs') {
      let changedOrbCount = 0;
      this.board.forEach((row, rowIndex) => row.forEach((orb, columnIndex) => {
        if (((skill.rowMasks?.[rowIndex] || 0) & (1 << columnIndex)) === 0) return;
        if (orb.locked) return;
        orb.type = 'bomb';
        orb.blockFlags = (Number(orb.blockFlags) >>> 0) & ~PAD_BLOCK_SPECIAL_LOCK_CLEAR_FLAGS;
        orb.enhancementPower = 0;
        orb.enhanced = false;
        orb.nail = false;
        orb.locked = skill.lockedBombs;
        if (skill.lockedBombs) orb.blockFlags |= PAD_BLOCK_LOCKED_FLAG;
        changedOrbCount += 1;
      }));
      this.lastEnemySkill = Object.freeze({ ...skill, changedOrbCount });
      this.message = `${changedOrbCount} ${skill.lockedBombs ? 'locked ' : ''}bomb${changedOrbCount === 1 ? '' : 's'} appeared.`;
      return true;
    }
    if (skill.supported && skill.kind === 'cloud') {
      const height = Math.max(0, Math.min(this.rows, skill.cloudHeightRows));
      const width = Math.max(0, Math.min(this.columns, skill.cloudWidthColumns));
      const row = Math.max(0, Math.min(this.rows - height, skill.originRow));
      const columnFromRight = Math.max(
        0,
        Math.min(this.columns - width, skill.originColumnFromRight),
      );
      const column = this.columns - width - columnFromRight;
      this.cloud = {
        row,
        column,
        heightRows: height,
        widthColumns: width,
        turnsRemaining: Math.max(0, skill.durationTurns) & 0x3ff,
      };
      this.lastEnemySkill = Object.freeze({
        ...skill,
        cloudRow: row,
        cloudColumn: column,
        cloudHeightRows: height,
        cloudWidthColumns: width,
      });
      this.message = `Clouds obscured a ${width} × ${height} area for ${this.cloud.turnsRemaining} turn${this.cloud.turnsRemaining === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'recoveryDebuff') {
      const multiplier = Math.fround(skill.recoveryPercent / 100);
      this.recoveryDebuff = {
        turnsRemaining: Math.max(0, skill.durationTurns) & 0x3ff,
        recoveryPercent: skill.recoveryPercent,
        multiplier,
      };
      this.lastEnemySkill = Object.freeze({ ...skill, multiplier });
      this.message = `Recovery changed to ${skill.recoveryPercent}% for ${this.recoveryDebuff.turnsRemaining} turn${this.recoveryDebuff.turnsRemaining === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'attributeBlock') {
      this.attributeBlock = {
        turnsRemaining: Math.max(0, skill.durationTurns) & 0x3ff,
        typeMask: skill.typeMask & 0xffff,
      };
      this.lastEnemySkill = Object.freeze({
        ...skill,
        durationTurns: this.attributeBlock.turnsRemaining,
        typeMask: this.attributeBlock.typeMask,
      });
      const blockedTypes = ORB_TYPES
        .filter((_, typeIndex) => (this.attributeBlock.typeMask & (1 << typeIndex)) !== 0)
        .map((orb) => orb.label)
        .join(', ');
      this.message = `${blockedTypes || 'Selected orbs'} cannot be matched for ${this.attributeBlock.turnsRemaining} turn${this.attributeBlock.turnsRemaining === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'clearPlayerBuffs') {
      // _doItetukuHadou clears both recovered sGAMEWORK positive-status lanes,
      // then type 6 invokes _applyLeaderSkill(false). Leader effects in this
      // reconstruction are calculated from current party state on use, so the
      // observable equivalent is to clear the modeled transient lanes here.
      const cleared = Number(this.playerAuxiliaryBuffTurns > 0)
        + Number(this.playerAttackBoostTurns > 0);
      this.playerAuxiliaryBuffTurns = 0;
      this.playerAttackBoostTurns = 0;
      this.lastEnemySkill = Object.freeze({ ...skill, clearedBuffCount: cleared });
      this.message = `Enemy dispelled ${cleared} player buff${cleared === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'healEnemy') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      if (!enemy) return false;
      const requested = padEnemySkillEnemyHeal(enemy.maxHp, skill.healPercent);
      const before = enemy.hp;
      enemy.hp = clamp(enemy.hp + requested, 0, enemy.maxHp);
      const healed = enemy.hp - before;
      this.lastEnemySkill = Object.freeze({ ...skill, healedHp: healed });
      if (healed > 0) {
        this.floatingText.push({ kind: 'revive', value: healed, enemy: enemyIndex, age: 0 });
      }
      this.message = `${enemy.name} restored ${Math.max(0, healed).toLocaleString()} HP.`;
      return true;
    }
    if (skill.supported && skill.kind === 'additionalAttack') {
      this.message = `Enemy adds an attack at ${skill.damagePercent}% power.`;
      return true;
    }
    if (skill.supported && skill.kind === 'defenseBoost') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      if (!enemy) return false;
      enemy.defenseBoostTurns = Math.max(0, (skill.durationTurns << 16) >> 16);
      enemy.defenseBoostAmount = padEnemySkillDefenseBoost(enemy.defense, skill.boostPercent);
      this.message = `${enemy.name} raises defense by ${enemy.defenseBoostAmount.toLocaleString()} for ${enemy.defenseBoostTurns} turn${enemy.defenseBoostTurns === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'attributeNullify') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      if (!enemy) return false;
      enemy.attributeNullifyTurns = Math.max(0, (skill.durationTurns << 16) >> 16);
      enemy.attributeNullifyMask = padEnemySkillAttributeNullifyMask(skill.attributes);
      this.message = `${enemy.name} nullifies selected attributes for ${enemy.attributeNullifyTurns} turn${enemy.attributeNullifyTurns === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'randomPartyBind') {
      const targetOrder = this.selectRandomBindablePartyTargets(skill.targetCount);
      const targetMask = targetOrder.reduce((mask, index) => mask | (1 << index), 0);
      const result = this.doBind(targetMask, 6, 0, targetOrder);
      this.lastEnemySkill = Object.freeze({ ...skill, targetMask, targetOrder, ...result });
      const boundCount = result.boundMask.toString(2).replaceAll('0', '').length;
      const resistedCount = result.resistedMask.toString(2).replaceAll('0', '').length;
      this.message = `${boundCount} random party member${boundCount === 1 ? '' : 's'} bound for 6 turns${resistedCount ? ` · ${resistedCount} resisted` : ''}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'bindAttack') {
      const result = this.doBind(skill.targetMask || 0, skill.durationTurns);
      this.lastEnemySkill = Object.freeze({ ...skill, ...result });
      const boundCount = result.boundMask.toString(2).replaceAll('0', '').length;
      const resistedCount = result.resistedMask.toString(2).replaceAll('0', '').length;
      this.message = `${boundCount} party member${boundCount === 1 ? '' : 's'} bound for ${skill.durationTurns} turn${skill.durationTurns === 1 ? '' : 's'}${resistedCount ? ` · ${resistedCount} resisted` : ''}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'randomSubBind') {
      const durationTurns = this.rollEnemySkillDuration(skill.durationMin, skill.durationMax);
      const result = this.doBind(skill.targetMask || 0, durationTurns);
      this.lastEnemySkill = Object.freeze({ ...skill, ...result });
      const boundCount = result.boundMask.toString(2).replaceAll('0', '').length;
      const resistedCount = result.resistedMask.toString(2).replaceAll('0', '').length;
      this.message = `${boundCount} random sub${boundCount === 1 ? '' : 's'} bound for ${durationTurns} turn${durationTurns === 1 ? '' : 's'}${resistedCount ? ` · ${resistedCount} resisted` : ''}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'activeSkillSeal') {
      const result = this.applyActiveSkillSeal(skill.durationTurns);
      this.lastEnemySkill = Object.freeze({ ...skill, ...result });
      this.message = result.resisted
        ? 'The party resisted the active-skill seal.'
        : `Active skills sealed for ${this.skillSealTurns} turn${this.skillSealTurns === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'repeatAttack') {
      this.message = `Enemy attacks ${Math.max(0, skill.hitCount)} times at ${skill.damagePercent}% power.`;
      return true;
    }
    if (skill.supported && skill.kind === 'inactivity') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      this.message = `${enemy?.name || 'Enemy'} does nothing.`;
      return true;
    }
    if (skill.supported && skill.kind === 'inactivityPresentation') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      this.message = `${enemy?.name || 'Enemy'} pauses with effect ${skill.presentationParameters.join('/')}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'damageVoid') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      if (!enemy) return false;
      enemy.damageVoidTurns = skill.durationTurns;
      enemy.damageVoidThreshold = skill.damageThreshold;
      this.message = `${enemy.name} voids damage of ${skill.damageThreshold.toLocaleString()} or more for ${skill.durationTurns} turn${skill.durationTurns === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'damageAbsorb') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      if (!enemy) return false;
      enemy.damageAbsorbTurns = skill.durationTurns;
      enemy.damageAbsorbThreshold = skill.damageThreshold;
      this.message = `${enemy.name} absorbs damage of ${skill.damageThreshold.toLocaleString()} or more for ${skill.durationTurns} turn${skill.durationTurns === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'awakeningBind') {
      const result = this.applyAwakeningBind(skill.durationTurns);
      this.lastEnemySkill = Object.freeze({ ...skill, ...result });
      this.message = `Awakenings bound for ${this.awakeningBindTurns} turn${this.awakeningBindTurns === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'skillDelay') {
      const requestedDelay = Math.max(0, Math.trunc(Number(skill.skillDelays?.[0]) || 0));
      const beforeCooldown = this.skill.cooldown;
      this.skill.cooldown = Math.min(this.skill.maxCooldown, beforeCooldown + requestedDelay);
      const appliedDelay = this.skill.cooldown - beforeCooldown;
      this.lastEnemySkill = Object.freeze({
        ...skill,
        appliedDelay,
        skillCooldownBefore: beforeCooldown,
        skillCooldownAfter: this.skill.cooldown,
      });
      this.message = appliedDelay > 0
        ? `Tide Shift was delayed by ${appliedDelay} turn${appliedDelay === 1 ? '' : 's'}.`
        : 'The enemy tried to delay active skills.';
      return true;
    }
    if (skill.supported && skill.kind === 'presenceCheck') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      this.message = `${enemy?.name || 'Enemy'} checks the party and takes no action.`;
      return true;
    }
    if (skill.supported && skill.kind === 'maskedRandomOrbChange') {
      const changed = this.doPoisonBlockN2(
        skill.perTypeCount,
        skill.destinationTypeMask,
        skill.excludedSourceTypeMask,
        false,
        true,
        null,
        createPadRng(skill.selectionSeed),
      );
      this.lastEnemySkill = Object.freeze({ ...skill, changedOrbCount: changed });
      this.message = `${changed} random orb${changed === 1 ? '' : 's'} changed.`;
      return true;
    }
    if (skill.supported && skill.kind === 'nativeNoEffect') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      this.message = `${enemy?.name || 'Enemy'} takes no special action.`;
      return true;
    }
    if (skill.supported && skill.kind === 'lockRandomOrbs') {
      const before = this.board.flat().filter((orb) => orb.locked).length;
      const applied = this.doLockDropBits(skill.typeMask, skill.lockCount, skill.selectionSeed);
      const after = this.board.flat().filter((orb) => orb.locked).length;
      const lockedOrbCount = Math.max(0, after - before);
      this.lastEnemySkill = Object.freeze({ ...skill, applied, lockedOrbCount });
      this.message = `${lockedOrbCount} orb${lockedOrbCount === 1 ? '' : 's'} locked.`;
      return applied;
    }
    if (skill.supported && skill.kind === 'enemyEscape') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      if (!enemy || enemy.hp <= 0) return false;
      enemy.hp = 0;
      enemy.escaped = true;
      enemy.deathResolved = true;
      this.message = `${enemy.name} escaped.`;
      return true;
    }
    if (skill.supported && skill.kind === 'damageShield') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      if (!enemy) return false;
      enemy.damageShieldTurns = skill.durationTurns;
      enemy.damageShieldPercent = skill.shieldPercent;
      this.message = `${enemy.name} reduces damage by ${skill.shieldPercent}% for ${skill.durationTurns} turn${skill.durationTurns === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'leaderSwap') {
      const selectedPartyIndex = Math.trunc(Number(skill.selectedPartyIndex));
      if (
        this.leaderSwapTurns > 0
        || skill.durationTurns <= 0
        || selectedPartyIndex < 1
        || selectedPartyIndex > 4
        || !this.party[selectedPartyIndex]
        || this.party[selectedPartyIndex].present === false
      ) return false;
      [this.party[0], this.party[selectedPartyIndex]] = [
        this.party[selectedPartyIndex],
        this.party[0],
      ];
      this.leaderSwapTurns = Math.max(0, (skill.durationTurns << 16) >> 16);
      this.leaderSwapIndex = selectedPartyIndex;
      this.message = `${this.party[0].name} was swapped into the leader slot for ${this.leaderSwapTurns} turn${this.leaderSwapTurns === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'normalAttack') {
      this.message = 'Enemy performs a normal attack.';
      return true;
    }
    if (skill.supported && [
      'loneAttackBoost',
      'statusTriggeredAttackBoost',
      'damagedTurnAttackBoost',
    ].includes(skill.kind)) {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      if (!enemy) return false;
      enemy.attackBoostTurns = Math.max(0, (skill.durationTurns << 16) >> 16);
      enemy.attackBoostPercent = skill.boostPercent;
      this.message = `${enemy.name} raises attack to ${skill.boostPercent}% for ${enemy.attackBoostTurns} turn${enemy.attackBoostTurns === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'statusShield') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      if (!enemy) return false;
      enemy.statusShieldTurns = Math.max(0, (skill.durationTurns << 16) >> 16);
      this.message = `${enemy.name} blocks status ailments for ${enemy.statusShieldTurns} turn${enemy.statusShieldTurns === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'moveTimeReduction') {
      const turnsRemaining = Math.max(0, skill.durationTurns & 0x3ff);
      this.moveTime = padEnemySkillMoveTimeSeconds(
        this.baseMoveTime,
        skill.fixedReductionCentiseconds,
        skill.percentReduction,
      );
      this.moveTimeReduction = turnsRemaining > 0 ? {
        turnsRemaining,
        fixedReductionCentiseconds: (skill.fixedReductionCentiseconds << 16) >> 16,
        percentReduction: (skill.percentReduction << 16) >> 16,
        percentMode: ((skill.percentReduction << 16) >> 16) !== 0,
      } : null;
      if (!this.moveTimeReduction) this.moveTime = this.baseMoveTime;
      this.message = `Move time reduced to ${this.moveTime.toFixed(2)} seconds.`;
      return true;
    }
    if (skill.supported && skill.kind === 'selfDestruct') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      if (!enemy || enemy.hp <= 0) return false;
      enemy.hp = 0;
      this.message = `${enemy.name} defeated itself.`;
      return true;
    }
    if (skill.supported && skill.kind === 'changeEnemyAttribute') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      const attribute = ORB_TYPES[skill.targetAttribute]?.id;
      if (!enemy || skill.targetAttribute < 0 || skill.targetAttribute >= 5 || !attribute) return false;
      enemy.attribute = attribute;
      this.message = `${enemy.name} changed attribute to ${ORB_TYPES[skill.targetAttribute].label}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'scaledAttack') {
      this.message = `Enemy attacks at ${skill.damagePercent}% power.`;
      return true;
    }
    if (skill.supported && skill.kind === 'currentHpGravity') {
      this.message = `Enemy gravity deals ${skill.damagePercent}% of current HP.`;
      return true;
    }
    if (skill.supported && skill.kind === 'reviveEnemy') {
      const target = this.enemies[skill.targetEnemyIndex];
      if (!target || target.hp > 0) return false;
      const revivedHp = padEnemySkillReviveHp(target.maxHp, skill.revivePercent);
      target.hp = revivedHp;
      if (target.hp > 0) {
        target.deathResolved = false;
        target.escaped = false;
      }
      this.lastEnemySkill = Object.freeze({ ...skill, revivedHp: target.hp });
      if (target.hp > 0) {
        this.floatingText.push({
          kind: 'revive', value: target.hp, enemy: skill.targetEnemyIndex, age: 0,
        });
      }
      this.message = `${target.name} revived with ${target.hp.toLocaleString()} HP.`;
      return true;
    }
    if (skill.supported && skill.kind === 'attributeAbsorb') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      if (!enemy) return false;
      enemy.attributeAbsorbTurns = skill.durationTurns;
      enemy.attributeAbsorbMask = skill.attributeMask;
      this.message = `Enemy absorbs selected attributes for ${skill.durationTurns} turn${skill.durationTurns === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'comboAbsorb') {
      const enemy = this.enemies[Math.trunc(Number(enemyIndex))];
      if (!enemy) return false;
      enemy.comboAbsorbTurns = skill.durationTurns;
      enemy.comboAbsorbThreshold = skill.comboThreshold;
      this.message = `Enemy absorbs ${skill.comboThreshold} combos or fewer for ${skill.durationTurns} turn${skill.durationTurns === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'skyfallRate') {
      const durationTurns = Math.max(0, Math.trunc(Number(skill.durationTurns) || 0));
      const naturalMask = skill.typeMask & 0x3f;
      const hazardMask = skill.typeMask & 0x1c0;
      if (naturalMask !== 0) {
        this.skyfallRateRules.natural = {
          typeMask: naturalMask,
          chancePercent: skill.chancePercent,
          turnsRemaining: durationTurns,
        };
      }
      if (hazardMask !== 0) {
        this.skyfallRateRules.hazard = {
          typeMask: hazardMask,
          chancePercent: skill.chancePercent,
          turnsRemaining: durationTurns,
        };
      }
      this.recomputeDropRates();
      this.message = `Selected orbs fall at ${skill.chancePercent}% for ${durationTurns} turn${durationTurns === 1 ? '' : 's'}.`;
      return naturalMask !== 0 || hazardMask !== 0;
    }
    if (skill.supported && skill.kind === 'lockedSkyfall') {
      const typeMask = Math.trunc(Number(skill.typeMask) || 0) & 0xffff;
      const durationTurns = Math.max(0, Math.trunc(Number(skill.durationTurns) || 0));
      if (typeMask === 0 || durationTurns === 0) return false;
      this.lockFallRules.push({
        typeMask,
        chancePercent: Math.trunc(Number(skill.chancePercent) || 0),
        turnsRemaining: durationTurns,
        source: 'enemySkill',
      });
      if (this.lockFallRules.length > 10) this.lockFallRules.splice(10);
      this.message = `Selected orbs may fall locked for ${durationTurns} turn${durationTurns === 1 ? '' : 's'}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'bindLeaderHelper') {
      const durationTurns = this.rollEnemySkillDuration(skill.durationMin, skill.durationMax);
      const result = this.doBind(skill.targetMask || 0, durationTurns);
      this.lastEnemySkill = Object.freeze({ ...skill, ...result });
      const boundCount = result.boundMask.toString(2).replaceAll('0', '').length;
      const resistedCount = result.resistedMask.toString(2).replaceAll('0', '').length;
      this.message = `${boundCount} party member${boundCount === 1 ? '' : 's'} bound${resistedCount ? ` · ${resistedCount} resisted` : ''}.`;
      return true;
    }
    if (skill.supported && skill.kind === 'healPlayer') {
      const requested = padEnemySkillPlayerHeal(this.player.maxHp, skill.healPercent);
      const before = this.player.hp;
      // sPLAYER::addHp first caps a positive delta to max HP, performs a
      // wrapping 32-bit add, then clamps the resulting HP into [0, max HP].
      const cappedDelta = Math.min(requested, this.player.maxHp);
      this.player.hp = clamp((Math.trunc(this.player.hp) + cappedDelta) | 0, 0, this.player.maxHp);
      const healed = this.player.hp - before;
      if (healed > 0) {
        this.floatingText.push({ kind: 'heal', value: healed, enemy: -1, age: 0 });
      }
      this.message = `Enemy restored ${Math.max(0, healed).toLocaleString()} player HP.`;
      return true;
    }
    if (skill.supported && skill.kind === 'sourceToPoison') {
      const effectFlags = this.doBlockSwap(
        skill.sourceType,
        skill.destinationType,
        0,
        { poisonResist: false },
      );
      this.message = `Enemy converted one orb color to poison (effect ${effectFlags}).`;
      return true;
    }
    if (skill.supported && skill.kind === 'sourceOrbConversion') {
      const effectFlags = this.doBlockSwap(
        skill.sourceType,
        skill.destinationType,
        0,
        null,
      );
      this.message = `Enemy converted one orb color (effect ${effectFlags}).`;
      return true;
    }
    if (skill.supported && skill.kind === 'sourceToJammer') {
      const effectFlags = this.doBlockSwap(skill.sourceType, 6, 0, null);
      this.message = `Enemy converted one orb color to jammer (effect ${effectFlags}).`;
      return true;
    }
    if (skill.supported && skill.kind === 'blockMinus') {
      const changed = this.doBlockMinus(
        true,
        skill.typeMask,
        skill.power,
        skill.limit,
      );
      this.message = `${changed} orb${changed === 1 ? '' : 's'} weakened.`;
      return true;
    }
    if (skill.supported && skill.kind === 'burDrop') {
      const changed = this.doMakeBurDrop(
        true,
        skill.typeMask,
        skill.count,
        skill.descriptor,
        skill.clearDescriptorHighBit,
      );
      this.message = `${changed} orb${changed === 1 ? '' : 's'} became thorns.`;
      return true;
    }
    if (skill.supported && (skill.kind === 'horizontalLines' || skill.kind === 'verticalLines')) {
      let effectFlags = 0;
      for (const swap of skill.lineSwaps) {
        // _doEnemySkill types 76-79 share one `int &flags` across their three
        // or four line-writer calls. A zero authored mask leaves it untouched.
        if (swap.lineMask !== 0) {
          effectFlags = skill.kind === 'horizontalLines'
            ? this.doBlockSwapH(swap.lineMask, swap.destinationTypeMask, effectFlags)
            : this.doBlockSwapV(swap.lineMask, swap.destinationTypeMask, effectFlags);
        }
      }
      this.message = `Enemy rewrote ${skill.kind === 'horizontalLines' ? 'horizontal' : 'vertical'} lines (effect ${effectFlags}).`;
      return true;
    }
    if (skill.supported && skill.kind === 'poisonTypeListSwap') {
      const effectFlags = this.doBlockSwap2(...skill.destinationTypes);
      this.message = `Enemy converted poison orbs (effect ${effectFlags}).`;
      return true;
    }
    if (skill.supported && skill.kind === 'poisonMaskSwap') {
      const effectFlags = this.doBlockSwap4(skill.destinationTypeMask);
      this.message = `Enemy converted poison orbs (effect ${effectFlags}).`;
      return true;
    }
    if (skill.supported && skill.kind === 'poisonBlockN') {
      const changed = this.doPoisonBlockN(
        skill.destinationType,
        skill.count,
        skill.excludeHeart,
      );
      this.message = `${changed} orb${changed === 1 ? '' : 's'} became poison.`;
      return true;
    }
    if (skill.supported && skill.kind === 'poisonBlocks') {
      const changed = this.doPoisonBlocks(
        skill.destinationType,
        skill.count,
        skill.excludeHeart,
      );
      this.message = `${changed} orb${changed === 1 ? '' : 's'} became poison.`;
      return true;
    }
    if (skill.supported && skill.kind === 'poisonBlockNCounted') {
      const changed = this.doPoisonBlockN(
        skill.destinationType,
        skill.count,
        skill.excludeHeart,
      );
      this.message = `${changed} orb${changed === 1 ? '' : 's'} became poison.`;
      return true;
    }
    if (!skill.supported || skill.kind !== 'blackFall') return false;
    this.setBlackFallRule({
      chanceBasisPoints: skill.chanceBasisPoints,
      turnsRemaining: skill.durationTurns,
    });
    this.message = `Black skyfall active for ${skill.durationTurns} turn${skill.durationTurns === 1 ? '' : 's'}.`;
    return true;
  }

  applyEnemySkillRuntime(skillDefinition, monsterRuntime) {
    return this.applyEnemySkillRecord(decodePadEnemySkillRuntime(skillDefinition, monsterRuntime));
  }

  applyEnemySkillDefinition(skillDefinition) {
    return this.applyEnemySkillRecord(decodePadEnemySkillDefinition(skillDefinition));
  }

  setEnemySkillQueue(enemyIndex, skillDefinitions, { repeat = false } = {}) {
    const index = Math.trunc(Number(enemyIndex));
    if (index < 0 || index >= ENEMY_TEMPLATE.length) {
      throw new RangeError(`PAD enemy index must be between 0 and ${ENEMY_TEMPLATE.length - 1}.`);
    }
    if (!Array.isArray(skillDefinitions)) throw new TypeError('PAD enemy skill queue must be an array of definition records.');
    const records = skillDefinitions.map((definition) => decodePadEnemySkillDefinition(definition));
    if (records.some((record) => !record.supported)) {
      throw new Error('PAD enemy skill queue contains a definition type that is not implemented.');
    }
    if (records.some((record) => record.kind === 'multiAttack')) {
      throw new Error('PAD type-83 multi-attack records require an AI definition pool for child lookup.');
    }
    if (records.some((record) => record.passive)) {
      throw new Error('PAD passive enemy skills must be installed through monster skill slots.');
    }
    if (records.some((record) => record.attackWithSkillValue === null)) {
      throw new RangeError('PAD scheduled enemy-skill definitions require the native +0x44 attack-with-skill field.');
    }
    this.enemySkillQueues[index] = { records, position: 0, repeat: Boolean(repeat) };
  }

  setEnemyAiDefinitionPool(enemyIndex, monsterDefinition, skillDefinitions) {
    const index = Math.trunc(Number(enemyIndex));
    if (index < 0 || index >= ENEMY_TEMPLATE.length) {
      throw new RangeError(`PAD enemy index must be between 0 and ${ENEMY_TEMPLATE.length - 1}.`);
    }
    if (monsterDefinition === null || monsterDefinition === undefined) {
      this.enemyAiPools[index] = null;
      if (this.enemies) this.applyEnemyPassiveSkills(index);
      return;
    }
    const monster = decodePadEnemyAiMonsterDefinition(monsterDefinition);
    if (!monster.usesNewAi) throw new Error('PAD legacy enemy AI records are not implemented at this boundary.');
    if (!Array.isArray(skillDefinitions)) throw new TypeError('PAD enemy AI skill definitions must be an array.');
    const definitions = skillDefinitions.map((definition) => decodePadEnemyAiSkillDefinition(definition));
    const definitionsById = new Map(definitions.map((definition) => [definition.skillId, definition]));
    for (const slot of monster.slots) {
      const definition = definitionsById.get(slot.skillId);
      if (!definition) throw new Error(`PAD enemy AI slot ${slot.index} references missing skill ${slot.skillId}.`);
      if (![
        PAD_ENEMY_SKILL_SOURCE_ORB_CONVERSION,
        PAD_ENEMY_SKILL_ENTIRE_BLIND,
        PAD_ENEMY_SKILL_ENTIRE_BLIND_ALT,
        PAD_ENEMY_SKILL_BIND_ATTACK,
        PAD_ENEMY_SKILL_RANDOM_SUB_BIND,
        PAD_ENEMY_SKILL_CLEAR_PLAYER_BUFFS,
        PAD_ENEMY_SKILL_HEAL_ENEMY,
        PAD_ENEMY_SKILL_HEAL_ENEMY_UNCONDITIONAL,
        PAD_ENEMY_SKILL_DAMAGE_ABSORB,
        PAD_ENEMY_SKILL_AWAKENING_BIND,
        PAD_ENEMY_SKILL_SKILL_DELAY,
        PAD_ENEMY_SKILL_PRESENCE_CHECK,
        PAD_ENEMY_SKILL_MASKED_RANDOM_ORB_CHANGE,
        PAD_ENEMY_SKILL_NATIVE_NO_EFFECT,
        PAD_ENEMY_SKILL_LOCK_RANDOM_ORBS,
        PAD_ENEMY_SKILL_ENEMY_ESCAPE,
        PAD_ENEMY_SKILL_LOCKED_SKYFALL,
        PAD_ENEMY_SKILL_STICKY_BLIND_RANDOM,
        PAD_ENEMY_SKILL_STICKY_BLIND_FIXED,
        PAD_ENEMY_SKILL_ORB_SEAL_COLUMNS,
        PAD_ENEMY_SKILL_ORB_SEAL_ROWS,
        PAD_ENEMY_SKILL_FIXED_START,
        PAD_ENEMY_SKILL_RANDOM_BOMBS,
        PAD_ENEMY_SKILL_FIXED_BOMBS,
        PAD_ENEMY_SKILL_CLOUD,
        PAD_ENEMY_SKILL_RECOVERY_DEBUFF,
        PAD_ENEMY_SKILL_TURN_CHANGE,
        PAD_ENEMY_SKILL_ATTRIBUTE_BLOCK,
        PAD_ENEMY_SKILL_ADDITIONAL_ATTACK,
        PAD_ENEMY_SKILL_DEFENSE_BOOST,
        PAD_ENEMY_SKILL_ATTRIBUTE_NULLIFY,
        PAD_ENEMY_SKILL_DUAL_ATTRIBUTE_NULLIFY,
        PAD_ENEMY_SKILL_SOURCE_TO_JAMMER,
        PAD_ENEMY_SKILL_RANDOM_PARTY_BIND,
        PAD_ENEMY_SKILL_ACTIVE_SKILL_SEAL,
        PAD_ENEMY_SKILL_REPEAT_ATTACK,
        PAD_ENEMY_SKILL_INACTIVITY,
        PAD_ENEMY_SKILL_INACTIVITY_UNCONDITIONAL,
        PAD_ENEMY_SKILL_COMBO_ABSORB,
        PAD_ENEMY_SKILL_SKYFALL_RATE,
        PAD_ENEMY_SKILL_DEATH_CRY,
        PAD_ENEMY_SKILL_INACTIVITY_PRESENTATION,
        PAD_ENEMY_SKILL_DAMAGE_VOID,
        PAD_ENEMY_SKILL_ATTRIBUTE_RESIST,
        PAD_ENEMY_SKILL_RESOLVE,
        PAD_ENEMY_SKILL_DAMAGE_SHIELD,
        PAD_ENEMY_SKILL_LEADER_SWAP,
        PAD_ENEMY_SKILL_NORMAL_ATTACK,
        PAD_ENEMY_SKILL_LONE_ATTACK_BOOST,
        PAD_ENEMY_SKILL_STATUS_TRIGGERED_ATTACK_BOOST,
        PAD_ENEMY_SKILL_DAMAGED_TURN_ATTACK_BOOST,
        PAD_ENEMY_SKILL_STATUS_SHIELD,
        PAD_ENEMY_SKILL_MOVE_TIME_REDUCTION,
        PAD_ENEMY_SKILL_SELF_DESTRUCT,
        PAD_ENEMY_SKILL_CHANGE_ATTRIBUTE,
        PAD_ENEMY_SKILL_SCALED_ATTACK,
        PAD_ENEMY_SKILL_CURRENT_HP_GRAVITY,
        PAD_ENEMY_SKILL_REVIVE_ENEMY,
        PAD_ENEMY_SKILL_ATTRIBUTE_ABSORB,
        PAD_ENEMY_SKILL_BIND_LEADER_HELPER,
        PAD_ENEMY_SKILL_HEAL_PLAYER,
        PAD_ENEMY_SKILL_BLACK_FALL,
        PAD_ENEMY_SKILL_SOURCE_TO_POISON,
        PAD_ENEMY_SKILL_SOURCE_TO_MORTAL_POISON,
        PAD_ENEMY_SKILL_POISON_BLOCKS,
        PAD_ENEMY_SKILL_MORTAL_POISON_BLOCKS,
        PAD_ENEMY_SKILL_POISON_BLOCK_N_COUNTED,
        PAD_ENEMY_SKILL_MORTAL_POISON_BLOCK_N_COUNTED,
        PAD_ENEMY_SKILL_POISON_BLOCK_N,
        PAD_ENEMY_SKILL_HORIZONTAL_LINES,
        PAD_ENEMY_SKILL_HORIZONTAL_LINES_4,
        PAD_ENEMY_SKILL_VERTICAL_LINES,
        PAD_ENEMY_SKILL_VERTICAL_LINES_4,
        PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP,
        PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP_DIRECT,
        PAD_ENEMY_SKILL_MULTI_ATTACK,
        PAD_ENEMY_SKILL_POISON_MASK_SWAP,
        PAD_ENEMY_SKILL_POISON_MASK_SWAP_DIRECT,
        PAD_ENEMY_SKILL_BLOCK_MINUS,
        PAD_ENEMY_SKILL_BUR_DROP,
      ].includes(definition.effect.type) || !definition.effect.supported) {
        throw new Error(`PAD enemy AI skill ${slot.skillId} uses an unsupported condition/effect type.`);
      }
    }
    this.enemyAiPools[index] = {
      monster,
      definitions,
      definitionsById,
      aiBudget: monster.budgetCap,
      multiAttack: null,
    };
    if (this.enemies) this.applyEnemyPassiveSkills(index);
  }

  applyEnemyPassiveSkills(enemyIndex) {
    const index = Math.trunc(Number(enemyIndex));
    const enemy = this.enemies?.[index];
    if (!enemy) return;
    enemy.attributeResistPercentages = Array(5).fill(100);
    enemy.resolveThresholdPercent = 0;
    enemy.maxCounter = enemy.baseMaxCounter;
    enemy.turnChangeThresholdPercent = 0;
    enemy.turnChangeCounter = 0;
    enemy.turnChangeActive = false;
    const pool = this.enemyAiPools?.[index];
    if (!pool) return;
    for (const slot of pool.monster.slots) {
      const effect = pool.definitionsById.get(slot.skillId)?.effect;
      if (effect?.type === PAD_ENEMY_SKILL_ATTRIBUTE_RESIST) {
        for (let attributeIndex = 0; attributeIndex < 5; attributeIndex += 1) {
          if ((effect.attributeMask & (1 << attributeIndex)) !== 0) {
            enemy.attributeResistPercentages[attributeIndex] = effect.shieldPercent & 0xffff;
          }
        }
      }
      if (effect?.type === PAD_ENEMY_SKILL_RESOLVE) {
        enemy.resolveThresholdPercent = effect.hpThresholdPercent & 0xffff;
      }
      if (effect?.type === PAD_ENEMY_SKILL_TURN_CHANGE) {
        enemy.turnChangeThresholdPercent = effect.hpThresholdPercent;
        enemy.turnChangeCounter = effect.turnCounter;
      }
    }
    this.updateEnemyTurnChangePassive(enemy);
  }

  updateEnemyTurnChangePassive(enemy) {
    if (!enemy || enemy.turnChangeActive || !padEnemyTurnChangeTriggered(
      enemy.hp,
      enemy.maxHp,
      enemy.turnChangeThresholdPercent,
    )) return false;
    enemy.turnChangeActive = true;
    enemy.maxCounter = enemy.turnChangeCounter;
    enemy.counter = enemy.turnChangeCounter;
    return true;
  }

  setEnhancedFallAwakenings(counts) {
    if (!Array.isArray(counts) || counts.length !== 6 || counts.some((count) => (
      !Number.isInteger(Number(count)) || Number(count) < 0
    ))) throw new Error('PAD enhanced-fall awakenings must contain six nonnegative attribute counts.');
    this.enhancedFallAwakenings = counts.map((count) => Number(count));
  }

  setEnhancedFallModifier(modifier) {
    if (modifier === null || modifier === undefined) {
      this.enhancedFallModifier = null;
      return;
    }
    if (![modifier.chancePercent, modifier.weakeningPowerPercent].every((value) => Number.isInteger(Number(value)))) {
      throw new Error('PAD enhanced-fall modifier requires integer chancePercent and weakeningPowerPercent values.');
    }
    this.enhancedFallModifier = {
      active: modifier.active === undefined ? true : Boolean(modifier.active),
      chancePercent: (Number(modifier.chancePercent) << 16) >> 16,
      weakeningPowerPercent: Number(modifier.weakeningPowerPercent) & 0xffff,
    };
  }

  setLockFallRules(rules) {
    if (!Array.isArray(rules) || rules.length > 10 || rules.some((rule) => (
      !Number.isInteger(Number(rule?.typeMask)) || !Number.isInteger(Number(rule?.chancePercent))
    ))) throw new Error('PAD lock-fall rules must contain at most ten integer mask/percentage records.');
    this.lockFallRules = rules.map((rule) => ({
      typeMask: Number(rule.typeMask) & 0xffff,
      chancePercent: Number(rule.chancePercent),
      ...(rule.turnsRemaining == null
        ? {}
        : { turnsRemaining: Math.max(0, Math.trunc(Number(rule.turnsRemaining) || 0)) }),
      ...(rule.source == null ? {} : { source: String(rule.source) }),
    }));
  }

  setOrbState(row, column, state) {
    if (!this.isCell(row, column)) throw new Error(`Orb state cell ${row},${column} is outside the board.`);
    const orb = this.board[row][column];
    const thornPercent = state.thornPercent === undefined
      ? state.thornDescriptor === undefined
        ? orb.thornPercent
        : Math.max(0, Math.min(0xff, Math.trunc(Number(state.thornDescriptor) || 0))) & 0x7f
      : Math.max(0, Math.min(0x7f, Math.trunc(Number(state.thornPercent) || 0)));
    const descriptorHighBit = state.thornDescriptor === undefined
      ? (orb.thornDescriptor || 0) & 0x80
      : Math.max(0, Math.min(0xff, Math.trunc(Number(state.thornDescriptor) || 0))) & 0x80;
    const thornDescriptor = descriptorHighBit | thornPercent;
    const thornStateChanged = state.thornPercent !== undefined || state.thornDescriptor !== undefined;
    const sourceBlockFlags = state.blockFlags === undefined
      ? Number(orb.blockFlags) >>> 0
      : Number(state.blockFlags) >>> 0;
    let nail = state.nail === undefined
      ? state.blockFlags === undefined
        ? Boolean(orb.nail)
        : (sourceBlockFlags & PAD_BLOCK_NAIL_FLAG) !== 0
      : Boolean(state.nail);
    const entireBlind = state.entireBlind === undefined
      ? state.blind === false
        ? false
        : (sourceBlockFlags & PAD_BLOCK_ENTIRE_BLIND_FLAG) !== 0
      : Boolean(state.entireBlind);
    const blackFallBlind = state.blind === undefined
      ? (sourceBlockFlags & PAD_BLOCK_BLIND_FLAG) !== 0
      : Boolean(state.blind) && !entireBlind;
    const blind = entireBlind || blackFallBlind;
    const blackFallBlindFresh = blackFallBlind && (state.blindFresh === undefined
      ? state.blockFlags === undefined
        ? (sourceBlockFlags & PAD_BLOCK_BLIND_FRESH_FLAG) !== 0
        : (sourceBlockFlags & PAD_BLOCK_BLIND_FRESH_FLAG) !== 0
      : Boolean(state.blindFresh));
    const blindFresh = ((sourceBlockFlags & PAD_BLOCK_ENTIRE_BLIND_FRESH_FLAG) !== 0)
      || blackFallBlindFresh;
    const blindCountdown = blackFallBlind
      ? Math.max(0, Math.min(0x7f, Math.trunc(Number(
        state.blindCountdown === undefined ? orb.blindCountdown || 1 : state.blindCountdown,
      ) || 0)))
      : 0;
    const thornActive = state.thornActive === undefined
      ? thornStateChanged
        ? thornDescriptor !== 0
        : state.blockFlags === undefined
          ? Boolean(orb.thornActive)
          : (sourceBlockFlags & PAD_BLOCK_BURST_FLAG) !== 0
      : Boolean(state.thornActive);
    const specialType = ['jammer', 'poison', 'mortalPoison', 'bomb'].includes(orb.type);
    const locked = state.locked === undefined
      ? state.blockFlags === undefined
        ? orb.locked
        : (sourceBlockFlags & PAD_BLOCK_LOCKED_FLAG) !== 0
      : Boolean(state.locked);
    let blockFlags = (sourceBlockFlags
      & ~(PAD_BLOCK_ENTIRE_BLIND_FLAG | PAD_BLOCK_LOCKED_FLAG | PAD_BLOCK_BLIND_FLAG
        | PAD_BLOCK_BLIND_FRESH_FLAG | PAD_BLOCK_NAIL_FLAG | PAD_BLOCK_BURST_FLAG))
      | (entireBlind ? PAD_BLOCK_ENTIRE_BLIND_FLAG : 0)
      | (locked ? PAD_BLOCK_LOCKED_FLAG : 0)
      | (blackFallBlind ? PAD_BLOCK_BLIND_FLAG : 0)
      | (blackFallBlindFresh ? PAD_BLOCK_BLIND_FRESH_FLAG : 0)
      | (nail ? PAD_BLOCK_NAIL_FLAG : 0)
      | (thornActive ? PAD_BLOCK_BURST_FLAG : 0);
    if (specialType && blind) {
      blockFlags &= ~PAD_BLOCK_SPECIAL_LOCK_CLEAR_FLAGS;
      nail = false;
    }
    const currentEnhancementPower = normalizeEnhancementPower(
      orb.enhancementPower === undefined ? (orb.enhanced ? PAD_ENHANCED_ORB_BONUS : 0) : orb.enhancementPower,
    );
    const requestedEnhancementPower = state.enhancementPower !== undefined
      ? normalizeEnhancementPower(state.enhancementPower)
      : state.enhanced === undefined
        ? currentEnhancementPower
        : state.enhanced
          ? (currentEnhancementPower > 0
              ? currentEnhancementPower
              : normalizeEnhancementPower(PAD_ENHANCED_ORB_BONUS))
          : 0;
    const enhancementPower = specialType && (thornPercent > 0 || locked || blind)
      ? 0
      : requestedEnhancementPower;
    this.board[row][column] = {
      ...orb,
      enhancementPower,
      enhanced: enhancementPower > 0,
      blockFlags,
      locked,
      blind,
      blindFresh,
      blindCountdown,
      nail,
      thornActive,
      thornDescriptor,
      thornPercent,
    };
  }

  setBlockPowup(type, power) {
    const orbType = typeof type === 'number' ? ORB_TYPES[type]?.id : type;
    if (!NATURAL_ORB_TYPES.some((candidate) => candidate.id === orbType)) return 0;
    const requestedPower = normalizeEnhancementPower(power);
    let changed = 0;
    this.board.forEach((row) => row.forEach((orb) => {
      if (orb.type !== orbType || normalizeEnhancementPower(orb.enhancementPower) > requestedPower) return;
      orb.enhancementPower = requestedPower;
      orb.enhanced = requestedPower > 0;
      changed += 1;
    }));
    return changed;
  }

  hasBlockPowup(type) {
    const numericType = typeof type === 'number'
      ? Number(type) >>> 0
      : ORB_TYPES.findIndex((candidate) => candidate.id === type) >>> 0;
    if (numericType > 5) return true;
    const orbType = ORB_TYPES[numericType].id;
    return this.board.some((row) => row.some((orb) => (
      orb.type === orbType && normalizeEnhancementPower(orb.enhancementPower) <= 0
    )));
  }

  doBlockMinus(apply, typeMask, power, limit = 0) {
    const mask = Number(typeMask) >>> 0;
    const minusPower = Math.fround(-normalizeEnhancementPower(power));
    let candidates = [];
    this.board.forEach((row, rowIndex) => row.forEach((orb, columnIndex) => {
      const type = ORB_TYPES.findIndex((candidate) => candidate.id === orb.type);
      if (type >= 0 && (mask & (1 << type)) !== 0 && normalizeEnhancementPower(orb.enhancementPower) >= 0) {
        candidates.push({ row: rowIndex, column: columnIndex });
      }
    }));
    const capped = Math.trunc(Number(limit) || 0);
    if (capped > 0) candidates = this.rng.shuffleBlockMinusCandidates(candidates).slice(0, capped);
    if (apply) candidates.forEach(({ row, column }) => {
      const orb = this.board[row][column];
      orb.enhancementPower = minusPower;
      orb.enhanced = minusPower > 0;
    });
    return candidates.length;
  }

  doMakeBurDrop(apply, typeMask, count, descriptor, clearDescriptorHighBit = false) {
    const requested = Number(count) >>> 0;
    if (requested === 0) return 0;
    const mask = Number(typeMask) >>> 0;
    const candidates = [];
    this.board.forEach((row, rowIndex) => row.forEach((orb, columnIndex) => {
      const type = ORB_TYPES.findIndex((candidate) => candidate.id === orb.type);
      if (type >= 0 && (mask & (1 << type)) !== 0
        && ((Number(orb.blockFlags) >>> 0) & PAD_BLOCK_BURST_FLAG) === 0) {
        candidates.push({ row: rowIndex, column: columnIndex });
      }
    }));
    const selected = this.rng.shuffleBurDropCandidates(candidates).slice(0, requested);
    if (apply) {
      const thornDescriptor = (Math.trunc(Number(descriptor) || 0) & 0x7f)
        | (clearDescriptorHighBit ? 0 : 0x80);
      selected.forEach(({ row, column }) => {
        const orb = this.board[row][column];
        orb.blockFlags = (Number(orb.blockFlags) >>> 0) | PAD_BLOCK_BURST_FLAG;
        orb.thornActive = true;
        orb.thornDescriptor = thornDescriptor;
        orb.thornPercent = thornDescriptor & 0x7f;
      });
    }
    return selected.length;
  }

  doLockDropBits(typeMask, limit, seed) {
    const mask = Number(typeMask) >>> 0;
    const candidates = [];
    this.board.forEach((row, rowIndex) => row.forEach((orb, columnIndex) => {
      const type = ORB_TYPES.findIndex((candidate) => candidate.id === orb.type);
      if (type >= 0 && (mask & (1 << type)) !== 0
        && ((Number(orb.blockFlags) >>> 0) & PAD_BLOCK_LOCKED_FLAG) === 0) {
        candidates.push({ row: rowIndex, column: columnIndex, type });
      }
    }));
    if (candidates.length === 0) return false;
    const capped = Math.min(candidates.length, Math.trunc(Number(limit) || 0));
    const selected = padShuffleLockDropCandidates(seed, candidates).slice(0, Math.max(0, capped));
    selected.forEach(({ row, column, type }) => {
      const orb = this.board[row][column];
      orb.locked = true;
      orb.blockFlags = (Number(orb.blockFlags) >>> 0) | PAD_BLOCK_LOCKED_FLAG;
      if (type >= 6 && type <= 9) {
        orb.blockFlags &= ~PAD_BLOCK_SPECIAL_LOCK_CLEAR_FLAGS;
        orb.enhancementPower = 0;
        orb.enhanced = false;
      }
    });
    return true;
  }

  doPoisonBlockN(type, count, excludeHeart = false) {
    const destinationType = typeof type === 'number' ? ORB_TYPES[type]?.id : type;
    if (!['poison', 'mortalPoison'].includes(destinationType)) return 0;
    const boardTypes = this.board.map((row) => row.map((orb) => (
      ORB_TYPES.findIndex((candidate) => candidate.id === orb.type)
    )));
    const candidates = this.rng.selectPoisonBlockCandidates(boardTypes, count, excludeHeart);
    let changed = 0;
    candidates.forEach(({ row, column }) => {
      const orb = this.board[row][column];
      if (orb.locked) return;
      orb.type = destinationType;
      orb.enhancementPower = 0;
      orb.enhanced = false;
      changed += 1;
    });
    return changed;
  }

  doPoisonBlocks(type, count, excludeHeart = false) {
    const destinationType = typeof type === 'number' ? ORB_TYPES[type]?.id : type;
    if (!['poison', 'mortalPoison'].includes(destinationType)) return 0;
    const boardTypes = this.board.map((row) => row.map((orb) => (
      ORB_TYPES.findIndex((candidate) => candidate.id === orb.type)
    )));
    const selectedTypes = new Set(this.rng.selectPoisonBlockTypes(
      this.faceTypes,
      boardTypes,
      count,
      excludeHeart,
    ));
    let changed = 0;
    this.board.forEach((row) => row.forEach((orb) => {
      const sourceType = ORB_TYPES.findIndex((candidate) => candidate.id === orb.type);
      if (!selectedTypes.has(sourceType) || orb.locked) return;
      orb.type = destinationType;
      orb.enhancementPower = 0;
      orb.enhanced = false;
      changed += 1;
    }));
    return changed;
  }

  doPoisonBlockN2(
    perTypeCount,
    destinationTypeMask,
    excludedSourceTypeMask,
    dryRun = false,
    presentation = true,
    selectedRows = null,
    rng = this.rng,
  ) {
    const boardTypes = this.board.map((row) => row.map((orb) => (
      ORB_TYPES.findIndex((candidate) => candidate.id === orb.type)
    )));
    const selected = rng.selectMaskedBlockChanges(
      boardTypes,
      perTypeCount,
      destinationTypeMask,
      excludedSourceTypeMask,
      dryRun,
      selectedRows,
    );
    if (selectedRows !== null && selectedRows !== undefined && selected.selectedRows) {
      selected.selectedRows.forEach((rowBits, row) => {
        selectedRows[row] = rowBits;
      });
    }
    if (dryRun) return selected.candidateCount;
    selected.assignments.forEach(({ row, column, type }) => {
      const orb = this.board[row][column];
      if (orb.locked) return;
      orb.type = ORB_TYPES[type].id;
      if (type >= 6) {
        orb.enhancementPower = 0;
        orb.enhanced = false;
      }
    });
    // Native w5 only selects presentation/sound behavior. Keeping the argument
    // preserves the call shape while the deterministic browser model omits it.
    void presentation;
    return selected.assignments.length;
  }

  countBlockBits(typeMask) {
    return padCountBlockBits(this.board.map((row) => row.map((orb) => (
      ORB_TYPES.findIndex((candidate) => candidate.id === orb.type)
    ))), typeMask);
  }

  countNonPoisonBlocks(excludeHeart = false) {
    return padCountNonPoisonBlocks(this.board.map((row) => row.map((orb) => (
      ORB_TYPES.findIndex((candidate) => candidate.id === orb.type)
    ))), excludeHeart);
  }

  doBitReplace(selectedRows, destinationType, initialEffectFlags = 0, blockFlag = null) {
    const boardTypes = this.board.map((row) => row.map((orb) => (
      ORB_TYPES.findIndex((candidate) => candidate.id === orb.type)
    )));
    const lockedRows = this.board.map((row) => row.reduce((bits, orb, column) => (
      orb.locked ? bits | (1 << column) : bits
    ), 0));
    const resolved = this.rng.resolveBitReplacements(
      selectedRows,
      boardTypes,
      destinationType,
      lockedRows,
      initialEffectFlags,
    );
    const applied = padResolveBlockSwapPassive(resolved.assignments, initialEffectFlags, blockFlag);
    this.applyBlockSwapAssignments(applied.assignments);
    return applied.effectFlags;
  }

  // _doBlockSwap (0x6afa84) is the deterministic source-type writer used by
  // enemy skill types 56/58. Native source 7 or 8 denotes the whole poison
  // family; all other sources match exactly. Locked cells reject the write and
  // no LCG state is consumed.
  doBlockSwap(sourceType, destinationType, initialEffectFlags = 0, blockFlag = null) {
    const source = Math.trunc(Number(sourceType));
    const selectedRows = this.board.map((row) => row.reduce((bits, orb, column) => {
      const type = ORB_TYPES.findIndex((candidate) => candidate.id === orb.type);
      const matches = source === 7 || source === 8
        ? type === 7 || type === 8
        : type === source;
      return matches ? bits | (1 << column) : bits;
    }, 0));
    return this.doBitReplace(
      selectedRows,
      destinationType,
      initialEffectFlags,
      blockFlag,
    );
  }

  doBlockSwap5(sourceTypeMask, destinationTypeMask, initialEffectFlags = 0, blockFlag = null) {
    const destinationMask = Number(destinationTypeMask) & 0xffff;
    const destinationTypes = [];
    for (let type = 0; type <= 9; type += 1) {
      if ((destinationMask & (1 << type)) !== 0) destinationTypes.push(type);
    }
    return this.doBlockSwapTypes(destinationTypes, sourceTypeMask, initialEffectFlags, blockFlag);
  }

  doBlockSwap2(
    firstType,
    secondType = -1,
    thirdType = -1,
    fourthType = -1,
    initialEffectFlags = 0,
    blockFlag = null,
  ) {
    const destinationTypes = [];
    for (const value of [firstType, secondType, thirdType, fourthType]) {
      const type = Math.trunc(Number(value));
      if (type < 0) break;
      if (type <= 9) destinationTypes.push(type);
    }
    return this.doBlockSwapTypes(destinationTypes, 0, initialEffectFlags, blockFlag);
  }

  doBlockSwap3(skillTypes) {
    const destinationTypes = Array.isArray(skillTypes) ? skillTypes : skillTypes?.types;
    const boardTypes = this.board.map((row) => row.map((orb) => (
      ORB_TYPES.findIndex((candidate) => candidate.id === orb.type)
    )));
    const lockedRows = this.board.map((row) => row.reduce((bits, orb, column) => (
      orb.locked ? bits | (1 << column) : bits
    ), 0));
    const resolved = this.rng.resolveSkillBoardSwap(destinationTypes, boardTypes, lockedRows);
    resolved.assignments.forEach(({ row, column, type }) => {
      const orb = this.board[row][column];
      orb.type = ORB_TYPES[type].id;
      if (type >= 6) {
        orb.blockFlags = (Number(orb.blockFlags) >>> 0) & ~PAD_BLOCK_SPECIAL_LOCK_CLEAR_FLAGS;
        orb.enhancementPower = 0;
        orb.enhanced = false;
      }
    });
    return resolved.assignments.length;
  }

  doBlockSwapTypes(destinationTypes, sourceTypeMask, initialEffectFlags = 0, blockFlag = null) {
    if (destinationTypes.length === 0) return Number(initialEffectFlags) | 0;
    const boardTypes = this.board.map((row) => row.map((orb) => (
      ORB_TYPES.findIndex((candidate) => candidate.id === orb.type)
    )));
    const lockedRows = this.board.map((row) => row.reduce((bits, orb, column) => (
      orb.locked ? bits | (1 << column) : bits
    ), 0));
    const resolved = this.rng.resolveBlockSwapNew(
      destinationTypes,
      boardTypes,
      sourceTypeMask,
      lockedRows,
      initialEffectFlags,
    );
    const applied = padResolveBlockSwapPassive(resolved.assignments, initialEffectFlags, blockFlag);
    this.applyBlockSwapAssignments(applied.assignments);
    return applied.effectFlags;
  }

  applyBlockSwapAssignments(assignments) {
    assignments.forEach(({ row, column, type }) => {
      const orb = this.board[row][column];
      orb.type = ORB_TYPES[type].id;
      if (type >= 6) {
        orb.blockFlags = (Number(orb.blockFlags) >>> 0) & ~PAD_BLOCK_SPECIAL_LOCK_CLEAR_FLAGS;
        orb.enhancementPower = 0;
        orb.enhanced = false;
      }
    });
  }

  doBlockSwap4(destinationTypeMask, initialEffectFlags = 0, blockFlag = null) {
    return this.doBlockSwap5(0, destinationTypeMask, initialEffectFlags, blockFlag);
  }

  doBlockSwapV(columnMask, destinationTypeMask, initialEffectFlags = 0, blockFlag = null) {
    return this.doLineBlockSwap(columnMask, destinationTypeMask, 'vertical', initialEffectFlags, blockFlag);
  }

  doBlockSwapH(rowMask, destinationTypeMask, initialEffectFlags = 0, blockFlag = null) {
    return this.doLineBlockSwap(rowMask, destinationTypeMask, 'horizontal', initialEffectFlags, blockFlag);
  }

  doLineBlockSwap(lineMask, destinationTypeMask, orientation, initialEffectFlags, blockFlag) {
    if ((Number(lineMask) & 0xff) === 0) return 0;
    const boardTypes = this.board.map((row) => row.map((orb) => (
      ORB_TYPES.findIndex((candidate) => candidate.id === orb.type)
    )));
    const lockedRows = this.board.map((row) => row.reduce((bits, orb, column) => (
      orb.locked ? bits | (1 << column) : bits
    ), 0));
    const resolved = this.rng.resolveLineBlockSwaps(
      lineMask,
      destinationTypeMask,
      boardTypes,
      orientation,
      lockedRows,
      initialEffectFlags,
    );
    const applied = padResolveBlockSwapPassive(resolved.assignments, initialEffectFlags, blockFlag);
    this.applyBlockSwapAssignments(applied.assignments);
    return applied.effectFlags;
  }

  isCell(row, column) {
    return row >= 0 && row < this.rows && column >= 0 && column < this.columns;
  }

  isOrbSealed(row, column) {
    return this.isCell(row, column)
      && (
        this.orbSealColumnTurns > 0
          && (this.orbSealColumnMask & (1 << column)) !== 0
        || this.orbSealRowTurns > 0
          && (this.orbSealRowMask & (1 << row)) !== 0
      );
  }

  advanceOrbSealTurns() {
    if (this.orbSealColumnTurns > 0) {
      this.orbSealColumnTurns = Math.max(0, this.orbSealColumnTurns - 1);
      if (this.orbSealColumnTurns === 0) this.orbSealColumnMask = 0;
    }
    if (this.orbSealRowTurns > 0) {
      this.orbSealRowTurns = Math.max(0, this.orbSealRowTurns - 1);
      if (this.orbSealRowTurns === 0) this.orbSealRowMask = 0;
    }
  }

  advanceCloudTurns() {
    if (!this.cloud || this.cloud.turnsRemaining <= 0) return;
    this.cloud.turnsRemaining = Math.max(0, this.cloud.turnsRemaining - 1);
    if (this.cloud.turnsRemaining === 0) this.cloud = null;
  }

  advanceRecoveryDebuffTurns() {
    if (!this.recoveryDebuff || this.recoveryDebuff.turnsRemaining <= 0) return;
    this.recoveryDebuff.turnsRemaining = Math.max(0, this.recoveryDebuff.turnsRemaining - 1);
    if (this.recoveryDebuff.turnsRemaining === 0) this.recoveryDebuff = null;
  }

  advanceAttributeBlockTurns() {
    if (!this.attributeBlock || this.attributeBlock.turnsRemaining <= 0) return;
    this.attributeBlock.turnsRemaining = Math.max(0, this.attributeBlock.turnsRemaining - 1);
    if (this.attributeBlock.turnsRemaining === 0) this.attributeBlock = null;
  }

  snapshot() {
    return {
      coordinateSystem: `board origin top-left; rows 0-${this.rows - 1} downward; columns 0-${this.columns - 1} rightward`,
      boardDimensions: { rows: this.rows, columns: this.columns },
      moveAdjacency: this.allowDiagonalMoves ? 'eight-way' : 'orthogonal',
      mode: this.mode,
      phase: this.phase,
      turn: this.turn,
      rngState: this.rng.state,
      lockFallRngState: this.lockFallRng.state,
      faceTypes: [...this.faceTypes],
      dropRates: [...this.dropRates],
      skyfallRateRules: {
        natural: this.skyfallRateRules.natural ? { ...this.skyfallRateRules.natural } : null,
        hazard: this.skyfallRateRules.hazard ? { ...this.skyfallRateRules.hazard } : null,
      },
      skyfallExclusionMask: this.skyfallExclusionMask,
      comboDropChanceBasisPoints: this.comboDropChanceBasisPoints,
      comboDropCap: this.comboDropCap,
      comboDropAwakenings: [...this.comboDropAwakenings],
      pendingComboDrops: this.pendingComboDrops,
      comboDropBonusCount: this.comboDropBonusCount,
      turnNailCount: this.turnNailCount,
      topLineDropTypes: this.topLineDropTypes ? [...this.topLineDropTypes] : null,
      baseMoveTimeSeconds: this.baseMoveTime,
      moveTimeSeconds: this.moveTime,
      moveTimeReduction: this.moveTimeReduction ? { ...this.moveTimeReduction } : null,
      blackFallRule: this.blackFallRule ? { ...this.blackFallRule } : null,
      thornFallRule: this.thornFallRule ? { ...this.thornFallRule } : null,
      nailFallRule: this.nailFallRule ? { ...this.nailFallRule } : null,
      enhancedFallAwakenings: [...this.enhancedFallAwakenings],
      enhancedFallModifier: this.enhancedFallModifier ? { ...this.enhancedFallModifier } : null,
      passiveEnhancementFallsEnabled: this.passiveEnhancementFallsEnabled,
      lockFallRules: this.lockFallRules.map((rule) => ({ ...rule })),
      orbSealColumns: {
        positionMask: this.orbSealColumnMask,
        turnsRemaining: this.orbSealColumnTurns,
      },
      orbSealRows: {
        positionMask: this.orbSealRowMask,
        turnsRemaining: this.orbSealRowTurns,
      },
      forcedStart: this.forcedStart ? { ...this.forcedStart } : null,
      cloud: this.cloud ? { ...this.cloud } : null,
      recoveryDebuff: this.recoveryDebuff ? { ...this.recoveryDebuff } : null,
      attributeBlock: this.attributeBlock ? { ...this.attributeBlock } : null,
      board: this.board.map((row) => row.map((orb) => ORB_BY_ID[orb.type].code).join('')),
      boardState: this.board.map((row) => row.map((orb) => ({
        code: ORB_BY_ID[orb.type].code,
        blockFlags: orb.blockFlags,
        comboDrop: (orb.blockFlags & PAD_BLOCK_COMBO_DROP_FLAG) !== 0,
        entireBlind: (orb.blockFlags & PAD_BLOCK_ENTIRE_BLIND_FLAG) !== 0,
        blind: (orb.blockFlags & (PAD_BLOCK_ENTIRE_BLIND_FLAG | PAD_BLOCK_BLIND_FLAG)) !== 0,
        blindFresh: (orb.blockFlags & (
          PAD_BLOCK_ENTIRE_BLIND_FLAG | PAD_BLOCK_BLIND_FLAG
        )) !== 0 && (orb.blockFlags & (
          PAD_BLOCK_ENTIRE_BLIND_FRESH_FLAG | PAD_BLOCK_BLIND_FRESH_FLAG
        )) !== 0,
        blindCountdown: orb.blindCountdown,
        nail: (orb.blockFlags & PAD_BLOCK_NAIL_FLAG) !== 0,
        enhancementPower: orb.enhancementPower,
        enhanced: orb.enhanced,
        locked: orb.locked,
        thornActive: orb.thornActive,
        thornDescriptor: orb.thornDescriptor,
        thornPercent: orb.thornPercent,
      }))),
      drag: this.drag ? { row: this.drag.row, column: this.drag.column, remainingSeconds: Number(this.drag.remaining.toFixed(2)), pathLength: this.drag.pathLength } : null,
      comboCount: this.comboCount,
      turnMatches: this.turnMatches.map((match) => ({ ...match })),
      lastComboCount: this.lastComboCount,
      lastDamage: this.lastDamage,
      lastAbsorbedDamage: this.lastAbsorbedDamage,
      lastVoidedDamage: this.lastVoidedDamage,
      lastNailDamage: this.lastNailDamage,
      lastHealing: this.lastHealing,
      lastPoisonDamage: this.lastPoisonDamage,
      lastBombDamage: this.lastBombDamage,
      lastThornDamage: this.lastThornDamage,
      lastEnemySkill: this.lastEnemySkill ? { ...this.lastEnemySkill } : null,
      lastEnemyDeathAction: this.lastEnemyDeathAction ? {
        ...this.lastEnemyDeathAction,
        skill: { ...this.lastEnemyDeathAction.skill },
      } : null,
      lastEnemyActions: this.lastEnemyActions.map((action) => ({
        ...action,
        skill: action.skill ? { ...action.skill } : undefined,
      })),
      leaderPairMultiplier: this.lastLeaderMultiplier,
      leaderSwapTurns: this.leaderSwapTurns,
      leaderSwapIndex: this.leaderSwapIndex,
      nativePlayerBuffStatus: {
        auxiliaryTurns: this.playerAuxiliaryBuffTurns,
        attackBoostTurns: this.playerAttackBoostTurns,
      },
      player: { ...this.player },
      party: this.party.map(({ id, name, attribute, secondaryAttribute, tertiaryAttribute, secondaryAttributeChanged = false, attack, recovery, damageCap, helper = false, leaderSkill = null, present = true, bindTurns = 0, bindResist = false, superBindResist = false }) => ({
        id,
        name,
        attribute,
        secondaryAttribute,
        tertiaryAttribute,
        secondaryAttributeChanged,
        attack,
        recovery,
        damageCap,
        helper,
        leaderSkill,
        present,
        bindTurns,
        bindResist,
        superBindResist,
      })),
      targetEnemy: this.targetEnemy,
      manualTarget: this.manualTarget,
      enemies: this.enemies.map(({ id, name, attribute, hp, maxHp, counter, maxCounter, baseMaxCounter = maxCounter, deathResolved = false, escaped = false, scaledAttackGate = 0, attackBoostTurns = 0, attackBoostPercent = 100, defenseBoostTurns = 0, defenseBoostAmount = 0, attributeNullifyTurns = 0, attributeNullifyMask = 0, damagedTurnCount = 0, transientDebuffActive = false, statusShieldTurns = 0, attributeAbsorbTurns = 0, attributeAbsorbMask = 0, comboAbsorbTurns = 0, comboAbsorbThreshold = 0, damageAbsorbTurns = 0, damageAbsorbThreshold = 0, damageVoidTurns = 0, damageVoidThreshold = 0, damageShieldTurns = 0, damageShieldPercent = 0, attributeResistPercentages = [100, 100, 100, 100, 100], resolveThresholdPercent = 0, turnChangeThresholdPercent = 0, turnChangeCounter = 0, turnChangeActive = false }, index) => ({
        id,
        name,
        attribute,
        hp,
        maxHp,
        counter,
        maxCounter,
        baseMaxCounter,
        deathResolved,
        escaped,
        scaledAttackGate,
        attackBoostTurns,
        attackBoostPercent,
        defenseBoostTurns,
        defenseBoostAmount,
        attributeNullifyTurns,
        attributeNullifyMask,
        damagedTurnCount,
        transientDebuffActive,
        statusShieldTurns,
        attributeAbsorbTurns,
        attributeAbsorbMask,
        comboAbsorbTurns,
        comboAbsorbThreshold,
        damageAbsorbTurns,
        damageAbsorbThreshold,
        damageVoidTurns,
        damageVoidThreshold,
        damageShieldTurns,
        damageShieldPercent,
        attributeResistPercentages: [...attributeResistPercentages],
        resolveThresholdPercent,
        turnChangeThresholdPercent,
        turnChangeCounter,
        turnChangeActive,
        queuedEnemySkills: Math.max(
          0,
          (this.enemySkillQueues[index]?.records.length || 0) - (this.enemySkillQueues[index]?.position || 0),
        ),
        enemyAiBudget: this.enemyAiPools[index]?.aiBudget ?? null,
        enemyAiSkillSlots: this.enemyAiPools[index]?.monster.slots.length ?? 0,
      })),
      skillSealTurns: this.skillSealTurns,
      awakeningBindTurns: this.awakeningBindTurns,
      skill: {
        ...this.skill,
        sealed: this.skillSealTurns > 0,
        ready: this.skill.cooldown === 0 && this.skillSealTurns <= 0,
      },
      message: this.message,
    };
  }
}
