---
name: fuzzy-waddle-repo-workflow
description: Apply Fuzzy Waddle scope, verification, source-discovery and git ownership rules. Use for repository work; load only the relevant supporting reference.
---

# Repo workflow

## Read only what the task needs

- Unknown ownership: [source index](references/source-index.md). Known file/symbol: open it directly; do not rediscover the repository.
- Code, contracts or documentation migration: [coding and documentation](references/coding-contracts.md).
- Running checks or diagnosing tooling: [verification routes](references/verification.md).
- Plan/progress work: use the task-tracking skill. A requested stage boundary uses the stage-delivery skill. Issue-lane delivery uses autonomous-delivery; neither grants authority beyond the request.

## Scope and evidence

1. Read AGENTS.md and current git status. Turn the request into a numbered internal acceptance checklist; inspect the affected authority, consumers, registrations, config and tests.
2. Implement only the requested change. Diagnostic/review requests do not authorize fixes or external writes. Preserve unrelated changes and existing comments; follow AGENTS.md's comment-preservation rule.
3. Add tests with changed behavior, including Angular service/component changes. Run checks when user-authorized or required by the agent-ready lane; otherwise request approval. Start apps only when runtime verification is relevant.
4. Review the changed stage as another engineer would: actual call path, edge cases, cleanup, error handling, compatibility, bounded work and documentation. Repair task-caused failures and rerun affected authorized checks.
5. Perform an Omission Audit against every acceptance item, then a separate Final Closure Audit after repairs/checks. An authored file, successful dispatch, or green unrelated test is not evidence of the required outcome.

## Files and delivery

- Put one-off artifacts in ignored tmp/. Create durable plan files only when requested, beside feature docs; execution-only plans go in tmp/ai-plans/. Task tracking owns plan structure.
- Use git mv for meaningful tracked moves. Stage exact task-owned paths and inspect the staged diff; never include unrelated work. Ignored requested docs may need exact-path git add -f.
- Follow the explicitly chosen branch. Otherwise use the active environment's branch naming policy. Never recreate a branch solely to normalize its name.
- Commit/push/PR actions require explicit user authority or the applicable delivery lane. Verify local and remote SHAs; do not force-push, merge, deploy, or disable CI to finish.
- A required failed check, stale comment conflict or unverified push remains a named blocker. Keep partial implementation, focused validation and release validation distinct.
- Report outcome, evidence, outstanding limitations and the exact next action briefly. Present commit-message drafts/PR prose only when requested.
