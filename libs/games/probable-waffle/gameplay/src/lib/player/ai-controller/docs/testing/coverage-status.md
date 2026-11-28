# AI coverage and follow-ups

## Delivery scope

The current single-player iteration covers purposeful economy/production, both-faction victory and recovery, placement/expansion/walls, command/resource ownership, scouting and strategic decision controls. The legacy player strategy tree is retired. This does not certify every registered scenario, real-peer multiplayer, complete save/load continuation, exact replay determinism or difficulty ordering.

The gameplay reliability batch addressed local save control, scene teardown, movement stability, pursuit, defense, counter production and retreat. Camera-bounded fog drawing reduced median elapsed time by 25.5% in the two measured workloads, with logical fog coverage retained (see historical commit `33b9c5680` for evidence and limits). Broader save continuation remains in #823.

`tools/probable-waffle/skirmish/ai/testing/fixtures/skirmish-scenario-manifest.json` and `tools/probable-waffle/skirmish/ai/testing/bindings/native-scenario-bindings.json` own scenario registration. The regression selection is `tools/probable-waffle/skirmish/ai/testing/fixtures/periodic-native-regression-profiles.json`; use `pnpm ai:skirmish:regression -- --list` or the scout profile's `--list` for current variants/exclusions.

## Validation closure

**Main testing priority:** [#865](https://github.com/JernejHabjan/fuzzy-waddle/issues/865), make focused scenarios
more targeted and shorter before another broad certification campaign. The [runtime guide](./runtime-e2e.md#highest-priority-focus-and-shorten-scenarios)
requires agents to flag overbroad or slow selections to the user before execution.

The 110-variant validation campaign was stopped at the user's request before complete certification.
The final temporary summary recorded 54 selected variants with matching source/fixture passes, 105 with historical
passing evidence and 110 with measured timings (including failed or older runs). These pre-closure working-tree
snapshots do not certify the subsequent review changes, current source or all 24 complete recipes.
Raw temporary reports and execution plans are retired; PR #863 retains the compact closure record.

Known unresolved focused cases include FIGHT-01 Tivara reinforced (survivors withdraw but do not complete the distant
route before the bound) and H-26 grouping/safe alternate for both factions (physical grouping and an executable safe
route remain unproven). H-10's eight-world capacity workload exceeded the new three-minute test budget in older
runs and needs a focused setup; never raise the budget or drop its controls to claim a pass. Broader evidence
follow-up remains under #816. Historical runs are not current certification.

## Strategic decision controls

Paths below are relative to the gameplay AI-controller directory. Inspect their positive and negative controls before adding another fixture.

| Decision                       | Focused source                                                                                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start useful scouting          | planning/strategy/scouting/tests/ai-scouting-admission.spec.ts, ai-scout-search-questions.spec.ts; planning/strategy/offense/tests/ai-skirmish-offense.spec.ts |
| Investigate stale intelligence | planning/adaptation/tests/ai-adaptation-manager.spec.ts; planning/tactics/orders/tests/ai-tactics-scouting.spec.ts; Phaser observation memory/coverage specs   |
| Justify air production         | planning/adaptation/tests/ai-adaptation-manager.spec.ts and ai-adaptation-scenarios.spec.ts                                                                    |
| Harass and withdraw            | planning/strategy/offense/tests/ai-skirmish-offense.spec.ts and RAID-01/02 fixtures                                                                            |
| Time upgrades                  | planning/adaptation/tests/ai-adaptation-manager.spec.ts TECH-01/02                                                                                             |
| Adapt composition/strategy     | planning/adaptation/tests/ai-adaptation-scenarios.spec.ts and offense controls                                                                                 |

## Independently resumable work

Issues contain source anchors, acceptance, constraints and known evidence. They do not require a handoff or chat history.

- Independent multiplayer work in [#819: multiplayer E2E](https://github.com/JernejHabjan/fuzzy-waddle/issues/819): real peers, reconnect, host transfer, stale commands, exact-once effects and repeated-match cleanup. Scheduled in the Multiplayer Polishing milestone, independently of the single-player AI issue.
- [#823: save/load E2E](https://github.com/JernejHabjan/fuzzy-waddle/issues/823): active paid commitments, combat, scouting, native continuation and cleanup. Exact full replay parity is outside that issue.
- [#821: source structure](https://github.com/JernejHabjan/fuzzy-waddle/issues/821): historical roadmap wording is replaced by responsibility names in comments, migration locals and coverage metadata. Scenario setup/tests and selected contracts are split into bounded owners, removing obsolete baseline entries without refreshing hashes. Stored manager/claim/effect identities remain compatible. The source-structure rule is enabled by the AI tooling lint target; the baseline still inventories other historical debt and does not imply repository-wide enforcement.
- [#815](https://github.com/JernejHabjan/fuzzy-waddle/issues/815) and [#816](https://github.com/JernejHabjan/fuzzy-waddle/issues/816): broader manifest/evidence work remains explicit; existing selected passes must not be advertised as a complete matrix.
- [#827](https://github.com/JernejHabjan/fuzzy-waddle/issues/827) and [#829](https://github.com/JernejHabjan/fuzzy-waddle/issues/829): the acceptance audit below separates implemented strategy/economy from specific enhancements and evidence gaps; do not restart old implementation plans.
- [#828](https://github.com/JernejHabjan/fuzzy-waddle/issues/828): profile only a concrete measured slowdown.
- [#822](https://github.com/JernejHabjan/fuzzy-waddle/issues/822): optional island content/transport-required worlds. No shipped flying-container capability or synthetic fixture establishes native air transport.

### Strategy and economy acceptance audit

| Issue         | Implemented and covered by focused contracts                                                                                                                                                                                                                                                                                                   | Remaining acceptance                                                                                                                                                                                                                                                                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| #827 strategy | Permitted-contact objective ranking, domain/route feasibility, local force gates, damaged-economy recovery, exposed-core finishing, failed-mission rebuilding/follow-up and saved alternatives. `select-ai-offensive-opportunity*.spec.ts` and `ai-offensive-opportunity-*.spec.ts` exercise these controls.                                   | The current assessment chooses finish/pressure/recover/scout and ranks enemy objectives. It does not provide the proposed unified comparison of expansion, containment and counter/tech against attacks, with production/reinforcement timing and opportunity cost. Keep that enhancement open; existing victory evidence does not prove optimal win timing. |
| #829 economy  | Equal 200-resource defaults, demand/capacity-driven workforce above the six-worker recovery floor, food runway, threat budgets, recovery hysteresis and finish-aware growth. `player.spec.ts`, `ai-economy-policy.spec.ts`, `ai-resource-forecast.spec.ts` and macro tests cover these contracts; workforce/posture are committed debug state. | Focused ECO-08 growth beyond six workers and the broader low-resource growth/recovery acceptance lack complete retained physical evidence. Do not interpret already-proven defaults/policy as missing implementation or restart both-faction victory work.                                                                                                   |

These are separately tracked follow-ups to the single-player delivery. Their broader acceptance is not a claim made by this PR. Source structure enforcement is active in AI tooling; historical baseline entries remain visible debt rather than a claim that every source meets the new limits.

## Execution policy

The `e2e:ai` runtime pack runs in CI on non-draft PRs to `main` via `.github/workflows/pull-request-checks.yml` (manifest-selected, parallelized per case). Local `pnpm ai:skirmish:regression`, `pnpm e2e:ai`, and `pnpm e2e:ai-full` remain documented in [testing commands](./README.md#periodic-regression-profiles). PRs to `develop` and `develop-ci.yml` do not run AI runtime matches.

Use focused causal checks before affected native confirmation. Keep one local native runner and each invocation at or below 30 minutes. Retain valid evidence and avoid unchanged full-family reruns. Missing or infrastructure-only results are not gameplay passes. PR review/readiness is separate from broader matrix certification; merging remains a user-controlled action.
