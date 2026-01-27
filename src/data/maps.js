// Map data for sortie navigation
// Each map has nodes that players navigate through before reaching the boss
// 10 maps total with gradual difficulty scaling

// XP multiplier for faster progression (20x = complete game quickly)
export const XP_MULTIPLIER = 20;

export const MAPS = {
  '1-1': {
    name: 'Patrol Waters',
    description: 'Light patrol mission. Perfect for beginners.',
    firstClearTickets: 6,
    sRankBonus: 1,
    nodes: {
      start: { x: 100, y: 300, next: ['A'] },
      A: {
        x: 250, y: 300,
        type: 'combat',
        enemies: ['enemy_dd_i', 'enemy_dd_i'],
        enemyLevels: [1, 1],
        next: ['boss'],
      },
      boss: {
        x: 450, y: 300,
        type: 'boss',
        enemies: ['enemy_dd_ro', 'enemy_dd_i', 'enemy_dd_i'],
        enemyLevels: [2, 1, 1],
        next: null,
      },
    },
    baseXp: 30,
  },

  '1-2': {
    name: 'Coastal Recon',
    description: 'Scout the coastline for enemy activity.',
    firstClearTickets: 7,
    sRankBonus: 1,
    nodes: {
      start: { x: 100, y: 300, next: ['A'] },
      A: {
        x: 220, y: 300,
        type: 'combat',
        enemies: ['enemy_dd_i', 'enemy_dd_ro'],
        enemyLevels: [2, 2],
        next: ['B', 'C'],
      },
      B: {
        x: 350, y: 200,
        type: 'combat',
        enemies: ['enemy_dd_ro', 'enemy_dd_ro'],
        enemyLevels: [3, 2],
        next: ['boss'],
      },
      C: {
        x: 350, y: 400,
        type: 'resource',
        reward: { fuel: 30, tickets: 1 },
        next: ['boss'],
      },
      boss: {
        x: 500, y: 300,
        type: 'boss',
        enemies: ['enemy_cl_ho', 'enemy_dd_ro', 'enemy_dd_ro'],
        enemyLevels: [3, 2, 2],
        next: null,
      },
    },
    baseXp: 40,
  },

  '1-3': {
    name: 'Supply Line Defense',
    description: 'Protect our supply routes from raiders.',
    firstClearTickets: 8,
    sRankBonus: 1,
    nodes: {
      start: { x: 80, y: 300, next: ['A'] },
      A: {
        x: 180, y: 300,
        type: 'combat',
        enemies: ['enemy_dd_ro', 'enemy_dd_ha'],
        enemyLevels: [3, 3],
        next: ['B'],
      },
      B: {
        x: 300, y: 300,
        type: 'combat',
        enemies: ['enemy_cl_ho', 'enemy_dd_ro'],
        enemyLevels: [4, 3],
        next: ['C', 'D'],
      },
      C: {
        x: 420, y: 180,
        type: 'resource',
        reward: { fuel: 35, tickets: 1 },
        next: ['boss'],
      },
      D: {
        x: 420, y: 420,
        type: 'combat',
        enemies: ['enemy_cl_he', 'enemy_dd_ro'],
        enemyLevels: [4, 4],
        next: ['boss'],
      },
      boss: {
        x: 560, y: 300,
        type: 'boss',
        enemies: ['enemy_cl_he', 'enemy_cl_ho', 'enemy_dd_ha'],
        enemyLevels: [5, 4, 3],
        next: null,
      },
    },
    baseXp: 50,
  },

  '1-4': {
    name: 'Island Approach',
    description: 'Navigate through contested island waters.',
    firstClearTickets: 9,
    sRankBonus: 1,
    nodes: {
      start: { x: 80, y: 300, next: ['A', 'B'] },
      A: {
        x: 180, y: 180,
        type: 'combat',
        enemies: ['enemy_cl_he', 'enemy_dd_ha'],
        enemyLevels: [5, 4],
        next: ['C'],
      },
      B: {
        x: 180, y: 420,
        type: 'resource',
        reward: { fuel: 40, tickets: 1 },
        next: ['D'],
      },
      C: {
        x: 320, y: 180,
        type: 'combat',
        enemies: ['enemy_cl_to', 'enemy_cl_ho'],
        enemyLevels: [6, 5],
        next: ['E'],
      },
      D: {
        x: 320, y: 420,
        type: 'combat',
        enemies: ['enemy_ca_ri', 'enemy_dd_ro'],
        enemyLevels: [5, 5],
        next: ['E'],
      },
      E: {
        x: 460, y: 300,
        type: 'combat',
        enemies: ['enemy_ca_ri', 'enemy_cl_he'],
        enemyLevels: [6, 5],
        next: ['boss'],
      },
      boss: {
        x: 600, y: 300,
        type: 'boss',
        enemies: ['enemy_ca_ri', 'enemy_cl_to', 'enemy_cl_ho'],
        enemyLevels: [7, 6, 5],
        next: null,
      },
    },
    baseXp: 60,
  },

  '1-5': {
    name: 'Strait Passage',
    description: 'Force passage through enemy-controlled straits.',
    firstClearTickets: 10,
    sRankBonus: 2,
    nodes: {
      start: { x: 80, y: 300, next: ['A'] },
      A: {
        x: 180, y: 300,
        type: 'combat',
        enemies: ['enemy_ca_ri', 'enemy_cl_he', 'enemy_dd_ha'],
        enemyLevels: [6, 6, 5],
        next: ['B', 'C'],
      },
      B: {
        x: 300, y: 180,
        type: 'combat',
        enemies: ['enemy_ca_ri', 'enemy_cl_to'],
        enemyLevels: [7, 6],
        next: ['D'],
      },
      C: {
        x: 300, y: 420,
        type: 'resource',
        reward: { fuel: 45, tickets: 1 },
        next: ['E'],
      },
      D: {
        x: 440, y: 180,
        type: 'combat',
        enemies: ['enemy_ca_ri', 'enemy_ca_ri'],
        enemyLevels: [8, 7],
        next: ['boss'],
      },
      E: {
        x: 440, y: 420,
        type: 'combat',
        enemies: ['enemy_bb_ru', 'enemy_cl_he'],
        enemyLevels: [7, 6],
        next: ['boss'],
      },
      boss: {
        x: 600, y: 300,
        type: 'boss',
        enemies: ['enemy_bb_ru', 'enemy_ca_ri', 'enemy_cl_to'],
        enemyLevels: [8, 7, 6],
        next: null,
      },
    },
    baseXp: 80,
  },

  '2-1': {
    name: 'Open Sea Skirmish',
    description: 'Engage enemy forces in open waters.',
    firstClearTickets: 10,
    sRankBonus: 2,
    nodes: {
      start: { x: 80, y: 300, next: ['A', 'B'] },
      A: {
        x: 180, y: 180,
        type: 'combat',
        enemies: ['enemy_ca_ri', 'enemy_cl_to', 'enemy_dd_ha'],
        enemyLevels: [8, 7, 6],
        next: ['C'],
      },
      B: {
        x: 180, y: 420,
        type: 'combat',
        enemies: ['enemy_bb_ru', 'enemy_cl_he'],
        enemyLevels: [8, 7],
        next: ['D'],
      },
      C: {
        x: 320, y: 180,
        type: 'resource',
        reward: { fuel: 50, tickets: 1 },
        next: ['E'],
      },
      D: {
        x: 320, y: 420,
        type: 'combat',
        enemies: ['enemy_bb_ru', 'enemy_ca_ri', 'enemy_cl_ho'],
        enemyLevels: [9, 8, 7],
        next: ['E'],
      },
      E: {
        x: 480, y: 300,
        type: 'combat',
        enemies: ['enemy_bb_ru', 'enemy_ca_ri'],
        enemyLevels: [9, 8],
        next: ['boss'],
      },
      boss: {
        x: 620, y: 300,
        type: 'boss',
        enemies: ['enemy_bb_ru', 'enemy_ca_ri', 'enemy_cl_to'],
        enemyLevels: [10, 9, 8],
        next: null,
      },
    },
    baseXp: 100,
  },

  '2-2': {
    name: 'Fleet Interception',
    description: 'Intercept an enemy fleet convoy.',
    firstClearTickets: 10,
    sRankBonus: 2,
    nodes: {
      start: { x: 80, y: 300, next: ['A'] },
      A: {
        x: 180, y: 300,
        type: 'combat',
        enemies: ['enemy_bb_ru', 'enemy_ca_ri', 'enemy_cl_he'],
        enemyLevels: [9, 9, 8],
        next: ['B', 'C'],
      },
      B: {
        x: 320, y: 180,
        type: 'combat',
        enemies: ['enemy_bb_ru', 'enemy_ca_ri', 'enemy_cl_to'],
        enemyLevels: [10, 9, 8],
        next: ['D'],
      },
      C: {
        x: 320, y: 420,
        type: 'resource',
        reward: { fuel: 55, tickets: 1 },
        next: ['E'],
      },
      D: {
        x: 480, y: 180,
        type: 'combat',
        enemies: ['enemy_bb_ta', 'enemy_ca_ri'],
        enemyLevels: [11, 10],
        next: ['boss'],
      },
      E: {
        x: 480, y: 420,
        type: 'combat',
        enemies: ['enemy_cv_wo', 'enemy_ca_ri', 'enemy_cl_he'],
        enemyLevels: [10, 10, 9],
        next: ['boss'],
      },
      boss: {
        x: 620, y: 300,
        type: 'boss',
        enemies: ['enemy_bb_ta', 'enemy_cv_wo', 'enemy_ca_ri'],
        enemyLevels: [12, 11, 10],
        next: null,
      },
    },
    baseXp: 120,
  },

  '2-3': {
    name: 'Carrier Strike',
    description: 'Face enemy carrier groups.',
    firstClearTickets: 10,
    sRankBonus: 2,
    nodes: {
      start: { x: 80, y: 300, next: ['A', 'B'] },
      A: {
        x: 180, y: 200,
        type: 'combat',
        enemies: ['enemy_cv_wo', 'enemy_ca_ri', 'enemy_cl_to'],
        enemyLevels: [11, 10, 9],
        next: ['C'],
      },
      B: {
        x: 180, y: 400,
        type: 'resource',
        reward: { fuel: 60, tickets: 1 },
        next: ['D'],
      },
      C: {
        x: 320, y: 200,
        type: 'combat',
        enemies: ['enemy_bb_ta', 'enemy_bb_ru', 'enemy_cl_he'],
        enemyLevels: [12, 11, 10],
        next: ['E'],
      },
      D: {
        x: 320, y: 400,
        type: 'combat',
        enemies: ['enemy_cv_wo', 'enemy_ca_ri', 'enemy_dd_ha'],
        enemyLevels: [11, 11, 10],
        next: ['E'],
      },
      E: {
        x: 480, y: 300,
        type: 'combat',
        enemies: ['enemy_bb_ta', 'enemy_cv_wo'],
        enemyLevels: [13, 12],
        next: ['boss'],
      },
      boss: {
        x: 620, y: 300,
        type: 'boss',
        enemies: ['enemy_bb_ta', 'enemy_cv_wo', 'enemy_ca_ne'],
        enemyLevels: [14, 13, 12],
        next: null,
      },
    },
    baseXp: 140,
  },

  '2-4': {
    name: 'Iron Bottom Sound',
    description: 'A fierce battleground. Steel your resolve.',
    firstClearTickets: 10,
    sRankBonus: 2,
    nodes: {
      start: { x: 80, y: 300, next: ['A'] },
      A: {
        x: 160, y: 300,
        type: 'combat',
        enemies: ['enemy_bb_ta', 'enemy_ca_ri', 'enemy_cl_to'],
        enemyLevels: [13, 12, 11],
        next: ['B', 'C'],
      },
      B: {
        x: 280, y: 180,
        type: 'combat',
        enemies: ['enemy_bb_ta', 'enemy_bb_ru', 'enemy_ca_ri'],
        enemyLevels: [14, 13, 12],
        next: ['D'],
      },
      C: {
        x: 280, y: 420,
        type: 'resource',
        reward: { fuel: 70, tickets: 1 },
        next: ['E'],
      },
      D: {
        x: 420, y: 180,
        type: 'combat',
        enemies: ['enemy_bb_re', 'enemy_cv_wo'],
        enemyLevels: [15, 14],
        next: ['F'],
      },
      E: {
        x: 420, y: 420,
        type: 'combat',
        enemies: ['enemy_cvl_nu', 'enemy_bb_ta', 'enemy_ca_ri'],
        enemyLevels: [14, 14, 13],
        next: ['F'],
      },
      F: {
        x: 540, y: 300,
        type: 'combat',
        enemies: ['enemy_bb_re', 'enemy_bb_ta', 'enemy_cv_wo'],
        enemyLevels: [16, 15, 14],
        next: ['boss'],
      },
      boss: {
        x: 680, y: 300,
        type: 'boss',
        enemies: ['enemy_bb_re', 'enemy_bb_ta', 'enemy_cvl_nu', 'enemy_ca_ne'],
        enemyLevels: [16, 15, 14, 13],
        next: null,
      },
    },
    baseXp: 160,
  },

  '2-5': {
    name: 'Final Battle',
    description: 'The ultimate challenge. Only the strongest survive.',
    firstClearTickets: 10,
    sRankBonus: 3,
    nodes: {
      start: { x: 80, y: 300, next: ['A'] },
      A: {
        x: 160, y: 300,
        type: 'combat',
        enemies: ['enemy_bb_re', 'enemy_cv_wo', 'enemy_ca_ne'],
        enemyLevels: [15, 14, 14],
        next: ['B', 'C'],
      },
      B: {
        x: 280, y: 150,
        type: 'combat',
        enemies: ['enemy_bb_re', 'enemy_bb_ta', 'enemy_cl_to'],
        enemyLevels: [16, 15, 14],
        next: ['D'],
      },
      C: {
        x: 280, y: 450,
        type: 'resource',
        reward: { fuel: 80, tickets: 2 },
        next: ['E'],
      },
      D: {
        x: 420, y: 150,
        type: 'combat',
        enemies: ['enemy_bb_re', 'enemy_bb_re', 'enemy_cvl_nu'],
        enemyLevels: [17, 16, 15],
        next: ['F'],
      },
      E: {
        x: 420, y: 450,
        type: 'combat',
        enemies: ['enemy_cvl_nu', 'enemy_cv_wo', 'enemy_ca_ne', 'enemy_ca_ri'],
        enemyLevels: [16, 15, 15, 14],
        next: ['F'],
      },
      F: {
        x: 560, y: 300,
        type: 'combat',
        enemies: ['enemy_bb_re', 'enemy_bb_re', 'enemy_cvl_nu', 'enemy_ca_ne'],
        enemyLevels: [17, 16, 15, 14],
        next: ['boss'],
      },
      boss: {
        x: 700, y: 300,
        type: 'boss',
        enemies: ['enemy_bb_re', 'enemy_bb_re', 'enemy_cvl_nu', 'enemy_ca_ne'],
        enemyLevels: [18, 16, 15, 14],
        next: null,
      },
    },
    baseXp: 180,
  },
};

export const MAP_ORDER = ['1-1', '1-2', '1-3', '1-4', '1-5', '2-1', '2-2', '2-3', '2-4', '2-5'];

export function getMapById(mapId) {
  return MAPS[mapId] || null;
}

export function getNodeById(mapId, nodeId) {
  const map = MAPS[mapId];
  if (!map) return null;
  return map.nodes[nodeId] || null;
}

// Calculate repair time in milliseconds based on damage
export function calculateRepairTime(currentHp, maxHp) {
  if (currentHp >= maxHp) return 0;
  const damagePercent = 1 - (currentHp / maxHp);
  // Max 2 minutes (120000ms) for 0 HP, scales linearly
  return Math.ceil(damagePercent * 120000);
}

// Get damage state for display
export function getDamageState(currentHp, maxHp) {
  const percent = currentHp / maxHp;
  if (percent >= 1) return { state: 'full', color: 0x4dab9a, canSortie: true };
  if (percent > 0.5) return { state: 'light', color: 0xcb912f, canSortie: true };
  if (percent > 0.25) return { state: 'medium', color: 0xff9800, canSortie: true, warning: true };
  return { state: 'heavy', color: 0xe03e3e, canSortie: false };
}
