# RTS AI — execution handoff

Updated 2026-10-31. Review repaired the CI blocker. Remote run 41249184852 passed all seven core runtime cases.
REMAINING-WORK owns acceptance; CURRENT-EVIDENCE owns provenance and limitations.

## Current state

- Branch feature/759-skirmish-ai; Node 24/pnpm; PR #814 stays draft.
- 0c73050a4: explicit ai-regression/* tag trigger and per-repetition omission accounting (six focused tests pass).
- d6ddd363a: hydrate Git LFS assets in all three runtime CI paths. First remote run failed before matches because assets were pointer files.
- Successful run: https://github.com/JernejHabjan/fuzzy-waddle/actions/runs/41249184852 at d6ddd363a, tag ai-regression/review-20261031-2.
- Native SCOUT-02 full-family and strategic evidence remain recorded in CURRENT-EVIDENCE. No gameplay changes in this review.
- Local core pack passed 7/7 in 25m27s; both owning compilers and changed-file lint pass. Full project lint retains the documented legacy errors.

## Next execution

Read the N1-N3 completion packet at the top of REMAINING-WORK.md. It defines the next goal, source anchors, verification and finish criteria. Preparation only; start on go.

## Remaining acceptance

- F3 explicitly requires integrating passing SCOUT-02 variants into R. The core pack omits all SCOUT-02 variants; earlier F1–F3 complete status overstated closure. Native scouting proof is present, periodic regression integration is unfinished.
- Preserve the core pack budget when adding a separately bounded scout coverage option; do not silently expand the default beyond 30 minutes or substitute individual diagnostic runs for paired fairness comparisons.
- C2 remote execution blocker is resolved. Manual dispatch still needs default-branch registration, but an explicitly pushed ai-regression/* tag runs the identical workflow now.
- Keep the goal incomplete until remaining acceptance is verified. No unchanged reassurance match reruns.

## Guardrails

- One local native runner, <=30 minutes per invocation; retain applicable evidence.
- No merge, PR readiness change, multiplayer certification, D-06 calibration or advanced replay claims.
- Update these records in place. Git stores history; no additional session logs.
