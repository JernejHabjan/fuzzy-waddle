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
- Tooling: `agent:doctor` and `agent:context` return `unavailable_repository_runtime`; use direct Node 24/pnpm/Nx.
  The wrapper's Windows `pnpm.CMD` shell issue is unrelated; leave it alone.
- A3 adjacent-wall clearance fix and H-11 passes for both factions are in CURRENT-EVIDENCE. The focused
  builder-loss recovery control passes on `76bec1347` after moving its invalid seeded site.
- Packet A now meets the selected native minimum: PLACE-03 layout/concurrent/completion/loss passes for both
  factions, H-11 both factions, builder-loss recovery, WALL-01 useful effect both factions and a Skaduwee no-value
  control. The completion fixture now binds its route to the real tick-1 army transit. Details are in CURRENT-EVIDENCE.
- B1 withdrawal recovery passes for both factions. C is validated. D remains partial with known H-31/H-32 causes;
  don't replay unchanged. Detailed IDs, limitations and retained evidence live in CURRENT-EVIDENCE.
- No multiplayer/CI, exhaustive calibration or optional content in this iteration; do not touch PR #814.
## Progress cursor

| Packet | State | Next action |
| --- | --- | --- |
| A placement/walls/recovery | validated | PLACE-03 layout/concurrent/completion/loss pass for both factions; corrected completion-route premise and Skaduwee loss are `1793328176798`, `1793328339115`, `1793328568541`. H-11 and builder-loss recovery pass. WALL-01 useful wall effect passes both factions; Skaduwee no-value passes. The terrain/freestanding comparison is supplementary, not part of the selected minimum. Next: continue B2/B3 and D/E; don't reopen A absent a new acceptance defect. |
| B expansion/mission continuity | in_progress | EXP-02 withdrawal recovery passes for both factions; Skaduwee combat-resolved recovery now passes as `1793329279497` after fixes for repairer retasking and occupied native construction footprints. Revalidate withdrawal applicability and run Tivara combat-resolved before closing B1; then continue B2 scouting and B3 combat. |
| C resource/command ownership | validated | C1 duplicate admission preserves actor/application progress; C2 expired provisional escrow and contracted-balance gating have focused coverage, H-10 retains both-faction capacity evidence, and H-13 has current native base-control confirmation for both factions. C3 epoch/identity/dispatch guards reviewed; focused Phaser tests pass 20/20. Latest gameplay suite passes 105 suites/617 tests. |
| D essential SP lifecycle | in_progress | H-32 SP dispatch is covered by 58 focused static tests; Tivara normal/paid queue pass. Skaduwee normal follow-up `1793322642534` shows old Map at Phaser SHUTDOWN status 8 with 61 old tick observers and no observed shutdown callback, while the new controller progresses and the late-work world digest is unchanged. Diagnose teardown/observer cleanup in a smaller source lifecycle reproduction; no unchanged H-32 retry. H-31 actor health restore is fixed, but observation/access graph still diverges. Advance to independent work while bounded causes remain. |
| E ordinary play/closure | waits for A–D | Tivara SEQ-01 `1793321872084` failed at the 20k ceiling: local Mage pressure erased the AI army/workforce by tick 6000, with no enemy losses. `gameResult=quit` is the unresolved score default, not a harness quit. Diagnose threat response and recovery before another release match; no unchanged rerun. |

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
