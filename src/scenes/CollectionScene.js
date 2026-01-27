// Collection/Dock scene (Notion style)

import Phaser from 'phaser';
import { Storage } from '../systems/storage.js';
import { SHIPS, RARITY, getShipById, getShipStats, getXpForLevel } from '../data/ships.js';
import { AudioManager, BGM } from '../systems/audio.js';
import { SHIP_TYPE_ABBREV } from '../data/equipment.js';
import { getDisplayName, isPokemonMode, getShipTypeDisplay } from '../data/theme.js';

// Notion-inspired colors
const COLORS = {
  bgPrimary: 0xffffff,
  bgSecondary: 0xf7f6f3,
  bgHover: 0xe9e9e7,
  textPrimary: '#37352f',
  textSecondary: '#787774',
  textTertiary: '#9b9a97',
  border: 0xe9e9e7,
  accent: '#2eaadc',
  success: '#4dab9a',
};

export class CollectionScene extends Phaser.Scene {
  constructor() {
    super('CollectionScene');
    this.scrollY = 0;
    this.maxScroll = 0;
    this.isDragging = false;
  }

  create() {
    // Use actual window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

    // Set audio scene and play menu music
    AudioManager.setScene(this);
    AudioManager.playBgm(BGM.MENU);

    this.createBackground();
    this.createShipList();
    this.createDetailPanel();
    // Create header LAST so its interactive elements have input priority
    this.createHeader();
  }

  createBackground() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();
    g.fillStyle(COLORS.bgSecondary, 1);
    g.fillRect(0, 0, width, height);
  }

  createHeader() {
    const width = window.innerWidth;

    // Create header container with high depth to stay above scrollable content
    this.headerContainer = this.add.container(0, 0).setDepth(100);

    const g = this.add.graphics();

    // Taller header to accommodate progress bar
    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRect(0, 0, width, 80);
    g.fillStyle(COLORS.border, 1);
    g.fillRect(0, 79, width, 1);

    this.headerContainer.add(g);

    // Blocking hit area to prevent clicks passing through to scrolled content
    const headerBlocker = this.add.rectangle(width / 2, 40, width, 80, 0x000000, 0).setInteractive();
    this.headerContainer.add(headerBlocker);

    const backBtn = this.add.text(24, 24, '← Back', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: COLORS.textSecondary,
    }).setOrigin(0, 0.5).setInteractive();

    backBtn.on('pointerover', () => backBtn.setStyle({ fill: COLORS.textPrimary }));
    backBtn.on('pointerout', () => backBtn.setStyle({ fill: COLORS.textSecondary }));
    backBtn.on('pointerdown', () => this.scene.start('TitleScene'));

    this.headerContainer.add(backBtn);

    const collectionTitle = isPokemonMode() ? 'Pokedex' : 'Ship Collection';
    const title = this.add.text(width / 2, 20, collectionTitle, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '20px',
      fill: COLORS.textPrimary,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.headerContainer.add(title);

    // Calculate collection stats
    const ownedIds = Storage.getOwnedShipIds();
    const owned = ownedIds.length;
    const total = SHIPS.length;
    const percent = Math.floor((owned / total) * 100);

    // Count by rarity
    const rarityCount = { N: 0, R: 0, SR: 0, SSR: 0 };
    const rarityTotal = { N: 0, R: 0, SR: 0, SSR: 0 };
    SHIPS.forEach(ship => {
      rarityTotal[ship.rarity]++;
      if (ownedIds.includes(ship.id)) {
        rarityCount[ship.rarity]++;
      }
    });

    // Main progress text
    const progressText = this.add.text(width / 2, 42, `${owned}/${total} (${percent}%)`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: COLORS.textSecondary,
    }).setOrigin(0.5);
    this.headerContainer.add(progressText);

    // Progress bar
    const barWidth = Math.min(300, width * 0.3);
    const barX = width / 2 - barWidth / 2;
    const barY = 58;

    g.fillStyle(0xe9e9e7, 1);
    g.fillRoundedRect(barX, barY, barWidth, 8, 4);

    // Filled portion with gradient based on completion
    const fillWidth = (owned / total) * barWidth;
    if (fillWidth > 0) {
      const fillColor = percent === 100 ? 0xffaa00 : 0x4dab9a;
      g.fillStyle(fillColor, 1);
      g.fillRoundedRect(barX, barY, Math.max(8, fillWidth), 8, 4);
    }

    // Rarity breakdown on the right
    const rarityX = width - 24;
    const rarities = [
      { key: 'SSR', color: '#ffaa00' },
      { key: 'SR', color: '#aa44ff' },
      { key: 'R', color: '#44aaff' },
      { key: 'N', color: '#888888' },
    ];

    rarities.forEach((r, i) => {
      const x = rarityX - (3 - i) * 70;
      const rarityText = this.add.text(x, 58, `${r.key}: ${rarityCount[r.key]}/${rarityTotal[r.key]}`, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '10px',
        fill: r.color,
      }).setOrigin(1, 0.5);
      this.headerContainer.add(rarityText);
    });
  }

  createShipList() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Panel dimensions
    const panelX = 24;
    const panelY = 96;
    const panelWidth = Math.min(420, Math.max(320, width * 0.4));
    const panelHeight = height - 120;
    this.listPanelWidth = panelWidth;
    this.listPanelX = panelX;

    // Panel background
    const g = this.add.graphics();
    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 6);

    this.add.text(panelX + 16, panelY + 20, 'Ship List', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Scrollable area dimensions
    const listX = panelX + 8;
    const listY = panelY + 40;
    const listWidth = panelWidth - 16;
    const listHeight = panelHeight - 50;

    // Create ship list container
    this.shipListContainer = this.add.container(listX, listY);

    // Create all ship cards in the container
    const cardHeight = 70;
    const cardSpacing = 8;
    const ownedIds = Storage.getOwnedShipIds();

    SHIPS.forEach((ship, i) => {
      const y = i * (cardHeight + cardSpacing);
      const isOwned = ownedIds.includes(ship.id);
      this.createShipListCard(0, y, listWidth, cardHeight, ship, isOwned);
    });

    // Calculate max scroll
    const totalHeight = SHIPS.length * (cardHeight + cardSpacing);
    this.maxScroll = Math.max(0, totalHeight - listHeight);

    // Create mask for scrolling
    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(listX, listY, listWidth, listHeight);
    const mask = maskShape.createGeometryMask();
    this.shipListContainer.setMask(mask);

    // Store list bounds for scroll detection
    this.listBounds = { x: listX, y: listY, width: listWidth, height: listHeight };

    // Mouse wheel scrolling
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      if (pointer.x >= listX && pointer.x <= listX + listWidth &&
          pointer.y >= listY && pointer.y <= listY + listHeight) {
        this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, this.maxScroll);
        this.shipListContainer.y = listY - this.scrollY;
      }
    });

    // Scrollbar
    if (this.maxScroll > 0) {
      const scrollbarX = panelX + panelWidth - 8;
      const scrollbarHeight = listHeight;
      const thumbHeight = Math.max(30, (listHeight / totalHeight) * scrollbarHeight);

      // Scrollbar track
      const track = this.add.graphics();
      track.fillStyle(0xe9e9e7, 1);
      track.fillRoundedRect(scrollbarX, listY, 4, scrollbarHeight, 2);

      // Scrollbar thumb
      this.scrollThumb = this.add.graphics();
      this.updateScrollThumb(scrollbarX, listY, thumbHeight, scrollbarHeight);

      // Update thumb on scroll
      this.events.on('update', () => {
        this.updateScrollThumb(scrollbarX, listY, thumbHeight, scrollbarHeight);
      });
    }
  }

  updateScrollThumb(x, trackY, thumbHeight, trackHeight) {
    if (!this.scrollThumb) return;
    this.scrollThumb.clear();
    this.scrollThumb.fillStyle(0x9b9a97, 1);
    const thumbY = trackY + (this.scrollY / this.maxScroll) * (trackHeight - thumbHeight);
    this.scrollThumb.fillRoundedRect(x, thumbY, 4, thumbHeight, 2);
  }

  createShipListCard(x, y, w, h, shipData, isOwned) {
    const c = this.add.container(x, y);
    const rarity = RARITY[shipData.rarity];

    const bg = this.add.graphics();
    bg.fillStyle(isOwned ? 0xffffff : 0xf7f6f3, 1);
    bg.fillRoundedRect(0, 0, w, h, 4);

    if (isOwned) {
      // Rarity glow border
      bg.lineStyle(2, rarity.color, 0.5);
      bg.strokeRoundedRect(1, 1, w - 2, h - 2, 4);

      bg.fillStyle(rarity.color, 1);
      bg.fillRect(0, 0, 4, h);
    }

    c.add(bg);

    if (isOwned) {
      const savedData = Storage.getShipData(shipData.id);
      const level = savedData ? savedData.level : 1;

      // Ship portrait (small)
      const portraitKey = `ship_portrait_${shipData.id}`;
      if (this.textures.exists(portraitKey)) {
        const portrait = this.add.image(40, h / 2, portraitKey);
        const maxSize = h - 16;
        const pScale = Math.min(maxSize / portrait.width, maxSize / portrait.height);
        portrait.setScale(pScale);
        c.add(portrait);
      }

      // Ship type badge
      const typeAbbrev = SHIP_TYPE_ABBREV[shipData.type] || '??';
      const typeBadge = this.add.graphics();
      typeBadge.fillStyle(rarity.color, 0.9);
      typeBadge.fillRoundedRect(8, 4, 24, 14, 3);
      c.add(typeBadge);

      c.add(this.add.text(20, 11, typeAbbrev, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '9px',
        fill: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5));

      // Ship/Pokemon name
      c.add(this.add.text(80, h / 2 - 12, getDisplayName(shipData.id, shipData.name), {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '13px',
        fill: COLORS.textPrimary,
        fontStyle: 'bold',
      }).setOrigin(0, 0.5));

      // Stars
      let stars = '';
      for (let i = 0; i < rarity.stars; i++) stars += '★';
      c.add(this.add.text(80, h / 2 + 10, stars, {
        fontSize: '10px',
        fill: `#${rarity.color.toString(16).padStart(6, '0')}`,
      }).setOrigin(0, 0.5));

      // Level on right - larger and bolder
      c.add(this.add.text(w - 16, h / 2 - 10, `Lv.${level}`, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '14px',
        fill: COLORS.textPrimary,
        fontStyle: 'bold',
      }).setOrigin(1, 0.5));

      // Ship type on right
      c.add(this.add.text(w - 16, h / 2 + 10, shipData.type, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '10px',
        fill: COLORS.textTertiary,
      }).setOrigin(1, 0.5));

      // XP bar
      if (level < shipData.maxLevel && savedData) {
        const xpNeeded = getXpForLevel(level);
        const xpPercent = Math.min(savedData.xp / xpNeeded, 1);
        const barWidth = 80;
        const barX = 80;
        const barY = h / 2 + 26;

        c.add(this.add.rectangle(barX + barWidth / 2, barY, barWidth, 3, 0xe9e9e7).setOrigin(0.5));
        if (xpPercent > 0) {
          const fillW = barWidth * xpPercent;
          c.add(this.add.rectangle(barX + fillW / 2, barY, fillW, 3, rarity.color).setOrigin(0.5));
        }
      }

      // Hit area
      const hit = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0).setInteractive();
      hit.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(COLORS.bgHover, 1);
        bg.fillRoundedRect(0, 0, w, h, 4);
        bg.lineStyle(2, rarity.color, 0.7);
        bg.strokeRoundedRect(1, 1, w - 2, h - 2, 4);
        bg.fillStyle(rarity.color, 1);
        bg.fillRect(0, 0, 4, h);
      });
      hit.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(0xffffff, 1);
        bg.fillRoundedRect(0, 0, w, h, 4);
        bg.lineStyle(2, rarity.color, 0.5);
        bg.strokeRoundedRect(1, 1, w - 2, h - 2, 4);
        bg.fillStyle(rarity.color, 1);
        bg.fillRect(0, 0, 4, h);
      });
      hit.on('pointerdown', () => this.selectShip(shipData));
      c.add(hit);
    } else {
      // Unowned ship
      c.add(this.add.text(40, h / 2, '?', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '24px',
        fill: COLORS.textTertiary,
      }).setOrigin(0.5));

      c.add(this.add.text(80, h / 2, '???', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '13px',
        fill: COLORS.textTertiary,
      }).setOrigin(0, 0.5));
    }

    this.shipListContainer.add(c);
  }

  createDetailPanel() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Position after list panel
    const listPanelWidth = this.listPanelWidth || 400;
    const panelX = this.listPanelX + listPanelWidth + 16;
    const panelY = 96;
    const panelWidth = width - panelX - 24;
    const panelHeight = height - 120;

    const g = this.add.graphics();
    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 6);

    this.add.text(panelX + 16, panelY + 20, 'Ship Details', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Store panel info for detail content
    this.detailPanelX = panelX;
    this.detailPanelY = panelY;
    this.detailPanelWidth = panelWidth;
    this.detailPanelHeight = panelHeight;

    // Center point for detail content (within the panel, not the screen)
    const contentCenterX = panelX + panelWidth / 2;
    const contentCenterY = panelY + 50 + (panelHeight - 60) / 2;

    this.detailContainer = this.add.container(contentCenterX, contentCenterY);

    this.detailPlaceholder = this.add.text(contentCenterX, contentCenterY, 'Select a ship\nto view details', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: COLORS.textTertiary,
      align: 'center',
    }).setOrigin(0.5);
  }

  selectShip(shipData) {
    this.detailPlaceholder.setVisible(false);
    this.detailContainer.removeAll(true);

    const savedData = Storage.getShipData(shipData.id);
    const level = savedData ? savedData.level : 1;
    const stats = getShipStats(shipData, level);
    const rarity = RARITY[shipData.rarity];

    // Available space in panel (with padding)
    const panelWidth = this.detailPanelWidth - 40;
    const panelHeight = this.detailPanelHeight - 80;

    // Portrait takes at least 50% of panel height
    const minPortraitHeight = panelHeight * 0.5;
    const portraitSize = Math.min(panelWidth * 0.85, Math.max(minPortraitHeight, panelHeight * 0.55));

    // Remaining space for info and stats
    const remainingHeight = panelHeight - portraitSize;
    const numStats = 5;

    // Font sizes based on remaining height (compact when space is tight)
    const scale = Math.min(1, remainingHeight / 250);
    const titleFontSize = Math.max(14, Math.min(22, 20 * scale));
    const subtitleFontSize = Math.max(10, Math.min(14, 13 * scale));
    const labelFontSize = Math.max(9, Math.min(12, 11 * scale));
    const starFontSize = Math.max(10, Math.min(16, 14 * scale));

    // Compact spacing based on remaining height
    const spacing = Math.max(4, remainingHeight * 0.025);

    // Start from top of content area
    let currentY = -panelHeight / 2 + portraitSize / 2 + 10;

    // Ship portrait
    const portraitKey = `ship_portrait_${shipData.id}`;
    if (this.textures.exists(portraitKey)) {
      const portrait = this.add.image(0, currentY, portraitKey);
      const pScale = Math.min(portraitSize / portrait.width, portraitSize / portrait.height);
      portrait.setScale(pScale);
      this.detailContainer.add(portrait);
    }
    currentY += portraitSize / 2 + spacing + 10;

    // Stars
    let stars = '';
    for (let i = 0; i < rarity.stars; i++) stars += '★';
    this.detailContainer.add(this.add.text(0, currentY, stars, {
      fontSize: `${starFontSize}px`,
      fill: `#${rarity.color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5));
    currentY += starFontSize + spacing;

    // Ship/Pokemon name
    this.detailContainer.add(this.add.text(0, currentY, getDisplayName(shipData.id, shipData.name), {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: `${titleFontSize}px`,
      fill: COLORS.textPrimary,
      fontStyle: 'bold',
    }).setOrigin(0.5));
    currentY += titleFontSize + spacing * 0.5;

    // Type and rarity
    const typeDisplay = getShipTypeDisplay(shipData.type);
    this.detailContainer.add(this.add.text(0, currentY, `${typeDisplay} • ${rarity.name}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: `${labelFontSize}px`,
      fill: `#${rarity.color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5));
    currentY += labelFontSize + spacing;

    // Level
    this.detailContainer.add(this.add.text(0, currentY, `Level ${level} / ${shipData.maxLevel}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: `${subtitleFontSize}px`,
      fill: COLORS.textSecondary,
    }).setOrigin(0.5));
    currentY += subtitleFontSize + spacing * 0.3;

    // XP text
    if (level < shipData.maxLevel && savedData) {
      const xpNeeded = getXpForLevel(level);
      this.detailContainer.add(this.add.text(0, currentY, `EXP: ${savedData.xp} / ${xpNeeded}`, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: `${labelFontSize * 0.9}px`,
        fill: COLORS.textTertiary,
      }).setOrigin(0.5));
    }
    currentY += spacing * 1.5;

    // Stats
    const statsList = [
      { label: 'HP', value: stats.hp, max: 150, color: 0x4dab9a },
      { label: 'ATK', value: stats.attack, max: 100, color: 0xe03e3e },
      { label: 'DEF', value: stats.defense, max: 80, color: 0x2eaadc },
      { label: 'SPD', value: stats.speed, max: 50, color: 0xcb912f },
      { label: 'EVA', value: stats.evasion, max: 70, color: 0x9b9a97 },
    ];

    // Bar dimensions scale with remaining space
    const barMaxWidth = Math.min(panelWidth * 0.6, 160);
    const barHeight = Math.max(5, Math.min(10, remainingHeight * 0.03));
    const statSpacing = Math.max(16, remainingHeight * 0.08);

    statsList.forEach((stat, i) => {
      const yPos = currentY + i * statSpacing;

      // Label
      this.detailContainer.add(this.add.text(-barMaxWidth / 2 - 10, yPos, stat.label, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: `${labelFontSize}px`,
        fill: COLORS.textSecondary,
      }).setOrigin(1, 0.5));

      // Bar background
      const barBg = this.add.rectangle(0, yPos, barMaxWidth, barHeight, 0xe9e9e7);
      this.detailContainer.add(barBg);

      // Bar fill
      const barFillWidth = Math.min((stat.value / stat.max) * barMaxWidth, barMaxWidth);
      if (barFillWidth > 0) {
        const barFill = this.add.rectangle(
          -barMaxWidth / 2 + barFillWidth / 2,
          yPos,
          barFillWidth,
          barHeight - 2,
          stat.color
        );
        this.detailContainer.add(barFill);
      }

      // Value text
      this.detailContainer.add(this.add.text(barMaxWidth / 2 + 10, yPos, stat.value.toString(), {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: `${labelFontSize}px`,
        fill: COLORS.textPrimary,
      }).setOrigin(0, 0.5));
    });
  }
}
