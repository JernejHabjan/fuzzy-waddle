import type Phaser from "phaser";
import { getActorComponent } from "../../../data/actor-component";
import { subscribeSceneResourceLoss } from "../../../data/scene-resource-observation";
import { ContainableComponent } from "./containable-component";
import { ContainerComponent } from "./container-component";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));

describe("containable resource history boundary (authored; final gate pending)", () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it("clears ownership before recursive unload and keeps empty leave as a no-op", () => {
    const scene = {} as Phaser.Scene;
    const child = { scene, once: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    const owner = { scene } as Phaser.GameObjects.GameObject;
    const containable = new ContainableComponent(child);
    const unload = jest.fn(() => {
      expect(containable.getContainerOwner()).toBeNull();
      containable.leaveContainer();
    });
    jest.mocked(getActorComponent).mockImplementation((_actor, token) =>
      token === ContainerComponent ? { unloadGameObject: unload } as never : undefined);
    const losses: string[] = [], release = subscribeSceneResourceLoss(scene, (reason) => losses.push(reason));
    containable.leaveContainer(); expect(losses).toEqual([]);
    containable.setContainer(owner); containable.leaveContainer();
    expect(unload).toHaveBeenCalledWith(child);
    expect(containable.isContained()).toBe(false);
    expect(losses).toEqual(["resource_container_change", "resource_container_change"]);
    release();
  });

  it("fences clearing before unload delegation and does not fence missing pending requests", () => {
    const scene = {} as Phaser.Scene;
    const child = { scene, once: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    const owner = { scene } as Phaser.GameObjects.GameObject;
    const containable = new ContainableComponent(child); containable.setContainer(owner);
    const losses: string[] = [], release = subscribeSceneResourceLoss(scene, (reason) => {
      losses.push(reason);
      expect(containable.getContainerOwner()).toBe(owner);
    });
    jest.mocked(getActorComponent).mockReturnValue(undefined);
    containable.clearContainerReference(); containable.cancelAnyPendingBoardingRequest();
    expect(losses).toEqual(["resource_container_change"]);
    release();
  });
});
