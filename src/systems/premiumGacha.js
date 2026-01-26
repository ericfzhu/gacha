// Premium Gacha system for Valentine's gift selection
// Features 3 Grand Prizes (real Valentine's gifts) and consolation prizes

import { Storage } from './storage.js';
import { SHIPS, getShipsByRarity } from '../data/ships.js';

// Grand Prize definitions - Valentine's gift choices
// Names and descriptions are configurable via environment variables:
// VITE_PRIZE1_NAME, VITE_PRIZE1_DESC
// VITE_PRIZE2_NAME, VITE_PRIZE2_DESC
// VITE_PRIZE3_NAME, VITE_PRIZE3_DESC
export const GRAND_PRIZES = {
  prize1: {
    key: 'prize1',
    name: import.meta.env.VITE_PRIZE1_NAME || 'Gift Choice #1',
    description: import.meta.env.VITE_PRIZE1_DESC || 'Your first Valentine\'s gift option!',
    rate: 2.0, // 2% chance
    tokenCost: 50,
    color: 0xff6b8a, // Pink
  },
  prize2: {
    key: 'prize2',
    name: import.meta.env.VITE_PRIZE2_NAME || 'Gift Choice #2',
    description: import.meta.env.VITE_PRIZE2_DESC || 'Your second Valentine\'s gift option!',
    rate: 0.5, // 0.5% chance
    tokenCost: 100,
    color: 0x8b5cf6, // Purple
  },
  prize3: {
    key: 'prize3',
    name: import.meta.env.VITE_PRIZE3_NAME || 'Gift Choice #3',
    description: import.meta.env.VITE_PRIZE3_DESC || 'Your third Valentine\'s gift option!',
    rate: 0.2, // 0.2% chance
    tokenCost: 150,
    color: 0xfbbf24, // Gold
  },
};

// Consolation prize definitions
export const CONSOLATION_PRIZES = {
  shipSR: {
    name: 'Super Rare Ship',
    description: 'A powerful SR-rarity ship joins your fleet!',
    rate: 12.3,
    tokens: 1,
  },
  equipment: {
    name: 'Rare Equipment Box',
    description: 'Contains useful equipment for your ships.',
    rate: 25.0,
    tokens: 1,
  },
  resources: {
    name: 'Resource Pack',
    description: '+500 resources for construction.',
    rate: 30.0,
    tokens: 1,
  },
  smallResources: {
    name: 'Supply Crate',
    description: '+200 resources.',
    rate: 30.0,
    tokens: 1,
  },
};

export const PremiumGacha = {
  // Check if player can pull
  canPull() {
    return Storage.getTickets() >= 1;
  },

  canPull10() {
    return Storage.getTickets() >= 10;
  },

  // Get current available grand prizes (excludes already obtained)
  getAvailableGrandPrizes() {
    const obtained = Storage.getGrandPrizes();
    return Object.values(GRAND_PRIZES).filter(prize => !obtained[prize.key]);
  },

  // Calculate adjusted rates based on obtained grand prizes
  getAdjustedRates() {
    const available = this.getAvailableGrandPrizes();
    let redistributedRate = 0;

    // Calculate how much rate to redistribute
    Object.values(GRAND_PRIZES).forEach(prize => {
      if (Storage.hasGrandPrize(prize.key)) {
        redistributedRate += prize.rate;
      }
    });

    // Add redistributed rate to first consolation prize
    const adjustedConsolation = { ...CONSOLATION_PRIZES };
    adjustedConsolation.shipSR = {
      ...adjustedConsolation.shipSR,
      rate: adjustedConsolation.shipSR.rate + redistributedRate,
    };

    return {
      grandPrizes: available,
      consolation: adjustedConsolation,
    };
  },

  // Perform a single pull
  pull() {
    if (!this.canPull()) return null;

    Storage.spendTickets(1);
    Storage.incrementPremiumPulls();

    const result = this.rollReward();

    // Award tokens based on result
    let tokensEarned = 1;

    // Handle result
    if (result.type === 'grandPrize') {
      Storage.setGrandPrizeObtained(result.prize.key);
      tokensEarned = 5; // Grand prize gives 5 tokens
    }

    Storage.addPityTokens(tokensEarned);

    // Apply consolation effects
    if (result.type === 'consolation') {
      this.applyConsolationReward(result.consolation);
    }

    return {
      ...result,
      tokensEarned,
      totalTokens: Storage.getPityTokens(),
    };
  },

  // Perform 10 pulls
  pull10() {
    const results = [];
    for (let i = 0; i < 10; i++) {
      if (!this.canPull()) break;
      const result = this.pull();
      if (result) results.push(result);
    }
    return results;
  },

  // Roll for a reward
  rollReward() {
    const rates = this.getAdjustedRates();
    const roll = Math.random() * 100;
    let cumulative = 0;

    // Check grand prizes first
    for (const prize of rates.grandPrizes) {
      cumulative += prize.rate;
      if (roll < cumulative) {
        return {
          type: 'grandPrize',
          prize,
          isNew: true,
        };
      }
    }

    // Check consolation prizes
    for (const [key, consolation] of Object.entries(rates.consolation)) {
      cumulative += consolation.rate;
      if (roll < cumulative) {
        return {
          type: 'consolation',
          consolation: { ...consolation, key },
        };
      }
    }

    // Fallback to last consolation
    const lastKey = Object.keys(rates.consolation).pop();
    return {
      type: 'consolation',
      consolation: { ...rates.consolation[lastKey], key: lastKey },
    };
  },

  // Apply consolation reward effects
  applyConsolationReward(consolation) {
    switch (consolation.key) {
      case 'shipSR':
        // Give a random SR ship
        const srShips = getShipsByRarity('SR');
        if (srShips.length > 0) {
          const ship = srShips[Math.floor(Math.random() * srShips.length)];
          Storage.addShip(ship.id);
        }
        break;
      case 'equipment':
        // Give resources as placeholder for equipment
        Storage.addCurrency(300);
        break;
      case 'resources':
        Storage.addCurrency(500);
        break;
      case 'smallResources':
        Storage.addCurrency(200);
        break;
    }
  },

  // Exchange tokens for a grand prize
  exchangeForPrize(prizeKey) {
    const prize = GRAND_PRIZES[prizeKey];
    if (!prize) return { success: false, error: 'Invalid prize' };

    if (Storage.hasGrandPrize(prizeKey)) {
      return { success: false, error: 'Already obtained' };
    }

    const tokens = Storage.getPityTokens();
    if (tokens < prize.tokenCost) {
      return { success: false, error: 'Not enough tokens' };
    }

    Storage.spendPityTokens(prize.tokenCost);
    Storage.setGrandPrizeObtained(prizeKey);

    return {
      success: true,
      prize,
    };
  },

  // Get exchange shop info
  getExchangeInfo() {
    const tokens = Storage.getPityTokens();
    const obtained = Storage.getGrandPrizes();

    return Object.values(GRAND_PRIZES).map(prize => ({
      ...prize,
      obtained: obtained[prize.key],
      canAfford: tokens >= prize.tokenCost,
      tokensNeeded: Math.max(0, prize.tokenCost - tokens),
    }));
  },

  // Check if all grand prizes obtained
  allPrizesObtained() {
    return Storage.getObtainedGrandPrizeCount() >= 3;
  },
};
