import type { ProductionQueueItem } from "./game-object";
import type { UnifiedQueueItem } from "../queue/queue-item";

export type ProductionProgressEvent = {
  queueIndex: number;
  queueItemIndex: number;
  progressInPercentage: number;
};
export type ProductionQueueChangeEvent = {
  itemsFromAllQueues: UnifiedQueueItem[];
  type: "add" | "remove" | "completed";
};
