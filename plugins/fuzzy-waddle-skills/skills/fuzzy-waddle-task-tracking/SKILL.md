---
name: fuzzy-waddle-task-tracking
description: Use when the user asks for implementation planning, architecture/design planning, a roadmap, issue decomposition, plan documents, or durable progress tracking in this repository.
---

# Fuzzy Waddle Task Tracking

- Use the internal numbered implementation checklist required by the repo workflow for every implementation task

## Planning workflow

- Classify every substantial issue before implementation as `agent-ready`, `decision-pr`, `research`, `manual-playtest`, or `deferred`.
- For `decision-pr` work, create a reviewable plan before implementation. Record each material question with a recommended default, impact of deferral, and a copyable continuation prompt.
- For `research` work, separate evidence, licensed/reusable inputs, product recommendations, and implementation-ready follow-up issues. Do not represent research as shipped behavior.

- Scale planning to the task. For a small, localized change, use one concise plan with scope, approach, affected areas, and verification. Do not require a large document set or issue breakdown.
- For a multi-area feature, architecture, or roadmap, inspect the relevant repository code, existing documentation, issues, and decisions before fixing boundaries or authoring the plan.
- Report findings and the proposed planning approach before producing a comprehensive plan, unless the user explicitly asks to skip that checkpoint.
- Treat the newest explicit user decision as authoritative. Record material assumptions, conflicts between sources, unresolved decisions, and recommendations separately from confirmed decisions.
- Ask as many questions as the feature genuinely needs, but group them into coherent topical bursts and narrow later questions using earlier answers. Ask only where an answer materially changes product behavior, architecture, scope, or delivery order; provide a recommended default and accept concise or "unsure" answers.
- Flag high-effort, low-impact, speculative, or dependency-blocked work. Keep it visible in the plan with its rationale, dependencies, and a deferred/lower-priority status instead of silently absorbing it into the initial scope.
- Split substantial plans into focused, cross-linked documents only when that improves ownership and resumability. Give each document its own scope, dependencies, decisions, staged checklist, verification/testing expectations, acceptance criteria, and explicit out-of-scope/deferred work.
- When the user requests issue decomposition, map each issue to the relevant plan document(s), prerequisites, acceptance criteria, and implementation order. Do not create or edit external issues unless the user explicitly authorizes that action.

## Durable planning and progress files

- Create a durable plan or progress file when the user asks for plan documents, chunking, progress tracking, resume support, or a durable checklist in the repository.
- Put durable design/architecture documents alongside the owning feature documentation or in the user-requested documentation directory. If neither is clear, use `docs/ai/<ticket-number>-<short-title>.md`; use `000` when no ticket number is known.
- Put temporary execution-only plans in `tmp/ai-plans/<ticket-number>-<short-title>.md`.
- Use checkboxes and keep documents proportional to the work.
- For work spanning sessions, record current stage, completed criteria, remaining work, dependencies/blockers, material decisions, verification results, and the exact next action.
- Keep plan files ignored unless the user asks to track them.
- Update durable progress before ending the session.
