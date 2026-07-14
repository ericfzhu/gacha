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
  { id: 'dd_003', name: 'Hatsuyuki', type: SHIP_TYPES.DD, rarity: 'N', hp: 17, fp: 14, torp: 24, armor: 8, aa: 10, asw: 21, evasion: 30, speed: 43, maxFuel: 15, maxAmmo: 20 },
  { id: 'dd_004', name: 'Mutsuki', type: SHIP_TYPES.DD, rarity: 'N', hp: 16, fp: 12, torp: 26, armor: 7, aa: 9, asw: 23, evasion: 32, speed: 44, maxFuel: 15, maxAmmo: 18 },
  { id: 'dd_005', name: 'Kisaragi', type: SHIP_TYPES.DD, rarity: 'N', hp: 16, fp: 13, torp: 25, armor: 7, aa: 10, asw: 22, evasion: 31, speed: 44, maxFuel: 15, maxAmmo: 18 },
  { id: 'dd_006', name: 'Shimakaze', type: SHIP_TYPES.DD, rarity: 'SSR', hp: 24, fp: 26, torp: 42, armor: 13, aa: 18, asw: 25, evasion: 42, speed: 50, maxFuel: 20, maxAmmo: 25 },
  { id: 'dd_007', name: 'Yukikaze', type: SHIP_TYPES.DD, rarity: 'SSR', hp: 25, fp: 23, torp: 38, armor: 14, aa: 19, asw: 27, evasion: 45, speed: 47, maxFuel: 20, maxAmmo: 25 },
  { id: 'dd_008', name: 'Ayanami', type: SHIP_TYPES.DD, rarity: 'N', hp: 18, fp: 17, torp: 27, armor: 9, aa: 11, asw: 22, evasion: 31, speed: 44, maxFuel: 15, maxAmmo: 20 },
  { id: 'dd_009', name: 'Akatsuki', type: SHIP_TYPES.DD, rarity: 'N', hp: 18, fp: 16, torp: 27, armor: 9, aa: 12, asw: 22, evasion: 31, speed: 44, maxFuel: 15, maxAmmo: 20 },
  { id: 'dd_010', name: 'Hibiki', type: SHIP_TYPES.DD, rarity: 'R', hp: 21, fp: 19, torp: 31, armor: 11, aa: 15, asw: 26, evasion: 36, speed: 45, maxFuel: 18, maxAmmo: 22 },
  { id: 'dd_011', name: 'Shigure', type: SHIP_TYPES.DD, rarity: 'R', hp: 22, fp: 21, torp: 33, armor: 12, aa: 16, asw: 28, evasion: 39, speed: 46, maxFuel: 18, maxAmmo: 22 },
  { id: 'dd_012', name: 'Yuudachi', type: SHIP_TYPES.DD, rarity: 'R', hp: 22, fp: 26, torp: 35, armor: 11, aa: 15, asw: 26, evasion: 37, speed: 46, maxFuel: 18, maxAmmo: 24 },
  { id: 'cl_003', name: 'Kuma', type: SHIP_TYPES.CL, rarity: 'R', hp: 30, fp: 28, torp: 24, armor: 17, aa: 19, asw: 20, evasion: 23, speed: 35, maxFuel: 25, maxAmmo: 28 },
  { id: 'cl_004', name: 'Nagara', type: SHIP_TYPES.CL, rarity: 'R', hp: 30, fp: 29, torp: 25, armor: 17, aa: 20, asw: 21, evasion: 24, speed: 36, maxFuel: 25, maxAmmo: 28 },
  { id: 'cl_005', name: 'Sendai', type: SHIP_TYPES.CL, rarity: 'R', hp: 31, fp: 30, torp: 27, armor: 18, aa: 20, asw: 22, evasion: 25, speed: 36, maxFuel: 25, maxAmmo: 30 },
  { id: 'cl_006', name: 'Jintsuu', type: SHIP_TYPES.CL, rarity: 'N', hp: 28, fp: 26, torp: 23, armor: 15, aa: 17, asw: 19, evasion: 22, speed: 34, maxFuel: 25, maxAmmo: 26 },
  { id: 'cl_007', name: 'Naka', type: SHIP_TYPES.CL, rarity: 'N', hp: 27, fp: 25, torp: 22, armor: 15, aa: 18, asw: 20, evasion: 23, speed: 35, maxFuel: 25, maxAmmo: 26 },
  { id: 'cl_008', name: 'Yuubari', type: SHIP_TYPES.CL, rarity: 'SR', hp: 34, fp: 38, torp: 28, armor: 21, aa: 28, asw: 25, evasion: 28, speed: 38, maxFuel: 30, maxAmmo: 35 },
  { id: 'cl_009', name: 'Agano', type: SHIP_TYPES.CL, rarity: 'SR', hp: 38, fp: 36, torp: 30, armor: 23, aa: 30, asw: 24, evasion: 27, speed: 37, maxFuel: 35, maxAmmo: 40 },
  { id: 'cl_010', name: 'Yahagi', type: SHIP_TYPES.CL, rarity: 'SR', hp: 39, fp: 38, torp: 32, armor: 24, aa: 31, asw: 25, evasion: 29, speed: 38, maxFuel: 35, maxAmmo: 40 },
  { id: 'ca_003', name: 'Maya', type: SHIP_TYPES.CA, rarity: 'R', hp: 42, fp: 44, torp: 28, armor: 31, aa: 42, asw: 3, evasion: 18, speed: 28, maxFuel: 40, maxAmmo: 55 },
  { id: 'ca_004', name: 'Choukai', type: SHIP_TYPES.CA, rarity: 'N', hp: 39, fp: 39, torp: 26, armor: 28, aa: 29, asw: 3, evasion: 17, speed: 27, maxFuel: 40, maxAmmo: 50 },
  { id: 'ca_005', name: 'Tone', type: SHIP_TYPES.CA, rarity: 'SR', hp: 46, fp: 48, torp: 30, armor: 35, aa: 38, asw: 4, evasion: 20, speed: 29, maxFuel: 45, maxAmmo: 60 },
  { id: 'ca_006', name: 'Chikuma', type: SHIP_TYPES.CA, rarity: 'R', hp: 43, fp: 44, torp: 29, armor: 32, aa: 35, asw: 4, evasion: 19, speed: 29, maxFuel: 42, maxAmmo: 58 },
  { id: 'ca_007', name: 'Suzuya', type: SHIP_TYPES.CA, rarity: 'R', hp: 44, fp: 45, torp: 31, armor: 33, aa: 36, asw: 3, evasion: 20, speed: 30, maxFuel: 42, maxAmmo: 58 },
  { id: 'ca_008', name: 'Kumano', type: SHIP_TYPES.CA, rarity: 'R', hp: 44, fp: 44, torp: 31, armor: 34, aa: 36, asw: 3, evasion: 21, speed: 30, maxFuel: 42, maxAmmo: 58 },
  { id: 'bb_003', name: 'Haruna', type: SHIP_TYPES.BB, rarity: 'SR', hp: 66, fp: 75, torp: 0, armor: 61, aa: 46, asw: 0, evasion: 12, speed: 22, maxFuel: 90, maxAmmo: 110 },
  { id: 'bb_004', name: 'Kirishima', type: SHIP_TYPES.BB, rarity: 'SR', hp: 65, fp: 78, torp: 0, armor: 59, aa: 45, asw: 0, evasion: 12, speed: 22, maxFuel: 90, maxAmmo: 110 },
  { id: 'bb_005', name: 'Nagato', type: SHIP_TYPES.BB, rarity: 'SSR', hp: 80, fp: 92, torp: 0, armor: 78, aa: 57, asw: 0, evasion: 10, speed: 17, maxFuel: 110, maxAmmo: 140 },
  { id: 'bb_006', name: 'Mutsu', type: SHIP_TYPES.BB, rarity: 'SSR', hp: 78, fp: 94, torp: 0, armor: 76, aa: 56, asw: 0, evasion: 10, speed: 17, maxFuel: 110, maxAmmo: 140 },
  { id: 'bb_007', name: 'Yamato', type: SHIP_TYPES.BB, rarity: 'SSR', hp: 96, fp: 112, torp: 0, armor: 96, aa: 70, asw: 0, evasion: 8, speed: 15, maxFuel: 160, maxAmmo: 200 },
  { id: 'bb_008', name: 'Musashi', type: SHIP_TYPES.BB, rarity: 'SSR', hp: 94, fp: 115, torp: 0, armor: 94, aa: 68, asw: 0, evasion: 8, speed: 15, maxFuel: 160, maxAmmo: 200 },
  { id: 'cv_003', name: 'Souryuu', type: SHIP_TYPES.CV, rarity: 'SR', hp: 55, fp: 8, torp: 0, armor: 40, aa: 55, asw: 0, evasion: 16, speed: 27, maxFuel: 60, maxAmmo: 60 },
  { id: 'cv_004', name: 'Shoukaku', type: SHIP_TYPES.CV, rarity: 'SR', hp: 60, fp: 9, torp: 0, armor: 46, aa: 62, asw: 0, evasion: 17, speed: 27, maxFuel: 65, maxAmmo: 65 },
  { id: 'cv_005', name: 'Zuikaku', type: SHIP_TYPES.CV, rarity: 'SSR', hp: 65, fp: 10, torp: 0, armor: 50, aa: 68, asw: 0, evasion: 19, speed: 28, maxFuel: 70, maxAmmo: 70 },
  { id: 'cv_006', name: 'Akagi', type: SHIP_TYPES.CV, rarity: 'SSR', hp: 68, fp: 10, torp: 0, armor: 52, aa: 66, asw: 0, evasion: 15, speed: 25, maxFuel: 75, maxAmmo: 75 },
  { id: 'cv_007', name: 'Kaga', type: SHIP_TYPES.CV, rarity: 'SR', hp: 66, fp: 9, torp: 0, armor: 54, aa: 65, asw: 0, evasion: 14, speed: 24, maxFuel: 75, maxAmmo: 75 },
  { id: 'cv_008', name: 'Taihou', type: SHIP_TYPES.CV, rarity: 'SSR', hp: 76, fp: 12, torp: 0, armor: 66, aa: 74, asw: 0, evasion: 14, speed: 24, maxFuel: 85, maxAmmo: 80 },
  { id: 'cvl_001', name: 'Ryuujou', type: SHIP_TYPES.CV, rarity: 'R', hp: 40, fp: 6, torp: 0, armor: 29, aa: 43, asw: 0, evasion: 20, speed: 29, maxFuel: 40, maxAmmo: 40 },
  { id: 'cvl_002', name: 'Shouhou', type: SHIP_TYPES.CV, rarity: 'R', hp: 42, fp: 6, torp: 0, armor: 31, aa: 45, asw: 0, evasion: 19, speed: 28, maxFuel: 40, maxAmmo: 40 },
  { id: 'cvl_003', name: 'Zuihou', type: SHIP_TYPES.CV, rarity: 'SR', hp: 48, fp: 7, torp: 0, armor: 35, aa: 50, asw: 0, evasion: 22, speed: 29, maxFuel: 45, maxAmmo: 45 },
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

export const WORLD_NAMES = {
  1: 'Home Waters',
  2: 'Southwestern Isles',
  3: 'Northern Sea',
  4: 'Western Archipelago',
  5: 'Southern Front',
  6: 'Central Expanse',
};

const MAP_NAMES = [
  ['Patrol Waters', 'Coastal Defense', 'Convoy Passage', 'Home Sea Showdown'],
  ['Fleet Engagement', 'Island Interdiction', 'Trade Route Escort', 'Strait Breakthrough'],
  ['Frostline Patrol', 'Aurora Channel', 'Northern Anchorage', 'Ice Sea Pursuit'],
  ['Archipelago Sweep', 'Curry Sea Escort', 'Eastern Current', 'Western Sea Hunt'],
  ['Frontline Recon', 'Coral Approach', 'Night Passage', 'Southern Theater'],
  ['Submarine Corridor', 'Central Crossing', 'Aviation Gauntlet', 'Deep Sea Citadel'],
];

function enemyFleet(difficulty, boss = false) {
  const pools = difficulty <= 3
    ? ['e_dd_i', 'e_dd_ro', 'e_cl_ho']
    : difficulty <= 7
      ? ['e_dd_ro', 'e_cl_ho', 'e_ca_ri']
      : difficulty <= 12
        ? ['e_cl_ho', 'e_ca_ri', 'e_cv_wo']
        : difficulty <= 18
          ? ['e_ca_ri', 'e_cv_wo', 'e_bb_re']
          : ['e_bb_re', 'e_cv_wo', 'e_ca_ri'];
  const count = boss ? Math.min(4, 2 + Math.floor(difficulty / 8)) : Math.min(3, 1 + Math.floor(difficulty / 6));
  return Array.from({ length: count }, (_, index) => pools[(difficulty + index + (boss ? 1 : 0)) % pools.length]);
}

function makeMap(world, area) {
  const difficulty = (world - 1) * 4 + area;
  const resourceKeys = ['fuel', 'ammo', 'steel', 'bauxite'];
  const resourceKey = resourceKeys[(difficulty - 1) % resourceKeys.length];
  const resource = { [resourceKey]: 40 + difficulty * 8 };
  const splitOpening = area === 2 || area === 4;
  const upperResource = area % 2 === 1;
  return {
    id: `${world}-${area}`,
    world,
    worldName: WORLD_NAMES[world],
    name: MAP_NAMES[world - 1][area - 1],
    difficulty,
    baseExp: 55 + difficulty * 22,
    clearRewards: { fuel: 90 + difficulty * 18, ammo: 70 + difficulty * 16, steel: 40 + difficulty * 14, bauxite: 20 + difficulty * 9 },
    nodes: {
      start: { id: 'start', type: 'start', next: splitOpening ? ['A', 'B'] : ['A'] },
      A: { id: 'A', type: 'battle', enemies: enemyFleet(difficulty), next: splitOpening ? ['C'] : ['B', 'C'] },
      B: upperResource ? { id: 'B', type: 'resource', resource, next: ['boss'] } : { id: 'B', type: 'battle', enemies: enemyFleet(difficulty + 1), next: splitOpening ? ['C'] : ['boss'] },
      C: upperResource ? { id: 'C', type: 'battle', enemies: enemyFleet(difficulty + 1), next: ['boss'] } : { id: 'C', type: 'resource', resource, next: ['boss'] },
      boss: { id: 'boss', type: 'boss', enemies: enemyFleet(difficulty + 2, true), next: [] },
    },
  };
}

export const MAPS = Array.from({ length: 6 }, (_, worldIndex) => Array.from({ length: 4 }, (_, areaIndex) => makeMap(worldIndex + 1, areaIndex + 1))).flat();

export const SPECIAL_GACHA_PRIZES = [
  { key: 'prize1', name: import.meta.env?.VITE_PRIZE1_NAME || 'Gift Choice #1', description: import.meta.env?.VITE_PRIZE1_DESC || 'Your first special gift option.', rate: 2, tokenCost: 50 },
  { key: 'prize2', name: import.meta.env?.VITE_PRIZE2_NAME || 'Gift Choice #2', description: import.meta.env?.VITE_PRIZE2_DESC || 'Your second special gift option.', rate: 0.5, tokenCost: 100 },
  { key: 'prize3', name: import.meta.env?.VITE_PRIZE3_NAME || 'Gift Choice #3', description: import.meta.env?.VITE_PRIZE3_DESC || 'Your third special gift option.', rate: 0.2, tokenCost: 150 },
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
