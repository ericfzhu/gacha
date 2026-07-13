import { Application, Container, Graphics, Text } from 'pixi.js';

export async function createPixiGame(host) {
  const app = new Application();
  await app.init({
    background: '#0e1a2b',
    resizeTo: host,
    antialias: true,
  });

  host.appendChild(app.canvas);

  const root = new Container();
  app.stage.addChild(root);

  const ocean = new Graphics();
  root.addChild(ocean);

  const title = new Text({
    text: 'Turn-Based Naval Combat',
    style: {
      fill: '#e8edf5',
      fontSize: 18,
      fontFamily: 'IBM Plex Sans',
      fontWeight: '600',
    },
  });
  title.position.set(20, 14);
  app.stage.addChild(title);

  const leftLane = new Container();
  const rightLane = new Container();
  root.addChild(leftLane, rightLane);

  const battleText = new Text({
    text: 'Awaiting battle...',
    style: {
      fill: '#d1d5db',
      fontSize: 14,
      fontFamily: 'IBM Plex Sans',
    },
  });
  battleText.position.set(20, 42);
  app.stage.addChild(battleText);

  function drawBackdrop() {
    ocean.clear();
    ocean.rect(0, 0, app.screen.width, app.screen.height).fill(0x10243a);
    ocean.rect(0, app.screen.height * 0.5, app.screen.width, app.screen.height * 0.5).fill(0x173a59);
    ocean.setAlpha(0.95);
  }

  function drawFleet(container, units, color, isEnemy) {
    container.removeChildren();
    const baseX = isEnemy ? app.screen.width - 320 : 80;
    const colW = 96;

    units.forEach((unit, idx) => {
      const x = baseX + (idx % 3) * colW;
      const y = 100 + Math.floor(idx / 3) * 105;

      const hull = new Graphics();
      hull.roundRect(x, y, 84, 60, 8).fill(color);
      hull.roundRect(x + 8, y + 8, 68, 18, 4).fill(0x0b1220);
      hull.alpha = unit.hp > 0 ? 1 : 0.35;
      container.addChild(hull);

      const name = new Text({
        text: unit.name,
        style: {
          fill: '#e5e7eb',
          fontSize: 11,
          fontFamily: 'IBM Plex Sans',
        },
      });
      name.position.set(x + 6, y + 30);
      container.addChild(name);

      const hp = new Text({
        text: `HP ${Math.max(0, unit.hp)}/${unit.maxHp}`,
        style: {
          fill: unit.hp > 0 ? '#93c5fd' : '#fca5a5',
          fontSize: 10,
          fontFamily: 'IBM Plex Sans',
        },
      });
      hp.position.set(x + 6, y + 45);
      container.addChild(hp);
    });
  }

  drawBackdrop();

  const renderer = {
    setBattleView(view) {
      if (!view) {
        battleText.text = 'Awaiting battle...';
        leftLane.removeChildren();
        rightLane.removeChildren();
        return;
      }

      battleText.text = `${view.mapId || ''} ${view.nodeId || ''} - ${view.result || ''}`.trim();
      drawFleet(leftLane, view.playerUnits || [], 0x1f4d7a, false);
      drawFleet(rightLane, view.enemyUnits || [], 0x6f2c3f, true);
    },

    destroy() {
      app.destroy(true, { children: true, texture: true });
    },
  };

  app.ticker.add(() => {
    drawBackdrop();
  });

  return renderer;
}
