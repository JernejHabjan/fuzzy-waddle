# AI gameplay reliability and performance

## Resume cursor

- State: execution authorized by user **go**; R1/R2 in progress. Completed packets: **0/8**.
- Branch: `feature/759-skirmish-ai`; preparation base: `aa82c347223d63165d4ee52a8f5b31480749af81`.
- PR: [#814](https://github.com/JernejHabjan/fuzzy-waddle/pull/814), ready for review before this batch.
- Previous [ordinary CI](https://github.com/JernejHabjan/fuzzy-waddle/actions/runs/41323002450) passed that base.
  It does not establish that the newly reported gameplay defects are resolved.
- Next action: capture the normal-speed performance baseline and army-order churn; continue R2 local-player/elevation
  reproductions. Teardown repair is focused-test checked; broader lifecycle acceptance remains open.
- Latest evidence: topology shutdown regression failed before repair; three focused lifecycle tests and Phaser
  TypeScript check now pass. Logs: ignored `tmp/ai-layout/topology-{before,after,types,lint}.log`.
- Goal controller resumed by user; execution is active. Teardown repair published at `2c7844410`.
- First baseline ended: session `72969` exited 1; result file
  `tmp/ai-skirmish-runtime-results/run-Lx7H2N/runtime.json` has zero bytes. Matrix report
  `tmp/ai-skirmish-matrix/1793566924002-failed.json` is infrastructure-only (zero work), not performance evidence.
- Next diagnostic owner: T `matrix/skirmish-matrix-execution.ts` near `readRuntimeResult` (line ~288).
  Preserve subprocess exit/signal/bounded stderr when decoding fails before rerunning; current catch loses that detail.
- Offline player binding reproduced (scene controls 3 failed/1 passed before, 4 passed after). Unique-human offline
  slot sync and scene lookup repaired; Angular service 7 tests, Phaser types and both owning lints pass.
  Source-only interface types pass; full interface types expose existing fixture errors in game.component,
  game-save-codec and game-save-migration specs (log `tmp/ai-layout/player-binding-interface-types.log`).
  These remain outstanding; the touched service fixture's missing thumbnail was repaired. R2 is not closed.
- Open questions: exact triggers of order churn, retreat, missing defense, player binding and elevation drift.
  Teardown's unconditional topology notification is an identified hazard, not a completed crash reproduction.

Cold-start instruction:

> Read AGENTS.md, the applicable repo skills and this handoff. Resume the active goal at the first dependency-ready
> unfinished packet. Implement all eight packets, retain focused evidence, update this file in place, and continue
> across packet boundaries. Respect the verification budget and disabled automatic AI jobs. Do not close the goal
> on authored tests, explanations or historical CI alone.

## Goal and operating authority

Resolve the playtest-reported army order churn, excessive retreat, absent ground/air defense and counter production,
collision/formation oscillation, pursuit/attack cycling, autosave loss of human control, repeated elevation offsets
and structure-teardown crash; deliver a measured AI performance improvement while preserving game rules,
fair observation, deterministic decision contracts, save validation and human-command behavior.

- This user-requested implementation batch belongs to #759/#814. Save/load defects are required here even though
  broader continuation certification remains deferred in #823. The performance complaint activates focused #828
  investigation; it does not schedule broad soaks or an unrelated optimization platform.
- Preparation changes documentation/routing and creates the goal only. Start implementation after the next **go**.
- After go, the approved implementation includes focused regressions, short gameplay reproductions, profiling,
  owning lint/types/tests and relevant ordinary CI. Do not repeatedly request approval for this accepted work.
- Keep the selected model. No automatic model switching, subagents or new goals. Goal status stays honest.
- Existing permission to commit/push task-owned fixes on this branch continues for execution. Review coherent
  batches before committing/pushing. Do not merge, force-push, change PR readiness, or enable automatic AI CI/jobs.
  This preparation does not itself commit or push.
- Multiplayer certification, difficulty calibration, island content and broad strategy/economy feature expansion
  remain out of scope. Shared gameplay fixes must retain their existing authority/ownership contracts.
- Fix the owner across its real callers; do not add per-fixture exceptions, weaken outcomes, remove collision
  legality, disable retreat, grant resources, reveal hidden enemies or replace whole systems without causal evidence.
- Follow source-size rules. Split touched oversized responsibilities when needed; never refresh an exemption just
  to pass lint. Use `git mv` for tracked moves. Keep new game-specific helpers in the existing game namespaces.
- Report completed acceptance, findings and next boundary; omit memory/CPU usage reports. Keep updates concise.

## Eight packets and evidence ledger

States: `not_started` -> `in_progress` -> `implemented` -> `validated`. Validation needs the packet's actual acceptance
and controls. Record an evidence gap separately from a code defect. A blocker does not silently close a packet.

| Packet | Depends on | State | Evidence / next boundary |
| --- | --- | --- | --- |
| R1 Focused reproductions and baseline | none | in_progress | Teardown reproduction established; army churn and matched performance workload remain. |
| R2 Restore and teardown lifecycle | R1 relevant reproduction | in_progress | Teardown and offline human-slot binding repaired with focused controls. Full load/elevation evidence and interface fixture types remain. |
| R3 Movement and formation stability | R1 | not_started | Stable slots, yielding, arrival and bounded obstruction recovery. |
| R4 Pursuit and attack execution | R1, R3 relevant contract | not_started | Faster pursuer lands legal hits; no perpetual approach/abort cycle. |
| R5 AI mission ownership and defense | R1, R3, R4 | not_started | Calm assembly; effective ground/air defense and deliberate preemption. |
| R6 Emergency counter production | R1, R5 defender contract | not_started | Visible flyers cause useful legal anti-air output and assignment. |
| R7 Retreat and re-engagement | R1, R4, R5 | not_started | Favorable fights persist; losing fights withdraw without oscillation. |
| R8 Measured performance improvement | baseline in R1; final comparison after R2–R7 | not_started | Optimize measured owners; matched before/after proof and regression guard. |

Record each packet in its row: commit/diff identity, exact focused command, result, workload/fixture identity and
one bounded artifact pointer. Keep only the newest meaningful result and unresolved gap; Git preserves history.

## Source map

Repository-relative roots used below:

- **G:** `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/`
- **P:** `libs/games/probable-waffle/phaser/src/lib/`
- **I:** `libs/games/probable-waffle/interface/src/lib/`
- **H:** `libs/platform/game-host/src/lib/game/phaser/scene/`
- **E:** `apps/portal-e2e/src/e2e/probable-waffle/skirmish/ai/`
- **T:** `tools/probable-waffle/skirmish/ai/`

Use the existing [architecture/testing index](../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/README.md)
and [coverage record](../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/coverage-status.md).
Exact owners below are known: navigate them directly. Semantic search previously required authentication;
do not spend repeated calls rediscovering these paths or asking the user to log in for this work.

### R1 — Focused reproductions and baseline

**Owners:** E `runner/skirmish-ai-runtime-variant-runner.ts`, `runner/skirmish-ai-runtime-frame-driver.ts`;
P `entity/systems/movement-query-observation.ts`, `entity/systems/movement-completion-observation.ts`;
G `debug/`; T `testing/fixtures/skirmish-scenario-manifest.json` and existing recipe selectors.

1. Establish bounded positive/negative controls for: growing army assembly; minor damage during favorable attack;
   three flying attackers with/without one ready compatible archer; a larger army facing ground pressure;
   congested movement; faster Banshee chasing a worker; autosave/load of human control and elevated/flying actors;
   structure removal and scene shutdown. Record observed versus intended behavior, not presumed root causes.
2. Reuse captures and focused owner tests. Add only missing bounded metadata: unit's mission/order owner, old/new
   order, replacement reason, target/destination, transition tick, path-recovery cause and useful progress.
   Diagnostics must remain observation-only and detach on disposal; do not install heavy production recording.
3. Profile normal 1x gameplay with AI enabled, debug closed, fixed map/seed/actor counts and comparable opening,
   assembly/combat and multiple-AI workloads. Keep captures' overhead separate. Existing `AI_SKIRMISH_PROFILE=1`
   phase timings help triage, but accelerated test throughput is not a substitute for player-visible frame timing.
4. Retain p50/p95/p99 frame/decision costs, long tasks, path-query/order counts and simulation work. Inspect capture,
   pure planning, arbitration, dispatch, navigation, repeated cloning/debug projection and allocation only as measured.
   Freeze workload and numeric performance target before optimization, justified by baseline variance and frame budget.
5. Finish with actionable repro/test bindings, causal evidence and three comparable short baseline samples for the
   representative slow workload. Avoid building an exhaustive new scenario catalogue before starting repairs.

### R2 — Restore and teardown lifecycle

**Owners:** I `communicators/game-instance-client.service.ts`, `game-instance-client-context.ts` and adjacent specs;
H `base.scene.ts`; P `data/load-game.ts`, `world/services/scene-actor-creator.ts`,
`entity/components/representable-component.ts`, `entity/components/movement/actor-translate-component.ts`,
`prefabs/buildings/tivara/navigation-topology.events.ts`, `library/tile-under-object.ts`.

1. Trace saved player slot/user identity -> local player binding -> human controller/input -> actor ownership.
   `base.scene.ts` resolves the player by userId and its `player` getter throws when missing; LoadGame assumes that
   binding exists. Rebind the intended single-player human safely, never arbitrarily select the first player.
2. Restore world/index/controller/UI readiness in explicit order. Replace arbitrary delays only where they are
   causal; keep save schema validation, command fences and restart cleanup intact. Angular changes require tests.
3. Define editor spawn, logical world/elevation, flight height and rendered coordinates at one boundary. Load/save
   must apply projection once. Existing Representable initialization already defers to restored logical state;
   reproduce the drift across prefab creation and restoration before adding another offset adjustment.
4. Separate live structure removal from whole-scene teardown. Live removal refreshes actual neighboring topology;
   shutdown releases listeners/timers without tile/camera access. Avoid merely catching/ignoring TypeError.
5. Acceptance: manual/quick/autosave load permits selection and valid commands, restores correct ownership/camera,
   repeated load cycles cause no logical/rendered drift, and removal/shutdown/restart are exception-free. Include
   dead/missing scene resources, elevated buildings, ground/flying units and an unaffected fresh-start control.

### R3 — Movement and formation stability

**Owners:** P `entity/systems/movement.system.ts`, `movement-formation.ts`, `movement-path-execution.ts`,
`movement-tween.ts`; `world/services/movement-occupancy.service.ts`, `navigation.service.ts` and adjacent specs.

1. Give one group command stable destination slots. Preserve valid assignments when production adds members;
   do not recompute all units' positions or let per-actor async queries compete for a changing formation.
2. Use deterministic yielding/priority for conflicts and bounded progress-based wait/repath escalation.
   Current recovery waits, sidesteps, repaths and chooses fallback destinations; diagnose which transition churns.
   Distinguish temporary traffic, a permanently blocked route and an occupied final slot.
3. Define settled arrival tolerance and release reservations on cancellation/death/load/disposal. Keep static
   collision, footprints, height/stairs and domain legality authoritative; do not solve jitter by allowing overlap.
4. Acceptance: groups arrive and settle, narrow opposing traffic clears without repeated side swapping, permanent
   obstacles recover/fail within bounds, and human/AI commands retain destination intent. Measure direction changes,
   slot reassignment, path requests and arrival; a successful path query alone is insufficient.

### R4 — Pursuit and attack execution

**Owners:** P `prefabs/ai-agents/actions/pawn-agent-movement.ts`, `pawn-agent-combat.ts`,
`prefabs/ai-agents/behaviors/player-pawn-ai-controller.mdsl.ts`,
`entity/components/combat/components/attack-component.ts`, `attack-pending-hit.spec.ts`.

1. Unify approach/range/cooldown/windup/impact transitions under a retained native target/order. The pawn tree currently
   probes attack range, moves, waits for cooldown and attacks in separate branches; trace replacement/cancellation.
2. Repath pursuit only for meaningful target displacement, obstruction or lost progress. Define attack-entry/contact
   tolerance consistently with weapon geometry and existing impact rules. No free out-of-range hits or hidden tracking.
3. Acceptance: faster Banshee catches/slows to engage a slower fleeing worker and lands legal damage when feasible;
   an equally fast escaping or unreachable target cannot create phantom hits or endless action resets. Cover target
   death/loss, cooldowns, cancellation, new human orders and ranged/melee/air compatibility.

### R5 — AI mission ownership and defense

**Owners:** G `planning/strategy/missions/ai-skirmish-proposal-draft.ts`, `ai-skirmish-defense.ts`,
`planning/strategy/offense/ai-skirmish-offense.ts`, `planning/tactics/missions/ai-tactics-mission-projection.ts`,
`ai-tactics-mission-orders.ts`, `planning/tactics/orders/ai-skirmish-tactics-ownership.ts`;
P `player/ai-controller/commands/dispatch-ai-order.ts` and native order application.

1. Trace strategy/tactics/rally/native command replacement using R1 evidence. Maintain one effective mission owner
   per actor and explicit preemption. Keep healthy orders and surviving formation assignments; task IDs/signatures
   or new production must not independently reset physical progress, windup, cumulative age or ownership.
2. Defense recruits suitable reachable nearby units, including those on offensive assignments, from permitted
   threatening groups and exposed assets. Account for compatible force, distance and home risk; avoid a single
   selected contact hiding other attack domains. Preserve useful offense when the home threat can already be handled.
3. Acceptance: army production does not cause continuous marching; a superior army intercepts ground attackers;
   the existing compatible archer actually moves/attacks to defend against flyers. Show admitted/applied orders and
   physical protection/damage, not a defense label. Harmless contacts do not conscript the entire army.

### R6 — Emergency counter production

**Owners:** G `planning/adaptation/ai-adaptation-evidence.ts`, `ai-adaptation-manager.ts`, `ai-adaptation-role-match.ts`,
`ai-adaptation-queued-role.ts`; `planning/production/`, `brain/arbitration/`;
P `player/ai-controller/observation/catalog/` and shared queue/resource owners.

1. Trace visible flyers -> confirmed evidence -> counter target -> faction capability/prerequisites -> resource/queue
   arbitration -> completed paid output -> defense assignment. Existing adaptation already requests anti-air;
   find the actual broken link instead of introducing a parallel counter-production manager.
2. Separate urgent survival demand from ordinary composition cooldowns/spending. Plan legal missing prerequisites
   when feasible, preserve paid commitments, count ready/queued/admitted counters once and expose real blockers.
3. Acceptance: three observed flyers trigger useful faction-legal anti-air output when feasible; existing counters
   engage promptly. Cover both factions, producer missing/busy, scarcity, fulfilled queues, threat disappearance and
   ground-only/hidden-air negative controls. No assumption that every archer/ranged unit can target air.

### R7 — Retreat and re-engagement

**Owners:** G `planning/tactics/combat/ai-tactics-combat.ts`, `ai-tactics-rules.ts`,
`planning/tactics/missions/ai-tactics-mission-preparation.ts`, `ai-tactics-mission-decision.ts`,
`ai-tactics-mission-projection.ts` and their engagement/mission tests.

1. Diagnose observed friendly/enemy strength, compatible domains, support distance, casualties, damage/cooldowns,
   available escape and mission commitment together. Existing hysteresis/retreat guards must be explained before
   changing thresholds. Do not convert minor injury, a normal cooldown or one weak member into whole-army flight.
2. Distinguish individual withdrawal from squad retreat. Persist meaningful retreat/recovery state, separate entry
   and release conditions, and allow emergencies to preempt stability windows without suppressing justified recovery.
3. Acceptance: minor damage does not abandon a favorable infantry fight, a clearly losing force withdraws, and
   reinforcement permits a justified return without repeated attack/retreat cycling. Include defense, scouts,
   damaged ranged members and mixed-domain support so one repair does not break other roles.

### R8 — Measured performance improvement

**Owners:** P `player/ai-controller/player-ai-controller.ts`, `player-ai-controller.agent.ts`,
`ai-behavior/world-state-snapshot-manager.ts`, `observation/ai-observation-pipeline.ts`, native movement/navigation;
G `brain/`, affected `planning/` owner; E `runner/skirmish-ai-runtime-variant-runner.ts` profiling.

1. Use the R1 profile to rank actual hotspots. Candidate mechanisms include repeated observations/scans/catalog
   work, excessive path requests from order churn, duplicated cloning/debug projections and unbounded candidate work.
   Implement only measured improvements, within existing authority and lifecycle owners.
2. Retain performance feedback during R2–R7. Before performance-only changes, capture the functionally corrected
   baseline so removal of buggy movement is not confused with semantic equivalence of later optimizations.
3. Optimize redundant work or correctly invalidated derived data; keep per-player visibility/generation, price,
   topology and ownership invalidation explicit. Do not reduce decision cadence, skip AI obligations, use stale hidden
   information or disable diagnostics/AI to meet a target. No async partial decision crosses an authoritative boundary.
4. Compare at least three matched short before/after runs, recording seed/source/config, actor counts, decisions/ticks,
   relevant canonical decision/state digests and independent useful outcomes. Compare frame/long-task impact and the
   dominant cost against the numeric target frozen in R1; distinguish gameplay, rendering and capture overhead.
5. Acceptance: repeatable improvement beyond baseline variation in the reported slow workload, preserved correctness
   and no material regression in small/quiet/control workloads. Add a stable work-count/complexity or focused benchmark
   regression guard, not a brittle absolute CI timing gate. An authored profiler or faster zero-work run cannot close R8.

## Execution loop and verification budget

1. Read the cursor and selected packet only; trace actual callers/registrations and adjacent tests before editing.
2. Reproduce the first causal disagreement with the smallest useful check. Inspect failures before rerunning.
3. Implement a coherent repair, review its ownership/save/disposal/negative controls, then run affected focused checks.
4. Confirm the packet's physical/visual acceptance in short controlled gameplay when needed. Reuse existing legal
   presets, real definitions and independent readers. Stop at the required milestone; never substitute setup/labels
   or forcibly set success. Observe real motion/attacks/input, not just aggregate receipts or screenshot appearance.
5. Update this file's cursor/row, preserve evidence, review/check and publish the task-owned batch, then continue.
   Independent dependency-ready work can proceed while one reproduction is blocked. Do not abandon unresolved acceptance.

- One local game runner. Aim for a few minutes per focused gameplay case; **30 minutes maximum per invocation and
  per planned verification batch**. Include startup/teardown. A test-budget failure triggers smaller diagnosis, not
  a longer ceiling, weakened predicate or unchanged full-pack rerun. Performance repeats use bounded short workloads.
- After two attempts at the same failing workload without a new causal finding, stop repeating it. Inspect the
  retained failure and reduce the reproduction; work on an independent packet where possible. A justified repair may
  revisit earlier work and invalidate only affected evidence. There is no ban on re-iteration.
- Ordinary unit/tool/type/lint/build checks remain required for touched owners. Broad checks run once at a stable
  boundary and again only when changes/failures invalidate them. No full matrix, difficulty campaign or automatic AI
  job reactivation. Do not run unrelated completed core/scout packs for reassurance.
- Keep raw profiles/traces in ignored `tmp/ai-gameplay-reliability/`; report bounded projections. Missing infrastructure,
  zero work or unavailable evidence is not a pass. Use one owned runner/server and clean it up on stop/failure.

Command routes (discover exact test files/configs before invocation; placeholders are not executable proof):

```text
node node_modules/jest/bin/jest.js --config libs/games/probable-waffle/gameplay/jest.config.cts --runInBand --runTestsByPath <specs>
node node_modules/jest/bin/jest.js --config libs/games/probable-waffle/phaser/jest.config.cts --runInBand --runTestsByPath <specs>
node node_modules/jest/bin/jest.js --config libs/games/probable-waffle/interface/jest.config.cts --runInBand --runTestsByPath <specs>
pnpm exec nx run-many -t lint -p <touched-projects>
pnpm exec tsc --project <owning-tsconfig> --noEmit
pnpm ai:tools:typecheck
pnpm ai:skirmish:catalog -- --check
pnpm skills:check
git diff --check
```

Relevant projects: `probable-waffle-gameplay`, `probable-waffle-phaser`, `probable-waffle-interface`,
`probable-waffle-protocol`, `platform-game-host`, `portal-e2e`, `skirmish-ai-tools`. Shared host changes need affected
consumer checks. Use existing Playwright config/manifest selection for the chosen cases; do not launch the generic
runner without its exact request. Profile mode is opt-in and must not alter gameplay. Node 24/pnpm are pinned in repo.

## Completion and handoff maintenance

- All R1–R8 acceptance must be validated, including measured performance improvement and user-visible regressions.
  A passing previous CI, fixture registration, selected action or explanation does not replace outcome evidence.
- Perform separate Omission and Final Closure Audits: original reports, human/AI callers, save/restore, initialization,
  cancellations, teardown, fairness, ordering, performance, tests/registration, docs and final published scope.
- Preserve existing green checks; repair task-caused failures before finishing. Verify normal remote SHA and relevant
  ordinary CI for published commits. Do not merge. Mark the goal complete only when required work is actually done.
- Maintain this single file, not per-session plans/logs. At every packet boundary and after every few sessions,
  rewrite cursor/status in place, remove stale instructions and collapse closed detail into commit/evidence links.
  Keep this handoff roughly 300 lines or less; the limit must not erase unresolved acceptance.
- At closure, move proven contracts/tuning/testing into the existing owning docs/tests, retain only genuine unresolved
  work in issues, then remove this handoff and its routing links. Do not retire it while this goal is unfinished.
