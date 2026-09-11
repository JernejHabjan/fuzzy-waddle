# Stage 15 operator guide

This is the compact execution map for continuing or locally running #759 validation. Behavioral requirements remain in the stage packets; live status and exact next action remain at the top of [progress](progress.md).

## Cold start in under 90 seconds

1. Read `AGENTS.md`, the `fuzzy-waddle-repo-workflow` skill and the `fuzzy-waddle-skirmish-ai` skill once.
2. Read only the quick-resume block at the top of [progress](progress.md), then the current Stage 15 subsection if its evidence is needed.
3. Run `git status --short` and verify `git rev-parse HEAD` against the recorded local/remote provenance. Preserve every unrelated working-tree change identified there.
4. Continue the recorded next command. Do not rescan completed stages or print an entire runtime JSON artifact.

Use a short continuation prompt rather than pasting the plan again:

```text
Continue Stage 15 from the Quick resume block in docs/ai/759-skirmish-ai/progress.md.
Use the fuzzy-waddle-skirmish-ai skill and operator guide, run the recorded next gate,
repair evidence-backed failures in batches, update the ledger, commit and push at the next documented boundary.
Preserve unrelated changes and do not reread completed stages.
```

For constrained usage, use Terra/medium for runtime repairs and raise effort only for a demonstrated cross-system blocker. Luna/medium is suitable for mechanical reruns, summaries and documentation after contracts are stable. Record the actual selection; model recommendations never switch the task automatically.

## Test layers

| Layer                       | Owner                                                              | Use                                                       | Evidence boundary                                              |
| --------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------- |
| Focused deterministic logic | Jest specs beside gameplay/Phaser AI owners                        | Fast regression after a causal repair                     | Pure decision/contract only                                    |
| Authored scenario matrix    | `run-skirmish-matrix.mjs`, Jest harness                            | Fixture registration, replay and deterministic predicates | Zero runtime ticks is not browser evidence                     |
| Real skirmish runtime       | Playwright `skirmish-ai-runtime.spec.ts` through the matrix runner | Ordinary lobby, Phaser ticks, real commands/outcomes      | Required for runtime claims                                    |
| Difficulty calibration      | D-01–06 fixtures plus isolated candidate/baseline runner           | Fair Easy/Normal/Hard trend with paired uncertainty       | D-06 is incomplete until the pinned baseline adapter runs      |
| Release ladder              | Final Stage 15 matrix plus repository checks                       | Integrated closure at a clean candidate SHA               | Must fail closed on missing rows, baseline, work or provenance |

The Playwright file is parameterized by `AI_SKIRMISH_RUNTIME_REQUEST`; use the matrix/package commands below rather than running its gutter test without a request.

## Stable commands

These package scripts are also visible as npm run configurations in JetBrains IDEs:

```text
pnpm ai:skirmish:opening
pnpm ai:skirmish:production
pnpm ai:skirmish:land-sequences
pnpm ai:skirmish:report -- --failures-only --details
```

Equivalent selection and focused diagnosis:

```text
pnpm ai:skirmish-matrix -- --scenarios SEQ-01,SEQ-02 --mode runtime
pnpm ai:skirmish:report -- <artifact-or-directory> --scenario SEQ-01 --details
pnpm nx test probable-waffle-gameplay --runInBand --testPathPatterns=<spec-a> --testPathPatterns=<spec-b>
pnpm exec tsc --noEmit -p apps/portal-e2e/tsconfig.json
pnpm nx build portal --configuration development
node --test tools/ai/summarize-skirmish-report.test.mjs
pnpm ai:tools:test
pnpm skills:check
```

`node tools/ai/run-skirmish-matrix.mjs --help` lists matrix modes without producing a failure artifact. The runner prints one JSON artifact path; the summary command defaults to the newest artifact in `tmp/ai-skirmish-matrix`.

## Batching policy

- Repair all findings supported by the same artifact, then run their focused Jest specs together.
- Run independent Jest, TypeScript and build commands concurrently when machine capacity permits.
- Run one accelerated Phaser/Playwright process at a time. Use `--scenarios` to share one browser startup across compatible IDs.
- Rerun the affected grouped scenario after focused checks pass. Do not repeatedly run the full release matrix during diagnosis.
- Preserve first-failure and final-pass artifacts with candidate SHA, dirty-source digest, fixture digest, seeds and work counts in [progress](progress.md).

## Scenario entry points

| IDs       | Runtime command                                                           | Purpose                                                             |
| --------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| ECO-08    | `pnpm ai:skirmish:opening`                                                | Both faction openings, zero-worker bootstrap and sustainable income |
| PRO-01–07 | `pnpm ai:skirmish:production`                                             | Useful duplicate capacity, composition, queue/resource correctness  |
| SEQ-01/02 | `pnpm ai:skirmish:land-sequences`                                         | Continuous land match, missions, home raid, recovery and victory    |
| SEQ-03–08 | Matrix selections after their runtime recipes are added                   | Economy/producer loss, transport, walls, counters and lifecycle     |
| D-01–05   | Focused Jest plus their registered runtime selections                     | Difficulty identity, fairness, persistence and safety               |
| D-06      | Release/calibration runner after isolated baseline support is implemented | Paired challenge trend and Wilson intervals                         |

## Source map

- Pure brain and managers: `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/`
- Phaser observation/controller: `libs/games/probable-waffle/phaser/src/lib/player/ai-controller/`
- Shared command application: `libs/games/probable-waffle/phaser/src/lib/world/services/multiplayer/shared-command-application.service.ts`
- Browser runtime driver: `apps/portal-e2e/src/e2e/skirmish-ai-runtime.spec.ts`
- Manifest and recipes: `tools/ai/fixtures/`
- Matrix and report tools: `tools/ai/run-skirmish-matrix.mjs`, `tools/ai/summarize-skirmish-report.mjs`

Use [runtime triage](../../../plugins/fuzzy-waddle-skills/skills/fuzzy-waddle-skirmish-ai/references/runtime-triage.md) only after a runtime failure. Update reusable docs/skills only with a demonstrated repeated lesson; keep seed-specific balance findings in progress/artifacts.
