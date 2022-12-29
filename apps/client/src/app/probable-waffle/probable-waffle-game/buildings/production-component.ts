import { IComponent } from '../services/component.service';
import { RallyPoint } from '../rally-point';
import { ActorsAbleToBeProduced, ProductionQueue } from './production-queue';

export interface Producer {
  productionComponent: ProductionComponent;
}

export class ProductionComponent implements IComponent {
  productionQueues: ProductionQueue[] = [];
  rallyPoint?: RallyPoint;

  constructor(
    private readonly scene: Phaser.Scene,
    public availableProductActorClasses: ActorsAbleToBeProduced[],
    // How many products can be produced simultaneously - for example 2 marines (SC2)
    private queueCount: number,
    private capacityPerQueue: number
  ) {}

  init() {
    // setup queues
    for (let i = 0; i < this.queueCount; i++) {
      this.productionQueues.push(new ProductionQueue(this.capacityPerQueue));
    }
  }

  update(time: number, delta: number): void {
    // process all queues
    for (let i = 0; i < this.productionQueues.length; i++) {
      const queue = this.productionQueues[i];
      if (queue.queuedActors.length <= 0) {
        continue;
      }

      for (let j = 0; j < queue.queuedActors.length; j++) {
        const actorClass = queue.queuedActors[j];

        const tempActor = new actorClass(this.scene, { tileXY: { x: 0, y: 0 }, z: 0 });
        tempActor.init(); // todo should be called by registration engine
      }
    }
  }
}
