// Boot scene - loads assets (KanColle style)

import Phaser from 'phaser';
import { SHIPS } from '../data/ships.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Use actual window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

    const g = this.add.graphics();

    // Background
    g.fillStyle(0x2d1f14, 1);
    g.fillRect(0, 0, width, height);

    // Frame
    g.lineStyle(2, 0x8b7355, 1);
    g.strokeRect(width / 2 - 200, height / 2 - 80, 400, 160);

    // Loading bar background
    g.fillStyle(0x1a1008, 1);
    g.fillRoundedRect(width / 2 - 150, height / 2 + 20, 300, 20, 4);

    // Loading bar fill
    const barFill = this.add.rectangle(width / 2 - 148, height / 2 + 30, 0, 16, 0x8b7355);
    barFill.setOrigin(0, 0.5);

    // Title
    this.add.text(width / 2, height / 2 - 40, 'FLEET COLLECTION', {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      fill: '#f4e4c4',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Loading text
    this.add.text(width / 2, height / 2, 'Now Loading...', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      fill: '#8b7355',
    }).setOrigin(0.5);

    // Progress handler
    this.load.on('progress', (value) => {
      barFill.width = 296 * value;
    });

    // Load ship portrait images
    SHIPS.forEach(ship => {
      this.load.image(`ship_portrait_${ship.id}`, `assets/ships/${ship.id}.png`);
    });

    // Load ship banner images (for battle/sortie UI)
    SHIPS.forEach(ship => {
      this.load.image(`ship_banner_${ship.id}`, `assets/banners/${ship.id}.png`);
    });

    // Create UI assets
    this.createUIAssets();
  }

  create() {
    this.scene.start('TitleScene');
  }

  createUIAssets() {
    // Rarity configs (KanColle style colors)
    const rarityConfigs = {
      N: { bg: 0x4a3828, border: 0x6b5545, accent: 0x8b7355 },
      R: { bg: 0x3a4858, border: 0x5a7888, accent: 0x7a98b8 },
      SR: { bg: 0x4a3858, border: 0x7a58a8, accent: 0x9a78c8 },
      SSR: { bg: 0x4a4828, border: 0xd4a458, accent: 0xffc868 },
    };

    for (const [rarity, colors] of Object.entries(rarityConfigs)) {
      // Ship card (100x130)
      const cardGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      cardGraphics.fillStyle(colors.bg, 1);
      cardGraphics.fillRoundedRect(0, 0, 100, 130, 4);
      cardGraphics.lineStyle(2, colors.border, 0.8);
      cardGraphics.strokeRoundedRect(0, 0, 100, 130, 4);
      cardGraphics.fillStyle(colors.accent, 0.6);
      cardGraphics.fillRect(0, 0, 100, 4);
      cardGraphics.generateTexture(`card_${rarity}`, 100, 130);
      cardGraphics.destroy();

      // Ship silhouette (64x64)
      const shipGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      shipGraphics.fillStyle(colors.accent, 0.9);
      shipGraphics.beginPath();
      shipGraphics.moveTo(8, 32);
      shipGraphics.lineTo(16, 24);
      shipGraphics.lineTo(48, 24);
      shipGraphics.lineTo(56, 32);
      shipGraphics.lineTo(56, 38);
      shipGraphics.lineTo(48, 42);
      shipGraphics.lineTo(16, 42);
      shipGraphics.lineTo(8, 38);
      shipGraphics.closePath();
      shipGraphics.fill();
      shipGraphics.fillStyle(colors.border, 0.8);
      shipGraphics.fillRect(26, 28, 12, 10);
      shipGraphics.generateTexture(`ship_${rarity}`, 64, 64);
      shipGraphics.destroy();
    }

    // Standard button
    const btnGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    btnGraphics.fillStyle(0x3d2d1d, 1);
    btnGraphics.fillRoundedRect(0, 0, 180, 44, 4);
    btnGraphics.lineStyle(1, 0x8b7355, 1);
    btnGraphics.strokeRoundedRect(0, 0, 180, 44, 4);
    btnGraphics.generateTexture('button', 180, 44);
    btnGraphics.destroy();

    // Panel background
    const panelGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    panelGraphics.fillStyle(0x3d2d1d, 0.98);
    panelGraphics.fillRoundedRect(0, 0, 280, 380, 6);
    panelGraphics.lineStyle(2, 0x8b7355, 1);
    panelGraphics.strokeRoundedRect(0, 0, 280, 380, 6);
    panelGraphics.generateTexture('panel', 280, 380);
    panelGraphics.destroy();

    // Resource icon
    const resourceGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    resourceGraphics.fillStyle(0xd4a458, 1);
    resourceGraphics.fillRoundedRect(4, 8, 16, 8, 2);
    resourceGraphics.fillStyle(0xffc868, 1);
    resourceGraphics.fillRoundedRect(6, 10, 12, 4, 1);
    resourceGraphics.generateTexture('resource', 24, 24);
    resourceGraphics.destroy();
  }
}
