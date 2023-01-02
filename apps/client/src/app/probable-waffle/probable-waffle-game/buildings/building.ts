import { RepresentableActor } from '../characters/representable-actor';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { Ownable, OwnerComponent } from '../characters/owner-component';
import { PlayerController } from '../controllers/player-controller';
import { CostData, Costs, ProductionCostComponent } from './production-cost-component';
import { CharacterDefinition } from '../characters/character';
import { TextureMapDefinition } from '../characters/movable-actor';

// used for actors that don't move
export abstract class Building extends RepresentableActor implements Ownable, Costs {
  abstract characterDefinition: CharacterDefinition;
  textureMapDefinition!: TextureMapDefinition;
  ownerComponent!: OwnerComponent;
  productionCostComponent!: ProductionCostComponent;

  // make it public constructor
  constructor(scene: Phaser.Scene, tilePlacementData: TilePlacementData, private playerController: PlayerController) {
    super(scene, tilePlacementData);
  }

  override init(): void {
    this.textureMapDefinition = this.characterDefinition.textureMapDefinition;

    super.init();
    this.ownerComponent = this.components.addComponent(new OwnerComponent(this.playerController));

    const cost = this.characterDefinition.cost ?? CostData.NoCost;
    this.components.addComponent(new ProductionCostComponent(cost));
  }
}
