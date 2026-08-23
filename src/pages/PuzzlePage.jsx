import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ORB_BY_ID, ORB_TYPES, PuzzleEngine } from '../puzzle/puzzleEngine.js';

const WIDTH = 450;
const HEIGHT = 820;
const BOARD_TOP = 440;
const MAX_BOARD_WIDTH = 420;
const MAX_BOARD_HEIGHT = 350;
const SKILL_RECT = { x: 291, y: 353, width: 144, height: 64 };
const RESET_RECT = { x: 15, y: 353, width: 48, height: 48 };
const START_RECT = { x: 95, y: 541, width: 260, height: 58 };
const PAD_ORB_SPRITES = Object.freeze({ fire: 2, water: 3, wood: 4, light: 5, dark: 6, heart: 7, jammer: 8, poison: 9, mortalPoison: 10, bomb: 20 });
let activePadOrbAtlas = null;
let activePadMonsterArt = [];

const BOARD_PRESETS = Object.freeze({
  normal: { columns: 6, rows: 5, label: '6 × 5' },
  expanded: { columns: 7, rows: 6, label: '7 × 6' },
});

function boardLayout(engine) {
  const cell = Math.min(70, MAX_BOARD_WIDTH / engine.columns, MAX_BOARD_HEIGHT / engine.rows);
  const width = cell * engine.columns;
  const height = cell * engine.rows;
  return { cell, width, height, x: (WIDTH - width) / 2, y: BOARD_TOP };
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, r);
}

function drawOrbState(ctx, orb, x, y, radius, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  if (orb.thornActive && orb.thornPercent > 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(220, 230, 239, .92)';
    ctx.strokeStyle = 'rgba(42, 52, 65, .92)';
    ctx.lineWidth = Math.max(1, radius * 0.055);
    for (let index = 0; index < 10; index += 1) {
      ctx.save();
      ctx.rotate(index * Math.PI / 5);
      ctx.beginPath();
      ctx.moveTo(-radius * 0.12, -radius * 0.82);
      ctx.lineTo(0, -radius * 1.14);
      ctx.lineTo(radius * 0.12, -radius * 0.82);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  if (orb.nail) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.55);
    ctx.fillStyle = 'rgba(232, 237, 241, .96)';
    ctx.strokeStyle = 'rgba(46, 54, 65, .9)';
    ctx.lineWidth = Math.max(1, radius * 0.055);
    ctx.beginPath();
    ctx.roundRect(-radius * 0.1, -radius * 0.56, radius * 0.2, radius * 0.82, radius * 0.05);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-radius * 0.28, -radius * 0.55);
    ctx.lineTo(radius * 0.28, -radius * 0.55);
    ctx.lineTo(radius * 0.18, -radius * 0.72);
    ctx.lineTo(-radius * 0.18, -radius * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  if (activePadOrbAtlas && orb.enhanced) {
    const sprite = activePadOrbAtlas.sprites[22];
    ctx.drawImage(activePadOrbAtlas.image, sprite.x, sprite.y, sprite.width, sprite.height,
      x + radius * 0.12, y - radius * 0.76, radius * 0.86, radius * 0.71);
  } else if (orb.enhanced) {
    ctx.fillStyle = '#fff3a3';
    ctx.font = `900 ${Math.round(radius * 0.75)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('+', x + radius * 0.43, y - radius * 0.25);
  }
  if (activePadOrbAtlas && orb.locked) {
    const sprite = activePadOrbAtlas.sprites[25];
    ctx.drawImage(activePadOrbAtlas.image, sprite.x, sprite.y, sprite.width, sprite.height,
      x - radius * 0.45, y - radius * 0.42, radius * 0.9, radius * 0.78);
  } else if (orb.locked) {
    ctx.fillStyle = 'rgba(253, 221, 96, .96)';
    ctx.font = `${Math.round(radius * 0.68)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('▣', x, y + radius * 0.24);
  }
  if (orb.blind) {
    const shade = ctx.createRadialGradient(
      x - radius * 0.25, y - radius * 0.28, radius * 0.08,
      x, y, radius * 1.02,
    );
    shade.addColorStop(0, 'rgba(68, 74, 86, .98)');
    shade.addColorStop(0.55, 'rgba(15, 18, 24, .99)');
    shade.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = shade;
    ctx.strokeStyle = 'rgba(154, 164, 181, .72)';
    ctx.lineWidth = Math.max(1, radius * 0.055);
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.94, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (orb.blindCountdown > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, .94)';
      ctx.font = `800 ${Math.round(radius * 0.78)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(orb.blindCountdown), x, y + radius * 0.03);
    }
  }
  ctx.restore();
}

function drawOrb(ctx, orb, x, y, radius, alpha = 1, selected = false) {
  const meta = ORB_BY_ID[orb.type];
  const atlasSprite = activePadOrbAtlas?.sprites[PAD_ORB_SPRITES[orb.type]];
  if (atlasSprite) {
    const diameter = radius * (orb.type === 'heart' ? 2.16 : 2.28);
    const drawWidth = orb.type === 'bomb' ? diameter * atlasSprite.width / atlasSprite.height : diameter;
    const drawHeight = diameter;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = 'rgba(9, 18, 29, .48)';
    ctx.shadowBlur = selected ? 15 : 7;
    ctx.shadowOffsetY = selected ? 7 : 4;
    ctx.drawImage(
      activePadOrbAtlas.image,
      atlasSprite.x, atlasSprite.y, atlasSprite.width, atlasSprite.height,
      x - drawWidth / 2, y - drawHeight / 2, drawWidth, drawHeight,
    );
    if (selected) {
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255,255,255,.94)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, diameter * 0.47, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    drawOrbState(ctx, orb, x, y, radius, alpha);
    return;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = 'rgba(9, 18, 29, .36)';
  ctx.shadowBlur = selected ? 15 : 7;
  ctx.shadowOffsetY = selected ? 7 : 4;
  const gradient = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.42, radius * 0.08, x, y, radius);
  gradient.addColorStop(0, meta.highlight);
  gradient.addColorStop(0.38, meta.color);
  gradient.addColorStop(1, '#243044');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = selected ? 3 : 1.5;
  ctx.strokeStyle = selected ? 'rgba(255,255,255,.94)' : 'rgba(255,255,255,.42)';
  ctx.stroke();
  if (orb.type === 'heart') {
    const scale = radius / 27;
    ctx.save();
    ctx.translate(x, y + 1);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(255,245,250,.92)';
    ctx.beginPath();
    ctx.moveTo(0, 17);
    ctx.bezierCurveTo(-4, 11, -17, 4, -17, -6);
    ctx.bezierCurveTo(-17, -17, -5, -20, 0, -11);
    ctx.bezierCurveTo(5, -20, 17, -17, 17, -6);
    ctx.bezierCurveTo(17, 4, 4, 11, 0, 17);
    ctx.fill();
    ctx.restore();
  } else if (orb.type === 'bomb') {
    ctx.fillStyle = 'rgba(35, 40, 48, .86)';
    ctx.font = `900 ${Math.round(radius * 1.08)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✹', x, y + radius * 0.04);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,.68)';
    ctx.beginPath();
    ctx.ellipse(x - radius * 0.28, y - radius * 0.33, radius * 0.18, radius * 0.11, -0.55, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  drawOrbState(ctx, orb, x, y, radius, alpha);
}

function drawBar(ctx, x, y, width, height, ratio, colors) {
  roundedRect(ctx, x, y, width, height, height / 2);
  ctx.fillStyle = 'rgba(15, 25, 38, .58)';
  ctx.fill();
  const fillWidth = Math.max(0, width * Math.max(0, Math.min(1, ratio)));
  if (fillWidth > 0) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    roundedRect(ctx, x, y, fillWidth, height, height / 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,.16)';
  ctx.lineWidth = 1;
  roundedRect(ctx, x, y, width, height, height / 2);
  ctx.stroke();
}

function drawEnemy(ctx, enemy, index, target, time) {
  const x = index === 0 ? 132 : 318;
  const y = 154;
  const alive = enemy.hp > 0;
  ctx.save();
  ctx.globalAlpha = alive ? 1 : 0.2;
  ctx.translate(x, y + Math.sin(time * 2 + index) * 3);
  ctx.shadowColor = 'rgba(3, 9, 19, .46)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 10;
  const monsterArt = activePadMonsterArt[index];
  if (monsterArt) {
    const { bounds } = monsterArt;
    const scale = Math.min(146 / bounds.width, 140 / bounds.height);
    const width = bounds.width * scale;
    const height = bounds.height * scale;
    ctx.drawImage(monsterArt.image, bounds.x, bounds.y, bounds.width, bounds.height,
      -width / 2, -height / 2, width, height);
  } else {
    const meta = ORB_BY_ID[enemy.attribute];
    const gradient = ctx.createRadialGradient(-18, -24, 8, 0, 0, 66);
    gradient.addColorStop(0, meta.highlight);
    gradient.addColorStop(0.45, meta.color);
    gradient.addColorStop(1, '#1a2435');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-55, 38);
    ctx.quadraticCurveTo(-72, -8, -35, -50);
    ctx.quadraticCurveTo(0, -74, 35, -50);
    ctx.quadraticCurveTo(72, -8, 55, 38);
    ctx.quadraticCurveTo(0, 67, -55, 38);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#f8f4df';
    ctx.beginPath();
    ctx.ellipse(-22, -6, 12, 16, -0.12, 0, Math.PI * 2);
    ctx.ellipse(22, -6, 12, 16, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#192033';
    ctx.beginPath();
    ctx.arc(-19, -4, 5, 0, Math.PI * 2);
    ctx.arc(19, -4, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255,255,255,.7)';
  ctx.lineWidth = target === index && alive ? 4 : 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#f5f0df';
  ctx.font = '700 13px "Noto Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(enemy.name, x, 233);
  drawBar(ctx, x - 72, 241, 144, 9, enemy.hp / enemy.maxHp, ['#f16868', '#e9ad58']);
  ctx.fillStyle = '#d7dce7';
  ctx.font = '600 10px "Noto Sans", sans-serif';
  ctx.fillText(`${Math.max(0, enemy.hp).toLocaleString()} / ${enemy.maxHp.toLocaleString()}`, x, 264);
  const enemyStatus = [];
  if (Number(enemy.attackBoostTurns || 0) > 0) {
    enemyStatus.push(`ATK ${enemy.attackBoostPercent}% ${enemy.attackBoostTurns}T`);
  }
  if (Number(enemy.statusShieldTurns || 0) > 0) {
    enemyStatus.push(`IMMUNE ${enemy.statusShieldTurns}T`);
  }
  if (Number(enemy.attributeAbsorbTurns || 0) > 0) {
    const attributes = ORB_TYPES.slice(0, 6)
      .filter((_, attributeIndex) => (enemy.attributeAbsorbMask & (1 << attributeIndex)) !== 0)
      .map((orb) => orb.code)
      .join('/');
    enemyStatus.push(`ABS ${attributes} ${enemy.attributeAbsorbTurns}T`);
  }
  if (Number(enemy.comboAbsorbTurns || 0) > 0) {
    enemyStatus.push(`ABS ≤${enemy.comboAbsorbThreshold}C ${enemy.comboAbsorbTurns}T`);
  }
  if (Number(enemy.damageVoidTurns || 0) > 0) {
    enemyStatus.push(`VOID ≥${Number(enemy.damageVoidThreshold || 0).toLocaleString()} ${enemy.damageVoidTurns}T`);
  }
  if (enemyStatus.length > 0) {
    ctx.fillStyle = '#bfe9ff';
    ctx.font = '800 9px "Barlow Condensed", sans-serif';
    ctx.fillText(enemyStatus.join(' · '), x, 278);
  }
  if (alive) {
    ctx.fillStyle = enemy.counter === 1 ? '#ff6f62' : '#f4cf69';
    ctx.beginPath();
    ctx.arc(x + 55, 101, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#172033';
    ctx.font = '800 18px "Barlow Condensed", sans-serif';
    ctx.fillText(enemy.counter, x + 55, 107);
  }
}

function drawParty(ctx, engine) {
  engine.party.forEach((member, index) => {
    const x = 48 + index * 74;
    const meta = ORB_BY_ID[member.attribute];
    const gradient = ctx.createLinearGradient(0, 283, 0, 337);
    gradient.addColorStop(0, meta.color);
    gradient.addColorStop(1, '#1d293c');
    roundedRect(ctx, x - 29, 284, 58, 54, 12);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.24)';
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '800 18px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(member.name[0], x, 309);
    ctx.font = '600 9px "Noto Sans", sans-serif';
    ctx.fillStyle = '#dce4ef';
    ctx.fillText(member.attack, x, 328);
    if (Number(member.bindTurns || 0) > 0) {
      roundedRect(ctx, x - 29, 284, 58, 54, 12);
      ctx.fillStyle = 'rgba(12, 15, 24, .72)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(227, 126, 236, .82)';
      ctx.stroke();
      ctx.font = '900 11px "Barlow Condensed", sans-serif';
      ctx.fillStyle = '#f2b8ff';
      ctx.fillText(`BIND ${member.bindTurns}`, x, 315);
    }
  });
}

function drawButton(ctx, rect, label, sublabel, enabled = true, accent = false) {
  const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height);
  gradient.addColorStop(0, enabled ? (accent ? '#64c9dd' : '#445773') : '#313a4c');
  gradient.addColorStop(1, enabled ? (accent ? '#24768e' : '#28364d') : '#242b3a');
  roundedRect(ctx, rect.x, rect.y, rect.width, rect.height, 12);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = enabled ? 'rgba(255,255,255,.32)' : 'rgba(255,255,255,.1)';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = enabled ? '#fff' : '#727d91';
  ctx.font = '800 14px "Barlow Condensed", sans-serif';
  ctx.fillText(label, rect.x + rect.width / 2, rect.y + rect.height / 2 - (sublabel ? 3 : -5));
  if (sublabel) {
    ctx.font = '600 9px "Noto Sans", sans-serif';
    ctx.fillStyle = enabled ? '#cfe7ed' : '#626c7e';
    ctx.fillText(sublabel, rect.x + rect.width / 2, rect.y + rect.height / 2 + 14);
  }
}

function drawReadyOverlay(ctx, engine) {
  ctx.fillStyle = 'rgba(8, 14, 27, .78)';
  roundedRect(ctx, 36, 185, 378, 442, 26);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.14)';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4c95d';
  ctx.font = '700 12px "Barlow Condensed", sans-serif';
  ctx.fillText('BROWSER MECHANICS RECONSTRUCTION', 225, 226);
  ctx.fillStyle = '#fff';
  ctx.font = '800 36px "Barlow Condensed", sans-serif';
  ctx.fillText('ORB BATTLE LAB', 225, 272);
  ctx.fillStyle = '#c4ccda';
  ctx.font = '500 14px "Noto Sans", sans-serif';
  const lines = [
    `Drag one orb freely through the ${engine.columns} × ${engine.rows} board.`,
    'Crossed cells swap. Release to resolve the turn.',
    'Match 3+ · Hearts heal · 5+ hits every enemy.',
    'Cascades, attributes, skills, and enemy timers apply.',
  ];
  lines.forEach((line, index) => ctx.fillText(line, 225, 326 + index * 31));
  drawButton(ctx, START_RECT, 'BEGIN BATTLE', 'Touch, mouse, or trackpad', true, true);
  ctx.fillStyle = '#7f8ca2';
  ctx.font = '600 10px "Noto Sans", sans-serif';
  ctx.fillText('R reset  ·  F fullscreen', 225, 614);
}

function drawEndOverlay(ctx, engine) {
  ctx.fillStyle = 'rgba(8, 14, 27, .82)';
  roundedRect(ctx, 46, 248, 358, 264, 24);
  ctx.fill();
  ctx.strokeStyle = engine.mode === 'victory' ? 'rgba(244,201,93,.75)' : 'rgba(240,104,104,.65)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = engine.mode === 'victory' ? '#f4c95d' : '#ff827b';
  ctx.font = '800 42px "Barlow Condensed", sans-serif';
  ctx.fillText(engine.mode === 'victory' ? 'VICTORY' : 'DEFEAT', 225, 326);
  ctx.fillStyle = '#d8dfeb';
  ctx.font = '500 14px "Noto Sans", sans-serif';
  ctx.fillText(engine.message, 225, 366);
  drawButton(ctx, { x: 105, y: 404, width: 240, height: 58 }, 'PLAY AGAIN', 'New deterministic board', true, true);
}

function render(ctx, engine) {
  const board = boardLayout(engine);
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  const backdrop = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  backdrop.addColorStop(0, '#111a30');
  backdrop.addColorStop(0.52, '#26324a');
  backdrop.addColorStop(0.53, '#151d2e');
  backdrop.addColorStop(1, '#0d1321');
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,.025)';
  for (let x = -HEIGHT; x < WIDTH; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + HEIGHT, HEIGHT);
    ctx.strokeStyle = 'rgba(255,255,255,.025)';
    ctx.stroke();
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = '#f0f3f8';
  ctx.font = '800 20px "Barlow Condensed", sans-serif';
  ctx.fillText('ORB BATTLE LAB', 16, 29);
  ctx.fillStyle = '#8895aa';
  ctx.font = '600 9px "Noto Sans", sans-serif';
  ctx.fillText('CORE ENGINE · BUILD 21.9', 17, 43);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#d9dfeb';
  ctx.font = '700 13px "Barlow Condensed", sans-serif';
  ctx.fillText(`TURN ${engine.turn}`, 434, 29);
  ctx.fillStyle = '#8996ab';
  ctx.font = '600 9px "Noto Sans", sans-serif';
  ctx.fillText(engine.phase.toUpperCase(), 434, 43);
  if (engine.moveTimeReduction) {
    ctx.fillStyle = '#f6b9ff';
    ctx.font = '700 9px "Barlow Condensed", sans-serif';
    ctx.fillText(
      `MOVE ${engine.moveTime.toFixed(2)}s · ${engine.moveTimeReduction.turnsRemaining}T`,
      434,
      57,
    );
  }
  const activeSkyfallRules = Object.values(engine.skyfallRateRules || {}).filter(Boolean);
  if (activeSkyfallRules.length > 0) {
    const skyfallText = activeSkyfallRules.map((rule) => {
      const types = ORB_TYPES.slice(0, 9)
        .filter((_, type) => (rule.typeMask & (1 << type)) !== 0)
        .map((orb) => orb.code)
        .join('/');
      return `${types} ${rule.chancePercent}% ${rule.turnsRemaining}T`;
    }).join(' · ');
    ctx.fillStyle = '#bfe9ff';
    ctx.font = '700 9px "Barlow Condensed", sans-serif';
    ctx.fillText(`SKY ${skyfallText}`, 434, engine.moveTimeReduction ? 69 : 57);
  }

  const visibleTarget = engine.manualTarget ? engine.targetEnemy : -1;
  engine.enemies.forEach((enemy, index) => drawEnemy(ctx, enemy, index, visibleTarget, engine.visualTime));
  drawParty(ctx, engine);

  drawBar(ctx, 16, 344, 259, 12, engine.player.hp / engine.player.maxHp, ['#67d283', '#b5e35b']);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ecf3e5';
  ctx.font = '700 11px "Noto Sans", sans-serif';
  // Keep the live HP readout clear of the 48px reset hit target below the bar.
  ctx.fillText(`HP ${engine.player.hp.toLocaleString()} / ${engine.player.maxHp.toLocaleString()}`, 72, 376);
  drawButton(ctx, RESET_RECT, '↻', '', true, false);
  const skillSealed = Number(engine.skillSealTurns || 0) > 0;
  const skillReady = engine.skill.cooldown === 0 && !skillSealed
    && engine.mode === 'playing' && engine.phase === 'input' && !engine.drag;
  const skillStatus = skillSealed
    ? `SEALED · ${engine.skillSealTurns} turn${engine.skillSealTurns === 1 ? '' : 's'}`
    : skillReady
      ? 'READY · no turn cost'
      : `${engine.skill.cooldown} turn cooldown`;
  drawButton(ctx, SKILL_RECT, engine.skill.name.toUpperCase(), skillStatus, skillReady, skillReady);

  if (engine.drag) {
    const ratio = engine.drag.remaining / engine.moveTime;
    drawBar(ctx, board.x, 421, board.width, 9, ratio, ratio < 0.28 ? ['#ff6a66', '#ffba54'] : ['#5dd8e9', '#79efaa']);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#eff8ff';
    ctx.font = '800 12px "Barlow Condensed", sans-serif';
    ctx.fillText(`${engine.drag.remaining.toFixed(1)}s`, 433, 416);
  } else {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#aeb8ca';
    ctx.font = '600 11px "Noto Sans", sans-serif';
    ctx.fillText(engine.message, 225, 429);
  }

  for (let row = 0; row < engine.rows; row += 1) {
    for (let column = 0; column < engine.columns; column += 1) {
      const x = board.x + column * board.cell;
      const y = board.y + row * board.cell;
      ctx.fillStyle = (row + column) % 2 ? '#222b3d' : '#1b2435';
      ctx.fillRect(x, y, board.cell, board.cell);
      ctx.strokeStyle = 'rgba(255,255,255,.055)';
      ctx.strokeRect(x + 0.5, y + 0.5, board.cell - 1, board.cell - 1);
      const orb = engine.board[row][column];
      if (!orb) continue;
      const isHeld = engine.drag?.row === row && engine.drag?.column === column;
      if (isHeld) {
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        ctx.beginPath();
        ctx.arc(x + board.cell / 2, y + board.cell / 2, board.cell * 0.36, 0, Math.PI * 2);
        ctx.fill();
      } else drawOrb(ctx, orb, x + board.cell / 2, y + board.cell / 2, board.cell * 0.386);
    }
  }

  if (engine.drag) {
    const held = engine.board[engine.drag.row][engine.drag.column];
    drawOrb(ctx, held, engine.drag.pointerX, engine.drag.pointerY, 34, 0.9, true);
  }

  if (engine.comboCount > 0 && engine.phase !== 'input') {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#15223b';
    ctx.shadowBlur = 8;
    ctx.font = '900 38px "Barlow Condensed", sans-serif';
    ctx.fillText(`${engine.comboCount} COMBO`, 225, 405);
    ctx.shadowColor = 'transparent';
  }

  engine.floatingText.forEach((item, index) => {
    const t = item.age / 1.15;
    const isPlayerHp = item.kind === 'playerDamage' || item.kind === 'heal'
      || item.kind === 'poison' || item.kind === 'bomb' || item.kind === 'thorn';
    const x = isPlayerHp ? 225 : item.enemy === 0 ? 132 : 318;
    const y = isPlayerHp ? 366 - t * 30 : 122 - t * 44 - index * 2;
    ctx.globalAlpha = Math.max(0, 1 - t);
    ctx.textAlign = 'center';
    ctx.font = '900 22px "Barlow Condensed", sans-serif';
    ctx.fillStyle = item.kind === 'heal' || item.kind === 'revive' ? '#83ef9d' : item.kind === 'poison' ? '#d995ef' : item.kind === 'bomb' ? '#ffb45f' : item.kind === 'thorn' || item.kind === 'nail' ? '#e4edf3' : item.kind === 'playerDamage' ? '#ff8b7f' : ORB_BY_ID[item.attribute]?.highlight || '#fff';
    ctx.fillText(item.kind === 'void'
      ? 'VOID'
      : `${item.kind === 'heal' || item.kind === 'absorb' || item.kind === 'revive' ? '+' : '-'}${item.value.toLocaleString()}`, x, y);
    ctx.globalAlpha = 1;
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#68758b';
  ctx.font = '600 9px "Noto Sans", sans-serif';
  ctx.fillText('Touch an enemy to target · 5+ same-color orbs attacks all enemies', 225, 806);

  if (engine.mode === 'ready') drawReadyOverlay(ctx, engine);
  if (engine.mode === 'victory' || engine.mode === 'defeat') drawEndOverlay(ctx, engine);
}

function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

export default function PuzzlePage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const assetWorkerRef = useRef(null);
  const [atlasStatus, setAtlasStatus] = useState('Use your 21.9.0 APK for original orb art');
  const [boardPreset, setBoardPreset] = useState('normal');

  const loadOriginalOrbArt = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    assetWorkerRef.current?.terminate();
    setAtlasStatus('Decoding block2.btex locally…');
    const worker = new Worker(new URL('../puzzle/padAssetWorker.js', import.meta.url), { type: 'module' });
    assetWorkerRef.current = worker;
    worker.onmessage = ({ data }) => {
      if (data.type === 'error') {
        setAtlasStatus(data.message);
        worker.terminate();
        if (assetWorkerRef.current === worker) assetWorkerRef.current = null;
        return;
      }
      const image = document.createElement('canvas');
      image.width = data.width;
      image.height = data.height;
      const context = image.getContext('2d');
      context.putImageData(new ImageData(new Uint8ClampedArray(data.pixels), data.width, data.height), 0, 0);
      activePadOrbAtlas = { image, sprites: data.sprites };
      activePadMonsterArt = data.monsters.map((monster) => {
        const monsterImage = document.createElement('canvas');
        monsterImage.width = monster.width;
        monsterImage.height = monster.height;
        monsterImage.getContext('2d').putImageData(
          new ImageData(new Uint8ClampedArray(monster.pixels), monster.width, monster.height), 0, 0,
        );
        return { image: monsterImage, bounds: monster.bounds, sourceName: monster.sourceName };
      });
      setAtlasStatus(`Original ${data.sourceName} + ${activePadMonsterArt.length} monster textures active`);
      worker.terminate();
      if (assetWorkerRef.current === worker) assetWorkerRef.current = null;
    };
    worker.onerror = (error) => {
      setAtlasStatus(error.message || 'Could not decode the selected APK.');
      worker.terminate();
      if (assetWorkerRef.current === worker) assetWorkerRef.current = null;
    };
    const apkBytes = await file.arrayBuffer();
    worker.postMessage({ apkBytes }, [apkBytes]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const engine = new PuzzleEngine(BOARD_PRESETS[boardPreset]);
    engineRef.current = engine;
    let frame = 0;
    let lastTime = performance.now();
    let manualTime = false;
    let activePointerId = null;

    const pointFromEvent = (event) => {
      const rect = canvas.getBoundingClientRect();
      return { x: ((event.clientX - rect.left) / rect.width) * WIDTH, y: ((event.clientY - rect.top) / rect.height) * HEIGHT };
    };
    const cellFromPoint = (point) => {
      const board = boardLayout(engine);
      return {
        row: Math.floor((point.y - board.y) / board.cell),
        column: Math.floor((point.x - board.x) / board.cell),
        gridColumn: (point.x - board.x) / board.cell,
        gridRow: (point.y - board.y) / board.cell,
      };
    };
    const restart = () => {
      activePointerId = null;
      engine.reset();
      engine.start();
      render(context, engine);
    };

    const onPointerDown = (event) => {
      if (activePointerId !== null && event.pointerId !== activePointerId) return;
      const point = pointFromEvent(event);
      if (engine.mode === 'ready' && inside(point, START_RECT)) { engine.start(); render(context, engine); return; }
      if ((engine.mode === 'victory' || engine.mode === 'defeat') && inside(point, { x: 105, y: 404, width: 240, height: 58 })) { restart(); return; }
      if (inside(point, RESET_RECT)) { restart(); return; }
      if (inside(point, SKILL_RECT)) { engine.useSkill(); render(context, engine); return; }
      if (point.y >= 70 && point.y <= 275) {
        engine.selectEnemy(point.x < WIDTH / 2 ? 0 : 1);
        render(context, engine);
        return;
      }
      const cell = cellFromPoint(point);
      if (engine.startDrag(
        cell.row,
        cell.column,
        point.x,
        point.y,
        cell.gridColumn,
        cell.gridRow,
      )) {
        activePointerId = event.pointerId;
        canvas.setPointerCapture?.(event.pointerId);
        event.preventDefault();
        render(context, engine);
      }
    };
    const onPointerMove = (event) => {
      if (!engine.drag || event.pointerId !== activePointerId) return;
      const point = pointFromEvent(event);
      const cell = cellFromPoint(point);
      engine.moveDrag(
        cell.row,
        cell.column,
        point.x,
        point.y,
        cell.gridColumn,
        cell.gridRow,
      );
      event.preventDefault();
      render(context, engine);
    };
    const onPointerUp = (event) => {
      if (event.pointerId !== activePointerId) return;
      const endedDrag = Boolean(engine.drag);
      if (endedDrag) engine.endDrag();
      canvas.releasePointerCapture?.(event.pointerId);
      activePointerId = null;
      if (!endedDrag) return;
      event.preventDefault();
      render(context, engine);
    };
    const onKeyDown = (event) => {
      if (event.key.toLowerCase() === 'r') restart();
      if (event.key.toLowerCase() === 'f') {
        if (!document.fullscreenElement) canvas.parentElement.requestFullscreen?.(); else document.exitFullscreen?.();
      }
    };
    const loop = (now) => {
      if (!manualTime) engine.update((now - lastTime) / 1000);
      lastTime = now;
      render(context, engine);
      frame = requestAnimationFrame(loop);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    window.render_game_to_text = () => JSON.stringify(engine.snapshot());
    window.advanceTime = (milliseconds) => {
      manualTime = true;
      const steps = Math.max(1, Math.ceil(milliseconds / (1000 / 60)));
      for (let index = 0; index < steps; index += 1) engine.update(milliseconds / 1000 / steps);
      render(context, engine);
    };
    window.__puzzleGame = engine;
    render(context, engine);
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      delete window.render_game_to_text;
      delete window.advanceTime;
      delete window.__puzzleGame;
    };
  }, [boardPreset]);

  useEffect(() => () => {
    assetWorkerRef.current?.terminate();
    assetWorkerRef.current = null;
    activePadOrbAtlas = null;
    activePadMonsterArt = [];
  }, []);

  return (
    <main className="puzzle-page">
      <button className="puzzle-back" onClick={() => navigate('/')} aria-label="Return to title">‹ <span>Title</span></button>
      <label className="puzzle-apk-art">
        <input type="file" accept=".apk,application/vnd.android.package-archive" onChange={loadOriginalOrbArt} />
        <span>{atlasStatus}</span>
      </label>
      <div className="puzzle-board-size" role="group" aria-label="Board size; changing it restarts the battle">
        <span>BOARD</span>
        {Object.entries(BOARD_PRESETS).map(([id, preset]) => (
          <button
            key={id}
            type="button"
            aria-label={`${preset.columns} by ${preset.rows} board`}
            aria-pressed={boardPreset === id}
            onClick={() => setBoardPreset(id)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="puzzle-canvas-shell">
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} aria-label="Orb Battle Lab. Drag colored orbs to form matches and battle two enemies." />
      </div>
      <p className="puzzle-access-note">Drag one orb across the board. Release to resolve matches, cascades, healing, damage, and enemy turns.</p>
    </main>
  );
}
