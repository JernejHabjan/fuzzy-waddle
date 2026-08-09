# Flying-unit destination formation decision

Closes #746.

## Observed cause

`MovementSystem.getTileVec3ByDynamicFlocking` returns the original target unchanged for an actor with `FlyingComponent`. This deliberately avoids ground-only path/occupancy constraints, but it also gives every selected flying unit the exact same destination tile.

Removing that guard would be unsafe: the current flocking generator is constrained by ground navigation and ground-height occupancy, so it can reject valid air destinations such as water.

## Decision required

Choose the intended air-unit formation rule:

1. **Accept recommendation — nearby 2D formation.** Deterministically sort selected flyers by actor ID and allocate unique nearby map tiles around the commanded target, using an air-specific reservation set. Flyers do not stack solely by altitude.
2. **Use: <altitude/stacking rule>.** Specify whether multiple flyers may intentionally share a horizontal tile and how their order/height is defined.
3. **Defer.** Preserve current shared-target behavior until the movement model is decided.

The recommendation produces predictable commands and avoids changing ground movement or terrain validity semantics.

## Implementation after approval

1. Add a flight-specific deterministic destination allocator, separate from ground navigation.
2. Keep target selection, command protocol, and ground flocking unchanged.
3. Add a focused regression test that a same-flight multi-selection receives distinct stable destinations near the target.
4. Manually command flyers over land and water, in repeated/reversed selection orders, and near map edges.

## Continuation prompt

```text
Continue #746 with the approved formation rule: <paste reviewer response>. Implement only the air-specific deterministic destination allocation, add its regression test, and validate commands over land, water, edges, and repeated selection. Do not route flying units through ground navigation or alter ground flocking.
```
