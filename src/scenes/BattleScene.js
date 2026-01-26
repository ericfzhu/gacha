// Battle/Sortie scene (Notion style)

import Phaser from 'phaser';
import { Storage } from '../systems/storage.js';
import { getShipById, getShipStats, RARITY, SHIP_TYPES } from '../data/ships.js';
import { MAPS, MAP_ORDER, getMapById, getNodeById, getDamageState } from '../data/maps.js';
import { AudioManager, BGM } from '../systems/audio.js';
import { FORMATIONS, getFormationById } from '../data/formations.js';
import { SHIP_TYPE_ABBREV } from '../data/equipment.js';

// Notion-inspired colors
const COLORS = {
  bgPrimary: 0xffffff,
  bgSecondary: 0xf7f6f3,
  bgHover: 0xe9e9e7,
  textPrimary: 0x37352f,
  textSecondary: 0x787774,
  textTertiary: 0x9b9a97,
  border: 0xe9e9e7,
  accent: 0x2eaadc,
  success: 0x4dab9a,
  danger: 0xe03e3e,
};

// Stages with ticket rewards for special gift progression
// Reduced to 4 maps for ~30 minute gameplay
// First clear gives base tickets, S-rank gives +2 bonus
const STAGES = [
  { name: '1-1', title: 'Patrol Waters', enemies: ['dd_001', 'dd_002'], enemyLevels: [1, 1], tickets: 20, baseXp: 50 },
  { name: '1-2', title: 'Coastal Defense', enemies: ['cl_001', 'dd_003', 'dd_004'], enemyLevels: [5, 3, 3], tickets: 25, baseXp: 80 },
  { name: '2-1', title: 'Fleet Engagement', enemies: ['ca_001', 'cl_002', 'dd_005'], enemyLevels: [10, 8, 6], tickets: 25, baseXp: 120 },
  { name: '2-2', title: 'Final Battle', enemies: ['bb_001', 'ca_002', 'cl_003'], enemyLevels: [15, 12, 10], tickets: 30, baseXp: 180 },
];
// Total first-clear tickets: 20+25+25+30 = 100
// Total S-rank bonuses: 4 maps * 2 = 8
// Grand total from maps: 108 tickets (meets 100 target + buffer)

export class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  init(data) {
    // Map navigation mode data
    this.mapId = data?.mapId || null;
    this.nodeId = data?.nodeId || null;
    this.fleetHp = data?.fleetHp || {};
    this.isBoss = data?.isBoss || false;
    // Formation from FormationScene
    this.formation = data?.formation || Storage.getLastFormation();
    this.formationData = getFormationById(this.formation);
    // Battle speed: 1 = normal, 2 = fast, 3 = very fast
    // Load saved preference
    const savedSpeed = localStorage.getItem('battleSpeed');
    this.battleSpeed = savedSpeed ? parseInt(savedSpeed, 10) : 1;
    if (this.battleSpeed < 1 || this.battleSpeed > 3) this.battleSpeed = 1;
    // Night battle state
    this.inNightBattle = false;
  }

  create() {
    // Set audio scene reference
    AudioManager.setScene(this);

    // Check for completed repairs
    Storage.checkAndCompleteRepairs();

    // If we have map/node data, start battle directly
    if (this.mapId && this.nodeId) {
      // Play battle music when entering combat
      AudioManager.playBgm(BGM.BATTLE);
      this.startNodeBattle();
      return;
    }

    // Use actual window dimensions for sortie layout
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

    // Play menu music for map selection
    AudioManager.playBgm(BGM.MENU);

    // Otherwise show map selection
    this.createBackground();
    this.createHeader();

    const fleet = Storage.get('fleet').filter(id => id !== null);
    if (fleet.length === 0) {
      this.showNoFleetMessage();
      return;
    }

    // Check if fleet can sortie (no heavy damage ships)
    const canSortie = this.checkFleetCanSortie();
    if (!canSortie.ok) {
      this.showDamagedFleetMessage(canSortie.damaged);
      return;
    }

    this.createMapSelect();
    this.createBottomBar();
  }

  checkFleetCanSortie() {
    const fleet = Storage.get('fleet').filter(id => id !== null);
    const damaged = [];

    for (const shipId of fleet) {
      const shipData = getShipById(shipId);
      const savedData = Storage.getShipData(shipId);
      if (!shipData || !savedData) continue;

      const stats = getShipStats(shipData, savedData.level);
      const currentHp = Storage.getShipCurrentHp(shipId, stats.hp);
      const state = getDamageState(currentHp, stats.hp);

      if (!state.canSortie) {
        damaged.push({ shipData, currentHp, maxHp: stats.hp });
      }

      // Also check if repairing
      if (Storage.isShipRepairing(shipId)) {
        damaged.push({ shipData, currentHp, maxHp: stats.hp, repairing: true });
      }
    }

    return { ok: damaged.length === 0, damaged };
  }

  showDamagedFleetMessage(damagedShips) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.add.text(width / 2, height / 2 - 60, 'Cannot Sortie', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '24px',
      fill: '#e03e3e',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 20, 'Some ships are heavily damaged or repairing:', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: '#787774',
    }).setOrigin(0.5);

    damagedShips.forEach((ship, i) => {
      const status = ship.repairing ? '(Repairing)' : `(${ship.currentHp}/${ship.maxHp} HP)`;
      this.add.text(width / 2, height / 2 + 20 + i * 25, `${ship.shipData.name} ${status}`, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '13px',
        fill: '#e03e3e',
      }).setOrigin(0.5);
    });

    this.add.text(width / 2, height / 2 + 100, 'Visit the Dock to repair ships', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: '#9b9a97',
    }).setOrigin(0.5);
  }

  createBackground() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Notion-style clean background
    g.fillStyle(COLORS.bgSecondary, 1);
    g.fillRect(0, 0, width, height);
  }

  createHeader() {
    const width = window.innerWidth;
    const g = this.add.graphics();

    // Notion-style header
    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRect(0, 0, width, 56);
    g.fillStyle(COLORS.border, 1);
    g.fillRect(0, 55, width, 1);

    const backBtn = this.add.text(24, 28, '\u2190 Back', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: '#787774',
    }).setOrigin(0, 0.5).setInteractive();

    backBtn.on('pointerover', () => backBtn.setStyle({ fill: '#37352f' }));
    backBtn.on('pointerout', () => backBtn.setStyle({ fill: '#787774' }));
    backBtn.on('pointerdown', () => this.scene.start('TitleScene'));

    this.add.text(width / 2, 28, 'Sortie', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '20px',
      fill: '#37352f',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  showNoFleetMessage() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.add.text(width / 2, height / 2, 'No ships assigned\nGo to Organize first', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '18px',
      fill: '#9b9a97',
      align: 'center',
    }).setOrigin(0.5);
  }

  createMapSelect() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Calculate responsive panel widths
    const margin = 24;
    const gap = 16;
    const fleetPanelWidth = Math.min(320, width * 0.3);
    const mapPanelWidth = width - margin * 2 - gap - fleetPanelWidth;
    const panelHeight = height - 130;

    // Map panel - Notion card style
    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(margin, 72, mapPanelWidth, panelHeight, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(margin, 72, mapPanelWidth, panelHeight, 6);

    // Section title
    this.add.text(margin + 16, 92, 'Select Operation', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#9b9a97',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Create scrollable map list container
    const mapListTop = 115;
    const mapListHeight = panelHeight - 60;
    const mapButtonHeight = 70;
    const mapButtonSpacing = 8;
    const totalMapsHeight = MAP_ORDER.length * (mapButtonHeight + mapButtonSpacing);

    // Create mask for scrolling
    const maskShape = this.make.graphics();
    maskShape.fillRect(margin, mapListTop, mapPanelWidth, mapListHeight);
    const mask = maskShape.createGeometryMask();

    // Scrollable container for maps
    this.mapContainer = this.add.container(0, 0);
    this.mapContainer.setMask(mask);

    // Use MAP_ORDER to display maps
    const mapButtonCenterX = margin + mapPanelWidth / 2;
    MAP_ORDER.forEach((mapId, i) => {
      const mapData = MAPS[mapId];
      const y = mapListTop + 35 + i * (mapButtonHeight + mapButtonSpacing);
      this.createMapButton(mapButtonCenterX, y, mapId, mapData, mapPanelWidth - 32);
    });

    // Enable scrolling if content overflows
    this.mapScrollY = 0;
    this.mapScrollMax = Math.max(0, totalMapsHeight - mapListHeight + 20);

    if (this.mapScrollMax > 0) {
      // Add scroll indicator
      this.add.text(margin + mapPanelWidth - 16, mapListTop + mapListHeight - 10, '▼ scroll', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '10px',
        fill: '#9b9a97',
      }).setOrigin(1, 1);

      // Mouse wheel scrolling
      this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
        if (pointer.x >= margin && pointer.x <= margin + mapPanelWidth) {
          this.mapScrollY = Phaser.Math.Clamp(this.mapScrollY + deltaY * 0.5, 0, this.mapScrollMax);
          this.mapContainer.y = -this.mapScrollY;
        }
      });
    }

    // Fleet panel - Notion card style
    const fleetPanelX = margin + mapPanelWidth + gap;
    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(fleetPanelX, 72, fleetPanelWidth, panelHeight, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(fleetPanelX, 72, fleetPanelWidth, panelHeight, 6);

    // Section title
    this.add.text(fleetPanelX + 16, 92, 'Your Fleet', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#9b9a97',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const fleet = Storage.get('fleet').filter(id => id !== null);
    const fleetCardWidth = fleetPanelWidth - 32;
    fleet.forEach((shipId, i) => {
      const shipData = getShipById(shipId);
      const savedData = Storage.getShipData(shipId);
      const stats = getShipStats(shipData, savedData.level);
      const currentHp = Storage.getShipCurrentHp(shipId, stats.hp);
      this.createFleetCard(fleetPanelX + 16, 140 + i * 70, shipData, savedData.level, stats, currentHp, fleetCardWidth);
    });
  }

  createMapButton(x, y, mapId, mapData, buttonWidth = 400) {
    const container = this.add.container(x, y);
    const halfWidth = buttonWidth / 2;

    const bg = this.add.graphics();

    // Check if map is already cleared
    const isCleared = Storage.isMapCleared(mapId);
    const hasSRank = Storage.hasMapSRank(mapId);

    const stageName = this.add.text(-halfWidth + 12, -12, `${mapId} ${mapData.name}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: isCleared ? '#4dab9a' : '#37352f',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Show clear status and description
    let infoText = mapData.description;
    if (isCleared) infoText = hasSRank ? 'S-Rank Achieved' : 'Cleared';

    const info = this.add.text(-halfWidth + 12, 10, infoText, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '11px',
      fill: '#9b9a97',
    }).setOrigin(0, 0.5);

    // Show ticket reward (dimmed if already cleared)
    const ticketText = isCleared ? '✓' : `+${mapData.firstClearTickets} 🎫`;
    const reward = this.add.text(halfWidth - 12, 0, ticketText, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: isCleared ? '16px' : '13px',
      fill: isCleared ? '#4dab9a' : '#cb912f',
    }).setOrigin(1, 0.5);

    container.add([bg, stageName, info, reward]);

    // Add to scroll container if it exists
    if (this.mapContainer) {
      this.mapContainer.add(container);
    }

    const hit = this.add.rectangle(x, y, buttonWidth, 70, 0x000000, 0).setInteractive();
    if (this.mapContainer) {
      this.mapContainer.add(hit);
    }

    hit.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.bgHover, 1);
      bg.fillRoundedRect(-halfWidth, -35, buttonWidth, 70, 4);
    });
    hit.on('pointerout', () => {
      bg.clear();
    });
    hit.on('pointerdown', () => this.enterMap(mapId));
  }

  enterMap(mapId) {
    // Initialize fleet HP for this sortie
    const fleetHp = {};
    const fleet = Storage.get('fleet').filter(id => id !== null);

    fleet.forEach(shipId => {
      const shipData = getShipById(shipId);
      const savedData = Storage.getShipData(shipId);
      const stats = getShipStats(shipData, savedData.level);
      fleetHp[shipId] = Storage.getShipCurrentHp(shipId, stats.hp);
    });

    // Go to map navigation scene
    this.scene.start('MapScene', { mapId, currentNode: 'start', fleetHp });
  }

  createFleetCard(x, y, shipData, level, stats, currentHp, cardWidth = 280) {
    const rarity = RARITY[shipData.rarity];
    const damageState = getDamageState(currentHp, stats.hp);
    const c = this.add.container(x, y);
    const cardHeight = 48;

    const bg = this.add.graphics();
    bg.fillStyle(rarity.color, 0.1);
    bg.fillRoundedRect(0, -cardHeight / 2, cardWidth, cardHeight, 4);

    // Damage indicator bar
    bg.fillStyle(damageState.color, 1);
    bg.fillRect(0, -cardHeight / 2, 4, cardHeight);

    // Ship banner image
    const bannerKey = `ship_banner_${shipData.id}`;
    const bannerWidth = Math.min(120, cardWidth * 0.45);
    const bannerHeight = 38;
    const bannerX = 8 + bannerWidth / 2;
    if (this.textures.exists(bannerKey)) {
      const banner = this.add.image(bannerX, 0, bannerKey);
      const bScale = Math.min(bannerWidth / banner.width, bannerHeight / banner.height);
      banner.setScale(bScale);
      c.add(banner);
    }

    const textX = bannerWidth + 16;

    c.add(this.add.text(textX, -10, `${shipData.name} Lv.${level}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#37352f',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5));

    // Show current HP with color
    c.add(this.add.text(textX, 10, `HP: ${currentHp}/${stats.hp}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '11px',
      fill: `#${damageState.color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5));

    c.add(bg);
    c.sendToBack(bg);
  }

  // Start battle from map node
  startNodeBattle() {
    const mapData = getMapById(this.mapId);
    const nodeData = getNodeById(this.mapId, this.nodeId);

    if (!mapData || !nodeData) {
      this.scene.start('BattleScene');
      return;
    }

    this.currentMapData = mapData;
    this.currentNodeData = nodeData;

    this.createBattleBackground();

    // Build player fleet with current HP
    const fleetIds = Storage.get('fleet').filter(id => id !== null);
    const playerFleet = fleetIds.map(id => {
      const data = getShipById(id);
      const saved = Storage.getShipData(id);
      const stats = getShipStats(data, saved.level);
      const currentHp = this.fleetHp[id] !== undefined ? this.fleetHp[id] : stats.hp;
      return { ...data, ...stats, level: saved.level, currentHp, maxHp: stats.hp, isPlayer: true };
    });

    // Build enemy fleet from node data
    const enemyFleet = nodeData.enemies.map((id, i) => {
      const data = getShipById(id);
      const level = nodeData.enemyLevels[i];
      const stats = getShipStats(data, level);
      return { ...data, ...stats, level, currentHp: stats.hp, maxHp: stats.hp, isPlayer: false };
    });

    // Use actual window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Resize the game to match window
    this.scale.resize(width, height);

    // Battle header
    const g = this.add.graphics();
    g.fillStyle(0x1a2634, 0.95);
    g.fillRect(0, 0, width, 60);
    g.fillStyle(this.isBoss ? 0xe03e3e : 0x5dade2, 1);
    g.fillRect(0, 58, width, 2);

    const nodeLabel = this.isBoss ? 'BOSS' : `Node ${this.nodeId}`;
    this.add.text(width / 2, 30, `${this.mapId} - ${nodeLabel}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Speed toggle button
    this.createSpeedToggle(width - 80, 30);

    // Responsive positioning - use full width with small margins
    const margin = 16;
    const gap = 24; // Gap between the two fleets
    const shipCardWidth = (width - margin * 2 - gap) / 2;
    const playerX = margin;
    const enemyX = margin + shipCardWidth + gap;

    // Calculate vertical spacing based on available height
    // Include labels as first row in the spacing calculation
    const fleetAreaTop = 68;
    const fleetAreaBottom = height - 100; // Leave room for phase text at bottom
    const maxShips = Math.max(playerFleet.length, enemyFleet.length);
    const totalRows = maxShips + 1; // +1 for the label row
    const availableHeight = fleetAreaBottom - fleetAreaTop;
    const rowHeight = Math.min(70, availableHeight / totalRows);

    // Row 0: Fleet labels (same height as ship cards)
    const labelY = fleetAreaTop + rowHeight / 2;

    this.add.text(playerX + shipCardWidth / 2, labelY, 'ALLIED FLEET', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fill: '#4caf50',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(enemyX + shipCardWidth / 2, labelY, 'ENEMY FLEET', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fill: '#f44336',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Ship rows start at row 1
    playerFleet.forEach((ship, i) => {
      const rowY = fleetAreaTop + (i + 1) * rowHeight + rowHeight / 2;
      ship.display = this.createBattleShipDisplay(playerX, rowY, ship, true, shipCardWidth);
    });

    enemyFleet.forEach((ship, i) => {
      const rowY = fleetAreaTop + (i + 1) * rowHeight + rowHeight / 2;
      ship.display = this.createBattleShipDisplay(enemyX, rowY, ship, false, shipCardWidth);
    });

    this.phaseText = this.add.text(width / 2, height - 80, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.logText = this.add.text(width / 2, height - 40, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fill: '#b0c4de',
      align: 'center',
    }).setOrigin(0.5);
    this.battleLog = [];

    this.runNodeBattlePhases(playerFleet, enemyFleet);
  }

  async runNodeBattlePhases(playerFleet, enemyFleet) {
    const allShips = [...playerFleet, ...enemyFleet];

    // Show battle start banner
    await this.showBattleStartBanner();

    await this.showPhase('DETECTION PHASE');
    await this.delay(1000);
    this.addLog('Enemy fleet detected!');
    await this.delay(800);

    // Air Battle Phase - if either side has carriers
    const playerCarriers = playerFleet.filter(s => s.currentHp > 0 && s.type === 'Carrier');
    const enemyCarriers = enemyFleet.filter(s => s.currentHp > 0 && s.type === 'Carrier');

    if (playerCarriers.length > 0 || enemyCarriers.length > 0) {
      await this.runAirBattlePhase(playerFleet, enemyFleet, playerCarriers, enemyCarriers);
    }

    if (this.checkBattleEnd(playerFleet, enemyFleet)) {
      await this.delay(500);
      this.endNodeBattle(playerFleet, enemyFleet);
      return;
    }

    await this.showPhase('OPENING PHASE');
    await this.delay(800);
    const openers = allShips.filter(s => s.currentHp > 0 && (s.type === 'Carrier' || s.speed >= 35));
    for (const attacker of openers.sort((a, b) => b.speed - a.speed)) {
      if (this.checkBattleEnd(playerFleet, enemyFleet)) break;
      await this.executeAttack(attacker, playerFleet, enemyFleet);
    }

    if (!this.checkBattleEnd(playerFleet, enemyFleet)) {
      await this.showPhase('SHELLING PHASE');
      await this.delay(800);
      const shellingOrder = allShips.filter(s => s.currentHp > 0).sort((a, b) => b.attack - a.attack);
      for (const attacker of shellingOrder) {
        if (this.checkBattleEnd(playerFleet, enemyFleet)) break;
        await this.executeAttack(attacker, playerFleet, enemyFleet);
      }
    }

    if (!this.checkBattleEnd(playerFleet, enemyFleet)) {
      await this.showPhase('CLOSING PHASE');
      await this.delay(800);
      const torpedoShips = allShips.filter(s => s.currentHp > 0 && s.type === 'Destroyer');
      for (const attacker of torpedoShips.sort((a, b) => b.speed - a.speed)) {
        if (this.checkBattleEnd(playerFleet, enemyFleet)) break;
        await this.executeAttack(attacker, playerFleet, enemyFleet, true);
      }
    }

    // Night Battle prompt (boss only, if enemies still alive)
    const enemiesAlive = enemyFleet.filter(s => s.currentHp > 0).length;
    const playersAlive = playerFleet.filter(s => s.currentHp > 0).length;

    if (this.isBoss && enemiesAlive > 0 && playersAlive > 0) {
      const continueNight = await this.showNightBattlePrompt();
      if (continueNight) {
        await this.runNightBattlePhase(playerFleet, enemyFleet);
      }
    }

    await this.delay(500);
    this.endNodeBattle(playerFleet, enemyFleet);
  }

  async runAirBattlePhase(playerFleet, enemyFleet, playerCarriers, enemyCarriers) {
    await this.showPhase('AIR BATTLE', '#5dade2');
    await this.delay(800);

    // Calculate fighter power
    // Formula: sum of (antiAir stat * sqrt(aircraftSlots[0]))
    let playerFighterPower = 0;
    let enemyFighterPower = 0;

    playerCarriers.forEach(cv => {
      const slots = cv.aircraftSlots || [20, 15, 10];
      const antiAir = cv.attack * 0.5; // Approximate AA from attack stat
      playerFighterPower += antiAir * Math.sqrt(slots[0]);
    });

    enemyCarriers.forEach(cv => {
      const slots = cv.aircraftSlots || [15, 10, 5];
      const antiAir = cv.attack * 0.5;
      enemyFighterPower += antiAir * Math.sqrt(slots[0]);
    });

    // Apply formation AA modifier
    if (this.formationData) {
      playerFighterPower *= this.formationData.modifiers.antiAir || 1;
    }

    // Determine air state
    let airState = 'Air Parity';
    let airColor = '#9b9a97';
    let airMultiplier = 1;

    if (playerFighterPower > 0 || enemyFighterPower > 0) {
      const ratio = enemyFighterPower > 0 ? playerFighterPower / enemyFighterPower : 10;

      if (ratio >= 3) {
        airState = 'Air Supremacy';
        airColor = '#ffc107';
        airMultiplier = 1.5;
      } else if (ratio >= 1.5) {
        airState = 'Air Superiority';
        airColor = '#4dab9a';
        airMultiplier = 1.2;
      } else if (ratio >= 0.67) {
        airState = 'Air Parity';
        airColor = '#9b9a97';
        airMultiplier = 1;
      } else if (ratio >= 0.33) {
        airState = 'Air Denial';
        airColor = '#cb912f';
        airMultiplier = 0.8;
      } else {
        airState = 'Air Incapability';
        airColor = '#e03e3e';
        airMultiplier = 0.5;
      }
    }

    // Display air state
    const width = window.innerWidth;
    const height = window.innerHeight;
    const airText = this.add.text(width / 2, height / 2, airState, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      fill: airColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.addLog(`Air battle: ${airState}`);

    await this.delay(1200);

    this.tweens.add({
      targets: airText,
      alpha: 0,
      duration: 500,
      onComplete: () => airText.destroy(),
    });

    await this.delay(300);

    // Carrier bombing attacks based on air state
    if (playerCarriers.length > 0 && airMultiplier >= 0.8) {
      for (const carrier of playerCarriers) {
        if (carrier.currentHp <= 0) continue;
        if (this.checkBattleEnd(playerFleet, enemyFleet)) break;

        // Carrier attack with air multiplier
        const targets = enemyFleet.filter(s => s.currentHp > 0);
        if (targets.length === 0) break;

        const target = Phaser.Math.RND.pick(targets);
        const baseDmg = carrier.attack * 1.2 * airMultiplier;
        const variance = Phaser.Math.FloatBetween(0.9, 1.1);
        const damage = Math.floor(baseDmg * variance);

        target.currentHp = Math.max(0, target.currentHp - damage);
        this.addLog(`${carrier.name} air strike >> ${target.name} ${damage} DMG`);

        await this.animateAirStrike(carrier, target, damage);
        this.updateHpDisplay(target);

        if (target.currentHp <= 0) {
          this.addLog(`${target.name} SUNK!`);
          await this.animateSink(target);
        }
      }
    }

    // Enemy carrier attacks
    if (enemyCarriers.length > 0 && airMultiplier <= 1.2) {
      for (const carrier of enemyCarriers) {
        if (carrier.currentHp <= 0) continue;
        if (this.checkBattleEnd(playerFleet, enemyFleet)) break;

        const targets = playerFleet.filter(s => s.currentHp > 0);
        if (targets.length === 0) break;

        const target = Phaser.Math.RND.pick(targets);
        const baseDmg = carrier.attack * 1.2 * (2 - airMultiplier); // Inverse modifier
        const variance = Phaser.Math.FloatBetween(0.9, 1.1);
        const damage = Math.floor(baseDmg * variance);

        target.currentHp = Math.max(0, target.currentHp - damage);
        this.addLog(`${carrier.name} air strike >> ${target.name} ${damage} DMG`);

        await this.animateAirStrike(carrier, target, damage);
        this.updateHpDisplay(target);

        if (target.currentHp <= 0) {
          this.addLog(`${target.name} SUNK!`);
          await this.animateSink(target);
        }
      }
    }
  }

  async animateAirStrike(attacker, target, damage) {
    const cardWidth = target.display.cardWidth || 300;
    const hitX = target.display.container.x + cardWidth / 2;
    const hitY = target.display.container.y;

    // Plane icon flying across
    const plane = this.add.text(attacker.display.container.x + 100, attacker.display.container.y, '✈', {
      fontSize: '24px',
    }).setOrigin(0.5);

    await new Promise(resolve => {
      this.tweens.add({
        targets: plane,
        x: hitX,
        y: hitY,
        duration: 400,
        onComplete: () => {
          plane.destroy();
          resolve();
        },
      });
    });

    // Explosion effect
    const flash = this.add.rectangle(hitX, hitY, cardWidth, 60, 0xff6600, 0.6);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });

    // Damage text
    const dmgText = this.add.text(hitX, hitY - 40, `-${damage}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      fill: '#ff6600',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: dmgText,
      y: hitY - 70,
      alpha: 0,
      duration: 800,
      onComplete: () => dmgText.destroy(),
    });

    const origX = target.display.container.x;
    this.tweens.add({
      targets: target.display.container,
      x: origX + 10,
      duration: 50,
      yoyo: true,
      repeat: 3,
    });

    await this.delay(400);
  }

  async showNightBattlePrompt() {
    return new Promise(resolve => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Responsive sizing
      const panelW = Math.min(400, width * 0.85);
      const panelH = Math.min(160, height * 0.25);
      const titleSize = Math.max(18, Math.min(24, panelW * 0.06));
      const questionSize = Math.max(12, Math.min(16, panelW * 0.04));
      const infoSize = Math.max(10, Math.min(12, panelW * 0.03));
      const btnSize = Math.max(14, Math.min(18, panelW * 0.045));
      const btnSpacing = panelW * 0.2;

      // Darken screen
      const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

      // Prompt panel
      const panel = this.add.container(width / 2, height / 2);

      const bg = this.add.graphics();
      bg.fillStyle(0x1a2634, 0.95);
      bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 8);
      bg.lineStyle(2, 0x5dade2, 1);
      bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 8);

      const title = this.add.text(0, -panelH * 0.3, 'NIGHT BATTLE', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${titleSize}px`,
        fill: '#5dade2',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      const question = this.add.text(0, -panelH * 0.08, 'Continue to Night Battle?', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${questionSize}px`,
        fill: '#ffffff',
      }).setOrigin(0.5);

      const info = this.add.text(0, panelH * 0.08, '+50% damage, +20% crit chance', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${infoSize}px`,
        fill: '#9b9a97',
      }).setOrigin(0.5);

      panel.add([bg, title, question, info]);

      // Yes button
      const yesBtn = this.add.text(-btnSpacing, panelH * 0.3, '[ YES ]', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${btnSize}px`,
        fill: '#4caf50',
        fontStyle: 'bold',
      }).setOrigin(0.5).setInteractive();

      yesBtn.on('pointerover', () => yesBtn.setStyle({ fill: '#66bb6a' }));
      yesBtn.on('pointerout', () => yesBtn.setStyle({ fill: '#4caf50' }));
      yesBtn.on('pointerdown', () => {
        overlay.destroy();
        panel.destroy();
        yesBtn.destroy();
        noBtn.destroy();
        resolve(true);
      });

      // No button
      const noBtn = this.add.text(btnSpacing, panelH * 0.3, '[ NO ]', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${btnSize}px`,
        fill: '#f44336',
        fontStyle: 'bold',
      }).setOrigin(0.5).setInteractive();

      noBtn.on('pointerover', () => noBtn.setStyle({ fill: '#e57373' }));
      noBtn.on('pointerout', () => noBtn.setStyle({ fill: '#f44336' }));
      noBtn.on('pointerdown', () => {
        overlay.destroy();
        panel.destroy();
        yesBtn.destroy();
        noBtn.destroy();
        resolve(false);
      });

      panel.add([yesBtn, noBtn]);
    });
  }

  async runNightBattlePhase(playerFleet, enemyFleet) {
    this.inNightBattle = true;

    // Darken the background
    const width = window.innerWidth;
    const height = window.innerHeight;
    const nightOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a1a, 0.5);

    await this.showPhase('NIGHT BATTLE', '#3f51b5');
    await this.delay(1000);

    // Night battle - order by luck + level instead of speed
    const allShips = [...playerFleet, ...enemyFleet].filter(s => s.currentHp > 0);
    const nightOrder = allShips.sort((a, b) => {
      const aLuck = (a.baseLuck || 10) + a.level;
      const bLuck = (b.baseLuck || 10) + b.level;
      return bLuck - aLuck;
    });

    for (const attacker of nightOrder) {
      if (this.checkBattleEnd(playerFleet, enemyFleet)) break;
      await this.executeAttack(attacker, playerFleet, enemyFleet);
    }

    // Fade out night overlay
    this.tweens.add({
      targets: nightOverlay,
      alpha: 0,
      duration: 500,
      onComplete: () => nightOverlay.destroy(),
    });

    this.inNightBattle = false;
  }

  async endNodeBattle(playerFleet, enemyFleet) {
    const playerAlive = playerFleet.filter(s => s.currentHp > 0);
    const enemySunk = enemyFleet.filter(s => s.currentHp <= 0).length;
    const playerSunk = playerFleet.filter(s => s.currentHp <= 0).length;
    const victory = enemyFleet.every(s => s.currentHp <= 0);

    let rank = 'D';
    if (victory && playerSunk === 0) rank = 'S';
    else if (victory && playerSunk <= 1) rank = 'A';
    else if (victory) rank = 'B';
    else if (enemySunk > 0) rank = 'C';

    // Show victory/defeat banner
    await this.showResultBanner(rank, victory);

    if (victory) {
      AudioManager.playBgm(BGM.VICTORY);
    }

    const rankColors = { S: 0xffc107, A: 0xff9800, B: 0x4caf50, C: 0x2196f3, D: 0x6b7b8b };
    const rankColorsHex = { S: '#ffc107', A: '#ff9800', B: '#4caf50', C: '#2196f3', D: '#6b7b8b' };

    playerFleet.forEach(ship => {
      this.fleetHp[ship.id] = ship.currentHp;
    });

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Responsive panel sizing
    const panelWidth = Math.min(700, width * 0.95);
    const panelHeight = Math.min(550, height * 0.9);
    const panelX = (width - panelWidth) / 2;
    const panelY = (height - panelHeight) / 2;

    // Responsive font sizes
    const titleSize = Math.max(18, Math.min(28, panelWidth * 0.04));
    const rankSize = Math.max(48, Math.min(80, panelHeight * 0.15));
    const labelSize = Math.max(10, Math.min(12, panelWidth * 0.018));
    const textSize = Math.max(8, Math.min(10, panelWidth * 0.014));
    const rewardSize = Math.max(12, Math.min(16, panelWidth * 0.023));
    const btnTextSize = Math.max(12, Math.min(16, panelWidth * 0.023));

    const g = this.add.graphics();

    // Panel background with glow effect for rank
    if (rank === 'S') {
      g.fillStyle(rankColors.S, 0.3);
      g.fillRoundedRect(panelX - 4, panelY - 4, panelWidth + 8, panelHeight + 8, 12);
    }

    g.fillStyle(0xffffff, 0.98);
    g.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);

    // Header
    g.fillStyle(0x1a2634, 1);
    g.fillRoundedRect(panelX, panelY, panelWidth, 60, { tl: 8, tr: 8, bl: 0, br: 0 });

    g.lineStyle(3, victory ? 0x4caf50 : 0xf44336, 1);
    g.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);

    // Victory/Defeat text
    this.add.text(width / 2, panelY + panelHeight * 0.055, victory ? 'VICTORY' : 'DEFEAT', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${titleSize}px`,
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Large rank display with glow
    const rankDisplay = this.add.text(width / 2, panelY + panelHeight * 0.2, rank, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${rankSize}px`,
      fill: rankColorsHex[rank],
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: rank === 'S' ? 4 : 2,
    }).setOrigin(0.5);

    // Animate S rank
    if (rank === 'S') {
      this.tweens.add({
        targets: rankDisplay,
        scale: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // XP calculation
    const xpPerShip = victory ? Math.floor(this.currentMapData.baseXp * (rank === 'S' ? 1.5 : rank === 'A' ? 1.2 : 1)) : 0;

    // Ship Roster Section - responsive positioning
    const rosterY = panelY + panelHeight * 0.3;
    this.add.text(panelX + panelWidth * 0.03, rosterY, 'Fleet Status', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${labelSize}px`,
      fill: '#9b9a97',
      fontStyle: 'bold',
    });

    const shipCardWidth = Math.min(100, (panelWidth - panelWidth * 0.1) / playerFleet.length);
    const shipCardHeight = Math.min(120, panelHeight * 0.22);

    const cardGap = Math.max(5, panelWidth * 0.015);
    playerFleet.forEach((ship, i) => {
      const cardX = panelX + panelWidth * 0.04 + i * (shipCardWidth + cardGap);
      const cardY = rosterY + shipCardHeight * 0.2;
      const rarity = RARITY[ship.rarity];
      const damageState = getDamageState(ship.currentHp, ship.maxHp);

      // Card background
      g.fillStyle(0xf7f6f3, 1);
      g.fillRoundedRect(cardX, cardY, shipCardWidth, shipCardHeight, 4);
      g.fillStyle(damageState.color, 1);
      g.fillRect(cardX, cardY, 3, shipCardHeight);

      // Ship portrait
      const portraitKey = `ship_portrait_${ship.id}`;
      if (this.textures.exists(portraitKey)) {
        const portrait = this.add.image(cardX + shipCardWidth / 2, cardY + shipCardHeight * 0.3, portraitKey);
        const pScale = Math.min((shipCardWidth - 10) / portrait.width, shipCardHeight * 0.4 / portrait.height);
        portrait.setScale(pScale);
        if (ship.currentHp <= 0) portrait.setAlpha(0.3);
      }

      // Ship name
      this.add.text(cardX + shipCardWidth / 2, cardY + shipCardHeight * 0.55, ship.name, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${textSize}px`,
        fill: ship.currentHp <= 0 ? '#9b9a97' : '#37352f',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // HP bar
      const hpBarWidth = shipCardWidth - 16;
      const hpPercent = ship.currentHp / ship.maxHp;
      this.add.rectangle(cardX + 8 + hpBarWidth / 2, cardY + shipCardHeight * 0.68, hpBarWidth, 6, 0xe9e9e7);
      if (hpPercent > 0) {
        const hpFill = this.add.rectangle(cardX + 8, cardY + shipCardHeight * 0.68, hpBarWidth * hpPercent, 4, damageState.color);
        hpFill.setOrigin(0, 0.5);
      }

      // HP text
      this.add.text(cardX + shipCardWidth / 2, cardY + shipCardHeight * 0.78, `${ship.currentHp}/${ship.maxHp}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${textSize * 0.9}px`,
        fill: '#787774',
      }).setOrigin(0.5);

      // XP gain and level up indicator
      if (victory && ship.currentHp > 0) {
        const result = Storage.addXpToShip(ship.id, xpPerShip, ship.maxLevel);

        this.add.text(cardX + shipCardWidth / 2, cardY + shipCardHeight * 0.9, `+${xpPerShip} EXP`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${textSize * 0.9}px`,
          fill: '#4dab9a',
        }).setOrigin(0.5);

        if (result && result.leveledUp) {
          const lvlUp = this.add.text(cardX + shipCardWidth / 2, cardY - 5, 'LEVEL UP!', {
            fontFamily: 'Arial, sans-serif',
            fontSize: `${textSize}px`,
            fill: '#ffc107',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2,
          }).setOrigin(0.5);

          this.tweens.add({
            targets: lvlUp,
            y: lvlUp.y - 5,
            duration: 500,
            yoyo: true,
            repeat: -1,
          });
        }
      } else if (ship.currentHp <= 0) {
        this.add.text(cardX + shipCardWidth / 2, cardY + shipCardHeight * 0.9, 'SUNK', {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${textSize * 0.9}px`,
          fill: '#e03e3e',
          fontStyle: 'bold',
        }).setOrigin(0.5);
      }
    });

    // Rewards Section - responsive
    const rewardsY = rosterY + shipCardHeight + panelHeight * 0.08;
    let rewardX = panelX + panelWidth * 0.04;

    if (victory) {
      this.add.text(panelX + panelWidth * 0.03, rewardsY, 'Rewards', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${labelSize}px`,
        fill: '#9b9a97',
        fontStyle: 'bold',
      });

      // Fuel reward
      let fuelReward = 0;
      if (this.isBoss) {
        fuelReward = Math.floor(250 * (rank === 'S' ? 1.5 : rank === 'A' ? 1.2 : 1));
      } else {
        fuelReward = Math.floor(100 * (rank === 'S' ? 1.5 : 1));
      }
      Storage.addCurrency(fuelReward);

      this.add.text(rewardX, rewardsY + panelHeight * 0.045, `⛽ +${fuelReward}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${rewardSize}px`,
        fill: '#4dab9a',
        fontStyle: 'bold',
      });
      rewardX += panelWidth * 0.15;

      // Ticket rewards (boss only)
      if (this.isBoss) {
        const clearResult = Storage.recordMapClear(this.mapId, rank);
        let ticketsEarned = 0;

        if (clearResult.isFirstClear) {
          ticketsEarned += this.currentMapData.firstClearTickets;
        }
        if (clearResult.isFirstSRank) {
          ticketsEarned += this.currentMapData.sRankBonus;
        }

        if (ticketsEarned > 0) {
          Storage.addTickets(ticketsEarned);
          this.add.text(rewardX, rewardsY + panelHeight * 0.045, `🎫 +${ticketsEarned}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: `${rewardSize}px`,
            fill: '#ff9800',
            fontStyle: 'bold',
          });

          // Bonus breakdown
          let bonusText = [];
          if (clearResult.isFirstClear) bonusText.push('First Clear');
          if (clearResult.isFirstSRank) bonusText.push('S-Rank');
          if (bonusText.length > 0) {
            this.add.text(rewardX, rewardsY + panelHeight * 0.08, bonusText.join(' + '), {
              fontFamily: 'Arial, sans-serif',
              fontSize: `${textSize}px`,
              fill: '#cb912f',
            });
          }
        }
      }
    }

    // Continue button - responsive
    let btnText = '[ CONTINUE ]';
    let btnAction;

    if (!victory || this.isBoss) {
      btnText = this.isBoss && victory ? '[ RETURN TO PORT ]' : '[ RETREAT ]';
      btnAction = () => {
        Object.entries(this.fleetHp).forEach(([shipId, hp]) => {
          Storage.setShipHp(shipId, hp);
        });
        this.scene.start('BattleScene', { mapId: null, nodeId: null, fleetHp: {}, isBoss: false });
      };
    } else {
      btnText = '[ ADVANCE ]';
      btnAction = () => {
        this.scene.start('MapScene', {
          mapId: this.mapId,
          currentNode: this.nodeId,
          fleetHp: this.fleetHp,
        });
      };
    }

    const btnWidth = Math.max(140, Math.min(200, panelWidth * 0.3));
    const btnHeight = Math.max(28, Math.min(36, panelHeight * 0.07));
    const btnY = panelY + panelHeight - btnHeight - panelHeight * 0.03;
    const continueBtn = this.add.container(width / 2, btnY);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(victory ? 0x2196f3 : 0x6b7b8b, 1);
    btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);

    const btnTextObj = this.add.text(0, 0, btnText, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${btnTextSize}px`,
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    continueBtn.add([btnBg, btnTextObj]);

    const hit = this.add.rectangle(width / 2, btnY, btnWidth, btnHeight, 0x000000, 0).setInteractive();

    hit.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(victory ? 0x1976d2 : 0x546e7a, 1);
      btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);
    });

    hit.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(victory ? 0x2196f3 : 0x6b7b8b, 1);
      btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);
    });

    hit.on('pointerdown', btnAction);
  }

  createBottomBar() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Notion-style bottom bar
    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRect(0, height - 48, width, 48);
    g.fillStyle(COLORS.border, 1);
    g.fillRect(0, height - 48, width, 1);

    // Current tickets display
    const tickets = Storage.getTickets();
    this.add.text(width / 2, height - 24, `${tickets} Premium Tickets`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: '#cb912f',
    }).setOrigin(0.5);
  }

  async startBattle(stageIndex) {
    const stage = STAGES[stageIndex];
    this.children.removeAll();
    this.createBattleBackground();

    const fleetIds = Storage.get('fleet').filter(id => id !== null);
    const playerFleet = fleetIds.map(id => {
      const data = getShipById(id);
      const saved = Storage.getShipData(id);
      const stats = getShipStats(data, saved.level);
      return { ...data, ...stats, level: saved.level, currentHp: stats.hp, maxHp: stats.hp, isPlayer: true };
    });

    const enemyFleet = stage.enemies.map((id, i) => {
      const data = getShipById(id);
      const level = stage.enemyLevels[i];
      const stats = getShipStats(data, level);
      return { ...data, ...stats, level, currentHp: stats.hp, maxHp: stats.hp, isPlayer: false };
    });

    // Use actual window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

    // Battle header - KanColle style
    const g = this.add.graphics();
    g.fillStyle(0x1a2634, 0.95);
    g.fillRect(0, 0, width, 60);
    g.fillStyle(0x5dade2, 1);
    g.fillRect(0, 58, width, 2);

    this.add.text(width / 2, 30, `${stage.name} ${stage.title}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Responsive positioning - use full width with small margins
    const margin = 16;
    const gap = 24;
    const shipCardWidth = (width - margin * 2 - gap) / 2;
    const playerX = margin;
    const enemyX = margin + shipCardWidth + gap;

    // Calculate vertical spacing based on available height
    // Include labels as first row in the spacing calculation
    const fleetAreaTop = 68;
    const fleetAreaBottom = height - 100; // Leave room for phase text at bottom
    const maxShips = Math.max(playerFleet.length, enemyFleet.length);
    const totalRows = maxShips + 1; // +1 for the label row
    const availableHeight = fleetAreaBottom - fleetAreaTop;
    const rowHeight = Math.min(70, availableHeight / totalRows);

    // Row 0: Fleet labels (same height as ship cards)
    const labelY = fleetAreaTop + rowHeight / 2;

    this.add.text(playerX + shipCardWidth / 2, labelY, 'ALLIED FLEET', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fill: '#4caf50',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(enemyX + shipCardWidth / 2, labelY, 'ENEMY FLEET', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fill: '#f44336',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Ship rows start at row 1
    playerFleet.forEach((ship, i) => {
      const rowY = fleetAreaTop + (i + 1) * rowHeight + rowHeight / 2;
      ship.display = this.createBattleShipDisplay(playerX, rowY, ship, true, shipCardWidth);
    });

    enemyFleet.forEach((ship, i) => {
      const rowY = fleetAreaTop + (i + 1) * rowHeight + rowHeight / 2;
      ship.display = this.createBattleShipDisplay(enemyX, rowY, ship, false, shipCardWidth);
    });

    this.phaseText = this.add.text(width / 2, height - 80, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.logText = this.add.text(width / 2, height - 40, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      fill: '#b0c4de',
      align: 'center',
    }).setOrigin(0.5);
    this.battleLog = [];

    await this.runBattlePhases(playerFleet, enemyFleet, stage);
  }

  createBattleBackground() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // KanColle-style ocean gradient
    for (let y = 0; y < height; y++) {
      const ratio = y / height;
      const r = Math.floor(30 + (26 - 30) * ratio);
      const gVal = Math.floor(144 + (82 - 144) * ratio);
      const b = Math.floor(255 + (180 - 255) * ratio);
      g.fillStyle(Phaser.Display.Color.GetColor(r, gVal, b), 1);
      g.fillRect(0, y, width, 1);
    }

    // Wave pattern - scale number of waves based on height
    const numWaves = Math.floor(height / 80);
    g.lineStyle(1, 0xffffff, 0.1);
    for (let i = 0; i < numWaves; i++) {
      const waveY = 100 + i * 80;
      g.beginPath();
      for (let x = 0; x < width; x += 5) {
        const y = waveY + Math.sin((x + i * 50) * 0.02) * 3;
        if (x === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokePath();
    }
  }

  createBattleShipDisplay(x, y, ship, isPlayer, cardWidth = 300) {
    const c = this.add.container(x, y);
    const rarity = RARITY[ship.rarity];
    const cardHeight = 50;

    const bg = this.add.graphics();
    bg.fillStyle(isPlayer ? 0xe8f5e9 : 0xffebee, 0.95);
    bg.fillRoundedRect(0, -cardHeight / 2, cardWidth, cardHeight, 4);
    bg.lineStyle(2, isPlayer ? 0x4caf50 : 0xf44336, 1);
    bg.strokeRoundedRect(0, -cardHeight / 2, cardWidth, cardHeight, 4);

    // Ship banner image (160x40 aspect ratio like KanColle)
    const bannerKey = `ship_banner_${ship.id}`;
    const bannerWidth = Math.min(160, cardWidth * 0.45);
    const bannerHeight = 40;
    const bannerX = 4 + bannerWidth / 2;
    if (this.textures.exists(bannerKey)) {
      const banner = this.add.image(bannerX, 0, bannerKey);
      const bScale = Math.min(bannerWidth / banner.width, bannerHeight / banner.height);
      banner.setScale(bScale);
      c.add(banner);
    }

    const textX = bannerWidth + 12;

    const name = this.add.text(textX, -12, `${ship.name} Lv.${ship.level}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      fill: '#1a1a2e',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // HP bar - KanColle style with damage colors
    const hpBarWidth = cardWidth - bannerWidth - 20;
    const hpBarX = textX;
    const hpPercent = ship.currentHp / ship.maxHp;

    // Determine HP bar color based on damage state (KanColle style)
    let hpColor;
    if (hpPercent > 0.75) {
      hpColor = 0x4caf50; // Green - healthy
    } else if (hpPercent > 0.5) {
      hpColor = 0xffc107; // Yellow - light damage
    } else if (hpPercent > 0.25) {
      hpColor = 0xff9800; // Orange - medium damage
    } else {
      hpColor = 0xf44336; // Red - heavy damage
    }

    const hpBg = this.add.rectangle(hpBarX + hpBarWidth / 2, 10, hpBarWidth, 14, 0xc5d5e5).setOrigin(0.5);
    const hpBarFillWidth = Math.max(0, (hpBarWidth - 2) * hpPercent);
    const hpBar = this.add.rectangle(hpBarX, 10, hpBarFillWidth, 12, hpColor).setOrigin(0, 0.5);
    const hpText = this.add.text(hpBarX + hpBarWidth / 2, 10, `${ship.currentHp}/${ship.maxHp}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fill: '#1a1a2e',
    }).setOrigin(0.5);

    c.add([bg, name, hpBg, hpBar, hpText]);
    c.sendToBack(bg);
    return { container: c, hpBar, hpText, bg, cardWidth, cardHeight, hpBarWidth };
  }

  async runBattlePhases(playerFleet, enemyFleet, stage) {
    const allShips = [...playerFleet, ...enemyFleet];

    await this.showPhase('DETECTION PHASE');
    await this.delay(1000);
    this.addLog('Enemy fleet detected!');
    await this.delay(800);

    await this.showPhase('OPENING PHASE');
    await this.delay(800);
    const openers = allShips.filter(s => s.currentHp > 0 && (s.type === 'Carrier' || s.speed >= 35));
    for (const attacker of openers.sort((a, b) => b.speed - a.speed)) {
      if (this.checkBattleEnd(playerFleet, enemyFleet)) break;
      await this.executeAttack(attacker, playerFleet, enemyFleet);
    }

    if (!this.checkBattleEnd(playerFleet, enemyFleet)) {
      await this.showPhase('SHELLING PHASE');
      await this.delay(800);
      const shellingOrder = allShips.filter(s => s.currentHp > 0).sort((a, b) => b.attack - a.attack);
      for (const attacker of shellingOrder) {
        if (this.checkBattleEnd(playerFleet, enemyFleet)) break;
        await this.executeAttack(attacker, playerFleet, enemyFleet);
      }
    }

    if (!this.checkBattleEnd(playerFleet, enemyFleet)) {
      await this.showPhase('CLOSING PHASE');
      await this.delay(800);
      const torpedoShips = allShips.filter(s => s.currentHp > 0 && s.type === 'Destroyer');
      for (const attacker of torpedoShips.sort((a, b) => b.speed - a.speed)) {
        if (this.checkBattleEnd(playerFleet, enemyFleet)) break;
        await this.executeAttack(attacker, playerFleet, enemyFleet, true);
      }
    }

    await this.delay(500);
    this.endBattle(playerFleet, enemyFleet, stage);
  }

  async showPhase(phaseName, color = '#ffffff') {
    this.phaseText.setText(phaseName);
    this.phaseText.setStyle({ fill: color });
    this.phaseText.setAlpha(0);
    this.phaseText.setScale(1.2);
    await new Promise(r => {
      this.tweens.add({
        targets: this.phaseText,
        alpha: 1,
        scale: 1,
        duration: 400,
        ease: 'Back.easeOut',
        onComplete: r,
      });
    });
  }

  async executeAttack(attacker, playerFleet, enemyFleet, isTorpedo = false) {
    if (attacker.currentHp <= 0) return;

    const targets = attacker.isPlayer
      ? enemyFleet.filter(s => s.currentHp > 0)
      : playerFleet.filter(s => s.currentHp > 0);

    if (targets.length === 0) return;

    const target = Phaser.Math.RND.pick(targets);

    // Apply formation evasion modifier to target if player
    const evasionMod = target.isPlayer ? (this.formationData?.modifiers?.evasion || 1) : 1;
    const modifiedEvasion = target.evasion * evasionMod;

    const hitChance = 90 - modifiedEvasion * 0.5 + attacker.attack * 0.2;
    const hit = Math.random() * 100 < hitChance;

    if (!hit) {
      this.addLog(`${attacker.name} attacks ${target.name}... MISS!`);
      await this.animateMiss(target);
      return;
    }

    // Apply formation modifiers to attacker if player
    let firepowerMod = 1;
    let torpedoMod = 1;
    if (attacker.isPlayer && this.formationData) {
      firepowerMod = this.formationData.modifiers.firepower || 1;
      torpedoMod = this.formationData.modifiers.torpedo || 1;
    }

    // Night battle damage multiplier
    const nightMod = this.inNightBattle ? 1.5 : 1;

    // Enemy damage multiplier for increased difficulty
    const enemyDmgMod = attacker.isPlayer ? 1 : 1.3;

    // Apply formation modifier based on attack type
    const formationMod = isTorpedo ? torpedoMod : firepowerMod;

    const baseDmg = attacker.attack * (isTorpedo ? 1.5 : 1) * enemyDmgMod * formationMod * nightMod;
    const defMod = 1 - (target.defense / (target.defense + 50));
    const variance = Phaser.Math.FloatBetween(0.8, 1.2);

    // Higher crit chance in night battle (20% vs 10%)
    const critChance = this.inNightBattle ? 0.2 : 0.1;
    const critical = Math.random() < critChance;
    let damage = Math.floor(baseDmg * defMod * variance * (critical ? 1.5 : 1));
    damage = Math.max(1, damage);

    target.currentHp = Math.max(0, target.currentHp - damage);

    const critText = critical ? ' CRITICAL!' : '';
    this.addLog(`${attacker.name} >> ${target.name} ${damage} DMG${critText}`);

    // Show battle cut-in for critical hits from player ships
    if (critical && attacker.isPlayer) {
      await this.showBattleCutIn(attacker, isTorpedo);
    }

    await this.animateAttack(attacker, target, damage, critical, isTorpedo);
    this.updateHpDisplay(target);

    if (target.currentHp <= 0) {
      this.addLog(`${target.name} SUNK!`);
      await this.animateSink(target);
    }
  }

  async animateAttack(attacker, target, damage, critical, isTorpedo = false) {
    const cardWidth = target.display.cardWidth || 300;
    const hitX = target.display.container.x + cardWidth / 2;
    const hitY = target.display.container.y;
    const attackerX = attacker.display.container.x + (attacker.display.cardWidth || 300) / 2;
    const attackerY = attacker.display.container.y;

    // Ship-type specific attack animations
    const shipType = attacker.type;

    if (shipType === 'Destroyer' || isTorpedo) {
      // Torpedo attack - fast projectile with wake trail
      await this.animateTorpedoAttack(attackerX, attackerY, hitX, hitY, damage, critical, target);
    } else if (shipType === 'Light Cruiser') {
      // Rapid fire - multiple small shells
      await this.animateRapidFireAttack(attackerX, attackerY, hitX, hitY, damage, critical, target);
    } else if (shipType === 'Heavy Cruiser') {
      // Heavy shells - medium sized with smoke
      await this.animateHeavyShellAttack(attackerX, attackerY, hitX, hitY, damage, critical, target);
    } else if (shipType === 'Battleship') {
      // Main battery salvo - large shells with screen shake
      await this.animateBattleshipAttack(attackerX, attackerY, hitX, hitY, damage, critical, target);
    } else if (shipType === 'Carrier') {
      // Carrier uses air strike animation (handled separately)
      await this.animateCarrierAttack(attackerX, attackerY, hitX, hitY, damage, critical, target);
    } else {
      // Default attack animation
      await this.animateDefaultAttack(attackerX, attackerY, hitX, hitY, damage, critical, target, attacker);
    }
  }

  async animateTorpedoAttack(startX, startY, hitX, hitY, damage, critical, target) {
    // Attacker animation
    this.tweens.add({ targets: target.display.container.parentContainer || {}, scaleX: 1.02, scaleY: 1.02, duration: 80, yoyo: true });

    // Torpedo projectile
    const torpedo = this.add.text(startX, startY, '▬', {
      fontSize: '20px',
      fill: '#00bcd4',
    }).setOrigin(0.5).setRotation(Math.atan2(hitY - startY, hitX - startX));

    // Wake trail
    const createWake = () => {
      const wake = this.add.text(torpedo.x, torpedo.y, '~', {
        fontSize: '12px',
        fill: '#ffffff',
      }).setOrigin(0.5).setAlpha(0.6);

      this.tweens.add({
        targets: wake,
        alpha: 0,
        duration: 300,
        onComplete: () => wake.destroy(),
      });
    };

    // Trail interval
    const wakeInterval = this.time.addEvent({
      delay: 50,
      callback: createWake,
      repeat: 6,
    });

    await new Promise(resolve => {
      this.tweens.add({
        targets: torpedo,
        x: hitX,
        y: hitY,
        duration: 350,
        ease: 'Linear',
        onComplete: () => {
          torpedo.destroy();
          wakeInterval.remove();
          resolve();
        },
      });
    });

    // Water splash explosion
    const splash = this.add.text(hitX, hitY, '💦', { fontSize: '32px' }).setOrigin(0.5);
    this.tweens.add({
      targets: splash,
      scale: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => splash.destroy(),
    });

    await this.showDamageEffect(hitX, hitY, damage, critical, target, 0x00bcd4);
  }

  async animateRapidFireAttack(startX, startY, hitX, hitY, damage, critical, target) {
    // Rapid fire - 3 quick shots
    for (let i = 0; i < 3; i++) {
      const offsetY = (i - 1) * 15;
      const shell = this.add.circle(startX, startY + offsetY, 4, 0xffeb3b);

      // Muzzle flash
      const flash = this.add.circle(startX + 10, startY + offsetY, 8, 0xffffff, 0.8);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 0.5,
        duration: 100,
        onComplete: () => flash.destroy(),
      });

      this.tweens.add({
        targets: shell,
        x: hitX + Phaser.Math.Between(-20, 20),
        y: hitY + offsetY,
        duration: 150,
        onComplete: () => shell.destroy(),
      });

      await this.delay(80);
    }

    // Impact effects
    const flash = this.add.rectangle(hitX, hitY, target.display.cardWidth || 300, 60, 0xffeb3b, 0.4);
    this.tweens.add({ targets: flash, alpha: 0, duration: 150, onComplete: () => flash.destroy() });

    await this.showDamageEffect(hitX, hitY, damage, critical, target, 0xffeb3b);
  }

  async animateHeavyShellAttack(startX, startY, hitX, hitY, damage, critical, target) {
    // Heavy cruiser - arcing shell
    const shell = this.add.circle(startX, startY, 8, 0xff5722);

    // Smoke puff at gun
    const smoke = this.add.text(startX + 15, startY, '💨', { fontSize: '24px' }).setOrigin(0.5).setAlpha(0.7);
    this.tweens.add({
      targets: smoke,
      x: startX + 40,
      alpha: 0,
      duration: 400,
      onComplete: () => smoke.destroy(),
    });

    // Arc trajectory
    const midY = Math.min(startY, hitY) - 60;

    await new Promise(resolve => {
      this.tweens.add({
        targets: shell,
        x: hitX,
        duration: 400,
        ease: 'Linear',
      });

      this.tweens.add({
        targets: shell,
        y: midY,
        duration: 200,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: shell,
            y: hitY,
            duration: 200,
            ease: 'Quad.easeIn',
            onComplete: () => {
              shell.destroy();
              resolve();
            },
          });
        },
      });
    });

    // Explosion
    const explosion = this.add.text(hitX, hitY, '💥', { fontSize: '36px' }).setOrigin(0.5);
    this.tweens.add({
      targets: explosion,
      scale: 1.3,
      alpha: 0,
      duration: 350,
      onComplete: () => explosion.destroy(),
    });

    if (critical) {
      this.cameras.main.shake(150, 0.008);
    }

    await this.showDamageEffect(hitX, hitY, damage, critical, target, 0xff5722);
  }

  async animateBattleshipAttack(startX, startY, hitX, hitY, damage, critical, target) {
    // Battleship - massive salvo with screen shake
    this.cameras.main.shake(critical ? 300 : 200, critical ? 0.015 : 0.01);

    // Multiple large shells
    const shells = [];
    for (let i = 0; i < 3; i++) {
      const shell = this.add.circle(startX, startY + (i - 1) * 20, 12, 0xe91e63);
      shells.push(shell);

      // Big muzzle flash
      const flash = this.add.rectangle(startX + 20, startY + (i - 1) * 20, 30, 15, 0xffffff, 0.9);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        scaleX: 2,
        duration: 150,
        onComplete: () => flash.destroy(),
      });
    }

    // Heavy smoke
    const smokeCloud = this.add.text(startX + 30, startY, '☁️', { fontSize: '40px' }).setOrigin(0.5).setAlpha(0.8);
    this.tweens.add({
      targets: smokeCloud,
      x: startX + 80,
      alpha: 0,
      scale: 1.5,
      duration: 600,
      onComplete: () => smokeCloud.destroy(),
    });

    // High arc for battleship shells
    const midY = Math.min(startY, hitY) - 100;

    await Promise.all(shells.map((shell, i) => new Promise(resolve => {
      const targetOffsetX = (i - 1) * 25;
      const delay = i * 50;

      this.time.delayedCall(delay, () => {
        this.tweens.add({
          targets: shell,
          x: hitX + targetOffsetX,
          duration: 500,
          ease: 'Linear',
        });

        this.tweens.add({
          targets: shell,
          y: midY,
          duration: 250,
          ease: 'Quad.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: shell,
              y: hitY,
              duration: 250,
              ease: 'Quad.easeIn',
              onComplete: () => {
                shell.destroy();

                // Individual impact explosion
                const boom = this.add.text(hitX + targetOffsetX, hitY, '💥', { fontSize: '28px' }).setOrigin(0.5);
                this.tweens.add({
                  targets: boom,
                  scale: 1.5,
                  alpha: 0,
                  duration: 300,
                  onComplete: () => boom.destroy(),
                });

                if (i === 2) resolve();
              },
            });
          },
        });
      });

      if (i < 2) resolve();
    })));

    // Big explosion effect
    if (critical) {
      this.cameras.main.flash(150, 255, 100, 50, false);
    }

    const bigExplosion = this.add.text(hitX, hitY, '🔥', { fontSize: '48px' }).setOrigin(0.5);
    this.tweens.add({
      targets: bigExplosion,
      scale: 1.8,
      alpha: 0,
      duration: 500,
      onComplete: () => bigExplosion.destroy(),
    });

    await this.showDamageEffect(hitX, hitY, damage, critical, target, 0xe91e63);
  }

  async animateCarrierAttack(startX, startY, hitX, hitY, damage, critical, target) {
    // Carrier dive bomber attack
    const plane = this.add.text(startX, startY - 50, '✈️', { fontSize: '24px' }).setOrigin(0.5);

    // Fly up and over
    await new Promise(resolve => {
      this.tweens.add({
        targets: plane,
        x: hitX,
        y: hitY - 80,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: resolve,
      });
    });

    // Dive bomb
    const bomb = this.add.circle(plane.x, plane.y, 6, 0x333333);

    await new Promise(resolve => {
      this.tweens.add({
        targets: bomb,
        y: hitY,
        duration: 200,
        ease: 'Quad.easeIn',
        onComplete: () => {
          bomb.destroy();
          resolve();
        },
      });

      // Plane flies away
      this.tweens.add({
        targets: plane,
        x: hitX + 200,
        y: hitY - 100,
        duration: 500,
        onComplete: () => plane.destroy(),
      });
    });

    // Explosion
    const explosion = this.add.text(hitX, hitY, '💥', { fontSize: '40px' }).setOrigin(0.5);
    this.tweens.add({
      targets: explosion,
      scale: 1.5,
      alpha: 0,
      duration: 400,
      onComplete: () => explosion.destroy(),
    });

    if (critical) {
      this.cameras.main.shake(200, 0.01);
    }

    await this.showDamageEffect(hitX, hitY, damage, critical, target, 0xff6600);
  }

  async animateDefaultAttack(startX, startY, hitX, hitY, damage, critical, target, attacker) {
    this.tweens.add({ targets: attacker.display.container, scaleX: 1.05, scaleY: 1.05, duration: 100, yoyo: true });
    await this.delay(200);

    const flash = this.add.rectangle(hitX, hitY, target.display.cardWidth || 300, 60, critical ? 0xffc107 : 0xf44336, 0.5);
    this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });

    if (critical) {
      this.cameras.main.shake(200, 0.01);
      this.cameras.main.flash(100, 255, 200, 50, false);
    }

    await this.showDamageEffect(hitX, hitY, damage, critical, target, 0xf44336);
  }

  async showDamageEffect(hitX, hitY, damage, critical, target, color) {
    const colorHex = `#${color.toString(16).padStart(6, '0')}`;

    // Critical burst particles
    if (critical) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const spark = this.add.text(hitX, hitY, '✦', {
          fontSize: '16px',
          fill: '#ffc107',
        }).setOrigin(0.5);

        this.tweens.add({
          targets: spark,
          x: hitX + Math.cos(angle) * 60,
          y: hitY + Math.sin(angle) * 60,
          alpha: 0,
          duration: 400,
          onComplete: () => spark.destroy(),
        });
      }
    }

    const dmgText = this.add.text(hitX, hitY - 40, `-${damage}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: critical ? '32px' : '20px',
      fill: critical ? '#ffc107' : colorHex,
      stroke: '#000000',
      strokeThickness: critical ? 4 : 3,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    if (critical) {
      dmgText.setScale(0.5);
      this.tweens.add({
        targets: dmgText,
        scale: 1.2,
        duration: 150,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: dmgText,
            scale: 1,
            y: hitY - 80,
            alpha: 0,
            duration: 600,
            onComplete: () => dmgText.destroy(),
          });
        }
      });
    } else {
      this.tweens.add({ targets: dmgText, y: hitY - 70, alpha: 0, duration: 800, onComplete: () => dmgText.destroy() });
    }

    const origX = target.display.container.x;
    this.tweens.add({ targets: target.display.container, x: origX + 10, duration: 50, yoyo: true, repeat: critical ? 5 : 3 });

    await this.delay(critical ? 500 : 400);
  }

  async animateMiss(target) {
    const cardWidth = target.display.cardWidth || 300;
    const missText = this.add.text(target.display.container.x + cardWidth / 2, target.display.container.y, 'MISS', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fill: '#6b7b8b',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({ targets: missText, y: missText.y - 30, alpha: 0, duration: 600, onComplete: () => missText.destroy() });
    await this.delay(400);
  }

  updateHpDisplay(ship) {
    const percent = Math.max(0, ship.currentHp / ship.maxHp);
    const hpBarWidth = ship.display.hpBarWidth || 100;
    const newWidth = Math.max(0, (hpBarWidth - 2) * percent);

    // Animate HP bar width change
    this.tweens.add({
      targets: ship.display.hpBar,
      width: newWidth,
      duration: 200,
    });

    ship.display.hpText.setText(`${Math.max(0, ship.currentHp)}/${ship.maxHp}`);

    // Update color based on damage state (KanColle style)
    let hpColor;
    if (percent > 0.75) {
      hpColor = 0x4caf50; // Green - healthy
    } else if (percent > 0.5) {
      hpColor = 0xffc107; // Yellow - light damage
    } else if (percent > 0.25) {
      hpColor = 0xff9800; // Orange - medium damage
    } else {
      hpColor = 0xf44336; // Red - heavy damage
    }
    ship.display.hpBar.setFillStyle(hpColor);
  }

  async animateSink(ship) {
    await new Promise(r => {
      this.tweens.add({ targets: ship.display.container, alpha: 0.3, y: ship.display.container.y + 20, duration: 500, onComplete: r });
    });
  }

  // ========== UI POLISH: BANNERS & CUT-INS ==========

  async showBattleStartBanner() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Create banner container
    const bannerContainer = this.add.container(width / 2, height / 2).setDepth(1000);

    // Dark overlay
    const overlay = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.7);
    bannerContainer.add(overlay);

    // Banner stripe
    const bannerHeight = 120;
    const stripe = this.add.rectangle(0, 0, width * 2, bannerHeight, 0x1a2634, 1);
    bannerContainer.add(stripe);

    // Red accent lines
    const topLine = this.add.rectangle(0, -bannerHeight / 2 + 3, width * 2, 6, 0xe03e3e, 1);
    const bottomLine = this.add.rectangle(0, bannerHeight / 2 - 3, width * 2, 6, 0xe03e3e, 1);
    bannerContainer.add(topLine);
    bannerContainer.add(bottomLine);

    // Main text
    const mainText = this.add.text(0, -10, this.isBoss ? 'BOSS BATTLE' : 'BATTLE START', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);
    bannerContainer.add(mainText);

    // Sub text
    const subText = this.add.text(0, 35, `${this.mapId} - ${this.isBoss ? 'BOSS' : 'Node ' + this.nodeId}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fill: '#b0c4de',
    }).setOrigin(0.5).setAlpha(0);
    bannerContainer.add(subText);

    // Animation sequence
    bannerContainer.setScale(1.5);
    bannerContainer.setAlpha(0);

    await new Promise(resolve => {
      // Fade in and scale down
      this.tweens.add({
        targets: bannerContainer,
        alpha: 1,
        scale: 1,
        duration: 300,
        ease: 'Back.easeOut',
      });

      this.tweens.add({
        targets: [mainText, subText],
        alpha: 1,
        duration: 400,
        delay: 150,
        onComplete: () => {
          // Hold for a moment, then fade out
          this.time.delayedCall(800, () => {
            this.tweens.add({
              targets: bannerContainer,
              alpha: 0,
              scale: 0.8,
              duration: 300,
              onComplete: () => {
                bannerContainer.destroy();
                resolve();
              }
            });
          });
        }
      });
    });
  }

  async showBattleCutIn(attacker, isTorpedo = false) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Determine attack name based on ship type
    let attackName = 'Critical Hit!';
    const rarity = RARITY[attacker.rarity];

    if (attacker.type === 'Destroyer') {
      attackName = isTorpedo ? 'Torpedo Salvo!' : 'Assault!';
    } else if (attacker.type === 'Light Cruiser') {
      attackName = 'Rapid Fire!';
    } else if (attacker.type === 'Heavy Cruiser') {
      attackName = 'Main Battery!';
    } else if (attacker.type === 'Battleship') {
      attackName = 'Full Broadside!';
    } else if (attacker.type === 'Carrier') {
      attackName = 'Air Strike!';
    }

    // Create cut-in container
    const cutInContainer = this.add.container(0, height / 2).setDepth(1000);

    // Diagonal stripe background
    const stripeHeight = 160;
    const stripe = this.add.graphics();
    stripe.fillStyle(0x1a2634, 0.95);
    stripe.fillRect(-50, -stripeHeight / 2, width + 100, stripeHeight);
    // Rarity color accent
    stripe.fillStyle(rarity.color, 1);
    stripe.fillRect(-50, -stripeHeight / 2, width + 100, 4);
    stripe.fillRect(-50, stripeHeight / 2 - 4, width + 100, 4);
    cutInContainer.add(stripe);

    // Ship portrait
    const portraitKey = `ship_portrait_${attacker.id}`;
    let portrait = null;
    if (this.textures.exists(portraitKey)) {
      portrait = this.add.image(width * 0.2, 0, portraitKey);
      const maxSize = stripeHeight - 20;
      const pScale = Math.min(maxSize / portrait.width, maxSize / portrait.height) * 1.2;
      portrait.setScale(pScale);
      portrait.setAlpha(0);
      cutInContainer.add(portrait);
    }

    // Ship name
    const nameText = this.add.text(width * 0.45, -25, attacker.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '36px',
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setAlpha(0);
    cutInContainer.add(nameText);

    // Attack name
    const attackText = this.add.text(width * 0.45, 25, attackName, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fill: `#${rarity.color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setAlpha(0);
    cutInContainer.add(attackText);

    // Slide in from left
    cutInContainer.x = -width;

    await new Promise(resolve => {
      this.tweens.add({
        targets: cutInContainer,
        x: 0,
        duration: 200,
        ease: 'Cubic.easeOut',
      });

      this.tweens.add({
        targets: [portrait, nameText, attackText].filter(x => x),
        alpha: 1,
        duration: 150,
        delay: 100,
        onComplete: () => {
          // Flash effect
          this.cameras.main.flash(100, 255, 255, 255, false);

          // Hold then slide out
          this.time.delayedCall(500, () => {
            this.tweens.add({
              targets: cutInContainer,
              x: width,
              duration: 200,
              ease: 'Cubic.easeIn',
              onComplete: () => {
                cutInContainer.destroy();
                resolve();
              }
            });
          });
        }
      });
    });
  }

  async showResultBanner(rank, victory) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const rankConfig = {
      S: { color: 0xffd700, accent: 0xffeaa7, label: 'PERFECT' },
      A: { color: 0xe8e8e8, accent: 0xffffff, label: 'EXCELLENT' },
      B: { color: 0xcd7f32, accent: 0xdaa520, label: 'GOOD' },
      C: { color: 0x74b9ff, accent: 0xa8d8ff, label: 'CLEAR' },
      D: { color: 0x636e72, accent: 0x95a5a6, label: 'CLEAR' },
    };

    const config = rankConfig[rank] || rankConfig.D;
    const colorHex = `#${config.color.toString(16).padStart(6, '0')}`;
    const accentHex = `#${config.accent.toString(16).padStart(6, '0')}`;

    const container = this.add.container(width / 2, height / 2).setDepth(1000);

    // Elegant dark overlay - fades in smoothly
    const overlay = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0);
    container.add(overlay);

    await new Promise(resolve => {
      this.tweens.add({
        targets: overlay,
        fillAlpha: 0.85,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: resolve,
      });
    });

    // Brief anticipation pause
    await this.delay(200);

    // Single soft light bloom from center (S/A only)
    if ((rank === 'S' || rank === 'A') && victory) {
      const bloom = this.add.graphics();
      bloom.fillStyle(config.color, 0.15);
      bloom.fillCircle(0, 0, 20);
      container.add(bloom);

      this.tweens.add({
        targets: bloom,
        scale: 15,
        alpha: 0,
        duration: 800,
        ease: 'Quad.easeOut',
      });
    }

    // VICTORY/DEFEAT text - elegant fade and slide
    const resultText = this.add.text(0, -60, victory ? 'VICTORY' : 'DEFEAT', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '24px',
      fill: victory ? '#ffffff' : '#e17055',
      fontStyle: '600',
      letterSpacing: 8,
    }).setOrigin(0.5).setAlpha(0);
    container.add(resultText);

    this.tweens.add({
      targets: resultText,
      alpha: 1,
      y: -70,
      duration: 500,
      ease: 'Quart.easeOut',
    });

    await this.delay(300);

    // Rank letter - scales from slightly large with gentle overshoot
    const rankText = this.add.text(0, 20, rank, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '140px',
      fill: colorHex,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0).setScale(1.2);
    container.add(rankText);

    await new Promise(resolve => {
      this.tweens.add({
        targets: rankText,
        alpha: 1,
        scale: 1,
        duration: 400,
        ease: 'Back.easeOut',
        onComplete: resolve,
      });
    });

    // Subtle breathing animation on rank
    this.tweens.add({
      targets: rankText,
      scale: 1.02,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // For S-rank: elegant floating particles (not explosion)
    if (rank === 'S' && victory) {
      // Soft glow behind rank
      const glow = this.add.graphics();
      glow.fillStyle(config.color, 0.08);
      glow.fillCircle(0, 20, 100);
      container.addAt(glow, container.list.indexOf(rankText));

      this.tweens.add({
        targets: glow,
        scale: 1.2,
        alpha: 0.03,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Gentle rising particles
      for (let i = 0; i < 12; i++) {
        this.time.delayedCall(i * 100, () => {
          const px = (Math.random() - 0.5) * 300;
          const particle = this.add.graphics();
          particle.fillStyle(config.accent, 0.6);
          particle.fillCircle(0, 0, 2 + Math.random() * 3);
          particle.setPosition(px, 150);
          container.add(particle);

          this.tweens.add({
            targets: particle,
            y: -150,
            alpha: 0,
            duration: 2000 + Math.random() * 1000,
            ease: 'Quad.easeOut',
            onComplete: () => particle.destroy(),
          });
        });
      }
    }

    await this.delay(200);

    // Label - simple fade
    const label = this.add.text(0, 100, config.label, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: accentHex,
      letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0);
    container.add(label);

    this.tweens.add({
      targets: label,
      alpha: 0.8,
      duration: 400,
      ease: 'Quad.easeOut',
    });

    // Hold - let it breathe
    await this.delay(1800);

    // Elegant fade out
    await new Promise(resolve => {
      this.tweens.add({
        targets: container,
        alpha: 0,
        duration: 500,
        ease: 'Quad.easeIn',
        onComplete: () => {
          container.destroy();
          resolve();
        }
      });
    });
  }

  checkBattleEnd(playerFleet, enemyFleet) {
    return playerFleet.filter(s => s.currentHp > 0).length === 0 || enemyFleet.filter(s => s.currentHp > 0).length === 0;
  }

  addLog(msg) {
    this.battleLog.push(msg);
    if (this.battleLog.length > 3) this.battleLog.shift();
    this.logText.setText(this.battleLog.join('\n'));
  }

  delay(ms) {
    // Apply battle speed multiplier
    const adjustedMs = ms / this.battleSpeed;
    return new Promise(r => this.time.delayedCall(adjustedMs, r));
  }

  createSpeedToggle(x, y) {
    const speedLabels = ['1x', '2x', '3x'];

    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.3);
    bg.fillRoundedRect(-35, -15, 70, 30, 6);

    this.speedText = this.add.text(0, 0, `⚡ ${speedLabels[this.battleSpeed - 1]}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fill: '#ffffff',
    }).setOrigin(0.5);

    container.add([bg, this.speedText]);

    const hitArea = this.add.rectangle(x, y, 70, 30, 0x000000, 0).setInteractive();

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x000000, 0.5);
      bg.fillRoundedRect(-35, -15, 70, 30, 6);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x000000, 0.3);
      bg.fillRoundedRect(-35, -15, 70, 30, 6);
    });

    hitArea.on('pointerdown', () => {
      // Cycle through speeds: 1 -> 2 -> 3 -> 1
      this.battleSpeed = (this.battleSpeed % 3) + 1;
      this.speedText.setText(`⚡ ${speedLabels[this.battleSpeed - 1]}`);

      // Save preference
      localStorage.setItem('battleSpeed', this.battleSpeed.toString());

      // Quick scale feedback
      this.tweens.add({
        targets: container,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 50,
        yoyo: true,
      });
    });
  }

  endBattle(playerFleet, enemyFleet, stage) {
    const playerAlive = playerFleet.filter(s => s.currentHp > 0);
    const enemySunk = enemyFleet.filter(s => s.currentHp <= 0).length;
    const playerSunk = playerFleet.filter(s => s.currentHp <= 0).length;
    const victory = enemyFleet.every(s => s.currentHp <= 0);

    let rank = 'D';
    if (victory && playerSunk === 0) rank = 'S';
    else if (victory && playerSunk <= 1) rank = 'A';
    else if (victory) rank = 'B';
    else if (enemySunk > 0) rank = 'C';

    const rankColors = { S: '#ffc107', A: '#ff9800', B: '#4caf50', C: '#2196f3', D: '#6b7b8b' };

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

    // KanColle-style result panel (white with blue header)
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.98);
    g.fillRoundedRect(width / 2 - 250, height / 2 - 220, 500, 440, 8);
    g.fillStyle(0x1a2634, 1);
    g.fillRoundedRect(width / 2 - 250, height / 2 - 220, 500, 50, { tl: 8, tr: 8, bl: 0, br: 0 });
    g.lineStyle(2, victory ? 0x4caf50 : 0xf44336, 1);
    g.strokeRoundedRect(width / 2 - 250, height / 2 - 220, 500, 440, 8);

    this.add.text(width / 2, height / 2 - 195, victory ? 'VICTORY' : 'DEFEAT', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 120, `RANK ${rank}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '64px',
      fill: rankColors[rank],
      fontStyle: 'bold',
    }).setOrigin(0.5);

    let yOffset = -40;

    if (victory) {
      // Record map clear and check for first clear / S-rank bonuses
      const clearResult = Storage.recordMapClear(stage.name, rank);
      let ticketsEarned = 0;

      // First clear bonus
      if (clearResult.isFirstClear) {
        ticketsEarned += stage.tickets;
      }

      // First S-rank bonus
      if (clearResult.isFirstSRank) {
        ticketsEarned += 2;
      }

      // Add tickets
      if (ticketsEarned > 0) {
        Storage.addTickets(ticketsEarned);
      }

      // Also give some currency for standard gacha
      const currencyReward = Math.floor(50 * (rank === 'S' ? 1.5 : rank === 'A' ? 1.2 : 1));
      Storage.addCurrency(currencyReward);

      // Display ticket rewards
      if (ticketsEarned > 0) {
        this.add.text(width / 2, height / 2 + yOffset, `+${ticketsEarned} Premium Tickets! \u{1F3AB}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '22px',
          fill: '#ff9800',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        yOffset += 30;

        if (clearResult.isFirstClear) {
          this.add.text(width / 2, height / 2 + yOffset, `First Clear Bonus: +${stage.tickets}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fill: '#ff9800',
          }).setOrigin(0.5);
          yOffset += 20;
        }
        if (clearResult.isFirstSRank) {
          this.add.text(width / 2, height / 2 + yOffset, 'S-Rank Bonus: +2', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fill: '#ffc107',
          }).setOrigin(0.5);
          yOffset += 20;
        }
      } else {
        this.add.text(width / 2, height / 2 + yOffset, 'Map already cleared', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fill: '#6b7b8b',
        }).setOrigin(0.5);
        yOffset += 20;
      }

      // Currency reward (always given)
      this.add.text(width / 2, height / 2 + yOffset, `+${currencyReward} Fuel`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fill: '#4caf50',
      }).setOrigin(0.5);
      yOffset += 30;

      // XP rewards
      const xpPerShip = Math.floor(stage.baseXp * (rank === 'S' ? 1.5 : rank === 'A' ? 1.2 : 1));

      this.add.text(width / 2, height / 2 + yOffset, 'EXP Gained:', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fill: '#1a1a2e',
      }).setOrigin(0.5);
      yOffset += 22;

      playerAlive.forEach(ship => {
        const result = Storage.addXpToShip(ship.id, xpPerShip, ship.maxLevel);
        let text = `${ship.name}: +${xpPerShip} EXP`;
        if (result && result.leveledUp) text += ` LEVEL UP! Lv.${result.newLevel}`;
        this.add.text(width / 2, height / 2 + yOffset, text, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          fill: result && result.leveledUp ? '#ffc107' : '#6b7b8b',
        }).setOrigin(0.5);
        yOffset += 18;
      });
    }

    const continueBtn = this.add.text(width / 2, height / 2 + 180, '[ CONTINUE ]', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fill: '#2196f3',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive();

    continueBtn.on('pointerover', () => continueBtn.setStyle({ fill: '#1976d2' }));
    continueBtn.on('pointerout', () => continueBtn.setStyle({ fill: '#2196f3' }));
    continueBtn.on('pointerdown', () => this.scene.restart());
  }
}
