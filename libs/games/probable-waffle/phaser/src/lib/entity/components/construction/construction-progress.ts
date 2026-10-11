import type { ConstructionSiteDefinition } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/construction-site-definition";

/** Automatic zero-worker sites can continue without an assignment. */
export function buildsWithoutAssignedWorkers(
  definition: Pick<ConstructionSiteDefinition, "startImmediately" | "progressMadeAutomatically" | "maxAssignedBuilders">
): boolean {
  return (
    definition.startImmediately && definition.progressMadeAutomatically > 0 && definition.maxAssignedBuilders === 0
  );
}

/** Gain vitality per simulation work increment; instant work never divides by zero. */
export function constructionVitalityIncrement(
  totalVitalityToGain: number,
  productionTime: number,
  constructionProgress: number
): number {
  if (totalVitalityToGain <= 0) return 0;
  if (productionTime <= 0) return totalVitalityToGain;
  return (totalVitalityToGain / productionTime) * constructionProgress;
}

