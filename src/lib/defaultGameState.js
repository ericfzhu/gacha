import { QUESTS, SHIPS } from './gameData.js';

function starterShips() {
  const starters = ['dd_001', 'dd_002', 'cl_001', 'cl_002'];
  const out = {};
  for (const id of starters) {
    const ship = SHIPS.find((s) => s.id === id);
    out[id] = {
      shipId: id,
      level: 1,
      xp: 0,
      morale: 49,
      currentHp: ship.hp,
      supply: { fuel: ship.maxFuel, ammo: ship.maxAmmo },
      repairEndTime: null,
      locked: true,
      equipment: [null, null, null],
    };
  }
  return out;
}

function initialQuests() {
  const progress = {};
  QUESTS.forEach((quest) => {
    progress[quest.id] = {
      current: 0,
      completed: false,
      claimed: false,
      updatedAt: Date.now(),
    };
  });
  return progress;
}

export function createDefaultGameState() {
  return {
    version: 2,
    profile: {
      commanderName: 'Admiral',
      hqLevel: 1,
      hqXp: 0,
      rank: 'Admiral Cadet',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    },
    resources: {
      fuel: 1000,
      ammo: 1000,
      steel: 1000,
      bauxite: 1000,
      buckets: 3,
      devMats: 8,
      screws: 4,
      tickets: 5,
      pityTokens: 0,
    },
    gacha: {
      standardPity: 0,
      premiumPulls: 0,
      grandPrizes: { prize1: false, prize2: false, prize3: false },
      secretCodeRedeemed: false,
    },
    ships: starterShips(),
    ownedShipIds: Object.keys(starterShips()),
    fleets: {
      activeFleetId: 'fleet1',
      fleet1: ['dd_001', 'dd_002', 'cl_001', 'cl_002', null, null],
      fleet2: [null, null, null, null, null, null],
      fleet3: [null, null, null, null, null, null],
      fleet4: [null, null, null, null, null, null],
    },
    sortie: {
      currentRun: null,
      mapClears: {},
      totalSorties: 0,
      totalBattles: 0,
      totalBossWins: 0,
    },
    quests: {
      progress: initialQuests(),
      dailyResetAt: null,
      weeklyResetAt: null,
    },
    expeditions: {
      active: [],
      completed: [],
      slotsUnlocked: 1,
    },
    docks: {
      owned: 2,
      slots: [null, null, null, null, null],
    },
    logs: {
      recentBattles: [],
    },
  };
}
