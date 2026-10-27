# #759 — live handoff

Read this file, then [REMAINING-WORK.md](REMAINING-WORK.md) for package acceptance criteria. [CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md) is the compact active snapshot; [EVIDENCE-ARCHIVE.md](EVIDENCE-ARCHIVE.md) keeps detailed history. [CI-RESUME.md](CI-RESUME.md) documents the existing CI runtime matrix.

## User direction

- Continue the existing roadmap through completion; update this cursor as work moves.
- CI already runs registered runtime and peer cases. Run local matches only to answer a targeted question after a relevant change. No other-PC probe.
- Commits and pushes on `feature/759-skirmish-ai` are authorized. Do not update or merge PR #814.
- Do not report routine CPU or memory usage.
- Keep these handoff files compact; archive detail instead of duplicating it here.

## Current checkpoint — 2026-10-27

- Source batch `4ca70b3fd` includes the STRAT-04 closure and SCOUT-01 evidence/order fixes, and is pushed. Node 24.18.0 / pnpm 11.14.0.
- STRAT-04 passes all six registered branches in `1793069202745-passed.json`; root repairs and branch outcomes are archived.
- Packages 1–2 and SEQ-01 are complete. STRAT-02/03/04/05 and STRAT-09 are validated. H-10 still has six of eight local variants; its over-capacity and seven real-peer obligations remain CI-owned. Selected native obligations closed: **4/22**.
- SCOUT-01 report `1793071681087-failed.json` confirms a physical scouting-information trip in all four branches; only paired hidden-world selected-intent parity remains red. Deterministic visible-position ordering has since been tightened in shared macro, gathering, recovery, and scout selection. The capture predates the last neutral-scout selector adjustment, so the current source still needs a later paired recheck.
- SCOUT-02 report `1793073090904-failed.json` ran all ten variants (1,200 decisions / 24,010 ticks). Both visible controls pass; hidden/withdrawn branches still fail useful scouting, stale-job service, and survival of the withdrawn contact, and hidden-world permitted-input parity fails. Full failure inventory is archived.
- SCOUT-02 diagnostic `1793083017398-diagnostic_failed.json` tests the relocated opening contact/probe: the fairness/contact and stale-certainty checks pass, but the visible variant still has no physical information trip. Opening contact is no longer inside the probe's attack radius; the scout-job service remains unresolved. Do not repeat this diagnostic unchanged.
- SCOUT-03 report `1793073566880-failed.json` ran all four variants; both trapped branches pass and both escape branches fail `scouting_surviving_physical_escape_missing`. Tivara-only diagnostic `1793082577283` still fails after moving the contact/scout setup: the enemy is visible at the first sample and continues seeing the scout during its frontier route. Do not rerun until a source or scenario change addresses those facts.
- SCOUT-04 report `1793074230112-failed.json` ran all six variants (720 decisions / 14,406 ticks). Its objective-switch-only response oracle missed a valid non-preemptive response: the retained Tivara producer capture includes the newly visible target in ranked alternatives at discovery and records AI-caused native damage at tick 1413. The evaluator now accepts that evidence while requiring an AI-caused native effect after discovery. Re-evaluation of the retained producer branch passes; five branch captures remain to be rechecked at the final scouting gate.
- DOMAIN-01/05/06 are closed; DOMAIN-05's corrected air-mission predicate also passes both retained backline captures. The original DOMAIN-02 full run exposed a broken river lane and overbroad third-player setup; both were repaired. Full rerun `1793081324411-failed.json` (5 variants, 750 decisions / 15,005 ticks) now passes both negative controls and INTERCEPT, while COAST still buys a VikingBoat that remains in reserve and ESCORT misses the required landing depth. COAST-only diagnostics `1793081611927`, `1793081898599`, and `1793082163870` isolate the reserve-boat behavior; do not repeat unchanged DOMAIN variants. ESCORT now unloads on valid shore but its landing must reach row 30. Raw captures and root-cause details are archived. Set `AI_SKIRMISH_RUNTIME_RESULTS_DIRECTORY` to the D: evidence directory for native runs; C: filled during report writing once.

## Package cursor

| Package | Current state |
| --- | --- |
| 3 — scouting, combat, access | DOMAIN-01/05/06 pass. DOMAIN-02 has two negative controls and INTERCEPT passing; COAST ship deployment and ESCORT landing depth remain open. SCOUT-03 trapped branches pass; both escape branches remain open, with the latest Tivara diagnostic still showing first-sample contact visibility and continued enemy sight. SCOUT-02 opening combat interference is reduced by fixture spacing, but native physical information service still fails. Next re-evaluate five SCOUT-04 captures, then take the grouped SCOUT-01/02 parity and scout-job source fixes; revisit SCOUT-03 after a source-level escape change. Return to DOMAIN-02 only after a source-level cause is identified. RAID-02 remains open despite sharing DOMAIN-06's recipe. STRAT-09 needs grouped final recheck after affected changes. |
| 4 — placement, walls, recovery | PLACE-03 route/transit evidence; H-11 `no_path`; remaining PLACE/EXP/WALL/H cases. |
| 5 — authority and lifecycle | H-06/07, H-08/09 peer evidence, H-10 over-capacity CI, H-14/15 remaining branches, H-31/32, M11, #819/#823. |
| 6 — continuous play and difficulty | SEQ-02 and supported SEQ/D cases. D-06 legacy comparison remains explicitly unsupported. |
| 7 — debug and closure | DBG cases, #820/#821, machinery/legacy review, omission and final closure audits. |

## Next action

Next re-evaluate the five remaining SCOUT-04 captures from `1793074230112-failed.json`; then group SCOUT-01/02 paired-input parity and physical scout-job service into one source change. SCOUT-03's escape branches remain open; its latest targeted diagnostic still sees the contact from the first sample and the enemy continues to see the scout, so revisit after a source-level escape change. SCOUT-02 fixture spacing now avoids opening-range interference, but the targeted native branch still fails its physical trip. Do not repeat unchanged DOMAIN-02 branches; return to COAST/ESCORT only after targeted source changes. The registered runtime/peer matrix is the final regression gate and PR #814 remains draft.

After each coherent source/evidence batch: update CURRENT-EVIDENCE and this cursor, run focused checks, commit/push task-owned files, and select the next unfinished case. Use EVIDENCE-ARCHIVE for run chronology. Do not stop at validation when another dependency-ready case remains.
