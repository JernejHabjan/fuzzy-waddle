# Skirmish AI testing

## Evidence layers

| Layer                          | Proves                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------- |
| Gameplay unit tests            | Deterministic decisions, claims, reservations, policy and recovery contracts    |
| Phaser tests                   | Observation, shared command application and lifecycle adapters                  |
| Native runtime recipes         | Physical useful outcomes for selected actors, branches and controls             |
| Continuous matches             | Legal opening-to-result integration                                             |
| Real-peer and save/load suites | Their explicit continuation/authority contracts; certification remains separate |

Registration, valid setup, portal Play eligibility and selected intent are not passing execution.
[Coverage and follow-ups](./coverage-status.md) records delivery limits; [runtime E2E](./runtime-e2e.md) owns
focused setup, tick/wall budgets, early stopping, artifacts and provenance.

## Stable commands

Before runtime execution, read the [scenario focus/shortening priority](./runtime-e2e.md#highest-priority-focus-and-shorten-scenarios)
and flag overbroad or likely over-budget selections to the user. [#865](https://github.com/JernejHabjan/fuzzy-waddle/issues/865)
owns this improvement across focused scenario families.

```sh
pnpm tools:test
pnpm ai:tools:typecheck
pnpm ai:skirmish:catalog -- --inventory
pnpm ai:skirmish:matrix -- --scenario PLACE-03 --mode runtime
pnpm ai:skirmish:matrix -- --scenario PLACE-03 --mode runtime --variant <ID> --repetition 1
pnpm ai:skirmish:report -- --report <artifact> --scenario PLACE-03 --failures-only --details
pnpm ai:skirmish:regression -- --list
```

The Playwright spec is parameterized by the matrix runner. A gutter run without its request is not a scenario run.
Use Node 24. Run one local accelerated matrix process at a time. The enclosing runtime test is capped at three
minutes; split oversized selections and refocus oversized recipes. The outer invocation's 30-minute safeguard is
separate. Tick ceilings and proof checkpoints are explicit fixture settings, not learned from the last report.

## Scenario authority

`tools/probable-waffle/skirmish/ai/testing/fixtures/skirmish-scenario-manifest.json` selects fixtures.
`testing/bindings/native-scenario-bindings.json` supplies generated native branches, windows and acceptance.
Typed builders under `scenarios/worlds/` construct minimal legal setups. E2E domain evaluators and pair readers
prove outcomes independently of authored events or AI reason labels. Reuse the existing typed context readers
and actor/command/effect identities instead of creating another observation mechanism.

## Scenario descriptions and inventory

Open `/aota/ai-scenarios` in the development portal to browse descriptions and run a variant as a spectator.
Automated evaluators run separately; watching playback does not produce a matrix pass. Use the on-demand CLI
inventory for recipe IDs, factions, branches and deadlines. There is no committed generated Markdown catalog.

Detailed acceptance is grouped by responsibility:

- [Strategic scenarios](./strategic-scenarios.md)
- [Progress and recovery oracles](./progress-and-recovery-oracles.md)
- [Adversarial and continuous scenarios](./adversarial-scenarios.md)
- [Classic RTS and difficulty correctness](./classic-rts-and-difficulty-scenarios.md)
- [Debugging scenarios](./debugging-scenarios.md)
- [Test map contract](./test-map-contract.md)

### Native scenario bindings and bounded lookup

Inspect the affected recipe, builder, native domain evaluator and sibling comparisons together. Summarize report
indexes before opening raw captures. Full-family assertions require all authored controls, not selected diagnostics.

### Focused scenario windows

Start immediately before the decision. Use minimal legal actors/resources, retain the causal control and stop on
complete physical proof. A negative control needs its meaningful temporal window. Details are in the runtime guide.

### Native construction and continuation bindings

Require legal acceptance/payment, an actual site, builder arrival and completion. Placement and fortification cases
also prove routes, producer exits or defensive fire as specified. Reconciliation must retain original command,
queue item and actor identity through cancellation, output, destruction and delayed consumer receipts.

### Native expansion and physical fortification controls

A plan or footprint alone cannot prove traversable openings, useful wall coverage, transport delivery or expansion
value. Native paid outputs and movement establish those results; unavailable content remains explicitly deferred.

## Native production authority

Shared runtime application owns costs, refunds and output. Independent facts must establish those effects exactly
once. Consumer receipt faults must not fabricate payment, settlement or strategic defeat. Use existing queue,
resource-delivery and command terminal readers; a dispatch is insufficient evidence.

### Authority, saves and lifecycle

Real reconnect/host-transfer certification remains in #819; broader save/load continuation remains in #823.
Local fault injection is not peer certification. Save/replay comparisons preserve original pending work, cadence,
claims, RNG, future inputs and shared world state. Missing history or unsupported future input cannot silently pass.

### Difficulty policy registration (D-01)

Normal configuration, persistence and fairness checks remain. Difficulty strength calibration is cancelled.

## Periodic regression profiles

Local core/scout profiles are opt-in selections from the manifest; inspect `--list` before execution. Profiles do not
cover every registered scenario. Each selected runtime test shares the three-minute budget, including all its worlds.
`pnpm e2e` runs ordinary E2E. Use `pnpm e2e:ai` to add the core regression or `pnpm e2e:ai-full`
to add the full release matrix. The full matrix requires a clean source tree and retains deferred content and
pinned-baseline limitations; see `tools/e2e/README.md`. `RUN_AI_REGRESSION` no longer changes `pnpm e2e`.
Automatic CI remains disabled under `.github/disabled-workflows/`; do not re-enable it without a request.
