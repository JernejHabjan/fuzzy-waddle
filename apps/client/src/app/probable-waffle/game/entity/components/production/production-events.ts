import type { ProductionQueueItem } from "./game-object";

export type ProductionProgressEvent = {
  queueIndex: number;
  queueItemIndex: number;
  progressInPercentage: number;
};
export type ProductionQueueChangeEvent = {
  itemsFromAllQueues: ProductionQueueItem[];
  type: "add" | "remove" | "completed";
};
