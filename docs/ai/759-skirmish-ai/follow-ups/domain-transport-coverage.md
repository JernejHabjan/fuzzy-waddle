# Content-independent domain and transport coverage — #825

## Outcome

Core skirmish AI understands and tests land, water, air, access queries, transport ownership, and recovery using current
registered game capabilities. A future island map improves runtime breadth but is not required for core #759 readiness.

Recommended agent: `gpt-5.6-sol`, high effort for the first cross-domain contract and runtime-ownership slice. Hand the
proven contract to `gpt-5.6-terra`, medium effort, for fixture mapping and focused repairs. Reserve Astra for an
unresolved topology/transport architecture question after compact Sol evidence.

Estimated effort: **L**, about 2–4 focused agent sessions or 1–3 engineering days after #824, assuming current map and unit
registrations behave as documented.

Dependency: complete #824 first. Coordinate access-family pure rows with #815 and supported runtime recipes with #816.
#822 is an optional content upgrade and is not a dependency.

## Cold start

Read only:

1. `docs/testing/strategic-scenarios.md` DOMAIN-01–06 and `adversarial-scenarios.md` H-19–21/H-29
2. matching rows in `tools/ai/fixtures/skirmish-v1.json`
3. `contracts/ai-access-graph-v1.ts` and `planning/ai-access-graph-v1.ts`
4. `planning/ai-transport-manager.ts`, `ai-tactics-manager.ts`, and `ai-adaptation-manager.ts`
5. Phaser `observation/ai-access-graph.adapter.ts` and `ai-observation-pipeline.ts`
6. adjacent specs and current registered map/unit/container capabilities named by the source index

Paths under `docs/`, `contracts/`, and `planning/` are relative to the gameplay AI-controller directory. Do not inspect
the optional island-map implementation unless #822 is separately selected.

## Owned scenarios

- DOMAIN-01/02: water alone creates no naval demand; valuable supported route/escort/intercept objectives may.
- DOMAIN-03: prove disconnected/costed-route and transport planning in pure fixtures; defer only the real island-map
  runtime variant to #822.
- DOMAIN-04 and H-29: transport loss, capacity change, passenger ownership, landing handoff, release, and recovery.
- DOMAIN-05/06: useful air selection, paired anti-air rejection, domain-compatible squads, counters, and targets.
- H-19/20/21: bounded optional access work, topology-generation invalidation, footprint-aware routes, and progress when a
  route is impossible for a particular unit or formation.

## Implementation order

1. **Sol/high boundary:** audit registered land/water/air/container capabilities, current maps, and authority handoffs.
   Commit a compact capability-to-evidence/status matrix that names the first causal contract and excludes unsupported
   runtime claims. Stop the Sol slice once the contract and its first failing or passing path are reproducible.
2. **Terra/medium delivery:** apply the committed capability matrix to fixture and runtime registration. Record only what
   can produce real evidence; never infer capability from a type name or manufacture a shipping feature in the fixture.
3. Add typed pure fixtures and semantic oracles for the owned rows. Cover positive, rejection, loss, retry, abort, release,
   and ordering cases while preserving fair observations.
4. Add focused Phaser observation/access integration tests for topology generations, footprints, transfer points, and
   capability projection.
5. Add Playwright recipes only where existing maps and registered units genuinely exercise the contract. Route these
   recipes through #824 tooling and #816 shards.
6. Extend the manifest/report status model so `required_supported` work fails closed while `deferred_content` names #822,
   stays visible, is never counted as passed, and does not block the core merge gate.
7. Update code-adjacent world-access/testing docs with proven behavior and ownership. Do not move scenario TODOs into
   product architecture documentation.

## Evidence and completion

- All owned content-independent pure/integration cases pass deterministically with canonical provenance.
- Every currently supportable runtime case uses a real lobby-created Phaser match and registered capabilities.
- Island-only runtime variants are explicit `deferred_content` owned by #822; no supported core row is hidden behind it.
- Access work remains bounded; transport/passenger/squad ownership is exclusive and terminal cleanup releases claims.
- Run focused tests plus #824 changed/required accounting, omission/final closure audits, plan-artifact triage, commit,
  push, update #825, and report the refreshed roadmap grid.
