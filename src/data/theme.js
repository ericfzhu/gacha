// Theme system for Pokemon vs Ship Girls mode
// Handles name mappings and terminology

import { Storage } from '../systems/storage.js';
import { SHIP_TO_POKEMON } from './pokemonMapping.js';

// Get current theme mode
export function getThemeMode() {
  return Storage.getArtworkMode() || 'pokemon';
}

export function isPokemonMode() {
  return getThemeMode() === 'pokemon';
}

// Theme-specific terminology
const TERMINOLOGY = {
  pokemon: {
    gameTitle: 'Pokemon Collection',
    secretary: 'Partner',
    secretaryShip: 'Partner Pokemon',
    fleet: 'Team',
    fleetSlot: 'Team Slot',
    organize: 'Pokemon',
    organizeDesc: 'Manage your team',
    sortie: 'Battle',
    sortieDesc: 'Go on an adventure',
    construction: 'Catch',
    constructionDesc: 'Find new Pokemon',
    collection: 'Pokedex',
    collectionDesc: 'View Pokemon collection',
    repair: 'Pokemon Center',
    repairDesc: 'Heal your Pokemon',
    repairDock: 'Healing Station',
    admiral: 'Trainer',
    shipCount: 'Pokemon',
    shipType: {
      'Destroyer': 'Speed Type',
      'Light Cruiser': 'Water Type',
      'Heavy Cruiser': 'Tank Type',
      'Battleship': 'Power Type',
      'Carrier': 'Flying Type',
    },
    // Battle terminology
    damage: 'damage',
    sunk: 'fainted',
    hp: 'HP',
    attack: 'ATK',
    defense: 'DEF',
    speed: 'SPD',
    evasion: 'EVA',
    // Messages
    greetingMorning: 'Good morning, Trainer!',
    greetingAfternoon: 'Good afternoon, Trainer!',
    greetingEvening: 'Good evening, Trainer!',
    greetingNight: "It's late, Trainer...",
    reportingForDuty: '{name} is ready to battle!',
    shallWeSortie: 'Shall we go on an adventure?',
    fleetReady: 'The team is ready!',
    doMyBest: "I'll do my best!",
    leaveItToMe: 'Leave it to me!',
    somethingWrong: 'Trainer, is something wrong?',
    countingOnYou: "I'm counting on you!",
  },
  anime: {
    gameTitle: 'Fleet Collection',
    secretary: 'Secretary',
    secretaryShip: 'Secretary Ship',
    fleet: 'Fleet',
    fleetSlot: 'Fleet Slot',
    organize: 'Organize',
    organizeDesc: 'Manage fleet composition',
    sortie: 'Sortie',
    sortieDesc: 'Deploy fleet for combat',
    construction: 'Construction',
    constructionDesc: 'Build new ships',
    collection: 'Collection',
    collectionDesc: 'View ship collection',
    repair: 'Repair Dock',
    repairDesc: 'Repair damaged ships',
    repairDock: 'Repair Dock',
    admiral: 'Admiral',
    shipCount: 'ships',
    shipType: {
      'Destroyer': 'Destroyer',
      'Light Cruiser': 'Light Cruiser',
      'Heavy Cruiser': 'Heavy Cruiser',
      'Battleship': 'Battleship',
      'Carrier': 'Carrier',
    },
    // Battle terminology
    damage: 'damage',
    sunk: 'sunk',
    hp: 'HP',
    attack: 'ATK',
    defense: 'DEF',
    speed: 'SPD',
    evasion: 'EVA',
    // Messages
    greetingMorning: 'Good morning, Admiral!',
    greetingAfternoon: 'Good afternoon, Admiral!',
    greetingEvening: 'Good evening, Admiral!',
    greetingNight: "It's late, Admiral...",
    reportingForDuty: '{name}, reporting for duty!',
    shallWeSortie: 'Shall we sortie today?',
    fleetReady: 'The fleet is ready!',
    doMyBest: "I'll do my best!",
    leaveItToMe: 'Leave it to me!',
    somethingWrong: 'Admiral, is something wrong?',
    countingOnYou: "I'm counting on you!",
  }
};

// Get terminology for current theme
export function getTerms() {
  return TERMINOLOGY[getThemeMode()];
}

// Get a specific term
export function getTerm(key) {
  const terms = getTerms();
  return terms[key] || TERMINOLOGY.anime[key] || key;
}

// Get display name for a ship (Pokemon name in Pokemon mode, ship name in anime mode)
export function getDisplayName(shipId, shipName) {
  if (isPokemonMode()) {
    const pokemon = SHIP_TO_POKEMON[shipId];
    return pokemon ? pokemon.name : shipName;
  }
  return shipName;
}

// Get ship type display name
export function getShipTypeDisplay(shipType) {
  const terms = getTerms();
  return terms.shipType[shipType] || shipType;
}

// Get themed greeting based on time of day
export function getTimeGreeting() {
  const hour = new Date().getHours();
  const terms = getTerms();

  if (hour >= 5 && hour < 12) {
    return terms.greetingMorning;
  } else if (hour >= 12 && hour < 17) {
    return terms.greetingAfternoon;
  } else if (hour >= 17 && hour < 21) {
    return terms.greetingEvening;
  } else {
    return terms.greetingNight;
  }
}

// Get themed messages for secretary/partner
export function getSecretaryMessages(shipId, shipName) {
  const terms = getTerms();
  const displayName = getDisplayName(shipId, shipName);

  return [
    getTimeGreeting(),
    terms.reportingForDuty.replace('{name}', displayName),
    terms.shallWeSortie,
    terms.fleetReady,
    terms.doMyBest,
    terms.leaveItToMe,
    terms.somethingWrong,
    terms.countingOnYou,
  ];
}
