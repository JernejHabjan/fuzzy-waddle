# Multiplayer AI lockstep E2E — #819

## Outcome

A real socket-backed multi-client match proves that host-owned AI commands are relayed and applied identically by every
peer through production, combat, lifecycle interruptions, and termination.

Recommended agent: `gpt-6-astra`, high effort because browser, server authority, lockstep, reconnect, and host migration
cross several ownership boundaries.

## Cold start

Read only:

1. `world/services/multiplayer/command-bus.service.ts` and `shared-command-application.service.ts`
2. `data/scene-data.ts` relay predicates
3. server multiplayer command validation and communicator paths from the RTS source index
4. existing online lobby E2E setup
5. `apps/portal-e2e/src/e2e/skirmish-ai-runtime.spec.ts` for reusable reporting patterns, not as proof of multiplayer

The current AI runtime uses one human plus AI in a local skirmish. It exercises shared command application but does not
activate `CommandBusService` multiplayer mode, which requires a relay and more than one human player.

## Implementation order

1. Add a deterministic test lobby with two authenticated browser clients, one authoritative host, and at least one AI.
2. Prove only the host plans/dispatches AI commands; non-host clients receive ordered relay batches and never create a
   second AI authority.
3. Compare peer hashes and command/effect timelines at bounded checkpoints through economy, production, combat,
   concession, and terminal result.
4. Interrupt one client, reconnect it from snapshot, then verify catch-up without duplicate commands/effects.
5. Transfer host ownership during an active AI commitment and verify fencing, continuation, and identical peers.
6. Leave/re-enter a second match and prove no communicator, timer, history, or claim leakage.

## Completion

- Real network transport and multiple browser clients are used; mocks do not satisfy the E2E requirement.
- Failures retain both peer logs, relay sequences, hashes, seeds, lobby/game IDs, screenshots, and source provenance.
- Focused server/client tests and grouped E2E pass without weakening lockstep rules.
- Audit, document the stable command, commit, push, and close #819.
