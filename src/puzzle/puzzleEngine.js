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
  padNativeBaseAttackPower,
  padNativeRecoveryPower,
  padNailDamage,
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
  PAD_ENEMY_SKILL_BLACK_FALL,
  PAD_ENEMY_SKILL_HORIZONTAL_LINES,
  PAD_ENEMY_SKILL_HORIZONTAL_LINES_4,
  PAD_ENEMY_SKILL_VERTICAL_LINES,
  PAD_ENEMY_SKILL_VERTICAL_LINES_4,
  PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP,
  PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP_DIRECT,
  PAD_ENEMY_SKILL_BLOCK_MINUS,
  PAD_ENEMY_SKILL_BUR_DROP,
  decodePadEnemySkillDefinition,
  decodePadEnemySkillRuntime,
  normalizePadEnemySkillRecord,
  padEnemySkillAttack,
} from './padEnemySkills.js';
import {
  decodePadEnemyAiMonsterDefinition,
  decodePadEnemyAiSkillDefinition,
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
const PAD_BLOCK_BLIND_FLAG = 0x1000;
const PAD_BLOCK_COMBO_DROP_FLAG = 0x8000;
const PAD_BLOCK_BLIND_FRESH_FLAG = 0x10000;
const PAD_BLOCK_NAIL_FLAG = 0x20000;
const PAD_BLOCK_SPECIAL_LOCK_CLEAR_FLAGS = 0x28000;
const PAD_BLOCK_BURST_FLAG = 0x80000;

export const ORB_BY_ID = Object.freeze(Object.fromEntries(ORB_TYPES.map((orb) => [orb.id, orb])));
export const ORB_BY_CODE = Object.freeze(Object.fromEntries(ORB_TYPES.map((orb) => [orb.code, orb])));

const DEMO_COMBO_LEADER = Object.freeze({
  type: 'comboAttack',
  thresholds: Object.freeze([
    Object.freeze({ combos: 4, multiplier: 2 }),
    Object.freeze({ combos: 7, multiplier: 3.5 }),
  ]),
});

const PARTY = Object.freeze([
  { id: 'ember', name: 'Ember', attribute: 'fire', secondaryAttribute: 'dark', attack: 890, recovery: 140, leaderSkill: DEMO_COMBO_LEADER },
  { id: 'marina', name: 'Marina', attribute: 'water', secondaryAttribute: 'light', attack: 940, recovery: 155 },
  { id: 'briar', name: 'Briar', attribute: 'wood', secondaryAttribute: 'fire', attack: 850, recovery: 145 },
  { id: 'sol', name: 'Sol', attribute: 'light', secondaryAttribute: 'light', attack: 910, recovery: 130 },
  { id: 'nyx', name: 'Nyx', attribute: 'dark', secondaryAttribute: 'water', attack: 900, recovery: 120 },
  { id: 'helper', name: 'Helper', attribute: 'fire', secondaryAttribute: 'wood', tertiaryAttribute: 'light', attack: 980, recovery: 130, helper: true, leaderSkill: DEMO_COMBO_LEADER },
]);

const ENEMY_TEMPLATE = Object.freeze([
  { id: 'verdant-shell', name: 'Verdant Shell', attribute: 'wood', maxHp: 92000, defense: 120, attack: 1850, maxCounter: 2 },
  { id: 'umbra-eye', name: 'Umbra Eye', attribute: 'dark', maxHp: 76000, defense: 90, attack: 1450, maxCounter: 3 },
]);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeEnhancementPower(value) {
  const numeric = Number(value);
  return Math.fround(Number.isFinite(numeric) ? numeric : 0);
}

function copyEnemies() {
  return ENEMY_TEMPLATE.map((enemy) => ({ ...enemy, hp: enemy.maxHp, counter: enemy.maxCounter }));
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
  } = {}) {
    if (![columns, rows].every(Number.isInteger) || columns < 1 || columns > 15 || rows < 1 || rows > 15) {
      throw new Error('PAD board dimensions must be integers from 1 through 15.');
    }
    this.seed = seed;
    this.moveTime = moveTime;
    this.columns = columns;
    this.rows = rows;
    this.allowDiagonalMoves = Boolean(allowDiagonalMoves);
    this.setFaceTypes(faceTypes);
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
    this.turn = 0;
    this.comboCount = 0;
    this.cascadeDepth = 0;
    this.lastComboCount = 0;
    this.lastDamage = 0;
    this.lastNailDamage = 0;
    this.lastHealing = 0;
    this.lastPoisonDamage = 0;
    this.lastBombDamage = 0;
    this.lastThornDamage = 0;
    this.lastEnemySkill = null;
    this.lastEnemyActions = [];
    this.enemySkillQueues.forEach((queue) => { queue.position = 0; });
    this.enemyAiPools.forEach((pool) => {
      if (pool) pool.aiBudget = pool.monster.budgetCap;
    });
    this.pendingComboDrops = 0;
    this.comboDropBonusCount = 0;
    this.turnNailCount = 0;
    this.hpResolutionApplied = false;
    this.lastLeaderMultiplier = 1;
    this.message = 'Drag one orb through the board to rearrange the whole path.';
    this.party = PARTY.map((member) => ({ ...member }));
    this.player = {
      hp: 12000,
      maxHp: 12000,
      recovery: this.party.reduce((total, member) => total + member.recovery, 0),
    };
    this.enemies = copyEnemies();
    this.targetEnemy = 0;
    this.manualTarget = false;
    this.skill = { name: 'Tide Shift', cooldown: 0, maxCooldown: 5 };
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
    const blind = state.blind === undefined
      ? (requestedBlockFlags & PAD_BLOCK_BLIND_FLAG) !== 0
      : Boolean(state.blind);
    const blindFresh = blind && (state.blindFresh === undefined
      ? (requestedBlockFlags & PAD_BLOCK_BLIND_FRESH_FLAG) !== 0
      : Boolean(state.blindFresh));
    const blindCountdown = blind
      ? Math.max(0, Math.min(0x7f, Math.trunc(Number(state.blindCountdown) || 1)))
      : 0;
    let blockFlags = (requestedBlockFlags
      & ~(PAD_BLOCK_LOCKED_FLAG | PAD_BLOCK_BLIND_FLAG | PAD_BLOCK_COMBO_DROP_FLAG
        | PAD_BLOCK_BLIND_FRESH_FLAG | PAD_BLOCK_NAIL_FLAG | PAD_BLOCK_BURST_FLAG))
      | (locked ? PAD_BLOCK_LOCKED_FLAG : 0)
      | (blind ? PAD_BLOCK_BLIND_FLAG : 0)
      | ((requestedBlockFlags & PAD_BLOCK_COMBO_DROP_FLAG) !== 0 ? PAD_BLOCK_COMBO_DROP_FLAG : 0)
      | (blindFresh ? PAD_BLOCK_BLIND_FRESH_FLAG : 0)
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
    if (!this.isCell(row, column)) return false;
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
    this.drag.gridColumn = Math.max(0, Math.min(this.columns - Number.EPSILON * this.columns, gridColumn));
    this.drag.gridRow = Math.max(0, Math.min(this.rows - Number.EPSILON * this.rows, gridRow));
    if (!path.length) return false;
    for (const { row: nextRow, column: nextColumn } of path) {
      const crossedOrb = this.board[nextRow][nextColumn];
      if (crossedOrb.thornActive && crossedOrb.thornPercent > 0) {
        const damage = padThornDamage(this.player.maxHp, crossedOrb.thornPercent);
        this.lastThornDamage = Math.min(PAD_INT32_MAX, this.lastThornDamage + damage);
      }
      [this.board[fromRow][fromColumn], this.board[nextRow][nextColumn]] = [this.board[nextRow][nextColumn], this.board[fromRow][fromColumn]];
      fromRow = nextRow;
      fromColumn = nextColumn;
      this.drag.pathLength += 1;
    }
    this.drag.row = fromRow;
    this.drag.column = fromColumn;
    return true;
  }

  endDrag() {
    if (!this.drag) return false;
    // Native _gamePhaseMove ends the move whenever sPAD+0xb2 is no longer the
    // active-touch value 1. Its swap counter only drives movement effects, so
    // releasing the selected orb without crossing a cell still spends a turn.
    this.drag = null;
    this.turn += 1;
    this.comboCount = 0;
    this.cascadeDepth = 0;
    this.turnMatches = [];
    this.pendingMatches = [];
    this.pendingBombCells = [];
    this.lastDamage = 0;
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
      const damage = padDamageAfterDefense(
        attack,
        attributeMultiplier,
        enemy.defense,
        damageCap,
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
    if (this.mode !== 'playing' || this.phase !== 'input' || this.drag || this.skill.cooldown > 0) return false;
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
      const bombResolution = findPadBombDetonations(this.board, matches);
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
        const comboDropAwakening = padResolveComboDropAwakenings(matches, this.comboDropAwakenings);
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
      if (this.enemies.every((enemy) => enemy.hp <= 0)) {
        this.mode = 'victory';
        this.phase = 'complete';
        this.message = `Victory in ${this.turn} turn${this.turn === 1 ? '' : 's'}!`;
        return;
      }
      this.phase = 'enemy';
      this.phaseTimer = 0.46;
      return;
    }
    if (this.phase === 'enemy') {
      this.resolveEnemyTurn();
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
  }

  findMatches() {
    return findPadMatches(this.board);
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
        this.enhancedFallAwakenings,
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
    const leader = padComboLeaderMultiplier(this.comboCount, this.party[0]?.leaderSkill);
    const helper = padComboLeaderMultiplier(this.comboCount, this.party[5]?.leaderSkill);
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
      ? this.party.map((member) => member.recovery)
      : [this.player.recovery];
    const extraComboBonus = this.allowDiagonalMoves ? 0.5 : 0.25;
    const healing = padNativeRecoveryPower(recoveryLanes, heartMatches, this.comboCount, extraComboBonus);
    const poisonDamage = padPoisonDamage(
      this.player.maxHp,
      (byType.get('poison') || []).map((match) => match.size),
      (byType.get('mortalPoison') || []).map((match) => match.size),
    );
    this.applyPlayerHpResolution(healing, poisonDamage);

    let totalDamage = 0;
    const attackRounds = [
      (member) => ({ attribute: member.attribute, attack: member.attack }),
      (member) => ({
        attribute: member.tertiaryAttribute,
        attack: padTertiaryAttributeAttack(member.attack, member.tertiaryAttribute),
      }),
      (member) => ({
        attribute: member.secondaryAttribute,
        attack: padSecondaryAttributeAttack(
          member.attack,
          member.attribute,
          member.secondaryAttribute,
          member.secondaryAttributeChanged,
        ),
      }),
    ];
    attackRounds.forEach((getLane) => {
      this.party.forEach((member) => {
        const lane = getLane(member);
        const matches = byType.get(lane.attribute) || [];
        if (!lane.attack || !matches.length) return;
        const matchAttack = padNativeBaseAttackPower(lane.attack, matches, this.comboCount, extraComboBonus);
        const raw = padApplyAttackMultipliers(matchAttack, [leader, helper]);
        const isMassAttack = matches.some((match) => match.size >= 5);
        const target = isMassAttack ? -1 : this.chooseAttackTarget(lane.attribute, raw, member.damageCap);
        this.enemies.forEach((enemy, enemyIndex) => {
          if (enemy.hp <= 0 || (!isMassAttack && enemyIndex !== target)) return;
          const damage = padDamageAfterDefense(
            raw,
            padAttributeMultiplier(lane.attribute, enemy.attribute),
            enemy.defense,
            member.damageCap,
          );
          enemy.hp = Math.max(0, enemy.hp - damage);
          totalDamage += damage;
          this.floatingText.push({ kind: 'damage', value: damage, enemy: enemyIndex, attribute: lane.attribute, age: 0 });
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
    this.lastDamage = totalDamage + nailDamage;
    this.message = `${this.comboCount} combo${this.comboCount === 1 ? '' : 's'} · ${this.lastDamage.toLocaleString()} total damage${this.lastNailDamage ? ` · ${this.lastNailDamage.toLocaleString()} nails` : ''}${this.lastHealing ? ` · +${this.lastHealing.toLocaleString()} HP` : ''}${this.lastPoisonDamage ? ` · -${this.lastPoisonDamage.toLocaleString()} poison` : ''}${this.lastBombDamage ? ` · -${this.lastBombDamage.toLocaleString()} bombs` : ''}${this.lastThornDamage ? ` · -${this.lastThornDamage.toLocaleString()} thorns` : ''}`;
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
    // Native _incEneTurn advances existing statuses before _setupEnemyAttack
    // admits monsters whose sMONSTER+0x120 counter has reached zero. Keeping
    // this order prevents a newly executed enemy skill from losing a turn
    // immediately on the same action boundary.
    this.advanceBlackOrbCountdowns();
    if (this.blackFallRule?.active && this.blackFallRule.turnsRemaining !== null) {
      this.blackFallRule.turnsRemaining = Math.max(0, this.blackFallRule.turnsRemaining - 1);
      if (this.blackFallRule.turnsRemaining === 0) this.blackFallRule.active = false;
    }
    this.enemies.forEach((enemy, index) => {
      if (enemy.hp <= 0) return;
      enemy.counter -= 1;
      if (enemy.counter <= 0) {
        enemy.counter = enemy.maxCounter;
        const skill = this.takeEnemySkill(index);
        if (skill) {
          this.applyEnemySkillRecord(skill);
          const damage = padEnemySkillAttack(enemy.attack, skill.attackWithSkillValue);
          total += damage;
          this.lastEnemyActions.push({
            enemy: index,
            kind: 'skill',
            skill: { ...skill },
            ...(damage > 0 ? { damage } : {}),
          });
          if (damage > 0) {
            this.floatingText.push({ kind: 'enemy', value: damage, enemy: index, age: 0 });
          }
          return;
        }
        total += enemy.attack;
        this.lastEnemyActions.push({ enemy: index, kind: 'attack', damage: enemy.attack });
        this.floatingText.push({ kind: 'enemy', value: enemy.attack, enemy: index, age: 0 });
      }
    });
    if (total) {
      this.player.hp = Math.max(0, this.player.hp - total);
      this.message = `Enemies attacked for ${total.toLocaleString()} damage.`;
    }
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
        return skill;
      }
    }
    const pool = this.enemyAiPools[enemyIndex];
    if (!pool) return null;
    const enemy = this.enemies[enemyIndex];
    const selection = selectPadEnemyAiNew(pool.monster, pool.definitions, {
      currentHp: enemy.hp,
      maxHp: enemy.maxHp,
      aiBudget: pool.aiBudget,
      blackFallActive: Boolean(this.blackFallRule?.active),
      rngState: this.rng.state,
      evaluateCondition: (definition, rngState) => {
        this.rng.setState(rngState);
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
        return { eligible: false, rngState: this.rng.state };
      },
    });
    this.rng.setState(selection.rngState);
    pool.aiBudget = selection.aiBudget;
    return selection.effect ? { ...selection.effect, skillId: selection.skillId } : null;
  }

  advanceBlackOrbCountdowns() {
    this.board.forEach((row) => row.forEach((orb) => {
      if (!orb.blind) return;
      if (orb.blindFresh) {
        orb.blindFresh = false;
        orb.blockFlags = (Number(orb.blockFlags) >>> 0) & ~PAD_BLOCK_BLIND_FRESH_FLAG;
        return;
      }
      orb.blindCountdown = Math.max(0, Math.trunc(Number(orb.blindCountdown) || 0) - 1);
      if (orb.blindCountdown === 0) {
        orb.blind = false;
        orb.blockFlags = (Number(orb.blockFlags) >>> 0) & ~PAD_BLOCK_BLIND_FLAG;
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
    this.dropRates = Array.from({ length: 10 }, (_, index) => Math.fround(Number(rates[index]) || 0));
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

  applyEnemySkillRecord(record) {
    const skill = normalizePadEnemySkillRecord(record);
    this.lastEnemySkill = skill;
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
        PAD_ENEMY_SKILL_BLACK_FALL,
        PAD_ENEMY_SKILL_HORIZONTAL_LINES,
        PAD_ENEMY_SKILL_HORIZONTAL_LINES_4,
        PAD_ENEMY_SKILL_VERTICAL_LINES,
        PAD_ENEMY_SKILL_VERTICAL_LINES_4,
        PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP,
        PAD_ENEMY_SKILL_POISON_TYPE_LIST_SWAP_DIRECT,
        PAD_ENEMY_SKILL_BLOCK_MINUS,
        PAD_ENEMY_SKILL_BUR_DROP,
      ].includes(definition.effect.type) || !definition.effect.supported) {
        throw new Error(`PAD enemy AI skill ${slot.skillId} uses an unsupported condition/effect type.`);
      }
    }
    this.enemyAiPools[index] = {
      monster,
      definitions,
      aiBudget: monster.budgetCap,
    };
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
    const blind = state.blind === undefined
      ? state.blockFlags === undefined
        ? Boolean(orb.blind)
        : (sourceBlockFlags & PAD_BLOCK_BLIND_FLAG) !== 0
      : Boolean(state.blind);
    const blindFresh = blind && (state.blindFresh === undefined
      ? state.blockFlags === undefined
        ? Boolean(orb.blindFresh)
        : (sourceBlockFlags & PAD_BLOCK_BLIND_FRESH_FLAG) !== 0
      : Boolean(state.blindFresh));
    const blindCountdown = blind
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
      & ~(PAD_BLOCK_LOCKED_FLAG | PAD_BLOCK_BLIND_FLAG | PAD_BLOCK_BLIND_FRESH_FLAG
        | PAD_BLOCK_NAIL_FLAG | PAD_BLOCK_BURST_FLAG))
      | (locked ? PAD_BLOCK_LOCKED_FLAG : 0)
      | (blind ? PAD_BLOCK_BLIND_FLAG : 0)
      | (blindFresh ? PAD_BLOCK_BLIND_FRESH_FLAG : 0)
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
  ) {
    const boardTypes = this.board.map((row) => row.map((orb) => (
      ORB_TYPES.findIndex((candidate) => candidate.id === orb.type)
    )));
    const selected = this.rng.selectMaskedBlockChanges(
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
      skyfallExclusionMask: this.skyfallExclusionMask,
      comboDropChanceBasisPoints: this.comboDropChanceBasisPoints,
      comboDropCap: this.comboDropCap,
      comboDropAwakenings: [...this.comboDropAwakenings],
      pendingComboDrops: this.pendingComboDrops,
      comboDropBonusCount: this.comboDropBonusCount,
      turnNailCount: this.turnNailCount,
      topLineDropTypes: this.topLineDropTypes ? [...this.topLineDropTypes] : null,
      blackFallRule: this.blackFallRule ? { ...this.blackFallRule } : null,
      thornFallRule: this.thornFallRule ? { ...this.thornFallRule } : null,
      nailFallRule: this.nailFallRule ? { ...this.nailFallRule } : null,
      enhancedFallAwakenings: [...this.enhancedFallAwakenings],
      enhancedFallModifier: this.enhancedFallModifier ? { ...this.enhancedFallModifier } : null,
      passiveEnhancementFallsEnabled: this.passiveEnhancementFallsEnabled,
      lockFallRules: this.lockFallRules.map((rule) => ({ ...rule })),
      board: this.board.map((row) => row.map((orb) => ORB_BY_ID[orb.type].code).join('')),
      boardState: this.board.map((row) => row.map((orb) => ({
        code: ORB_BY_ID[orb.type].code,
        blockFlags: orb.blockFlags,
        comboDrop: (orb.blockFlags & PAD_BLOCK_COMBO_DROP_FLAG) !== 0,
        blind: (orb.blockFlags & PAD_BLOCK_BLIND_FLAG) !== 0,
        blindFresh: (orb.blockFlags & PAD_BLOCK_BLIND_FRESH_FLAG) !== 0,
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
      lastNailDamage: this.lastNailDamage,
      lastHealing: this.lastHealing,
      lastPoisonDamage: this.lastPoisonDamage,
      lastBombDamage: this.lastBombDamage,
      lastThornDamage: this.lastThornDamage,
      lastEnemySkill: this.lastEnemySkill ? { ...this.lastEnemySkill } : null,
      lastEnemyActions: this.lastEnemyActions.map((action) => ({
        ...action,
        skill: action.skill ? { ...action.skill } : undefined,
      })),
      leaderPairMultiplier: this.lastLeaderMultiplier,
      player: { ...this.player },
      party: this.party.map(({ id, name, attribute, secondaryAttribute, tertiaryAttribute, secondaryAttributeChanged = false, attack, recovery, damageCap, helper = false, leaderSkill = null }) => ({
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
      })),
      targetEnemy: this.targetEnemy,
      manualTarget: this.manualTarget,
      enemies: this.enemies.map(({ id, name, attribute, hp, maxHp, counter, maxCounter }, index) => ({
        id,
        name,
        attribute,
        hp,
        maxHp,
        counter,
        maxCounter,
        queuedEnemySkills: Math.max(
          0,
          (this.enemySkillQueues[index]?.records.length || 0) - (this.enemySkillQueues[index]?.position || 0),
        ),
        enemyAiBudget: this.enemyAiPools[index]?.aiBudget ?? null,
        enemyAiSkillSlots: this.enemyAiPools[index]?.monster.slots.length ?? 0,
      })),
      skill: { ...this.skill, ready: this.skill.cooldown === 0 },
      message: this.message,
    };
  }
}
