# #759 current evidence

Updated 2026-10-27. This is the compact active snapshot; detailed run history belongs in
[EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md). [HANDOFF.md](HANDOFF.md) owns the live cursor and next action.

Latest closed family: STRAT-04 report `1793069202745-passed.json`, base `2210ab7fe09d`, dirty-source digest
`fnv1a32:d22008af`, fixture digest `fnv1a32:4e15b8c2`. Latest attempted family: SCOUT-01 report
`1793071681087-failed.json` (four variants, 400 decisions / 8,004 ticks): physical information trips pass in all
branches; hidden-pair selected-intent parity remains open. Latest attempted family is SCOUT-02 report
`1793073090904-failed.json` (ten variants, 1,200 decisions / 24,010 ticks): both visible controls pass; hidden and
withdrawn variants fail trip/stale-job/survival predicates, and hidden-world permitted-input parity remains open.
The focused Tivara visible diagnostic `1793083017398-diagnostic_failed.json` uses an opening contact outside attack range;
it passes contact/fairness and stale-certainty checks but still lacks a physical information trip.
Current-source SCOUT-01 recheck `1793084287890-failed.json` still fails only paired selected-intent parity, with its first
divergence at tick 20 in opening construction/recovery intents.
SCOUT-03 report `1793073566880-failed.json` ran four variants (400 decisions / 8,004 ticks): trapped branches pass;
both escape branches fail physical scout survival. SCOUT-04 report `1793074230112-failed.json` ran all six variants
(720 decisions / 14,406 ticks). The original objective-switch-only predicate failed all six; retained evidence shows all
six contacts entered ranked alternatives within 400 ticks and took later AI-caused native damage.

FIGHT-01 passes all eight native branches in `1793088416093-passed.json` (960 decisions / 19,208 ticks). The captured
runtime source is `441d72399` with fixture digest `fnv1a32:13bf9dd1`; the outer report was finalized after a documentation-only
commit. The evaluator follows native attack-commit behavior and excludes irrelevant long-horizon resource coverage.
FIGHT-02 has verified 40% health starts. Latest report `1793094794130-failed.json` on `c970a4537` passes four of six
branches; both no-heal actors fire, then die while alternating between retreat and offensive-position orders. The prior
`ce576d014` capture passed five branches but omitted a Skaduwee shot. Focused tactics/recovery tests pass 26/26 and lint
is clean. FIGHT-02 stays open; do not replay unchanged. Next repair must hold the endangered ranged unit at a safe
firing position. Earlier run history is archived.

FIGHT-03 report `1793095825942-failed.json` on `753e974e686e` ran five of six variants (600 decisions / 12,005 ticks);
equal-value controls pass. Unequal branches lack two independently useful native fronts and proportional reinforcement.
The isolated Skaduwee infeasible retry `1793104761329-failed.json` confirms the scheduled tick-600 loss affects zero
actors although the expected actor ID resolves; the target is no longer damageable by then. This remains a fixture setup
failure, not a branch verdict. Return after a relevant target/timing change; do not repeat unchanged.

FIGHT-04 report `1793096773518-failed.json` on `a5159d9e9183` ran all eight variants (960 decisions / 19,208 ticks); no
branch fully passes. Overkill branches lack native useful damage across both required targets. Targeted report
`1793105967694-diagnostic_failed.json` (120 decisions / 2,401 ticks) seeds HealingRain as completed before tick 0 and
confirms the support probe is wounded and its intended target is in range, yet no native effect/cooldown occurs. The
fixture now wounds the healer itself for same-group targeting and moves the harmful-zone target within range, but the
capture showed the tactical cast was blocked by the broad same-tick Stage 9 defense attack. The arbiter now prioritizes
useful tactical casts over that attack, permits the same squad's cast to interrupt its dispatched actor order, and the
Tivara Slingshot prefab now enables its declared SpellCastingSystem. Targeted report `1793107119988-diagnostic_failed.json`
confirms HealingRain starts its native cooldown, but its native healing effect is still not measured. Do not retry until
the missing zone effect has a concrete cause. Overkill and temporary-support expiry remain open.

FIGHT-05 now has passing evidence for all eight branches. The original report `1793097702563-failed.json` passed both
wall branches and Skaduwee target-loss/disconnected; focused current-fixture runs pass Tivara target-loss
(`1793108112989`), both status cases (Skaduwee slow `1793109580100`, Tivara stun `1793109870717`), both disconnected
cases (Tivara `1793110238361`, Skaduwee `1793110370152`), and Skaduwee target-loss (`1793110509861`). The status setup
pre-completes research and casts before the caster dies. Ground spells omit actor target IDs; spell-created statuses
carry the source actor ID; stunned actors cannot start attacks. Disconnected uses its terrain ring without an unavailable
tick-400 worker control, and accepts native damage against another reachable target rather than one hard-coded target.

RAID-01's corrected evaluator uses each branch's authored economic target. Separate-reserve raiding passes the Tivara
workers diagnostic `1793101298256-diagnostic_passed.json` on source `389b48856732` / fixture `fnv1a32:fba3bb14`.
Full eight-variant attempt `dca87acce` was interrupted after >34 minutes without runtime payload, so it yields no branch
verdict. The earlier selected report `1793076386234-failed.json` contains no RAID-02 row; that focused native variant still
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
- SCOUT-03 is partial, not closed: both trapped branches pass; Tivara and Skaduwee escape branches fail `scouting_surviving_physical_escape_missing`.
- SCOUT-04 is closed on all six retained branches: contact consideration occurs within 400 ticks and each branch has later AI-caused native damage.
- FIGHT-01 is closed on all eight native branches: favorable combat, changed-risk regrouping, and the quiet continued-fight control pass.
- FIGHT-05 is closed across eight native branches using retained wall evidence and focused current-fixture runs for target-loss, status and disconnected setups.
- Selected native obligations: **7/22 closed** (STRAT-05, STRAT-02, STRAT-03, STRAT-04, SCOUT-04, FIGHT-01 and FIGHT-05); 15 remain. Partial branch evidence does not close a family.
- Supported registration remains complete: pure 111/111 and native definitions/runtime recipes 115/115. These are
  authoring coverage, not behavior completion. Overall behavior percentage is unavailable until the existing evidence is
  reconciled across all supported rows.

## Active gaps

| Package | Remaining work |
| --- | --- |
| 3 — scouting, combat, access | DOMAIN-01/05/06, SCOUT-04 and FIGHT-01 pass. FIGHT-02 outcome oracles pass; recovery exclusion and retreat-order hysteresis await six-variant recheck. FIGHT-03/04/05 and RAID-01/02 remain open. DOMAIN-02's two negative controls and INTERCEPT pass; COAST pays for a ship but leaves it in reserve, and ESCORT reaches row 32 but fails its paid fleet objective effect. SCOUT-03 escape branches and SCOUT-01/02 parity/job service remain open at measured causes. Seven real-peer obligations remain CI-owned. STRAT-09 needs grouped final recheck after affected changes. |
| 4 — placement, walls, recovery | PLACE/EXP/WALL and H recovery cases; PLACE-03 transit/clearance and H-11 route/capture remain known failures. |
| 5 — authority and lifecycle | H-10 over-capacity variants, H-06/07, H-08/09 peer evidence, H-14/15 remaining branches, H-31/32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and supported SEQ/D cases. D-06 legacy comparison remains explicitly unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery/legacy review, omission audit and final closure audit. |

CI already runs the registered runtime and peer matrix. Use local native runs only to answer a concrete question after an
affected change; do not repeat unchanged passing evidence. PR #814 remains draft and unchanged. The handoff records the
next branch and publication status.
