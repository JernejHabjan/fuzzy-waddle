# AGENTS.md

This file is the repo-level router for Codex and similar coding agents.

## Use Skills First

Before substantial work, inspect repo-local skills under:

- `plugins/fuzzy-waddle-skills/skills/*/SKILL.md`

Use the smallest matching set.

## Required Skill Routing

- Repo workflow: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-repo-workflow/SKILL.md`
- Debugging or regression work: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-debugging/SKILL.md`
- Plan or progress file: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-task-tracking/SKILL.md`
- Phaser gameplay or GUI: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-phaser/SKILL.md`
- Angular app work: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-angular/SKILL.md`
- NestJS backend work: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-nestjs/SKILL.md`
- Commit message request: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-commit-message/SKILL.md`
- JetBrains/Junie commit-message workflow: `.junie/commit-prompt.md`
- PR notes request: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-pr-notes/SKILL.md`
- Autonomous issue delivery: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-autonomous-delivery/SKILL.md`

When multiple skills apply:

1. Repo workflow or task tracking
2. Debugging skill when the task is root-cause analysis, regression fixing, or behavior hardening
3. Framework skill
4. Commit or PR output skill

## Global Rules

- Treat every requirement as a mandatory acceptance criterion
- Before implementation, create an internal numbered checklist and track every item to completion or an explicit blocker
- Inspect the repository for affected contracts, implementations, registrations, call sites, configuration, documentation, and tests
- Split multi-step work into logical stages; review and repair each stage before automatically committing only its task-owned changes
- For an issue labeled `agent-ready`, run the smallest applicable formatting checks, lint, type checking, tests, builds, and repository validation without asking; repair failures caused by the task and repeat the affected checks.
- For work outside the `agent-ready` lane, request explicit approval before running verification.
- Add or update tests when meaningful; always update tests for new or behaviorally changed Angular services and components
- Perform an Omission Audit and a separate Final Closure Audit before declaring completion
- For an `agent-ready` issue, create a focused branch, commit only task-owned changes, push it, and open a draft PR automatically. Never merge a PR automatically.
- Never stage unrelated changes. Never push or open a PR automatically outside the `agent-ready`, `decision-pr`, or `research` lanes.
- Do not create plan markdown files unless explicitly prompted
- Use `git mv` for meaningful tracked-file moves
- Do not remove, rewrite, or move existing comments without explicit permission; treat comments made stale by a change as blockers until permission is granted

## Response Style

- Keep responses short
- Use bullets by default
- Do not add extra explanation unless asked

<!-- jbcontext-instructions-start -->
# Tools

## Semantic Code Search (jbcontext)

You have access to `jbcontext search` for searching the codebase semantically.
Use the `/context-search` skill or run `jbcontext search "<query>"` to find code by meaning, not just keywords.

### When to use

`jbcontext search` is a **code-discovery** tool. Reach for it only when a task requires finding or understanding code whose location you don't already know.

Skip it — go straight to the right tool — when:
- the task names the exact file, class, or symbol (keyword grep is faster);
- the relevant file is already open or identified;
- the task doesn't involve locating code at all — git operations (rebase, merge, commit), running tests or builds, shell/statusline/config setup, or reviewing a diff you already have.

### How to use it
- Start with `jbcontext search` before planning, editing, or exact search in unfamiliar code when you do not yet know the right file, subsystem, implementation, or related test.
- Use one focused natural-language query per search.
- Do not start with grep, ripgrep, or find when the search problem is still semantic or exploratory.
- Inspect the first relevant file or directory before issuing another broad semantic search.
- Use another broad `jbcontext search` only if the local path stops being productive.
- Once you know the relevant file, symbol, or directory, switch to direct file reads or exact search for local inspection.
- If you search again after finding a relevant area, narrow with `-p <path>`.

<!-- jbcontext-instructions-end -->
