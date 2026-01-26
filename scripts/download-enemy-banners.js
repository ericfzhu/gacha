// Script to download KanColle Abyssal enemy ship banner images from the wiki
// Run with: node scripts/download-enemy-banners.js

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets', 'banners');

// Abyssal enemy ships matching enemies.js
const ENEMIES = [
  // Destroyers
  { id: 'enemy_dd_i', wikiName: 'Destroyer_I-Class' },
  { id: 'enemy_dd_ro', wikiName: 'Destroyer_Ro-Class' },
  { id: 'enemy_dd_ha', wikiName: 'Destroyer_Ha-Class' },
  { id: 'enemy_dd_ni', wikiName: 'Destroyer_Ni-Class' },
  // Light Cruisers
  { id: 'enemy_cl_ho', wikiName: 'Light_Cruiser_Ho-Class' },
  { id: 'enemy_cl_he', wikiName: 'Light_Cruiser_He-Class' },
  { id: 'enemy_cl_to', wikiName: 'Light_Cruiser_To-Class' },
  { id: 'enemy_cl_tsu', wikiName: 'Light_Cruiser_Tsu-Class' },
  // Heavy Cruisers
  { id: 'enemy_ca_ri', wikiName: 'Heavy_Cruiser_Ri-Class' },
  { id: 'enemy_ca_ne', wikiName: 'Heavy_Cruiser_Ne-Class' },
  // Battleships
  { id: 'enemy_bb_ru', wikiName: 'Battleship_Ru-Class' },
  { id: 'enemy_bb_ta', wikiName: 'Battleship_Ta-Class' },
  { id: 'enemy_bb_re', wikiName: 'Battleship_Re-Class' },
  // Carriers
  { id: 'enemy_cv_wo', wikiName: 'Standard_Carrier_Wo-Class' },
  { id: 'enemy_cvl_nu', wikiName: 'Light_Carrier_Nu-Class' },
];

// Fetch a URL and return the response body
function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    }, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetch(res.headers.location).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Extract banner image URL from enemy wiki page
function extractBannerUrl(html, wikiName) {
  const htmlStr = html.toString();

  // Abyssal ships use Enemy_Full_ naming pattern
  // Example: Enemy_Full_Destroyer_I-Class.png
  // Extract ship class name from wiki name (e.g., "Destroyer_I-Class" -> "Destroyer_I-Class")
  const className = wikiName.replace(/_/g, '_');

  // Look for the basic (non-elite, non-flagship) version
  const patterns = [
    // Thumbnail version - we'll convert to full
    new RegExp(`src="(https://yksk\\.kancollewiki\\.net/w/images/thumb/[^"]+/Enemy_Full_${className}\\.png/[^"]+)"`, 'i'),
    // Direct full image
    new RegExp(`src="(https://yksk\\.kancollewiki\\.net/w/images/[^"]+/Enemy_Full_${className}\\.png)"`, 'i'),
    // Fallback - any Enemy_Full image for this class (basic version only)
    new RegExp(`(https://yksk\\.kancollewiki\\.net/w/images/[^"\\s]+/Enemy_Full_${className}\\.png)`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = htmlStr.match(pattern);
    if (match) {
      let url = match[1];
      // Convert thumbnail URL to full image URL
      // From: /thumb/X/XX/Enemy_Full_Name.png/300px-Enemy_Full_Name.png
      // To: /X/XX/Enemy_Full_Name.png
      if (url.includes('/thumb/')) {
        url = url.replace(/\/thumb\//, '/').replace(/\/\d+px-[^/]+$/, '');
      }
      return url;
    }
  }

  return null;
}

async function downloadBanner(enemy) {
  const filepath = path.join(ASSETS_DIR, `${enemy.id}.png`);

  // Skip if already downloaded
  if (fs.existsSync(filepath)) {
    console.log(`✓ ${enemy.wikiName} (${enemy.id}) - already exists`);
    return true;
  }

  try {
    // Fetch enemy's wiki page
    const wikiUrl = `https://en.kancollewiki.net/${enemy.wikiName}`;
    console.log(`Fetching ${enemy.wikiName}...`);
    const html = await fetch(wikiUrl);

    // Extract banner URL from HTML
    const bannerUrl = extractBannerUrl(html, enemy.wikiName);
    if (!bannerUrl) {
      console.log(`✗ ${enemy.wikiName} - could not find banner URL`);
      return false;
    }

    // Download the banner image
    console.log(`  Downloading from: ${bannerUrl.substring(0, 60)}...`);
    const imageData = await fetch(bannerUrl);
    fs.writeFileSync(filepath, imageData);
    console.log(`✓ ${enemy.wikiName} (${enemy.id}) - downloaded`);
    return true;
  } catch (error) {
    console.log(`✗ ${enemy.wikiName} - ${error.message}`);
    return false;
  }
}

async function main() {
  // Create assets directory
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  console.log(`Banner assets directory: ${ASSETS_DIR}\n`);

  let success = 0;
  let failed = 0;
  const failedEnemies = [];

  for (const enemy of ENEMIES) {
    const ok = await downloadBanner(enemy);
    if (ok) success++;
    else {
      failed++;
      failedEnemies.push(enemy);
    }

    // Be polite - wait between requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nDone! ${success} downloaded, ${failed} failed`);

  if (failed > 0) {
    console.log('\nFailed enemies - download manually from https://en.kancollewiki.net/[WikiName]');
    console.log('Save to: ' + ASSETS_DIR);
    console.log('\nEnemies to download:');
    failedEnemies.forEach(enemy => {
      console.log(`  ${enemy.wikiName} -> save as ${enemy.id}.png`);
    });
  }
}

main().catch(console.error);
