import { IComponent } from "../../../core/component.service";
import { PaymentType } from "../payment-type";
import { ResourceTypeDefinition } from "@fuzzy-waddle/api-interfaces";

export class CostData {
  static NoCost: CostData = {
    costType: PaymentType.PayImmediately,
    resources: new Map(),
    productionTime: 0,
    refundFactor: 1
  };

  constructor(
    public costType: PaymentType,
    public productionTime: number,
    public resources: Map<ResourceTypeDefinition, number>,
    public refundFactor: number
  ) {}
}

export class ProductionCostComponent implements IComponent {
  finishedSound?: string; // todo
  constructor(public costData: CostData) {}

  init(): void {
    // pass
  }
}
