# 645 Movement Occupancy Congestion Notes

## Problem

- Large selected groups moving around big static objects could block their own recovery paths.
- Destination reservations were used both for final formation slot assignment and as dynamic movement blockers.
- In crowded chokepoints, those final-slot holds could make EasyStar see no temporary recovery route.
- `MovementSystem` then rejected with `No congestion recovery path found`, causing actors to stop instead of retrying.

## Fix

- Destination reservations remain exclusive for assigning final formation slots.
- Step reservations and current actor footprints remain movement blockers.
- Recovery, side-step, fallback, and formation path checks ignore destination reservations when building dynamic blocker overlays.
- Congestion recovery now waits and retries pathfinding while the actor is still active instead of rejecting on a transient no-path result.
- Each retry rebuilds the dynamic blocker snapshot so released steps are visible to the next path search.

## Invariant

- Static terrain and height graph edges decide where movement is valid.
- Current occupancy and active step reservations decide what is temporarily blocked.
- Destination reservations decide who owns the final slot, but they must not close traversal routes before units arrive.
