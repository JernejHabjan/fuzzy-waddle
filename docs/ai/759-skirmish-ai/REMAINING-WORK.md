# RTS AI reliability and strategic coverage — execution contract

Prepared 2026-10-31; execution started on user “go”.
Worker: Luna High; no automatic model switching or delegation. Branch: feature/759-skirmish-ai.
This replaces the prior single-player execution queue. Prior evidence remains applicable where dependencies are unchanged.

## Goal

On “go”, inspect the goal tool. Create this objective only if no unfinished goal exists; never invent a token budget:

> Complete T1–T2, S1–S3, R1–R4, F1–F3 and C1–C3 in docs/ai/759-skirmish-ai/REMAINING-WORK.md.
> Repair owning TypeScript checks, audit and strengthen strategic decision evidence, deliver one manifest-based
> AI regression command shared by local E2E and CI with one extended-testing boolean, and close SCOUT-02.
> Preserve passing gameplay evidence, use focused causal regressions before native confirmation, cap each runtime
> invocation at 30 minutes, maintain three compact records, and commit/push coherent task-owned batches.
> Do not change PR #814 or certify multiplayer, full replay determinism, or difficulty calibration.
> Finish only with the required evidence, successful checks and separate omission/closure audits; report genuine blockers.

## Execution and authority

- On go: implement, run necessary focused checks and bounded native confirmation, commit/push on this branch.
- No PR state changes, merge, deployment, secret changes, paid infrastructure provisioning or Docker/peer repair.
- CI workflow authoring and dispatch of the new manual regression workflow are in scope when available through
  existing authorized repository access. If dispatch/workflow availability is blocked, record the precise prerequisite.
  Never change PR draft status to trigger CI. Workflow YAML is not remote execution evidence.
- Scope is single-player. Preserve multiplayer jobs/guards; expose their exclusion explicitly.
- Each runtime child invocation, including startup, has a hard 30-minute cap. Local children run sequentially.
  A full pack may span multiple bounded invocations; report estimated total before a long full pack.
- After two failed repair/check cycles for one cause, stop full matches. Inspect captured inputs and the downstream
  owner, produce a smaller reproduction, and either repair causally or record a blocker and advance independent work.
- No unchanged full-family reruns. Use focused tests during repairs; run affected native confirmation after the slice
  stabilizes. Retain unchanged evidence, invalidate changed invariants explicitly, never lower an oracle to obtain green.
- Keep concise progress updates. No CPU/memory reporting. Do not add polling/retry automations.
- Commit exact task-owned files; no force push. A failed publication is not a reason to repeat tests.

## Start and source anchors

1. Read HANDOFF and CURRENT-EVIDENCE; check git and goal state. Use Node 24 and repository pnpm.
2. T is first. Capture complete owning compiler diagnostics into ignored tmp/ files; summarize by owner.
3. Existing tools: package.json; tools/ai/run-skirmish-matrix.mjs; skirmish-ci-shards.mjs;
   select-skirmish-ci-shards.mjs; skirmish-runtime-diagnostic-selection.mjs; fixtures/skirmish-v1.json;
   native-scenario-bindings.json. Inspect neighboring tool tests before extending contracts.
4. Existing CI: .github/workflows/pull-request-checks.yml and develop-ci.yml; apps/portal-e2e/project.json
   and Playwright config. Inspect current E2E startup/selection before attaching the opt-in pack.
5. Gameplay prefix G = libs/games/probable-waffle/gameplay/src/lib/player/ai-controller.
   Phaser prefix P = libs/games/probable-waffle/phaser/src/lib. Browser prefix E = apps/portal-e2e/src/e2e.
6. Strategic source: G/docs/testing/strategic-scenarios.md, G/planning/ai-adaptation-manager.spec.ts,
   ai-adaptation-scenarios.spec.ts, ai-scouting-admission.spec.ts, ai-scout-search-questions.spec.ts,
   ai-skirmish-offense.spec.ts, ai-macro-production.spec.ts and adjacent implementations.
7. Scout source: tools/ai/fixtures/scout-02-native-runtime.json; G/planning/ai-tactics-scouting.spec.ts;
   P/player/ai-controller/observation/ai-scout-coverage.spec.ts and neighboring visibility/knowledge owners.
   Use semantic discovery once for unfamiliar ownership; jbcontext previously required login. Do not loop on auth.

## T — reliable owning checks

Dependencies: none. Investigate full Phaser and portal-e2e TypeScript diagnostics before repairs.
- T1: Both owning TypeScript commands exit zero. Inspect each project's actual tsconfig and record exact commands.
  Prove baseline attribution against the parent revision when needed; do not label errors unrelated by filename alone.
  Fix bounded type/contracts/configuration defects; do not suppress checks, exclude source, add broad any, or disable strictness.
- T2: Relevant tests/lint and consumer checks pass. If failures imply a broad framework migration or unrelated product
  redesign, record a specific blocker; an explicit user exception is required to waive a required check.
Checks: focused changed-owner tests, owning compiler commands, lint. No runtime match for a type-only repair.

## S — strategic decision coverage

Dependencies: inventory can start independently; repairs consume T where needed.
Audit six behaviours: starting useful scouting; stale-intelligence investigation; justified air production;
valuable harassment and withdrawal; upgrade timing; composition/strategy adaptation.
- S1: Classify each relevant existing case as authored, focused-tested, native-proven, failed, or unsupported.
  Link exact spec/fixture/variant and evidence provenance. Coverage must distinguish selecting a proposal, winning
  arbitration, applying it physically, and producing useful benefit. Test names and reason strings alone are not proof.
- S2: Each behaviour has meaningful positive and negative decision controls, reusing existing tests where sufficient.
  Examples: exposed valuable target versus observed anti-air; small beneficiary army versus useful research mass;
  optional upgrade versus emergency defense; profitable raid versus reinforced target; unanswered versus answered scout goal.
  Check independent permitted facts, budgets, admitted decisions and bounded outcomes. Permit multiple sensible choices.
- S3: Close demonstrated gaps in these six behaviours with bounded owner fixes. Obtain a native counterpart where
  physical effects are currently absent, without requiring a Cartesian sweep of every strategic scenario.
  Existing native evidence counts only if its premise, source and measured effect support the claimed behaviour.
  Unsupported roster mechanics remain explicit exclusions, never synthetic claims of native coverage.
Store the coverage selection in the existing manifest/binding system or one minimal companion machine-readable
selection file if required by its schema. Do not create a parallel scenario catalogue or Markdown dashboard.

## R — one local/CI regression entry point

Dependencies: S1 determines selection; T enables reliable execution. Reuse current runner and shard planner.
- R1: Add `pnpm ai:regression` for the established single-player regression pack. Resolve all established passing
  cases/variants from audited evidence and manifest identities. Include focused semantic checks and applicable native
  cases; do not promote one diagnostic variant into full-family certification. Every omitted known case has a reason.
  Historical pass counts are not a selector. Missing files, stale selections and zero exercised cases fail closed.
- R2: `RUN_AI_REGRESSION=true` enables the extended pack from `pnpm e2e`; false/unset runs ordinary E2E only.
  Parse strictly, reject invalid values. Direct `pnpm ai:regression` explicitly requests the pack regardless of that
  hook flag. Prevent recursive E2E invocation and double-running shards. Ordinary E2E failures remain failures.
- R3: CI uses exactly the same selection and command with bounded shards, artifact retention and failure propagation.
  A manual workflow exposes a boolean checkbox, mapped to RUN_AI_REGRESSION; normal CI uses a repository variable
  of the same name, default false. Document precedence. The flag gates extended SP tests only, not ordinary checks.
  Avoid duplicate runs from the existing skirmish jobs. Do not hand-copy scenario IDs into YAML.
- R4: Provide selection/dry-run and focused replay options, a compact summary and machine-readable results with
  source/fixture identity, variant, status, timeout and artifact paths. Shard at variant/repetition boundaries when
  needed; never silently drop repetitions. Distinguish diagnostic coverage from full-family certification.
Checks: selector completeness/exclusions, invalid boolean, enabled/disabled hook, child failure/timeout, empty
selection, local/CI selection parity and no recursion. Use small process fixtures for orchestration tests.
Demonstrations: ordinary E2E flag-off smoke and the selected full local pack now pass. Retain results across valid
resumptions; rerun only invalidated/failed shards. No full-pack retry for a wrapper-only fix.

## F — SCOUT-02 stale intelligence and physical investigation

Dependencies: T; consume S scout controls and R evidence reporting where ready.
Earlier failures `1793073090904`, `1793209460328` and `1793209831885` were diagnostic. Current full family
`1793446488003-passed` closes all ten authored variants on fixture `fnv1a32:c1a463c0`.
- F1: Reproduce earliest observation -> objective -> admitted order -> navigation/effect disagreement using retained
  captures or a focused fixture. A relevant accessible information objective receives service and actual coverage.
- F2: Contact confidence ages from the original sighting; reading memory does not refresh it. Hidden enemy position,
  health and queue changes cannot alter permitted inputs or decisions before renewed contact.
- F3: Withdrawn/visible and hidden-position/health/queue controls pass for the applicable factions. Use paired input
  controls for fairness and native movement/vision evidence for the investigation. Preserve concurrent income/production.
  Integrate passing variants into R; do not mark all SCOUT-02 passed from one successful trip.
Checks: relevant knowledge/scouting/arbitration/navigation owners first, then bounded affected native variants.
Do not tune speed/deadlines or grant resources just to force the test to pass. No unchanged SCOUT-02 family rerun.

## C — verification, publication and closure

Dependencies: T/S/R/F.
- C1: Required focused tests, lint, owning compiler checks and applicable build checks exit zero. Audit evidence
  applicability after shared changes. Run representative land/victory cases only if relevant invariants were invalidated.
- C2: Local selected regression pack succeeds with complete per-case accounting; disabled hook remains usable.
  Capture a real successful manual CI execution and artifacts using the same selection. If access or branch workflow
  availability prevents dispatch, retain authored/locally-verified work and mark remote validation blocked, not complete.
- C3: Separate Omission and Final Closure Audits map every acceptance ID to evidence; task-owned changes are
  committed/pushed. Handoff accurately lists exclusions and unresolved limitations. No blanket “all AI certified”.
No automated deployment, PR readiness/merge, peer certification, ESCORT/naval expansion, tournament balance,
advanced combat replay parity, or general pathfinding rewrite in this goal.

## Three records and stopping rules

HANDOFF <=80 lines: cursor, branch, next action, authority and blockers.
REMAINING-WORK target <=220 lines: this contract and goal text.
CURRENT-EVIDENCE target <=120 lines: current acceptance/results, source/fixture/report references and exclusions.
Every three coherent batches prune stale narration in place. Git stores history; do not append journals to archives.
Promote proven operator commands to existing owning testing docs on closure. A created file is authored, a passing
focused test is focused-tested, and a native/CI result is validated only for the coverage actually exercised.
Do not mark the tool goal complete with an unresolved required check. Follow goal-tool rules for blocked status;
a single blocked packet does not block independent work. Preparation alone does not start implementation.
