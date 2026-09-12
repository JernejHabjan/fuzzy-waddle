# Deterministic scenario coverage — #815

## Outcome

Every supported pure-required row in `tools/ai/fixtures/skirmish-v1.json` executes a typed deterministic scenario with
semantic assertions. Missing work must fail closed; a fixture filename alone is not coverage.

Recommended agent: `gpt-5.6-terra`, medium effort. Raise effort only for a proven cross-manager contract disagreement.

Dependency: complete #824 first so fixture selection, context, focused verification, and failure triage use the shared
tooling contract.

## Cold start

Read only:

1. `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/README.md`
2. the selected family document under that directory
3. `tools/ai/fixtures/skirmish-v1.json` rows for the chosen family
4. the owning manager and adjacent spec
5. scenario builders/runners under `gameplay/src/lib/player/ai-controller/testing/`

Current closeout count was 40 of 111 pure-required rows mapped. Recalculate before editing; never copy that number into
logic. Keep same-type units/buildings legal when causal demand remains.

## Implementation order

1. Run the matrix coverage report and select one coherent family, starting with economy/production, then access/combat,
   placement/fortification/recovery, authority/lifecycle, and remaining classic RTS/difficulty/debug cases.
2. Create typed setup through the existing scenario builder. Use catalog capabilities and stable IDs, not prefab-name
   heuristics or hidden runtime facts.
3. Assert outcomes independently: state transition, bounded work, useful effect, cleanup, and canonical hash. Cover the
   negative/recovery edge that could otherwise produce a false pass.
4. Register the fixture in the manifest without changing the required denominator or driver.
5. Repeat the scenario three times and compare decisions, state, and hash. Add ordering permutations where inputs have
   set semantics.
6. Commit and push each coherent family batch; update #815 with the recalculated mapped/required counts.

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
