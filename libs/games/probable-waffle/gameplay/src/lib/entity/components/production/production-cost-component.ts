import type { ProductionCostDefinition } from "./production-cost-definition";
import GameObject = Phaser.GameObjects.GameObject;

export class ProductionCostComponent {
  finishedSound?: string;
  constructor(
    private readonly owner: GameObject,
    private readonly productionCostDefinition: ProductionCostDefinition
  ) {}
}
