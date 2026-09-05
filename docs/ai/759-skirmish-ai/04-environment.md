# Stages 10–12 — bases, fortifications, and recovery

Extend [packet 12's recorded overlays](12-debug-workbench.md) with actual placement/route clearance, marginal tower coverage, protected approaches and construction recovery causes in their owning stages. Stage 12 must also run D-04: reduced Easy breadth preserves productive recovery and useful duplicate capacity. Unsupported future gates/air containers remain explicit capabilities, not assumed mechanics.

Read [runbook](00-start-here.md), [shared decisions](01-shared-decisions.md), [debug contract](06-debug-panel.md), and the research sections for bases/fortification/component coverage. Dependencies: 0–9 stage_checked. Apply [H1–H9](09-progress-and-hardening.md), run the owning [focused gate](10-integration-and-adversarial-tests.md), and rerun complete final acceptance in Stage 15.

## Stage 10

Model: Terra / high. Source anchors: BasePlanner/MapAnalyzer, NavigationService/ActorIndexSystem, footprint/placement/construction helpers, resource/drop-off definitions, main-building definitions.

1. Replace averaged actor “base center” with stable base ID anchored to the main structure or approved expansion site. Attach economy/buildings via access region and bounded distance; never move base identity with a scout/army. Maintain main/expansion/lost/evacuating state.
2. Track resource life and delivered throughput, source/drop-off/tender saturation, production exits, rally/retreat corridors, adjacent shores, air exposure, and reserved development space. Construction candidates may only use authoritative legal footprint and placement APIs. The unused PlacementRestrictionComponent stub is not proof of valid placement.
3. Candidate generation: canonical rings around base anchor/site, terrain/resource-specific anchors, bounded shortlist. Reject footprint overlap, inappropriate terrain, insufficient room, blocked resource access, and conflicting reservation. Include hypothetical full footprint in connectivity checks for worker/drop-off, spawn/rally, stairs/outside and transport service routes.
4. Score remaining candidates by travel gain, defense, economic function and future room; stable tile/rotation/type tie-break. Reserve site and builder only after arbitration. Revalidate at application and retain failure memory for rejected sites.
5. Expansion trigger: estimated accessible resource life <2,400 ticks (120 s) or useful safe worker capacity saturated for 600 ticks, with survival/supply funded and projected benefit exceeding transport/build cost. These initial thresholds are configurable, not knowledge of unrevealed resources.
6. Create one base-expansion plan per player initially: proposed -> reserve -> transport/establish -> active -> evacuating/lost. A connected alternative is preferred when utility is close; island plan needs complete transport, builder seat, protection, unload/site and reinforcement route. Do not subtract construction cost until shared application.
7. Finish economic infrastructure placement and labor caps: renewable Field walkability, Granary/WorkMill/MiningCamp throughput, zero-builder automatic sites, repairer limits, consumed-builder handling from actual definitions. Reserve central production/defense footprints and movement corridors before placing low-priority fields/housing. Generate aligned, compact field rows from actual footprint/service access, favoring safe outer economic zones where they preserve central options without excessive walking or exposure. Outer placement is a preference, not a hard rule when the perimeter is unsafe. Multiple local deposits are legal when their marginal travel/congestion benefit justifies the cost.
8. Debug: base identity/lifecycle, candidate rankings/rejections, reserved footprint, egress lanes, resource-life/expansion reason and transport dependency.
9. Apply H5/H7/H8: per-player exposure across bases, real actor clearance/spawn and service access, cumulative progress and valid cancellation semantics. Run multi-base budget/corridor/spawn smoke; never delete an existing building through a private AI shortcut to “unstick” a route.

Output: stable bases and legal justified construction. Author trapped-production, mineral/drop-off access, depleted resource, moving scout, island establishment, interrupted builder, overlapping footprints and multi-base ownership fixtures.

### Stage 10 retained final acceptance

- Friendly construction does not trap authored worker/production lanes.
- Rejected/blocked sites enter bounded cooldown and a legal alternate is selected.
- Expansion establishes on a safe connected candidate before main resources cause permanent idle.
- The island fixture transports a builder and protection, establishes the expansion, and retains a feasible reinforcement/evacuation route.
- Base identity does not move when an army/scout crosses the map.
- Placement candidates/path queries remain within profile budgets.

## Stage 11

Model: Sol / high. Source anchors: Wall/WatchTower/Stairs definitions/prefabs, StructureTopologyService, HeightNavigationGraphBuilder, height navigation and occupancy, construction commands.

1. Model a fortification as one persistent graph with base/protected assets, terrain anchors, nodes (wall/tower/stair/gate-slot), geometry/ports, interior/exterior connectivity, cost/length caps, desired defender posts, construction sequence and breach/recovery state. Reuse the research AiFortificationPlan contract and shared claim IDs.
2. Generate at most profile placement-quota candidates from short choke/front lines between verified terrain anchors. Initial maximum 16 wall nodes, 3 tower nodes and 2 stairs per plan; one active new plan per base. Reject a graph with no measurable approach narrowing/detour or justified protected value. Do not begin with a full ring algorithm.
3. Reserve budget only after survival/supply/worker floor. Initial discretionary fortification spend cap: 20% of unreserved value across its actual required resources, plus affordability per resource; do not fabricate a universal stone-only currency. Turtle may use 30% via explicit config. These are ceilings, not targets that must be spent.
4. Build graph from executable ports/footprints/elevation rules, not pixels or fixed offsets guessed per prefab. Test hypothetical **whole** layout: friendly workers, production exits, resources, outside access, protected-side stairs and every planned elevated defender post remain reachable. Incremental build order must also preserve those routes.
5. Tower score is marginal useful threat-lane coverage, eligible target domain, sight and reinforcement access minus overlap/cost. Add stairs from protected side. Reserve an intentional opening; until a gate prefab/control exists, never fill it with another segment. Future gate test definition uses same slot and command/topology invalidation.
6. Construct useful connected prefixes; maintain stable node keys through reserved/command/site/finished actor state. Only absent still-needed nodes generate demands. Duplicate callback or destroyed segment cannot restart the entire graph.
7. On breach classify known opening and risk, pull defenders from disconnected components, reinforce through reachable route, repair/rebuild bounded missing nodes or abandon. Unoccupied impossible posts remain explicit; never teleport defenders. Walls do not stop air or replace actual anti-air/naval coverage.
8. Debug: graph/node identities and lifecycle, intended protected region, complete and incremental connectivity, budget remaining, tower marginal coverage, stair/defender routes, opening slot and breach reason.
9. Run H-27/28: test actual hostile paths through the deliberate opening and marginal defended exposure. An open wall is not an enemy-only gate. Count previous prefixes and still-useful finished nodes toward cumulative budgets so new plan IDs cannot evade limits.

Output: connected usable defensive layout with purposeful towers/defenders; author full/incremental connectivity, duplicate node, no-gate opening, destroyed stairs/segment, harmful shore obstruction and tower-domain coverage scenarios.

### Stage 11 retained final acceptance

- Equivalent map/threat inputs always produce the same bounded fortification graph and construction order.
- A turtle profile or sustained threat can complete a useful connected wall front, while an unjustified low-utility wall plan is rejected.
- Every occupied elevated component is reachable from the protected ground side through a legal stair/topology path.
- Towers add distinct approach coverage and do not repeat indefinitely; existing, planned, reserved, and under-construction nodes prevent duplicate intents.
- Anti-air and shore-defense coverage is credited only to towers/units whose weapons can hit that target domain, and the layout preserves transport staging/landing access.
- The completed hypothetical and runtime layout preserves worker/resource, production/rally, construction, retreat, and deliberate opening/gate routes.
- Destroying a segment creates one breach response and bounded repair/rebuild decision rather than a new duplicate fortification plan.
- With no gate prefab, the reserved opening remains usable and cannot be filled accidentally; a gate-capable test double can satisfy the same slot without redesigning the plan.

## Stage 12

Model: Terra / high. Source anchors: order outcomes, pawn blackboard/current queue, resource services, RepairManager/LogisticsManager, blockers/topology, existing recovery state.

1. Track per-order objective progress from logical distance/phase change and application outcomes. Use H1's 200-tick no-progress window after expected milestone evidence is due, plus a finite workload-derived phase deadline. Known stun/freeze and slow adjust estimates with observed evidence without erasing cumulative blocked age. Queued work waiting behind acknowledged predecessors is not a failed order.
2. Escalate: bounded equivalent retry -> alternate reachable point/site/source -> reassign actor/producer -> cancel invalid friendly plan -> clear observed hostile blocker -> replace/fail strategic goal. Use shared backoff constants and stable failure keys; no automatic same-intent spam every decision.
3. Detect enemy proxy/wall blocking base egress from known topology and legal visibility. Select a compatible clearing squad and firing position. If blocker is unseen, investigate/access-scout its location; do not target an unseen ID.
4. Recover economic interruptions: source depletion/regrowth, drop-off loss, loaded-worker return, tender death, destroyed prerequisite, supply loss, automatic construction, unsafe worker routes. Return workers to eligible roles and reconcile all service reservations.
5. Repair/heal triage: critical last-building/economy/transport survival first, then valuable recoverable units/assets; cap worker diversion initially at min(2, floor(workers/4)), except immediate last-building survival. Reserve repairer/patient capacity and restore economic assignments when completed/unsafe.
6. Add fallback rally/retreat/landing and stranded passenger recovery coordinated with existing transport/squad owner. A failed optional plan must free resources for another useful purpose.
7. Extend the Stage 6 progress supervisor across all domains: detect H1 overdue useful progress, not just absent commands; enforce cumulative causal deadlines, dependency-cycle resolution and bounded actor reassignment. A repeated blocker, new plan ID or renewed deadline cannot count as recovery. After bounded failure choose a useful alternative or independently justified strategic/technical outcome, never indefinite explained inactivity.
8. Debug: progress measurement, cause, retries/backoff, chosen alternate, released claims, worker triage cost and remaining economic floor.
9. Connect every domain to the same H1 causal recovery episode, H2 dependency resolver and H3 authority incident policy. Exercise combined disruption and false-progress cases without resetting the world/brain. A technical fault cannot be presented as ordinary strategic defeat; terminal optional failure must return assets to useful duty.

Output: failure-resistant economy/army/controller; author wall/proxy exploit, no-progress/stun distinction, source/producer/worker loss, blocked retreat/landing and repeated-command suppression fixtures.

### Stage 12 retained final acceptance

- The milestone proxy/wall fixture cannot leave the AI permanently inert.
- Observed hostile blockers are prioritized without using hidden IDs.
- Depleted/unreachable gather targets are replaced and idle workers recover.
- Repeated failures back off and transition state; they do not emit equivalent commands forever.
- No recovery teleports/deletes actors or bypasses validation.
