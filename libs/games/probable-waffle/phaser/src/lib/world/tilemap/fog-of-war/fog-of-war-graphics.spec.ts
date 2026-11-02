import Phaser from "phaser";
import { FogOfWarGraphics } from "./fog-of-war-graphics";

const original = Object.getOwnPropertyDescriptor(Phaser.GameObjects.Graphics.prototype, "willRender");
const base = jest.fn();
beforeEach(() => {
  base.mockReset().mockReturnValue(true);
  Object.defineProperty(Phaser.GameObjects.Graphics.prototype, "willRender", { configurable: true, value: base });
});
afterEach(() => {
  if (original) Object.defineProperty(Phaser.GameObjects.Graphics.prototype, "willRender", original);
  else Reflect.deleteProperty(Phaser.GameObjects.Graphics.prototype, "willRender");
});

it("refreshes against the actual rendering camera after its view was resolved, including a second camera", () => {
  const refresh = jest.fn();
  const graphics = new FogOfWarGraphics({} as Phaser.Scene, refresh);
  const camera = { worldView: { x: 0 } } as Phaser.Cameras.Scene2D.Camera;
  camera.worldView.x = 3000;
  expect(graphics.willRender(camera)).toBe(true);
  expect(refresh).toHaveBeenLastCalledWith(camera);
  const second = { worldView: { x: -3000 } } as Phaser.Cameras.Scene2D.Camera;
  expect(graphics.willRender(second)).toBe(true);
  expect(refresh).toHaveBeenLastCalledWith(second);
  expect(base.mock.contexts).toEqual([graphics, graphics]);
});

it("preserves engine camera filtering and skips render callbacks after disposal", () => {
  const refresh = jest.fn();
  const graphics = new FogOfWarGraphics({} as Phaser.Scene, refresh);
  const camera = {} as Phaser.Cameras.Scene2D.Camera;
  base.mockReturnValue(false);
  expect(graphics.willRender(camera)).toBe(false);
  expect(refresh).not.toHaveBeenCalled();
  Reflect.set(graphics, "scene", undefined);
  base.mockReturnValue(true);
  expect(graphics.willRender(camera)).toBe(false);
  expect(refresh).not.toHaveBeenCalled();
});
