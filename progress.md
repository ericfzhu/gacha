Original prompt: I'd like you to go through this project, and make it as close in gameplay and UI to the game "Kantai Collection" as possible, though with custom battleship sprites

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
