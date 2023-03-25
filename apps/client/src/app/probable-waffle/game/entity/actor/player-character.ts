import { Character } from './character';
import { TilePlacementData } from '../../world/managers/controllers/input/tilemap/tilemap-input.handler';
import { Ownable, OwnerComponent } from './components/owner-component';
import { PlayerController } from '../../world/managers/controllers/player-controller';
import { CostData, Costs, ProductionCostComponent } from '../building/production/production-cost-component';
import { Scene } from 'phaser';

export abstract class PlayerCharacter extends Character implements Ownable, Costs {
  ownerComponent: OwnerComponent;
  productionCostComponent!: ProductionCostComponent;

  // making constructor public
  constructor(scene: Scene, tilePlacementData: TilePlacementData, playerController: PlayerController) {
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
