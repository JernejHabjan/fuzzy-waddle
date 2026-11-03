import { FogOfWarComponent, FogOfWarMode } from "./fog-of-war.component";
import { FogOfWarViewport } from "./fog-of-war/fog-of-war-viewport";

/** Render-only boundary: the real fog loop retains its complete logical visibility sets. */
function fixture() {
  const fog = Object.create(FogOfWarComponent.prototype) as FogOfWarComponent;
  const camera = { worldView: { x: -640, y: 400, width: 1280, height: 720 }, rotation: 0 };
  const drawn = jest.fn();
  const visible = new Set([42]),
    explored = new Set([42, 43]);
  const positions = new Map<number, { x: number; y: number }>();
  for (let y = -40; y < 104; y++)
    for (let x = -40; x < 104; x++) positions.set((y + 40) * 144 + x + 40, { x: (x - y) * 32, y: (x + y) * 16 });
  Object.assign(fog, {
    scene: { cameras: { main: camera } },
    fowMode: FogOfWarMode.PRE_EXPLORED,
    fowLayer: {
      clear: jest.fn(),
      fillStyle: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      fillPath: jest.fn()
    },
    COLOR_EXPLORED: 0x777777,
    ALPHA_EXPLORED: 0.5,
    COLOR_UNEXPLORED: 0x333333,
    ALPHA_UNEXPLORED_PE_EXPLORED_MODE: 0.7,
    ALPHA_UNEXPLORED_FULL_EXPLORATION_MODE: 1,
    dirtyTiles: new Set([0]),
    startX: -40,
    startY: -40,
    gridWidth: 144,
    gridHeight: 144,
    tileWidth: 64,
    tileHeight: 32,
    tileWorldPosCache: positions,
    visibleTiles: visible,
    exploredTiles: explored,
    getTileKey: (x: number, y: number) => (y + 40) * 144 + x + 40,
    drawTileAtWorldPos: drawn,
    renderViewport: new FogOfWarViewport(64, 32)
  });
  const redraw = () => Reflect.get(fog, "redrawFogOfWar").call(fog);
  return { fog, redraw, drawn, visible, explored };
}

it("bounds fog polygon work to the camera while retaining complete visibility and exploration", () => {
  const f = fixture();
  f.redraw();
  expect(f.drawn.mock.calls.length).toBeLessThan(2000);
  expect(f.drawn.mock.calls.length).toBeGreaterThan(0);
  expect([...f.visible]).toEqual([42]);
  expect([...f.explored]).toEqual([42, 43]);
});

it("refreshes camera coverage without simulation/visibility dirtiness", () => {
  const f = fixture();
  Reflect.set(f.fog, "dirtyTiles", new Set());
  const viewport = Reflect.get(f.fog, "renderViewport");
  const capture = jest.spyOn(viewport, "capture");
  Reflect.get(f.fog, "refreshFogForCamera").call(f.fog, {
    worldView: { x: 2000, y: 400, width: 1280, height: 720 },
    rotation: 0
  });
  expect(f.drawn).toHaveBeenCalled();
  expect(capture).toHaveBeenCalled();
});

it("forces a mode/reset repaint even when logical visibility did not change", () => {
  const f = fixture();
  Reflect.set(f.fog, "dirtyTiles", new Set());
  Reflect.set(f.fog, "updateFogOfWar", jest.fn());
  const layer = Reflect.get(f.fog, "fowLayer");
  f.fog.setMode(FogOfWarMode.ALL_VISIBLE);
  expect(layer.clear).toHaveBeenCalled();
  layer.clear.mockClear();
  f.fog.setMode(FogOfWarMode.FULL_EXPLORATION);
  expect(layer.clear).toHaveBeenCalled();
  expect(f.drawn).toHaveBeenCalled();
});

it("preserves transparent visible tiles and distinct explored/unexplored opacity", () => {
  const f = fixture();
  Reflect.deleteProperty(f.fog, "drawTileAtWorldPos");
  const draw = Reflect.get(f.fog, "drawTileAtWorldPos"),
    layer = Reflect.get(f.fog, "fowLayer");
  draw.call(f.fog, 0, 0, 42, 0.7);
  expect(layer.fillStyle).not.toHaveBeenCalled();
  draw.call(f.fog, 0, 0, 43, 0.7);
  draw.call(f.fog, 0, 0, 44, 0.7);
  expect(layer.fillStyle.mock.calls).toEqual([
    [0x777777, 0.5],
    [0x333333, 0.7]
  ]);
});
