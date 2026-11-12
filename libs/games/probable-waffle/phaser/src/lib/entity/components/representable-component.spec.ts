import type Phaser from "phaser";
import { RepresentableComponent } from "./representable-component";
import { FlyingComponent } from "./movement/flying-component";
import { getActorComponent } from "../../data/actor-component";
import { onObjectReady } from "../../data/game-object-helper";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../data/game-object-helper", () => ({ onObjectReady: jest.fn() }));
jest.mock("../../world/services/depth.helper", () => ({ DepthHelper: { setActorDepth: jest.fn() } }));

function fixture(flying: boolean, editorY: number, editorZ: number) {
  const actor = { hasTransformComponent: true, x: 400, y: editorY, z: editorZ };
  jest
    .mocked(getActorComponent)
    .mockImplementation((_actor, token) =>
      token === FlyingComponent && flying ? ({ flightDefinition: { height: 32 } } as never) : undefined
    );
  const component = new RepresentableComponent(actor as unknown as Phaser.GameObjects.GameObject, {
    width: 64,
    height: 96,
    origin: { x: 0.5, y: 0.75 }
  });
  const ready = jest.mocked(onObjectReady).mock.calls.at(-1);
  if (!ready) throw new Error("fixture_ready_callback_missing");
  return { actor, component, ready: () => ready[1].call(ready[2]) };
}

beforeEach(() => jest.clearAllMocks());

it.each([false, true])(
  "preserves serialized elevated actor projection through repeated restoration (flying=%s)",
  (flying) => {
    const original = fixture(flying, 300, 64);
    original.ready();
    const expected = { x: original.actor.x, y: original.actor.y };
    expect(expected).toEqual({ x: 400, y: 236 });
    let saved = JSON.parse(JSON.stringify(original.component.getData()));
    const logical = { ...saved.logicalWorldTransform };
    for (let cycle = 0; cycle < 3; cycle++) {
      const restored = fixture(flying, 17, 0);
      restored.component.setData(saved);
      // Restoration can precede both definition reapplication and the delayed ready callback.
      restored.component.setData(saved);
      restored.ready();
      expect({ x: restored.actor.x, y: restored.actor.y }).toEqual(expected);
      expect(restored.component.logicalWorldTransform).toEqual(logical);
      saved = JSON.parse(JSON.stringify(restored.component.getData()));
    }
  }
);

it("preserves a restored transform if ready initialization already ran on constructor defaults", () => {
  const restored = fixture(false, 17, 0);
  restored.ready();
  restored.component.setData({ logicalWorldTransform: { x: 400, y: 300, z: 64 } });
  restored.ready();
  expect(restored.actor.y).toBe(236);
  expect(restored.component.logicalWorldTransform).toEqual({ x: 400, y: 300, z: 64 });
});
