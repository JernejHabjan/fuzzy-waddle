import { type ProductionQueueItem } from "./production-component";

export class ProductionQueue {
  queuedItems: ProductionQueueItem[] = [];
  remainingProductionTime = 0;

  constructor(private capacityPerQueue: number) {}

  add(actor: ProductionQueueItem) {
    if (this.queuedItems.length >= this.capacityPerQueue) {
      throw new Error("Queue is full");
    }
    this.queuedItems.push(actor);
  }

  removeAt(index: number) {
    if (index < 0 || index >= this.queuedItems.length) {
      throw new Error("Index out of bounds");
    }
    this.queuedItems.splice(index, 1);
  }
}
