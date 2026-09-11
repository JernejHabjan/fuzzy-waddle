# Runtime E2E and pre-merge policy

## Required merge gate

Skirmish AI runtime acceptance must be executable in CI before a change merges to `develop`/`main`; it must not exist only as a one-time agent run. The required Playwright matrix should be sharded by stable scenario group while preserving one isolated game per variant.

The pre-merge gate must include every supported runtime-required manifest row. Missing fixtures, zero decisions, zero ticks, a missing terminal result, provenance mismatch or browser/runtime failure fails the gate. Unsupported future capabilities remain visible in the report and require an explicit reason.

Recommended CI tiers:

| Tier               | Trigger                                  | Coverage                                                                 |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------ |
| Focused            | AI pull-request iteration                | Changed unit/integration tests and affected runtime groups               |
| Required pre-merge | Merge queue or explicit release workflow | All supported runtime rows, all pure rows, coverage/provenance checks    |
| Extended           | Scheduled/manual                         | Additional seeds, stress variants, long soaks and difficulty calibration |

The required tier is not yet wired into repository CI. This is a release blocker recorded in the handoff.

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
