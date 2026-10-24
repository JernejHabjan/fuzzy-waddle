import { ObjectNames, type ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";

/**
 * Price the missing renewable-food prerequisite closure once per definition, before optional worker growth.
 * Existing finished or paid unfinished actors need no second payment. Missing/cyclic definitions return null;
 * that means unknown support, never proof of strategic infeasibility or permission to spend the bootstrap bank.
 */
export function renewableFoodReserve(
  self: readonly AiObservationV1["actors"][number][],
  catalog: AiCapabilityCatalogV1
): Readonly<Partial<Record<ResourceType, number>>> | null {
  const result: Partial<Record<ResourceType, number>> = {};
  const complete = new Set(self.map((actor) => actor.objectName));
  const visiting = new Set<ObjectNames>();
  const price = (name: ObjectNames): boolean => {
    if (complete.has(name)) return true;
    if (visiting.has(name)) return false;
    const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === name);
    const profile = entry?.constructionProfile;
    if (!profile) return false;
    visiting.add(name);
    for (const prerequisite of profile.requiredObjectNames ?? []) if (!price(prerequisite)) return false;
    for (const [type, amount] of Object.entries(profile.resourceCost)) {
      if (amount === undefined || !Number.isFinite(amount) || amount < 0) return false;
      const resource = type as ResourceType;
      result[resource] = (result[resource] ?? 0) + amount;
    }
    visiting.delete(name);
    complete.add(name);
    return true;
  };
  return price(ObjectNames.Field) ? result : null;
}
