# Multiplayer AI lockstep E2E — #819

## Outcome

A real socket-backed multi-client match proves that host-owned AI commands are relayed and applied identically by every
peer through production, combat, lifecycle interruptions, and termination.

Recommended agent: `gpt-5.6-terra`, high effort. Ask for `gpt-5.6-sol` only after a deterministic cross-peer divergence is
captured; reserve Astra for a rare unresolved authority/lockstep design question.

Estimated effort: **XL**, about 4–8 focused agent sessions or 3–7 engineering days with a stable test server.

Dependency: complete #824 and establish the runtime matrix infrastructure in #816 first.

## Cold start

Read only:

1. Phaser `world/services/multiplayer/command-bus.service.ts` and `shared-command-application.service.ts`
2. Phaser `data/scene-data.ts` relay predicates and `core/ports/probable-waffle-communicator.ts`
3. server `game-instance/multiplayer/game-command-validator.service.ts` and its spec
4. interface `communicators/probable-waffle-communicator.service.ts` plus protocol communicator events/listeners
5. `apps/portal-e2e/src/e2e/skirmish-ai-runtime.spec.ts` for reusable reporting patterns, not as proof of multiplayer

Library-relative prefixes are discoverable from the repo workflow source index. Do not load unrelated game communicators.

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
