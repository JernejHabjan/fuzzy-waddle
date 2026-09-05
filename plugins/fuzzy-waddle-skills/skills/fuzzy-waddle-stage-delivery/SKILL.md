---
name: fuzzy-waddle-stage-delivery
description: Close and hand off one user-authorized implementation stage with acceptance evidence, fresh self-review, scoped checks and authorized git publication. Use for explicit stage or phase boundaries, not every small edit.
---

# One stage, evidence, handoff

The user's plan owns the stage boundary, required checks and git authority. This skill does not authorize extra work, automatic next stages, model changes, new tasks, deployments or merges.

## Start

1. Read the runbook, shared contracts, current stage and relevant cross-cutting cases; use the progress ledger and git to verify prerequisites. Do not reread every unrelated packet.
2. Confirm the selected stage, branch and model/effort. Record actual settings; if unavailable, say unknown rather than infer them. A recommendation does not switch the running model.
3. Create a numbered acceptance map covering every mandatory stage requirement, including owning cross-stage cases. Link each to planned symbols, consumers, checks and required docs/debug/save/cleanup evidence. Resolve conflicting policy before implementation.

## Close in this order

1. **Implementation review:** compare the whole stage diff with its acceptance map, as if reviewing another engineer's work. Trace real input-to-outcome paths, registrations, callers, lifecycle, boundaries and failure behavior. A self-review is not an independent reviewer.
2. **Omission Audit:** revisit the original stage text and all linked obligations. For each item record implemented path/symbol, evidence and status. Search for unused new code, no-op adapters, unregistered tests, placeholders, stale docs/comments and missing negative/recovery cases. Explain genuine not-applicable items; do not silently drop requirements.
3. **Verification/repair:** run the user/lane-authorized stage checks, repair task-caused failures, then rerun affected checks. Preserve source/config/fixture provenance. Explicitly deferred final tests stay deferred; a required unavailable check blocks stage readiness.
4. **Final Closure Audit:** after repairs/checks, recheck the acceptance map, immediate consumers and staged scope. Every mandatory item needs implemented-and-evidenced status or an explicit blocker. A green partial test set does not close missing behavior.
5. **Durable handoff:** update the existing progress ledger with acceptance evidence, exact commands/results, actual model/effort, known limitations, proven docs/skill learnings, next stage/model/effort and copyable resume prompt. Do not create a new plan unless requested.
6. **Publish when authorized:** inspect and commit exact task-owned changes; push the selected branch normally and verify the remote branch SHA matches the intended commit. Keep any integration PR draft until final validation. A failed/rejected push is a delivery blocker; do not force-push or claim publication.
7. **Stop at the requested boundary:** return the stage result and handoff, then end the turn. No implementation of the next stage or automatic follow-up task. If continuous execution was explicitly requested instead, follow that policy; never infer it from a numbered roadmap.

## Evidence record (in the owning progress file)

- Stage / acceptance ID / status / implemented symbols and consumers / focused check and result / deferred final evidence.
- Separate implementation readiness from delivery: checked, commit created, remote verified. If a push fails after checks pass, resume publication, not implementation.
- Record tested source revision or dirty-diff digest before the closure commit. Report the final commit/remote SHA in the handoff; the next agent verifies the commit containing the ledger. Do not invent a self-referential commit SHA inside its own contents.
- Record remaining blockers honestly. If already satisfied by existing code, prove equivalence and checks, then commit the task-owned evidence update when authorized; do not invent runtime changes.

## Resume

On the next user request, verify branch/remote and the last stage's evidence. If unfinished, resume that stage/substep. If checked but unpublished, resolve publication first. Only then select the next authorized stage. Repair invalidated prior evidence before advancing; never trust a stale checkbox after a shared-contract change.
