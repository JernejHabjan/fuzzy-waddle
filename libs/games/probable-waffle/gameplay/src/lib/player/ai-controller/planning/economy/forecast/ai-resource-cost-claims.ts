import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentClaim } from "../../../contracts/commands/ai-intent";

export function createAiResourceCostClaims(
  claimId: AiIntentClaim["claimId"],
  cost: Readonly<Partial<Record<ResourceType, number>>>
): readonly Extract<AiIntentClaim, { readonly kind: "resource" }>[] {
  return Object.entries(cost)
    .filter((entry): entry is [ResourceType, number] => entry[1] !== undefined && entry[1] > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([resourceType, amount]) => ({
      claimId: `${claimId}:${resourceType}` as AiIntentClaim["claimId"],
      kind: "resource" as const,
      resourceType,
      amount
    }));
}
