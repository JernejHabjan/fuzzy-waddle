# Source structure and naming cleanup — #821

## Outcome

Permanent AI code uses responsibility names and small ownership-focused files. Version suffixes remain only where data
crosses time/process boundaries, and lint prevents new structural debt.

Recommended agent: `gpt-5.6-terra`, medium effort. Treat this as mechanical migration batches; do not mix AI behavior
changes into them.

Estimated effort: **variable**, about 1–6 focused agent sessions or 1–5 engineering days for required blocking batches;
full repository debt removal is outside core #759 readiness.

Dependency: complete #824 before broad cleanup. A narrowly scoped behavior-neutral slice may run earlier only when it is
required to unblock #824 itself.

## Cold start

Read only:

1. repo workflow coding/documentation contracts
2. `.eslintrc.json` and `tools/eslint-plugin-fuzzy-waddle/index.cjs`
3. `tools/eslint-plugin-fuzzy-waddle/source-structure-baseline.json`
4. the exact files in the chosen rename/split batch and all `rg` call sites
5. save/repro parsers before touching persisted `stageN` or schema-versioned identifiers

The current wrap-up renames the main planning files/classes by responsibility and adds hash-baselined enforcement. Many
large files, stage-labelled persisted IDs/fixtures, and ordinary implementation `V1` names remain for deliberate audit.

## Rules

- TypeScript, JavaScript, and MJS: at most 400 non-comment lines per hand-maintained file.
- Function/method: at most 200 non-comment lines.
- Line width: at most 140 columns.
- One substantive top-level class, interface, type alias, or enum per file.
- Existing baseline hashes are debt records, not renewable exemptions. Never regenerate them merely to make lint green.

## Implementation order

1. Split one responsibility cluster at a time. Preserve public imports with a temporary barrel only when consumers need
   it; remove aliases once all callers migrate.
   The macro owner has been split into opening, general labor, housing, food prerequisite/Field/labor, military force
   context, producer capacity, and unit-composition modules. Its source-structure baseline entry has been removed;
   final-gate lint and representative behavior proof are still required before counting this #821 slice complete.
   The matrix runner now delegates fixture schema validation, pure/runtime execution, and shared I/O to bounded
   modules; its baseline entry is removed. Final-gate fixture, scenario, report, and replay proof is still required.
   The Playwright variant runner's setup/initial-world verification was split into a separate focused module; check
   both module boundaries at the final gate before considering its #821 slice complete.
   The #829 committed-workforce debug slice's macro, brain-state contract, invariant validator, and canonical
   serializer have now been split by responsibility and their four reviewed hash exceptions removed. Final-gate
   type/lint/save/replay evidence is required before #821 closes; the debug projector remains below limits.
   The STRAT-01 paired pressure fixture checks now live in the bounded matrix-fixtures owner; confirm their rejection
   and scenario-selection behavior at the final gate.
   The Phaser observation pipeline is now split into memory/work, actor/combat/catalog, permitted topology/map,
   access-product, and auxiliary-context owners. Capture/commit/save/disposal stay in the 368-line coordinator, and
   its hash exception was removed. This is still unverified: final-gate type/lint, fair-visibility, save/replay,
   generation-fence and access-cursor evidence must confirm the extracted boundaries before closing this slice.
2. Rename stage/phase filenames, symbols, comments, test descriptions, and non-persisted diagnostics by responsibility.
3. Remove `V1` from ordinary implementations. Keep it on save/wire/repro/fixture/report schemas unless a compatible
   migration and schema-version policy are supplied.
4. Inventory persisted effect/claim/manager/trace IDs before renaming. A source-only survey found stage-labelled IDs
   across manager, intent/effect/claim and test-fixture contracts. Do not rename those by string replacement: add read
   migration or compatibility aliases and prove old fixtures/saves still load. Stage-labelled comments/test descriptions
   in hash-baselined files also need a reviewed split before editing, not a new baseline hash.
5. Remove each compliant file from the baseline rather than updating its hash. Run `rg` for obsolete names and paths.
6. Commit and push small mechanical batches with focused type/lint/tests; avoid broad semantic rewrites.

## Completion

- Production source contains no PR-stage vocabulary except explicitly versioned migrated data.
- No ordinary implementation has an unjustified version suffix.
- All in-scope AI files pass structural lint and the AI-owned baseline debt is materially reduced or empty; unrelated
  repository legacy debt is not pulled into #759.
- Old saves/repro bundles remain supported through the documented cutoff.
- Audit names/exports/docs, run affected checks, commit, push, and close #821.
