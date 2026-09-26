# Runtime E2E and pre-merge policy

## Required merge gate

Skirmish AI runtime acceptance must be executable in CI before a change merges to `develop`/`main`; it must not exist only as a one-time agent run. The required Playwright matrix should be sharded by stable scenario group while preserving one isolated game per variant. Derive shard membership from manifest support status; workflow YAML must not duplicate a hand-written scenario list.

The pre-merge gate must include every supported runtime-required manifest row. Missing fixtures, zero decisions, zero ticks, a missing terminal result, provenance mismatch or browser/runtime failure fails the gate. Unsupported future capabilities remain visible in the report and require an explicit reason.

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
gate. At present the gate is intentionally red because core runtime rows remain unmapped. The three island-only runtime
rows `DOMAIN-03`, `DOMAIN-04`, and `H-29` are explicitly visible as `deferred_content` for optional #822; their pure
contracts remain required. Do not remove those rows from the manifest or mistake this CI wiring for passing coverage.

The current browser driver starts a local skirmish with one human and AI players. It exercises the real lobby, Phaser
world, command bus, and shared command application, but it does not activate socket-backed multiplayer lockstep because
that path requires a relay and multiple human clients. Real peer relay, reconnect, and host-migration E2E belongs to
[#819](https://github.com/JernejHabjan/fuzzy-waddle/issues/819).

The current recipes use 1× simulation speed through the first checkpoint and then their authored accelerated scale
(currently 100× for opening, production, and land-loop recipes). Accelerated scale does not imply equal wall-clock
speed: Phaser simulation, AI decisions, command application, checkpoint settling, and browser work still execute. Size
the explicit Playwright timeout for the whole selected variant group. A timeout with no runtime payload and zero
tests/decisions/ticks is an infrastructure failure, not behavioral evidence.

Use `pnpm ai:skirmish:report -- --report <artifact> --scenario <ID> --failures-only --details` for bounded triage.

## Authoritative focused worlds

A runtime variant may declare `presetWorld` when its invariant should not wait through unrelated opening prerequisites.
The developer-only bridge strictly validates actor names, unique fixture IDs, owners, finite in-map positions, positive
resource grants, legal production queues, source revision, and fixture digest. It then creates actors through
`SceneActorCreator`, changes resources through player-state events, and seeds authored items in the real
`QueueComponent` after catalog, tech-tree, and payment checks. `ProductionComponent` then processes those queues in
normal simulation. Setup runs after ordinary map indexing but before the first simulation tick or AI observation.
Map selection supplies topology; authored actors supply normal faction vision. Scheduled events are keyed to authoritative
simulation ticks. The bridge does not expose arbitrary topology rewrites, fog reveals, or clock jumps that could leak
hidden information. Unknown fields—including brain state, desired decisions, hidden knowledge, or success flags—make
the bridge fail closed.

Scripted opponent pressure remains a real deterministic human command. It may select attacker object names and a target
object name, but combat and AI response remain authoritative Phaser behavior. A focused producer-loss fixture may instead
apply scheduled lethal damage through the real HealthComponent. The runner must observe a later producer-count drop and
recovery; the event cannot mark the AI's decision or outcome as successful.
Each focused deterministic variant runs three isolated repetitions. The runner compares the initial-world digest and the
scenario's independently evaluated outcome signature. Opaque command IDs, exact accelerated-frame combat totals, and
behavior unrelated to that scenario are excluded; a changed acceptance milestone remains a deterministic failure.

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

A natural-map control that cannot satisfy a focused invariant is not an equivalent correctness oracle or a performance
baseline. Record that outcome in its issue/handoff without claiming a speedup. The focused fixture remains the
authoritative `PRO-05` replacement proof; natural recovery behavior remains runtime/strategy work under #816/#827.

Keep natural lobby/map variants for emergent openings, terminal play, calibration, and soaks. Focused presets complement
those matches and must never replace an invariant whose outcome depends on discovering an unauthored world naturally.

## Repetition and seed policy

- Repeat each focused deterministic fixture three times and compare ordered decisions, authoritative hash, AI digest and first differing normalized path.
- Run representative supported runtime scenarios with seeds 1–5, mirrored sides and both factions on each available authored map.
- Expand selected stress scenarios to seeds 1–20.
- Run difficulty calibration with 20 paired seeds, expanding to at most 100 where uncertainty remains material.
- Run at least three 60-minute-simulation soaks covering large armies, depleted resources, effects and lifecycle recovery.
- Freeze final holdout seeds and thresholds before release evaluation; retain failures in the report.

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
