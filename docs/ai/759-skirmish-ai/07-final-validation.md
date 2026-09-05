# Stage 15 — extensive review, validation, repair, and closure

Model: `gpt-5.6-sol`, effort `xhigh`. [Runbook](00-start-here.md) policy: this is the final required stage; all deferred execution happens here. Stage 16 search/learning is excluded. Prior stages must be `stage_checked` with focused evidence, not falsely marked release-validated. Start with the complete progress/verification ledger and candidate commit. This stage reruns the final integrated checks; earlier green results do not replace them.

## 15A — integration and formal review

1. Review the full diff from recorded integration base, not just the last commit. Trace one complete path for each action family from observation -> goal -> demand -> intent -> reservation -> shared command -> server/runtime validation -> applied outcome -> save/hash/debug. Check all registrations, consumers, public exports, schema guards and old call sites. Fix missing connections before expensive matches.
2. Independently re-read runtime behavior against its fixtures: permission/visibility/team rules; deterministic ordering/time/RNG; costs, refunds, queues and idempotence; all worker/actor/caster/seat ownership; graph generation and topology; phases/cancellation; save/host reconstruction; scene disposal; debug side effects. Prefer a fresh review context/model where available; do not create other tasks or agents without authorization. A solo agent must perform this as a distinct review pass.
3. Search changed AI/runtime paths for TODO/no-op success, legacy direct mutations, stale comments, unsafe casts, unbounded loops, wall-clock decisions, empty debug fields, missing outcome branches, and feature flags that leave the new behavior disconnected. Required mechanics cannot remain mocked or disabled in ordinary skirmish.
4. Resolve known integration defects recorded during 0–14. Changes belong to their owning modules; do not pile fixes into a monolithic brain/controller. Update tests and architectural notes with each correction.
5. If a schema/command/cadence change invalidates older fixtures, update explicit version/migration expectations and document why. Never loosen fairness/determinism assertions merely to accept a new trace.

## 15B — repository and automated checks

Use the current checkout's package manager/toolchain. At research time: Node `>=24.13.0 <25`, pnpm `11.14.0`; repository configs may evolve. Install locked dependencies if necessary without altering the lockfile gratuitously. Hydrate assets through the existing repository LFS workflow when needed for real browser validation; missing assets/credentials are infrastructure failures, not passing tests.

Verified existing project/command anchors are listed below. Stage 2/5 must have authored missing gameplay/protocol test and scenario runner targets. Inspect final target definitions before invocation. `api` build may be inferred by Nx plugins; discover its actual target with `nx show project api` rather than assuming an explicit target in project.json. `portal-e2e` does not declare an e2e target in the inspected file, so use the Playwright config directly.

```sh
git diff --check
pnpm exec nx format:check --base=<recorded-base-sha> --head=HEAD
pnpm exec nx run-many -t lint --projects=probable-waffle-gameplay,probable-waffle-protocol,probable-waffle-phaser,probable-waffle-server,probable-waffle-interface
pnpm exec tsc --noEmit -p libs/games/probable-waffle/gameplay/tsconfig.json
pnpm exec tsc --noEmit -p libs/games/probable-waffle/protocol/tsconfig.json
pnpm exec tsc --noEmit -p libs/games/probable-waffle/phaser/tsconfig.json
pnpm exec tsc --noEmit -p libs/games/probable-waffle/server/tsconfig.json
pnpm exec nx test probable-waffle-gameplay --runInBand
pnpm exec nx test probable-waffle-phaser --runInBand
pnpm exec nx test probable-waffle-server --runInBand
pnpm exec nx test probable-waffle-interface --runInBand
pnpm run assets:check
pnpm run phaser-editor:check
pnpm run version:check
pnpm exec nx build portal --configuration=production
pnpm exec tsc --noEmit -p apps/api/tsconfig.app.json
pnpm exec playwright test --config apps/portal-e2e/playwright.config.ts
```

Replace the base placeholder with the recorded exact SHA; don't paste it literally. If a project tsconfig is a references-only wrapper, run its implemented typecheck target or actual referenced source tsconfig and record that choice; a command checking zero source files is not coverage. Add the authored protocol tests and current inferred API build command. Run affected dependents and repository CI-required checks from `.github/workflows/pull-request-checks.yml`/`develop-ci.yml`, including campaign regressions where shared rules changed. Do not disable asset checks, bundle budgets or module-boundary rules. Packaging/version changes only when the repository's actual PR rules require them.

Record full failures and classify task-caused versus pre-existing with base comparison. Fix task failures and rerun the affected check. A pre-existing failure is documented and does not excuse abandoning remaining checks; a required gate still blocked is reported as unvalidated, not silently waived.

## 15C — core match first, then pure and real simulation matrix

After 15A/B repairs, run the continuous core SEQ-01–04/07 gates from [packet 10](10-integration-and-adversarial-tests.md) before broad tuning/soaks. Fix basic income, mission and recovery failures immediately; sophisticated fortification/naval results cannot compensate for a broken standard land skirmish. Then run every H-01–32 and SEQ-01–08 case/variant alongside the original strategic/runtime catalog. No reset between events inside a sequence. The [H1–H9 contracts](09-progress-and-hardening.md) define independent progress and authority acceptance.

Run every retained Level A/Level B fixture in the research document, plus each packet's added cases. Include simultaneous-player contention, query invalidation storms, lost outcomes, cumulative causal timeouts, wait cycles, starvation and second-match cleanup. Give each a stable ID, version, fixed seed, setup, perturbation tick, maximum simulation duration, observed conditions and exact assertions. Run each focused deterministic fixture three times; compare commands, authoritative hash, AI digest and first-differing normalized path. Test permutations of candidate input order, render rates, pause/speed, and save continuation.

The full [deterministic strategic scenario catalog](08-deterministic-scenarios.md) is a mandatory gate, including every positive/negative variant and assertion-helper self-test. Validate sensible outcomes with independent state/action/world predicates, not one arbitrary exact tile/unit count or a self-reported goal string. Separately require exact reproducibility within the same implementation. Publish coverage for every stable ID; missing/unexercised required cases fail the gate. Authoring fixtures in earlier stages never counts as executing them.

| Group | Mandatory assertions |
| --- | --- |
| Purpose/build order | Same seed gives same goal/step; completed opening steps remain complete after defense interruption; each active goal has purpose/evidence/next action or blocker |
| Purposeful duplicates | Demand may require several same-type buildings or units; fulfill it, including anticipated throughput and useful local deposits. After total required capacity is committed, 100 unchanged decisions admit no excess. Duplicate/out-of-order outcomes don't duplicate effects; loss creates only still-needed replacements |
| Composition | Ledger counts ready/queued/in-flight once; mixed roles where useful/available; observed flyers produce real anti-air response; no random archetype/roster churn |
| Economy | Bootstrap no-worker start; resource-compatible delivered income; mature/locked/regrowing Field; loaded-worker/drop-off loss; source/service cap and worker interruption; supply forecast and shared queue/refund correctness |
| Authority/fairness | Non-host AI cannot dispatch; IDs/coordinates/ownership/cost/cooldown/site revalidate; hidden/neutral/ally targeting prohibited except explicit mode permissions; no hidden research/queue leakage |
| Access/transport | Ground disconnected objective never receives impossible direct order; water/future-air test route; board/transit/unload/regroup; lost cargo/transport/landing recovery; economy containers excluded |
| Fortification | Whole and partial layout preserve friendly corridors/stairs/production/shore access; bounded useful towers/walls; distinct reachable posts; breach/repair/abandon; deliberate opening remains usable |
| Tactics/support | Favorable attack and unfavorable retreat; no permanent assembly wait; range/windup/armour/impact agreement; coordinated casts/heals; effect refresh, stuns and zone avoidance; no temporary support counted as permanent base |
| Recovery/modes | Recoverable blocks/losses restore actual useful work by independent deadline; optional terminal failure proves infeasibility and hands off assets; no renewed-deadline or plan-ID evasion; technical faults never masquerade as concession; neutral/team/mode/results remain correct |
| Lifecycle | Save before/after command apply, farm growth/deposit, effects/projectile/summon expiry, board/transit/unload, breach/repair and concession candidate; reconnect/new host restores one brain with same next step and pending work |
| Debug | Snapshot corresponds to accepted trace; no hidden current IDs in memory; all required categories/overlays/drilldown/history/export populated; debug shown/hidden/frozen/exporting yields identical AI commands/digests |

Real runtime means the actual SimulationTickService, command bus/application, movement/combat/economy systems, actor definitions, and GameModeConditionChecker/ScoreTracker. A Node fixture over mocked Phaser objects is useful for contracts but cannot pass the transport/walls/spells/match gates alone. If a fully headless Phaser runner is impractical, use the Stage 5 browser scenario bridge and advance fixed logical ticks with rendering varied independently. Keep test hooks local/developer-gated and remove any unrestricted debug mutation endpoint before closure.

## 15D — baseline, batches, and tuning

Implement and run the Stage 5 CLI with this stable interface (it is a required new tool, not an existing command):

```sh
node tools/ai/run-skirmish-matrix.mjs --manifest tools/ai/fixtures/skirmish-v1.json --candidate <candidate-sha> --baseline <baseline-source-sha> --output tmp/ai-results/759
```

Manifest fields: schema/version, scenario ID, faction/side, map/access pattern, seed, difficulty/archetype, rules/modifiers, initial state, opponent probe, perturbation tick, max ticks and assertions. CLI resolves exact sources to isolated checkouts, verifies clean intended SHAs, launches the required runtime adapter, applies identical scenario semantics and stores command/trace/replay/hash references. Do not hardcode candidate code into the baseline checkout. A minimal baseline observer/fixture adapter may be backported only if it does not change old decisions; record its patch/hash. If equivalent setup is impossible, mark that baseline comparison unsupported and report candidate correctness evidence separately.

Start with seeds 1–5 and mirrored sides on each supported authored map for both factions at Normal against scripted idle/rush/turtle/proxy probes and the pinned baseline. Expand selected stress scenarios to seeds 1–20, run Easy/Normal/Hard coverage and every exposed valid archetype/map/faction pairing. Include open/choke/island/air/naval stress maps as authored test scenarios even if shipped map selection lacks one. The unsupported flying-container prefab is an explicit synthetic fixture, not advertised faction support. Run at least three 60-minute-simulation soak matches with large armies, depleted resources, effects and repeated saves/host recovery.

Report raw sample counts, failure rates, win/loss/tie, intervals (Wilson for binary outcomes), first-milestone times, delivered income/idle/supply blocks, production composition, damage/retreat efficiency, route/transport/fortification completion, command/claim churn, debug and memory/work performance. Promote no baseline silently.

Initial acceptance targets (record tuned values before final rerun):

- Zero fairness, deterministic divergence, crash, duplicate effect/claim, illegal domain, save-continuation, or result-uniqueness violations in required fixtures.
- Normal establishes delivered-income economy and launches a purposeful offensive mission within 10 simulated minutes on viable standard fixtures. The mission achieves its independent effect/loss bands within workload-derived bounds and continues useful pressure in later viable five-minute windows. Expansion, cosmetic attack orders or a token distant patrol do not substitute for offense. Genuine survival/uncertainty conditions require their own active bounded response, not suicide or indefinite waiting.
- H1 progress deadlines use actual expected work; every recoverable critical interruption restores productive duty/mission within its independently authored deadline. Repeated explanations, renewed deadlines and changing plan IDs do not count. Genuine optional-goal infeasibility requires evidence, safe claim release and useful reassignment; a technical fault fails required supported-game acceptance.
- Composition, duplicates, transport and fortifications satisfy their exact scenario assertions; aggregate win rate cannot excuse failing them.
- Median worker idle time, supply-block ticks and producer idle time improve by at least 10% over a comparable nonzero baseline, or retain zero when already zero. Also report worst/p95 causal stall, lane starvation, unresolved command age, mission launch/retreat churn and completed capacity without useful work. Freeze scenario thresholds before release/holdout runs. A documented metric correction requires preserving old results and a fresh affected/holdout run; never weaken hard liveness/safety gates or remove failing supported contexts.
- Tactical survival/objective efficiency does not regress on the targeted favorable/unfavorable fixtures. Holdout seeds and blind A/B playtests must support the claimed improvement; statistical uncertainty is reported.
- Deterministic work caps always hold; queue/trace/index memory is bounded in soaks. Record p50/p95 decision time and memory on the same machine and actor counts, including debug on/off; investigate >10% unreviewed performance regression versus compatible baseline.

Tune configuration using collected evidence, save profile/archetype version and rationale, and rerun affected deterministic/scenario/holdout cases. Do not implement cheating or hidden data access to improve scores. No product approval is needed merely to choose the initial documented defaults; genuinely new game mechanics remain out of scope.

## 15E — actual skirmish and debug UI review

Use the repository browser-playtest workflow/skill when performing browser QA. Start through real lobby selection: both factions, each difficulty, legal map, ordinary economy/visibility. Confirm AI opens, produces mixed purposeful forces, explores, reacts, expands/fortifies when justified, recovers, and wins/loses/concedes to the score screen. Include save/load, pause/speed, multiplayer reconnect/host migration, and a teammate scenario.

At 1280×720 and 1920×1080 review every debug category with long data; inspect clipping/scrolling, player switching, refresh, camera focus, overlay legend, trace history/export and cleanup. Demonstrate the actual repeated-building complaint: view desired/existing/in-flight counts and rejection reason over many ticks. Inspect army-role deficits and evidence-driven counter changes. Human blind A/B feedback remains valuable; if unavailable, report it pending rather than fabricate reviewers or pretend automated screenshots are a blind playtest. Report automated gameplay acceptance and human fun/challenge sign-off separately; neither may be silently substituted for the other.

## 15F — learning, docs, skills, and final closure

- Update durable AI architecture/API docs alongside gameplay/Phaser AI ownership modules with final contracts, time/units, arbitration/ledger rules, schema migrations, debug usage, fixture commands, supported maps/factions/modes, and actual limitations. Replace illustrative plan names with implemented paths in progress/coverage records.
- Update this implementation progress ledger and research evidence only where code invalidated an assumption. Preserve historical evidence/date/provenance; distinguish implemented from validated and superseded hypotheses.
- Inspect applicable repo skills in `plugins/fuzzy-waddle-skills/skills/`. Update repo workflow/task-tracking guidance only for reusable lessons; add AI-specific guidance to the appropriate Phaser or narrowly scoped AI skill if the final architecture warrants it. Read the skill-creator instructions before creating/updating a skill. Do not turn this task's particular staged-check/final-matrix schedule into a global rule. Do not edit unrelated user-installed/system skills.
- Record proven learnings: resource drains are deposits; housing capability is definition-derived; commitments survive command/site/queue transitions; all actor/caster/seat ownership is explicit; effects and debug respect simulation authority; real runtime fixtures are required for topology/transport.
- Perform separate Omission and Final Closure audits over the complete acceptance map. After code or skill/doc fixes, rerun the relevant affected checks and review their results. Confirm no untracked required files, stale references, missing registered test targets, unresolved required TODOs or disabled new AI paths remain.
- Commit only task-owned implementation/verification repairs/docs, push, confirm remote SHA and draft PR body evidence. Describe passed/failed/skipped-with-reason checks and unresolved blockers candidly. Do not merge automatically or claim this stage complete while any required gate is unproven.

Final deliverable: playable purposeful skirmish AI with full debug visibility, runtime evidence, exact replay/save recovery, documented limitations, updated maintainers' guidance, and an up-to-date reviewable remote branch.
