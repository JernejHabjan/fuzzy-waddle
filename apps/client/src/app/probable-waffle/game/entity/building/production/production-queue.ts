import { Warrior } from '../../assets/characters/warrior';
import { Worker } from '../../assets/characters/worker';
import { ProductionQueueItem } from './production-component';
import { ActorAbleToBeBuilt, ActorAbleToBeBuiltClass } from '../../actor/components/builder-component';

export type ActorAbleToBeProduced = Warrior | Worker;
export type ActorAbleToBeProducedClass = typeof Warrior | typeof Worker;

export type ActorAbleToBeCreated = ActorAbleToBeProduced | ActorAbleToBeBuilt;
export type ActorAbleToBeCreatedClass = ActorAbleToBeProducedClass | ActorAbleToBeBuiltClass;

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
