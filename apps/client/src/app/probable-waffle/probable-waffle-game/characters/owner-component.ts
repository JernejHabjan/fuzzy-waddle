import { PlayerController } from '../controllers/player-controller';
import { IComponent } from '../services/component.service';
import { Actor } from '../actor';

export class OwnerComponent implements IComponent {
  constructor(public owner: PlayerController) {}
  init(): void {
    // pass
  }

  IsSameTeamAsActor(actor: Actor): boolean {
    const ownerComponent = actor.components.findComponent(OwnerComponent);
    if (!ownerComponent) {
      return false;
    }
    return ownerComponent.owner.playerState.teamInfo.teamId === this.owner.playerState.teamInfo.teamId;
  }
  isSameTeamAsController(controller: PlayerController): boolean {
    return controller.playerState.teamInfo.teamId === this.owner.playerState.teamInfo.teamId;
  }
}
