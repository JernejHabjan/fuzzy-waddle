import type Phaser from "phaser";
import { State } from "mistreevous";
import { PlayerPawnAiControllerAgent } from "./player-pawn-ai-controller.agent";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { OrderData } from "../../ai/OrderData";
import { OrderType } from "../../ai/order-type";
import { getActorComponent } from "../../data/actor-component";
import { getActorSystem } from "../../data/actor-system";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { AttackComponent } from "../../entity/components/combat/components/attack-component";
import { AnimationActorComponent } from "../../entity/components/animation/animation-actor-component";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../data/actor-system", () => ({ getActorSystem: jest.fn() }));
jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

function stampedOrder(commandId: string) {
  return new OrderData(OrderType.Move, { commandContext: {
    playerNumber: 1, actorIds: ["pawn:1"], execution: {
      schemaVersion: 1, source: "ai", commandId, commitmentKey: "move:1", authorityEpoch: 1, sequence: 1,
      intentId: "intent:1", effectId: "effect:1"
    }
  } });
}

describe("pawn terminal boundaries after owner extraction (unrun until final gate)", () => {
  beforeEach(() => jest.resetAllMocks());

  it("reports the original stamp after reset, then animates, cancels movement and pops the queue", () => {
    const events: string[] = [], blackboard = new PawnAiBlackboard();
    const actor = { scene: { sys: { isActive: () => true } } } as unknown as Phaser.GameObjects.GameObject;
    const agent = new PlayerPawnAiControllerAgent(actor, blackboard), order = stampedOrder("command:1");
    blackboard.addOrder(order); blackboard.setCurrentOrder(order);
    blackboard.currentOrderChanged.subscribe(() => { events.push("reset"); });
    jest.spyOn(blackboard, "popCurrentOrderFromQueue").mockImplementation(() => {
      events.push("pop"); blackboard.pullNextPlayerOrder();
    });
    const report = jest.fn(() => {
      expect(blackboard.getCurrentOrder()).toBeUndefined(); events.push("report");
    });
    jest.mocked(getActorComponent).mockImplementation((_actor, token) => token === IdComponent
      ? { id: "pawn:1" } as never : token === AttackComponent
        ? { cancelCurrentAttack: () => { events.push("attack"); } } as never : token === AnimationActorComponent
          ? { playOrderAnimation: () => { events.push("animation"); } } as never : undefined);
    jest.mocked(getActorSystem).mockReturnValue({ cancelMovement: () => { events.push("movement"); } } as never);
    jest.mocked(getSceneService).mockImplementation((_scene, token) => token === CommandBusService
      ? { reportPersistedOutcome: report } as never : token === SimulationTickService ? { currentTick: 7 } as never : undefined);
    expect(agent.Stop("Move - Reached Target")).toBe(State.SUCCEEDED);
    expect(events).toEqual(["attack", "reset", "report", "animation", "movement", "pop"]);
    expect(report).toHaveBeenCalledWith(expect.objectContaining({
      kind: "completed", reason: "applied", commandId: "command:1", tick: 7,
      intentId: "intent:1", effectId: "effect:1", actorIds: ["pawn:1"]
    }));
    expect(blackboard.anyOrderInQueue()).toBe(false);
  });

  it("shutdown deduplicates current/queued command identities and ignores inactive scenes", () => {
    const blackboard = new PawnAiBlackboard(), active = jest.fn(() => true);
    const actor = { scene: { sys: { isActive: active } } } as unknown as Phaser.GameObjects.GameObject;
    const agent = new PlayerPawnAiControllerAgent(actor, blackboard);
    const current = stampedOrder("command:1");
    blackboard.setCurrentOrder(current); blackboard.addOrder(current);
    blackboard.addOrder(stampedOrder("command:1")); blackboard.addOrder(stampedOrder("command:2"));
    blackboard.addOrder(new OrderData(OrderType.Stop));
    const report = jest.fn();
    jest.mocked(getActorComponent).mockImplementation((_actor, token) => token === IdComponent
      ? { id: "pawn:1" } as never : undefined);
    jest.mocked(getSceneService).mockImplementation((_scene, token) => token === CommandBusService
      ? { reportPersistedOutcome: report } as never : undefined);
    agent.reportInterruptedOrdersOnShutdown();
    expect(report).toHaveBeenCalledTimes(2);
    expect(report).toHaveBeenNthCalledWith(1, expect.objectContaining({ commandId: "command:1", kind: "failed" }));
    expect(report).toHaveBeenNthCalledWith(2, expect.objectContaining({ commandId: "command:2", kind: "failed" }));
    expect(blackboard.getCurrentOrder()).toBe(current);
    active.mockReturnValue(false); agent.reportInterruptedOrdersOnShutdown();
    expect(report).toHaveBeenCalledTimes(2);
  });
});
