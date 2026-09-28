# Deterministic scenario coverage — #815

## Outcome

Every supported pure-required row in `tools/ai/fixtures/skirmish-v1.json` executes a typed deterministic scenario with
semantic assertions. Missing work must fail closed; a fixture filename alone is not coverage.

Recommended agent: `gpt-5.6-sol`, high effort for each new scenario-family contract and cross-manager diagnosis; hand
mechanical scenario expansion with an already-proven fixture recipe to `gpt-5.6-terra`, medium effort.

Estimated effort: **XL**, about 6–12 focused agent sessions or 4–8 engineering days at the current unmapped count.

Dependency: complete #824 first so fixture selection, context, focused verification, and failure triage use the shared
tooling contract.

## Cold start

Read only:

1. `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/README.md`
2. its linked generated scenario catalog and the selected family requirement document
3. `tools/ai/fixtures/skirmish-v1.json` rows for the chosen family
4. the owning manager and adjacent spec
5. scenario builders/runners under `gameplay/src/lib/player/ai-controller/testing/`

Read the generated catalog for the current registered/required counts. Its fixture and spec links are navigation, not
passing evidence; never copy a count into logic. Keep same-type units/buildings legal when causal demand remains.

## Implementation order

1. Read the inventory/catalog and select one coherent family, starting with economy/production, then access/combat,
   placement/fortification/recovery, authority/lifecycle, and remaining classic RTS/difficulty/debug cases.
2. Create typed setup through the existing scenario builder. Use catalog capabilities and stable IDs, not prefab-name
   heuristics or hidden runtime facts.
3. Assert outcomes independently: state transition, bounded work, useful effect, cleanup, and canonical hash. Cover the
   negative/recovery edge that could otherwise produce a false pass.
4. Register the fixture in the manifest without changing the required denominator or driver.
5. Author three-run decision/state/hash checks and meaningful ordering permutations for set-valued inputs.
   Execute them at the deferred final gate; authored assertions are not passing evidence.
6. Pair each family's pure and #816 runtime authoring in one context pass, reusing domain understanding and typed
   builders where semantics agree. Do not finish all pure families before beginning runtime authoring. Completed
   domain/transport contracts remain part of this issue's pure-coverage denominator.
7. Commit and push coherent family batches; preserve selected IDs, source files, unresolved questions and unrun checks
   in the existing handoff. Recalculate coverage from the manifest rather than copying counts into multiple plans.

## Evidence

Use the owning Nx Jest target with a focused spec filter, then:

```bash
pnpm ai:tools:test
pnpm ai:skirmish:report -- --details
```

Record selected IDs, repetitions, seed/fixture digest, tests executed, and failures. Do not run a browser merely to prove
a pure reducer; runtime coverage belongs to #816.

## Completion

- All supported pure-required rows execute and pass semantic oracles.
- Unsupported rows name a real missing capability/content dependency and remain visible.
- Coverage tooling rejects missing registration, zero work, nondeterminism, and non-finite metrics.
- Perform an omission audit and final closure audit, update durable testing docs only for proven reusable behavior, then
  commit, push, and close #815.
