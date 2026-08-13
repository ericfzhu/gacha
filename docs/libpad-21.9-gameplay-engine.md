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

The raw activation path is now decoded as well. `_doEnemySkill` (`0x6285a4`)
uses its second halfword jump table at `0xd3cbe0`; signed skill type `128` has
entry `0x61d`, which resolves from base `0x628fe0` to the black-fall handler at
`0x62a854`. The selected definition's type is a signed halfword at `+0x04`.
The matching `_setupEnemyAttackSub` table entry `0x4af` resolves from base
`0x61fee4` to `0x6211a0`. It copies definition duration `+0x10` to
`sMONSTER+0x678` and converts positive percentage `+0x14` to basis points at
`sMONSTER+0x67c` (nonpositive input defaults to 10,000). The execution handler
reads its runtime duration from `sMONSTER+0x678` (the packed signed
ten-bit lane) and its effective signed basis-point chance from the low half of
`sMONSTER+0x67c`. `decodePadEnemySkillRuntime` accepts those two native byte
records directly, and `PuzzleEngine.applyEnemySkillRuntime` or
`applyEnemySkillRecord` installs the decoded effect. Unsupported skill types
are reported without mutating the board-rule state.

Definition setup is browser-accessible without first constructing a 2,896-byte
monster record. `decodePadEnemySkillDefinition` reproduces the type-128 setup
entry, including its nonpositive-chance default, and
`PuzzleEngine.applyEnemySkillDefinition` executes that materialized record.
For turn-driven use, `setEnemySkillQueue(enemyIndex, definitions)` supplies an
already-selected definition sequence at the native AI boundary. `_doEnemyAi`
stores its selected definition index at `sMONSTER+0x670`; the browser also
accepts the raw downloaded record subset needed to select supported type-128
definitions without fabricating condition data.

The newer selector is chosen by enemy-definition byte `+0xe0` bit 0.
`decodePadEnemyAiMonsterDefinition` reads its signed AI budget cap/regeneration
at `+0xe2/+0xe4` and up to 64 eight-byte slots beginning at `+0xec`; each slot
contains a 32-bit skill ID plus immediate-chance and fallback-weight bytes at
`+4/+5`. `decodePadEnemyAiSkillDefinition` reads probability factors at
`sENEMYSKILL+0x30/+0x34`, signed HP threshold percentage at `+0x38`, and budget
cost at `+0x40`. `_chooseEnemyAiNew` (`0x61d450`) scans slots in order, requires
`currentHP / maxHP * 100 <= threshold` and sufficient pre-regeneration budget,
then computes the immediate basis-point chance as
`factor0 * factor1 * slotChance / 100000`, capped at 10,000. Every admitted
immediate test spends the ordinary game-work LCG stream.

If no immediate test succeeds, one further LCG step selects among the eligible
`+5` weights. The native routine still spends that fallback step when the
candidate list exists but its dynamic conditions reduce the effective total to
zero. After selection, budget regenerates with integer clipping to the decoded
cap and the selected skill's cost is subtracted. For type 128,
`_chooseEnemyAiSub` (`0x61a58c`) returns one only while black-fall is inactive,
so an active copy cannot be selected again. `setEnemyAiDefinitionPool` wires
this raw record path into enemy turns and reports the chosen skill ID, budget,
and RNG state. Remaining condition callbacks, flow-control records, and the
legacy selector are rejected explicitly until decoded rather than approximated.

The selector does not reduce every condition callback to a boolean. In the
immediate path at `0x61d844`, `_chooseEnemyAiSub` returns a binary32 multiplier;
native multiplies the truncated authored probability by that value, clamps the
result to 10,000, and then performs its LCG test. In the fallback path at
`0x61d96c`, the same return is used only as a greater-than-zero eligibility
gate. An eligible fallback retains its authored `sENEAI+5` weight without
scaling. The browser selector exposes this as `probabilityScale` while keeping
the already decoded condition-owned RNG state transitions intact.

Enemy skill type `17` is the lone-enemy attack boost. Its late dispatch entry
targets shared boost handler `0x629064`, setup targets `0x61ffdc`, and AI
condition targets `0x61acdc`. Setup copies definition duration `+0x14` to
runtime `sMONSTER+0x678` and attack percentage `+0x18` to `+0x67c`, consuming
no RNG. Execution writes the duration through protected signed-int16 counter
`sMONSTER+0x860`, converts the signed percentage to binary32, divides by
binary32 100, and writes the protected multiplier at `+0x850`.

The condition first rejects an already positive `+0x860` counter, then scans
the native monster slots and admits the action only when exactly one monster
has positive current HP. `_incEneTurn` decrements the boost counter before a
later enemy action. `_setEnemyAttackMain` reads the active multiplier and
multiplies it into the incoming attack ratio in binary32 before converting the
enemy's protected int64 attack and applying native positive rounding.

The generic positive `sENEMYSKILL+0x44` accompanying hit is prepared before the
selected skill handler executes. A type-17 record that both attacks and raises
attack therefore uses the old multiplier for its same-action hit; the new boost
affects subsequent ordinary, accompanying, and standalone scaled attacks. The
browser preserves this ordering, exact one-probability-draw selection, status
countdown, snapshot, and `ATK percent/turns` presentation. Neighboring types
`18` and `19` share the execution handler but retain distinct setup layouts and
conditions and are not conflated with type `17`.

Enemy skill type `20` applies the enemy's status-ailment immunity shield. Its
late dispatch entry targets `0x629534`, setup targets `0x61ff08`, and AI
condition targets `0x61b4d8`. Setup copies signed definition integer `+0x10`
to runtime `sMONSTER+0x678` without consuming RNG. The handler writes that
value through the protected signed-int16 counter at `sMONSTER+0x870`.

The condition reads the same protected counter and admits the action only when
it is not positive. `_incEneTurn` (`0x677978`) decrements positive status
counters before a later enemy action, while `sMONSTER::resetStatus`
(`0x6b159c`) and `cGAMEMAIN::_monsStatusClear` (`0x691bcc`) clear this lane.
The damage pipeline also checks `+0x870` before applying the player's global
enemy-defense reduction, demonstrating the immunity shield's gameplay effect
rather than treating it as presentation-only state. The browser records the
per-enemy counter, rejects reapplication before the immediate probability
test, advances it on the same enemy-phase boundary, and renders its remaining
turns. An admitted immediate record spends one probability draw only.

Types `21` through `38` are rejected records in this build. Their dispatch
entries all use no-effect finalizer `0x62be50` and their conditions all use the
false return at `0x61c01c`. Types `21..36` and `38` use selection-clearing setup
`0x621c94`; type `37` points at generic setup tail `0x6217c0`, but its false
condition prevents that setup from being reached through normal AI selection.

Enemy skill type `39` applies the player move-time reduction status. Its late
dispatch entry targets `0x629544`, setup targets `0x6217a8`, and AI condition
targets `0x61b4f0`. Setup copies signed definition integers `+0x10`, `+0x14`,
and `+0x18` to runtime `sMONSTER+0x678`, `+0x67c`, and `+0x680` respectively,
without consuming RNG. They are duration, fixed centisecond reduction, and
percentage reduction.

The handler packs the duration's low ten bits into game-work status word
`+0x871ec`, preserving its high status bits and setting the active `0x400`
flag. When runtime `+0x680` is nonzero, native stores that signed value and
selects percentage mode; otherwise it stores the signed fixed-centisecond
value. Both paths use the protected signed-int16 field at `+0x871f0`, with the
mode byte at `+0x87200`. `cGAMEMAIN::_resetTouchBar` (`0x675514`) then rebuilds
the current move window from the player's base time: fixed mode subtracts
centiseconds, while percentage mode subtracts the authored percentage. The
browser carries that effective time into both the visible timer and the actual
pointer deadline.

The condition admits the skill while the status is inactive. An active status
can only pass when native override byte `+0x87210` is nonzero, but ordinary
execution clears that byte; normal reapplication is therefore rejected before
the immediate probability test and consumes no RNG. Status duration advances
at the start of a later enemy phase, so a newly applied two-turn reduction
survives the next two player move windows. An admitted immediate record spends
only its ordinary probability draw because setup itself is deterministic.

Enemy skill type `40` makes the acting monster defeat itself. Its late dispatch
entry targets `0x629660`, its setup entry targets the generic tail at
`0x6217c0`, and its condition is the unconditional `1.0` return at `0x61a630`.
The skill has no effect-specific authored or runtime parameters, and setup
consumes no RNG. An admitted immediate new-AI record therefore spends only its
ordinary probability-test draw.

Execution writes zero through the two protected halves of current HP at
`sMONSTER+0x3c/+0x4c`, then zeroes the matching displayed-HP mirror at
`+0xd4/+0xe4`. It forwards the resulting zero to the HP-gauge animation with a
half-second transition and sets the monster's terminal presentation flags at
`+0x204`. The browser applies zero HP to the acting enemy, leaves other enemies
untouched, and checks for victory after the enemy phase so a floor whose last
monster uses this action can actually complete.

Types `41`, `42`, `43`, `44`, and `45` are not live gameplay actions in this
build. Every one resolves to no-effect finalizer `0x62be50`, selection-clearing
setup `0x621c94`, and false condition `0x61c01c`. They remain explicitly
unsupported control/sentinel records in the browser port.

Enemy skill type `46` changes the acting monster's attribute. Its late dispatch
entry targets `0x629708`, setup targets `0x621504`, and AI condition targets
`0x61b520`. Five signed definition integers at `+0x10`, `+0x14`, `+0x18`,
`+0x1c`, and `+0x20` form the authored candidate list. Values below zero or
above four are ignored, as is the monster's current attribute. Valid duplicate
entries are retained, so they weight selection exactly as authored.

The current attribute comes from signed override byte `sMONSTER+0x22f` when it
is nonnegative; otherwise native reads byte `+0x0c` of the base monster
definition. The condition rebuilds the candidate list and rejects an empty
one without touching RNG. When candidates exist, it consumes one ordinary LCG
draw and randomly reads a candidate merely to prove the selected signed byte is
nonnegative. Because invalid entries were already removed, that selected value
does not otherwise affect admission—the condition-owned draw is intentionally
discarded.

Setup rebuilds the list, consumes another LCG draw, selects the actual target,
and stores it at runtime `sMONSTER+0x678`. Execution clears the monster's
protected transient attribute state, invokes the native attribute-transition
path with that runtime value, and clears its presentation latch. Thus an
immediate AI selection spends three draws in order: discarded condition choice,
probability test, and setup choice. With seed 21900, current Wood, and authored
list `[Fire, Wood, Water, Light, invalid]`, the target is Water and final RNG
state is `1929471377`. The browser keeps this exact stream and changes the
enemy's attribute used by rendering and subsequent damage calculations.

Enemy skill type `47` is a standalone percentage-scaled enemy attack. Its late
dispatch entry targets `0x62972c`, setup targets `0x620040`, and AI condition
targets `0x61b54c`. Setup copies signed definition integer `+0x14` to runtime
`sMONSTER+0x678` without consuming RNG. The condition admits the record only
while native `sMONSTER+0x6c0` is zero; the browser exposes that field as
`scaledAttackGate` so the same rejection boundary remains testable.

Execution converts runtime `+0x678` to binary32, divides by binary32 100, and
passes the ratio to `_setEnemyAttackMain` with no positive fixed-damage
override. That routine converts the enemy's protected int64 attack to binary32,
multiplies in binary32, and rounds the positive result. The browser reuses the
same `padEnemySkillAttack` numeric primitive already validated for accompanying
attacks, while retaining type 47's distinct decoder and dispatch path. With the
demo enemy's attack 1,850, an authored 50% record deals 925 damage.

This is deliberately separate from the generic positive `sENEMYSKILL+0x44`
accompanying-attack field: type 47 uses `+0x14`, materializes it through
`sMONSTER+0x678`, and is itself the attack. An admitted immediate new-AI record
spends one probability draw and no setup draw; a nonzero gate rejects it before
that probability roll.

Enemy skill type `50` deals fixed damage equal to a percentage of the player's
current HP. Its late dispatch entry targets `0x62974c`, setup targets `0x621530`,
and its unconditional AI condition targets `0x61a630`. Setup copies signed
definition integer `+0x10` to runtime `sMONSTER+0x678`, marks the monster's
prepared action state, and consumes no RNG.

Execution reads protected player current HP. A runtime percentage of exactly
100 bypasses arithmetic and uses the current value directly. Otherwise it
converts current HP and the signed percentage to binary32, multiplies, divides
by binary32 100, and calls `izMathRound` (`0x36a9bc`), whose half values round
away from zero. `_setEnemyAttackMain` receives the positive result through its
fixed-damage integer override while its ordinary attack multiplier is zero.
Nonpositive results therefore produce no damage rather than falling back to the
enemy's base attack.

The browser preserves every binary32 boundary and, when multiple enemies act,
computes later current-HP gravity against HP after already pending damage in
that enemy phase. An immediate new-AI selection consumes its one probability
LCG draw and no setup draw. Raw runtime decoding reads the materialized percent
from `+0x678`.

Neighboring type `51` is not exposed as a gameplay effect. Its condition entry
at `0x61c01c` returns the routine's initialized zero, setup `0x621c94` writes
`-1` to the selected-skill index and returns `-1.0`, and dispatch points to the
common no-effect finalizer `0x62be50`. The browser continues to reject that
control/sentinel record instead of inventing visible behavior.

Enemy skill type `52` resurrects one unavailable or dead enemy monster. Its
late dispatch entry targets `0x6297ac`, setup targets `0x620350`, and AI
condition targets `0x61a9d0`. Signed definition integer `+0x10` is the
percentage of the target's max HP restored by the skill.

The condition walks the native monster array at its `0xb50`-byte stride and
admits the skill when at least one slot has its unavailable bit set or its
protected int64 current HP is at most zero. Setup repeats that scan, initializes
runtime `sMONSTER+0x678` to `-1`, and, when candidates exist, consumes one
ordinary LCG draw. It maps the high 16-bit result uniformly over candidate
count, walks candidates in native slot order, stores the chosen real slot index
at `+0x678`, and copies definition `+0x10` to runtime `+0x67c`. The draw is
spent even when there is exactly one candidate.

Execution bounds-checks the stored index and refuses to overwrite a target that
has become available and alive. It reconstructs the target's protected int64
max HP, converts both operands to binary64, computes `maxHP * percent / 100`,
and calls `izMathRoundD` (`0x36b2ec`), whose half values round away from zero.
The result is written back through the target's protected current-HP pair while
the remainder of the handler restores its presentation state. The compact
browser state has no separate unavailable-slot representation, so it uses
`hp <= 0` as the candidate boundary and applies the same percentage and
rounding path. Its enemy-phase loop also preserves the alive set captured at
phase start, preventing a newly resurrected target from acting in that same
phase.

An immediate new-AI resurrection therefore consumes two ordinary RNG draws:
one probability test and one target selection. A failed no-target condition
consumes neither. Materialized runtime records expose `targetEnemyIndex` from
`+0x678` and `revivePercent` from `+0x67c` directly, without rerolling.

Enemy skill type `53` grants one enemy attribute-damage absorption. Its late
dispatch entry targets `0x6298ac`, setup targets `0x61ffe8`, and AI condition
targets `0x61ae34`. Signed definition integers `+0x10/+0x14` form the inclusive
duration range; `+0x18` supplies a mask whose low six bits map to Fire, Water,
Wood, Light, Dark, and Heart attack attributes.

The condition reads the protected signed-short duration at `sMONSTER+0x890`
and admits the skill only below one, without consuming RNG. Setup consumes one
ordinary LCG draw to materialize the inclusive range into runtime `+0x678` and
copies the authored mask to runtime `+0x67c`. Execution writes those values to
the protected duration and mask fields at `sMONSTER+0x890/+0x880`; there is no
execution reroll. An admitted new-AI skill therefore spends two draws in total:
one probability test and one setup-duration roll. With seed 21900 and range
2–4, the stored duration is 4 and RNG state becomes `3803934822`.

`_calcFinalDamage` (`0x623b40`) first requires an active duration, limits this
mask path to attack attributes 0–5, and tests `mask & (1 << attribute)`. A match
marks the hit as absorption and the later attack path applies the negated hit,
healing the monster up to max HP instead of reducing it. The fixed nail-damage
path is independent. `_incEneTurn` decrements existing monster statuses before
the next enemy attack is prepared, so a newly applied duration remains intact
for the following player action. The browser mirrors this ordering, reports
absorbed damage separately from dealt damage, and exposes an `ABS` status label
with the active attribute codes and remaining duration.

Enemy skill type `54` binds the leader, helper, or both. Its late dispatch
entry targets `0x628fe0`, setup targets `0x621008`, and AI condition targets
`0x61aa5c`. Authored byte `+0x10` bit 0 selects party index 0 (leader) and bit
1 selects party index 5 (helper). Signed integers `+0x14/+0x18` are the
inclusive minimum and maximum bind duration.

The condition admits the skill only when at least one authored target is a
valid, present card whose signed-byte bind timer is zero; it consumes no RNG.
An admitted immediate AI probability check still consumes one ordinary LCG
draw. Setup then consumes another draw to choose an inclusive duration, clears
the runtime mask at `sMONSTER+0x674`, and sets party-mask bit 0 and/or 5 for
the still-present, still-unbound targets. It stores that setup duration at
`sMONSTER+0x678` (and mirrors its low 16 bits in the runtime record).

The type-54 execution handler deliberately does not reuse the stored setup
duration: it consumes another ordinary LCG draw and rerolls the same inclusive
range before calling `_doBind` (`0x616de4`). Thus an AI-selected bind with no
resistance checks consumes three draws: probability, setup duration, execution
duration. Seed 21900 with range 2–4 produces setup duration 4 and executed
duration 3, leaving RNG state `919597584`.

`_doBind` visits targets in native order `[0, 5, 1, 2, 3, 4]`. An already-bound
target extends without a resistance roll and caps at 99. An unbound card gains
50 resistance points from Bind Resist and 100 from Super Bind Resist, with
eligible team-badge resistance added by the native caller. Positive resistance
consumes one LCG draw mapped to integer 0–99; the target resists when
`resistance >= roll`, preserving the binary's inclusive comparison (so a
nominal 50-point check blocks rolls 0 through 50). The browser exposes the card
flags and optional numeric badge contribution at this primitive boundary.

Bound browser cards do not attack or contribute team recovery. A bound leader
or helper contributes leader multiplier 1, and bind timers decrement after the
player resolution so an enemy-applied duration covers the following player
actions. Snapshot state exposes target/setup masks, both duration rolls,
applied/resisted masks, and per-card timers; the canvas dims bound cards and
labels the remaining duration.

Enemy skill type `55` heals the player. Its late dispatch entry targets
`0x629900`, setup targets `0x620040`, and AI condition targets `0x61aa74`.
Definition `+0x10` is a signed player-current-HP percentage threshold;
definition `+0x14` is copied to `sMONSTER+0x678` as the signed percentage of
player max HP to restore. This player threshold is additional to the generic
enemy-HP threshold at definition `+0x38` used by `_chooseEnemyAiNew`.

The condition computes `currentPlayerHp * 100 / maxPlayerHp` in binary64,
passes it through `izMathRoundD` (`0x36b2ec`, halves away from zero), and admits
the skill when that rounded value is at most `+0x10`. It consumes no condition
RNG; an admitted immediate probability test still consumes the ordinary AI
roll, while rejection consumes none.

Execution converts the signed runtime percentage to binary32, divides by
binary32 100, and calls `izMathSint32MulAdd(0, maxHp, ratio)` at `0x36b3fc`.
That helper promotes the already-rounded binary32 ratio to double, clamps to
signed-int32 bounds, and rounds halves away from zero. `sPLAYER::addHp`
(`0x678838`) caps the delta to max HP, performs the native signed-32-bit add,
then clamps current HP into `[0, maxHp]`. The browser preserves this sequence,
including the float32 boundary and optional accompanying enemy attack.

Enemy skill types `56` and `58` are deterministic source-color poison writers.
Both resolve through late dispatch handler `0x62917c`, setup `0x61ff08`, and AI
condition `0x61a63c`. Definition `+0x10` is the signed source orb type copied to
`sMONSTER+0x678`. Type 56 writes poison type 7; type 58 writes mortal poison
type 8.

The condition calls `_countBlockType` (`0x65213c`) and returns
`min(sourceCellCount / 3, 1)` in binary32, or zero when no source cell exists.
Consequently one source orb gives one-third of the authored immediate chance,
two give two-thirds, and three or more give the full chance. Locks do not affect
the count. The fallback path admits any positive count but does not scale its
weight.

Execution calls `_doBlockSwap(int, int, bool, bool *)` at `0x6afa84`. It walks
the whole board without consuming LCG state, rewrites every unlocked matching
source cell, and delegates each write to `_doBlockSwapMain` for special-state
cleanup and passive resistance. Ordinary source types match exactly; source 7
or 8 intentionally denotes the combined poison/mortal-poison family. The
browser `doBlockSwap` primitive preserves that grouping and lock behavior.
Fixtures prove the float-scaled immediate failure, unscaled fallback admission,
locked-cell count/write distinction, zero execution RNG, and both poison
destinations.

Enemy skill types `60` and `61` are count-gated individual poison writers.
Both use late handler `0x6291e0`, setup `0x61fee4`, and AI condition `0x61a710`.
Definition `+0x10` is a positive requested cell count and nonzero `+0x14`
excludes Heart. Type 60 selects poison type 7; type 61 selects mortal poison
type 8. Nonpositive counts are rejected at the browser's raw-data boundary
because the native condition divides by this value.

The condition counts every live cell that is neither poison nor mortal poison,
optionally excluding Heart, and admits the skill only when that count is at
least the requested amount. It ignores locks and consumes no RNG. Execution
then uses `_doPoisonBlockN`, spending two saved-LCG coordinate advances per
requested cell. This differs deliberately from type 64: type 64 needs only one
eligible candidate even when its requested count exceeds the available cells,
while types 60/61 require the full requested count before AI selection.

Browser fixtures request four cells, preserve every Heart, write exactly four
poison or mortal-poison cells, spend one AI probability roll plus eight writer
rolls, and update budget 100 to 80. A board with only three eligible cells is
rejected without consuming RNG.

Enemy skill types `57` and `59` are the whole-color poison writers. Both use
the late dispatch handler `0x6291b8`, setup `0x61fee4`, and AI condition
`0x61a6a0`. Definition `+0x10` is the requested number of represented dungeon
face colors and nonzero `+0x14` excludes Heart from the eligible replacement
list. Type 57 writes poison type 7; type 59 writes mortal poison type 8.

The condition first requires at least one represented face color after the
optional Heart exclusion, then separately requires that the total number of
represented face colors—including Heart—be at least the requested count. It
does not consume RNG. This distinction means a Fire-plus-Heart board can pass a
request for two represented colors while the executor still converts only the
Fire group when Heart is excluded; an all-Heart board fails the first gate.

Execution calls `_doPoisonBlocks` (`0x626e78`). Native filters the ordered
dungeon face list by current board presence and the Heart flag, then always
spends two saved-LCG advances to seed a temporary shuffle when that list is
nonempty. The temporary shuffle does not alter the saved state further. The
first requested color groups are converted in full, subject to per-cell lock
rejection. Browser fixtures for types 57/59 consume one new-AI roll plus the
two saved shuffle rolls, preserve Heart, choose the same two source colors,
and produce six new poison or six new mortal-poison cells; the mortal fixture
also retains its one pre-existing mortal-poison cell.

Enemy skill type `64` is the count-limited individual poison writer. Its early
dispatch entry resolves to `0x628ccc`, setup to `0x6203f8`, and AI condition to
`0x61aac4`. Definition `+0x10` is presentation data; signed `+0x14` is the
requested cell count; nonzero `+0x18` excludes Heart; and `+0x1c == 1` selects
mortal poison type 8, with every other selector value producing poison type 7.
Setup copies those four words to `sMONSTER+0x680/+0x684/+0x688/+0x68c`.

The condition scans the live board dimensions and admits the skill only when
at least one cell is neither poison nor mortal poison, also rejecting Heart
when the exclusion flag is set. It ignores locks, exactly like native, and
consumes no RNG. Execution calls `_doPoisonBlockN` (`0x626bf0`), which spends
two saved-LCG advances for every requested cell to choose a starting column and
row, then scans forward with wrap to the first unselected eligible cell. Lock
rejection occurs only when applying the selected cell, so a board containing
only locked-but-otherwise-eligible cells can pass the AI condition while making
no visible change.

The browser raw-record path preserves this distinction. A fixture requesting
five mortal-poison cells while excluding Heart spends one new-AI probability
roll plus ten writer rolls, changes exactly five eligible cells, leaves the
Heart count intact, and updates budget from 100 to 80. A board containing only
poison, mortal poison, and Heart fails the condition without spending RNG.

Enemy skill type `79` is the horizontal-line board rewrite. It uses the early
`_doEnemySkill` table at `0xd3caea`, indexed from type 5; its entry resolves
from base `0x6286b4` to handler `0x6287f8`. The setup entry at `0x61ff14`
combines the low halfwords of definition pairs `+0x10/+0x14`, `+0x18/+0x1c`,
and `+0x20/+0x24` into runtime words at
`sMONSTER+0x688/+0x68c/+0x690`. Each runtime word supplies an unsigned-byte
row mask in its high half and a destination-orb type mask in its low half.
The handler initializes one effect accumulator and calls `_doBlockSwapH`
(`0x6ae8fc`) for all three pairs. Horizontal mask bits are bottom-up on the
canonical 6x5 board and are relocated by the already decoded large/small-board
rules. Every selected cell spends one saved-LCG step before lock rejection and
chooses one enabled destination type; the three calls share the continuing RNG
stream and effect accumulator.

The type-79 `_chooseEnemyAiSub` entry is the unconditional `1.0` handler at
`0x61a630`, so it does not dry-run the board and consumes no condition RNG.
An immediately selected action therefore spends one probability roll followed
by the per-cell line-rewrite rolls. The browser accepts all three authored
pairs from raw definitions, applies them through the existing exact
`doBlockSwapH` primitive, and snapshots the selected skill ID and rewritten
board. A fixture selecting three six-cell rows from seed 21900 consequently
advances the ordinary LCG exactly 19 times.

Enemy skill type `77` is the paired vertical-line rewrite. Its early dispatch
entry resolves to `0x628d3c`, while its setup and AI condition deliberately
share type 79's `0x61ff14` and unconditional `0x61a630` targets. The handler
unpacks the same three runtime words but calls `_doBlockSwapV` (`0x6ae64c`).
Vertical mask bits run left-to-right on a canonical 6x5 board and use the
native X-axis relocation rule at other widths. As in the horizontal handler,
the three calls share one effect accumulator; every selected board cell spends
one ordinary saved-LCG step before lock rejection. Thus three ordinary
five-cell columns selected immediately from new AI consume 16 advances: one
probability roll followed by fifteen rewrite rolls.

Types `76` and `78` are the four-stage line variants. They share setup handler
`0x61ff14` and unconditional AI condition `0x61a630` with types 77/79, but use
all four definition pairs through `+0x28/+0x2c`. Their early dispatch entries
are no-ops; the later table at `0xd3cbe0` resolves type 76 to `0x629c60`, which
calls `_doBlockSwapV` four times, and type 78 to `0x629ce0`, which calls
`_doBlockSwapH` four times. The same native effect accumulator and saved-LCG
state cross all four calls. The browser therefore preserves the variant's
original type ID and pair count instead of collapsing it into the three-stage
records. Four disjoint six-cell rows spend 24 rewrite rolls plus one AI roll;
four disjoint five-cell columns spend 20 plus one.

Enemy skill type `81` converts poison-family cells through an explicit
destination list. Its early dispatch entry resolves to `0x628de0`, setup to
`0x620100`, and AI condition to the unconditional `0x61a630` handler. Setup
stores signed definition values `+0x14/+0x18/+0x1c/+0x20` at
`sMONSTER+0x688/+0x68c/+0x690/+0x694`; definition `+0x10` participates in
presentation setup but is not an argument to the board primitive. Execution
passes those four runtime integers to `_doBlockSwap2` (`0x6af838`). The first
destination is always admitted and each later negative value terminates the
list; admitted entries are truncated to bytes before `_doBlockSwapNew`.

Despite its name, `_doBlockSwap2` does not interpret the four values as two
source/destination pairs. It calls `_doBlockSwapNew` with source mask zero,
which natively expands to the shared poison-family bit and therefore selects
types 7 and 8 (poison and mortal-poison) only. Each eligible cell consumes one
saved-LCG destination roll before lock rejection, after which the existing
minimum-three balancing rule applies if necessary. The type-81 AI condition
does no dry run, so an immediately selected all-poison 6x5 fixture spends one
selection roll and thirty cell rolls, yielding deterministic destination
counts of 12 fire, 9 water, and 9 wood from seed 21900.

Type `80` is the direct-layout counterpart. It shares setup handler `0x620100`
and the unconditional `0x61a630` condition with type 81, but its late dispatch
entry resolves to `0x629d60`. All four `_doBlockSwap2` destinations come from
definition `+0x10/+0x14/+0x18/+0x1c`; there is no leading presentation word.
The poison-family source selection, byte truncation, balancing, lock handling,
and saved-LCG behavior are otherwise identical. Raw decoding keeps type 80 and
its shifted field layout distinct even though both variants execute through
the same browser primitive.

Types `84` and `85` are the bit-mask counterparts to that destination-list
pair. Both use setup handler `0x62004c`, unconditional condition `0x61a630`,
and `_doBlockSwap4` (`0x6af6cc`), which forwards source mask zero plus the
decoded destination mask to `_doBlockSwap5`. Consequently their source is the
same native poison/mortal-poison family, while each set bit in the effective
unsigned 16-bit destination mask is an eligible replacement type. Type 84's
late-table handler `0x629d84` reads that mask directly from definition `+0x10`.
Type 85's early-table handler `0x628e48` instead uses `+0x10` for presentation
and reads the mask from `+0x14`.

The browser decoder preserves those distinct layouts and type IDs, then runs
both through the exact `doBlockSwap4` primitive. With destination bits 0, 1,
and 2 enabled, an immediately selected all-poison 6x5 board consumes one AI
selection roll plus thirty cell rolls and produces the same deterministic
12-fire, 9-water, 9-wood distribution from seed 21900 for either raw layout.

Enemy skill type `151` connects that selector to the weakened-orb primitive.
Its `_doEnemySkill` dispatch entry resolves to `0x62afd0`, which passes
definition `+0x10` as the type mask, converts signed percentage `+0x14` through
float32 division by 100, and passes `+0x18` as the maximum count to
`_doBlockMinus(true, ...)`. Eligible orbs have a matching type bit and
nonnegative enhancement power; the applied value is the negated float32 power.
When the maximum is positive, one saved-LCG advance seeds the native forward
shuffle before the first `min(eligible, maximum)` cells are changed.

The corresponding `_chooseEnemyAiSub` entry at `0x61bab4` calls the identical
primitive with `apply=false` and admits the definition only if its returned
eligible count is at least one. Importantly, a positive maximum still executes
the shuffle and consumes its LCG step during this dry run. The browser selector
threads that changed RNG state into the immediate probability roll, and skill
execution spends the later shuffle step again. This produces all three native
advances for a capped, immediately selected type-151 action: condition dry run,
selection roll, then actual application.

Enemy skill type `153` follows the same selection shape for thorn/burst markers.
Its execution entry `0x62b0d0` calls `_doMakeBurDrop(true, mask, count,
descriptor, true)` with definition fields `+0x10/+0x14/+0x18`; the final true
argument clears the stored descriptor's high bit. The condition entry at
`0x61ba04` calls the same primitive with `apply=false` and requires a nonzero
candidate count. Matching cells must not already carry block flag `0x80000`.
For a nonzero requested count, both the dry run and actual application spend
one saved-LCG advance to seed candidate shuffling, so an immediately selected
action again consumes three advances including its probability roll. The
browser decodes, selects, applies, renders, and snapshots the resulting thorn
descriptor through the raw AI pool.

The action boundary is recovered independently. `_setupEnemyAttack`
(`0x622f64`) reads the counter object at `sMONSTER+0x120` and only admits a live
enemy when its value is at or below zero; it then clears the prepared index at
`+0x7d8` before AI setup. `_doEnemyAi` (`0x622544`) uses the selection at
`+0x670` and packed AI state at `+0x7dc`, while `_resetEnemyAtkLeft`
(`0x6408f0`) restores the base attack interval. The browser decrements one per
completed player turn, resets on an admitted action, executes the next supplied
definition instead of a normal hit, and otherwise falls back to the enemy's
ordinary attack. Existing status countdowns advance before action setup, so a
newly activated fall effect retains its full authored duration on that turn.
`_setupSkillWithAttack` (`0x61fcec`) separately reads positive signed definition
field `+0x44` and stores it at `sMONSTER+0x7e8`. Before the skill handler runs,
`_doEnemySkill` converts that value to an unsigned float32 percentage, divides
it by 100, and calls `_setEnemyAttackMain` (`0x62c2cc`). That routine converts
the enemy's int64 attack to float32, multiplies it by the supplied percentage,
and calls `izMathRound` (`0x36a9bc`), whose positive path adds float32 `0.5`
and truncates. The scheduled browser path reproduces each float32 boundary and
applies this accompanying hit in addition to the selected skill effect.

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
