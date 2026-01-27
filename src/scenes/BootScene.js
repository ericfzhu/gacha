// Boot scene - loads assets (Notion style)

import Phaser from 'phaser';
import { SHIPS } from '../data/ships.js';
import { ENEMIES } from '../data/enemies.js';
import { AudioManager, BGM } from '../systems/audio.js';
import { Storage } from '../systems/storage.js';

// Notion-inspired colors
const COLORS = {
  bgPrimary: 0xffffff,
  bgSecondary: 0xf7f6f3,
  textPrimary: '#37352f',
  textSecondary: '#787774',
  textTertiary: '#9b9a97',
  border: 0xe9e9e7,
  accent: 0x2eaadc,
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Use actual window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

    // Clear texture cache for ship assets (needed when switching artwork modes)
    SHIPS.forEach(ship => {
      if (this.textures.exists(`ship_portrait_${ship.id}`)) {
        this.textures.remove(`ship_portrait_${ship.id}`);
      }
      if (this.textures.exists(`ship_banner_${ship.id}`)) {
        this.textures.remove(`ship_banner_${ship.id}`);
      }
    });

    const g = this.add.graphics();

    // Background
    g.fillStyle(COLORS.bgSecondary, 1);
    g.fillRect(0, 0, width, height);

    // Card panel
    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(width / 2 - 200, height / 2 - 80, 400, 160, 8);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(width / 2 - 200, height / 2 - 80, 400, 160, 8);

    // Loading bar background
    g.fillStyle(COLORS.border, 1);
    g.fillRoundedRect(width / 2 - 150, height / 2 + 20, 300, 12, 6);

    // Loading bar fill
    const barFill = this.add.rectangle(width / 2 - 148, height / 2 + 26, 0, 8, COLORS.accent);
    barFill.setOrigin(0, 0.5);

    // Title
    this.add.text(width / 2, height / 2 - 40, 'Fleet Collection', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '24px',
      fill: COLORS.textPrimary,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Loading text
    this.add.text(width / 2, height / 2, 'Loading...', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: COLORS.textTertiary,
    }).setOrigin(0.5);

    // Progress handler
    this.load.on('progress', (value) => {
      barFill.width = 296 * value;
    });

    // Error handler - log failed assets
    this.load.on('loaderror', (file) => {
      console.error('Failed to load asset:', file.key, file.src);
    });

    // Complete handler
    this.load.on('complete', () => {
      console.log('All assets loaded successfully');
    });

    // Determine artwork mode (pokemon or anime ship girls)
    // Default is 'pokemon', secret code "KANCOLLE" switches to 'anime'
    const artworkMode = Storage.getArtworkMode();
    console.log('Artwork mode:', artworkMode);
    const shipFolder = artworkMode === 'anime' ? 'ships' : 'ships_pokemon';
    const bannerFolder = artworkMode === 'anime' ? 'banners' : 'banners_pokemon';
    console.log('Loading from folders:', shipFolder, bannerFolder);

    // Load ship portrait images
    SHIPS.forEach(ship => {
      this.load.image(`ship_portrait_${ship.id}`, `assets/${shipFolder}/${ship.id}.png`);
    });

    // Load ship banner images (for battle/sortie UI)
    SHIPS.forEach(ship => {
      this.load.image(`ship_banner_${ship.id}`, `assets/${bannerFolder}/${ship.id}.png`);
    });

    // Load enemy banner images (for battle UI) - always use regular banners folder
    ENEMIES.forEach(enemy => {
      this.load.image(`ship_banner_${enemy.id}`, `assets/banners/${enemy.id}.png`);
    });

    // Load audio files
    this.load.audio(BGM.PORT, 'assets/audio/bgm_port.mp3');
    this.load.audio(BGM.MENU, 'assets/audio/bgm_menu.mp3');
    this.load.audio(BGM.BATTLE, 'assets/audio/bgm_battle.mp3');
    this.load.audio(BGM.VICTORY, 'assets/audio/bgm_victory.mp3');
    this.load.audio(BGM.GIFT, 'assets/audio/bgm_gift.mp3');

    // Load background images
    this.load.image('ocean_bg', 'assets/ocean_bg.webp');

    // Create UI assets
    this.createUIAssets();
  }

  create() {
    // Initialize audio manager
    AudioManager.init(this);
    this.scene.start('TitleScene');
  }

  createUIAssets() {
    // Rarity configs (Notion-inspired colors)
    const rarityConfigs = {
      N: { bg: 0xf7f6f3, border: 0x888888, accent: 0x888888 },
      R: { bg: 0xf0f7ff, border: 0x44aaff, accent: 0x44aaff },
      SR: { bg: 0xf5f0ff, border: 0xaa44ff, accent: 0xaa44ff },
      SSR: { bg: 0xfffbf0, border: 0xffaa00, accent: 0xffaa00 },
    };

    for (const [rarity, colors] of Object.entries(rarityConfigs)) {
      // Ship card (100x130)
      const cardGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      cardGraphics.fillStyle(colors.bg, 1);
      cardGraphics.fillRoundedRect(0, 0, 100, 130, 6);
      cardGraphics.lineStyle(2, colors.border, 0.6);
      cardGraphics.strokeRoundedRect(0, 0, 100, 130, 6);
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

    // Standard button (Notion style)
    const btnGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    btnGraphics.fillStyle(0xffffff, 1);
    btnGraphics.fillRoundedRect(0, 0, 180, 44, 6);
    btnGraphics.lineStyle(1, 0xe9e9e7, 1);
    btnGraphics.strokeRoundedRect(0, 0, 180, 44, 6);
    btnGraphics.generateTexture('button', 180, 44);
    btnGraphics.destroy();

    // Panel background (Notion style)
    const panelGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    panelGraphics.fillStyle(0xffffff, 1);
    panelGraphics.fillRoundedRect(0, 0, 280, 380, 8);
    panelGraphics.lineStyle(1, 0xe9e9e7, 1);
    panelGraphics.strokeRoundedRect(0, 0, 280, 380, 8);
    panelGraphics.generateTexture('panel', 280, 380);
    panelGraphics.destroy();

    // Resource icon (fuel green)
    const resourceGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    resourceGraphics.fillStyle(0x4dab9a, 1);
    resourceGraphics.fillRoundedRect(4, 8, 16, 8, 2);
    resourceGraphics.fillStyle(0x6dcbb8, 1);
    resourceGraphics.fillRoundedRect(6, 10, 12, 4, 1);
    resourceGraphics.generateTexture('resource', 24, 24);
    resourceGraphics.destroy();
  }
}
