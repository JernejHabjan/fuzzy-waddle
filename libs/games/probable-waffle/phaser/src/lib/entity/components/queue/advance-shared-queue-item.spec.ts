import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import Phaser from "phaser";
import { Subject } from "rxjs";
import {
  QueueItemType,
  type UnifiedQueueItem
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { QueueComponent } from "./queue-component";
import { QUEUE_PROGRESS_EVENT, type QueueProgressEvent } from "./queue-progress-event";
import { advanceSharedQueueItem } from "./advance-shared-queue-item";
import type { ProductionComponent } from "../production/production-component";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";

jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

function fixture(remainingTime = 100) {
  const ticks = new Subject<number>();
  jest
    .mocked(getSceneService)
    .mockImplementation((_scene, service) =>
      service === SimulationTickService ? ({ tick$: ticks } as never) : undefined
    );
  const scene = { events: new Phaser.Events.EventEmitter(), sys: { isActive: () => true } };
  const actor = { scene, once: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
  const queue = new QueueComponent(actor, { queueCount: 1, capacityPerQueue: 2 });
  const item = {
    type: QueueItemType.Production,
    totalTime: 100,
    remainingTime,
    productionData: {
      actorName: ObjectNames.TivaraWorker,
      costData: { costType: PaymentType.PayOverTime, productionTime: 100, resources: { food: 7 }, refundFactor: 1 }
    }
  } satisfies UnifiedQueueItem;
  requireAiTestEntry(queue.queues, 0).queuedItems.push(item);
  const log: string[] = [];
  const pay = jest.fn(() => {
    log.push(`pay:${item.remainingTime}`);
    return true;
  });
  queue.registerProductionComponent({
    handlePayOverTimePayment: pay,
    emitQueueChange: jest.fn(),
    emitProductionProgress: () => log.push(`ui:${item.remainingTime}`),
    handleProductionComplete: jest.fn(async () => null)
  } as unknown as ProductionComponent);
  const events: { phase: QueueProgressEvent["phase"]; remaining: number; present: boolean }[] = [];
  scene.events.on(QUEUE_PROGRESS_EVENT, (event: QueueProgressEvent) => {
    log.push(`${event.phase}:${item.remainingTime}`);
    events.push({
      phase: event.phase,
      remaining: event.item.remainingTime,
      present: queue.allItems.includes(event.item)
    });
  });
  return { ticks, actor, queue, item, pay, log, events };
}

describe("shared queue progress authority", () => {
  it("the actual fixed-tick processor emits after decrement and before UI progress/completion", () => {
    const f = fixture();
    f.ticks.next(1);
    expect(f.log).toEqual(["started:100", "pay:100", "advanced:50", "ui:50"]);
    f.log.length = 0;
    f.ticks.next(2);
    expect(f.log).toEqual(["started:50", "pay:50", "advanced:0", "ui:0"]);
    expect(f.events.at(-1)).toEqual({ phase: "advanced", remaining: 0, present: true });
    expect(f.queue.allItems).toEqual([]);
  });

  it("denied payment preserves the head and progress; an emitter exception propagates before mutation", () => {
    const f = fixture();
    f.pay.mockReturnValue(false);
    f.ticks.next(1);
    expect(f.item.remainingTime).toBe(100);
    expect(f.events.map((event) => event.phase)).toEqual(["started", "denied"]);
    expect(() =>
      advanceSharedQueueItem(f.actor, f.item, 50, () => {
        throw new Error("emitter");
      })
    ).toThrow("emitter");
    expect(f.item.remainingTime).toBe(100);
    expect(f.events.at(-1)?.phase).toBe("threw");
  });

  it("the listener-free path still calls payment once and charges an unprocessed zero-time head once", () => {
    const f = fixture(0);
    f.actor.scene.events.removeAllListeners(QUEUE_PROGRESS_EVENT);
    expect(advanceSharedQueueItem(f.actor, f.item, 50, f.pay)).toBe(true);
    expect(f.pay).toHaveBeenCalledTimes(1);
    expect(f.item.remainingTime).toBe(0);
    expect(f.events).toEqual([]);
  });
});
