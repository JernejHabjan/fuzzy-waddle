import { NavigableComponent } from "../../entity/components/movement/navigable-component";
import { NavigablePathDirection } from "../../entity/components/movement/navigable-path-direction";
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

function createNavigableComponent(definition: ConstructorParameters<typeof NavigableComponent>[1]): NavigableComponent {
  const gameObject = { scene: { events: { emit: jest.fn() } } } as unknown as Phaser.GameObjects.GameObject;
  return new NavigableComponent(gameObject, definition);
}
