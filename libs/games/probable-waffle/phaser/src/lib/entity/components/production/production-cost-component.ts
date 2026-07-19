import type { ProductionCostDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/production-cost-definition";
type GameObject = Phaser.GameObjects.GameObject;

export class ProductionCostComponent {
  finishedSound?: string;
  constructor(
    private readonly owner: GameObject,
    private readonly productionCostDefinition: ProductionCostDefinition
  ) {}
}
