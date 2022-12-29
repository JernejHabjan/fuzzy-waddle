import { Character } from './character';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { Ownable, OwnerComponent } from './owner-component';
import { PlayerController } from '../controllers/player-controller';

export abstract class PlayerCharacter extends Character implements Ownable {
  ownerComponent: OwnerComponent;

  // making constructor public
  constructor(scene: Phaser.Scene, tilePlacementData: TilePlacementData, playerController: PlayerController) {
    super(scene, tilePlacementData);
    this.ownerComponent = this.components.addComponent(new OwnerComponent(playerController));
  }
}
