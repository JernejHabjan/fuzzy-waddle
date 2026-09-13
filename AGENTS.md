# AGENTS.md

This file is the repo-level router for Codex and similar coding agents.

## Use Skills First

Before substantial work, inspect repo-local skills under:

- `plugins/fuzzy-waddle-skills/skills/*/SKILL.md`

Use the smallest matching set.
Read each selected `SKILL.md` once per logical turn. After compaction, trust the continuation summary that records a complete skill read; reopen only a changed skill or a specifically needed reference.

## Required Skill Routing

- Repo workflow: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-repo-workflow/SKILL.md`
- Debugging or regression work: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-debugging/SKILL.md`
- Plan or progress file: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-task-tracking/SKILL.md`
- Explicit stage/phase close and handoff: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-stage-delivery/SKILL.md`
- Phaser gameplay or GUI: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-phaser/SKILL.md`
- Skirmish AI implementation, runtime matrix, or calibration: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-skirmish-ai/SKILL.md`
- Autonomous issue delivery: `plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-autonomous-delivery/SKILL.md`

For source discovery, use the workflow skill's [source index](plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-repo-workflow/references/source-index.md). Use the repo-local Angular or NestJS skill only when that framework owns the change. Commit/PR scope and evidence are covered by repo workflow and autonomous delivery.

When multiple skills apply:

1. Repo workflow or task tracking
2. Debugging skill when the task is root-cause analysis, regression fixing, or behavior hardening
3. Framework skill
4. Skirmish AI skill when applicable
5. Stage delivery or issue delivery when applicable

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
