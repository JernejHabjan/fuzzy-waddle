# Continuous play and difficulty calibration — #817

## Outcome

Continuous skirmish behavior is purposeful and bounded, candidate/baseline comparison is isolated, and Easy/Normal/Hard
ordering is supported by paired-seed evidence rather than anecdotes.

Recommended agent: `gpt-5.6-terra`, high effort. Ask for `gpt-5.6-sol`, high effort, only for a bounded reproducible
baseline/statistical investigation; reserve `gpt-6-astra` for an exceptional unresolved cross-system design problem.

Estimated effort: **XL**, about 4–8 focused agent sessions or 3–7 engineering days, plus required soak runtime.

Dependency: complete #824 and stabilize the required SEQ runtime path before calibration.

## Cold start

Read only:

1. `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/difficulty-calibration.md`
2. the SEQ and D-06 rows in `tools/ai/fixtures/skirmish-v1.json`
3. `tools/ai/fixtures/stage-15-land-loop-runtime.json`
4. `tools/ai/fixtures/baseline-v1.json` and `difficulty-calibration-v1.json`
5. the latest compact SEQ report recorded in `docs/ai/759-skirmish-ai/HANDOFF.md`

The pinned baseline is `de47f482889db30420692bf4406fba463d7db296`. Never substitute candidate code when the
baseline checkout/adapter fails.

## Implementation order

1. Rerun SEQ-01/02 and repair only the earliest causal failure. Preserve finite mission deadlines and authoritative
   terminal rules; do not loosen recovery or liveness oracles.
2. Execute candidate and pinned baseline from isolated clean worktrees/processes. Validate source and fixture provenance
   before comparing results.
3. Define paired measurements for opening reliability, economy, army composition, first useful attack, damage/losses,
   recovery, terminal result, decision work, and fairness invariants.
4. Run identical map/faction/side/opponent seeds across profiles. Start at 20 paired seeds; expand toward 100 only when
   uncertainty remains decision-relevant.
5. Run at least three 60-minute-simulation soaks and verify bounded memory, histories, queues, claims, and decision work.
6. Record human challenge/predictability observations separately; they cannot replace automated correctness.

## Evidence and completion

- SEQ scenarios have meaningful terminal or explicitly valid continuing outcomes within their contracts.
- Candidate/baseline reports prove isolated SHAs and matching workload definitions.
- Difficulty ordering is statistically supported without hidden information, free resources, or stat cheats.
- Soaks and lifecycle bounds pass.
- Update calibration docs with methodology and compact results, audit omissions/closure, commit, push, and close #817.
