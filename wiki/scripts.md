# Package scripts

Reference for every entry in the root [package.json](../package.json). Scripts are ordered there in the same groups as this page.

Use Node 24 and the pnpm version pinned in package.json. Run a command from the repository root with `pnpm run <name>` or `npm run <name>`. For npm, forward extra arguments with `npm run <name> -- <arguments>`.

The scripts object remains flat: prefixes and adjacent entries provide grouping. Existing non-AI names are retained for compatibility. The AI aliases `ai:skirmish-matrix` and `ai:regression` have been renamed to `ai:skirmish:matrix` and `ai:skirmish:regression`.

This page describes command definitions; it is not evidence that every command has passed on the current machine. Legacy Nx aliases are retained as-is and may require migration for the installed Nx version. Consult `pnpm nx --help` before relying on those aliases.

## Development servers

| Script                          | Purpose and requirements                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `start`                         | Start all Nx projects with a serve target.                                                                          |
| `start:portal`                  | Start the web portal with streamed Nx output.                                                                       |
| `start:api`                     | Start the NestJS API.                                                                                               |
| `start:portal-open`             | Expose the portal on all network interfaces with host checking disabled; use only on a trusted development network. |
| `start:probable-waffle-desktop` | Run the desktop project's Nx serve target. For the native Tauri shell, use `tauri:dev`.                             |

## Builds and bundle inspection

| Script             | Purpose and requirements                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `build`            | Build all Nx projects with build targets using the production configuration.                                                       |
| `nx-build-portal`  | Build the portal using its default Nx build configuration.                                                                         |
| `build-portal-dev` | Build the portal with source maps and named chunks. Despite the name, it does not explicitly select the development configuration. |
| `build-gh-pages`   | Build the portal with `/fuzzy-waddle/` as the base URL; does not publish it.                                                       |
| `serve-build`      | Serve the existing `dist/apps/portal` output using http-server; does not build first.                                              |
| `sme`              | Build the portal with source maps and named chunks, then open source-map-explorer to inspect bundle sizes.                         |

## Desktop app

| Script        | Purpose and requirements                                                               |
| ------------- | -------------------------------------------------------------------------------------- |
| `tauri:dev`   | Run the desktop project's Tauri development target; requires the native toolchain.     |
| `tauri:build` | Build/package the desktop app through its Tauri target; requires the native toolchain. |

## Tests and E2E

| Script        | Purpose and requirements                                                                                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test`        | Run all Nx test targets.                                                                                                                                                                              |
| `test:ci`     | Run all Nx test targets with their CI configuration.                                                                                                                                                  |
| `e2e`         | Run ordinary portal Playwright E2E tests.                                                                                                                                                             |
| `e2e:ai`      | Run ordinary E2E, then the AI unit-test preflight and seven-case core regression; stop if ordinary E2E fails.                                                                                         |
| `e2e:ai-full` | Run ordinary E2E, then the full AI release matrix with automatically resolved candidate and pinned baseline. Requires a clean source tree; deferred content and baseline limitations remain explicit. |
| `tools:test`  | Run Node tests for AI tooling, the custom ESLint plugin, skill tooling and E2E orchestration. Does not run browser matches.                                                                           |

## Linting, formatting and repository checks

| Script                           | Purpose and requirements                                                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lint`                           | Run all Nx lint targets.                                                                                                                                              |
| `lint-fix`                       | Run all Nx lint targets with automatic fixes enabled; modifies source files.                                                                                          |
| `lint-staged`                    | Run all Nx lint targets with `--with-deps`. Despite its name, this script does not select only staged files.                                                          |
| `lint:source-structure:baseline` | Rewrite the legacy source-structure hash baseline across apps, libs and tools. This changes lint exemptions; use only for an intentional baseline maintenance change. |
| `format`                         | Alias of `format:write`; apply Nx formatting to its selected files.                                                                                                   |
| `format:write`                   | Apply Nx formatting to its selected files; modifies files.                                                                                                            |
| `format:check`                   | Check formatting for the files selected by Nx without rewriting them.                                                                                                 |
| `phaser-editor:check`            | Validate Phaser Editor project asset URLs, atlas frames and prefab IDs.                                                                                               |
| `skills:check`                   | Validate maintained skill routes, indexed project targets and shared AI run configurations.                                                                           |

## Assets and installation

| Script                   | Purpose and requirements                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `postinstall`            | Automatically check Git LFS and tracked audio hydration after dependency installation; warn instead of failing. |
| `assets:check`           | Check Git LFS availability and tracked audio hydration; fail on missing prerequisites or pointer assets.        |
| `assets:hydrate`         | Install the repository Git LFS hooks, download LFS assets and replace pointer files with their content.         |
| `generate-audio-sprites` | Check assets, then run the portal audio-sprite generator; writes generated audio metadata/assets.               |

## Skirmish AI

| Script                    | Purpose and requirements                                                                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai:skirmish:matrix`      | Run selected pure/runtime scenarios, stage smoke checks or the release matrix. Requires selection arguments; running it alone is not a full-suite command.              |
| `ai:skirmish:regression`  | Run the AI unit-test preflight and the bounded core regression by default. Use `--profile scout` for SCOUT-02 or `--list` to inspect selection without matches.         |
| `ai:skirmish:catalog`     | List scenario descriptions; `--inventory` shows runtime recipe details. Does not run matches.                                                                           |
| `ai:skirmish:report`      | Summarize saved matrix artifacts. Use `--report <path>` to select an artifact or `--failures-only --details` for failure inspection.                                    |
| `ai:skirmish:multiplayer` | Run the separate multiplayer Playwright configuration against local Supabase on port 54321; uses supplied AI multiplayer keys or reads them from local Supabase status. |
| `ai:tools:typecheck`      | Type-check the AI TypeScript tooling using its dedicated tsconfig without emitting files.                                                                               |

## Agent tooling

| Script             | Purpose and requirements                                                                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent:doctor`     | Inspect repository prerequisites, indexes, projects and adapter configuration.                                                                                          |
| `agent:context`    | Create a bounded context packet for an issue; requires `--issue <number>` and an existing local issue plan.                                                             |
| `agent:verify`     | Select project-aware checks with `--changed` or `--required`; add `--execute` to run them and retain logs.                                                              |
| `agent:triage`     | Summarize a retained verification report using `--report <path>` without rerunning checks.                                                                              |
| `agent:scenario`   | Select manifest-backed scenarios through an adapter, e.g. `--adapter skirmish-ai --scenario ECO-08 --mode runtime`; add `--execute` to run them with retained evidence. |
| `agent:process`    | Start, inspect or stop an adapter-owned persistent process using `--adapter <id> --action start\|status\|stop`.                                                         |
| `agent:measure`    | Measure configured repository workflows and write measurement reports; selected workloads may execute commands. Use `--help` for selection options.                     |
| `agent:metrics`    | Compare compatible workflow measurement reports using `--before <path> --after <path>` and rank measured bottlenecks.                                                   |
| `agent:tools:test` | Run the generic agent tooling Node tests.                                                                                                                               |

## Nx affected operations

| Script               | Purpose and requirements                                                |
| -------------------- | ----------------------------------------------------------------------- |
| `affected`           | Pass arguments to `nx affected`, such as `--target=test --base=<ref>`.  |
| `affected:apps`      | Legacy Nx alias intended to list affected apps.                         |
| `affected:libs`      | Legacy Nx alias intended to list affected libraries.                    |
| `affected:build`     | Run build targets for projects affected by the selected Git comparison. |
| `affected:e2e`       | Run E2E targets for affected projects.                                  |
| `affected:test`      | Run test targets for affected projects.                                 |
| `affected:lint`      | Run lint targets for affected projects.                                 |
| `affected:dep-graph` | Open the affected dependency graph through the legacy Nx alias.         |

## Workspace administration

| Script                | Purpose and requirements                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `nx`                  | Pass arguments directly to the repository-local Nx CLI.                                               |
| `dep-graph`           | Open the Nx dependency graph through the legacy `dep-graph` alias.                                    |
| `workspace-schematic` | Invoke a local workspace schematic through the legacy Nx command; requires a schematic name.          |
| `update:check`        | Invoke `nx update` to inspect available updates; additional arguments are passed to Nx.               |
| `update`              | Invoke the legacy Nx update command for `@nx/workspace`; may change dependencies and migration files. |

## App versions

| Script          | Purpose and requirements                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `version:app`   | Set package.json, desktop Cargo.toml and tauri.conf.json to a supplied semantic version, e.g. `pnpm version:app 0.3.0`; modifies files. |
| `version:check` | Check that the package, Cargo and Tauri app versions match.                                                                             |
| `version:tauri` | Compatibility alias forwarding to `version:app`; updates the shared app version, not just Tauri.                                        |

## Supabase type generation

| Script                           | Purpose and requirements                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `_docs_generate-supabase-types`  | Legacy documentation placeholder, not an executable command. Start the local Supabase stack before running local type generation.                      |
| `generate-supabase-types`        | Generate TypeScript types for the local Supabase public schema, overwriting the committed database.types.ts file; requires the local stack.            |
| `generate-supabase-types:remote` | Generate public-schema types from the configured remote Supabase project, overwriting the same database.types.ts file; requires remote project access. |

## More detail

- [E2E commands and full-matrix limitations](../tools/e2e/README.md)
- [Skirmish AI tooling](../tools/probable-waffle/skirmish/ai/README.md)
- [Agent tooling](../tools/agent/README.md)
- [Supabase setup](./supabase.md)
- [Desktop setup](./tauri-desktop.md)
