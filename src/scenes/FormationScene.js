// Formation Selection Scene (KanColle style)
// Shows formation options before combat - Fully responsive layout

import Phaser from 'phaser';
import { Storage } from '../systems/storage.js';
import { getShipById, getShipStats, RARITY } from '../data/ships.js';
import { getDamageState } from '../data/maps.js';
import { FORMATIONS, FORMATION_ORDER, formatModifier } from '../data/formations.js';
import { AudioManager, BGM } from '../systems/audio.js';
import { getDisplayName } from '../data/theme.js';

// Notion-inspired colors
const COLORS = {
  bgPrimary: 0xffffff,
  bgSecondary: 0xf7f6f3,
  bgHover: 0xe9e9e7,
  textPrimary: '#37352f',
  textSecondary: '#787774',
  textTertiary: '#9b9a97',
  border: 0xe9e9e7,
  accent: 0x2eaadc,
  success: 0x4dab9a,
  warning: 0xcb912f,
  danger: 0xe03e3e,
};

export class FormationScene extends Phaser.Scene {
  constructor() {
    super('FormationScene');
    this.selectedFormation = null;
  }

  init(data) {
    this.mapId = data.mapId;
    this.nodeId = data.nodeId;
    this.fleetHp = data.fleetHp || {};
    this.isBoss = data.isBoss || false;
  }

  create() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

    // Set audio scene reference
    AudioManager.setScene(this);
    AudioManager.playBgm(BGM.BATTLE);

    // Get last used formation
    this.selectedFormation = Storage.getLastFormation();

    this.createBackground();
    this.createHeader();
    this.createFormationGrid();
    this.createFleetPreview();
    this.createBottomBar();
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
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Responsive header height
    const headerHeight = Math.max(48, Math.min(56, height * 0.08));

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRect(0, 0, width, headerHeight);
    g.fillStyle(COLORS.border, 1);
    g.fillRect(0, headerHeight - 1, width, 1);

    // Responsive font sizes
    const titleFontSize = Math.max(14, Math.min(20, width * 0.025));
    const backFontSize = Math.max(12, Math.min(14, width * 0.018));

    // Back button
    const backBtn = this.add.text(16, headerHeight / 2, '← Cancel', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: `${backFontSize}px`,
      fill: COLORS.textSecondary,
    }).setOrigin(0, 0.5).setInteractive();

    backBtn.on('pointerover', () => backBtn.setStyle({ fill: COLORS.textPrimary }));
    backBtn.on('pointerout', () => backBtn.setStyle({ fill: COLORS.textSecondary }));
    backBtn.on('pointerdown', () => {
      this.scene.start('MapScene', {
        mapId: this.mapId,
        currentNode: this.nodeId === 'A' ? 'start' : this.getPreviousNode(),
        fleetHp: this.fleetHp,
      });
    });

    // Title
    const nodeLabel = this.isBoss ? 'BOSS' : `Node ${this.nodeId}`;
    this.add.text(width / 2, headerHeight / 2, `${this.mapId} - ${nodeLabel} | Select Formation`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: `${titleFontSize}px`,
      fill: COLORS.textPrimary,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.headerHeight = headerHeight;
  }

  getPreviousNode() {
    return 'start';
  }

  createFormationGrid() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Calculate available space
    const headerHeight = this.headerHeight || 56;
    const fleetPanelHeight = Math.max(70, Math.min(100, height * 0.12));
    const bottomBarHeight = Math.max(48, Math.min(56, height * 0.08));
    const availableHeight = height - headerHeight - fleetPanelHeight - bottomBarHeight - 32;

    // Responsive grid sizing - use percentage of screen
    const margin = Math.max(16, width * 0.03);
    const gap = Math.max(12, Math.min(20, width * 0.02));

    // Calculate card dimensions to fit 2x2 grid
    const maxGridWidth = Math.min(width - margin * 2, 800);
    const maxGridHeight = Math.min(availableHeight, 500);

    const cardWidth = (maxGridWidth - gap) / 2;
    const cardHeight = (maxGridHeight - gap) / 2;

    // Center the grid
    const gridWidth = cardWidth * 2 + gap;
    const gridHeight = cardHeight * 2 + gap;
    const startX = (width - gridWidth) / 2 + cardWidth / 2;
    const startY = headerHeight + (availableHeight - gridHeight) / 2 + cardHeight / 2;

    this.formationCards = [];

    FORMATION_ORDER.forEach((formationId, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = startX + col * (cardWidth + gap);
      const y = startY + row * (cardHeight + gap);

      this.createFormationCard(x, y, cardWidth, cardHeight, FORMATIONS[formationId]);
    });

    // Store for fleet preview positioning
    this.gridBottom = startY + cardHeight / 2 + gap + cardHeight;
  }

  createFormationCard(x, y, w, h, formation) {
    const isSelected = this.selectedFormation === formation.id;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    this.drawFormationCardBg(bg, w, h, isSelected);

    // Responsive font sizes based on card size
    const scale = Math.min(w / 250, h / 200);
    const iconSize = Math.max(24, Math.min(40, 40 * scale));
    const titleSize = Math.max(12, Math.min(16, 16 * scale));
    const descSize = Math.max(9, Math.min(11, 11 * scale));
    const statSize = Math.max(10, Math.min(12, 12 * scale));

    // Vertical spacing based on card height
    const topPadding = h * 0.08;
    const iconY = -h / 2 + topPadding + iconSize / 2;
    const titleY = iconY + iconSize / 2 + h * 0.08;
    const descY = titleY + h * 0.08;
    const statsStartY = descY + h * 0.1;
    const statSpacing = Math.max(16, h * 0.1);

    // Formation icon
    const icon = this.add.text(0, iconY, formation.icon, {
      fontSize: `${iconSize}px`,
      fill: isSelected ? '#2eaadc' : COLORS.textSecondary,
    }).setOrigin(0.5);

    // Formation name
    const name = this.add.text(0, titleY, formation.name, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: `${titleSize}px`,
      fill: COLORS.textPrimary,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Description
    const desc = this.add.text(0, descY, formation.description, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: `${descSize}px`,
      fill: COLORS.textSecondary,
    }).setOrigin(0.5);

    container.add([bg, icon, name, desc]);

    // Stat modifiers
    const modifiers = formation.modifiers;
    const statLabels = [
      { key: 'firepower', label: 'FP', color: 0xe03e3e },
      { key: 'torpedo', label: 'TORP', color: 0x2eaadc },
      { key: 'evasion', label: 'EVA', color: 0xcb912f },
      { key: 'antiAir', label: 'AA', color: 0x4dab9a },
    ];

    const statPadding = w * 0.1;
    statLabels.forEach((stat, i) => {
      const mod = modifiers[stat.key] || 1;
      const modText = formatModifier(mod);
      const modColor = mod > 1 ? '#4dab9a' : mod < 1 ? '#e03e3e' : COLORS.textTertiary;

      const statY = statsStartY + i * statSpacing;

      container.add(this.add.text(-w / 2 + statPadding, statY, stat.label, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: `${statSize}px`,
        fill: COLORS.textSecondary,
      }).setOrigin(0, 0.5));

      container.add(this.add.text(w / 2 - statPadding, statY, modText, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: `${statSize}px`,
        fill: modColor,
        fontStyle: mod !== 1 ? 'bold' : 'normal',
      }).setOrigin(1, 0.5));
    });

    // Selection indicator
    if (isSelected) {
      container.add(this.add.text(0, h / 2 - h * 0.1, '✓ Selected', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: `${descSize}px`,
        fill: '#2eaadc',
        fontStyle: 'bold',
      }).setOrigin(0.5));
    }

    // Hit area
    const hit = this.add.rectangle(0, 0, w, h, 0x000000, 0).setInteractive();
    container.add(hit);

    hit.on('pointerover', () => {
      if (!isSelected) {
        this.drawFormationCardBg(bg, w, h, false, true);
      }
    });

    hit.on('pointerout', () => {
      if (!isSelected) {
        this.drawFormationCardBg(bg, w, h, false, false);
      }
    });

    hit.on('pointerdown', () => {
      this.selectFormation(formation.id);
    });

    this.formationCards.push({ container, bg, formation, w, h });
  }

  drawFormationCardBg(g, w, h, isSelected, isHover = false) {
    g.clear();
    g.fillStyle(isHover ? COLORS.bgHover : COLORS.bgPrimary, 1);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);

    if (isSelected) {
      g.lineStyle(3, COLORS.accent, 1);
    } else {
      g.lineStyle(1, COLORS.border, 1);
    }
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
  }

  selectFormation(formationId) {
    this.selectedFormation = formationId;
    Storage.setLastFormation(formationId);

    // Refresh the scene to update selection visuals
    this.scene.restart({
      mapId: this.mapId,
      nodeId: this.nodeId,
      fleetHp: this.fleetHp,
      isBoss: this.isBoss,
    });
  }

  createFleetPreview() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Responsive panel sizing
    const bottomBarHeight = Math.max(48, Math.min(56, height * 0.08));
    const panelH = Math.max(70, Math.min(100, height * 0.12));
    const panelY = height - bottomBarHeight - panelH - 8;
    const margin = Math.max(16, width * 0.02);

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(margin, panelY, width - margin * 2, panelH, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(margin, panelY, width - margin * 2, panelH, 6);

    // Responsive font sizes
    const labelSize = Math.max(9, Math.min(11, width * 0.012));
    const nameSize = Math.max(9, Math.min(11, width * 0.012));
    const hpSize = Math.max(8, Math.min(9, width * 0.01));

    this.add.text(margin + 12, panelY + 12, 'Fleet', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: `${labelSize}px`,
      fill: COLORS.textTertiary,
      fontStyle: 'bold',
    });

    const fleet = Storage.get('fleet').filter(id => id !== null);
    const availableWidth = width - margin * 2 - 24;
    const cardWidth = Math.min(120, availableWidth / Math.max(fleet.length, 1));
    const startX = margin + 12;

    fleet.forEach((shipId, i) => {
      const shipData = getShipById(shipId);
      const savedData = Storage.getShipData(shipId);
      if (!shipData || !savedData) return;

      const stats = getShipStats(shipData, savedData.level);
      const currentHp = this.fleetHp[shipId] !== undefined ? this.fleetHp[shipId] : stats.hp;
      const damageState = getDamageState(currentHp, stats.hp);

      const x = startX + i * cardWidth;
      const y = panelY + panelH * 0.55;

      // Ship name
      this.add.text(x, y - panelH * 0.15, getDisplayName(shipData.id, shipData.name), {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: `${nameSize}px`,
        fill: COLORS.textPrimary,
      });

      // HP bar
      const barWidth = Math.min(cardWidth - 15, 100);
      const hpPercent = currentHp / stats.hp;

      this.add.rectangle(x + barWidth / 2, y + 4, barWidth, 8, 0xe9e9e7);
      const hpFill = this.add.rectangle(x, y + 4, barWidth * hpPercent, 6, damageState.color);
      hpFill.setOrigin(0, 0.5);

      // HP text
      this.add.text(x, y + panelH * 0.18, `${currentHp}/${stats.hp}`, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: `${hpSize}px`,
        fill: COLORS.textTertiary,
      });
    });
  }

  createBottomBar() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Responsive bar height
    const barHeight = Math.max(48, Math.min(56, height * 0.08));

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRect(0, height - barHeight, width, barHeight);
    g.fillStyle(COLORS.border, 1);
    g.fillRect(0, height - barHeight, width, 1);

    // Responsive font and button sizes
    const btnFontSize = Math.max(12, Math.min(16, width * 0.018));
    const infoFontSize = Math.max(11, Math.min(13, width * 0.015));
    const btnWidth = Math.max(120, Math.min(160, width * 0.2));
    const btnHeight = Math.max(28, Math.min(36, barHeight * 0.7));

    // Sortie button
    const sortieBtn = this.add.container(width / 2, height - barHeight / 2);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(this.isBoss ? COLORS.danger : COLORS.accent, 1);
    btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);

    const btnText = this.add.text(0, 0, this.isBoss ? '⚔ ENGAGE BOSS' : '⚔ SORTIE', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: `${btnFontSize}px`,
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    sortieBtn.add([btnBg, btnText]);

    const hit = this.add.rectangle(width / 2, height - barHeight / 2, btnWidth, btnHeight, 0x000000, 0).setInteractive();

    hit.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(this.isBoss ? 0xc62828 : 0x1a8cbe, 1);
      btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);
    });

    hit.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(this.isBoss ? COLORS.danger : COLORS.accent, 1);
      btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 6);
    });

    hit.on('pointerdown', () => {
      this.startBattle();
    });

    // Formation info on the left
    const formation = FORMATIONS[this.selectedFormation];
    this.add.text(16, height - barHeight / 2, `Formation: ${formation.name}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: `${infoFontSize}px`,
      fill: COLORS.textSecondary,
    }).setOrigin(0, 0.5);
  }

  startBattle() {
    this.scene.start('BattleScene', {
      mapId: this.mapId,
      nodeId: this.nodeId,
      fleetHp: this.fleetHp,
      isBoss: this.isBoss,
      formation: this.selectedFormation,
    });
  }
}
