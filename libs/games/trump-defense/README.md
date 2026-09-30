# Trump Defense 2016 rewrite

This feature rewrites gameplay and presentation with TypeScript, Angular, and Three.js. `gameplay` owns simulation data and ordered systems. `interface` owns the browser view, input mapping, level loading, and audio. The portal only adds the route, card, and asset copy.

## Source map and intentional decisions

| Original source            | New authority                                               | Preserved behavior or decision                                                                                                                                               |
| -------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Grid.cpp`, `Grid.hpp`     | `levels/level-1.json` through `level-3.json`                | 16 × 12 grid, 8-unit tile origins, ordered ground/flying paths, including repeated ground waypoints.                                                                         |
| `Draw.cpp` scene routines  | Each level's `scene` data and `ThreeScene`                  | Map, path tiles, houses, cacti, scaffolding, builders, wall, tutorial prop, path point lights, endpoint spotlights. Disabled `House3` and `WhiteHouse` calls remain omitted. |
| `Resources.cpp`            | Level rules and scene data                                  | Day/night cubemaps, level music, 200 money, 10 lives, level lighting. Three light intensities are tuned equivalents because GLSL coefficients are not directly transferable. |
| `GameObject.cpp`           | Enemy/tower definitions and entity components               | Level enemy health, tower range, cannon ground-only targeting and 150% base damage, two tower levels.                                                                        |
| `InputManager.cpp`         | `game-actions.ts` and Angular controls                      | B/C buy, U upgrade, Space wall, $20/$30/$50/$100 costs, wall height 35. The SDL absolute-ticks wall guard becomes a three-second run timer.                                  |
| `Draw.cpp` update routines | `spawn-system.ts`, `movement-system.ts`, `combat-system.ts` | 5-second first spawn, 2-second spawn interval, 0.5-second movement, 1-second firing, enemy health increase every 5 seconds, kill rewards and life loss.                      |
| `Game.cpp`, `main.cpp`     | Level files and Angular transitions                         | Cumulative roster, fresh economy/lives/wall on each level, three-stage campaign, retry and final victory.                                                                    |

The old spawn loop wrote every same-lane roster entry to one entry square, leaving only the last visible. The rewrite rotates through the cumulative roster so every listed enemy appears without stacking an entire roster on a single tile. The old `Draw.cpp` rocket was drawn for one frame at the midpoint between tower and target (`RAKETA JE NASREDIN OBJEKTOV`); the rewrite uses a brief line effect. These are deliberate gameplay/presentation fixes.

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

Models, textures, cubemap faces, sounds, and the portal icon came from `/home/jernej/Git/School/TD2016/TrumpDefense2016`. The shipped OBJ meshes use Three's bundled OBJ loader; diffuse/specular PNGs were converted to WebP, and cubemap JPEGs were reduced to 1024 pixels per face for browser delivery. Runtime code does not parse OBJ itself. The repository's audio LFS rules apply to copied MP3/WAV files.

The TD2016 author identified Stronghold Crusader and Command & Conquer: Red Alert as sources of material in the original game. [Asset credits](./ASSET_CREDITS.md) name both games, list every audio file included in this rewrite, and distinguish them from the original `Sounds/SFX/Crusader` samples that are excluded. The precise source game and redistribution terms for each included recording are not documented in TD2016.

`level.schema.json` and the semantic Jest checks validate the three bundled level files. Runtime loading checks the version and required top-level shape, and reports missing files. A future editor or user-supplied level flow would need runtime validation before accepting arbitrary JSON.
