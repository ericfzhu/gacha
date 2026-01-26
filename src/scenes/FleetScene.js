// Fleet/Organize scene (Notion style)

import Phaser from 'phaser';
import { Storage } from '../systems/storage.js';
import { getShipById, getShipStats, RARITY } from '../data/ships.js';
import { getDamageState } from '../data/maps.js';

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
  warning: '#cb912f',
};

export class FleetScene extends Phaser.Scene {
  constructor() {
    super('FleetScene');
    this.selectedSlot = null;
  }

  create() {
    // Use actual window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

    this.createBackground();
    this.createHeader();
    this.createFleetPanel();
    this.createShipList();
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

    this.add.text(width / 2, 28, 'Organize Fleet', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '20px',
      fill: COLORS.textPrimary,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.powerText = this.add.text(width - 24, 28, '', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: COLORS.textSecondary,
    }).setOrigin(1, 0.5);
    this.updatePowerDisplay();
  }

  createFleetPanel() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Fleet panel takes up 65% of screen (leaving 35% for ship list)
    const panelW = Math.floor((width - 24 * 3) * 0.65);
    const panelH = height - 130;
    this.fleetPanelWidth = panelW;

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(24, 72, panelW, panelH, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(24, 72, panelW, panelH, 6);

    this.add.text(40, 92, 'Fleet Formation', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const fleet = Storage.get('fleet');
    this.slotContainers = [];

    // Calculate slot size to fill the entire panel (2 columns x 3 rows)
    const padding = 16;
    const headerHeight = 40;
    const footerHeight = 30;
    const gap = 12;

    const availableW = panelW - padding * 2 - gap;
    const availableH = panelH - headerHeight - footerHeight - padding * 2 - gap * 2;

    const slotWidth = Math.floor(availableW / 2);
    const slotHeight = Math.floor(availableH / 3);
    this.slotWidth = slotWidth;
    this.slotHeight = slotHeight;

    const startX = 24 + padding + slotWidth / 2;
    const startY = 72 + headerHeight + padding + slotHeight / 2;

    for (let i = 0; i < 6; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (slotWidth + gap);
      const y = startY + row * (slotHeight + gap);
      this.createFleetSlot(x, y, i, fleet[i]);
    }

    this.add.text(24 + panelW / 2, 72 + panelH - footerHeight / 2 - 5, 'Select slot, then choose ship', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
    }).setOrigin(0.5);
  }

  createFleetSlot(x, y, index, shipId) {
    const c = this.add.container(x, y);
    const slotW = this.slotWidth || 200;
    const slotH = this.slotHeight || 140;
    const halfW = slotW / 2;
    const halfH = slotH / 2;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgSecondary, 1);
    bg.fillRoundedRect(-halfW, -halfH, slotW, slotH, 8);

    c.add(bg);

    if (shipId) {
      const shipData = getShipById(shipId);
      const savedData = Storage.getShipData(shipId);
      if (shipData && savedData) {
        const level = savedData.level;
        const stats = getShipStats(shipData, level);
        const rarity = RARITY[shipData.rarity];
        const currentHp = Storage.getShipCurrentHp(shipId, stats.hp);
        const damageState = getDamageState(currentHp, stats.hp);
        const isRepairing = Storage.isShipRepairing(shipId);

        // Portrait takes left portion, full height
        const portraitWidth = slotH * 0.85; // Square-ish based on height
        const portraitX = -halfW + portraitWidth / 2 + 8;

        // Ship portrait - full height
        const portraitKey = `ship_portrait_${shipId}`;
        if (this.textures.exists(portraitKey)) {
          const portrait = this.add.image(portraitX, 0, portraitKey);
          const maxH = slotH - 16;
          const maxW = portraitWidth - 8;
          const scale = Math.min(maxW / portrait.width, maxH / portrait.height);
          portrait.setScale(scale);
          c.add(portrait);
        }

        // Details on the right side
        const infoX = -halfW + portraitWidth + 20;
        const infoW = slotW - portraitWidth - 30;

        // Slot number
        c.add(this.add.text(infoX, -halfH + 18, `#${index + 1}`, {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: '11px',
          fill: COLORS.textTertiary,
          fontStyle: 'bold',
        }).setOrigin(0, 0.5));

        // Ship name
        c.add(this.add.text(infoX, -halfH + 40, shipData.name, {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: '14px',
          fill: COLORS.textPrimary,
          fontStyle: 'bold',
        }).setOrigin(0, 0.5));

        // Stars
        let stars = '';
        for (let i = 0; i < rarity.stars; i++) stars += '★';
        c.add(this.add.text(infoX, -halfH + 60, stars, {
          fontSize: '12px',
          fill: `#${rarity.color.toString(16).padStart(6, '0')}`,
        }).setOrigin(0, 0.5));

        // Level
        c.add(this.add.text(infoX, -halfH + 82, `Lv.${level}`, {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: '13px',
          fill: COLORS.textSecondary,
        }).setOrigin(0, 0.5));

        // HP bar
        const hpBarWidth = Math.min(infoW, 100);
        const hpBarY = halfH - 35;
        const hpPercent = currentHp / stats.hp;

        c.add(this.add.rectangle(infoX + hpBarWidth / 2, hpBarY, hpBarWidth, 10, 0xe9e9e7).setOrigin(0.5));
        const hpFill = this.add.rectangle(infoX, hpBarY, hpBarWidth * hpPercent, 8, damageState.color);
        hpFill.setOrigin(0, 0.5);
        c.add(hpFill);

        // HP text
        const hpColor = `#${damageState.color.toString(16).padStart(6, '0')}`;
        let hpText = `${currentHp}/${stats.hp}`;
        if (isRepairing) hpText = 'Repairing...';

        c.add(this.add.text(infoX, hpBarY + 18, hpText, {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: '11px',
          fill: isRepairing ? '#2eaadc' : hpColor,
        }).setOrigin(0, 0.5));

        // Warning for damaged ships
        if (!damageState.canSortie || isRepairing) {
          c.add(this.add.text(infoX, hpBarY + 35, isRepairing ? '🔧 In Dock' : '⚠ Cannot Sortie', {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: '10px',
            fill: isRepairing ? '#2eaadc' : '#e03e3e',
          }).setOrigin(0, 0.5));
        }
      }
    } else {
      // Empty slot
      c.add(this.add.text(-halfW + 15, -halfH + 18, `#${index + 1}`, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '11px',
        fill: COLORS.textTertiary,
        fontStyle: 'bold',
      }).setOrigin(0, 0.5));

      c.add(this.add.text(0, 0, 'Empty Slot', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '16px',
        fill: COLORS.textTertiary,
      }).setOrigin(0.5));

      c.add(this.add.text(0, 25, 'Click to assign', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '12px',
        fill: COLORS.textTertiary,
      }).setOrigin(0.5));
    }

    const hit = this.add.rectangle(x, y, slotW, slotH, 0x000000, 0).setInteractive();
    hit.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.bgHover, 1);
      bg.fillRoundedRect(-halfW, -halfH, slotW, slotH, 8);
    });
    hit.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(this.selectedSlot === index ? COLORS.bgHover : COLORS.bgSecondary, 1);
      bg.fillRoundedRect(-halfW, -halfH, slotW, slotH, 8);
    });
    hit.on('pointerdown', () => this.selectSlot(index, bg));

    this.slotContainers.push({ bg, index, slotW, slotH });
  }

  selectSlot(index, bg) {
    this.slotContainers.forEach(slot => {
      const halfW = slot.slotW / 2;
      const halfH = slot.slotH / 2;
      slot.bg.clear();
      slot.bg.fillStyle(COLORS.bgSecondary, 1);
      slot.bg.fillRoundedRect(-halfW, -halfH, slot.slotW, slot.slotH, 8);
    });

    const slot = this.slotContainers.find(s => s.index === index);
    const halfW = slot.slotW / 2;
    const halfH = slot.slotH / 2;

    this.selectedSlot = index;
    bg.clear();
    bg.fillStyle(COLORS.bgHover, 1);
    bg.fillRoundedRect(-halfW, -halfH, slot.slotW, slot.slotH, 8);
    bg.lineStyle(2, 0x2eaadc, 1);
    bg.strokeRoundedRect(-halfW, -halfH, slot.slotW, slot.slotH, 8);
  }

  createShipList() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Position after fleet panel
    const fleetPanelWidth = this.fleetPanelWidth || 400;
    const panelX = 24 + fleetPanelWidth + 16;
    const panelY = 72;
    const panelWidth = width - panelX - 24;
    const panelHeight = height - 130;

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 6);

    this.add.text(panelX + 16, panelY + 20, 'Available Ships', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const ownedIds = Storage.getOwnedShipIds();
    const fleet = Storage.get('fleet');

    if (ownedIds.length === 0) {
      this.add.text(panelX + panelWidth / 2, panelY + panelHeight / 2, 'No ships available\nConstruct ships first', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '14px',
        fill: COLORS.textTertiary,
        align: 'center',
      }).setOrigin(0.5);
      return;
    }

    // Ship count indicator
    this.add.text(panelX + panelWidth - 16, panelY + 20, `${ownedIds.length} ships`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '11px',
      fill: COLORS.textTertiary,
    }).setOrigin(1, 0.5);

    // Scrollable area setup
    const listX = panelX + 16;
    const listY = panelY + 45;
    const listWidth = panelWidth - 32;
    const listHeight = panelHeight - 60;
    const itemHeight = 48;

    // Store scroll data
    this.scrollData = {
      listX,
      listY,
      listWidth,
      listHeight,
      itemHeight,
      ownedIds,
      fleet,
      scrollY: 0,
      maxScroll: Math.max(0, ownedIds.length * itemHeight - listHeight),
    };

    // Container to hold ship list items (no mask - we'll only render visible items)
    this.shipListContainer = this.add.container(0, 0);

    // Render visible ships
    this.renderShipList();

    // Mouse wheel scrolling
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      if (pointer.x >= panelX && pointer.x <= panelX + panelWidth &&
          pointer.y >= panelY && pointer.y <= panelY + panelHeight) {
        this.scrollShipList(deltaY * 0.5);
      }
    });
  }

  renderShipList() {
    // Clear existing items
    this.shipListContainer.removeAll(true);

    const { listX, listY, listWidth, listHeight, itemHeight, ownedIds, fleet, scrollY } = this.scrollData;

    ownedIds.forEach((shipId, index) => {
      const itemY = listY + index * itemHeight - scrollY;

      // Only render items that are visible (with some buffer)
      if (itemY < listY - itemHeight || itemY > listY + listHeight) {
        return;
      }

      const shipData = getShipById(shipId);
      const savedData = Storage.getShipData(shipId);
      if (!shipData || !savedData) return;

      const level = savedData.level;
      const stats = getShipStats(shipData, level);
      const inFleet = fleet.includes(shipId);

      this.createShipListItem(listX, itemY, shipData, level, stats, inFleet, shipId, listWidth);
    });
  }

  scrollShipList(delta) {
    if (!this.scrollData) return;

    this.scrollData.scrollY = Phaser.Math.Clamp(
      this.scrollData.scrollY + delta,
      0,
      this.scrollData.maxScroll
    );
    this.renderShipList();
  }

  createShipListItem(x, y, shipData, level, stats, inFleet, shipId, itemWidth) {
    // Use provided width or calculate from screen
    if (!itemWidth) {
      const width = window.innerWidth;
      itemWidth = width - 496;
    }

    const rarity = RARITY[shipData.rarity];
    const currentHp = Storage.getShipCurrentHp(shipId, stats.hp);
    const damageState = getDamageState(currentHp, stats.hp);
    const isRepairing = Storage.isShipRepairing(shipId);
    const canAssign = !inFleet && damageState.canSortie && !isRepairing;

    // Background
    const bg = this.add.graphics();
    if (inFleet) {
      bg.fillStyle(rarity.color, 0.1);
      bg.fillRoundedRect(x, y, itemWidth, 40, 4);
    }

    // Damage indicator bar
    bg.fillStyle(damageState.color, 1);
    bg.fillRect(x, y, 3, 40);

    // Small ship portrait
    const portraitKey = `ship_portrait_${shipId}`;
    if (this.textures.exists(portraitKey)) {
      const portrait = this.add.image(x + 25, y + 20, portraitKey);
      const maxSize = 32;
      const pScale = Math.min(maxSize / portrait.width, maxSize / portrait.height);
      portrait.setScale(pScale);
      if (inFleet || !canAssign) portrait.setAlpha(0.5);
      this.shipListContainer.add(portrait);
    }

    // Stars
    let stars = '';
    for (let i = 0; i < rarity.stars; i++) stars += '★';
    const starsText = this.add.text(x + 50, y + 12, stars, {
      fontSize: '9px',
      fill: `#${rarity.color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0, 0.5);

    // Ship name
    const nameText = this.add.text(x + 50, y + 28, shipData.name, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: inFleet || !canAssign ? COLORS.textTertiary : COLORS.textPrimary,
    }).setOrigin(0, 0.5);

    // Level
    const levelText = this.add.text(x + 150, y + 20, `Lv.${level}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textSecondary,
    }).setOrigin(0, 0.5);

    // HP display
    const hpColor = `#${damageState.color.toString(16).padStart(6, '0')}`;
    let hpDisplay = `${currentHp}/${stats.hp}`;
    if (isRepairing) hpDisplay = 'Repairing';

    const hpText = this.add.text(x + 200, y + 20, hpDisplay, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '11px',
      fill: isRepairing ? '#2eaadc' : hpColor,
    }).setOrigin(0, 0.5);

    // Status text
    let statusText = 'Assign →';
    let statusColor = COLORS.accent;
    if (inFleet) {
      statusText = 'In Fleet';
      statusColor = COLORS.textTertiary;
    } else if (isRepairing) {
      statusText = 'Repairing';
      statusColor = '#2eaadc';
    } else if (!damageState.canSortie) {
      statusText = 'Heavy Damage';
      statusColor = '#e03e3e';
    }

    const statusTextObj = this.add.text(x + itemWidth - 12, y + 20, statusText, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: statusColor,
    }).setOrigin(1, 0.5);

    // Add all to container
    this.shipListContainer.add([bg, starsText, nameText, levelText, hpText, statusTextObj]);

    if (canAssign) {
      const hit = this.add.rectangle(x + itemWidth / 2, y + 20, itemWidth, 40, 0x000000, 0).setInteractive();
      this.shipListContainer.add(hit);

      hit.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(COLORS.bgHover, 1);
        bg.fillRoundedRect(x, y, itemWidth, 40, 4);
        bg.fillStyle(damageState.color, 1);
        bg.fillRect(x, y, 3, 40);
      });
      hit.on('pointerout', () => {
        bg.clear();
        if (inFleet) {
          bg.fillStyle(rarity.color, 0.1);
          bg.fillRoundedRect(x, y, itemWidth, 40, 4);
        }
        bg.fillStyle(damageState.color, 1);
        bg.fillRect(x, y, 3, 40);
      });
      hit.on('pointerdown', () => this.assignShip(shipId));
    }
  }

  assignShip(shipId) {
    if (this.selectedSlot === null) {
      this.showMessage('Select a fleet slot first');
      return;
    }

    const fleet = Storage.get('fleet');
    if (fleet.includes(shipId)) {
      this.showMessage('Ship already assigned');
      return;
    }

    fleet[this.selectedSlot] = shipId;
    Storage.setFleet(fleet);
    this.scene.restart();
  }

  updatePowerDisplay() {
    const fleet = Storage.get('fleet');
    let totalPower = 0;

    fleet.forEach(shipId => {
      if (shipId) {
        const shipData = getShipById(shipId);
        const savedData = Storage.getShipData(shipId);
        if (shipData && savedData) {
          const stats = getShipStats(shipData, savedData.level);
          totalPower += stats.hp + stats.attack + stats.defense + stats.speed;
        }
      }
    });

    this.powerText.setText(`Power: ${totalPower}`);
  }

  showMessage(text) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const msg = this.add.text(width / 2, height - 100, text, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: '#ffffff',
      backgroundColor: '#e03e3e',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      duration: 1500,
      onComplete: () => msg.destroy(),
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

    const fleet = Storage.get('fleet');
    const count = fleet.filter(id => id !== null).length;
    this.add.text(24, height - 24, `${count}/6 ships assigned`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: COLORS.textTertiary,
    }).setOrigin(0, 0.5);
  }
}
