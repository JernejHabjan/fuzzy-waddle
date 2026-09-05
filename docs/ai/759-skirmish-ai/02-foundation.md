# Stages 0–6 — foundation, commands, knowledge, and purpose

Follow [the runbook](00-start-here.md), [shared decisions](01-shared-decisions.md), [H1–H9 hardening](09-progress-and-hardening.md) and [verification ladder](10-integration-and-adversarial-tests.md). Write code/tests/debug together, run each focused gate and continue after repairs. Stage 15 reruns the complete final acceptance; it is not the first time the foundation executes.

## Stage 0

Model: Terra / high. Read `BasePlanner`, `MapAnalyzer`, their tests, and PR #792's exact diff. Reconcile/integrate the existing deterministic accessibility/tie-break fix as directed by the runbook. Pin the pre-behavior baseline and record integration provenance. If equivalent code is already merged, mark implemented by reuse; do not duplicate it or wait for a merge. No other planner redesign here.

Final evidence: async accessibility excludes unreachable candidates, permutation/equal-score choices are stable, and the implemented prerequisite matches #792's intended regression without unrelated branch changes.

## Stage 1

Model: Terra / high. Existing paths: Phaser `player-ai-controller.agent.ts`, `player-ai-blackboard.ts`, `ai-behavior/supply-planner.ts`; gameplay MDSL/interface and telemetry.

1. Trace `IsEnemyPlayerWeak` from MDSL to strength comparison; fix the condition's polarity with clear semantics. Author stronger/weaker/equal/zero-strength fixtures.
2. Replace success-with-no-effect in `GatherResources`/`StartUpgrade` and always-null resource demand with real existing legal behavior where small, otherwise typed unsupported/no-action outcomes. Stage 7/14 must replace remaining required placeholders; explicit failure is only a migration state.
3. Fix the observed housing mismatch: `SupplyPlanner.getHousingObjectName()` returns `WorkMill`, whose definition has no housing. Resolve available constructible positive-`housingCapacity` definitions through the faction builder/tech tree; existing ordinary choices are Tivara Olival and Skaduwee Emberstone. Filter affordability/prerequisites separately from capability. Never guess a name from “economic building.”
4. Introduce typed reason codes, trace envelope, stable serialization, and command-drop reasons for missing IDs/services. Trace IDs derive from player and monotonic decision counters.
5. Start the debug snapshot/projector and reason-driven Overview using the debug packet. Keep existing UI entry/navigation.

Author fixtures: polarity, no false success, actual housing capability on both factions, no candidate when no legal housing, stable reasons/serialization. Output: corrected static paths and trace/debug foundation; run focused regressions and record actual results.

### Stage 1 retained final acceptance

**Acceptance**

- Each confirmed static defect has a failing-before/passing-after test.
- Unsupported actions cannot return success and silently unblock a behavior branch.
- Trace values serialize deterministically and bound their retained event count.
- No intentional strategic expansion is bundled into this correctness checkpoint; later stages own it on the integration branch.

## Stage 2

Model: Sol / high. Create pure contracts under the shared source/destination map before moving runtime behavior.

1. Define the full observation and brain slices listed in shared decisions. Required observation subtypes carry logical position/access node, owner/diplomacy, effective capabilities/level, queue/cost/supply, resource/growth/service state, visible effects/zones, and mode goals. Use optional or explicit unknown fields where information is unavailable, never fabricated zeroes.
2. Define discriminated intent payloads per action family, typed preconditions/claims, command identity/outcomes, plan lifecycles, capability catalog entries, profile config, and debug snapshot. Shared ID/enum imports are the authority; define named IDs for plans/demands/claims.
   Include H1 progress/blocker/recovery contracts, H2 typed prerequisite/wait edges and reservation states, H3 authority/sequence reconciliation, H4 lane service debt, and H7 query health/revision contracts. Every stored deadline has a clock/unit and persistence policy; invalid numeric/schema inputs are rejected at boundaries.
3. Implement pure defaults, canonical sort/serialize helpers and migrations from current legacy AI saves. A known legacy save starts new planning state from its current world, without replaying already satisfied opening steps; future schema versions reject explicitly.
4. Define manager proposal interfaces and the pure `AiBrain.step` reducer contract. Add adapters translating legacy data into the new shapes without making legacy blackboard the owner of new state.
5. Author capability coverage manifest linking each researched component family to observation/proposer/command/outcome/save/debug/fixture or explicit unsupported reason. Include scenario/editor-injected conversion, not only ordinary prefab properties.
6. Add a gameplay Jest target/config using existing `tools/testing/jest-node-preset.cjs` if needed. Current gameplay project has lint but no test target. Add protocol test coverage in an appropriate owning test target or a dedicated node target; do not assume it exists.

Output: exported and connected interfaces, migration/default fixtures, capability coverage, compile-ready imports. Run actual-source type/contract checks before downstream consumers depend on these interfaces.

### Stage 2 retained final acceptance

**Acceptance**

- No Phaser/live object crosses the pure boundary.
- Permuted equivalent fixtures serialize and digest identically.
- Save/default/migration tests reject unsupported future schemas clearly.
- One fixture explains accepted and rejected dummy intents.

## Stage 3

Model: Sol / xhigh. This is the largest cross-layer stage; implement internal slices in order and retain one command authority.

1. Inventory every AI effect: production/research/cancellation, construction, move/attack/scout/rally, heal/repair/tend/return, board/unload, cast/autocast, and concession. Map each to protocol -> server validator/relay -> command bus/queue -> runtime apply -> outcome -> save/replay. Add typed shared payloads only where existing actor actions cannot represent required data. Preserve human queue/stop behavior.
2. Introduce deterministic command/correlation identity and applied outcome mapping. Dispatch acceptance is not application. Reconcile pending command, production queue item, construction site, and actor by one commitment key. Reject duplicate effects, stale/missing actors, invalid player/host/owner, illegal targets, and invalid costs/sites/capacities/cooldowns with stable reasons.
3. Migrate one action family at a time: production/research first; movement/combat; worker/construction; transport; spells; concession. Redirect every migrated manager/pawn entry that could duplicate strategic control. Automatic pawn execution remains shared local simulation driven by accepted orders.
4. Move spell gameplay impacts from tween completion to simulation-tick pending effects with logical positions and stable ordering. Retain animation as presentation. Apply spell/heal/zone eligibility through shared diplomacy, effect polarity, target type, range and domain checks. Cover Healing Light Actor targeting and ground healing zones. Save in-flight impact and summon expiry state.
5. Add authoritative unload/cargo outcomes and conversion observation hooks; an AI approach can cause normal proximity conversion but cannot set owner. Make simultaneous conversion resolution canonical and skip inactive candidates correctly.
6. Connect typed command outcomes into the brain adapter, debug drilldown, replay, save/recovery, and server validators. Network schema/version changes need explicit compatibility handling; no silent fallback to direct mutation.
7. Implement H3's lost-outcome reconciliation, processed-sequence/watermark policy, bounded pending backlog, authority epoch fencing and technical-fault state. Exercise H-06–10 with completed/destroyed effects and late old-host events; actor absence is not proof a purchase never applied.

Output: all effect paths wired and end-to-end fixtures authored. Do not leave the new brain mutating live blackboards or spawning actors directly. A missing game command is implementation work in this stage, not a reason to invent a debug shortcut.

### Stage 3 retained final acceptance

**Acceptance**

- Exact repository search plus reviewed allowlist finds no strategic AI mutation outside the adapter.
- Host emits and a second runtime/replay applies the same ordered commands.
- Invalid ownership, ally/hidden targets, stale commands, illegal sites, and insufficient resources are rejected with stable outcomes.
- Protocol, server/transport, Phaser application, replay, and tests change together.

## Stage 4

Model: Terra / xhigh. Read snapshot/targeting/vision/diplomacy helpers, ActorIndexSystem and map/navigation inputs.

1. Build one immutable observation from permitted indexed data at a logical tick. Make async generation/cancellation and publication explicit; no fire-and-forget refresh or mixed generation arrays.
2. Create separate current-visible contacts and remembered location hypotheses. Remove live IDs on loss of permitted visibility. Canonicalize before scoring/RNG; teams and neutrals are not inferred from owner inequality.
3. Project map bounds/static knowledge/frontiers and known dynamic obstacles under the same human information policy. Region generation can remain pending until bounded inputs finish. Height/flight/shore/occupancy use existing runtime rules.
4. Project effective runtime actor level/capabilities; source/growth/drop-off and shared queue state; status, permitted zones, temporary support and neutral opportunities; actual mode objectives. Never expose private enemy queue/research/cooldown fields.
5. Update stable memory, decay/confidence, scouting coverage, and known threat summaries. Store evidence tick/source for every counter/goal input.
6. Complete observation age/policy/unknown/error debug sections. UI does not query live hidden objects.
7. Implement H7's bounded query products so optional navigation cannot block urgent local defense. Preserve atomic observations and deterministic logical work scheduling, distinguish unknown/blocked/service-failed, and handle invalidation storms with saved cursors instead of unbounded restarts.

Output: atomic knowledge/observation pipeline and authored fairness, stale-generation, ownership-change, coordinate, and visibility fixtures.

### Stage 4 retained final acceptance

**Acceptance**

- Normal skirmish cannot see hidden actors or attack allies; permitted visible friendly support remains legal.
- Loss of vision removes live IDs while preserving permitted last-seen positions.
- A late older async generation cannot commit or change the next decision.
- Campaign/scripted omniscience is explicit and covered separately.
- Save/load preserves knowledge and next observation deterministically.

## Stage 5

Model: Sol / high. Implement and execute the harness bootstrap/oracle/small runtime gate now; broad comparative baseline batches remain Stage 15.

1. Extract reusable canonical authoritative projection from `StateHashService`; add distinct pure AI digest and first-differing-path diagnostics. Keep current multiplayer consumers working.
2. Complete brain save/load and runtime gaps for crop/tender, deposit sub-actions, spell cooldown/effects/zones/pending impacts, summon expiry, conversion, cargo, queue state, pending outcomes, RNG and cadence. Rebuild object references from stable IDs. Save-safe phases must not trigger duplicate opening or production after restore.
3. Build pure fixture runner under gameplay testing. Inputs: schema/version, seed, sorted observation sequence, outcome sequence, prior state. Outputs: exact ordered intents/commands, trace, brain/digest deltas. Implement the [scenario contract](08-deterministic-scenarios.md): independent semantic outcome/invariant assertions, paired negative/control worlds, numeric deadlines/bands, assertion-helper self-tests and non-vacuous coverage. Exact repeated traces and flexible strategic assertions solve different problems; implement both.
4. Build the real runtime scenario driver plus a browser development/test bridge that advances fixed simulation ticks using normal commands and waits for committed observations. Mocks alone cannot establish gameplay correctness. The bridge must be test/developer-gated, bounded, and absent from ordinary client command authority.
5. Create `tools/ai/run-skirmish-matrix.mjs` (or a narrow typed CLI entry with equivalent stable path), fixture manifest, report format, retained failure artifacts, baseline adapter seam and candidate source version. Add the invoked Nx/script targets now. Include single-scenario/seed/mode filters, stable catalog IDs and mandatory missing-coverage failure; register every scenario row and its owning-stage variants. Do not claim that the runner exists until implemented.
6. Record pinned baseline source SHA and compatibility limitations; design Stage 15's isolated baseline checkout and run against the same scenario semantics. Never regenerate baseline from candidate behavior.

Output: exercised harness bootstrap and restore support, deterministic fixture definitions, debug envelope, comparators and baseline manifest. Execute deliberately broken oracle controls and one actual-world command/save continuation. Fix task-caused focused failures before advancing; report final-matrix coverage separately.

### Stage 5 retained final acceptance

**Acceptance**

- Three identical scenario runs match command/world/AI digests.
- An injected actor and AI-state divergence reports the first tick and normalized field path.
- Baseline report records commit, contract versions, map/seed/side/faction/rules.
- CI gates work counts, not wall-clock timing.

## Stage 6

Model: Terra / xhigh. Implement the shared decision algorithm and budgets exactly before tuning.

1. Add persistent stance/goal/opening suspension state and domain utility proposals. Apply shared priority classes, score breakdown, commitment window and switch hysteresis. All chosen actions link back to a goal.
2. Implement demand ledger and lifecycle reconciliation before admitting new proposals. Track one physical commitment across accepted command, queue/site, and completion. Exclusive claims cover actors, source/tender/deposit services, resources, producer queues, cargo/landing, casts/effects and parent plans.
3. Arbitrate stable sorted candidates; accept only compatible claims within deterministic quotas. Missing prerequisites generate one prerequisite demand or a blocked reason. Expired/dead/cancelled effects release claims atomically.
4. Wire actual lobby difficulty/profile and deterministic supported archetype selection into creation, saves, replay metadata and debug; ordinary rules bonuses remain off.
5. Implement retry/backoff/cursor state and idle watchdog: every idle eligible worker/producer or stalled plan yields either a corrective intent or an explicit timed/terminal reason. The watchdog uses the same proposals/reservations and cannot bypass them.
6. Finish purpose/next-three-actions, utility comparison, demand reconciliation, rejections and budget debug views.
7. Implement the H1/H2/H4 supervisor now: causal progress age and workload-aware deadlines, provisional leases versus uncertain dispatched work, cycle detection/breaking, prerequisite bootstrap, and fair service lanes. Stage 12 extends this foundation rather than introducing stuck detection for the first time. Run H-01–05 and H-11–15 focused cases before macro depends on it.

Output: purpose-driven brain with traceable ownership and no per-tick personality reset. Author numeric ledger examples and permutation/conflict/priority tests from shared decisions.

### Stage 6 retained final acceptance

**Acceptance**

- Conflicting intents have exactly one reproducible winner and explained losers.
- Resources/actors/producers cannot be double-reserved.
- Easy, normal, and hard produce documented reproducible differences.
- All difficulties retain identical visibility and rules by default.
- Any enabled rules bonus appears in configuration, trace, replay/result metadata, and UI.
