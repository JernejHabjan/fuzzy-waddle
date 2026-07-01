import { NavigableComponent } from "../../entity/components/movement/navigable-component";
import { NavigablePathDirection } from "../../entity/components/movement/navigable-path-direction";
import { getDynamicBlockedTileKeysForHeightGraph } from "./height-navigation-dynamic-blockers";
import { canConnectHeightNavigationPorts } from "./height-navigation-graph-builder";

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
