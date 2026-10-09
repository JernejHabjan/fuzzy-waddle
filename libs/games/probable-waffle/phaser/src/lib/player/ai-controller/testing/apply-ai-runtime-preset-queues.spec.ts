import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import Phaser from "phaser";
import { Subject } from "rxjs";
import {
  ObjectNames,
  ResearchType,
  ResourceType,
  ProbableWaffleGameCommandTypes,
  type GameCommand,
  type GameCommandInput,
  type GameCommandOutcome
} from "@fuzzy-waddle/probable-waffle-protocol";
import {
  QueueItemType,
  type UnifiedQueueItem
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { getPlayer } from "../../../data/scene-data";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import type { GameCommandDispatchReceipt } from "../../../world/services/multiplayer/command-bus.service";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { applyAiRuntimePresetQueues } from "./apply-ai-runtime-preset-queues";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ getPlayer: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

function setup(payment = PaymentType.PayImmediately) {
  const outcomes = new Subject<GameCommandOutcome>();
  const scene = { sys: { queueDepthSort: jest.fn() } } as unknown as ProbableWaffleScene;
  const actor = new Phaser.GameObjects.GameObject(scene, "preset-producer-fixture");
  const money: Record<ResourceType, number> = { food: 1000, wood: 1000, stone: 1000, minerals: 1000 };
  const items: UnifiedQueueItem[] = [];
  const cost = { costType: payment, productionTime: 150, refundFactor: 1, resources: { [ResourceType.Food]: 35 } };
  let sequence = 0;
  const dispatch = jest.fn((input: GameCommandInput): GameCommandDispatchReceipt => {
    const execution = {
      schemaVersion: 1 as const,
      commandId: `real:${sequence}`,
      commitmentKey: `seed:${sequence}`,
      source: "ai" as const,
      sequence: sequence++,
      authorityEpoch: 0
    };
    const command = { ...input, tick: 0, execution } satisfies GameCommand;
    const context = { execution, playerNumber: 2, actorIds: ["producer"] };
    let item: UnifiedQueueItem;
    if (input.type === ProbableWaffleGameCommandTypes.Production) {
      item = {
        type: QueueItemType.Production,
        productionData: { actorName: input.actorName, costData: cost },
        totalTime: 150,
        remainingTime: 150,
        commandContext: context
      };
      if (payment === PaymentType.PayImmediately) money.food -= 35;
    } else if (input.type === ProbableWaffleGameCommandTypes.Research) {
      const definition = researchDefinitions[input.researchType];
      item = {
        type: QueueItemType.Research,
        researchData: input.researchType,
        totalTime: definition.researchTime,
        remainingTime: definition.researchTime,
        commandContext: context
      };
      for (const resource of Object.values(ResourceType)) money[resource] -= definition.cost[resource] ?? 0;
    } else throw new Error("unexpected_test_command");
    items.push(item);
    outcomes.next({
      ...execution,
      schemaVersion: 1,
      kind: "applied",
      reason: "applied",
      tick: 0,
      playerNumber: 2,
      actorIds: ["producer"],
      worldLinkIds: []
    });
    return { status: "dispatched", command };
  });
  jest.mocked(getSceneService).mockReturnValue({ commandOutcome$: outcomes, dispatchDeterministic: dispatch } as never);
  jest.mocked(getPlayer).mockReturnValue({ getResources: () => money } as never);
  jest.mocked(getActorComponent).mockImplementation((_actor, component) => {
    if (component === IdComponent) return { id: "producer" } as never;
    if (component === OwnerComponent) return { getOwner: () => 2 } as never;
    if (component === QueueComponent)
      return {
        get allItems() {
          return items;
        }
      } as never;
    return undefined;
  });
  const preset: AiRuntimePresetWorldV1 = {
    fixtureId: "legal-queue-world",
    provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678" },
    actors: [],
    resourceGrants: [],
    queues: [{ producerFixtureActorId: "producer-fixture", actorName: ObjectNames.TivaraWorker, count: 2 }]
  };
  const actors = new Map([["producer-fixture", actor]]);
  return { scene, actor, money, items, outcomes, dispatch, preset, actors };
}

describe("applyAiRuntimePresetQueues command/application boundary", () => {
  it("samples each paid command once and keeps exact item identities across repeated seeds on one producer", () => {
    const f = setup();
    const result = applyAiRuntimePresetQueues(f.scene, f.preset, f.actors);
    expect(f.dispatch).toHaveBeenCalledTimes(2);
    expect(result.initialQueueItems.map((item) => item.itemId)).toEqual([
      "queue:producer:real:0",
      "queue:producer:real:1"
    ]);
    expect(result.queueApplications.map((entry) => [entry.resourcesBefore.food, entry.resourcesAfter.food])).toEqual([
      [1000, 965],
      [965, 930]
    ]);
    f.money.food = 0;
    f.items.splice(0, 1);
    expect(requireAiTestEntry(result.queueApplications, 1).resourcesAfter.food).toBe(930);
    expect(result.initialQueueItems).toHaveLength(2);
    expect(f.outcomes.observed).toBe(false);
  });

  it("admits production before priced research through the same command boundary, leaving per-tick cash unpaid", () => {
    const f = setup(PaymentType.PayOverTime);
    const preset = {
      ...f.preset,
      researchQueues: [
        { producerFixtureActorId: "producer-fixture", researchType: ResearchType.TivaraMacemanUpgradeLevel2 }
      ]
    } satisfies AiRuntimePresetWorldV1;
    const result = applyAiRuntimePresetQueues(f.scene, preset, f.actors);
    expect(result.queueApplications.map((entry) => entry.command.type)).toEqual([
      "PRODUCTION",
      "PRODUCTION",
      "RESEARCH"
    ]);
    expect(requireAiTestEntry(result.queueApplications, 0).resourcesAfter.food).toBe(1000);
    expect(requireAiTestEntry(result.initialQueueItems, 2).researchType).toBe(ResearchType.TivaraMacemanUpgradeLevel2);
  });

  it("rejects dispatch-only success, unrelated outcomes and a different item command identity", () => {
    for (const fault of ["no-item", "no-outcome", "wrong-command", "wrong-product"]) {
      const f = setup();
      const normal = f.dispatch.getMockImplementation();
      f.dispatch.mockImplementation((input) => {
        if (!normal) throw new Error("test_dispatch_missing");
        const receipt = normal(input);
        if (fault === "no-item") f.items.length = 0;
        if (fault === "wrong-command") {
          const item = requireAiTestEntry(f.items, 0);
          const context = item.commandContext;
          if (!context) throw new Error("synthetic_queue_context_missing");
          item.commandContext = {
            ...context,
            execution: { ...context.execution, commandId: "unrelated" }
          };
        }
        if (fault === "wrong-product") {
          const item = requireAiTestEntry(f.items, 0);
          if (!item.productionData) throw new Error("synthetic_queue_product_missing");
          item.productionData = {
            ...item.productionData,
            actorName: ObjectNames.Tree1
          };
        }
        return receipt;
      });
      if (fault === "no-outcome")
        jest
          .mocked(getSceneService)
          .mockReturnValue({ commandOutcome$: new Subject(), dispatchDeterministic: f.dispatch } as never);
      expect(() => applyAiRuntimePresetQueues(f.scene, f.preset, f.actors)).toThrow("runtime_preset_queue_not_applied");
      expect(f.outcomes.observed).toBe(false);
    }
  });

  it("fails on normal admission rejection or application exceptions and always drops its temporary subscriber", () => {
    const f = setup();
    f.dispatch.mockReturnValue({ status: "rejected", reason: "insufficient_resources" });
    expect(() => applyAiRuntimePresetQueues(f.scene, f.preset, f.actors)).toThrow(
      "runtime_preset_queue_dispatch_rejected"
    );
    expect(f.outcomes.observed).toBe(false);
    f.dispatch.mockImplementation(() => {
      throw new Error("shared_application_failure");
    });
    expect(() => applyAiRuntimePresetQueues(f.scene, f.preset, f.actors)).toThrow("shared_application_failure");
    expect(f.outcomes.observed).toBe(false);
  });

  it("rejects missing authority and free/wrongly charged items instead of injecting resources or creating a queue", () => {
    const f = setup();
    const normal = f.dispatch.getMockImplementation();
    f.dispatch.mockImplementation((input) => {
      if (!normal) throw new Error("test_dispatch_missing");
      const receipt = normal(input);
      f.money.food += 35;
      return receipt;
    });
    expect(() => applyAiRuntimePresetQueues(f.scene, f.preset, f.actors)).toThrow(
      "runtime_preset_queue_payment_mismatch"
    );
    f.actor.active = false;
    expect(() => applyAiRuntimePresetQueues(f.scene, f.preset, f.actors)).toThrow(
      "runtime_preset_queue_authority_missing"
    );
  });
});
