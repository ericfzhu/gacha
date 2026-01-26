// Gift Reveal scene - special special reveal animation (Notion style)

import Phaser from 'phaser';
import { GRAND_PRIZES } from '../systems/premiumGacha.js';
import { Storage } from '../systems/storage.js';
import { AudioManager, BGM } from '../systems/audio.js';

// Notion-inspired colors
const COLORS = {
  bgPrimary: 0xffffff,
  bgSecondary: 0xf7f6f3,
  textPrimary: '#37352f',
  textSecondary: '#787774',
  textTertiary: '#9b9a97',
  border: 0xe9e9e7,
  success: '#4dab9a',
  special: '#e03e3e',
  specialLight: '#ffb6c1',
};

export class GiftRevealScene extends Phaser.Scene {
  constructor() {
    super('GiftRevealScene');
  }

  init(data) {
    this.prize = data.prize || GRAND_PRIZES.prize1;
  }

  create() {
    // Use actual window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

    // Set audio scene and play the special gift/marriage music
    AudioManager.setScene(this);
    AudioManager.playBgm(BGM.GIFT);

    // Clean background with subtle overlay
    const bg = this.add.graphics();
    bg.fillStyle(0x37352f, 0.95);
    bg.fillRect(0, 0, width, height);

    this.particles = [];
    this.runRevealSequence();
  }

  async runRevealSequence() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    await this.delay(500);
    this.startHeartParticles();

    await this.delay(1000);
    const giftBox = await this.showGiftBox();

    await this.delay(1500);
    await this.shakeBox(giftBox);

    await this.delay(500);
    await this.revealPrize(giftBox);

    await this.delay(1000);
    this.showFinalMessage();
  }

  startHeartParticles() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 150, () => {
        const x = Phaser.Math.Between(50, width - 50);
        const heart = this.add.text(x, height + 20, '❤', {
          fontSize: `${Phaser.Math.Between(16, 28)}px`,
          fill: ['#e03e3e', '#ffb6c1', '#ff6b8a'][Phaser.Math.Between(0, 2)],
        }).setOrigin(0.5).setAlpha(0.6);

        this.tweens.add({
          targets: heart,
          y: -50,
          x: x + Phaser.Math.Between(-80, 80),
          alpha: 0,
          duration: Phaser.Math.Between(3000, 4500),
          onComplete: () => heart.destroy(),
        });

        this.particles.push(heart);
      });
    }
  }

  async showGiftBox() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const container = this.add.container(width / 2, height / 2 + 250);

    const boxSize = 140;
    const box = this.add.graphics();

    // Clean white gift box
    box.fillStyle(0xffffff, 1);
    box.fillRoundedRect(-boxSize / 2, -boxSize / 2 + 25, boxSize, boxSize - 25, 8);

    // Box lid
    box.fillStyle(0xffffff, 1);
    box.fillRoundedRect(-boxSize / 2 - 8, -boxSize / 2, boxSize + 16, 35, 8);

    // Ribbon
    box.fillStyle(this.prize.color, 1);
    box.fillRect(-12, -boxSize / 2, 24, boxSize);

    // Bow
    box.fillCircle(0, -boxSize / 2 - 12, 20);
    box.fillCircle(-20, -boxSize / 2 - 4, 14);
    box.fillCircle(20, -boxSize / 2 - 4, 14);

    container.add(box);
    container.setScale(0);

    await new Promise(resolve => {
      this.tweens.add({
        targets: container,
        y: height / 2,
        scale: 1,
        duration: 700,
        ease: 'Back.easeOut',
        onComplete: resolve,
      });
    });

    // Subtle glow
    const glow = this.add.graphics();
    glow.fillStyle(this.prize.color, 0.15);
    glow.fillCircle(0, 0, 100);
    container.addAt(glow, 0);

    this.tweens.add({
      targets: glow,
      alpha: 0.05,
      scale: 1.15,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    return container;
  }

  async shakeBox(container) {
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => {
        this.tweens.add({
          targets: container,
          x: container.x + Phaser.Math.Between(-8, 8),
          angle: Phaser.Math.Between(-4, 4),
          duration: 50,
          onComplete: resolve,
        });
      });
    }

    await new Promise(resolve => {
      this.tweens.add({
        targets: container,
        x: window.innerWidth / 2,
        angle: 0,
        duration: 100,
        onComplete: resolve,
      });
    });
  }

  async revealPrize(boxContainer) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.cameras.main.flash(250, 255, 255, 255);

    this.tweens.add({
      targets: boxContainer,
      y: height + 200,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeIn',
    });

    // Sparkle burst
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const sparkle = this.add.text(width / 2, height / 2, '✨', {
        fontSize: '20px',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: sparkle,
        x: width / 2 + Math.cos(angle) * 250,
        y: height / 2 + Math.sin(angle) * 250,
        alpha: 0,
        duration: 800,
        onComplete: () => sparkle.destroy(),
      });
    }

    await this.delay(250);

    const prizeCard = this.add.container(width / 2, height / 2);

    // Notion-style card
    const cardWidth = 380;
    const cardHeight = 280;
    const card = this.add.graphics();
    card.fillStyle(0xffffff, 1);
    card.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12);

    // Colored top accent
    card.fillStyle(this.prize.color, 1);
    card.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, 50, { tl: 12, tr: 12, bl: 0, br: 0 });

    // Gift icon
    const giftIcon = this.add.text(0, -90, '🎁', {
      fontSize: '56px',
    }).setOrigin(0.5);

    // Prize name
    const nameText = this.add.text(0, -20, this.prize.name, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '24px',
      fill: COLORS.textPrimary,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Description
    const descText = this.add.text(0, 25, this.prize.description, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: COLORS.textSecondary,
      align: 'center',
      wordWrap: { width: 320 },
    }).setOrigin(0.5);

    // "You won!" text
    const wonText = this.add.text(0, 85, "❤ This is your special gift! ❤", {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '15px',
      fill: COLORS.special,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    prizeCard.add([card, giftIcon, nameText, descText, wonText]);

    prizeCard.setScale(0);
    prizeCard.setAlpha(0);

    await new Promise(resolve => {
      this.tweens.add({
        targets: prizeCard,
        scale: 1,
        alpha: 1,
        duration: 450,
        ease: 'Back.easeOut',
        onComplete: resolve,
      });
    });

    // Continuous sparkle
    this.time.addEvent({
      delay: 300,
      repeat: -1,
      callback: () => {
        if (!this.scene.isActive()) return;
        const angle = Math.random() * Math.PI * 2;
        const dist = 160 + Math.random() * 40;
        const sparkle = this.add.text(
          width / 2 + Math.cos(angle) * dist,
          height / 2 + Math.sin(angle) * dist,
          '✨',
          { fontSize: '14px' }
        ).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
          targets: sparkle,
          alpha: 1,
          duration: 250,
          yoyo: true,
          onComplete: () => sparkle.destroy(),
        });
      },
    });
  }

  showFinalMessage() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const message = this.add.text(width / 2, height - 140, "Congratulations! ❤", {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '20px',
      fill: COLORS.specialLight,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: message,
      alpha: 1,
      duration: 400,
    });

    // Continue button - Notion style
    const btnContainer = this.add.container(width / 2, height - 70);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xffffff, 1);
    btnBg.fillRoundedRect(-80, -20, 160, 40, 6);

    const btnText = this.add.text(0, 0, 'Continue', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '15px',
      fill: COLORS.textPrimary,
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(0, 0, 160, 40, 0x000000, 0).setInteractive();

    btnContainer.add([btnBg, btnText, hitArea]);
    btnContainer.setAlpha(0);

    this.tweens.add({
      targets: btnContainer,
      alpha: 1,
      duration: 400,
      delay: 400,
    });

    hitArea.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0xe9e9e7, 1);
      btnBg.fillRoundedRect(-80, -20, 160, 40, 6);
    });

    hitArea.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0xffffff, 1);
      btnBg.fillRoundedRect(-80, -20, 160, 40, 6);
    });

    hitArea.on('pointerdown', () => {
      if (Storage.getObtainedGrandPrizeCount() >= 3) {
        this.scene.start('GiftCollectionScene');
      } else {
        this.scene.start('PremiumGachaScene');
      }
    });
  }

  delay(ms) {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }
}
