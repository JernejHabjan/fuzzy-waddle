# #759 RTS AI behavior research roadmap

## Status

- [x] Inventory the existing behavior tree, managers, blackboard, tick cadence, telemetry, and tests.
- [ ] Review the issue's RTS reference sources and record licensing boundaries.
- [ ] Establish deterministic benchmark scenarios and baseline metrics.
- [ ] Rank implementation candidates and create the first bounded follow-up issue.

## Current boundary

The existing AI already has a behavior tree plus economy, logistics, base-planning, force,
repair, tech, combat-micro, scouting, targeting, supply, and adaptive-threshold managers.
Telemetry, blackboard persistence, and simulation tick scheduling exist, but regression coverage is
thin. `WorldStateSnapshotManager` currently exposes all enemies in normal skirmish because
visibility checks are disabled, so AI behavior can silently depend on hidden information.

## Research method

1. Review only published reference code/docs and record the source, license, and reusable idea;
   do not copy code or assets.
2. Map each current behavior-tree node and manager to its observable decisions and inputs.
3. Build deterministic fixtures for economy opening, supply recovery, base defense, attack/retreat,
   and scouting/fog.
4. Record time to first worker/building/unit, idle-worker ratio, resource float, supply-block
   duration, invalid-order count, command count, game length/result, and deterministic replay/hash.
5. Rank improvements by player value, complexity, desync risk, and testability.

## Candidate first issue

Restore visibility-respecting enemy intelligence in skirmish with deterministic snapshot tests and
no targeting of unseen actors. This is player-legible, bounded around the existing world-state
authority, and should be designed carefully around asynchronous navigation and lockstep.

## Agent decisions needed

### Difficulty target

**Question:** What player experience should the first AI target?

**Recommended default:** A credible casual/intermediate skirmish opponent with readable behavior.

### Information and bonuses

**Question:** May AI use hidden information or implicit resource bonuses?

**Recommended default:** No hidden information; only explicit difficulty modifiers represented in
game contracts.

### Scope

**Question:** Which modes are included first?

**Recommended default:** Skirmish first, then campaign; exclude networked matchmaking AI until
deterministic replay checks exist.

**Reply to each:** `Accept recommendation`, `Use: <alternative>`, or `Defer`.

## Continuation prompt

```text
Continue #759 research. Do not change runtime AI behavior. Review the approved reference sources,
record source/license notes, define deterministic scenario fixtures and metrics, and rank the
smallest implementation-ready issues. Update this draft PR with evidence, assumptions, and a
human playtest matrix.
```
