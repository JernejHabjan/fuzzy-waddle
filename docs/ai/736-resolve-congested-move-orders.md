# Issue 736: resolve congested move orders

## Status

- [x] Classified as a research/planning change; runtime implementation is deferred to a follow-up stage.
- [x] Reproduced the control-flow failure through static inspection.
- [x] Identified the smallest owning behavior boundary and affected tests.
- [ ] Implement the approved behavior-tree change.
- [ ] Add and run the focused regression test.
- [ ] Manually playtest a group move onto a full elevated structure.

## Scope

When more units are ordered onto a navigable tower than its currently available tiles can hold,
units that cannot claim the requested destination should complete the move at the closest reachable
fallback selected by congestion recovery. They must stop retrying the original destination once that
fallback route completes.

Tower footprint and capacity are explicitly out of scope and remain tracked by
[#737](https://github.com/JernejHabjan/fuzzy-waddle/issues/737).

## Research findings

Issue [#736](https://github.com/JernejHabjan/fuzzy-waddle/issues/736) follows the dynamic movement
occupancy and elevated-navigation work from [#387](https://github.com/JernejHabjan/fuzzy-waddle/issues/387)
and [PR #663](https://github.com/JernejHabjan/fuzzy-waddle/pull/663).

The current recovery flow in `MovementSystem` already does the expensive part correctly:

1. A blocked step waits for transient reservations.
2. It attempts a local side step.
3. It repaths around dynamic blockers.
4. It selects and reserves a reachable same-height fallback near the requested destination.
5. Reaching that fallback resolves `moveToLocationByFollowingStaticPath` with `true`.

The unresolved order is caused by the `Move` branch in `player-pawn-ai-controller.mdsl.ts`.
`MoveToTargetOrLocation` is wrapped in `fail`, so its successful result is discarded. The next branch
only stops when `InRange("move")` reports distance zero from the original requested tile. A unit that
successfully reached a fallback is still outside that zero-radius check, so the behavior tree starts
the original move again on the next step.

The ownership boundary is therefore move-order completion, not path search or occupancy. Adding more
repath attempts, increasing the fallback radius, or changing tower capacity would leave the loop intact.

## Implementation plan

### Stage 1: honor successful move completion

- [ ] Update the `Move` behavior-tree branch so a successful `MoveToTargetOrLocation` immediately runs
  `Stop` and clears the completed player order.
- [ ] Preserve retry behavior when movement returns `false`; the existing zero-radius `InRange` branch
  remains a defensive completion check for actors already at the requested destination.
- [ ] Keep congestion fallback selection, height-layer constraints, reservation ownership, and cleanup
  inside `MovementSystem` unchanged.

Expected control flow:

```text
move order
  -> movement succeeds at requested or accepted fallback tile
     -> stop and clear order
  -> movement fails because no route completed
     -> retain order and retry on a later behavior-tree step
```

### Stage 2: regression coverage

- [ ] Add a focused behavior-tree regression spec using the real `PlayerPawnAiControllerMdsl` with a
  controlled agent double.
- [ ] Prove that a successful `MoveToTargetOrLocation` calls `Stop` without requiring `InRange` to
  succeed. This represents the congestion fallback completion case.
- [ ] Prove that a failed movement result does not call `Stop`, preserving retry behavior.
- [ ] Prove that the existing already-in-range path still stops the order.
- [ ] Run the owning Probable Waffle Phaser test target with `NX_DAEMON=false`; a zero-test result is
  not acceptable validation.

### Stage 3: manual playtest

- [ ] On the elevated-navigation sandbox map, fill a watchtower and order a larger group onto it.
- [ ] Confirm available units occupy reachable tower tiles.
- [ ] Confirm excess units settle at their nearest reachable fallback positions and return to idle.
- [ ] Confirm the movement marker/order clears for every unit and no unit repeatedly recalculates the
  original tower path.
- [ ] Repeat a normal unobstructed group move on flat ground to check for completion regressions.

## Acceptance criteria

- [ ] A unit that completes congestion recovery at a fallback tile resolves its move order exactly once.
- [ ] A unit whose movement attempt completes successfully does not require distance zero from the
  originally requested tile before stopping.
- [ ] A movement attempt that finds no completed route remains retryable.
- [ ] Destination and step reservations are released through the existing movement cleanup path.
- [ ] No tower footprint, formation capacity, elevated graph, or multiplayer authority behavior changes.
- [ ] Automated regression coverage and the tower saturation playtest pass.

## Risks and follow-up

- The behavior-tree branch is shared by tile-target and object-target move orders. The regression test
  must cover both successful completion semantics and failed-route retry semantics before implementation.
- The manual tower-capacity limitation remains independent follow-up work in #737.

## Exact next action

Implement Stage 1 on this branch, add the Stage 2 regression spec, run the focused Phaser tests, then
perform the Stage 3 tower saturation playtest before marking the draft PR ready for review.
