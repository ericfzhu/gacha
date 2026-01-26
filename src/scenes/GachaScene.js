// Gacha/Construction scene (KanColle style)

import Phaser from 'phaser';
import { Gacha } from '../systems/gacha.js';
import { Storage } from '../systems/storage.js';
import { RARITY } from '../data/ships.js';

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
  warning: 0xcb912f,
};

export class GachaScene extends Phaser.Scene {
  constructor() {
    super('GachaScene');
  }

  create() {
    // Use actual window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

    this.createBackground();
    this.createHeader();
    this.createConstructionPanel();
    this.createResultPanel();
    this.createBottomBar();

    // Rate popup overlay (hidden by default)
    this.ratePopup = null;
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

    this.add.text(width / 2, 28, 'Construction', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '20px',
      fill: '#37352f',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Resources
    this.add.text(width - 100, 28, '\u26fd', {
      fontSize: '14px',
      fill: '#4dab9a',
    }).setOrigin(0, 0.5);

    this.currencyText = this.add.text(width - 78, 28, Storage.get('currency').toLocaleString(), {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: '#37352f',
    }).setOrigin(0, 0.5);
  }

  createConstructionPanel() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const panelWidth = Math.min(420, Math.max(320, width * 0.35));
    const panelCenterX = 24 + panelWidth / 2;
    this.leftPanelWidth = panelWidth;

    const g = this.add.graphics();

    // Main panel - Notion card style
    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(24, 72, panelWidth, height - 130, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(24, 72, panelWidth, height - 130, 6);

    // Section title
    this.add.text(40, 92, 'Construction Dock', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#9b9a97',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Construction status
    this.constructionText = this.add.text(panelCenterX, 160, 'Ready', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '24px',
      fill: '#4dab9a',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Pity counter
    const pity = Gacha.getPity();
    const threshold = Gacha.getPityThreshold();
    this.pityText = this.add.text(panelCenterX, 200, `Counter: ${pity}/${threshold}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: '#9b9a97',
    }).setOrigin(0.5);

    // Construction buttons
    this.createConstructButton(panelCenterX, 270, 'Construct ×1', Gacha.getPullCost(), () => this.doPull(1));
    this.createConstructButton(panelCenterX, 340, 'Construct ×10', Gacha.getPullCost() * 10, () => this.doPull(10));

    // View Rates button
    const ratesBtn = this.add.text(panelCenterX, 410, '📊 View Drop Rates', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: '#2eaadc',
    }).setOrigin(0.5).setInteractive();

    ratesBtn.on('pointerover', () => ratesBtn.setStyle({ fill: '#0b76b7' }));
    ratesBtn.on('pointerout', () => ratesBtn.setStyle({ fill: '#2eaadc' }));
    ratesBtn.on('pointerdown', () => this.showRatePopup());

    // Resource requirements note
    this.add.text(panelCenterX, 450, 'Fuel will be consumed', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#9b9a97',
    }).setOrigin(0.5);

    // Store for result panel positioning
    this.leftPanelWidth = panelWidth;
  }

  createConstructButton(x, y, text, cost, callback) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();

    const hitArea = this.add.rectangle(0, 0, 320, 50, 0x000000, 0).setInteractive();

    const btnText = this.add.text(-140, 0, text, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '15px',
      fill: '#37352f',
    }).setOrigin(0, 0.5);

    const costText = this.add.text(100, 0, cost.toLocaleString(), {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: '#4dab9a',
    }).setOrigin(1, 0.5);

    // Fuel icon
    const fuelIcon = this.add.text(108, 0, '\u26fd', {
      fontSize: '14px',
      fill: '#4dab9a',
    }).setOrigin(0, 0.5);

    container.add([bg, hitArea, btnText, costText, fuelIcon]);

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.bgHover, 1);
      bg.fillRoundedRect(-160, -25, 320, 50, 4);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
    });

    hitArea.on('pointerdown', callback);
  }

  createResultPanel() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const leftPanelWidth = this.leftPanelWidth || 380;
    const panelX = 24 + leftPanelWidth + 16;
    const panelWidth = width - panelX - 24;
    const panelCenterX = panelX + panelWidth / 2;
    const panelCenterY = 72 + (height - 130) / 2;

    const g = this.add.graphics();
    // Notion card style
    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(panelX, 72, panelWidth, height - 130, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(panelX, 72, panelWidth, height - 130, 6);

    // Section title
    this.add.text(panelX + 16, 92, 'Results', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#9b9a97',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Create result container centered in the panel
    this.resultPanel = this.add.container(panelCenterX, panelCenterY);
    this.resultContainer = this.add.container(0, 0);

    this.placeholderText = this.add.text(0, 0, 'Awaiting construction...', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: '#9b9a97',
    }).setOrigin(0.5);

    this.resultPanel.add([this.resultContainer, this.placeholderText]);

    // Store panel dimensions for result layout
    this.resultPanelWidth = panelWidth;
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

    // Rate info
    this.add.text(24, height - 24, 'Rates: N 60% • R 30% • SR 8% • SSR 2%', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#9b9a97',
    }).setOrigin(0, 0.5);

    this.add.text(width - 24, height - 24, 'Guaranteed SR+ at 90 pulls', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#9b9a97',
    }).setOrigin(1, 0.5);
  }

  doPull(count) {
    this.resultContainer.removeAll(true);
    if (this.placeholderText) {
      this.placeholderText.setVisible(false);
    }

    let results;
    if (count === 1) {
      const result = Gacha.pull();
      results = result ? [result] : [];
    } else {
      results = Gacha.pull10();
    }

    if (results.length === 0) {
      this.showMessage('Insufficient resources!');
      return;
    }

    // Update displays
    this.currencyText.setText(Storage.get('currency').toLocaleString());
    this.pityText.setText(`Counter: ${Gacha.getPity()}/${Gacha.getPityThreshold()}`);

    // Construction animation
    this.constructionText.setText('Building...');
    this.constructionText.setStyle({ fill: '#cb912f' });

    this.time.delayedCall(1000, () => {
      this.constructionText.setText('Complete!');
      this.constructionText.setStyle({ fill: '#4dab9a' });
      this.showResults(results);
    });
  }

  showResults(results) {
    const isSingle = results.length === 1;
    const panelWidth = this.resultPanelWidth || 600;

    // Calculate grid layout based on panel width
    const cardWidth = isSingle ? 150 : 110;
    const cardSpacing = 10;
    const cols = isSingle ? 1 : Math.min(5, Math.floor(panelWidth / (cardWidth + cardSpacing)));

    results.forEach((result, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      const totalRowWidth = cols * cardWidth + (cols - 1) * cardSpacing;
      const startX = -totalRowWidth / 2 + cardWidth / 2;

      const x = isSingle ? 0 : startX + col * (cardWidth + cardSpacing);
      const y = isSingle ? 0 : row * 140 - 70;

      this.time.delayedCall(index * 100, () => {
        this.showShipCard(result, x, y, isSingle);
      });
    });

    // SSR celebration
    const hasSSR = results.some(r => r.ship.rarity === 'SSR');
    if (hasSSR) {
      this.cameras.main.shake(200, 0.005);
      this.cameras.main.flash(200, 255, 200, 100, false);
    }
  }

  showShipCard(result, x, y, isSingle) {
    const ship = result.ship;
    const rarity = RARITY[ship.rarity];
    const scale = isSingle ? 1.5 : 1;

    const container = this.add.container(x, y);

    // Card background - KanColle white style
    const cardWidth = 100 * scale;
    const cardHeight = 150 * scale;
    const card = this.add.graphics();
    card.fillStyle(0xffffff, 1);
    card.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 4);
    card.fillStyle(rarity.color, 1);
    card.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, 4);
    card.lineStyle(2, rarity.color, 0.8);
    card.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 4);

    // Ship portrait image
    const portraitKey = `ship_portrait_${ship.id}`;
    if (this.textures.exists(portraitKey)) {
      const portrait = this.add.image(0, -20 * scale, portraitKey);
      // Scale portrait to fit card width with some padding
      const maxPortraitWidth = cardWidth - 10;
      const maxPortraitHeight = 80 * scale;
      const scaleX = maxPortraitWidth / portrait.width;
      const scaleY = maxPortraitHeight / portrait.height;
      const portraitScale = Math.min(scaleX, scaleY);
      portrait.setScale(portraitScale);
      container.add(portrait);
    }

    // Ship name
    const nameText = this.add.text(0, 35 * scale, ship.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${isSingle ? 14 : 11}px`,
      fill: '#1a1a2e',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Stars
    let stars = '';
    for (let i = 0; i < rarity.stars; i++) stars += '\u2605';
    const starsText = this.add.text(0, 52 * scale, stars, {
      fontSize: `${10 * scale}px`,
      fill: `#${rarity.color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    // Rarity name
    const rarityText = this.add.text(0, 65 * scale, rarity.name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${isSingle ? 11 : 9}px`,
      fill: `#${rarity.color.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    container.add([card, nameText, starsText, rarityText]);

    // NEW badge or XP badge for duplicates
    if (result.isNew) {
      const newBadge = this.add.text(40 * scale, -55 * scale, 'NEW', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${isSingle ? 12 : 9}px`,
        fill: '#ffffff',
        backgroundColor: '#f44336',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5);
      container.add(newBadge);
    } else if (result.xpGained > 0) {
      // Show XP gained for duplicate
      const xpBadge = this.add.text(40 * scale, -55 * scale, `+${result.xpGained} XP`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${isSingle ? 11 : 8}px`,
        fill: '#ffffff',
        backgroundColor: '#4dab9a',
        padding: { x: 4, y: 2 },
      }).setOrigin(0.5);
      container.add(xpBadge);

      // Show level up if applicable
      if (result.levelUp && result.levelUp.leveledUp) {
        const lvlUpText = this.add.text(0, 58 * scale, `LV UP! → ${result.levelUp.newLevel}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${isSingle ? 11 : 8}px`,
          fill: '#ffaa00',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        container.add(lvlUpText);
      }
    }

    this.resultContainer.add(container);

    // Entry animation
    container.setAlpha(0);
    container.setScale(0.8);
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 250,
      ease: 'Back.easeOut',
    });
  }

  showMessage(text) {
    const width = window.innerWidth;
    const msg = this.add.text(width / 2, 550, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fill: '#ffffff',
      backgroundColor: '#f44336',
      padding: { x: 15, y: 8 },
    }).setOrigin(0.5);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      duration: 2000,
      delay: 1000,
      onComplete: () => msg.destroy(),
    });
  }

  showRatePopup() {
    if (this.ratePopup) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Create popup container
    this.ratePopup = this.add.container(width / 2, height / 2);

    // Overlay - add FIRST so it's behind everything
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setInteractive();
    overlay.on('pointerdown', () => this.closeRatePopup());
    this.ratePopup.add(overlay);

    // Popup background - add SECOND so it's behind text but above overlay
    const popupWidth = 380;
    const popupHeight = 420;
    const leftX = -popupWidth / 2 + 24;
    const rightX = popupWidth / 2 - 24;

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 8);
    bg.lineStyle(1, 0xe9e9e7, 1);
    bg.strokeRoundedRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 8);
    this.ratePopup.add(bg);

    // Title
    this.ratePopup.add(this.add.text(0, -popupHeight / 2 + 28, 'Drop Rate Breakdown', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '16px',
      fill: '#37352f',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    // Rate info
    const rates = [
      { rarity: 'SSR (Ultra Rare)', rate: '2%', color: '#ffaa00', stars: '★★★★' },
      { rarity: 'SR (Super Rare)', rate: '8%', color: '#aa44ff', stars: '★★★' },
      { rarity: 'R (Rare)', rate: '30%', color: '#44aaff', stars: '★★' },
      { rarity: 'N (Normal)', rate: '60%', color: '#888888', stars: '★' },
    ];

    rates.forEach((item, i) => {
      const y = -130 + i * 38;

      // Stars + Rarity name (left-aligned)
      this.ratePopup.add(this.add.text(leftX, y, `${item.stars}  ${item.rarity}`, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '13px',
        fill: item.color,
      }).setOrigin(0, 0.5));

      // Rate (right-aligned)
      this.ratePopup.add(this.add.text(rightX, y, item.rate, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '13px',
        fill: '#37352f',
        fontStyle: 'bold',
      }).setOrigin(1, 0.5));
    });

    // Pity info
    this.ratePopup.add(this.add.text(leftX, 40, 'Pity System', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: '#37352f',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5));

    this.ratePopup.add(this.add.text(leftX, 62, '• Guaranteed SSR at 90 pulls without SSR', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '11px',
      fill: '#787774',
    }).setOrigin(0, 0.5));

    this.ratePopup.add(this.add.text(leftX, 82, '• 10-pull guarantees at least one R+', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '11px',
      fill: '#787774',
    }).setOrigin(0, 0.5));

    // Duplicate info
    this.ratePopup.add(this.add.text(leftX, 115, 'Duplicate Ships', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: '#37352f',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5));

    this.ratePopup.add(this.add.text(leftX, 137, '• N: +50 XP   • R: +100 XP', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '11px',
      fill: '#4dab9a',
    }).setOrigin(0, 0.5));

    this.ratePopup.add(this.add.text(leftX, 157, '• SR: +200 XP   • SSR: +500 XP', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '11px',
      fill: '#4dab9a',
    }).setOrigin(0, 0.5));

    // Close button
    const closeBtn = this.add.text(0, popupHeight / 2 - 28, '[ Close ]', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: '#2eaadc',
    }).setOrigin(0.5).setInteractive();

    closeBtn.on('pointerover', () => closeBtn.setStyle({ fill: '#0b76b7' }));
    closeBtn.on('pointerout', () => closeBtn.setStyle({ fill: '#2eaadc' }));
    closeBtn.on('pointerdown', () => this.closeRatePopup());
    this.ratePopup.add(closeBtn);
  }

  closeRatePopup() {
    if (this.ratePopup) {
      this.ratePopup.destroy();
      this.ratePopup = null;
    }
  }
}
