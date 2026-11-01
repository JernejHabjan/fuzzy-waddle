import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalog } from "../contracts/ai-capability-catalog";
import type { AiObservedActor } from "../contracts/ai-observation";
import { producerMilitaryProducts } from "./ai-military-catalog";

/** Preserve one definition-priced reinforcement before optional worker growth can consume its accumulating cash. */
export function nextAiMilitarySpendingReserve(
  producers: readonly AiObservedActor[],
  catalog: AiCapabilityCatalog,
  domain: "ground" | "air"
): Readonly<Partial<Record<ResourceType, number>>> {
  const names = new Set(
    producers.flatMap((producer) => producerMilitaryProducts(producer.objectName, catalog, domain))
  );
  return (
    catalog.entries
      .filter((entry) => names.has(entry.sourceObjectName) && entry.constructionProfile)
      .sort(
        (left, right) =>
          Object.values(left.constructionProfile?.resourceCost ?? {}).reduce<number>(
            (sum, value) => sum + (value ?? 0),
            0
          ) -
            Object.values(right.constructionProfile?.resourceCost ?? {}).reduce<number>(
              (sum, value) => sum + (value ?? 0),
              0
            ) || left.sourceObjectName.localeCompare(right.sourceObjectName)
      )[0]?.constructionProfile?.resourceCost ?? {}
  );
}
