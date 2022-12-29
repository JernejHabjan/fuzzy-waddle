import { GameState } from '../game-state/game-state';
import { PlayerState } from '../player-state';
import { RepresentableActor } from '../characters/representable-actor';
import { Actor } from '../actor';
import { OrderData } from '../characters/AI/order-data';
import ComponentService from '../services/component.service';
import { v4 as uuidv4 } from 'uuid';
import { PlayerResourcesComponent } from './player-resources-component';

export class PlayerController {
  components: ComponentService;

  constructor(public readonly gameState: GameState, public readonly playerState: PlayerState) {
    const name = uuidv4(); // give it a unique name
    this.components = new ComponentService(name);

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
