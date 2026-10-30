# #759 single-player iteration — start here

Updated 2026-10-31. User approved Astra preparation, then one model switch/compact and "go".
The approved single-player iteration is complete and published. Read this and [REMAINING-WORK.md](REMAINING-WORK.md)
for scope, acceptance, loop and deferred follow-ups; do not restart completed packets absent a demonstrated regression.
Do not reconstruct the old seven-package roadmap from chat or historical records.

## Resume

- Workspace: C:\Git\Jernej\fuzzy-waddle; branch: feature/759-skirmish-ai.
- Gameplay baseline: 3555fb04e21c; preceding gameplay batch: b9274bdd15d7.
- Worker recommendation: Luna High, Standard speed. Sol Medium can execute the same plan. No automatic switches.
- Goal created on 2026-10-29 from REMAINING-WORK after user said "go".
- Tooling: `agent:doctor` and `agent:context` return `unavailable_repository_runtime`; use direct Node 24/pnpm/Nx.
  The wrapper's Windows `pnpm.CMD` shell issue is unrelated; leave it alone.
- A3 adjacent-wall clearance fix and H-11 passes for both factions are in CURRENT-EVIDENCE. The focused
  builder-loss recovery control passes on `76bec1347` after moving its invalid seeded site.
- Packet A now meets the selected native minimum: PLACE-03 layout/concurrent/completion/loss passes for both
  factions, H-11 both factions, builder-loss recovery, WALL-01 useful effect both factions and a Skaduwee no-value
  control. The completion fixture now binds its route to the real tick-1 army transit. Details are in CURRENT-EVIDENCE.
- B1 withdrawal recovery passes for both factions. C is validated. D1 H-31 during-active continuation and D2
  second-match lifecycle pass. Exact boundary/work proof and the allowed later physical divergence are in CURRENT-EVIDENCE.
- No multiplayer/CI, exhaustive calibration or optional content in this iteration; do not touch PR #814.

## Progress cursor

| Packet                         | State               | Next action                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A placement/walls/recovery     | validated           | PLACE-03 layout/concurrent/completion/loss passes for both factions; H-11 and builder-loss recovery pass. WALL-01 useful effect passes both factions and Skaduwee no-value passes. Corrected completion-route evidence is retained. Do not reopen absent a new acceptance defect. |
| B expansion/mission continuity | validated           | B1-B3 pass selected minimum. SEQ-01 both factions win; SEQ-02 shows recovery under renewed pressure. Failed retreat moves select another legal slot. SCOUT-02/ESCORT remain follow-ups. Do not rerun absent a new defect. |
| C resource/command ownership   | validated           | C1 duplicate admission preserves actor/application progress; C2 expired provisional escrow and contracted-balance gating have focused coverage, H-10 retains both-faction capacity evidence, and H-13 has current native base-control confirmation for both factions. Safe unloaded gatherer leases now transfer to food-field labor/construction while retaining the old effect receipt. C3 epoch/identity/dispatch guards reviewed; focused Phaser tests pass 20/20. Latest gameplay suite passes 105 suites/630 tests.                                                                                                                                                                                                                                                                                      |
| D essential SP lifecycle       | validated           | H-31 during-active both factions pass (`1793402499466`, `1793402579687`): saved/restored world, brain, authority and reservation digests match at tick119; first resumed input matches; each continues decision 5->20 with 563 advancing queue attempts and 3 completions by tick401. H-32 paid-queue/normal and shutdown cleanup remain passed. Later physical observations may diverge after the first resumed decision; see CURRENT-EVIDENCE. |
| E ordinary play/closure        | validated           | E1/E2 pass; A-D and E1/E2 are validated. Changed-owner checks and separate Omission/Final Closure Audits complete; implementation published as `7b03d62e3`. Full Phaser/portal-e2e TypeScript commands still exit 2 on unrelated pre-existing diagnostics; no changed-file diagnostics. Multiplayer/CI, exhaustive calibration and named optional scenarios stay deferred. |

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
