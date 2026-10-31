import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentClaimV1 } from "../contracts/ai-intent-v1";

export function createAiResourceCostClaims(
  claimId: AiIntentClaimV1["claimId"],
  cost: Readonly<Partial<Record<ResourceType, number>>>
): readonly Extract<AiIntentClaimV1, { readonly kind: "resource" }>[] {
  return Object.entries(cost)
    .filter((entry): entry is [ResourceType, number] => entry[1] !== undefined && entry[1] > 0)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([resourceType, amount]) => ({
      claimId: `${claimId}:${resourceType}` as AiIntentClaimV1["claimId"],
      kind: "resource" as const,
      resourceType,
      amount
    }));
}
