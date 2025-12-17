import { PaymentType } from "./payment-type";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";

export type ProductionCostDefinition = {
  costType: PaymentType;
  productionTime: number;
  resources: Partial<Record<ResourceType, number>>;
  refundFactor: number;
};
