// Exchange Shop scene - redeem pity tokens for Grand Prizes (Notion style)

import Phaser from 'phaser';
import { PremiumGacha, GRAND_PRIZES } from '../systems/premiumGacha.js';
import { Storage } from '../systems/storage.js';
import { AudioManager, BGM } from '../systems/audio.js';

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

export class ExchangeShopScene extends Phaser.Scene {
  constructor() {
    super('ExchangeShopScene');
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
    this.createShopContent();
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
    g.fillRect(0, 0, width, 80);
    g.fillStyle(COLORS.border, 1);
    g.fillRect(0, 79, width, 1);

    const backBtn = this.add.text(24, 40, '← Back to Gacha', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: COLORS.textSecondary,
    }).setOrigin(0, 0.5).setInteractive();

    backBtn.on('pointerover', () => backBtn.setStyle({ fill: COLORS.textPrimary }));
    backBtn.on('pointerout', () => backBtn.setStyle({ fill: COLORS.textSecondary }));
    backBtn.on('pointerdown', () => this.scene.start('PremiumGachaScene'));

    this.add.text(width / 2, 28, '✨ Token Exchange Shop', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '22px',
      fill: COLORS.warning,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tokenText = this.add.text(width / 2, 55, `Your Tokens: ${Storage.getPityTokens()}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '15px',
      fill: COLORS.textSecondary,
    }).setOrigin(0.5);
  }

  createShopContent() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.add.text(width / 2, 115, "Exchange your pity tokens for guaranteed gifts!", {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: COLORS.textSecondary,
    }).setOrigin(0.5);

    this.add.text(width / 2, 138, 'Each pull gives +1 token (consolations give +2, grand prizes give +5)', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '11px',
      fill: COLORS.textTertiary,
    }).setOrigin(0.5);

    // Prize cards
    const exchangeInfo = PremiumGacha.getExchangeInfo();
    const startY = 185;

    exchangeInfo.forEach((info, i) => {
      this.createExchangeCard(width / 2, startY + i * 150, info);
    });
  }

  createExchangeCard(x, y, info) {
    const container = this.add.container(x, y);
    const tokens = Storage.getPityTokens();

    const cardWidth = 600;
    const cardHeight = 130;

    const bg = this.add.graphics();

    if (info.obtained) {
      bg.fillStyle(0xf0fdf4, 1);
      bg.lineStyle(2, 0x4dab9a, 1);
    } else if (info.canAfford) {
      bg.fillStyle(COLORS.bgPrimary, 1);
      bg.lineStyle(2, 0xcb912f, 1);
    } else {
      bg.fillStyle(COLORS.bgPrimary, 1);
      bg.lineStyle(1, COLORS.border, 1);
    }

    bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 8);
    bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 8);

    // Color accent
    bg.fillStyle(info.color, info.obtained ? 0.5 : 1);
    bg.fillRect(-cardWidth / 2, -cardHeight / 2 + 8, 6, cardHeight - 16);

    // Prize name and description
    const nameText = this.add.text(-cardWidth / 2 + 24, -35, info.name, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '18px',
      fill: info.obtained ? COLORS.success : COLORS.textPrimary,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const descText = this.add.text(-cardWidth / 2 + 24, -5, info.description, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '13px',
      fill: COLORS.textSecondary,
    }).setOrigin(0, 0.5);

    const rateText = this.add.text(-cardWidth / 2 + 24, 25, `Natural drop rate: ${info.rate}%`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '11px',
      fill: COLORS.textTertiary,
    }).setOrigin(0, 0.5);

    // Token cost and progress
    const progressText = info.obtained
      ? '✓ Obtained'
      : `${tokens} / ${info.tokenCost} tokens`;

    const progressColor = info.obtained ? COLORS.success : (info.canAfford ? COLORS.warning : COLORS.textTertiary);

    const progress = this.add.text(cardWidth / 2 - 140, -20, progressText, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: progressColor,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, nameText, descText, rateText, progress]);

    // Progress bar (if not obtained)
    if (!info.obtained) {
      const barWidth = 120;
      const barHeight = 8;
      const barX = cardWidth / 2 - 200;
      const barY = 12;
      const fillPercent = Math.min(1, tokens / info.tokenCost);

      const barBg = this.add.graphics();
      barBg.fillStyle(COLORS.border, 1);
      barBg.fillRoundedRect(barX, barY, barWidth, barHeight, 3);
      barBg.fillStyle(info.canAfford ? 0xcb912f : 0x9b9a97, 1);
      barBg.fillRoundedRect(barX, barY, barWidth * fillPercent, barHeight, 3);
      container.add(barBg);

      // Exchange button
      if (info.canAfford) {
        const btnBg = this.add.graphics();
        btnBg.fillStyle(0xcb912f, 1);
        btnBg.fillRoundedRect(cardWidth / 2 - 200, 30, 120, 32, 6);

        const btnText = this.add.text(cardWidth / 2 - 140, 46, 'Exchange', {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: '13px',
          fill: '#ffffff',
          fontStyle: 'bold',
        }).setOrigin(0.5);

        const hitArea = this.add.rectangle(cardWidth / 2 - 140, 46, 120, 32, 0x000000, 0)
          .setInteractive();

        hitArea.on('pointerover', () => {
          btnBg.clear();
          btnBg.fillStyle(0xdaa140, 1);
          btnBg.fillRoundedRect(cardWidth / 2 - 200, 30, 120, 32, 6);
        });

        hitArea.on('pointerout', () => {
          btnBg.clear();
          btnBg.fillStyle(0xcb912f, 1);
          btnBg.fillRoundedRect(cardWidth / 2 - 200, 30, 120, 32, 6);
        });

        hitArea.on('pointerdown', () => this.exchangePrize(info.key));

        container.add([btnBg, btnText, hitArea]);
      } else {
        const needText = this.add.text(cardWidth / 2 - 140, 46, `Need ${info.tokensNeeded} more`, {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: '12px',
          fill: COLORS.textTertiary,
        }).setOrigin(0.5);
        container.add(needText);
      }
    }
  }

  exchangePrize(prizeKey) {
    const result = PremiumGacha.exchangeForPrize(prizeKey);

    if (result.success) {
      this.scene.start('GiftRevealScene', { prize: result.prize });
    } else {
      this.showMessage(result.error);
    }
  }

  showMessage(text) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const msg = this.add.text(width / 2, height - 80, text, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: '#ffffff',
      backgroundColor: '#e03e3e',
      padding: { x: 15, y: 8 },
    }).setOrigin(0.5);

    this.tweens.add({
      targets: msg,
      alpha: 0,
      duration: 1500,
      onComplete: () => msg.destroy(),
    });
  }
}
