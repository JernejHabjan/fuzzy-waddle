# Skirmish AI testing

## Evidence layers

| Layer                   | Purpose                                                                   | Location                                              |
| ----------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| Unit/pure Jest          | Reducers, managers, contracts, serialization and semantic oracles         | `gameplay/src/lib/player/ai-controller/**/*.spec.ts`  |
| Phaser integration Jest | Observation, command application, outcomes, saves and runtime driver      | `phaser/src/lib/player/ai-controller/**/*.spec.ts`    |
| Real runtime Playwright | Lobby launch, Phaser ticks, real commands, world effects and match result | `apps/portal-e2e/src/e2e/skirmish-ai-runtime.spec.ts` |
| Matrix/report tooling   | Coverage, provenance, grouped execution and compact failure reports       | `tools/ai/`                                           |

An authored fixture or planner trace is not runtime evidence. A runtime case must launch the actual game world and measure authoritative outcomes independently of the planner's explanation.

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

Use one browser runtime process at a time and group compatible IDs with `--scenarios`. Unit, type and tooling checks may be batched independently. Diagnose the earliest causal disagreement in this order:

```text
observation -> demand/mission -> intent/claim -> command application -> outcome -> cleanup
```

## Scenario authority

`tools/ai/fixtures/skirmish-v1.json` owns the required IDs, driver requirement, fixture registration and baseline compatibility. Typed fixture builders and assertions own setup and expected behavior. The coverage gate must fail when a supported required row is missing rather than reducing the denominator.

The current catalog contains 121 named cases before variants. Most still require fixture/runtime implementation; see [the handoff](../../../../../../../../../../docs/ai/759-skirmish-ai/HANDOFF.md).

Detailed requirements are split by concern:

- [Strategic scenarios](strategic-scenarios.md)
- [Progress and recovery oracles](progress-and-recovery-oracles.md)
- [Adversarial and continuous scenarios](adversarial-scenarios.md)
- [Classic RTS and difficulty scenarios](classic-rts-and-difficulty-scenarios.md)
- [Debugging scenarios](debugging-scenarios.md)
