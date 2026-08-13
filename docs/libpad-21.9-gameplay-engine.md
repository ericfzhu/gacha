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
deal 3, not 4). Recovery and poison are netted before the HP clamp, matching
`_applyHpRecAndPoisonDamage` rather than healing to the cap first.

Orb state remains separate from type. In native `sBLOCK`, type is the signed
byte at `+0`, the flag word is at `+4`, and the enhancement value is the float at
`+8`. `_doLockDropBits` tests and sets flag `0x800`; locking a special type also
clears its enhancement value. The browser orb record therefore carries
`enhanced` and `locked` alongside `type`. Locked orbs still move and match but
are skipped by conversion skills, while enhanced orbs retain their type and add
the classic 6% per enhanced orb in that match. Original atlas overlays 22 and 25
render the enhanced and locked states.

Bombs and burst drops are distinct native mechanisms. `_doMakeBurDrop` writes a
one-byte descriptor at `sBLOCK+0x0c` on an otherwise normally typed orb;
`sGAMEWORK::setBurBlockFlag` uses flag `0x80000`. A true bomb is block type `9`.
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
for each draw. This makes browser seeds reproducible against the native random
primitive rather than merely deterministic within JavaScript.

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
selection.

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
Those downloaded datasets are not in this APK. Without them, the faithful binary
client remains on its real Japanese startup warning. The browser UI accepts
optional `.bin` files so legitimately retained runtime data can be mounted. It
canonicalizes selected names to Android's case-sensitive private paths:
`data048.bin` under `files/`, `data030.bin` under `cache/`, and other retained
`.bin` files under `files/`. This also makes uppercase host filenames usable
without changing the path requested by `libpad.so`.

This is a content boundary, not a CPU-port failure: protection, JNI, lifecycle,
rendering, frames, and touch callbacks are all running. The remaining work for a
fully populated offline client is downloaded data/schema recovery and coverage
of modern active/leader/passive mechanics in the pure rules harness where server
datasets are unavailable.
