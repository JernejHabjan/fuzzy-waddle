# AI coverage and follow-ups

## Delivery scope

The current single-player iteration covers purposeful economy/production, both-faction victory and recovery,
placement/expansion/walls, command/resource ownership, scouting and strategic decision controls. The legacy player
strategy tree is retired. This does not certify every registered scenario, real-peer multiplayer, complete save/load
continuation, exact replay determinism or difficulty ordering.

New user playtest reports require a scoped gameplay/performance rework. Its
[active handoff](../../../../../../../../../../docs/ai/759-ai-gameplay-reliability/HANDOFF.md) owns the current acceptance;
the retained results below do not resolve those reports. Human-control/elevation restoration is included in that
batch; broader multiplayer/save continuation and difficulty calibration retain their exclusions below.

`tools/probable-waffle/skirmish/ai/testing/fixtures/skirmish-scenario-manifest.json` and `tools/probable-waffle/skirmish/ai/testing/bindings/native-scenario-bindings.json` own scenario registration. The regression
selection is `tools/probable-waffle/skirmish/ai/testing/fixtures/periodic-native-regression-profiles.json`; use `pnpm ai:regression -- --list` or the scout profile's
`--list` for current variants/repetitions/exclusions. A registered recipe is authored coverage, not execution evidence.
Keep proposal selection, arbitration admission, native application and useful physical effect distinct.

## Retained evidence

These results identify tested historical source/fixtures. They are not blanket certification of later revisions.
Raw local reports may live only in ignored `tmp/`; remote artifacts have normal retention limits. Preserve relevant
source/fixture identity when using a report and rerun only the affected invariant when later changes invalidate it.

| Coverage | Evidence and limits |
| --- | --- |
| Core periodic regression | Seven selected land cases passed locally in 25m27s and remotely in [run 41249184852](https://github.com/JernejHabjan/fuzzy-waddle/actions/runs/41249184852) at d6ddd363a. Includes PLACE-03 completion for both factions, WALL-01 Skaduwee terrain/no-value pair, H-13 Skaduwee new identity and SEQ-01 victory for both factions. This is selected diagnostic coverage, not all-family certification. |
| SCOUT-02 periodic regression | Complete both-faction family and hidden-position/health/queue pairs passed in [run 41284467090](https://github.com/JernejHabjan/fuzzy-waddle/actions/runs/41284467090), following profile integration at e9789ce05. Separate from the core profile. |
| SCOUT-02 original family | Report 1793446488003-passed: 10/10 variants, 1,200 decisions, 24,010 ticks, 23m10s; fixture fnv1a32:c1a463c0 and source digest fnv1a32:b02a039e. Physical investigation, confidence aging and hidden-state fairness controls pass. |
| Placement/recovery | PLACE-03 both-faction layout/concurrency/completion/loss; completion reports 1793328176798 and 1793328339115, loss 1793328568541. H-11 reports 1793316324413/1793316467854 and builder-loss control at 76bec1347. |
| Walls/expansion | WALL-01 useful-effect reports 1793320599420/1793327749131, no-value control 1793321331730. Expansion withdrawal 1793329609190/1793329761479 and combat-resolved 1793329279497/1793329456393; fixture fnv1a32:48f86832 at c31e56b1dc91. |
| Ownership | Retained H-06/07/H-10 controls; H-13 Skaduwee report 1793300480186. Tivara 1793300103293 required an evaluator correction; that correction is not a fresh native pass. |
| Victory/recovery | SEQ-01 reports 1793395964724/1793396116011 establish both-faction wins. SEQ-02 Tivara 1793396298669 wins; Skaduwee 1793395560564 recovery was established by temporal re-evaluation, not a fresh run. Source 74c05b455084 plus fnv1a32:1cdae123; fixture fnv1a32:5406a5d4. |
| Justified air | DOMAIN-05 report 1793447721151-passed: six native exposed-value, observed anti-air and no-value branches. |
| Harassment | RAID-01 report 1793453795782-passed: 8/8 both-faction targets/controls, 960 decisions, 19,208 ticks, 17m21s; fixture fnv1a32:164d5d1c, source fnv1a32:4542cb24. |
| Upgrade timing | TECH-01 report 1793446778377-passed: Tivara small/mass controls defer or complete the useful upgrade once; source fnv1a32:62b2edfa. |
| Composition adaptation | STRAT-05 full family 1793454820881-failed had one over-narrow evaluator predicate. Focused correction and selected replay 1793455109552-diagnostic_passed support the response; they do not recertify the full family. |
| Save/next match | H-31 reports 1793402499466/1793402579687 establish exact restoration/first input and initial continuing work; later physical observations diverge. They predate the restored-hit fix at 90e8d711a. H-32 includes Skaduwee next-match report 1793333000870. Further continuation coverage belongs to #823. |

The last detailed pre-retirement evidence ledger is retained in Git at b20459766. Its historical counts and run
instructions are not current policy. Local scout-profile retries stopped with ENOSPC before assertions; the complete
remote scout run supplies the retained family evidence. No new native match is implied by documentation cleanup.

## Strategic decision controls

Paths below are relative to the gameplay AI-controller directory. Inspect their positive and negative controls before
adding another fixture. Native limits are in the table above.

| Decision | Focused source |
| --- | --- |
| Start useful scouting | planning/strategy/scouting/ai-scouting-admission.spec.ts, ai-scout-search-questions.spec.ts, ai-skirmish-offense.spec.ts |
| Investigate stale intelligence | planning/adaptation/ai-adaptation-manager.spec.ts, ai-tactics-scouting.spec.ts; Phaser observation memory/coverage specs |
| Justify air production | planning/adaptation/ai-adaptation-manager.spec.ts, ai-adaptation-scenarios.spec.ts |
| Harass and withdraw | planning/strategy/offense/ai-skirmish-offense.spec.ts and RAID-01/02 fixtures |
| Time upgrades | planning/adaptation/ai-adaptation-manager.spec.ts TECH-01/02 |
| Adapt composition/strategy | planning/adaptation/ai-adaptation-scenarios.spec.ts and offense controls |

## Independently resumable work

Issues contain source anchors, acceptance, constraints and known evidence. They do not require a handoff or chat history.

- Independent multiplayer work in [#819: multiplayer E2E](https://github.com/JernejHabjan/fuzzy-waddle/issues/819): real peers, reconnect, host transfer,
  stale commands, exact-once effects and repeated-match cleanup. Scheduled in the Multiplayer Polishing milestone,
  independently of the single-player AI issue.
- [#823: save/load E2E](https://github.com/JernejHabjan/fuzzy-waddle/issues/823): active paid commitments, combat,
  scouting, native continuation and cleanup. Exact full replay parity is outside that issue.
- [#821: source structure](https://github.com/JernejHabjan/fuzzy-waddle/issues/821): folder/source naming and lint
  enforcement are delivered. Remaining debt includes old stage-based comments/local names, diagnostic labels and
  baselined oversized files; stored manager/claim/effect identities need compatibility-safe changes.
- [#815](https://github.com/JernejHabjan/fuzzy-waddle/issues/815) and
  [#816](https://github.com/JernejHabjan/fuzzy-waddle/issues/816): broader manifest/evidence work remains explicit;
  existing selected passes must not be advertised as a complete matrix.
- [#827](https://github.com/JernejHabjan/fuzzy-waddle/issues/827) and
  [#829](https://github.com/JernejHabjan/fuzzy-waddle/issues/829): the acceptance audit below separates implemented
  strategy/economy from specific enhancements and evidence gaps; do not restart old implementation plans.
- [#828](https://github.com/JernejHabjan/fuzzy-waddle/issues/828): profile only a concrete measured slowdown.
- [#822](https://github.com/JernejHabjan/fuzzy-waddle/issues/822): optional island content/transport-required worlds.
  No shipped flying-container capability or synthetic fixture establishes native air transport.

Difficulty calibration was cancelled in [#817](https://github.com/JernejHabjan/fuzzy-waddle/issues/817). Existing
configuration/fairness tests remain; D-06 comparisons, difficulty-order campaigns and calibration soaks are not queued.

### Strategy and economy acceptance audit

| Issue | Implemented and covered by focused contracts | Remaining acceptance |
| --- | --- | --- |
| #827 strategy | Permitted-contact objective ranking, domain/route feasibility, local force gates, damaged-economy recovery, exposed-core finishing, failed-mission rebuilding/follow-up and saved alternatives. `select-ai-offensive-opportunity*.spec.ts` and `ai-offensive-opportunity-*.spec.ts` exercise these controls. | The current assessment chooses finish/pressure/recover/scout and ranks enemy objectives. It does not provide the proposed unified comparison of expansion, containment and counter/tech against attacks, with production/reinforcement timing and opportunity cost. Keep that enhancement open; existing victory evidence does not prove optimal win timing. |
| #829 economy | Equal 200-resource defaults, demand/capacity-driven workforce above the six-worker recovery floor, food runway, threat budgets, recovery hysteresis and finish-aware growth. `player.spec.ts`, `ai-economy-policy.spec.ts`, `ai-resource-forecast.spec.ts` and macro tests cover these contracts; workforce/posture are committed debug state. | Focused ECO-08 growth beyond six workers and the broader low-resource growth/recovery acceptance lack complete retained physical evidence. Do not interpret already-proven defaults/policy as missing implementation or restart both-faction victory work. |

These are separately tracked follow-ups to the single-player delivery. Their broader acceptance is not a claim made
by this PR. Source structure enforcement is active; lint exemptions remain visible debt rather than a claim that every
historical file meets the new limits.

## Execution policy

Automatic AI regression/matrix jobs and tag triggers are commented out. Manual dispatch remains available when the
dedicated workflow is registered on the default branch. Local `pnpm ai:regression` and its scout profile remain usable;
the strict `RUN_AI_REGRESSION=true` E2E hook is documented in [testing commands](./README.md#periodic-regression-profiles).
Repository variables and tags alone cannot activate commented jobs. Do not re-enable them without a new request.

Use focused causal checks before affected native confirmation. Keep one local native runner and each invocation at
or below 30 minutes. Retain valid evidence and avoid unchanged full-family reruns. Missing or infrastructure-only
results are not gameplay passes. PR review/readiness is separate from broader matrix certification; merging remains
a user-controlled action.

## Cleanup verification

The legacy player strategy tree was removed at `7e905de1e`. The subsequent naming cleanup uses descriptive
unsuffixed AI filenames/symbols, with snapshot/contract names where an interface and implementation would collide.
Source naming does not replace validation of actual save, fixture or report inputs.

The source-layout/tooling cleanup was checked with 105 gameplay suites (632 tests), 103 Phaser controller suites
(431 tests), 16 pawn-executor suites (168 tests), 605 browser-free Playwright contract tests and 204 Node
tool/agent/skill/source-rule tests. Counts include focused reruns of repaired harness expectations. Gameplay, Phaser,
portal-e2e and AI-tool lint pass; existing warnings remain. Phaser, portal-e2e and the dedicated tooling TypeScript
checks pass. Catalog/skill/link checks, CLI regression selection and Playwright discovery cover the relocated paths.
This is contract/static evidence, not a fresh native match campaign.

Registered presets still admit exactly 579 focused native worlds. Consumers follow descriptive manifest bindings
instead of reconstructing filenames or relying on their former flat directory. An older pawn-progress test expected
timeouts to invent terminal failures; it now verifies the existing technical-fault contract, retained uncertain paid
ownership and absence of fabricated outcomes. Runtime JSON validation, native scenario branches, seeds, numeric
deadlines and gameplay policy remain unchanged.

Source-structure exemption moves require matching original hashes and equivalent parsed code after import/name
normalization. Pre-existing stale entries are not renewed; the removed stale missing-file entry is dropped.
No new size exemption is introduced. Converted tooling has its own enforced source-size lint, and oversized fixture
tests and world-authoring functions are split by responsibility.
The closure review rechecked 74 strategy/economy tests, the shared player-default test, 20 queue/drain continuation
tests and 67 tooling/rule contracts.
It repaired a Unicode parser-offset defect in source-size enforcement and package-script separator handling in the
catalog CLI. Catalog links use forward slashes and spec discovery has explicit ordering so Windows and Linux produce
the same checked-in document. Frozen JSON hashes normalize checkout line endings while retaining content checks.
Shared queue replay uses valid saved progress; drain tests cover living-credit versus dead-carrier fencing under all
campaign economy policies. Owning lint, tooling type checking, catalog consistency and skill/link checks pass.
No native match, real-peer session or full-tail save/load certification was rerun for these mechanical changes;
retained native evidence above keeps its original source/fixture limitations. The omission/closure audits cover
consumers, wire/save validation, deleted-code references, documentation links and publication scope.
