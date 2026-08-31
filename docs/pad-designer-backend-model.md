# PAD designer/backend reconstruction model

## Purpose

The browser board is a test surface, not the primary reconstruction target. The
primary target is a versioned content system that explains how a designer can
author skills, passives, enemies, dungeons, gacha pools, and inventory behavior
without writing engine code.

Every reconstructed definition carries a fidelity classification:

- `native-exact`: confirmed against this 21.9 `libpad.so` image.
- `native-partial`: a native path is confirmed but its full dispatch or data
  mapping remains incomplete.
- `externally-corroborated`: supported by an independent data parser or public
  behavior reference.
- `inferred`: an architectural inference constrained by native behavior.
- `original-design`: invented content or backend policy, not a PAD claim.

## Evidence-backed native authoring shape

The recovered enemy system is a fixed-catalog data model rather than a general
script engine. A monster definition has 64 eight-byte skill-reference slots.
Each populated slot names a skill id and contains immediate/fallback selection
weights. A referenced `sENESKILLS` definition is 0x48 bytes: the effect type is
at `+0x04`, effect-dependent parameters begin at `+0x10`, selection operands
occupy `+0x30..+0x40`, and an optional generic attack value is at `+0x44`.

The native engine uses three families of handlers:

1. condition/selection handlers decide whether a record is eligible;
2. setup handlers materialize random choices and runtime operands;
3. dispatch handlers mutate battle state.

Some numeric types are ordinary actions, some are initialization-time passives,
and types 113-120 include AI control-flow records. This is consistent with a
designer selecting an effect template and filling typed columns in an internal
CMS or spreadsheet, followed by a compiler that emits compact records.

The normalized enemy master retains the 64-slot authoring boundary. Chance and
fallback values live on the monster-to-skill reference, not on the reusable
semantic effect, matching the recovered eight-byte slot layout.

## Base rules versus runtime overrides

The model deliberately separates base battle rules from temporary status:

- a leader/passive 7x6 rule runs at `battle.setup` and changes
  `baseBoardSize`;
- enemy type 126 installs a timed `board-size-override` and changes the live
  `boardSize`;
- expiry removes the override and restores `baseBoardSize`.

The distinction is supported by native board storage. Type 126 is exact:

| Native field | Meaning |
| --- | --- |
| `int16 +0x04 = 126` | board-size-change effect |
| `int32 +0x10` | duration in turns |
| `int32 +0x14 = 1` | 7x6 selector |
| `int32 +0x14 = 2` | 5x4 selector |
| `int32 +0x14 = 3` | 6x5 selector |

The player leader/passive record that selects a base 7x6 board is still
unrecovered, so the included leader example is explicitly marked `inferred`.

## TypeScript layers

`src/pad-backend/model.ts` defines designer content, account state, battle state,
and trace records. `skillRegistry.ts` validates which categories and lifecycle
hooks can use each semantic effect, then evaluates conditions and effects while
emitting evidence-labeled traces. `nativeCompiler.ts` currently compiles the
semantic timed-board effect back into the exact type-126 binary layout.

`contentStore.ts` separates master data from player instances. Its first
transactional example is a gacha pull with injected RNG, inventory capacity,
currency spending, master-card references, and request-id idempotency. The
sample card names and banner weights are intentionally original test content.

## Intended publishing flow

1. A designer edits semantic definitions.
2. Validation rejects broken references, impossible category/hook combinations,
   invalid ranges, and empty pools.
3. A content bundle receives a version and publication timestamp.
4. Account/battle requests pin that content version.
5. The headless engine emits a trace explaining every condition and mutation.
6. Native adapters can encode or decode recovered 21.9 records without leaking
   positional binary fields into the designer-facing schema.

## Current boundary

This first slice models a representative subset, not the full PAD backend.
Type-126 record compilation and its override lifetime are native-exact. Its
native AI admission condition is unusual and the semantic demo invokes the
effect directly, so the combined demo definition is conservatively labeled
`native-partial`. The general effect registry, account transaction envelope,
and example content are the proposed reconstruction architecture. Active-skill,
leader-skill, awakening,
dungeon, inventory-upgrade, and banner-policy catalogs must be expanded as
their native/server data contracts are recovered.
