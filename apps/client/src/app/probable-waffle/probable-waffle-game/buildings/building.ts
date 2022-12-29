import { RepresentableActor } from '../characters/representable-actor';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { Ownable, OwnerComponent } from '../characters/owner-component';
import { PlayerController } from '../controllers/player-controller';

// used for actors that don't move
export abstract class Building extends RepresentableActor implements Ownable{
  ownerComponent: OwnerComponent;

  // make it public constructor
  constructor(scene: Phaser.Scene, tilePlacementData: TilePlacementData, playerController: PlayerController) {
    super(scene, tilePlacementData);
    this.ownerComponent = this.components.addComponent(new OwnerComponent(playerController));
  }

}
