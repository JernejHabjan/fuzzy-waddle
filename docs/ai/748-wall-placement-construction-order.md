# Issue 748: reliable wall construction ordering

## Status

- [x] Traced the reported failure path by static inspection.
- [x] Identified the placement, order, targeting, and completion authorities.
- [ ] Confirm the behavior decisions below.
- [ ] Implement the staged fix.
- [ ] Run automated checks and the manual wall-placement playtest.

## Scope

Fix drag-placed wall construction so selected builders do not start at the last
spawned segment, always choose the nearest reachable eligible construction
site, and continue until every reachable site in seek range is finished.

The change should remain in the Probable Waffle Phaser construction flow. It
must not alter wall cost, build duration, placement geometry, or multiplayer
authority.

## Current failure path

1. `BuildingCursor.placeBuildings` upgrades every preview wall into a
   construction site.
2. `BuildingCursor.spawnConstructionSite` dispatches a non-queued
   `ACTOR_ACTION` for all selected builders once per wall.
3. `ActionSystem.executeAction` handles each command with
   `overrideOrderQueueAndActiveOrder`, so the final wall dispatch replaces all
   earlier wall orders.
4. After construction starts, `BuilderComponent.getClosestConstructionSite`
   scans `scene.children.list`, filters candidates, awaits navigation distances,
   and chooses the shortest result. Equal distances fall back to generated
   actor IDs, which do not express spatial or placement order.
5. Candidate eligibility is not revalidated after asynchronous pathfinding.
   If another builder claims or finishes the chosen site, the build behavior's
   `CanAssignBuilder` failure stops the order instead of selecting another site.
   A poor hop can also leave remaining segments outside the ten-tile seek
   radius, ending the chain early.

## Recommended behavior decisions

### 1. Definition of “nearest”

**Recommendation:** rank eligible sites by reachable navigation distance, then
geometric distance, then stable tile coordinates, and use actor ID only as a
final deterministic fallback.

This selects the site that requires the least actual movement while making
equal-distance choices stable and spatially meaningful.

**Deferral impact:** target order can continue to appear random when several
wall segments have equal path lengths.

Reply with `Accept recommendation`, `Use: <distance/tie-break rule>`, or
`Defer`.

### 2. Construction-site search scope

**Recommendation:** preserve the existing behavior of considering every
eligible friendly construction site within the builder's seek range, rather
than limiting continuation to the most recently placed wall batch.

This fixes wall placement without adding transient batch identity to commands,
snapshots, or saves. The nearest-site rule still makes contiguous walls the
natural next target.

**Deferral impact:** introducing batch-only behavior later would require a
separate command/persistence design and could change how builders finish nearby
mixed building queues.

Reply with `Accept recommendation`, `Use: recent placement batch only`, or
`Defer`.

### 3. Candidate invalidation during movement or pathfinding

**Recommendation:** when a selected site becomes full, finished, destroyed, or
unreachable, immediately retry the nearest-site selection before allowing the
builder to become idle.

This treats concurrent builder assignment as a recoverable scheduling change,
not the end of the construction chain.

**Deferral impact:** multiple builders can still race for one wall and strand
unfinished segments.

Reply with `Accept recommendation`, `Use: <alternative>`, or `Defer`.

## Implementation plan

### Stage 1: centralize eligible-site selection

- [ ] Add an indexed construction-site query to `ActorIndexSystem`, or use its
  owned-actor index through a focused construction selector, so builders do not
  scan all scene children.
- [ ] Move candidate filtering and ranking behind one documented
  `BuilderComponent` authority.
- [ ] Filter by active state, owner, unfinished state, assignment capacity,
  current assignment, geometric seek range, and navigation reachability.
- [ ] Revalidate candidates after asynchronous distance calculation and before
  returning a target.
- [ ] Apply the approved stable distance and tie-break ordering.
- [ ] Preserve multiplayer determinism by deriving choices only from logical
  transforms, navigation results, simulation-visible actor state, and stable
  identifiers.

### Stage 2: issue one intentional initial build order

- [ ] Make `BuildingCursor.placeBuildings` collect all committed construction
  sites before issuing builder orders.
- [ ] Remove the per-wall non-queued command overwrite behavior from
  `spawnConstructionSite`.
- [ ] Select the nearest eligible newly placed site for each selected builder
  with deterministic capacity-aware reservation, then dispatch one initial
  order per builder.
- [ ] Keep single-building placement and shift-placement behavior unchanged.
- [ ] Keep command-bus ownership validation and multiplayer relay as the command
  authority; do not directly mutate builder blackboards from the cursor.

### Stage 3: make continuation self-healing

- [ ] Update `AssignNextBuildOrder` and the build behavior-tree branches so a
  stale, claimed, finished, destroyed, or unreachable target triggers another
  eligible-site lookup.
- [ ] Prevent duplicate queued build orders while a builder remains assigned to
  the current site.
- [ ] Leave the builder idle only when no reachable eligible site remains.
- [ ] Keep construction-site and builder assignment arrays consistent when an
  order is replaced, a site completes, or the actor is destroyed.
- [ ] Document the asynchronous revalidation invariant next to the selector and
  retry path.

### Stage 4: regression coverage and validation

- [ ] Add focused unit tests for candidate filtering, navigation-distance
  ordering, stable ties, and post-pathfinding invalidation.
- [ ] Add order-flow coverage proving a drag placement does not overwrite the
  initial target with the last spawned wall.
- [ ] Add continuation coverage for a target claimed by another builder and for
  an unreachable target followed by a reachable one.
- [ ] Run `NX_DAEMON=false pnpm nx test probable-waffle-phaser` with a focused
  test filter first, then the owning suite if the filter discovers no tests.
- [ ] Run `NX_DAEMON=false pnpm nx lint probable-waffle-phaser`.
- [ ] Run the manual playtest below in single-player and one multiplayer match.

## Manual playtest

1. Select one worker and drag-place straight walls in both drag directions.
   Confirm the worker starts at the nearest reachable segment, not the final
   spawned segment, and finishes the contiguous line.
2. Drag-place an L-shaped wall like the issue screenshot. Confirm each next
   segment is the nearest reachable eligible site and no interior gaps remain.
3. Repeat with multiple selected workers. Confirm they distribute across
   available segments, recover when another worker claims a candidate, and all
   reachable walls finish.
4. Include an unreachable segment and a segment destroyed during pathfinding.
   Confirm the worker skips invalid targets and continues to a reachable site.
5. Place a non-wall building near the wall chain. Confirm the approved
   construction-site search scope and nearest ordering are respected.
6. Repeat after save/restore or multiplayer snapshot recovery. Confirm restored
   assignments do not duplicate orders or stall the chain.

## Acceptance criteria

- [ ] A selected builder is not ordered to the last drag-spawned wall merely
  because it was spawned last.
- [ ] Initial and subsequent targets use the approved nearest reachable-site
  ordering with stable tie breaks.
- [ ] Builders continue after a target becomes invalid and finish every
  reachable eligible construction site within the existing seek behavior.
- [ ] Multiple builders do not become idle solely because they raced for the
  same site.
- [ ] Single placement, shift placement, resource payment, wall topology, save
  data, and multiplayer command authority remain unchanged.
- [ ] Focused tests, the owning Phaser test target, lint, and the manual
  playtests pass, or any unrelated baseline failure is recorded with evidence.

## Out of scope

- Changing wall placement geometry, topology sprites, costs, build time, or the
  ten-tile construction seek range.
- Adding persistent wall-batch identity or a general construction scheduler.
- Refactoring unrelated pawn AI orders or navigation caching.

## Continuation prompt

> Implement issue #748 from `docs/ai/748-wall-placement-construction-order.md`.
> Treat reviewer replies under “Recommended behavior decisions” as
> authoritative, complete Stages 1–4, run the listed validation, and open or
> update the focused draft PR without merging it.
