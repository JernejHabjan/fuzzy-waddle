import type Phaser from "phaser";
import { getActorComponent } from "../../../data/actor-component";
import { subscribeSceneResourceLoss } from "../../../data/scene-resource-observation";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getGameObjectVisibility, isWaterUnit } from "../../../data/game-object-helper";
import { NavigationService } from "../../../world/services/navigation.service";
import { ContainerComponent } from "./container-component";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({
  getGameObjectVisibility: jest.fn(() => undefined),
  isWaterUnit: jest.fn(() => false)
}));
jest.mock("../../../world/services/ActorIndexSystem", () => ({ ActorIndexSystem: class {} }));

describe("container resource history boundary (authored; final gate pending)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(getSceneService).mockReturnValue(undefined);
    jest.mocked(getGameObjectVisibility).mockReturnValue(null);
    jest.mocked(isWaterUnit).mockReturnValue(false);
  });

  it("fences accepted load and unload while full and duplicate no-ops stay quiet", () => {
    const scene = {} as Phaser.Scene;
    const containerObject = { scene, once: jest.fn(), emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    const first = { scene, emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    const second = { scene, emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    jest.mocked(getActorComponent).mockReturnValue(undefined);
    const container = new ContainerComponent(containerObject, { capacity: 1 } as never);
    const losses: string[] = [],
      release = subscribeSceneResourceLoss(scene, (reason) => {
        losses.push(reason);
        if (reason === "resource_container_change") expect(container.getContainedGameObjects().length).toBeLessThan(2);
      });
    container.loadGameObject(first);
    container.loadGameObject(first);
    container.loadGameObject(second);
    expect(container.getContainedGameObjects()).toEqual([first]);
    expect(losses).toEqual(["resource_container_change"]);
    container.unloadGameObject(first);
    expect(container.getContainedGameObjects()).toEqual([]);
    expect(losses).toEqual(["resource_container_change", "resource_container_change"]);
    release();
  });

  it("fences definition and boarding changes before publishing container state", () => {
    const scene = {} as Phaser.Scene;
    const containerObject = { scene, once: jest.fn(), emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    const passenger = { scene } as Phaser.GameObjects.GameObject;
    jest.mocked(getActorComponent).mockReturnValue(undefined);
    const container = new ContainerComponent(containerObject, { capacity: 2 } as never);
    const losses: string[] = [],
      release = subscribeSceneResourceLoss(scene, (reason) => losses.push(reason));
    container.setContainerDefinition({ capacity: 3 } as never);
    container.registerBoardingRequest(passenger, { x: 1, y: 2 });
    expect(container.getTargetShoreForBoarder(passenger)).toEqual({ x: 1, y: 2 });
    expect(container.hasPendingBoarders()).toBe(true);
    container.cancelBoardingRequest(passenger);
    container.cancelBoardingRequest(passenger);
    expect(container.hasPendingBoarders()).toBe(false);
    expect(losses).toEqual(["resource_container_change", "resource_container_change", "resource_container_change"]);
    release();
  });

  it("retains delayed restore IDs until the real indexed passenger resolves", () => {
    const scene = {} as Phaser.Scene;
    const containerObject = { scene, once: jest.fn(), emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    const passenger = { scene, emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    let indexed: Phaser.GameObjects.GameObject | undefined;
    jest
      .mocked(getSceneService)
      .mockImplementation((_scene, token) =>
        token === ActorIndexSystem ? ({ getActorById: () => indexed } as never) : undefined
      );
    jest
      .mocked(getActorComponent)
      .mockImplementation((actor, token) =>
        token === IdComponent ? (actor === passenger ? ({ id: "passenger" } as never) : undefined) : undefined
      );
    const container = new ContainerComponent(containerObject, { capacity: 2 } as never);
    const losses: string[] = [],
      release = subscribeSceneResourceLoss(scene, (reason) => losses.push(reason));
    container.setData({ containedIds: ["passenger"] });
    expect(container.getContainedGameObjects()).toEqual([]);
    expect(losses).toEqual(["resource_container_restore"]);
    indexed = passenger;
    (container as unknown as { tryResolveContainedActorReferences(): void }).tryResolveContainedActorReferences();
    expect(container.getContainedGameObjects()).toEqual([passenger]);
    expect(losses).toEqual(["resource_container_restore", "resource_container_restore", "resource_container_change"]);
    release();
  });

  it("preserves native load/unload exceptions and the exact partial container state", () => {
    const scene = {} as Phaser.Scene;
    const containerObject = { scene, once: jest.fn(), emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    const first = { scene, emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    const second = { scene, emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    jest.mocked(getActorComponent).mockReturnValue(undefined);
    const container = new ContainerComponent(containerObject, { capacity: 2 } as never);
    const failure = new Error("visibility");
    jest.mocked(getGameObjectVisibility).mockReturnValue({
      setVisible: () => {
        throw failure;
      }
    } as never);
    const losses: string[] = [],
      release = subscribeSceneResourceLoss(scene, (reason) => losses.push(reason));
    expect(() => container.loadGameObject(first)).toThrow(failure);
    expect(container.getContainedGameObjects()).toEqual([first]);
    jest.mocked(getGameObjectVisibility).mockReturnValue(null);
    container.loadGameObject(second);
    jest.mocked(getGameObjectVisibility).mockReturnValue({
      setVisible: () => {
        throw failure;
      }
    } as never);
    expect(() => container.unloadAll()).toThrow(failure);
    expect(container.getContainedGameObjects()).toEqual([second]);
    expect(losses).toEqual(["resource_container_change", "resource_container_change", "resource_container_change"]);
    release();
  });

  it.each([
    [false, true],
    [true, false]
  ] as const)("preserves sea versus shore destruction policy (shore=%s, destroyed=%s)", (shore, destroyed) => {
    const scene = {} as Phaser.Scene;
    const containerObject = { scene, once: jest.fn(), emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    const passenger = { scene, emit: jest.fn(), destroy: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    jest.mocked(getActorComponent).mockReturnValue(undefined);
    const navigation = {
      getCenterTileCoordUnderObject: () => ({ x: 1, y: 2 }),
      isShoreTile: () => shore,
      getSpawnPointAroundGameObject: () => undefined
    };
    jest
      .mocked(getSceneService)
      .mockImplementation((_scene, token) => (token === NavigationService ? (navigation as never) : undefined));
    jest.mocked(isWaterUnit).mockReturnValue(true);
    const container = new ContainerComponent(containerObject, { capacity: 2 } as never);
    container.loadGameObject(passenger);
    const losses: string[] = [],
      release = subscribeSceneResourceLoss(scene, (reason) => losses.push(reason));
    container.onKilled();
    expect(passenger.destroy).toHaveBeenCalledTimes(destroyed ? 1 : 0);
    expect(container.getContainedGameObjects()).toEqual([]);
    expect(losses).toEqual(["resource_container_change"]);
    release();
  });
});
