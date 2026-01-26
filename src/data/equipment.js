// Equipment data for KanColle-style ship equipment system

export const EQUIPMENT_TYPES = {
  MAIN_GUN_SMALL: 'Small Caliber Main Gun',
  MAIN_GUN_MEDIUM: 'Medium Caliber Main Gun',
  MAIN_GUN_LARGE: 'Large Caliber Main Gun',
  TORPEDO: 'Torpedo',
  FIGHTER: 'Fighter',
  DIVE_BOMBER: 'Dive Bomber',
  TORPEDO_BOMBER: 'Torpedo Bomber',
  RADAR: 'Radar',
  ENGINE: 'Engine',
  AA_GUN: 'Anti-Air Gun',
};

// Ship type abbreviations for display
export const SHIP_TYPE_ABBREV = {
  'Destroyer': 'DD',
  'Light Cruiser': 'CL',
  'Heavy Cruiser': 'CA',
  'Battleship': 'BB',
  'Carrier': 'CV',
};

// Equipment slot counts by ship type
export const SLOT_COUNTS = {
  'Destroyer': 2,
  'Light Cruiser': 2,
  'Heavy Cruiser': 3,
  'Battleship': 3,
  'Carrier': 3,
};

// Aircraft slot sizes for carriers (planes per slot)
export const AIRCRAFT_SLOTS = {
  'cv_001': [15, 10, 5],        // Houshou - small carrier
  'cv_002': [20, 20, 32],       // Akagi - first carrier division
  'cv_003': [20, 20, 30],       // Kaga - first carrier division
  'cv_004': [30, 24, 24],       // Taihou - armored carrier
};

// Equipment compatibility by ship type
export const EQUIPMENT_COMPATIBILITY = {
  'Destroyer': [
    EQUIPMENT_TYPES.MAIN_GUN_SMALL,
    EQUIPMENT_TYPES.TORPEDO,
    EQUIPMENT_TYPES.RADAR,
    EQUIPMENT_TYPES.ENGINE,
    EQUIPMENT_TYPES.AA_GUN,
  ],
  'Light Cruiser': [
    EQUIPMENT_TYPES.MAIN_GUN_SMALL,
    EQUIPMENT_TYPES.MAIN_GUN_MEDIUM,
    EQUIPMENT_TYPES.TORPEDO,
    EQUIPMENT_TYPES.RADAR,
    EQUIPMENT_TYPES.AA_GUN,
  ],
  'Heavy Cruiser': [
    EQUIPMENT_TYPES.MAIN_GUN_MEDIUM,
    EQUIPMENT_TYPES.TORPEDO,
    EQUIPMENT_TYPES.RADAR,
    EQUIPMENT_TYPES.AA_GUN,
  ],
  'Battleship': [
    EQUIPMENT_TYPES.MAIN_GUN_LARGE,
    EQUIPMENT_TYPES.MAIN_GUN_MEDIUM,
    EQUIPMENT_TYPES.RADAR,
    EQUIPMENT_TYPES.AA_GUN,
  ],
  'Carrier': [
    EQUIPMENT_TYPES.FIGHTER,
    EQUIPMENT_TYPES.DIVE_BOMBER,
    EQUIPMENT_TYPES.TORPEDO_BOMBER,
    EQUIPMENT_TYPES.RADAR,
  ],
};

// Equipment definitions
export const EQUIPMENT = [
  // Small Caliber Main Guns (Destroyers, Light Cruisers)
  {
    id: 'gun_small_1',
    name: '12.7cm Twin Gun',
    type: EQUIPMENT_TYPES.MAIN_GUN_SMALL,
    rarity: 'N',
    stats: { firepower: 2 },
  },
  {
    id: 'gun_small_2',
    name: '12.7cm Twin Gun Kai',
    type: EQUIPMENT_TYPES.MAIN_GUN_SMALL,
    rarity: 'R',
    stats: { firepower: 3, accuracy: 1 },
  },
  {
    id: 'gun_small_3',
    name: '10cm Twin High-Angle',
    type: EQUIPMENT_TYPES.MAIN_GUN_SMALL,
    rarity: 'SR',
    stats: { firepower: 3, antiAir: 7, accuracy: 1 },
  },

  // Medium Caliber Main Guns (Light/Heavy Cruisers)
  {
    id: 'gun_med_1',
    name: '14cm Single Gun',
    type: EQUIPMENT_TYPES.MAIN_GUN_MEDIUM,
    rarity: 'N',
    stats: { firepower: 2 },
  },
  {
    id: 'gun_med_2',
    name: '20.3cm Twin Gun',
    type: EQUIPMENT_TYPES.MAIN_GUN_MEDIUM,
    rarity: 'R',
    stats: { firepower: 8 },
  },
  {
    id: 'gun_med_3',
    name: '20.3cm No.3 Twin Gun',
    type: EQUIPMENT_TYPES.MAIN_GUN_MEDIUM,
    rarity: 'SR',
    stats: { firepower: 10, accuracy: 4 },
  },

  // Large Caliber Main Guns (Battleships)
  {
    id: 'gun_large_1',
    name: '35.6cm Twin Gun',
    type: EQUIPMENT_TYPES.MAIN_GUN_LARGE,
    rarity: 'R',
    stats: { firepower: 15 },
  },
  {
    id: 'gun_large_2',
    name: '41cm Twin Gun',
    type: EQUIPMENT_TYPES.MAIN_GUN_LARGE,
    rarity: 'SR',
    stats: { firepower: 20 },
  },
  {
    id: 'gun_large_3',
    name: '46cm Triple Gun',
    type: EQUIPMENT_TYPES.MAIN_GUN_LARGE,
    rarity: 'SSR',
    stats: { firepower: 26 },
  },

  // Torpedoes
  {
    id: 'torp_1',
    name: '61cm Triple Torpedo',
    type: EQUIPMENT_TYPES.TORPEDO,
    rarity: 'N',
    stats: { torpedo: 5 },
  },
  {
    id: 'torp_2',
    name: '61cm Quad Torpedo',
    type: EQUIPMENT_TYPES.TORPEDO,
    rarity: 'R',
    stats: { torpedo: 7 },
  },
  {
    id: 'torp_3',
    name: '61cm Quint Torpedo',
    type: EQUIPMENT_TYPES.TORPEDO,
    rarity: 'SR',
    stats: { torpedo: 12 },
  },

  // Fighter Planes
  {
    id: 'fighter_1',
    name: 'Type 21 Zero Fighter',
    type: EQUIPMENT_TYPES.FIGHTER,
    rarity: 'N',
    stats: { antiAir: 5 },
  },
  {
    id: 'fighter_2',
    name: 'Type 52 Zero Fighter',
    type: EQUIPMENT_TYPES.FIGHTER,
    rarity: 'R',
    stats: { antiAir: 6, evasion: 2 },
  },
  {
    id: 'fighter_3',
    name: 'Shiden Kai',
    type: EQUIPMENT_TYPES.FIGHTER,
    rarity: 'SR',
    stats: { antiAir: 9, evasion: 3 },
  },

  // Dive Bombers
  {
    id: 'dive_1',
    name: 'Type 99 Dive Bomber',
    type: EQUIPMENT_TYPES.DIVE_BOMBER,
    rarity: 'N',
    stats: { firepower: 4, antiAir: 1 },
  },
  {
    id: 'dive_2',
    name: 'Suisei',
    type: EQUIPMENT_TYPES.DIVE_BOMBER,
    rarity: 'R',
    stats: { firepower: 8, antiAir: 3 },
  },

  // Torpedo Bombers
  {
    id: 'torp_bomber_1',
    name: 'Type 97 Torpedo Bomber',
    type: EQUIPMENT_TYPES.TORPEDO_BOMBER,
    rarity: 'N',
    stats: { torpedo: 4, antiAir: 1 },
  },
  {
    id: 'torp_bomber_2',
    name: 'Tenzan',
    type: EQUIPMENT_TYPES.TORPEDO_BOMBER,
    rarity: 'R',
    stats: { torpedo: 7, antiAir: 3 },
  },

  // Radar
  {
    id: 'radar_1',
    name: 'Type 21 Air Radar',
    type: EQUIPMENT_TYPES.RADAR,
    rarity: 'R',
    stats: { antiAir: 4, accuracy: 2 },
  },
  {
    id: 'radar_2',
    name: 'Type 32 Surface Radar',
    type: EQUIPMENT_TYPES.RADAR,
    rarity: 'SR',
    stats: { accuracy: 8 },
  },

  // Anti-Air Guns
  {
    id: 'aa_1',
    name: '25mm Triple AA Gun',
    type: EQUIPMENT_TYPES.AA_GUN,
    rarity: 'N',
    stats: { antiAir: 4 },
  },
  {
    id: 'aa_2',
    name: '25mm Triple Concentrated',
    type: EQUIPMENT_TYPES.AA_GUN,
    rarity: 'R',
    stats: { antiAir: 6, accuracy: 1 },
  },
];

export function getEquipmentById(id) {
  return EQUIPMENT.find(e => e.id === id);
}

export function getEquipmentByType(type) {
  return EQUIPMENT.filter(e => e.type === type);
}

export function canEquipOnShipType(equipId, shipType) {
  const equipment = getEquipmentById(equipId);
  if (!equipment) return false;
  const compatible = EQUIPMENT_COMPATIBILITY[shipType] || [];
  return compatible.includes(equipment.type);
}

export function getSlotCount(shipType) {
  return SLOT_COUNTS[shipType] || 2;
}

export function getAircraftSlots(shipId) {
  return AIRCRAFT_SLOTS[shipId] || [0, 0, 0];
}
