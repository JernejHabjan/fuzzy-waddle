# Probable Waffle skirmish AI tooling

Game-specific tools, scenario data and Node tests live here. Generic agent infrastructure, ESLint rules and other
games' tools stay outside this directory. Start at the
[AI documentation index](../../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/README.md)
for gameplay architecture and operating guidance.

## Responsibilities

| Directory            | Owns                                                                             |
| -------------------- | -------------------------------------------------------------------------------- |
| `cli/`               | Direct Node entry points and catalog generation                                  |
| `matrix/`            | Pure/native dispatch, provenance, work accounting and shard selection            |
| `regression/`        | Bounded periodic profiles and the explicit E2E opt-in hook                       |
| `scenarios/`         | World authoring, recipe validation and registration                              |
| `testing/fixtures/`  | Manifests, pure controls, native recipes, map contracts and pinned baseline data |
| `testing/bindings/`  | Stable native branch/acceptance bindings                                         |
| `shared/`            | Workspace paths, process invocation and runtime request/artifact transport       |
| `reports/`           | Bounded summaries and source-checked repair lists                                |
| `integration/agent/` | Game adapter for the generic repository agent tools                              |
| `calibration/`       | Optional methodology/tools; difficulty calibration is currently cancelled        |

## Scenario data

`testing/fixtures/skirmish-scenario-manifest.json` is the selection authority. Fixture references resolve relative to
that directory; consumers follow the manifest instead of deriving filenames from IDs or directory listings.
Pure and native data are separated, then grouped by gameplay responsibility. Single-case native filenames retain
the stable ID and add the required behavior, such as
`native/scouting/scout-02-increase-relevant-scouting-runtime.json`.

`authoring/` contains inert, unexecuted proposals. `baseline/` holds the pinned reference implementation/report;
`maps/` freezes map topology inputs. None is a substitute for successful native execution. Keep seeds, branches,
deadlines and positive/negative predicates explicit. Move data together with its manifest, factories, tests and docs.

## Commands

```sh
pnpm ai:tools:typecheck
pnpm ai:tools:test
pnpm ai:skirmish:catalog -- --check
pnpm ai:regression -- --list
pnpm ai:regression
pnpm ai:regression -- --profile scout
pnpm ai:skirmish-matrix -- --scenario PLACE-03 --mode runtime
```

Tools run directly on the pinned Node 24 with erasable TypeScript and explicit relative `.ts` imports. The scoped
ESM package does not change the repository's module mode. Type checking is separate: type stripping validates neither
source nor runtime JSON. All tool source/tests participate in the dedicated compiler configuration. Former JavaScript
helpers are incrementally typed; this is not a full strict-mode migration.

Automatic AI CI jobs remain disabled. Set the exact value `RUN_AI_REGRESSION=true` using your shell's environment
syntax to opt `pnpm e2e` into the extended regression after ordinary E2E succeeds. Native invocations retain the
30-minute limit.
