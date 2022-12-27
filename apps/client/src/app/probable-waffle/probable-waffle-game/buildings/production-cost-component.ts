import { IComponent } from '../services/component.service';
import { PaymentType } from './payment-type';
import { ResourceType } from './resource-type';

export class ProductionCostComponent implements IComponent {
  finishedSound?: string; // todo
  constructor(
    private costType: PaymentType,
    productionTime: number,
    resources: Map<ResourceType, number>,
    refundFactor: number
  ) {}

  init(): void {
    // pass
  }
}
