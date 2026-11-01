# Probable Waffle skirmish AI

These documents describe the shipped AI controller by responsibility. They are not a pull-request implementation roadmap.

The controller coordinates openings, sustainable economy, useful production, scouting, squads, combat, research,
placement, expansion, fortification and recovery through a fair deterministic decision cycle. Shared runtime
validation applies the same ownership, cost, queue, placement and targeting rules to human and AI commands.
The debug workbench explains committed intent and alternatives without participating in gameplay decisions.

When reviewing changes, follow the observation/state/command contracts first, then the affected pure manager,
Phaser application and lifecycle owner, and finally its typed fixture and independent physical outcome oracle.
Data fixtures do not require an LLM evaluator. Browser scenarios exercise real native gameplay; pure tests and
local skirmishes do not establish socket-backed peer equality.

## Source layout

| Owner | Responsibilities |
| --- | --- |
| `brain/` | Decision orchestration, `arbitration/`, durable `state/` creation/projection and `persistence/` |
| `contracts/` | Observation, commands, execution, planning, diagnostics, state and boundary validation |
| `planning/` | Economy, production, construction, expansion, fortification, strategy, tactics, transport and recovery |
| `testing/` | Pure harness, domain fixtures/scenarios, coverage and reproduction |
| Phaser `player/ai-controller/` | Controller lifecycle, fair observation, decision capture, commands and outcomes |
| Phaser `player/ai-controller/test-support/` | Explicitly gated game-side setup, capture and diagnostic controls |
| `apps/portal-e2e/src/e2e/probable-waffle/skirmish/ai/` | Browser drivers, domain scenarios and independent physical-outcome readers |
| `tools/probable-waffle/skirmish/ai/` | TypeScript CLI/matrix tools, reports, registration and nested JSON test data |

Pawn order executors remain under Phaser `prefabs/ai-agents/`, grouped by actions, behaviors, orders, resources,
controller and debugging. They serve ordinary gameplay as well as skirmish AI. The
[tooling guide](../../../../../../../../../tools/probable-waffle/skirmish/ai/README.md) explains fixture naming,
manifest-relative references and direct Node execution. Generic repository tools remain outside the game directory.

## Architecture

- [Decision cycle](./architecture/decision-cycle.md): observation, durable brain state, proposals, arbitration, commands and outcomes.
- [Contracts and tuning](./architecture/contracts-and-tuning.md): shared identities, lifecycles, budgets and initial deterministic thresholds.
- [Command/effect ownership](./architecture/command-effect-ownership.md): authoritative application and reconciliation by action family.
- [Economy and production](./architecture/economy-and-production.md): openings, resources, supply, throughput, composition and legitimate duplicate assets.
- [World access and defense](./architecture/world-access-and-defense.md): land, air, water, transport, placement, expansion and fortifications.
- [Combat and strategy](./architecture/combat-and-strategy.md): goals, scouting, squads, missions, support, counters and difficulty.
- [Resilience and lifecycle](./architecture/resilience-and-lifecycle.md): progress, recovery, authority, saves and disposal.

## Verification and operation

- [Testing](./testing/README.md): test layers, source locations and stable commands.
- [Scenario test catalog](./testing/scenario-catalog.md): all required cases, setups, outcomes, fixture/test links and current runtime maps.
- [Test map contract](./testing/test-map-contract.md): planned frozen CI maps and map/fixture authority boundaries.
- [Runtime E2E](./testing/runtime-e2e.md): Playwright matrix, execution contracts and optional broader certification.
- [Difficulty calibration](./testing/difficulty-calibration.md): optional methodology; calibration is currently cancelled.
- [Debugging](./debugging/README.md): in-game workbench contracts.
- [Incident reproduction](./debugging/incident-reproduction.md): capture, replay and first-difference workflow.

The executable scenario authority is `tools/probable-waffle/skirmish/ai/testing/fixtures/skirmish-scenario-manifest.json`. Assertions belong in typed fixtures and tests; this documentation explains contracts and operating policy rather than duplicating expected values.

Current evidence, explicit exclusions and independently resumable follow-up issues are recorded in
[coverage and follow-ups](./testing/coverage-status.md). The executable manifests and fixtures own scenario selection;
GitHub issues own unfinished work. Implementation handoffs are retired.
