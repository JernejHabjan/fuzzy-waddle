import Phaser from "phaser";
import { State } from "mistreevous";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../data/actor-component";
import { getActorSystem } from "../../data/actor-system";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { OwnerComponent } from "../../entity/components/owner-component";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { GathererComponent } from "../../entity/components/resource/gatherer-component";
import { ResourceSourceComponent } from "../../entity/components/resource/resource-source-component";
import { ContainerComponent } from "../../entity/components/building/container-component";
import { ContainableComponent } from "../../entity/components/building/containable-component";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { PlayerPawnAiControllerAgent } from "./player-pawn-ai-controller.agent";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../data/actor-system", () => ({ getActorSystem: jest.fn() }));
jest.mock("../../data/game-object-helper", () => ({ onObjectReady: jest.fn() }));
jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

/** Real native cargo/source/stop owners; only indexed service membership and path selection are controlled. */
function fixture() {
  const scene = new Phaser.Scene();
  Object.assign(scene, {
    events: new Phaser.Events.EventEmitter(),
    sys: {
      isActive: () => true,
      queueDepthSort: () => undefined
    }
  });
  const worker = new Phaser.GameObjects.GameObject(scene, "worker");
  const sourceActor = new Phaser.GameObjects.GameObject(scene, "tree");
  const drain = new Phaser.GameObjects.GameObject(scene, "main");
  const source = new ResourceSourceComponent(sourceActor, {
    resourceType: ResourceType.Wood,
    maximumResources: 100,
    gatheringFactor: 1,
    cooldown: 1000
  });
  const gatherer = new GathererComponent(worker, { resourceSourceGameObjectClasses: [], resourceSweepRadius: 10 });
  let alive = true;
  jest.mocked(getActorComponent).mockImplementation((actor, token) => {
    if (token === GathererComponent && actor === worker) return gatherer;
    if (token === ResourceSourceComponent && actor === sourceActor) return source;
    if (token === OwnerComponent) return { isSameTeamAsGameObject: () => true } as never;
    if (token === HealthComponent && actor === drain)
      return {
        get alive() {
          return alive;
        }
      } as never;
    return undefined;
  });
  jest
    .mocked(getSceneService)
    .mockImplementation((_scene, token) =>
      token === ActorIndexSystem ? ({ getResourceDrainsFiltered: () => [drain] } as never) : undefined
    );
  jest.mocked(getActorSystem).mockReturnValue(undefined);
  const board = new PawnAiBlackboard();
  board.setCurrentOrder(new OrderData(OrderType.Gather, { targetGameObject: sourceActor }));
  const agent = new PlayerPawnAiControllerAgent(worker, board);
  gatherer.startGatheringResources(sourceActor);
  gatherer.carriedResourceAmount = 1;
  return {
    agent,
    board,
    gatherer,
    worker,
    source,
    drain,
    sourceActor,
    killDrain: () => {
      alive = false;
    }
  };
}

describe("native jobs recover when a resource drop-off is lost", () => {
  beforeEach(() => jest.resetAllMocks());

  it("unloads a contained gatherer once while releasing its source assignment", () => {
    const f = fixture();
    const read = jest.mocked(getActorComponent).getMockImplementation();
    let inside = true;
    const unload = jest.fn(() => {
      inside = false;
    });
    jest.mocked(getActorComponent).mockImplementation((actor, token) => {
      if (actor === f.sourceActor && token === ContainerComponent)
        return {
          getContainedGameObjects: () => (inside ? [f.worker] : []),
          unloadGameObject: unload
        } as never;
      if (actor === f.worker && token === ContainableComponent)
        return {
          leaveContainer: () => unload(),
          cancelAnyPendingBoardingRequest: jest.fn()
        } as never;
      return read?.(actor, token);
    });
    f.killDrain();
    f.agent.ValidateResourceDelivery();
    expect(unload).toHaveBeenCalledTimes(1);
    expect(f.gatherer.currentResourceSource).toBeNull();
  });

  it("stops gathering, releases the source slot and preserves partial cargo when the main building dies", () => {
    const f = fixture();
    expect(f.agent.ValidateResourceDelivery()).toBe(State.FAILED);
    f.killDrain(); // Still indexed and active while its death animation runs.
    expect(f.agent.ValidateResourceDelivery()).toBe(State.SUCCEEDED);
    expect(f.board.getCurrentOrder()).toBeUndefined();
    expect(f.gatherer.currentResourceSource).toBeNull();
    expect(f.source.getAssignedGatherersCount()).toBe(0);
    expect(f.gatherer.carriedResourceAmount).toBe(1);
    expect(f.gatherer.carriedResourceType).toBe(ResourceType.Wood);
  });

  it("allows an immediate-credit source to continue without a building", () => {
    const f = fixture();
    f.killDrain();
    Object.assign(f.source.resourceSourceDefinition, { needsReturnToDrain: false });
    expect(f.agent.ValidateResourceDelivery()).toBe(State.FAILED);
    expect(f.board.getCurrentOrder()?.orderType).toBe(OrderType.Gather);
  });

  it.each([OrderType.Gather, OrderType.ReturnResources])(
    "releases an unserviceable %s order after lookup",
    async (type) => {
      const f = fixture();
      f.board.setCurrentOrder(new OrderData(type, { targetGameObject: f.drain }));
      jest.spyOn(f.gatherer, "getPreferredResourceDrain").mockResolvedValue(null);
      expect(
        await (type === OrderType.Gather ? f.agent.AssignDropOffResourcesOrder() : f.agent.AcquireNewResourceDrain())
      ).toBe(State.SUCCEEDED);
      expect(f.board.getCurrentOrder()).toBeUndefined();
      expect(f.gatherer.carriedResourceAmount).toBe(1);
    }
  );

  it("does not cancel a replacement order after the old lookup returns empty", async () => {
    const f = fixture();
    let finish: ((drain: null) => void) | undefined;
    jest.spyOn(f.gatherer, "getPreferredResourceDrain").mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const pending = f.agent.AssignDropOffResourcesOrder();
    const replacement = new OrderData(OrderType.Move);
    f.board.setCurrentOrder(replacement);
    if (!finish) throw new Error("drain_lookup_missing");
    finish(null);
    expect(await pending).toBe(State.FAILED);
    expect(f.board.getCurrentOrder()).toBe(replacement);
  });
});
