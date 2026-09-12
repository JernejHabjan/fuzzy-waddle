# Save, replay, reconnect, and repeated-match lifecycle — #823

## Outcome

Persistent AI commitments survive supported lifecycle boundaries exactly once, restore deterministic authority, and leave
no state behind after a match ends.

Recommended agent: `gpt-5.6-terra`, high effort for diagnosis and medium effort for isolated repairs. Ask for Sol or
Astra only for a bounded investigation of reproducible cross-system nondeterminism.

Dependency: complete #824 first; multiplayer lifecycle rows also depend on #819.

## Cold start

Read only:

1. AI resilience docs and command/effect ownership docs
2. `phaser/src/lib/data/save-game.ts` and `load-game.ts`
3. `world/services/recovery/` snapshot, reconnect, host migration, state hash, and authoritative projection owners
4. AI brain migration/canonical serialization and controller disposal/history code
5. lifecycle rows in the scenario manifest and existing save/runtime specs

Coordinate socket-backed cases with #819. Pure serialization or local second-match evidence must not be presented as
multiplayer reconnect proof.

## Implementation order

1. Enumerate restartable AI phases: economy delivery, construction, production/research, squad mission, transport,
   fortification, recovery, and accepted useful-effect reservation.
2. For each, save before application, during active work, and after application-before-reconciliation. Reload and prove
   exactly-once continuation or correct terminal cleanup.
3. Record canonical before/after state and expected migration behavior for older supported saves/repro bundles.
4. Replay the same command/outcome stream without running a new planner and compare authoritative hashes.
5. Test reconnect snapshot and host migration during active commitments with authority fencing and no duplicates.
6. Destroy the scene, start a second match, and inspect timers, subscriptions, communicators, caches, histories, pending
   outcomes, claims, and incident stores for leakage.

## Completion

- Every restartable phase has positive, interrupted, duplicate/late, and terminal cleanup evidence.
- Replay and restored matches are deterministic and do not invent planner work.
- Reconnect/host transfer has real multi-client evidence where applicable.
- Second-match state is clean and histories/work queues remain bounded.
- Update resilience/testing docs, audit, commit, push, and close #823.
