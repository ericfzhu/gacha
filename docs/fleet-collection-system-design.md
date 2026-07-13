# Fleet Collection System Design

Date: February 18, 2026
Inputs:
- `/Users/eric/Documents/Github/gacha/docs/kancolle-gameplay-design-spec.md`
- Current codebase architecture in `/Users/eric/Documents/Github/gacha/src`

## 1. Objective
Define an implementation-ready system design for this game that:
- Preserves the current Phaser + Vite app structure.
- Expands the design toward KanColle-style depth (logistics, progression, routing, combat phases).
- Remains modular and data-driven so features can be added without scene-level rewrites.

## 2. Current State (As Implemented)
## 2.1 Runtime and Platform
- Frontend single-page game with Phaser 3 and Vite.
- Backend API via Cloudflare Workers + D1 for player/session persistence.
- Local `localStorage` retained as client cache and offline fallback.
- Scene-driven navigation and UI flow (`src/scenes/*`).

## 2.2 Core Modules
- Data tables: `src/data/*`
- Gameplay systems: `src/systems/storage.js`, `gacha.js`, `premiumGacha.js`, `audio.js`, `ui.js`, `api.js`
- Entry shell: `src/main.jsx`
- Backend service: `worker/index.js` with schema `worker/schema.sql`

## 2.3 Existing Feature Coverage
- Standard gacha with pity and duplicate XP.
- Premium gacha with grand prizes + token exchange.
- Fleet organization, map nodes, battle, dock repair, collection.
- Secret code and artwork mode switching.

## 2.4 Gaps vs Target Design
Not yet represented as first-class systems:
- Morale/fatigue loop.
- Full fuel/ammo logistics with penalties.
- Quest framework (daily/weekly/monthly templates + tracker).
- Expedition framework.
- Unified battle resolver abstraction separated from scene rendering.

## 3. Target Architecture
## 3.1 Layered Design
1. **Presentation Layer** (`src/scenes/*`)
- Collect player input.
- Render state from services.
- Emit commands to application services.

2. **Application/Domain Services** (`src/systems/*` and new submodules)
- Contain deterministic game rules.
- Mutate save state via a single persistence boundary.
- Return explicit result objects for UI.

3. **Data Layer** (`src/data/*`)
- Immutable static content (ships, maps, enemies, formations, equipment, quest templates, expeditions).

4. **Persistence Layer** (`Storage` abstraction + D1)
- Local save schema + migrations + transactional update helper.
- D1-backed user/session profile records and future server-authoritative progression.

## 3.4 Backend Topology (Cloudflare)
- Cloudflare Worker routes under `/api/*`.
- D1 stores users (and later account progression tables).
- Frontend calls backend via `src/systems/api.js` (`VITE_API_BASE` configurable).
- Authentication is handled by Cloudflare Zero Trust Access.
- Worker identity source is Access headers; `/api/auth/me` is the auth probe route.
- Deploy split:
  - Frontend static bundle: Cloudflare Pages
  - API + database: Cloudflare Worker + D1

## 3.2 Module Decomposition
Keep existing files and add these modules:
- `src/systems/battleResolver.js`
- `src/systems/sortieService.js`
- `src/systems/fleetService.js`
- `src/systems/progressionService.js`
- `src/systems/equipmentService.js`
- `src/systems/moraleService.js`
- `src/systems/supplyService.js`
- `src/systems/questService.js`
- `src/systems/expeditionService.js`
- `src/systems/timeService.js`

Add data catalogs:
- `src/data/quests.js`
- `src/data/expeditions.js`

## 3.3 Scene-to-Service Boundaries
`BattleScene`:
- Should orchestrate flow and animation only.
- Uses `battleResolver` for phase math.
- Uses `sortieService` for node progression, retreat, and rewards.

`MapScene`:
- Should ask `sortieService.getReachableNodes()` and `sortieService.advanceNode()`.

`FleetScene`:
- Uses `fleetService.validateSortieReadiness()` and `equipmentService.validateLoadout()`.

`DockScene`:
- Uses `supplyService` and `moraleService` for pre-sortie readiness indicators.

`TitleScene`:
- Pulls aggregate dashboard data from `progressionService.getHomeSummary()`.

## 4. Data Design
## 4.1 Save Schema (v2 target)
```js
{
  version: 2,
  profile: {
    commanderName: "string",
    hqLevel: 1,
    hqXp: 0,
    rank: "NEWBIE"
  },
  resources: {
    fuel: 1000,
    ammo: 1000,
    steel: 1000,
    bauxite: 1000,
    buckets: 0,
    devMats: 0,
    screws: 0,
    tickets: 5,
    pityTokens: 0
  },
  gacha: {
    standardPity: 0,
    premiumPulls: 0,
    grandPrizes: { prize1: false, prize2: false, prize3: false }
  },
  ships: {
    "shipId": {
      level: 1,
      xp: 0,
      currentHp: null,
      morale: 49,
      supply: { fuel: 100, ammo: 100 },
      repairEndTime: null,
      modernize: { fp: 0, torp: 0, aa: 0, armor: 0 }
    }
  },
  fleets: {
    activeFleetId: "fleet1",
    fleet1: [null, null, null, null, null, null],
    fleet2: [null, null, null, null, null, null],
    fleet3: [null, null, null, null, null, null],
    fleet4: [null, null, null, null, null, null]
  },
  equipment: {
    owned: [],
    shipEquipment: {}
  },
  sortie: {
    currentRun: null,
    mapClears: {}
  },
  expeditions: {
    slotsUnlocked: 1,
    active: []
  },
  quests: {
    activeIds: [],
    progress: {},
    claimed: {}
  },
  settings: {
    artworkMode: "pokemon",
    secretCodeRedeemed: false,
    audio: { muted: false, bgmVolume: 0.5, sfxVolume: 0.7 }
  },
  stats: {
    totalPulls: 0,
    battlesWon: 0,
    battlesLost: 0,
    sorties: 0
  }
}
```

## 4.2 Migration Strategy
- Add `version` field to save root.
- Introduce `Storage.migrate(save)` chain:
  - v0 -> v1 (existing collection migration)
  - v1 -> v2 (resource split, morale/supply defaults, multi-fleet scaffolding, quest/expedition containers)
- Ensure idempotent migrations and fallback defaults.

## 4.3 Static Content Model
`ships.js` additions:
- `maxFuel`, `maxAmmo`, `remodelPath`, `remodelLevelReq`

`maps.js` additions:
- `routingRules`, `gauge`, `dropTableId`, `expReward`

New `quests.js` structure:
- `id`, `type` (`daily|weekly|monthly|oneTime`), `prerequisites`, `objectives`, `rewards`

New `expeditions.js` structure:
- `id`, `durationSec`, `requirements`, `successRewards`, `greatSuccessRewards`

## 5. Core Domain Services
## 5.1 `battleResolver`
Responsibility:
- Deterministic battle simulation with explicit phase outputs.

Input:
- Player fleet state, enemy fleet state, map context, formation context, seed.

Output:
- `phaseResults[]`, updated HP, MVP, rank, drops, moraleDelta, supplyDelta.

Contract:
- No rendering calls.
- Pure function or side-effect-free module.

## 5.2 `sortieService`
Responsibility:
- Start sortie, route advancement, retreat handling, clear/gauge updates.

Key functions:
- `startSortie(mapId, fleetId)`
- `getReachableNodes(runState)`
- `advanceNode(runState, nodeId)`
- `finishBattle(runState, battleSummary)`
- `retreat(runState)`

## 5.3 `fleetService`
Responsibility:
- Fleet editing, legality checks, sortie readiness checks.

Validation:
- Slot rules, duplicates policy, damaged ship policy, repair lockout.

## 5.4 `supplyService`
Responsibility:
- Resupply costs, supply penalties, consumption after battle.

Rules:
- Fuel and ammo percentages affect combat modifiers.
- Full resupply operation consumes `resources` and fills ship supply bars.

## 5.5 `moraleService`
Responsibility:
- Morale deltas from battles and timed recovery.

Rules:
- Battle result and MVP adjust morale.
- Passive time recovery while idle.
- Threshold tiers exposed as UI-friendly enums.

## 5.6 `questService`
Responsibility:
- Quest activation, objective updates from events, reward claims.

Event hooks:
- `onSortieStart`, `onBattleEnd`, `onMapClear`, `onConstruct`, `onDevelop`, `onExpeditionComplete`.

## 5.7 `expeditionService`
Responsibility:
- Dispatch/complete async fleet missions.

Rules:
- Validate fleet requirements.
- Store `endTime` and completion payload.
- Support great success via morale/requirements.

## 5.8 `progressionService`
Responsibility:
- HQ XP, unlocks, player-level progression milestones.

Unlock examples:
- Fleet 2, expedition slots, advanced maps, systems panels.

## 6. Runtime Flow Design
## 6.1 Sortie Flow
1. `FleetScene` validates readiness via `fleetService`.
2. `BattleScene`/`MapScene` starts run via `sortieService.startSortie`.
3. Node chosen in `MapScene`; `sortieService.advanceNode` resolves transition.
4. `BattleScene` calls `battleResolver` with deterministic seed.
5. `sortieService.finishBattle` applies results to save state.
6. User chooses continue/retreat; state updates until clear or retreat.

## 6.2 Gacha Flow
1. Scene checks resource/ticket availability.
2. `gacha` or `premiumGacha` resolves reward.
3. `progressionService` + `questService` consume emitted events.
4. Scene renders result and updated balances.

## 6.3 Repair and Time Flow
1. `DockScene` starts repair timers.
2. `timeService.now()` used to evaluate completion on scene entry and periodic ticks.
3. `storage` applies finished repair state and emits notifications.

## 7. Eventing and State Mutation Pattern
Adopt a lightweight internal event bus for decoupling:
- `emitGameEvent(type, payload)`
- Subscribers: `questService`, `progressionService`, telemetry sink.

Mutation rule:
- Scenes never mutate save blobs directly.
- All write paths go through service functions using `Storage.update(mutator)`.

## 8. Non-Functional Design
## 8.1 Determinism and Debuggability
- Seeded RNG in battle and drop calculations.
- Persist last N battle logs for replay and troubleshooting.

## 8.2 Performance
- Keep battle math object allocations low.
- Cache computed ship/equipment stats per battle entry.
- Render list virtualization for large collections.

## 8.3 Reliability
- Save snapshots before risky transitions.
- Corruption fallback: recover to last good snapshot.

## 8.4 Security (Current Client-Only)
- Client-only architecture cannot prevent cheating.
- If ranked/event competition is added, migrate core logic server-authoritative.

## 9. Testing Strategy
Unit tests (pure services):
- `battleResolver`, `moraleService`, `supplyService`, `questService`, `sortieService`.

Property tests:
- RNG distribution sanity for gacha and drops.

Integration tests:
- Full sortie run, repair completion, quest completion chain, premium exchange flow.

Regression fixtures:
- Save migration fixtures for v0/v1/v2.

## 10. Rollout Plan
Phase A (Refactor for architecture safety):
- Introduce `Storage.update`, service boundaries, and battle resolver extraction.

Phase B (Core depth features):
- Supply + morale + quest system + data tables.

Phase C (Async and long-loop features):
- Expedition system and HQ progression unlocks.

Phase D (Advanced operations):
- Event framework, combined fleet scaffolding, ranking hooks.

## 11. Open Decisions
1. Keep or remove permanent ship loss behavior.
2. Exact fuel/ammo penalty curve values.
3. Whether to keep single-fleet UX while internally enabling 4 fleets.
4. Whether event/ranking features will require backend migration.

## 12. Immediate Build Backlog (Next 2 Weeks)
1. Extract battle logic from `BattleScene` into `battleResolver`.
2. Add save `version` and centralized migration pipeline.
3. Add `Storage.update` transactional helper.
4. Add `supplyService` with per-battle consumption and resupply operation.
5. Add `moraleService` and display morale in fleet/dock scenes.
6. Add `quests.js` + `questService` with daily and one-time quest MVP.

## 13. File Plan
New files:
- `/Users/eric/Documents/Github/gacha/src/systems/battleResolver.js`
- `/Users/eric/Documents/Github/gacha/src/systems/sortieService.js`
- `/Users/eric/Documents/Github/gacha/src/systems/fleetService.js`
- `/Users/eric/Documents/Github/gacha/src/systems/supplyService.js`
- `/Users/eric/Documents/Github/gacha/src/systems/moraleService.js`
- `/Users/eric/Documents/Github/gacha/src/systems/questService.js`
- `/Users/eric/Documents/Github/gacha/src/systems/expeditionService.js`
- `/Users/eric/Documents/Github/gacha/src/systems/progressionService.js`
- `/Users/eric/Documents/Github/gacha/src/systems/timeService.js`
- `/Users/eric/Documents/Github/gacha/src/data/quests.js`
- `/Users/eric/Documents/Github/gacha/src/data/expeditions.js`
- `/Users/eric/Documents/Github/gacha/worker/index.js`
- `/Users/eric/Documents/Github/gacha/worker/schema.sql`

Updates:
- `/Users/eric/Documents/Github/gacha/src/systems/storage.js`
- `/Users/eric/Documents/Github/gacha/src/scenes/BattleScene.js`
- `/Users/eric/Documents/Github/gacha/src/scenes/MapScene.js`
- `/Users/eric/Documents/Github/gacha/src/scenes/FleetScene.js`
- `/Users/eric/Documents/Github/gacha/src/scenes/DockScene.js`
- `/Users/eric/Documents/Github/gacha/src/scenes/HomeScene.js`
- `/Users/eric/Documents/Github/gacha/wrangler.toml`
