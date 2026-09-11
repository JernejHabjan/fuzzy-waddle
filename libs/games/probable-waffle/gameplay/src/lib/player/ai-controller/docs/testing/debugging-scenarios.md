# Debug workbench — explain, capture, replay and compare

The panel stays read-only in ordinary matches. These requirements give developers a reproducible investigation workflow; they do not permit arbitrary network mutation commands. See the [debugging workbench](../debugging/README.md).

## One workflow for a bad decision

1. Select player/goal/actor and inspect **why this / why not that** from the recorded decision.
2. Locate the first overdue progress milestone, rejected prerequisite, exhausted resource/slot or changed evidence in the causal timeline.
3. Capture a versioned reproduction bundle with its exact source/map/profile provenance.
4. Replay in an isolated local test session; step by simulation tick or completed AI decision, set a safe named breakpoint and inspect actual applied outcomes.
5. Compare the original and repaired run at the first divergent field/decision and rerun the responsible scenario plus relevant continuous match.

Steps 4–5 must never change the live match. This design transfers the observation/action/step and versioned replay principle from [Blizzard's SC2 API protocol documentation](https://github.com/Blizzard/s2client-proto/blob/master/docs/protocol.md), not its privileged debug execution into player controls.

## Live read-only investigation

Extend AiDebugSnapshotV1 with bounded causal summary indexes and diagnostic completeness flags. Support filters for player, base, goal, demand, actor, command, reason/severity and tick range. Selecting a plan links its economic obligation, prerequisite chain, squad/route, command outcome and useful progress.

“Why not attack/build/counter?” must identify the actual rejection boundary: no permitted evidence; no useful candidate; generator not serviced; prerequisite/route pending; demand already fulfilled; resource/actor conflict; profile/mission limit; utility loss; application rejected; or outcome unresolved. Use recorded facts and proposer counters, not a second live planner call. If the bounded trace omitted an alternative, display **not recorded**, not an invented explanation.

Add timelines for:

- actual versus expected delivered income and production readiness;
- mission assemble/launch/effect/retreat/recovery and loss/reinforcement events;
- observation/evidence age and profile reconsideration delay;
- reserve/dispatch/apply/complete/cancel, unresolved outcome age and authority epoch;
- blocker/dependency/lease changes and actual progress versus deadline;
- measured work quotas and optional wall-time performance diagnostics, excluded from decisions.

Map overlays include real clearance/route rejection, protected asset/pursuit leash, candidate construction/field space, tower **marginal** coverage and enemy opening paths, observation age, scout questions, squad/reinforcement corridors and transport pickup/landing. Use recorded bounded planning data. No overlay may run extra AI/pathfinding work or expose hidden live enemies to ordinary players.

## Freeze, step and breakpoint semantics

| Surface/action                     | Behavior                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Live Freeze view / history step    | Changes displayed snapshot only; simulation continues normally                                                                                         |
| Live alert/bookmark                | Records a diagnostic marker on a completed boundary; never globally pauses multiplayer                                                                 |
| Offline Step tick / Step decision  | Advances the isolated test simulation through normal shared commands; awaits a safe completed boundary                                                 |
| Offline breakpoint                 | Stops that isolated simulation on a named event/predicate, such as duplicate effect, progress overdue, mission cancelled or selected command rejection |
| Offline what-if                    | Clones permitted observation/brain/RNG/config into a separate pure evaluation; compares proposals without dispatch; clearly labeled hypothetical       |
| Live profile/seed/resource editing | Not provided; profile choice remains lobby configuration and saved authority                                                                           |

Breakpoint/filter configuration uses validated enums/typed comparisons over allowed fields, with count/work limits. Never eval arbitrary code from UI or imported JSON. Continuing an offline case must preserve its exact scheduler/order state; a counterfactual does not mutate the captured original or become proof of actual world outcomes.

## Two capture types, explicitly labeled

**Decision bundle:** permitted observation, prior brain state, ordered relevant outcomes, profile/config versions, seed/RNG state, schema IDs, tick/epoch and bounded causal trace. Enough to replay the pure decision. It must not pretend to reproduce complete physics/path/economy execution.

**Runtime bundle:** authoritative safe checkpoint plus pending command/application state, subsequent input/event log, AI state, exact map/asset/data/engine/source versions and environment manifest. Needed for actual movement, combat, transport, topology and save divergence. This can contain confidential full-world information: host/developer access only, never broadcast to players or silently uploaded.

Capture from a safe completed simulation boundary using the existing save/command/hash seam; no half-serialized Promise or live Phaser reference. If the necessary checkpoint/history was evicted, mark the bundle incomplete with missing ranges and refuse an “exact replay” claim. Retain history truncation counts.

Implement a validated AiReproBundleV1 manifest with: bundle kind, schema, source revision plus dirty-source digest, map/content digests, config/profile/archetype versions, difficulty, faction/player/rules, tick interval/epoch, snapshot/input references and digests, expected checkpoints, scenario/case ID, diagnostics completeness and privacy classification. Separate display metadata from canonical replay inputs.

Default bounded capture: one automatic incident capture per causal episode, at most five retained incident bundles within a configurable 64 MiB session quota. Do not silently upload or trigger repeated browser downloads; retain locally through supported storage or show explicit manual export. Full data too large for the cap needs user-initiated file export with size warning or an incomplete diagnostic summary, not silently dropped replay inputs. Keep unresolved authoritative command records outside this disposable diagnostic quota.

## CLI and artifact integration

Extend the existing planned tools/ai/run-skirmish-matrix.mjs rather than creating a parallel simulator:

- `--replay-bundle <path> --until-tick <n>`: validate kind/version/digests, resolve exact compatible sources/assets and execute to a safe boundary.
- `--replay-bundle <path> --break-on <named-condition>`: isolated bounded stepping; noninteractive mode emits breakpoint artifacts and exits with a documented diagnostic status, not an endless wait.
- `--compare-bundle <original> --with-bundle <candidate>`: show first differing tick, canonical field path, expected/actual value, goal/intent/outcome and source/config differences. A different config is a changed-input comparison, not nondeterministic replay.
- `--replay-bundle <path> --emit-fixture <task-output-path>`: emit a data-only draft fixture/provenance manifest for review; don't auto-update goldens or silently edit the committed suite.

These are implementation requirements, not commands claimed to exist now. Respect explicitly chosen input/output paths; reject unsafe archive traversal, executable payloads, unsupported versions, oversized data and broken digests. Render imported labels as text, never HTML. Compatible version migration must be explicit and preserve original inputs; missing assets/source report a reproducibility blocker instead of using today's defaults.

For a repair, compare command and AI digests, authoritative outcomes and independent semantic assertions. Provide “why changed?” facts: input/config changed, legal candidate added, demand reconciled, policy changed, or first ordering divergence. Win rate alone cannot diagnose a regression.

## Ownership, usability and verification

- Pure debug contracts own typed manifests, trace completeness, cause indexes and parsing.
- Runtime adapters own capture/replay/application boundaries and real-world checkpoints.
- Planning managers own recorded why-not alternatives and domain-specific causal facts.
- Phaser UI owns bounded presentation, overlays, keyboard behavior and cleanup.
- Playwright owns reproduction round trips, debug parity, overflow/player switching and two-match lifecycle.

Use the existing debug entry point; the isolated workbench may be a developer/test-only route backed by the runtime scenario bridge, not a new ordinary lobby feature. UI action labels must distinguish view history from simulation stepping. Expensive strings/indexes are lazy and bounded; diagnostic exceptions cannot stop the controller. Browser QA must demonstrate one real repeated-building or stalled-attack case from selection through capture, replay, comparison and a passing repaired scenario.

| ID     | Required evidence                                                                                                                                       |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DBG-01 | Real incident captures and reproduces pure decision and applicable full runtime outcome with exact provenance; truncated capture cannot claim exactness |
| DBG-02 | Why-not lookup distinguishes not evaluated/not recorded/rejected/unresolved; no live planner mutation or fabricated alternative                         |
| DBG-03 | Offline tick/decision step and named breakpoint stop at safe reproducible boundaries; live history/bookmark never pauses/mutates multiplayer            |
| DBG-04 | Different input/config labeled correctly; same-input divergence reports first field; isolated what-if leaves original state/RNG unchanged               |
| DBG-05 | Malformed/oversized/version-mismatched/traversal/HTML payloads rejected or rendered safely; hidden runtime bundle is access-controlled                  |
| DBG-06 | Capture quota/history truncation/scene disposal stay bounded; debug shown/hidden/exporting/filtering gives identical gameplay/AI outcomes               |

These six cases join the twelve classic RTS/difficulty cases and the prior 103: **121 named cases**, before paired/seed/runtime variants. Record responsible symbol, persistence owner, command and evidence for each ID in the executable manifest/report.
