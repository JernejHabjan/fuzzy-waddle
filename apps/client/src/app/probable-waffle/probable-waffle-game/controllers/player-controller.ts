import { GameState } from '../game-state/game-state';
import { PlayerState } from '../player-state';
import { RepresentableActor } from '../characters/representable-actor';
import { Actor } from '../actor';
import { OrderData } from '../characters/AI/order-data';
import ComponentService from '../services/component.service';
import { PlayerResourcesComponent } from './player-resources-component';
import UUID = Phaser.Utils.String.UUID;

export class PlayerController {
  components: ComponentService;

  constructor(public readonly gameState: GameState, public readonly playerState: PlayerState) {
    const name = UUID();
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
