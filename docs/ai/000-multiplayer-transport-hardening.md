# Multiplayer Transport Hardening

- [x] Reduce state-hash noise so desync reports focus on deterministic order intent and cooldown/runtime state.
- [x] Add recent local tick timeline diagnostics to lockstep logs so stale-heartbeat and stall cases show send/echo/commit order.
- [ ] Collapse startup seeding, steady-state heartbeats, and snapshot-reset heartbeats into one authority path with shared tick selection.
- [ ] Add explicit per-player tick lifecycle tracking on both client and API: accepted, relayed, echoed, committed, flushed.
- [ ] Make reconnect/snapshot reset atomic: pause, reset cursors/buffer, seed only canonical next ticks, resume after coherent echo state.
- [ ] Tighten stale-backfill handling so old recovery heartbeats cannot leave buffer holes or confuse canonical tick ownership.
- [ ] Re-review combat cooldown and target-selection determinism once transport ordering is stable.
