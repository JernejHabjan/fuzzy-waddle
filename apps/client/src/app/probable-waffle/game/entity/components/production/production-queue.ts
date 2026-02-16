import type { ProductionQueueItem } from "./game-object";
import type { UnifiedQueueItem } from "../queue/queue-item";

export class ProductionQueue {
  queuedItems: UnifiedQueueItem[] = [];
  remainingProductionTime = 0;

  constructor(private capacityPerQueue: number) {}

  add(item: UnifiedQueueItem) {
    if (this.queuedItems.length >= this.capacityPerQueue) {
      throw new Error("Queue is full");
    }
    this.queuedItems.push(item);
  }

  removeAt(index: number) {
    if (index < 0 || index >= this.queuedItems.length) {
      throw new Error("Index out of bounds");
    }
    this.queuedItems.splice(index, 1);
  }
}
