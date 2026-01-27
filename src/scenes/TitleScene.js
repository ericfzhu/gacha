// Title scene - main menu (KanColle-style naval base interface)

import Phaser from 'phaser';
import { Storage } from '../systems/storage.js';
import { getShipById, RARITY } from '../data/ships.js';
import { AudioManager, BGM } from '../systems/audio.js';
import { addButtonFeedback } from '../systems/ui.js';
import { getTerm, getDisplayName, getSecretaryMessages, isPokemonMode } from '../data/theme.js';

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

    // Set audio scene and play port BGM
    AudioManager.setScene(this);
    AudioManager.playBgm(BGM.PORT);

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
    this.add.text(24, 28, getTerm('gameTitle'), {
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
    this.add.text(panelX + 16, panelY + 20, getTerm('secretaryShip'), {
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
      const noSecretaryMsg = isPokemonMode()
        ? 'No Partner Pokemon\n\nAssign a Pokemon to Team Slot #1'
        : 'No Secretary Ship\n\nAssign a ship to Fleet Slot #1';
      this.add.text(panelX + panelW / 2, panelY + panelH / 2, noSecretaryMsg, {
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

    // Create container for secretary display
    const container = this.add.container(centerX, centerY);

    const boatY = panelH * 0.15; // Boat position

    // In Pokemon mode, draw back layer of boat (behind Pokemon)
    if (isPokemonMode()) {
      // Water background - fills bottom half
      const water = this.add.graphics();
      water.fillStyle(0x4a90d9, 0.2);
      water.fillRect(-panelW / 2, boatY + 20, panelW, panelH);

      // Water waves
      water.fillStyle(0x6ab0e8, 0.3);
      water.fillEllipse(0, boatY + 120, 280, 40);
      water.fillStyle(0x4a90d9, 0.25);
      water.fillEllipse(0, boatY + 150, 320, 35);
      container.add(water);

      // Boat back layer - hull interior and flag (behind Pokemon)
      const boatBack = this.add.graphics();

      // Hull bottom (visible behind Pokemon)
      boatBack.fillStyle(0x654321, 1);
      boatBack.beginPath();
      boatBack.moveTo(-210, boatY + 90);
      boatBack.lineTo(-150, boatY + 135);
      boatBack.lineTo(150, boatY + 135);
      boatBack.lineTo(210, boatY + 90);
      boatBack.closePath();
      boatBack.fill();

      // Cute flag on a small mast (on the right side) - behind Pokemon
      boatBack.fillStyle(0x8B4513, 1);
      boatBack.fillRect(120, boatY - 150, 12, 162);

      // Flag (triangle)
      boatBack.fillStyle(0xe03e3e, 1);
      boatBack.beginPath();
      boatBack.moveTo(132, boatY - 135);
      boatBack.lineTo(225, boatY - 90);
      boatBack.lineTo(132, boatY - 45);
      boatBack.closePath();
      boatBack.fill();

      container.add(boatBack);

      // Animate water waves
      this.tweens.add({
        targets: water,
        alpha: 0.9,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Ship/Pokemon portrait (middle layer)
    const portraitKey = `ship_portrait_${shipData.id}`;
    let portrait = null;
    let scale = 1;
    if (this.textures.exists(portraitKey)) {
      // Position Pokemon to sit IN the boat in Pokemon mode
      const portraitY = isPokemonMode() ? boatY - 40 : 0;
      portrait = this.add.image(0, portraitY, portraitKey);
      // Scale to fit - smaller in Pokemon mode to fit in boat
      const maxW = isPokemonMode() ? panelW * 0.5 : panelW - 32;
      const maxH = isPokemonMode() ? panelH * 0.4 : panelH - 32;
      scale = Math.min(maxW / portrait.width, maxH / portrait.height);
      portrait.setScale(scale);
      container.add(portrait);

      // Idle breathing animation - subtle scale oscillation
      this.tweens.add({
        targets: portrait,
        scaleX: scale * 1.01,
        scaleY: scale * 1.01,
        duration: 2500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Subtle floating/bobbing animation
      const baseY = portrait.y;
      this.tweens.add({
        targets: portrait,
        y: baseY - (isPokemonMode() ? 5 : 3),
        duration: isPokemonMode() ? 2000 : 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // In Pokemon mode, draw front layer of boat (in front of Pokemon)
    if (isPokemonMode()) {
      const boatFront = this.add.graphics();

      // Main hull - warm wood color (front, overlaps Pokemon's lower body)
      boatFront.fillStyle(0x8B4513, 1);
      boatFront.beginPath();
      boatFront.moveTo(-180, boatY);
      boatFront.lineTo(-210, boatY + 90);
      boatFront.lineTo(210, boatY + 90);
      boatFront.lineTo(180, boatY);
      boatFront.closePath();
      boatFront.fill();

      // Hull highlight stripe
      boatFront.fillStyle(0xA0522D, 1);
      boatFront.fillRect(-165, boatY + 15, 330, 24);

      // Boat rim (top edge) - in front of Pokemon
      boatFront.fillStyle(0xDEB887, 1);
      boatFront.fillRect(-186, boatY - 12, 372, 18);

      container.add(boatFront);
    }

    // Make container interactive
    const hitArea = this.add.rectangle(centerX, centerY, panelW, panelH, 0x000000, 0).setInteractive();

    // Touch/click reaction
    hitArea.on('pointerdown', () => {
      // Quick scale bounce on container
      this.tweens.add({
        targets: container,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 100,
        yoyo: true,
        ease: 'Quad.easeOut',
      });

      // Show a random message
      this.showSecretaryMessage(centerX, panelY + panelH - 60, shipData);
    });
  }

  showSecretaryMessage(x, y, shipData) {
    // Remove existing message if any
    if (this.secretaryMessage) {
      this.secretaryMessage.destroy();
    }

    // Get themed messages based on current mode
    const messages = getSecretaryMessages(shipData.id, shipData.name);
    const message = messages[Math.floor(Math.random() * messages.length)];

    // Create speech bubble
    const container = this.add.container(x, y);

    const text = this.add.text(0, 0, message, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: '#37352f',
    }).setOrigin(0.5);

    const padding = 12;
    const bubbleWidth = text.width + padding * 2;
    const bubbleHeight = text.height + padding;

    const bubble = this.add.graphics();
    bubble.fillStyle(0xffffff, 0.95);
    bubble.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 8);
    bubble.lineStyle(1, 0xe9e9e7, 1);
    bubble.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 8);

    // Speech bubble tail
    bubble.fillStyle(0xffffff, 0.95);
    bubble.fillTriangle(0, bubbleHeight / 2, -8, bubbleHeight / 2 + 10, 8, bubbleHeight / 2);

    container.add([bubble, text]);

    // Animate in
    container.setAlpha(0);
    container.setScale(0.8);
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Fade out after delay
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: container,
        alpha: 0,
        y: y - 20,
        duration: 300,
        onComplete: () => container.destroy(),
      });
    });

    this.secretaryMessage = container;
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

    // Menu buttons - Notion style list items (themed based on mode)
    const menuItems = [
      { text: getTerm('sortie'), desc: getTerm('sortieDesc'), scene: 'BattleScene', icon: '\u2694' },
      { text: 'Special Gacha', desc: 'Win special gifts!', scene: 'PremiumGachaScene', icon: '\u2764', highlight: true },
      { text: getTerm('organize'), desc: getTerm('organizeDesc'), scene: 'FleetScene', icon: '\u2693' },
      { text: getTerm('repair'), desc: getTerm('repairDesc'), scene: 'DockScene', icon: '\u{1F527}' },
      { text: getTerm('collection'), desc: getTerm('collectionDesc'), scene: 'CollectionScene', icon: '\u{1F6A2}' },
      { text: getTerm('construction'), desc: getTerm('constructionDesc'), scene: 'GachaScene', icon: '\u2699' },
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
      // Add button press feedback
      addButtonFeedback(this, container);

      hitArea.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(COLORS.bgHover, 1);
        bg.fillRoundedRect(0, 0, w, h, 4);
      });

      hitArea.on('pointerout', () => {
        bg.clear();
      });

      hitArea.on('pointerdown', () => {
        // Scale the container down
        this.tweens.add({
          targets: container,
          scaleX: 0.98,
          scaleY: 0.98,
          duration: 50,
        });
      });

      hitArea.on('pointerup', () => {
        this.tweens.add({
          targets: container,
          scaleX: 1,
          scaleY: 1,
          duration: 100,
          ease: 'Back.easeOut',
          onComplete: () => this.scene.start(item.scene),
        });
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

    // Ship/Pokemon count
    const shipCount = Storage.getOwnedShipCount();
    this.add.text(24, height - 24, `${shipCount} ${getTerm('shipCount')}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: '#9b9a97',
    }).setOrigin(0, 0.5);

    // Fleet/Team status
    const fleet = saveData.fleet.filter(id => id !== null).length;
    this.add.text(120, height - 24, `${getTerm('fleet')}: ${fleet}/6`, {
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

    // Artwork mode indicator
    const artworkMode = Storage.getArtworkMode();
    const modeLabel = artworkMode === 'pokemon' ? 'Pokemon Mode' : 'Ship Girls Mode';
    this.add.text(width / 2, height - 24, `🎨 ${modeLabel}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '11px',
      fill: '#9b9a97',
    }).setOrigin(0.5, 0.5);
  }
}
