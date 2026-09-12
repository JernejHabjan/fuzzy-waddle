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
3. Add tests with changed behavior, including Angular service/component changes. Run checks when user-authorized or required by the agent-ready lane; otherwise request approval. Start apps only when runtime verification is relevant. Batch implementation between meaningful verification boundaries: use the smallest causal check when feedback is needed, and avoid repeating full tests, lint, type checks, or builds after every small edit. Run the broader required set once the owned slice is stable and again only when later changes invalidate it. Testing/validation tasks are the exception—their evidence runs are the implementation work.
4. Review the changed stage as another engineer would: actual call path, edge cases, cleanup, error handling, compatibility, bounded work and documentation. Repair task-caused failures and rerun affected authorized checks.
5. Perform an Omission Audit against every acceptance item, then a separate Final Closure Audit after repairs/checks. An authored file, successful dispatch, or green unrelated test is not evidence of the required outcome.

## Maintainable names and size

- Name production files, symbols and durable docs after stable responsibilities. Issue-specific stage/phase numbers belong only in temporary plans and handoffs.
- New TypeScript, JavaScript and MJS files must stay at or below 400 non-comment lines, new or materially rewritten methods at or below 200 non-comment lines, and lines at or below 140 columns. Keep one substantive top-level class, interface, type or enum per file. Split by responsibility before committing; generated/vendor artifacts are not hand-maintained source.
- Repository lint owns enforcement. Existing violating files are content-hash baselined: editing one invalidates its exemption, so split it or make any baseline update explicit and reviewable. Never refresh the baseline merely to pass lint.

## Files and delivery

- Put one-off artifacts in ignored tmp/. Create durable plan files only when requested, beside feature docs; execution-only plans go in tmp/ai-plans/. Task tracking owns plan structure.
- Use git mv for meaningful tracked moves. Stage exact task-owned paths and inspect the staged diff; never include unrelated work. Ignored requested docs may need exact-path git add -f.
- Follow the explicitly chosen branch. Otherwise use the active environment's branch naming policy. Never recreate a branch solely to normalize its name.
- Commit/push/PR actions require explicit user authority or the applicable delivery lane. Verify local and remote SHAs; do not force-push, merge, deploy, or disable CI to finish.
- A required failed check, stale comment conflict or unverified push remains a named blocker. Keep partial implementation, focused validation and release validation distinct.
- Report outcome, evidence, outstanding limitations and the exact next action briefly. Present commit-message drafts/PR prose only when requested.
