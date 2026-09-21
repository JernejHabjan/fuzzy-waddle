# Adaptive economy and threat-aware spending — #829

## Outcome

Standard skirmish players start with 200 food, wood, stone, and minerals instead of 2,000. The AI grows a sustainable
economy from that same legal start, scales labor and renewable food to dated demand, reacts to credible pressure, and
still converts a real finishing opportunity instead of booming indefinitely.

Recommended agent: `gpt-5.6-sol`, high effort for macro/defense authority and policy design; then `gpt-5.6-terra`, high
effort for bounded implementation, fixtures, and focused verification. Estimated effort: 3–6 focused sessions.

## Cold start

Run `pnpm agent:doctor` and `pnpm agent:context -- --issue 829`, then read only:

1. `libs/games/probable-waffle/protocol/src/lib/game-instance/probable-waffle/player.ts` and adjacent state tests;
2. `ai-macro-manager.ts`, `ai-resource-forecast.ts`, `ai-worker-recovery.ts`, `ai-skirmish-defense.ts`, and adjacent specs;
3. the economy, defense, combat, runtime-E2E, and debug documents linked by the AI documentation index;
4. SEQ-01/02 plus the smallest applicable ECO/PRO/DEF fixture rows;
5. the latest retained evidence in `docs/ai/759-skirmish-ai/HANDOFF.md`.

The current six-worker value is an opening/recovery floor. It must not remain the effective long-game workforce target.
The current 600-tick forecast prices unmet demand but does not yet turn dated income need, saturation, and threat into a
growing workforce target.

## Decisions and boundaries

- Change the shared standard player reset to exactly 200 of every registered skirmish resource: food, wood, stone, and
  minerals. Both human and AI players receive the same start.
- Preserve explicit campaign starting-resource values and preset-world grants. A fixture that needs a different economy
  must declare it; it must not silently inherit the standard start.
- Compute desired workers from useful assignments, dated spending demand, delivery rate, travel/congestion, losses, and
  safe saturation. Six remains a recovery floor, not a cap or unconditional production target.
- Forecast food runway from stockpile, delivered income, committed spending, and expected consumption. Create workers,
  Fields, and required drop-offs before starvation, and stop useful duplicates when service is saturated.
- One strategic budget decision coordinates economy, production, defense, recovery, and attack. Threat response uses only
  visible or confidence-decayed observations, compatible domains, route/arrival evidence, and protected asset value.
- Safe, pressured, and emergency states change spending priority without deleting valid long-term demand. When pressure
  clears, economic growth resumes. A credible finishing attack may override further optional economic growth.
- Surface actual/desired workers, assignments, food runway, forecast deficits, threat state, budget split, chosen posture,
  and blockers in the existing high-level AI debug projection.

## Implementation order

1. Add protocol-level assertions for the 200-resource default and inventory every explicit override/fixture affected by
   the change. Do not rewrite campaign-specific values as a side effect.
2. Extract a typed, deterministic workforce-and-runway decision from the oversized macro owner. If source limits block
   the change, complete the smallest behavior-neutral #821 split first.
3. Feed current and projected production/construction demand into resource-specific labor targets. Count ready, queued,
   constructing, and unresolved accepted commitments once and release terminal failures.
4. Add the threat-aware spending posture and bounded hysteresis. Coordinate worker recovery, defensive production,
   compatible defenders, repairs/fortifications where supported, and offensive opportunity cost.
5. Connect the decision to macro proposals and high-level debug output without bypassing shared command authority.
6. Add pure invariants and targeted preset-world Playwright cases before rerunning bounded SEQ-01/02. Rebaseline only
   balance thresholds invalidated by the intentional equal starting-resource change; never weaken fairness or liveness.

## Acceptance evidence

- A fresh standard player state has exactly 200 food, wood, stone, and minerals; human and AI starts are equal.
- From 200 resources, each supported faction reaches renewable income without test-side resource injection.
- A safe long-game fixture grows beyond six workers while useful unsaturated assignments and dated demand exist.
- Worker production and duplicate infrastructure stop when saturated or when an evidenced finish has higher value.
- Food runway triggers labor/infrastructure before a zero-food production stall and recovers after worker loss.
- An observed incoming attack shifts a bounded budget to compatible defense; hidden enemies do not influence the choice.
- Clearing the pressure resumes the suspended economy plan without reopening completed historical checkpoints.
- Debug output explains desired workforce, food runway, threat/posture, budget split, and the selected/blocked action.
- Focused deterministic tests, targeted real-runtime low-resource/threat/recovery cases, and fresh bounded SEQ-01/02
  evidence pass without increasing the 12,000-tick ceiling or relaxing terminal assertions.
- Omission audit, final closure audit, commit, push, GitHub update, and plan triage are complete.

## Stop and retirement

Stop after #829 evidence is green; do not calibrate difficulty or broadly optimize runtime here. Move proven policy into
typed contracts/tests and the code-adjacent economy/defense/debug docs, update issue links, then remove this temporary plan
when no active handoff depends on it. #827 owns final fastest-credible-victory tuning, #817 owns paired difficulty, and
#828 owns profile-guided performance.
