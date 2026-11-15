# AI coverage and follow-ups

## Delivery scope

The current single-player iteration covers purposeful economy/production, both-faction victory and recovery, placement/expansion/walls, command/resource ownership, scouting and strategic decision controls. The legacy player strategy tree is retired. This does not certify every registered scenario, real-peer multiplayer, complete save/load continuation, exact replay determinism or difficulty ordering.

The gameplay reliability batch addressed local save control, scene teardown, movement stability, pursuit, defense, counter production and retreat. Camera-bounded fog drawing reduced median elapsed time by 25.5% in the two measured workloads, with logical fog coverage retained (see historical commit `33b9c5680` for evidence and limits). Broader save continuation remains in #823.

`tools/probable-waffle/skirmish/ai/testing/fixtures/skirmish-scenario-manifest.json` and `tools/probable-waffle/skirmish/ai/testing/bindings/native-scenario-bindings.json` own scenario registration. The regression selection is `tools/probable-waffle/skirmish/ai/testing/fixtures/periodic-native-regression-profiles.json`; use `pnpm ai:regression -- --list` or the scout profile's `--list` for current variants/exclusions.

Historical execution logs and raw run-evidence ledgers are preserved in Git history.

## Strategic decision controls

Paths below are relative to the gameplay AI-controller directory. Inspect their positive and negative controls before adding another fixture.

| Decision                       | Focused source                                                                                                           |
|--------------------------------|--------------------------------------------------------------------------------------------------------------------------|
| Start useful scouting          | planning/strategy/scouting/ai-scouting-admission.spec.ts, ai-scout-search-questions.spec.ts, ai-skirmish-offense.spec.ts |
| Investigate stale intelligence | planning/adaptation/ai-adaptation-manager.spec.ts, ai-tactics-scouting.spec.ts; Phaser observation memory/coverage specs |
| Justify air production         | planning/adaptation/ai-adaptation-manager.spec.ts, ai-adaptation-scenarios.spec.ts                                       |
| Harass and withdraw            | planning/strategy/offense/ai-skirmish-offense.spec.ts and RAID-01/02 fixtures                                            |
| Time upgrades                  | planning/adaptation/ai-adaptation-manager.spec.ts TECH-01/02                                                             |
| Adapt composition/strategy     | planning/adaptation/ai-adaptation-scenarios.spec.ts and offense controls                                                 |

## Independently resumable work

Issues contain source anchors, acceptance, constraints and known evidence. They do not require a handoff or chat history.

- Independent multiplayer work in [#819: multiplayer E2E](https://github.com/JernejHabjan/fuzzy-waddle/issues/819): real peers, reconnect, host transfer, stale commands, exact-once effects and repeated-match cleanup. Scheduled in the Multiplayer Polishing milestone, independently of the single-player AI issue.
- [#823: save/load E2E](https://github.com/JernejHabjan/fuzzy-waddle/issues/823): active paid commitments, combat, scouting, native continuation and cleanup. Exact full replay parity is outside that issue.
- [#821: source structure](https://github.com/JernejHabjan/fuzzy-waddle/issues/821): folder/source naming and lint enforcement are delivered. Remaining debt includes old stage-based comments/local names, diagnostic labels and baselined oversized files; stored manager/claim/effect identities need compatibility-safe changes.
- [#815](https://github.com/JernejHabjan/fuzzy-waddle/issues/815) and [#816](https://github.com/JernejHabjan/fuzzy-waddle/issues/816): broader manifest/evidence work remains explicit; existing selected passes must not be advertised as a complete matrix.
- [#827](https://github.com/JernejHabjan/fuzzy-waddle/issues/827) and [#829](https://github.com/JernejHabjan/fuzzy-waddle/issues/829): the acceptance audit below separates implemented strategy/economy from specific enhancements and evidence gaps; do not restart old implementation plans.
- [#828](https://github.com/JernejHabjan/fuzzy-waddle/issues/828): profile only a concrete measured slowdown.
- [#822](https://github.com/JernejHabjan/fuzzy-waddle/issues/822): optional island content/transport-required worlds. No shipped flying-container capability or synthetic fixture establishes native air transport.

Difficulty calibration was cancelled in [#817](https://github.com/JernejHabjan/fuzzy-waddle/issues/817). Existing configuration/fairness tests remain; D-06 comparisons, difficulty-order campaigns and calibration soaks are not queued.

### Strategy and economy acceptance audit

| Issue         | Implemented and covered by focused contracts                                                                                                                                                                                                                                                                                                   | Remaining acceptance                                                                                                                                                                                                                                                                                                                                         |
|---------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| #827 strategy | Permitted-contact objective ranking, domain/route feasibility, local force gates, damaged-economy recovery, exposed-core finishing, failed-mission rebuilding/follow-up and saved alternatives. `select-ai-offensive-opportunity*.spec.ts` and `ai-offensive-opportunity-*.spec.ts` exercise these controls.                                   | The current assessment chooses finish/pressure/recover/scout and ranks enemy objectives. It does not provide the proposed unified comparison of expansion, containment and counter/tech against attacks, with production/reinforcement timing and opportunity cost. Keep that enhancement open; existing victory evidence does not prove optimal win timing. |
| #829 economy  | Equal 200-resource defaults, demand/capacity-driven workforce above the six-worker recovery floor, food runway, threat budgets, recovery hysteresis and finish-aware growth. `player.spec.ts`, `ai-economy-policy.spec.ts`, `ai-resource-forecast.spec.ts` and macro tests cover these contracts; workforce/posture are committed debug state. | Focused ECO-08 growth beyond six workers and the broader low-resource growth/recovery acceptance lack complete retained physical evidence. Do not interpret already-proven defaults/policy as missing implementation or restart both-faction victory work.                                                                                                   |

These are separately tracked follow-ups to the single-player delivery. Their broader acceptance is not a claim made by this PR. Source structure enforcement is active; lint exemptions remain visible debt rather than a claim that every historical file meets the new limits.

## Execution policy

Automatic AI regression/matrix jobs and tag triggers are commented out. Manual dispatch remains available when the dedicated workflow is registered on the default branch. Local `pnpm ai:regression` and its scout profile remain usable; the strict `RUN_AI_REGRESSION=true` E2E hook is documented in [testing commands](./README.md#periodic-regression-profiles). Repository variables and tags alone cannot activate commented jobs. Do not re-enable them without a new request.

Use focused causal checks before affected native confirmation. Keep one local native runner and each invocation at or below 30 minutes. Retain valid evidence and avoid unchanged full-family reruns. Missing or infrastructure-only results are not gameplay passes. PR review/readiness is separate from broader matrix certification; merging remains a user-controlled action.
