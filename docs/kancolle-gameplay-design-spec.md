# Kantai Collection Research-Based Gameplay Design and Specification

Date: February 18, 2026

## 1. Purpose and Scope
This document consolidates research on **Kantai Collection (KanColle)** gameplay mechanics and turns it into an implementation-ready design specification for building a similar naval collection/live-ops game.

Scope includes:
- Core gameplay loops
- Progression systems (account + ships + content unlocks)
- Combat model and sortie flow
- Economy/resources/timers
- Quests, events, ranking, and retention systems
- Data model and technical implementation guidance

Out of scope:
- IP reuse (characters/art/music/story)
- Reverse-engineering private server internals

## 2. Research Basis and Confidence
Most actionable mechanics are community-documented rather than officially specified in one public technical source. Confidence is highest where multiple wiki pages are internally consistent.

Primary research sources:
- [KanColle Wiki - How to Play](https://en.kancollewiki.net/How_to_Play)
- [KanColle Wiki - Sortie](https://en.kancollewiki.net/Sortie)
- [KanColle Wiki - Combat Mechanics](https://en.kancollewiki.net/Combat_Mechanics)
- [KanColle Wiki - Morale and Fatigue](https://en.kancollewiki.net/Morale_and_Fatigue)
- [KanColle Wiki - Expeditions](https://en.kancollewiki.net/Expeditions)
- [KanColle Wiki - Quests](https://en.kancollewiki.net/Quests)
- [KanColle Wiki - Construction](https://en.kancollewiki.net/Construction)
- [KanColle Wiki - Development](https://en.kancollewiki.net/Development)
- [KanColle Wiki - Akashi Improvement Arsenal](https://en.kancollewiki.net/Akashi_Improvement_Arsenal)
- [KanColle Wiki - Experience and Rank](https://en.kancollewiki.net/Experience_and_Rank)
- [KanColle Wiki - Resources](https://en.kancollewiki.net/Resources)
- [KanColle Wiki - Combined Fleet](https://en.kancollewiki.net/Combined_Fleet)
- [KanColle Wiki - PvP Ranking](https://en.kancollewiki.net/PvP_Ranking)
- [KanColle Wiki - Supply](https://en.kancollewiki.net/Supply)
- [KanColle Wiki - Repair](https://en.kancollewiki.net/Repair)
- [KanColle Wiki - Map Mechanics](https://en.kancollewiki.net/Map_Mechanics)

## 3. High-Level Product Pillars
1. **Collection + Attachment**: acquire ships, train/remodel, optimize equipment.
2. **Long-Horizon Progression**: account progression, map clears, quests, events, ranking.
3. **Resource Strategy**: limited resources and timers drive decision-making.
4. **Operational Choices**: fleet composition, route control, risk management.
5. **Live-Ops Cadence**: recurring dailies/weeklies/monthlies + periodic events.

## 4. Canonical Gameplay Loop
### 4.1 Primary Loop (Minute-to-Minute)
1. Build fleets and equip ships.
2. Resupply and repair.
3. Sortie to maps (node-based progression).
4. Resolve battles (multi-phase combat).
5. Return with XP, drops, and quest progress.
6. Spend gains on construction/development/improvement.

### 4.2 Secondary Loop (Session)
1. Run expeditions for passive resource income.
2. Complete daily/weekly/monthly quests.
3. Use construction/development queues.
4. Do exercises (PvP-like training) for XP/ranking value.

### 4.3 Tertiary Loop (Seasonal)
1. Prepare for limited-time events (special maps and mechanics).
2. Optimize high-end fleets and equipment.
3. Push ranking if desired.

## 5. System Specification
## 5.1 Player and Account Progression
- Account has HQ level, rank, resources, inventory, quests, and unlock state.
- HQ progression unlocks functionality over time (fleet/expedition/shop/systems depend on progression milestones).
- Rank changes mainly represent standing/prestige, not direct combat power.

Design requirement:
- Unlocks should be staged to avoid overload while preserving long-term goals.

## 5.2 Resources, Currencies, and Timers
Core resources:
- Fuel
- Ammo
- Steel
- Bauxite

Additional strategic materials:
- Instant repair (bucket)
- Instant construction
- Development material
- Improvement material (screws)

System behavior:
- Passive regeneration exists but is capped/conditioned.
- Active generation comes from sorties, expeditions, and quests.
- Construction/development/improvement consume mixed resource bundles.
- Repair and resupply are recurring operational costs.

Design requirement:
- Economy must force tradeoffs between sortie frequency, construction gambling, and equipment progression.

## 5.3 Ship Lifecycle
States:
- Unowned -> Acquired -> Leveled -> Remodeled -> Endgame optimization

Per-ship progression fields:
- Level + XP
- Current HP and damage state
- Lock/favorite state
- Remodel stage
- Modernization gains
- Equipment loadout
- Morale/condition

Notable gameplay properties:
- Duplicate handling matters (mod fodder, locks, collection strategy).
- Some ships are map/event drops only.
- Remodels can require level thresholds and item prerequisites.

## 5.4 Fleet Composition
- Standard fleet: up to 6 ships.
- Multiple fleet slots unlocked for parallel activities.
- Composition constraints influence routing and event viability.
- Combined Fleet mode (event/high-tier systems) links two fleets into one operation.

Design requirement:
- Composition should affect:
  - Route probabilities
  - Encounter types
  - Boss eligibility/consistency

## 5.5 Equipment Systems
Sub-systems:
- Development (craft equipment)
- Equipping/unequipping by slot and ship type compatibility
- Improvement (Akashi-style enhancement)
- Conversion/upgrading into advanced variants

Design requirement:
- Keep an equipment taxonomy with strong role identity:
  - Main guns
  - Torpedoes
  - Aircraft and AA roles
  - ASW tools
  - Utility/radar/support

## 5.6 Sortie and Map Flow
Structure:
- World -> Map -> Nodes -> Battles/events -> Boss gauge progression/clear

Behavior:
- Routing is partially random but influenced by fleet composition.
- Node choices can be deterministic at branch points or RNG-weighted.
- Retreat vs continue is a central risk decision, especially under heavy damage.

Damage-state risk model (community-standard interpretation):
- Normal / minor / moderate / heavy damage tiers by HP percentage.
- Continuing while heavily damaged significantly increases loss risk.
- Sinking is a permanent-loss mechanic in core KanColle identity.

Design requirement:
- Preserve tension from attrition and risk, but define explicit UX warnings before irreversible outcomes.

## 5.7 Combat Model
KanColle-style battle is phase-based. Typical daytime flow includes:
1. Air-related phase(s) when applicable
2. Opening ASW or opening torpedo (context-dependent)
3. Shelling rounds
4. Closing torpedo
5. Optional night battle follow-up

Combat variables:
- Formation selection
- Engagement type
- Air superiority state
- Accuracy/evasion/armor interactions
- Critical hit and cut-in mechanics
- Equipment synergy and ship-type modifiers

Design requirement:
- Implement combat as deterministic-seeded simulation + presentation layer.
- Separate:
  - `BattleResolver` (authoritative math)
  - `BattlePresenter` (animation/log)

## 5.8 Morale and Fatigue (Condition)
Behavior from researched references:
- Morale affects hit/evade performance.
- Morale changes after battle and recovers over time.
- Very low morale reduces sortie effectiveness and can increase operational risk.

Design requirement:
- Explicit condition tiers with UI feedback:
  - Sparkled/high morale bonus
  - Neutral
  - Fatigued penalty

## 5.9 Supply and Repair
Supply:
- Ships consume fuel/ammo through sorties.
- Low supply applies combat penalties (accuracy/power reductions documented on supply references).

Repair:
- Time-based repairs per ship/dock.
- Instant repair consumable bypasses timers.
- Repair dock count and queue management are strategic progression knobs.

Design requirement:
- Make pre-sortie checklist explicit: `repair -> resupply -> morale -> equip validation`.

## 5.10 Construction and Drop Acquisition
Acquisition channels:
- Construction recipes (resource-input weighted outcomes)
- Map/event drops
- Quests/rewards

Construction behavior:
- Normal construction and large-ship/high-cost construction are distinct systems.
- Construction pools are weighted and class-dependent.
- Instant construction can skip timer wait.

Design requirement:
- Keep construction as optional supplement, not exclusive progression gate.

## 5.11 Quests and Missions
Quest architecture:
- Daily / weekly / monthly / one-time categories
- Limited active quest slots at once
- Objectives span sorties, composition, combat outcomes, logistics, and crafting

Design requirement:
- Quests should teach systems in progression order and create short-term goals.

## 5.12 Expeditions (Async Economy)
- Fleets can be dispatched for timed missions returning resources/items.
- Success quality depends on fleet requirements and condition checks.
- Great success should reward preparation quality (e.g., morale/composition).

Design requirement:
- Expeditions are the backbone of passive income and should run while players are offline.

## 5.13 Exercises and Ranking
Exercises:
- Daily-limited PvP-like training fights against other players' fleets.
- Key source of XP and ranking points.

Ranking:
- Aggregates activity metrics and updates on schedule windows.
- Tiered rewards create optional high-engagement chase loops.

Design requirement:
- Ranking rewards should be meaningful but not mandatory for core progression viability.

## 5.14 Event Operations
Event characteristics:
- Time-limited maps with special routing/combat demands.
- Combined fleet and transport/debuff systems often used.
- Difficulty selection controls reward profile.

Design requirement:
- Events must offer:
  - Broad accessibility at lower difficulties
  - Deep optimization challenge at higher difficulties

## 5.15 Concrete Mechanics Reference (Research-Derived)
These values are intended as **baseline implementation defaults** for an inspired design and can be tuned in balancing.

### 5.15.1 Battle Phase Order (Typical)
1. Land-based support (where applicable)
2. Air battle / air strike interactions
3. Opening anti-submarine and/or opening torpedo (contextual)
4. Day shelling rounds
5. Closing torpedo
6. Optional night battle

### 5.15.2 Damage State Thresholds
- `HP = 0%`: sunk/lost (permanent-loss state in classic model)
- `HP <= 25%`: heavily damaged (taiha risk zone)
- `25% < HP <= 50%`: moderately damaged (chuuha)
- `50% < HP <= 75%`: lightly damaged (shouha)
- `HP > 75%`: healthy

### 5.15.3 Morale Baselines
- Initial ship morale baseline: `49`
- Passive recovery reference: `+3` morale every `3` minutes for ships below baseline when not actively sortieing
- Battle outcome modifies morale (MVP and victory rank provide stronger positive deltas; repeated sorties can induce fatigue)

### 5.15.4 Supply Penalty Thresholds
- Fuel below `75%`: power/evasion penalties begin
- Fuel below `50%`: stronger power/evasion penalties
- Ammo below `50%`: firepower penalty

### 5.15.5 Quest/Reset Cadence
- Daily quest reset reference: `05:00 JST`
- Weekly quest reset reference: Monday `05:00 JST`
- Active quest slot behavior uses limited simultaneous tracking (initial onboarding quests auto-active)

### 5.15.6 Expedition Constraints
- Expeditions run on non-primary fleets (fleet 2+), while main fleet remains available for sorties
- Fleet unlock progression gates access to additional expedition slots
- Success quality is requirement-sensitive (composition/condition), with great-success tier in some cases

### 5.15.7 Construction and Development Constraints
- Normal construction uses 4 resource inputs with weighted outcomes
- Large-ship construction is gated to later progression and uses significantly higher recipes
- Equipment development uses low-to-mid resource recipes with weighted equipment pools

### 5.15.8 Ranking Cadence (Reference Pattern)
- Ranking is periodic/monthly with final cut-off snapshots
- Tiered brackets (for example top 500, top 100, top 20) map to differentiated rewards

## 6. Functional Spec (Implementation-Level)
## 6.1 Core Entities
- `PlayerAccount`
- `ShipMaster` (static data)
- `ShipInstance` (owned state)
- `EquipmentMaster`
- `EquipmentInstance`
- `Fleet`
- `MapNode`, `MapRoute`, `SortieState`
- `BattleState`, `BattlePhaseResult`
- `Quest`, `QuestProgress`
- `ExpeditionState`
- `EconomyLedger`

## 6.2 Service Boundaries
- `ProgressionService`
- `FleetValidationService`
- `SortieRoutingService`
- `BattleService`
- `DropService`
- `ConstructionService`
- `EquipmentService`
- `QuestService`
- `ExpeditionService`
- `RankingService`

## 6.3 State Machines
Ship state machine:
- `Idle -> Sortie -> Damaged -> Repairing -> Idle`

Sortie state machine:
- `Prep -> NodeSelect -> Battle -> PostBattleDecision -> NextNode/Retreat -> Debrief`

Quest state machine:
- `Locked -> Active -> Completed -> Claimed`

## 6.4 Key Rule Specs
1. **Sortie validation**
- Block sortie if fleet empty or illegal composition.
- Warn/confirm on heavy damage risk states.

2. **Combat execution**
- Build phase order from battle context.
- Resolve each phase in deterministic order with logged random seeds.

3. **Damage and loss**
- Apply damage-state transitions after every attack.
- Enforce permanent-loss policy only under explicit configured conditions.

4. **Supply penalties**
- Apply combat modifiers from current supply ratios.

5. **Quest tracking**
- Event-sourced counters for objective progress.

## 6.5 Data and Telemetry
Track:
- Sortie attempts, retreats, sinks, clear rates
- Resource generation/spend per system
- Quest completion funnel
- Construction ROI and player frustration indicators
- Event participation by difficulty

Use telemetry for:
- Economy tuning
- Difficulty balancing
- Retention and burnout control

## 7. Content and Balancing Framework
## 7.1 Difficulty Curves
- Early game: teach systems with forgiving maps and abundant recovery.
- Mid game: composition/routing constraints become meaningful.
- End game/events: equipment checks + execution quality + sustained logistics.

## 7.2 Economy Targets
- Daily engaged player can sustain regular sorties + moderate crafting.
- Heavy crafting should require intentional savings windows.
- Expeditions should cover baseline maintenance for active accounts.

## 7.3 Progression Health
- Avoid hard dead-ends caused by a single missing rare drop.
- Provide parallel progression vectors: leveling, equipment, quests, map unlocks.

## 8. UX/Product Requirements
- Always surface high-risk actions (especially potential permanent loss).
- Pre-sortie status panel must highlight:
  - morale
  - HP/damage state
  - supply
  - required equipment checks
- Battle logs should be replayable/readable for learning and trust.

## 9. Live Operations Spec
Cadence:
- Daily reset systems (quests, exercises)
- Weekly reset systems
- Monthly ranking and reward windows
- Periodic event seasons

Operations tooling requirements:
- Data-driven map scripting
- Data-driven drop tables
- Feature flags for event rules
- Safe rollback path for balance hotfixes

## 10. Compliance and IP Guidance
- Build an original naval-fantasy setting and cast.
- Do not reuse KanColle character names, official art, voice assets, story text, or trademarks.
- Re-implement mechanics as original game rules, not copied data tables.

## 11. MVP -> Full Product Roadmap
MVP:
1. Account/resources/ships/fleet basics
2. One world with node routing + daytime battle phases
3. Repair/supply/morale loops
4. Quests + expeditions
5. Basic construction and equipment

Post-MVP:
1. Night battle and advanced combat branches
2. Remodel chains and equipment improvement
3. Ranking + exercises
4. Event framework + combined fleet
5. Live-ops authoring tools

## 12. Open Design Decisions (Must Be Set Before Build)
1. Permanent loss policy:
- Exact sink condition
- Any safeguard items or grace systems

2. RNG transparency policy:
- Published rates for drops/construction
- Pity/safety systems (if any)

3. Monetization policy:
- Cosmetic-only vs convenience items
- Limits to avoid pay-to-win in ranking/event race

4. Difficulty accessibility:
- Event difficulty tiers and reward deltas
- Catch-up mechanisms for new players

## 13. Summary
KanColle's design works because combat, logistics, and long-term collection are tightly coupled. The strongest spec direction is to preserve that triangle:
- meaningful fleet/battle decisions,
- constrained resource economy,
- persistent account progression with live-ops goals.

This document can be used directly as the base Product Requirements Document plus Systems Design Spec for implementation planning.
