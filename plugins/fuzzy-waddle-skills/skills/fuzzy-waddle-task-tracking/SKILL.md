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
- Treat stage and phase labels as execution-only vocabulary. Do not carry them into production filenames, symbols, persisted identifiers or durable product-doc titles; use stable responsibilities and record historical sequencing only in the task handoff/Git history.
- Follow-up plans use issue identity plus stable responsibility names. Keep them in a dedicated issue-plan directory, link them from the GitHub issue, and give a cold agent exact source anchors, dependencies, acceptance evidence, commands, and a stop condition without duplicating the plan into the product architecture docs.
- When requested, record recommended model/effort per stage and actual model/effort in progress. Recommendations are not automatic model switching or task creation.
- For a stop/review/commit/push stage boundary, read [stage delivery](../fuzzy-waddle-stage-delivery/SKILL.md). Use its requirement-to-evidence closure record rather than another unchecked checklist.

## Long roadmap controller

- Give a multi-issue roadmap one explicit entry issue and a dependency-ordered progress grid. A generic `continue implementing` request resumes an in-progress issue or selects the first dependency-ready issue; it never reconstructs order from chat.
- Before repeated expensive implementation/testing, define a tooling prerequisite when deterministic context, execution, triage, or report scripts will materially reduce later work. Finish and prove that gate before dependent work unless the user changes the order or it is genuinely blocked.
- Start that tooling prerequisite with a representative before-baseline and explicit quality invariants. Record exact token/cache fields only when supported telemetry exposes them; otherwise label stable proxies such as selected context bytes, duplicate reads, output size, process starts, cache hits, tool calls, and wall time. Compare after-results without selecting less required evidence.
- Require a closed improvement loop: the agent reviews measurements, ranks bottlenecks by evidence, makes one bounded change to the owning generic tool/script/skill/docs, and reruns the same benchmark. Keep only justified improvements or explicit tradeoffs; never self-edit directly from raw metrics, optimize from one noisy run, or weaken evidence. Promote only repeated general lessons into skills.
- Put repository-wide environment, context, project selection, verification, triage, metrics, caching, and output-budget behavior in generic tools with small domain adapters. Do not duplicate the generic core inside the feature that first needed it.
- Prefer generated bounded context and manifest-derived test selection over another hand-maintained index. Keep mutable counts, scenario registration, and status in one authority.
- Detect file-size, method-size, line-length, and ownership blockers before behavior changes. Route necessary behavior-neutral restructuring through a separate bounded lower-cost pass and commit; do not hide violations by refreshing a baseline.
- Keep exact model choices and verification timing in the task's authoritative runbook. Recommend stronger reasoning for unresolved design, authority or causal investigation, and economical implementation only after setup, contracts and acceptance are concrete; do not silently downgrade uncertain work.
- Group dependency-compatible work into coherent family/owner batches, not one model switch per file or scenario. When the user requests model-switch pauses, name the next boundary before work and stop there; continuous execution does not override an explicit pause. Do not promise cache reuse across models or chats.
- At session start and each agreed stop, report a compact grid with current batch/issue, state, authored versus validated evidence or blocker, dependency and next boundary. Recommend the next model/effort with one brief reason; recommendations do not change the active model.

## Resume record

Before interruption or handoff, preserve branch/worktree, base and source provenance, current stage/substep, decisions and implemented symbols, acceptance evidence, exact check commands/results, unresolved defects versus infrastructure blockers, and the next action.

Keep a bounded quick-resume block at the top of a long ledger: current provenance/ownership, last meaningful pass/failure artifacts, repairs made after that evidence, and one exact next command. Leave completed stage history below it so a cold agent need not load the whole file.
If execution is deferred, give the exact next authoring action instead of an executable check. Include selected IDs,
changed files/symbols, unresolved decisions, unrun checks and next-batch acceptance; link source anchors rather than
copying large logs or chat history. Reuse that record across compaction and cold starts.

Use explicit states such as not_started, in_progress, stage_checked, validated and blocked. The plan defines their meaning; “code authored” never silently becomes “tests passed.” Invalidate affected evidence when shared inputs/contracts change. A cold agent must be able to resume from files and git without earlier conversation history.

Keep transferable implementation learnings in owning docs/contracts as they are proven. Update reusable skills only for demonstrated general lessons; do not encode speculative AI tuning as a global rule.

## Retire execution artifacts

- Plans, progress ledgers, handoffs, and cold-start packets are temporary coordination artifacts. At each task close, triage every section as unresolved, durable, or historical instead of preserving the file by default.
- Move proven behavior and ownership into code/contracts; test invariants into typed fixtures/tests; operator guidance into focused code-adjacent documentation; and only demonstrated cross-repository workflow lessons into skills.
- Keep unresolved work in an open issue with a bounded cold-start plan. Remove completed TODOs and stage narration; Git and PR history preserve chronology.
- Before deleting a resolved plan, replace issue/PR/wiki/skill links with the owning durable docs, evidence, or commit. Delete the parent handoff and plan directory when no active consumer depends on them.
- Product source and durable documentation must not depend on a temporary roadmap file. At final closure, search for backlinks, stale issue states, duplicated rules, and completed plan vocabulary.
