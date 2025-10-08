import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { ProductionCostDefinition } from "./production-cost-component";

export type ProductionQueueItem = {
  actorName: ObjectNames;
  costData: ProductionCostDefinition;
};
