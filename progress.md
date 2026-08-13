Original prompt: I'd like you to go through this project, and make it as close in gameplay and UI to the game "Kantai Collection" as possible, though with custom battleship sprites

Current request: Reconstruct the inspected Puzzle & Dragons 21.9.0 core engine, input model, and gameplay mechanism in browser-accessible JavaScript/TypeScript.

## 2026-08-14 mask-to-mask block swaps

- Recovered `_doBlockSwapNew` at `0x6aee90` and public `_doBlockSwap4`/
  `_doBlockSwap5` wrappers at `0x6af6cc`/`0x6af564`.
- Ported ordered destination-mask expansion, automatic poison-source inclusion,
  poison-bit aliasing, per-eligible-cell saved RNG, and final locked-cell
  rejection. Locked cells participate in selection before rejecting mutation.
- Ported both correction branches: combined-seed coordinate shuffle plus cyclic
  destination assignment below the three-per-destination threshold, and the
  random-start donor-balancing loop above it.
- Added deterministic fallback, balancing, poison-default, typed-mask, lock,
  effect-flag, engine, and browser fixtures. The exact inspector now checks 49
  recovered gameplay anchors.
- Verification passed: gameplay rules, production build, exact APK/restored
  symbol checks, exhaustive browser mechanics, generic tap-turn/text-state
  loop, clean console, and canvas/full-page screenshot inspection.
- Next high-value swap gaps: `_doBlockSwapV`, `_doBlockSwapH`, and passive
  `sBLOCKFLAG` construction/resistance behavior; then data-driven initial-board
  and skyfall constraints.

## 2026-08-14 bit-replacement executor

- Recovered `_doBitReplace` at `0x6adf2c` and `_doBlockSwapMain` at `0x6ae028`.
  The shared `int&` is an effect-category bitset (ordinary/Bomb 1, poison 2,
  jammer 4), not a changed-cell counter.
- Ported row-mask traversal, locked-cell rejection, fixed destinations, and the
  negative-destination path that consumes one saved LCG step per unlocked cell
  and chooses among natural types 0..5. Natural types retain enhancement;
  special types clear enhancement and flags `0x28000` while preserving burst.
- The browser API intentionally implements the null-`sBLOCKFLAG` gameplay path.
  Non-null passive-skill resistance is deferred until its flag construction and
  wrapper calls are recovered, rather than guessed.
- Added pure, engine, RNG, lock, flag-preservation, and browser fixtures and
  expanded the exact restored-binary inspector to 46 gameplay anchors.
- Verification passed: pure rules, production build, exact binary anchors,
  exhaustive browser mechanics, generic tap-turn/text-state progression,
  console checks, and screenshot inspection. The generic client also exposed a
  remaining Google Fonts `@import`; it was removed in separate commit `21e5690`
  with local condensed-font fallbacks so offline runs are clean.
- Next: recover public `_doBlockSwap4`/`_doBlockSwap5` wrapper contracts and
  the non-null `sBLOCKFLAG` passive-resistance path.

## 2026-08-14 native board-mask queries

- Recovered `_countBlockBits` at `0x651fa4` and completed the already anchored
  `_countNonPoisonBlocks` contract at `0x61c250` as prerequisites for the native
  block-swap/replacement family.
- Ported the native mortal-poison alias: type 8 responds to both its own bit 8
  and ordinary poison bit 7. The non-poison query excludes types 7/8, optionally
  excludes Heart, and deliberately ignores lock/enhancement state.
- Added pure, engine, locked-cell, and browser fixtures and expanded the exact
  restored-binary inspector to 44 gameplay anchors.
- Verification passed: gameplay rules, production build, exact inspector,
  exhaustive browser suite, generic tap-turn/text-state loop, console checks,
  and both canvas/full-page screenshot inspection.
- Next: recover `_doBitReplace`/`_doBlockSwapMain` mutation flags and then the
  public `_doBlockSwap4`/`_doBlockSwap5` mask wrappers without flattening their
  special-orb passive interactions into ordinary conversions.

## 2026-08-14 masked block-change fidelity

- Recovered `_doPoisonBlockN2` at `0x61c344`, including both candidate modes:
  source-type exclusion without a row bitmap, and bitmap exclusion that replaces
  the source mask when a caller supplies `uint16_t selectedRows[]`.
- Ported dry-run counting, unconditional two-step applying RNG use, ascending
  destination-mask traversal, per-destination limits, row-bit writes, and the
  native attempted-write return value. Locked cells consume an attempt without
  changing; special destinations clear enhancement power while natural ones
  retain it and independent block flags survive.
- Expanded the exact restored-binary inspector to 43 gameplay anchors and added
  pure, stateful-engine, typed-bitmap, locked-cell, enhancement, and browser
  fixtures for the generalized conversion path.
- Verification passed: pure gameplay rules, production build, exact protected
  APK/restored-image hashes and anchors, exhaustive browser mechanics, console
  checks, generic start/tap-turn/text-state progression, and canvas/full-page
  screenshot inspection.
- Next high-value board gaps: the bit-mask block-swap family and data-driven
  skyfall/opening-board constraints. Keep private `data048.bin`/`data030.bin`
  account/server inputs outside claims of APK-only fidelity.

## 2026-08-14 whole-color poison fidelity

- Recovered `_doPoisonBlocks` at `0x626e78` and the ordered dungeon face-color
  list built by `_setupDungeons` at `0x65ac0c` (`sGAMEWORK+0x911d8/+0x911da`).
- Added explicit dungeon face types, saved-RNG restoration, the exact two-step
  combined-seed group shuffle, live-count/heart filtering, whole-color poison
  and mortal-poison conversion, and locked-cell immunity.
- Expanded the restored-binary inspector to 42 exact gameplay anchors.
- Removed an unused remote IBM Plex stylesheet so the offline generic game
  client no longer reports a resource error; the UI uses its existing
  Noto/Barlow stacks and is visually unchanged.
- Verification passed: pure gameplay rules, production build, exact inspector,
  generic Playwright tap-turn/text-state loop, exhaustive project browser suite,
  console checks, and both canvas/full-page screenshot inspection.
- Next high-value board gaps: `_doPoisonBlockN2`, the bit-mask block-swap family,
  and data-driven skyfall/opening-board constraints. Keep the private
  `data048.bin`/`data030.bin` account-server boundary explicit.

## 2026-08-14 gameplay fidelity checkpoint

- Added a reproducible `libpad:inspect` command that validates the exact
  protected `libpad.so` hash, distinguishes it from the restored image, and
  verifies 36 recovered input, board, orb-state, match, hazard, combat,
  targeting, and recovery routine addresses and sizes.
- Ported the exact `izRndLcGet` primitive and `_getRandomBlock` selection:
  two persisted global LCG advances, high-half temporary seed construction,
  forward Fisher-Yates candidate ordering, type exclusion, and jammer/heart
  eligibility. The data-driven initial-board and skyfall tables remain on the
  native binary path rather than being mislabeled as a uniform exact port.
- Matched native movement edge cases: fractional coalesced-pointer crossings,
  special diagonal adjacency and combo scaling, primary-pointer ownership,
  zero-distance turn use, and an elapsed-time move deadline that cannot be
  extended by a stalled browser frame.
- Matched more block/hazard state: poison operation order, bomb wait ordering,
  thorn crossings, special-orb lock/enhancement interaction, shared pending-HP
  saturation, and simultaneous recovery/damage application.
- Matched more combat staging: six-card main/tertiary/secondary rounds,
  binary32 multiplier boundaries, card-driven leader scaling, automatic and
  manual retargeting, mass-target cleanup, and per-card damage-cap-before-defense
  ordering.
- Fixed the puzzle canvas HP label so it no longer sits behind the reset hit
  target, and made every browser scenario safe to run together after switching
  between the native 6x5 and 7x6 layouts.
- Verification passed: pure rules, production build, the combined Chromium
  gameplay suite, and the exact-APK ARM64/Wasm smoke test. The latter executed
  151,900,698 guest instructions, reached all six lifecycle exports, rendered
  161 frames / 17,732 draw calls, accepted four native touch callbacks, requested
  the expected absent `data048.bin` and `data030.bin`, and emitted no browser
  errors.

## 2026-08-13 gameplay data and rules fidelity pass

- Decoded the `MCD5` shipped-asset index: 4,328 records spanning resident `DATA001.BIN`, compressed `DATA002.BIN`, WAV `DATA003.BIN`, download-only names, and reserved slots. Added a dependency-free parser, inspector, and exact-APK regression.
- Recovered `cMINIZIP::unzip4mem2` from the restored GOT and implemented PAD's exact `IOSC` stream decoder: XOR reversal, raw DEFLATE, expanded-length validation, and its CRC-16/CCITT integrity check. The exact `mons_001.btex` fixture now expands from 8,741 bytes to a 131,120-byte `TEX1` texture.
- Decoded `TEX2` layout and the 512x512 `block2.btex` atlas, including its 26 sprite rectangles and base-orb records 2–7.
- Regenerated the post-protection `libpad.so` image and anchored the native movement, adjacency, swap, match flood-fill, erase, fall, combo, damage, recovery, and game-phase routines by restored symbol and address.
- Corrected coalesced pointer movement in the JS engine. Normal `libpad` rejects diagonal neighbours, so sparse motion is now expanded into orthogonally adjacent boundary crossings instead of a direct diagonal swap.
- Upgraded that expansion to fractional pointer-segment traversal with board-edge clamping, preserving off-centre crossing order and continuous nearest-edge swaps when the pointer moves slightly outside the board.
- Extracted classic match/combo/attribute constants into a pure rules layer and added connected-group shape metadata for row, column, cross, L, box, and mass attacks.
- Matched native combat rounding boundaries: combo/base attack lanes use `izMathCeiling`, later attack multipliers round positive values with `+0.5`, elemental scaling uses `izMathCeilingSint64`, and recovery truncates with `fcvtzs`.
- Added native block types 6–8 (jammer, poison, mortal poison), their original-atlas sprite mapping, maximum-HP poison scaling, and simultaneous recovery/poison netting before the HP clamp.
- Split native orb state from orb type: enhanced and locked flags survive movement/collapse, locked orbs resist conversion, enhanced matches contribute their per-orb multiplier, and the original atlas status overlays render locally.
- Added an optional local-only APK worker to decode and render the original orb atlas in the playable puzzle harness without committing or uploading proprietary pixels.
- Verification passes: rules tests, data-container tests, ARM64/Wasm integration, production build, custom-art Chromium input regression, and exact-APK-atlas Chromium input regression with zero console errors.
- Detailed evidence and current data boundary: `docs/libpad-21.9-gameplay-engine.md`.

## 2026-08-13 playable native-frame milestone

- Completed the protected PAD module chain and restored enough of the original image to call `JNI_OnLoad` (`JNI_VERSION_1_6`) and the exported Android lifecycle directly from the browser worker.
- Extended the exact AArch64/Wasm interpreter through the scalar floating-point and NEON instruction families encountered by live startup. Consecutive `onDrawFrame` and `onTouchEvent(FFIIIIJI)` callbacks now return without skipped guest instructions.
- Added a guest-resident Android/JNI compatibility layer including critical primitive arrays, AAPCS64 `va_list` decoding, Java strings and paths, deterministic clocks, writable files/cache directories, and a Canvas-backed reproduction of Android `Paint`/`Bitmap.copyPixelsToBuffer` system-font rendering.
- Added a fixed-function GLES 1.x to WebGL renderer with matrices, client arrays, textures, blending/depth state, frame/render buffers, and `glDrawTex*OES`. The exact binary rendered 170 frames / 18,740 draw calls in the final Chromium run with no WebGL or page errors; two browser clicks produced four acknowledged native touch callbacks.
- Confirmed the real APK asset path works: `libpad.so` opens and reads `assets/DATA001.BIN`, creates `files/boot.bin`, and then requests downloaded `files/data048.bin` and `cache/data030.bin`. Those server-delivered datasets are not present in the APK, which is why the authentic offline client remains on its Japanese startup warning.
- `/binary-port` now accepts the APK plus optional `.bin` runtime data. When the unavailable downloaded data is not supplied, it reports the exact boundary and links to the browser-playable TypeScript puzzle reconstruction at `/puzzle`.
- Final verification: `npm run wasm:test`, `npm run build`, and the Playwright exact-APK smoke run all pass.

## 2026-08-13 libpad binary-port runtime

- Chose a hybrid architecture: freestanding C AArch64 interpreter compiled to WebAssembly, with JavaScript handling ELF loading, browser integration, and diagnostics.
- Added `src/binary-port/arm64_core.c` with the initial ARMv8-A decoder: wide immediates, ADR/ADRP, direct/register/conditional branches, add/sub forms and flags, logical/bitfield operations, scaled loads/stores, register pairs, stack handling, and `svc` trapping.
- Added `src/binary-port/elf64.js` and `arm64Runtime.js` to parse AArch64 ELF64 files, map PT_LOAD segments into biased Wasm linear memory, inspect guest strings, trace instructions, and expose syscall snapshots.
- Added `scripts/build-arm64-wasm.sh`, `scripts/test-arm64-core.mjs`, and npm scripts `wasm:build` / `wasm:test`.
- Verified against the exact APK SHA-256 `785ffa641837c528864cfbeb9716e340c9d948ba3a37bca3193b5cd32dda89d8`: mapped both PT_LOAD segments, found the 10,998,120-byte custom protected section, and executed the real function at VA `0x3323c0` (`mov w0,#225; ret`).
- Verified two resident address/stack helpers (3 and 10 guest instructions respectively).
- Executed the real first constructor from VA `0x332cf0` for 967 guest instructions until its first raw Linux syscall. The trap is `openat` (56), and the guest pathname decrypts to `/proc/self/maps`.
- Added `/binary-port` with a local `libpad.so` file picker and canvas diagnostics. Browser verification mapped the full 27,149,688-byte file, reproduced the constructor boundary, and reported zero console errors.
- Build and Wasm tests pass. Visual artifacts are under `output/web-game/binary-port-final/`.

### Binary-port next steps

- Add a virtual file-descriptor table and service `openat`, `read`, `lseek`, `close`, `mmap`, `mprotect`, and `munmap` traps.
- Generate a consistent virtual `/proc/self/maps`, then resume the constructor across successive syscalls.
- Add the remaining ARM64 scalar, floating-point, NEON, atomic, and memory-ordering instructions as they are encountered.
- Map companion `lib__6dba__.so`, `libopenal.so`, and protection asset `assets/6dba/data1.dat` into the virtual filesystem.
- Reach and capture the first decrypted anonymous mmap module, then implement synthetic ELF/libc/JNI imports and intercept `RegisterNatives`.

## 2026-08-13 libpad binary port

- Added a freestanding AArch64 interpreter compiled to WebAssembly and a browser runtime that maps the exact `libpad.so` ELF64 PT_LOAD segments into biased guest virtual memory.
- Verified the exact APK payload by SHA-256 (`785ffa641837c528864cfbeb9716e340c9d948ba3a37bca3193b5cd32dda89d8`) and executed the resident `mov w0, #225; ret` probe from the mapped image.
- Implemented the instruction families encountered by live constructor execution, including arithmetic/logical forms, bitfields, conditional selects, multiply-add, variable shifts, register-offset and scaled loads/stores, pairs, branches, system register reads, and cache/barrier no-ops.
- Added a browser-side virtual Linux layer for `openat`, `read`, `lseek`, `close`, `mmap`, `mprotect`, `munmap`, stat calls, clocks, process IDs, writes, and exits, plus virtual `/proc/self/maps` and `/proc/self/environ`.
- Corrected the ELF execution model to use a nonzero shared-object load bias and apply `R_AARCH64_RELATIVE` relocations. This fixed the unpacked loader's first null-base validation.
- The real protected constructor now executes 4,691,980 AArch64 instructions and 71 syscalls, reads and decrypts the full 11,000,352-byte protected payload, maps its 155,648-byte unpacked module executable, re-enters `/proc`, and reaches the Android dependency namespace scan.
- Added shared-object mapping support so APK/system dependency ELF images can be registered at stable load bases and represented accurately in `/proc/self/maps`. Mapping the real APK `libopenal.so` and provisional system images advances execution to 8,537,583 guest instructions; the next correctness boundary is a malformed dependency metadata pointer caused by using `libopenal.so` as a stand-in for Android system libraries.
- Expanded `npm run wasm:test` into an exact-binary integration check covering the nonzero load bias, helper semantics, first constructor syscall, decrypt/executable-map milestone, proc environment, and Android dependency scan.
- Updated `/binary-port` so loading the extracted `libpad.so` runs the deeper virtual-Linux constructor path and reports its instruction/syscall counts and current missing Android namespace boundary.

## 2026-08-13 libpad protected constructor deep dive

- Replaced provisional dependency images with 11 distinct freestanding AArch64 Android ABI ELFs, a host-backed `dlopen`/`dlsym`/`dladdr` bridge, dynamic relocation linking, system-property service, and a coherent Android 7 virtual process/filesystem.
- Implemented the loader-observed libc surface: environment/time/stdio/directory APIs, formatted printing/scanning, mutexes, deterministic pthread workers, process/socket/stat helpers, logging, and guest syscall wrappers. All symbols requested by the 12 decrypted stages now resolve.
- Added the observed SIMD and arithmetic families (including exact high multiply, MOVI, 2D/4S add, XTN/XTN2, USHLL/USHLL2, AND, SSHL, MUL, MLA, ADDV, and UMOV) with regression probes in `npm run wasm:test`.
- Added one-shot instruction and memory watchpoints plus call/return tracing to the Wasm CPU. These identified protection record `60` as an 80-byte detector event, then traced it to two inconsistent Android surfaces: missing `ro.debuggable=0` and a `getenv("PATH")` result that disagreed with `/proc/self/environ`.
- Corrected the property and environment ABI. The exact helper now executes 169,690,779 original AArch64 instructions, services 1,463 Linux calls plus 984 host ABI calls, reports protection state `1` (success), and terminates its helper lifecycle through `_exit(0)`. There are no unresolved imports or unknown syscalls.
- Added a dependency-free DEX native-method inspector. It inventories 61 `AppDelegate` native methods and their Java callers, including the lifecycle/render surface and exact touch bridge `onTouchEvent(FFIIIIJI)V`.
- Reconstructed the Java input transform from Dalvik bytecode: only pointer slot 0 is sampled; native receives adjusted `(x, y)`, pointer index 0, a reserved zero, pointer count, raw action, event time, and masked action. The Y coordinate is `MotionEvent.getY(0) - (2 * viewScale + statusBarHeight)`.
- Added `padInputModel.js`, a tested browser PointerEvent adapter that reproduces the recovered Android action/index encoding and JNI argument order without translating the gameplay rules into a separate clone engine.
- `/binary-port` now accepts the APK directly, extracts `libpad.so`, `libopenal.so`, `lib__6dba__.so`, and `assets/6dba/data1.dat` locally with a dependency-free ZIP reader, loads packaged generated Android ABI images, and runs the constructor in yielding chunks with visible progress. No proprietary APK payloads are copied into the project.
- Production build and exact Wasm regression suite pass. The complete harness now runs inside a Vite module Web Worker and reports progress without occupying the page's canvas/control thread. In-app browser verification completed the exact APK path at 160,434,835 instructions / 12 executable stages with the probe control still enabled and zero console errors. Uploading the large APK through the isolated automation sandbox is slow; selecting the four extracted runtime files is the faster development path.

### Binary-port next steps (current)

- Reach the protected JNI binder, synthesize `JNIEnv`/`JavaVM` function tables, and capture the hidden native address table for the inventoried `AppDelegate` methods.
- Invoke `onSurfaceCreated`, `onSurfaceChanged`, `onDrawFrame`, and the exact touch bridge from browser input, then trace the native board/state transitions into a deterministic WebGL/canvas presentation.

## 2026-08-13 protected Android load sequence and cooperative threads

- Corrected Linux thread semantics: syscall `exit(93)` now halts only the current native context, while `exit_group(94)` remains process-wide. The Wasm CPU now supports 64 suspended callback contexts with full scalar/vector/register/flag/stack state.
- Replaced eager `pthread_create` execution with queue-only creation and join-driven scheduling. This fixed the protector race in which a detached enforcement worker ran before its creator completed the shared-state protocol. A Wasm regression test now verifies suspend/resume/result/parent restoration.
- With the scheduler corrected, a controlled platform-capability diagnostic makes the exact `libpad.so` constructor return normally after 181,724,313 original AArch64 instructions; its 17th helper remains suspended at the correct guest PC instead of terminating the virtual process.
- Extended the DEX inspector to enumerate native methods and inspect arbitrary class initializers. Recovered the actual Java load order: `EntryApplication.attachBaseContext` loads `lib__6dba__.so`; `AppDelegate.<clinit>` then loads `libopenal.so` followed by `libpad.so`.
- Added `padNativeContract.js` with the exact lifecycle/render/input JNI descriptors, including `onSurfaceCreated(Landroid/content/res/AssetManager;)V`, `onSurfaceChanged(IIIIFFFF)V`, `onDrawFrame()V`, and `onTouchEvent(FFIIIIJI)V`.
- Added an `--entry-wrapper` and `--load-pad-after-entry` mode to the protected-loader inspector. It now reproduces the real Android sequence in one virtual address space: wrapper constructor, OpenAL initializer, and relocated pad constructor.
- Verified both protected constructors return in that exact sequence under the controlled capability diagnostic. The wrapper decrypts from the signed `base.apk`; pad creates its own second 16-worker pool, joins it, and leaves its detached enforcement context suspended. The JNI registration names are not plaintext after construction, confirming registration is deferred/hidden behind the protection binder.

### Binary-port next steps (current)

- Replace the temporary capability-address diagnostic with the correct Android/kernel capability source expected by the decrypted enforcement module.
- Implement minimal `JavaVM`/`JNIEnv` tables and the Android linker lookup for the hidden JNI binder, then capture `RegisterNatives` names, descriptors, and AArch64 addresses.
- Drive the recovered surface/frame/touch entrypoints from the browser worker and connect the guest renderer to WebGL/canvas.

## 2026-08-13 exact browser bootstrap and JNI ABI

- Moved guest pthread stacks below the ELF load base so the 16-worker protection pools can no longer overwrite the mapped `libpad.so` image.
- Widened nested AArch64 callback setup from `x0` only to the complete integer/pointer argument bank `x0`–`x7`. A regression probe now performs a real guest indirect call through JNI table slot 215 and captures `AppDelegate.onDrawFrame()V` at its supplied native address.
- Added a minimal guest-resident `JNIEnv`/`JavaVM` with class/string/reference handling, attach/get-env support, and `RegisterNatives` capture. Constructors do not call it yet, confirming the binding is hidden behind a later protection phase rather than the ordinary ELF constructors.
- Reproduced the exact Android Java load sequence in the browser worker: `lib__6dba__.so`, then `libopenal.so`, then `libpad.so`. The verified APK completes this bootstrap in Chromium in about 22 seconds: 332,646,281 original AArch64 instructions, 3,167 syscalls, and 28 executable mappings, with zero page errors.
- Deep inspection recovered the protector's descriptor-driven module chain. The decrypted chain includes environment/security modules `0x60`, `0x40`, and `0x20`; the `e4` dispatcher reports module `0x20` success, then explicitly invokes module `0x97`.
- Module `0x97` reads a success/configuration flag at its relative address `0x1b1c0`. Leaving it zero synchronously calls `exit_group(134)`; setting it to one allows both protected constructors to return. This controlled bypass does not mutate PAD `.text`, so it is not the original-code restoration step and is not treated as completion.
- The 16 worker threads decode transient protection-module code into anonymous executable mappings; they are not yet game-code workers. The remaining binary boundary is to recover the module that restores the original RX image / real initializer and thereby reaches the hidden JNI binder.
- Added a repeatable Playwright APK-upload smoke test and visually verified the completed browser diagnostic screen. Production build and `npm run wasm:test` pass.
- Corrected virtual mounts so a mounted file always materializes all ancestor directories. This fixed an impossible state in which `libpad.so` existed while `/data/user/0/jp.gungho.pad/lib` returned `ENOENT`; the protector now advances through additional parent/path checks.
- Replaced the single guest-callback parent with an eight-frame callback stack, supporting native callbacks and pthread work launched from inside constructors. The regression suite now verifies an inner callback returns to its callback parent and the outer callback then returns to the root CPU context.
- Removed PAD's brittle fixed anonymous-map addresses from the browser worker. It now identifies PAD's own transient module `0x97` by its decoded AArch64 signature, excludes the wrapper's earlier identical module, and applies the controlled capability value during the inner pthread scheduler. The exact APK browser regression succeeds after the mmap layout changes at 336,596,979 guest instructions and 3,223 syscalls.
- Parsed `PT_DYNAMIC` and confirmed `DT_INIT_ARRAYSZ=416`: Android's linker sees 52 PAD initializer slots. Slots 1–51 still point into zero-filled protected `.text`, so calling them before the original-image restoration correctly faults; this is direct evidence that constructor return alone is not a playable engine.
- Disassembly shows module `0x97` is primarily the special post-dispatch cleanup/anti-debug path. Its main walks and clears transient module records, and the `0x1b1c0` value gates its anti-debug capability checks; it is not itself the missing original-code restorer.

### Binary-port next steps (current)

- Trace the `e4` dispatcher immediately before its indirect module call and capture the complete `0x97` record, including init/main offsets and input pointers.
- Determine why the `0x97` flag is not set naturally, then execute the subsequent original-image restoration and real initializer rather than relying on the return-only bypass.
- Once `RegisterNatives` fires, persist the 61 recovered method addresses and drive surface creation, resize, frame, key, and touch calls from the browser with floating-point argument support.

## 2026-08-13 Orb Battle Lab

- Began a separate `/puzzle` browser route so the existing naval game remains intact.
- Added a deterministic 6×5 puzzle engine with free-path orb dragging, path swapping, match grouping, cascades, elemental damage, heart healing, enemy counters, a no-turn-cost active skill, leader/helper combo multipliers, and 5+ orb mass attacks.
- Added the required `render_game_to_text`, `advanceTime`, reset, and fullscreen integration points for deterministic browser testing.
- Added responsive, touch-safe canvas presentation plus a title-screen entry point; the existing naval game remains unchanged.
- Production build passes. A fixed-board engine check confirmed connected match grouping and repeated skyfall cascades; the resolver remained intentionally mid-cascade after four simulated seconds.
- Playwright desktop flow passed: Tide Shift changed four orbs without consuming a turn; a controlled one-cell drag produced the expected board swap, one combo, 1,660 elemental damage, and enemy counters changing from 2/3 to 1/2.
- Verified the five-second move timer automatically releases and commits an active drag.
- Pure engine scenarios passed heart healing, five-orb mass attacks against both enemies, victory, and defeat.
- Inspected ready, active, resolved desktop, and resolved mobile canvas captures. The mobile canvas fits a 390×844 viewport with no horizontal overflow; both desktop and mobile runs reported zero console errors.
- Corrected Heart rendering to use a filled pink orb with an inset heart glyph so all six orb types have equal visual weight and hit clarity.

### Orb Battle Lab handoff

- Browser route: `/puzzle`; title-screen entry: `PLAY ORB BATTLE LAB`.
- Engine: `src/puzzle/puzzleEngine.js`; canvas/UI: `src/pages/PuzzlePage.jsx`; responsive styles: `src/index.css`.
- Test artifacts: `output/web-game/puzzle-ready`, `output/web-game/puzzle-started`, and `output/web-game/puzzle-e2e`.
- Optional next steps: add dungeon waves and downloaded content schemas, additional active/leader skills, enhanced/locked/hazard orb states, and a formal Vitest suite around the pure engine.

## 2026-07-14

- Audited the in-progress React/Pixi migration and preserved the existing dirty worktree.
- Found that the existing `public/assets/ships` art uses KanColle characters and the alternate set uses Pokemon imagery.
- Generated an original flagship character, Aster Vale, for the port screen and saved it under `public/assets/original/`.
- Current implementation target: KanColle-inspired port command layout, resources, editable six-ship fleets, visual sortie map, phase-style battle results, construction, quests, expeditions, and repair docks.
- Completed the first UI/gameplay implementation and a successful production build.
- First Playwright port capture confirmed the original flagship, resource bar, command menu, and status model render correctly at 1280x720. Tightened short-viewport sizing so the fleet strip remains visible.
- Added a development local-storage API adapter to prevent expected missing-backend 404s from polluting game console logs.
- Verified the production build and game-engine sequence (sortie start -> battle resolution -> continued run -> construction) from a fresh default state.
- Inspected 1280x720 captures for title, port, organization, sortie setup, and active sortie map. Adjusted the title card positioning after catching a Framer transform/CSS centering conflict.
- Confirmed a headless Chromium compositor artifact by rerunning the title capture headed; the real rendered UI and original transparent flagship asset are correct.
- Final same-session browser flow passed: sortie launched at `start -> A`, battle resolved to the battle-record screen, active fleet changed `4 -> 3 -> 4` through remove/add, and the browser reported zero console errors.

### Future enhancements

- Add a full equipment/loadout system and remodel progression using the existing design specification.
- Add original per-ship portraits beyond the new Aster Vale flagship; current roster and combat UI intentionally use neutral naval emblems instead of the repository's copyrighted character art.
- Extend battle presentation into timed air, shelling, torpedo, and optional night-battle phases rather than presenting the resolved combat report immediately.

## 2026-07-14 follow-up

- Reproduced the user's broken map and immediate battle-result transition using Computer in the live Chrome app.
- Replaced aspect-ratio-dependent HTML route segments with an SVG route layer; Computer verification confirms every route now connects node center to node center and travelled routes highlight correctly.
- Added a staged battle playback driven by the resolver log: fleet entrances, phase title changes, attacker motion, tracer projectiles, hit shake, damage numbers, miss callouts, progressive combat feed, skip control, and delayed result/actions.
- Added a Ship Library tab with owned-ship filtering, portrait grid, detail view, levels, HP, combat stats, and morale.
- Generated and integrated a unique original portrait for all ten master ships under `public/assets/ship-sprites/`; organization, port, battle, repair, construction, and collection now consume ship-specific art.
- Verified the repaired map, Ship Library, animation intro, and completed battle result through Computer in Chrome.
- Automated follow-up verification also passed: all five route segments matched their node coordinates, the battle advanced from live animation to result, all owned ships used unique sprite paths, and the browser console remained clean.

## 2026-07-14 sortie and special-gacha repair

- Fixed the non-functional World 2 tab by connecting world filters to the existing 2-1 map and synchronizing the selected operation with the launch panel.
- Made sortie launch readiness explicit: a missing, heavily damaged, or repairing fleet member now disables launch and displays the exact repair/organization requirement instead of appearing unresponsive.
- Restored the original Special Gacha loop as a first-class sidebar view: one/ten ticket draws, rare ship and fuel consolation rewards, grand gifts, earned exchange tokens, and guaranteed gift exchanges.
- Restored the one-time `ILOVEYOU` secret transmission for 50 special tickets, including persisted redemption state and duplicate-redemption protection.
- Playwright verification passed from fresh state: selected World 2, launched 2-1 at `start`, redeemed 50 tickets, completed a special pull (55 -> 54 tickets), received an exchange token, and observed zero browser errors.
- Visually inspected the World 2 selection and fully animated Special Gacha result captures; final production build passed.

## 2026-07-14 Home Port sprite cleanup

- Traced the dark rectangle and faint lines to the combination of background-bearing portrait art, `mix-blend-mode: multiply`, a rectangular image outline, and a horizontal mask.
- Generated clean chroma-key edits for the four starter flagships, removed the key with soft-matte despill and edge contraction, and saved transparent port-specific cutouts under `public/assets/port-sprites/`.
- Added a cleaned transparent Aster Vale cutout under `public/assets/original/aster-vale-clean.png` for the battleship flagship case.
- Removed multiply compositing and the rectangular outline; port-specific cutouts now render normally with a restrained drop shadow, while unconverted acquired ships retain a softened fallback treatment.
- Playwright visual verification at 1280×720 confirms Vesper is cleanly composited over the harbor with no rectangular background or fringe, zero console errors, and a passing production build.

## 2026-07-14 expanded roster and campaign

- Restored the full 49-vessel roster from the earlier draft, adapted every ship to the current stat and rarity model, and generated 39 new original class-specific portraits so all 49 ships have distinct art.
- Expanded sortie progression to six named worlds with four operations each (24 maps total), escalating enemies, rewards, branching routes, and boss nodes.
- Repositioned the Home Port flagship plaque above the 1st Fleet strip so the flagship name and status remain fully visible at 1280×720.
- Production build and data integrity checks pass: 49 unique ship IDs, 49 unique sprite files, 24 maps, and exactly four maps in each world.
- Full Playwright flow passed with no console errors or failed requests: World 6 selection, 6-4 launch and retreat, construction, acquired-ship library rendering, 1-1 launch, map advance, and battle animation.
- Computer Use verification in Chrome confirmed the Home Port layout, 6-1 through 6-4 selection, functional Begin Sortie 6-4, navigable map nodes, visible live battle animation, and the 4-of-49 owned ship library.

## 2026-07-14 Home Port and profile controls

- Rebuilt the Home Port composition with the flagship art anchored on the right and the six active fleet slots arranged as a compact two-column by three-row panel on the left.
- Reflowed the six command buttons into a three-column grid and moved the speech panel below them so the controls, dialogue, fleet panel, and flagship no longer overlap at 1280×720.
- Changed the top-left product mark to GACHA and grouped the resource bar plus profile controls into a right-aligned header utility area.
- Replaced the hard-coded ADM. ERIC label with a persisted commander name and an accessible profile editor supporting up to 24 characters.
- Added visible Supply reports for already-full fleets, successful resource deductions, and insufficient-resource states.
- Browser verification passed: 2×3 fleet grid, right-side flagship, non-overlapping dialogue, exact 5-fuel/7-ammo replenishment, persisted Captain Nova username, and zero console errors.

## 2026-07-14 resource header reflow

- Rebuilt the header resource bar so Fuel, Ammo, Steel, and Bauxite form a true two-column by two-row material grid.
- Gave Buckets and Orders separate full-height cells with dedicated icon, label, and value rows.
- Chromium overflow verification at 1280×720 confirmed all six cells are unclipped: material cells are 279px wide, special-resource cells are 96px wide, and the browser reported zero console errors.

## 2026-07-14 Home Port column composition

- Rebuilt Home Port as two explicit columns: a left command-and-fleet dashboard and a right flagship showcase.
- Grouped the six operational buttons and 1st Fleet preview under one parent with perfectly aligned widths.
- Enlarged the 1st Fleet preview to 2.52 times the command-group height, including larger ship portraits, names, health bars, and empty berths.
- Isolated the flagship sprite inside a solid RGB(49, 95, 105) panel with its own heading, dialogue, and nameplate.
- Chromium geometry and visual verification confirmed the art is fully contained, the showcase has no background image, the columns do not overlap, and the browser reported zero console errors.

## 2026-07-14 flagship inner backdrop

- Added a dedicated inset frame around the Home Port flagship sprite.
- Matched the inset to the Home Port base harbor blue (#4f8792), while retaining the darker outer showcase for clear visual separation.
- Added a restrained inner outline and layered inset shadow; Chromium verification confirmed the sprite remains fully contained and the portrait well renders cleanly at 1280×720.

## 2026-07-14 flagship backdrop color correction

- Corrected the inset interpretation: it now uses the Home Port banner's exact beige gradient (#f4f1e8 to #dcd8ce), not the harbor blue.
- Retained the teal only on the outer flagship showcase, producing a clear framed-paper treatment around the transparent sprite.
- Visually verified the corrected beige backdrop in Chromium at 1280×720.

## 2026-07-17 mobile UI

- Replaced the fixed 900px desktop canvas behavior with a dedicated breakpoint for screens up to 700px.
- Added a two-row mobile header: compact brand/profile controls above a readable 2×2 material grid and dedicated Buckets/Orders cells.
- Replaced the desktop sidebar with a fixed, horizontally scrollable bottom navigation rail using 72px touch targets.
- Reflowed Home Port into a stacked flagship showcase followed by compact 3×2 commands and a scaled 2×3 fleet preview.
- Added mobile layouts for Organization, Sortie, Ship Library, construction, special gacha, repair, quests, expeditions, combat, settings, and the title screen.
- Added automatic content scroll reset on tab changes; the mobile library now opens on its ship grid before the detail card.
- Chromium E2E at 390×844 passed across Home Port, Sortie, Organization, Ship Library, and title: document/content width remained exactly 390px and zero console errors were recorded.
