# Autonomous issue delivery

## Lanes

- `agent-ready`: One bounded issue, one focused branch, one verified draft PR.
- `decision-pr`: Plan and resolve material product decisions before implementation.
- `research`: Produce evidence and implementation-ready follow-up issues without runtime changes.
- `manual-playtest`: Require human gameplay confirmation before merge.
- `deferred`: Keep visible but do not schedule.

## Delivery contract

For `agent-ready` issues, Codex may inspect, edit in scope, add meaningful tests, run focused
checks, create a branch, commit task-owned changes, push, and open a draft PR. Codex must not
merge, deploy, change secrets, delete material data, or decide ambiguous product, balance,
networking, persistence, or licensing behavior.

## Decision PR contract

Each decision must state the recommended default, rationale, impact of deferral, and accepted
reply forms: `Accept recommendation`, `Use: <alternative>`, or `Defer`. The PR must include the
next exact continuation prompt.

## Initial queue

| Issue | Lane | Goal |
| --- | --- | --- |
| #745 | agent-ready | Preserve actor selection on repeated right-clicks. |
| #733 | agent-ready | Red exit control; defer a distinct surrender action. |
| #751 | agent-ready | Explain the housing cap in the HUD. |
| #729 | decision-pr | Define an explicit campaign resource-visibility policy. |
| #641/#642 | decision-pr | Stage friends and party-system design. |
| #759 | research | Establish an RTS AI evaluation baseline and roadmap. |
