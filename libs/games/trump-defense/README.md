# Trump Defense 2016 rewrite

This feature rewrites gameplay and presentation with TypeScript, Angular, and Three.js. `gameplay` owns simulation data and ordered systems. `interface` owns the browser view, input mapping, level loading, and audio. The portal only adds the route, card, and asset copy.

## Source map and intentional decisions

| Original source            | New authority                                               | Preserved behavior or decision                                                                                                                                                                                                       |
| -------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Grid.cpp`, `Grid.hpp`     | `levels/level-1.json` through `level-3.json`                | 16 × 12 grid, 8-unit tile origins, ordered ground/flying paths, including repeated ground waypoints.                                                                                                                                 |
| `Draw.cpp` scene routines  | Each level's `scene` data and `ThreeScene`                  | Map, path tiles, houses, cacti, scaffolding, builders, White House, wall, tutorial prop, path point lights, endpoint spotlights. `House3` remains disabled; White House uses its original model and texture at the source transform. |
| `Resources.cpp`            | Level rules and scene data                                  | Day/night cubemaps, level music, 200 money, 10 lives, level lighting. Three light intensities are tuned equivalents because GLSL coefficients are not directly transferable.                                                         |
| `GameObject.cpp`           | Enemy/tower definitions and entity components               | Level enemy health, tower range, cannon ground-only targeting and 150% base damage, two tower levels.                                                                                                                                |
| `InputManager.cpp`         | `game-actions.ts` and Angular controls                      | B/C buy, U upgrade, Space wall, $20/$30/$50/$100 costs, wall height 35. The SDL absolute-ticks wall guard becomes a three-second run timer.                                                                                          |
| `Draw.cpp` update routines | `spawn-system.ts`, `movement-system.ts`, `combat-system.ts` | 5-second first spawn, 2-second spawn interval, 0.5-second movement, 1-second firing, component-driven facing, visible rocket flight, enemy health increase every 5 seconds, kill rewards and life loss.                              |
| `Game.cpp`, `main.cpp`     | Level files and Angular transitions                         | Cumulative roster, fresh economy/lives/wall on each level, three-stage campaign, retry and final victory.                                                                                                                            |

The old spawn loop wrote every same-lane roster entry to one entry square, leaving only the last visible. The rewrite rotates through the cumulative roster so every listed enemy appears without stacking an entire roster on a single tile. The source drew a rocket model at the midpoint between tower and target for one frame (`RAKETA JE NASREDIN OBJEKTOV`); the rewrite animates that rocket model between its endpoints. Level 1 starts with 10% less enemy health and a slightly slower health increase to ease its opening difficulty.

Sniper availability is level-authored: level 1 locks it in both the HUD and purchase action. Level 3 picks a random free build site without selecting a tile; existing defenses can still be selected for upgrades. Sound cues are consumed once, active world sounds follow camera panning and zoom, and wall/slum ambience fades out when leaving its zone. Ground spawning uses the original `firepop2.wav` sample, and victories play `cheer2.wav`.

Only ground-route cells reserve terrain for enemy movement. The flight route is elevated, so visible build sites and tower placement remain available beneath it.

The browser campaign shows level choices before creating a Three.js scene, stores the highest unlocked level in `localStorage`, and exposes all three levels in development builds. The source RTS camera starts at `(0, 50, 0)` with a fixed 70° view rotation in `Draw.cpp`, plus its adjustable pitch. Its wheel adjusts height by five units, Z by 2.5 units, and pitch by five degrees per notch; the browser intentionally keeps its current 45° whole-map starting view and couples orbit distance with a five-degree angle step. World sound cues use camera-relative distance and stereo panning. Entry spawn cues only play while near the original entry; wall work, wall ambience, and slum chatter retain their separate source camera zones. The White House had an asset and a commented draw call in TD2016; this feature request restores it at that source transform.

## Relevant source comments

- `GameObject.cpp`: `cannon nemore strelat gor` means cannons cannot shoot flying units. The authored `canHitFlying` tower component carries this rule.
- `GameObject.cpp`: `ma 150% dps` records cannon base damage of 15 versus sniper damage of 10; values are in each level's tower definitions.
- `InputManager.cpp`: `ZAENKAT SM DO LVL2` limits upgrades to tower level 2; `upgradeTower` enforces this.
- `Draw.cpp`: `počaka 5 sec na začetk` documents the opening spawn delay; `spawnDelayMs` carries it.
- `Draw.cpp`: `vsake 5 sec dodaš nekej lajfa d so enemy skoz težji` documents increasing enemy health; `enemyHpIntervalMs` and `enemyHpIncrease` carry it.
- `Draw.cpp`: `da je na mapu` describes wall placement beside the map; each level owns the wall transform.
- `Grid.cpp` contains a disabled block for random start/end and heuristic pathfinding. It was not active game behavior and is not an editor implementation.
- `Resources.cpp` contains disabled OpenGL blending, projection, and console comments, and `Draw.cpp` contains a map-normalization TODO. These refer to discarded platform code, so they are accounted for here rather than copied into active TypeScript.

## Assets and release review

Models, textures, legacy cubemap faces, sounds, and the portal icon came from `/home/jernej/Git/School/TD2016/TrumpDefense2016`. The shipped OBJ meshes use Three's bundled OBJ loader; diffuse/specular PNGs were converted to WebP, and legacy cubemap JPEGs were reduced to 1024 pixels per face for browser delivery. The original level 2 night cubemap had four 1 × 1 faces, so it is replaced with six matching 512-pixel procedural night-sky faces; cube faces follow Three.js's +X, −X, +Y, −Y, +Z, −Z order. Level 2 point and spot lights are authored only in its level data and use Three.js lighting directly, without painted circle meshes. Runtime code does not parse OBJ itself. The repository's audio LFS rules apply to copied MP3/WAV files.

The TD2016 author identified Stronghold Crusader and Command & Conquer: Red Alert as sources of material in the original game. The `Sounds/SFX/Crusader/` folder identifies the Stronghold Crusader samples; some other original material came from Red Alert, but the source does not map individual files to it. [Asset credits](./ASSET_CREDITS.md) list the included audio and known attribution. Redistribution terms for individual recordings are not documented in TD2016.

Audio is tracked by Git LFS. If a fresh checkout reports pointer files during `portal:assets-check` or `portal:serve`, run `pnpm assets:hydrate` before playtesting.

`level.schema.json` and the semantic Jest checks validate the three bundled level files. Runtime loading checks the version and required top-level shape, and reports missing files. A future editor or user-supplied level flow would need runtime validation before accepting arbitrary JSON.
