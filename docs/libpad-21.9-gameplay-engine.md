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
`+0x75` permits one-cell diagonal adjacency. `_swapBlock` repeats adjacent swaps
when its destination is farther away. Therefore a coalesced browser pointer move
must be expanded into the orthogonal grid boundaries crossed by the motion; a
single direct diagonal exchange is incorrect in normal play.

The JS engine now uses a supercover-style crossing trace with deterministic
horizontal corner ties. Every emitted step has Manhattan distance one.

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

The native combo list is a fixed list of 88-byte `sCOMBO` records with linked-list
indices stored around game-work offset `0x57a8`. Version 21.9 also records modern
shape metadata and passive-skill flags. The browser rules layer now returns mass
attack, row, column, cross, L, and 3x3 box metadata for each connected match.

Classic base multipliers recovered in the calculation path are:

- three connected orbs: `1.0`
- each additional connected orb: `+0.25`
- first combo: `1.0`
- each additional combo: `+0.25`
- five or more connected attack orbs: mass attack

Skyfall collapse is column-based and matching is repeated until no marked group
remains.

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

Numeric staging is preserved in the classic harness rather than collapsing the
formula into one floating expression. `_applyComboMul` calls
`sCARD::dmgUpBase`, which rounds each attack lane upward through
`izMathCeiling`; later attack multipliers call `sCARD::dmgUp`, which rounds
positive values to nearest with `+0.5`; `_calcAttackPow` applies elemental
advantage/disadvantage with `izMathCeilingSint64` before defense. Recovery uses
positive `fcvtzs` truncation in `_recPowSet`, matching a floor operation.

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
and use this atlas from a user-selected APK in a Web Worker; no extracted art is
stored in the repository or transmitted.

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
optional `.bin` files so legitimately retained runtime data can be mounted.

This is a content boundary, not a CPU-port failure: protection, JNI, lifecycle,
rendering, frames, and touch callbacks are all running. The remaining work for a
fully populated offline client is downloaded data/schema recovery and coverage
of modern active/leader/passive mechanics in the pure rules harness where server
datasets are unavailable.
