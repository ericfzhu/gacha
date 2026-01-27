// localStorage wrapper for game persistence with ship leveling

const STORAGE_KEY = 'fleet_collection_save';

const DEFAULT_SAVE = {
  currency: 1000,
  tickets: 5, // Premium tickets for special gacha
  pity: 0, // Standard gacha pity
  pityTokens: 0, // Tokens for premium gacha exchange shop
  // Grand prizes - special gift choices (can only obtain each once)
  grandPrizes: {
    prize1: false, // 2.0% rate - obtained?
    prize2: false, // 0.5% rate - obtained?
    prize3: false, // 0.2% rate - obtained?
  },
  secretCodeRedeemed: false, // Has the secret code been used?
  artworkMode: 'pokemon', // 'pokemon' for Pokemon sprites, 'anime' for ship girl character art
  // Map completion tracking for ticket rewards
  mapClears: {}, // { mapName: { cleared: true, sRank: true } }
  tutorialComplete: false,
  // Ships now stored as objects with level, xp, and HP
  ships: {}, // { shipId: { level: 1, xp: 0, currentHp: null, repairEndTime: null } }
  fleet: [null, null, null, null, null, null],
  // Repair docks - starts with 2, can purchase up to 5
  ownedDocks: 2,
  repairDocks: [null, null, null, null, null], // [shipId, ...] or null for empty
  // Equipment system
  ownedEquipment: [], // Array of equipment IDs (can have duplicates)
  shipEquipment: {}, // { shipId: [equipIdx, equipIdx, null] } - indexes into ownedEquipment
  lastFormation: 'LINE_AHEAD', // Last selected formation
  stats: {
    totalPulls: 0,
    premiumPulls: 0,
    battlesWon: 0,
    battlesLost: 0,
    sorties: 0,
  },
};

export const Storage = {
  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Migration: convert old collection array to new ships object
        if (parsed.collection && !parsed.ships) {
          parsed.ships = {};
          parsed.collection.forEach(id => {
            parsed.ships[id] = { level: 1, xp: 0 };
          });
          delete parsed.collection;
        }
        // Migration: convert old 'pixel' artwork mode to 'pokemon'
        if (parsed.artworkMode === 'pixel') {
          parsed.artworkMode = 'pokemon';
        }
        return { ...DEFAULT_SAVE, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load save data:', e);
    }
    return { ...DEFAULT_SAVE };
  },

  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save data:', e);
      return false;
    }
  },

  get(key) {
    const data = this.load();
    return data[key];
  },

  set(key, value) {
    const data = this.load();
    data[key] = value;
    return this.save(data);
  },

  addCurrency(amount) {
    const data = this.load();
    data.currency += amount;
    return this.save(data);
  },

  spendCurrency(amount) {
    const data = this.load();
    if (data.currency < amount) return false;
    data.currency -= amount;
    return this.save(data);
  },

  // Ship management
  addShip(shipId) {
    const data = this.load();
    const isNew = !data.ships[shipId];
    if (isNew) {
      data.ships[shipId] = { level: 1, xp: 0 };
    }
    this.save(data);
    return isNew;
  },

  hasShip(shipId) {
    const data = this.load();
    return !!data.ships[shipId];
  },

  getShipData(shipId) {
    const data = this.load();
    return data.ships[shipId] || null;
  },

  getOwnedShipIds() {
    const data = this.load();
    return Object.keys(data.ships);
  },

  getOwnedShipCount() {
    return this.getOwnedShipIds().length;
  },

  // XP and leveling
  addXpToShip(shipId, xpAmount, maxLevel) {
    const data = this.load();
    if (!data.ships[shipId]) return null;

    const ship = data.ships[shipId];
    const oldLevel = ship.level;

    // Add XP
    ship.xp += xpAmount;

    // Check for level ups - XP formula: 100 * level^1.5
    while (ship.level < maxLevel) {
      const xpNeeded = Math.floor(100 * Math.pow(ship.level, 1.5));
      if (ship.xp >= xpNeeded) {
        ship.xp -= xpNeeded;
        ship.level++;
      } else {
        break;
      }
    }

    // Cap XP at max level
    if (ship.level >= maxLevel) {
      ship.level = maxLevel;
      ship.xp = 0;
    }

    this.save(data);

    return {
      oldLevel,
      newLevel: ship.level,
      leveledUp: ship.level > oldLevel,
      currentXp: ship.xp,
    };
  },

  // Fleet management
  setFleet(fleet) {
    return this.set('fleet', fleet);
  },

  getFleet() {
    return this.get('fleet');
  },

  // Pity system
  incrementPity() {
    const data = this.load();
    data.pity += 1;
    data.stats.totalPulls += 1;
    return this.save(data);
  },

  resetPity() {
    return this.set('pity', 0);
  },

  // Stats
  incrementSorties() {
    const data = this.load();
    data.stats.sorties += 1;
    return this.save(data);
  },

  incrementBattlesWon() {
    const data = this.load();
    data.stats.battlesWon += 1;
    return this.save(data);
  },

  incrementBattlesLost() {
    const data = this.load();
    data.stats.battlesLost += 1;
    return this.save(data);
  },

  reset() {
    return this.save({ ...DEFAULT_SAVE });
  },

  // Premium ticket management
  addTickets(amount) {
    const data = this.load();
    data.tickets = (data.tickets || 0) + amount;
    return this.save(data);
  },

  spendTickets(amount) {
    const data = this.load();
    if ((data.tickets || 0) < amount) return false;
    data.tickets -= amount;
    return this.save(data);
  },

  getTickets() {
    return this.get('tickets') || 0;
  },

  // Pity token management for premium gacha exchange shop
  addPityTokens(amount) {
    const data = this.load();
    data.pityTokens = (data.pityTokens || 0) + amount;
    return this.save(data);
  },

  spendPityTokens(amount) {
    const data = this.load();
    if ((data.pityTokens || 0) < amount) return false;
    data.pityTokens -= amount;
    return this.save(data);
  },

  getPityTokens() {
    return this.get('pityTokens') || 0;
  },

  incrementPremiumPulls() {
    const data = this.load();
    data.stats.premiumPulls = (data.stats.premiumPulls || 0) + 1;
    return this.save(data);
  },

  // Grand prize management (special gifts)
  getGrandPrizes() {
    const data = this.load();
    return data.grandPrizes || { prize1: false, prize2: false, prize3: false };
  },

  hasGrandPrize(prizeKey) {
    const prizes = this.getGrandPrizes();
    return prizes[prizeKey] === true;
  },

  setGrandPrizeObtained(prizeKey) {
    const data = this.load();
    if (!data.grandPrizes) data.grandPrizes = { prize1: false, prize2: false, prize3: false };
    data.grandPrizes[prizeKey] = true;
    return this.save(data);
  },

  getObtainedGrandPrizeCount() {
    const prizes = this.getGrandPrizes();
    return Object.values(prizes).filter(v => v === true).length;
  },

  // Secret code system
  isSecretCodeRedeemed() {
    return this.get('secretCodeRedeemed') === true;
  },

  redeemSecretCode() {
    const data = this.load();
    if (data.secretCodeRedeemed) return false;
    data.secretCodeRedeemed = true;
    data.tickets = (data.tickets || 0) + 50;
    return this.save(data);
  },

  // Map clear tracking for ticket rewards
  getMapClears() {
    return this.get('mapClears') || {};
  },

  isMapCleared(mapName) {
    const clears = this.getMapClears();
    return clears[mapName]?.cleared === true;
  },

  hasMapSRank(mapName) {
    const clears = this.getMapClears();
    return clears[mapName]?.sRank === true;
  },

  recordMapClear(mapName, rank) {
    const data = this.load();
    if (!data.mapClears) data.mapClears = {};

    const isFirstClear = !data.mapClears[mapName]?.cleared;
    const isFirstSRank = rank === 'S' && !data.mapClears[mapName]?.sRank;

    data.mapClears[mapName] = {
      cleared: true,
      sRank: data.mapClears[mapName]?.sRank || rank === 'S',
    };

    this.save(data);
    return { isFirstClear, isFirstSRank };
  },

  // Tutorial tracking
  isTutorialComplete() {
    return this.get('tutorialComplete') === true;
  },

  completeTutorial() {
    const data = this.load();
    if (data.tutorialComplete) return false;
    data.tutorialComplete = true;
    // Give 5 tickets for completing tutorial (already have 5 starting)
    // Actually they start with 5, so this gives them the starting bonus
    return this.save(data);
  },

  // Ship HP management (for persistent damage)
  getShipCurrentHp(shipId, maxHp) {
    const data = this.load();
    const ship = data.ships[shipId];
    if (!ship) return null;
    // null means full HP
    return ship.currentHp === null || ship.currentHp === undefined ? maxHp : ship.currentHp;
  },

  setShipHp(shipId, hp) {
    const data = this.load();
    if (!data.ships[shipId]) return false;
    data.ships[shipId].currentHp = hp;
    return this.save(data);
  },

  healShipFully(shipId) {
    const data = this.load();
    if (!data.ships[shipId]) return false;
    data.ships[shipId].currentHp = null; // null = full HP
    data.ships[shipId].repairEndTime = null;
    return this.save(data);
  },

  isShipDamaged(shipId, maxHp) {
    const hp = this.getShipCurrentHp(shipId, maxHp);
    return hp !== null && hp < maxHp;
  },

  // Repair dock management
  getOwnedDockCount() {
    return this.get('ownedDocks') || 2;
  },

  getDockPurchaseCost(currentCount) {
    // Cost increases: 500, 1000, 2000 for docks 3, 4, 5
    const costs = [0, 0, 500, 1000, 2000];
    return costs[currentCount] || 0;
  },

  purchaseDock() {
    const data = this.load();
    const currentDocks = data.ownedDocks || 2;
    if (currentDocks >= 5) return { success: false, error: 'Maximum docks reached' };

    const cost = this.getDockPurchaseCost(currentDocks);
    if (data.currency < cost) return { success: false, error: 'Not enough fuel' };

    data.currency -= cost;
    data.ownedDocks = currentDocks + 1;
    this.save(data);
    return { success: true, newCount: data.ownedDocks };
  },

  getRepairDocks() {
    const data = this.load();
    const ownedCount = data.ownedDocks || 2;
    const docks = data.repairDocks || [null, null, null, null, null];
    return docks.slice(0, ownedCount);
  },

  startRepair(shipId, repairEndTime) {
    const data = this.load();
    if (!data.ships[shipId]) return { success: false, error: 'Ship not found' };

    // Find empty dock within owned docks
    if (!data.repairDocks) data.repairDocks = [null, null, null, null, null];
    const ownedCount = data.ownedDocks || 2;
    let emptyDock = -1;
    for (let i = 0; i < ownedCount; i++) {
      if (data.repairDocks[i] === null) {
        emptyDock = i;
        break;
      }
    }
    if (emptyDock === -1) return { success: false, error: 'No empty docks' };

    // Check if already repairing
    if (data.repairDocks.includes(shipId)) return { success: false, error: 'Already repairing' };

    data.repairDocks[emptyDock] = shipId;
    data.ships[shipId].repairEndTime = repairEndTime;
    this.save(data);
    return { success: true, dockIndex: emptyDock };
  },

  isShipRepairing(shipId) {
    const data = this.load();
    const ship = data.ships[shipId];
    if (!ship || !ship.repairEndTime) return false;
    return Date.now() < ship.repairEndTime;
  },

  getRepairTimeRemaining(shipId) {
    const data = this.load();
    const ship = data.ships[shipId];
    if (!ship || !ship.repairEndTime) return 0;
    return Math.max(0, ship.repairEndTime - Date.now());
  },

  checkAndCompleteRepairs() {
    const data = this.load();
    if (!data.repairDocks) return [];

    const completed = [];
    data.repairDocks.forEach((shipId, idx) => {
      if (shipId && data.ships[shipId]) {
        const ship = data.ships[shipId];
        if (ship.repairEndTime && Date.now() >= ship.repairEndTime) {
          // Repair complete
          ship.currentHp = null; // Full HP
          ship.repairEndTime = null;
          data.repairDocks[idx] = null;
          completed.push(shipId);
        }
      }
    });

    if (completed.length > 0) this.save(data);
    return completed;
  },

  cancelRepair(shipId) {
    const data = this.load();
    if (!data.repairDocks) return false;

    const dockIdx = data.repairDocks.indexOf(shipId);
    if (dockIdx === -1) return false;

    data.repairDocks[dockIdx] = null;
    if (data.ships[shipId]) {
      data.ships[shipId].repairEndTime = null;
    }
    return this.save(data);
  },

  instantRepair(shipId) {
    const data = this.load();
    if (!data.repairDocks) return false;

    const dockIdx = data.repairDocks.indexOf(shipId);
    if (dockIdx === -1) return false;

    // Complete repair instantly
    if (data.ships[shipId]) {
      data.ships[shipId].currentHp = null;
      data.ships[shipId].repairEndTime = null;
    }
    data.repairDocks[dockIdx] = null;
    return this.save(data);
  },

  getShipsNeedingRepair(getMaxHpFn) {
    const data = this.load();
    const damaged = [];

    Object.keys(data.ships).forEach(shipId => {
      const ship = data.ships[shipId];
      if (ship.currentHp !== null && ship.currentHp !== undefined) {
        // Ship has damage
        const maxHp = getMaxHpFn(shipId, ship.level);
        if (ship.currentHp < maxHp && !ship.repairEndTime) {
          damaged.push({ shipId, currentHp: ship.currentHp, maxHp });
        }
      }
    });

    return damaged;
  },

  // Resource node collection tracking (for one-time ticket rewards)
  getCollectedResourceNodes() {
    return this.get('collectedResourceNodes') || {};
  },

  hasCollectedResourceNode(mapId, nodeId) {
    const collected = this.getCollectedResourceNodes();
    return collected[`${mapId}_${nodeId}`] === true;
  },

  markResourceNodeCollected(mapId, nodeId) {
    const data = this.load();
    if (!data.collectedResourceNodes) data.collectedResourceNodes = {};
    data.collectedResourceNodes[`${mapId}_${nodeId}`] = true;
    return this.save(data);
  },

  // Equipment management
  addEquipment(equipId) {
    const data = this.load();
    if (!data.ownedEquipment) data.ownedEquipment = [];
    data.ownedEquipment.push(equipId);
    this.save(data);
    return data.ownedEquipment.length - 1; // Return index of new equipment
  },

  getOwnedEquipment() {
    return this.get('ownedEquipment') || [];
  },

  equipToShip(shipId, slot, equipIdx) {
    const data = this.load();
    if (!data.shipEquipment) data.shipEquipment = {};
    if (!data.shipEquipment[shipId]) data.shipEquipment[shipId] = [null, null, null];

    // Check if equipment is already equipped on another ship
    for (const [sid, slots] of Object.entries(data.shipEquipment)) {
      if (sid !== shipId && slots && slots.includes(equipIdx)) {
        return { success: false, error: 'Equipment already in use' };
      }
    }

    data.shipEquipment[shipId][slot] = equipIdx;
    this.save(data);
    return { success: true };
  },

  unequipFromShip(shipId, slot) {
    const data = this.load();
    if (!data.shipEquipment || !data.shipEquipment[shipId]) return false;
    data.shipEquipment[shipId][slot] = null;
    return this.save(data);
  },

  getShipEquipment(shipId) {
    const data = this.load();
    if (!data.shipEquipment) return [null, null, null];
    return data.shipEquipment[shipId] || [null, null, null];
  },

  getUnequippedEquipment() {
    const data = this.load();
    if (!data.ownedEquipment) return [];

    // Get all equipped indices
    const equippedIndices = new Set();
    if (data.shipEquipment) {
      Object.values(data.shipEquipment).forEach(slots => {
        if (slots) {
          slots.forEach(idx => {
            if (idx !== null) equippedIndices.add(idx);
          });
        }
      });
    }

    // Return equipment not in use
    return data.ownedEquipment
      .map((id, idx) => ({ id, idx }))
      .filter(e => !equippedIndices.has(e.idx));
  },

  // Formation management
  setLastFormation(formationId) {
    return this.set('lastFormation', formationId);
  },

  getLastFormation() {
    return this.get('lastFormation') || 'LINE_AHEAD';
  },

  // Artwork mode management (pokemon vs anime ship girls)
  getArtworkMode() {
    const mode = this.get('artworkMode');
    // Handle legacy 'pixel' mode - treat as 'pokemon'
    if (!mode || mode === 'pixel') return 'pokemon';
    return mode;
  },

  setArtworkMode(mode) {
    if (mode !== 'pokemon' && mode !== 'anime') return false;
    return this.set('artworkMode', mode);
  },

  toggleArtworkMode() {
    const current = this.getArtworkMode();
    const newMode = current === 'pokemon' ? 'anime' : 'pokemon';
    this.setArtworkMode(newMode);
    return newMode;
  },
};
