import type { AiCapabilityCatalogEntryV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type {
  ProductionCostDefinition
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/production-cost-definition";
import type {
  ConstructionSiteDefinition
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/construction-site-definition";
import { millisecondsToSimulationTicks } from "./ai-observation-values";

/** Projects shared component timing without interpreting queue backlog capacity as parallel throughput. */
export function projectAiProductionTiming(
  cost: ProductionCostDefinition | undefined,
  construction: ConstructionSiteDefinition | undefined,
  parallelQueues: number
): AiCapabilityCatalogEntryV1["productionTiming"] {
  if (!cost) return undefined;
  const singleBuilderRate = construction
    ? construction.progressMadeAutomatically +
      (construction.maxAssignedBuilders > 0 ? construction.progressMadePerBuilder : 0) : 0;
  return {
    durationTicks: millisecondsToSimulationTicks(cost.productionTime),
    lanes: parallelQueues,
    singleBuilderTicks: singleBuilderRate > 0
      ? millisecondsToSimulationTicks(cost.productionTime / singleBuilderRate) : null
  };
}
