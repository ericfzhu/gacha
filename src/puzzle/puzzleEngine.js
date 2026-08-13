import {
  PAD_BOARD_COLUMNS,
  PAD_BOARD_ROWS,
  PAD_DEFAULT_MOVE_TIME_SECONDS,
  findPadMatches,
  padAttributeMultiplier,
  padComboMultiplier,
  padMatchPower,
  tracePadDragCells,
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
]);

export const ORB_BY_ID = Object.freeze(Object.fromEntries(ORB_TYPES.map((orb) => [orb.id, orb])));
export const ORB_BY_CODE = Object.freeze(Object.fromEntries(ORB_TYPES.map((orb) => [orb.code, orb])));

const PARTY = Object.freeze([
  { id: 'ember', name: 'Ember', attribute: 'fire', attack: 890 },
  { id: 'marina', name: 'Marina', attribute: 'water', attack: 940 },
  { id: 'briar', name: 'Briar', attribute: 'wood', attack: 850 },
  { id: 'sol', name: 'Sol', attribute: 'light', attack: 910 },
  { id: 'nyx', name: 'Nyx', attribute: 'dark', attack: 900 },
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
  constructor({ seed = 21900, moveTime = PAD_DEFAULT_MOVE_TIME_SECONDS } = {}) {
    this.seed = seed;
    this.moveTime = moveTime;
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
    this.lastLeaderMultiplier = 1;
    this.message = 'Drag one orb through the board to rearrange the whole path.';
    this.player = { hp: 12000, maxHp: 12000, recovery: 820 };
    this.party = PARTY.map((member) => ({ ...member }));
    this.enemies = copyEnemies();
    this.targetEnemy = 0;
    this.skill = { name: 'Tide Shift', cooldown: 0, maxCooldown: 5 };
    this.drag = null;
    this.pendingMatches = [];
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

  createOrb(type) {
    return { id: ++this.orbSerial, type };
  }

  createStableBoard() {
    const board = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLUMNS).fill(null));
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let column = 0; column < BOARD_COLUMNS; column += 1) {
        const blocked = new Set();
        if (column >= 2 && board[row][column - 1]?.type === board[row][column - 2]?.type) blocked.add(board[row][column - 1].type);
        if (row >= 2 && board[row - 1][column]?.type === board[row - 2][column]?.type) blocked.add(board[row - 1][column].type);
        const choices = ORB_TYPES.map((orb) => orb.id).filter((type) => !blocked.has(type));
        const type = choices[Math.floor(this.rng() * choices.length)];
        board[row][column] = this.createOrb(type);
      }
    }
    return board;
  }

  startDrag(row, column, pointerX = 0, pointerY = 0) {
    if (this.mode !== 'playing' || this.phase !== 'input' || this.drag) return false;
    if (!this.isCell(row, column)) return false;
    this.drag = { row, column, pointerX, pointerY, remaining: this.moveTime, pathLength: 0 };
    this.message = 'Keep moving — every crossed cell swaps with the held orb.';
    return true;
  }

  moveDrag(row, column, pointerX = 0, pointerY = 0) {
    if (!this.drag) return false;
    this.drag.pointerX = pointerX;
    this.drag.pointerY = pointerY;
    if (!this.isCell(row, column) || (row === this.drag.row && column === this.drag.column)) return false;

    let fromRow = this.drag.row;
    let fromColumn = this.drag.column;
    for (const { row: nextRow, column: nextColumn } of tracePadDragCells(fromRow, fromColumn, row, column)) {
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
    this.drag = null;
    this.turn += 1;
    this.comboCount = 0;
    this.cascadeDepth = 0;
    this.turnMatches = [];
    this.pendingMatches = [];
    this.lastDamage = 0;
    this.lastHealing = 0;
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
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let column = 0; column < BOARD_COLUMNS; column += 1) {
        if (this.board[row][column].type !== 'water') candidates.push([row, column]);
      }
    }
    candidates.sort((a, b) => {
      const aPriority = this.board[a[0]][a[1]].type === 'wood' ? 0 : this.board[a[0]][a[1]].type === 'heart' ? 1 : 2;
      const bPriority = this.board[b[0]][b[1]].type === 'wood' ? 0 : this.board[b[0]][b[1]].type === 'heart' ? 1 : 2;
      return aPriority - bPriority || a[0] - b[0] || a[1] - b[1];
    });
    candidates.slice(0, 4).forEach(([row, column]) => { this.board[row][column] = this.createOrb('water'); });
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
      if (matches.length) {
        this.pendingMatches = matches;
        this.turnMatches.push(...matches.map((match) => ({ type: match.type, size: match.size, isMassAttack: match.isMassAttack })));
        this.comboCount += matches.length;
        this.cascadeDepth += 1;
        this.phase = 'clear';
        this.phaseTimer = 0.34;
        this.message = `${this.comboCount} combo${this.comboCount === 1 ? '' : 's'}${this.cascadeDepth > 1 ? ` · cascade ${this.cascadeDepth}` : ''}`;
      } else if (this.turnMatches.length) {
        this.resolvePlayerTurn();
        this.phase = 'attack';
        this.phaseTimer = 0.72;
      } else {
        this.phase = 'enemy';
        this.phaseTimer = 0.42;
        this.message = 'No match — the turn still advances.';
      }
      return;
    }
    if (this.phase === 'clear') {
      this.pendingMatches.forEach((match) => match.cells.forEach(({ row, column }) => { this.board[row][column] = null; }));
      this.pendingMatches = [];
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
    for (let column = 0; column < BOARD_COLUMNS; column += 1) {
      const survivors = [];
      for (let row = BOARD_ROWS - 1; row >= 0; row -= 1) if (this.board[row][column]) survivors.push(this.board[row][column]);
      for (let row = BOARD_ROWS - 1, index = 0; row >= 0; row -= 1, index += 1) {
        this.board[row][column] = survivors[index] || this.createOrb(ORB_TYPES[Math.floor(this.rng() * ORB_TYPES.length)].id);
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
      byType.get(match.type).push(match.size);
    });

    const heartMatches = byType.get('heart') || [];
    if (heartMatches.length) {
      const heartBase = padMatchPower(this.player.recovery, heartMatches);
      const healing = Math.floor(heartBase * comboMultiplier);
      const actual = Math.min(healing, this.player.maxHp - this.player.hp);
      this.player.hp += actual;
      this.lastHealing = actual;
      if (actual > 0) this.floatingText.push({ kind: 'heal', value: actual, enemy: -1, age: 0 });
    }

    let totalDamage = 0;
    const target = this.enemies[this.targetEnemy]?.hp > 0 ? this.targetEnemy : this.enemies.findIndex((enemy) => enemy.hp > 0);
    this.targetEnemy = Math.max(0, target);
    this.party.forEach((member) => {
      const sizes = byType.get(member.attribute) || [];
      if (!sizes.length) return;
      const matchAttack = padMatchPower(member.attack, sizes);
      const raw = matchAttack * comboMultiplier * leaderPair;
      const isMassAttack = sizes.some((size) => size >= 5);
      this.enemies.forEach((enemy, enemyIndex) => {
        if (enemy.hp <= 0 || (!isMassAttack && enemyIndex !== this.targetEnemy)) return;
        const damage = Math.max(1, Math.floor(raw * padAttributeMultiplier(member.attribute, enemy.attribute)) - enemy.defense);
        enemy.hp = Math.max(0, enemy.hp - damage);
        totalDamage += damage;
        this.floatingText.push({ kind: 'damage', value: damage, enemy: enemyIndex, attribute: member.attribute, age: 0 });
      });
    });
    this.lastDamage = totalDamage;
    this.message = `${this.comboCount} combo${this.comboCount === 1 ? '' : 's'} · ${totalDamage.toLocaleString()} total damage${this.lastHealing ? ` · +${this.lastHealing.toLocaleString()} HP` : ''}`;
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
    if (!Array.isArray(rows) || rows.length !== BOARD_ROWS || rows.some((row) => typeof row !== 'string' || row.length !== BOARD_COLUMNS)) throw new Error('Board must be five strings of six orb codes.');
    this.board = rows.map((row) => [...row].map((code) => {
      const type = ORB_BY_CODE[code]?.id;
      if (!type) throw new Error(`Unknown orb code: ${code}`);
      return this.createOrb(type);
    }));
  }

  isCell(row, column) {
    return row >= 0 && row < BOARD_ROWS && column >= 0 && column < BOARD_COLUMNS;
  }

  snapshot() {
    return {
      coordinateSystem: `board origin top-left; rows 0-${BOARD_ROWS - 1} downward; columns 0-${BOARD_COLUMNS - 1} rightward`,
      mode: this.mode,
      phase: this.phase,
      turn: this.turn,
      board: this.board.map((row) => row.map((orb) => ORB_BY_ID[orb.type].code).join('')),
      drag: this.drag ? { row: this.drag.row, column: this.drag.column, remainingSeconds: Number(this.drag.remaining.toFixed(2)), pathLength: this.drag.pathLength } : null,
      comboCount: this.comboCount,
      lastComboCount: this.lastComboCount,
      lastDamage: this.lastDamage,
      lastHealing: this.lastHealing,
      leaderPairMultiplier: this.lastLeaderMultiplier,
      player: { ...this.player },
      targetEnemy: this.targetEnemy,
      enemies: this.enemies.map(({ id, name, attribute, hp, maxHp, counter, maxCounter }) => ({ id, name, attribute, hp, maxHp, counter, maxCounter })),
      skill: { ...this.skill, ready: this.skill.cooldown === 0 },
      message: this.message,
    };
  }
}
