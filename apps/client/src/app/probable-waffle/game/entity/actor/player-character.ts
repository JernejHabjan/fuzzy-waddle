import { Character } from './character';
import { TilePlacementData } from '../../world/managers/controllers/input/tilemap/tilemap-input.handler';
import { OwnerComponent } from './components/owner-component';
import { CostData, ProductionCostComponent } from '../building/production/production-cost-component';
import { Scene } from 'phaser';
import { PlayerController } from '../../world/managers/controllers/player-controller';

export abstract class PlayerCharacter extends Character {
  cost!: CostData;

  // making constructor public
  constructor(scene: Scene, tilePlacementData: TilePlacementData) {
    super(scene, tilePlacementData);
  }

  override init() {
    super.init();

    this.cost = this.pawnDefinition.cost ?? CostData.NoCost;
  }

  override initComponents() {
    super.initComponents();

    this.components.addComponent(new OwnerComponent());
    this.components.addComponent(new ProductionCostComponent(this.cost));
  }

  possess(playerController?: PlayerController) {
    if (!playerController) return;
    this.components.findComponent(OwnerComponent).possess(playerController);
  }
}
