// Maps ship IDs to Pokemon for the "pixel" artwork mode
// Secret code "KANCOLLE" switches to anime ship girl artwork

export const SHIP_TO_POKEMON = {
  // === DESTROYERS (Fast, small Pokemon) ===
  // Normal Destroyers
  'dd_001': { pokemon: 'pikachu', name: 'Pikachu' },        // Fubuki
  'dd_002': { pokemon: 'eevee', name: 'Eevee' },            // Shirayuki
  'dd_003': { pokemon: 'vulpix', name: 'Vulpix' },          // Hatsuyuki
  'dd_004': { pokemon: 'meowth', name: 'Meowth' },          // Mutsuki
  'dd_005': { pokemon: 'psyduck', name: 'Psyduck' },        // Kisaragi
  'dd_008': { pokemon: 'growlithe', name: 'Growlithe' },    // Ayanami
  'dd_009': { pokemon: 'ponyta', name: 'Ponyta' },          // Akatsuki

  // Rare Destroyers
  'dd_010': { pokemon: 'jolteon', name: 'Jolteon' },        // Hibiki
  'dd_011': { pokemon: 'flareon', name: 'Flareon' },        // Shigure
  'dd_012': { pokemon: 'vaporeon', name: 'Vaporeon' },      // Yuudachi

  // SSR Destroyers
  'dd_006': { pokemon: 'raichu', name: 'Raichu' },          // Shimakaze (fast!)
  'dd_007': { pokemon: 'espeon', name: 'Espeon' },          // Yukikaze (lucky)

  // === LIGHT CRUISERS (Medium water/ice Pokemon) ===
  // Normal Light Cruisers
  'cl_001': { pokemon: 'squirtle', name: 'Squirtle' },      // Tenryuu
  'cl_002': { pokemon: 'wartortle', name: 'Wartortle' },    // Tatsuta
  'cl_006': { pokemon: 'seel', name: 'Seel' },              // Jintsuu
  'cl_007': { pokemon: 'horsea', name: 'Horsea' },          // Naka

  // Rare Light Cruisers
  'cl_003': { pokemon: 'dewgong', name: 'Dewgong' },        // Kuma
  'cl_004': { pokemon: 'seadra', name: 'Seadra' },          // Nagara
  'cl_005': { pokemon: 'golduck', name: 'Golduck' },        // Sendai

  // SR Light Cruisers
  'cl_008': { pokemon: 'starmie', name: 'Starmie' },        // Yuubari
  'cl_009': { pokemon: 'kingdra', name: 'Kingdra' },        // Agano
  'cl_010': { pokemon: 'milotic', name: 'Milotic' },        // Yahagi

  // === HEAVY CRUISERS (Bulky water Pokemon) ===
  // Normal Heavy Cruiser
  'ca_004': { pokemon: 'poliwhirl', name: 'Poliwhirl' },    // Choukai

  // Rare Heavy Cruisers
  'ca_001': { pokemon: 'blastoise', name: 'Blastoise' },    // Takao
  'ca_002': { pokemon: 'poliwrath', name: 'Poliwrath' },    // Atago
  'ca_003': { pokemon: 'slowbro', name: 'Slowbro' },        // Maya
  'ca_006': { pokemon: 'lapras', name: 'Lapras' },          // Chikuma
  'ca_007': { pokemon: 'feraligatr', name: 'Feraligatr' },  // Suzuya
  'ca_008': { pokemon: 'slowking', name: 'Slowking' },      // Kumano

  // SR Heavy Cruiser
  'ca_005': { pokemon: 'gyarados', name: 'Gyarados' },      // Tone

  // === BATTLESHIPS (Powerful, tanky Pokemon) ===
  // SR Battleships (Kongou-class)
  'bb_001': { pokemon: 'arcanine', name: 'Arcanine' },      // Kongou
  'bb_002': { pokemon: 'ninetales', name: 'Ninetales' },    // Hiei
  'bb_003': { pokemon: 'rapidash', name: 'Rapidash' },      // Haruna
  'bb_004': { pokemon: 'typhlosion', name: 'Typhlosion' },  // Kirishima

  // SSR Battleships (Nagato-class)
  'bb_005': { pokemon: 'tyranitar', name: 'Tyranitar' },    // Nagato
  'bb_006': { pokemon: 'aggron', name: 'Aggron' },          // Mutsu

  // SSR Battleships (Yamato-class) - Legendaries!
  'bb_007': { pokemon: 'dialga', name: 'Dialga' },          // Yamato
  'bb_008': { pokemon: 'palkia', name: 'Palkia' },          // Musashi

  // === CARRIERS (Flying/Dragon Pokemon) ===
  // Normal Carrier
  'cv_001': { pokemon: 'pidgeot', name: 'Pidgeot' },        // Houshou

  // Rare Light Carriers
  'cvl_001': { pokemon: 'fearow', name: 'Fearow' },         // Ryuujou
  'cvl_002': { pokemon: 'noctowl', name: 'Noctowl' },       // Shouhou

  // SR Carriers
  'cvl_003': { pokemon: 'togekiss', name: 'Togekiss' },     // Zuihou
  'cv_003': { pokemon: 'dragonite', name: 'Dragonite' },    // Souryuu
  'cv_004': { pokemon: 'salamence', name: 'Salamence' },    // Shoukaku
  'cv_007': { pokemon: 'charizard', name: 'Charizard' },    // Kaga

  // SSR Carriers - Legendaries!
  'cv_002': { pokemon: 'articuno', name: 'Articuno' },      // Hiryuu
  'cv_005': { pokemon: 'moltres', name: 'Moltres' },        // Zuikaku
  'cv_006': { pokemon: 'zapdos', name: 'Zapdos' },          // Akagi
  'cv_008': { pokemon: 'lugia', name: 'Lugia' },            // Taihou
};

// Get Pokemon info for a ship
export function getPokemonForShip(shipId) {
  return SHIP_TO_POKEMON[shipId] || { pokemon: 'ditto', name: 'Ditto' };
}

// Get all unique Pokemon used
export function getAllPokemon() {
  const pokemon = new Set();
  Object.values(SHIP_TO_POKEMON).forEach(p => pokemon.add(p.pokemon));
  return Array.from(pokemon);
}
