# AI debugging workbench

The in-game AI panel explains committed facts without becoming gameplay authority. It reads bounded snapshots and history; it never calls the planner, mutates brain state or queries hidden runtime data.

## Required views

- A one-glance strategic summary: primary objective and target, force size/domain, mission phase/deadline, production
  purpose, economy priority, next action, and the current blocker/recovery action.
- Current purpose, opening/build-order checkpoint and blocker/recovery age.
- Resource demand, worker duties, supply, obligations and placement/service rationale.
- Production capacity, queues, desired composition, counters and research scoring.
- Known enemies, confidence/age, scouting questions and inferred risks.
- Bases, expansion candidates, access domains, transport phases and fortification graphs.
- Squads, mission phases, rally/advance/retreat state, reinforcements and support reservations.
- Command/effect identity, outcome reconciliation, retries and dropped/rejected reasons.
- Difficulty/profile configuration, scheduler budget and bounded work/backlog.

Long values must remain inspectable at supported resolutions. Player switching, filters, overlays, focus, history and export must clean up with the scene and produce identical gameplay when hidden, shown or frozen.

Why-not inspection distinguishes not evaluated, rejected, unresolved and not recorded. It reports the committed alternative set and reason; it does not rerun live planning to invent an answer.

The strategic summary must use player-facing language rather than raw manager IDs and reason codes. Detailed IDs remain
available in drill-down views for correlation with commands, effects, saves, and incident bundles.

See [incident reproduction](incident-reproduction.md) for capture and offline comparison.
