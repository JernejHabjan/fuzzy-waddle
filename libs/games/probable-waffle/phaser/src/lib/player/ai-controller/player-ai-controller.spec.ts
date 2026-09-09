import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { OrderType } from "../../ai/order-type";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { PlayerAiController } from "./player-ai-controller";

jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

const baseIntent = {
  intentId: "intent:test",
  effectId: "effect:test",
  planId: "plan:opening",
  demandId: null,
  lane: "essential_economy",
  proposedTick: 20,
  urgencyClass: 0,
  utility: 900,
  preconditions: [],
  claims: [],
  reasonCode: "test"
} as const;

describe("PlayerAiController pure planner integration", () => {
  afterEach(() => jest.clearAllMocks());

  it("runs only the pure planner when the skirmish brain is available", () => {
    const controller = Object.create(PlayerAiController.prototype) as PlayerAiController;
    const pureStep = jest.fn();
    const legacyStep = jest.fn();
    Reflect.set(controller, "pureBrain", {});
    Reflect.set(controller, "stepPureBrain", pureStep);
    Reflect.set(controller, "behaviourTree", { step: legacyStep });
    Reflect.set(controller, "telemetry", { withSpan: (_name: string, action: () => void) => action() });

    invokeDecisionPlanner(controller);

    expect(pureStep).toHaveBeenCalledTimes(1);
    expect(legacyStep).not.toHaveBeenCalled();
  });

  it("keeps the legacy behavior tree as a fallback when no profile can create a pure brain", () => {
    const controller = Object.create(PlayerAiController.prototype) as PlayerAiController;
    const pureStep = jest.fn();
    const legacyStep = jest.fn();
    Reflect.set(controller, "pureBrain", undefined);
    Reflect.set(controller, "stepPureBrain", pureStep);
    Reflect.set(controller, "behaviourTree", { step: legacyStep });
    Reflect.set(controller, "telemetry", { withSpan: (_name: string, action: () => void) => action() });

    invokeDecisionPlanner(controller);

    expect(pureStep).not.toHaveBeenCalled();
    expect(legacyStep).toHaveBeenCalledTimes(1);
  });

  it("dispatches gather, tend and stop intents through shared command authority", () => {
    const actors = new Map([
      ["worker", {}],
      ["source", {}],
      ["field", {}]
    ]);
    const actorIndex = {
      getActorById: (actorId: string) => actors.get(actorId),
      getActorsByIds: (actorIds: readonly string[]) => actorIds.map((actorId) => actors.get(actorId)).filter(Boolean)
    };
    const dispatchAi = jest.fn();
    jest.mocked(getSceneService).mockImplementation((_scene, service) => {
      if (service === ActorIndexSystem) return actorIndex as never;
      if (service === CommandBusService) return { dispatchAi } as never;
      return undefined;
    });
    const controller = Object.create(PlayerAiController.prototype) as PlayerAiController;
    Reflect.set(controller, "scene", {});
    Reflect.set(controller, "player", { playerNumber: 1 });

    invokeDispatch(controller, [
      {
        ...baseIntent,
        kind: "assign_gatherers",
        actorIds: ["worker"],
        resourceType: ResourceType.Wood,
        sourceActorId: "source"
      },
      {
        ...baseIntent,
        intentId: "intent:tend",
        effectId: "effect:tend",
        kind: "tend",
        actorIds: ["worker"],
        targetActorId: "field"
      },
      {
        ...baseIntent,
        intentId: "intent:stop",
        effectId: "effect:stop",
        kind: "stop",
        actorIds: ["worker"]
      }
    ] as AiIntentV1[]);

    expect(dispatchAi).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "ACTOR_ACTION",
        orderType: OrderType.Gather,
        actorIds: ["worker"],
        targetObjectIds: ["source"]
      }),
      expect.any(Object)
    );
    expect(dispatchAi).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ orderType: OrderType.Gather, targetObjectIds: ["field"] }),
      expect.any(Object)
    );
    expect(dispatchAi).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ type: "STOP", actorIds: ["worker"] }),
      expect.any(Object)
    );
  });
});

function invokeDecisionPlanner(controller: PlayerAiController): void {
  (controller as unknown as { stepDecisionPlanner(): void }).stepDecisionPlanner();
}

function invokeDispatch(controller: PlayerAiController, intents: readonly AiIntentV1[]): void {
  (controller as unknown as { dispatchAcceptedIntents(values: readonly AiIntentV1[]): void }).dispatchAcceptedIntents(
    intents
  );
}
