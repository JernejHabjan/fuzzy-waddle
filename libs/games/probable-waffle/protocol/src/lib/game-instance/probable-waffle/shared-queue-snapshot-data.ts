import type { QueueItemSnapshotData } from "./queue-item-snapshot-data";

/** One authoritative mixed-work snapshot. Empty lanes, lane order and zero remaining work are significant. */
export interface SharedQueueSnapshotData {
  schemaVersion: 1;
  queues: QueueItemSnapshotData[][];
}
