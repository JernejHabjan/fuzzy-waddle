import { QueueItemType, type UnifiedQueueItem } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { aiObservationQueueItemId } from "./ai-observation-queue-item-id";

it("retains shared command-backed queue identity after removal, saved cloning and changing lane indices", () => {
  const item: UnifiedQueueItem = { type: QueueItemType.Production, totalTime: 150, remainingTime: 100,
    commandContext: { playerNumber: 2, actorIds: ["producer"], execution: {
      schemaVersion: 1, source: "ai", commandId: "paid-command", commitmentKey: "paid-item", authorityEpoch: 0, sequence: 1
    } } };
  expect(aiObservationQueueItemId("producer", item, 1)).toBe("queue:producer:paid-command");
  expect(aiObservationQueueItemId("producer", structuredClone(item), 0)).toBe("queue:producer:paid-command");
  expect(aiObservationQueueItemId("other-producer", item, 0)).toBe("queue:other-producer:paid-command");
});

it("preserves the compatibility identity for legacy items without claiming durable lineage", () => {
  const legacy: UnifiedQueueItem = { type: QueueItemType.Research, totalTime: 100, remainingTime: 50 };
  expect(aiObservationQueueItemId("producer", legacy, 1)).toBe("producer:1:Research");
});
