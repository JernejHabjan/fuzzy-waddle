import { PlayerController } from '../../../world/managers/controllers/player-controller';
import { IComponent } from '../../../core/component.service';
import { Actor } from '../actor';

export class OwnerComponent implements IComponent {
  public playerController?: PlayerController;

  constructor(playerController?: PlayerController) {
    this.playerController = playerController;
  }

  init(): void {
    // pass
  }

  isSameTeamAsActor(actor: Actor): boolean {
    const ownerComponent = actor.components.findComponentOrNull(OwnerComponent);
    if (!ownerComponent) return false;
    if (!this.playerController || !ownerComponent.playerController) return false;
    return (
      ownerComponent.playerController.playerState.teamInfo.teamId === this.playerController.playerState.teamInfo.teamId
    );
  }

  isSameTeamAsController(controller?: PlayerController): boolean {
    if (!controller || !this.playerController) return false;
    return controller.playerState.teamInfo.teamId === this.playerController.playerState.teamInfo.teamId;
  }

  possess(playerController: PlayerController) {
    this.playerController = playerController;
  }
}
