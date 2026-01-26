import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { GachaScene } from './scenes/GachaScene.js';
import { CollectionScene } from './scenes/CollectionScene.js';
import { FleetScene } from './scenes/FleetScene.js';
import { BattleScene } from './scenes/BattleScene.js';
import { MapScene } from './scenes/MapScene.js';
import { DockScene } from './scenes/DockScene.js';
// Special gift feature scenes
import { PremiumGachaScene } from './scenes/PremiumGachaScene.js';
import { ExchangeShopScene } from './scenes/ExchangeShopScene.js';
import { GiftRevealScene } from './scenes/GiftRevealScene.js';
import { GiftCollectionScene } from './scenes/GiftCollectionScene.js';
import { SecretCodeScene } from './scenes/SecretCodeScene.js';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#1a1f2e',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    TitleScene,
    GachaScene,
    CollectionScene,
    FleetScene,
    BattleScene,
    MapScene,
    DockScene,
    // Special scenes
    PremiumGachaScene,
    ExchangeShopScene,
    GiftRevealScene,
    GiftCollectionScene,
    SecretCodeScene,
  ],
};

const game = new Phaser.Game(config);
