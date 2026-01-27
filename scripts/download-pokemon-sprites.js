#!/usr/bin/env node
// Download Pokemon sprites for the gacha game
// Uses PokeAPI for official sprites

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ship to Pokemon mapping
const SHIP_TO_POKEMON = {
  // Destroyers
  'dd_001': 'pikachu',
  'dd_002': 'eevee',
  'dd_003': 'vulpix',
  'dd_004': 'meowth',
  'dd_005': 'psyduck',
  'dd_006': 'raichu',
  'dd_007': 'espeon',
  'dd_008': 'growlithe',
  'dd_009': 'ponyta',
  'dd_010': 'jolteon',
  'dd_011': 'flareon',
  'dd_012': 'vaporeon',
  // Light Cruisers
  'cl_001': 'squirtle',
  'cl_002': 'wartortle',
  'cl_003': 'dewgong',
  'cl_004': 'seadra',
  'cl_005': 'golduck',
  'cl_006': 'seel',
  'cl_007': 'horsea',
  'cl_008': 'starmie',
  'cl_009': 'kingdra',
  'cl_010': 'milotic',
  // Heavy Cruisers
  'ca_001': 'blastoise',
  'ca_002': 'poliwrath',
  'ca_003': 'slowbro',
  'ca_004': 'poliwhirl',
  'ca_005': 'gyarados',
  'ca_006': 'lapras',
  'ca_007': 'feraligatr',
  'ca_008': 'slowking',
  // Battleships
  'bb_001': 'arcanine',
  'bb_002': 'ninetales',
  'bb_003': 'rapidash',
  'bb_004': 'typhlosion',
  'bb_005': 'tyranitar',
  'bb_006': 'aggron',
  'bb_007': 'dialga',
  'bb_008': 'palkia',
  // Carriers
  'cv_001': 'pidgeot',
  'cv_002': 'articuno',
  'cv_003': 'dragonite',
  'cv_004': 'salamence',
  'cv_005': 'moltres',
  'cv_006': 'zapdos',
  'cv_007': 'charizard',
  'cv_008': 'lugia',
  'cvl_001': 'fearow',
  'cvl_002': 'noctowl',
  'cvl_003': 'togekiss',
};

// Fetch JSON from URL
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Download file from URL
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(filepath);
        downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function downloadPokemonSprite(pokemon, shipId, outputDir, type = 'card') {
  try {
    // Get Pokemon data from PokeAPI
    const data = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);

    // Choose sprite based on type
    let spriteUrl;
    if (type === 'card') {
      // Use official artwork for cards
      spriteUrl = data.sprites.other['official-artwork'].front_default;
    } else {
      // Use pixel sprite for banners
      spriteUrl = data.sprites.front_default;
    }

    if (!spriteUrl) {
      console.error(`No sprite found for ${pokemon}`);
      return false;
    }

    const subDir = type === 'card' ? 'ships_pokemon' : 'banners_pokemon';
    const dir = path.join(outputDir, subDir);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const filepath = path.join(dir, `${shipId}.png`);
    await downloadFile(spriteUrl, filepath);
    console.log(`Downloaded: ${filepath} (${pokemon})`);
    return true;
  } catch (err) {
    console.error(`Failed to download ${pokemon}: ${err.message}`);
    return false;
  }
}

async function main() {
  const outputDir = path.join(__dirname, '../public/assets');

  console.log('Downloading Pokemon sprites...\n');

  const entries = Object.entries(SHIP_TO_POKEMON);

  for (const [shipId, pokemon] of entries) {
    // Download both card (official artwork) and banner (pixel sprite)
    await downloadPokemonSprite(pokemon, shipId, outputDir, 'card');
    await downloadPokemonSprite(pokemon, shipId, outputDir, 'banner');

    // Small delay to be nice to the API
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\nDone!');
}

main().catch(console.error);
