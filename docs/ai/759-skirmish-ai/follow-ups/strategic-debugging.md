# Strategic debugging workbench — #818

## Outcome

The AI panel explains, at a glance, what the AI is trying to achieve, with what force/resources, why, and what blocks it,
while detailed IDs remain available for causal drilldown.

Recommended agent: `gpt-5.6-terra`, medium effort. Use the Phaser skill because panel lifecycle and generated/user-owned
regions matter.

Dependency: complete #824 first so debug parity is checked through the same context, scenario, and triage evidence.

## Cold start

Read only:

1. `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/debugging/README.md`
2. `contracts/ai-strategic-intent-summary.ts` and `debug/project-ai-strategic-intent-summary.ts`
3. `debug/project-ai-debug-snapshot.ts`
4. `phaser/src/lib/prefabs/gui/debug/ai-controller/AiControllerDebugLabel.ts`
5. adjacent debug projection and label tests

The current PR adds a first committed strategic summary. The remaining work is presentation hardening, panel splitting,
history/export parity, and real runtime usability evidence.

## Implementation order

1. Keep the pure summary projection authoritative for presentation. It may consume committed observation/state/decisions
   only; never call live pathfinding, planners, RNG, or hidden world state.
2. Show objective/target player and object, force members/domain/phase/deadline, production deficit/purpose, worker/resource
   priority, next strategic action, and blocker/recovery/retry in the overview.
3. Translate reason codes to stable player-facing language while preserving raw IDs in drilldown/copy/export.
4. Split `AiControllerDebugLabel.ts` by view responsibility without modifying generated Phaser Editor regions incorrectly.
   Every extracted hand-maintained file must satisfy source-structure lint.
5. Test no-squad, attack, defense, production, gather shortage, transport, recovery, concession, historical snapshot, and
   incomplete capture states.
6. In Playwright, compare debug hidden/shown/frozen/export runs for identical authoritative outcome hashes.

## Completion

- A player can answer “what, why, with what, until when, and blocked by what” from the first panel page.
- Long values remain readable and history/player/category switching cleans up listeners and overlays.
- Debug state cannot affect gameplay or reveal hidden information.
- Focused projection/Phaser tests and runtime parity pass; audit, commit, push, and close #818.
