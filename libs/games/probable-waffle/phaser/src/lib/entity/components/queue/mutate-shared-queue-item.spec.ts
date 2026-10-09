import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import Phaser from "phaser";
import { Subject } from "rxjs";
import {
  ObjectNames,
  ResearchType,
  type CancelProductionCommand,
  type CancelResearchCommand
} from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import {
  QueueItemType,
  type UnifiedQueueItem
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import type { ProductionComponent } from "../production/production-component";
import type { ResearchComponent } from "../research/research-component";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { QueueComponent } from "./queue-component";
import { QUEUE_MUTATION_EVENT, type QueueMutationEvent } from "./queue-mutation-event";
import { mutateSharedQueueItem } from "./mutate-shared-queue-item";

jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

function fixture(research = false) {
  const ticks = new Subject<number>();
  const log: string[] = [];
  jest
    .mocked(getSceneService)
    .mockImplementation((_scene, service) =>
      service === SimulationTickService
        ? ({ currentTick: 0, tick$: ticks } as never)
        : service === CommandBusService
          ? ({ reportPersistedOutcome: () => log.push("terminal") } as never)
          : undefined
    );
  const scene = { events: new Phaser.Events.EventEmitter(), sys: { isActive: () => true } };
  const actor = { scene, once: jest.fn(), emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
  const queue = new QueueComponent(actor, { queueCount: 2, capacityPerQueue: 3 });
  const item: UnifiedQueueItem = {
    type: research ? QueueItemType.Research : QueueItemType.Production,
    totalTime: 100,
    remainingTime: 100,
    commandContext: {
      playerNumber: 1,
      actorIds: ["producer"],
      execution: {
        schemaVersion: 1,
        commandId: "purchase",
        source: "ai",
        sequence: 1,
        authorityEpoch: 1,
        commitmentKey: "purchase"
      }
    },
    ...(research
      ? { researchData: ResearchType.TivaraMacemanUpgradeLevel2 }
      : {
          productionData: {
            actorName: ObjectNames.TivaraWorker,
            costData: {
              costType: PaymentType.PayImmediately,
              productionTime: 100,
              resources: { food: 7 },
              refundFactor: 1
            }
          }
        })
  };
  queue.registerProductionComponent({
    emitQueueChange: jest.fn(),
    emitProductionProgress: jest.fn(),
    handleProductionRefund: () => log.push("refund"),
    handleProductionComplete: async () => {
      log.push("spawn");
      return "created";
    }
  } as unknown as ProductionComponent);
  queue.registerResearchComponent({
    handleResearchRefund: () => log.push("refund"),
    handleResearchComplete: () => log.push("tech"),
    researchProgress: { emit: jest.fn() },
    researchCancelled: { emit: jest.fn() }
  } as unknown as ResearchComponent);
  const events: {
    phase: QueueMutationEvent["phase"];
    operation: QueueMutationEvent["operation"];
    present: boolean;
    queueIndex: number;
    itemIndex: number;
    sameHandle: boolean;
  }[] = [];
  scene.events.on(QUEUE_MUTATION_EVENT, (event: QueueMutationEvent) => {
    log.push(`${event.operation}:${event.phase}`);
    events.push({
      phase: event.phase,
      operation: event.operation,
      present: queue.allItems.includes(event.item),
      queueIndex: event.queueIndex,
      itemIndex: event.itemIndex,
      sameHandle: event.item === item
    });
  });
  queue.queueChangedObservable.subscribe(() => log.push("ui"));
  return { actor, queue, item, events, log, ticks };
}

describe("shared physical queue mutation authority", () => {
  it("reports the actual push before UI callbacks, then production removal before terminal/refund", () => {
    const f = fixture();
    f.queue.addItem(f.item);
    expect(f.log).toEqual(["enqueue:before", "enqueue:after", "ui"]);
    expect(f.events.map((event) => event.present)).toEqual([false, true]);
    const cancellation: CancelProductionCommand = {
      type: "CANCEL_PRODUCTION",
      tick: 0,
      playerNumber: 1,
      actorIds: ["producer"],
      queueIndex: 0
    };
    f.log.length = 0;
    const data = f.item.productionData;
    if (!data) throw new Error("production_missing");
    expect(f.queue.cancelProductionItem(data, cancellation)).toBe(true);
    expect(f.log).toEqual(["cancel_remove:before", "cancel_remove:after", "terminal", "refund", "ui"]);
    expect(f.events.slice(-2).map((event) => [event.present, event.sameHandle])).toEqual([
      [true, true],
      [false, true]
    ]);
    expect(f.queue.length).toBe(0);
  });

  it("research refunds before its actual splice and terminal callback", () => {
    const f = fixture(true);
    f.queue.addItem(f.item);
    f.log.length = 0;
    const cancellation: CancelResearchCommand = {
      type: "CANCEL_RESEARCH",
      tick: 0,
      playerNumber: 1,
      actorIds: ["producer"]
    };
    expect(f.queue.cancelResearchItem(cancellation)).toBe(true);
    expect(f.log).toEqual(["refund", "cancel_remove:before", "cancel_remove:after", "terminal", "ui"]);
    expect(f.events.slice(-2).map((event) => event.present)).toEqual([true, false]);
  });

  it("completion samples the consumed head before spawning/tech registration, preserving async outcome ordering", async () => {
    const f = fixture();
    f.queue.addItem(f.item);
    f.item.remainingTime = 50;
    f.log.length = 0;
    f.ticks.next(1);
    expect(f.item.remainingTime).toBe(0);
    expect(f.log).toEqual(["complete_remove:before", "complete_remove:after", "spawn"]);
    await Promise.resolve();
    expect(f.log).toEqual(["complete_remove:before", "complete_remove:after", "spawn", "terminal", "ui"]);
    const r = fixture(true);
    r.queue.addItem(r.item);
    r.item.remainingTime = 50;
    r.log.length = 0;
    r.ticks.next(1);
    expect(r.log).toEqual(["complete_remove:before", "complete_remove:after", "tech", "terminal", "ui"]);
  });

  it("records the actual selected lane/position and emits nothing for a nonexistent cancellation", () => {
    const f = fixture();
    requireAiTestEntry(f.queue.queues, 0).queuedItems.push({ ...f.item });
    f.queue.addItem(f.item);
    expect(requireAiTestEntry(f.events, 0)).toMatchObject({ queueIndex: 1, itemIndex: 0 });
    expect(f.queue.cancelResearchItem()).toBe(false);
    expect(f.events).toHaveLength(2);
  });

  it("listener-free mutation executes once; a throwing mutation propagates without an after callback", () => {
    const f = fixture();
    const scope = { producer: f.actor, item: f.item, queueIndex: 0, itemIndex: 0, operation: "enqueue" as const };
    const mutate = jest.fn();
    f.actor.scene.events.removeAllListeners(QUEUE_MUTATION_EVENT);
    mutateSharedQueueItem(scope, mutate);
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(f.events).toEqual([]);
    const phases: string[] = [];
    f.actor.scene.events.on(QUEUE_MUTATION_EVENT, (event: QueueMutationEvent) => phases.push(event.phase));
    expect(() =>
      mutateSharedQueueItem(scope, () => {
        throw new Error("physical");
      })
    ).toThrow("physical");
    expect(phases).toEqual(["before", "threw"]);
  });
});
