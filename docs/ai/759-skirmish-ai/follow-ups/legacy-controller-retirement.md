# Legacy controller retirement — #820

## Outcome

Configured skirmish AI always uses the pure brain. Invalid configuration fails visibly instead of silently falling back
to the old behavior tree, and legacy runtime code is removed after compatibility evidence exists.

Recommended agent: `gpt-6-astra`, high effort for parity/removal; use `gpt-5.6-terra`, medium effort for mechanical dead
code cleanup after the boundary is proven.

## Cold start

Read only:

1. `phaser/src/lib/player/ai-controller/player-ai-controller.ts`, especially `resolveProfile` and `stepDecisionPlanner`
2. `gameplay/src/lib/player/ai-controller/player-ai-controller.mdsl.ts`
3. `player-ai-controller.agent.ts` and legacy manager registrations
4. `brain/legacy-ai-adapter.ts` and save migration paths
5. parity evidence from #816, #819, and #823

The fallback currently activates only when player number or faction resolution fails. The pure brain covers economy,
production, repair, research, scouting, missions, focus, retreat, support, and concession; explicit legacy flanking needs a
retain/remove decision backed by gameplay evidence.

## Implementation order

1. Build a parity table from actual callable legacy branches to pure owners and runtime scenarios. Do not infer parity
   from similarly named methods.
2. Add any missing supported behavior to the pure brain and cover it in pure plus real runtime tests.
3. Define the compatibility cutoff for old blackboard/save data. Keep only a bounded migration adapter when required.
4. Replace the fallback branch with explicit startup failure/disabled-AI diagnostics for invalid identity or faction.
5. Remove the MDSL tree, legacy-only managers/helpers, registrations, mutable blackboard state, and obsolete tests after
   call-site and save/replay audits show no consumers.
6. Prove single authority in local and multiplayer matches, then remove temporary parity instrumentation.

## Completion

- No runtime path instantiates or steps the legacy behavior tree.
- Invalid configuration is observable and cannot issue commands.
- Save/load/replay/multiplayer/second-match evidence passes.
- Dead-code and public-export searches are clean; audit, commit, push, and close #820.
