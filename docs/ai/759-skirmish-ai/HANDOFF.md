# #759 single-player iteration — start here

Updated 2026-10-30. User approved Astra preparation, then one model switch/compact and "go".
Preparation complete; gameplay execution has started under the active goal. Read this and the selected packet in
[REMAINING-WORK.md](REMAINING-WORK.md), which owns scope, acceptance, loop and goal text.
Do not reconstruct the old seven-package roadmap from chat or historical records.

## Resume

- Workspace: C:\Git\Jernej\fuzzy-waddle; branch: feature/759-skirmish-ai.
- Gameplay baseline: 3555fb04e21c; preceding gameplay batch: b9274bdd15d7.
- Worker recommendation: Luna High, Standard speed. Sol Medium can execute the same plan. No automatic switches.
- Goal created on 2026-10-29 from REMAINING-WORK after user said "go".
- Startup Git clean; no owned AI runtime process was identified. `agent:doctor` and `agent:context` each
  returned `unavailable_repository_runtime`; direct Node 24/pnpm/Nx work. Diagnosis: the wrapper spawns
  Windows `pnpm.CMD` without a shell. Do not change that unrelated wrapper in this packet.
- Packet A: a focused manager regression showed the one-tile gate placed a wall at (9,9) across an owned
  Move route (8,9)->(10,9), even though whole-area connectivity passed. A three-tile opening now keeps that
  route free while retaining the useful wall plan. Five focused manager/recovery/continuation/placement suites
  pass (41 tests).
- PLACE-01 repeated-control diagnostic 1793301306256 (temporary fixture digest `fnv1a32:7c33d7ef`) showed
  the combat probe was replaced by an Attack order at tick 20; the first worker move ended at fallback tile
  (31,24), not its requested endpoint (31,22), and a fourth Field completed at tick 2341 with only 59 ticks
  left for delivery. Temporary probes were restored. Do not replay that schedule; rebuild a passive physical
  route premise or resolve the source/coordinate mismatch with a smaller reproduction.
- WALL-01's old Tivara runs 1793297656059/1793297881648 built no wall. Decision capture showed housing demand
  2/4, correctly gating optional fortification. Both terrain variants now add two named starting houses; static
  fixture coverage passes. Captures 1793301901609 and 1793302187843 failed browser whole-capture stringification.
  The exporter now streams JSON into gzip and its 12k-fact browser regression passes, but retry 1793302528839
  exceeded Node's maximum string length while decompressing (> `0x1fffffe8`). Stop full WALL-01 retries until
  the Node-side capture is bounded or incrementally parsed; no wall-native evidence is claimed.
- A3 recovery review found terminal construction failures could retry forever. After two timed repairs fail,
  the fortification plan now becomes terminal and releases further intents. Red/green focused recovery spec
  passes; recovery/manager/continuation suites pass 25/25. Later construction-access changes invalidate the old
  H-11/PLACE-03 physical applicability; current H-11 awaits a usable native run.
- A3 recovery caps failed fortification repair; focused recovery/manager/continuation specs pass 25/25. H-11 capture
  1793313593915 isolated why the only builder proposed no food building: the baseline connectivity flood expanded
  clearance around existing static obstacles, marking its (31,22) start blocked beside a wall. `constructionAccessPolicy`
  now uses actual static passability for the baseline and applies the clearance margin around proposed/reserved
  footprints only. The adjacent-wall regression and food/placement suites pass 29/29. Both H-11 one-worker native
  branches pass on fixture `fnv1a32:76ff1345`, source `4b98966c7`: Tivara 1793316324413 (dirty `fnv1a32:d8adcf62`,
  51 delivered income) and Skaduwee 1793316467854 (dirty `fnv1a32:57a6838a`, 47.74 delivered income); each reaches
  4001 ticks, produces three and recovers to four workers. PLACE-03 applicability remains open.
- B1 withdrawal recovery now has current native evidence for both factions on fixture `fnv1a32:48f86832` and
  source `e792827ab66d` (dirty `fnv1a32:cc22f882`): Skaduwee 1793313251345 and Tivara 1793313388623 each reach
  3001 ticks/150 decisions and pass. The fixture uses a legal 240-stock Tree11; recovery is measured after a
  first sample of a subsequently confirmed two-sample clear home-danger window, with native retreat completion
  independently required. Continue B2/B3;
  do not replay these withdrawal variants unchanged.
- H-13's interrupted run finished: report 1793296020629-failed.json. Each variant's only missing ownership frame is
  its first selected decision, where no older provisional claim exists; later snapshots are complete. The native
  waiting-exposure evaluator now skips frames with no older claims, with focused positive and negative checks.
  Follow-up Tivara `new_identity` capture 1793300103293-diagnostic_failed is a checker false negative: native events
  show owned-Field food extraction, exact cargo offers and successful credits, plus a legal paid Sandhold that
  finished at tick 1405. The evaluator now accepts exact native delivery from owned or neutral sources; do not
  replay Tivara unchanged. Skaduwee `new_identity` diagnostic 1793300480186-diagnostic_passed (154s, fixture
  `fnv1a32:1ce3d633`) closes the shared base fixture on the other faction. Continue C2 stale-reservation/capacity
  review; do not rerun the full H-13 matrix solely to re-score the corrected checks.
- C1 source review found a duplicate `dispatched` outcome could overwrite the pending actor set and clear application
  progress if its identity was reused with altered actor IDs. Reconciliation now ignores repeated admission while
  pending. A red/green regression covers two-actor terminal progress; focused reconciliation/adapter tests pass 12/12
  and the pure reservation test passes 1/1.
- D diagnostic batch `4b98966c7` and A3 fix `5355fd47b` are pushed. H-31's post-health-fix diagnostic 1793315665949 still diverges after
  save/restore: health now matches, but the observation/access graph changes (136→134 links) and the first AI input
  differs. H-32 Tivara normal and paid-queue diagnostics 1793314086840/1793314126658 pass; Skaduwee normal
  1793314649303 fails the old-scene shutdown fence (61 old tick observers, no stopped tick subject/shutdown event).
  Pending-path repeats timed out. Do not replay these unchanged; D remains partial.
- Astra preparation inspected source and reports; no gameplay changes or new tests/matches.
- No new chats, agents, model switching or scheduled automation.

## Progress cursor

| Packet | State | Next action |
| --- | --- | --- |
| A placement/walls/recovery | in_progress | A3 fix is pushed; H-11 one-worker and PLACE-03 layout/concurrent pass for both factions; Tivara completion and loss also pass (1793318260099: 17 workers, 11 army, 410.48 income, 7 produced). Skaduwee completion 1793317870460 blocks `(41,24)` with a Granary, but no matching active route order exists in captured AI input; premise unresolved, not a product verdict. Builder-loss setup timed out before AI execution (loading-screen screenshot); no behavior verdict and no unchanged retry. Next inspect the fixture setup failure and establish a valid active-route completion premise. WALL-01 Node capture remains open. |
| B expansion/mission continuity | in_progress | EXP-02 withdrawal recovery passes for Skaduwee 1793313251345 and Tivara 1793313388623 on the same source/fixture. Existing Skaduwee home_pressure and both H-14 harmless passes remain. Continue B2 scouting and B3 combat; no unchanged EXP-02 withdrawal reruns. |
| C resource/command ownership | validated | C1 duplicate admission preserves actor/application progress; C2 expired provisional escrow and contracted-balance gating have focused coverage, H-10 retains both-faction capacity evidence, and H-13 has current native base-control confirmation for both factions. C3 epoch/identity/dispatch guards reviewed; focused Phaser tests pass 20/20. Full gameplay tests pass 105 suites/611 tests. |
| D essential SP lifecycle | in_progress | H-32 SP branch dispatch is fixed and covered by 58 focused static tests; Tivara normal/paid queue pass, Skaduwee shutdown fence fails. H-31 health restore is fixed, but observation/access graph still diverges. Advance to independent B work while these causes remain bounded; do not replay unchanged. |
| E ordinary play/closure | waits for A–D | Reconcile relevant evidence and run only affected release outcomes. |

Ready means planned, not validated. Every acceptance ID in REMAINING-WORK needs evidence or a blocker.
Packet completion does not certify every old manifest scenario.

## User authority and boundaries

- After "go": autonomous implementation, necessary focused checks, bounded native confirmation, and normal
  task-owned commits/pushes on this branch. Do not update, ready, merge or close PR #814.
- Multiplayer, CI activation, exhaustive calibration/debug certification and optional content are deferred.
  Preserve shared authority guards. No Docker/peer troubleshooting as an iteration prerequisite.
- SCOUT-02 and ESCORT remain follow-ups; basic fair useful scouting and supported land victory remain required.
- Hard 30-minute wall-clock cap per local runtime invocation; one owned runtime process at a time.
- Retain unchanged passing evidence. Repeated failed repairs trigger the smaller-reproduction procedure.
- Keep concise updates; no CPU/memory reporting. Move to independent work when a packet blocks.
- Maintain three active records only: HANDOFF (cursor), REMAINING-WORK (contract), CURRENT-EVIDENCE (results).
  Replace stale entries; Git/artifacts hold chronology. Do not append session journals to the archive.

## References on demand

- [CURRENT-EVIDENCE](CURRENT-EVIDENCE.md): passes, failures, artifact references and acceptance ledger.
- [CI-RESUME](CI-RESUME.md): deferred CI facts, not an execution queue.
- [SCENARIO-INVENTORY](SCENARIO-INVENTORY.md) and [EVIDENCE-ARCHIVE](EVIDENCE-ARCHIVE.md):
  historical lookup only; read narrowly when an artifact cannot be found in current evidence.
- Manifest: tools/ai/fixtures/skirmish-v1.json.
- Owning documentation: libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/README.md.
