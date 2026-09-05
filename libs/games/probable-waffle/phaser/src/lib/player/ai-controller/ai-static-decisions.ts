import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/**
 * Represents the resource information that may influence the legacy controller's
 * immediate worker assignment. Stage 2 replaces this narrow compatibility view
 * with a versioned observation and demand ledger.
 */
export interface AiResourceDemandInput {
  readonly resources: Readonly<Record<ResourceType, number>>;
  readonly reserved: Readonly<Record<ResourceType, number>>;
  readonly incomeSmoothed: Readonly<Record<ResourceType, number>>;
}

/** A deterministic legacy resource-demand recommendation. */
export interface AiResourceDemand {
  readonly type: ResourceType;
  readonly amount: number;
}

const resourceOrder: readonly ResourceType[] = [
  ResourceType.Wood,
  ResourceType.Stone,
  ResourceType.Minerals,
  ResourceType.Food
];

/**
 * Returns whether the observed opponent is weaker than the AI player. Equal or
 * unknown/zero-versus-zero strength is intentionally not a superiority signal.
 */
export function isEnemyPlayerWeak(ourStrength: number, enemyStrength: number): boolean {
  return ourStrength > 0 && ourStrength > enemyStrength;
}

/**
 * Selects the least-supported resource using available stock and a short income
 * horizon. Stable resource ordering makes equal inputs reproduce exactly.
 */
export function getMostNeededResource(input: AiResourceDemandInput): AiResourceDemand {
  const preferred = resourceOrder.reduce((best, resourceType) => {
    const currentAvailable = Math.max(0, input.resources[resourceType] - input.reserved[resourceType]);
    const currentSupport = currentAvailable + Math.max(0, input.incomeSmoothed[resourceType]) * 10;
    const bestAvailable = Math.max(0, input.resources[best] - input.reserved[best]);
    const bestSupport = bestAvailable + Math.max(0, input.incomeSmoothed[best]) * 10;
    return currentSupport < bestSupport ? resourceType : best;
  });

  const available = Math.max(0, input.resources[preferred] - input.reserved[preferred]);
  return { type: preferred, amount: Math.max(0, 100 - available) };
}
