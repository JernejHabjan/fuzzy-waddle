# Skirmish AI testing

## Evidence layers

| Layer                   | Purpose                                                                   | Location                                              |
| ----------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| Unit/pure Jest          | Reducers, managers, contracts, serialization and semantic oracles         | `gameplay/src/lib/player/ai-controller/**/*.spec.ts`  |
| Phaser integration Jest | Observation, command application, outcomes, saves and runtime driver      | `phaser/src/lib/player/ai-controller/**/*.spec.ts`    |
| Real runtime Playwright | Lobby launch, Phaser ticks, real commands, world effects and match result | `apps/portal-e2e/src/e2e/skirmish-ai-runtime.spec.ts` |
| Matrix/report tooling   | Coverage, provenance, grouped execution and compact failure reports       | `tools/ai/`                                           |

An authored fixture or planner trace is not runtime evidence. A runtime case must launch the actual game world and measure authoritative outcomes independently of the planner's explanation.

Fixture JSON and typed builders are inert data until a Jest or matrix/Playwright runner registers and executes them.
Their assertions are deterministic code and require no LLM evaluation or manual judgment. Unmapped fixture metadata is
not automated coverage.

Focused economy runtime assertions must verify applied preset balances and independently observed worker orders. For
example, ECO-04's zero-wood labor case requires a ready wood source and an AI-issued Gather order by a finite tick;
fixture-authored starting orders or planner debug text do not satisfy it. ECO-08's separate pure case covers both
factions' two-worker opening bootstrap; its runtime workforce-growth case remains a distinct Playwright obligation.

## Stable commands

```bash
pnpm ai:skirmish-matrix -- --scenario ECO-08 --mode runtime
pnpm ai:skirmish:opening
pnpm ai:skirmish:production
pnpm ai:skirmish:land-sequences
pnpm ai:skirmish:report -- --failures-only --details
pnpm ai:tools:test
```

The Playwright spec is parameterized by the matrix runner. Running its gutter test without `AI_SKIRMISH_RUNTIME_REQUEST` is not a complete scenario run.

Matrix source ownership: `tools/ai/run-skirmish-matrix.mjs` handles CLI selection, replay comparison and report output;
`skirmish-matrix-fixtures.mjs` validates manifest/runtime recipes; `skirmish-matrix-execution.mjs` invokes the pure and
browser drivers; `skirmish-matrix-io.mjs` owns bounded input, source provenance and path helpers. Keep rejection and
report behavior stable when changing these boundaries.

Browser results are retained separately under `tmp/ai-skirmish-runtime-results/`; the matrix report's
`execution.resultArtifact` locates the raw payload. This keeps large native captures out of subprocess logs.
The reader checks source/fixture/dirty provenance and a 256 MiB byte ceiling before accepting the artifact.
Missing, malformed, oversized or mismatched output supplies no runtime evidence. Direct Playwright callers
without an artifact path retain the console result protocol.

A diagnostic-impact sanity check can use existing representative warm runs and installation/cleanup coverage. Record
the observed costs and measurement limits, then stop when there is no clear substantial slowdown. Detailed profiling
below is an investigation technique for a concrete performance problem, not a requirement to certify every diagnostic
hook. Keep gameplay, authority, installation and cleanup correctness tests regardless of profiling scope.

Capture installation and shipping code size are separate checks. The installer rejects production games even with a
matching test marker, and unmarked games have no capture root. Static imports can still keep test-harness modules in
production output. For size evidence, build with `--stats-json=true`, follow the index script/style roots and all static
and dynamic output imports, then gzip each reachable output with the same settings. Report code totals separately from
referenced media such as CSS fonts. Stats input `bytesInOutput` gives raw module contributions; it cannot assign
independent gzip bytes to a module. Record the reachable set and digests.
Compare only runnable, identified revisions with equivalent native worlds and workloads. An isolated empty-observer
method probe can check a fast path, but cannot establish whole-game CPU, allocation or shipping-delta budgets.

A matching simulation seed alone does not make separate lobby launches identical. `ActorIdAuthorityService` also
salts actor IDs with the game-instance ID, which affects actor ordering and command identities. A validated preset
fixes that ID from its seed and `fixtureId`; retain the same preset identity across paired runs and each source's own
provenance. The preset must contain valid authored work. An exact resource start equal to the existing balance can
establish identity without emitting a resource change; an empty preset is rejected. Check the legal roster and full
initial native boundary before comparing later states. Trace the first differing command/outcome when trajectories
diverge: a later gameplay repair can change the workload even when both initial boundaries match. Such runs establish
a causal difference, not paired performance evidence. Keep any behavior-aligned measurement reference explicitly
separate from the original pinned acceptance reference.

A reviewed behavior comparator may carry exact native correctness repairs on top of its compile compatibility
overlay. Identify every excluded owner and both overlay digests, verify each repaired owner's emitted code against
the candidate, execute its native regressions, and restore the historical checkout after building. Movement failure
cleanup, positive resource progress, ground-route ownership and pawn WAIT timing must all agree before these builds
can serve as a shared workload. This does not establish acceptance against the original historical source. Preset `sourceRevision`
accepts the actual 40-character Git SHA; put the composite overlay identity in the external qualification manifest.
Qualify complete trajectories and native outcomes in repeated alternating pairs before collecting costs. Marked
accelerated equivalence covers that selected workload; production/unmarked equivalence, normal frames and lifecycle
continuation need their own evidence. Shipping size alone cannot establish CPU or allocation budgets.

For browser profiles, warm each source once, alternate source order, and compare every native boundary/outcome in
the profiled runs with the ordinary qualified trajectory. Profiling can change timer/cache behavior; any trajectory
difference invalidates the cost pair. Keep CPU and sampled-heap artifacts with their sampling intervals and hashes.
Record browser/realm reuse: separate full warm-ups followed by fresh browsers warm shared resources, but do not retain
JavaScript VM/JIT state. A steady-state claim needs a qualified warm-up/reset route in the retained runtime.
Use the actual build source maps to attribute exclusive samples to capture/observation owners, excluding diagnostic
readout stacks. Exclusive owner samples omit their callees; heap samples estimate allocation rather than retained
memory. Report that scope and variance instead of treating unsampled work as zero. Synchronous scene UPDATE timings
include immediate hooks but omit later asynchronous gameplay and cannot supply a whole-simulation CPU budget.

Normal lobby startup generates both seed and instance ID. Production ignores the test marker/preset and publishes
no test game handle; unmarked development publishes no AI test host. Angular's development inspection API can read
the ordinary game, but is absent from production. Live startup/root-absence checks establish this boundary, not
equivalent workloads or absence of all journal/listener allocations.

A native quicksave made at tick zero can provide a common capture-off setup. Use the real save serializer/codec,
retain its exact encoded record, and load it through the ordinary Load UI in isolated browser storage. Loading keeps
the saved seed/instance ID and restores RNG, command authority and AI save state. A loaded start is a distinct
workload: saved AI/authority fields can differ from a fresh lobby boundary. Compare every complete native boundary
and outcome across revisions/modes; never discard those fields to make the save appear equivalent to a fresh start.
Tick-zero evidence does not establish continuation of an in-progress pawn WAIT or general save/restart parity.

An external CDP debugger can retain the native scene object at its bootstrap boundary without publishing a global
test host. Locate the breakpoint in each exact output, require a unique match and verify the scene/seed/ID/roster.
For an accelerated replay, apply native manual clock pacing before the first tick, remove the breakpoint and disable
the debugger before profiling, then stop the render loop and advance the same fixed updates as the qualified replay.
The debugger reads the native world; the runner controls pacing. No running-world identity/state repair, capture
installation, prototype wrapper or shipped hook is needed. Release the remote handle/browser/server afterward.
This measures a capture-off accelerated workload, not rendered frame performance or ordinary wall-clock gameplay.

Exclude only the injected readout subtree and runner self work by their actual script identity; native methods also
named `capture` remain measured. Application exclusive samples include game and framework work and omit builtins,
GC and other unattributed work; they are not isolated whole-simulation CPU. Without production source maps, report
production diagnostic-owner costs as unavailable. Zero owner allocation samples are below the sampling resolution,
not proof of zero allocation. Qualify a common supported setup/read route before claiming normal-play overhead;
do not install capture in production merely to make profiling convenient.

For retained-browser warming, use the native in-game Load event/dialog after the full warm-up, then the actual Load
button. Record the retained document object, time origin/default context and exact native script identities across
resets. The application may recreate the Phaser game while keeping its realm and compiled modules. A sleeping old
render loop can defer native game destruction: wake it before opening Load and require the old scene to reach
DESTROYED with zero event registrations before measuring its replacement. Release old remote scene handles.
These checks prove the selected reset and warm-up reuse, not JIT optimization state, convergence or every async cleanup.

Inclusive CPU scopes must be explicit. Count each sample once in the union of native application ancestry, including
builtin/URL-less callees, while excluding injected readout, runner self and idle. Keep global GC/unattached work separate.
The actual fixed-clock tick stack includes synchronous tick listeners; later async continuations may lose that ancestor.
Native/application ancestry also includes framework activity and cannot supply complete isolated simulation/hook CPU.
Inclusive hot-frame rows overlap; do not sum them or turn source-map gaps into zero-cost claims.

Player-controller decision settling does not establish quiescence of pawn behavior-tree actions or path promises.
Inspect each native action's clock before treating an accelerated replay as a deterministic cost workload.
Mistreevous WAIT nodes use wall time when `BehaviourTreeOptions.getDeltaTime` is absent, even if the caller steps on
fixed simulation ticks. `PawnAiController` supplies its accumulated active elapsed time in seconds to both production
and development trees, before resetting that accumulator after the step. The default 100 ms cadence collects two
50 ms ticks; a 125 ms cadence steps with the actual 150 ms, and a sub-tick cadence still receives 50 ms. Mistreevous
counts the delta on a WAIT's entry update too: a 5 ms polling wait can finish on its first 100 ms update, while a
1500 ms wait takes fifteen such updates. This is the library's discrete update contract, not an exact duration from
the wall-clock moment of entry. Existing guards can still interrupt waits. Paused frames, tick-counter jumps and
inactive/dead actors add no active delta; the isolated frame fallback uses the existing scaled frame delta and is
not a lockstep clock. Cancellation resets the tree's WAIT progress while retaining controller cadence. Blackboard
snapshots do not persist the tree's phase or accumulated elapsed time; this clock repair alone does not prove
save/reconnect/host-transfer continuation parity.

Trace the first native order change and actual command outcome separately; a current Build
order can change before command outcomes diverge. Diagnostic subscriptions/wrappers alter wall time, so traced
controls locate ownership but cannot stand in for ordinary repeats or paired CPU measurements. An isolated WAIT
control proves the clock dependency, not the cause of every whole-world mismatch. Preserve full native state and
outcome comparisons; do not discard transient order state or truncate a workload to its last matching prefix.

Movement consumes ground routes with `shift()`. The ground cache must keep its own route and tile objects and copy
them on a hit; otherwise a later range probe can receive an empty consumed path and incorrectly report proximity.
Trace the native Stop reason, selected order, path length and cache entry alongside world boundaries. Wall-clock
expiry can expose different consumed entries in different runs; extra tracing can change that expiry too. A repaired
candidate repeating the same full trajectory supports that workload's repeatability, but does not qualify a historical
comparator that lacks the repair or establish a CPU/allocation budget. Review ownership on each terrain separately;
ground isolation does not prove water isolation or simulation-clock WAIT authority.

Use one browser runtime process at a time and group compatible IDs with `--scenarios`. Unit, type and tooling checks may be batched independently. Diagnose the earliest causal disagreement in this order:

```text
observation -> demand/mission -> intent/claim -> command application -> outcome -> cleanup
```

## Scenario authority

`tools/ai/fixtures/skirmish-v1.json` owns the required IDs, driver requirement, fixture registration and baseline compatibility. Typed fixture builders and assertions own setup and expected behavior. The coverage gate must fail when a supported required row is missing rather than reducing the denominator.

The [generated scenario catalog](scenario-catalog.md) joins every manifest ID to its requirement, registered pure fixture,
ID-referencing specs, and real-game recipe/map/checkpoint data. It reports wiring, not passing evidence. Edit the
linked requirement and fixture sources, then regenerate with `pnpm ai:skirmish:catalog -- --write`; the non-draft PR
and `develop` CI jobs check that the catalog stays synchronized. Existing browser recipes still use changing product
maps; [frozen test maps](test-map-contract.md) and their migration remain implementation work under #816. Until that
migration is done, do not describe a changing-map run as a stable reference-map regression.

For bounded authoring triage, `pnpm ai:skirmish:catalog -- --inventory` prints one line per registered runtime recipe:
IDs, variant/run counts, preset coverage, maximum tick and migration flags. It reads the manifest/fixtures without
launching the game. Flags are an inventory, not proof of a failing test or an excuse to drop a required row.

The current catalog contains 121 named cases before variants. Most still require fixture/runtime implementation; see [the handoff](../../../../../../../../../../docs/ai/759-skirmish-ai/HANDOFF.md).

Detailed requirements are split by concern:

- [Strategic scenarios](strategic-scenarios.md)
- [Progress and recovery oracles](progress-and-recovery-oracles.md)
- [Adversarial and continuous scenarios](adversarial-scenarios.md)
- [Classic RTS and difficulty scenarios](classic-rts-and-difficulty-scenarios.md)
- [Debugging scenarios](debugging-scenarios.md)
