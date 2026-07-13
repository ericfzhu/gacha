# Kantai Collection Story Backlog and MVP Sprint Plan

Sources:
- `/Users/eric/Documents/Github/gacha/docs/kancolle-gameplay-design-spec.md`
- `/Users/eric/Documents/Github/gacha/docs/kancolle-epics.md`

Planning assumptions:
- Hard cutover stack: React + Tailwind + Framer + Pixi + Worker + D1
- Server-side Access auth
- 2-week sprints
- Single team focused on rapid delivery

Priority legend:
- P0: Required for MVP
- P1: Important post-MVP hardening
- P2: Later expansion

## Sprint 1 (P0): Vertical Slice Foundation
Goal:
- Reach first playable loop from Home -> Sortie -> Battle -> Save.

Stories:
1. [P0] Story S1-1: Canonical game state schema v2
- Scope: state model, defaults, serializer, strict normalization
- Done when: state round-trip tests pass and no undefined state branches in UI
- Epic: 1

2. [P0] Story S1-2: Worker + D1 game-state API baseline
- Scope: `/api/session`, `/api/game-state` GET/POST, D1 schema/migration script
- Done when: state loads/saves for authenticated user and rejects unauthenticated access
- Epic: 12

3. [P0] Story S1-3: Home to Gameplay route contract
- Scope: home `Start` route and protected `/game` entry assumptions
- Done when: Start always opens gameplay route and local dev fallback behavior is documented
- Epic: 11

4. [P0] Story S1-4: Deterministic battle resolver core
- Scope: phase ordering, RNG seed strategy, result object model
- Done when: same seed/input yields identical outputs across runs
- Epic: 5

5. [P0] Story S1-5: Minimal Pixi battle presentation
- Scope: render player/enemy formations + battle logs from resolver output
- Done when: a full battle can be visually followed without direct ship control
- Epic: 11

6. [P0] Story S1-6: Map/node sortie state machine v1
- Scope: start sortie, advance node, retreat, boss clear end condition
- Done when: a map can be completed end-to-end and persisted
- Epic: 4

## Sprint 2 (P0): Operations Core
Goal:
- Implement economy and readiness constraints that define KanColle-like play.

Stories:
1. [P0] Story S2-1: Resource economy operations
- Scope: spend/gain helpers, ledger-safe updates, edge-case guards
- Done when: every gameplay action uses centralized resource transactions
- Epic: 2

2. [P0] Story S2-2: Ship lifecycle baseline
- Scope: HP/morale/supply/XP/level progression and state transitions
- Done when: post-battle ship state updates are complete and persisted
- Epic: 3

3. [P0] Story S2-3: Fleet validation and sortie readiness
- Scope: empty fleet checks, heavy-damage lockout, in-repair lockout
- Done when: invalid fleets cannot sortie and errors are clear in UI
- Epic: 3

4. [P0] Story S2-4: Resupply and supply penalties in battle
- Scope: consume and refill supply; apply low supply combat modifiers
- Done when: low supply materially changes battle outcomes in tests
- Epic: 2

5. [P0] Story S2-5: Timed repair dock system
- Scope: start repair, dock slot allocation, completion tick, instant bucket repair
- Done when: damaged ships can be repaired only through dock flow
- Epic: 6

6. [P0] Story S2-6: Gameplay operations UI panels
- Scope: Port, Fleet, Sortie, Combat tabs aligned to resolver/state
- Done when: user can complete loop without using dev console
- Epic: 11

## Sprint 3 (P0): Progression and Retention Loop
Goal:
- Add construction, quests, and expeditions for replayable progression.

Stories:
1. [P0] Story S3-1: Standard construction with pity
- Scope: cost checks, rarity roll, pity reset rules, duplicate handling
- Done when: construction results are deterministic and persisted
- Epic: 7

2. [P0] Story S3-2: Map drop acquisition channel
- Scope: post-battle drop roll and new ship onboarding
- Done when: new ships can be earned from maps with tunable rates
- Epic: 7

3. [P0] Story S3-3: Quest templates and progress hooks
- Scope: daily/weekly/one-time definitions + event-driven counters
- Done when: quest progress updates from sorties/battles/clears and rewards claim correctly
- Epic: 9

4. [P0] Story S3-4: Reset cadence engine
- Scope: daily/weekly reset timestamps and rollover behavior
- Done when: quest reset windows are deterministic and tested
- Epic: 9

5. [P0] Story S3-5: Expedition async missions
- Scope: dispatch validation, mission timers, completion rewards
- Done when: expeditions can run concurrently with active gameplay
- Epic: 10

6. [P0] Story S3-6: Save integrity and migration hardening
- Scope: schema evolution tests, corrupted state fallback, backend conflict policy
- Done when: migration fixtures pass for all supported schema versions
- Epic: 1, 12

## Sprint 4 (P1): Feature Completion for Spec Parity (Core)
Goal:
- Complete missing major systems for spec fidelity.

Stories:
1. [P1] Story S4-1: Equipment inventory and slot compatibility
- Epic: 8
2. [P1] Story S4-2: Equipment development flow
- Epic: 8
3. [P1] Story S4-3: Equipment battle stat integration
- Epic: 8, 5
4. [P1] Story S4-4: Morale tier UX and modifiers tuning
- Epic: 6
5. [P1] Story S4-5: HQ XP and unlock gates (fleet/expedition/map systems)
- Epic: 1
6. [P1] Story S4-6: Full telemetry events and balancing dashboards
- Epic: 15

## Sprint 5 (P1): Competitive and Live-Ops Foundation
Goal:
- Add optional high-engagement systems.

Stories:
1. [P1] Story S5-1: Exercises system baseline
- Epic: 13
2. [P1] Story S5-2: Ranking periods and score calculation
- Epic: 13
3. [P1] Story S5-3: Ranking reward distribution
- Epic: 13
4. [P1] Story S5-4: Event map framework (data-driven)
- Epic: 14
5. [P1] Story S5-5: Event difficulty tiers and reward mapping
- Epic: 14
6. [P1] Story S5-6: Combined fleet scaffolding for event operations
- Epic: 14

## Sprint 6 (P2): Polish and Scale
Goal:
- Operational quality, performance, and content scale-up.

Stories:
1. [P2] Story S6-1: Battle replay viewer and log browser
- Epic: 11, 15
2. [P2] Story S6-2: Performance optimization and code splitting
- Epic: 15
3. [P2] Story S6-3: UX pass for Notion-inspired consistency across all panels
- Epic: 11
4. [P2] Story S6-4: Content authoring tooling for maps/quests/events
- Epic: 14, 15
5. [P2] Story S6-5: Live tuning controls for drop rates/economy constants
- Epic: 15
6. [P2] Story S6-6: Pre-launch reliability checklist and rollback drills
- Epic: 15

## MVP Definition
MVP is complete at end of Sprint 3 when all P0 stories are done:
- Protected app loads and persists state via Worker + D1
- Core turn-based sortie and battle loops are complete
- Ships are non-controllable in battle
- Resource/supply/repair constraints are active
- Construction, quests, and expeditions are playable

## Immediate Execution Queue (next 10 tasks)
1. Implement strict reset cadence logic for daily/weekly quests.
2. Add quest event bus hooks for every state mutation path.
3. Add battle resolver unit tests for deterministic seeds.
4. Add supply penalty tests covering threshold edges.
5. Add dock slot and repair timer integration tests.
6. Add API contract tests for game-state read/write shape.
7. Add schema migration fixture tests.
8. Add state validation guard on server write path.
9. Add UI error boundary for corrupted/incomplete state.
10. Add end-to-end smoke test: home -> sortie -> boss clear -> save -> reload.

## Proactive Delivery Order (recommended)
1. Freeze API/state contracts before adding more gameplay UI.
2. Complete all resolver and state tests before tuning balance values.
3. Treat every new feature as data-driven first, UI second.
4. Keep server write validation strict; reject unknown/invalid state payloads.
5. Run smoke test on every merge to prevent regression in core loop.
