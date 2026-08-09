---
name: fuzzy-waddle-autonomous-delivery
description: Deliver a single well-scoped Fuzzy Waddle GitHub issue from investigation through a verified draft PR. Use for issues labeled agent-ready, decision-pr, or research; use it when Codex may create branches, commits, pushes, and draft PRs but must stop for product or high-risk decisions.
---

# Fuzzy Waddle Autonomous Delivery

## Delivery lanes

- `agent-ready`: Implement one issue with explicit acceptance criteria. Create a branch, run focused checks, commit, push, and open a draft PR.
- `decision-pr`: Inspect and write a staged plan only. Open a draft PR containing material questions and recommended defaults; wait for reviewer answers before implementation.
- `research`: Produce cited findings and small implementation-ready issues. Do not copy code or assets without verified licensing, and do not claim research is an implementation.

## Agent-ready workflow

1. Confirm the issue is self-contained and identify the owning code, contracts, registrations, tests, and manual playtest path.
2. Stop before changing code if UX, balance, asset licensing, multiplayer authority, persistence, security, or scope is materially ambiguous.
3. Implement the smallest complete change and update meaningful tests.
4. Run focused validation, self-review, omission audit, and final closure audit. A focused test command that reports zero discovered tests is not validation; rerun the owning project test target or correct the filter.
5. Commit only task-owned files, push a focused branch, and open a draft PR.
6. In the PR, state the issue, behavior change, checks, manual playtest, risks, and any follow-up.

## Reliable verification in worktrees

- Serialize package installation and Nx verification across worktrees. Set `NX_DAEMON=false` for manual validation so a stale daemon cannot contend with another worktree or leave an orphaned build process.
- Before opening a PR that changes workspace-wide dependency resolution, run the exact affected lint and production-build commands used by CI. Treat configuration files and lockfiles as potentially affecting every application.
- If a full affected check exposes an unrelated baseline failure, preserve the evidence, create a separate issue or decision PR, and do not silently waive the failed check or mix its repair into the original change.
- Record which checks were local, which ran in GitHub, and any remaining baseline blockers in the PR body.

## Decision-pr protocol

- Split the design into independently reviewable stages with acceptance criteria and dependencies.
- For every question, include the recommendation, rationale, deferral impact, and a reply format: `Accept recommendation`, `Use: <alternative>`, or `Defer`.
- Add a copyable continuation prompt that says which stage to implement and treats answered questions as authoritative.

## Safety boundaries

- Never merge, deploy, change secrets, delete material data, or bypass required review.
- Never expand an issue into a broad refactor or additional feature without recording it as follow-up work.
- Use a separate PR for each independently deployable issue; do not mix unrelated fixes.
