# Trump Defense 2016 asset credits

This web rewrite carries models, textures, skyboxes, and audio from the original TD2016 project's `TrumpDefense2016/` tree. The TD2016 author identified **Stronghold Crusader** and **Command & Conquer: Red Alert** as sources of material used in the original game. The `Sounds/SFX/Crusader/` folder identifies some Stronghold Crusader samples. The author also confirmed that some other material came from Red Alert, but did not map individual files to that game. Those games are credited here; this project is not affiliated with or endorsed by their creators.

## Audio included in this rewrite

| Source path in TD2016  | Files included here                                                                                                                                                                        | Original game attribution                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `Sounds/Music/`        | `Mariachi.mp3`, `SandalMaker.mp3`, `ReadyTheArmy.mp3`                                                                                                                                      | Original files include material from Red Alert; exact file-by-file mapping is unavailable. |
| `Sounds/SFX/`          | `balloon.wav`, `buildWall.wav`, `cannon.wav`, `cash.wav`, `constr1.wav`–`constr7.wav`, `die.wav`, `hammer.wav`, `mexicoChatter.wav`                              | Original files include material from Red Alert; exact file-by-file mapping is unavailable. |
| `Sounds/SFX/Crusader/` | `arrwdth_09.wav`, `buy.wav`, `cheer2.wav`, `firepop2.wav`, `flamearrow_03.wav`, `hit_01.wav`, `mason_chip1.wav`, `metrock_03.wav`, `puller_strain.wav`, `select.wav`, `towerUpgrade.wav`, `wallUpgrade.wav`, `woodhit_06.wav` | Stronghold Crusader, as identified by the source folder and its calls in `Sound.cpp`.      |

Only the referenced Stronghold Crusader samples used for weapon fire, selection, purchases, upgrades, life loss, spawning, victory, and wall work are included. Other files from that folder are not copied.

The source project does not provide a file-by-file rights or license record for the included audio. These credits document the known game origins, but they do not establish permission to redistribute a particular recording. Confirm or replace any third-party recording before a public release where permission is required.
