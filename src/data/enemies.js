// Abyssal Fleet enemy data (KanColle-style)
// These are the enemies that appear in sortie battles

import { SHIP_TYPES } from './ships.js';

// Enemy variants: normal, elite, flagship (progressively stronger)
export const ENEMY_VARIANT = {
  NORMAL: { name: '', hpMult: 1, atkMult: 1, defMult: 1 },
  ELITE: { name: 'Elite', hpMult: 1.3, atkMult: 1.2, defMult: 1.2 },
  FLAGSHIP: { name: 'Flagship', hpMult: 1.6, atkMult: 1.4, defMult: 1.4 },
};

// Abyssal enemy ships
export const ENEMIES = [
  // Destroyers (DD) - I-Class, Ro-Class, Ha-Class, Ni-Class
  { id: 'enemy_dd_i', name: 'Destroyer I-Class', type: SHIP_TYPES.DESTROYER,
    baseHp: 20, baseAtk: 15, baseDef: 8, baseSpd: 30, baseEva: 15, baseLuck: 10 },
  { id: 'enemy_dd_ro', name: 'Destroyer Ro-Class', type: SHIP_TYPES.DESTROYER,
    baseHp: 24, baseAtk: 18, baseDef: 10, baseSpd: 32, baseEva: 18, baseLuck: 12 },
  { id: 'enemy_dd_ha', name: 'Destroyer Ha-Class', type: SHIP_TYPES.DESTROYER,
    baseHp: 28, baseAtk: 22, baseDef: 12, baseSpd: 34, baseEva: 20, baseLuck: 14 },
  { id: 'enemy_dd_ni', name: 'Destroyer Ni-Class', type: SHIP_TYPES.DESTROYER,
    baseHp: 32, baseAtk: 26, baseDef: 14, baseSpd: 36, baseEva: 22, baseLuck: 16 },

  // Light Cruisers (CL) - Ho-Class, He-Class, To-Class, Tsu-Class
  { id: 'enemy_cl_ho', name: 'Light Cruiser Ho-Class', type: SHIP_TYPES.LIGHT_CRUISER,
    baseHp: 35, baseAtk: 24, baseDef: 18, baseSpd: 26, baseEva: 14, baseLuck: 12 },
  { id: 'enemy_cl_he', name: 'Light Cruiser He-Class', type: SHIP_TYPES.LIGHT_CRUISER,
    baseHp: 40, baseAtk: 28, baseDef: 20, baseSpd: 28, baseEva: 16, baseLuck: 14 },
  { id: 'enemy_cl_to', name: 'Light Cruiser To-Class', type: SHIP_TYPES.LIGHT_CRUISER,
    baseHp: 45, baseAtk: 32, baseDef: 22, baseSpd: 30, baseEva: 18, baseLuck: 16 },
  { id: 'enemy_cl_tsu', name: 'Light Cruiser Tsu-Class', type: SHIP_TYPES.LIGHT_CRUISER,
    baseHp: 50, baseAtk: 36, baseDef: 26, baseSpd: 32, baseEva: 20, baseLuck: 18 },

  // Heavy Cruisers (CA) - Ri-Class, Ne-Class
  { id: 'enemy_ca_ri', name: 'Heavy Cruiser Ri-Class', type: SHIP_TYPES.HEAVY_CRUISER,
    baseHp: 55, baseAtk: 45, baseDef: 35, baseSpd: 24, baseEva: 12, baseLuck: 15 },
  { id: 'enemy_ca_ne', name: 'Heavy Cruiser Ne-Class', type: SHIP_TYPES.HEAVY_CRUISER,
    baseHp: 65, baseAtk: 52, baseDef: 40, baseSpd: 26, baseEva: 14, baseLuck: 18 },

  // Battleships (BB) - Ru-Class, Ta-Class, Re-Class
  { id: 'enemy_bb_ru', name: 'Battleship Ru-Class', type: SHIP_TYPES.BATTLESHIP,
    baseHp: 80, baseAtk: 70, baseDef: 55, baseSpd: 18, baseEva: 8, baseLuck: 12 },
  { id: 'enemy_bb_ta', name: 'Battleship Ta-Class', type: SHIP_TYPES.BATTLESHIP,
    baseHp: 90, baseAtk: 75, baseDef: 60, baseSpd: 22, baseEva: 10, baseLuck: 15 },
  { id: 'enemy_bb_re', name: 'Battleship Re-Class', type: SHIP_TYPES.BATTLESHIP,
    baseHp: 100, baseAtk: 85, baseDef: 65, baseSpd: 20, baseEva: 12, baseLuck: 18 },

  // Aircraft Carriers (CV) - Wo-Class, Nu-Class (light)
  { id: 'enemy_cv_wo', name: 'Carrier Wo-Class', type: SHIP_TYPES.CARRIER,
    baseHp: 70, baseAtk: 50, baseDef: 40, baseSpd: 20, baseEva: 10, baseLuck: 15,
    antiAir: 40, aircraftSlots: [24, 24, 24] },
  { id: 'enemy_cvl_nu', name: 'Light Carrier Nu-Class', type: SHIP_TYPES.CARRIER,
    baseHp: 50, baseAtk: 35, baseDef: 30, baseSpd: 24, baseEva: 12, baseLuck: 12,
    antiAir: 30, aircraftSlots: [18, 18, 12] },
];

// Get enemy by ID
export function getEnemyById(id) {
  return ENEMIES.find(e => e.id === id);
}

// Get enemy stats at a given level with optional variant
export function getEnemyStats(enemy, level = 1, variant = ENEMY_VARIANT.NORMAL) {
  // Linear scaling for enemies - 10% per level
  const levelMult = 1 + (level - 1) * 0.1;

  return {
    hp: Math.floor(enemy.baseHp * levelMult * variant.hpMult),
    attack: Math.floor(enemy.baseAtk * levelMult * variant.atkMult),
    defense: Math.floor(enemy.baseDef * levelMult * variant.defMult),
    speed: enemy.baseSpd,
    evasion: enemy.baseEva,
    luck: enemy.baseLuck,
    antiAir: enemy.antiAir || 0,
  };
}

// Get display name with variant
export function getEnemyDisplayName(enemy, variant = ENEMY_VARIANT.NORMAL) {
  if (variant.name) {
    return `${enemy.name} ${variant.name}`;
  }
  return enemy.name;
}
