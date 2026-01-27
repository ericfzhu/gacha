// Dock/Repair Scene (Notion style)
// Repair damaged ships with fast repair times

import Phaser from 'phaser';
import { Storage } from '../systems/storage.js';
import { getShipById, getShipStats, RARITY } from '../data/ships.js';
import { calculateRepairTime, getDamageState } from '../data/maps.js';
import { AudioManager, BGM } from '../systems/audio.js';
import { getDisplayName } from '../data/theme.js';

// Notion-inspired colors
const COLORS = {
  bgPrimary: 0xffffff,
  bgSecondary: 0xf7f6f3,
  bgHover: 0xe9e9e7,
  textPrimary: '#37352f',
  textSecondary: '#787774',
  textTertiary: '#9b9a97',
  border: 0xe9e9e7,
  accent: 0x2eaadc,
  success: 0x4dab9a,
  warning: 0xcb912f,
  danger: 0xe03e3e,
};

export class DockScene extends Phaser.Scene {
  constructor() {
    super('DockScene');
  }

  create() {
    // Use actual window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

    // Set audio scene and play menu music
    AudioManager.setScene(this);
    AudioManager.playBgm(BGM.MENU);

    // Check for completed repairs on scene load
    Storage.checkAndCompleteRepairs();

    this.createBackground();
    this.createHeader();
    this.createRepairDocks();
    this.createDamagedShipsList();
    this.createBottomBar();

    // Update timers every second
    this.time.addEvent({
      delay: 1000,
      repeat: -1,
      callback: () => this.updateTimers(),
    });
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

    this.add.text(width / 2, 28, 'Repair Dock', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '20px',
      fill: COLORS.textPrimary,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Fuel display
    this.add.text(width - 100, 28, '⛽', {
      fontSize: '14px',
      fill: '#4dab9a',
    }).setOrigin(0, 0.5);

    this.fuelText = this.add.text(width - 78, 28, Storage.get('currency').toLocaleString(), {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: COLORS.textPrimary,
    }).setOrigin(0, 0.5);
  }

  createRepairDocks() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Responsive repair docks panel (about 45% of screen, min 400, max 550)
    const panelX = 24;
    const panelY = 72;
    const panelW = Math.min(550, Math.max(400, width * 0.45));
    const panelH = height - 130;
    this.dockPanelWidth = panelW;

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(panelX, panelY, panelW, panelH, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(panelX, panelY, panelW, panelH, 6);

    const ownedDocks = Storage.getOwnedDockCount();

    this.add.text(panelX + 16, panelY + 20, `Repair Docks (${ownedDocks}/5)`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
      fontStyle: 'bold',
    });

    const repairDocks = Storage.getRepairDocks();
    this.dockContainers = [];

    // Calculate slot height based on owned docks
    const maxSlots = 5;
    const availableH = panelH - 100; // Leave room for header and purchase button
    const slotHeight = Math.min(180, availableH / ownedDocks - 10);

    for (let i = 0; i < ownedDocks; i++) {
      const y = panelY + 50 + i * (slotHeight + 10);
      this.createDockSlot(panelX + 20, y, i, repairDocks[i], panelW - 40, slotHeight);
    }

    // Add purchase button if less than 5 docks
    if (ownedDocks < 5) {
      const cost = Storage.getDockPurchaseCost(ownedDocks);
      this.createPurchaseDockButton(panelX + panelW / 2, panelY + panelH - 35, cost);
    }
  }

  createPurchaseDockButton(x, y, cost) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.success, 1);
    bg.fillRoundedRect(-80, -18, 160, 36, 4);

    const text = this.add.text(0, 0, `Buy Dock (${cost}⛽)`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(0, 0, 160, 36, 0x000000, 0).setInteractive();

    container.add([bg, text, hitArea]);

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x3dba89, 1);
      bg.fillRoundedRect(-80, -18, 160, 36, 4);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.success, 1);
      bg.fillRoundedRect(-80, -18, 160, 36, 4);
    });

    hitArea.on('pointerdown', () => {
      const result = Storage.purchaseDock();
      if (result.success) {
        this.scene.restart();
      } else {
        this.showMessage(result.error);
      }
    });
  }

  createDockSlot(x, y, dockIndex, shipId, slotWidth = 460, slotHeight = 180) {
    const container = this.add.container(x, y);
    const scale = slotHeight / 180; // Scale factor for positioning

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgSecondary, 1);
    bg.fillRoundedRect(0, 0, slotWidth, slotHeight, 6);

    container.add(bg);

    // Dock number
    this.add.text(x + 16, y + 12 * scale, `Dock #${dockIndex + 1}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: `${Math.max(10, 14 * scale)}px`,
      fill: COLORS.textSecondary,
      fontStyle: 'bold',
    });

    if (shipId) {
      const shipData = getShipById(shipId);
      const savedData = Storage.getShipData(shipId);

      if (shipData && savedData) {
        const stats = getShipStats(shipData, savedData.level);
        const maxHp = stats.hp;
        const currentHp = Storage.getShipCurrentHp(shipId, maxHp);
        const timeRemaining = Storage.getRepairTimeRemaining(shipId);
        const rarity = RARITY[shipData.rarity];

        // Ship portrait
        const portraitKey = `ship_portrait_${shipId}`;
        if (this.textures.exists(portraitKey)) {
          const portrait = this.add.image(x + 60 * scale, y + slotHeight / 2, portraitKey);
          const maxSize = Math.min(100 * scale, slotHeight - 20);
          const pScale = Math.min(maxSize / portrait.width, maxSize / portrait.height);
          portrait.setScale(pScale);
        }

        // Ship info (positioned to right of portrait)
        const infoX = x + 120 * scale;
        let stars = '';
        for (let s = 0; s < rarity.stars; s++) stars += '★';

        this.add.text(infoX, y + 35 * scale, stars, {
          fontSize: `${Math.max(8, 11 * scale)}px`,
          fill: `#${rarity.color.toString(16).padStart(6, '0')}`,
        });

        this.add.text(infoX, y + 50 * scale, getDisplayName(shipData.id, shipData.name), {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: `${Math.max(12, 16 * scale)}px`,
          fill: COLORS.textPrimary,
          fontStyle: 'bold',
        });

        this.add.text(infoX, y + 70 * scale, `Lv.${savedData.level} ${shipData.type}`, {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: `${Math.max(10, 12 * scale)}px`,
          fill: COLORS.textSecondary,
        });

        // HP status
        const damageState = getDamageState(currentHp, maxHp);
        this.add.text(infoX, y + 88 * scale, `HP: ${currentHp}/${maxHp}`, {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: `${Math.max(10, 12 * scale)}px`,
          fill: `#${damageState.color.toString(16).padStart(6, '0')}`,
        });

        // Timer
        const timerText = this.add.text(x + slotWidth - 16, y + slotHeight * 0.4, '', {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: `${Math.max(16, 20 * scale)}px`,
          fill: COLORS.accent,
          fontStyle: 'bold',
        }).setOrigin(1, 0.5);

        timerText.setData('shipId', shipId);
        this.dockContainers.push({ timerText, shipId });

        if (timeRemaining > 0) {
          timerText.setText(this.formatTime(timeRemaining));

          // Instant repair button
          const instantCost = Math.ceil(timeRemaining / 30000) * 10; // 10 fuel per 30 seconds
          this.createInstantRepairButton(x + slotWidth - 130, y + slotHeight * 0.7, shipId, instantCost);
        } else {
          timerText.setText('Complete!');
          timerText.setStyle({ fill: COLORS.success });

          // Check for completion
          Storage.checkAndCompleteRepairs();
        }
      }
    } else {
      // Empty dock
      this.add.text(x + slotWidth / 2, y + slotHeight / 2 - 10 * scale, 'Empty Dock', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: `${Math.max(12, 14 * scale)}px`,
        fill: COLORS.textTertiary,
      }).setOrigin(0.5);

      this.add.text(x + slotWidth / 2, y + slotHeight / 2 + 10 * scale, 'Select a damaged ship to repair', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: `${Math.max(10, 11 * scale)}px`,
        fill: COLORS.textTertiary,
      }).setOrigin(0.5);
    }
  }

  createInstantRepairButton(x, y, shipId, cost) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.warning, 1);
    bg.fillRoundedRect(0, -15, 120, 30, 4);

    const text = this.add.text(60, 0, `Instant (${cost}⛽)`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(60, 0, 120, 30, 0x000000, 0).setInteractive();

    container.add([bg, text, hitArea]);

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xdaa140, 1);
      bg.fillRoundedRect(0, -15, 120, 30, 4);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.warning, 1);
      bg.fillRoundedRect(0, -15, 120, 30, 4);
    });

    hitArea.on('pointerdown', () => {
      if (Storage.spendCurrency(cost)) {
        Storage.instantRepair(shipId);
        this.scene.restart();
      } else {
        this.showMessage('Not enough fuel!');
      }
    });
  }

  createDamagedShipsList() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Position after dock panel
    const dockPanelWidth = this.dockPanelWidth || 500;
    const panelX = 24 + dockPanelWidth + 16;
    const panelY = 72;
    const panelW = width - panelX - 24;
    const panelH = height - 130;
    this.damagedListWidth = panelW;

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(panelX, panelY, panelW, panelH, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(panelX, panelY, panelW, panelH, 6);

    this.add.text(panelX + 16, panelY + 20, 'Damaged Ships', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
      fontStyle: 'bold',
    });

    // Get damaged ships (not currently repairing)
    const ownedIds = Storage.getOwnedShipIds();
    const repairDocks = Storage.getRepairDocks();
    let yOffset = 0;

    ownedIds.forEach(shipId => {
      if (repairDocks.includes(shipId)) return; // Skip ships in dock
      if (Storage.isShipRepairing(shipId)) return;

      const shipData = getShipById(shipId);
      const savedData = Storage.getShipData(shipId);
      if (!shipData || !savedData) return;

      const stats = getShipStats(shipData, savedData.level);
      const maxHp = stats.hp;
      const currentHp = Storage.getShipCurrentHp(shipId, maxHp);

      if (currentHp >= maxHp) return; // Skip healthy ships

      const y = panelY + 55 + yOffset * 70;
      if (y > panelY + panelH - 80) return; // Don't overflow

      this.createDamagedShipItem(panelX + 16, y, shipId, shipData, savedData, currentHp, maxHp, panelW - 32);
      yOffset++;
    });

    if (yOffset === 0) {
      this.add.text(panelX + panelW / 2, panelY + panelH / 2, 'No damaged ships', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '14px',
        fill: COLORS.textTertiary,
      }).setOrigin(0.5);
    }
  }

  createDamagedShipItem(x, y, shipId, shipData, savedData, currentHp, maxHp, itemWidth = 400) {
    const container = this.add.container(x, y);
    const rarity = RARITY[shipData.rarity];
    const damageState = getDamageState(currentHp, maxHp);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgSecondary, 1);
    bg.fillRoundedRect(0, 0, itemWidth, 60, 4);

    // Color indicator
    bg.fillStyle(damageState.color, 1);
    bg.fillRect(0, 0, 4, 60);

    container.add(bg);

    // Small ship portrait
    const portraitKey = `ship_portrait_${shipId}`;
    if (this.textures.exists(portraitKey)) {
      const portrait = this.add.image(x + 35, y + 30, portraitKey);
      const maxSize = 45;
      const pScale = Math.min(maxSize / portrait.width, maxSize / portrait.height);
      portrait.setScale(pScale);
    }

    // Ship name
    this.add.text(x + 65, y + 12, getDisplayName(shipData.id, shipData.name), {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: COLORS.textPrimary,
    });

    // Level
    this.add.text(x + 65, y + 32, `Lv.${savedData.level}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textSecondary,
    });

    // HP
    this.add.text(x + 150, y + 32, `${currentHp}/${maxHp} HP`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: `#${damageState.color.toString(16).padStart(6, '0')}`,
    });

    // Repair time estimate
    const repairTime = calculateRepairTime(currentHp, maxHp);
    this.add.text(x + 260, y + 22, this.formatTime(repairTime), {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: COLORS.textTertiary,
    });

    // Repair button
    this.createRepairButton(x + itemWidth - 70, y + 30, shipId, repairTime);
  }

  createRepairButton(x, y, shipId, repairTime) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.accent, 1);
    bg.fillRoundedRect(-30, -15, 60, 30, 4);

    const text = this.add.text(0, 0, 'Repair', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(0, 0, 60, 30, 0x000000, 0).setInteractive();

    container.add([bg, text, hitArea]);

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x0b76b7, 1);
      bg.fillRoundedRect(-30, -15, 60, 30, 4);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.accent, 1);
      bg.fillRoundedRect(-30, -15, 60, 30, 4);
    });

    hitArea.on('pointerdown', () => {
      const repairEndTime = Date.now() + repairTime;
      const result = Storage.startRepair(shipId, repairEndTime);

      if (result.success) {
        this.scene.restart();
      } else {
        this.showMessage(result.error);
      }
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

    this.add.text(24, height - 24, 'Repair time: 15 seconds to 2 minutes based on damage', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
    }).setOrigin(0, 0.5);

    this.add.text(width - 24, height - 24, 'Instant repair costs fuel', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
    }).setOrigin(1, 0.5);
  }

  updateTimers() {
    // Check for completed repairs
    const completed = Storage.checkAndCompleteRepairs();
    if (completed.length > 0) {
      this.scene.restart();
      return;
    }

    // Update timer displays
    this.dockContainers.forEach(({ timerText, shipId }) => {
      const timeRemaining = Storage.getRepairTimeRemaining(shipId);
      if (timeRemaining > 0) {
        timerText.setText(this.formatTime(timeRemaining));
      } else {
        timerText.setText('Complete!');
        timerText.setStyle({ fill: COLORS.success });
      }
    });

    // Update fuel display
    this.fuelText.setText(Storage.get('currency').toLocaleString());
  }

  formatTime(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  showMessage(text) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const msg = this.add.text(width / 2, height / 2, text, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '16px',
      fill: '#ffffff',
      backgroundColor: '#e03e3e',
      padding: { x: 15, y: 10 },
    }).setOrigin(0.5);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      duration: 1500,
      onComplete: () => msg.destroy(),
    });
  }
}
