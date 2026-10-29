# #759 single-player iteration — start here

Updated 2026-10-29. User approved Astra preparation, then one model switch/compact and "go".
Preparation complete; gameplay execution has NOT started. Read this and the selected packet in
[REMAINING-WORK.md](REMAINING-WORK.md), which owns scope, acceptance, loop and goal text.
Do not reconstruct the old seven-package roadmap from chat or historical records.

## Resume

- Workspace: C:\Git\Jernej\fuzzy-waddle; branch: feature/759-skirmish-ai.
- Gameplay baseline: 3555fb04e21c; preceding gameplay batch: b9274bdd15d7.
- Worker recommendation: Luna High, Standard speed. Sol Medium can execute the same plan. No automatic switches.
- Goal tool reported no goal during preparation. On "go", create the goal from REMAINING-WORK if absent,
  then execute continuously. Reuse a matching goal; never falsely complete an unrelated old goal.
- First action: check Git and any surviving owned runtime process; run existing doctor/context once;
  read packet A and the placement evidence. Reproduce the retained access disagreement before any match.
- H-13's interrupted run finished: report 1793296020629-failed.json. Do not restart it.
- Astra preparation inspected source and reports; no gameplay changes or new tests/matches.
- No new chats, agents, model switching or scheduled automation.

## Progress cursor

| Packet | State | Next action |
| --- | --- | --- |
| A placement/walls/recovery | ready | Reproduce observed route versus native PLACE/WALL clearance disagreement. |
| B expansion/mission continuity | ready after shared A analysis; independent diagnosis allowed | Explain EXP-02 home loss and H-14 frontier replacement. |
| C resource/command ownership | ready; independent fallback | Diagnose H-13 missing original-cash/ownership premise. |
| D essential SP lifecycle | ready; independent fallback | Inspect H-31 continuation and H-32 SP dispatch restrictions. |
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
