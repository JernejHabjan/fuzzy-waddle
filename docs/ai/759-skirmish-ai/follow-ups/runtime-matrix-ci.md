# Playwright runtime matrix and CI — #816

## Outcome

All supported runtime-required scenarios launch a real lobby-created Phaser match, observe authoritative effects, and run
as fail-closed required pre-merge shards with useful retained artifacts.

Recommended agent: `gpt-5.6-terra`, high effort for runtime repair and medium effort for mechanical recipe registration
after a family contract is proven. Ask for Sol only for a bounded reproducible runner/runtime investigation.

Estimated effort: **XXL**, about 10–20 focused agent sessions or 8–15 engineering days at the current unmapped count.

Dependency: complete #824 first and consume its verified orchestration, context, triage, and server-reuse contracts. Do
not build duplicate command wrappers in this issue.

## Cold start

Read only:

1. `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/runtime-e2e.md`
2. `apps/portal-e2e/src/e2e/skirmish-ai-runtime.spec.ts`
3. `tools/ai/run-skirmish-matrix.mjs` and the selected manifest rows/runtime recipe
4. the first failing authority path named by the compact report
5. `.github/workflows/pull-request-checks.yml` and `develop-ci.yml` only when wiring CI

Current closeout count was 10 of 120 runtime-required rows mapped. Recalculate first. The runtime spec is parameterized;
running its IDE gutter entry without `AI_SKIRMISH_RUNTIME_REQUEST` is not scenario evidence.

## Implementation order

1. Finish and rerun the land sequence slice before broadening the matrix.
2. Convert one compatible family at a time to an authored recipe with finite checkpoints, deterministic perturbations,
   authoritative assertions, and bounded deadlines.
3. Diagnose the earliest disagreement in this order: observation, demand/mission, intent/claim, shared application,
   outcome, cleanup. Batch related repairs and run focused Jest before one grouped browser rerun.
4. Cover both factions and representative sides/seeds on currently authored maps. Consume #825 domain/transport cases.
   Island-only variants remain visible `deferred_content` under optional #822; never claim them or synthetic
   flying-container coverage without registered capabilities.
5. Create isolated CI shards by family. A clean worker may run one Phaser/Playwright process at a time; separate workers
   may run shards concurrently.
6. Publish compact JSON for every shard and retain trace/repro, browser logs, screenshots/video on failure.

## Evidence

```bash
pnpm ai:skirmish:opening
pnpm ai:skirmish:production
pnpm ai:skirmish:land-sequences
pnpm ai:skirmish:report -- --failures-only --details
```

Every report records candidate SHA, dirty digest, manifest/fixture digest, seed, faction, side, profile, tick/decision
counts, and first failed predicate. Missing rows, zero work, provenance mismatch, non-finite metrics, or absent mandatory
terminal results fail the shard.

## Completion

- Every supported runtime-required row has real Playwright evidence.
- Required PR/merge-queue shards run from clean sources and retain artifacts.
- Optional island-content rows remain explicit, visible, non-passing, and outside the supported core gate.
- Run omission/final closure audits, update coverage counts and operator docs, commit, push, and close #816.
