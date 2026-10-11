import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";

/** Per-decision posture allocation. It protects a competing affordable purchase, not idle money. */
export interface AiSpendingBudget {
  readonly economyPermille: number;
  readonly defensePermille: number;
}

type BudgetCategory = "economy" | "defense";

function costFor(intent: AiIntentV1, resourceType: ResourceType): number {
  return intent.claims.reduce(
    (total, claim) => total + (claim.kind === "resource" && claim.resourceType === resourceType ? claim.amount : 0),
    0
  );
}

/** Returns the first resource protected for the other category, if any. Survival remains stockpile-bound only. */
export function aiSpendingBudgetConflict(
  intent: AiIntentV1,
  proposals: readonly AiIntentV1[],
  budget: AiSpendingBudget | undefined,
  available: (resourceType: ResourceType) => number,
  committed: ReadonlyMap<ResourceType, number>,
  spent: Readonly<Record<BudgetCategory, ReadonlyMap<ResourceType, number>>>
): ResourceType | null {
  const category = intent.spendingCategory;
  if (!budget || !category || category === "survival") return null;
  const opposite: BudgetCategory = category === "economy" ? "defense" : "economy";
  const otherProposals = proposals.filter((candidate) => candidate.spendingCategory === opposite);
  const resourceTypes = new Set(
    intent.claims.flatMap((claim) => claim.kind === "resource" ? [claim.resourceType] : [])
  );
  for (const resourceType of resourceTypes) {
    const cost = costFor(intent, resourceType);
    const stock = Math.max(0, available(resourceType));
    const otherSpend = spent[opposite].get(resourceType) ?? 0;
    const remaining = stock - (committed.get(resourceType) ?? 0);
    const otherShare = opposite === "economy" ? budget.economyPermille : budget.defensePermille;
    const protectedAmount = Math.max(0, Math.floor((stock * otherShare) / 1000) - otherSpend);
    const otherCanUseShare = otherProposals.some((candidate) => {
      const cost = costFor(candidate, resourceType);
      return cost > 0 && cost <= remaining;
    });
    if (!otherCanUseShare) continue;
    if (cost > remaining - protectedAmount) return resourceType;
  }
  return null;
}
