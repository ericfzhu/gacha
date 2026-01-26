// Battle/Sortie scene (Notion style)

import Phaser from 'phaser';
import { Storage } from '../systems/storage.js';
import { getShipById, getShipStats, RARITY } from '../data/ships.js';
import { MAPS, MAP_ORDER, getMapById, getNodeById, getDamageState } from '../data/maps.js';

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
  }

  create() {
    // Check for completed repairs
    Storage.checkAndCompleteRepairs();

    // If we have map/node data, start battle directly
    if (this.mapId && this.nodeId) {
      this.startNodeBattle();
      return;
    }

    // Use actual window dimensions for sortie layout
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

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
    this.endNodeBattle(playerFleet, enemyFleet);
  }

  endNodeBattle(playerFleet, enemyFleet) {
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

    // Update fleet HP from battle results
    playerFleet.forEach(ship => {
      this.fleetHp[ship.id] = ship.currentHp;
    });

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

    // Result panel
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
      // XP rewards
      const xpPerShip = Math.floor(this.currentMapData.baseXp * (rank === 'S' ? 1.5 : rank === 'A' ? 1.2 : 1));

      // Boss completion - handle map rewards
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
          this.add.text(width / 2, height / 2 + yOffset, `+${ticketsEarned} Premium Tickets! 🎫`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '22px',
            fill: '#ff9800',
            fontStyle: 'bold',
          }).setOrigin(0.5);
          yOffset += 30;

          if (clearResult.isFirstClear) {
            this.add.text(width / 2, height / 2 + yOffset, `First Clear: +${this.currentMapData.firstClearTickets}`, {
              fontFamily: 'Arial, sans-serif',
              fontSize: '14px',
              fill: '#ff9800',
            }).setOrigin(0.5);
            yOffset += 20;
          }
          if (clearResult.isFirstSRank) {
            this.add.text(width / 2, height / 2 + yOffset, `S-Rank Bonus: +${this.currentMapData.sRankBonus}`, {
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

        // Fuel reward on boss clear
        const fuelReward = Math.floor(250 * (rank === 'S' ? 1.5 : rank === 'A' ? 1.2 : 1));
        Storage.addCurrency(fuelReward);
        this.add.text(width / 2, height / 2 + yOffset, `+${fuelReward} Fuel`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fill: '#4caf50',
        }).setOrigin(0.5);
        yOffset += 30;
      } else {
        // Regular node - smaller fuel reward
        const fuelReward = Math.floor(100 * (rank === 'S' ? 1.5 : 1));
        Storage.addCurrency(fuelReward);
        this.add.text(width / 2, height / 2 + yOffset, `+${fuelReward} Fuel`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fill: '#4caf50',
        }).setOrigin(0.5);
        yOffset += 30;
      }

      // Show XP gains
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

    // Continue button - different action based on result and boss status
    let btnText = '[ CONTINUE ]';
    let btnAction;

    if (!victory || this.isBoss) {
      // Defeat or boss clear - save HP to storage and return to port
      btnText = this.isBoss && victory ? '[ RETURN TO PORT ]' : '[ RETREAT ]';
      btnAction = () => {
        // Save damaged HP to storage
        Object.entries(this.fleetHp).forEach(([shipId, hp]) => {
          Storage.setShipHp(shipId, hp);
        });
        // Pass empty data to clear map/node context and show map selection
        this.scene.start('BattleScene', { mapId: null, nodeId: null, fleetHp: {}, isBoss: false });
      };
    } else {
      // Victory on non-boss node - continue to next node
      btnText = '[ ADVANCE ]';
      btnAction = () => {
        this.scene.start('MapScene', {
          mapId: this.mapId,
          currentNode: this.nodeId,
          fleetHp: this.fleetHp,
        });
      };
    }

    const continueBtn = this.add.text(width / 2, height / 2 + 180, btnText, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fill: '#2196f3',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive();

    continueBtn.on('pointerover', () => continueBtn.setStyle({ fill: '#1976d2' }));
    continueBtn.on('pointerout', () => continueBtn.setStyle({ fill: '#2196f3' }));
    continueBtn.on('pointerdown', btnAction);
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

    // HP bar
    const hpBarWidth = cardWidth - bannerWidth - 20;
    const hpBarX = textX;
    const hpBg = this.add.rectangle(hpBarX + hpBarWidth / 2, 10, hpBarWidth, 14, 0xc5d5e5).setOrigin(0.5);
    const hpBar = this.add.rectangle(hpBarX, 10, hpBarWidth - 2, 12, isPlayer ? 0x4caf50 : 0xf44336).setOrigin(0, 0.5);
    const hpText = this.add.text(hpBarX + hpBarWidth / 2, 10, `${ship.currentHp}/${ship.maxHp}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      fill: '#1a1a2e',
    }).setOrigin(0.5);

    c.add([bg, name, hpBg, hpBar, hpText]);
    c.sendToBack(bg);
    return { container: c, hpBar, hpText, bg, cardWidth, cardHeight };
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

  async showPhase(phaseName) {
    this.phaseText.setText(phaseName);
    this.phaseText.setAlpha(0);
    await new Promise(r => this.tweens.add({ targets: this.phaseText, alpha: 1, duration: 300, onComplete: r }));
  }

  async executeAttack(attacker, playerFleet, enemyFleet, isTorpedo = false) {
    if (attacker.currentHp <= 0) return;

    const targets = attacker.isPlayer
      ? enemyFleet.filter(s => s.currentHp > 0)
      : playerFleet.filter(s => s.currentHp > 0);

    if (targets.length === 0) return;

    const target = Phaser.Math.RND.pick(targets);
    const hitChance = 90 - target.evasion * 0.5 + attacker.attack * 0.2;
    const hit = Math.random() * 100 < hitChance;

    if (!hit) {
      this.addLog(`${attacker.name} attacks ${target.name}... MISS!`);
      await this.animateMiss(target);
      return;
    }

    // Enemy damage multiplier for increased difficulty
    const enemyDmgMod = attacker.isPlayer ? 1 : 1.3;
    const baseDmg = attacker.attack * (isTorpedo ? 1.5 : 1) * enemyDmgMod;
    const defMod = 1 - (target.defense / (target.defense + 50));
    const variance = Phaser.Math.FloatBetween(0.8, 1.2);
    const critical = Math.random() < 0.1;
    let damage = Math.floor(baseDmg * defMod * variance * (critical ? 1.5 : 1));
    damage = Math.max(1, damage);

    target.currentHp = Math.max(0, target.currentHp - damage);

    const critText = critical ? ' CRITICAL!' : '';
    this.addLog(`${attacker.name} >> ${target.name} ${damage} DMG${critText}`);

    await this.animateAttack(attacker, target, damage, critical);
    this.updateHpDisplay(target);

    if (target.currentHp <= 0) {
      this.addLog(`${target.name} SUNK!`);
      await this.animateSink(target);
    }
  }

  async animateAttack(attacker, target, damage, critical) {
    this.tweens.add({ targets: attacker.display.container, scaleX: 1.05, scaleY: 1.05, duration: 100, yoyo: true });
    await this.delay(200);

    const cardWidth = target.display.cardWidth || 300;
    const hitX = target.display.container.x + cardWidth / 2;
    const hitY = target.display.container.y;

    const flash = this.add.rectangle(hitX, hitY, cardWidth, 60, critical ? 0xffc107 : 0xf44336, 0.5);
    this.tweens.add({ targets: flash, alpha: 0, duration: 200, onComplete: () => flash.destroy() });

    const dmgText = this.add.text(hitX, hitY - 40, `-${damage}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: critical ? '28px' : '20px',
      fill: critical ? '#ffc107' : '#f44336',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({ targets: dmgText, y: hitY - 70, alpha: 0, duration: 800, onComplete: () => dmgText.destroy() });

    const origX = target.display.container.x;
    this.tweens.add({ targets: target.display.container, x: origX + 10, duration: 50, yoyo: true, repeat: 3 });

    await this.delay(400);
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
    const percent = ship.currentHp / ship.maxHp;
    this.tweens.add({ targets: ship.display.hpBar, scaleX: Math.max(0, percent), duration: 200 });
    ship.display.hpText.setText(`${Math.max(0, ship.currentHp)}/${ship.maxHp}`);

    if (percent < 0.25) ship.display.hpBar.setFillStyle(0xc62828);
    else if (percent < 0.5) ship.display.hpBar.setFillStyle(0xf9a825);
  }

  async animateSink(ship) {
    await new Promise(r => {
      this.tweens.add({ targets: ship.display.container, alpha: 0.3, y: ship.display.container.y + 20, duration: 500, onComplete: r });
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
    return new Promise(r => this.time.delayedCall(ms, r));
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
