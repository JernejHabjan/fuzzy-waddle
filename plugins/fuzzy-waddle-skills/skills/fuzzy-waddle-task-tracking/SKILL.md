---
name: fuzzy-waddle-task-tracking
description: Write or maintain requested Fuzzy Waddle plans and cold-start progress records, with explicit decisions, stage ownership and evidence. Not needed for a small edit without planning work.
---

# Plans and cold starts

- Classify the work: agent-ready, decision-pr, research, manual-playtest or deferred. Research separates evidence/licensing, recommendations and unimplemented follow-up; a schema or brief is not shipped behavior.
- Inspect owning code before fixing architecture. State findings and the planning approach before a comprehensive plan, unless the user already directed it. Ask only material unanswered product/scope questions; offer a recommended default and deferral impact.
- Use one short document for a localized task. Split a cross-system plan only where ownership or resumability benefits; link shared decisions instead of copying them into every packet.
- Put requested durable plans beside feature docs, otherwise docs/ai/ with the issue number (000 if absent). Temporary execution plans belong in tmp/ai-plans/. Track them only when requested.
- Each stage names dependencies, existing source anchors versus new destinations, contracts/consumers, debug/save/cleanup duties where relevant, numbered acceptance, checks and out-of-scope work.
- Record the latest explicit user policy in one authoritative runbook. When it changes, reconcile kickoff prompts, stage endings, progress and overviews; an isolated “supersedes” note is insufficient.
- Define execution granularity separately from verification timing: one stage versus continuous work, focused versus final checks, and publication authority. Do not impose one task's schedule on unrelated issues.
- When requested, record recommended model/effort per stage and actual model/effort in progress. Recommendations are not automatic model switching or task creation.
- For a stop/review/commit/push stage boundary, read [stage delivery](../fuzzy-waddle-stage-delivery/SKILL.md). Use its requirement-to-evidence closure record rather than another unchecked checklist.

## Resume record

Before interruption or handoff, preserve branch/worktree, base and source provenance, current stage/substep, decisions and implemented symbols, acceptance evidence, exact check commands/results, unresolved defects versus infrastructure blockers, and the next action.

Use explicit states such as not_started, in_progress, stage_checked, validated and blocked. The plan defines their meaning; “code authored” never silently becomes “tests passed.” Invalidate affected evidence when shared inputs/contracts change. A cold agent must be able to resume from files and git without earlier conversation history.

Keep transferable implementation learnings in owning docs/contracts as they are proven. Update reusable skills only for demonstrated general lessons; do not encode speculative AI tuning as a global rule.
