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
    growthHp: 0.5, growthAtk: 0.4, growthDef: 0.2, maxLevel: 70,
    slotCount: 2, baseLuck: 10 },
  { id: 'dd_002', name: 'Shirayuki', type: SHIP_TYPES.DESTROYER, rarity: 'N',
    baseHp: 14, baseAtk: 13, baseDef: 5, baseSpd: 36, baseEva: 46,
    growthHp: 0.5, growthAtk: 0.4, growthDef: 0.2, maxLevel: 70,
    slotCount: 2, baseLuck: 10 },
  { id: 'dd_003', name: 'Hatsuyuki', type: SHIP_TYPES.DESTROYER, rarity: 'N',
    baseHp: 15, baseAtk: 11, baseDef: 7, baseSpd: 34, baseEva: 44,
    growthHp: 0.5, growthAtk: 0.4, growthDef: 0.2, maxLevel: 70,
    slotCount: 2, baseLuck: 10 },
  { id: 'dd_004', name: 'Mutsuki', type: SHIP_TYPES.DESTROYER, rarity: 'N',
    baseHp: 13, baseAtk: 10, baseDef: 6, baseSpd: 37, baseEva: 48,
    growthHp: 0.4, growthAtk: 0.35, growthDef: 0.2, maxLevel: 70,
    slotCount: 2, baseLuck: 12 },
  { id: 'dd_005', name: 'Kisaragi', type: SHIP_TYPES.DESTROYER, rarity: 'N',
    baseHp: 14, baseAtk: 11, baseDef: 5, baseSpd: 36, baseEva: 47,
    growthHp: 0.45, growthAtk: 0.38, growthDef: 0.18, maxLevel: 70,
    slotCount: 2, baseLuck: 11 },

  // SSR Destroyers
  { id: 'dd_006', name: 'Shimakaze', type: SHIP_TYPES.DESTROYER, rarity: 'SSR',
    baseHp: 22, baseAtk: 24, baseDef: 10, baseSpd: 48, baseEva: 60,
    growthHp: 0.75, growthAtk: 0.7, growthDef: 0.35, maxLevel: 99,
    slotCount: 2, baseLuck: 20 },
  { id: 'dd_007', name: 'Yukikaze', type: SHIP_TYPES.DESTROYER, rarity: 'SSR',
    baseHp: 24, baseAtk: 20, baseDef: 12, baseSpd: 42, baseEva: 65,
    growthHp: 0.8, growthAtk: 0.6, growthDef: 0.4, maxLevel: 99,
    slotCount: 2, baseLuck: 60 },
  { id: 'dd_008', name: 'Ayanami', type: SHIP_TYPES.DESTROYER, rarity: 'N',
    baseHp: 15, baseAtk: 14, baseDef: 6, baseSpd: 36, baseEva: 46,
    growthHp: 0.5, growthAtk: 0.45, growthDef: 0.2, maxLevel: 70,
    slotCount: 2, baseLuck: 12 },
  { id: 'dd_009', name: 'Akatsuki', type: SHIP_TYPES.DESTROYER, rarity: 'N',
    baseHp: 14, baseAtk: 13, baseDef: 6, baseSpd: 35, baseEva: 45,
    growthHp: 0.48, growthAtk: 0.42, growthDef: 0.2, maxLevel: 70,
    slotCount: 2, baseLuck: 10 },

  // Rare Destroyers
  { id: 'dd_010', name: 'Hibiki', type: SHIP_TYPES.DESTROYER, rarity: 'R',
    baseHp: 18, baseAtk: 15, baseDef: 9, baseSpd: 40, baseEva: 56,
    growthHp: 0.6, growthAtk: 0.48, growthDef: 0.28, maxLevel: 80,
    slotCount: 2, baseLuck: 20 },
  { id: 'dd_011', name: 'Shigure', type: SHIP_TYPES.DESTROYER, rarity: 'R',
    baseHp: 19, baseAtk: 18, baseDef: 10, baseSpd: 42, baseEva: 58,
    growthHp: 0.62, growthAtk: 0.55, growthDef: 0.3, maxLevel: 80,
    slotCount: 2, baseLuck: 50 },
  { id: 'dd_012', name: 'Yuudachi', type: SHIP_TYPES.DESTROYER, rarity: 'R',
    baseHp: 18, baseAtk: 22, baseDef: 8, baseSpd: 44, baseEva: 55,
    growthHp: 0.58, growthAtk: 0.62, growthDef: 0.25, maxLevel: 80,
    slotCount: 2, baseLuck: 20 },

  // Normal Light Cruisers
  { id: 'cl_001', name: 'Tenryuu', type: SHIP_TYPES.LIGHT_CRUISER, rarity: 'N',
    baseHp: 25, baseAtk: 20, baseDef: 12, baseSpd: 28, baseEva: 35,
    growthHp: 0.7, growthAtk: 0.5, growthDef: 0.35, maxLevel: 70,
    slotCount: 2, baseLuck: 15 },
  { id: 'cl_002', name: 'Tatsuta', type: SHIP_TYPES.LIGHT_CRUISER, rarity: 'N',
    baseHp: 24, baseAtk: 21, baseDef: 11, baseSpd: 29, baseEva: 36,
    growthHp: 0.68, growthAtk: 0.52, growthDef: 0.33, maxLevel: 70,
    slotCount: 2, baseLuck: 15 },
  { id: 'cl_006', name: 'Jintsuu', type: SHIP_TYPES.LIGHT_CRUISER, rarity: 'N',
    baseHp: 26, baseAtk: 22, baseDef: 12, baseSpd: 30, baseEva: 36,
    growthHp: 0.7, growthAtk: 0.52, growthDef: 0.35, maxLevel: 70,
    slotCount: 2, baseLuck: 14 },
  { id: 'cl_007', name: 'Naka', type: SHIP_TYPES.LIGHT_CRUISER, rarity: 'N',
    baseHp: 25, baseAtk: 21, baseDef: 11, baseSpd: 31, baseEva: 37,
    growthHp: 0.68, growthAtk: 0.5, growthDef: 0.33, maxLevel: 70,
    slotCount: 2, baseLuck: 12 },

  // Rare Light Cruisers
  { id: 'cl_003', name: 'Kuma', type: SHIP_TYPES.LIGHT_CRUISER, rarity: 'R',
    baseHp: 30, baseAtk: 24, baseDef: 15, baseSpd: 30, baseEva: 38,
    growthHp: 0.78, growthAtk: 0.58, growthDef: 0.4, maxLevel: 80,
    slotCount: 2, baseLuck: 16 },
  { id: 'cl_004', name: 'Nagara', type: SHIP_TYPES.LIGHT_CRUISER, rarity: 'R',
    baseHp: 29, baseAtk: 25, baseDef: 14, baseSpd: 31, baseEva: 39,
    growthHp: 0.76, growthAtk: 0.6, growthDef: 0.38, maxLevel: 80,
    slotCount: 2, baseLuck: 18 },
  { id: 'cl_005', name: 'Sendai', type: SHIP_TYPES.LIGHT_CRUISER, rarity: 'R',
    baseHp: 28, baseAtk: 26, baseDef: 14, baseSpd: 32, baseEva: 40,
    growthHp: 0.75, growthAtk: 0.62, growthDef: 0.38, maxLevel: 80,
    slotCount: 2, baseLuck: 20 },
  // SR Light Cruisers
  { id: 'cl_008', name: 'Yuubari', type: SHIP_TYPES.LIGHT_CRUISER, rarity: 'SR',
    baseHp: 30, baseAtk: 34, baseDef: 16, baseSpd: 35, baseEva: 46,
    growthHp: 0.85, growthAtk: 0.8, growthDef: 0.45, maxLevel: 90,
    slotCount: 2, baseLuck: 25 },
  { id: 'cl_009', name: 'Agano', type: SHIP_TYPES.LIGHT_CRUISER, rarity: 'SR',
    baseHp: 35, baseAtk: 32, baseDef: 18, baseSpd: 35, baseEva: 45,
    growthHp: 0.9, growthAtk: 0.75, growthDef: 0.5, maxLevel: 90,
    slotCount: 3, baseLuck: 25 },
  { id: 'cl_010', name: 'Yahagi', type: SHIP_TYPES.LIGHT_CRUISER, rarity: 'SR',
    baseHp: 36, baseAtk: 34, baseDef: 19, baseSpd: 35, baseEva: 46,
    growthHp: 0.92, growthAtk: 0.78, growthDef: 0.52, maxLevel: 90,
    slotCount: 3, baseLuck: 28 },

  // Rare Heavy Cruisers
  { id: 'ca_001', name: 'Takao', type: SHIP_TYPES.HEAVY_CRUISER, rarity: 'R',
    baseHp: 35, baseAtk: 30, baseDef: 18, baseSpd: 30, baseEva: 28,
    growthHp: 0.9, growthAtk: 0.7, growthDef: 0.5, maxLevel: 80,
    slotCount: 3, baseLuck: 18 },
  { id: 'ca_002', name: 'Atago', type: SHIP_TYPES.HEAVY_CRUISER, rarity: 'R',
    baseHp: 34, baseAtk: 32, baseDef: 17, baseSpd: 31, baseEva: 29,
    growthHp: 0.88, growthAtk: 0.72, growthDef: 0.48, maxLevel: 80,
    slotCount: 3, baseLuck: 20 },

  // Normal Heavy Cruiser
  { id: 'ca_004', name: 'Choukai', type: SHIP_TYPES.HEAVY_CRUISER, rarity: 'N',
    baseHp: 32, baseAtk: 26, baseDef: 16, baseSpd: 28, baseEva: 26,
    growthHp: 0.8, growthAtk: 0.6, growthDef: 0.45, maxLevel: 70,
    slotCount: 3, baseLuck: 15 },

  // Rare Heavy Cruisers
  { id: 'ca_003', name: 'Maya', type: SHIP_TYPES.HEAVY_CRUISER, rarity: 'R',
    baseHp: 33, baseAtk: 28, baseDef: 19, baseSpd: 32, baseEva: 30,
    growthHp: 0.86, growthAtk: 0.68, growthDef: 0.52, maxLevel: 80,
    slotCount: 3, baseLuck: 16 },
  { id: 'ca_006', name: 'Chikuma', type: SHIP_TYPES.HEAVY_CRUISER, rarity: 'R',
    baseHp: 35, baseAtk: 30, baseDef: 18, baseSpd: 31, baseEva: 30,
    growthHp: 0.88, growthAtk: 0.7, growthDef: 0.5, maxLevel: 80,
    slotCount: 3, baseLuck: 18 },
  { id: 'ca_007', name: 'Suzuya', type: SHIP_TYPES.HEAVY_CRUISER, rarity: 'R',
    baseHp: 36, baseAtk: 31, baseDef: 19, baseSpd: 32, baseEva: 31,
    growthHp: 0.9, growthAtk: 0.72, growthDef: 0.52, maxLevel: 80,
    slotCount: 3, baseLuck: 20 },
  { id: 'ca_008', name: 'Kumano', type: SHIP_TYPES.HEAVY_CRUISER, rarity: 'R',
    baseHp: 35, baseAtk: 30, baseDef: 20, baseSpd: 32, baseEva: 32,
    growthHp: 0.88, growthAtk: 0.7, growthDef: 0.54, maxLevel: 80,
    slotCount: 3, baseLuck: 19 },

  // SR Heavy Cruisers
  { id: 'ca_005', name: 'Tone', type: SHIP_TYPES.HEAVY_CRUISER, rarity: 'SR',
    baseHp: 40, baseAtk: 35, baseDef: 22, baseSpd: 32, baseEva: 32,
    growthHp: 1.0, growthAtk: 0.8, growthDef: 0.6, maxLevel: 90,
    slotCount: 3, baseLuck: 25 },

  // SR Battleships (Kongou-class fast battleships)
  { id: 'bb_001', name: 'Kongou', type: SHIP_TYPES.BATTLESHIP, rarity: 'SR',
    baseHp: 55, baseAtk: 45, baseDef: 35, baseSpd: 28, baseEva: 22,
    growthHp: 1.2, growthAtk: 1.0, growthDef: 0.8, maxLevel: 90,
    slotCount: 3, baseLuck: 20 },
  { id: 'bb_002', name: 'Hiei', type: SHIP_TYPES.BATTLESHIP, rarity: 'SR',
    baseHp: 53, baseAtk: 47, baseDef: 33, baseSpd: 28, baseEva: 23,
    growthHp: 1.18, growthAtk: 1.02, growthDef: 0.78, maxLevel: 90,
    slotCount: 3, baseLuck: 18 },
  { id: 'bb_003', name: 'Haruna', type: SHIP_TYPES.BATTLESHIP, rarity: 'SR',
    baseHp: 57, baseAtk: 44, baseDef: 37, baseSpd: 28, baseEva: 21,
    growthHp: 1.22, growthAtk: 0.98, growthDef: 0.82, maxLevel: 90,
    slotCount: 3, baseLuck: 22 },
  { id: 'bb_004', name: 'Kirishima', type: SHIP_TYPES.BATTLESHIP, rarity: 'SR',
    baseHp: 54, baseAtk: 48, baseDef: 34, baseSpd: 28, baseEva: 22,
    growthHp: 1.2, growthAtk: 1.04, growthDef: 0.8, maxLevel: 90,
    slotCount: 3, baseLuck: 19 },

  // SSR Battleships (Nagato-class)
  { id: 'bb_005', name: 'Nagato', type: SHIP_TYPES.BATTLESHIP, rarity: 'SSR',
    baseHp: 70, baseAtk: 60, baseDef: 45, baseSpd: 20, baseEva: 15,
    growthHp: 1.4, growthAtk: 1.2, growthDef: 1.0, maxLevel: 99,
    slotCount: 3, baseLuck: 30 },
  { id: 'bb_006', name: 'Mutsu', type: SHIP_TYPES.BATTLESHIP, rarity: 'SSR',
    baseHp: 68, baseAtk: 62, baseDef: 43, baseSpd: 21, baseEva: 16,
    growthHp: 1.38, growthAtk: 1.22, growthDef: 0.98, maxLevel: 99,
    slotCount: 3, baseLuck: 25 },

  // SSR Battleships
  { id: 'bb_007', name: 'Yamato', type: SHIP_TYPES.BATTLESHIP, rarity: 'SSR',
    baseHp: 95, baseAtk: 85, baseDef: 60, baseSpd: 18, baseEva: 12,
    growthHp: 1.8, growthAtk: 1.5, growthDef: 1.3, maxLevel: 99,
    slotCount: 3, baseLuck: 40 },
  { id: 'bb_008', name: 'Musashi', type: SHIP_TYPES.BATTLESHIP, rarity: 'SSR',
    baseHp: 93, baseAtk: 88, baseDef: 58, baseSpd: 19, baseEva: 13,
    growthHp: 1.78, growthAtk: 1.52, growthDef: 1.28, maxLevel: 99,
    slotCount: 3, baseLuck: 35 },

  // Carriers - Normal
  { id: 'cv_001', name: 'Houshou', type: SHIP_TYPES.CARRIER, rarity: 'N',
    baseHp: 30, baseAtk: 25, baseDef: 15, baseSpd: 20, baseEva: 25,
    growthHp: 0.8, growthAtk: 0.6, growthDef: 0.4, maxLevel: 70,
    slotCount: 3, aircraftSlots: [15, 10, 5], baseLuck: 20 },

  // Carriers - Rare (Light Carriers)
  { id: 'cvl_001', name: 'Ryuujou', type: SHIP_TYPES.CARRIER, rarity: 'R',
    baseHp: 35, baseAtk: 32, baseDef: 18, baseSpd: 26, baseEva: 30,
    growthHp: 0.9, growthAtk: 0.75, growthDef: 0.5, maxLevel: 80,
    slotCount: 3, aircraftSlots: [18, 12, 6], baseLuck: 22 },
  { id: 'cvl_002', name: 'Shouhou', type: SHIP_TYPES.CARRIER, rarity: 'R',
    baseHp: 38, baseAtk: 30, baseDef: 20, baseSpd: 25, baseEva: 28,
    growthHp: 0.95, growthAtk: 0.7, growthDef: 0.55, maxLevel: 80,
    slotCount: 3, aircraftSlots: [16, 14, 8], baseLuck: 20 },
  { id: 'cvl_003', name: 'Zuihou', type: SHIP_TYPES.CARRIER, rarity: 'SR',
    baseHp: 45, baseAtk: 40, baseDef: 25, baseSpd: 26, baseEva: 35,
    growthHp: 1.1, growthAtk: 0.9, growthDef: 0.65, maxLevel: 90,
    slotCount: 3, aircraftSlots: [18, 15, 12], baseLuck: 28 },

  // Carriers - SR
  { id: 'cv_003', name: 'Souryuu', type: SHIP_TYPES.CARRIER, rarity: 'SR',
    baseHp: 48, baseAtk: 55, baseDef: 26, baseSpd: 29, baseEva: 27,
    growthHp: 1.18, growthAtk: 1.15, growthDef: 0.72, maxLevel: 90,
    slotCount: 3, aircraftSlots: [18, 18, 27], baseLuck: 26 },
  { id: 'cv_004', name: 'Shoukaku', type: SHIP_TYPES.CARRIER, rarity: 'SR',
    baseHp: 55, baseAtk: 58, baseDef: 32, baseSpd: 27, baseEva: 25,
    growthHp: 1.3, growthAtk: 1.2, growthDef: 0.85, maxLevel: 90,
    slotCount: 3, aircraftSlots: [20, 20, 30], baseLuck: 30 },
  { id: 'cv_007', name: 'Kaga', type: SHIP_TYPES.CARRIER, rarity: 'SR',
    baseHp: 58, baseAtk: 55, baseDef: 32, baseSpd: 24, baseEva: 22,
    growthHp: 1.35, growthAtk: 1.15, growthDef: 0.85, maxLevel: 90,
    slotCount: 3, aircraftSlots: [20, 20, 28], baseLuck: 22 },

  // Carriers - SSR
  { id: 'cv_002', name: 'Hiryuu', type: SHIP_TYPES.CARRIER, rarity: 'SSR',
    baseHp: 58, baseAtk: 62, baseDef: 32, baseSpd: 28, baseEva: 26,
    growthHp: 1.4, growthAtk: 1.3, growthDef: 0.85, maxLevel: 99,
    slotCount: 3, aircraftSlots: [18, 18, 30], baseLuck: 32 },
  { id: 'cv_005', name: 'Zuikaku', type: SHIP_TYPES.CARRIER, rarity: 'SSR',
    baseHp: 64, baseAtk: 64, baseDef: 38, baseSpd: 28, baseEva: 28,
    growthHp: 1.5, growthAtk: 1.35, growthDef: 0.95, maxLevel: 99,
    slotCount: 3, aircraftSlots: [22, 22, 32], baseLuck: 40 },
  { id: 'cv_006', name: 'Akagi', type: SHIP_TYPES.CARRIER, rarity: 'SSR',
    baseHp: 65, baseAtk: 65, baseDef: 35, baseSpd: 25, baseEva: 22,
    growthHp: 1.5, growthAtk: 1.3, growthDef: 0.9, maxLevel: 99,
    slotCount: 3, aircraftSlots: [20, 20, 32], baseLuck: 25 },
  { id: 'cv_008', name: 'Taihou', type: SHIP_TYPES.CARRIER, rarity: 'SSR',
    baseHp: 75, baseAtk: 72, baseDef: 55, baseSpd: 24, baseEva: 20,
    growthHp: 1.6, growthAtk: 1.4, growthDef: 1.1, maxLevel: 99,
    slotCount: 3, aircraftSlots: [30, 24, 24], baseLuck: 35 },
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
