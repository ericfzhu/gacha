// Script to download KanColle ship portraits from the wiki
// Run with: node scripts/download-assets.js

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets', 'ships');

// Ship data matching your ships.js
const SHIPS = [
  { id: 'dd_001', name: 'Fubuki' },
  { id: 'dd_002', name: 'Shirayuki' },
  { id: 'dd_003', name: 'Hatsuyuki' },
  { id: 'dd_004', name: 'Mutsuki' },
  { id: 'dd_005', name: 'Kisaragi' },
  { id: 'dd_006', name: 'Shimakaze' },
  { id: 'dd_007', name: 'Yukikaze' },
  { id: 'cl_001', name: 'Tenryuu' },
  { id: 'cl_002', name: 'Tatsuta' },
  { id: 'cl_003', name: 'Kuma' },
  { id: 'ca_001', name: 'Takao' },
  { id: 'ca_002', name: 'Atago' },
  { id: 'ca_003', name: 'Tone' },
  { id: 'bb_001', name: 'Kongou' },
  { id: 'bb_002', name: 'Hiei' },
  { id: 'bb_003', name: 'Haruna' },
  { id: 'bb_004', name: 'Kirishima' },
  { id: 'bb_005', name: 'Nagato' },
  { id: 'bb_006', name: 'Mutsu' },
  { id: 'bb_007', name: 'Yamato' },
  { id: 'bb_008', name: 'Musashi' },
  { id: 'cv_001', name: 'Houshou' },
  { id: 'cv_002', name: 'Akagi' },
  { id: 'cv_003', name: 'Kaga' },
  { id: 'cv_004', name: 'Shinano' },
];

// Fetch a URL and return the response body
function fetch(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, {
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
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Download an image to a file
async function downloadImage(url, filepath) {
  const data = await fetch(url);
  fs.writeFileSync(filepath, data);
}

// Extract card image URL from wiki page
function extractImageUrl(html, shipName) {
  const htmlStr = html.toString();

  // Look for the ship card image - typically in a tabber or gallery
  // Pattern 1: Direct card image link
  const patterns = [
    // Match Card image in tabber
    /src="(https:\/\/[^"]*\/thumb\/[^"]*\d+_Card[^"]*\.png\/\d+px[^"]*\.png)"/i,
    // Match any ship card image
    new RegExp(`src="(https://[^"]*${shipName}[^"]*Card[^"]*\\.png[^"]*)"`, 'i'),
    // Match numbered card (e.g., 001_Card.png)
    /src="(https:\/\/[^"]*\/\d+_Card\.png[^"]*)"/i,
    // Fandom CDN pattern
    /src="(https:\/\/static\.wikia\.nocookie\.net[^"]*Card[^"]*\.png[^"]*)"/i,
  ];

  for (const pattern of patterns) {
    const match = htmlStr.match(pattern);
    if (match) {
      let url = match[1];
      // Remove thumbnail scaling to get full image
      url = url.replace(/\/thumb\//, '/').replace(/\/\d+px-[^/]+$/, '');
      return url;
    }
  }

  return null;
}

async function downloadShipAsset(ship) {
  const wikiUrl = `https://en.kancollewiki.net/${ship.name}`;
  const filepath = path.join(ASSETS_DIR, `${ship.id}.png`);

  // Skip if already downloaded
  if (fs.existsSync(filepath)) {
    console.log(`✓ ${ship.name} (${ship.id}) - already exists`);
    return true;
  }

  try {
    console.log(`Fetching ${ship.name}...`);
    const html = await fetch(wikiUrl);
    const imageUrl = extractImageUrl(html, ship.name);

    if (!imageUrl) {
      console.log(`✗ ${ship.name} - could not find card image URL`);
      return false;
    }

    console.log(`  Downloading from: ${imageUrl.substring(0, 80)}...`);
    await downloadImage(imageUrl, filepath);
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
  console.log(`Assets directory: ${ASSETS_DIR}\n`);

  let success = 0;
  let failed = 0;

  for (const ship of SHIPS) {
    const ok = await downloadShipAsset(ship);
    if (ok) success++;
    else failed++;

    // Be polite - wait between requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nDone! ${success} downloaded, ${failed} failed`);

  if (failed > 0) {
    console.log('\nFor failed downloads, you may need to manually save the images from:');
    console.log('https://en.kancollewiki.net/[ShipName]');
  }
}

main().catch(console.error);
