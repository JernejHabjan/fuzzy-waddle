import { FogOfWarViewport } from "./fog-of-war-viewport";

const camera = (x = -640, y = 400, width = 1280, height = 720) => ({
  worldView: { x, y, width, height },
  rotation: 0,
  shakeEffect: { isRunning: false }
});

it("keeps all viewport-intersecting diamonds, including fractional and negative boundary coordinates", () => {
  const viewport = new FogOfWarViewport(64, 32);
  for (const view of [camera(), camera(-1000.5, -200.25, 333.3, 171.7), camera(6000, 3200, 2560, 1440)]) {
    viewport.capture(view);
    const { x, y, width, height } = view.worldView;
    for (let px = x - 64; px <= x + width; px += 31.25)
      for (let py = y - 32; py <= y + height; py += 15.75) expect(viewport.intersectsTile(px, py)).toBe(true);
    expect(viewport.intersectsTile(x - 10000, y - 10000)).toBe(false);
  }
});

it("reuses padded coverage while the camera remains inside, then invalidates on pan, zoom or resize", () => {
  const viewport = new FogOfWarViewport(64, 32);
  const original = camera();
  expect(viewport.needsRedraw(original)).toBe(true);
  viewport.capture(original);
  expect(viewport.needsRedraw(original)).toBe(false);
  expect(viewport.needsRedraw(camera(-513, 400))).toBe(false);
  expect(viewport.needsRedraw(camera(-511, 400))).toBe(true);
  expect(viewport.needsRedraw(camera(-640, 465))).toBe(true);
  expect(viewport.needsRedraw(camera(-640, 400, 1500, 720))).toBe(true);
  expect(viewport.needsRedraw(camera(-1280, 40, 2560, 1440))).toBe(true);
});

it.each(["rotation", "shake", "invalid"])("uses complete fog coverage for a camera requiring %s fallback", (kind) => {
  const viewport = new FogOfWarViewport(64, 32);
  const normal = camera();
  viewport.capture(normal);
  const special = camera();
  if (kind === "rotation") special.rotation = Math.PI / 4;
  if (kind === "shake") special.shakeEffect.isRunning = true;
  if (kind === "invalid") special.worldView.width = 0;
  expect(viewport.needsRedraw(special)).toBe(true);
  viewport.capture(special);
  expect(viewport.intersectsTile(-100000, 100000)).toBe(true);
  expect(viewport.needsRedraw(special)).toBe(false);
  expect(viewport.needsRedraw(normal)).toBe(true);
});
