import type { QueueItemSnapshotData, SharedQueueSnapshotData } from "@fuzzy-waddle/probable-waffle-protocol";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  QueueItemType,
  type UnifiedQueueItem
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { SharedQueue } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/shared-queue";

/** Copy handles rather than definition lookups: a save must retain the paid policy even after balancing changes. */
export function snapshotSharedQueues(queues: readonly SharedQueue[]): SharedQueueSnapshotData {
  return {
    schemaVersion: 1,
    queues: queues.map((queue) =>
      queue.queuedItems.map((item): QueueItemSnapshotData => {
        const common = {
          totalTime: item.totalTime,
          remainingTime: item.remainingTime,
          commandContext: item.commandContext
        };
        if (item.type === QueueItemType.Production && item.productionData)
          return structuredClone({ ...common, type: "Production", productionData: item.productionData });
        if (item.type === QueueItemType.Research && item.researchData)
          return structuredClone({
            ...common,
            type: "Research",
            researchData: item.researchData,
            researchCost: item.researchCost
          });
        throw new Error("Cannot save an incomplete queue handle");
      })
    )
  };
}

/** Validate and build the whole replacement before changing live queues; never silently discard paid work. */
export function restoreSharedQueues(data: SharedQueueSnapshotData, laneCount: number, capacity: number): SharedQueue[] {
  if (data.schemaVersion !== 1 || data.queues.length !== laneCount) throw new Error("Incompatible queue snapshot");
  return data.queues.map((saved) => {
    if (saved.length > capacity) throw new Error("Queue snapshot exceeds capacity");
    const queue = new SharedQueue(capacity);
    queue.queuedItems = saved.map((item): UnifiedQueueItem => {
      if (
        !Number.isFinite(item.totalTime) ||
        item.totalTime < 0 ||
        !Number.isFinite(item.remainingTime) ||
        item.remainingTime < 0 ||
        item.remainingTime > item.totalTime
      )
        throw new Error("Invalid saved queue progress");
      const common = structuredClone({
        totalTime: item.totalTime,
        remainingTime: item.remainingTime,
        commandContext: item.commandContext
      });
      if (item.type === "Production") {
        const productionData = structuredClone(item.productionData);
        if (
          productionData.costData.costType !== PaymentType.PayImmediately &&
          productionData.costData.costType !== PaymentType.PayOverTime
        )
          throw new Error("Invalid saved queue payment");
        if (
          !validSavedCost(productionData.costData) ||
          !Number.isFinite(productionData.costData.productionTime) ||
          productionData.costData.productionTime < 0
        )
          throw new Error("Invalid saved queue cost");
        return { ...common, type: QueueItemType.Production, productionData };
      }
      if (item.type === "Research") {
        if (item.researchCost && !validSavedCost(item.researchCost)) throw new Error("Invalid saved queue cost");
        return {
          ...common,
          type: QueueItemType.Research,
          researchData: item.researchData,
          researchCost: item.researchCost ? structuredClone(item.researchCost) : undefined
        };
      }
      throw new Error("Invalid saved queue kind");
    });
    return queue;
  });
}

/** Reject malformed saved policies before replacement, so a later refund/payment cannot create invalid balances. */
function validSavedCost(cost: { resources: Partial<Record<ResourceType, number>>; refundFactor: number }): boolean {
  const known = new Set<string>(Object.values(ResourceType));
  return (
    Number.isFinite(cost.refundFactor) &&
    cost.refundFactor >= 0 &&
    Object.entries(cost.resources).every(([type, amount]) => known.has(type) && Number.isFinite(amount) && amount >= 0)
  );
}
