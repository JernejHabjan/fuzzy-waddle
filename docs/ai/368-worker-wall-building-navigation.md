# #368 - Worker Not Always Navigating to Next Wall to Build

## Root Cause

1. `AssignNextBuildOrder()` finds closest construction site by geometric distance only - does not verify if a valid path exists
2. Completed walls become solid obstacles in the navigation grid
3. Pathfinding radius (6 tiles default) is much smaller than construction seek range (30 tiles)
4. No fallback behavior when pathfinding fails - worker enters stuck state

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/client/src/app/probable-waffle/game/entity/components/construction/builder-component.ts` | `getClosestConstructionSite()` - finds nearest build target |
| `apps/client/src/app/probable-waffle/game/prefabs/ai-agents/player-pawn-ai-controller.agent.ts` | `AssignNextBuildOrder()` - assigns next build order |
| `apps/client/src/app/probable-waffle/game/prefabs/ai-agents/player-pawn-ai-controller.agent.interface.ts` | Interface for agent methods |
| `apps/client/src/app/probable-waffle/game/library/distance-helper.ts` | `getTileDistanceBetweenGameObjectsNavigation()` - async navigation distance |
| `apps/client/src/app/probable-waffle/game/world/services/navigation.service.ts` | Pathfinding and walkable tile detection |
| `apps/client/src/app/probable-waffle/game/entity/systems/movement.system.ts` | Movement and path following |
| `apps/client/src/app/probable-waffle/game/prefabs/ai-agents/player-pawn-ai-controller.mdsl.ts` | AI behavior tree for Build action |

---

## Implementation Plan

### Phase 1: Convert `getClosestConstructionSite()` to Async with Navigation Distance

- [ ] 1.1 Make `getClosestConstructionSite()` async in `builder-component.ts`
- [ ] 1.2 Use `DistanceHelper.getTileDistanceBetweenGameObjectsNavigation()` to get actual navigation distance
- [ ] 1.3 Filter out unreachable sites (where navigation distance returns `null`)
- [ ] 1.4 Find closest reachable site by navigation distance (not geometric distance)

### Phase 2: Update `AssignNextBuildOrder()` to Handle Async

- [ ] 2.1 Update `AssignNextBuildOrder()` in `player-pawn-ai-controller.agent.ts` to be async
- [ ] 2.2 Update interface in `player-pawn-ai-controller.agent.interface.ts` to reflect async method
- [ ] 2.3 Update any callers of `AssignNextBuildOrder()` to await the result

---

## Code Changes

### `builder-component.ts` - Make `getClosestConstructionSite()` async

```typescript
// builder-component.ts - getClosestConstructionSite()
// Change from sync to async, use navigation distance

async getClosestConstructionSite(range: number): Promise<Phaser.GameObjects.GameObject | null> {
  const availableConstructionSites = this.getAvailableConstructionSites(range);
  if (availableConstructionSites.length === 0) return null;

  // Get navigation distances for all sites (filters out unreachable ones)
  const sitesWithDistance: { site: Phaser.GameObjects.GameObject; distance: number }[] = [];

  for (const site of availableConstructionSites) {
    const navDistance = await DistanceHelper.getTileDistanceBetweenGameObjectsNavigation(
      this.gameObject,
      site
    );
    // Only include reachable sites (navDistance !== null)
    if (navDistance !== null) {
      sitesWithDistance.push({ site, distance: navDistance });
    }
  }

  if (sitesWithDistance.length === 0) return null;

  // Find closest by navigation distance
  const closest = sitesWithDistance.reduce((prev, curr) =>
    prev.distance < curr.distance ? prev : curr
  );

  return closest.site;
}
```

### `player-pawn-ai-controller.agent.ts` - Make `AssignNextBuildOrder()` async

```typescript
// player-pawn-ai-controller.agent.ts - AssignNextBuildOrder()

async AssignNextBuildOrder(): Promise<State> {
  const builderComponent = getActorComponent(this.gameObject, BuilderComponent);
  if (!builderComponent) return State.FAILED;

  const range = builderComponent.getConstructionSeekRange();
  const target = await builderComponent.getClosestConstructionSite(range);

  if (!target) return State.FAILED;

  this.blackboard.addOrder(new OrderData(OrderType.Build, { targetGameObject: target }));
  return State.SUCCEEDED;
}
```

### `player-pawn-ai-controller.agent.interface.ts` - Update interface

```typescript
// Update method signature to async
AssignNextBuildOrder(): Promise<State>;
```
