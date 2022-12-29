import { RepresentableActor } from '../characters/representable-actor';
import { Actor } from '../actor';
import { OrderData } from '../characters/AI/order-data';
import { PlayerResourcesComponent } from './player-resources-component';
import { GameState } from '../game-state/game-state';
import { PlayerState } from '../player-state';

export class PlayerController extends Actor {
  readonly gameState!: GameState; // todo
  readonly playerState!: PlayerState; // todo

  // todo playerState and gameState
  constructor() {
    super();
    this.components.addComponent(new PlayerResourcesComponent());
  }

  issueOrder(orderData: OrderData, issueTo: RepresentableActor) {
    throw new Error('Not implemented');
  }
  surrender() {
    throw new Error('Not implemented');
  }

  cancelProduction(productionActor: Actor) {
    throw new Error('Not implemented');
  }
  cancelConstruction(constructionActor: Actor) {
    throw new Error('Not implemented');
  }
}
