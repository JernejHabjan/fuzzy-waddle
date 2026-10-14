# #759 remaining work inventory

Snapshot: 2026-10-14, production evidence checkpoint based on `b951d5949eee69d4766ba9301059f7205b0d3ca7`. This is the execution inventory for the existing scope,
not a new design or diagnostic project. [HANDOFF.md](HANDOFF.md) owns the current cursor;
[CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md) retains the latest checked source/evidence details.
The manifest and linked scenario requirements remain authoritative; the snapshot below must be refreshed when
registrations change. Old session estimates in follow-up plans are historical, not current delivery estimates.

## What the inventory actually found

The original concrete plan exists: 121 named scenarios with setup and required outcomes. Freshly rendering the existing
catalog finds 56/111 pure fixture registrations and 19/120 runtime recipe registrations. Four runtime cases are
deferred island content. Therefore **55 pure registrations and 97 supported runtime registrations are missing**.
These are scenario counts, not separate files, matches, commits or necessarily missing gameplay implementations.
One shared fixture can cover several scenarios. Existing unmapped controls must be inspected and reused before
authoring equivalent tests. Registration does not certify that the scenario's independent outcome assertions pass.

Earlier descriptions such as “full acceptance open” concealed three different kinds of work. Use these states:

- **Missing registration:** no required fixture/recipe is connected in the manifest. Inspect existing controls;
  register equivalent coverage or author the missing setup and semantic assertions.
- **Registered, evidence pending:** the setup exists; run its ID-specific assertions and record source/fixture provenance.
  A reference to an ID or an unrelated passing suite is insufficient.
- **Known failure:** retained execution identifies a failing outcome. Fix its causal owner and rerun affected cases.
- **Checked subset:** some explicit branches pass, but that does not certify their entire scenario family.
- **Validated:** every applicable required branch has passing evidence for the relevant source and fixture inputs.
- **Deferred content:** outside the current land-content gate; retain the explicit reason, never count it as passed.

Missing registration does not mean missing production code. The row-level snapshot establishes coverage gaps;
it does not pretend that every existing gameplay implementation has been audited for completeness.

## Finite execution queue

**Continuation contract:** “continue” means implement the next unfinished step selected by HANDOFF's cursor.
Resume an unfinished package; otherwise advance to the next dependency-ready package below. Do not restart design,
ask for routine reconfirmation or reconstruct order from chat. Update the cursor and selected outcome states after
each coherent batch, commit/push and pause at the agreed boundary. A newer explicit user instruction takes precedence.

These are seven grouped work packages, not seven promised sessions. A package can contain several shared-owner repairs.
Do not create another stage for each helper, test or failing seed. No additional scenario IDs, observer architecture,
profiling suite or finer M13 journal is scheduled. A genuinely new requirement needs an explicit scope decision.

| Order       | Package and existing IDs                                                                      | Concrete work                                                                                                                                                                          | Finish condition                                                                                                                                               |
| ----------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — current | Production: PRO-01–07, H-17                                                                   | Finish the delivery/prebuild/recovery/contention blockers below; map H-17's existing controls or add its missing coverage                                                              | All applicable production predicates pass, including the 16 paired authority worlds; no invented useful arrivals or weakened deadlines                         |
| 2           | Economy and technology: ECO-01–08, H-16/H-18, TECH-01–06                                      | Close missing aggregate-budget/depleted-source controls; prove delivered income, worker allocation, food/supply recovery, research/counterproduction and stopping unnecessary spending | Registered pure/runtime cases pass their exact outcomes; both factions establish renewable income from the normal 200-resource start                           |
| 3           | Scouting, attack and access: SCOUT, STRAT, DOMAIN, RAID, FIGHT, C families plus their H cases | Reuse existing strategy/tactical controls; register missing fair scouting, reachable-target, force-size, attack/retreat and counterforce cases; repair actual failures                 | Supported land cases pass and SEQ-01 reaches the authoritative victory result for both factions; another launched attack is not completion                     |
| 4           | Placement, fortification and recovery: PLACE, EXP, WALL, H-01–05/H-27–28                      | Register legal placement/expansion/wall and stalled-progress recovery controls; repair owners only where a scenario exposes a defect                                                   | Legal useful construction and bounded recovery pass; healthy long work survives, impossible work releases actors/claims                                        |
| 5           | Resource authority, multiplayer and lifecycle: H-06–15/H-30–32, M11, #819/#823                | Close exactly-once/resource-capacity gaps; run real two-client authority/reconnect/host-transfer controls; cover interrupted save/load/replay and second-match cleanup                 | No duplicate payment/effect, stale capacity or split authority; matching peer/replay state and clean next match across required boundaries                     |
| 6           | Continuous play and difficulty: supported SEQ and D families, #817                            | Recheck SEQ-02 after shared changes; implement missing legal-start match/difficulty cases and isolated baseline comparison; run required paired seeds and soaks                        | Required terminal/recovery outcomes, supported difficulty ordering and bounded long-play state pass; mere survival is not victory                              |
| 7           | Debug coverage and closure: DBG, #820/#821, machinery review                                  | Register remaining debug requirements; finish necessary cleanup, audit legacy callers/parity, remove proven obsolete code and unnecessary diagnostics                                  | Supported manifest rows have complete evidence on the resulting inputs, invalid startup cannot dispatch, legacy consumers are resolved, review/audits complete |

Packages 2–4 can share implementation/context with package 1 where the same owner is already being repaired.
Local lifecycle preparation need not wait for combat; real socket cases depend on the multiplayer harness.
Final legacy removal depends on parity evidence. Execute settled independent cases in family batches, not one chat per ID.

**Batching policy (user, 2026-10-13):** before touching an owner, collect its known related failures, missing mappings
and applicable negative/recovery controls across packages. Design and implement that coherent slice together; reuse
the same fixtures and source context. Do not revisit economy, movement, queues or recovery in separate sessions when
their dependencies permit one batch. Package numbers organize outcomes, not mandatory separate turns or model switches.
Retain scoped evidence, then run affected checks and the grouped gate at a stable boundary. Separate work only for a
real dependency, unresolved design decision or agreed pause boundary, and state the reason in the report.

**Machinery review is last (user, 2026-10-13):** complete required gameplay/scenario, multiplayer/lifecycle,
calibration, debug and legacy work first. Within package 7, the final implementation/review task is the combined
keep/simplify/remove decision for diagnostic machinery. Earlier scoped verdicts are historical evidence, not an active
cleanup queue. Do not schedule interim machinery-removal batches. Recheck evidence affected by final simplification,
then perform closure audits and publication; do not start another expansion cycle.

## Required batch report and progress percentages

Use the authoritative [batch report format](HANDOFF.md#batch-report-and-progress) for every implementation batch
and every requested done/next summary. Explain changed behavior and its purpose in plain language, with evidence
status, concrete grouped follow-up, publication status and model/effort recommendation. Progress includes the current
package/selected IDs, exact counts and metric labels, source/evidence date, and newly closed or still-failing/missing items.

Use separate percentages for fixture registration and validated behavior. Calculate from the existing manifest and
retained complete evidence, not commit counts, elapsed sessions, helper counts or guesses. Four content-deferred runtime
rows are excluded from the supported runtime denominator and reported separately. Partial branch passes do not validate
an entire scenario. Invalidate only outcomes affected by later source/fixture changes, with a reason.

| Measured coverage at this snapshot    | Completed                                   | Remaining          | What the number means                                                                                              |
| ------------------------------------- | ------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Pure fixture registration             | 56/111 = **50.5%**                          | 55/111 = **49.5%** | Required pure scenarios with registered fixtures; not behavior completion                                          |
| Supported runtime recipe registration | 19/116 = **16.4%**                          | 97/116 = **83.6%** | Runtime recipes connected; four island-content rows excluded; not behavior completion                              |
| Scenario behavior validation          | Not yet reconciled across the full manifest | Not yet measurable | Existing subset passes and failures are recorded, but no truthful overall completion percentage can yet be derived |

During each selected package, reconcile its existing complete evidence into the row status and report its exact
validated/required percentage as well as the registration figures. Reuse existing reports; do not build another metrics
system or rerun unchanged passing controls merely to populate the inventory. Until a complete evidence tally exists,
explicitly report overall behavior percentage as unavailable alongside the numeric coverage measures. Never present
the registration percentage as the percentage of AI implementation completed or of engineering time remaining.

## Immediate production repair list

1. **Current input/claim boundary:** implemented and controlled. Pure capture/selection share one tick; expired leases
   are reconciled before proposals. Legacy fallback ordering remains covered. Preserve these owners while repairing routes.
2. **Common future prefix:** both full-horizon faction pairs pass exact input/selection ticks, plan identity and dates.
   Tivara's future outcomes and both Skaduwee future outcomes, including committed useful-force proof, pass.
3. **Awaited useful output and contention:** both shared-contention worlds still lack strategic-contention proof despite
   real production/research. Their shared Field rally depletes; WorkMill produces EnterContainer and producer-center
   routing has no native path. Repair both factions together with a reachable, persistent, semantically valid target;
   preserve native route/order/useful-arrival evidence.
4. **Critical recovery/loss:** Tivara's fair threat death now retires only a witnessed, still-visible native identity;
   hidden/unknown loss, profile changes and ID reuse remain invalid. Skaduwee's pinned original-loss event now occurs
   at tick 640, before the InfantryInn's natural death at tick 656; its critical recovery world passes.
5. **Grouped gate:** **14/16 outcomes pass (87.5%); two remain (12.5%), both failed PRO-07 shared-contention worlds; no setup is unavailable.**
   PRO-03/06/07 pair gates pass. Seven affected worlds were rerun: five pass; the two contention failures were
   confirmed again with the restored Field rally. Nine unaffected outcomes are retained from the prior cohort.
   Current details and source limits are in [CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md).

Gameplay: 329 tests; core Phaser gate: 910 tests plus final focused exposure/cadence controls; readers: 320 controls;
fixture: 3 controls; types, owned lint/formatting and build pass. These certify their controls, not every production row.
PRO-01/02/04/05 need certification, H-17 needs registered coverage, and PRO-07 needs an explicit pure ID/spec mapping.
Batch those remaining production coverage obligations after the current native failures close; then advance to package 2.

## Other concrete gaps already established

- **Full victory:** historical SEQ-01 runs did not reach a terminal result for either faction; Skaduwee also lost its
  worker economy. Later production repairs have not established a new full-match result. Replay the actual legal-start
  recipe after the relevant repairs and fix the earliest causal failure, not another unrelated diagnostic layer.
- **Raid recovery:** historical SEQ-02 passed both factions. Current shared-source acceptance needs a rerun; do not
  describe this as wholly unimplemented or carry forward an older failure as its latest result.
- **Resource authority/M11:** complete usefulness is still unavailable for required arbitrary replacement, net-zero
  mutation/undo and between-read changes. Enumerate the existing 32/36 authority predicates and their controls before
  editing; map each to an existing observed boundary or record the specific missing boundary. Do not introduce finer
  dependency graphs, FIFO lot tracking or continuous journals by default.
- **Multiplayer:** two-browser relay/hash/reconnect and host-promotion controls exist, but full interrupted-commitment
  transfer, snapshot catch-up, combat/terminal and leave/re-entry proofs remain. A single-browser match cannot close them.
- **Save/lifecycle:** required phases include delivery, construction, training/research, squad missions, transport,
  fortification and recovery. Before/during/after-apply save boundaries need exactly-once continuation or cleanup.
  Plans also identify interrupted awaited-planner disposal fencing as a gap to inspect against current source.
- **Calibration:** isolated pinned-baseline execution, D-06 comparisons and long soaks lack complete release evidence.
  Existing plan calls for 20 paired seeds plus a disjoint holdout and at least three 60-minute simulation soaks;
  expand samples only when uncertainty changes a decision. These are explicit workload commitments, not new stages.
- **Legacy:** unresolved identity/faction still has a legacy-controller fallback according to the owning plan.
  Audit actual callers, migrate necessary save compatibility, remove proven unused branches and make invalid configuration
  observable without dispatch. Do not delete before parity.

## Rules that stop circular execution

1. Every batch selects existing IDs and names a concrete gap: missing registration, unrun assertion or reproduced failure.
   Inspect existing implementation/tests first. Link reusable controls instead of rewriting them.
2. Every failed run updates the selected item's cause, owning source and next repair. Rerun only after a relevant source,
   setup or evidence-processing change; a diagnostic rerun must answer a named unresolved question.
3. Keep the required outcome fixed. A coherent fixture correction must explain its trigger/control; do not lower an oracle
   to make a run green. New tooling requires a demonstrated inability to obtain the needed evidence from existing tools.
4. Report selected IDs, outcomes newly closed, remaining failures/missing mappings and next package. Commit count,
   helper count and broad unit-test totals are not project completion metrics.
5. Keep verification at coherent batch boundaries. Use affected controls while repairing and one grouped gate when stable.
   Brief diagnostic sanity is already complete; no dedicated profiling gate is left.
6. The finish line is the original supported land scope plus multiplayer/lifecycle/calibration and justified retirement.
   Runtime island cases DOMAIN-03/04, H-29 and SEQ-05 remain content-deferred; required pure contracts are not waived.
   M13 remains unscheduled.
7. Do not promise a month/day/session estimate from registration counts. After the first coherent remaining package,
   use observed repair/authoring throughput to estimate the remaining finite queue, with assumptions stated.

## On-demand scenario inventory

The [121-row scenario inventory](SCENARIO-INVENTORY.md) holds family coverage counts, setups, outcomes and source links.
Read only the selected family, not the whole appendix at startup. The existing manifest remains authoritative.
