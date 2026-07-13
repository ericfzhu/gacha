export const SHIP_TYPES = {
  DD: 'Destroyer',
  CL: 'Light Cruiser',
  CA: 'Heavy Cruiser',
  BB: 'Battleship',
  CV: 'Carrier',
};

export const SHIPS = [
  { id: 'dd_001', name: 'Vesper', type: SHIP_TYPES.DD, rarity: 'N', hp: 18, fp: 14, torp: 22, armor: 8, aa: 10, asw: 22, evasion: 28, speed: 42, maxFuel: 15, maxAmmo: 20 },
  { id: 'dd_002', name: 'Halcyon', type: SHIP_TYPES.DD, rarity: 'N', hp: 18, fp: 13, torp: 23, armor: 8, aa: 9, asw: 23, evasion: 29, speed: 42, maxFuel: 15, maxAmmo: 20 },
  { id: 'cl_001', name: 'Ardent', type: SHIP_TYPES.CL, rarity: 'R', hp: 26, fp: 24, torp: 20, armor: 14, aa: 16, asw: 16, evasion: 20, speed: 34, maxFuel: 25, maxAmmo: 25 },
  { id: 'cl_002', name: 'Meridian', type: SHIP_TYPES.CL, rarity: 'R', hp: 26, fp: 23, torp: 21, armor: 14, aa: 16, asw: 18, evasion: 21, speed: 34, maxFuel: 25, maxAmmo: 25 },
  { id: 'ca_001', name: 'Caldera', type: SHIP_TYPES.CA, rarity: 'SR', hp: 38, fp: 40, torp: 24, armor: 28, aa: 28, asw: 4, evasion: 16, speed: 26, maxFuel: 40, maxAmmo: 55 },
  { id: 'ca_002', name: 'Solace', type: SHIP_TYPES.CA, rarity: 'SR', hp: 40, fp: 42, torp: 26, armor: 30, aa: 30, asw: 2, evasion: 16, speed: 26, maxFuel: 40, maxAmmo: 55 },
  { id: 'bb_001', name: 'Aster Vale', type: SHIP_TYPES.BB, rarity: 'SSR', hp: 72, fp: 82, torp: 0, armor: 68, aa: 50, asw: 0, evasion: 10, speed: 18, maxFuel: 100, maxAmmo: 120 },
  { id: 'bb_002', name: 'Ironwood', type: SHIP_TYPES.BB, rarity: 'SSR', hp: 70, fp: 80, torp: 0, armor: 66, aa: 48, asw: 0, evasion: 10, speed: 18, maxFuel: 100, maxAmmo: 120 },
  { id: 'cv_001', name: 'Northwind', type: SHIP_TYPES.CV, rarity: 'SSR', hp: 62, fp: 0, torp: 0, armor: 48, aa: 62, asw: 0, evasion: 14, speed: 24, maxFuel: 70, maxAmmo: 70 },
  { id: 'cv_002', name: 'Pelagos', type: SHIP_TYPES.CV, rarity: 'SSR', hp: 64, fp: 0, torp: 0, armor: 50, aa: 64, asw: 0, evasion: 13, speed: 24, maxFuel: 70, maxAmmo: 70 },
];

export const ENEMIES = [
  { id: 'e_dd_i', name: 'Enemy I-class DD', type: SHIP_TYPES.DD, hp: 16, fp: 10, torp: 18, armor: 6, aa: 5, evasion: 18, speed: 35 },
  { id: 'e_dd_ro', name: 'Enemy Ro-class DD', type: SHIP_TYPES.DD, hp: 20, fp: 14, torp: 20, armor: 9, aa: 8, evasion: 17, speed: 34 },
  { id: 'e_cl_ho', name: 'Enemy Ho-class CL', type: SHIP_TYPES.CL, hp: 28, fp: 22, torp: 15, armor: 14, aa: 14, evasion: 12, speed: 28 },
  { id: 'e_ca_ri', name: 'Enemy Ri-class CA', type: SHIP_TYPES.CA, hp: 40, fp: 35, torp: 20, armor: 26, aa: 22, evasion: 10, speed: 23 },
  { id: 'e_bb_re', name: 'Enemy Re-class BB', type: SHIP_TYPES.BB, hp: 88, fp: 95, torp: 0, armor: 82, aa: 45, evasion: 8, speed: 14 },
  { id: 'e_cv_wo', name: 'Enemy Wo-class CV', type: SHIP_TYPES.CV, hp: 70, fp: 0, torp: 0, armor: 52, aa: 48, evasion: 10, speed: 20 },
];

export const FORMATIONS = {
  LINE_AHEAD: { id: 'LINE_AHEAD', name: 'Line Ahead', attack: 1.1, defense: 0.9, evasion: 1.0 },
  DOUBLE_LINE: { id: 'DOUBLE_LINE', name: 'Double Line', attack: 0.95, defense: 1.05, evasion: 1.0 },
  DIAMOND: { id: 'DIAMOND', name: 'Diamond', attack: 0.9, defense: 1.0, evasion: 1.15 },
  ECHELON: { id: 'ECHELON', name: 'Echelon', attack: 0.85, defense: 1.0, evasion: 1.2 },
};

export const MAPS = [
  {
    id: '1-1',
    name: 'Patrol Waters',
    baseExp: 70,
    clearRewards: { fuel: 120, ammo: 80, steel: 40, bauxite: 20 },
    nodes: {
      start: { id: 'start', type: 'start', next: ['A'] },
      A: { id: 'A', type: 'battle', enemies: ['e_dd_i', 'e_dd_i'], next: ['B', 'C'] },
      B: { id: 'B', type: 'resource', resource: { fuel: 60 }, next: ['boss'] },
      C: { id: 'C', type: 'battle', enemies: ['e_dd_ro', 'e_cl_ho'], next: ['boss'] },
      boss: { id: 'boss', type: 'boss', enemies: ['e_cl_ho', 'e_ca_ri'], next: [] },
    },
  },
  {
    id: '1-2',
    name: 'Coastal Defense',
    baseExp: 95,
    clearRewards: { fuel: 140, ammo: 100, steel: 80, bauxite: 40 },
    nodes: {
      start: { id: 'start', type: 'start', next: ['A', 'B'] },
      A: { id: 'A', type: 'battle', enemies: ['e_dd_ro', 'e_cl_ho'], next: ['C'] },
      B: { id: 'B', type: 'battle', enemies: ['e_dd_i', 'e_dd_ro', 'e_cl_ho'], next: ['C'] },
      C: { id: 'C', type: 'resource', resource: { ammo: 70 }, next: ['boss'] },
      boss: { id: 'boss', type: 'boss', enemies: ['e_ca_ri', 'e_cv_wo'], next: [] },
    },
  },
  {
    id: '2-1',
    name: 'Fleet Engagement',
    baseExp: 140,
    clearRewards: { fuel: 170, ammo: 130, steel: 130, bauxite: 80 },
    nodes: {
      start: { id: 'start', type: 'start', next: ['A'] },
      A: { id: 'A', type: 'battle', enemies: ['e_cl_ho', 'e_ca_ri'], next: ['B', 'C'] },
      B: { id: 'B', type: 'battle', enemies: ['e_ca_ri', 'e_cv_wo'], next: ['boss'] },
      C: { id: 'C', type: 'resource', resource: { steel: 100 }, next: ['boss'] },
      boss: { id: 'boss', type: 'boss', enemies: ['e_bb_re', 'e_cv_wo'], next: [] },
    },
  },
];

export const QUESTS = [
  {
    id: 'daily_sortie_3',
    name: 'Daily Sortie Exercise',
    type: 'daily',
    objective: { kind: 'sorties', target: 3 },
    rewards: { fuel: 120, ammo: 120, steel: 60, bauxite: 30 },
  },
  {
    id: 'daily_battle_5',
    name: 'Daily Combat Patrol',
    type: 'daily',
    objective: { kind: 'battles', target: 5 },
    rewards: { fuel: 80, ammo: 80, steel: 80, bauxite: 50 },
  },
  {
    id: 'weekly_boss_3',
    name: 'Weekly Boss Hunt',
    type: 'weekly',
    objective: { kind: 'bossWins', target: 3 },
    rewards: { fuel: 300, ammo: 300, steel: 260, bauxite: 180 },
  },
  {
    id: 'one_time_first_clear',
    name: 'First Sea Clear',
    type: 'oneTime',
    objective: { kind: 'mapClears', target: 1 },
    rewards: { fuel: 300, ammo: 300, steel: 300, bauxite: 300 },
  },
];

export const EXPEDITIONS = [
  {
    id: 'exp_1',
    name: 'Short Patrol',
    durationMin: 15,
    requirements: { minShips: 2 },
    rewards: { fuel: 80, ammo: 40, steel: 20, bauxite: 10 },
  },
  {
    id: 'exp_2',
    name: 'Supply Run',
    durationMin: 45,
    requirements: { minShips: 4 },
    rewards: { fuel: 120, ammo: 120, steel: 80, bauxite: 40 },
  },
  {
    id: 'exp_3',
    name: 'Long Maritime Recon',
    durationMin: 120,
    requirements: { minShips: 6 },
    rewards: { fuel: 220, ammo: 160, steel: 150, bauxite: 120 },
  },
];
