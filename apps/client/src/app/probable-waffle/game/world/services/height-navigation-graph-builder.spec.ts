import { NavigableComponent } from "../../entity/components/movement/navigable-component";
import { NavigablePathDirection } from "../../entity/components/movement/navigable-path-direction";
import { getStairsNavigablePath, getStairsNavigablePorts, StairsType } from "../../prefabs/buildings/tivara/stairs/Stairs";
import { getWallNavigablePath, WallType } from "../../prefabs/buildings/tivara/wall/Wall";
import { getDynamicBlockedTileKeysForHeightGraph } from "./height-navigation-dynamic-blockers";
import { canConnectHeightNavigationPorts, HEIGHT_NAVIGATION_DIRECTIONS } from "./height-navigation-graph-builder";

describe("height navigation ports", () => {
  it("connects only when source exitHeight exactly matches target enterHeight", () => {
    expect(
      canConnectHeightNavigationPorts({ enterHeight: 64, exitHeight: 64 }, { enterHeight: 64, exitHeight: 0 })
    ).toBe(true);
    expect(
      canConnectHeightNavigationPorts({ enterHeight: 0, exitHeight: 96 }, { enterHeight: 64, exitHeight: 64 })
    ).toBe(false);
  });

  it("does not connect when either side has no directional port", () => {
    expect(canConnectHeightNavigationPorts(undefined, { enterHeight: 0, exitHeight: 0 })).toBe(false);
    expect(canConnectHeightNavigationPorts({ enterHeight: 0, exitHeight: 0 }, undefined)).toBe(false);
  });

  it("uses enterHeight for default directional ports", () => {
    const component = createNavigableComponent({ enterHeight: 64, exitHeight: 64 });
    expect(component.getDirectionPort(NavigablePathDirection.Top)).toEqual({ enterHeight: 64, exitHeight: 64 });
  });

  it("keeps standing height separate from the directional connection height", () => {
    const component = createNavigableComponent({ navigableHeight: 128, enterHeight: 64, exitHeight: 64 });
    const wallPort = { enterHeight: 64, exitHeight: 64 };
    const towerPort = component.getDirectionPort(NavigablePathDirection.Top);

    expect(component.getDestinationHeight()).toBe(128);
    expect(canConnectHeightNavigationPorts(wallPort, towerPort)).toBe(true);
    expect(canConnectHeightNavigationPorts(towerPort, wallPort)).toBe(true);
  });

  it("keeps deprecated acceptMinimumHeight as compatibility fallback", () => {
    const component = createNavigableComponent({ acceptMinimumHeight: 64, exitHeight: 64 });
    expect(component.getDirectionPort(NavigablePathDirection.Top)).toEqual({ enterHeight: 64, exitHeight: 64 });
  });

  it("returns no port for explicitly closed directions", () => {
    const component = createNavigableComponent({ enterHeight: 0, exitHeight: 0 });
    component.allowNavigablePath({ top: true, bottom: false });
    expect(component.getDirectionPort(NavigablePathDirection.Top)).toEqual({ enterHeight: 0, exitHeight: 0 });
    expect(component.getDirectionPort(NavigablePathDirection.Bottom)).toBeUndefined();
  });

  it.each(Object.values(WallType).filter((value): value is WallType => typeof value === "number"))(
    "keeps every wall type elevated-only for open directions: %s",
    (wallType) => {
      const component = createNavigableComponent({ navigableHeight: 42, enterHeight: 64, exitHeight: 64 });
      component.allowNavigablePath(getWallNavigablePath(wallType));

      for (const { direction } of HEIGHT_NAVIGATION_DIRECTIONS) {
        const port = component.getDirectionPort(direction);
        if (getWallNavigablePath(wallType)[direction]) {
          expect(port).toEqual({ enterHeight: 64, exitHeight: 64 });
          expect(canConnectHeightNavigationPorts({ enterHeight: 0, exitHeight: 0 }, port)).toBe(false);
        } else {
          expect(port).toBeUndefined();
        }
      }
    }
  );

  it("keeps bottom-left/bottom-right wall approachable only from the open upper sides", () => {
    expect(getWallNavigablePath(WallType.BottomLeftBottomRight)).toEqual({
      topRight: true,
      top: true,
      topLeft: true
    });
  });

  it.each(Object.values(StairsType).filter((value): value is StairsType => typeof value === "number"))(
    "matches every stair type low sides to ground and high side to elevated surfaces: %s",
    (stairsType) => {
      const component = createNavigableComponent({ navigableHeight: 24, enterHeight: 0, exitHeight: 64 });
      component.allowNavigablePath(getStairsNavigablePath(stairsType), getStairsNavigablePorts(stairsType));

      const highDirections = Object.entries(getStairsNavigablePorts(stairsType))
        .filter(([, port]) => port?.enterHeight === 64 && port.exitHeight === 64)
        .map(([direction]) => direction)
        .sort();
      expect(highDirections).toHaveLength(1);

      for (const { direction } of HEIGHT_NAVIGATION_DIRECTIONS) {
        const port = component.getDirectionPort(direction);
        if (!getStairsNavigablePath(stairsType)[direction]) {
          expect(port).toBeUndefined();
          continue;
        }

        if (highDirections.includes(direction)) {
          expect(canConnectHeightNavigationPorts({ enterHeight: 64, exitHeight: 64 }, port)).toBe(true);
          expect(canConnectHeightNavigationPorts({ enterHeight: 0, exitHeight: 0 }, port)).toBe(false);
        } else {
          expect(canConnectHeightNavigationPorts({ enterHeight: 0, exitHeight: 0 }, port)).toBe(true);
          expect(canConnectHeightNavigationPorts({ enterHeight: 64, exitHeight: 64 }, port)).toBe(false);
        }
      }
    }
  );
});

describe("height navigation dynamic blockers", () => {
  const heightAt = (tile: { x: number; y: number }) => {
    if (tile.x === 1 && tile.y === 1) return 0;
    if (tile.x === 2 && tile.y === 2) return 64;
    if (tile.x === 3 && tile.y === 3) return 64;
    return undefined;
  };

  it("blocks only when the dynamic blocker height matches the graph cell height", () => {
    const blockedKeys = getDynamicBlockedTileKeysForHeightGraph(
      [
        { tile: { x: 1, y: 1 }, heightLayer: 0 },
        { tile: { x: 2, y: 2 }, heightLayer: 0 },
        { tile: { x: 3, y: 3 }, heightLayer: 64 }
      ],
      heightAt,
      { x: 0, y: 0 },
      { x: 4, y: 4 }
    );

    expect([...blockedKeys].sort()).toEqual(["1,1", "3,3"]);
  });

  it("does not dynamically block the requesting actor origin or target tile", () => {
    const blockedKeys = getDynamicBlockedTileKeysForHeightGraph(
      [
        { tile: { x: 1, y: 1 }, heightLayer: 0 },
        { tile: { x: 3, y: 3 }, heightLayer: 64 }
      ],
      heightAt,
      { x: 1, y: 1 },
      { x: 3, y: 3 }
    );

    expect([...blockedKeys]).toEqual([]);
  });
});

function createNavigableComponent(definition: ConstructorParameters<typeof NavigableComponent>[1]): NavigableComponent {
  const gameObject = { scene: { events: { emit: jest.fn() } } } as unknown as Phaser.GameObjects.GameObject;
  return new NavigableComponent(gameObject, definition);
}
