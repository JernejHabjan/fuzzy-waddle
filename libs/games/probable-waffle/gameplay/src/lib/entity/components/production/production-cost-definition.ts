import { PaymentType } from "./payment-type";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

export type ProductionCostDefinition = {
  readonly costType: PaymentType;
  readonly productionTime: number;
  readonly resources: Partial<Record<ResourceType, number>>;
  readonly refundFactor: number;
};
