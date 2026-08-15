# Flying-unit formation implementation plan

Closes #746.

## Approved behavior

Flying units must spread into a meaningful, stable formation around both player-commanded destinations and production rally destinations. They must not all converge on the same horizontal point. Flight remains independent of ground navigation, so water, cliffs, walls, and other ground-only restrictions do not invalidate an air destination.

## Current movement paths

- A multi-unit `MOVE` command is delivered independently to every selected actor. `MovementSystem.getTileVec3ByDynamicFlocking` sorts actor IDs and assigns ground units a reachable nearby tile, but immediately returns the shared target for `FlyingComponent` actors.
- Flying movement then travels directly to that target without pathfinding.
- A newly produced unit follows a rally point through `ProductionComponent` and `ActionSystem`. This path carries only the new actor, so selection-size-based flocking cannot spread a stream of produced flyers.
- `MovementOccupancyService` intentionally excludes flyers from ground occupancy. Reusing it unchanged would mix incompatible terrain and height rules.

The existing ground formation ordering is useful, but its candidate discovery and validation are not: connected navigable tiles, terrain checks, ground height, pathfinding, and ground footprints would reject valid air positions.

## Recommended design

Introduce a small deterministic air-destination allocator owned by the movement layer. It should share only the formation geometry and stable ordering concepts with ground flocking.

### Formation geometry

- Generate concentric square/spiral rings around the requested tile, starting at the target and expanding one tile at a time.
- Sort a simultaneous selection by actor ID and map each flyer to one unique candidate. This makes every client derive the same assignment regardless of scene child order or selection order.
- Preserve the commanded `z`/flight layer. Clamp horizontal coordinates to map bounds, deduplicate candidates after clamping, and continue expanding until every flyer has a slot or a documented safety radius is exhausted.
- Do not call ground navigability, connected-tile, or ground-height APIs. Air blockers can be added later through a separate typed policy if the game introduces no-fly volumes.
- Mixed ground/air selections form independently around the same anchor: ground actors use the existing ground allocator; flyers use the air allocator and may horizontally overlap ground actors.

### Reservation and rally behavior

- Add air-only destination reservations keyed by actor ID and flight layer. Release a reservation on replacement commands, stop/death, and destination arrival, matching the lifecycle already used for ground destinations.
- For a simultaneous move, reservations are deterministic corroboration rather than the source of ordering: the sorted selection-to-slot mapping decides the result.
- For sequential production rally movement, choose the first spiral candidate not reserved by another active flyer on the same layer. This lets newly spawned flyers accumulate around the rally point instead of selecting its center repeatedly.
- Keep the rally target itself unchanged. Formation is a movement destination concern, so moving a rally marker or targeting an actor automatically recalculates around its current resolved tile.
- When a rally target is an actor, resolve its current tile immediately before allocating; existing chase/interaction behavior stays out of scope.

## Implementation stages

1. Extract a pure deterministic formation-candidate generator with stable tie-breaking, bounds clamping, and no Phaser dependency. Use it from the new air path; only reuse it for ground movement if doing so leaves ground behavior byte-for-byte equivalent.
2. Add an air-reservation authority beside, or as a clearly separate namespace within, `MovementOccupancyService`. Document layer semantics and cleanup ownership.
3. Route multi-actor `MOVE` commands for `FlyingComponent` actors through the allocator while retaining direct flight movement.
4. Route produced flyers moving to a location rally point through the same allocator in sequential-reservation mode. Do not change spawn placement or ground/water production behavior.
5. Add focused unit tests and a small integration-level command/rally test. Keep command payloads unchanged unless a test proves per-actor destinations cannot remain deterministic across clients; if that occurs, stop and propose a protocol change rather than silently widening scope.

## Acceptance criteria

- Two or more selected flyers receive distinct horizontal destinations near the target.
- Reversing selection input order produces the same actor-to-slot mapping.
- Reissuing the same move command is stable and does not reshuffle units unnecessarily.
- Flyers can form over water and non-navigable ground.
- Candidates remain in map bounds near every edge and corner.
- Mixed ground/air selections preserve existing ground formation behavior.
- Flyers produced one after another spread around a location rally point; released or destroyed flyers do not leave permanent reservations.
- Movement remains deterministic in lockstep/replay tests.

## Verification

- Unit-test formation generation for 1, 2, dense groups, reversed IDs, edges, duplicate-after-clamp candidates, and multiple flight layers.
- Test reservation replacement, arrival, stop, death, and stale-actor cleanup.
- Test one simultaneous flying selection and sequential production rally allocation.
- Run focused Phaser tests, Phaser Editor validation, lint/type checks for affected projects, and deterministic replay/command checks.
- Manually command flyers over land, water, cliffs, edges, mixed selections, repeated targets, and rally points.

## Out of scope

- Ground formation redesign, collision avoidance while units are in transit, altitude simulation, no-fly volumes, attack surrounds, and larger building/tower capacity rules.

## Continuation prompt

```text
Implement #746 from docs/ai/746-flying-unit-formation.md. The nearby deterministic air-formation policy is approved for both player move targets and sequential production rally targets. Preserve direct flight over all terrain and existing ground flocking. Implement the pure candidate generator, air reservation lifecycle, command and rally integrations, focused tests, and manual land/water/edge/rally checks. Stop and report before changing the command protocol. Open a separate draft implementation PR.
```
