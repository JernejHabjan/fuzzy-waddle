# Agent tools and AI PR cleanup

`tools/agent/` helps coding agents inspect the repository, select and run checks, summarize failures, manage
processes and measure workflow efficiency. The `benchmarks/` files define representative workflows and record a
measurement and review. These tools support development and are independent of the game runtime.

## Cleanup checklist

- [ ] Replace the large generated scenario catalog with concise guidance and an on-demand listing. Preserve the
  scenario browser's descriptions and update its generator, tests and CI references.
- [ ] Reduce scenario fixture duplication by reusing common world setups and actions. Consolidate duplicate cases only
  when meaningful behavior remains covered. See [scenario cleanup proposals](./scenario-cleanup.md).
- [ ] Remove completed AI handoffs after moving any still-useful guidance and unresolved acceptance into durable
  documentation or issues. Update links before deletion.
- [ ] Review `ai-controller/docs/` for outdated plans, unfinished work presented as complete, excessive detail and
  duplication. Keep concise current behavior, testing guidance and unresolved follow-ups; update links.
- [ ] Disable the remaining manual trigger of `.github/workflows/ai-regression.yml` and explain in the workflow that
  extended AI regression is too slow for routine CI. Automatic tag triggering is already disabled. When enabled later,
  the workflow should select all supported scenarios from the manifest, without a separate scout profile or a
  hardcoded scenario list. Preserve local commands and explicitly report unsupported cases and incomplete runs.
  Overall scheduling and runtime limits can be decided later; the user plans to run scenarios locally.
- [ ] Document the purpose of the agent tools and their benchmarks in this file. Review optional agent commands and
  benchmark records for redundant maintenance.
- [ ] Remove the cancelled difficulty-calibration campaign tooling and update its dependencies. Preserve normal
  difficulty settings and their correctness checks.
- [ ] Audit the new AI map asset packs and tilemaps against their scenes, scenario recipes and test-map contracts.
  Remove redundant assets only after confirming their consumers and keeping required maps playable.
- [ ] Audit unused code introduced by this PR, including `dispatchAiOrder` and related helpers, tests and exports.
  Trace runtime and test consumers before removal.
- [ ] Move every spec file added or updated by this PR into a `tests/` folder within its current owning directory.
  For example, move `lib/data/actor-manager-ai-save.spec.ts` and `actor-data-resource-history.spec.ts` into
  `lib/data/tests/`. Move files used exclusively by specs or E2E tests into the relevant nearby `tests/` folder too,
  keeping their existing names. Trace all consumers, including developer scenario playback, before classifying a file.
  Use `git mv` and update imports, aliases, fixtures, references and test discovery. Preserve runtime support used by
  the scenario browser, including the combat capture path.
- [ ] Review generated comments, overly granular one-use files and repeated test documentation. Remove duplication
  only where the remaining code and docs still explain the behavior and its ownership.
- [ ] Fix missing actor sprites in interactive AI scenarios, starting with `wall-01-tivara-terrain` and the missing
  `warrior_walk` texture. Trace asset-pack selection and loading, then verify visible actors across factions and maps.
- [ ] Keep the repository-wide source-structure rule and baseline in this PR.

The scenario browser and its playback still need verification. Scenario registration alone does not establish a pass.

## Execution guide

Work on the existing PR branch. Inspect `git status` first and preserve unrelated edits and untracked files. Compare
PR scope with `origin/develop...HEAD`. Work through the batches below, update the existing checklist as work finishes,
and keep the linked scenario proposal current. Do not create additional handoff documents. Commit or push only when
authorized for the active session.

### 1. Scenario playback and assets

- Trace `PreloadProbableWaffle.ts`, the selected map asset packs, scenario preset actor creation and texture keys.
  Reproduce `wall-01-tivara-terrain` and determine why `warrior_walk` is missing. Ensure all preset actors' sprites
  load before creation, including actors absent from the map's initial roster. Keep normal gameplay loading intact.
- Check both new AI map packs and tilemaps against their map scenes, manifest recipes and frozen topology checks.
  Delete an asset only after its consumers are removed or replaced. Verify the browser can still launch retained maps.
- Completion means visible actors during playback, no relevant missing-texture errors, and a working return to the
  scenario list. Check at least the reported variant and a variant for the other faction.

### 2. Fixtures and scenario selection

- Follow [scenario cleanup proposals](./scenario-cleanup.md). Start with SCOUT-02 and WALL-02, compare complete
  variant data and assertions, and reuse the existing builders under `tools/probable-waffle/skirmish/ai/scenarios/`.
  Do not remove a variant merely because its initial roster matches another. Preserve unique positive, negative,
  faction and fairness checks. Consolidate executions only when each assertion still receives the evidence it needs.
- Keep the manifest, fixture readers, browser catalog and report consumers in sync. Check representative generated
  setups and scenario IDs against their previous meaning. Record which cases changed; old results remain historical.
- Retain a local command for all supported scenarios and explicit reporting for deferred or incomplete cases. Adjust
  `.github/workflows/ai-regression.yml` so it cannot run automatically or manually until deliberately re-enabled,
  and note the long runtime there. Its future selection should come from the full manifest, with no scout-only profile.
  The user will run locally and deferred the overall scheduling decision.

### 3. Documentation and cancelled tooling

- Replace the generated `ai-controller/docs/testing/scenario-catalog.md` with concise guidance and an on-demand
  listing. `tools/probable-waffle/skirmish/ai/cli/generate-skirmish-test-catalog.ts` currently supplies requirement
  data to `prepare-scenario-browser.ts`; preserve that data path when adjusting the generator and CI checks.
- Review `ai-controller/docs/` and both `docs/ai/759-ai-*/HANDOFF.md` files. Move current operational guidance to
  the owning docs and unresolved acceptance to existing issues before deleting handoffs; update wiki, skills and
  other backlinks. Keep historical execution details in Git rather than copying them into another ledger.
- Remove the cancelled difficulty-calibration campaign, including its CLI, workload, tests, docs and registrations
  where exclusively used for calibration. Trace callers first. Retain Easy/Normal/Hard behavior and correctness
  coverage. Remove stale commands and links. Keep the source-structure rule and baseline.
- The introduction of this file already explains `tools/agent/` and its benchmarks. Review remaining commands and
  benchmark artifacts for actual consumers before removing anything.

### 4. Code and test layout

- Search PR-added exports and call sites, including `player/ai-controller/commands/dispatch-ai-order.ts`. Trace
  shared helpers separately from unused exports and remove only code with no runtime, test or tool consumer.
- List added and modified specs using `git diff --name-only origin/develop...HEAD`. Move each into a `tests/`
  directory under its existing owner using `git mv`. Move files used exclusively by specs or E2E tests likewise,
  without renaming. Check transitive consumers: developer scenario playback and gated runtime hooks are real
  consumers. Update imports, Jest/Playwright discovery, fixture paths and any generated references.
- Trim redundant comments and excessive one-use indirection where behavior and ownership remain clear. Review each
  change in its actual call path and avoid unrelated formatting churn.

### Verification and completion

The user previously deferred verification; obtain authorization before running checks under repository instructions.
Once authorized, use focused checks for each batch, the affected Angular and Phaser tests, AI tooling type checks and
the catalog/selection checks. Browser-check the reported sprite case and another faction. Avoid unchanged full-match
reruns; keep any individual run within the user's prior 30-minute limit. Do not claim scenario passes from authored
fixtures or partial runs. Finish by auditing every checklist item, reporting any unverified behavior or blocker, and
retiring this temporary cleanup checklist once durable guidance and unresolved work have an owner.
