import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/apiClient.js';
import { createDefaultGameState } from '../lib/defaultGameState.js';
import {
  advanceSortieNode,
  autoRepairTick,
  claimQuest,
  constructionPull,
  dispatchExpedition,
  getReachableNodes,
  instantRepair,
  normalizeState,
  premiumGachaPull,
  redeemSecretCode,
  resupplyFleet,
  retreatSortie,
  startRepair,
  startSortie,
  tickExpeditions,
  exchangeGrandPrize,
} from '../lib/gameEngine.js';
import { EXPEDITIONS, FORMATIONS, MAPS, QUESTS, SHIPS, SHIP_TYPES, SPECIAL_GACHA_PRIZES, WORLD_NAMES } from '../lib/gameData.js';

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { id: 'port', label: 'Home Port', icon: '⚓' },
      { id: 'sortie', label: 'Sortie', icon: '⚔' },
      { id: 'expeditions', label: 'Expedition', icon: '◈' },
    ],
  },
  {
    label: 'Arsenal',
    items: [
      { id: 'fleet', label: 'Organization', icon: '☷' },
      { id: 'construction', label: 'Factory', icon: '⚙' },
      { id: 'special', label: 'Special Gacha', icon: '✦' },
      { id: 'dock', label: 'Repair Dock', icon: '⚒' },
    ],
  },
  {
    label: 'Records',
    items: [
      { id: 'collection', label: 'Ship Library', icon: '▦' },
      { id: 'quests', label: 'Quests', icon: '✓' },
      { id: 'combat', label: 'Battle Record', icon: '★' },
    ],
  },
];

const RESOURCE_META = [
  ['fuel', 'Fuel', '◉'],
  ['ammo', 'Ammo', '◆'],
  ['steel', 'Steel', '■'],
  ['bauxite', 'Bauxite', '▲'],
];

const MAP_POSITIONS = {
  start: [10, 76],
  A: [32, 49],
  B: [56, 26],
  C: [58, 70],
  boss: [86, 48],
};

const TYPE_CODES = {
  [SHIP_TYPES.DD]: 'DD',
  [SHIP_TYPES.CL]: 'CL',
  [SHIP_TYPES.CA]: 'CA',
  [SHIP_TYPES.BB]: 'BB',
  [SHIP_TYPES.CV]: 'CV',
};

const PORT_CUTOUT_IDS = new Set(['dd_001', 'dd_002', 'cl_001', 'cl_002']);

function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

function getShip(shipId) {
  return SHIPS.find((ship) => ship.id === shipId);
}

function getDamage(current, max) {
  const ratio = current / Math.max(1, max);
  if (ratio <= 0.25) return { label: 'Heavy', className: 'damage-heavy' };
  if (ratio <= 0.5) return { label: 'Moderate', className: 'damage-medium' };
  if (ratio < 1) return { label: 'Light', className: 'damage-light' };
  return { label: 'Ready', className: 'damage-ready' };
}

function resultLabel(result) {
  if (!result) return 'No engagement recorded';
  if (result === 'PLAYER_WIN') return 'Victory S';
  if (result === 'PLAYER_EDGE') return 'Victory B';
  if (result === 'ENEMY_EDGE') return 'Defeat C';
  if (result === 'ENEMY_WIN') return 'Defeat D';
  return 'Draw';
}

function Panel({ title, eyebrow, actions, children, className = '' }) {
  return (
    <section className={`kc-panel ${className}`}>
      {(title || actions) && (
        <div className="kc-panel-heading">
          <div>
            {eyebrow && <p className="kc-eyebrow">{eyebrow}</p>}
            {title && <h2>{title}</h2>}
          </div>
          {actions && <div className="kc-panel-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

function ResourceBar({ resources }) {
  return (
    <div className="resource-bar" aria-label="Fleet resources">
      <div className="resource-materials">
        {RESOURCE_META.map(([key, label, icon]) => (
          <div className="resource-chip" key={key}>
            <span className={`resource-icon resource-${key}`}>{icon}</span>
            <span className="resource-name">{label}</span>
            <strong>{Number(resources[key] || 0).toLocaleString()}</strong>
          </div>
        ))}
      </div>
      <div className="resource-chip compact"><span className="resource-icon bucket-icon">♨</span><span className="resource-name">Buckets</span><strong>{resources.buckets}</strong></div>
      <div className="resource-chip compact"><span className="resource-icon ticket-icon">☆</span><span className="resource-name">Orders</span><strong>{resources.tickets}</strong></div>
    </div>
  );
}

function ShipEmblem({ ship, small = false }) {
  return (
    <div className={`ship-emblem ${small ? 'small' : ''}`} aria-hidden="true">
      <span>{TYPE_CODES[ship.type] || 'FS'}</span>
      <i />
    </div>
  );
}

function ShipPortrait({ ship, size = 'medium', alt = true }) {
  if (!ship?.id) return <ShipEmblem ship={ship || { type: SHIP_TYPES.DD }} small={size === 'small'} />;
  return (
    <div className={`ship-portrait size-${size}`}>
      <img src={`/assets/ship-sprites/${ship.id}.webp`} alt={alt ? `${ship.name} ship portrait` : ''} />
      <span>{TYPE_CODES[ship.type] || 'FS'}</span>
    </div>
  );
}

function HpBar({ value, max }) {
  const damage = getDamage(value, max);
  return (
    <div className="hp-line">
      <div className="hp-track"><span className={damage.className} style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} /></div>
      <b>{value}/{max}</b>
    </div>
  );
}

function FleetStrip({ fleet, state, onOpenFleet }) {
  return (
    <div className="fleet-strip">
      <div className="fleet-strip-title">
        <span>1st Fleet</span>
        <button className="text-button" onClick={onOpenFleet}>Organization</button>
      </div>
      <div className="fleet-strip-list">
        {fleet.map((shipId, index) => {
          const ship = getShip(shipId);
          const inst = state.ships[shipId];
          return (
            <div className={`fleet-mini ${!ship ? 'empty' : ''}`} key={`${shipId || 'empty'}-${index}`}>
              <span className="fleet-number">{index + 1}</span>
              {ship ? (
                <>
                  <ShipPortrait ship={ship} size="small" />
                  <div><strong>{ship.name}</strong><small>Lv {inst.level}</small></div>
                  <HpBar value={inst.currentHp} max={ship.hp} />
                </>
              ) : <span className="empty-slot">Empty berth</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PortView({ state, fleet, setTab, onResupply, supplyNotice }) {
  const flagshipId = fleet.find(Boolean);
  const flagship = getShip(flagshipId) || SHIPS[0];
  const inst = state.ships[flagshipId] || state.ships[state.ownedShipIds[0]];
  const hasPortCutout = PORT_CUTOUT_IDS.has(flagship.id) || flagship.id === 'bb_001';
  const flagshipSrc = flagship.id === 'bb_001' ? '/assets/original/aster-vale-clean.png' : hasPortCutout ? `/assets/port-sprites/${flagship.id}.png` : `/assets/ship-sprites/${flagship.id}.webp`;

  return (
    <div className="port-scene">
      <div className="port-horizon" />
      <section className="port-dashboard" aria-label="Fleet command and preview">
        <div className="port-command-grid">
          <button className="command-hex primary" onClick={() => setTab('sortie')}><span>⚔</span><b>SORTIE</b><small>Deploy fleet</small></button>
          <button className="command-hex" onClick={() => setTab('fleet')}><span>☷</span><b>ORGANIZE</b><small>Form fleet</small></button>
          <button className="command-hex" onClick={onResupply}><span>◉</span><b>SUPPLY</b><small>Replenish</small></button>
          <button className="command-hex" onClick={() => setTab('dock')}><span>⚒</span><b>DOCK</b><small>Repair ships</small></button>
          <button className="command-hex" onClick={() => setTab('construction')}><span>⚙</span><b>ARSENAL</b><small>Build ships</small></button>
          <button className="command-hex" onClick={() => setTab('quests')}><span>✓</span><b>QUESTS</b><small>Review orders</small></button>
        </div>
        <AnimatePresence initial={false}>
          {supplyNotice && (
            <motion.div
              className="supply-notice"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              role="status"
            >
              <span>◉</span><div><b>SUPPLY REPORT</b><small>{supplyNotice}</small></div>
            </motion.div>
          )}
        </AnimatePresence>
        <FleetStrip fleet={fleet} state={state} onOpenFleet={() => setTab('fleet')} />
      </section>
      <section className="flagship-showcase" aria-label="Fleet flagship">
        <div className="showcase-heading"><span>01</span><div><small>ACTIVE FLAGSHIP</small><b>1ST FLEET</b></div></div>
        <div className="flagship-art-frame">
          <motion.img
            className={`flagship-art ${hasPortCutout ? 'clean-cutout' : 'soft-portrait'}`}
            src={flagshipSrc}
            alt={`${flagship.name}, fleet flagship`}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, bounce: 0 }}
          />
        </div>
        <div className="speech-card">
          <span className="speech-corner" />
          <p>Admiral, the harbor is calm and the fleet is standing by. Shall we begin today&apos;s operations?</p>
        </div>
        <div className="flagship-plaque">
          <p>FLAGSHIP · {flagship.type.toUpperCase()}</p>
          <h2>{flagship.name}</h2>
          <div className="flagship-stats"><span>Lv {inst?.level || 1}</span><span>Cond {inst?.morale || 49}</span><span>HP {inst?.currentHp || flagship.hp}/{flagship.hp}</span></div>
        </div>
      </section>
    </div>
  );
}

function FleetView({ state, setState, onResupply }) {
  const activeId = state.fleets.activeFleetId;
  const fleet = state.fleets[activeId] || [];

  const setActiveFleet = (fleetId) => setState((prev) => ({ ...prev, fleets: { ...prev.fleets, activeFleetId: fleetId } }));
  const toggleShip = (shipId) => {
    setState((prev) => {
      const nextFleet = [...(prev.fleets[prev.fleets.activeFleetId] || Array(6).fill(null))];
      const existing = nextFleet.indexOf(shipId);
      if (existing >= 0) nextFleet[existing] = null;
      else {
        const slot = nextFleet.indexOf(null);
        if (slot < 0) return prev;
        nextFleet[slot] = shipId;
      }
      const compact = nextFleet.filter(Boolean);
      return { ...prev, fleets: { ...prev.fleets, [prev.fleets.activeFleetId]: [...compact, ...Array(6 - compact.length).fill(null)] } };
    });
  };

  return (
    <div className="view-stack">
      <Panel title="Fleet Organization" eyebrow="Composition & readiness" actions={<button className="kc-action" onClick={onResupply}>Resupply all</button>}>
        <div className="fleet-tabs">
          {['fleet1', 'fleet2', 'fleet3', 'fleet4'].map((fleetId, index) => <button key={fleetId} className={fleetId === activeId ? 'active' : ''} onClick={() => setActiveFleet(fleetId)}>{index + 1}F</button>)}
        </div>
        <div className="fleet-formation-list">
          {Array.from({ length: 6 }).map((_, index) => {
            const shipId = fleet[index];
            const ship = getShip(shipId);
            const inst = state.ships[shipId];
            return (
              <div className={`formation-slot ${ship ? '' : 'empty'}`} key={index}>
                <span className="slot-index">{index + 1}</span>
                {ship ? <><ShipPortrait ship={ship} size="small" /><div className="slot-info"><h3>{ship.name}</h3><p>{ship.type} · Lv {inst.level} · Cond {inst.morale}</p><HpBar value={inst.currentHp} max={ship.hp} /></div><div className="supply-meter"><span>F {inst.supply.fuel}/{ship.maxFuel}</span><span>A {inst.supply.ammo}/{ship.maxAmmo}</span></div><button className="remove-button" onClick={() => toggleShip(shipId)}>Remove</button></> : <p>Select a ship from the reserve roster below</p>}
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Reserve Roster" eyebrow={`${state.ownedShipIds.length} ships available`}>
        <div className="roster-grid">
          {state.ownedShipIds.map((shipId) => {
            const ship = getShip(shipId);
            const inst = state.ships[shipId];
            const selected = fleet.includes(shipId);
            const damage = getDamage(inst.currentHp, ship.hp);
            return (
              <button className={`roster-card ${selected ? 'selected' : ''}`} key={shipId} onClick={() => toggleShip(shipId)}>
                <ShipPortrait ship={ship} size="small" />
                <div><span className="rarity-tag">{ship.rarity}</span><h3>{ship.name}</h3><p>{ship.type} · Lv {inst.level}</p><small className={damage.className}>{damage.label}</small></div>
                <span className="roster-check">{selected ? '✓' : '+'}</span>
              </button>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function FormationPicker({ value, onChange }) {
  return (
    <div className="formation-picker">
      {Object.values(FORMATIONS).map((item, index) => (
        <button className={value === item.id ? 'active' : ''} key={item.id} onClick={() => onChange(item.id)}>
          <span className={`formation-mark formation-${index + 1}`}><i /><i /><i /><i /></span>
          <b>{item.name}</b>
          <small>ATK {Math.round(item.attack * 100)} · EVA {Math.round(item.evasion * 100)}</small>
        </button>
      ))}
    </div>
  );
}

function SortieMap({ map, run, reachable, onAdvance }) {
  const visited = new Set(run?.visitedNodes || []);
  return (
    <div className="sortie-map">
      <div className="map-grid" />
      <svg className="map-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="route-glow"><feGaussianBlur stdDeviation="0.7" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {Object.values(map.nodes).flatMap((node) => (node.next || []).map((target) => {
          const [x1, y1] = MAP_POSITIONS[node.id];
          const [x2, y2] = MAP_POSITIONS[target];
          const isTravelled = visited.has(node.id) && visited.has(target);
          return <line className={isTravelled ? 'travelled' : ''} key={`${node.id}-${target}`} x1={x1} y1={y1} x2={x2} y2={y2} vectorEffect="non-scaling-stroke" />;
        }))}
      </svg>
      {Object.values(map.nodes).map((node) => {
        const [x, y] = MAP_POSITIONS[node.id];
        const canReach = reachable.includes(node.id);
        const active = run?.currentNode === node.id;
        return (
          <button
            key={node.id}
            aria-label={`Node ${node.id}, ${node.type}`}
            className={`map-node type-${node.type} ${visited.has(node.id) ? 'visited' : ''} ${active ? 'active' : ''} ${canReach ? 'reachable' : ''}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            disabled={!canReach}
            onClick={() => onAdvance(node.id)}
          >
            <span>{node.id === 'start' ? '⚓' : node.type === 'boss' ? '★' : node.type === 'resource' ? '◆' : node.id}</span>
          </button>
        );
      })}
      <div className="map-compass"><span>N</span><i /></div>
    </div>
  );
}

function SortieView({ state, formation, setFormation, onStart, onAdvance, onRetreat }) {
  const run = state.sortie.currentRun;
  const map = run ? MAPS.find((item) => item.id === run.mapId) : null;
  const reachable = getReachableNodes(state);
  const [selectedWorld, setSelectedWorld] = useState('1');
  const [selectedMap, setSelectedMap] = useState(MAPS[0].id);
  const worldMaps = MAPS.filter((item) => item.id.startsWith(`${selectedWorld}-`));
  const selected = worldMaps.find((item) => item.id === selectedMap) || worldMaps[0];
  const fleetIds = state.fleets[state.fleets.activeFleetId].filter(Boolean);
  const blockedShip = fleetIds.map((shipId) => ({ ship: getShip(shipId), inst: state.ships[shipId] })).find(({ ship, inst }) => !ship || !inst || inst.currentHp <= ship.hp * 0.25 || (inst.repairEndTime && Date.now() < inst.repairEndTime));
  const blocker = !fleetIds.length ? 'Assign at least one ship to the active fleet.' : blockedShip ? `${blockedShip.ship?.name || 'A fleet member'} must be repaired before departure.` : '';

  const selectWorld = (world) => {
    const firstMap = MAPS.find((item) => item.id.startsWith(`${world}-`));
    setSelectedWorld(world);
    if (firstMap) setSelectedMap(firstMap.id);
  };

  if (run && map) {
    return (
      <div className="view-stack">
        <Panel title={`${map.id} — ${map.name}`} eyebrow="Fleet underway" actions={<button className="kc-action danger" onClick={onRetreat}>Retreat</button>}>
          <SortieMap map={map} run={run} reachable={reachable} onAdvance={onAdvance} />
          <div className="route-status"><span>Current node <b>{run.currentNode}</b></span><span>Formation <b>{FORMATIONS[run.formationId]?.name}</b></span><span>Choose a highlighted node to advance</span></div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="sortie-setup">
      <Panel title="Operation Area" eyebrow="Select a combat zone" className="map-select-panel">
        <div className="world-tabs">{Object.entries(WORLD_NAMES).map(([world, name]) => <button className={selectedWorld === world ? 'active' : ''} onClick={() => selectWorld(world)} key={world}><b>World {world}</b><small>{name}</small></button>)}<button disabled><b>Event</b><small>Locked</small></button></div>
        <div className="map-cards">
          {worldMaps.map((item) => {
            const index = MAPS.findIndex((map) => map.id === item.id);
            return (
            <button className={`map-card ${selectedMap === item.id ? 'selected' : ''}`} onClick={() => setSelectedMap(item.id)} key={item.id}>
              <span className="map-number">{item.id}</span><i className={`map-thumb map-thumb-${(index % 3) + 1}`} /><div><h3>{item.name}</h3><p>{item.worldName} · Base EXP {item.baseExp}</p></div><span className="clear-stamp">{state.sortie.mapClears[item.id] ? 'CLEARED' : 'NEW'}</span>
            </button>
          );})}
        </div>
      </Panel>
      <Panel title="Formation" eyebrow="Choose an engagement posture" className="formation-panel">
        <FormationPicker value={formation} onChange={setFormation} />
        <div className="preflight-card">
          <div><span>Operation</span><b>{selected.id} {selected.name}</b></div>
          <div><span>Active ships</span><b>{state.fleets[state.fleets.activeFleetId].filter(Boolean).length} / 6</b></div>
          <div><span>Formation</span><b>{FORMATIONS[formation].name}</b></div>
          {blocker && <p className="preflight-warning">⚠ {blocker}</p>}
          <button className="sortie-launch" disabled={Boolean(blocker) || !selected} onClick={() => selected && onStart(selected.id)}>{blocker ? 'Fleet Not Ready' : `Begin Sortie ${selected?.id || ''}`} <span>›</span></button>
        </div>
      </Panel>
    </div>
  );
}

function SpecialGachaView({ state, result, onPull, onRedeem, onExchange }) {
  const [code, setCode] = useState('');
  const pulls = result?.pulls || [];
  const submitCode = (event) => { event.preventDefault(); if (code.trim()) { onRedeem(code); setCode(''); } };
  return (
    <div className="special-layout">
      <Panel title="Special Gift Gacha" eyebrow="Limited ticket draw" className="special-draw-panel">
        <div className="special-machine">
          <span className="special-spark">✦</span><h2>Special Gacha</h2><p>Grand gifts, rare ships, and fleet supplies await.</p>
          <div className="special-currency"><b>🎫 {state.resources.tickets}</b><span>Special tickets</span><b>✧ {state.resources.pityTokens}</b><span>Exchange tokens</span></div>
          <div className="special-pull-actions"><button disabled={state.resources.tickets < 1} onClick={() => onPull(1)}>Pull ×1 <small>1 ticket</small></button><button disabled={state.resources.tickets < 10} onClick={() => onPull(10)}>Pull ×10 <small>10 tickets</small></button></div>
        </div>
        <div className="special-results">
          {pulls.length ? pulls.map((pull, index) => { const ship = getShip(pull.shipId); return <motion.article key={`${pull.type}-${pull.prizeKey || pull.shipId || index}-${index}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }} className={`special-result type-${pull.type}`}>{ship ? <ShipPortrait ship={ship} size="small"/> : <span>{pull.type === 'grandPrize' ? '🎁' : '⛽'}</span>}<div><b>{pull.type === 'grandPrize' ? pull.name : ship ? `${pull.rarity} ${ship.name}` : `${pull.name} +${pull.amount}`}</b><small>{pull.type === 'ship' ? (pull.isNew ? 'New ship acquired' : 'Duplicate converted to XP') : `+${pull.tokensEarned} exchange token${pull.tokensEarned === 1 ? '' : 's'}`}</small></div></motion.article>; }) : <div className="special-empty"><span>🎁</span><p>Your latest special draw will appear here.</p></div>}
        </div>
      </Panel>
      <div className="special-side">
        <Panel title="Grand Gift Exchange" eyebrow="Guaranteed rewards">
          <div className="gift-list">{SPECIAL_GACHA_PRIZES.map((prize) => { const obtained = state.gacha.grandPrizes[prize.key]; return <article key={prize.key} className={obtained ? 'obtained' : ''}><span>🎁</span><div><h3>{prize.name}</h3><p>{prize.description}</p><small>Natural draw rate {prize.rate}%</small></div><button disabled={obtained || state.resources.pityTokens < prize.tokenCost} onClick={() => onExchange(prize.key)}>{obtained ? 'Obtained' : `${prize.tokenCost} ✧`}</button></article>; })}</div>
        </Panel>
        <Panel title="Secret Code" eyebrow="Admiralty transmission">
          <form className="secret-code" onSubmit={submitCode}><p>{state.gacha.secretCodeRedeemed ? 'The one-time transmission has already been claimed.' : 'Enter the original secret phrase to receive 50 special tickets.'}</p><div><input aria-label="Secret code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="ENTER CODE" maxLength={20} autoComplete="off"/><button disabled={!code.trim() || state.gacha.secretCodeRedeemed}>Redeem</button></div></form>
        </Panel>
      </div>
    </div>
  );
}

function parseBattleEvent(line) {
  const [phase = 'Engagement', detail = line] = line.split(': ');
  const hit = detail.match(/^(.*?) hit (.*?) for (\d+)(.*)$/);
  const miss = detail.match(/^(.*?) missed (.*)$/);
  if (hit) return { phase, attacker: hit[1], target: hit[2], damage: Number(hit[3]), critical: hit[4].includes('CRIT'), line };
  if (miss) return { phase, attacker: miss[1], target: miss[2], damage: 0, miss: true, line };
  return { phase, attacker: '', target: '', damage: 0, line };
}

function CombatView({ battle, run, onContinue, onReturn }) {
  const players = battle?.playerUnits || [];
  const enemies = battle?.enemyUnits || [];
  const events = useMemo(() => (battle?.log || []).map(parseBattleEvent), [battle]);
  const [eventIndex, setEventIndex] = useState(-1);
  const [finished, setFinished] = useState(!battle);

  useEffect(() => {
    if (!battle) return undefined;
    setEventIndex(-1);
    setFinished(false);
    const timers = [window.setTimeout(() => setEventIndex(0), 1100)];
    events.forEach((_, index) => timers.push(window.setTimeout(() => setEventIndex(index), 1100 + index * 900)));
    timers.push(window.setTimeout(() => setFinished(true), 1400 + events.length * 900));
    return () => timers.forEach(window.clearTimeout);
  }, [battle, events]);

  const currentEvent = eventIndex >= 0 ? events[eventIndex] : null;
  const playerAttacking = currentEvent && !currentEvent.attacker.startsWith('Enemy ');
  const shownLog = finished ? events : events.slice(0, Math.max(0, eventIndex + 1));

  return (
    <div className={`combat-stage ${finished ? 'battle-finished' : 'battle-playing'}`}>
      <div className="combat-sky" />
      <div className="combat-water" />
      <AnimatePresence initial={false} mode="wait">
        <motion.div className="battle-title" key={finished ? 'result' : currentEvent?.phase || 'contact'} initial={{ opacity: 0, scale: .96, filter: 'blur(4px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -8 }} transition={{ duration: .3, bounce: 0 }}>
          <small>{battle ? `${battle.mapId} · NODE ${battle.nodeId}` : 'COMBAT RECORD'}</small>
          <h2>{finished ? resultLabel(battle?.result) : currentEvent?.phase || 'Enemy in sight'}</h2>
        </motion.div>
      </AnimatePresence>
      <div className="combat-fleet player-fleet">
        <h3>1ST FLEET</h3>
        {players.map((unit, index) => {
          const ship = getShip(unit.id);
          const isAttacker = currentEvent?.attacker === unit.name;
          const isTarget = currentEvent?.target === unit.name;
          return <motion.div className={`combat-unit ${isAttacker ? 'attacking' : ''} ${isTarget ? 'hit' : ''}`} key={`${unit.id}-${index}`} initial={{ opacity: 0, x: -70 }} animate={{ opacity: 1, x: isAttacker ? 18 : 0 }} transition={{ delay: index * .1, duration: .3, bounce: 0 }}><ShipPortrait ship={ship || { type: unit.type }} size="battle" /><div><b>{unit.name}</b><HpBar value={finished ? unit.hp : unit.maxHp} max={unit.maxHp} /></div>{isTarget && currentEvent.damage > 0 && <motion.strong className="damage-burst" initial={{ opacity: 0, scale: .25, y: 8, filter: 'blur(4px)' }} animate={{ opacity: 1, scale: 1, y: -14, filter: 'blur(0px)' }}>-{currentEvent.damage}</motion.strong>}</motion.div>;
        })}
        {!players.length && <p>Complete a sortie engagement to create a battle record.</p>}
      </div>
      <div className="combat-versus">VS</div>
      <div className="combat-fleet enemy-fleet">
        <h3>ABYSSAL FORCE</h3>
        {enemies.map((unit, index) => {
          const isAttacker = currentEvent?.attacker === unit.name;
          const isTarget = currentEvent?.target === unit.name;
          return <motion.div className={`combat-unit enemy ${isAttacker ? 'attacking' : ''} ${isTarget ? 'hit' : ''}`} key={`${unit.id}-${index}`} initial={{ opacity: 0, x: 70 }} animate={{ opacity: 1, x: isAttacker ? -18 : 0 }} transition={{ delay: index * .1, duration: .3, bounce: 0 }}><div className="enemy-emblem">☠</div><div><b>{unit.name.replace('Enemy ', '')}</b><HpBar value={finished ? unit.hp : unit.maxHp} max={unit.maxHp} /></div>{isTarget && currentEvent.damage > 0 && <motion.strong className="damage-burst" initial={{ opacity: 0, scale: .25, y: 8, filter: 'blur(4px)' }} animate={{ opacity: 1, scale: 1, y: -14, filter: 'blur(0px)' }}>-{currentEvent.damage}</motion.strong>}</motion.div>;
        })}
      </div>
      {currentEvent && !finished && !currentEvent.miss && <motion.div key={`shot-${eventIndex}`} className={`battle-projectile ${playerAttacking ? 'from-player' : 'from-enemy'}`} initial={{ opacity: 0, x: playerAttacking ? '-28vw' : '28vw', scaleX: .25 }} animate={{ opacity: [0, 1, 1, 0], x: playerAttacking ? '28vw' : '-28vw', scaleX: 1 }} transition={{ duration: .65, ease: 'easeIn' }}><i /></motion.div>}
      {currentEvent?.miss && !finished && <motion.div key={`miss-${eventIndex}`} className="miss-callout" initial={{ opacity: 0, scale: .25, filter: 'blur(4px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}>MISS</motion.div>}
      <div className="battle-log">
        <div className="phase-ribbon">{finished ? 'BATTLE REPORT' : 'LIVE COMBAT FEED'}</div>
        <div>{shownLog.slice(-7).map((event, index) => <motion.p key={`${event.line}-${index}`} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>{event.line}</motion.p>)}{!battle && <p>No engagement data available.</p>}</div>
        {finished && battle?.drop && <p className="drop-report">★ New ship joined the fleet: {getShip(battle.drop)?.name || battle.drop}</p>}
        <div className="battle-actions">
          {!finished ? <button className="kc-action" onClick={() => setFinished(true)}>Skip animation</button> : run && !battle?.mapCleared && battle?.result !== 'ENEMY_WIN' ? <button className="kc-action gold" onClick={onContinue}>Continue operation</button> : <button className="kc-action" onClick={onReturn}>Return to port</button>}
        </div>
      </div>
    </div>
  );
}

function CollectionView({ state }) {
  const owned = state.ownedShipIds.map(getShip).filter(Boolean);
  const [filter, setFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(owned[0]?.id || null);
  const filtered = filter === 'ALL' ? owned : owned.filter((ship) => TYPE_CODES[ship.type] === filter);
  const selected = filtered.find((ship) => ship.id === selectedId) || filtered[0] || null;
  const inst = selected ? state.ships[selected.id] : null;
  return (
    <div className="collection-layout">
      <Panel title="Ship Library" eyebrow={`${owned.length} of ${SHIPS.length} vessels acquired`} className="collection-index">
        <div className="collection-filters">{['ALL', 'DD', 'CL', 'CA', 'BB', 'CV'].map((type) => <button className={filter === type ? 'active' : ''} key={type} onClick={() => setFilter(type)}>{type}</button>)}</div>
        <div className="collection-grid">
          {filtered.map((ship) => <button className={`collection-card ${selected?.id === ship.id ? 'selected' : ''}`} key={ship.id} onClick={() => setSelectedId(ship.id)}><img src={`/assets/ship-sprites/${ship.id}.webp`} alt={`${ship.name} portrait`} /><span className="collection-rarity">{ship.rarity}</span><div><b>{ship.name}</b><small>{TYPE_CODES[ship.type]} · Lv {state.ships[ship.id].level}</small></div></button>)}
        </div>
      </Panel>
      <Panel title={selected?.name || 'No ships'} eyebrow={selected ? `${selected.rarity} · ${selected.type}` : 'Collection empty'} className="collection-detail">
        {selected && <><div className="collection-hero"><img src={`/assets/ship-sprites/${selected.id}.webp`} alt={`${selected.name} full portrait`} /><div className="collection-nameplate"><span>NO. {String(SHIPS.indexOf(selected) + 1).padStart(3, '0')}</span><h2>{selected.name}</h2><p>{selected.type}</p></div></div><div className="collection-stats"><div><span>LEVEL</span><b>{inst.level}</b></div><div><span>HP</span><b>{inst.currentHp}/{selected.hp}</b></div><div><span>FIREPOWER</span><b>{selected.fp}</b></div><div><span>TORPEDO</span><b>{selected.torp}</b></div><div><span>ARMOR</span><b>{selected.armor}</b></div><div><span>MORALE</span><b>{inst.morale}</b></div></div></>}
      </Panel>
    </div>
  );
}

function QuestView({ state, onClaim }) {
  return <div className="view-stack"><Panel title="Admiralty Quests" eyebrow="Active operational orders"><div className="quest-list">{QUESTS.map((quest) => { const p = state.quests.progress[quest.id]; const percent = Math.min(100, (p.current / quest.objective.target) * 100); return <article className="quest-row" key={quest.id}><span className={`quest-type type-${quest.type}`}>{quest.type.slice(0, 1).toUpperCase()}</span><div><h3>{quest.name}</h3><p>{quest.objective.kind}: {p.current}/{quest.objective.target}</p><div className="quest-progress"><span style={{ width: `${percent}%` }} /></div></div><div className="quest-reward">{Object.entries(quest.rewards).slice(0, 2).map(([key, value]) => <span key={key}>{key} +{value}</span>)}</div><button className="kc-action" disabled={!p.completed || p.claimed} onClick={() => onClaim(quest.id)}>{p.claimed ? 'Claimed' : p.completed ? 'Claim' : 'In progress'}</button></article>; })}</div></Panel></div>;
}

function ExpeditionView({ state, now, onDispatch }) {
  return <div className="view-stack"><Panel title="Expedition Board" eyebrow="Long-range logistics"><div className="expedition-grid">{EXPEDITIONS.map((expedition) => <article className="expedition-card" key={expedition.id}><span className="expedition-icon">◈</span><h3>{expedition.name}</h3><p>{expedition.durationMin} minutes · Minimum {expedition.requirements.minShips} ships</p><div className="reward-tags">{Object.entries(expedition.rewards).map(([key, value]) => <span key={key}>{key} {value}</span>)}</div><button className="kc-action" onClick={() => onDispatch(expedition.id)}>Dispatch fleet</button></article>)}</div></Panel><Panel title="Fleets at Sea" eyebrow={`${state.expeditions.active.length} active`}><div className="mission-list">{state.expeditions.active.map((mission) => <div key={mission.id}><span className="mission-pulse"/><b>{EXPEDITIONS.find((item) => item.id === mission.expeditionId)?.name}</b><time>{formatDuration(mission.endsAt - now)}</time></div>)}{!state.expeditions.active.length && <p className="empty-message">No fleets are currently on expedition.</p>}</div></Panel></div>;
}

function ConstructionView({ state, result, onConstruct }) {
  const resultShip = getShip(result?.shipId);
  return <div className="construction-layout"><Panel title="Naval Arsenal" eyebrow="New ship construction"><div className="arsenal-machine"><div className="gear gear-one">⚙</div><div className="gear gear-two">⚙</div><div className="blueprint"><span>STANDARD RECIPE</span><h3>Fleet Vessel</h3><div className="recipe-grid"><b>120<small>Fuel</small></b><b>80<small>Ammo</small></b><b>150<small>Steel</small></b><b>40<small>Bauxite</small></b></div></div><button className="construct-button" onClick={onConstruct}><span>⚒</span> Commence construction</button><p className="pity-line">High-rarity guarantee progress: <b>{state.gacha.standardPity}/90</b></p></div></Panel><Panel title="Latest Launch" eyebrow="Construction record"><AnimatePresence mode="wait" initial={false}>{resultShip ? <motion.div className="construction-result" key={resultShip.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: 8 }}><ShipPortrait ship={resultShip} size="launch"/><span className="rarity-large">{result.rarity}</span><h2>{resultShip.name}</h2><p>{resultShip.type}</p><strong>{result.isNew ? 'NEW SHIP ACQUIRED' : 'DUPLICATE · XP CONVERTED'}</strong></motion.div> : <div className="construction-empty"><span>⚓</span><p>Your next completed vessel will appear here.</p></div>}</AnimatePresence></Panel></div>;
}

function DockView({ state, now, onRepair, onInstant }) {
  return <div className="view-stack"><Panel title="Repair Docks" eyebrow={`${state.docks.owned} docks available`}><div className="dock-slots">{Array.from({ length: state.docks.owned }).map((_, index) => { const shipId = state.docks.slots[index]; const ship = getShip(shipId); const inst = state.ships[shipId]; return <div className={`dock-slot ${ship ? 'occupied' : ''}`} key={index}><span className="dock-number">DOCK {index + 1}</span>{ship ? <><ShipPortrait ship={ship} size="small"/><div><h3>{ship.name}</h3><p>Repairing heavy damage</p><time>{formatDuration(inst.repairEndTime - now)}</time></div><button className="kc-action gold" onClick={() => onInstant(shipId)}>Use bucket</button></> : <><span className="dock-empty-icon">⚒</span><p>Repair berth available</p></>}</div>; })}</div></Panel><Panel title="Damage Report" eyebrow="Ships requiring attention"><div className="damage-list">{state.ownedShipIds.map((shipId) => { const ship = getShip(shipId); const inst = state.ships[shipId]; const damage = getDamage(inst.currentHp, ship.hp); const repairing = inst.repairEndTime && now < inst.repairEndTime; return <article key={shipId}><ShipPortrait ship={ship} size="small"/><div><h3>{ship.name}</h3><p className={damage.className}>{damage.label}</p></div><HpBar value={inst.currentHp} max={ship.hp}/><button className="kc-action" disabled={damage.label === 'Ready' || repairing} onClick={() => onRepair(shipId)}>{repairing ? 'In dock' : 'Repair'}</button></article>; })}</div></Panel></div>;
}

export default function GamePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('view');
    return NAV_GROUPS.flatMap((group) => group.items).some((item) => item.id === requested) ? requested : 'port';
  });
  const [state, setState] = useState(createDefaultGameState());
  const [status, setStatus] = useState('Connecting to naval district…');
  const [saveState, setSaveState] = useState('idle');
  const [battleView, setBattleView] = useState(null);
  const [formation, setFormation] = useState('LINE_AHEAD');
  const [constructionResult, setConstructionResult] = useState(null);
  const [specialResult, setSpecialResult] = useState(null);
  const [supplyNotice, setSupplyNotice] = useState('');
  const [editingCommander, setEditingCommander] = useState(false);
  const [commanderDraft, setCommanderDraft] = useState('');
  const supplyNoticeTimer = useRef(null);
  const contentRef = useRef(null);
  const [now, setNow] = useState(Date.now());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    apiClient.getGameState().then((result) => { if (!active) return; setState(normalizeState(result?.state)); setStatus('Fleet command online.'); setLoaded(true); }).catch(() => { if (!active) return; setState(normalizeState(createDefaultGameState())); setStatus('Local command mode · Progress saves when the API is available.'); setLoaded(true); });
    const timer = setInterval(() => { const tick = Date.now(); setNow(tick); setState((prev) => tickExpeditions(autoRepairTick(prev, tick), tick)); }, 1000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!loaded) return undefined;
    const handle = setTimeout(() => { setSaveState('saving'); apiClient.saveGameState(state).then(() => setSaveState('saved')).catch(() => setSaveState('local')); }, 850);
    return () => clearTimeout(handle);
  }, [state, loaded]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key.toLowerCase() === 'f' && !event.metaKey && !event.ctrlKey && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [tab]);

  const activeFleet = useMemo(() => state.fleets[state.fleets.activeFleetId] || [], [state]);
  const run = state.sortie.currentRun;

  useEffect(() => {
    window.render_game_to_text = () => JSON.stringify({
      coordinateSystem: 'UI screen; origin top-left; x right; y down',
      mode: tab,
      status,
      commanderName: state.profile.commanderName,
      resources: state.resources,
      activeFleetId: state.fleets.activeFleetId,
      activeFleet: activeFleet.filter(Boolean).map((shipId) => { const ship = getShip(shipId); const inst = state.ships[shipId]; return { id: shipId, name: ship?.name, level: inst?.level, hp: inst?.currentHp, maxHp: ship?.hp, morale: inst?.morale, supply: inst?.supply }; }),
      sortie: run ? { mapId: run.mapId, currentNode: run.currentNode, reachableNodes: getReachableNodes(state), formation: run.formationId } : null,
      battle: battleView ? { result: battleView.result, mapId: battleView.mapId, nodeId: battleView.nodeId, drop: battleView.drop } : null,
      constructionResult,
      specialResult,
    });
    window.advanceTime = (ms) => { const target = now + ms; setNow(target); setState((prev) => tickExpeditions(autoRepairTick(prev, target), target)); };
    return () => { delete window.render_game_to_text; delete window.advanceTime; };
  }, [tab, status, state, activeFleet, run, battleView, constructionResult, specialResult, now]);

  const applyResult = (result, success) => { if (result.error) { setStatus(result.error); return false; } setState(result.state); setStatus(success); return true; };
  const handleResupply = () => {
    const next = resupplyFleet(state);
    const fuelSpent = state.resources.fuel - next.resources.fuel;
    const ammoSpent = state.resources.ammo - next.resources.ammo;
    const fleetIds = activeFleet.filter(Boolean);
    const supplied = fleetIds.filter((shipId) => {
      const master = getShip(shipId);
      const inst = next.ships[shipId];
      return master && inst?.supply?.fuel === master.maxFuel && inst?.supply?.ammo === master.maxAmmo;
    }).length;
    const stillLow = Math.max(0, fleetIds.length - supplied);
    const message = fuelSpent || ammoSpent
      ? `${supplied} ships replenished · −${fuelSpent} fuel · −${ammoSpent} ammo${stillLow ? ` · ${stillLow} awaiting resources` : ''}`
      : stillLow
        ? `Unable to replenish ${stillLow} ships · more fuel or ammunition required`
        : 'All active ships are already fully supplied.';
    setState(next);
    setSupplyNotice(message);
    setStatus(message);
    window.clearTimeout(supplyNoticeTimer.current);
    supplyNoticeTimer.current = window.setTimeout(() => setSupplyNotice(''), 4200);
  };
  const openCommanderEditor = () => {
    setCommanderDraft(state.profile.commanderName || '');
    setEditingCommander(true);
  };
  const saveCommanderName = (event) => {
    event.preventDefault();
    const commanderName = commanderDraft.trim().slice(0, 24);
    if (!commanderName) return;
    const next = { ...state, profile: { ...state.profile, commanderName } };
    setState(next);
    setSaveState('saving');
    apiClient.saveGameState(next).then(() => setSaveState('saved')).catch(() => setSaveState('local'));
    setStatus(`Commander profile updated to ${commanderName}.`);
    setEditingCommander(false);
  };
  const handleStartSortie = (mapId) => { const result = startSortie(state, mapId, formation); if (applyResult(result, `Operation ${mapId} commenced.`)) setTab('sortie'); };
  const handleAdvanceNode = (nodeId) => { const result = advanceSortieNode(state, nodeId); if (!applyResult(result, `Fleet advanced to node ${nodeId}.`)) return; if (result.event?.type === 'battle') { setBattleView(result.event); setTab('combat'); setStatus(`Enemy contact at node ${nodeId}. Battle underway.`); } else if (result.event?.type === 'resource') setStatus(`Supplies recovered at node ${nodeId}.`); };
  const handleQuest = (id) => { const result = claimQuest(state, id); applyResult(result, 'Quest rewards received.'); };
  const handleExpedition = (id) => { const result = dispatchExpedition(state, id); applyResult(result, 'Expedition fleet dispatched.'); };
  const handleConstruction = () => { const result = constructionPull(state); if (applyResult(result, 'Construction completed. A new vessel has launched.')) setConstructionResult(result.result); };
  const handlePremiumPull = (count) => { const result = premiumGachaPull(state, count); if (applyResult(result, `${count} special draw${count === 1 ? '' : 's'} completed.`)) setSpecialResult(result.result); };
  const handleSecretCode = (code) => { const result = redeemSecretCode(state, code); applyResult(result, result.error || 'Secret transmission accepted · 50 special tickets received.'); };
  const handleGiftExchange = (prizeKey) => { const result = exchangeGrandPrize(state, prizeKey); applyResult(result, result.error || `${result.result?.name} secured through the exchange.`); };
  const handleRepair = (id) => { const result = startRepair(state, id); applyResult(result, result.error || `Repair started · ETA ${result.etaMin} minutes.`); };
  const handleInstant = (id) => { const result = instantRepair(state, id); applyResult(result, 'High-speed repair completed.'); };

  const activeNav = NAV_GROUPS.flatMap((group) => group.items).find((item) => item.id === tab);

  return (
    <div className="kc-shell">
      <header className="kc-topbar">
        <button className="kc-brand" onClick={() => setTab('port')}><span className="brand-anchor">⚓</span><span><b>GACHA</b><small>Yokosuka Naval District</small></span></button>
        <div className="topbar-utilities">
          <ResourceBar resources={state.resources} />
          <div className="admiral-card">
            <button className="commander-profile" onClick={openCommanderEditor} aria-label="Change username">
              <span><b>{state.profile.commanderName}</b><small>HQ Lv {state.profile.hqLevel} · {state.profile.rank}</small></span>
              <i>✎</i>
            </button>
            <button className="title-menu-button" onClick={() => navigate('/')} aria-label="Return to title">☰</button>
          </div>
        </div>
      </header>
      <div className="kc-body">
        <aside className="kc-sidebar">
          <div className="sidebar-rivet top"/><div className="sidebar-rivet bottom"/>
          {NAV_GROUPS.map((group) => <nav key={group.label}><p>{group.label}</p>{group.items.map((item) => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><span>{item.icon}</span>{item.label}{tab === item.id && <i />}</button>)}</nav>)}
          <div className="sidebar-footer"><span className={`sync-dot ${saveState}`} /><div><b>{saveState === 'saving' ? 'SYNCING' : saveState === 'saved' ? 'ONLINE' : 'LOCAL MODE'}</b><small>Press F for fullscreen</small></div></div>
        </aside>
        <main className={`kc-main tab-${tab}`}>
          <div className="section-titlebar"><div><span>{activeNav?.icon}</span><div><small>NAVAL DISTRICT</small><h1>{activeNav?.label}</h1></div></div><p>{status}</p></div>
          <div className="kc-content" ref={contentRef}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={tab} className="tab-view" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18, bounce: 0 }}>
                {tab === 'port' && <PortView state={state} fleet={activeFleet} setTab={setTab} onResupply={handleResupply} supplyNotice={supplyNotice} />}
                {tab === 'fleet' && <FleetView state={state} setState={setState} onResupply={handleResupply} />}
                {tab === 'collection' && <CollectionView state={state} />}
                {tab === 'sortie' && <SortieView state={state} formation={formation} setFormation={setFormation} onStart={handleStartSortie} onAdvance={handleAdvanceNode} onRetreat={() => { setState((prev) => retreatSortie(prev)); setStatus('Fleet returned safely to port.'); setTab('port'); }} />}
                {tab === 'combat' && <CombatView battle={battleView} run={run} onContinue={() => setTab('sortie')} onReturn={() => setTab('port')} />}
                {tab === 'quests' && <QuestView state={state} onClaim={handleQuest} />}
                {tab === 'expeditions' && <ExpeditionView state={state} now={now} onDispatch={handleExpedition} />}
                {tab === 'construction' && <ConstructionView state={state} result={constructionResult} onConstruct={handleConstruction} />}
                {tab === 'special' && <SpecialGachaView state={state} result={specialResult} onPull={handlePremiumPull} onRedeem={handleSecretCode} onExchange={handleGiftExchange} />}
                {tab === 'dock' && <DockView state={state} now={now} onRepair={handleRepair} onInstant={handleInstant} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <AnimatePresence initial={false}>
        {editingCommander && (
          <motion.div className="profile-editor-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingCommander(false); }}>
            <motion.form className="profile-editor" onSubmit={saveCommanderName} initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }}>
              <p>COMMAND PROFILE</p>
              <h2>Set your username</h2>
              <label htmlFor="commander-name">Commander name</label>
              <input id="commander-name" autoFocus maxLength={24} value={commanderDraft} onChange={(event) => setCommanderDraft(event.target.value)} placeholder="Enter a name" />
              <small>{commanderDraft.trim().length}/24 characters</small>
              <div><button type="button" onClick={() => setEditingCommander(false)}>Cancel</button><button className="save" type="submit" disabled={!commanderDraft.trim()}>Save profile</button></div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
