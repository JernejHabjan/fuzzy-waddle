import type { ConstructionSiteDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/construction-site-definition";

export function buildsWithoutAssignedWorkers(
  definition: Pick<ConstructionSiteDefinition, "startImmediately" | "progressMadeAutomatically" | "maxAssignedBuilders">
): boolean {
  return (
    definition.startImmediately && definition.progressMadeAutomatically > 0 && definition.maxAssignedBuilders === 0
  );
}

export function constructionVitalityIncrement(
  totalVitalityToGain: number,
  productionTime: number,
  constructionProgress: number
): number {
  if (totalVitalityToGain <= 0) return 0;
  if (productionTime <= 0) return totalVitalityToGain;
  return (totalVitalityToGain / productionTime) * constructionProgress;
}

