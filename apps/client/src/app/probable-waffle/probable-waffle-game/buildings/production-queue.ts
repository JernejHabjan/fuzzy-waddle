import { Warrior } from '../characters/warrior';
import { Barracks } from './barracks';
import { Worker } from '../characters/worker';
import { ProductionQueueItem } from './production-component';

export type ActorsAbleToBeProduced = Warrior | Worker | Barracks;
export type ActorsAbleToBeProducedClass = typeof Warrior | typeof Worker | typeof Barracks;

export class ProductionQueue {
  constructor(private capacityPerQueue: number) {}
  queuedActors: ProductionQueueItem[] = [];

  remainingProductionTime = 0;
  add(actor: ProductionQueueItem) {
    if (this.queuedActors.length >= this.capacityPerQueue) {
      throw new Error('Queue is full');
    }
    this.queuedActors.push(actor);
  }

  removeAt(index: number) {
    if (index < 0 || index >= this.queuedActors.length) {
      throw new Error('Index out of bounds');
    }
    this.queuedActors.splice(index, 1);
  }
}
