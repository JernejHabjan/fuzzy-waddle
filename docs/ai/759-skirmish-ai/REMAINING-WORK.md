# #759 single-player execution contract

Approved direction: 2026-10-29. Replaces the old seven-package execution queue for this iteration.
Lane: user-authorized implementation. Preparation is documentation only.
Worker: Luna High recommended; Sol Medium supported. No automatic switches or agents.

## Goal and finish line

On "go", use this objective with create_goal if absent; do not invent a token budget:

> Complete the single-player Skirmish AI iteration in docs/ai/759-skirmish-ai/REMAINING-WORK.md,
> acceptance A1–A3, B1–B3, C1–C3, D1–D2 and E1–E3. Implement and verify useful placement/walls/recovery,
> safe expansion, sustained fair scouting/combat, exactly-once resource/command ownership and essential SP
> continuation; preserve economy/production and both-faction victory. Follow the bounded repair loop,
> retain valid evidence, cap each local runtime invocation at 30 minutes, maintain three compact active
> records, and commit/push coherent task-owned batches. Defer multiplayer, CI activation, exhaustive
> calibration/debug certification, SCOUT-02/ESCORT and optional content. Do not change PR #814.
> Finish only when every iteration acceptance item has sufficient evidence and closure review is complete.
> Report genuine blockers without claiming completion.

This is a playable supported single-player iteration, NOT certification of every #759 roadmap promise.
Keep manifest expectations intact. Selected diagnostic passes cannot certify an entire scenario family.
No new architecture/catalogue/telemetry project, broad legacy removal, or statistically proven difficulty ordering.
Easy/Normal/Hard retain legal configuration. SCOUT-02/ESCORT remain known limitations; repair a shared cause
if required here, but do not reopen their exhaustive certification. Shared multiplayer guards must stay safe.

## Autonomous loop

1. Read HANDOFF and selected packet/evidence. Check Git, source and goal state. Initially run
   pnpm agent:doctor and pnpm agent:context -- --issue 759 once. Generated older roadmap text does not override this contract.
2. Select first unfinished dependency-ready packet. Track its numbered acceptance internally. Inspect implementations,
   callers, observations, application/cleanup and adjacent tests before editing. Preserve unrelated changes.
3. Identify the earliest disagreement: observation -> decision -> reservation -> command -> physical effect -> cleanup.
   Classify it as gameplay, fixture premise, evaluator or infrastructure. Label hypotheses as hypotheses.
4. Implement a coherent owner slice. Add meaningful focused regression/negative/recovery controls where needed.
   Prefer retained decision replay or pure/Phaser checks for diagnosis.
5. Before runtime verify legal starts, capabilities, range, resources, demand, visible/reachable routes, horizon,
   oracle prerequisites and generated-fixture consistency. Do not tune balance merely to rescue a test.
6. Run focused checks and review consumers. Obtain one native confirmation when physical evidence is absent or invalidated.
   Extend to the other faction when content differs. Retain valid existing evidence; no unchanged full-family replays.
7. Record evidence/provenance, update cursor, commit/push exact task-owned files, then continue automatically.
   A failed push is a publication problem, not a reason to repeat implementation. No force push or PR changes.

### Failed attempts

- Every runtime retry names the changed cause and predicted observation. Unchanged reruns require a specific
  nondeterminism/infrastructure question; reassurance is insufficient. Zero ticks is not gameplay evidence.
- After two unsuccessful repair/check cycles on one cause, stop full-match retries. Compare captured inputs
  with the regression, inspect one downstream owner and make a smaller reproduction.
- If that bounded reassessment cannot justify a repair, record cause, attempts, smallest reproduction, artifact
  and missing decision; mark the packet blocked and advance independent work. Revisit only with new evidence
  or a relevant dependency fix. Do not cycle through unchanged blockers.
- Choose routine implementation details independently. Ask only for actual scope/product changes, unavailable
  external access or irreversible actions. Do not weaken assertions or waive acceptance to finish.
- When no ready work remains, provide one grouped blocker report. Follow goal-tool status rules; a packet blocker
  alone is not permission to mark the tool goal blocked. Do not create retry/polling automations.
- Scope is finite, but a new demonstrated defect violating an acceptance item remains required.

## Source anchors

Repo-relative abbreviations:
G = libs/games/probable-waffle/gameplay/src/lib/player/ai-controller
P = libs/games/probable-waffle/phaser/src/lib
E = apps/portal-e2e/src/e2e

Semantic discovery was attempted in preparation; jbcontext requires login. Use these known anchors and local rg;
do not repeatedly try authentication. Verify paths/imports before changes; anchors are not a substitute for reading code.

## A — placement, walls and construction recovery

Dependency: none; start here.
Read G/planning/ai-construction-access.ts, ai-construction-site-selector.ts, ai-field-capacity-proposal.ts,
ai-fortification-connectivity.ts, ai-fortification-layout.ts, ai-fortification-recovery.ts and adjacent specs;
P/player/ai-controller/observation/ai-observation-map.ts and selected PLACE/WALL evaluators under E.
Source inspection: construction access protects active/pending order routes; fortification uses a separate flood.
Retained fixture baseline routes may have ended by later construction. First reproduce this contract disagreement.

Direction: use captured cells/actors to compare proposed footprint and native clearance. Protect meaningful owned
service/spawn/transit access using permitted observations and existing lifecycle state. Do not feed oracle-only
protectedRoutes to AI or reserve every historical route forever. If ongoing transit is the fixture premise,
repair its ordinary orders and negative control. Native physical clearance remains authoritative.

- A1: Useful Fields/buildings are builder-reachable, paid/completed and deliver intended service. Constrained sites
  fail safely and important worker/army/spawn routes remain physically usable.
- A2: AI builds useful walls when warranted, preserves an opening/worker/army passage and usable defensive access,
  and declines redundant/no-value/infeasible layouts.
- A3: Builder/site/entrance loss causes bounded repair, alternative work or release; healthy advancing work remains
  owned. No repeated payment, orphaned builders or permanent retry loop.

Evidence: retain PLACE-03/H-11. PLACE-01/02 and WALL-01/02 supply physical placement/transit.
WALL-03/04/05 and H-01–05/H-27–28 are defense/recovery references, not a mandatory full native Cartesian sweep.
Minimum native: both factions' useful placement and wall effect; one constrained/no-value control; one breach/builder-loss
recovery, with focused controls for remaining A1–A3 branches. Start from retained PLACE-01/WALL-01, not a fresh run.
Checks: placement-access/food-infrastructure, fortification manager/recovery/continuation, changed observation/evaluator specs.

## B — expansion, scouting and combat continuity

Dependency: consume A's access decisions; independent home-defense/scouting diagnosis can proceed while A is blocked.
Read G/planning/ai-resource-service-manager.ts, ai-economy-policy.ts, ai-tactics-geometry.ts,
ai-skirmish-scouting.ts, ai-tactics-mission-orders.ts, ai-tactics-mission-projection.ts and adjacent specs.
Source retains some native scout/naval moves. H-14 still changes frontier questions before arrival.
Skaduwee EXP-02 loses home despite the local-retreat fix; cause remains unproven.

- B1: Expansion buys useful service, avoids known weapon range/duplicate service, protects home under credible pressure,
  and resumes useful economy after withdrawal/combat resolution.
- B2: Basic frontier scouting completes useful physical information trips without hidden-state access or perpetual
  retargeting. Real danger/invalidity may preempt; income and paid production continue alongside scouting.
- B3: Land attacks/retreats stay executable and react to threats without harmless noise repeatedly cancelling progress.
  Both factions remain capable of authoritative victory (E).

Direction: inspect damage, defense arrival, visibility and order replacement before adjusting EXP-02 pressure.
For H-14 compare question age/expiry, physical route progress and competing actor claims. Preserve viable commitments
with evidence-based preemption, not unconditional locks.
Checks: resource-service, tactical geometry/scouting/admission, offense/planner regressions implicated by changes.
Native minimum: Skaduwee home_pressure; one economic recovery branch per faction; H-14 harmless physical trip per faction.
Retain relevant EXP-01/STRAT/FIGHT/RAID evidence; invalidate only affected invariants. SCOUT-02/ESCORT stay deferred.

## C — resource and command ownership

Dependency: none; incorporate ownership changes from A/B.
Read G/planning/reconcile-ai-command-reservations.ts, ai-resource-cost-claims.ts and their imports/specs;
locate the current ai-intent-arbiter.ts under G. Read P/player/ai-controller/ai-command-reconciliation.ts,
P/entity/components/construction payment/lifecycle and P/entity/components/queue continuation/mutation owners.
Current reconciliation matches an effect and releases its claim bundle on terminal outcomes. Never blindly expire
dispatched/paid ownership because a receipt is late.

- C1: Duplicate/late/out-of-order outcomes cannot charge/refund/apply twice. Valid unresolved paid work survives;
  terminal work releases claims.
- C2: Stale provisional reservations and capacity changes release/reallocate safely; multi-base optional commitments
  cannot starve essential income, supply or production.
- C3: Shared command identity/epoch guards stay safe; changes include rejection/duplicate/recovery controls.

H-13 report 1793296020629-failed.json is current evidence. All eight variants lack original-cash/ownership premise;
four Tivara variants also fail delivered-income checks and new-identity misses paid-base exercise.
Compare evaluator claim timing with real reservation/application before changing either. Do not dump full captures.
Retain H-06/07, H-10 over-capacity and H-15 passes. Use H-12/13 focused budget/cycle controls and SP H-08
timeout/cancellation where needed. Minimum native: one late/cancel exactly-once case per faction and one
many-base/essential-budget case per faction. Other permutations use meaningful focused tests; peer branches are deferred.

## D — essential SP save/load and next match

Dependency: C's command/claim contract; source inspection can happen earlier.
Read G/brain/ai-saved-continuation.spec.ts and migration/serialization imports;
P/data/actor-manager-ai-save.spec.ts, save-game-lifecycle.spec.ts;
P/entity/components/queue/queue-continuation.spec.ts;
P/world/services/recovery/serialize-actor-queue-state.spec.ts; H-31/H-32 recipes and their real drivers.
Pure continuation preserves claims/deadlines/RNG but does not prove native save/load.

- D1: Real SP save/load preserves paid construction/queue work, claims, recovery age and AI continuation;
  no recharge, duplicate completion or fresh-opening reset; useful work continues after restore.
- D2: A second SP match in the same app has one active controller per AI player; old callbacks cannot mutate it
  and the new AI performs useful work.

Minimum: H-31 during-active native continuation for both factions, focused before/apply/after and duplicate controls;
one H-32 paid-queue or pending-path SP second-match branch plus complementary cleanup controls.
H-32 has top-level requiresMultiplayer:true although normal/pending-path/paid-queue are SP. Inspect dispatch first.
A small branch-specific selection repair is allowed if needed; keep host-replacement fail-closed on real peers.
Do not start Docker or substitute a fake peer. If execution requires new harness architecture, record the blocker
and continue independent work; D remains required. Advanced replay/workbench certification is deferred.

## E — representative play and closure

Dependency: A–D before closure; evidence reconciliation can happen earlier.

- E1: Both factions reach authoritative victory from existing legal starts, with delivered income, useful paid output
  and native combat effects; both recover from the existing home-raid workload. No forced win or AI grants.
- E2: No unresolved demonstrated iteration blocker. Review stalls/failed commands, wasted building, idle paid troops
  and repeated goal replacement in the representative matches. Winning alone is insufficient.
- E3: Relevant focused tests, scoped lint and owning type/build checks pass. Final diff review, Omission Audit and
  separate Final Closure Audit map A1–E3 to evidence. Task-owned work is committed/pushed; handoff accurately
  states completion and limitations, without claiming full #759/CI/multiplayer certification.

Small release pack: continuous-land-runtime.json has tivara-land-loop, skaduwee-land-loop, tivara-home-raid,
skaduwee-home-raid. Inspect each variant's scenarioIds/repetitions before choosing SEQ-01/SEQ-02.
Four outcomes, not repeated full families. Retain earlier passes only if relevant dependencies are unchanged;
shared placement/tactical changes generally require affected final land runs. Record evidence applicability.
Inspect bounded timelines; use existing replay/UI tools for ambiguous physical behavior, not a new recording system.
This pack proves its legal-start workload, not general map/opponent strength. No tournament/statistical calibration.
Fix concrete in-scope defects via the bounded loop; do not expand scope merely to improve a score.

## Commands and evidence

Use Node 24 and repository pnpm. Check owning project config before invocation; no unrelated installations.
Focused Jest template (replace actual spec path; Phaser has its own phaser/jest.config.cts):

    pnpm exec jest --config libs/games/probable-waffle/gameplay/jest.config.cts --runInBand --runTestsByPath <spec-path>

Native example AFTER a causal repair, not a startup command (repetition is mandatory):

    node tools/ai/run-skirmish-matrix.mjs --scenario WALL-01 --mode runtime --working-tree --variant wall-01-tivara-terrain --repetition 1
    node tools/ai/summarize-skirmish-report.mjs --report <report-path> --scenario WALL-01 --failures-only --details

Read real variant IDs from manifest-linked fixtures. Generated recipes require checking the authoring source and
its existing node tests. Re-evaluate retained captures when only a justified evaluator correction changed.
Keep original physical provenance. Diagnostic passes stay diagnostic; do not relabel legacy family status.
One foreground runtime at a time. Enforce wall-clock <=30 minutes including startup; select single variants when
family duration is unknown. Preserve partial evidence and stop only the owned process at the cap.
Use bounded waits and concise progress updates. Do not poll full logs or repeatedly inventory processes.
Final checks cover changed owners/consumers; never automatically run the full historical matrix.

## Documentation and publication

Three active records only: HANDOFF cursor (<=100 lines), this contract (target <=300), CURRENT-EVIDENCE (target <=150).
Budgets are pruning guides, not permission to discard unresolved evidence. No session/scenario Markdown or new dashboard.
Update in place; raw logs stay in ignored artifacts and replaced history in Git. Archive/inventory are historical lookup.
After each packet and every three batches remove duplicate/stale narration. Retain source/fixture/report references,
diagnosis, unresolved question and next action. No routine archive appends.
Report packet, player-visible change, evidence, blocker and next action; no CPU/memory reports.
Commit/push coherent task-owned changes under prior authorization; PR #814 stays unchanged.
On completion preserve durable guidance in owning docs, reduce temporary records to closure/follow-up references,
and clearly distinguish this iteration from the deferred broader roadmap.
