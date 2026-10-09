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

Capture installation and shipping code size are separate checks. The installer rejects production games even with a
matching test marker, and unmarked games have no capture root. Static imports can still keep test-harness modules in
production output. For size evidence, build with `--stats-json=true`, follow the index script/style roots and all static
and dynamic output imports, then gzip each reachable output with the same settings. Report code totals separately from
referenced media such as CSS fonts. Stats input `bytesInOutput` gives raw module contributions; it cannot assign
independent gzip bytes to a module. Record the reachable set and digests.
Compare only runnable, identified revisions with equivalent native worlds and workloads. An isolated empty-observer
method probe can check a fast path, but cannot establish whole-game CPU, allocation or shipping-delta budgets.

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
