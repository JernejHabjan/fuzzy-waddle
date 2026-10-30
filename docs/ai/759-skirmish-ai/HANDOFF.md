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
- PLACE-03 layout/concurrent passes are recorded for both factions; Tivara completion/loss also pass. Skaduwee
  completion still needs a real active-route premise. WALL-01 capture infrastructure now handles the large result;
  Tivara terrain passes as branch `1793320599420`. Paired wall comparison, Skaduwee effect and a no-value control
  remain open; do not replay this branch unchanged.
- B1 withdrawal recovery passes for both factions. C is validated. D remains partial with known H-31/H-32 causes;
  don't replay unchanged. Detailed IDs, limitations and retained evidence live in CURRENT-EVIDENCE.
- No multiplayer/CI, exhaustive calibration or optional content in this iteration; do not touch PR #814.
## Progress cursor

| Packet | State | Next action |
| --- | --- | --- |
| A placement/walls/recovery | in_progress | H-11 and PLACE-03 layout/concurrent pass for both factions; Tivara completion/loss and focused builder-loss control pass. Skaduwee PLACE-03 completion `1793317870460` lacks a real active-route premise; loss remains open. WALL-01 Tivara terrain passes (`1793320599420`); Skaduwee terrain `1793320854256` wins but forms no plan/wall, while Skaduwee no-value `1793321331730` passes. Diagnose useful-plan rejection; wall effect for Skaduwee and terrain/freestanding comparison remain. |
| B expansion/mission continuity | in_progress | EXP-02 withdrawal recovery passes for Skaduwee 1793313251345 and Tivara 1793313388623 on the same source/fixture. Existing Skaduwee home_pressure and both H-14 harmless passes remain. Continue B2 scouting and B3 combat; no unchanged EXP-02 withdrawal reruns. |
| C resource/command ownership | validated | C1 duplicate admission preserves actor/application progress; C2 expired provisional escrow and contracted-balance gating have focused coverage, H-10 retains both-faction capacity evidence, and H-13 has current native base-control confirmation for both factions. C3 epoch/identity/dispatch guards reviewed; focused Phaser tests pass 20/20. Full gameplay tests pass 105 suites/611 tests. |
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
