import { Character } from './character';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { Ownable, OwnerComponent } from './owner-component';
import { PlayerController } from '../controllers/player-controller';
import { CostData, Costs, ProductionCostComponent } from '../buildings/production-cost-component';

export abstract class PlayerCharacter extends Character implements Ownable, Costs {
  ownerComponent: OwnerComponent;
  productionCostComponent!: ProductionCostComponent;

  // making constructor public
  constructor(scene: Phaser.Scene, tilePlacementData: TilePlacementData, playerController: PlayerController) {
    super(scene, tilePlacementData);
    this.ownerComponent = this.components.addComponent(new OwnerComponent(playerController));
  }

  override init() {
    super.init();
    this.setupProductionCostComponent();
  }

  private setupProductionCostComponent() {
    const cost = this.pawnDefinition.cost ?? CostData.NoCost;
    this.productionCostComponent = this.components.addComponent(new ProductionCostComponent(cost));
  }
}
