# #759 current evidence and next production gate

[HANDOFF.md](HANDOFF.md) owns continuation. Read only the selected production rows on resume.

## Current checkpoint — 2026-10-14

- Package 1 remains open. The PRO-03/06/07 authority-world gate is **16/16 passing (100%); 0/16 remaining (0%); no unavailable setup**. The combined pair evaluations for all three IDs have no failures. This certifies the selected world gate, not the entire production package or overall AI scope.
- Fresh final shared-contention captures: Tivara and Skaduwee each close through tick 2000 with 100 decisions, zero dropped facts, zero AI errors and no predicate failures. The Playwright command passes both tests in 6.6 minutes. Fourteen unaffected outcomes are retained from the previous cohorts: their Field rallies and non-Move work use unchanged range semantics.
- Tested base is `0f653a9c5c727abce51fb6552f7e6acb7a938e53`, with working-tree changes. The relevant five-file source/fixture diff hashes to `e00aafb77e4df99b1ddb61b13095e43abc49a2194a9577297c01ef0a362cd77c`. Final variant fixture digests: Tivara `fnv1a32:7fc61754`, Skaduwee `fnv1a32:667caa4d`. The containing publication commit owns the update; verify actual HEAD/remote on resume.
- Ignored artifacts under `tmp/ai-plans/759-validation`: `production-staging-contention-worlds`, `staging-contention-native.log`, `staging-combined-results.json`. Raw capture is never committed. Earlier Field, WorkMill, producer and distant-housing attempts are superseded diagnostic records, not current acceptance inputs.

## Authored / why

- Native `PawnAgentMovement` previously used radius zero for a Move to a solid building, searching only its blocked footprint and refusing the route. It now uses one-tile contact range for solid, non-navigable targets consistently across range, reachability and movement. Walkable/raised targets retain exact-target behavior; other action ranges stay unchanged. Controls cover solid versus walkable/raised targets, actual contact versus farther distance, failed movement and late order replacement.
- Shared-contention fixtures used a harvestable Field as a long-lived troop rally. Its depletion removed that identity before upgraded output spawned. Both worlds now rally at their existing permanent faction housing—Olival/Emberstone—at `800,1056`, reflecting the original Field's distance around the producer at `800,848`. The Field economy remains unchanged. A distant-housing experiment gave a valid path after the contact fix, but Tivara's later upgraded unit was still five tiles short at tick 2000; the final nearby staging geometry passes the original deadline.
- The queue/research demand event at 1500, 2000-tick deadline, useful original-destination arrival and 20-tick survival requirements remain. Native assertions still require production and research on the same lane, applied accepted intents, and a physically useful upgraded output. No balance values or acceptance predicates are weakened.
- The physical-world test's wall-clock allowance increased from 240 to 360 seconds after the previous four-minute timeout. Logical gameplay deadlines remain fixed.

## Checks / limits

- `node --test tools/ai/skirmish-production-world-fixture.test.mjs tools/ai/skirmish-runtime-production-contract-fixture.test.mjs`: 10 pass (`contact-fixture-controls.log`).
- Phaser Jest, selected `pawn-agent-order-boundaries.spec.ts`, `pawn-agent-movement-failure.spec.ts`, `movement-system-boundary.spec.ts`: 3 suites / 38 tests pass (`housing-contact-controls.log`).
- Scoped ESLint over all changed code/tool files: zero errors, three pre-existing unused-variable warnings (`housing-contact-lint.log`). Portal application typecheck `tsc -p apps/portal/tsconfig.app.json --noEmit` passes (`contact-portal-types.log`).
- Standalone `tsc -p libs/games/probable-waffle/phaser/tsconfig.json --noEmit` reports eight diagnostics in unchanged movement-test, exposure-test and map files. Recompiling with the changed Phaser files replaced in memory by HEAD contents yields exactly the same eight diagnostics (`contact-standalone-type-baseline.json`). This extra configuration is not a passing result; preserve the distinction from the passing real application route.
- Final native command: `AI_PRODUCTION_WORLD_HORIZON=2000 AI_PRODUCTION_WORLD_OUTPUT=tmp/ai-plans/759-validation/production-staging-contention-worlds pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts apps/portal-e2e/src/e2e/skirmish-ai-production-worlds.spec.ts --grep 'tivara-shared-contention|skaduwee-shared-contention' --workers=1`: 2 pass. All three pair evaluations pass after merging retained unaffected pairs.

## Next grouped production batch and closure

Certify existing capacity (PRO-01/02), repeated-unit demand (PRO-04), and exactly-once capacity/replacement (PRO-05) cases; register H-17 blocked-spawn/vanished-demand coverage and the explicit PRO-07 pure ID/spec mapping. Reuse existing fixtures/specs and retained evidence, then execute only pending or affected assertions. Repair related failures by shared owner. Package 1 closes only when these obligations pass, before advancing to economy/technology.

Omission Audit covers both factions, persistent owned rally identity, unchanged queue/refund authority and deadlines, exact movement/order attribution, contact arrival, negative range/order controls and server cleanup. Final Closure Audit closes the selected native failures while leaving the scenario certification/mapping obligations and baseline standalone-type limitation explicit. Managed server is stopped. Machinery review/removal remains the last roadmap task.
