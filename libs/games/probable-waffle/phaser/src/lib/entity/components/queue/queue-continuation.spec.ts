import Phaser from "phaser";
import { Subject } from "rxjs";
import { ObjectNames, ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  QueueItemType,
  type UnifiedQueueItem
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { CommandBusService } from "../../../world/services/multiplayer/command-bus.service";
import type { ProductionComponent } from "../production/production-component";
import type { ResearchComponent } from "../research/research-component";
import { QueueComponent } from "./queue-component";
import { serializeActorQueueState } from "../../../world/services/recovery/serialize-actor-queue-state";

jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../data/actor-component", () => ({ getActorComponent: () => undefined }));

function production(id = "purchase", remainingTime = 100): UnifiedQueueItem {
  return {
    type: QueueItemType.Production,
    totalTime: 100,
    remainingTime,
    productionData: {
      actorName: ObjectNames.TivaraWorker,
      costData: {
        costType: PaymentType.PayImmediately,
        productionTime: 100,
        resources: { food: 37 },
        refundFactor: 0.5
      }
    },
    commandContext: {
      playerNumber: 1,
      actorIds: ["factory"],
      execution: {
        schemaVersion: 1,
        commandId: id,
        commitmentKey: id,
        source: "ai",
        authorityEpoch: 1,
        sequence: 1
      }
    }
  };
}
function research(remainingTime = 100): UnifiedQueueItem {
  return { type: QueueItemType.Research, researchData: ResearchType.SnowstormSpell, totalTime: 100, remainingTime };
}

/** Real queue owner with controlled completion/refund delegates; no sockets or browser acceptance implied. */
function setup(lanes = 1) {
  jest.clearAllMocks();
  const tick$ = new Subject<number>();
  const scene = { events: new Phaser.Events.EventEmitter(), sys: { isActive: () => true } } as unknown as Phaser.Scene;
  const actor = Object.assign(new Phaser.Events.EventEmitter(), { scene }) as unknown as Phaser.GameObjects.GameObject;
  const reportPersistedOutcome = jest.fn();
  jest.mocked(getSceneService).mockImplementation((_scene, service) => {
    if (service === SimulationTickService) return { tick$, currentTick: 1 } as never;
    if (service === CommandBusService) return { reportPersistedOutcome } as never;
    return undefined;
  });
  const queue = new QueueComponent(actor, { queueCount: lanes, capacityPerQueue: 5 });
  const output = jest.fn(() => "unit");
  const refund = jest.fn();
  const progress = jest.fn();
  queue.registerProductionComponent({
    handleProductionComplete: output,
    handleProductionRefund: refund,
    emitProductionProgress: progress,
    emitQueueChange: jest.fn(),
    handlePayOverTimePayment: () => true
  } as unknown as ProductionComponent);
  const finishResearch = jest.fn();
  const refundResearch = jest.fn();
  queue.registerResearchComponent({
    handleResearchComplete: finishResearch,
    handleResearchRefund: refundResearch,
    researchProgress: { emit: jest.fn() },
    researchCancelled: { emit: jest.fn() }
  } as unknown as ResearchComponent);
  return {
    queue,
    actor,
    scene,
    tick$,
    output,
    refund,
    progress,
    finishResearch,
    refundResearch,
    reportPersistedOutcome
  };
}

describe("shared paid-work continuation", () => {
  it("finishes restored over-time work at zero without charging another installment", async () => {
    const f = setup();
    const item = production("paid", 0);
    if (!item.productionData) throw new Error("production_data_missing");
    item.productionData.costData = { ...item.productionData.costData, costType: PaymentType.PayOverTime };
    const pay = jest.fn(() => true);
    f.queue.registerProductionComponent({
      handlePayOverTimePayment: pay,
      handleProductionComplete: f.output,
      emitProductionProgress: jest.fn(),
      emitQueueChange: jest.fn()
    } as unknown as ProductionComponent);
    f.queue.addItem(item);
    f.queue.setSnapshotData(f.queue.getSnapshotData());
    f.tick$.next(1);
    await Promise.resolve();
    expect(pay).not.toHaveBeenCalled();
    expect(f.output).toHaveBeenCalledTimes(1);
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it("repeated legacy type restores replace that work and retain the other queue kind, including an empty restore", () => {
    const f = setup();
    f.queue.addItem(production());
    f.queue.replaceLegacyItems(QueueItemType.Research, [research(0)]);
    f.queue.replaceLegacyItems(QueueItemType.Research, [research(0)]);
    expect(f.queue.length).toBe(2);
    expect(f.queue.allItems[1]?.remainingTime).toBe(0);
    f.queue.replaceLegacyItems(QueueItemType.Research, []);
    expect(f.queue.allItems.map((item) => item.type)).toEqual([QueueItemType.Production]);
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });
  it("preserves every mixed lane, empty lane, original price, zero progress and command identity without aliasing", () => {
    const f = setup(3);
    f.queue.queues[0]?.queuedItems.push(research(30), production("queued", 100));
    f.queue.queues[2]?.queuedItems.push(production("ready", 0));
    const saved = f.queue.getSnapshotData();
    f.queue.setSnapshotData(saved);
    expect(f.queue.getSnapshotData()).toEqual(saved);
    const restored = f.queue.queues[2]?.queuedItems[0];
    expect(restored?.remainingTime).toBe(0);
    expect(restored?.commandContext?.execution.commandId).toBe("ready");
    expect(restored?.productionData?.costData.resources).toEqual({ food: 37 });
    saved.queues[2]?.splice(0, 1);
    expect(f.queue.queues[2]?.queuedItems).toHaveLength(1);
    expect(f.output).not.toHaveBeenCalled();
    expect(f.refund).not.toHaveBeenCalled();
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it("resumes ready production and research once without recharging or restarting a zero-time head", async () => {
    const f = setup(2);
    f.queue.addItem(production("ready", 0));
    f.queue.addItem(research(0));
    f.queue.setSnapshotData(f.queue.getSnapshotData());
    f.tick$.next(1);
    await Promise.resolve();
    f.tick$.next(2);
    expect(f.output).toHaveBeenCalledTimes(1);
    expect(f.finishResearch).toHaveBeenCalledTimes(1);
    expect(f.queue.length).toBe(0);
    expect(f.reportPersistedOutcome).toHaveBeenCalledWith(
      expect.objectContaining({ commandId: "ready", kind: "completed" })
    );
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it("rejects an invalid replacement atomically instead of losing already-paid work", () => {
    const f = setup();
    f.queue.addItem(production());
    const saved = f.queue.getSnapshotData();
    expect(() => f.queue.setSnapshotData({ schemaVersion: 1, queues: [] })).toThrow("Incompatible");
    expect(() =>
      f.queue.setSnapshotData({ schemaVersion: 1, queues: [[{ ...research(), remainingTime: -1 } as never]] })
    ).toThrow("progress");
    expect(f.queue.getSnapshotData()).toEqual(saved);
    const invalidCost = f.queue.getSnapshotData();
    const first = invalidCost.queues[0]?.[0];
    if (!first || first.type !== "Production") throw new Error("paid_handle_missing");
    first.productionData.costData.resources.food = -1;
    expect(() => f.queue.setSnapshotData(invalidCost)).toThrow("cost");
    expect(f.queue.getSnapshotData()).toEqual(saved);
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it("removes research before its refund and rejects nested cancellation of the same or next paid item", () => {
    const f = setup();
    f.queue.addItem(research());
    f.queue.addItem(research());
    f.refundResearch.mockImplementation(() => {
      expect(f.queue.length).toBe(1);
      expect(f.queue.cancelResearchItem()).toBe(false);
    });
    expect(f.queue.cancelResearchItem()).toBe(true);
    expect(f.refundResearch).toHaveBeenCalledTimes(1);
    expect(f.queue.length).toBe(1);
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it("does not replay a throwing research refund", () => {
    const f = setup();
    f.queue.addItem(research());
    f.refundResearch.mockImplementation(() => {
      throw new Error("refund_failed");
    });
    expect(() => f.queue.cancelResearchItem()).toThrow("refund_failed");
    expect(f.queue.cancelResearchItem()).toBe(false);
    expect(f.refundResearch).toHaveBeenCalledTimes(1);
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it("does not complete the next unit when a progress callback cancels the finishing head", () => {
    const f = setup();
    const first = production("first", 50);
    f.queue.addItem(first);
    f.queue.addItem(production("next", 100));
    f.progress.mockImplementationOnce(() => {
      if (first.productionData) f.queue.cancelProductionItem(first.productionData);
    });
    f.tick$.next(1);
    expect(f.output).not.toHaveBeenCalled();
    expect(f.queue.allItems[0]?.remainingTime).toBe(100);
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it.each(["restore", "shutdown"])(
    "ignores the old terminal result when its native completion callback performs %s",
    (boundary) => {
      const f = setup();
      f.output.mockImplementationOnce(() => {
        if (boundary === "restore") f.queue.setSnapshotData({ schemaVersion: 1, queues: [[]] });
        else f.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
        return "old-unit";
      });
      f.queue.addItem(production("old", 50));
      f.tick$.next(1);
      expect(f.reportPersistedOutcome).not.toHaveBeenCalledWith(expect.objectContaining({ kind: "completed" }));
      f.actor.emit(Phaser.GameObjects.Events.DESTROY);
    }
  );

  it("settles unit output and command completion before the simulation tick returns to a save capture", () => {
    const f = setup();
    f.queue.addItem(production("finish-before-save", 50));
    f.tick$.next(1);
    expect(f.output).toHaveBeenCalledTimes(1);
    expect(f.queue.getSnapshotData().queues).toEqual([[]]);
    expect(f.reportPersistedOutcome).toHaveBeenCalledWith(
      expect.objectContaining({
        commandId: "finish-before-save",
        kind: "completed",
        worldLinkIds: ["unit"]
      })
    );
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it("shuts down listeners and rejects stale enqueue/restore before a fresh owner starts", () => {
    const f = setup();
    f.queue.addItem(production());
    f.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
    expect(f.tick$.observed).toBe(false);
    expect(f.queue.length).toBe(0);
    expect(f.scene.events.listenerCount(Phaser.Scenes.Events.SHUTDOWN)).toBe(0);
    expect(() => f.queue.addItem(production())).toThrow("disposed");
    f.queue.setSnapshotData({ schemaVersion: 1, queues: [[{ ...production() } as never]] });
    expect(f.queue.length).toBe(0);
    const fresh = setup();
    fresh.queue.addItem(production("new"));
    expect(fresh.queue.length).toBe(1);
    expect(f.queue.length).toBe(0);
    fresh.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });
});

describe("queue completion boundaries", () => {
  it("reports finite completed progress for zero-duration work", () => {
    const f = setup();
    f.queue.addItem({ ...production("instant", 0), totalTime: 0 });
    expect(f.queue.getQueueProgress(f.queue.queues[0]!)).toBe(100);
    f.tick$.next(1);
    expect(f.progress).toHaveBeenCalledWith(expect.objectContaining({ progressInPercentage: 100 }));
    expect(f.output).toHaveBeenCalledTimes(1);
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });

  it("does not report old research completion after a synchronous restore", () => {
    const f = setup();
    f.finishResearch.mockImplementationOnce(() => f.queue.setSnapshotData({ schemaVersion: 1, queues: [[]] }));
    f.queue.addItem({ ...research(0), commandContext: production("old-research").commandContext });
    f.tick$.next(1);
    expect(f.finishResearch).toHaveBeenCalledTimes(1);
    expect(f.reportPersistedOutcome).not.toHaveBeenCalledWith(expect.objectContaining({ kind: "completed" }));
    f.actor.emit(Phaser.GameObjects.Events.DESTROY);
  });
});

describe("mixed-lane snapshot replay", () => {
  it.each([0, 1, 3])("keeps mixed-lane hashes, effects and output counts equal after a safe restore at tick %s", (restoreTick) => {
    const run = (restore: boolean) => {
      const f = setup(3);
      f.queue.queues[0]?.queuedItems.push(production("first", 75), {
        ...research(150), researchCost: { resources: { minerals: 19 }, refundFactor: 0.25 }
      });
      f.queue.queues[2]?.queuedItems.push(production("ready", 0));
      const states = [];
      for (let tick = 0; tick <= 10; tick++) {
        if (tick > 0) f.tick$.next(tick);
        if (restore && tick === restoreTick) f.queue.setSnapshotData(f.queue.getSnapshotData());
        states.push({
          tick, hash: serializeActorQueueState({ sharedQueue: f.queue.getSnapshotData() }),
          produced: f.output.mock.calls.length, researched: f.finishResearch.mock.calls.length,
          outcomes: structuredClone(f.reportPersistedOutcome.mock.calls)
        });
      }
      const finished = { states, produced: f.output.mock.calls.length, researched: f.finishResearch.mock.calls.length };
      f.actor.emit(Phaser.GameObjects.Events.DESTROY);
      return finished;
    };
    const uninterrupted = run(false);
    const restored = run(true);
    expect(restored).toEqual(uninterrupted);
    expect(restored.produced).toBe(2);
    expect(restored.researched).toBe(1);
  });

});
