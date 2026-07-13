# Kantai Collection Spec to Epic Backlog

Source: `/Users/eric/Documents/Github/gacha/docs/kancolle-gameplay-design-spec.md`

## Epic 1: Core Account and State Platform
Goal:
- Establish a stable authoritative game-state model and lifecycle.

Scope:
- Profile/HQ/rank model
- Canonical state schema + migrations
- Save/load + snapshot strategy
- Core telemetry scaffolding

Acceptance Criteria:
- State schema versioned and migration-tested
- New account starts from deterministic default state
- Save/load roundtrip is lossless for all core entities

Dependencies:
- None

## Epic 2: Resource Economy and Operational Logistics
Goal:
- Implement fuel/ammo/steel/bauxite loops plus operational constraints.

Scope:
- Resource balances and reward/spend operations
- Resupply flows and penalties for low supply
- Buckets/devmats/screws baseline handling

Acceptance Criteria:
- All battle/sortie actions consume resources by rule
- Supply penalties affect battle outcomes
- Resource deltas are auditable in logs

Dependencies:
- Epic 1

## Epic 3: Ship Lifecycle and Fleet Management
Goal:
- Build progression and composition systems for owned ships and fleets.

Scope:
- Ship acquisition/instances
- Level/XP curves
- HP damage states and readiness checks
- Fleet composition management and validation

Acceptance Criteria:
- Fleet legality checks enforced before sortie
- XP and level progression deterministic and capped
- Damage state transitions visible and persisted

Dependencies:
- Epic 1, Epic 2

## Epic 4: Sortie Map and Routing System
Goal:
- Implement world-map-node traversal with branch/routing behavior.

Scope:
- Map/node data model
- Start/advance/retreat sortie state machine
- Resource nodes, battle nodes, boss nodes
- Map clear and gauge/clear tracking

Acceptance Criteria:
- Node transitions obey map reachability rules
- Retreat and clear outcomes update account state correctly
- Map progress is persisted and replay-safe

Dependencies:
- Epic 1, Epic 3

## Epic 5: Deterministic Turn-Based Battle Engine
Goal:
- Deliver phase-based combat where ships are not directly controlled.

Scope:
- Air/shelling/torpedo/night phase resolver
- Formation and engagement modifiers
- Hit/evasion/armor/crit calculations
- Battle logs and result grades

Acceptance Criteria:
- Given same seed/state, battle results are reproducible
- Battle output includes phase-by-phase log and post-battle deltas
- Resolver is UI-independent and unit-tested

Dependencies:
- Epic 2, Epic 3, Epic 4

## Epic 6: Morale, Fatigue, Repair, and Dock Operations
Goal:
- Implement long-loop ship readiness management.

Scope:
- Morale changes/recovery
- Timed repair docks and instant repair items
- Sortie restrictions for heavy damage/repairing ships

Acceptance Criteria:
- Morale tiers affect readiness/combat modifiers
- Repair timing and completion are deterministic and persisted
- Heavy damage safeguards and warnings are enforced

Dependencies:
- Epic 3, Epic 5

## Epic 7: Construction, Drops, and Acquisition Systems
Goal:
- Build multi-channel ship acquisition and progression support.

Scope:
- Standard construction with weighted rarity
- Pity behavior
- Map drops and duplicate handling

Acceptance Criteria:
- Construction consumes correct resource bundle
- Rarity and pity behavior match defined probabilities/rules
- Drop and duplicate outcomes update state correctly

Dependencies:
- Epic 2, Epic 3, Epic 4

## Epic 8: Equipment, Development, and Improvement
Goal:
- Add strategic equipment progression and battle integration.

Scope:
- Equipment inventory and slot compatibility
- Equipment development
- Improvement/upgrade chain
- Equipment effects in battle calculations

Acceptance Criteria:
- Equipment validation enforces slot/type rules
- Equipment stats are reflected in battle resolver output
- Improvement progression is persisted and auditable

Dependencies:
- Epic 3, Epic 5

## Epic 9: Quest System and Reset Cadence
Goal:
- Create daily/weekly/monthly and one-time objective loops.

Scope:
- Quest templates and objectives
- Progress event hooks (sortie/battle/clear/construction/etc.)
- Claim flow and reward payout
- Reset cadence logic

Acceptance Criteria:
- Quest progress updates from game events in real time
- Claims are idempotent and reward-safe
- Reset windows correctly roll quest states

Dependencies:
- Epic 1, Epic 4, Epic 5, Epic 7

## Epic 10: Expedition Async Economy
Goal:
- Implement timed fleet dispatch as passive progression.

Scope:
- Expedition templates and requirements
- Dispatch lifecycle and completion handling
- Great success behavior

Acceptance Criteria:
- Dispatch blocked if requirements are not met
- Completion grants rewards correctly after duration
- Expedition state survives reload/restart

Dependencies:
- Epic 2, Epic 3

## Epic 11: Home Port and Gameplay UX Shell
Goal:
- Deliver coherent product UX for game loops.

Scope:
- Home/start/settings shell
- Fleet/sortie/quests/dock/construction screens
- Combat presentation layer tied to resolver output
- Clear high-risk UX warnings

Acceptance Criteria:
- All core loops are discoverable from home UX
- No direct ship control in combat UI
- UX consistently shows resource/readiness state

Dependencies:
- Epics 2-10

## Epic 12: Cloudflare Access + Worker + D1 Production Backend
Goal:
- Make backend and identity production-ready on Cloudflare.

Scope:
- Access-protected routes
- Worker API contracts
- D1 schema hardening and migrations
- Security/rate-limit/logging essentials

Acceptance Criteria:
- Protected game routes require Access identity
- APIs are stable and documented
- D1 schema/version migrations are reproducible

Dependencies:
- Epic 1

## Epic 13: Ranking, Exercises, and Competitive Progression
Goal:
- Implement optional high-engagement loops.

Scope:
- Exercise battles
- Ranking score calculations and periods
- Reward tiers and payout

Acceptance Criteria:
- Ranking calculations deterministic and transparent
- Exercise limits/reset windows enforced
- Rewards distributed once per period safely

Dependencies:
- Epic 5, Epic 9, Epic 12

## Epic 14: Event Operations Framework
Goal:
- Enable time-limited content with variable difficulty.

Scope:
- Event map framework
- Difficulty selection/reward mapping
- Event-specific routing/combat modifiers

Acceptance Criteria:
- Event content can be configured data-first
- Difficulty options alter challenge/reward profile
- Event state and rewards remain migration-safe

Dependencies:
- Epic 4, Epic 5, Epic 8, Epic 12

## Epic 15: QA, Balance, and Launch Readiness
Goal:
- Validate mechanics, pacing, and stability for release.

Scope:
- Unit/integration/property test suites
- Economy and progression balancing passes
- Performance regression checks
- Release checklist and rollback playbook

Acceptance Criteria:
- Critical loops have automated coverage
- Economy/progression KPIs within target bands
- No P0/P1 defects in release candidate

Dependencies:
- All prior gameplay epics
