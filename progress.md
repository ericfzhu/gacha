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
