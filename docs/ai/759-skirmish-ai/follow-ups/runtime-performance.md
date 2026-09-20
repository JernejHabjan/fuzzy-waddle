# Skirmish runtime performance — #828

## Outcome and boundary

Make long, real Phaser skirmish matches responsive and shorten browser-matrix wall time without changing simulation
outcomes, decision authority, or fairness. This is runtime performance work, not the fastest-credible-victory strategy
policy in #827 and not a reason to weaken SEQ-01/02's 30,000-tick ceiling or first-launch-by-12,000 assertion.

Start on Sol/high for the profile and causal choice of hot path; use Terra/high for a bounded implementation after the
profile names its owner. Pair with #816's continuous-match runs, but keep focused 400–12,000-tick fixtures for fast
feedback. Do not block #827 on this optional optimization unless profiling shows a correctness failure.

## Cold start

1. Read the repo workflow, debugging, Phaser, and skirmish AI skills; then this file and `HANDOFF.md`.
2. Run `pnpm agent:context -- --issue 828` and inspect only its named source/test owners.
3. Baseline one repeatable SEQ-01/02 variant from `tools/ai/fixtures/stage-15-land-loop-runtime.json` at its existing
   seed, map, AI faction, 100× simulation scale and checkpoints. Preserve revision, fixture digest, scenario assertion
   outcome, tick count, decisions, wall time, and process starts. Do not compare unlike scenarios as speed evidence.
4. Inspect `apps/portal-e2e/src/e2e/skirmish-ai-runtime-variant-runner.ts`, the tick service, AI scheduler/observation
   capture, path/access queries, Phaser actor/component update loops, and checkpoint capture. Use the source index to
   locate the last four; do not read entire trees. The runner currently pauses at each checkpoint and waits for a
   settled decision, so isolate setup, simulated play, settle/capture, and teardown time.

## Required profiling and acceptance

- Record per-variant wall time and normalized milliseconds per 1,000 simulated ticks, plus checkpoint-specific times.
  Measure browser main-thread long tasks and game-frame time over representative early/mid/late windows; record machine
  and browser conditions. Distinguish CPU, browser startup, network/assets, and deliberate test waits.
- Add bounded, disabled-by-default timings around the measured hottest owner. Do not expose hidden-world facts, call
  planners from debug UI, or make timing data part of the deterministic decision input.
- Choose the highest-impact avoidable hot path by profile, not intuition. Optimize it in a small change; preserve tick
  ordering, observation generations, actor authority, seed/replay determinism, and command/effect reconciliation.
- Repeat the identical variant and a focused scenario at least three times before/after. Require identical authoritative
  outcome digests and all existing assertions; report median wall time and variance. If no meaningful speedup is
  measured, retain the profile and reject the speculative change.
- Add a targeted regression/benchmark guard for the chosen owner that is stable enough for CI. Avoid brittle absolute
  wall-clock gates on shared CI; use operation counts, allocations, or relative paired benchmarks where appropriate.
- Record the evidence in the PR and put durable profiling commands/guards in code-adjacent testing docs. Retire this
  follow-up when done; leave unresolved machine-dependent findings in the issue, not a permanent roadmap.

## Likely next action

First instrument where the existing 100× run spends time. A 30,000-tick test ceiling is not a 30,000-tick match
target; #827 separately owns strategy that turns scouting/economy advantage into earlier credible attacks and wins.
