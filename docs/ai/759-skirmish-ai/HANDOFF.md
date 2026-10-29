# #759 single-player iteration — start here

Updated 2026-10-29. User approved Astra preparation, then one model switch/compact and "go".
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
- Native WALL-01 Tivara reruns 1793297656059 and 1793297881648 both ended in victory but built no native AI
  wall and retained retreat-route clearance failures. The first added overbroad active-order rejection; it was
  removed after the run confirmed it suppresses all wall construction. The second still included that guard.
  Do not repeat WALL-01 unchanged; diagnose its recorded route/decision with a smaller reproduction first.
- PLACE-01 routes are evaluator-only `protectedRoutes`; physical move probes run at tick 1, while clearance is
  checked through tick 2400. AI can observe only current owned orders. Its field-alignment predicate is outside
  A1's usefulness contract. Reconcile the route premise without exposing oracle-only data to AI or relaxing
  required physical transit evidence.
- Next: continue independent packet C1/C2 ownership work; return to A1/A2/A3 after the route premise has a
  focused answer. Skaduwee native WALL-01 not yet run.
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
- Astra preparation inspected source and reports; no gameplay changes or new tests/matches.
- No new chats, agents, model switching or scheduled automation.

## Progress cursor

| Packet | State | Next action |
| --- | --- | --- |
| A placement/walls/recovery | in_progress | Three-tile route opening has focused support; WALL-01 remains unproven after two runs. Continue placement/recovery and diagnose captured route with a smaller repro before any wall retry. |
| B expansion/mission continuity | ready after shared A analysis; independent diagnosis allowed | Explain EXP-02 home loss and H-14 frontier replacement. |
| C resource/command ownership | in_progress | Duplicate-admission reset is fixed with focused coverage; retained H-06/07 native cases cover both factions. H-13 source attribution now accepts exact own/neutral deliveries; Tivara paid+finished base in 1793300103293 and Skaduwee diagnostic passed in 1793300480186. C2 now has a balance-contraction boundary regression: live escrow blocks optional spending and releases at its exact provisional deadline. Full gameplay tests pass 105 suites/609 tests. Continue C3 shared-guard review. |
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
