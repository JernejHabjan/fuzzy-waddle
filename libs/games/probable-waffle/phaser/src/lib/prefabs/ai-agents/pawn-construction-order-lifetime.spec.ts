import type Phaser from "phaser";
import { State } from "mistreevous";
import { PawnAgentConstruction } from "./pawn-agent-construction";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { BuilderComponent } from "../../entity/components/construction/builder-component";
import { getActorComponent } from "../../data/actor-component";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));

function fixture() {
  let resolve!: (target: Phaser.GameObjects.GameObject | null) => void;
  const result = new Promise<Phaser.GameObjects.GameObject | null>((release) => {
    resolve = release;
  });
  const scene = { sys: { isActive: () => true } } as unknown as Phaser.Scene;
  const actor = { active: true, scene } as Phaser.GameObjects.GameObject;
  const target = { active: true, scene } as Phaser.GameObjects.GameObject;
  const board = new PawnAiBlackboard();
  const builder = { getConstructionSeekRange: () => 10, getClosestConstructionSite: () => result };
  jest
    .mocked(getActorComponent)
    .mockImplementation((_actor, component) => (component === BuilderComponent ? (builder as never) : undefined));
  const agent = new PawnAgentConstruction(actor, board, { SelfIsAlive: () => true });
  return { actor, target, board, agent, resolve };
}

describe("native construction lookup ownership", () => {
  beforeEach(() => jest.resetAllMocks());

  it.each(["replace", "cancel", "restore", "queued", "teardown", "target"] as const)(
    "discards lookup after %s",
    async (boundary) => {
      const f = fixture();
      const pending = f.agent.AssignNextBuildOrder();
      const replacement = new OrderData(OrderType.Move);
      if (boundary === "replace") f.board.overrideOrderQueueAndActiveOrder(replacement);
      if (boundary === "cancel") f.board.resetCurrentOrder();
      if (boundary === "restore") f.board.setData({ currentOrder: null }, f.actor.scene);
      if (boundary === "queued") f.board.addOrder(replacement);
      if (boundary === "teardown") f.actor.active = false;
      if (boundary === "target") f.target.active = false;
      f.resolve(f.target);
      expect(await pending).toBe(State.FAILED);
      expect(f.board.getQueuedOrders().some((order) => order.orderType === OrderType.Build)).toBe(false);
      if (boundary === "replace" || boundary === "queued") expect(f.board.peekNextPlayerOrder()).toBe(replacement);
    }
  );

  it("queues a real build when the requesting lifetime remains current", async () => {
    const f = fixture();
    const pending = f.agent.AssignNextBuildOrder();
    f.resolve(f.target);
    expect(await pending).toBe(State.SUCCEEDED);
    expect(f.board.peekNextPlayerOrder()).toMatchObject({
      orderType: OrderType.Build,
      data: { targetGameObject: f.target }
    });
  });
});
