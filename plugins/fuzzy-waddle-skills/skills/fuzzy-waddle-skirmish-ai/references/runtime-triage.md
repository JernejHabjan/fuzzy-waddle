# Runtime triage

Use this after a skirmish runtime or calibration failure. The affected-path review and validation sequencing in
steps 4–5 also apply before expensive runtime validation without a prior failure.

1. Summarize the newest artifact with `pnpm ai:skirmish:report -- --failures-only --details`. For a named artifact use
   `pnpm ai:skirmish:report -- --report <path> --scenario <ID> --failures-only --details`. Inspect raw JSON only when
   this bounded summary lacks one required field. For that gap, join by typed event/command identity and project only
   the causal fields needed (for example command, destination, actual position and outcome). Do not stringify complete
   facts or nested boundary snapshots to find a match. Bound printed rows/bytes, include omitted counts and retain
   complete evidence in ignored artifacts; expand a named case when needed instead of dumping all cases.
2. If the report has no runtime payload or zero tests, decisions, or ticks, classify the first process/harness failure.
   Do not draw behavior conclusions or rerun until timeout, browser, server, and provenance boundaries are sound.
3. Compare the first failing checkpoint with the preceding one. Record actor/worker counts, income, resources, queues,
   squads, objectives, mission events, score deltas, perturbation dispatch and command-failure families.
4. Trace the responsible actor through committed observation, manager ownership, arbitration, shared application and
   terminal outcome. Add a focused failing regression before changing the owner. Before expensive validation, review
   the entire affected path through arrival/completion, cancellation or replacement, callbacks and cleanup of timers,
   listeners and reservations. Include direct callers that lack a pawn/order cleanup owner. Add relevant controls and
   finish related implementation repairs before the broad checks and match, so late cleanup discoveries do not force
   an avoidable second pass.
5. Use small causal tests when they guide implementation; once the slice is stable, batch required Jest/type/build
   checks and run grouped Playwright scenarios. Independent checks may run concurrently; accelerated matches may not.
   Repeat passed broad checks or matches only when subsequent source changes, failures or unresolved evidence require
   it. Preserve every required gate; one final pass is a target, not a restriction on necessary investigation.
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
