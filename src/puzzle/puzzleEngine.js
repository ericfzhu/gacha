import {
  PAD_BOARD_COLUMNS,
  PAD_BOARD_ROWS,
  PAD_DEFAULT_MOVE_TIME_SECONDS,
  findPadBombDetonations,
  findPadMatches,
  padApplyAttackMultipliers,
  padAttributeMultiplier,
  padBombDamage,
  padComboMultiplier,
  padDamageAfterDefense,
  padEnhancedOrbMultiplier,
  padNativeBaseAttackPower,
  padOrbMatchMultiplier,
  padPoisonDamage,
  padSecondaryAttributeAttack,
  padThornDamage,
  tracePadPointerCells,
} from './padCoreRules.js';

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

export const ORB_BY_ID = Object.freeze(Object.fromEntries(ORB_TYPES.map((orb) => [orb.id, orb])));
export const ORB_BY_CODE = Object.freeze(Object.fromEntries(ORB_TYPES.map((orb) => [orb.code, orb])));

const PARTY = Object.freeze([
  { id: 'ember', name: 'Ember', attribute: 'fire', secondaryAttribute: 'dark', attack: 890, recovery: 140 },
  { id: 'marina', name: 'Marina', attribute: 'water', secondaryAttribute: 'light', attack: 940, recovery: 155 },
  { id: 'briar', name: 'Briar', attribute: 'wood', secondaryAttribute: 'fire', attack: 850, recovery: 145 },
  { id: 'sol', name: 'Sol', attribute: 'light', secondaryAttribute: 'light', attack: 910, recovery: 130 },
  { id: 'nyx', name: 'Nyx', attribute: 'dark', secondaryAttribute: 'water', attack: 900, recovery: 120 },
  { id: 'helper', name: 'Helper', attribute: 'fire', secondaryAttribute: 'wood', attack: 980, recovery: 130, helper: true },
]);

const ENEMY_TEMPLATE = Object.freeze([
  { id: 'verdant-shell', name: 'Verdant Shell', attribute: 'wood', maxHp: 92000, defense: 120, attack: 1850, maxCounter: 2 },
  { id: 'umbra-eye', name: 'Umbra Eye', attribute: 'dark', maxHp: 76000, defense: 90, attack: 1450, maxCounter: 3 },
]);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function makeRng(seed) {
  let state = seed >>> 0 || 0x51f15e;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function copyEnemies() {
  return ENEMY_TEMPLATE.map((enemy) => ({ ...enemy, hp: enemy.maxHp, counter: enemy.maxCounter }));
}

function leaderMultiplier(combos) {
  if (combos >= 7) return 3.5;
  if (combos >= 4) return 2;
  return 1;
}

export class PuzzleEngine {
  constructor({
    seed = 21900,
    moveTime = PAD_DEFAULT_MOVE_TIME_SECONDS,
    columns = PAD_BOARD_COLUMNS,
    rows = PAD_BOARD_ROWS,
    allowDiagonalMoves = false,
  } = {}) {
    if (![columns, rows].every(Number.isInteger) || columns < 1 || columns > 15 || rows < 1 || rows > 15) {
      throw new Error('PAD board dimensions must be integers from 1 through 15.');
    }
    this.seed = seed;
    this.moveTime = moveTime;
    this.columns = columns;
    this.rows = rows;
    this.allowDiagonalMoves = Boolean(allowDiagonalMoves);
    this.rng = makeRng(seed);
    this.orbSerial = 0;
    this.visualTime = 0;
    this.reset();
  }

  reset() {
    this.rng = makeRng(this.seed);
    this.orbSerial = 0;
    this.mode = 'ready';
    this.phase = 'input';
    this.phaseTimer = 0;
    this.turn = 0;
    this.comboCount = 0;
    this.cascadeDepth = 0;
    this.lastComboCount = 0;
    this.lastDamage = 0;
    this.lastHealing = 0;
    this.lastPoisonDamage = 0;
    this.lastBombDamage = 0;
    this.lastThornDamage = 0;
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
    return { id: ++this.orbSerial, type, enhanced: false, locked: false, thornPercent: 0, ...state };
  }

  createStableBoard() {
    const board = Array.from({ length: this.rows }, () => Array(this.columns).fill(null));
    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        const blocked = new Set();
        if (column >= 2 && board[row][column - 1]?.type === board[row][column - 2]?.type) blocked.add(board[row][column - 1].type);
        if (row >= 2 && board[row - 1][column]?.type === board[row - 2][column]?.type) blocked.add(board[row - 1][column].type);
        const choices = NATURAL_ORB_TYPES.map((orb) => orb.id).filter((type) => !blocked.has(type));
        const type = choices[Math.floor(this.rng() * choices.length)];
        board[row][column] = this.createOrb(type);
      }
    }
    return board;
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
      if (crossedOrb.thornPercent > 0) {
        const damage = padThornDamage(this.player.maxHp, crossedOrb.thornPercent);
        this.lastThornDamage += damage;
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
    this.lastHealing = 0;
    this.lastPoisonDamage = 0;
    this.lastBombDamage = 0;
    this.phase = 'detect';
    this.phaseTimer = 0.12;
    this.message = 'Checking matches…';
    return true;
  }

  selectEnemy(index) {
    if (this.enemies[index]?.hp > 0) this.targetEnemy = index;
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
    const dt = clamp(Number(deltaSeconds) || 0, 0, 0.1);
    this.visualTime += dt;
    this.floatingText = this.floatingText.map((item) => ({ ...item, age: item.age + dt })).filter((item) => item.age < 1.15);

    if (this.mode !== 'playing') return;
    if (this.drag) {
      this.drag.remaining = Math.max(0, this.drag.remaining - dt);
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
        this.turnMatches.push(...matches.map((match) => ({
          type: match.type,
          size: match.size,
          enhancedCount: match.cells.reduce((count, { row, column }) => count + (this.board[row][column]?.enhanced ? 1 : 0), 0),
          isMassAttack: match.isMassAttack,
          isHorizontal: match.isHorizontal,
          isVertical: match.isVertical,
          isRow: match.isRow,
          isColumn: match.isColumn,
          isBox: match.isBox,
          isCross: match.isCross,
          isL: match.isL,
          cascadeDepth: this.cascadeDepth + 1,
        })));
        this.comboCount += matches.length;
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
    for (let column = 0; column < this.columns; column += 1) {
      const survivors = [];
      for (let row = this.rows - 1; row >= 0; row -= 1) if (this.board[row][column]) survivors.push(this.board[row][column]);
      for (let row = this.rows - 1, index = 0; row >= 0; row -= 1, index += 1) {
        this.board[row][column] = survivors[index] || this.createOrb(NATURAL_ORB_TYPES[Math.floor(this.rng() * NATURAL_ORB_TYPES.length)].id);
      }
    }
  }

  resolvePlayerTurn() {
    const comboMultiplier = padComboMultiplier(this.comboCount);
    const leader = leaderMultiplier(this.comboCount);
    const leaderPair = leader * leader;
    this.lastLeaderMultiplier = leaderPair;
    this.lastComboCount = this.comboCount;

    const byType = new Map();
    this.turnMatches.forEach((match) => {
      if (!byType.has(match.type)) byType.set(match.type, []);
      byType.get(match.type).push(match);
    });

    const heartMatches = byType.get('heart') || [];
    const healing = heartMatches.length
      ? Math.floor(heartMatches.reduce((total, match) => total +
        this.player.recovery * padOrbMatchMultiplier(match.size) * padEnhancedOrbMultiplier(match.enhancedCount), 0) * comboMultiplier)
      : 0;
    const poisonDamage = padPoisonDamage(
      this.player.maxHp,
      (byType.get('poison') || []).map((match) => match.size),
      (byType.get('mortalPoison') || []).map((match) => match.size),
    );
    this.applyPlayerHpResolution(healing, poisonDamage);

    let totalDamage = 0;
    const target = this.enemies[this.targetEnemy]?.hp > 0 ? this.targetEnemy : this.enemies.findIndex((enemy) => enemy.hp > 0);
    this.targetEnemy = Math.max(0, target);
    this.party.forEach((member) => {
      const attackLanes = [
        { attribute: member.attribute, attack: member.attack },
        {
          attribute: member.secondaryAttribute,
          attack: padSecondaryAttributeAttack(member.attack, member.attribute, member.secondaryAttribute),
        },
      ];
      attackLanes.forEach((lane) => {
        const matches = byType.get(lane.attribute) || [];
        if (!lane.attack || !matches.length) return;
        const matchAttack = padNativeBaseAttackPower(lane.attack, matches, this.comboCount);
        const raw = padApplyAttackMultipliers(matchAttack, [leader, leader]);
        const isMassAttack = matches.some((match) => match.size >= 5);
        this.enemies.forEach((enemy, enemyIndex) => {
          if (enemy.hp <= 0 || (!isMassAttack && enemyIndex !== this.targetEnemy)) return;
          const damage = padDamageAfterDefense(raw, padAttributeMultiplier(lane.attribute, enemy.attribute), enemy.defense);
          enemy.hp = Math.max(0, enemy.hp - damage);
          totalDamage += damage;
          this.floatingText.push({ kind: 'damage', value: damage, enemy: enemyIndex, attribute: lane.attribute, age: 0 });
        });
      });
    });
    this.lastDamage = totalDamage;
    this.message = `${this.comboCount} combo${this.comboCount === 1 ? '' : 's'} · ${totalDamage.toLocaleString()} total damage${this.lastHealing ? ` · +${this.lastHealing.toLocaleString()} HP` : ''}${this.lastPoisonDamage ? ` · -${this.lastPoisonDamage.toLocaleString()} poison` : ''}${this.lastBombDamage ? ` · -${this.lastBombDamage.toLocaleString()} bombs` : ''}${this.lastThornDamage ? ` · -${this.lastThornDamage.toLocaleString()} thorns` : ''}`;
  }

  applyPlayerHpResolution(healing = 0, poisonDamage = 0) {
    if (this.hpResolutionApplied) return;
    this.hpResolutionApplied = true;
    this.lastHealing = Math.max(0, Math.trunc(Number(healing) || 0));
    this.lastPoisonDamage = Math.max(0, Math.trunc(Number(poisonDamage) || 0));
    const pendingDamage = this.lastPoisonDamage + this.lastBombDamage + this.lastThornDamage;
    this.player.hp = clamp(this.player.hp + this.lastHealing - pendingDamage, 0, this.player.maxHp);
    if (this.lastHealing > 0) this.floatingText.push({ kind: 'heal', value: this.lastHealing, enemy: -1, age: 0 });
    if (this.lastPoisonDamage > 0) this.floatingText.push({ kind: 'poison', value: this.lastPoisonDamage, enemy: -1, age: 0 });
    if (this.lastBombDamage > 0) this.floatingText.push({ kind: 'bomb', value: this.lastBombDamage, enemy: -1, age: 0 });
    if (this.lastThornDamage > 0) this.floatingText.push({ kind: 'thorn', value: this.lastThornDamage, enemy: -1, age: 0 });
  }

  resolveEnemyTurn() {
    let total = 0;
    this.enemies.forEach((enemy, index) => {
      if (enemy.hp <= 0) return;
      enemy.counter -= 1;
      if (enemy.counter <= 0) {
        enemy.counter = enemy.maxCounter;
        total += enemy.attack;
        this.floatingText.push({ kind: 'enemy', value: enemy.attack, enemy: index, age: 0 });
      }
    });
    if (total) {
      this.player.hp = Math.max(0, this.player.hp - total);
      this.message = `Enemies attacked for ${total.toLocaleString()} damage.`;
    }
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

  setOrbState(row, column, state) {
    if (!this.isCell(row, column)) throw new Error(`Orb state cell ${row},${column} is outside the board.`);
    const orb = this.board[row][column];
    const thornPercent = state.thornPercent === undefined
      ? orb.thornPercent
      : Math.max(0, Math.min(0x7f, Math.trunc(Number(state.thornPercent) || 0)));
    const specialType = ['jammer', 'poison', 'mortalPoison', 'bomb'].includes(orb.type);
    this.board[row][column] = {
      ...orb,
      enhanced: thornPercent > 0 && specialType
        ? false
        : state.enhanced === undefined ? orb.enhanced : Boolean(state.enhanced),
      locked: state.locked === undefined ? orb.locked : Boolean(state.locked),
      thornPercent,
    };
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
      board: this.board.map((row) => row.map((orb) => ORB_BY_ID[orb.type].code).join('')),
      boardState: this.board.map((row) => row.map((orb) => ({
        code: ORB_BY_ID[orb.type].code,
        enhanced: orb.enhanced,
        locked: orb.locked,
        thornPercent: orb.thornPercent,
      }))),
      drag: this.drag ? { row: this.drag.row, column: this.drag.column, remainingSeconds: Number(this.drag.remaining.toFixed(2)), pathLength: this.drag.pathLength } : null,
      comboCount: this.comboCount,
      turnMatches: this.turnMatches.map((match) => ({ ...match })),
      lastComboCount: this.lastComboCount,
      lastDamage: this.lastDamage,
      lastHealing: this.lastHealing,
      lastPoisonDamage: this.lastPoisonDamage,
      lastBombDamage: this.lastBombDamage,
      lastThornDamage: this.lastThornDamage,
      leaderPairMultiplier: this.lastLeaderMultiplier,
      player: { ...this.player },
      party: this.party.map(({ id, name, attribute, secondaryAttribute, attack, recovery, helper = false }) => ({
        id,
        name,
        attribute,
        secondaryAttribute,
        attack,
        recovery,
        helper,
      })),
      targetEnemy: this.targetEnemy,
      enemies: this.enemies.map(({ id, name, attribute, hp, maxHp, counter, maxCounter }) => ({ id, name, attribute, hp, maxHp, counter, maxCounter })),
      skill: { ...this.skill, ready: this.skill.cooldown === 0 },
      message: this.message,
    };
  }
}
