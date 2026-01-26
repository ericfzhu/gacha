// Collection/Dock scene (Notion style)

import Phaser from 'phaser';
import { Storage } from '../systems/storage.js';
import { SHIPS, RARITY, getShipById, getShipStats, getXpForLevel } from '../data/ships.js';

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
    this.currentPage = 0;
    this.shipsPerPage = 12;
  }

  create() {
    // Use actual window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

    this.createBackground();
    this.createHeader();
    this.createShipGrid();
    this.createDetailPanel();
    this.createBottomBar();
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
    const g = this.add.graphics();

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRect(0, 0, width, 56);
    g.fillStyle(COLORS.border, 1);
    g.fillRect(0, 55, width, 1);

    const backBtn = this.add.text(24, 28, '← Back', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: COLORS.textSecondary,
    }).setOrigin(0, 0.5).setInteractive();

    backBtn.on('pointerover', () => backBtn.setStyle({ fill: COLORS.textPrimary }));
    backBtn.on('pointerout', () => backBtn.setStyle({ fill: COLORS.textSecondary }));
    backBtn.on('pointerdown', () => this.scene.start('TitleScene'));

    this.add.text(width / 2, 28, 'Dock', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '20px',
      fill: COLORS.textPrimary,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const owned = Storage.getOwnedShipCount();
    this.add.text(width - 24, 28, `${owned}/${SHIPS.length} ships`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: COLORS.textTertiary,
    }).setOrigin(1, 0.5);
  }

  createShipGrid() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Responsive grid panel (about 65% of screen)
    const gridPanelWidth = Math.min(720, Math.max(500, width * 0.65));
    this.gridPanelWidth = gridPanelWidth;

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(24, 72, gridPanelWidth, height - 130, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(24, 72, gridPanelWidth, height - 130, 6);

    this.add.text(40, 92, 'Ship List', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const startX = 50;
    const startY = 125;
    const cellWidth = 160;
    const cellHeight = 140;
    const cols = 4;

    const ownedIds = Storage.getOwnedShipIds();
    const startIndex = this.currentPage * this.shipsPerPage;
    const endIndex = Math.min(startIndex + this.shipsPerPage, SHIPS.length);

    for (let i = startIndex; i < endIndex; i++) {
      const ship = SHIPS[i];
      const localIndex = i - startIndex;
      const col = localIndex % cols;
      const row = Math.floor(localIndex / cols);
      const x = startX + col * cellWidth + cellWidth / 2;
      const y = startY + row * cellHeight + cellHeight / 2;

      const isOwned = ownedIds.includes(ship.id);
      this.createShipCard(x, y, ship, isOwned);
    }
  }

  createShipCard(x, y, shipData, isOwned) {
    const c = this.add.container(x, y);
    const rarity = RARITY[shipData.rarity];

    const bg = this.add.graphics();
    bg.fillStyle(isOwned ? COLORS.bgSecondary : 0xf1f1ef, 1);
    bg.fillRoundedRect(-65, -60, 130, 120, 6);

    if (isOwned) {
      bg.fillStyle(rarity.color, 1);
      bg.fillRect(-65, -60, 130, 3);
    }

    c.add(bg);

    if (isOwned) {
      const savedData = Storage.getShipData(shipData.id);
      const level = savedData ? savedData.level : 1;
      const stats = getShipStats(shipData, level);

      // Ship portrait
      const portraitKey = `ship_portrait_${shipData.id}`;
      if (this.textures.exists(portraitKey)) {
        const portrait = this.add.image(0, -20, portraitKey);
        const maxSize = 60;
        const pScale = Math.min(maxSize / portrait.width, maxSize / portrait.height);
        portrait.setScale(pScale);
        c.add(portrait);
      }

      // Ship name
      c.add(this.add.text(0, 22, shipData.name, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '12px',
        fill: COLORS.textPrimary,
        fontStyle: 'bold',
      }).setOrigin(0.5));

      // Stars and level
      let stars = '';
      for (let i = 0; i < rarity.stars; i++) stars += '★';
      c.add(this.add.text(-30, 38, stars, {
        fontSize: '9px',
        fill: `#${rarity.color.toString(16).padStart(6, '0')}`,
      }).setOrigin(0, 0.5));

      c.add(this.add.text(30, 38, `Lv.${level}`, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '11px',
        fill: COLORS.textSecondary,
      }).setOrigin(1, 0.5));

      if (level < shipData.maxLevel && savedData) {
        const xpNeeded = getXpForLevel(level);
        const xpPercent = Math.min(savedData.xp / xpNeeded, 1);
        c.add(this.add.rectangle(0, 50, 100, 4, 0xe9e9e7));
        const xpBar = this.add.rectangle(-50 + (100 * xpPercent) / 2, 50, 100 * xpPercent, 3, rarity.color);
        xpBar.setOrigin(0, 0.5);
        c.add(xpBar);
      }

      const hit = this.add.rectangle(0, 0, 130, 120, 0x000000, 0).setInteractive();
      hit.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(COLORS.bgHover, 1);
        bg.fillRoundedRect(-65, -60, 130, 120, 6);
        bg.fillStyle(rarity.color, 1);
        bg.fillRect(-65, -60, 130, 3);
      });
      hit.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(COLORS.bgSecondary, 1);
        bg.fillRoundedRect(-65, -60, 130, 120, 6);
        bg.fillStyle(rarity.color, 1);
        bg.fillRect(-65, -60, 130, 3);
      });
      hit.on('pointerdown', () => this.selectShip(shipData));
      c.add(hit);
    } else {
      c.add(this.add.text(0, 0, '?', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '36px',
        fill: COLORS.textTertiary,
      }).setOrigin(0.5));
    }
  }

  createDetailPanel() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Position after grid panel
    const gridPanelWidth = this.gridPanelWidth || 680;
    const panelX = 24 + gridPanelWidth + 16;
    const panelWidth = width - panelX - 24;

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(panelX, 72, panelWidth, height - 130, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(panelX, 72, panelWidth, height - 130, 6);

    this.add.text(panelX + 16, 92, 'Ship Details', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.detailContainer = this.add.container(panelX + panelWidth / 2, height / 2);

    this.detailPlaceholder = this.add.text(panelX + panelWidth / 2, height / 2, 'Select a ship\nto view details', {
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

    // Large ship portrait
    const portraitKey = `ship_portrait_${shipData.id}`;
    if (this.textures.exists(portraitKey)) {
      const portrait = this.add.image(0, -140, portraitKey);
      const maxSize = 150;
      const pScale = Math.min(maxSize / portrait.width, maxSize / portrait.height);
      portrait.setScale(pScale);
      this.detailContainer.add(portrait);
    }

    let stars = '';
    for (let i = 0; i < rarity.stars; i++) stars += '★';
    this.detailContainer.add(this.add.text(0, -50, stars, {
      fontSize: '16px',
      fill: `#${rarity.color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5));

    this.detailContainer.add(this.add.text(0, -25, shipData.name, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '22px',
      fill: COLORS.textPrimary,
      fontStyle: 'bold',
    }).setOrigin(0.5));

    this.detailContainer.add(this.add.text(0, 5, `${shipData.type} • ${rarity.name}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: `#${rarity.color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5));

    this.detailContainer.add(this.add.text(0, 35, `Level ${level} / ${shipData.maxLevel}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '18px',
      fill: COLORS.textSecondary,
    }).setOrigin(0.5));

    if (level < shipData.maxLevel && savedData) {
      const xpNeeded = getXpForLevel(level);
      this.detailContainer.add(this.add.text(0, 58, `EXP: ${savedData.xp} / ${xpNeeded}`, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '11px',
        fill: COLORS.textTertiary,
      }).setOrigin(0.5));
    }

    const statsList = [
      { label: 'HP', value: stats.hp, max: 150, color: 0x4dab9a },
      { label: 'ATK', value: stats.attack, max: 100, color: 0xe03e3e },
      { label: 'DEF', value: stats.defense, max: 80, color: 0x2eaadc },
      { label: 'SPD', value: stats.speed, max: 50, color: 0xcb912f },
      { label: 'EVA', value: stats.evasion, max: 70, color: 0x9b9a97 },
    ];

    statsList.forEach((stat, i) => {
      const yPos = 85 + i * 32;

      this.detailContainer.add(this.add.text(-120, yPos, stat.label, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '13px',
        fill: COLORS.textSecondary,
      }).setOrigin(0, 0.5));

      this.detailContainer.add(this.add.rectangle(20, yPos, 160, 12, 0xe9e9e7));

      const barWidth = Math.min((stat.value / stat.max) * 160, 160);
      const bar = this.add.rectangle(-60 + barWidth / 2, yPos, barWidth, 10, stat.color);
      bar.setOrigin(0.5);
      this.detailContainer.add(bar);

      this.detailContainer.add(this.add.text(110, yPos, stat.value.toString(), {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '13px',
        fill: COLORS.textPrimary,
      }).setOrigin(0, 0.5));
    });
  }

  createBottomBar() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRect(0, height - 48, width, 48);
    g.fillStyle(COLORS.border, 1);
    g.fillRect(0, height - 48, width, 1);

    const totalPages = Math.ceil(SHIPS.length / this.shipsPerPage);
    this.add.text(width / 2, height - 24, `Page ${this.currentPage + 1} / ${totalPages}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: COLORS.textTertiary,
    }).setOrigin(0.5);

    if (this.currentPage > 0) {
      const prevBtn = this.add.text(width / 2 - 100, height - 24, '← Prev', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '13px',
        fill: COLORS.textSecondary,
      }).setOrigin(0.5).setInteractive();
      prevBtn.on('pointerover', () => prevBtn.setStyle({ fill: COLORS.textPrimary }));
      prevBtn.on('pointerout', () => prevBtn.setStyle({ fill: COLORS.textSecondary }));
      prevBtn.on('pointerdown', () => { this.currentPage--; this.scene.restart(); });
    }

    if (this.currentPage < totalPages - 1) {
      const nextBtn = this.add.text(width / 2 + 100, height - 24, 'Next →', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '13px',
        fill: COLORS.textSecondary,
      }).setOrigin(0.5).setInteractive();
      nextBtn.on('pointerover', () => nextBtn.setStyle({ fill: COLORS.textPrimary }));
      nextBtn.on('pointerout', () => nextBtn.setStyle({ fill: COLORS.textSecondary }));
      nextBtn.on('pointerdown', () => { this.currentPage++; this.scene.restart(); });
    }
  }
}
