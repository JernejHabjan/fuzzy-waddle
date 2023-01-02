import { IComponent } from '../services/component.service';
import { PaymentType } from './payment-type';
import { ResourceType } from './resource-type';

export class CostData {
  static NoCost = {
    costType: PaymentType.PayImmediately,
    resources: new Map(),
    productionTime: 0,
    refundFactor: 1
  };
  constructor(
    public costType: PaymentType,
    public productionTime: number,
    public resources: Map<ResourceType, number>,
    public refundFactor: number
  ) {}
}

export interface Costs {
  productionCostComponent: ProductionCostComponent;
}

export class ProductionCostComponent implements IComponent {
  finishedSound?: string; // todo
  constructor(public costData: CostData) {}

  init(): void {
    // pass
  }
}
