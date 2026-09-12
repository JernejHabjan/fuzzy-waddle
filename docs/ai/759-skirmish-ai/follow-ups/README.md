# #759 follow-up implementation plans

Each open subissue has one cold-start plan. The GitHub issue owns status and discussion; its linked file owns the
implementation route, source anchors, evidence, and completion boundary. Product behavior remains documented beside the
AI controller.

| Issue                                                           | Responsibility                 | Plan                                                            | Dependency                                     |
| --------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------- | ---------------------------------------------- |
| [#815](https://github.com/JernejHabjan/fuzzy-waddle/issues/815) | Pure scenario coverage         | [Deterministic scenarios](deterministic-scenarios.md)           | None                                           |
| [#816](https://github.com/JernejHabjan/fuzzy-waddle/issues/816) | Runtime matrix and CI          | [Runtime matrix and CI](runtime-matrix-ci.md)                   | #815 by scenario family                        |
| [#817](https://github.com/JernejHabjan/fuzzy-waddle/issues/817) | Continuous play and difficulty | [Continuous calibration](continuous-calibration.md)             | Stable SEQ runtime; baseline adapter           |
| [#818](https://github.com/JernejHabjan/fuzzy-waddle/issues/818) | Strategic debugging            | [Strategic debugging](strategic-debugging.md)                   | Committed debug projection                     |
| [#819](https://github.com/JernejHabjan/fuzzy-waddle/issues/819) | Multiplayer AI                 | [Multiplayer E2E](multiplayer-e2e.md)                           | Runtime matrix infrastructure                  |
| [#820](https://github.com/JernejHabjan/fuzzy-waddle/issues/820) | Legacy retirement              | [Legacy controller retirement](legacy-controller-retirement.md) | #816, #819, #823                               |
| [#821](https://github.com/JernejHabjan/fuzzy-waddle/issues/821) | Source structure and naming    | [Source structure cleanup](source-structure-cleanup.md)         | Runtime stabilization for persisted IDs        |
| [#822](https://github.com/JernejHabjan/fuzzy-waddle/issues/822) | Island content                 | [Island map](island-map.md)                                     | Authored map and registered capabilities       |
| [#823](https://github.com/JernejHabjan/fuzzy-waddle/issues/823) | Lifecycle compatibility        | [Lifecycle validation](lifecycle-validation.md)                 | Runtime harness; multiplayer portions use #819 |

Close a subissue only after its plan's omission audit, focused evidence, final closure audit, commit, push, and GitHub
status update are complete. Do not make product code depend on these issue plans.
