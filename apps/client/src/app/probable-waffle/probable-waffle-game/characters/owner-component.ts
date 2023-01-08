import { PlayerController } from '../controllers/player-controller';
import { IComponent } from '../services/component.service';
import { Actor } from '../actor';

export interface Ownable {
  ownerComponent: OwnerComponent;
}
export class OwnerComponent implements IComponent {
  constructor(public playerController: PlayerController) {}
  init(): void {
    // pass
  }

  isSameTeamAsActor(actor: Actor): boolean {
    const ownerComponent = actor.components.findComponentOrNull(OwnerComponent);
    if (!ownerComponent) {
      return false;
    }
    return (
      ownerComponent.playerController.playerState.teamInfo.teamId === this.playerController.playerState.teamInfo.teamId
    );
  }

  isSameTeamAsController(controller: PlayerController): boolean {
    return controller.playerState.teamInfo.teamId === this.playerController.playerState.teamInfo.teamId;
  }
}
