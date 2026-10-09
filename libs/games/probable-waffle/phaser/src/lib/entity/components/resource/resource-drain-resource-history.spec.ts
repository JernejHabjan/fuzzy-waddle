import type Phaser from "phaser";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { subscribeSceneResourceLoss } from "../../../data/scene-resource-observation";
import { waitForSimulationDuration } from "../../../world/services/simulation-time";
import { OwnerComponent } from "../owner-component";
import { ContainerComponent } from "../building/container-component";
import { ResourceDrainComponent } from "./resource-drain-component";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ emitResource: jest.fn(), getPlayer: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ onObjectReady: jest.fn() }));
jest.mock("../../../world/services/simulation-time", () => ({ waitForSimulationDuration: jest.fn() }));

describe("resource drain resource history boundary (authored; final gate pending)", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("keeps the caller's controlled wait and return ordering, then credits the current owner", async () => {
    const scene = {} as Phaser.Scene, drainObject = { scene } as Phaser.GameObjects.GameObject;
    const gatherer = { scene } as Phaser.GameObjects.GameObject, losses: string[] = [];
    let settle: (() => void) | undefined;
    jest.mocked(waitForSimulationDuration).mockReturnValue(new Promise<void>((resolve) => { settle = resolve; }));
    const owner = { getOwner: () => 2 };
    jest.mocked(getActorComponent).mockImplementation((_actor, token) =>
      token === OwnerComponent ? owner as never : undefined);
    jest.mocked(getPlayer).mockReturnValue({ playerController: { data: { playerDefinition: { campaignEconomy: "normal" } } } } as never);
    const release = subscribeSceneResourceLoss(scene, (reason) => losses.push(reason));
    const drain = new ResourceDrainComponent(drainObject, { cooldown: 10, resourceTypes: [ResourceType.Wood] });
    drain.init(); const returned = jest.fn(); drain.onResourcesReturned.subscribe(returned);
    const pending = drain.returnResources(gatherer, ResourceType.Wood, 3);
    expect(emitResource).not.toHaveBeenCalled(); expect(returned).not.toHaveBeenCalled();
    expect(losses).toContain("resource_drain_capacity_change");
    if (!settle) throw new Error("drain_wait_missing"); settle();
    expect(await pending).toBe(3);
    expect(emitResource).toHaveBeenCalledWith(scene, "resource.added", { wood: 3 }, 2);
    expect(returned).toHaveBeenCalledWith([ResourceType.Wood, 3, gatherer]);
    release();
  });

  it("does not fence capacity no-op paths, but fences defined restore before applying it", () => {
    const scene = {} as Phaser.Scene, drainObject = { scene } as Phaser.GameObjects.GameObject;
    const container = { containerDefinition: { capacity: 2 } };
    jest.mocked(getActorComponent).mockReturnValue(container as never);
    const drain = new ResourceDrainComponent(drainObject, { cooldown: 10, resourceTypes: [ResourceType.Wood] });
    const losses: string[] = [], release = subscribeSceneResourceLoss(scene, (reason) => losses.push(reason));
    drain.init(); expect(drain.canDropOffResources()).toBe(true);
    expect(losses).toEqual(["resource_drain_capacity_change"]);
    drain.setData({}); expect(losses).toHaveLength(1);
    drain.setData({ currentCapacity: 1 });
    expect(losses).toEqual(["resource_drain_capacity_change", "resource_drain_restore"]);
    expect(drain.getData()).toEqual({ currentCapacity: 1 });
    release();
    expect(getActorComponent).toHaveBeenCalledWith(drainObject, ContainerComponent);
  });

  it("retains a native drain-entry throw without advancing into the wait or credit path", async () => {
    const scene = {} as Phaser.Scene, drainObject = { scene } as Phaser.GameObjects.GameObject;
    const gatherer = { scene } as Phaser.GameObjects.GameObject, failure = new Error("load");
    const container = { containerDefinition: { capacity: 2 }, loadGameObject: jest.fn(() => { throw failure; }) };
    jest.mocked(getActorComponent).mockImplementation((_actor, token) =>
      token === ContainerComponent ? container as never : undefined);
    const losses: string[] = [], release = subscribeSceneResourceLoss(scene, (reason) => losses.push(reason));
    const drain = new ResourceDrainComponent(drainObject, { cooldown: 10, resourceTypes: [ResourceType.Wood] });
    drain.init();
    await expect(drain.returnResources(gatherer, ResourceType.Wood, 3)).rejects.toBe(failure);
    expect(container.loadGameObject).toHaveBeenCalledWith(gatherer);
    expect(waitForSimulationDuration).not.toHaveBeenCalled();
    expect(emitResource).not.toHaveBeenCalled();
    expect(losses).toEqual(["resource_drain_capacity_change", "resource_drain_capacity_change"]);
    release();
  });

  it("keeps a drain-exit throw after the controlled wait ahead of credit and notification", async () => {
    const scene = {} as Phaser.Scene, drainObject = { scene } as Phaser.GameObjects.GameObject;
    const gatherer = { scene } as Phaser.GameObjects.GameObject, failure = new Error("unload");
    const container = { containerDefinition: { capacity: 2 }, loadGameObject: jest.fn(),
      unloadGameObject: jest.fn(() => { throw failure; }) };
    jest.mocked(getActorComponent).mockImplementation((_actor, token) =>
      token === ContainerComponent ? container as never : undefined);
    let settle: (() => void) | undefined;
    jest.mocked(waitForSimulationDuration).mockReturnValue(new Promise<void>((resolve) => { settle = resolve; }));
    const losses: string[] = [], release = subscribeSceneResourceLoss(scene, (reason) => losses.push(reason));
    const drain = new ResourceDrainComponent(drainObject, { cooldown: 10, resourceTypes: [ResourceType.Wood] });
    drain.init(); const returned = jest.fn(); drain.onResourcesReturned.subscribe(returned);
    const pending = drain.returnResources(gatherer, ResourceType.Wood, 3);
    expect(container.loadGameObject).toHaveBeenCalledWith(gatherer);
    if (!settle) throw new Error("drain_wait_missing"); settle();
    await expect(pending).rejects.toBe(failure);
    expect(container.unloadGameObject).toHaveBeenCalledWith(gatherer);
    expect(emitResource).not.toHaveBeenCalled(); expect(returned).not.toHaveBeenCalled();
    expect(losses).toEqual([
      "resource_drain_capacity_change", "resource_drain_capacity_change", "resource_drain_capacity_change"
    ]);
    release();
  });
});
