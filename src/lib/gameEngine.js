import { createDefaultGameState } from './defaultGameState.js';
import { ENEMIES, EXPEDITIONS, FORMATIONS, MAPS, QUESTS, SHIPS, SHIP_TYPES } from './gameData.js';

const RNG_MOD = 2147483647;
const RNG_A = 48271;

const CONSTRUCTION_COST = { fuel: 120, ammo: 80, steel: 150, bauxite: 40 };
const PITY_THRESHOLD = 90;

function seedFrom(...parts) {
  const raw = parts.join('|');
  let out = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    out ^= raw.charCodeAt(i);
    out += (out << 1) + (out << 4) + (out << 7) + (out << 8) + (out << 24);
  }
  return Math.abs(out) % RNG_MOD || 1;
}

function makeRng(seedValue) {
  let seed = seedValue;
  return () => {
    seed = (seed * RNG_A) % RNG_MOD;
    return seed / RNG_MOD;
  };
}

function clone(state) {
  return JSON.parse(JSON.stringify(state));
}

function getShipMaster(shipId) {
  return SHIPS.find((s) => s.id === shipId);
}

function getEnemyMaster(enemyId) {
  return ENEMIES.find((e) => e.id === enemyId);
}

function getMap(mapId) {
  return MAPS.find((m) => m.id === mapId);
}

function getQuest(questId) {
  return QUESTS.find((q) => q.id === questId);
}

function levelMultiplier(level) {
  return 1 + (Math.max(1, level) - 1) * 0.03;
}

function applyFormation(base, formationId) {
  const f = FORMATIONS[formationId] || FORMATIONS.LINE_AHEAD;
  return {
    attack: base.attack * f.attack,
    defense: base.defense * f.defense,
    evasion: base.evasion * f.evasion,
  };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function shipDamageState(currentHp, maxHp) {
  const ratio = currentHp / Math.max(1, maxHp);
  if (currentHp <= 0) return 'SUNK';
  if (ratio <= 0.25) return 'HEAVY';
  if (ratio <= 0.5) return 'MODERATE';
  if (ratio <= 0.75) return 'LIGHT';
  return 'HEALTHY';
}

function buildPlayerUnit(state, shipId, formationId) {
  const inst = state.ships[shipId];
  const master = getShipMaster(shipId);
  const lv = inst.level;
  const scale = levelMultiplier(lv);

  const base = {
    id: shipId,
    name: master.name,
    type: master.type,
    maxHp: master.hp + Math.floor((lv - 1) * 0.5),
    hp: inst.currentHp,
    attack: Math.floor(master.fp * scale + (master.torp * 0.35) * scale),
    torp: Math.floor(master.torp * scale),
    aa: Math.floor(master.aa * scale),
    defense: Math.floor(master.armor * scale),
    evasion: Math.floor(master.evasion * scale),
    level: lv,
    morale: inst.morale,
    supplyFuel: inst.supply.fuel,
    supplyAmmo: inst.supply.ammo,
    maxFuel: master.maxFuel,
    maxAmmo: master.maxAmmo,
    isPlayer: true,
  };

  const form = applyFormation({ attack: base.attack, defense: base.defense, evasion: base.evasion }, formationId);
  return { ...base, attack: Math.floor(form.attack), defense: Math.floor(form.defense), evasion: Math.floor(form.evasion) };
}

function buildEnemyUnit(enemyId, formationId) {
  const e = getEnemyMaster(enemyId);
  const base = {
    id: enemyId,
    name: e.name,
    type: e.type,
    maxHp: e.hp,
    hp: e.hp,
    attack: e.fp + e.torp * 0.35,
    torp: e.torp,
    aa: e.aa,
    defense: e.armor,
    evasion: e.evasion,
    level: 1,
    morale: 49,
    supplyFuel: 100,
    supplyAmmo: 100,
    maxFuel: 100,
    maxAmmo: 100,
    isPlayer: false,
  };

  const form = applyFormation({ attack: base.attack, defense: base.defense, evasion: base.evasion }, formationId);
  return { ...base, attack: Math.floor(form.attack), defense: Math.floor(form.defense), evasion: Math.floor(form.evasion) };
}

function aliveUnits(units) {
  return units.filter((u) => u.hp > 0);
}

function chooseTarget(rng, units) {
  const alive = aliveUnits(units);
  if (alive.length === 0) return null;
  return alive[Math.floor(rng() * alive.length)];
}

function getSupplyPenalty(unit) {
  const fuelPct = unit.supplyFuel / Math.max(1, unit.maxFuel);
  const ammoPct = unit.supplyAmmo / Math.max(1, unit.maxAmmo);
  let attack = 1;
  let evasion = 1;

  if (fuelPct < 0.75) evasion -= 0.08;
  if (fuelPct < 0.5) {
    attack -= 0.1;
    evasion -= 0.12;
  }
  if (ammoPct < 0.5) attack -= 0.18;

  return { attack: Math.max(0.55, attack), evasion: Math.max(0.55, evasion) };
}

function performAttack(rng, attacker, target, phase, log) {
  if (attacker.hp <= 0 || target.hp <= 0) return;

  const sup = getSupplyPenalty(attacker);
  const hitChance = clamp(0.6 + (attacker.evasion * 0.003) - (target.evasion * 0.0025), 0.15, 0.95) * sup.evasion;
  const hit = rng() < hitChance;
  if (!hit) {
    log.push(`${phase}: ${attacker.name} missed ${target.name}`);
    return;
  }

  const crit = rng() < 0.12;
  const critMod = crit ? 1.5 : 1;
  const spread = 0.85 + rng() * 0.3;

  const raw = attacker.attack * sup.attack * spread * critMod;
  const mitigated = Math.max(1, Math.floor(raw - target.defense * (0.55 + rng() * 0.35)));
  target.hp = Math.max(0, target.hp - mitigated);

  log.push(`${phase}: ${attacker.name} hit ${target.name} for ${mitigated}${crit ? ' (CRIT)' : ''}`);
}

function phaseOrderBySpeed(units) {
  return [...aliveUnits(units)].sort((a, b) => b.evasion - a.evasion || b.level - a.level);
}

function runBattle(playerUnits, enemyUnits, options) {
  const seed = seedFrom(options.seed, Date.now());
  const rng = makeRng(seed);
  const log = [];

  for (const cv of playerUnits.filter((u) => u.type === SHIP_TYPES.CV && u.hp > 0)) {
    const t = chooseTarget(rng, enemyUnits);
    if (!t) break;
    performAttack(rng, { ...cv, attack: cv.aa + cv.attack * 0.35 }, t, 'Air Strike', log);
  }
  for (const cv of enemyUnits.filter((u) => u.type === SHIP_TYPES.CV && u.hp > 0)) {
    const t = chooseTarget(rng, playerUnits);
    if (!t) break;
    performAttack(rng, { ...cv, attack: cv.aa + cv.attack * 0.35 }, t, 'Enemy Air Strike', log);
  }

  const turnQueue = phaseOrderBySpeed([...playerUnits, ...enemyUnits]);
  for (const attacker of turnQueue) {
    if (attacker.hp <= 0) continue;
    const targets = attacker.isPlayer ? enemyUnits : playerUnits;
    const t = chooseTarget(rng, targets);
    if (!t) continue;
    performAttack(rng, attacker, t, 'Shelling', log);
  }

  const torpers = [...playerUnits, ...enemyUnits].filter((u) => u.hp > 0 && (u.type === SHIP_TYPES.DD || u.type === SHIP_TYPES.CL));
  for (const attacker of torpers) {
    const targets = attacker.isPlayer ? enemyUnits : playerUnits;
    const t = chooseTarget(rng, targets);
    if (!t) continue;
    performAttack(rng, { ...attacker, attack: attacker.torp * 1.1 }, t, 'Torpedo', log);
  }

  if (aliveUnits(playerUnits).length > 0 && aliveUnits(enemyUnits).length > 0) {
    const nightTurns = phaseOrderBySpeed([...playerUnits, ...enemyUnits]);
    for (const attacker of nightTurns) {
      if (attacker.hp <= 0) continue;
      const targets = attacker.isPlayer ? enemyUnits : playerUnits;
      const t = chooseTarget(rng, targets);
      if (!t) continue;
      performAttack(rng, { ...attacker, attack: attacker.attack * 1.12 }, t, 'Night', log);
    }
  }

  const playerAlive = aliveUnits(playerUnits).length;
  const enemyAlive = aliveUnits(enemyUnits).length;

  let result = 'DRAW';
  if (playerAlive > 0 && enemyAlive === 0) result = 'PLAYER_WIN';
  if (enemyAlive > 0 && playerAlive === 0) result = 'ENEMY_WIN';
  if (playerAlive > enemyAlive && result === 'DRAW') result = 'PLAYER_EDGE';
  if (enemyAlive > playerAlive && result === 'DRAW') result = 'ENEMY_EDGE';

  return { seed, log, result, playerUnits, enemyUnits };
}

function addResourceBundle(resources, delta) {
  Object.keys(resources).forEach((k) => {
    if (delta[k]) resources[k] += delta[k];
  });
}

function consumeShipSupply(state, shipId, fuelCost, ammoCost) {
  const inst = state.ships[shipId];
  if (!inst) return;
  inst.supply.fuel = Math.max(0, inst.supply.fuel - fuelCost);
  inst.supply.ammo = Math.max(0, inst.supply.ammo - ammoCost);
}

function updateQuest(state, kind, amount = 1) {
  for (const quest of QUESTS) {
    const p = state.quests.progress[quest.id];
    if (!p || p.claimed) continue;
    if (quest.objective.kind !== kind) continue;
    p.current += amount;
    if (p.current >= quest.objective.target) p.completed = true;
    p.updatedAt = Date.now();
  }
}

function rollDrop(state, mapId) {
  const seed = seedFrom('drop', mapId, state.sortie.totalBattles, Date.now());
  const rng = makeRng(seed);
  const locked = new Set(state.ownedShipIds);
  const candidates = SHIPS.filter((s) => !locked.has(s.id));
  if (candidates.length === 0) return null;
  if (rng() > 0.35) return null;
  return candidates[Math.floor(rng() * candidates.length)].id;
}

function ensureShipInstance(state, shipId) {
  const master = getShipMaster(shipId);
  if (!master) return;

  if (!state.ships[shipId]) {
    state.ships[shipId] = {
      shipId,
      level: 1,
      xp: 0,
      morale: 49,
      currentHp: master.hp,
      supply: { fuel: master.maxFuel, ammo: master.maxAmmo },
      repairEndTime: null,
      locked: false,
      equipment: [null, null, null],
    };
  }

  if (!state.ownedShipIds.includes(shipId)) {
    state.ownedShipIds.push(shipId);
  }
}

function getRarityPool(rarity) {
  return SHIPS.filter((s) => s.rarity === rarity);
}

function rarityRoll(rng) {
  const pityRoll = rng() * 100;
  if (pityRoll < 2) return 'SSR';
  if (pityRoll < 10) return 'SR';
  if (pityRoll < 38) return 'R';
  return 'N';
}

export function normalizeState(inputState) {
  if (!inputState || typeof inputState !== 'object') return createDefaultGameState();
  const base = createDefaultGameState();
  return {
    ...base,
    ...inputState,
    profile: { ...base.profile, ...(inputState.profile || {}) },
    resources: { ...base.resources, ...(inputState.resources || {}) },
    gacha: { ...base.gacha, ...(inputState.gacha || {}) },
    ships: { ...base.ships, ...(inputState.ships || {}) },
    fleets: { ...base.fleets, ...(inputState.fleets || {}) },
    sortie: { ...base.sortie, ...(inputState.sortie || {}) },
    quests: {
      ...base.quests,
      ...(inputState.quests || {}),
      progress: { ...base.quests.progress, ...((inputState.quests || {}).progress || {}) },
    },
    expeditions: { ...base.expeditions, ...(inputState.expeditions || {}) },
    docks: { ...base.docks, ...(inputState.docks || {}) },
    logs: { ...base.logs, ...(inputState.logs || {}) },
  };
}

export function resupplyFleet(inputState) {
  const state = clone(inputState);
  const fleet = state.fleets[state.fleets.activeFleetId] || [];

  for (const shipId of fleet.filter(Boolean)) {
    const inst = state.ships[shipId];
    const master = getShipMaster(shipId);
    if (!inst || !master) continue;

    const fuelNeed = master.maxFuel - inst.supply.fuel;
    const ammoNeed = master.maxAmmo - inst.supply.ammo;

    if (state.resources.fuel < fuelNeed || state.resources.ammo < ammoNeed) continue;

    state.resources.fuel -= fuelNeed;
    state.resources.ammo -= ammoNeed;
    inst.supply.fuel = master.maxFuel;
    inst.supply.ammo = master.maxAmmo;
  }

  return state;
}

export function startSortie(inputState, mapId, formationId = 'LINE_AHEAD') {
  const state = clone(inputState);
  const map = getMap(mapId);
  if (!map) return { state, error: 'Map not found' };

  const fleet = state.fleets[state.fleets.activeFleetId] || [];
  const fleetIds = fleet.filter(Boolean);
  if (fleetIds.length === 0) return { state, error: 'Fleet is empty' };

  for (const shipId of fleetIds) {
    const inst = state.ships[shipId];
    const master = getShipMaster(shipId);
    if (!inst || !master) continue;
    if (shipDamageState(inst.currentHp, master.hp) === 'HEAVY') {
      return { state, error: `${master.name} is heavily damaged` };
    }
    if (inst.repairEndTime && Date.now() < inst.repairEndTime) {
      return { state, error: `${master.name} is under repair` };
    }
  }

  state.sortie.currentRun = {
    mapId,
    currentNode: 'start',
    visitedNodes: ['start'],
    fleetShipIds: fleetIds,
    formationId,
    startedAt: Date.now(),
  };

  state.sortie.totalSorties += 1;
  updateQuest(state, 'sorties', 1);
  return { state };
}

export function getReachableNodes(state) {
  const run = state.sortie.currentRun;
  if (!run) return [];
  const map = getMap(run.mapId);
  if (!map) return [];
  return map.nodes[run.currentNode]?.next || [];
}

export function advanceSortieNode(inputState, nodeId) {
  const state = clone(inputState);
  const run = state.sortie.currentRun;
  if (!run) return { state, error: 'No active sortie' };

  const map = getMap(run.mapId);
  if (!map) return { state, error: 'Map not found' };

  const reachable = map.nodes[run.currentNode]?.next || [];
  if (!reachable.includes(nodeId)) {
    return { state, error: 'Node not reachable from current position' };
  }

  run.currentNode = nodeId;
  run.visitedNodes.push(nodeId);

  const node = map.nodes[nodeId];
  if (node.type === 'resource') {
    addResourceBundle(state.resources, node.resource || {});
    return { state, event: { type: 'resource', nodeId, resource: node.resource || {} } };
  }

  if (node.type === 'battle' || node.type === 'boss') {
    const battle = resolveNodeBattle(state, node, map);
    return { state: battle.state, event: battle.event };
  }

  return { state, event: { type: 'move', nodeId } };
}

function resolveNodeBattle(state, node, map) {
  const run = state.sortie.currentRun;
  const playerUnits = run.fleetShipIds.map((id) => buildPlayerUnit(state, id, run.formationId));
  const enemyUnits = (node.enemies || []).map((id) => buildEnemyUnit(id, 'LINE_AHEAD'));

  const battle = runBattle(playerUnits, enemyUnits, {
    seed: seedFrom(map.id, node.id, state.sortie.totalBattles),
  });

  run.fleetShipIds.forEach((shipId) => {
    const inst = state.ships[shipId];
    const unit = battle.playerUnits.find((u) => u.id === shipId);
    const master = getShipMaster(shipId);
    if (!inst || !unit || !master) return;

    inst.currentHp = Math.max(0, unit.hp);
    inst.morale = clamp(inst.morale + (battle.result.startsWith('PLAYER') ? 2 : -4), 0, 100);

    consumeShipSupply(state, shipId, Math.ceil(master.maxFuel * 0.12), Math.ceil(master.maxAmmo * 0.14));

    const xpGain = battle.result.startsWith('PLAYER') ? map.baseExp : Math.floor(map.baseExp * 0.45);
    inst.xp += xpGain;
    while (inst.level < 99) {
      const need = Math.floor(100 * Math.pow(inst.level, 1.5));
      if (inst.xp < need) break;
      inst.xp -= need;
      inst.level += 1;
    }
  });

  state.sortie.totalBattles += 1;
  updateQuest(state, 'battles', 1);

  let mapCleared = false;
  if (node.type === 'boss' && battle.result.startsWith('PLAYER')) {
    mapCleared = true;
    state.sortie.totalBossWins += 1;
    updateQuest(state, 'bossWins', 1);

    if (!state.sortie.mapClears[map.id]) {
      state.sortie.mapClears[map.id] = { clearedAt: Date.now(), clears: 1 };
      updateQuest(state, 'mapClears', 1);
    } else {
      state.sortie.mapClears[map.id].clears += 1;
    }

    addResourceBundle(state.resources, map.clearRewards || {});
    state.resources.tickets += 1;
  }

  const drop = battle.result.startsWith('PLAYER') ? rollDrop(state, map.id) : null;
  if (drop) ensureShipInstance(state, drop);

  state.logs.recentBattles.unshift({
    at: Date.now(),
    mapId: map.id,
    nodeId: node.id,
    result: battle.result,
    log: battle.log,
    drop,
  });
  state.logs.recentBattles = state.logs.recentBattles.slice(0, 20);

  if (battle.result === 'ENEMY_WIN' || mapCleared) {
    state.sortie.currentRun = null;
  }

  return {
    state,
    event: {
      type: 'battle',
      mapId: map.id,
      nodeId: node.id,
      nodeType: node.type,
      result: battle.result,
      log: battle.log,
      drop,
      mapCleared,
      playerUnits: battle.playerUnits,
      enemyUnits: battle.enemyUnits,
    },
  };
}

export function retreatSortie(inputState) {
  const state = clone(inputState);
  state.sortie.currentRun = null;
  return state;
}

export function claimQuest(inputState, questId) {
  const state = clone(inputState);
  const progress = state.quests.progress[questId];
  const quest = getQuest(questId);
  if (!progress || !quest) return { state, error: 'Quest not found' };
  if (!progress.completed || progress.claimed) return { state, error: 'Quest not claimable' };

  addResourceBundle(state.resources, quest.rewards);
  progress.claimed = true;
  return { state, rewards: quest.rewards };
}

export function dispatchExpedition(inputState, expeditionId) {
  const state = clone(inputState);
  const expedition = EXPEDITIONS.find((e) => e.id === expeditionId);
  if (!expedition) return { state, error: 'Expedition not found' };

  if (state.expeditions.active.length >= state.expeditions.slotsUnlocked) {
    return { state, error: 'No free expedition slot' };
  }

  const fleet = state.fleets[state.fleets.activeFleetId].filter(Boolean);
  if (fleet.length < expedition.requirements.minShips) {
    return { state, error: 'Fleet requirement not met' };
  }

  const mission = {
    id: `${expedition.id}_${Date.now()}`,
    expeditionId: expedition.id,
    startedAt: Date.now(),
    endsAt: Date.now() + expedition.durationMin * 60 * 1000,
  };

  state.expeditions.active.push(mission);
  return { state, mission };
}

export function tickExpeditions(inputState, now = Date.now()) {
  const state = clone(inputState);
  const active = [];

  for (const mission of state.expeditions.active) {
    if (now < mission.endsAt) {
      active.push(mission);
      continue;
    }

    const expedition = EXPEDITIONS.find((e) => e.id === mission.expeditionId);
    if (!expedition) continue;

    addResourceBundle(state.resources, expedition.rewards);
    state.expeditions.completed.unshift({ ...mission, completedAt: now, rewards: expedition.rewards });
  }

  state.expeditions.active = active;
  state.expeditions.completed = state.expeditions.completed.slice(0, 20);
  return state;
}

export function startRepair(inputState, shipId) {
  const state = clone(inputState);
  const ship = state.ships[shipId];
  const master = getShipMaster(shipId);
  if (!ship || !master) return { state, error: 'Ship not found' };

  if (ship.currentHp >= master.hp) return { state, error: 'Ship is not damaged' };
  if (ship.repairEndTime && Date.now() < ship.repairEndTime) return { state, error: 'Ship already in repair' };

  const slots = state.docks.slots || [null, null, null, null, null];
  const owned = state.docks.owned || 2;
  let idx = -1;
  for (let i = 0; i < owned; i++) {
    if (!slots[i]) {
      idx = i;
      break;
    }
  }
  if (idx < 0) return { state, error: 'No available repair dock' };

  const missing = master.hp - ship.currentHp;
  const minutes = Math.max(2, missing * 2);
  ship.repairEndTime = Date.now() + minutes * 60 * 1000;
  slots[idx] = shipId;
  state.docks.slots = slots;

  return { state, dockIndex: idx, etaMin: minutes };
}

export function instantRepair(inputState, shipId) {
  const state = clone(inputState);
  const ship = state.ships[shipId];
  const master = getShipMaster(shipId);
  if (!ship || !master) return { state, error: 'Ship not found' };
  if (state.resources.buckets <= 0) return { state, error: 'No buckets available' };

  const idx = (state.docks.slots || []).indexOf(shipId);
  if (idx < 0) return { state, error: 'Ship not in dock' };

  state.resources.buckets -= 1;
  ship.currentHp = master.hp;
  ship.repairEndTime = null;
  state.docks.slots[idx] = null;
  return { state };
}

export function constructionPull(inputState) {
  const state = clone(inputState);

  for (const key of Object.keys(CONSTRUCTION_COST)) {
    if (state.resources[key] < CONSTRUCTION_COST[key]) {
      return { state, error: 'Insufficient resources for construction' };
    }
  }

  for (const key of Object.keys(CONSTRUCTION_COST)) {
    state.resources[key] -= CONSTRUCTION_COST[key];
  }

  const pity = state.gacha.standardPity || 0;
  const rng = makeRng(seedFrom('construction', Date.now(), pity, state.ownedShipIds.length));

  let rarity;
  if (pity >= PITY_THRESHOLD - 1) {
    rarity = 'SSR';
    state.gacha.standardPity = 0;
  } else {
    rarity = rarityRoll(rng);
    if (rarity === 'SSR') state.gacha.standardPity = 0;
    else state.gacha.standardPity += 1;
  }

  const pool = getRarityPool(rarity);
  const rolled = pool[Math.floor(rng() * pool.length)];

  let isNew = false;
  if (!state.ownedShipIds.includes(rolled.id)) {
    isNew = true;
    ensureShipInstance(state, rolled.id);
  } else {
    // Duplicate XP bonus
    const inst = state.ships[rolled.id];
    inst.xp += rarity === 'SSR' ? 500 : rarity === 'SR' ? 250 : rarity === 'R' ? 120 : 60;
  }

  return { state, result: { shipId: rolled.id, rarity, isNew, pity: state.gacha.standardPity } };
}

export function autoRepairTick(inputState, now = Date.now()) {
  const state = clone(inputState);
  const slots = state.docks.slots || [];

  slots.forEach((shipId, idx) => {
    if (!shipId) return;
    const inst = state.ships[shipId];
    const master = getShipMaster(shipId);
    if (!inst || !master) return;
    if (inst.repairEndTime && now >= inst.repairEndTime) {
      inst.currentHp = master.hp;
      inst.repairEndTime = null;
      slots[idx] = null;
    }
  });

  for (const shipId of state.ownedShipIds) {
    const inst = state.ships[shipId];
    if (!inst) continue;
    if (inst.morale < 49) inst.morale = Math.min(49, inst.morale + 1);
  }

  state.profile.lastActiveAt = now;
  state.docks.slots = slots;
  return state;
}
