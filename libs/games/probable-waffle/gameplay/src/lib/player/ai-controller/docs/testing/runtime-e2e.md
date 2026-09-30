# Runtime E2E and pre-merge policy

## Required merge gate

Skirmish AI runtime acceptance must be executable in CI before a change merges to `develop`/`main`; it must not exist only as a one-time agent run. The required Playwright matrix should be sharded by stable scenario group while preserving one isolated game per variant. Derive shard membership from manifest support status; workflow YAML must not duplicate a hand-written scenario list.

The pre-merge gate must include every supported runtime-required manifest row. Missing fixtures, zero decisions, zero ticks, a missing terminal result, provenance mismatch or browser/runtime failure fails the gate. Unsupported future capabilities remain visible in the report and require an explicit reason.
For a victory row, an authoritative AI-player `win` is required; loss, tie, quit or a completed intermediate mode goal
cannot substitute for victory. A terminal world may stop early only after all selected victory assertions and scheduled
events are complete. The currently authored terminal-stop helper does not yet cover nonterminal focused success cases.

Pure selection also requires a passing, actually executed Jest assertion naming each requested scenario ID. The matrix
captures separate Jest JSON results for gameplay and Phaser without a cached target; a broad passing spec file or a registered fixture
with no ID-specific assertion cannot count as coverage. The compact report lists missing IDs, and the runner exits
nonzero. This contract is authored but awaits the final validation gate; existing generic test titles may need explicit
scenario names then.

Recommended CI tiers:

| Tier               | Trigger                                  | Coverage                                                                 |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------ |
| Focused            | AI pull-request iteration                | Changed unit/integration tests and affected runtime groups               |
| Required pre-merge | Merge queue or explicit release workflow | All supported runtime rows, all pure rows, coverage/provenance checks    |
| Extended           | Scheduled/manual                         | Additional seeds, stress variants, long soaks and difficulty calibration |

The pull-request workflow now derives one runtime shard per manifest group/fixture and refuses to produce a required
matrix while a supported row has no executable recipe. It skips draft PRs; making the PR ready for review enables the
gate. At present the gate is intentionally red because core runtime rows remain unmapped. The four island-only runtime
rows `DOMAIN-03`, `DOMAIN-04`, `H-29`, and `SEQ-05` are explicitly visible as `deferred_content` for optional #822.
The first three still require pure contracts; `SEQ-05` requires runtime evidence when an island map ships. Do not
remove those rows from the manifest or mistake this CI wiring for passing coverage.

The current browser driver starts a local skirmish with one human and AI players. It exercises the real lobby, Phaser
world, command bus, and shared command application, but it does not activate socket-backed multiplayer lockstep because
that path requires a relay and multiple human clients. Real peer relay, reconnect, and host-migration E2E belongs to
[#819](https://github.com/JernejHabjan/fuzzy-waddle/issues/819).
An additional, currently unrun `skirmish-ai-multiplayer-relay.spec.ts` starts two authenticated browser contexts
against a local Supabase-backed Nest API and the frozen three-spawn `MapAiMultiplayer`. Its separate
`pnpm ai:skirmish:multiplayer` runner discovers local credentials without printing them and starts the portal/API
through `playwright.multiplayer.config.ts`; the caller must first start local Supabase. The non-draft PR workflow
has a separate job for this case. This initial smoke requires a real relayed AI command and common-tick hashes,
but does not satisfy #819's reconnect, migration, lifecycle, combat or terminal obligations. It has not run yet.

The current recipes use 1× simulation speed through the first checkpoint and then their authored accelerated scale
(currently 100× for opening, production, and land-loop recipes). Accelerated scale does not imply equal wall-clock
speed: Phaser simulation, AI decisions, command application, checkpoint settling, and browser work still execute. Size
the explicit Playwright timeout for the whole selected variant group. A timeout with no runtime payload and zero
tests/decisions/ticks is an infrastructure failure, not behavioral evidence.

Use `pnpm ai:skirmish:report -- --report <artifact> --scenario <ID> --failures-only --details` for bounded triage.
For a retained sweep, isolate its artifacts in one directory, give every shard the same `--run-id`, then use
`pnpm ai:skirmish:report -- --report <directory> --repair-list --require-supported`. The output is compact JSON;
nonzero exit means a failing or missing required row. These new contracts are authored but unverified until the final gate.
Each matrix runtime artifact also writes a bounded JSON index under its report directory's `indexes/` subdirectory.
Read that index first for source/run/fixture identity, exact expected/executed/passed/failed/unexecuted counts, stop
reasons, the first failed predicate per row, and a pointer back to the retained raw artifact. An omitted-failure count
means the bounded index truncated display, never the underlying results or exit status. Indexes are kept outside the
top-level shard directory so `--repair-list` reads only complete reports. This source path is authored, unverified.
Focused positive variants may opt into `evidenceStop` only with an explicit earliest checkpoint and consecutive-stability
window. The fixture reader rejects controls and any assertion with absence, temporal, terminal or lifecycle obligations;
the browser driver also refuses to stop while a scheduled perturbation remains or any selected oracle fails. Until a
reviewed fixture opts in and the final-gate tests execute, existing recipes still run their authored ceilings.

At the final validation gate, first run the frozen open-economy map preflight with
`AI_SKIRMISH_MAP_PREFLIGHT=1 pnpm exec playwright test apps/portal-e2e/src/e2e/skirmish-ai-test-map-preflight.spec.ts --config=apps/portal-e2e/playwright.config.ts --workers=1`.
It starts an ordinary test-marked lobby, verifies the active scene and indexed neutral resources, finds open 3×3
ground patches near both starts, and requests a real ground path between them. It emits one bounded
`AI_SKIRMISH_MAP_PREFLIGHT_V1` JSON line. This is an infrastructure check, not a scenario result or proof that a
particular building placement is legal; the focused building recipes must prove that separately. The preflight is
authored but has not been executed.

Then run representative fixture preflight and manifest-selected family/map shards as one retained sweep. Reuse a
browser/server process inside a worker but isolate every game world; independent
CI workers may run separate shards. An authored, unverified `--repair-list` mode reads an isolated directory of runtime
reports and emits bounded JSON. Use `--require-supported` for the full required matrix, plus one shared `--run-id` for
manual shards; CI supplies a run ID. The reporter requires common source/run/manifest identity
and each shard's expected fixture identities/digests. Different selected fixture sets legitimately have different
aggregate digests; reject conflicts for the same identity or unexpected membership, not all differing digests. Keep
infrastructure and invalid-setup failures separate from gameplay outcomes, and show a provisional cluster keyed by
the first failed predicate plus family/map and available checkpoint evidence. Each cluster links every
affected ID/seed and one representative artifact. Diagnostic replay can select an exact authored variant and 1-based
repetition with `--scenario ID --mode runtime --variant ID --repetition N [--seed INTEGER]`. It evaluates that variant's
own oracle only and reports `diagnostic_passed` or `diagnostic_failed`; it cannot satisfy a positive/control pair,
determinism group or full matrix coverage. The repair reducer rejects diagnostic reports as coverage. Use its
`rerunScenario` command for full proof after a repair, or `rerunVariant` to isolate one failure first. Shared text is
not proof of shared cause; confirm the
earliest causal owner before editing. Rerun affected shards after a repair batch. Establish final required matrix
evidence after all repairs, tuning, optimization and legacy removal; reuse a complete passing sweep only while its
relevant source/workload inputs still match. Never drop a required row or weaken its oracle to clear a cluster.

## Authoritative focused worlds

A runtime variant may declare `presetWorld` when its invariant should not wait through unrelated opening prerequisites.
The developer-only bridge strictly validates actor names, unique fixture IDs, owners, finite in-map positions, positive
resource grants, legal production queues, source revision, and fixture digest. It then creates actors through
`SceneActorCreator`, changes resources through player-state events, and seeds authored items in the real
`QueueComponent` after catalog, tech-tree, and payment checks. `ProductionComponent` then processes those queues in
normal simulation. Setup runs after ordinary map indexing but before the first simulation tick or AI observation.
Exact starting balances may also be set through ordinary add/remove resource events after queue charges; the runner
independently reads the actual pre-tick player balances and rejects any mismatch. Seeded initial Gather orders are
ordinary pawn orders, not authored AI outputs. Map selection supplies topology; authored actors supply normal faction vision. Scheduled events are keyed to authoritative
simulation ticks. The bridge does not expose arbitrary topology rewrites, fog reveals, or clock jumps that could leak
hidden information. Unknown fields—including brain state, desired decisions, hidden knowledge, or success flags—make
the bridge fail closed.

Organize the runtime recipes by test purpose, not by implementation stage: small focused files for a behavior family
and its positive/control variants, and separate files for continuous legal-start matches. Reuse a recipe across IDs
only when the same setup and independent oracle genuinely prove each ID. Keep the generic Playwright driver thin;
split scenario evaluators and setup helpers by stable responsibility rather than growing one switch or fixture file.
The manifest remains the only ID-to-recipe registration authority.

Every focused browser recipe should explicitly declare the minimal legal starting world needed for its assertion:
map/topology, actor types/owners/positions, exact relevant resource balances, and any necessary ordinary production
queue, starting order or timed opponent event. Include other player state only through a validated authoritative game
service; do not inject AI memory, hidden information, a desired decision or a success flag. If a focused case truly
needs an unpreset natural opening, record that reason and its measured deadline as an exception. Continuous-match
recipes deliberately start from normal game state and prove the entire opening-to-result chain.
Positive/control pairs keep the same seed and legal starting state except for the causal variable being tested.

Use validated recipe metadata for execution kind (`focused_preset`, justified `focused_natural`, or `continuous`),
variant role (subject/control where applicable), and the reason for a focused deadline above 2,000 ticks. The
generated scenario catalog must derive, for each registered runtime row, that kind, linked variant/fixture,
starting-state summary, positive/control run counts, map, tick deadline and exception rationale from recipe data.
It must show missing setup as missing rather than infer it from requirement prose. Do not hand-edit generated rows
or copy fixture state into another maintained table.
The current metadata contract and catalog variant table are authored but unverified; subject/control pairs now declare
one pair ID and matching seed, map and scenario membership. Existing multi-run focused variants remain migration work.
Catalog output reports registration and declared budgets, never an executed pass.

Scripted opponent pressure remains a real deterministic human command. It may select attacker object names and a target
object name, but combat and AI response remain authoritative Phaser behavior. A focused producer-loss fixture may instead
apply scheduled lethal damage through the real HealthComponent. The runner must observe a later producer-count drop and
recovery; the event cannot mark the AI's decision or outcome as successful.
The existing focused recipes often run three isolated repetitions; this is migration debt, not the target for every
pre-merge case. A positive/control pair is two causal worlds, not a request for three repetitions of each. Preserve
an isolated world per variant. Where repetition is required, compare the initial-world digest and independently
evaluated outcome signature. Opaque command IDs, exact accelerated-frame combat totals, and unrelated behavior are
excluded; a changed acceptance milestone remains a deterministic failure.

The first retained focused proofs are:

| Scenario             | Causal setup and independent result                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `DOMAIN-06`          | Real slingers engage real Banshees; squad membership and observed target establish compatible combat  |
| `RAID-02`            | A legal air raid is engaged and the surviving force redirects to a different objective                |
| `PRO-05`             | Scheduled lethal damage removes a Tivara producer; its count drops and returns in three runs           |
| `SCOUT-05`           | Two distinct unseen Banshee positions yield identical committed enemy facts and decisions             |

The Skaduwee producer-loss experiment on River Crossing is retained as a diagnostic report, not a passing `PRO-05`
variant: its starting world has three military producers and late-game worker attrition, so it does not isolate the
two-producer replacement invariant. Full-faction production coverage remains in the natural `PRO-01–04/06–07` rows.

Runtime reports retain `execution.wallMs` and `execution.processStarts` alongside decision and tick counts. Use these
fields when comparing a focused case to its natural-map counterpart; do not infer a speedup from simulated ticks alone.
For a paired performance investigation, set `AI_SKIRMISH_PROFILE=1` on the same matrix command before and after the
change. Optional variant timing separates lobby/setup, simulation advance, decision settle, checkpoint capture,
perturbations, and supported browser long tasks; the compact reporter gives play milliseconds per 1,000 ticks and
`--details` shows per-checkpoint phases. Profiling data is excluded from outcome digests and AI decisions. Use the
same seed, map, faction, profile, checkpoint schedule, browser/machine conditions and at least three repeats.

Economy checkpoints also retain ready housing capacity, current population, catalog-priced queued population, and
ready housing actor names. The authored ECO-07 preset pairs a real five-item queue above the initial capacity with an
otherwise comparable ample-housing control. The positive branch must independently observe a completed Olival gain;
the control must not construct another while its queued demand fits. Both branches repeat three times. This fixture is
registered but has not yet been executed or proven in the browser.

The authored ECO-01/02 preset pairs an underserved visible Tree1 with the same forest already served by a local
WorkMill. A remote owned WorkMill remains in both worlds: the positive branch must apply a resource-service command
and complete another WorkMill within ten observed tiles of the source, while the control must not duplicate its local
service. Each branch repeats three times; this recipe and its oracle are unexecuted until the final validation gate.

The authored ECO-03 preset gives two workers ordinary pre-tick Gather orders to the same definition-backed,
two-slot tree and leaves a third worker available. The runtime oracle uses authoritative fixture-to-actor IDs,
not prefab names or debug intent text: it requires an observed full source, no overassignment, and an actual
Gather order to another observed wood source. Exact pre-tick stockpiles make wood the scarce resource. These are
starting-world orders, not AI decisions or substituted brain outcomes. This recipe and its oracle are unexecuted
until the final validation gate.

ECO-08 retains both natural 200-resource faction openings and adds a focused Tivara growth variant with six real
workers, two finished Fields and a Granary. Its exact 200-resource starting balance is checked before tick zero;
the oracle requires at least seven observed workers by tick 3,000, retains seven at the final checkpoint, and
observes delivered income. Three isolated repetitions are authored but unexecuted until the final gate.

A natural-map control that cannot satisfy a focused invariant is not an equivalent correctness oracle or a performance
baseline. Record that outcome in its issue/handoff without claiming a speedup. The focused fixture remains the
authoritative `PRO-05` replacement proof; natural recovery behavior remains runtime/strategy work under #816/#827.

Keep natural lobby/map variants for emergent openings, terminal play, calibration, and soaks. Focused presets complement
those matches and must never replace an invariant whose outcome depends on discovering an unauthored world naturally.

## Tick budgets, repetitions and seeds

The authoritative simulation interval is 50 ms: 20 ticks are one simulated second, 2,400 ticks are two simulated
minutes, and 12,000 ticks are ten simulated minutes. Acceleration changes wall time, not the number of simulated
ticks or the amount of gameplay work. Record both tick count and wall time.

- Focused preset-world browser cases should normally finish within 200–2,000 ticks (10–100 simulated seconds).
  A longer focused deadline needs measured construction/travel/combat latency and a written reason in its recipe;
  do not skip real production, movement or combat merely to meet a budget. Stop at the earliest authoritative
  acceptance milestone rather than waiting for a distant final checkpoint.
- The current runner always advances through every authored checkpoint. #816 must add optional stop-on-evidence for
  focused cases before broad fixture expansion: evaluate independently captured authoritative outcomes at settled
  checkpoints, stop only after every selected positive requirement is satisfied and no required scheduled event or
  observation horizon remains, then record the stop tick/reason. A negative control, absence assertion, liveness
  window or continuous match must keep its required horizon. Early stop never converts a missing terminal result,
  missing checkpoint, or unobserved effect into a pass.
  A positive milestone with later cleanup, retention or no-duplicate obligations must finish that stability window.
  A shared variant can stop only when every selected scenario's obligations are complete; continuous matches can
  finish at their authoritative terminal result.
- Run each positive and control variant once in ordinary PR and required pre-merge coverage. For a scenario whose
  acceptance explicitly includes repeatability, use at least two identical-start runs and compare normalized
  decisions, initial-world and outcome digests, reporting the first differing path. Put additional repeats and
  seed sweeps in scheduled/manual extended coverage. A single run proves a behavior on that seed, not determinism.
- Existing recipes with three repetitions and broad 12,000-tick schedules are not yet migrated. #816 must change
  the fixture counts and the `determinismGroup` evaluator contract together, then verify that one-run cases still
  fail on missing/incorrect outcomes and two-run cases still fail on divergence. Do not silently weaken an existing
  determinism assertion to save runtime.
- Keep hand-maintained TS/JS/MJS test and catalog-tool files at or below 400 non-comment lines, methods at or below
  200 non-comment lines, and lines at or below 140 columns. Wrap hand-maintained fixture JSON to the same 140-column
  style; split large behavior families instead of packing unrelated variants into one file. Do not refresh
  source-structure baselines to hide size.
- Keep a small continuous-match execution tier for its existing manifest scenarios, from legal starts. It may take
  longer than two simulated minutes:
  set each full-match deadline from measured victory/recovery behavior, retain a finite bound and mandatory terminal
  result, and report why any increase over the current 12,000-tick SEQ request ceiling is necessary. A longer match
  must not substitute for missing focused coverage or make a losing AI appear to pass.
- Cover representative factions/sides and seeds 1–5 on authored maps in extended runs; expand selected stress cases
  to seeds 1–20. Difficulty calibration uses 20 paired seeds, up to 100 if uncertainty remains material. At least
  three 60-minute-simulation soaks cover large armies, depleted resources, effects and lifecycle recovery in the
  scheduled/manual tier, not every PR. Freeze holdout seeds and thresholds before release evaluation.

## Runtime coverage families

- Legal opening, sustainable income, supply and purposeful production.
- Useful duplicate units, producers, houses and resource-service structures.
- Scouting, knowledge aging, attacks, raids, defense, retreat, regroup and continuing pressure.
- Composition changes, research, counters, support, overkill and casualty accounting.
- Land, air, naval and transport handoff where the shipped catalog and authored map support them.
- Expansion, placement, walls, towers, stairs, breach recovery and friendly clearance.
- Resource depletion, worker/producer loss, queue cancellation and causal recovery.
- Save/load, host transfer, late events, terminal cleanup and a second match.
- Multiple AI players/opponents, player-local identity and contention.
- Debug panel/capture enabled-versus-disabled outcome parity.
- Terminal/liveness, bounded memory and decision-work budgets.

## Known content dependency

There is currently no shipped island map. Island-expansion and island-transport victories cannot provide honest real-map E2E evidence yet. Keep those variants explicitly blocked by map content, retain pure/domain integration coverage, and activate their Playwright rows when an island map is authored.
