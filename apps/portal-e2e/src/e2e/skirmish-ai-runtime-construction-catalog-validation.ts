import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeConstructionCatalogV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-construction-catalog-v1";

/** Checks even an unbound/illegal placement's catalog; missing legacy data stays loss rather than invented pricing. */
export function validateRuntimeConstructionCatalog(catalog: AiRuntimeConstructionCatalogV1 | undefined) {
  if (!catalog) return [];
  const costValid = (cost: AiRuntimeConstructionCatalogV1["admissionCost"]) =>
    Object.entries(cost).every(([resource, amount]) => Object.values(ResourceType).includes(resource as ResourceType) &&
      Number.isFinite(amount) && amount >= 0);
  const definition = catalog.siteDefinition;
  return catalog.priceSource !== "shared_command_base_definition" || !costValid(catalog.admissionCost) ||
    (definition !== null && (!Number.isSafeInteger(definition.researchedLevel) || definition.researchedLevel < 1 ||
      !costValid(definition.cost) || !Number.isFinite(definition.requiredWorkMs) || definition.requiredWorkMs < 0 ||
      !["immediate", "per_successful_tick"].includes(definition.configuredPayment)))
    ? ["production_construction_catalog_invalid"] : [];
}
