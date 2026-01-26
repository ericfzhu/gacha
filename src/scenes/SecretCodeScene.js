// Secret Code scene - enter a code for 50 bonus tickets (Notion style)

import Phaser from 'phaser';
import { Storage } from '../systems/storage.js';

// CONFIGURE THIS: Set the secret code here!
// Change this to something meaningful (anniversary date, pet name, etc.)
const SECRET_CODE = 'ILOVEYOU';

// Test codes (can be used multiple times)
const TEST_CODES = {
  'FUEL100K': { type: 'fuel', amount: 100000, message: '+100,000 Fuel!' },
  'TICKETS500': { type: 'tickets', amount: 500, message: '+500 Premium Tickets!' },
  'RESETGAME': { type: 'reset', message: 'Game Reset!' },
};

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
  danger: '#e03e3e',
};

export class SecretCodeScene extends Phaser.Scene {
  constructor() {
    super('SecretCodeScene');
  }

  create() {
    // Use actual window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

    this.inputText = '';
    this.createBackground();
    this.createContent();
  }

  createBackground() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();
    g.fillStyle(COLORS.bgSecondary, 1);
    g.fillRect(0, 0, width, height);
  }

  createContent() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Header
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

    this.add.text(width / 2, 28, '✨ Secret Code', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '20px',
      fill: COLORS.warning,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Check if main code already redeemed (but still allow test codes)
    this.mainCodeRedeemed = Storage.isSecretCodeRedeemed();

    // Main panel
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.bgPrimary, 1);
    panel.fillRoundedRect(width / 2 - 280, 90, 560, height - 150, 8);
    panel.lineStyle(1, COLORS.border, 1);
    panel.strokeRoundedRect(width / 2 - 280, 90, 560, height - 150, 8);

    // Instructions
    if (this.mainCodeRedeemed) {
      this.add.text(width / 2, 135, '✓ Secret code already redeemed!', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '15px',
        fill: COLORS.success,
      }).setOrigin(0.5);

      this.add.text(width / 2, 160, 'You can still enter other codes below.', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '13px',
        fill: COLORS.textTertiary,
      }).setOrigin(0.5);
    } else {
      this.add.text(width / 2, 135, 'Enter the secret code for 50 bonus tickets!', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '15px',
        fill: COLORS.textSecondary,
      }).setOrigin(0.5);

      this.add.text(width / 2, 160, "(Hint: It's something special...)", {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '13px',
        fill: COLORS.textTertiary,
        fontStyle: 'italic',
      }).setOrigin(0.5);
    }

    // Input field background
    const inputBg = this.add.graphics();
    inputBg.fillStyle(COLORS.bgSecondary, 1);
    inputBg.fillRoundedRect(width / 2 - 180, 195, 360, 50, 6);
    inputBg.lineStyle(1, COLORS.border, 1);
    inputBg.strokeRoundedRect(width / 2 - 180, 195, 360, 50, 6);

    // Input text display
    this.inputDisplay = this.add.text(width / 2, 220, '|', {
      fontFamily: 'monospace',
      fontSize: '20px',
      fill: COLORS.textPrimary,
    }).setOrigin(0.5);

    // Cursor blink
    this.time.addEvent({
      delay: 500,
      repeat: -1,
      callback: () => {
        const cursor = this.inputText.length < 20 ? '|' : '';
        this.inputDisplay.setText(this.inputText + cursor);
      },
    });

    // Submit button
    this.createSubmitButton(width / 2, 280);

    // Message area
    this.messageText = this.add.text(width / 2, 340, '', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: COLORS.danger,
    }).setOrigin(0.5);

    // Also listen for real keyboard
    this.input.keyboard.on('keydown', (event) => {
      if (event.keyCode === 8) { // Backspace
        this.inputText = this.inputText.slice(0, -1);
      } else if (event.keyCode === 13) { // Enter
        this.submitCode();
      } else if (event.key.length === 1 && this.inputText.length < 20) {
        this.inputText += event.key.toUpperCase();
      }
      this.updateDisplay();
    });
  }

  createSubmitButton(x, y) {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x4dab9a, 1);
    bg.fillRoundedRect(-90, -22, 180, 44, 6);

    const text = this.add.text(0, 0, 'Submit Code', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '15px',
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(0, 0, 180, 44, 0x000000, 0).setInteractive();

    container.add([bg, text, hitArea]);

    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x5dbba9, 1);
      bg.fillRoundedRect(-90, -22, 180, 44, 6);
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x4dab9a, 1);
      bg.fillRoundedRect(-90, -22, 180, 44, 6);
    });

    hitArea.on('pointerdown', () => this.submitCode());
  }

  updateDisplay() {
    this.inputDisplay.setText(this.inputText + '|');
  }

  submitCode() {
    const code = this.inputText.toUpperCase().trim();

    // Check for test codes first (can be used multiple times)
    if (TEST_CODES[code]) {
      const testCode = TEST_CODES[code];
      if (testCode.type === 'fuel') {
        Storage.addCurrency(testCode.amount);
        this.showTestCodeSuccess(testCode.message, '⛽');
      } else if (testCode.type === 'tickets') {
        Storage.addTickets(testCode.amount);
        this.showTestCodeSuccess(testCode.message, '🎫');
      } else if (testCode.type === 'reset') {
        Storage.reset();
        this.showTestCodeSuccess(testCode.message, '🔄');
      }
      return;
    }

    // Check for the main secret code (one-time use)
    if (code === SECRET_CODE.toUpperCase()) {
      if (this.mainCodeRedeemed) {
        this.messageText.setText('This code was already redeemed!');
        this.messageText.setStyle({ fill: COLORS.warning });
        this.inputText = '';
        this.updateDisplay();
        this.time.delayedCall(2000, () => {
          this.messageText.setText('');
        });
      } else {
        Storage.redeemSecretCode();
        this.showSuccess();
      }
    } else {
      this.messageText.setText("Hmm, that's not right. Try again!");
      this.messageText.setStyle({ fill: COLORS.danger });
      this.cameras.main.shake(150, 0.004);

      this.time.delayedCall(2000, () => {
        this.messageText.setText('');
      });
    }
  }

  showTestCodeSuccess(message, emoji) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.cameras.main.flash(200, 77, 171, 154);

    // Show success message briefly
    this.messageText.setText(`${emoji} ${message}`);
    this.messageText.setStyle({ fill: COLORS.success });

    // Clear input
    this.inputText = '';
    this.updateDisplay();

    this.time.delayedCall(1500, () => {
      this.messageText.setText('');
    });
  }

  showSuccess() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.cameras.main.flash(250, 77, 171, 154);

    this.children.removeAll();
    this.createBackground();

    // Header
    const g = this.add.graphics();
    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRect(0, 0, width, 56);
    g.fillStyle(COLORS.border, 1);
    g.fillRect(0, 55, width, 1);

    this.add.text(width / 2, 28, '✨ Secret Code', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '20px',
      fill: COLORS.warning,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Success card
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.bgPrimary, 1);
    panel.fillRoundedRect(width / 2 - 200, height / 2 - 120, 400, 240, 8);
    panel.lineStyle(2, 0x4dab9a, 1);
    panel.strokeRoundedRect(width / 2 - 200, height / 2 - 120, 400, 240, 8);

    this.add.text(width / 2, height / 2 - 70, '✨ Code Accepted! ✨', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '28px',
      fill: COLORS.success,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 15, '+50 Premium Tickets! 🎫', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '22px',
      fill: COLORS.warning,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 30, "Use them in the Valentine's Gacha!", {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: COLORS.textSecondary,
    }).setOrigin(0.5);

    // Sparkles
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 60, () => {
        const sparkle = this.add.text(
          Phaser.Math.Between(width / 2 - 180, width / 2 + 180),
          Phaser.Math.Between(height / 2 - 100, height / 2 + 100),
          '✨',
          { fontSize: `${Phaser.Math.Between(14, 24)}px` }
        ).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
          targets: sparkle,
          alpha: 1,
          y: sparkle.y - 40,
          duration: 400,
          yoyo: true,
          onComplete: () => sparkle.destroy(),
        });
      });
    }

    // Continue button
    this.time.delayedCall(1200, () => {
      const btnContainer = this.add.container(width / 2, height / 2 + 85);

      const btnBg = this.add.graphics();
      btnBg.fillStyle(COLORS.bgSecondary, 1);
      btnBg.fillRoundedRect(-70, -18, 140, 36, 6);

      const btnText = this.add.text(0, 0, 'Continue', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '14px',
        fill: COLORS.textPrimary,
      }).setOrigin(0.5);

      const hitArea = this.add.rectangle(0, 0, 140, 36, 0x000000, 0).setInteractive();

      btnContainer.add([btnBg, btnText, hitArea]);

      hitArea.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(COLORS.bgHover, 1);
        btnBg.fillRoundedRect(-70, -18, 140, 36, 6);
      });

      hitArea.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(COLORS.bgSecondary, 1);
        btnBg.fillRoundedRect(-70, -18, 140, 36, 6);
      });

      hitArea.on('pointerdown', () => this.scene.start('TitleScene'));
    });
  }

  showAlreadyRedeemed() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.bgPrimary, 1);
    panel.fillRoundedRect(width / 2 - 200, height / 2 - 80, 400, 160, 8);
    panel.lineStyle(1, COLORS.border, 1);
    panel.strokeRoundedRect(width / 2 - 200, height / 2 - 80, 400, 160, 8);

    this.add.text(width / 2, height / 2 - 30, 'Code Already Redeemed!', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '22px',
      fill: COLORS.success,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 10, "You've already claimed your 50 bonus tickets.", {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: COLORS.textSecondary,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 45, `Current tickets: ${Storage.getTickets()}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '15px',
      fill: COLORS.warning,
    }).setOrigin(0.5);
  }
}
