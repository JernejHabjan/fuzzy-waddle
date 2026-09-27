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
   The macro owner is a concrete #821 cleanup target: opening/military catalog, observation/queue, construction-cell,
   and effect-identity helpers were extracted. Opening proposals now live in `ai-opening-proposal.ts`, but the
   general labor is now in `ai-general-gathering-proposal.ts`. The proposal method remains oversized and still needs
   food infrastructure and production ownership splits; housing and Field labor now have focused owners.
   The ECO-05 surplus-transfer integration changed its reviewed
   hash baseline while leaving it over 400 lines. Extract opening, labor, housing, food, and construction proposal
   responsibilities, then remove its baseline entry. The later near-term finishing-policy handoff also changed this
   reviewed legacy owner; do not renew the hash again instead of splitting.
   The matrix runner `tools/ai/run-skirmish-matrix.mjs` is a second explicit target: ECO-03 fixture validation
   changed its reviewed baseline. Extract fixture schema validation, scenario selection, execution, and reporting
   into bounded modules, then remove its baseline entry. The later STRAT-07 pure-fixture selector also changes this
   reviewed oversized owner; remove the exception during that split.
   The Playwright variant runner's setup/initial-world verification was split into a separate focused module; check
   both module boundaries at the final gate before considering its #821 slice complete.
   The #829 committed-workforce debug slice narrowly changed the legacy macro owner, compound brain-state contract,
   invariant validator, and canonical serializer. Their four reviewed hash exceptions must be removed by
   responsibility-based splits before #821 closes; the new high-level debug projector itself remains below limits.
   The STRAT-01 paired pressure recipe changed the oversized matrix fixture validator; its reviewed hash remains a
   temporary exception until fixture validation moves into a bounded owner.
2. Rename stage/phase filenames, symbols, comments, test descriptions, and non-persisted diagnostics by responsibility.
3. Remove `V1` from ordinary implementations. Keep it on save/wire/repro/fixture/report schemas unless a compatible
   migration and schema-version policy are supplied.
4. Inventory persisted effect/claim/manager/trace IDs before renaming. Add read migration or compatibility aliases and
   prove old fixtures/saves still load.
5. Remove each compliant file from the baseline rather than updating its hash. Run `rg` for obsolete names and paths.
6. Commit and push small mechanical batches with focused type/lint/tests; avoid broad semantic rewrites.

## Completion

- Production source contains no PR-stage vocabulary except explicitly versioned migrated data.
- No ordinary implementation has an unjustified version suffix.
- All in-scope AI files pass structural lint and the AI-owned baseline debt is materially reduced or empty; unrelated
  repository legacy debt is not pulled into #759.
- Old saves/repro bundles remain supported through the documented cutoff.
- Audit names/exports/docs, run affected checks, commit, push, and close #821.
