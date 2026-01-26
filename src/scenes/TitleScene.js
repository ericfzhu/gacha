// Title scene - main menu (KanColle-style naval base interface)

import Phaser from 'phaser';
import { Storage } from '../systems/storage.js';
import { getShipById, RARITY } from '../data/ships.js';

// Notion-inspired color palette
const COLORS = {
  // Backgrounds
  bgPrimary: 0xffffff,
  bgSecondary: 0xf7f6f3,
  bgTertiary: 0xf1f1ef,
  bgHover: 0xe9e9e7,

  // Text
  textPrimary: 0x37352f,
  textSecondary: 0x787774,
  textTertiary: 0x9b9a97,

  // Borders
  border: 0xe9e9e7,
  borderLight: 0xdfdfde,

  // Accents
  accent: 0x2eaadc,
  accentHover: 0x0b76b7,
  success: 0x4dab9a,
  warning: 0xcb912f,
  danger: 0xe03e3e,

  // Special
  fuel: 0x4dab9a,
  tickets: 0xcb912f,
};

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    // Use actual window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

    this.createBackground();
    this.createTopBar();
    this.createSecretaryArea();
    this.createMenuPanel();
    this.createBottomBar();
  }

  createBackground() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Notion-style clean background
    g.fillStyle(COLORS.bgSecondary, 1);
    g.fillRect(0, 0, width, height);
  }

  createTopBar() {
    const width = window.innerWidth;
    const saveData = Storage.load();
    const g = this.add.graphics();

    // Notion-style clean top bar
    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRect(0, 0, width, 56);

    // Bottom border
    g.fillStyle(COLORS.border, 1);
    g.fillRect(0, 55, width, 1);

    // Title
    this.add.text(24, 28, 'Fleet Collection', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '20px',
      fill: '#37352f',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Resources display (simplified to 2: Fuel and Tickets)
    const resources = [
      { icon: '\u26fd', label: 'Fuel', value: saveData.currency, color: COLORS.fuel },
      { icon: '\u{1F3AB}', label: 'Tickets', value: saveData.tickets || 0, color: COLORS.tickets },
    ];

    resources.forEach((res, i) => {
      const x = width - 220 + i * 110;

      // Icon and value
      this.add.text(x, 28, res.icon, {
        fontSize: '14px',
        fill: `#${res.color.toString(16).padStart(6, '0')}`,
      }).setOrigin(0, 0.5);

      this.add.text(x + 22, 28, res.value.toLocaleString(), {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '14px',
        fill: '#37352f',
      }).setOrigin(0, 0.5);
    });
  }

  createSecretaryArea() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Wider panel for secretary ship (about 45% of screen, min 350, max 550)
    const panelX = 24;
    const panelY = 72;
    const panelW = Math.min(550, Math.max(350, width * 0.45));
    const panelH = height - 130;

    // Store for menu panel positioning
    this.secretaryPanelWidth = panelW;

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(panelX, panelY, panelW, panelH, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(panelX, panelY, panelW, panelH, 6);

    // Section title
    this.add.text(panelX + 16, panelY + 20, 'Secretary Ship', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#9b9a97',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Get fleet flagship (secretary)
    const fleet = Storage.get('fleet');
    const secretaryId = fleet[0];

    if (secretaryId) {
      const shipData = getShipById(secretaryId);
      const savedData = Storage.getShipData(secretaryId);
      if (shipData && savedData) {
        this.displaySecretary(panelX, panelY + 40, panelW, panelH - 50, shipData, savedData);
      }
    } else {
      this.add.text(panelX + panelW / 2, panelY + panelH / 2, 'No Secretary Ship\n\nAssign a ship to Fleet Slot #1', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '14px',
        fill: '#9b9a97',
        align: 'center',
      }).setOrigin(0.5);
    }
  }

  displaySecretary(panelX, panelY, panelW, panelH, shipData, savedData) {
    const centerX = panelX + panelW / 2;
    const centerY = panelY + panelH / 2;

    // Ship portrait - fills the panel
    const portraitKey = `ship_portrait_${shipData.id}`;
    if (this.textures.exists(portraitKey)) {
      const portrait = this.add.image(centerX, centerY, portraitKey);
      // Scale to fill the panel
      const maxW = panelW - 32;
      const maxH = panelH - 32;
      const scale = Math.min(maxW / portrait.width, maxH / portrait.height);
      portrait.setScale(scale);
    }
  }

  createMenuPanel() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Notion-style menu card - positioned after secretary panel
    const secretaryWidth = this.secretaryPanelWidth || 380;
    const panelX = 24 + secretaryWidth + 16;
    const panelY = 72;
    const panelW = width - panelX - 24;
    const panelH = height - 130;

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(panelX, panelY, panelW, panelH, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(panelX, panelY, panelW, panelH, 6);

    // Section title
    this.add.text(panelX + 16, panelY + 20, 'Commands', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#9b9a97',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Menu buttons - Notion style list items
    const menuItems = [
      { text: 'Sortie', desc: 'Deploy fleet for combat', scene: 'BattleScene', icon: '\u2694' },
      { text: 'Special Gacha', desc: 'Win special gifts!', scene: 'PremiumGachaScene', icon: '\u2764', highlight: true },
      { text: 'Organize', desc: 'Manage fleet composition', scene: 'FleetScene', icon: '\u2693' },
      { text: 'Repair Dock', desc: 'Repair damaged ships', scene: 'DockScene', icon: '\u{1F527}' },
      { text: 'Collection', desc: 'View ship collection', scene: 'CollectionScene', icon: '\u{1F6A2}' },
      { text: 'Construction', desc: 'Build new ships', scene: 'GachaScene', icon: '\u2699' },
      { text: 'Gift Collection', desc: 'View obtained gifts', scene: 'GiftCollectionScene', icon: '\u{1F381}' },
    ];

    const btnStartY = panelY + 48;
    const btnHeight = 52;

    menuItems.forEach((item, index) => {
      this.createMenuButton(
        panelX + 8,
        btnStartY + index * btnHeight,
        panelW - 16,
        btnHeight - 4,
        item
      );
    });

    // Secret code button
    this.createSecretCodeButton(panelX + panelW / 2, panelY + panelH - 35);
  }

  createMenuButton(x, y, w, h, item) {
    const container = this.add.container(x, y);

    // Notion-style list item (no visible background by default)
    const bg = this.add.graphics();
    const isHighlight = item.highlight;

    // Icon
    const icon = this.add.text(12, h / 2, item.icon, {
      fontSize: '20px',
      fill: isHighlight ? '#e03e3e' : '#787774',
    }).setOrigin(0, 0.5);

    // Text
    const mainText = this.add.text(44, h / 2 - 8, item.text, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: isHighlight ? '#e03e3e' : '#37352f',
    }).setOrigin(0, 0.5);

    const descText = this.add.text(44, h / 2 + 10, item.desc, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#9b9a97',
    }).setOrigin(0, 0.5);

    // Arrow
    const arrow = this.add.text(w - 16, h / 2, '\u203a', {
      fontSize: '20px',
      fill: '#9b9a97',
    }).setOrigin(0.5);

    container.add([bg, icon, mainText, descText, arrow]);

    // Hit area
    const hitArea = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0).setInteractive();

    if (item.scene) {
      hitArea.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(COLORS.bgHover, 1);
        bg.fillRoundedRect(0, 0, w, h, 4);
      });

      hitArea.on('pointerout', () => {
        bg.clear();
      });

      hitArea.on('pointerdown', () => {
        this.scene.start(item.scene);
      });
    }
  }

  createSecretCodeButton(x, y) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();

    const text = this.add.text(0, 0, '\u2728 Enter Secret Code', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: '#cb912f',
    }).setOrigin(0.5);

    container.add([bg, text]);

    const hitArea = this.add.rectangle(x, y, 160, 30, 0x000000, 0).setInteractive();

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.bgHover, 1);
      bg.fillRoundedRect(-80, -15, 160, 30, 4);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
    });

    hitArea.on('pointerdown', () => {
      this.scene.start('SecretCodeScene');
    });
  }

  createBottomBar() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();
    const saveData = Storage.load();

    // Notion-style bottom bar
    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRect(0, height - 48, width, 48);

    // Top border
    g.fillStyle(COLORS.border, 1);
    g.fillRect(0, height - 48, width, 1);

    // Ship count
    const shipCount = Storage.getOwnedShipCount();
    this.add.text(24, height - 24, `${shipCount} ships`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: '#9b9a97',
    }).setOrigin(0, 0.5);

    // Fleet status
    const fleet = saveData.fleet.filter(id => id !== null).length;
    this.add.text(120, height - 24, `Fleet: ${fleet}/6`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: '#9b9a97',
    }).setOrigin(0, 0.5);

    // Version/branding (right side)
    this.add.text(width - 24, height - 24, 'v1.0', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#9b9a97',
    }).setOrigin(1, 0.5);
  }
}
