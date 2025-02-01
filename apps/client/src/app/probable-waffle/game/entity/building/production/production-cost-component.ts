import { PaymentType } from "../payment-type";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import GameObject = Phaser.GameObjects.GameObject;

export type ProductionCostDefinition = {
  costType: PaymentType;
  productionTime: number;
  resources: Partial<Record<ResourceType, number>>;
  refundFactor: number;
};

export class ProductionCostComponent {
  finishedSound?: string;
  constructor(
    private readonly owner: GameObject,
    private readonly productionCostDefinition: ProductionCostDefinition
  ) {}
}
