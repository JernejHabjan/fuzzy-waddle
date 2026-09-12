# #759 follow-up implementation plans

Each open subissue has one cold-start plan. The GitHub issue owns status and discussion; its linked file owns the
implementation route, source anchors, evidence, and completion boundary. Product behavior remains documented beside the
AI controller.

| Issue                                                           | Responsibility                 | Plan                                                            | Dependency                                      |
| --------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------- | ----------------------------------------------- |
| [#824](https://github.com/JernejHabjan/fuzzy-waddle/issues/824) | Agent verification tooling     | [Verification tooling](agent-verification-tooling.md)           | First prerequisite                              |
| [#825](https://github.com/JernejHabjan/fuzzy-waddle/issues/825) | Domain and transport coverage  | [Domain/transport](domain-transport-coverage.md)                | #824; coordinate #815/#816 family slices        |
| [#815](https://github.com/JernejHabjan/fuzzy-waddle/issues/815) | Pure scenario coverage         | [Deterministic scenarios](deterministic-scenarios.md)           | #824                                            |
| [#816](https://github.com/JernejHabjan/fuzzy-waddle/issues/816) | Runtime matrix and CI          | [Runtime matrix and CI](runtime-matrix-ci.md)                   | #824; #815 by scenario family                   |
| [#817](https://github.com/JernejHabjan/fuzzy-waddle/issues/817) | Continuous play and difficulty | [Continuous calibration](continuous-calibration.md)             | #824; stable SEQ runtime; baseline adapter      |
| [#818](https://github.com/JernejHabjan/fuzzy-waddle/issues/818) | Strategic debugging            | [Strategic debugging](strategic-debugging.md)                   | #824; committed debug projection                |
| [#819](https://github.com/JernejHabjan/fuzzy-waddle/issues/819) | Multiplayer AI                 | [Multiplayer E2E](multiplayer-e2e.md)                           | #824; runtime matrix infrastructure             |
| [#820](https://github.com/JernejHabjan/fuzzy-waddle/issues/820) | Legacy retirement              | [Legacy controller retirement](legacy-controller-retirement.md) | #824, #816, #819, #823                          |
| [#821](https://github.com/JernejHabjan/fuzzy-waddle/issues/821) | Source structure and naming    | [Source structure cleanup](source-structure-cleanup.md)         | #824; run bounded slices when they unblock work |
| [#823](https://github.com/JernejHabjan/fuzzy-waddle/issues/823) | Lifecycle compatibility        | [Lifecycle validation](lifecycle-validation.md)                 | #824; multiplayer portions use #819             |

Close a subissue only after its plan's omission audit, focused evidence, final closure audit, commit, push, and GitHub
status update are complete. Triage the resolved plan: migrate enduring knowledge into owning code/docs/tests, update
external links, and remove temporary TODO/history material when no active consumer needs it. Do not make product code
depend on these issue plans.

Optional [#822](https://github.com/JernejHabjan/fuzzy-waddle/issues/822) and its [island-map plan](island-map.md) are not
part of the #759 dependency graph or PR #814 merge gate.
