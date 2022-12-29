import { IComponent } from '../services/component.service';
import { PaymentType } from './payment-type';
import { ResourceType } from './resource-type';

export class ProductionCostComponent implements IComponent {
  finishedSound?: string; // todo
  constructor(
    public costType: PaymentType,
    public productionTime: number,
    public resources: Map<ResourceType, number>,
    public refundFactor: number
  ) {}

  init(): void {
    // pass
  }
}
