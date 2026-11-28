# E2E commands

| Command            | Work performed                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `pnpm e2e`         | Ordinary portal Playwright E2E suite                                                          |
| `pnpm e2e:ai`      | Ordinary E2E, then the AI unit-test preflight and seven-case core regression                  |
| `pnpm e2e:ai-full` | Ordinary E2E, then the full manifest through the AI release matrix (pure and runtime drivers) |

Use Node 24. The AI commands stop if ordinary E2E fails and return the additional runner's exit code otherwise.
Extra arguments go only to ordinary E2E, for example `pnpm e2e:ai -- --grep opening`.
The core profile is explicit; `AI_REGRESSION_PROFILE` does not change it. `RUN_AI_REGRESSION` no longer changes `e2e`.
For standalone core/scout selection, use `pnpm ai:skirmish:regression` or `pnpm ai:skirmish:regression -- --profile scout`.

## Full release matrix

The full command resolves the candidate from Git HEAD and the pinned baseline through the scenario manifest.
The release runner requires a clean source tree, including no untracked files. Commit or move local work first.
The manifest currently contains 120 entries; this is not a promise of 120 executable browser scenarios.
Deferred content is not executed, and the existing pinned-baseline runtime adapter limitation can return `blocked`
with a nonzero exit code. This command retains those checks; it does not certify unsupported coverage.
Runtime invocations retain their existing limits, including the outer 30-minute safeguard.
It does not separately run the multiplayer CLI, catalog listing or report summarizer.

Core summaries are written to `tmp/ai-skirmish-regression/latest.json`; full matrix artifacts are written to
`tmp/ai-skirmish-matrix/`. Inspect a full artifact with `pnpm ai:skirmish:report -- --report <path> --details`.

The matrix prints its selected catalog count and passed/failed/not-run runtime totals at completion.
Pure coverage is reported separately as proven/unproven; it is not a count of physical runtime outcomes.
Setup failures retain the requested denominator: a dirty tree prints `0/120 executed; 0 passed; 0 failed; 120 not run`
for the current full catalog, rather than claiming that scenarios failed. Untracked editor backup files also
make the source tree dirty. Missing baseline comparisons remain separate from candidate scenario results.

## Focused AI commands

These replace redundant package aliases:

```sh
pnpm ai:skirmish:matrix -- --scenario ECO-08 --mode runtime
pnpm ai:skirmish:matrix -- --scenarios PRO-01,PRO-02,PRO-03,PRO-04,PRO-05,PRO-06,PRO-07 --mode runtime
pnpm ai:skirmish:matrix -- --scenarios SEQ-01,SEQ-02 --mode runtime
pnpm ai:skirmish:report -- --failures-only --details
```

`pnpm tools:test` includes AI tooling, generic ESLint/skill tooling, and these E2E orchestration tests.
