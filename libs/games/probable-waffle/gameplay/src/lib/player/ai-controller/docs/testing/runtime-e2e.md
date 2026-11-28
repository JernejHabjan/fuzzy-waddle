# Runtime E2E and optional matrix certification

## Current execution policy

`e2e:ai` runtime cases run in CI on non-draft PRs to `main` via `.github/workflows/pull-request-checks.yml`; broader local runs remain opt-in.
Full matrix certification, real-peer multiplayer and extended save/load certification are incomplete;
see [coverage and follow-ups](./coverage-status.md). An authored or playable scenario is not a passing test.

## Highest priority: focus and shorten scenarios

[#865](https://github.com/JernejHabjan/fuzzy-waddle/issues/865) is the main scenario-testing improvement before another
broad certification campaign. Audit every focused family, not just the currently failing case. Start immediately before
the decision, remove unrelated opening/economy/travel/combat work, and stop on complete independent outcome proof.
Aim for seconds per world, ordinarily under one minute, within the three-minute enclosing test budget.
Before execution, tell the user when a selected case is overbroad or likely to exceed that budget, identify the
unnecessary work and explain the refocusing needed. Do not silently raise limits or repeatedly run an unchanged slow case.
Lowering a ceiling alone is insufficient: preserve controls and make the useful proof fit the shorter window.

## Tick budgets, repetitions and seeds

`testing/bindings/native-scenario-bindings.json` owns generated native branch windows. `latestTick` becomes
`maximumTick`; `checkpointTicks` selects observations. `evidenceCheckpoints` and optional branch selection permit
early success only when the native evaluator proves every required outcome and scheduled intervention.
Other fixtures declare equivalent limits in their recipes. Reaching the ceiling is not automatically success:
the final evaluator still runs, including comparisons and negative controls.

A report's measured stop tick is evidence from that run, not an automatically learned fixture deadline.
For a stable positive case, choose an explicit deadline from representative valid runs plus about 20% simulation
headroom, rounded to a checkpoint. Preserve legal setup, completion time and scheduled events. Negative controls
need a meaningful observation window; absence at an early checkpoint does not prove sustained restraint.
Wall time depends on setup, simulation and capture cost and cannot be inferred from ticks alone.

The enclosing Playwright runtime test has a hard three-minute budget, shared by every selected serial world.
Native evidence worlds additionally have a 120-second watchdog. The outer matrix invocation retains its separate
30-minute process safeguard; that does not grant an individual test 30 minutes. Oversized selections must be split
and oversized recipes must be refocused rather than increasing the test timeout. H-10's real 128-command backlog
workload still needs refocusing to fit this budget; retain its admission, identity-retention, drain and income controls.
An over-budget or incomplete run fails and supplies no complete-recipe certification.

Run each focused positive/control world once unless repeatability is part of acceptance. Repeatability requires
identical-start runs and normalized decision/outcome comparisons; extra seeds belong to explicitly requested coverage.
Use native simulation ticks and fixed-step execution, not elapsed rendering time, for gameplay assertions.

## Authoritative focused worlds

Use `presetWorld` to start immediately before the decision. The development bridge validates faction actors,
ownership, positions, terrain, exact starting resources, legal queues and ordinary starting orders before AI observes
its first tick. Queue setup uses catalog, tech and payment checks; production and movement then execute normally.
Do not inject brain state, claims, hidden knowledge, desired decisions or success flags.

Keep unrelated macro, economy targets and combatants out of focused setups. A positive/control pair changes only
its causal variable while retaining seed and legal premises. Continuous matches use normal starts and separately
prove opening-to-result behavior. Scripted opponent events establish a trigger, never the AI's successful response.
Paid output, original actors, actual arrivals, physical weapon effects and delivered resources prove useful outcomes.

The generic `evidenceStop` contract is restricted to monotonic positive assertions with an explicit stability window.
Native proof checkpoints instead run the selected native oracle on a sealed history prefix; they must retain every
branch's temporal and absence obligations. Never replace an oracle with a command count or a reassuring debug label.

## Reports and diagnosis

Start with `pnpm ai:skirmish:report -- --report <artifact> --scenario <ID> --failures-only --details`.
Read bounded indexes before raw captures. Matrix indexes live under `indexes/`; `execution.resultArtifact` points to
native captures. Consumers must use the existing artifact codec to resolve shared or external variant references.
Malformed references, missing history, source/fixture conflicts and zero-work reports fail closed.

A retained sweep needs a common run/source identity and consistent expanded fixture identities. Different shard
selections can have different aggregate fixture digests. Reuse old results only after checking relevant source and
workload applicability; a date or aggregate pass count is insufficient. Keep setup/process failures distinct from
AI behavior failures. A terminal `quit` from reaching the bound is not victory; victory requires an authoritative win.

Diagnostic replay uses `--scenario ID --mode runtime --variant ID --repetition N [--seed INTEGER]`.
It certifies only that selected world, not its siblings or recipe. Use the existing matrix selectors and bounded
shards for complete comparisons. Multiplayer smoke tests require local Supabase and the dedicated multiplayer runner;
local transport faults do not certify real-peer reconnect or host migration.

Temporary HTML summaries, generators and raw captures are disposable after preserving a compact evidence/limitations
record in the PR and unresolved acceptance in durable docs or issues. Product code must never depend on `tmp/`.
