# Agent tools and AI PR cleanup

`tools/agent/` helps coding agents inspect the repository, select and run checks, summarize failures, manage
processes and measure workflow efficiency. The `benchmarks/` files define representative workflows and record a
measurement and review. These tools support development and are independent of the game runtime.

## Cleanup checklist

- [x] Replace the large generated scenario catalog with concise guidance and an on-demand inventory. The scenario
  browser retains its descriptions; requirement validation and the CI inventory command use the same source.
- [x] Reduce scenario fixture duplication by reusing common world setups and actions. SCOUT-02 and WALL-02 now use
  their typed faction/branch world builders; their scenario IDs, controls and assertions remain unchanged.
- [x] Remove completed AI handoffs after moving any still-useful guidance and unresolved acceptance into durable
  documentation or issues. Update links before deletion.
- [x] Review `ai-controller/docs/` for outdated plans, unfinished work presented as complete, excessive detail and
  duplication. Current docs keep behavior, testing guidance and unresolved issues; generated-catalog links were
  removed in favor of concise requirements and the on-demand inventory.
- [x] Disable the remaining manual trigger of `.github/disabled-workflows/ai-regression.yml` and explain in the workflow that
  extended AI regression is too slow for routine CI. Automatic tag triggering is already disabled. When enabled later,
  the workflow should select all supported scenarios from the manifest, without a separate scout profile or a
  hardcoded scenario list. Preserve local commands and explicitly report unsupported cases and incomplete runs.
  Overall scheduling and runtime limits can be decided later; the user plans to run scenarios locally.
- [x] Document the purpose of the agent tools and their benchmarks in this file. Review optional agent commands and
  benchmark records for redundant maintenance.
- [x] Remove the cancelled difficulty-calibration campaign tooling and update its dependencies. Preserve normal
  difficulty settings and their correctness checks.
- [x] Audit the new AI map asset packs and tilemaps against their scenes, scenario recipes and test-map contracts.
  Remove redundant assets only after confirming their consumers and keeping required maps playable.
- [x] Audit unused code introduced by this PR, including `dispatchAiOrder` and related helpers, tests and exports.
  Trace runtime and test consumers before removal.
- [x] Organize added or updated specs under owner-local `tests/` folders where requested. Gameplay, Phaser and AI tool
  specs remain organized there. Per user direction, keep `apps/portal-e2e` files in their original folders; move no
  portal E2E specs or support modules into `/tests`.
- [x] Review generated comments, overly granular one-use files and repeated test documentation. Remove duplication
  only where the remaining code and docs still explain the behavior and its ownership.
- [x] Fix missing actor sprites in interactive AI scenarios, starting with `wall-01-tivara-terrain` and the missing
  `warrior_walk` texture. The shared asset pack declares `warrior_walk`, and browser playback produced no
  missing-texture warning; a Tivara worker rendered on AI Open Economy. Closed based on this playback evidence.
- [x] Keep the repository-wide source-structure rule and baseline in this PR.

Browser smoke check: the scenario list launched `wall-01-tivara-terrain` and `wall-01-skaduwee-terrain`, and a Tivara
worker rendered on AI Open Economy. A Skaduwee SEQ-01 playback loaded on AI Bridge Crossing; its captured view did not
show a unit. No `warrior_walk` or other texture error appeared in the browser console. The sprite checklist item is
closed based on the shared texture declaration and visible Tivara playback; this Skaduwee capture alone does not prove
cross-faction rendering.

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
  `.github/disabled-workflows/ai-regression.yml` so it cannot run automatically or manually until deliberately re-enabled,
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
  coverage. Remove stale commands and links. Keep the source-structure rule and baseline. **Done:** campaign-only
  tooling and D-06 registration are removed; D-01 through D-05 remain as ordinary difficulty correctness coverage.
- The introduction of this file already explains `tools/agent/` and its benchmarks. Review remaining commands and
  benchmark artifacts for actual consumers before removing anything.

### 4. Code and test layout

- Search PR-added exports and call sites, including `player/ai-controller/commands/dispatch-ai-order.ts`. Trace
  shared helpers separately from unused exports and remove only code with no runtime, test or tool consumer.
- List added and modified specs using `git diff --name-only origin/develop...HEAD`. Keep portal E2E specs and support
  modules in their existing owner folders. Other specs and test-only helpers may go under a local `tests/` folder after
  checking transitive consumers. Update imports, test discovery, fixture paths and generated references as needed.
- Trim redundant comments and excessive one-use indirection where behavior and ownership remain clear. Review each
  change in its actual call path and avoid unrelated formatting churn.

### Verification and completion

The user previously deferred verification; obtain authorization before running checks under repository instructions.
Once authorized, use focused checks for each batch, the affected Angular and Phaser tests, AI tooling type checks and
the catalog/selection checks. Browser-check the reported sprite case and another faction. Avoid unchanged full-match
reruns; keep any individual run within the user's prior 30-minute limit. Do not claim scenario passes from authored
fixtures or partial runs. Finish by auditing every checklist item, reporting any unverified behavior or blocker, and
retiring this temporary cleanup checklist once durable guidance and unresolved work have an owner.
