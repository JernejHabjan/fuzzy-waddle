# Fastest credible path to victory — #827

## Outcome

The AI continuously chooses the lowest-risk, shortest credible route to an authoritative win from permitted evidence,
rather than following fixed army counts, booming indefinitely, or launching token attacks without follow-up pressure.

Recommended agent: `gpt-5.6-sol`, high effort for the first strategy/authority design; then `gpt-5.6-terra`, high effort
for bounded implementation and scenario repair. Estimated effort: 4–8 focused sessions.

## Cold start

Read only:

1. `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/architecture/combat-and-strategy.md`
2. STRAT-05–10, RAID-01/02, SCOUT-01–05, SEQ-01/02, and C-01–06 in the AI testing docs
3. `ai-skirmish-offense.ts`, `ai-adaptation-manager.ts`, `ai-macro-manager.ts`, and their focused specs
4. the latest SEQ report in `docs/ai/759-skirmish-ai/HANDOFF.md`
5. related issue #654 for event-driven opponent weakness evidence; do not duplicate stale legacy-controller state

Run `pnpm agent:doctor` and `pnpm agent:context -- --issue 827` before implementation.

## Decision contract

Compare executable candidates for attack, economy raid, contain, expand, stabilize/recover, counter/tech, and finish.
Score only permitted observations using expected travel/assembly/production time, useful combat value and target domains,
objective value, reinforcement time, economic opportunity cost, home-loss risk, confidence/staleness, and bounded failure
cost. Prefer the earliest credible terminal outcome, not raw aggression or one exact build order.

Every selection records objective, evidence, assumptions, expected useful effect, force/budget, launch/effect deadlines,
abort/recovery rule, rejected alternatives, and next reconsideration. Uncertainty creates a dated scouting question.

## Implementation order

1. Extract current fixed launch thresholds, one-launch gating, composition targets, retreat rules, and scouting/adaptation
evidence into a compact decision table. Reproduce SEQ mission-continuation failure before changing policy.
2. Define one typed strategic candidate/result contract and one manager authority. Reuse #654 evidence if implemented;
otherwise derive bounded weakness/opportunity inputs from current committed observations.
3. Generate only legal route/capability/resource candidates and rank them deterministically. Hard survival, fairness,
authority, and domain constraints precede utility scoring.
4. Connect the selected strategy to macro demand, squad mission lifecycle, scouting questions, counter-production, and
high-level debug intent. Prevent a completed/failed first attack from suppressing a new useful mission.
5. Add bounded hysteresis so small evidence changes do not oscillate, while major base threats or exposed finishing
opportunities trigger fast reassessment.
6. Validate with preset-world runtime cases from #826 and full SEQ matches from #816; calibrate weights and difficulty
only in #817 with paired seeds and the pinned baseline.

## Acceptance

- A reachable exposed core produces a finishing mission without unrelated spending indefinitely delaying victory.
- A favorable early timing window attacks before the generic deadline; an unfavorable visible counterforce chooses a
  better route, composition, economy window, or recovery rather than suicide.
- Strong economy and damaged-economy worlds at the same tick choose different justified strategies.
- Scouting evidence can switch rush/raid/contain/boom/tech choices; hidden enemy state cannot.
- Useful pressure continues through bounded follow-up missions until victory, genuine recovery, or evidenced infeasibility.
- Pure determinism, focused integration, representative Playwright outcomes, debug projection, save compatibility,
  omission audit, final closure audit, commit, push, GitHub update, and plan triage are complete.
