# Debug AI panel — required part of every stage

[Packet 12](12-debug-workbench.md) is part of this contract: recorded why-not explanations, causal filters/timelines, bounded privacy-aware reproduction bundles and isolated replay/step/breakpoint/diff tools. Live panels remain read-only; offline controls use Stage 5's test bridge. “Not recorded” and “not evaluated” are honest states, not reasons to rerun a planner in the UI. Include versioned difficulty/cadence, mission caps, total army demand, scout questions and timing-window provenance from [packet 11](11-classic-rts-and-difficulty.md). The committed overview.html is explanatory only and does not satisfy any in-game panel acceptance.

The player/developer must be able to answer: **What is this AI trying to do, why, what is stopping it, and what will it do next?** Implement this in the existing `AiControllerDebugPanel`/`AiControllerDebugLabel` entry point. It currently shows a strategy string and counts, has category/player selection, truncates telemetry to 12 lines, and passes `performance.now()` into some strategy time helpers. Replace those data dependencies with a read-only simulation snapshot. UI time is allowed only for refresh throttling.

Read [the runbook](00-start-here.md) for execution timing. Implement this incrementally with Stages 1–14; run focused projection/cleanup regressions alongside changes, and the extensive UI matrix in Stage 15. Do not defer the actual panel implementation to testing.

## Projection contract and ownership

Add pure `AiDebugSnapshotV1` and `projectAiDebugSnapshot` under gameplay `player/ai-controller/debug/`. Required fields: schema/version, player/faction/profile/archetype, tick/generation, decision age, stance/goal/commitment, top three reasons and utility breakdowns, current opening step, next steps, owned plans, demand rows, reservations/outcomes, knowledge summaries, domain coverage, metrics/work quotas, unsupported capabilities, and bounded trace history references.

The snapshot is produced from the **same** committed brain/observation/arbitration data that drove decisions. Neither the UI nor its projection may invoke a planner, pathfinder, RNG, blackboard mutator, world scan, or goal query with side effects. `PlayerAiController` exposes the latest immutable snapshot; a presentation adapter formats it. Stable IDs link goal -> demand -> intent -> command outcome -> resulting actor/queue item. All durations derive from snapshot tick, never from `performance.now()` minus simulation deadlines.

Attach the authoritative world hash only as permitted host-side diagnostic metadata after the pure projection. It must not become brain input or part of the AI decision digest: two worlds with identical permitted observations but different hidden enemies must still make identical decisions. Keep diagnostic-only display state out of persisted decision state.

Data collection required for behavior is always on; expensive UI strings and overlays are lazy while debug is hidden. Publish once per decision, render at most every 250 ms, retain bounded ring buffers, and reuse/destroy Phaser objects as rows change. Unsubscribe on player switch, hide, scene shutdown, and controller replacement. A missing/recovering controller shows a clear state instead of throwing or stale data.

## Required panels and fields

| Panel | Exact information |
| --- | --- |
| Overview | Stance, goal, objective/base, elapsed commitment, active threat, opening progress, composition plan, next three meaningful actions, main blocking reason and recovery step |
| Build order | Stable plan/step IDs; completed/current/blocked/skipped/fallback steps; prerequisite chain; desired/existing/queued/constructing/in-flight counts; budget/site/builder; next transition condition |
| Production/composition | Role targets versus ready/queued/accepted strength/counts; selected unit and deficit; observed counter evidence/age; producer/shared queue contents; throughput target/deadline and predicted completion with/without extra capacity; transition/redundancy evidence; research opportunity cost; supply forecast; rejected alternatives |
| Economy/labor | Per-resource stockpile/reserved/unspent/available and delivered income; near-term and strategic demand horizons; carried resources; workers by task/base; source/tender/deposit capacity/congestion; marginal walking-time savings for additional deposits; crop readiness; next drop-off/farm/expansion reason |
| Intelligence/environment | Visible and last-seen contacts clearly distinguished; confidence/age; explored frontiers; static/known access components; observed threats; unknown/unreachable routes; current information policy |
| Squads/support | Squad/task-force ID, role/domain, members, state/objective/rally/retreat, local comparison, target-switch reason; heal/cast/autocast owner, effect claims, zone risk, temporary support expiry |
| Transport | Plan phase, passengers/required threshold/seats/transport/escort, pickup and landing slots, route, deadline, missing boarders, cargo risk, reroute/cancel cause |
| Bases/fortifications | Base identity, resource life/saturation, proposed footprint/access checks; wall graph nodes, budget, construction order, stairs/posts/opening/gate slot, tower coverage and breach response |
| Decisions/recovery | Accepted/rejected intents and score; last useful progress/expected milestone; causal blocked age and absolute deadline; dependency/cycle and lease owner; lane service delay; command uncertainty/epoch/reconciliation state; retry ladder and chosen effective recovery |
| Runtime/limits | Decision generation/tick, profile quotas/consumption/cursors, ring size, authoritative/AI hashes, schema versions, feature support and saved/recovered state |

Add a compact **Progress health** summary following [H1–H9](09-progress-and-hardening.md): last delivered income, latest useful production, active mission/last objective effect, longest unresolved causal blocker, reservation exposure/cycle, lane service delay, command authority health and next effective recovery. Drill down to the independent progress measurement and deadline; never present repeated “waiting” messages as healthy execution. Include status bands for healthy, legitimately waiting, recovering, failed optional goal, technical fault and actual strategic defeat. A technical incident is not a surrender reason.

Use collapsible categories, bounded scroll/pagination, and explicit empty states. Long rows cannot disappear because of `maxLines: 12`. Retain player/category navigation and keyboard/pointer accessibility appropriate to existing Phaser UI. Show Overview immediately after choosing an AI. Preserve `.scene` compatibility and user-code regions; author generated layout changes via the repository's Phaser editor workflow where required, without deleting existing comments.

## Readable explanations — no invented narrative

Use deterministic templates populated from reason codes and facts, not an LLM or a second heuristic explanation engine:

```text
DEFEND — protecting Main from 6 observed attackers; opening step 4 suspended.
NEXT — complete Olival, train 2 ranged units, regroup Squad 2 at East exit.
HOUSING — desired 1; constructing 1; no new order: commitment_in_flight.
PRODUCTION — desired 3 AnkGuard; ready 1, constructing 1, unmet 1; transition deadline needs another lane.
WOOD — second WorkMill serves East forest; projected round-trip saving 35%; West deposit remains useful.
ARMY — frontline 4/6, ranged 3/4, anti-air 0/2; flyers seen 8 seconds ago.
TRANSPORT — boarding 3/4; waiting for Worker 17; alternate shore reserved.
BLOCKED — AnkGuard site occupied; retry 2/4 in 4 seconds, alternate site C.
STALLED — wood income unchanged beyond expected delivery; cause 42 age 38s; release optional upgrade reservation, reopen supply route.
MISSION — East raid reached economy; objective effect confirmed; regroup deadline 12s, reinforcements using South route.
```

Each displayed reason must identify the input tick and IDs behind it. “Unknown,” “stale,” “unsupported,” “waiting for outcome,” and “not yet implemented” are distinct. Once Stage 14 is implemented, required sections must contain live data/valid empty states, never permanent placeholder values. Do not show a current enemy ID for a remembered hidden contact.

## Map overlays and drilldown

Implement toggles for base bounds/egress, planned/reserved construction footprints, wall/stair/post topology, visible threat regions, scout frontiers/last-seen uncertainty, squad objectives/rally/retreat paths, and transport pickup/landing/cargo routes. Use current bounded planning output; an overlay must not trigger extra navigation work. Label the legend and selected plan ID, distinguish proposal/accepted/failed/last-seen state, and clip to map bounds.

Clicking a debug row may focus the camera or highlight a permitted actor/location; it must not issue game orders. Add freeze-view (snapshot only, not game pause), step through retained decision snapshots, and export selected snapshot plus bounded trace/scenario metadata as JSON. Host/replay debug information is local developer data: respect existing access controls and don't add hidden enemy data to ordinary player network payloads. A non-host without a permitted debug feed shows “host AI diagnostics unavailable”; any future feed requires explicit authorization/redaction and cannot alter gameplay command authority.

## Stage ownership

- 1–2: reason envelope, snapshot schema/projector, Overview skeleton and typed not-ready sections.
- 3–6: command outcome drilldown, observation policy/age, purpose/utility, budgets, reservations, and history export.
- 7: build-order and composition demand panels, supply and shared queue timelines, farming/deposits.
- 8–9: access/transport/intelligence/threat/neutral/allied objective panels and basic overlays.
- 10–12: placement/fortification/breach/recovery overlays and worker service diagnostics.
- 13–14: squad/engagement/support/spell details, counter evidence, research/archetype transitions, finish all required empty/error states and navigation.
- 15: visual review at 1280×720 and 1920×1080, long-data overflow, player/category switching, show/hide, scene reload, save/load/host replacement, export, no listener leaks, and matching command/AI hashes with debug hidden versus shown/frozen/exporting.

The final author must trace at least these user complaints through the panel: repeated fulfilled housing/producer request suppressed, justified second/third producer admitted, useful same-type units and separate local deposits, purposeful mixed army and observed anti-air adjustment, proportional home-raid response while the main front continues, blocked opening recovery, island transport, wall breach response, and spell/heal choice. Values in example explanations are illustrative, not fixed game thresholds. A count-only display does not satisfy this requirement.
