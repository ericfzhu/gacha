// Gacha pull system

import { SHIPS, RARITY, getShipsByRarity, getShipById } from '../data/ships.js';
import { Storage } from './storage.js';

const PULL_COST = 100;
const PITY_THRESHOLD = 90;

// XP bonus for pulling duplicate ships (scales with rarity)
const DUPLICATE_XP_BASE = {
  N: 50,
  R: 100,
  SR: 200,
  SSR: 500,
};
const DUPLICATE_XP_MULTIPLIER = 20;

export const DUPLICATE_XP = Object.fromEntries(
  Object.entries(DUPLICATE_XP_BASE).map(([k, v]) => [k, v * DUPLICATE_XP_MULTIPLIER])
);

export const Gacha = {
  getPullCost() {
    return PULL_COST;
  },

  canPull() {
    const currency = Storage.get('currency');
    return currency >= PULL_COST;
  },

  pull() {
    if (!this.canPull()) {
      return null;
    }

    Storage.spendCurrency(PULL_COST);

    const pity = Storage.get('pity');
    let rarity;

    if (pity >= PITY_THRESHOLD - 1) {
      rarity = 'SSR';
      Storage.resetPity();
    } else {
      rarity = this.rollRarity();
      if (rarity === 'SSR') {
        Storage.resetPity();
      } else {
        Storage.incrementPity();
      }
    }

    const ship = this.getRandomShipOfRarity(rarity);
    const isNew = Storage.addShip(ship.id);

    // Award XP for duplicates
    let xpGained = 0;
    let levelUp = null;
    if (!isNew) {
      xpGained = DUPLICATE_XP[ship.rarity] || 50;
      levelUp = Storage.addXpToShip(ship.id, xpGained, 99);
    }

    return {
      ship,
      isNew,
      xpGained,
      levelUp,
      pity: Storage.get('pity'),
    };
  },

  pull10() {
    const results = [];
    let guaranteedRareUsed = false;

    for (let i = 0; i < 10; i++) {
      if (!this.canPull()) break;

      if (i === 9 && !guaranteedRareUsed) {
        Storage.spendCurrency(PULL_COST);
        const rarity = this.rollRarity(['R', 'SR', 'SSR']);
        const ship = this.getRandomShipOfRarity(rarity);
        const isNew = Storage.addShip(ship.id);

        if (rarity === 'SSR') {
          Storage.resetPity();
        } else {
          Storage.incrementPity();
        }

        // Award XP for duplicates
        let xpGained = 0;
        let levelUp = null;
        if (!isNew) {
          xpGained = DUPLICATE_XP[ship.rarity] || 50;
          levelUp = Storage.addXpToShip(ship.id, xpGained, 99);
        }

        results.push({ ship, isNew, xpGained, levelUp, pity: Storage.get('pity') });
      } else {
        const result = this.pull();
        if (result) {
          results.push(result);
          if (['R', 'SR', 'SSR'].includes(result.ship.rarity)) {
            guaranteedRareUsed = true;
          }
        }
      }
    }

    return results;
  },

  rollRarity(allowedRarities = null) {
    const rarities = allowedRarities || Object.keys(RARITY);
    let totalWeight = 0;

    for (const r of rarities) {
      totalWeight += RARITY[r].weight;
    }

    let roll = Math.random() * totalWeight;

    for (const r of rarities) {
      roll -= RARITY[r].weight;
      if (roll <= 0) {
        return r;
      }
    }

    return rarities[0];
  },

  getRandomShipOfRarity(rarity) {
    const ships = getShipsByRarity(rarity);
    return ships[Math.floor(Math.random() * ships.length)];
  },

  getPity() {
    return Storage.get('pity');
  },

  getPityThreshold() {
    return PITY_THRESHOLD;
  },
};
