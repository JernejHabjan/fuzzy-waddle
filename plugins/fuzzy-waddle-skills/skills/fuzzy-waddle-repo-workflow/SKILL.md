---
name: fuzzy-waddle-repo-workflow
description: "Use for repo workflow decisions in this repository: scope, verification, git actions, file placement, and comment-preservation rules."
---

# Fuzzy Waddle Repo Workflow

- Treat the full request as mandatory acceptance criteria
- Before writing code, convert every requirement into an internal numbered checklist
- Track every checklist item until it is completed or explicitly blocked with a reason
- Inspect the repository before implementation and identify affected contracts, implementations, registrations, call sites, configuration, documentation, and tests
- Treat one localized stage with no dependent follow-up as short work; treat work requiring multiple logical stages as multi-step work
- Split multi-step work into independently reviewable stages
- Implement tests with the owning stage when meaningful.
- For an issue labeled `agent-ready`, run the smallest relevant checks without asking and expand only when the change is shared or the focused check is insufficient. Outside that lane, run checks only when explicitly requested.
- Do not start apps locally unless runtime validation is applicable to the request
- Read complete errors, investigate every failure, fix implementation-related failures, rerun failed commands, then rerun the applicable suite
- If a failure is proven pre-existing and unrelated, record the evidence and continue every remaining verification command
- In a worktree, set `NX_DAEMON=false` for manual Nx validation and serialize package installation or heavy Nx commands across worktrees.
- Treat a zero-discovered-test result as an invalid focused check. Correct the selection or run the owning project suite before reporting test coverage.
- When a workspace-wide dependency/configuration edit makes CI build unrelated applications, run the matching affected production build locally before opening the PR. Create a separate tracked repair or decision item for any confirmed baseline failure.

## Stage gates

- Review the whole stage and affected surrounding code as if reviewing another engineer's pull request
- Check requirements, correctness, architecture, edge cases, error handling, naming, maintainability, duplication, registrations, call sites, configuration, documentation, tests, and relevant performance implications
- Search for partial implementations, incorrect assumptions, forgotten TODOs, stale comments, dead code, placeholders, debug code, broken references, and hidden regressions
- Fix every stage-review finding before continuing
- For an `agent-ready` issue, stage and commit only task-owned changes after the stage and closure audits. Otherwise, stage or commit only when explicitly requested.
- If task-owned changes cannot be isolated safely, stop and report the blocker instead of committing
- When explicitly requested to commit verification repairs, commit them separately
- For an `agent-ready` issue, push the focused branch and open a draft PR after successful required checks. For a `decision-pr` or `research` lane, open a draft PR with the plan/research and its explicit human questions. Never merge automatically.
- When creating a branch, never prepend `codex/`; derive names as `<type>/<issue-number>-<lowercase-kebab-case-title>` when an issue number and type exist, for example `fix/626-little-muncher-rejoin`
- Use types such as `fix`, `feature`, `refactor`, or `chore` when appropriate; otherwise use `<issue-number>-<lowercase-kebab-case-title>`
- If no issue number exists, omit it and use `<type>-<lowercase-kebab-case-title>` or `<lowercase-kebab-case-title>` as appropriate
- Only present commit-message drafts or PR notes to the user when asked
- If the task is understandable, do the work
- Only create a plan file when the user explicitly asks for one
- Put explicitly requested durable design/architecture plans alongside the owning feature documentation or in the user-requested documentation directory. Migrate implementation-specific durable decisions into the owning code as it is built. Put execution-only temporary plans in `tmp/ai-plans/` and remove them when their task closes unless the user asks to retain them.
- Put debug or one-off files in `tmp/`
- Use `git mv` for meaningful tracked-file moves
- Preserve unrelated user notes and generated comments, but proactively update existing documentation/comments when functionality changes, a contract evolves, or clearer maintenance guidance is needed. Never leave behaviorally stale documentation behind.
- Add short class or method docs when changing non-trivial services, managers, gateways, or controllers
- After fixing a non-obvious bug, add short inline comments or method docs near the fix that explain the invariant and why the guard is required
- Prefer extending an existing authority point or helper over duplicating the same fix in multiple places
- Prefer specific shared contracts, discriminated unions, enums, and typed guards over `any`, broad `unknown`, `Record<string, ...>`, non-null assertions, or string-key `"prop" in value` probes
- Strongly type identifiers and relationships between records with shared types, literal unions, or enums; do not pass linked entity IDs as unconstrained `string`
- Prefer one exported class, interface, or substantial type per file, especially outside shared libraries; colocate only tiny, tightly coupled contracts
- Add concise class, member, and method documentation where ownership, lifecycle, persistence, or orchestration is not self-evident
- Consider documentation for every new or changed class, interface, type, enum, field, method, and function while implementing it; update nearby documentation in the same change when behavior changes.
- Review existing documentation on every changed symbol and its immediate authority/call-path neighbours; correct, expand, or replace it when it is stale, incomplete, or merely repeats the name.
- Document most symbols that are not self-explanatory, including public contracts and non-obvious implementation symbols. Omit boilerplate for trivial constructors, getters, setters, and one-line forwarding helpers when the signature already makes behavior clear.
- Treat interfaces, type aliases, enums, discriminated unions, and nested object/type-literal members as first-class API documentation. Document each non-trivial declaration and member/property with its semantic role, ownership, valid representation, ordering/persistence implications, and `{@link OwningContract}` or related-symbol links; document enum members as distinct behavioral choices rather than labels.
- Apply the same documentation standard to private methods and fields: document private orchestration, state mutation, ordering, cleanup, persistence, and error-handling logic when a future maintainer cannot safely infer it from the signature and a few lines of code.
- Explain intent, ownership, lifecycle, ordering, invariants, side effects, persistence, error handling, and related authority points as applicable; never merely restate the symbol name.
- Scale documentation to complexity: a long, branch-heavy, stateful, asynchronous, deterministic, or cross-layer method needs proportionally more detail than a short local helper. Link related methods/classes/contracts with `{@link Symbol}` and use `@see` for external issue/design sources when they explain the relationship.
- When replacing a design brief, issue body, or temporary planning document, migrate its durable decisions, invariants, workflows, failure modes, and ownership boundaries into the owning code contracts/classes/methods. Use compact ASCII flow diagrams in code comments when they clarify three or more dependent stages, authority boundaries, or recovery order; do not add decorative diagrams or leave the code dependent on a deleted document.
- When auditing or migrating user-supplied design notes, distinguish executable behavior from contracts, scaffolds, planned references, placeholders, and deferred work in the owning code. Never infer issue completion merely from a schema, registry, or implementation brief; retain stable source-to-symbol traceability and report unimplemented acceptance criteria explicitly.
- Document changed SQL migrations and schema definitions: explain non-obvious tables, types, columns, constraints, indexes, policies, triggers, and functions with SQL comments. Include a compact SQL comment workflow when a transaction, migration, or restore path coordinates three or more stages.
- When creating or materially changing an inline object literal without a direct type annotation, use `satisfies ExactContract` whenever an exact contract exists. Prefer this over an assertion so the IDE checks keys and retains literal inference; do not use `as` to bypass an available contract.
- Keep untrusted boundary parsing explicit: accept `unknown` only at transport/storage boundaries, narrow immediately with named type guards, then pass typed values internally
- When touching nearby legacy code, remove avoidable `any`/`!` if the cleanup is local and does not broaden the task

## Completion audits

- Perform an Omission Audit after implementation; inspect the repository instead of answering from memory
- Reconcile the checklist and search for skipped requirements, partial features, missing edge cases, call sites, registrations, exports, imports, contracts, serialization, configuration, documentation, tests, stale comments, dead code, placeholders, and debug code
- Add every discovered gap to the checklist, implement it, review it, and repeat the audit until no gaps remain
- Perform a separate Final Closure Audit after implementation, and after any explicitly requested verification
- Confirm the feature is complete end to end, all affected call sites are consistent, supporting infrastructure is present, earlier stages left no unfinished work, and no temporary implementation remains
- If the closure audit finds a gap, implement and review it, then rerun only verification explicitly requested by the user and repeat the audit
- Do not declare full completion while requirements, explicitly requested verification, audits, stale comments, or external blockers remain unresolved
- Keep the final report terse while covering checklist completion, explicitly requested commits, modified areas, repository-wide impact, explicitly requested verification results, audit findings and repairs, assumptions, limitations, and blockers

## If a plan file is requested

- Only create or update a plan file when the user explicitly asks for one
- Use the task-tracking skill's proportional planning workflow before choosing document count and placement
- File naming: `<owning-docs-directory>/<ticket-number>-<short-title>.md` for durable requested plans, or `tmp/ai-plans/<ticket-number>-<short-title>.md` for execution-only temporary plans
- If no ticket number is known, use `000`
- Use checkboxes for completed, active, and remaining work
- Keep plan files proportional to task complexity
- Keep requested temporary plan files ignored unless the user asks to track them
