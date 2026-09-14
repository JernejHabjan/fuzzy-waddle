# Runtime triage

Use this only after a skirmish runtime or calibration failure.

1. Summarize the newest artifact with `pnpm ai:skirmish:report -- --failures-only --details`. For a named artifact use
   `pnpm ai:skirmish:report -- --report <path> --scenario <ID> --failures-only --details`. Inspect raw JSON only when
   this bounded summary lacks one required field.
2. If the report has no runtime payload or zero tests, decisions, or ticks, classify the first process/harness failure.
   Do not draw behavior conclusions or rerun until timeout, browser, server, and provenance boundaries are sound.
3. Compare the first failing checkpoint with the preceding one. Record actor/worker counts, income, resources, queues,
   squads, objectives, mission events, score deltas, perturbation dispatch and command-failure families.
4. Trace the responsible actor through committed observation, manager ownership, arbitration, shared application and
   terminal outcome. Add a focused failing regression before changing the owner.
5. Run affected focused specs together, then the grouped Playwright scenarios once. Independent Jest/type/build commands
   may run concurrently; accelerated browser matches may not.
6. Ensure the explicit test timeout covers selected variants plus startup/checkpoint overhead. Prefer #826 preset-world
   runtime for focused invariants; keep full natural matches for emergent and terminal evidence.

## Proven interpretation traps

- `gameResult: quit` means the harness reached its bound and exited; it is not a victory or defeat.
- A visible static enemy building near a base is not by itself a home raid. Defense requires a mobile hostile or an observed order against a protected asset.
- Buildings with no movement capability are ground targets unless the authoritative definition supplies another domain.
- `ReturnResources` is part of an active gather cycle. Macro must not replace it and strand carried resources; count its worker against the source assignment when deterministically recoverable.
- A movement acknowledgment is not useful mission effect. Require completed damage/heal, applied/completed spell, forced evacuation, strategic denial, achieved hold, or terminal victory as authored.
- A squad state change or renewed deadline cannot erase cumulative no-progress age. Recovery and finite mission resolution need terminal evidence and released ownership.
- After authoritative victory, absence of a new attack squad is correct; post-game planners may project state/debug but must issue no gameplay intents.
- Repeated cancellation often means two managers own the same actor or a new formation order replaces valid work. Inspect claims and current orders before tuning cadence.

Keep oracle changes separate from implementation repairs and record why an old predicate misclassified independently successful or impossible behavior.
