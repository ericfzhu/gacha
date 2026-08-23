Original prompt: I'd like you to go through this project, and make it as close in gameplay and UI to the game "Kantai Collection" as possible, though with custom battleship sprites

Current request: Reconstruct the inspected Puzzle & Dragons 21.9.0 core engine, input model, and gameplay mechanism in browser-accessible JavaScript/TypeScript.

## 2026-08-23 presentation-backed inactivity skill

- Recovered type `70` at dispatch/setup/condition `0x6299fc`, `0x621790`, and
  `0x61b558`. It is a no-gameplay inactivity action, but unlike types 16/66 it
  stages definition `+0x10/+0x14/+0x18` through runtime `+0x678..+0x680` and
  drives a transient per-enemy presentation controller.
- Preserved the distinct type and three presentation integers through
  definition/runtime decoding, normalization, new-AI admission, execution,
  snapshots, and browser messaging. A 100% immediate record consumes only the
  standard probability draw: seed 21900 ends at `394448415` with HP unchanged.
- Pure, exact-table, focused browser, generic browser-client, and production
  build checks pass without page errors. Next: recover type `71` after this
  separate checkpoint.

## 2026-08-23 enemy death-cry phase

- Recovered type `69` as a death-only record. Its ordinary dispatch/setup/
  condition entries are `0x62be50`, `0x621c94`, and `0x61bb1c`, making it
  ineligible during normal enemy turns.
- Traced `_setupDeadmanEffect` at `0x62d4d8`: it scans the monster's 64 native
  slots on death, copies definition `+0x10..+0x2c` and the skill id into the
  dedicated death record, and hands presentation to `_gamePhaseEnemyDead` at
  `0x64b9e4` without advancing gameplay RNG.
- Ported type-69 definition/runtime normalization, slot-ordered one-shot death
  discovery, the timed `death` phase, post-death continuation/victory, revival
  rearming, snapshots, and visible death messaging. Pure, exact-table, focused
  browser, generic browser-client, and production-build checks pass with no
  page errors; the focused render shows Verdant Shell's death effect before
  Umbra Eye's turn can continue.
- Next: keep type `95`'s actionable on-death skill-set as a separate
  death-scheduler checkpoint.

## 2026-08-23 enemy skyfall-rate skill

- Recovered type `68`: dispatch `0x629984`, setup `0x6200a4`, and condition
  `0x61af40`. Definition `+0x10` is a nine-bit orb mask, `+0x14..+0x18` is the
  one-draw inclusive duration, and `+0x1c` is the skyfall chance percentage.
- Preserved the native split between replaceable natural `0x03f` and hazard
  `0x1c0` status categories. Identical active masks reject without RNG;
  different requested masks remain eligible for replacement.
- Ported baseline-plus-status drop-rate composition, independent countdowns,
  weighted spawn integration, snapshots, and a visible `SKY` status. Seeded
  direct/scheduled, runtime, replacement, expiry, exact-table, and focused
  browser fixtures pass; mask `0x81` yields fire/poison 25% for four turns and
  scheduled RNG `3803934822`.
- Production build plus generic and full browser regressions pass.
- Next: continue type 69 after this separate checkpoint.

## 2026-08-23 combo-absorb enemy skill

- Recovered type `67`: dispatch `0x629968`, setup `0x61ffe8`, and condition
  `0x61ab6c`. One setup LCG draw materializes inclusive duration
  `+0x10..+0x14`; authored combo threshold `+0x18` is copied separately.
- Ported protected duration/threshold status, AI rejection while active,
  enemy-turn countdown, snapshots/UI status, and combat absorption for turns
  at or below the combo threshold. Higher combos deal damage normally and nail
  damage remains independent.
- Seeded direct/scheduled, runtime, rejection, three-versus-four-combo damage,
  exact native-table, and focused browser fixtures pass. The browser shows
  `ABS ≤3C 4T` with final scheduled RNG `3803934822`.
- Production build plus generic and full browser regressions pass.
- Next: continue type 68 after this separate checkpoint.

## 2026-08-23 unconditional inactivity enemy skill

- Recovered type `66`: late dispatch `0x62be50`, no-parameter setup `0x6217c0`,
  and unconditional condition `0x61a630`. Unlike type 16's water-gated route,
  type 66 admits any acting-monster attribute and ends the action with no
  special effect.
- Preserved raw type identity through definition/runtime decoding and
  normalization. A selected immediate record consumes only its ordinary
  probability draw; seed 21900 ends at `394448415` with unchanged player HP.
- Pure direct/scheduled fixtures, exact native-table checks, and paired
  type-16/type-66 focused browser coverage are in place.
- Production build plus generic and full browser regressions pass.
- Next: continue with type 67's distinct live action after this checkpoint.

## 2026-08-23 player-damage presentation

- Corrected enemy attacks' floating-text target: damage to the player is now
  tagged `playerDamage`, retains `sourceEnemy`, and renders at the HP bar rather
  than over the attacking enemy. This covers ordinary attacks and authored
  enemy skills with generic or specialized damage composition.
- Added pure metadata and focused browser assertions; the type-65 screenshot
  now shows `-925` beside the reduced HP bar instead of over Verdant Shell.
- Production build plus generic and full browser regressions pass.
- Next: continue native action recovery after this focused UI checkpoint.

## 2026-08-23 random-sub bind enemy skill

- Recovered type `65`: shared late bind dispatch `0x628fe0`, setup `0x621108`,
  and condition `0x61b6f0`. Definition `+0x10` supplies the count and
  `+0x14..+0x18` the inclusive duration range; selector 4 restricts the native
  two-draw/private-state shuffle to party slots 1–4.
- Preserved the otherwise surprising duration behavior: setup stores one roll
  at runtime `+0x678`, but execution rerolls the authored range before
  `_doBind`. Scheduled seed 21900 therefore selects mask `0x12`, materializes
  2 turns, executes 3 turns, and ends on global RNG state `1848838291`.
- Pure definition/runtime, direct, scheduled-AI, generic-attack composition,
  no-candidate rejection, exact native-table checks, and focused browser
  coverage pass. The browser reproduces slots 1/4 bound for 3 turns, 925
  accompanying damage, HP 11075, and final RNG `1848838291`.
- Next: run the full matrix and commit this as a separate checkpoint, then
  continue adjacent live actions and the recorded player-damage placement fix.

## 2026-08-23 bind-plus-attack enemy skill

- Recovered type `63`: early dispatch `0x628b94`, setup `0x621544`, and
  condition `0x61a87c`. Definition `+0x1c/+0x20` selects party targets through
  `_doSelectBindTarges`; `+0x14..+0x18` supplies the inclusive duration range.
- Preserved selector modes for leader, helper, leaders, subs, and whole party;
  random modes use the native two-global-step/private-state shuffle before the
  duration's separate LCG step. The condition only checks for at least one
  bindable matching card and consumes no RNG.
- Ported definition/runtime records, materialization ordering, bind resistance
  and timers, generic `+0x44` attack composition, AI dry rejection, exact table
  checks, seeded direct/enemy-turn fixtures, and a focused browser fixture that
  reproduces mask `0x12`, duration 2, 925 damage, and final RNG `919597584`.
- Next: continue the adjacent live enemy-action table. The focused screenshot
  also exposes a separate presentation issue: player damage currently floats
  over an enemy instead of the player HP area.

## 2026-08-23 alternate whole-board blind enemy skill

- Recovered type `62` as a second classic whole-board blind: early dispatch
  `0x6289b8`, presentation setup `0x620154`, and condition `0x61ae4c`. The
  handler inlines the same bit `0x4/0x8` board mutation as type 5.
- Preserved its scheduler distinction: type 62 returns exactly 1.0 while any
  cell is visible, whereas type 5 returns the proportional visible-cell
  fraction. A seeded half-blind boundary test proves type 5 misses where type
  62 selects without inventing condition RNG.
- Ported raw identity through definition/runtime decoding, normalization, AI
  admission, shared execution, exact table inspection, and focused browser
  coverage that reveals two cells with input and re-blinds them via type 62.
- Next: continue the adjacent live board-action table.

## 2026-08-23 whole-board blind enemy skill

- Recovered live enemy skill type `5`: early dispatch `0x6286b4`, generic
  setup `0x6217c0`, and condition `0x61b31c`. Execution reaches
  `_doBlock2Black` (`0x625994`); the condition inlines `_countBlackBlocks`
  (`0x618058`) and returns the binary32 visible-board fraction without RNG.
- Preserved native classic-blind bit `0x4` and new-cover bit `0x8` separately
  from black-fall blind `0x1000/0x10000`. `_swapBlockMain` reveals both cells
  used by each swap, so the held orb and crossed path uncover as the pointer
  moves. Special jammer/poison/bomb cells also lose incompatible `0x28000`,
  enhancement, and nail state as in the native helper.
- Ported definition/runtime decoding, normalization, AI probability scaling,
  direct and scheduled execution, generic `+0x44` attack composition, state
  snapshots, rendering, native-address checks, and pure/browser fixtures.
- Next: continue the remaining early live enemy-action table.

## 2026-08-23 attribute-gated inactivity enemy skill

- Recovered live enemy skill type `16` as an inactivity/skip-turn record:
  dispatch `0x62be50` is the common no-effect tail, setup `0x6217c0` copies no
  parameters, and AI condition `0x61acbc` returns 1.0 for a water-attribute
  acting monster or `1.0 - incomingScale` otherwise. Both recovered new-AI
  call sites supply incoming scale 1.0, so non-water records are rejected.
- Cross-checked the semantic name against the independent DadGuide raw-data
  parser, where type 16 is `ESInactivity16` and type 15 is separately
  `ESAttackMultihit`. The selected inactivity record consumes the enemy action
  without falling back to an ordinary attack; the universal definition
  `+0x44` accompanying hit remains independently composable.
- Ported definition/runtime records, normalization, water-only new-AI
  admission, no-condition-RNG behavior, action snapshots, no-damage turn
  execution, exact table checks, and pure/focused-browser fixtures. The browser
  renders the water enemy and explicit “does nothing” action with unchanged HP.
- Next: continue the remaining early live action table from the already
  separated type `17`–`20` family.

## 2026-08-23 repeat-attack enemy skill

- Recovered live enemy skill type `15`: dispatch `0x62be50`, setup
  `0x6214a8`, and condition `0x61b49c`. Setup spends one shared LCG advance
  selecting an inclusive hit count from definition `+0x10..+0x14`, caps it at
  15, zeroes the completed-hit bitset, and copies per-hit damage percentage
  `+0x18` into runtime `sMONSTER+0x680`.
- Recovered `_doRepeatAttack` (`0x625a64`) and `_setEnemyAttack` (`0x625bcc`).
  The native animation path visits each unmarked hit index, sends its percentage
  separately through `_setEnemyAttack`, and records completion in
  `sMONSTER+0x67c`; it does not combine the authored percentage before native
  attack rounding.
- Ported definition/runtime decoding, exact one-draw materialization, the
  15-hit cap, individual hit damage snapshots, attack-boost interaction, and
  composition with the generic definition `+0x44` accompanying attack. Pure,
  exact-table, production-build, and focused browser fixtures pass; the seeded
  browser fixture reproduces three 740-damage hits plus a 925-damage
  accompanying attack for 3,145 total damage.
- Next: resolve type `16`'s scheduler role before assigning semantics to its
  no-effect dispatch and water-attribute condition callback.

## 2026-08-23 random party bind and active-skill seal

- Recovered early live enemy skill type `13` as a separate random-party bind:
  dispatch `0x629430`, setup `0x61fee4`, and count gate `0x61ac50`. Definition
  `+0x10` is the requested number of currently unbound cards. Execution uses
  two shared LCG advances, a private-state Fisher-Yates shuffle, and the native
  hardcoded six-turn per-card bind operand.
- Recovered type `14` as global active-skill seal: dispatch `0x629524` into
  `_doVoidActSkill` (`0x616924`), one-LCG inclusive-duration setup `0x621300`,
  and signed low-ten-bit `<= 63` condition `0x61aca4`. Resistance is 20% per
  awakening plus badge resistance and consumes RNG only when positive.
- Ported type-13/14 definition/runtime records, normalizers, new-AI gates,
  exact target shuffle and resistance ordering, protected ten-bit seal
  extension/wrap, `_doOnPostEnemyAttack` decrement/skip behavior, skill-input
  blocking, snapshots, and sealed-button rendering.
- Exact restored-table inspection, pure/data rules, production build, focused
  browser state, generic gameplay client, screenshot inspection, and the full
  browser regression matrix pass without console errors.
- Next: resolve the neighboring type `15/16` records without assuming the
  shared no-effect dispatch means they are user-visible actions.

## 2026-08-23 enemy defense and attribute-nullification shields

- Recovered early live enemy skill type `9` as a timed additive defense boost:
  dispatch `0x629360`, setup `0x6212ac`, and unconditional-scale condition
  `0x61bb98`. Definition `+0x10` is duration; one LCG step selects an inclusive
  `+0x14..+0x18` percentage. Execution stores signed-int16 turns at
  `sMONSTER+0x810` and `round(float32(int64(baseDefense*percent))/100)` at
  protected additive-defense lane `+0x800`.
- Recovered types `10` and `11` as one- and two-attribute damage-nullification
  shields. Their dispatch/setup pairs are `0x6293b8/0x61fee4` and
  `0x6293c8/0x6217a8`; both use condition `0x61bb98`. They build a uint16 mask
  at `sMONSTER+0x820`, store signed-int16 duration at `+0x830`, and make matching
  natural-attribute hits exactly zero in `_calcFinalDamage`.
- Ported definition/runtime decoders, normalizers, type-9 range materialization,
  new-AI admission and RNG behavior, independent status lifetimes, effective
  defense, target projection, zero-damage combat, snapshots, exact table checks,
  and pure/browser fixtures. Attribute nullification remains deliberately
  separate from type-53 attribute absorb.
- Next: continue the adjacent early live action table from type `13` without
  inferring semantics from names alone.

## 2026-08-23 enemy heal and additional attack

- Recovered paired enemy skill types `7` and `8`, which share setup handler
  `0x61ff5c`: one global LCG advance selects an inclusive signed percentage
  between definition `+0x10/+0x14` and stores it at `sMONSTER+0x678`.
- Type `7` dispatches to `0x629098`, heals the acting enemy by a binary64,
  signed-int64-rounded percentage of max HP, and uses condition `0x61b418`.
  That condition admits only when signed player current HP is at least the low
  32 bits of enemy base attack; it does not check whether the enemy is damaged.
- Type `8` dispatches to `0x629304`, adds
  `round(float32(int64 attack*percent)/100)` to the pending hit, and uses
  condition `0x61b450`. Its exact probability scale is binary32
  `clip(playerHp/enemyAttack, 0, 2)`.
- Ported shared range materialization, definition/runtime records, AI gates and
  probability scaling, enemy healing, additive attack composition, native
  rounding, address/symbol anchors, and pure/browser fixtures. The seeded
  browser case selects 29% healing and 138% added attack, yielding exact HP and
  3,478-damage results.
- Next: continue early live types `9` through `11` and preserve their shared
  condition/setup paths only after their execution fields are resolved.

## 2026-08-23 player-buff dispel enemy skill

- Identified live enemy skill type `6`: dispatch `0x6292e8`, no-parameter setup
  `0x6217c0`, and condition `0x61b404`. The exact symbol path is
  `_doItetukuHadou` (`0x618d04`) followed by `_applyLeaderSkill(false)`
  (`0x63a7e8`).
- Recovered the non-boolean AI scale: `_getCountClearParams` (`0x618320`)
  returns the number of clearable effects as a float32 probability multiplier.
  The two already modeled positive player lanes at `sGAMEWORK+0x86bd4` and
  `+0x86c3c` are skipped while acting-monster status shield `+0x870` is active.
- Ported definition/runtime decoding, new-AI selection, direct and enemy-turn
  execution, both modeled status clears, snapshots, exact address inspection,
  and probability-boundary pure/browser fixtures. The condition consumes no
  RNG; a seeded test proves one buff can fail where two buffs select.
- Next: continue the remaining live early enemy-action table, extending the
  set of clearable player status lanes only as their native semantics are
  independently recovered.

## 2026-08-23 protected-startup speed and touched-frame fidelity

- Versioned the browser's public ARM64-core URL and fetch it with `no-store` so
  an older cached Wasm decoder cannot complete the protected startup and then
  reproduce the fixed `NEG.2S` frame-callback fault. The page and worker now use
  the same decoder URL rather than the worker bypassing the default version.
- Profiled the exact APK bootstrap at 151,900,682 guest instructions. The
  protection wrapper accounts for 151,793,049 of those instructions, while
  `libpad.so` itself accounts for only 107,633, so startup cost is dominated by
  instruction dispatch through the protected wrapper rather than rendering.
- Added a narrow integer fast-dispatch path for the wrapper's common move-wide,
  address-generation, branch, add/sub-immediate, integer load/store, and
  load/store-pair families. Diagnostic provenance recording is disabled only
  during the verified wrapper phase and restored before `libpad.so` startup.
  Local full-browser time fell from about 78.7 seconds to roughly 68-70 seconds
  without changing the exact 151,900,682-instruction execution boundary.
- Rejected a file-only restored-ELF cache after proving that the protected
  constructor retains pointers into anonymous process mappings such as
  `0x09058000`. A faithful shortcut requires a complete virtual-process
  checkpoint or direct protection transform; no stale-pointer cache is shipped.
- Extended the decoder for real frame/input instructions exposed after the
  original `NEG.2S` repair: `USHL.2S`, conditional `CCMP/CCMN`, `LDPSW` pair
  loads, and scalar `ADDP D,V.2D`. Every observed fault opcode is covered by an
  exact Wasm regression fixture.
- The full Chromium run now renders the authentic Japanese age/purchase notice
  (93.1% non-black pixels in the game region), continues through two scripted
  touches, 164 frames, and 18,068 GLES draw calls without a guest callback or
  console error. After input the client reaches its black offline/data boundary
  because private `data048.bin` / `data030.bin` state is absent.
- Browser smoke testing now captures and measures the pre-input native frame,
  so a black-canvas regression cannot pass merely because the lifecycle reports
  `native game running`.

## 2026-08-23 native frame NEG.2S decoder repair

- Reproduced the post-startup browser failure reported as CPU status `-1` at
  guest PC `0x2c3c90c`; the exact rejected instruction `0x2ea0b842` decodes as
  `neg v2.2s, v2.2s` inside `onDrawFrame`.
- Generalized the existing NEON signed-word negation decoder from the 128-bit
  `4S` form to both architectural `2S/4S` forms. The 64-bit form now clears the
  inactive upper half of the destination vector, and the exact fault opcode is
  covered by the Wasm regression suite.
- Full Chromium APK regression passed through 150 native frames, 16,500 GLES
  draw calls, four touch callbacks, and the expected private `data048.bin` /
  `data030.bin` requests with no page or console errors. The rendered native
  client remains on its authentic Japanese age/purchase warning when private
  account/cache state is absent.
- The protected first load still interprets roughly 152 million guest
  instructions and can take over a minute depending on the host. A future
  performance pass should add a local post-restoration checkpoint/cache without
  checking proprietary restored bytes into the repository.

## 2026-08-14 source-to-jammer conversion

- Identified enemy skill type `12`: dispatch `0x6293f8`, setup `0x61ff08`,
  condition `0x61a63c`. Definition source type `+0x10` materializes at
  `sMONSTER+0x678`; execution converts it to fixed jammer type 6.
- Ported definition/runtime decoding, capped live-source `count / 3` AI scale,
  dry-board rejection without RNG, shared lock-aware block conversion, direct
  and scheduled execution, exact inspection, and pure/browser fixtures.
- Next: continue the remaining live early enemy-action table.

## 2026-08-14 source-orb conversion

- Identified live enemy skill type `4` as the general source-to-destination orb
  conversion: dispatch `0x6292b4`, setup `0x61fee4`, condition `0x61b2d8`.
  Definition `+0x10/+0x14` becomes runtime `sMONSTER+0x678/+0x67c`.
- Traced the condition through `_checkNewBlockSwap` (`0x617cdc`): fixed modes
  scale probability by live source count divided by three; negative authored
  source/destination values select binary availability checks and defer random
  color resolution to execution.
- Ported fixed conversion plus native random source selection from present
  natural colors and random non-heart destination selection excluding source.
  Each random shuffle preserves its exact two global LCG advances; locked cells
  and poison-family source matching remain delegated to the shared block swap.
- Added definition/runtime decoders, new-AI admission, scheduled/direct action
  execution, pure and browser fixtures, exact address inspection, and helper
  anchors. Next: inspect the next live early enemy action.

## 2026-08-14 conditional enemy attack boosts

- Split enemy skill types `18` and `19` from the shared type-17 execution
  handler `0x629064`, retaining their distinct setup and condition callbacks.
  Type `18` uses setup `0x61fee4`, condition `0x61ad7c`, and definition
  `+0x10/+0x14` for duration/percentage. Type `19` uses setup `0x61ffdc`,
  condition `0x61ade8`, and `+0x10/+0x14/+0x18` for threshold/duration/percent.
- Ported type `18`'s exact “boost inactive and any of three native status lanes
  active” predicate. The raw lanes remain conservatively named because only
  `sGAMEWORK+0x86c3c` is proven to be the player's attack-boost duration;
  `monsterEndOfAttack` clears the per-monster `+0x07` lane after its action.
- Traced type `19`'s unsigned-16 `sMONSTER+0x7d0` counter through
  `_calcFinalDamage`: it increments once per player turn with positive
  calculated damage, while `+0x7b8` suppresses later hits until `_initTurn`.
  Ported the counter, threshold test, 16-bit wrap, snapshots, definition/runtime
  decoders, and browser/pure-rule fixtures without adding condition-owned RNG.
- Exact binary inspection now verifies both variants' dispatch, setup, and
  condition table targets plus the damage/status lifecycle symbol anchors.
- Next: continue the enemy-skill table beyond the completed live types while
  preserving the raw state-lane boundary for semantics not yet proven.

## 2026-08-14 lone-enemy attack boost

- Identified enemy skill type `17` as the lone-enemy attack boost: shared late
  handler `0x629064`, setup `0x61ffdc`, and condition `0x61acdc`.
  Definition `+0x14/+0x18` materializes duration and attack percentage at
  runtime `sMONSTER+0x678/+0x67c` without setup RNG.
- Execution stores duration in protected signed-int16 `sMONSTER+0x860` and
  binary32 `percent / 100` at `+0x850`. `_setEnemyAttackMain` multiplies the
  active value into ordinary, accompanying, and standalone scaled attacks.
- Ported the exact “boost inactive and exactly one living enemy” AI condition,
  one-draw immediate selection, per-enemy countdown, binary32 attack scaling,
  status snapshots/rendering, and the native order where an accompanying hit
  resolves before the newly selected boost handler takes effect.
- Next: separate the neighboring type `18/19` trigger variants that share the
  execution handler but use different authored layouts and AI predicates.

## 2026-08-14 enemy status-ailment shield

- Identified enemy skill type `20` as the enemy status-ailment immunity shield:
  late handler `0x629534`, setup `0x61ff08`, and condition `0x61b4d8`.
  Setup copies definition duration `+0x10` to runtime `sMONSTER+0x678` without
  RNG; execution writes its signed low 16 bits to protected counter `+0x870`.
- The condition rejects reapplication while the counter is positive, and
  `_incEneTurn` decrements it before a later enemy action. Native damage setup
  checks the same counter before admitting player-applied defense reduction,
  while monster reset/status-clear paths zero it.
- Ported definition/runtime decoding, new-AI selection and exact one-draw RNG,
  reapplication rejection, per-enemy countdown, snapshots, canvas status icon,
  browser fixtures, and exact dispatch/setup/condition plus lifecycle anchors.
- Confirmed types `21..38` are rejected native records in this build: all use
  no-effect dispatch `0x62be50` and false condition `0x61c01c`; type `37` has
  generic setup `0x6217c0` while the rest use selection-clearing `0x621c94`.
- Next: inspect the next live pre-20 enemy action.

## 2026-08-14 enemy move-time reduction

- Identified enemy skill type `39` as the player move-time reduction status:
  late handler `0x629544`, setup `0x6217a8`, and condition `0x61b4f0`.
  Definition `+0x10/+0x14/+0x18` materializes duration, fixed centiseconds,
  and percentage reduction at runtime `sMONSTER+0x678/+0x67c/+0x680`.
- A nonzero percentage field selects percentage mode; otherwise the signed
  fixed field is subtracted from the base touch time. The handler stores the
  signed value in protected game-work state and packs the duration into the
  native low-ten-bit status counter.
- Ported definition/runtime decoding, exact immediate-AI RNG behavior,
  reapplication rejection, active drag deadlines, turn countdown, snapshots,
  status rendering, browser fixtures, and exact table/symbol checks including
  `cGAMEMAIN::_resetTouchBar` at `0x675514`.
- Next: inspect the next real pre-39 enemy action.

## 2026-08-14 enemy self-defeat

- Identified enemy skill type `40` as an unconditional self-defeat action:
  late handler `0x629660`, generic setup tail `0x6217c0`, and unconditional
  condition `0x61a630`. The record has no effect-specific authored parameters
  and setup consumes no RNG.
- Execution writes zero to both protected current-HP halves at
  `sMONSTER+0x3c/+0x4c` and their displayed-HP mirror at `+0xd4/+0xe4`, updates
  the HP gauge, and marks the monster's terminal presentation state.
- Ported definition/runtime decoding, immediate new-AI selection, exact
  one-probability-draw behavior, per-enemy death, enemy-phase victory handling,
  browser rendering, and exact table checks.
- Confirmed types `41..45` all share native rejected-control entries:
  no-effect dispatch `0x62be50`, selection-clearing setup `0x621c94`, and false
  condition `0x61c01c`. They remain unsupported instead of gaining invented
  gameplay behavior.
- Next: inspect the next real pre-40 handler.

## 2026-08-14 enemy attribute change

- Identified enemy skill type `46` as an enemy-element transition: late handler
  `0x629708`, setup `0x621504`, and condition `0x61b520`.
- Definition signed integers `+0x10..+0x20` are five candidate attributes.
  Values outside `0..4` and the monster's current attribute are ignored, while
  authored order and duplicate entries remain as native selection weights.
- The condition consumes one LCG draw whenever any candidate is available even
  though its random choice is discarded. Immediate AI then consumes its normal
  probability draw, and setup consumes a third draw to select the actual value
  stored at runtime `sMONSTER+0x678`.
- Ported raw definition/runtime decoding, current-attribute eligibility,
  exact three-draw selection, multi-enemy application, state/UI color changes,
  browser fixtures, and exact dispatch/setup/condition inspection.
- Next: continue the neighboring enemy-action audit.

## 2026-08-14 standalone scaled enemy attack

- Identified enemy skill type `47` as a standalone percentage-scaled attack:
  late handler `0x62972c`, setup `0x620040`, and condition `0x61b54c`.
  Definition `+0x14` is copied to runtime `sMONSTER+0x678`; setup consumes no
  RNG and execution passes its binary32 ratio to `_setEnemyAttackMain`.
- Ported the distinct action instead of conflating it with the common positive
  `+0x44` accompanying-attack field. Both share the exact float32 scaling and
  positive rounding primitive, but have separate native dispatch/data paths.
- Added the native `sMONSTER+0x6c0 == 0` selection gate as explicit per-enemy
  state, authored/runtime decoding, AI acceptance and rejection fixtures,
  enemy-turn damage, snapshots, browser coverage, and exact table checks.
- An admitted immediate skill consumes one AI probability draw; a nonzero gate
  rejects it without advancing the LCG.
- Next: continue the neighboring enemy-action audit.

## 2026-08-14 current-HP gravity

- Identified enemy skill type `50` as fixed current-HP gravity: late handler
  `0x62974c`, setup `0x621530`, and unconditional condition `0x61a630`.
  Definition `+0x10` is copied to runtime `sMONSTER+0x678` as a signed damage
  percentage; setup consumes no RNG.
- Execution reads protected player current HP. Exactly 100% uses that value
  directly; other positive values multiply and divide in binary32 before
  `izMathRound` applies half-away-from-zero rounding. The positive result is
  passed as `_setEnemyAttackMain`'s fixed-damage override.
- Added authored/runtime decoders, binary32 boundary fixtures, unconditional
  new-AI selection, pending-damage-aware enemy-turn execution, state reporting,
  browser coverage, and exact dispatch/setup/condition plus `izMathRound`
  anchors. An admitted immediate AI skill consumes one probability draw only.
- Confirmed neighboring type `51` is a rejected control/sentinel boundary: its
  condition returns zero, setup clears the selected skill, and its dispatch is
  the common no-effect finalizer.
- Next: inspect the remaining neighboring attack and status types.

## 2026-08-14 enemy resurrection

- Identified enemy skill type `52` as resurrection: late handler `0x6297ac`,
  setup `0x620350`, and condition `0x61a9d0`. Definition `+0x10` is the signed
  percentage of the selected monster's max HP to restore.
- The condition scans all native monster slots for an unavailable/dead target.
  Setup counts the same candidates, consumes one ordinary LCG draw even when
  only one exists, selects by native slot order, and stores the slot index at
  runtime `+0x678` and revive percentage at `+0x67c`.
- Execution rechecks the target is unavailable/dead, reconstructs protected
  int64 max HP, and writes `izMathRoundD(maxHP * percent / 100)` as current HP.
  The browser decoder, materializer, new-AI condition, RNG stream, HP restore,
  floating feedback, and enemy-turn state snapshot now reproduce that path.
- Enemy turns snapshot which monsters were alive at their start, so a monster
  revived midway through the phase cannot immediately take an extra action.
  Pure fixtures cover raw runtime records, exact rounding, rejection, preserved
  countdown, seed-21900 selection, and the two-draw AI/setup sequence.
- Exact restored-table inspection and browser regression cover the new type.
- Next: continue the neighboring enemy-status audit.

## 2026-08-14 enemy attribute absorption

- Identified enemy skill type `53` as attribute-damage absorption: late handler
  `0x6298ac`, setup `0x61ffe8`, and condition `0x61ae34`. Definition
  `+0x10/+0x14` is an inclusive duration range and `+0x18` is the six natural
  attribute bits.
- Setup consumes one ordinary LCG draw, stores duration at runtime `+0x678`,
  and copies the mask to `+0x67c`. Execution writes the materialized values to
  `sMONSTER+0x890/+0x880`; unlike type 54, it does not reroll at execution.
- Ported the per-enemy status lifecycle and `_calcFinalDamage` mask gate.
  Matching attributed attacks become capped enemy healing; unmasked attacks
  continue through normal damage, and fixed nail damage remains independent.
- Added raw definition/runtime decoding, new-AI reapplication rejection,
  enemy-turn countdowns, status snapshots, absorbed-damage reporting, floating
  feedback, and an `ABS R/B · N` enemy indicator.
- Exact dispatch/setup/condition checks plus `_checkMonterAbsorb` and
  `_calcFinalDamage` symbol anchors pass. Pure fixtures cover seed-21900 RNG,
  runtime materialization, healing, and countdown; exhaustive browser coverage,
  production build, input smoke, and visual inspection pass.
- Next: inspect type `52` and preserve any damage-status interaction rather
  than treating neighboring shield mechanics as interchangeable.

## 2026-08-14 leader/helper bind skill

- Mapped enemy skill type `54` to late handler `0x628fe0`, setup `0x621008`,
  condition `0x61aa5c`, and the shared `_doBind` routine at `0x616de4`.
  Authored target bits select leader and helper; setup materializes party mask
  bits `0`/`5` only for present, currently unbound cards.
- Reproduced the native duration quirk: setup rolls inclusive `+0x14..+0x18`
  and stores it, but execution deliberately advances the ordinary LCG again and
  rerolls the actual duration. With the AI probability roll, seed 21900 spends
  three draws and produces setup duration 4 followed by actual duration 3.
- Added per-card bind timers, native target order `[leader, helper, subs]`,
  extension capped at 99, ordinary/Super Bind Resist, and the native inclusive
  resistance check. A resistance check alone consumes an additional LCG draw;
  already-bound targets extend without rolling resistance.
- Bound cards no longer attack or contribute recovery, and bound leader/helper
  skills contribute multiplier 1. The canvas dims bound cards and displays the
  remaining turns; timers advance after player resolution.
- Raw definition/runtime decoding, new-AI eligibility, exact restored-table and
  symbol anchors, pure RNG/resistance fixtures, exhaustive browser regression,
  generic input-client smoke test, production build, and visual inspection pass.
- Next: continue the neighboring enemy-status audit.

## 2026-08-14 enemy player-heal skill

- Mapped enemy skill type `55` to late handler `0x629900`, setup `0x620040`,
  and condition `0x61aa74`. Definition `+0x10` is the player-HP activation
  threshold and `+0x14` is the percentage of player max HP restored.
- Ported the exact numeric paths: the condition uses double-precision
  `izMathRoundD`, while execution divides the authored percentage in binary32
  and calls `izMathSint32MulAdd` before `sPLAYER::addHp` performs its native
  signed-32-bit addition and HP cap.
- Added authored and materialized-runtime decoders, raw new-AI selection,
  player-state plumbing, enemy-turn execution, threshold boundary tests, and
  browser coverage for skill ID 9019. Selection consumes one ordinary AI roll;
  a failed HP condition consumes none.
- The exact inspector now asserts the type-55 dispatch/setup/condition entries,
  both player HP methods, and both math helpers against the restored image.
- Next: continue the neighboring condition/effect audit.

## 2026-08-14 source-color poison writers and scaled AI conditions

- Mapped enemy skill types `56`/`58` to shared late handler `0x62917c`, setup
  `0x61ff08`, and condition `0x61a63c`; authored `+0x10` is the source orb type,
  while the type ID chooses poison 7 or mortal poison 8.
- Traced the condition float through `_chooseEnemyAiNew`: immediate probability
  is multiplied by `min(source count / 3, 1)` in binary32, while fallback uses
  only positive eligibility and retains the authored weight.
- Ported deterministic `_doBlockSwap` source-type conversion. It consumes no
  execution RNG, rejects locked writes, clears incompatible special state, and
  treats source 7/8 as the combined poison family just like native.
- Pure fixtures cover full-chance selection, one-orb scaled rejection, unscaled
  fallback admission, locked cells counting for AI but rejecting mutation, and
  both destinations. Exact restored-table inspection, build, exhaustive browser
  regression, generic gameplay client, state output, and visual captures pass.
- Next: audit neighboring types `54/55` or `62/63`, prioritizing distinct board
  mechanics and preserving any non-boolean condition return values.

## 2026-08-14 count-gated individual poison writers

- Mapped types `60` and `61` to shared late handler `0x6291e0`, setup
  `0x61fee4`, and condition `0x61a710`; type 60 writes poison and type 61 writes
  mortal poison.
- Decoded positive `+0x10` as requested cells and nonzero `+0x14` as Heart
  exclusion. The condition consumes no RNG and requires at least the requested
  number of non-poison-family cells after optional Heart exclusion.
- Preserved the important distinction from type 64, whose condition requires
  only one eligible cell. Types 60/61 reject a four-cell request when only
  three eligible cells remain.
- Pure and browser fixtures select skill IDs 9015/9016, preserve Heart, write
  four cells, consume nine total LCG advances including AI, and update budget
  100 -> 80. The insufficient-candidate fixture is rejected at zero RNG cost.
- Exact restored-table inspection, rule tests, production build, exhaustive
  browser regression, generic gameplay client, and both visual captures pass.
- Next: commit this pair, then continue the neighboring dispatch audit.

## 2026-08-14 whole-color enemy poison writers

- Identified types `57` and `59` as a paired family sharing late handler
  `0x6291b8`, setup `0x61fee4`, and condition `0x61a6a0`; type 57 writes poison
  and type 59 writes mortal poison.
- Decoded `+0x10` as the requested represented-face-color count and nonzero
  `+0x14` as Heart exclusion. The native condition first requires a represented
  non-Heart eligible color, then compares the requested count against all
  represented face colors, including Heart.
- Reused the exact `_doPoisonBlocks` two-saved-roll whole-color shuffle. Pure
  and browser fixtures select skill IDs 9013/9014, preserve Heart, convert the
  same two source colors, consume three total LCG advances including AI, and
  update budget 100 -> 80. An all-Heart fixture is rejected without RNG cost.
- Exact restored-table inspection, rule tests, production build, exhaustive
  browser regression, generic gameplay client, and both visual captures pass.
- Next: commit the pair and continue the remaining enemy-skill condition audit.

## 2026-08-14 count-limited enemy poison writer

- Mapped enemy skill type `64` through the early dispatch table to `0x628ccc`,
  setup `0x6203f8`, and live-board AI condition `0x61aac4`.
- Decoded raw fields `+0x10` presentation, signed `+0x14` requested count,
  nonzero `+0x18` Heart exclusion, and `+0x1c == 1` mortal-poison selection
  (all other selector values choose ordinary poison).
- Recovered the condition exactly: it consumes no RNG and requires at least one
  non-poison-family board cell, optionally excluding Heart, without considering
  the cell's lock flag.
- Wired the existing exact `_doPoisonBlockN` primitive into raw enemy AI. A
  selected five-cell fixture consumes one probability roll plus ten writer
  rolls, writes five mortal-poison cells, preserves every Heart, and updates AI
  budget 100 -> 80. An all poison/mortal/Heart fixture is rejected without an
  RNG advance.
- Exact restored-table inspection, rule tests, production build, exhaustive
  browser regression, generic gameplay client, and both visual captures pass.
- Next: commit type 64 independently, then audit the adjacent whole-color
  poison skill instead of assuming its condition.

## 2026-08-14 enemy poison-mask conversions

- Mapped enemy skill type `84` through the late dispatch table to `0x629d84`
  and type `85` through the early table to `0x628e48`; both use setup
  `0x62004c` and unconditional AI condition `0x61a630`.
- Recovered their shifted raw layouts: type 84 reads its destination-type mask
  directly from `+0x10`, while type 85 uses `+0x10` for presentation and reads
  the mask from `+0x14`.
- Both handlers call `_doBlockSwap4`, whose zero source mask selects only native
  poison types 7/8 before distributing cells across the effective uint16
  destination mask. Decoder, normalizer, new-AI admission, and engine execution
  preserve the two original type IDs.
- Pure and browser fixtures select skill IDs 9010/9011 from raw tables and prove
  an identical 12/9/9 fire-water-wood distribution, 31 saved-LCG advances, AI
  budget 100 -> 80, and complete poison-family removal on a 6x5 fixture.
- Exact restored-table inspection, rule tests, production build, exhaustive
  browser regression, generic gameplay client, and both visual captures pass.
- Next: commit this exact paired family independently, then resume the remaining
  condition/dispatch audit without treating data-dependent records as static.

## 2026-08-14 direct poison type-list conversion

- Mapped type `80` to unconditional condition `0x61a630`, shared setup
  `0x620100`, and later dispatch handler `0x629d60`.
- Distinguished its raw layout from type 81: type 80's four `_doBlockSwap2`
  destinations occupy `+0x10/+0x14/+0x18/+0x1c`; type 81 uses `+0x10` for
  presentation and shifts destinations forward one word.
- Preserved type 80 through normalization and new-AI admission while sharing
  the already exact poison/mortal-only conversion primitive.
- Pure coverage selects skill ID 9009 and proves the same deterministic
  12/9/9 fire-water-wood distribution and 31 total LCG advances as the paired
  type-81 fixture. Exact table and browser coverage are in place. Rule tests,
  production build, exhaustive browser suite, generic gameplay client, and
  both visual captures pass.
- Next: commit this shifted record variant independently, then resume the
  remaining board-skill dispatch audit.

## 2026-08-14 four-stage enemy line rewrites

- Mapped types `76` and `78` as the four-stage counterparts to the existing
  type-77 vertical and type-79 horizontal rewrites. Both use unconditional AI
  condition `0x61a630` and packed-pair setup `0x61ff14`.
- Unlike the three-stage variants' early dispatch entries, type 76 executes at
  later-table target `0x629c60` with four `_doBlockSwapV` calls and type 78 at
  `0x629ce0` with four `_doBlockSwapH` calls. Their early entries are no-ops.
- Extended raw decoding and normalization to preserve all four type IDs and to
  read exactly three or four authored pairs as appropriate. Engine execution
  continues the shared effect accumulator and ordinary LCG stream across every
  nonzero pair.
- Pure and browser fixtures select skill IDs 9007/9008, prove exact rewritten
  rows/columns, consume 25/21 LCG advances respectively, and update each AI
  budget 100 -> 80. The restored-image inspector checks all six new table
  relationships. Rule tests, production build, exhaustive browser suite,
  generic gameplay client, and both visual captures pass.
- Next: commit the pair as one coherent native family, then continue the
  remaining dispatch audit.

## 2026-08-14 enemy poison type-list conversion

- Mapped enemy skill type `81` to unconditional condition `0x61a630`, setup
  `0x620100`, and early dispatch handler `0x628de0`.
- Setup ignores definition `+0x10` for board semantics and copies the four
  signed destination entries at `+0x14/+0x18/+0x1c/+0x20` into
  `sMONSTER+0x688..+0x694`. Execution passes them to `_doBlockSwap2`.
- Preserved `_doBlockSwap2`'s actual semantics: the values are a terminated
  destination list, while source mask zero makes `_doBlockSwapNew` fold in
  poison and mortal-poison. It is not a source/destination pair list and does
  not rewrite ordinary colors.
- Pure coverage selects skill ID 9006, converts an all-poison 6x5 board into
  12 fire, 9 water, and 9 wood orbs, consumes one AI plus thirty per-cell LCG
  advances, and updates budget 100 -> 80. Exact table checks and browser
  coverage are in place. Rule tests, production build, exhaustive browser
  suite, generic gameplay client, and both visual captures pass.
- Next: commit this mechanic independently, then decode another distinct
  board-affecting dispatch.

## 2026-08-14 enemy vertical-line skill dispatch

- Mapped enemy skill type `77` to unconditional condition `0x61a630`, shared
  packed-pair setup `0x61ff14`, and early execution handler `0x628d3c`.
- Confirmed that its three runtime words at
  `sMONSTER+0x688/+0x68c/+0x690` feed `_doBlockSwapV` rather than the type-79
  `_doBlockSwapH` path, while retaining the shared effect accumulator and
  ordinary saved-LCG stream.
- The raw decoder and new-AI engine now support both orientations without
  conflating their native type IDs. Pure coverage rewrites columns 0, 2, and 5
  to fire, water, and wood and proves one selection plus fifteen cell advances.
- Exact table assertions and the browser scenario cover skill ID 9005 and AI
  budget 100 -> 80. Rule tests, production build, exhaustive browser suite,
  generic gameplay client, and both visual captures pass.
- Next: commit this paired native handler independently, then move to a
  different enemy-skill family.

## 2026-08-14 enemy horizontal-line skill dispatch

- Mapped enemy skill type `79` across the native condition, setup, and early
  execution tables: unconditional condition `0x61a630`, setup `0x61ff14`, and
  `_doEnemySkill` handler `0x6287f8`.
- Decoded three authored `(line mask, destination type mask)` pairs at
  `+0x10/+0x14`, `+0x18/+0x1c`, and `+0x20/+0x24`. Setup packs their low
  halfwords into `sMONSTER+0x688/+0x68c/+0x690`; execution calls
  `_doBlockSwapH` three times with one shared effect accumulator.
- Raw new-AI definitions now select and apply the three-stage board rewrite.
  Pure and browser fixtures turn the top, middle, and bottom rows into fire,
  water, and wood, preserving the exact one selection plus eighteen per-cell
  LCG advances and AI budget 100 -> 80.
- The exact inspector checks the type-79 early dispatch table separately from
  the later type-128+ table. Rule tests, production build, exhaustive browser
  suite, generic gameplay client, and both visual captures pass.
- Next: decode the paired type `77` vertical-line handler, then factor the
  shared raw setup layout without weakening the explicit binary provenance.

## 2026-08-14 enemy thorn-marker skill dispatch

- Mapped enemy skill type `153` to condition `0x61ba04`, generic setup
  `0x6217c0`, and execution `0x62b0d0`. The definition fields are type mask
  `+0x10`, requested count `+0x14`, descriptor `+0x18`, and optional attack
  percentage `+0x44`.
- Connected raw and scheduled definitions to the existing `_doMakeBurDrop`
  port. Both AI dry-run eligibility and application preserve the native
  one-step candidate-shuffle seed, and type 153 clears the descriptor high bit.
- Pure and browser fixtures select skill ID 9003, mark exactly two eligible
  orbs with descriptor 4, consume three ordinary LCG advances, and update AI
  budget 100 -> 80. The exact inspector now asserts its dispatch, setup, and
  condition table targets in addition to all 83 named symbols.
- Next: decode a distinct board transformation or fall-status skill rather
  than continuing only through adjacent wrappers around already ported helpers.

## 2026-08-14 enemy weakened-orb skill dispatch

- Mapped enemy skill type `151` through all three native tables: condition
  `0x61bab4`, generic setup `0x6217c0`, and execution `0x62afd0`. It decodes
  type mask `+0x10`, weakening percentage `+0x14`, count limit `+0x18`, and the
  shared optional attack field `+0x44`.
- Routed scheduled and raw-AI-selected records into the existing byte-faithful
  `doBlockMinus` primitive. The AI condition performs the native dry run and
  preserves its capped-shuffle RNG advance before the selection roll; actual
  execution shuffles again before weakening the limited cells.
- Added exact dispatch/setup/condition-table assertions, decoder fixtures, and
  engine/browser coverage proving skill ID 9002 weakens exactly two orbs and
  advances seed 21900 three times to 1929471377 with AI budget 100 -> 80.
- Next: port type `153`, whose condition and execution both call the already
  decoded thorn/burst-marking primitive, or another high-impact board skill.

## 2026-08-14 data-backed new enemy AI selection

- Recovered `_doEnemyAi`'s mode switch and the supported portion of
  `_chooseEnemyAiNew`: enemy-definition `+0xe0` bit 0 selects it, `+0xe2/+0xe4`
  hold budget cap/regeneration, and 64 slots at `+0xec` carry skill ID,
  immediate-chance, and fallback-weight fields.
- Ported type-128 selection from raw records, including definition probability
  factors `+0x30/+0x34`, HP threshold `+0x38`, budget cost `+0x40`, slot-order
  immediate rolls, weighted fallback, exact ordinary LCG consumption, budget
  regeneration/cost, and the black-fall-already-active condition.
- Integrated decoded pools into enemy turns while retaining explicit selected
  queues as an override. Snapshots expose chosen skill IDs, AI budget, and slot
  count. Unsupported effect conditions, flow control, and the legacy selector
  remain explicit errors.
- Pure rules, production build, exhaustive project browser tests, and the
  generic gameplay client pass. Four selector/condition anchors bring the
  restored-image inspector to 83 exact gameplay symbols.
- Next: decode another board-affecting `_doEnemySkill` type and its
  `_chooseEnemyAiSub` condition, then broaden raw-pool selection to it.

## 2026-08-14 enemy skill accompanying attacks

- Traced `_setupSkillWithAttack`'s positive definition field `+0x44` through
  `sMONSTER+0x7e8` and `_doEnemySkill` into `_setEnemyAttackMain`: it is a
  percentage of the enemy's base attack and accompanies, rather than replaces,
  the selected skill effect.
- Ported the native binary32 calculation and `izMathRound` positive rounding
  path. Scheduled type-128 black-fall skills can now damage the player and
  activate the fall rule in the same enemy action; the action snapshot reports
  the resolved damage.
- Added exact anchors for `_setupSkillWithAttack` and `_setEnemyAttackMain` (79
  total). Pure rules, the production build, the exhaustive project browser
  matrix, and the generic gameplay-client state/render check pass.
- Next: decode downloaded enemy-AI condition/weight records sufficiently to
  select definitions from data, and port another high-impact board-affecting
  `_doEnemySkill` dispatch type.

## 2026-08-14 enemy definition setup and turn boundary

- Ported `_setupEnemyAttackSub`'s type-128 materialization: definition `+0x10`
  supplies the packed duration, positive `+0x14` is multiplied by 100 into
  basis points, and nonpositive chance defaults to 10,000.
- Recovered `_setupEnemyAttack`'s readiness check at `sMONSTER+0x120`, plus the
  selected/prepared indices at `+0x670/+0x7d8` and AI state at `+0x7dc`.
  Added explicit definition queues at this decoded boundary: an admitted skill
  action replaces the normal hit, while an empty queue retains normal attacks.
- Existing fall/orb lifetimes now advance before action setup, preserving the
  full duration of an effect activated by that action. Six enemy-AI anchors
  bring the exact restored-image inspector to 77 gameplay symbols.
- Positive `sENEMYSKILL+0x44` attack-with-skill records are explicitly rejected
  until their downstream damage path is decoded; zero-valued full records run.
- Next: decode the downloaded enemy-AI condition/weight records that choose the
  definition index, and add further high-impact `_doEnemySkill` dispatch types.

## 2026-08-14 black-fall dispatch correction

- Cross-checked both `_setupEnemyAttackSub` and `_doEnemySkill` jump tables and
  corrected black-fall from type `127` to type `128`: setup entry `0x4af`
  targets `0x6211a0`, and execution entry `0x61d` targets `0x62a854`.
- Type `127` is the adjacent `0x62a7d4` status handler and does not read the
  monster duration/chance fields. Updated the decoder, fixtures, inspector, and
  documentation so the prior one-entry error cannot silently regress.
- Next: materialize type-128 runtime fields from definition `+0x10/+0x14`, then
  attach decoded enemy-skill execution to the recovered attack-counter boundary.

## 2026-08-14 black-fall enemy-skill runtime decode

- Recovered `_doEnemySkill`'s second dispatch table. A later cross-check of the
  adjacent entries corrected black-fall to signed type `128`, table entry
  `0x61d`, resolving to the handler at `0x62a854`.
- Added a byte-exact runtime decoder for definition type `+0x04`, monster
  duration `+0x678`, and signed chance `+0x67c`, plus an engine application
  boundary that rejects unsupported types without changing fall state.
- Routed engine and browser fixtures through the decoded type-128 record and
  made the exact inspector verify both the `0x6285a4` `_doEnemySkill` anchor and
  jump-table target (71 symbols total).
- Next: recover the enemy-skill scheduler/selection boundary and add the next
  high-impact board-affecting dispatch types without inventing server data.

## 2026-08-14 native black/invisible skyfalls

- Identified `_checkPassiveSkill4Block`'s `0x1000` branch as black/invisible
  skyfall through `_doEntireBlack2`, `_doMakeInvDropEfc`, and
  `_clearBlackFall`; it is not the roulette state.
- Ported its signed basis-point chance, pre-thorn shared RNG position,
  special-orb enhancement/combo-drop/Nail cleanup, fixed countdown `1`, and
  transient `0x10000` spawn-cycle marker.
- Recovered `_incEneTurn`'s lifecycle: fresh black orbs skip the first
  decrement, then expire when the low-seven-bit countdown reaches zero. Added
  browser rendering, pure/engine/browser lifecycle fixtures, and four exact
  restored-image anchors (70 total).
- Next: map the decoded fall controls from raw enemy/dungeon records and
  continue into unresolved orb-state flags and enemy-skill dispatch.

## 2026-08-14 native enhanced/weakened fall resolution

- Recovered `_checkPassiveSkill4Block`'s final natural-orb branch. Passive skill
  IDs `14..18` and `29` contribute 20% enhanced-fall chance each; an active
  weakening record subtracts its chance and supplies the negative power, while
  a zero-power modifier adds enhanced-fall chance.
- Preserved float32 `+0.06`/negative power values, the 100% chance cap, and the
  unconditional shared `+0x66a14` LCG advance for every natural spawn—even at
  zero net chance. This corrected downstream thorn/Nail/lock stream positions.
- Added pure, engine, and browser fixtures for zero, enhanced, weakened, boost,
  special-type, and combined post-spawn ordering. `_countPassiveSkills` raises
  the exact restored-image inspector to 66 gameplay anchors.
- Next: recover the remaining `0x1000`/`0x10000` roulette or invisible-drop
  branch and then map the decoded fall controls from raw dungeon records.

## 2026-08-14 native Nail Orb fall and post-attack damage

- Identified `_checkPassiveSkill4Block`'s `0x20000` branch through the binary's
  `ED_NAIL_ERASE`, `ED_MAKENAILDROP`, and `sGAMEWORK::addNailCounts` symbols.
  Natural spawns consume one shared post-spawn roll and become Nail Orbs when
  `floor(high16 * 100 / 65536) < percent`; special types consume nothing.
- Ported `nailFallRule` after thorn assignment and before lock-fall, persistent
  Nail Orb state/rendering, and cascade-wide erased-nail counting.
- Recovered `_gamePhaseEachTurn`'s post-attack damage: each surviving enemy
  takes rounded `max(1, maxHP * nails / 100)` damage. Pure, engine, and browser
  fixtures cover the percentage edge, shared three-effect LCG order, visual
  state, and per-enemy damage. The inspector now checks 65 exact anchors.
- Next: recover the remaining roulette/invisible-drop and enhanced/weakened
  fall branches in `_checkPassiveSkill4Block`.

## 2026-08-14 native thorn-fall post-spawn rule

- Recovered `_checkPassiveSkill4Block`'s thorn/burst branch: an active record
  consumes one shared post-spawn LCG roll for every new block before checking
  its optional type mask, then applies flag `0x80000` and the packed damage
  descriptor when `roll10000 >= (100 - percent) * 100`.
- Ported `thornFallRule`, including its separate descriptor high bit and its
  exact ordering ahead of `_checkLockFall` on game-work stream `+0x66a14`.
- Added pure, engine, and browser fixtures for matching, masked, special-type,
  and combined thorn-plus-lock cases. The restored-image inspector now checks
  63 exact gameplay anchors.
- Next: recover the adjacent passive blind/minus/enhanced fall branches and map
  their packed dungeon/passive records into the decoded browser configuration.

## 2026-08-14 native lock-fall rule stream

- Recovered `_checkLockFall` at `0x626200`: up to ten active records provide a
  16-bit type mask and signed percentage; each matching record consumes one
  roll and locks when `roll10000 >= (100 - percent) * 100`.
- Preserved the dedicated game-work LCG stream at `+0x66a14`, separate from
  `_spawnNewBlock`'s `+0x66a10` stream, and applied resulting flag `0x800` after
  combo-drop marker selection during every refill.
- Added pure, engine, and browser fixtures for matching/nonmatching and 0%/100%
  rules. The exact restored-image inspector now checks 62 anchors.
- Rules, production build, exhaustive browser mechanics, and the independent
  gameplay-client render check pass with no console errors.
- Next: recover `_checkPassiveSkill4Block`'s post-spawn state and the remaining
  non-drop/fall-status branches, then map raw dungeon rule records.

## 2026-08-14 native combo-drop awakening accounting

- Recovered `_checkErases`' passive-skill `62` path: it builds five elemental
  awakening counts, applies them only to connected elemental matches of at
  least ten blocks, queues the full count for the following fall, and adds
  dummy combos capped at four per erase pass.
- Ported the uint8 pending-count behavior and dummy-combo contribution to combat
  combo multipliers through `comboDropAwakenings`; Heart and special matches do
  not enter this branch.
- Added pure, engine, and browser fixtures for a ten-Fire match, and anchored
  `_addComboDropFlags` at `0x673d90`. The exact inspector now checks 61 anchors.
- Rules, production build, exhaustive browser mechanics, and the independent
  gameplay-client render pass with no console errors.
- Next: map saved party/passive records into the five elemental counts and
  continue the remaining fall-state/post-spawn flag pipeline.

## 2026-08-14 native scripted top-line skyfalls

- Ported `_isEnableTopLine`'s `_checkFalls` branch: active floor descriptors
  supply one low-nibble orb type per column, every replacement in that column
  uses the scripted type, and `_spawnNewBlock` is not called.
- Added constructor/setter/snapshot support through `topLineDropTypes`, plus
  deterministic engine and browser fixtures proving multi-hole placement and
  the RNG-free `21900` state.
- Rules, production build, exhaustive browser mechanics, and the independent
  gameplay-client render check pass with no console errors.
- Next: map raw party/floor records into the recovered combo-drop inputs.

## 2026-08-14 native combo-drop skyfall markers

- Recovered `_checkFalls`' replacement-byte stream: low six bits carry the
  generated type and bit 6 becomes `sBLOCK.flags & 0x8000` on the new block.
- Ported floor-configured combo-drop chance/cap rolls and pending marker counts.
  All replacement types are generated first; each chance attempt and each
  marker-selection start spends the native saved LCG advance, then selection
  scans forward with wrap for an unmarked natural type.
- Added pure helper, engine, and browser fixtures, including the exact two-hole
  marker result/state. `_isEnableTopLine` and `sFLOORLIST::getComboDrop` raise
  the exact restored-image inspector to 60 anchors.
- Rules, production build, exhaustive browser mechanics, and the independent
  gameplay-client render pass with no console errors.
- Next: recover downstream combo accounting/awakening-record production for
  `0x8000` markers.

## 2026-08-14 native multi-hole refill order

- Recovered the ordinary refill traversal in `_checkFalls` at `0x673fbc`:
  columns are visited left to right, empty cells within a column are generated
  top to bottom, and that generated stream occupies the new top slots after
  surviving blocks compact downward.
- Updated cascade refill so multiple holes in one column no longer reverse the
  native RNG-result order. Added deterministic engine and browser fixtures for
  the observable two-hole case.
- Pure rules, production build, the full browser gameplay suite, and the
  independent gameplay-client render check all pass with no console errors.
- Next: recover the special fall-status/combo-drop overrides around
  `_checkFalls`, then continue mapping raw dungeon/passive drop records while
  preserving the private account/server data boundary.

## 2026-08-14 drop-rate lane summary

- Recovered `_buildBlockList` at `0x6615e8` through its final ten binary32
  lanes: sequential sum, `float32(total * 100000)`, native ceiling, and positive
  type mask.
- Closed `__initBlocks`' saturated-rate branch, including its unsigned shifted
  threshold and RNG-free numeric-type rotation past opening-run masks.
- Added binary32 unit/mask and defensive saturated-fallback fixtures. The exact
  inspector now checks 58 anchors.
- Next: map raw dungeon/passive drop records into the final lanes and continue
  the recovered board/fall state machine.

## 2026-08-14 native initial-board traversal

- Recovered the gameplay loop in `__initBlocks` at `0x661f10`: top-down,
  left-to-right traversal over `column + (row << 4)`, with separate masks for
  same-type horizontal and vertical prefixes of the minimum match length.
- Ported the initial board builder through `_spawnNewBlock`, preserving one
  ordinary LCG step per cell and forward face-list rotation instead of random
  rescaling over a filtered candidate list.
- Added horizontal, vertical, exact 6×5 seed, weighted first-cell, engine, and
  browser fixtures. The exact inspector now checks 57 anchors.
- Next: decode the saturated active-rate correction in `__initBlocks` and map
  the remaining dungeon drop-record inputs.

## 2026-08-14 native skyfall selection

- Recovered `_spawnNewBlock` at `0x661978`: single-step ordinary face-list
  selection, ten binary32 drop-rate lanes, mandatory second advance only when
  rates are active, strict-negative thresholding, fallback-only exclusions,
  forward rotation, and RNG-free scripted drops.
- Recovered `_spawnNewBlockInBits` at `0x62771c`, including its one-step natural
  mask path and two-step face-list fallback for high or empty masks.
- Ported both primitives and routed browser cascade refills through the native
  selector with configurable dungeon face types, rates, and exclusion mask.
- Added deterministic pure, engine, weighted/fallback/exclusion, and browser
  fixtures. The exact inspector now checks 56 anchors.
- Next: recover initial-board construction and the remaining data mapping from
  dungeon drop records; preserve the private account/server data boundary.

## 2026-08-14 passive block-swap resistance

- Recovered `makeBlockFlagByPassiveSkill` at `0x6add50`, including passive
  skill IDs `12` (Jammer) and `13` (Poison), the shared checked/resisted/
  presentation byte, and Poison/Mortal Poison aliasing.
- Ported non-null `sBLOCKFLAG` behavior across bit, mask, explicit-list, and
  line swap entry points. Resisted writes are suppressed only after native-order
  selection and RNG work; ordinary colors and Bomb remain unaffected.
- Added pure byte-state, engine, fixed-destination, pre-resistance RNG, and
  browser fixtures. The exact inspector now checks 54 anchors.
- Next: data-backed initial-board and skyfall constraints; preserve the private
  account/server data boundary.

## 2026-08-14 skill-record full-board swaps

- Recovered `_doBlockSwap3` at `0x6aea98` and the relevant skill record fields:
  up to seven signed destination types at offsets `+0x14..+0x2c`, terminated by
  the first negative value.
- Ported its three-copies-per-type prefix, saved-LCG random fill, two-step
  combined-seed forward shuffle, row-major slot consumption, same-type skip,
  locked-cell rejection, and natural/special mutation state.
- Added exact distribution, RNG, sentinel, lock, same-source, enhancement,
  engine, and browser fixtures. The exact inspector now checks 53 anchors.
- Verification passed: rules, production build, exact binary inspection,
  exhaustive browser mechanics, generic tap-turn/text state, clean console,
  and screenshot inspection.
- Next: non-null `sBLOCKFLAG` passive resistance and data-backed initial-board/
  skyfall constraints; preserve the private account/server data boundary.

## 2026-08-14 explicit-list poison swaps

- Recovered `_doBlockSwap2` at `0x6af838`: one mandatory destination followed
  by up to three values, truncated at the first negative sentinel and preserving
  duplicates, forwarded to the default poison/mortal source path.
- Added engine and browser fixtures for sentinel truncation, duplicate weighting,
  locked mortal-poison rejection, RNG state, and accumulated effect flags.
- Expanded the exact restored-binary inspector to 52 gameplay anchors.
- Verification passed: rules, build, exact inspector, exhaustive browser suite,
  generic tap-turn/text state, clean console, and screenshot inspection.
- Next: `_doBlockSwap3` skill-record decoding and non-null `sBLOCKFLAG` passive
  resistance, followed by data-backed board generation/skyfall constraints.

## 2026-08-14 line-pattern block swaps

- Recovered `_doBlockSwapV`/`_doBlockSwapH` at `0x6ae64c`/`0x6ae8fc` plus exact
  canonical-pattern relocation for larger and smaller boards.
- Ported left-to-right vertical bits, bottom-to-top horizontal bits, uniform
  Nth-enabled-type selection across destination bits 0..9, and one saved LCG
  advance per selected active cell before locked-cell rejection.
- Preserved the zero-pattern early return (including its zero effect result),
  natural/special mutation state, and effect-category accumulation.
- Added pure relocation, deterministic RNG, lock-order, engine, horizontal,
  vertical, and browser fixtures. The exact inspector now checks 51 anchors.
- Verification passed: rules, build, exact inspector, exhaustive mechanics,
  generic tap-turn/text state, clean console, and screenshot inspection.
- Next: recover non-null `sBLOCKFLAG` construction/resistance and the remaining
  `_doBlockSwap2`/`_doBlockSwap3` skill-data wrappers.

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
