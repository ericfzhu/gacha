// Script to download KanColle ship banner images from the wiki
// Run with: node scripts/download-banners.js

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets', 'banners');

// Ship data matching your ships.js
const SHIPS = [
  // Destroyers
  { id: 'dd_001', name: 'Fubuki' },
  { id: 'dd_002', name: 'Shirayuki' },
  { id: 'dd_003', name: 'Hatsuyuki' },
  { id: 'dd_004', name: 'Mutsuki' },
  { id: 'dd_005', name: 'Kisaragi' },
  { id: 'dd_006', name: 'Shimakaze' },
  { id: 'dd_007', name: 'Yukikaze' },
  { id: 'dd_008', name: 'Ayanami' },
  { id: 'dd_009', name: 'Akatsuki' },
  { id: 'dd_010', name: 'Hibiki' },
  { id: 'dd_011', name: 'Shigure' },
  { id: 'dd_012', name: 'Yuudachi' },
  // Light Cruisers
  { id: 'cl_001', name: 'Tenryuu' },
  { id: 'cl_002', name: 'Tatsuta' },
  { id: 'cl_003', name: 'Kuma' },
  { id: 'cl_004', name: 'Nagara' },
  { id: 'cl_005', name: 'Sendai' },
  { id: 'cl_006', name: 'Jintsuu' },
  { id: 'cl_007', name: 'Naka' },
  { id: 'cl_008', name: 'Yuubari' },
  { id: 'cl_009', name: 'Agano' },
  { id: 'cl_010', name: 'Yahagi' },
  // Heavy Cruisers
  { id: 'ca_001', name: 'Takao' },
  { id: 'ca_002', name: 'Atago' },
  { id: 'ca_003', name: 'Maya' },
  { id: 'ca_004', name: 'Choukai' },
  { id: 'ca_005', name: 'Tone' },
  { id: 'ca_006', name: 'Chikuma' },
  { id: 'ca_007', name: 'Suzuya' },
  { id: 'ca_008', name: 'Kumano' },
  // Battleships
  { id: 'bb_001', name: 'Kongou' },
  { id: 'bb_002', name: 'Hiei' },
  { id: 'bb_003', name: 'Haruna' },
  { id: 'bb_004', name: 'Kirishima' },
  { id: 'bb_005', name: 'Nagato' },
  { id: 'bb_006', name: 'Mutsu' },
  { id: 'bb_007', name: 'Yamato' },
  { id: 'bb_008', name: 'Musashi' },
  // Carriers
  { id: 'cv_001', name: 'Houshou' },
  { id: 'cvl_001', name: 'Ryuujou' },
  { id: 'cvl_002', name: 'Shouhou' },
  { id: 'cvl_003', name: 'Zuihou' },
  { id: 'cv_002', name: 'Hiryuu' },
  { id: 'cv_003', name: 'Souryuu' },
  { id: 'cv_004', name: 'Shoukaku' },
  { id: 'cv_005', name: 'Zuikaku' },
  { id: 'cv_006', name: 'Akagi' },
  { id: 'cv_007', name: 'Kaga' },
  { id: 'cv_008', name: 'Taihou' },
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

// Extract banner image URL from ship wiki page
function extractBannerUrl(html, shipName) {
  const htmlStr = html.toString();

  // Look for Ship_Banner_Name.png (not Damaged version)
  // Pattern: src="https://yksk.kancollewiki.net/w/images/X/XX/Ship_Banner_Name.png"
  const pattern = new RegExp(
    `src="(https://yksk\\.kancollewiki\\.net/w/images/[^"]+/Ship_Banner_${shipName}\\.png)"`,
    'i'
  );

  const match = htmlStr.match(pattern);
  if (match) {
    return match[1];
  }

  return null;
}

async function downloadBanner(ship) {
  const filepath = path.join(ASSETS_DIR, `${ship.id}.png`);

  // Skip if already downloaded
  if (fs.existsSync(filepath)) {
    console.log(`✓ ${ship.name} (${ship.id}) - already exists`);
    return true;
  }

  try {
    // Fetch ship's wiki page
    const wikiUrl = `https://en.kancollewiki.net/${ship.name}`;
    console.log(`Fetching ${ship.name} wiki page...`);
    const html = await fetch(wikiUrl);

    // Extract banner URL from HTML
    const bannerUrl = extractBannerUrl(html, ship.name);
    if (!bannerUrl) {
      console.log(`✗ ${ship.name} - could not find banner URL in wiki page`);
      return false;
    }

    // Download the banner image
    console.log(`  Downloading banner...`);
    const imageData = await fetch(bannerUrl);
    fs.writeFileSync(filepath, imageData);
    console.log(`✓ ${ship.name} (${ship.id}) - downloaded`);
    return true;
  } catch (error) {
    console.log(`✗ ${ship.name} - ${error.message}`);
    return false;
  }
}

async function main() {
  // Create assets directory
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  console.log(`Banner assets directory: ${ASSETS_DIR}\n`);

  let success = 0;
  let failed = 0;
  const failedShips = [];

  for (const ship of SHIPS) {
    const ok = await downloadBanner(ship);
    if (ok) success++;
    else {
      failed++;
      failedShips.push(ship);
    }

    // Be polite - wait between requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nDone! ${success} downloaded, ${failed} failed`);

  if (failed > 0) {
    console.log('\nFailed ships - download manually from https://en.kancollewiki.net/[ShipName]');
    console.log('Save to: ' + ASSETS_DIR);
    console.log('\nShips to download:');
    failedShips.forEach(ship => {
      console.log(`  ${ship.name} -> save as ${ship.id}.png`);
    });
  }
}

main().catch(console.error);
