---
name: fuzzy-waddle-debugging
description: Diagnose Fuzzy Waddle regressions, AI loops, lifecycle faults and multiplayer desyncs from causal evidence. Implement repairs only when authorized.
---

# Find the first broken invariant

1. Record observed versus expected behavior and the smallest reproducer/check that can distinguish them. Start with static ownership and recent diffs; compare develop only when investigating a regression.
2. Use the repo/RTS source index to follow input -> owner -> command/state transition -> applied outcome -> cleanup. Inspect adjacent tests before broad searches.
3. Check the first disagreement, not only the final symptom. Distinguish stale observation, rejected application, unresolved acknowledgment, genuine no-progress and slow-but-valid work.
4. Name the responsible invariant and its single authority. A mechanical repair must not silently change intentional balance, UX, persistence, security or multiplayer authority; ask for material unresolved decisions.
5. When a fix is authorized, add the narrow failing-before/passing-after regression and repair that owner. Reuse validators/indexes/recovery paths; do not scatter client/server guards or stack disproven workarounds.
6. Run authorized affected checks, inspect complete errors and prove unrelated baseline failures before classifying them. Perform repo omission/closure audits; report diagnosis separately from implemented and verified changes.

## High-value probes

- AI loops: demand scope per player/resource/service/type, counted commitments, stale plans, queue readiness and actual delivered/achieved progress. A new plan ID or repeated blocker label is not recovery.
- Realtime/desync: startup order, scheduler ticks, host/owner epoch, shared command identity, delayed/lost outcomes, snapshot generation and restore continuation.
- Repeated scanning/derived state: inspect the existing index and invalidation path before adding another cache or whole-world loop.
- GUI: compare observed projection with its authoritative source; debug tools must not mutate or advance the live game.

Preserve existing comments; add a local explanation for a non-obvious repaired invariant. Keep strict boundary parsing and typed contracts. Capture only relevant diagnostic state; do not expose hidden player data or credentials in logs.
