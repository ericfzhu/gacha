// Map Navigation Scene (Notion style)
// Shows map nodes and allows player to navigate through them

import Phaser from 'phaser';
import { Storage } from '../systems/storage.js';
import { getShipById, getShipStats, RARITY } from '../data/ships.js';
import { MAPS, getMapById, getNodeById, getDamageState } from '../data/maps.js';
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
  accent: 0x2eaadc,
  success: 0x4dab9a,
  warning: 0xcb912f,
  danger: 0xe03e3e,
  ocean: 0xd4e5f7,
};

export class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
    this.mapOffsetX = 0;
    this.mapOffsetY = 0;
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
  }

  init(data) {
    this.mapId = data.mapId || '1-1';
    this.currentNode = data.currentNode || 'start';
    this.fleetHp = data.fleetHp || {}; // Track HP during sortie
    this.mapOffsetX = 0;
    this.mapOffsetY = 0;
  }

  create() {
    // Use actual window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.scale.resize(width, height);

    // Set audio scene and play battle music (we're in sortie)
    AudioManager.setScene(this);
    AudioManager.playBgm(BGM.BATTLE);

    this.mapData = getMapById(this.mapId);
    if (!this.mapData) {
      this.scene.start('BattleScene');
      return;
    }

    this.createBackground();
    this.createHeader();
    this.createMapArea();
    this.createFleetStatus();
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
    const g = this.add.graphics();

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRect(0, 0, width, 56);
    g.fillStyle(COLORS.border, 1);
    g.fillRect(0, 55, width, 1);

    // Retreat button (can't retreat from boss)
    const currentNodeData = this.mapData.nodes[this.currentNode];
    if (currentNodeData.type !== 'boss' && this.currentNode !== 'start') {
      const retreatBtn = this.add.text(24, 28, '← Retreat', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '14px',
        fill: COLORS.textSecondary,
      }).setOrigin(0, 0.5).setInteractive();

      retreatBtn.on('pointerover', () => retreatBtn.setStyle({ fill: '#e03e3e' }));
      retreatBtn.on('pointerout', () => retreatBtn.setStyle({ fill: COLORS.textSecondary }));
      retreatBtn.on('pointerdown', () => this.retreatFromMap());
    } else if (this.currentNode === 'start') {
      const backBtn = this.add.text(24, 28, '← Back', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '14px',
        fill: COLORS.textSecondary,
      }).setOrigin(0, 0.5).setInteractive();

      backBtn.on('pointerover', () => backBtn.setStyle({ fill: COLORS.textPrimary }));
      backBtn.on('pointerout', () => backBtn.setStyle({ fill: COLORS.textSecondary }));
      backBtn.on('pointerdown', () => this.scene.start('BattleScene', { mapId: null, nodeId: null, fleetHp: {}, isBoss: false }));
    }

    this.add.text(width / 2, 28, `${this.mapId} - ${this.mapData.name}`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '20px',
      fill: COLORS.textPrimary,
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  createMapArea() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Responsive map panel - takes 75% of width, fleet panel gets the rest
    const mapWidthPercent = 0.75;
    const fleetPanelWidth = Math.min(220, Math.max(180, width * (1 - mapWidthPercent) - 32));
    this.fleetPanelWidth = fleetPanelWidth;
    const panelX = 16;
    const panelY = 72;
    const panelW = width * mapWidthPercent - 24;
    const panelH = height - 180;

    // Store panel bounds for dragging limits
    this.mapPanel = { x: panelX, y: panelY, w: panelW, h: panelH };

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(panelX, panelY, panelW, panelH, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(panelX, panelY, panelW, panelH, 6);

    // Ocean background inside panel
    g.fillStyle(COLORS.ocean, 1);
    g.fillRoundedRect(panelX + 10, panelY + 10, panelW - 20, panelH - 20, 4);

    // Calculate node bounds for scaling
    const nodes = Object.values(this.mapData.nodes);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    });

    // Add padding around nodes
    const nodePadding = 80;
    const nodeRangeX = maxX - minX + nodePadding * 2;
    const nodeRangeY = maxY - minY + nodePadding * 2;

    // Calculate scale to fit nodes in panel (with some padding)
    const innerW = panelW - 40;
    const innerH = panelH - 40;
    const scaleX = innerW / nodeRangeX;
    const scaleY = innerH / nodeRangeY;
    this.mapScale = Math.min(scaleX, scaleY, 1.5); // Cap at 1.5x to prevent huge nodes

    // Calculate scaled map size
    const scaledMapW = nodeRangeX * this.mapScale;
    const scaledMapH = nodeRangeY * this.mapScale;

    // Store for coordinate transforms
    this.nodeOrigin = { x: minX - nodePadding, y: minY - nodePadding };
    this.mapContentSize = { w: scaledMapW, h: scaledMapH };

    // Create draggable map container
    this.mapContainer = this.add.container(panelX + 20, panelY + 20);

    // Create mask for the map area
    const maskShape = this.make.graphics();
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(panelX + 10, panelY + 10, panelW - 20, panelH - 20);
    const mask = maskShape.createGeometryMask();
    this.mapContainer.setMask(mask);

    // Calculate max drag bounds
    this.maxDragX = Math.max(0, scaledMapW - innerW);
    this.maxDragY = Math.max(0, scaledMapH - innerH);

    // Draw paths between nodes
    this.drawPaths();

    // Draw nodes
    this.nodeButtons = [];
    Object.entries(this.mapData.nodes).forEach(([nodeId, node]) => {
      this.createNode(nodeId, node);
    });

    // Draw current position marker
    const currentNodeData = this.mapData.nodes[this.currentNode];
    const markerPos = this.getScaledNodePosition(currentNodeData);
    this.shipMarker = this.add.text(markerPos.x, markerPos.y - 35, '⚓', { fontSize: '28px' }).setOrigin(0.5);
    this.mapContainer.add(this.shipMarker);

    // Animate ship marker
    this.tweens.add({
      targets: this.shipMarker,
      y: this.shipMarker.y - 5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Setup drag controls
    this.setupMapDragging(panelX, panelY, panelW, panelH);
  }

  getScaledNodePosition(node) {
    return {
      x: (node.x - this.nodeOrigin.x) * this.mapScale,
      y: (node.y - this.nodeOrigin.y) * this.mapScale,
    };
  }

  setupMapDragging(panelX, panelY, panelW, panelH) {
    // Track pointer state for drag detection
    this.dragThreshold = 5; // Pixels moved before considered a drag

    this.input.on('pointerdown', (pointer) => {
      // Only start drag tracking if within map panel
      if (pointer.x >= panelX + 10 && pointer.x <= panelX + panelW - 10 &&
          pointer.y >= panelY + 10 && pointer.y <= panelY + panelH - 10) {
        this.potentialDrag = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.dragOffsetStartX = this.mapOffsetX;
        this.dragOffsetStartY = this.mapOffsetY;
      }
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.potentialDrag) return;

      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Start dragging if moved past threshold
      if (distance > this.dragThreshold) {
        this.isDragging = true;
      }

      if (this.isDragging) {
        // Update offset with bounds
        this.mapOffsetX = Phaser.Math.Clamp(this.dragOffsetStartX + dx, -this.maxDragX, 0);
        this.mapOffsetY = Phaser.Math.Clamp(this.dragOffsetStartY + dy, -this.maxDragY, 0);

        // Update container position
        this.mapContainer.x = this.mapPanel.x + 20 + this.mapOffsetX;
        this.mapContainer.y = this.mapPanel.y + 20 + this.mapOffsetY;
      }
    });

    this.input.on('pointerup', () => {
      this.potentialDrag = false;
      // Small delay before resetting isDragging to prevent click-through
      this.time.delayedCall(50, () => {
        this.isDragging = false;
      });
    });

    // Also support mouse wheel for panning
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      if (pointer.x >= panelX && pointer.x <= panelX + panelW &&
          pointer.y >= panelY && pointer.y <= panelY + panelH) {
        this.mapOffsetX = Phaser.Math.Clamp(this.mapOffsetX - deltaX * 0.5, -this.maxDragX, 0);
        this.mapOffsetY = Phaser.Math.Clamp(this.mapOffsetY - deltaY * 0.5, -this.maxDragY, 0);
        this.mapContainer.x = this.mapPanel.x + 20 + this.mapOffsetX;
        this.mapContainer.y = this.mapPanel.y + 20 + this.mapOffsetY;
      }
    });

    // Show drag hint if map is larger than panel
    if (this.maxDragX > 0 || this.maxDragY > 0) {
      const hint = this.add.text(panelX + panelW - 16, panelY + panelH - 16, '↔ Drag to pan', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '11px',
        fill: COLORS.textTertiary,
      }).setOrigin(1);

      // Fade out hint after a moment
      this.time.delayedCall(3000, () => {
        this.tweens.add({
          targets: hint,
          alpha: 0,
          duration: 500,
          onComplete: () => hint.destroy(),
        });
      });
    }
  }

  drawPaths() {
    const g = this.add.graphics();
    g.lineStyle(3 * Math.min(this.mapScale, 1), 0x9b9a97, 0.5);

    Object.entries(this.mapData.nodes).forEach(([nodeId, node]) => {
      if (node.next) {
        const pos = this.getScaledNodePosition(node);
        node.next.forEach(nextId => {
          const nextNode = this.mapData.nodes[nextId];
          if (nextNode) {
            const nextPos = this.getScaledNodePosition(nextNode);
            g.lineBetween(pos.x, pos.y, nextPos.x, nextPos.y);
          }
        });
      }
    });

    this.mapContainer.add(g);
  }

  createNode(nodeId, node) {
    const pos = this.getScaledNodePosition(node);
    const isCurrentNode = nodeId === this.currentNode;
    const currentNodeData = this.mapData.nodes[this.currentNode];
    const isReachable = currentNodeData.next && currentNodeData.next.includes(nodeId);
    const isVisited = nodeId === 'start' || this.isNodeVisited(nodeId);

    const container = this.add.container(pos.x, pos.y);

    // Scale node size based on map scale
    const baseSize = node.type === 'boss' ? 45 : 35;
    const nodeSize = baseSize * Math.min(this.mapScale, 1.2);
    const lineWidth = 3 * Math.min(this.mapScale, 1);

    // Node background
    const bg = this.add.graphics();
    let nodeColor = 0x9b9a97; // Default gray

    if (nodeId === 'start') {
      nodeColor = 0x4dab9a;
    } else if (node.type === 'boss') {
      nodeColor = 0xe03e3e;
    } else if (node.type === 'resource') {
      nodeColor = 0xcb912f;
    } else if (node.type === 'combat') {
      nodeColor = 0x2eaadc;
    }

    if (isCurrentNode) {
      // Highlight current node
      bg.fillStyle(nodeColor, 1);
      bg.fillCircle(0, 0, nodeSize + 5);
      bg.fillStyle(0xffffff, 1);
      bg.fillCircle(0, 0, nodeSize);
      bg.fillStyle(nodeColor, 1);
      bg.fillCircle(0, 0, nodeSize - 5);
    } else if (isReachable) {
      bg.lineStyle(lineWidth, nodeColor, 1);
      bg.strokeCircle(0, 0, nodeSize);
      bg.fillStyle(0xffffff, 0.9);
      bg.fillCircle(0, 0, nodeSize - 3);
    } else {
      bg.fillStyle(nodeColor, isVisited ? 0.3 : 0.15);
      bg.fillCircle(0, 0, nodeSize);
    }

    container.add(bg);

    // Node icon - scale font size
    let icon = '';
    if (nodeId === 'start') icon = '🚢';
    else if (node.type === 'boss') icon = '👑';
    else if (node.type === 'resource') icon = '📦';
    else if (node.type === 'combat') icon = '⚔️';

    const iconFontSize = Math.round((node.type === 'boss' ? 24 : 20) * Math.min(this.mapScale, 1.2));
    const iconText = this.add.text(0, 0, icon, {
      fontSize: `${iconFontSize}px`,
    }).setOrigin(0.5);
    container.add(iconText);

    // Node label - scale font size
    const labelFontSize = Math.round(12 * Math.min(this.mapScale, 1.2));
    const label = this.add.text(0, nodeSize + 12, nodeId === 'start' ? 'Start' : nodeId, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: `${labelFontSize}px`,
      fill: isCurrentNode ? COLORS.textPrimary : COLORS.textTertiary,
      fontStyle: isCurrentNode ? 'bold' : 'normal',
    }).setOrigin(0.5);
    container.add(label);

    this.mapContainer.add(container);

    // Make reachable nodes clickable - create hit area that moves with container
    if (isReachable && !isCurrentNode) {
      const hitArea = this.add.circle(0, 0, nodeSize, 0x000000, 0).setInteractive();
      container.add(hitArea);

      hitArea.on('pointerover', () => {
        if (this.isDragging) return;
        bg.clear();
        bg.fillStyle(nodeColor, 1);
        bg.fillCircle(0, 0, nodeSize);
        bg.fillStyle(0xffffff, 1);
        bg.fillCircle(0, 0, nodeSize - 4);
        this.showNodePreview(node);
      });

      hitArea.on('pointerout', () => {
        bg.clear();
        bg.lineStyle(lineWidth, nodeColor, 1);
        bg.strokeCircle(0, 0, nodeSize);
        bg.fillStyle(0xffffff, 0.9);
        bg.fillCircle(0, 0, nodeSize - 3);
        this.hideNodePreview();
      });

      hitArea.on('pointerdown', () => {
        // Mark that we started on this node
        this.clickedNode = nodeId;
      });

      hitArea.on('pointerup', () => {
        // Only advance if we clicked this node and didn't drag
        if (this.clickedNode === nodeId && !this.isDragging) {
          // Small delay to ensure drag state is finalized
          this.time.delayedCall(10, () => {
            if (!this.isDragging) {
              this.advanceToNode(nodeId);
            }
          });
        }
        this.clickedNode = null;
      });

      this.nodeButtons.push({ nodeId, hitArea, container });
    }
  }

  isNodeVisited(nodeId) {
    // For now, just check if we've been to start
    return nodeId === 'start';
  }

  showNodePreview(node) {
    if (this.previewContainer) this.previewContainer.destroy();

    const width = window.innerWidth;
    const height = window.innerHeight;
    this.previewContainer = this.add.container(width - 140, height / 2);

    const bg = this.add.graphics();
    bg.fillStyle(0x37352f, 0.9);
    bg.fillRoundedRect(-120, -80, 240, 160, 8);

    let title = '';
    let info = '';
    if (node.type === 'combat' || node.type === 'boss') {
      title = node.type === 'boss' ? 'Boss Battle' : 'Combat';
      info = `${node.enemies.length} enemies\nLv.${Math.min(...node.enemyLevels)}-${Math.max(...node.enemyLevels)}`;
    } else if (node.type === 'resource') {
      title = 'Resource Node';
      const rewards = [];
      if (node.reward.fuel) rewards.push(`+${node.reward.fuel} Fuel`);
      if (node.reward.tickets) {
        // Check if tickets already collected for this node
        // We need to find the nodeId from the node object - search through map nodes
        const nodeId = Object.keys(this.mapData.nodes).find(id => this.mapData.nodes[id] === node);
        if (nodeId && Storage.hasCollectedResourceNode(this.mapId, nodeId)) {
          rewards.push(`(Tickets already collected)`);
        } else {
          rewards.push(`+${node.reward.tickets} Tickets`);
        }
      }
      info = rewards.join('\n');
    }

    const titleText = this.add.text(0, -50, title, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const infoText = this.add.text(0, 0, info, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '14px',
      fill: '#d4d4d4',
      align: 'center',
    }).setOrigin(0.5);

    const hint = this.add.text(0, 50, 'Click to advance', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: '#9b9a97',
    }).setOrigin(0.5);

    this.previewContainer.add([bg, titleText, infoText, hint]);
  }

  hideNodePreview() {
    if (this.previewContainer) {
      this.previewContainer.destroy();
      this.previewContainer = null;
    }
  }

  createFleetStatus() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    // Fleet panel on the right - fills remaining space after map
    const mapWidthPercent = 0.75;
    const panelX = width * mapWidthPercent;
    const panelY = 72;
    const panelW = width * (1 - mapWidthPercent) - 16;
    const panelH = height - 180;

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRoundedRect(panelX, panelY, panelW, panelH, 6);
    g.lineStyle(1, COLORS.border, 1);
    g.strokeRoundedRect(panelX, panelY, panelW, panelH, 6);

    this.add.text(panelX + 16, panelY + 20, 'Fleet Status', {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: COLORS.textTertiary,
      fontStyle: 'bold',
    });

    const fleet = Storage.get('fleet').filter(id => id !== null);

    fleet.forEach((shipId, index) => {
      const shipData = getShipById(shipId);
      const savedData = Storage.getShipData(shipId);
      if (!shipData || !savedData) return;

      const stats = getShipStats(shipData, savedData.level);
      const maxHp = stats.hp;

      // Use sortie HP if available, otherwise storage HP
      let currentHp = this.fleetHp[shipId] !== undefined
        ? this.fleetHp[shipId]
        : Storage.getShipCurrentHp(shipId, maxHp);

      const damageState = getDamageState(currentHp, maxHp);
      const rarity = RARITY[shipData.rarity];

      const y = panelY + 50 + index * 65;

      // Ship name
      this.add.text(panelX + 16, y, shipData.name, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '13px',
        fill: COLORS.textPrimary,
      });

      // Level
      this.add.text(panelX + panelW - 16, y, `Lv.${savedData.level}`, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '11px',
        fill: COLORS.textTertiary,
      }).setOrigin(1, 0);

      // HP bar background
      const barBg = this.add.graphics();
      barBg.fillStyle(0xe9e9e7, 1);
      barBg.fillRoundedRect(panelX + 16, y + 20, panelW - 32, 12, 3);

      // HP bar fill
      const hpPercent = currentHp / maxHp;
      const barFill = this.add.graphics();
      barFill.fillStyle(damageState.color, 1);
      barFill.fillRoundedRect(panelX + 16, y + 20, (panelW - 32) * hpPercent, 12, 3);

      // HP text
      this.add.text(panelX + panelW / 2 + 8, y + 26, `${currentHp}/${maxHp}`, {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '10px',
        fill: COLORS.textPrimary,
      }).setOrigin(0.5);
    });
  }

  createBottomBar() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const g = this.add.graphics();

    g.fillStyle(COLORS.bgPrimary, 1);
    g.fillRect(0, height - 90, width, 90);
    g.fillStyle(COLORS.border, 1);
    g.fillRect(0, height - 90, width, 1);

    const currentNodeData = this.mapData.nodes[this.currentNode];

    // Show available actions
    if (this.currentNode === 'start') {
      this.add.text(width / 2, height - 55, 'Select a node to advance', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '15px',
        fill: COLORS.textSecondary,
      }).setOrigin(0.5);
    } else if (currentNodeData.next && currentNodeData.next.length > 0) {
      this.add.text(width / 2, height - 55, 'Choose your next destination', {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '15px',
        fill: COLORS.textSecondary,
      }).setOrigin(0.5);
    }

    // Map info
    this.add.text(24, height - 30, `First Clear: +${this.mapData.firstClearTickets} tickets`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: Storage.isMapCleared(this.mapId) ? COLORS.textTertiary : COLORS.warning,
    });

    this.add.text(width - 24, height - 30, `S-Rank Bonus: +${this.mapData.sRankBonus} tickets`, {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '12px',
      fill: Storage.hasMapSRank(this.mapId) ? COLORS.textTertiary : COLORS.success,
    }).setOrigin(1, 0);
  }

  advanceToNode(nodeId) {
    const node = this.mapData.nodes[nodeId];

    if (node.type === 'resource') {
      // Collect resources and continue
      this.collectResources(node.reward, nodeId);
    } else if (node.type === 'combat' || node.type === 'boss') {
      // Start battle
      this.scene.start('BattleScene', {
        mapId: this.mapId,
        nodeId: nodeId,
        fleetHp: this.fleetHp,
        isBoss: node.type === 'boss',
      });
    }
  }

  collectResources(reward, nodeId) {
    // Fuel is always given
    if (reward.fuel) {
      Storage.addCurrency(reward.fuel);
    }

    // Tickets are only given once per node
    let ticketsGiven = 0;
    if (reward.tickets && !Storage.hasCollectedResourceNode(this.mapId, nodeId)) {
      Storage.addTickets(reward.tickets);
      Storage.markResourceNodeCollected(this.mapId, nodeId);
      ticketsGiven = reward.tickets;
    }

    // Show collection animation
    const width = window.innerWidth;
    const height = window.innerHeight;
    const rewards = [];
    if (reward.fuel) rewards.push(`+${reward.fuel} Fuel`);
    if (ticketsGiven > 0) rewards.push(`+${ticketsGiven} Tickets`);

    const msg = this.add.text(width / 2, height / 2, rewards.join('\n'), {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: '24px',
      fill: '#ffffff',
      backgroundColor: '#4dab9a',
      padding: { x: 20, y: 15 },
      align: 'center',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: msg,
      y: msg.y - 50,
      alpha: 0,
      duration: 1500,
      onComplete: () => {
        msg.destroy();
        // Move to this node and update
        this.currentNode = nodeId;
        this.scene.restart({
          mapId: this.mapId,
          currentNode: nodeId,
          fleetHp: this.fleetHp,
        });
      },
    });
  }

  retreatFromMap() {
    // Save current HP to storage
    Object.entries(this.fleetHp).forEach(([shipId, hp]) => {
      Storage.setShipHp(shipId, hp);
    });

    // Explicitly clear map/node data to show sortie selection
    this.scene.start('BattleScene', { mapId: null, nodeId: null, fleetHp: {}, isBoss: false });
  }
}
