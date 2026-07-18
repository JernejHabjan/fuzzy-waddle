import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";

import type { ProductionCostDefinition } from "./production-cost-definition";

export type ProductionQueueItem = {
  actorName: ObjectNames;
  costData: ProductionCostDefinition;
};
