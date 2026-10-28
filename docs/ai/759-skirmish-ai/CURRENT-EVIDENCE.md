# #759 current evidence

Updated 2026-10-28. This is the compact active snapshot; detailed run history belongs in
[EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md). [HANDOFF.md](HANDOFF.md) owns the live cursor and next action.

Latest closed family: SCOUT-03 report `1793174968627-passed.json` (four variants, 400 decisions / 8,004 ticks), source
digest `fnv1a32:05a85282`, fixture digest `fnv1a32:ebc75582`. Previous closed family: STRAT-04 report
`1793069202745-passed.json`, base `2210ab7fe09d`, dirty-source digest `fnv1a32:d22008af`, fixture digest `fnv1a32:4e15b8c2`.
Latest attempted open families: SCOUT-01 report
`1793071681087-failed.json` (four variants, 400 decisions / 8,004 ticks): physical information trips pass in all
branches; hidden-pair selected-intent parity remains open. Latest attempted family is SCOUT-02 report
`1793073090904-failed.json` (ten variants, 1,200 decisions / 24,010 ticks): both visible controls pass; hidden and
withdrawn variants fail trip/stale-job/survival predicates, and hidden-world permitted-input parity remains open.
The focused Tivara visible diagnostic `1793083017398-diagnostic_failed.json` uses an opening contact outside attack range;
it passes contact/fairness and stale-certainty checks but still lacks a physical information trip.
Current-source SCOUT-01 recheck `1793084287890-failed.json` still fails only paired selected-intent parity, with its first
divergence at tick 20 in opening construction/recovery intents.
SCOUT-03 report `1793174968627-passed.json` closes all four branches on one current source and fixture. Its escape setup
uses fast flying scouts versus slower compatible anti-air pursuers, with the contact hidden at opening; a retained legal
retreat waypoint prevents route oscillation. SCOUT-04 report `1793074230112-failed.json` ran all six variants
(720 decisions / 14,406 ticks). The original objective-switch-only predicate failed all six; retained evidence shows all
six contacts entered ranked alternatives within 400 ticks and took later AI-caused native damage.

FIGHT-01 passes all eight native branches in `1793088416093-passed.json` (960 decisions / 19,208 ticks). The captured
runtime source is `441d72399` with fixture digest `fnv1a32:13bf9dd1`; the outer report was finalized after a documentation-only
commit. The evaluator follows native attack-commit behavior and excludes irrelevant long-horizon resource coverage.
FIGHT-02 has verified 40% health starts. Current-source report `1793210845150-passed.json` closes all six branches
(600 decisions / 12,006 ticks) on source `564c499c7` and fixture `fnv1a32:119a13f6`. Safe firing positions, movement
completion, and directing nearby allies at credible threats to wounded ranged units all hold across both factions.

FIGHT-03's revised unequal/loss fixture has a durable valuable main building, an isolated lower-value producer and six
additional compatible reinforcements. Full current-source report `1793211612520-failed.json` found the valuable
building died just before the authored tick-400 loss/escalation event and equal fronts competed with unrelated
targets. The refreshed fixture preserves the valuable front to the event, keeps equal fronts separated and observed,
and removes unrelated economy/noise targets. Fixture checks pass 42/42. Targeted branches pass reports
`1793212061756`, `1793212437251`, `1793212603730`, and `1793212773341`; current-source family report
`1793213533338-passed.json` closes all six branches (720 decisions / 14,406 ticks) on fixture `fnv1a32:dd74d4f1`.

FIGHT-04 Tivara HealingRain passes targeted report `1793133499341-diagnostic_passed.json` (source
`fnv1a32:816f98f7`, fixture `fnv1a32:4c6933e5`); periodic status refresh preserves its tick clock and capture records
real health increases. The other targeted passes are Skaduwee HealingLight `1793165477609` (source
`fnv1a32:3e29588c`, fixture `fnv1a32:7a4545ff`), Skaduwee summon expiry `1793164132277`, and both reachable-target
overkills `1793164782342` / `1793164999565`. HealingLight used `Actor` targeting but autocast previously recognized
only dedicated enemy/ally/self target types; autocast now derives its relation from Actor spell flags and selects the
wounded friendly. Focused Jest 2/2 and scoped ESLint pass. Tivara zone `1793166186099` also passes: the prior predicate rejected its actual enemy Burning statuses because zone effects intentionally omit caster source IDs and a self-owned enemy-only zone is reported as mixed from the caster view. The oracle now requires both an observed owned zone and native Burning on the opponent; focused Playwright checks pass 13/13. Both pending-effect branches pass (`1793166382249`, `1793166557067`). Combined current-source report `1793167558976-passed.json` passes all eight branches (960 decisions / 19,208 ticks) on source `98ef5f546` and fixture `fnv1a32:7a4545ff`. GitHub skipped the PR matrix because #814 is draft; the local combined runtime confirms the family.

FIGHT-05 now has passing evidence for all eight branches. The original report `1793097702563-failed.json` passed both
wall branches and Skaduwee target-loss/disconnected; focused current-fixture runs pass Tivara target-loss
(`1793108112989`), both status cases (Skaduwee slow `1793109580100`, Tivara stun `1793109870717`), both disconnected
cases (Tivara `1793110238361`, Skaduwee `1793110370152`), and Skaduwee target-loss (`1793110509861`). The status setup
pre-completes research and casts before the caster dies. Ground spells omit actor target IDs; spell-created statuses
carry the source actor ID; stunned actors cannot start attacks. Disconnected uses its terrain ring without an unavailable
tick-400 worker control, and accepts native damage against another reachable target rather than one hard-coded target.

RAID-01's current-source Tivara workers diagnostic `1793219068120-diagnostic_passed.json` passes (120 decisions / 2,401
ticks; fixture `fnv1a32:fba3bb14`). Captured native evidence joins the worker's successful drop-off to the raided
`contact-group` WorkMill; the dedicated raid causes physical damage while a distinct primary squad pressures its own
objective. Expansion diagnostics `1793219248061` and `1793219575377` exposed setup problems: the remote deposit was
unserved, its worker overlapped the WorkMill footprint and could not move, an idle worker decoy attracted the raid, and
the main squad hit `front-target-b` while the oracle demanded `front-target-a`. A follow-up showed a combat decoy diverted the raid into defense/intercept at tick 160. The fixture now puts an active worker
outside the remote deposit footprint, keeps a nearby gather source, removes the idle-worker economic decoy, and turns
the nearby contact into a passive Wall. The oracle accepts native raid damage to that verified serving worker or deposit,
and recognizes either authored main front when the assigned primary squad causes native damage. Fixture structure passes
both factions; native fixture checks pass 43/43, focused oracle checks 15/15 and changed-file ESLint passes. Current-source Tivara expansion diagnostic `1793220139730-diagnostic_passed.json` passes at 120 decisions / 2,401 ticks (dirty digest `fnv1a32:2f14f2ca`, fixture `fnv1a32:d127defe`). Workers, expansion and unfinished-site are three partial branches; unfinished retry `1793221894502-diagnostic_passed.json` passes at 120 decisions / 2,401 ticks (fixture `fnv1a32:f40ea582`) after repairing the earlier overlapping site/deposit setup. Protected diagnostic `1793222077163-diagnostic_failed.json` missed main-front native damage after the primary diverted to a harmless worker then distant home. Changed fixture makes the decoy passive and both fronts immediately reachable while retaining all eight defenders; structural checks pass 45/45. Retry changed protected branch only.
RAID-02's earlier selected report `1793076386234-failed.json` contains no RAID-02 row; that focused native variant still
needs an actual runtime capture. One RAID-02 repetition now passes on `d14166375288`: report
`1793104113441-diagnostic_passed.json` records the variant as PASS at its 12,000-tick checkpoint, with a match win,
three raid attackers, 2,875 damage, and the evaluator's post-raid redirection predicate satisfied. This is targeted
branch evidence, not the recipe's three-run certification.

## Validated outcomes

- Packages 1–2 are complete: production 8/8; economy/technology 16/16.
- SEQ-01 reaches two-faction victory at the 18,000-tick horizon with adaptive build-space radius.
- STRAT-05 passes all six branches. STRAT-02 passes all five registered branches. STRAT-09 has passing evidence for all
  eight branches. One shared RAID-03 boat branch passes. Detailed artifacts and source provenance are archived.
- STRAT-03 passes all six branches at 150 decisions / 3,001 ticks: both minor branches and Skaduwee withdrawn win; both reinforced branches and Tivara withdrawn meet their expected branch outcomes. All branches retain their home and satisfy the native defense/offense predicates. Reports and source provenance are archived.
- STRAT-04 passes all six branches at 100 decisions / 2,001 ticks each. Quiet and harmless-noise controls preserve the committed goal and produce native damage through the attack squad; the real-threat controls adapt physically. Report and source provenance are archived.
- SCOUT-01 is partial, not closed: the latest report has no per-branch trip failures, but `scouting_hidden_world_altered_selected_intents` remains. Current source now orders macro workers, gathering sources/workers, recovery actors, and scout candidates by visible geometry before run-local IDs; recheck parity after the related scouting batch.
- SCOUT-02 is partial, not closed: both visible controls pass, while the eight withdrawn/hidden branches do not sustain useful information service or keep the authored contact alive through the horizon. Hidden-world permitted-input parity also fails. A focused visible diagnostic with improved opening spacing passes contact/fairness and stale-certainty checks but still misses a physical information trip. Full branch details and runtime provenance are archived.
- Current-source withdrawn diagnostics `1793209460328` and `1793209831885` confirm scout intents are accepted after same-plan provisional lease renewal was enabled, but native movement still ends in `Move - Movement Failed`; no physical trip or stale-job service is recorded. Nearest-unseen-point ranking did not help and was reverted after current-source SCOUT-01 regressed all four trip predicates. SCOUT-02 remains open pending a concrete native navigation diagnosis and resulting trip.
- SCOUT-03 is closed on all four current-source branches: both trapped and both physical escape branches pass.
- SCOUT-04 is closed on all six retained branches: contact consideration occurs within 400 ticks and each branch has later AI-caused native damage.
- FIGHT-01 is closed on all eight native branches: favorable combat, changed-risk regrouping, and the quiet continued-fight control pass.
- FIGHT-02 and FIGHT-03 are closed on all six current-source branches each. FIGHT-03 combined report `1793213533338-passed.json` uses the corrected two-front and tick-400 loss fixture.
- FIGHT-04 and FIGHT-05 are closed across all eight native branches each; FIGHT-04 combined report `1793167558976-passed.json` passes 960 decisions / 19,208 ticks on current source. FIGHT-05 uses retained wall evidence and focused current-fixture runs for target-loss, status and disconnected setups.
- Selected native obligations: **9/22 closed** (STRAT-05, STRAT-02, STRAT-03, STRAT-04, SCOUT-03, SCOUT-04, FIGHT-01, FIGHT-04 and FIGHT-05); 13 remain. Partial branch evidence does not close a family.
- Supported registration remains complete: pure 111/111 and native definitions/runtime recipes 115/115. These are
  authoring coverage, not behavior completion. Overall behavior percentage is unavailable until the existing evidence is
  reconciled across all supported rows.

## Active gaps

| Package | Remaining work |
| --- | --- |
| 3 — scouting, combat, access | DOMAIN-01/05/06, SCOUT-03/04, FIGHT-01/02/05 pass. FIGHT-03 and RAID-01/02 remain open; FIGHT-04 passes its full eight-branch current-source matrix locally. DOMAIN-02's two negative controls and INTERCEPT pass; COAST pays for a ship but leaves it in reserve, and ESCORT reaches row 32 but fails its paid fleet objective effect. SCOUT-01 parity and SCOUT-02 native trip/service remain. Seven real-peer obligations remain CI-owned. STRAT-09 needs grouped final recheck after affected changes. |
| 4 — placement, walls, recovery | PLACE/EXP/WALL and H recovery cases; PLACE-03 transit/clearance and H-11 route/capture remain known failures. |
| 5 — authority and lifecycle | H-10 over-capacity variants, H-06/07, H-08/09 peer evidence, H-14/15 remaining branches, H-31/32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and supported SEQ/D cases. D-06 legacy comparison remains explicitly unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery/legacy review, omission audit and final closure audit. |

CI already runs the registered runtime and peer matrix. Use local native runs only to answer a concrete question after an
affected change; do not repeat unchanged passing evidence. PR #814 remains draft and unchanged. The handoff records the
next branch and publication status.
