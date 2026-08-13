# Puzzle & Dragons 21.9.0 native gameplay-engine findings

This note records findings from the exact `arm64-v8a` library in
`jp.gungho.pad_21.9.0-21900_minAPI24(arm64-v8a).apk`. The source APK is not
redistributed by this project. Its `libpad.so` SHA-256 is
`785ffa641837c528864cfbeb9716e340c9d948ba3a37bca3193b5cd32dda89d8`.

## What `libpad.so` is

`libpad.so` is the main native Android client, not a small JNI adapter. It owns
the application lifecycle, fixed-function GLES renderer, asset system, audio,
menus, saved-data formats, network-facing state, and the puzzle/battle state
machine. Java supplies the Android view and service boundary and forwards
lifecycle and input calls into the library.

The APK copy is protected: most original `.text` is restored only after a chain
of transient AArch64 modules runs. The browser harness now executes that chain,
captures the restored 26 MiB ELF image, calls `JNI_OnLoad`, and drives the native
surface/frame/touch exports. The restored image contains a 10,427,240-byte `.text`
section and, unusually for a release build, thousands of named dynamic C++
symbols. Those symbols provide reliable boundaries for the gameplay routines.

The gameplay anchors can be reproduced after generating the restored image:

```sh
npm run libpad:inspect -- \
  'jp.gungho.pad_21.9.0-21900_minAPI24(arm64-v8a).apk' \
  --restored /tmp/libpad-restored.so
```

The inspector verifies the protected payload and known restoration hashes, then
reports the address and byte size of every input, board, match, hazard, combat,
targeting, and recovery routine used below. `--json` emits the same evidence in
machine-readable form. It deliberately does not claim that the protected APK's
mostly blank dynamic names are usable before restoration.

## Browser architecture

The port is deliberately hybrid:

1. A freestanding ARMv8-A interpreter is compiled to WebAssembly.
2. JavaScript maps ELF segments, applies relocations, and provides virtual Linux,
   Android, JNI, OpenSL, and libc surfaces.
3. Original GLES 1.x calls are translated to WebGL.
4. Browser pointer events are encoded as the recovered Android
   `onTouchEvent(FFIIIIJI)V` contract.
5. A pure JS rules harness remains available when downloaded runtime datasets are
   absent. It shares recovered input and board rules, but is not represented as a
   byte-for-byte replacement for every modern skill.

This keeps original AArch64 integer and floating-point behavior in the binary
path while using browser-native integration where Android APIs do not exist.

## Native lifecycle and input boundary

The restored exports include:

- `JNI_OnLoad` at `0x33f8cc` (returns JNI 1.6)
- `didFinishLaunchingWithOptions` at `0x33f8e8`
- `viewDidLoad` at `0x33ff48`
- `onSurfaceCreated` at `0x340024`
- `onSurfaceChanged` at `0x34008c`
- `onDrawFrame` at `0x3402b0`
- `onTouchEvent` at `0x33fd8c`

Addresses above are ELF virtual addresses; the current browser mapping adds the
`0x02000000` shared-object base.

DEX inspection shows Java samples only pointer slot zero. The Y coordinate sent
to native code is adjusted by `2 * viewScale + statusBarHeight`. Native receives
X/Y floats, pointer index zero, a reserved zero, pointer count, raw Android
action, event time, and masked action.

The browser adapter binds a move to the pointer that initiated it. Movement,
release, cancel, skill, and target events from any other simultaneous pointer
are ignored until that primary pointer ends. This preserves the single sampled
Android pointer instead of allowing a second browser touch to steer or release
the held orb.

## Board and drag behavior

Relevant restored symbols are:

| ELF VA | Routine | Observed role |
| --- | --- | --- |
| `0x647c28` | `cGAMEMAIN::_walk1step` | initializes a movement step and move-time state |
| `0x666c18` | `_checkXYdir` | converts continuous pointer displacement into board direction/crossing |
| `0x673e24` | `_isNeighborBlock` | validates neighbouring cells |
| `0x67a7a0` | `_swapBlockMain` | swaps cell contents/state |
| `0x67ab14` | `_swapBlock` | walks between cell indices and performs swaps |
| `0x680854` | `_gamePhaseMove` | full touch/movement phase |

The active board dimensions are signed bytes at `cGAMEMAIN + 0x70` (columns)
and `+0x71` (rows). The ordinary board is 6 columns by 5 rows. Board lookup uses
`column + (row << 4)`, so rows have a 16-pointer backing stride even though only
six columns are active.

Normal `_isNeighborBlock` accepts one orthogonal step: one coordinate must be
equal and the other must differ by less than two. A special board-mode byte at
`+0x75` permits diagonal adjacency when the absolute row and column deltas are
equal. `_swapBlock` then advances both coordinates per step; a two-cell diagonal
therefore performs two diagonal swaps rather than four orthogonal ones. The JS
engine exposes this recovered mode through `allowDiagonalMoves`, including
corner-crossing input and per-crossed-orb thorn damage. The mode also changes
`_applyComboMul`'s bonus from `+0.25` to `+0.50` per combo after the first; the
browser carries that value through both attack and recovery. `_swapBlock` repeats
adjacent swaps when its destination is farther away. Therefore a coalesced browser pointer move
must be expanded into the orthogonal grid boundaries crossed by the motion; a
single direct diagonal exchange is incorrect in normal play.

The five-second move limit uses elapsed gameplay time. Browser animation deltas
remain bounded so a delayed frame cannot jump visual effects, but the drag
deadline is not bounded with them; a frame arriving after the move window ends
immediately takes the native release path instead of granting extra time.

`_gamePhaseMove` reads the current touch-state field at `sPAD+0xb2`. Value `1`
keeps the move active; release/cancel takes the turn-ending path beginning at
`0x6826c4`. The swap count at game-work offset `0x6edc` controls movement-side
effects but is not required to end the turn. Consequently, selecting and
releasing the same orb without crossing a cell consumes a turn while leaving
the board unchanged, which the browser input state machine also preserves.

The JS engine now uses a fractional pointer-segment crossing trace with
deterministic horizontal corner ties. Every emitted step has Manhattan distance
one. The segment is clamped to the 6x5 board before traversal, matching the
native `_checkXYdir`/`_getNearestBlock` split: an off-centre diagonal crosses the
geometrically correct neighbour first, while a pointer just outside the board
continues swapping along its nearest edge.

## Match grouping and cascades

Important routines include:

| ELF VA | Routine |
| --- | --- |
| `0x659d24` | `_checkCombos(int, int)` |
| `0x666724` | `_checkFlood(int, int, int, int&)` |
| `0x666a78` | `_checkFlood2(int, int, int&)` |
| `0x66c81c` | `_checkErases()` |
| `0x673fbc` | `_checkFalls()` |
| `0x7752fc` | `sFLOORLIST::getComboDrop()` |
| `0x673d90` | `_addComboDropFlags(int)` |
| `0x651854` | `_calcCombo()` |
| `0x66c2dc` | `_incCombos(float, float)` |

`_checkFlood` recursively visits the four orthogonal neighbours using the live
board dimensions. `_checkFlood2` performs a second connected-component pass over
marked cells. This confirms that intersecting horizontal/vertical runs of the
same attribute become one combo, rather than separate row and column combos.

Board dimensions are runtime state rather than a hard-coded 6-by-5 assumption.
`cGAMEMAIN::_getBoardSize` (`0x651f24`) normally reads the column and row bytes at
`cGAMEMAIN+0x70/+0x71`; its override path unpacks two four-bit dimensions from
game-work offset `0x877f4`. The browser engine therefore accepts dimensions up
to the native packed limit of 15 and passes them through input traversal,
matching, skills, falls, refills, validation, and snapshots. The visible lab
continues to start in the normal 6-by-5 layout and exposes the native 7-by-6
layout through its board-size control.

Skyfall type selection is centralized in `_spawnNewBlock(uint32 &, uint32)` at
`0x661978`. With no active drop-rate lanes it consumes one saved LCG step and
uniformly indexes the ordered dungeon face list. If that fallback type is named
by the supplied exclusion mask, native rotates forward through the face list,
wrapping until it finds an allowed type. The mask does not reject a type chosen
by an explicit drop-rate lane.

When at least one of ten binary32 rate lanes is active, native consumes a first
LCG value, maps it to integer `0..9999`, and sequentially subtracts each nonzero
`float32(rate * 10000)` value. The first lane making the binary32 remainder
negative wins, so an exact zero remains a miss. A second saved LCG advance then
always occurs: it is discarded after a weighted win or selects the fallback
face after all rate lanes miss. A configured scripted-drop byte bypasses both
random advances. `padSpawnNewBlock` and `PuzzleEngine.collapseAndRefill` preserve
these one-step, two-step, exclusion, and binary32 boundaries; the engine exposes
ten `dropRates` lanes and a `skyfallExclusionMask` for data-backed dungeons.

`_spawnNewBlockInBits(uint16)` at `0x62771c` is a separate skill/data helper. It
counts all 16 mask bits, spends one roll selecting an enabled-bit ordinal, and
returns natural bits `0..5` directly. Selecting any higher bit—or supplying an
empty mask—spends a second roll and returns a uniform dungeon face type instead.
`padSpawnNewBlockInBits` keeps that intentionally asymmetric fallback contract.

Initial construction lives in `__initBlocks()` at `0x661f10`; `_initBlocks()`
is only a four-byte branch wrapper. The gameplay part traverses rows top to
bottom and columns left to right using the native `column + (row << 4)` backing
index. Before every `_spawnNewBlock` call it detects whether the previous two
horizontal cells are the same type and masks that type, then independently does
the same for the previous two vertical cells. On the ordinary face fallback,
the selected face rotates forward past either mask. This prevents an initial
three-orb run without rerolling or rescaling the random value; each ordinary
cell still consumes exactly one saved LCG step. `padCreateInitialBoard` and
`PuzzleEngine.createStableBoard` now reproduce the row-major traversal,
horizontal/vertical mask union, forward face rotation, and dynamic dimensions.

Ordinary cascade refill follows a separate ordering recovered from
`_checkFalls()` at `0x673fbc`. Native walks columns from left to right and
preallocates replacement types for erased cells from the top row downward.
Surviving cells then compact to the bottom and the generated stream fills the
new top slots in the same order. This is observable whenever a column has two
or more holes: the first RNG result belongs to the highest empty slot, not the
lowest. `PuzzleEngine.collapseAndRefill` preserves that column-major,
top-to-bottom generation and placement contract.

`_checkFalls` stores each replacement in a temporary byte before constructing
the falling `sBLOCK`: its low six bits are the type and bit 6 becomes block flag
`0x8000`. Native finishes all type generation before it processes these
combo-drop markers. The floor record's `getComboDrop` value supplies a chance
in basis points and a live-marker cap. It spends one saved LCG advance per
replacement chance attempt until the cap is full. Every requested marker then
spends another advance to choose a starting replacement index and scans forward
with wrap for an unmarked natural type; non-natural types `6..9` are skipped.

`padResolveComboDropSpawns` reproduces this sequencing, and
`PuzzleEngine.collapseAndRefill` exposes `comboDropChanceBasisPoints`,
`comboDropCap`, and `pendingComboDrops` for decoded dungeon/floor data. The
marker is retained in `blockFlags` and surfaced as `comboDrop` in snapshots.

The upstream producer is also recovered. `_checkErases` queries passive skill
ID `62` across the party and accumulates five counts by Fire, Water, Wood,
Light, and Dark attribute. For every connected elemental match of at least ten
blocks, native adds that attribute's full count to the uint8 pending-marker
byte. It also adds the count as dummy combos, capped at four within that erase
pass. Heart and special types do not qualify. `padResolveComboDropAwakenings`
and `comboDropAwakenings` preserve the pending-byte wrap and combo cap; the
dummy combos contribute to the turn's combo multiplier but do not create an
attribute attack match. Mapping concrete saved party records into those five
already-decoded counts remains content-data plumbing.

The other replacement source is the scripted top-line path selected by
`_isEnableTopLine` (`0x6401d0`). With that mode active, `_checkFalls` reads the
low nibble of a floor descriptor indexed by column and reuses that type for
every erased cell in the column. It does not call `_spawnNewBlock`, so these
scripted types consume no saved RNG advances; combo-drop chance/marker passes
still occur afterward. `topLineDropTypes` exposes the decoded per-column values
and preserves the RNG-free branch in `PuzzleEngine.collapseAndRefill`.

The upstream `_buildBlockList(float rates[10], uint32 excludedMask)` at
`0x6615e8` clears ten lanes, applies dungeon/passive additions, sequentially
adds the resulting binary32 values, multiplies the binary32 total by
`100000.0f`, and returns `izMathCeiling`. The browser accepts those final lanes
as `dropRates`; `padSummarizeDropRates` preserves their narrowing, integer-unit
summary, and positive-type mask. `__initBlocks` treats the unsigned expression
`ceil(total * 100000) >> 5 >= 3125` as saturated. If spawning then falls back
to a type outside the positive-rate mask, it scans numeric types `0..9` forward
with wraparound for the first positive type not blocked by the opening-run
mask, without another RNG advance. That defensive saturated-rate correction is
also reproduced. Mapping every raw dungeon/passive record into the ten lanes is
still an upstream content-data task rather than an unresolved board algorithm.

The native combo list is a fixed list of 88-byte `sCOMBO` records with linked-list
indices stored around game-work offset `0x57a8`. Version 21.9 also records modern
shape metadata and passive-skill flags. The browser rules layer now returns mass
attack, full-row, full-column, cross, L, and 3x3 box metadata for each connected
match. Horizontal/vertical orientation is tracked separately: an ordinary
three-orb horizontal match is not incorrectly reported as a full row, while a
full row remains flagged if a perpendicular marked run joins the same combo.
Those flags and the cascade depth are retained in the turn-level combo record,
so combat/passive consumers and `render_game_to_text()` see the native shape
semantics after the matched cells themselves have been erased.

Native block types `0`–`5` are fire, water, wood, light, dark, and heart;
`_doPoisonBlockN` explicitly treats types `7` and `8` as the two poison classes,
type `6` is jammer, and `_doMakeBombSub` passes type `9` to the block creation
path. Types `0`–`8` map to `block2.btex` sprites `2`–`10`; bomb uses the
non-sequential fuse-and-bomb sprite `20`.
The browser rules layer clears and counts jammer/poison matches as combos, but
only attribute/heart classes feed attacks or recovery. Poison costs 20% of
maximum HP for a three-orb group and mortal poison 50%, with the same 25%
per-extra-orb group scaling. `_calcCharge` (`0x64f220`) passes each poison
group's HP cost through `izMathCeiling` before adding it to game-work offset
`0x8aacc`; two groups therefore round independently rather than as one combined
percentage. Its operation order is observable too: the extra-orb multiplier is
formed in binary32, widened to binary64, then evaluated as
`maxHP * orbMultiplier * percent / 100` before the ceiling. Reassociating that
expression can over-round an exact integer (four poison orbs at 12 maximum HP
deal 3, not 4). After every hazard addition, the shared 32-bit pending-damage
field is capped at `0x7fffffff`; the browser applies the same saturation across
poison, bombs, and repeated thorn crossings. Recovery and poison are netted
before the HP clamp, matching
`_applyHpRecAndPoisonDamage` rather than healing to the cap first.

Orb state remains separate from type. In native `sBLOCK`, type is the signed
byte at `+0`, the flag word is at `+4`, and the enhancement value is the float at
`+8`. `setBlockPowup(type, float, bool)` compares and writes that value without
coercing it to a boolean. `_doLockDropBits` tests and sets flag `0x800`; locking
a special type also clears its enhancement value. The browser orb record
therefore preserves a signed float32 `enhancementPower` and derives its visual
`enhanced` flag from whether that value is positive. Locked orbs still move and
match but are skipped by conversion skills.

The value is gameplay data, not merely an effect strength. `_checkXYdir`
(`0x666c18`) marks every erased block with flag `0x40000`. Its final board pass
tests that marker at `0x667a94`, loads the raw `sBLOCK+8` value at `0x667aa8` or
`0x667acc`, and adds it into the match multiplier with a binary32 `fadd`/`str`
pair at `0x667a6c`–`0x667a74`. The accumulator begins at `1.0f`; positive and
negative values are both included. Earlier in the same routine, the value is
compared with zero to maintain separate positive and negative counters, but it
is not collapsed to either counter for damage. The familiar enhanced-orb state
uses `+0.06`, so ordinary orbs retain the classic 6% behavior while modern or
enemy-authored magnitudes remain exact. Each addition is narrowed separately;
three ordinary boosts therefore produce binary32 `1.179999828338623`, not a
single-rounded `float32(1 + 3 * 0.06)`. The browser match record now carries the
resulting `enhancementMultiplier`; `enhancedCount` remains an effect and
diagnostic count only. Original atlas overlays 22 and 25 render the enhanced and
locked states.

The active-skill writer has its own overwrite rule. `_setBlockPowup`
(`0x6b0db4`) accepts only native types `0` through `5`, traverses the live board,
and changes a matching cell only when its current `sBLOCK+8` value is less than
or equal to the requested float. A stronger existing value is preserved; an
equal value is still counted as an affected cell and retriggers the native
effect. Jammer, poison, mortal-poison, and bomb types are rejected before the
board walk. `PuzzleEngine.setBlockPowup` exposes that same state transition and
returns the native-style affected-cell count. The routine's optional sound and
effect allocation remain presentation work rather than puzzle state.

Its paired `_hasBlockPowup(int)` query has counterintuitive polarity: for a
natural type `0..5` it returns true as soon as it finds a matching cell whose
power is non-positive, meaning the board has a cell eligible for ordinary
enhancement. It returns false when every matching cell is already positive or
the type is absent. Any value outside `0..5`, including a negative integer
after the native unsigned comparison, returns true immediately.
`PuzzleEngine.hasBlockPowup` preserves those edge cases.

Lock creation is similarly concrete. `_doLockDropBits(uint32 mask, int limit,
uint16 seed)` at `0x62676c` gathers unlocked masked cells in row-major order.
Unlike the enemy power and burst routines, it does not consume saved gameplay
RNG: it shuffles from the supplied seed's low 16 bits, advancing a temporary
LCG once for each index from one onward and swapping with
`floor(random16 * i / 65536)`. Its signed limit is applied after the full
shuffle. The return value reports whether any eligible cell existed, even when
the limit is zero or negative. Selected cells gain flag `0x800`. Natural types
retain `sBLOCK+8`; special types 6 through 9 clear that float and flags
`0x28000` while retaining the new lock. `PuzzleEngine.doLockDropBits` mirrors
that behavior and retains the relevant raw `sBLOCK.flags` bits as `blockFlags`.

Automatic lock skyfalls use a different routine and random stream.
`_checkLockFall(sBLOCK *)` at `0x626200` walks up to ten active dungeon records;
each supplies a 16-bit type mask and a signed percentage. A matching record
advances the dedicated LCG at game-work `+0x66a14`, scales its high half to
`0..9999`, and sets flag `0x800` when the result is at least
`(100 - percentage) * 100`. Multiple matching records each consume a roll even
after an earlier record locks the block. This stream is separate from
`_spawnNewBlock`'s state at `+0x66a10`, so automatic lock checks cannot change
future orb types. `padResolveLockFall` and `lockFallRules` preserve the ten-rule
limit, mask/threshold boundary, independent state, and post-spawn lock flag.

`_doPoisonBlockN(int destinationType, int count, bool excludeHeart)` at
`0x626bf0` is the random individual poison writer. It clears a temporary visited
byte on every board cell, then spends two saved LCG advances for every positive
request: one chooses the starting column and the other the starting row. From
that coordinate it scans forward row-major with wraparound for an unvisited
cell whose type is not poison `7` or mortal poison `8`, also skipping heart `5`
when requested. The chosen cell is marked visited even when the downstream
block-change helper rejects it for being locked. Thus locked cells consume an
attempt without changing, and exhausted boards continue consuming two RNG
steps per remaining request. Successful special-type conversion clears
`sBLOCK+8` but leaves independent block flags, such as the burst overlay, on
the cell. `padSelectPoisonBlockCandidates` and
`PuzzleEngine.doPoisonBlockN` reproduce the selection and mutation paths.

The whole-color sibling `_doPoisonBlocks(int destinationType, int count, bool
excludeHeart)` at `0x626e78` starts from the dungeon's ordered face-color list,
stored with its signed count at `sGAMEWORK+0x911d8` and entries beginning at
`+0x911da`. `_setupDungeons` at `0x65ac0c` builds that list; the ordinary case
is `0,1,2,3,4,5`, while dungeon flags can omit individual colors. The routine
keeps listed types that occur on the live board and optionally removes Heart.
An empty filtered list returns without RNG use. Any non-empty list consumes two
saved LCG advances, even when the requested group count is zero, combines their
halves into the same temporary seed as `_getRandomBlock`, and performs its
forward `[0,i]` shuffle. Each selected source type is then converted wholesale;
locked cells reject the change but do not prevent their color from being
selected. Native callers keep the requested count within the candidate count.
The browser exposes dungeon face order through `setFaceTypes`, and
`padSelectPoisonBlockTypes` plus `PuzzleEngine.doPoisonBlocks` reproduce this
bulk path without pretending every dungeon has the default six-color list.

The generalized writer `_doPoisonBlockN2(int perTypeCount, uint32
destinationMask, uint32 excludedSourceMask, bool dryRun, bool presentation,
uint16_t *selectedRows)` at `0x61c344` has a separate contract. It scans the
board row-major and stores coordinates as `(row << 4) | column`. With no row
bitmap, a cell is eligible when its current type bit is absent from the source
exclusion mask. When a bitmap is supplied, the bitmap replaces that test: a
cell is eligible when bit `column` in `selectedRows[row]` is clear, even if its
source type is excluded. A dry run returns the raw candidate count without RNG,
mutation, or bitmap writes. An applying call always consumes exactly two saved
LCG advances, including empty boards, non-positive counts, and empty destination
masks, then uses the standard combined-seed forward shuffle.

Destination bits are visited in numeric type order `0..9`, taking up to
`perTypeCount` consecutive shuffled cells for each enabled destination. Every
attempt contributes to the return count and sets its row bit before the next
caller use. A locked cell still consumes that assignment and bitmap bit even
though the common block-change helper rejects its mutation. Natural destination
types `0..5` retain the cell's enhancement power; special types `6..9` clear it,
while independent block flags remain intact. The fifth argument only selects
native sound/effect presentation and does not alter board selection. The port's
`padSelectMaskedBlockChanges` and `PuzzleEngine.doPoisonBlockN2` expose these
candidate, RNG, bitmap, and mutation rules directly.

Two native board queries feed these replacement decisions. `_countBlockBits`
at `0x651fa4` scans the active board against a 16-bit type mask without filtering
locked or enhanced cells. Its type mapping is intentionally asymmetric: mortal
poison type `8` tests both bit `8` and the ordinary poison bit `7`. Therefore a
bit-7 query counts poison and mortal poison together, while bit 8 counts only
mortal poison. `_countNonPoisonBlocks(bool excludeHeart)` at `0x61c250` excludes
both poison variants and includes Heart unless its argument is true; all other
cells count regardless of block flags. `padCountBlockBits`,
`padCountNonPoisonBlocks`, and their `PuzzleEngine` methods expose the same
eligibility counts used by the native skill paths.

The first replacement executor is `_doBitReplace(uint16_t const *rows, int
destinationType, int &effectFlags, sBLOCKFLAG *)` at `0x6adf2c`. It visits set
column bits in row-major order and sends each active cell through
`_doBlockSwapMain` at `0x6ae028`. Locked cells reject the write. A negative
destination consumes one saved LCG step for every unlocked selected cell and
maps the returned 16 bits uniformly to one of natural types `0..5`; a fixed
destination consumes no RNG. Natural replacements retain enhancement power.
Types `6..9` clear enhancement power and block flag bits `0x28000`, but preserve
independent flags such as burst `0x80000`.

The referenced integer is an accumulated presentation-category mask rather
than a changed-cell count: ordinary colors and Bomb OR bit `1`, Poison/Mortal
Poison OR bit `2`, and Jammer OR bit `4`; existing bits are preserved. The
browser's `padResolveBitReplacements` and `PuzzleEngine.doBitReplace` implement
the deterministic gameplay path, including lock rejection, per-cell random
destinations, saved RNG state, category accumulation, special-orb state
clearing, and the non-null passive state described below.

`makeBlockFlagByPassiveSkill(sBLOCKFLAG *, int)` at `0x6add50` lazily queries
passive skill ID `12` for Jammer resistance and ID `13` for Poison resistance.
Its shared byte uses bit `0x80` for “Jammer checked”, `0x10` for “Jammer
resisted”, and `0x20` for “Jammer resistance presentation emitted”. Poison and
Mortal Poison share the corresponding bits `0x08`, `0x01`, and `0x02`.
`_doBlockSwapMain` suppresses a resisted special-orb write and sets its
presentation bit on the first suppression. The caller has already performed
cell selection and any random destination roll, so resistance never rewinds
saved RNG state. Ordinary colors and Bomb bypass these passive checks.
`padResolveBlockSwapPassive` exposes the byte contract, while every browser
swap entry point that accepts `blockFlag` applies it after native-order
selection. An object can provide `jammerResist`/`poisonResist` for the first
lazy query and receives the persistent byte in its `byte` field.

The public mask wrappers `_doBlockSwap4(uint16 destinationMask, sBLOCKFLAG *)`
at `0x6af6cc` and `_doBlockSwap5(uint16 sourceMask, uint16 destinationMask,
sBLOCKFLAG *)` at `0x6af564` expand destination bits `0..9` in ascending type
order and enter `_doBlockSwapNew` at `0x6aee90`. Swap4 supplies a zero source
mask. The executor augments any source mask naming neither poison type with
bits `7|8`; poison bit 7 matches both poison variants, while a mask containing
only mortal-poison bit 8 stays mortal-only.

Every eligible cell—including locked cells—consumes one saved LCG step to pick
an index from the ordered destination list. Locked cells reject only during the
final `_doBlockSwapMain` application. If fewer than `3 * destinationCount`
initial assignments would change type, native collects up to 64 eligible packed
coordinates, consumes two more saved RNG steps, applies its usual combined-seed
forward shuffle, and assigns destination types cyclically across the shuffled
coordinates. Otherwise it uses two saved steps per correction attempt to
rebalance underrepresented destinations toward three assignments, scanning
cyclically from a random column/row for a donor assignment. Cells initially
rolled to their current type remain untouched unless the fallback overwrites
them. `padResolveBlockSwapNew`, `PuzzleEngine.doBlockSwap4`, and
`PuzzleEngine.doBlockSwap5` reproduce both correction branches, mask expansion,
poison aliasing, lock timing, effect flags, and special-orb mutation for null
and resisted-passive paths.

Line writers `_doBlockSwapV(uint8 pattern, uint32 destinationMask, int &flags,
sBLOCKFLAG *)` at `0x6ae64c` and `_doBlockSwapH(...)` at `0x6ae8fc` use patterns
authored for the canonical 6×5 board. `_relocateBoardXbits`/`Ybits` insert the
native center gap for 7×6-or-larger boards and compress the packed byte below
6×5. Vertical bits select columns left-to-right. Horizontal bits select rows in
reverse order, so the low bit denotes the bottom row.

For every active cell in a selected line, the routine consumes one saved LCG
step and uniformly chooses the Nth enabled destination bit from types `0..9`.
This happens before `_doBlockSwapMain` checks lock state, so locked cells consume
RNG but remain unchanged. A zero line-pattern byte returns zero immediately,
including discarding an incoming effect-mask value. `padRelocateBoardXBits`,
`padRelocateBoardYBits`, `padResolveLineBlockSwaps`, and the engine's
`doBlockSwapV/H` methods reproduce canonical/noncanonical pattern placement,
bottom-up row semantics, per-cell RNG, lock timing, effect flags, and special
destination clearing for null and resisted-passive paths.

`_doBlockSwap2(int, int, int, int, sBLOCKFLAG *)` at `0x6af838` is the
explicit-list sibling. Its first type is mandatory; it appends later arguments
until the first negative sentinel, so a value after that sentinel is ignored.
It preserves repeated destination types and calls `_doBlockSwapNew` with source
mask zero, selecting poison/mortal-poison through the default-source rule.
`PuzzleEngine.doBlockSwap2` keeps that ordered/sentinel contract and therefore
does not collapse repeated types into a bit mask.

`_doBlockSwap3(sSKILLDATA const *)` at `0x6aea98` is a full-board distribution
writer. It reads at most seven 32-bit destination types beginning at skill-record
offset `+0x14`, stopping at the first negative. The native work list begins with
three copies of every listed type. It then consumes one saved LCG step while its
fill counter runs from the number of listed types to the active board-cell count;
because the three-copy prefix is already present, only the prefix through the
board-cell count is ultimately used. Finally it consumes two saved steps, builds
the standard combined local seed, and forward-shuffles that distribution.

Shuffled entries are consumed row-major. An already-matching cell or a locked
cell uses its entry without changing; lock is checked after the equality test.
Successful natural writes retain enhancement, while special writes clear power
and flags `0x28000`. `padResolveSkillBoardSwap` reproduces the three-copy
guarantee, otherwise-random fill, saved/local RNG split, sentinel parsing, and
slot consumption. `PuzzleEngine.doBlockSwap3` accepts either the type array or
`{types}` and returns the number of successful browser-model mutations; the
native routine itself uses that count only for presentation.

The enemy inverse is `_doBlockMinus(bool, uint32 mask, float, int)` at
`0x61caa0`. Only cells whose type bit is in the mask and whose current power is
non-negative are eligible; applying the effect stores the negated binary32
argument at `sBLOCK+8`. A non-positive limit processes every eligible cell in
board order without consuming RNG. A positive limit builds the eligible cell
list, consumes exactly one saved LCG advance even when that list is empty, and
shuffles from a temporary LCG seeded by the saved state's high 16 bits. For each
index `i` from one onward it swaps with `floor(random16 * i / 65536)`, then
applies at most the requested number of cells. The temporary advances are not
persisted. `PuzzleEngine.doBlockMinus` and
`padShuffleBlockMinusCandidates` reproduce both branches, including dry-run
counting and the distinct RNG contract.

Bombs and burst drops are distinct native mechanisms. `_doMakeBurDrop(bool,
uint32 mask, uint32 count, uint16 descriptor, bool)` at `0x61ce38` scans the
board in row-major order for masked types and excludes cells already carrying
the burst flag. A nonzero request consumes one saved LCG advance and uses the
same high-16 temporary shuffle as `_doBlockMinus`, even for an empty candidate
list or a dry run; a zero count returns without touching RNG. It selects at most
`min(eligible, count)` cells. When applying, it writes `(descriptor & 0x7f) |
((!finalBool) << 7)` at `sBLOCK+0x0c` and asks `sGAMEWORK::setBurBlockFlag` to
set flag `0x80000`. The returned count is the selected-cell count. The browser
keeps the active flag and raw descriptor separate from the low-seven-bit damage
percentage and reproduces this through `PuzzleEngine.doMakeBurDrop`. A true
bomb is block type `9`.
`_checkBomb` first performs ordinary match detection: bombs included in a
three-or-more match clear harmlessly as that combo. Every unmatched bomb then
deals a separately rounded-up 20% of maximum HP and clears all non-bomb cells
in its row and column. A blast deliberately skips other bombs, allowing each
unmatched bomb to detonate and contribute its own HP hit. Blast-only cells do
not become combos and therefore do not contribute attack, recovery, or poison.
`_checkBomb` marks both ordinary-match and blast cells before returning the bomb
count. `_gamePhaseWaitBombing` then waits for effect type `0x38` and advances the
phase; it does not fall the board or scan for another match. The browser models
that native visual wait as an explicit `bomb` phase, followed by one shared
clear/fall epoch for the match and blast cells.

The “Bur” name means the spiked/thorn-drop overlay. `_swapBlockMain` tests the
orb being crossed for flag `0x80000`, reads the damage rate from
`sBLOCK+0x0c & 0x7f`, and deals `ceil(maxHP * rate / 100)` on every crossing.
It checks the stationary orb being crossed, not the held orb. Because the
overlay moves backward with that stationary orb during the swap, reversing over
it triggers the damage again. The browser input path preserves that behavior,
including multiple crossed cells from one coalesced pointer-motion event.

New thorn skyfalls are assigned by `_checkPassiveSkill4Block` at `0x64131c`,
after `sBLOCK::init` and before `_checkLockFall`. When its single packed rule is
active, every new block spends one advance from game-work LCG `+0x66a14`; the
optional type mask is deliberately checked only after a successful percentage
roll. The percentage comparison is `roll10000 >= (100 - percent) * 100`. A
selected block receives flag `0x80000`, the rule's low-seven-bit damage
descriptor, and its independently packed descriptor high bit. Thorn and lock
skyfall therefore consume the same LCG in that order. The browser exposes the
decoded record as `thornFallRule` and preserves this shared-stream ordering.

The following `_checkPassiveSkill4Block` branch produces Nail Orbs. While its
packed control is active, each newly spawned natural type `0..5` spends one
advance from the same `+0x66a14` stream and receives flag `0x20000` when
`floor(high16 * 100 / 65536) < percent`; special types neither qualify nor
consume a roll. This branch runs after thorn assignment and before lock-fall.
Matched Nail Orbs are counted across every cascade. After ordinary party
attacks, `_gamePhaseEachTurn` at `0x67d2e0` visits each surviving enemy and
deals `izMathRoundSint64(max(1, enemyMaxHp * nailCount / 100))`, so positive
half values round upward. `sGAMEWORK::addNailCounts` at `0x422e60` accumulates
the erase-effect count before this step. The browser keeps the raw flag and
renders a nail overlay, exposes `nailFallRule`, and reports the separately
resolved `lastNailDamage` while including it in total outgoing damage.

The first `_checkPassiveSkill4Block` branch is the native black/invisible
skyfall effect. An active packed duration at game-work `+0x87804` permits types
`0..10`; each eligible spawn consumes one shared `+0x66a14` LCG roll scaled to
10,000 and compares it with the signed chance at `+0x87808`. Success sets block
flag `0x1000` and stores countdown `1` with byte bit 7 at `sBLOCK+1`. When the
spawn-context byte at `+0x66a41` is zero, it also sets transient flag `0x10000`.
`_incEneTurn` at `0x677978` clears that transient bit without decrementing the
countdown on the spawn cycle; later enemy turns decrement the low seven bits
and clear `0x1000` at zero. `_doEntireBlack2` (`0x627118`),
`_doMakeInvDropEfc` (`0x627e58`), and `_clearBlackFall` (`0x6b57a0`) confirm the
state identity. On special types `6..9`, success also zeros enhancement and
clears pre-existing combo-drop/Nail flags. The browser exposes this record as
`blackFallRule`, renders the concealed orb and countdown, and advances both
orb and effect lifetimes on the enemy-turn boundary.

The last `_checkPassiveSkill4Block` branch handles enhanced and weakened
skyfalls for natural types. `_countPassiveSkills` at `0x63fa28` is called with
attribute-specific skill IDs `14, 15, 16, 17, 18, 29`; each matching awakening
adds 20 percentage points and the positive base is capped at 100. An active
ordinary modifier with zero weakening power adds its signed chance, while a
weakening modifier subtracts the chance. Positive net chance creates the
native `+0.06f` enhancement; negative net chance creates
`float32(-weakeningPower / 100)`. Both directions cap their roll probability at
100%. Crucially, the branch consumes exactly one `+0x66a14` LCG advance for
every natural spawn even when the net chance is zero or its roll fails. Special
types skip this branch and consume nothing. The browser exposes the decoded
inputs as `enhancedFallAwakenings`, `enhancedFallModifier`, and
`passiveEnhancementFallsEnabled`, and performs this step between Nail and lock
assignment on the shared stream.

Bomb and thorn hits accumulate in the same native pending-damage integer at
game-work offset `0x8aacc`; neither is clamped against current HP at the moment
of contact. `_applyHpRecAndPoisonDamage` later subtracts that aggregate from
recovery and applies one signed HP delta. The browser therefore nets heart
recovery against poison, bombs, and thorn crossings before its single `0..maxHP`
clamp. This matters at low HP, where an early hazard clamp would over-credit a
subsequent heart match.

Classic base multipliers recovered in the calculation path are:

- three connected orbs: `1.0`
- each additional connected orb: `+0.25`
- first combo: `1.0`
- each additional combo: `+0.25`
- five or more connected attack orbs: mass attack

Skyfall collapse is column-based and matching is repeated until no marked group
remains. Seeded fallback boards and replacement drops use the binary's exported
`izRndLcGet` sequence: a wrapping 32-bit
`state = state * 0x343fd + 0x269ec3`, with the unsigned high 16 bits returned
for each draw. The browser RNG exposes its current unsigned 32-bit state in the
game snapshot and can resume both ordinary high-16 draws and the recovered
two-global-step `_getRandomBlock` shuffle from that state through
`PuzzleEngine.setRngState`. This makes browser
seeds reproducible against the native random primitive rather than merely
deterministic within JavaScript; it does not make the absent weighted drop
tables or opening-board constraints implicit.

`_getRandomBlockOnFace` uses the same shuffle but derives its candidate list
from live face queries: types 0 through 4 are included when their query returns
at least one, and Heart type 5 is queried only when the caller enables it. An
empty candidate list returns `-1` without advancing saved RNG state; a
non-empty list always performs both saved advances, even for one candidate. It
returns the first shuffled type and can write the second when present. The pure
rules API accepts those face counts explicitly rather than fabricating the
native board/game-work query behind them.

## Damage and recovery pipeline

The main boundaries are `_calcCards` (`0x6537c4`), `_calcDamage` (`0x659b4c`),
`_applyAttack` (`0x68abfc`), `_attack2Enemy` (`0x624998`),
`_calcFinalAttackPow4target` (`0x68463c`), `_recPowSet` (`0x68637c`), and
`_calcFinalRecPow` (`0x68641c`).

The client does not calculate one undifferentiated team hit. It builds per-card
attack information, applies match and combo scaling, leader/passive/active-skill
effects, attribute relationships, target selection, caps, enemy defense and
shields, then registers damage/effects. Recovery similarly accumulates card RCV
and heart-match contributions before leader/passive modifiers and truncates
positive floating results with AArch64 `fcvtzs` at observed state boundaries.

The current pure JS harness implements the classic match/combo, elemental,
defense, recovery, targeting, mass-attack, and enemy-turn core. The exact binary
path remains authoritative for the very large modern skill/passive matrix.
Leader attack scaling is attached to the leader and helper card records rather
than hidden in the global combo formula, mirroring `_applyLeaderSkill`'s
data-driven role. The demo party uses a compact combo-threshold leader effect;
custom test parties without those records receive no implicit leader bonus.

Numeric staging is preserved in the classic harness rather than collapsing the
formula into one floating expression. `_calcCharge` adds each match's integer
contribution into the card's base attack lane. As combo animations complete,
`_gamePhaseComboWait` invokes the combo helper; `_applyComboMul` advances the
global combo multiplier and `sCARD::dmgUpBase` recomputes each current lane from
its accumulated base through `izMathCeiling`. Same-attribute matches are
therefore summed before the final combo-multiplier ceiling, rather than each
being independently multiplied and rounded. Later attack multipliers call
`sCARD::dmgUp`, which rounds positive values to nearest with `+0.5`;
`_calcAttackPow` applies elemental advantage/disadvantage with
`izMathCeilingSint64` before defense. Recovery uses positive `fcvtzs`
truncation in `_recPowSet`, matching a floor operation. Intermediate attack and
recovery operations held in AArch64 `s` registers are explicitly narrowed with
JavaScript `Math.fround`; this avoids binary64 artifacts at integer boundaries
(for example, 75 attack with two enhanced orbs is exactly 84 in the native
single-precision path, not 85).

`_calcAttackPow` clamps the attribute-scaled integer to the attacking card's
damage cap before subtracting enemy defense, then applies the caller's minimum
damage (normally one). A null-card calculation uses `0x7fffffff`; the browser
uses that classic default while allowing a card record to provide a larger
modern cap. This order matters near the cap because subtracting defense before
the clamp would award too much damage.

The attack records contain independent main, tertiary, and secondary attribute
lanes. `_gamePhaseAttackExec` resolves them as global rounds: all six main
attacks, then all six tertiary attacks, then all six secondary attacks. A later
card or lane therefore retargets if an earlier hit defeats its target.
`_buildAttackCharge` divides a natural secondary
attack by 10 when it repeats the main attribute, or by 3 when it differs. A
secondary-attribute-change awakening takes a distinct 15% path. The tertiary
lane takes a distinct 5% path regardless of its element. Each path rounds the
lane upward before match scaling. The classic browser engine models all three
hits independently, including each lane's attribute advantage, defense,
mass-attack decision, damage-based automatic targeting, manual target override,
mid-round retargeting, and damage display. Its party also uses the native
six-card shape (five player cards plus the helper), and team recovery is the
sum of those six card records.

The ordinary automatic-target branch in `_calcChoiceAtkTarget` does not merely
pick the lowest-HP enemy. It first retains the largest-current-HP target the
pending hit can defeat. With no lethal candidate, elemental advantage takes
priority and projected damage/current HP breaks the remaining tie. The browser
uses that ordering and shows the target ring only for an explicit tap;
automatic retargeting updates combat state without masquerading as a manual
selection. If a mass attack defeats the manually selected enemy without
entering the single-target chooser, the selection is still cleared after the
attack round and the fallback index advances to a surviving enemy.

## Shipped asset containers

`DATA000.BIN` is an `MCD5` index with a 0x50-byte header and 4,328 16-byte
records. `DATA000.NAM` contains matching fixed 16-byte names. Confirmed flags:

| Flag | Count | Meaning |
| --- | ---: | --- |
| `0x8000` | 97 | uncompressed resident data in `DATA001.BIN` |
| `0x8002` | 1,520 | download-only asset; location points to full-name strings |
| `0x18000` | 3 | uncompressed resident data in `DATA002.BIN` |
| `0x18001` | 945 | `IOSChyQ` compressed textures in `DATA002.BIN` |
| `0x28000` | 232 | resident WAV files in `DATA003.BIN` |
| `0` | 1,531 | empty/reserved slot |

`block2.btex` is the original orb atlas. It is a 512x512 `TEX2` image containing
a 1 MiB RGBA plane followed by 26 16-byte sprite rectangles. Base orb records are
2–7 in fire, water, wood, light, dark, heart order. The puzzle page can decode
and use this atlas from a user-selected APK in a Web Worker. The texture width is
stored in the low 12 bits of the packed dimension field; its upper nibble selects
the GLES pixel format.

Resident monster art uses both texture generations. `mons_001.btex` expands to
a sprite-less 256x256 `TEX1`; `mons_147.btex` is a 256x256 `TEX2` with one sprite
record. Both store little-endian `GL_UNSIGNED_SHORT_4_4_4_4` pixels, identified
by format selector `0x3000`. The browser reproduces the RGBA4444 conversion,
finds the non-transparent content bounds, and displays two original resident
monsters beside the decoded orb atlas. All decoding remains local to the worker;
no extracted art is stored in the repository or transmitted.

The restored `CCardTexMana::UnZipCardBtex` call resolves through the recovered
GOT to `cMINIZIP::getUnzipSize` (`0x348c60`) and
`cMINIZIP::unzip4mem2` (`0x348dcc`). The misleading `IOSChyQ` prefix is a
12-byte `IOSC` wrapper, not an opaque proprietary codec: byte 4 selects the
compression method (`0x68` for DEFLATE), byte 5 is XORed across the stored body,
bytes 6–7 hold an `izCrcCalc` CRC-16/CCITT result, and bytes 8–11 hold the
expanded length. The browser archive reader now reproduces this path and
validates both expanded length and CRC. On the exact APK it expands
`mons_001.btex` from 8,741 bytes to its 131,120-byte `TEX1` payload.

## Exact offline boundary

The native client successfully opens packaged `assets/DATA001.BIN`, creates
`files/boot.bin`, and then requests `files/data048.bin` and `cache/data030.bin`.
Those private runtime files are not in this APK. `data048.bin` is the
server-issued account GUID/identity file rather than gameplay asset content;
[PADDash's extraction documentation](https://mapaler.github.io/PADDashFormation/doc/export-player-data.html)
independently identifies the same Android private path and account-specific
role. `data030.bin` is cache/private state requested by this build. The port does
not fabricate either file or claim that synthetic credentials make the online
client playable. Without legitimate retained state, the faithful binary client
remains on its real Japanese startup warning. The browser UI accepts
optional `.bin` files so legitimately retained runtime data can be mounted. It
canonicalizes selected names to Android's case-sensitive private paths:
`data048.bin` under `files/`, `data030.bin` under `cache/`, and other retained
`.bin` files under `files/`. This also makes uppercase host filenames usable
without changing the path requested by `libpad.so`.

The downloaded-file loader uses `fseek(file, 0, SEEK_END)`, `fgetpos`, rewind,
then a single full-length `fread`. The first browser ABI initially lacked
`fgetpos`, so its generic compatibility return left the output position at zero
and suppressed every payload read. The AArch64 libc shim now implements the
Android 64-bit `fpos_t` write against the virtual descriptor offset. An exact
browser trace with the APK's own 91,486-byte `DATA000.BIN` as a structural
control now records `SEEK_CUR = 91486` and full 91,486-byte reads for both
runtime paths, including the original `MCD5` header bytes. The control is not
claimed to be valid downloaded data; it proves that the native format validators
now receive the supplied payloads rather than stopping in the platform shim.

The full browser smoke test treats this as a verified execution boundary, not
just a rendered screenshot: it requires the exact-library probe, all six
lifecycle exports, more than 100 million interpreted guest instructions, more
than 100 frames and 10,000 translated draws, four delivered touch callbacks,
and both missing-data requests with no console errors.

This is an account/server boundary, not a CPU-port failure: protection, JNI,
lifecycle, rendering, frames, touch callbacks, private-file loading, and payload
reads are all running. The remaining offline work is coverage of modern
active/leader/passive mechanics in the pure rules harness where server-issued
account state and datasets are unavailable.
