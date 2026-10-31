# Post-task agent learning

Use this after a task boundary when the user requests self-improvement or retained evidence shows repeated workflow
friction. Do not load full chat history merely to search for possible improvements.

1. Gather bounded evidence from retained reports, context packets, command failures, duplicate reads, retries, process
   starts, output size, wall time, and available token/cache telemetry. Mark unavailable telemetry unknown; use stable
   proxies without presenting them as token counts.
2. Rank at most three material bottlenecks and assign each to its narrowest durable owner:
   - product behavior or invariant: code and tests;
   - stable domain operation: code-adjacent documentation;
   - repeated deterministic mechanics or output reduction: a generic tool or script;
   - repeated decision error that tools cannot prevent: the smallest matching skill;
   - one-off friction or weak evidence: no persistent rule.
3. Make one bounded improvement batch. Remove displaced or duplicated guidance. Never reduce required evidence, weaken an
   oracle, expand task authority, or rewrite a stable skill simply to record that a task occurred.
4. Replay the same representative command or workload when practical. Validate changed tools and skills through their
   owning checks, and keep the change only when quality is preserved.
5. Record the before/after measure or proxy and any tradeoff in the existing handoff or delivery summary. Commit the
   improvement separately when that makes ownership or rollback clearer.

Batch demonstrated learning at meaningful task boundaries. Repeated edits to shared skills can invalidate cached context
and cost more than they save; prefer stable tools and bounded generated output over accumulating prose instructions.
