import Phaser from "phaser";
import { State } from "mistreevous";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { getActorComponent } from "../../data/actor-component";
import { GathererComponent } from "../../entity/components/resource/gatherer-component";
import { ResourceSourceComponent } from "../../entity/components/resource/resource-source-component";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { PawnAgentResources } from "./pawn-agent-resources";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((release) => {
    resolve = release;
  });
  return { promise, resolve };
}

function fixture() {
  let activeScene = true,
    alive = true;
  const scene = { sys: { isActive: () => activeScene, queueDepthSort: () => undefined } } as unknown as Phaser.Scene;
  const actor = new Phaser.GameObjects.GameObject(scene, "worker");
  const oldTarget = new Phaser.GameObjects.GameObject(scene, "old");
  const selected = new Phaser.GameObjects.GameObject(scene, "selected");
  const board = new PawnAiBlackboard();
  const order = new OrderData(OrderType.Gather, { targetGameObject: oldTarget });
  board.setCurrentOrder(order);
  const lookup = deferred<Phaser.GameObjects.GameObject | null>();
  const range = deferred<State>();
  const gatherer = {
    getPreferredResourceSource: jest.fn(() => lookup.promise),
    getNewResourceSource: jest.fn(async () => selected),
    getPreferredResourceDrain: jest.fn(() => lookup.promise),
    remainingCooldown: 0,
    isCarryingResources: jest.fn(() => false),
    isCapacityFull: () => false,
    startGatheringResources: jest.fn(() => true),
    gatherResources: jest.fn(async () => 1)
  };
  jest
    .mocked(getActorComponent)
    .mockImplementation((_actor, token) =>
      token === GathererComponent
        ? (gatherer as never)
        : token === ResourceSourceComponent
          ? ({ getCurrentResources: () => 10 } as never)
          : undefined
    );
  const stop = jest.fn(() => {
    board.resetCurrentOrder();
    return State.SUCCEEDED;
  });
  const resources = new PawnAgentResources(actor, board, {
    SelfIsAlive: () => alive,
    InRange: () => range.promise,
    AcquireNewResourceSource: jest.fn(),
    Stop: stop
  });
  return {
    actor,
    oldTarget,
    selected,
    board,
    order,
    lookup,
    range,
    gatherer,
    resources,
    stop,
    deactivateScene: () => {
      activeScene = false;
    },
    kill: () => {
      alive = false;
    }
  };
}

const lookups = [
  "AcquireNewResourceSource",
  "AcquireNewResourceDrain",
  "AssignGatherResourcesOrder",
  "AssignDropOffResourcesOrder"
] as const;
const invalidations = [
  "replacement",
  "cancellation",
  "retarget",
  "type",
  "inactive",
  "scene",
  "dead",
  "target"
] as const;

describe("resource selection belongs to the requesting order lifetime", () => {
  beforeEach(() => jest.resetAllMocks());

  describe.each(lookups)("%s", (method) => {
    it.each(invalidations)("discards selection after %s", async (boundary) => {
      const f = fixture();
      const pending = f.resources[method]();
      const replacement = new OrderData(OrderType.Move, { targetGameObject: f.actor });
      if (boundary === "replacement") f.board.setCurrentOrder(replacement);
      if (boundary === "cancellation") f.board.resetCurrentOrder();
      if (boundary === "retarget") f.order.data.targetGameObject = f.actor;
      if (boundary === "type") f.order.orderType = OrderType.Stop;
      if (boundary === "inactive") f.actor.active = false;
      if (boundary === "scene") f.deactivateScene();
      if (boundary === "dead") f.kill();
      if (boundary === "target") f.selected.active = false;
      const snapshot = { ...f.order.data },
        type = f.order.orderType;
      f.lookup.resolve(f.selected);
      expect(await pending).toBe(State.FAILED);
      expect(f.order.orderType).toBe(type);
      expect(f.order.data).toEqual(snapshot);
      expect(replacement.data.targetGameObject).toBe(f.actor);
      if (boundary !== "target") expect(f.gatherer.getNewResourceSource).not.toHaveBeenCalled();
    });

    it("retargets the unchanged live order", async () => {
      const f = fixture();
      const pending = f.resources[method]();
      f.lookup.resolve(f.selected);
      expect(await pending).toBe(State.SUCCEEDED);
      expect(f.order.data.targetGameObject).toBe(f.selected);
      expect(f.order.orderType).toBe(
        method === "AssignDropOffResourcesOrder" ? OrderType.ReturnResources : OrderType.Gather
      );
    });

    it("preserves lookup rejection", async () => {
      const f = fixture(),
        error = new Error("native lookup");
      f.gatherer.getPreferredResourceSource.mockRejectedValue(error);
      f.gatherer.getPreferredResourceDrain.mockRejectedValue(error);
      await expect(f.resources[method]()).rejects.toBe(error);
      expect(f.order.data.targetGameObject).toBe(f.oldTarget);
    });
  });

  it("revalidates after the fallback source lookup too", async () => {
    const f = fixture(),
      fallback = deferred<Phaser.GameObjects.GameObject>();
    f.gatherer.getNewResourceSource.mockImplementation(() => fallback.promise);
    const pending = f.resources.AcquireNewResourceSource();
    f.lookup.resolve(null);
    await Promise.resolve();
    expect(f.gatherer.getNewResourceSource).toHaveBeenCalledTimes(1);
    const replacement = new OrderData(OrderType.Stop);
    f.board.setCurrentOrder(replacement);
    fallback.resolve(f.selected);
    expect(await pending).toBe(State.FAILED);
    expect(f.order.data.targetGameObject).toBe(f.oldTarget);
    expect(replacement.data.targetGameObject).toBeUndefined();
  });

  it.each(invalidations)("does not admit extraction after range probe invalidation: %s", async (boundary) => {
    const f = fixture(),
      pending = f.resources.GatherResource();
    if (boundary === "replacement") f.board.setCurrentOrder(new OrderData(OrderType.Stop));
    if (boundary === "cancellation") f.board.resetCurrentOrder();
    if (boundary === "retarget") f.order.data.targetGameObject = f.selected;
    if (boundary === "type") f.order.orderType = OrderType.Stop;
    if (boundary === "inactive") f.actor.active = false;
    if (boundary === "scene") f.deactivateScene();
    if (boundary === "dead") f.kill();
    if (boundary === "target") f.oldTarget.active = false;
    f.range.resolve(State.SUCCEEDED);
    expect(await pending).toBe(State.FAILED);
    expect(f.gatherer.startGatheringResources).not.toHaveBeenCalled();
    expect(f.gatherer.gatherResources).not.toHaveBeenCalled();
  });

  it("admits extraction for the unchanged range probe", async () => {
    const f = fixture(),
      pending = f.resources.GatherResource();
    f.range.resolve(State.SUCCEEDED);
    expect(await pending).toBe(State.SUCCEEDED);
    expect(f.gatherer.startGatheringResources).toHaveBeenCalledWith(f.oldTarget);
    expect(f.gatherer.gatherResources).toHaveBeenCalledWith(f.oldTarget);
  });

  it("finishes an empty return when no source remains", async () => {
    const f = fixture();
    f.order.orderType = OrderType.ReturnResources;
    const pending = f.resources.AssignGatherResourcesOrder();
    f.lookup.resolve(null);
    expect(await pending).toBe(State.SUCCEEDED);
    expect(f.stop).toHaveBeenCalledWith("ReturnResources - No Resource Sources Exist");
    expect(f.board.getCurrentOrder()).toBeUndefined();
  });

  it("keeps a loaded return if source selection fails", async () => {
    const f = fixture();
    f.order.orderType = OrderType.ReturnResources;
    f.gatherer.isCarryingResources.mockReturnValue(true);
    const pending = f.resources.AssignGatherResourcesOrder();
    f.lookup.resolve(null);
    expect(await pending).toBe(State.FAILED);
    expect(f.stop).not.toHaveBeenCalled();
    expect(f.board.getCurrentOrder()).toBe(f.order);
  });

  it("replaces a destroyed remembered source before resuming an empty return", async () => {
    const f = fixture();
    f.order.orderType = OrderType.ReturnResources;
    f.selected.active = false;
    f.gatherer.getNewResourceSource.mockResolvedValue(f.oldTarget);
    const pending = f.resources.AssignGatherResourcesOrder();
    f.lookup.resolve(f.selected);
    expect(await pending).toBe(State.SUCCEEDED);
    expect(f.order.orderType).toBe(OrderType.Gather);
    expect(f.order.data.targetGameObject).toBe(f.oldTarget);
    expect(f.stop).not.toHaveBeenCalled();
  });

  it("retains delivery when cargo appears during source lookup", async () => {
    const f = fixture();
    f.order.orderType = OrderType.ReturnResources;
    const pending = f.resources.AssignGatherResourcesOrder();
    f.gatherer.isCarryingResources.mockReturnValue(true);
    f.lookup.resolve(f.selected);
    expect(await pending).toBe(State.FAILED);
    expect(f.order.orderType).toBe(OrderType.ReturnResources);
    expect(f.order.data.targetGameObject).toBe(f.oldTarget);
    expect(f.stop).not.toHaveBeenCalled();
  });

  it("does not finish a replacement order when fallback source selection returns late", async () => {
    const f = fixture(),
      fallback = deferred<Phaser.GameObjects.GameObject>();
    f.order.orderType = OrderType.ReturnResources;
    f.selected.active = false;
    f.gatherer.getNewResourceSource.mockImplementation(() => fallback.promise);
    const pending = f.resources.AssignGatherResourcesOrder();
    f.lookup.resolve(f.selected);
    await Promise.resolve();
    f.board.setCurrentOrder(new OrderData(OrderType.Move));
    fallback.resolve(f.selected);
    expect(await pending).toBe(State.FAILED);
    expect(f.stop).not.toHaveBeenCalled();
  });
});
