# #759 current evidence and blockers

[HANDOFF.md](HANDOFF.md) owns continuation. This file records only the selected production evidence.

## Current checkpoint — 2026-10-14

- Package 1 remains open; selected PRO-03/06/07. Worktree `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`, branch `feature/759-skirmish-ai`, checked base `b951d5949eee69d4766ba9301059f7205b0d3ca7`.
- Combined selected outcomes: **14/16 pass = 87.5%; 2/16 fail = 12.5%; 0 unavailable**. Both failures are PRO-07 shared-contention worlds: `tivara-shared-contention` and `skaduwee-shared-contention`, each `production_v2_strategic_contention_missing`. Strict pair gates PRO-03, PRO-06 and PRO-07 all report no failures. This is a checked subset, not package acceptance.
- Seven affected worlds ran at 2000 ticks with current proof code; five passed and two failed. Final retries confirm both contention failures using the restored Field rally. The other nine outcomes are retained from the unaffected prior cohort. Combined reduction: ignored `tmp/ai-plans/759-validation/next-combined-results.json`; raw current retries: `production-contention-final-worlds` in that ignored directory. Every selected capture closes through tick 2000, with no dropped facts, AI errors or unavailable setup.
- The final Tivara retry emitted its complete 2000-tick failure summary but exceeded the Playwright 240-second timeout during teardown; the Skaduwee retry completed and failed the same predicate. Thus both capture records are complete, while the two-world Playwright command did not pass cleanly.
- Runtime revision labels show base `b951d594`; the relevant dirty source/fixture diff at capture time hashes to `36a5070c9584e43b52aabe941374f2bb28dd097cc327b19f8c234ca980d67114` (computed over the five changed proof files and production fixture, excluding docs).
- The seven-world attempt used exploratory WorkMill rally values for the contention cases; those results are superseded by the final Field-rally retries. The five other affected results remain current. WorkMill and Producer rally experiments both failed the required predicate. WorkMill caused EnterContainer; Producer movement had no native static route. Do not count those attempts as current fixture evidence.

## Authored / why

- `skirmish-ai-runtime-production-route-current.ts` now treats same-terminal-tick rebuilds after query resolution as unrelated. Earlier closed intervals must still match the query's native navigation stamp, and a rebuild before resolution still refuses the route. Focused ordering controls cover both sides.
- `AiRuntimeExposureBinding` pins the fair enemy actor reference from the decision. It retires that threat only when removal metadata matches the same still-visible active native actor, health confirms death, and the actor is no longer indexed. Profile changes are checked before retirement; hidden/unknown loss and ID reuse remain invalid. Proof capture now passes removal identity metadata into the binding.
- Skaduwee's controlled loss event moved from tick 800 to 640. Native inspection showed the original InfantryInn dies naturally at tick 656; the tick-800 event could no longer affect the pinned original. The native critical-loss world now passes.
- No balance values or contention predicates changed.

## Checks and limits

- 320 production-reader tests and 25 focused Phaser exposure/capture/preset-event tests pass. Portal-e2e typecheck and production build pass; the build retains its existing initial-bundle warning. Fixture controls pass (3).
- The full 2000-tick retries of the two shared-contention worlds record their expected failures. Tivara also hit a 240-second Playwright timeout during teardown after emitting its complete summary. The broader Phaser sweep was interrupted and is not counted as passed. The native run exits failed because both required strategic-contention predicates fail.
- PRO-03 future pair, PRO-06 critical-loss and PRO-07 pair gates evaluate cleanly on the merged selected pair evidence. This does not close PRO-07: both independent strategic-contention worlds still fail.

## Remaining cause and next repair

The shared-contention setup sends rally movement toward the shared Field. The Field depletes during the long horizon, after which strategic-contention proof is missing. Routing to WorkMill produces EnterContainer; routing to a producer building causes a native static-route failure. These observations do not establish a valid replacement target or useful arrival. Inspect the existing strategic-contention evidence and native squad routing together, then fix both faction worlds with a reachable, persistent, semantically valid target. Preserve order identity, source, route freshness and useful-arrival predicates. Rerun both shared-contention worlds and the PRO-07 pair gate after the owner changes.

Other production certification remains: PRO-01/02/04/05 scenario-level evidence, H-17 registered coverage and explicit PRO-07 pure ID/spec mapping. Registration figures remain pure 56/111 and supported runtime 19/116; they measure coverage, not overall behavior completion. Machinery review/removal remains the final roadmap task.
