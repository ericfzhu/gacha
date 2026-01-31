// Premium Gacha scene for Special gift selection (Notion style)

import Phaser from 'phaser';
import { PremiumGacha, GRAND_PRIZES, CONSOLATION_PRIZES } from '../systems/premiumGacha.js';
import { Storage } from '../systems/storage.js';
import { AudioManager, BGM } from '../systems/audio.js';

// Notion-inspired colors with Special accents
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
  danger: '#e03e3e',
  special: '#e03e3e',
  specialLight: '#ffb6c1',
};

export class PremiumGachaScene extends Phaser.Scene {
  constructor() {
    super('PremiumGachaScene');
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
    this.createHeader();
    this.createGachaPanel();
    this.createGrandPrizeDisplay();
    this.createBottomBar();

    this.pendingReveal = null;
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

    this.add.text(width / 2, 28, "Special Gacha", {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '20px',
      fill: COLORS.special,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Ticket display
    this.add.text(width - 100, 28, '🎫', {
      fontSize: '14px',
      fill: COLORS.warning,
    }).setOrigin(0, 0.5);

    this.ticketText = this.add.text(width - 78, 28, `${Storage.getTickets()}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: COLORS.textPrimary,
    }).setOrigin(0, 0.5);
  }

  createGachaPanel() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Left panel - responsive width (about 35% of screen, min 320, max 420)
    const panelWidth = Math.min(420, Math.max(320, width * 0.35));
    const panelX = 24;
    const panelCenterX = panelX + panelWidth / 2;

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(panelX, 72, panelWidth, height - 130, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(panelX, 72, panelWidth, height - 130, 6);

    this.add.text(panelX + 16, 92, 'Special Gift Gacha', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Heart decoration
    this.add.text(panelCenterX, 130, '❤', {
      fontSize: '48px',
      fill: COLORS.special,
    }).setOrigin(0.5);

    // Status text
    this.statusText = this.add.text(panelCenterX, 190, "Pull for Special Gifts!", {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '15px',
      fill: COLORS.special,
    }).setOrigin(0.5);

    // Token counter
    this.tokenText = this.add.text(panelCenterX, 220, `Pity Tokens: ${Storage.getPityTokens()}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
    }).setOrigin(0.5);

    // Pull buttons
    this.createPullButton(panelCenterX, 280, 'Pull ×1', 1, () => this.doPull(1));
    this.createPullButton(panelCenterX, 340, 'Pull ×10', 10, () => this.doPull(10));

    // Exchange shop button
    this.createExchangeButton(panelCenterX, 410, 'Token Exchange Shop →', () => this.showExchangeShop());

    // View Rates button
    const ratesBtn = this.add.text(panelCenterX, 480, '📊 View Drop Rates', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: COLORS.accent,
    }).setOrigin(0.5).setInteractive();

    ratesBtn.on('pointerover', () => ratesBtn.setStyle({ fill: '#0b76b7' }));
    ratesBtn.on('pointerout', () => ratesBtn.setStyle({ fill: COLORS.accent }));
    ratesBtn.on('pointerdown', () => this.showRatePopup());

    // Info text
    this.add.text(panelCenterX, 520, "Win Special gifts or exchange tokens!", {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '11px',
      fill: COLORS.textTertiary,
    }).setOrigin(0.5);

    // Store panel width for use in prize display
    this.leftPanelWidth = panelWidth;

    // Rate popup (hidden by default)
    this.ratePopup = null;
  }

  createPullButton(x, y, text, cost, callback) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.bgSecondary, 1);
    bg.fillRoundedRect(-150, -25, 300, 50, 6);

    const hitArea = this.add.rectangle(0, 0, 300, 50, 0x000000, 0).setInteractive();

    const btnText = this.add.text(-120, 0, text, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '15px',
      fill: COLORS.textPrimary,
    }).setOrigin(0, 0.5);

    const costText = this.add.text(100, 0, `${cost}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: COLORS.warning,
    }).setOrigin(1, 0.5);

    const ticketIcon = this.add.text(108, 0, '🎫', {
      fontSize: '13px',
      fill: COLORS.warning,
    }).setOrigin(0, 0.5);

    container.add([bg, hitArea, btnText, costText, ticketIcon]);

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.bgHover, 1);
      bg.fillRoundedRect(-150, -25, 300, 50, 6);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.bgSecondary, 1);
      bg.fillRoundedRect(-150, -25, 300, 50, 6);
    });

    hitArea.on('pointerdown', callback);
  }

  createExchangeButton(x, y, text, callback) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();

    const hitArea = this.add.rectangle(0, 0, 300, 40, 0x000000, 0).setInteractive();

    const btnText = this.add.text(0, 0, text, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: COLORS.warning,
    }).setOrigin(0.5);

    container.add([bg, hitArea, btnText]);

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.bgHover, 1);
      bg.fillRoundedRect(-150, -20, 300, 40, 4);
      btnText.setStyle({ fill: COLORS.textPrimary });
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      btnText.setStyle({ fill: COLORS.warning });
    });

    hitArea.on('pointerdown', callback);
  }

  createGrandPrizeDisplay() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Right panel - positioned after left panel with gap
    const leftPanelWidth = this.leftPanelWidth || 380;
    const panelX = 24 + leftPanelWidth + 16;
    const panelWidth = width - panelX - 24;

    const g = this.add.graphics();
    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(panelX, 72, panelWidth, height - 130, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(panelX, 72, panelWidth, height - 130, 6);

    this.add.text(panelX + 16, 92, '🎁 Grand Prizes', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Grand prize cards - fixed size, result area gets remaining space
    const prizes = Object.values(GRAND_PRIZES);
    const cardHeight = 140;
    const cardSpacing = 12;
    const cardStartY = 120 + cardHeight / 2;

    prizes.forEach((prize, i) => {
      const y = cardStartY + i * (cardHeight + cardSpacing);
      this.createPrizeCard(panelX + panelWidth / 2, y, prize, panelWidth - 40, cardHeight);
    });

    // Calculate where prize cards end
    const lastCardBottomY = cardStartY + (prizes.length - 1) * (cardHeight + cardSpacing) + cardHeight / 2;

    // Result area - fills remaining space between cards and panel bottom
    const panelBottomY = 72 + (height - 130); // panel starts at 72, height is (height - 130)
    const resultAreaY = lastCardBottomY + 12; // 12px gap after cards
    const resultAreaHeight = panelBottomY - resultAreaY - 12; // 12px padding at bottom

    const resultBg = this.add.graphics();
    resultBg.fillStyle(COLORS.bgSecondary, 1);
    resultBg.fillRoundedRect(panelX + 20, resultAreaY, panelWidth - 40, resultAreaHeight, 6);

    this.add.text(panelX + panelWidth / 2, resultAreaY + 18, 'Last Pull Result', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.resultText = this.add.text(panelX + panelWidth / 2, resultAreaY + resultAreaHeight / 2 + 10, 'Pull to see results!', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: COLORS.textSecondary,
      align: 'center',
      wordWrap: { width: panelWidth - 60 },
      lineSpacing: 6,
    }).setOrigin(0.5);
  }

  createPrizeCard(x, y, prize, cardWidth, cardHeight = 110) {
    const container = this.add.container(x, y);
    const obtained = Storage.hasGrandPrize(prize.key);

    const bg = this.add.graphics();
    if (obtained) {
      bg.fillStyle(0xf0fdf4, 1);
      bg.lineStyle(2, 0x4dab9a, 1);
    } else {
      bg.fillStyle(COLORS.bgSecondary, 1);
    }
    bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 6);
    if (obtained) {
      bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 6);
    }

    // Color accent bar
    bg.fillStyle(prize.color, obtained ? 0.5 : 1);
    bg.fillRect(-cardWidth / 2, -cardHeight / 2, 6, cardHeight);

    // Scale text positions based on card height
    const topY = -cardHeight / 2 + 24;
    const bottomY = cardHeight / 2 - 24;

    // Description (centered, larger text)
    const descText = this.add.text(0, 0, prize.description, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '16px',
      fill: obtained ? COLORS.success : COLORS.textPrimary,
      fontStyle: 'bold',
      wordWrap: { width: cardWidth - 60 },
      align: 'center',
    }).setOrigin(0.5);

    // Rate and token cost
    const rateText = this.add.text(-cardWidth / 2 + 20, bottomY, `Drop Rate: ${prize.rate}%`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.special,
    }).setOrigin(0, 0.5);

    const costText = this.add.text(cardWidth / 2 - 20, bottomY, `Exchange: ${prize.tokenCost} tokens`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.warning,
    }).setOrigin(1, 0.5);

    // Status badge
    const statusText = obtained ? '✓ Obtained' : 'Available';
    const statusColor = obtained ? COLORS.success : COLORS.specialLight;
    const badge = this.add.text(cardWidth / 2 - 20, topY, statusText, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: statusColor,
      fontStyle: 'bold',
    }).setOrigin(1, 0.5);

    container.add([bg, descText, rateText, costText, badge]);
  }

  createBottomBar() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRect(0, height - 48, width, 48);
    g.fillStyle(COLORS.border, 1);
    g.fillRect(0, height - 48, width, 1);

    this.add.text(24, height - 24, 'Grand Prize rates: 2.0% • 0.5% • 0.2% | Consolation: 97.3%', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
    }).setOrigin(0, 0.5);

    this.add.text(width - 24, height - 24, 'Each Grand Prize can only be won ONCE!', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.special,
    }).setOrigin(1, 0.5);
  }

  doPull(count) {
    if ((count === 1 && !PremiumGacha.canPull()) ||
        (count === 10 && !PremiumGacha.canPull10())) {
      this.showMessage('Not enough tickets!');
      return;
    }

    this.statusText.setText('Pulling...');

    this.time.delayedCall(500, () => {
      let results;
      if (count === 1) {
        results = [PremiumGacha.pull()];
      } else {
        results = PremiumGacha.pull10();
      }

      this.updateDisplays();
      this.showResults(results);
    });
  }

  updateDisplays() {
    this.ticketText.setText(`${Storage.getTickets()}`);
    this.tokenText.setText(`Pity Tokens: ${Storage.getPityTokens()}`);
    this.statusText.setText("Pull for Special Gifts!");
  }

  showResults(results) {
    const grandPrizes = results.filter(r => r && r.type === 'grandPrize');
    const consolations = results.filter(r => r && r.type === 'consolation');

    let resultLines = [];

    if (grandPrizes.length > 0) {
      grandPrizes.forEach(r => {
        resultLines.push(`🎁 ${r.prize.name}! 🎁`);
      });
    }

    // Show consolation prizes (limit to 5 lines for readability)
    const consolationNames = consolations.map(r => r.consolation.name);
    if (consolationNames.length <= 5) {
      consolationNames.forEach(name => resultLines.push(name));
    } else {
      // Group duplicates
      const counts = {};
      consolationNames.forEach(name => counts[name] = (counts[name] || 0) + 1);
      Object.entries(counts).forEach(([name, count]) => {
        resultLines.push(count > 1 ? `${name} x${count}` : name);
      });
    }

    const tokensEarned = results.reduce((sum, r) => sum + (r?.tokensEarned || 0), 0);
    resultLines.push(`+${tokensEarned} tokens earned`);

    this.resultText.setText(resultLines.join('\n'));

    // If got grand prize, show reveal scene after a delay
    if (grandPrizes.length > 0) {
      this.time.delayedCall(1500, () => {
        this.scene.start('GiftRevealScene', { prize: grandPrizes[0].prize });
      });
    }
  }

  showExchangeShop() {
    this.scene.start('ExchangeShopScene');
  }

  showMessage(text) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const msg = this.add.text(width / 2, height - 100, text, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: '#ffffff',
      backgroundColor: COLORS.danger,
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      duration: 1500,
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

    // Popup background - add SECOND so it's behind text
    const popupWidth = 420;
    const popupHeight = 540;
    const leftX = -popupWidth / 2 + 24; // Left margin
    const rightX = popupWidth / 2 - 24; // Right margin

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 1);
    bg.fillRoundedRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 8);
    bg.lineStyle(1, 0xe9e9e7, 1);
    bg.strokeRoundedRect(-popupWidth / 2, -popupHeight / 2, popupWidth, popupHeight, 8);
    this.ratePopup.add(bg);

    // Title
    this.ratePopup.add(this.add.text(0, -popupHeight / 2 + 28, "Special Gacha Rates", {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '16px',
      fill: '#e03e3e',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    // Grand Prizes section
    this.ratePopup.add(this.add.text(leftX, -175, '🎁 Grand Prizes', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: '#37352f',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5));

    const grandPrizes = [
      { name: 'Gift Choice #1', rate: '2.0%', color: '#ff6b8a', tokens: '50' },
      { name: 'Gift Choice #2', rate: '0.5%', color: '#8b5cf6', tokens: '100' },
      { name: 'Gift Choice #3', rate: '0.2%', color: '#fbbf24', tokens: '150' },
    ];

    grandPrizes.forEach((item, i) => {
      const y = -140 + i * 32;
      // Name
      this.ratePopup.add(this.add.text(leftX, y, item.name, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '12px',
        fill: item.color,
      }).setOrigin(0, 0.5));

      // Rate (right-aligned)
      this.ratePopup.add(this.add.text(rightX, y, `${item.rate}  (${item.tokens} tokens)`, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '11px',
        fill: '#787774',
      }).setOrigin(1, 0.5));
    });

    // Consolation Prizes section
    this.ratePopup.add(this.add.text(leftX, -30, '📦 Consolation Prizes (97.3% total)', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: '#37352f',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5));

    const consolation = [
      { name: 'Ultra Rare Ship (SSR)', rate: '5.0%', tokens: '+3' },
      { name: 'Super Rare Ship (SR)', rate: '20.0%', tokens: '+2' },
      { name: 'Fuel Reserve (+500)', rate: '36.15%', tokens: '+1' },
      { name: 'Fuel Canister (+200)', rate: '36.15%', tokens: '+1' },
    ];

    consolation.forEach((item, i) => {
      const y = 5 + i * 28;
      // Name
      this.ratePopup.add(this.add.text(leftX, y, item.name, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '11px',
        fill: '#787774',
      }).setOrigin(0, 0.5));

      // Rate and tokens (right-aligned)
      this.ratePopup.add(this.add.text(rightX, y, `${item.rate}  (${item.tokens} token)`, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '11px',
        fill: '#9b9a97',
      }).setOrigin(1, 0.5));
    });

    // Notes section
    this.ratePopup.add(this.add.text(leftX, 135, 'Notes:', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#37352f',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5));

    const notes = [
      '• Each Grand Prize can only be won once',
      '• Won prizes redistribute to consolation pool',
      '• Exchange tokens for prizes in the shop',
      '• Grand Prizes award +5 bonus tokens',
    ];

    notes.forEach((note, i) => {
      this.ratePopup.add(this.add.text(leftX, 160 + i * 20, note, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '11px',
        fill: '#9b9a97',
      }).setOrigin(0, 0.5));
    });

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
