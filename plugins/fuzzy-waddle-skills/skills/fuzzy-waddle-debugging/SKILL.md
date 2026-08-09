---
name: fuzzy-waddle-debugging
description: Use for debugging, regression fixing, multiplayer desync investigation, realtime transport issues, lockstep stalls, or root-cause analysis in this repository.
---

# Fuzzy Waddle Debugging

- Prefer static inspection first
- For an autonomous bug-fix PR, capture a minimal reproduction path and name the regression test or manual playtest needed before changing code.
- Stop for a human decision when the root cause is entangled with intentional gameplay, balance, authority, or networking behavior rather than treating it as a mechanical defect.
- Diff against `develop` when the failure looks like a regression
- Trace the exact failing invariant before patching
- Preserve existing comments; adapt code around them instead of deleting or rewriting them unless they are clearly wrong
- Reuse existing validation, transport, and recovery paths instead of adding parallel logic
- Avoid duplicating bug fixes across client and server when one authority point can enforce the invariant
- After fixing a non-obvious bug, add short inline comments or method docs that explain the invariant, the failure mode, and why the guard is required
- Keep those comments local to the fix; do not add broad narrative comments
- If a temporary client-side workaround is disproven by logs, remove it instead of stacking another workaround on top
- Prefer replacing hardcoded thresholds, constants, and one-off defaults with existing config, adaptive, or definition-driven paths when those already exist in the architecture
- Prefer root-cause fixes that restore the intended ownership boundary instead of scattering guards across callers
- When the bug involves strategy, economy, targeting, or AI state, check whether aggregate state should actually be per-player, per-resource, or per-building-type
- Treat blackboard/controller growth as a likely cause when debugging oscillation, stale decisions, or contradictory planner outputs
- When a system repeatedly scans the world or re-derives the same data, check whether the intended fix is to use or extend an index/service rather than adding more local filtering
- Avoid introducing `any` during debugging/refactors; preserve strict typing so the architectural boundary stays visible

## Review focus

- Startup ordering races
- Lockstep heartbeat gaps
- Authority and ownership invariants
- Auth or guard regressions on websocket flows
- Recovery paths that can reintroduce stale or duplicate state
- Hardcoded fallback logic that bypasses the intended adaptive or definition-driven architecture
- Aggregated state that hides distinctions the gameplay logic actually needs
- Planner/manager responsibility leaks that make the real invariant hard to locate
