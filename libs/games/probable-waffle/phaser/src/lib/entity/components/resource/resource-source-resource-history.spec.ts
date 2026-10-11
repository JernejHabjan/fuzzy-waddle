import type Phaser from "phaser";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { subscribeSceneResourceLoss } from "../../../data/scene-resource-observation";
import { waitForSimulationDuration } from "../../../world/services/simulation-time";
import { ContainerComponent } from "../building/container-component";
import { ResourceSourceComponent } from "./resource-source-component";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ getGameObjectRenderedTransform: jest.fn(() => null) }));
jest.mock("../../../world/services/simulation-time", () => ({ waitForSimulationDuration: jest.fn() }));

function fixture(maximumResources = 10) {
  const scene = { events: { once: jest.fn() } } as unknown as Phaser.Scene;
  const sourceObject = { scene, destroy: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
  const gatherer = { scene } as Phaser.GameObjects.GameObject;
  const source = new ResourceSourceComponent(sourceObject, {
    maximumResources, gatheringFactor: 1, resourceType: ResourceType.Wood, cooldown: 10, respawnOnDepletion: true
  });
  const losses: string[] = [];
  const release = subscribeSceneResourceLoss(scene, (reason) => {
    losses.push(reason);
    if (reason === "resource_source_stock_change") expect(source.getCurrentResources()).toBeGreaterThan(0);
  });
  return { scene, sourceObject, gatherer, source, losses, release };
}

describe("resource source resource history boundary (authored; final gate pending)", () => {
  beforeEach(() => { jest.clearAllMocks(); jest.mocked(getActorComponent).mockReturnValue(undefined); });

  it("fences stock only after the controlled gather wait and preserves partial extraction", async () => {
    const f = fixture(); let settle: (() => void) | undefined;
    jest.mocked(waitForSimulationDuration).mockReturnValue(new Promise<void>((resolve) => { settle = resolve; }));
    const changed = jest.fn(); f.source.onResourcesChanged.subscribe(changed);
    const pending = f.source.extractResources(f.gatherer, 4);
    expect(f.source.getCurrentResources()).toBe(10);
    expect(f.losses).toEqual([]);
    if (!settle) throw new Error("source_wait_missing"); settle();
    expect(await pending).toBe(4);
    expect(f.losses).toEqual(["resource_source_stock_change"]);
    expect(changed).toHaveBeenCalledWith([ResourceType.Wood, 4, f.gatherer]);
    expect(f.source.getCurrentResources()).toBe(6);
    f.release();
  });

  it("keeps assignment no-ops quiet and fences real assignment, refill, lock and restore", () => {
    const f = fixture(), gatherer = f.gatherer;
    f.source.unassignGatherer(gatherer);
    f.source.assignGatherer(gatherer); f.source.assignGatherer(gatherer);
    f.source.unassignGatherer(gatherer); f.source.unassignGatherer(gatherer);
    expect(f.losses).toEqual(["resource_source_assignment_change", "resource_source_assignment_change"]);
    f.source.lockResources(); f.source.refillResources(); f.source.setData({ currentResources: 3 });
    expect(f.source.getCurrentResources()).toBe(3);
    expect(f.losses.slice(2)).toEqual([
      "resource_source_stock_change", "resource_source_stock_change", "resource_source_restore"
    ]);
    f.release();
  });

  it("retains a native container-entry throw before starting the cooldown or deducting stock", async () => {
    const failure = new Error("load");
    const container = { loadGameObject: jest.fn(() => { throw failure; }) };
    jest.mocked(getActorComponent).mockImplementation((_actor, token) =>
      token === ContainerComponent ? container as never : undefined);
    const f = fixture();
    await expect(f.source.extractResources(f.gatherer, 2)).rejects.toBe(failure);
    expect(container.loadGameObject).toHaveBeenCalledWith(f.gatherer);
    expect(waitForSimulationDuration).not.toHaveBeenCalled();
    expect(f.source.getCurrentResources()).toBe(10);
    expect(f.losses).toEqual(["resource_source_capacity_change"]);
    f.release();
  });
});
