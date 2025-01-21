import { RepresentableActor_old } from "../../../entity/actor/representable-actor_old";
import { Actor } from "../../../entity/actor/actor";
import { OrderData } from "../../../entity/character/ai/order-data";
import { GameState_old } from "../game-state/game-state_old";
import { PlayerState } from "../../../player/player-state";

export class PlayerController_old extends Actor {
  readonly gameState!: GameState_old; // todo
  readonly playerState!: PlayerState; // todo

  issueOrder(orderData: OrderData, issueTo: RepresentableActor_old) {
    throw new Error("Not implemented");
  }

  surrender() {
    throw new Error("Not implemented");
  }

  cancelProduction(productionActor: Actor) {
    throw new Error("Not implemented");
  }

  cancelConstruction(constructionActor: Actor) {
    throw new Error("Not implemented");
  }
}
