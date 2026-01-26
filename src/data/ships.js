// Ship girl data with leveling system
// Rarity: N (Normal), R (Rare), SR (Super Rare), SSR (Ultra Rare)

export const SHIP_TYPES = {
  DESTROYER: 'Destroyer',
  LIGHT_CRUISER: 'Light Cruiser',
  HEAVY_CRUISER: 'Heavy Cruiser',
  BATTLESHIP: 'Battleship',
  CARRIER: 'Carrier',
};

export const RARITY = {
  N: { name: 'Normal', color: 0x888888, weight: 60, stars: 1 },
  R: { name: 'Rare', color: 0x44aaff, weight: 30, stars: 2 },
  SR: { name: 'Super Rare', color: 0xaa44ff, weight: 8, stars: 3 },
  SSR: { name: 'Ultra Rare', color: 0xffaa00, weight: 2, stars: 4 },
};

// Base stats at level 1, stats grow with level
export const SHIPS = [
  // Normal Destroyers
  { id: 'dd_001', name: 'Fubuki', type: SHIP_TYPES.DESTROYER, rarity: 'N',
    baseHp: 15, baseAtk: 12, baseDef: 6, baseSpd: 35, baseEva: 45,
    growthHp: 0.5, growthAtk: 0.4, growthDef: 0.2, maxLevel: 70 },
  { id: 'dd_002', name: 'Shirayuki', type: SHIP_TYPES.DESTROYER, rarity: 'N',
    baseHp: 14, baseAtk: 13, baseDef: 5, baseSpd: 36, baseEva: 46,
    growthHp: 0.5, growthAtk: 0.4, growthDef: 0.2, maxLevel: 70 },
  { id: 'dd_003', name: 'Hatsuyuki', type: SHIP_TYPES.DESTROYER, rarity: 'N',
    baseHp: 15, baseAtk: 11, baseDef: 7, baseSpd: 34, baseEva: 44,
    growthHp: 0.5, growthAtk: 0.4, growthDef: 0.2, maxLevel: 70 },
  { id: 'dd_004', name: 'Mutsuki', type: SHIP_TYPES.DESTROYER, rarity: 'N',
    baseHp: 13, baseAtk: 10, baseDef: 6, baseSpd: 37, baseEva: 48,
    growthHp: 0.4, growthAtk: 0.35, growthDef: 0.2, maxLevel: 70 },
  { id: 'dd_005', name: 'Kisaragi', type: SHIP_TYPES.DESTROYER, rarity: 'N',
    baseHp: 14, baseAtk: 11, baseDef: 5, baseSpd: 36, baseEva: 47,
    growthHp: 0.45, growthAtk: 0.38, growthDef: 0.18, maxLevel: 70 },

  // Rare Destroyers
  { id: 'dd_006', name: 'Shimakaze', type: SHIP_TYPES.DESTROYER, rarity: 'R',
    baseHp: 18, baseAtk: 18, baseDef: 8, baseSpd: 45, baseEva: 55,
    growthHp: 0.6, growthAtk: 0.55, growthDef: 0.25, maxLevel: 80 },
  { id: 'dd_007', name: 'Yukikaze', type: SHIP_TYPES.DESTROYER, rarity: 'R',
    baseHp: 20, baseAtk: 16, baseDef: 10, baseSpd: 40, baseEva: 60,
    growthHp: 0.65, growthAtk: 0.5, growthDef: 0.3, maxLevel: 80 },

  // Normal Light Cruisers
  { id: 'cl_001', name: 'Tenryuu', type: SHIP_TYPES.LIGHT_CRUISER, rarity: 'N',
    baseHp: 25, baseAtk: 20, baseDef: 12, baseSpd: 28, baseEva: 35,
    growthHp: 0.7, growthAtk: 0.5, growthDef: 0.35, maxLevel: 70 },
  { id: 'cl_002', name: 'Tatsuta', type: SHIP_TYPES.LIGHT_CRUISER, rarity: 'N',
    baseHp: 24, baseAtk: 21, baseDef: 11, baseSpd: 29, baseEva: 36,
    growthHp: 0.68, growthAtk: 0.52, growthDef: 0.33, maxLevel: 70 },
  { id: 'cl_003', name: 'Kuma', type: SHIP_TYPES.LIGHT_CRUISER, rarity: 'N',
    baseHp: 26, baseAtk: 19, baseDef: 13, baseSpd: 27, baseEva: 34,
    growthHp: 0.72, growthAtk: 0.48, growthDef: 0.37, maxLevel: 70 },

  // Rare Heavy Cruisers
  { id: 'ca_001', name: 'Takao', type: SHIP_TYPES.HEAVY_CRUISER, rarity: 'R',
    baseHp: 35, baseAtk: 30, baseDef: 18, baseSpd: 30, baseEva: 28,
    growthHp: 0.9, growthAtk: 0.7, growthDef: 0.5, maxLevel: 80 },
  { id: 'ca_002', name: 'Atago', type: SHIP_TYPES.HEAVY_CRUISER, rarity: 'R',
    baseHp: 34, baseAtk: 32, baseDef: 17, baseSpd: 31, baseEva: 29,
    growthHp: 0.88, growthAtk: 0.72, growthDef: 0.48, maxLevel: 80 },

  // SR Heavy Cruiser
  { id: 'ca_003', name: 'Tone', type: SHIP_TYPES.HEAVY_CRUISER, rarity: 'SR',
    baseHp: 40, baseAtk: 35, baseDef: 22, baseSpd: 32, baseEva: 32,
    growthHp: 1.0, growthAtk: 0.8, growthDef: 0.6, maxLevel: 90 },

  // Rare Battleships
  { id: 'bb_001', name: 'Kongou', type: SHIP_TYPES.BATTLESHIP, rarity: 'R',
    baseHp: 55, baseAtk: 45, baseDef: 35, baseSpd: 22, baseEva: 18,
    growthHp: 1.2, growthAtk: 1.0, growthDef: 0.8, maxLevel: 80 },
  { id: 'bb_002', name: 'Hiei', type: SHIP_TYPES.BATTLESHIP, rarity: 'R',
    baseHp: 53, baseAtk: 47, baseDef: 33, baseSpd: 23, baseEva: 19,
    growthHp: 1.18, growthAtk: 1.02, growthDef: 0.78, maxLevel: 80 },
  { id: 'bb_003', name: 'Haruna', type: SHIP_TYPES.BATTLESHIP, rarity: 'R',
    baseHp: 57, baseAtk: 44, baseDef: 37, baseSpd: 21, baseEva: 17,
    growthHp: 1.22, growthAtk: 0.98, growthDef: 0.82, maxLevel: 80 },
  { id: 'bb_004', name: 'Kirishima', type: SHIP_TYPES.BATTLESHIP, rarity: 'R',
    baseHp: 54, baseAtk: 48, baseDef: 34, baseSpd: 22, baseEva: 18,
    growthHp: 1.2, growthAtk: 1.04, growthDef: 0.8, maxLevel: 80 },

  // SR Battleships
  { id: 'bb_005', name: 'Nagato', type: SHIP_TYPES.BATTLESHIP, rarity: 'SR',
    baseHp: 70, baseAtk: 60, baseDef: 45, baseSpd: 20, baseEva: 15,
    growthHp: 1.4, growthAtk: 1.2, growthDef: 1.0, maxLevel: 90 },
  { id: 'bb_006', name: 'Mutsu', type: SHIP_TYPES.BATTLESHIP, rarity: 'SR',
    baseHp: 68, baseAtk: 62, baseDef: 43, baseSpd: 21, baseEva: 16,
    growthHp: 1.38, growthAtk: 1.22, growthDef: 0.98, maxLevel: 90 },

  // SSR Battleships
  { id: 'bb_007', name: 'Yamato', type: SHIP_TYPES.BATTLESHIP, rarity: 'SSR',
    baseHp: 95, baseAtk: 85, baseDef: 60, baseSpd: 18, baseEva: 12,
    growthHp: 1.8, growthAtk: 1.5, growthDef: 1.3, maxLevel: 99 },
  { id: 'bb_008', name: 'Musashi', type: SHIP_TYPES.BATTLESHIP, rarity: 'SSR',
    baseHp: 93, baseAtk: 88, baseDef: 58, baseSpd: 19, baseEva: 13,
    growthHp: 1.78, growthAtk: 1.52, growthDef: 1.28, maxLevel: 99 },

  // Carriers
  { id: 'cv_001', name: 'Houshou', type: SHIP_TYPES.CARRIER, rarity: 'N',
    baseHp: 30, baseAtk: 25, baseDef: 15, baseSpd: 20, baseEva: 25,
    growthHp: 0.8, growthAtk: 0.6, growthDef: 0.4, maxLevel: 70 },
  { id: 'cv_002', name: 'Akagi', type: SHIP_TYPES.CARRIER, rarity: 'SR',
    baseHp: 55, baseAtk: 55, baseDef: 30, baseSpd: 25, baseEva: 22,
    growthHp: 1.3, growthAtk: 1.1, growthDef: 0.7, maxLevel: 90 },
  { id: 'cv_003', name: 'Kaga', type: SHIP_TYPES.CARRIER, rarity: 'SR',
    baseHp: 58, baseAtk: 52, baseDef: 33, baseSpd: 24, baseEva: 20,
    growthHp: 1.35, growthAtk: 1.05, growthDef: 0.75, maxLevel: 90 },
  { id: 'cv_004', name: 'Taihou', type: SHIP_TYPES.CARRIER, rarity: 'SSR',
    baseHp: 75, baseAtk: 72, baseDef: 55, baseSpd: 24, baseEva: 20,
    growthHp: 1.6, growthAtk: 1.4, growthDef: 1.1, maxLevel: 99 },
];

// Calculate XP needed for a level
export function getXpForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// Calculate total XP needed to reach a level
export function getTotalXpForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXpForLevel(i);
  }
  return total;
}

// Get ship stats at a specific level
export function getShipStats(shipData, level) {
  const lvl = level - 1; // Level 1 = base stats
  return {
    hp: Math.floor(shipData.baseHp + shipData.growthHp * lvl),
    attack: Math.floor(shipData.baseAtk + shipData.growthAtk * lvl),
    defense: Math.floor(shipData.baseDef + shipData.growthDef * lvl),
    speed: shipData.baseSpd,
    evasion: shipData.baseEva,
  };
}

// Get ship by ID
export function getShipById(id) {
  return SHIPS.find(ship => ship.id === id);
}

// Get all ships of a rarity
export function getShipsByRarity(rarity) {
  return SHIPS.filter(ship => ship.rarity === rarity);
}
