# Probable Waffle skirmish AI

These documents describe the shipped AI controller by responsibility. They are not a pull-request implementation roadmap.

## Architecture

- [Decision cycle](architecture/decision-cycle.md): observation, durable brain state, proposals, arbitration, commands and outcomes.
- [Contracts and tuning](architecture/contracts-and-tuning.md): shared identities, lifecycles, budgets and initial deterministic thresholds.
- [Command/effect ownership](architecture/command-effect-ownership.md): authoritative application and reconciliation by action family.
- [Economy and production](architecture/economy-and-production.md): openings, resources, supply, throughput, composition and legitimate duplicate assets.
- [World access and defense](architecture/world-access-and-defense.md): land, air, water, transport, placement, expansion and fortifications.
- [Combat and strategy](architecture/combat-and-strategy.md): goals, scouting, squads, missions, support, counters and difficulty.
- [Resilience and lifecycle](architecture/resilience-and-lifecycle.md): progress, recovery, authority, saves and disposal.

## Verification and operation

- [Testing](testing/README.md): test layers, source locations and stable commands.
- [Runtime E2E](testing/runtime-e2e.md): Playwright matrix and required pre-merge coverage.
- [Difficulty calibration](testing/difficulty-calibration.md): paired-seed evidence and acceptance.
- [Debugging](debugging/README.md): in-game workbench contracts.
- [Incident reproduction](debugging/incident-reproduction.md): capture, replay and first-difference workflow.

The executable scenario authority is `tools/ai/fixtures/skirmish-v1.json`. Assertions belong in typed fixtures and tests; this documentation explains contracts and operating policy rather than duplicating expected values.

The unfinished pull-request work is recorded separately in [the #759 handoff](../../../../../../../../../docs/ai/759-skirmish-ai/HANDOFF.md). Remove that link after the handoff is fully closed.
