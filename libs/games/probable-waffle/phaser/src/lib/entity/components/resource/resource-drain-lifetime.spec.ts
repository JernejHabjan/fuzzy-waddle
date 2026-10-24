import Phaser from "phaser";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { ResourceDrainComponent } from "./resource-drain-component";
import { ContainerComponent } from "../building/container-component";
import { OwnerComponent } from "../owner-component";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { waitForSimulationDuration } from "../../../world/services/simulation-time";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ emitResource: jest.fn(), getPlayer: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ onObjectReady: jest.fn() }));
jest.mock("../../../world/services/simulation-time", () => ({ waitForSimulationDuration: jest.fn() }));

function fixture(contained = false) {
  const scene = new Phaser.Scene();
  Object.assign(scene, { sys: { queueDepthSort: jest.fn() }, events: new Phaser.Events.EventEmitter() });
  const worker = new Phaser.GameObjects.GameObject(scene, "worker");
  const target = new Phaser.GameObjects.GameObject(scene, "drain");
  const container = { containerDefinition: { capacity: 1 }, loadGameObject: jest.fn(), unloadGameObject: jest.fn() };
  jest
    .mocked(getActorComponent)
    .mockImplementation((_actor, token) =>
      token === ContainerComponent && contained
        ? (container as never)
        : token === OwnerComponent
          ? ({ getOwner: () => 1 } as never)
          : undefined
    );
  jest.mocked(getPlayer).mockReturnValue({ playerController: { data: {} } } as never);
  let settle!: () => void;
  jest.mocked(waitForSimulationDuration).mockReturnValue(
    new Promise<void>((resolve) => {
      settle = resolve;
    })
  );
  const drain = new ResourceDrainComponent(target, { cooldown: 100, resourceTypes: [ResourceType.Wood] });
  drain.init();
  return { scene, worker, target, container, drain, settle: () => settle() };
}

describe("drop-off lifetime and transfer authority", () => {
  beforeEach(() => jest.resetAllMocks());

  it("keeps ordinary outdoor drop-off available without a container", () => {
    expect(fixture().drain.canDropOffResources()).toBe(true);
  });

  it.each(["drain", "worker"] as const)(
    "does not credit cargo after the %s is destroyed during unloading",
    async (lost) => {
      const f = fixture();
      const pending = f.drain.returnResources(f.worker, ResourceType.Wood, 3);
      (lost === "drain" ? f.target : f.worker).destroy();
      f.settle();
      expect(await pending).toBe(0);
      expect(emitResource).not.toHaveBeenCalled();
    }
  );

  it("does not accept the same carrier twice while its first unload is pending", async () => {
    const f = fixture();
    const pending = f.drain.returnResources(f.worker, ResourceType.Wood, 3);
    expect(await f.drain.returnResources(f.worker, ResourceType.Wood, 3)).toBe(0);
    f.settle();
    expect(await pending).toBe(3);
    expect(emitResource).toHaveBeenCalledTimes(1);
  });

  it("does not credit a pending unload or accept another transfer after scene shutdown", async () => {
    const f = fixture(true);
    const pending = f.drain.returnResources(f.worker, ResourceType.Wood, 3);
    f.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
    f.settle();
    expect(await pending).toBe(0);
    expect(await f.drain.returnResources(f.worker, ResourceType.Wood, 3)).toBe(0);
    expect(f.drain.getData().currentCapacity).toBe(0);
    expect(emitResource).not.toHaveBeenCalled();
  });

  it("keeps the offered cargo unreturned when its recipient player disappeared", async () => {
    const f = fixture();
    const pending = f.drain.returnResources(f.worker, ResourceType.Wood, 3);
    jest.mocked(getPlayer).mockReturnValue(undefined);
    f.settle();
    expect(await pending).toBe(0);
    expect(emitResource).not.toHaveBeenCalled();
  });

  it("denies a second carrier while the container's one unload slot is occupied", async () => {
    const f = fixture(true);
    const other = new Phaser.GameObjects.GameObject(f.scene, "other");
    const pending = f.drain.returnResources(f.worker, ResourceType.Wood, 3);
    expect(await f.drain.returnResources(other, ResourceType.Wood, 3)).toBe(0);
    f.settle();
    expect(await pending).toBe(3);
    expect(f.container.loadGameObject).toHaveBeenCalledTimes(1);
    expect(f.drain.getData().currentCapacity).toBe(0);
  });

  it.each(["entry", "wait", "exit"] as const)(
    "releases container capacity after a native %s failure",
    async (boundary) => {
      const f = fixture(true);
      const failure = new Error(boundary);
      if (boundary === "entry")
        f.container.loadGameObject.mockImplementation(() => {
          throw failure;
        });
      if (boundary === "exit")
        f.container.unloadGameObject.mockImplementation(() => {
          throw failure;
        });
      if (boundary === "wait") jest.mocked(waitForSimulationDuration).mockRejectedValue(failure);
      const pending = f.drain.returnResources(f.worker, ResourceType.Wood, 3);
      const rejected = expect(pending).rejects.toBe(failure);
      f.settle();
      await rejected;
      expect(f.drain.getData().currentCapacity).toBe(0);
      expect(f.drain.canDropOffResources()).toBe(true);
      expect(emitResource).not.toHaveBeenCalled();
    }
  );

  it.each([0, -3, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid transfer amount %s", async (amount) => {
    const f = fixture();
    const pending = f.drain.returnResources(f.worker, ResourceType.Wood, amount);
    f.settle();
    expect(await pending).toBe(0);
    expect(emitResource).not.toHaveBeenCalled();
  });
});
