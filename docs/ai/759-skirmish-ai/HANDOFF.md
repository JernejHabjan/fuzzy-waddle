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
  builder-loss recovery control now passes on `76bec1347` after moving its invalid seeded site.
- PLACE-03 layout/concurrent passes are recorded for both factions; Tivara completion/loss also pass. Skaduwee
  completion still needs a real active-route premise. WALL-01 has no native result because capture exceeds Node's
  string limit; resume only after implementing bounded/incremental Node-side capture.
- B1 withdrawal recovery passes for both factions. C is validated. D remains partial with known H-31/H-32 causes;
  don't replay unchanged. Detailed IDs, limitations and retained evidence live in CURRENT-EVIDENCE.
- No multiplayer/CI, exhaustive calibration or optional content in this iteration; do not touch PR #814.
## Progress cursor

| Packet | State | Next action |
| --- | --- | --- |
| A placement/walls/recovery | in_progress | H-11 and PLACE-03 layout/concurrent pass for both factions; Tivara completion/loss pass; focused builder-loss native control now passes (site starts, builder lost at 80, replacement completes same site through tick 1200). Skaduwee completion 1793317870460 still blocks `(41,24)` with an oracle-only route absent from captured AI input; establish a valid active-order premise before scoring. PLACE-03 Skaduwee loss remains open. WALL-01 is blocked on bounded Node capture. Next move to independent B scouting/combat work while deriving a real completion route. |
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
