import Phaser from "phaser";
import { getSceneComponent } from "../../../world/services/scene-component-helpers";
import { getCenterTileCoordUnderObject } from "../../../library/tile-under-object";
import { StructureTopologyService, StructureTopologyChangedEvent } from "./navigation-topology.events";

jest.mock("../../../data/game-object-helper", () => ({ onObjectReady: jest.fn() }));
jest.mock("../../../library/tile-under-object", () => ({ getCenterTileCoordUnderObject: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneComponent: jest.fn() }));
jest.mock("../../../entity/components/combat/components/health-component", () => ({
  HealthComponent: { KilledEvent: "killed" }
}));
jest.mock("../../../world/tilemap/tilemap.component", () => ({ TilemapComponent: class {} }));

function fixture() {
  jest.clearAllMocks();
  const scene = {
    events: new Phaser.Events.EventEmitter(),
    sys: { settings: { status: Phaser.Scenes.RUNNING } },
    cameras: { main: {} }
  };
  const actor = Object.assign(new Phaser.Events.EventEmitter(), { scene, active: true });
  jest.mocked(getSceneComponent).mockReturnValue({ tilemap: {} });
  jest.mocked(getCenterTileCoordUnderObject).mockImplementation(() => {
    if (!scene.cameras.main) throw new TypeError("Cannot read properties of undefined (reading 'scrollY')");
    return { x: 3, y: 4 };
  });
  const service = new StructureTopologyService(actor as unknown as Phaser.GameObjects.GameObject, {});
  service.init();
  const notify = jest.fn();
  scene.events.on(StructureTopologyChangedEvent, notify);
  return { scene, service, notify };
}

describe("structure topology lifetime", () => {
  it("keeps live topology updates available during paused setup", () => {
    const f = fixture();
    f.scene.sys.settings.status = Phaser.Scenes.PAUSED;
    f.service.notify();
    expect(f.notify).toHaveBeenCalledTimes(1);
    f.service.destroy();
  });

  it("notifies live neighbors exactly once on removal", () => {
    const f = fixture();
    f.service.destroy();
    f.service.destroy();
    expect(f.notify).toHaveBeenCalledTimes(1);
  });

  it("does not read tiles after scene shutdown removes the camera", () => {
    const f = fixture();
    f.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
    f.scene.cameras.main = undefined as never;
    expect(() => f.service.destroy()).not.toThrow();
    expect(getCenterTileCoordUnderObject).not.toHaveBeenCalled();
    expect(f.notify).not.toHaveBeenCalled();
    expect(f.scene.events.listenerCount(Phaser.Scenes.Events.SHUTDOWN)).toBe(0);
  });
});
