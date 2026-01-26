// Gift Collection scene - shows all Valentine's gift prizes (Notion style)

import Phaser from 'phaser';
import { GRAND_PRIZES } from '../systems/premiumGacha.js';
import { Storage } from '../systems/storage.js';

// Notion-inspired colors
const COLORS = {
  bgPrimary: 0xffffff,
  bgSecondary: 0xf7f6f3,
  bgHover: 0xe9e9e7,
  textPrimary: '#37352f',
  textSecondary: '#787774',
  textTertiary: '#9b9a97',
  border: 0xe9e9e7,
  success: '#4dab9a',
  valentine: '#e03e3e',
  valentineLight: '#ffb6c1',
};

export class GiftCollectionScene extends Phaser.Scene {
  constructor() {
    super('GiftCollectionScene');
  }

  create() {
    // Use actual window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

    this.createBackground();
    this.createHeader();
    this.createGiftCards();
    this.createFooter();
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
    g.fillRect(0, 0, width, 90);
    g.fillStyle(COLORS.border, 1);
    g.fillRect(0, 89, width, 1);

    this.add.text(width / 2, 32, "🎁 Valentine's Gift Collection", {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '24px',
      fill: COLORS.valentine,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const obtained = Storage.getObtainedGrandPrizeCount();
    const total = 3;

    this.add.text(width / 2, 62, `Gifts Obtained: ${obtained} / ${total}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '15px',
      fill: obtained === total ? COLORS.success : COLORS.textSecondary,
    }).setOrigin(0.5);

    const backBtn = this.add.text(24, 45, '← Back', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: COLORS.textSecondary,
    }).setOrigin(0, 0.5).setInteractive();

    backBtn.on('pointerover', () => backBtn.setStyle({ fill: COLORS.textPrimary }));
    backBtn.on('pointerout', () => backBtn.setStyle({ fill: COLORS.textSecondary }));
    backBtn.on('pointerdown', () => this.scene.start('TitleScene'));
  }

  createGiftCards() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const prizes = Object.values(GRAND_PRIZES);
    const cardWidth = 330;
    const startX = (width - (cardWidth * 3 + 30 * 2)) / 2 + cardWidth / 2;

    prizes.forEach((prize, i) => {
      const x = startX + i * (cardWidth + 30);
      const y = height / 2;
      this.createGiftCard(x, y, prize, i);
    });
  }

  createGiftCard(x, y, prize, index) {
    const obtained = Storage.hasGrandPrize(prize.key);
    const container = this.add.container(x, y);

    const cardWidth = 300;
    const cardHeight = 380;

    const bg = this.add.graphics();

    if (obtained) {
      bg.fillStyle(COLORS.bgPrimary, 1);
      bg.lineStyle(2, prize.color, 1);
    } else {
      bg.fillStyle(0xf1f1ef, 1);
      bg.lineStyle(1, COLORS.border, 1);
    }

    bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);
    bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);

    container.add(bg);

    if (obtained) {
      // Top accent bar
      const accent = this.add.graphics();
      accent.fillStyle(prize.color, 1);
      accent.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, 70,
        { tl: 12, tr: 12, bl: 0, br: 0 });
      container.add(accent);

      // Gift icon
      const icon = this.add.text(0, -110, '🎁', {
        fontSize: '64px',
      }).setOrigin(0.5);
      container.add(icon);

      // Prize name
      const name = this.add.text(0, -25, prize.name, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '20px',
        fill: COLORS.textPrimary,
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: cardWidth - 40 },
      }).setOrigin(0.5);
      container.add(name);

      // Description
      const desc = this.add.text(0, 40, prize.description, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '13px',
        fill: COLORS.textSecondary,
        align: 'center',
        wordWrap: { width: cardWidth - 40 },
      }).setOrigin(0.5);
      container.add(desc);

      // Obtained badge
      const badge = this.add.text(0, 110, '✓ Obtained', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '15px',
        fill: COLORS.success,
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(badge);

      // Drop rate
      const rate = this.add.text(0, 145, `Drop rate was: ${prize.rate}%`, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '11px',
        fill: COLORS.textTertiary,
      }).setOrigin(0.5);
      container.add(rate);

      // Sparkle effect
      this.time.addEvent({
        delay: 2500 + Math.random() * 1000,
        repeat: -1,
        callback: () => {
          if (!this.scene.isActive()) return;
          const sparkle = this.add.text(
            x + Phaser.Math.Between(-80, 80),
            y + Phaser.Math.Between(-130, 130),
            '✨',
            { fontSize: '14px' }
          ).setOrigin(0.5).setAlpha(0);

          this.tweens.add({
            targets: sparkle,
            alpha: 1,
            y: sparkle.y - 25,
            duration: 350,
            yoyo: true,
            onComplete: () => sparkle.destroy(),
          });
        },
      });
    } else {
      // Mystery silhouette
      const mystery = this.add.text(0, -40, '?', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '100px',
        fill: '#d1d1cf',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(mystery);

      const locked = this.add.text(0, 70, 'Not Yet Obtained', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '14px',
        fill: COLORS.textTertiary,
      }).setOrigin(0.5);
      container.add(locked);

      const hint = this.add.text(0, 110, `Drop rate: ${prize.rate}%\nExchange: ${prize.tokenCost} tokens`, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '11px',
        fill: COLORS.textTertiary,
        align: 'center',
      }).setOrigin(0.5);
      container.add(hint);
    }

    // Entry animation
    container.setAlpha(0);
    container.setScale(0.85);
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 450,
      delay: index * 150,
      ease: 'Back.easeOut',
    });
  }

  createFooter() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const obtained = Storage.getObtainedGrandPrizeCount();

    if (obtained >= 3) {
      const congrats = this.add.text(width / 2, height - 50,
        "❤ Congratulations! You've collected all Valentine's gifts! ❤", {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '18px',
        fill: COLORS.valentine,
        fontStyle: 'bold',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: congrats,
        scale: 1.03,
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.add.text(width / 2, height - 50,
        "Keep playing to collect all your Valentine's gifts!", {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '14px',
        fill: COLORS.textTertiary,
      }).setOrigin(0.5);
    }
  }
}
