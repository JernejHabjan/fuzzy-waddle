import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import type { ProductionSpatialAuthorityEvent } from "../../../world/services/multiplayer/production-spatial-authority-event";
import type { AiRuntimeConstructionCatalogV1 } from "./ai-runtime-construction-catalog-v1";

/** Test-only definition observation; no new affordability, eligibility, path or resource mutation is performed. */
export function captureAiRuntimeConstructionCatalog(event: Extract<ProductionSpatialAuthorityEvent, { kind: "placement" }>) {
  const catalog: AiRuntimeConstructionCatalogV1 = { priceSource: "shared_command_base_definition",
    admissionCost: { ...event.admissionCost }, siteDefinition: null };
  const tech = getSceneService(event.site.scene, TechTreeService);
  if (!tech) return { catalog, gaps: ["production_construction_effective_definition_missing"] };
  if (event.site.name !== event.command.actorName) {
    return { catalog, gaps: ["production_construction_effective_definition_invalid"] };
  }
  const level = tech.getResearchedLevelForUnit(event.command.playerNumber, event.command.actorName);
  if (!Number.isSafeInteger(level) || level < 1) {
    return { catalog, gaps: ["production_construction_effective_definition_invalid"] };
  }
  // Mirrors the component's researched-level lookup. It may change before construction actually starts.
  const definition = getPwActorDefinition(event.site.name, level > 1 ? level : null)?.components?.productionCost;
  if (!definition) return { catalog, gaps: ["production_construction_effective_definition_missing"] };
  if (![PaymentType.PayImmediately, PaymentType.PayOverTime].includes(definition.costType) ||
    !Number.isFinite(definition.productionTime) || definition.productionTime < 0 ||
    Object.entries(definition.resources).some(([resource, amount]) =>
      !Object.values(ResourceType).includes(resource as ResourceType) || !Number.isFinite(amount) || amount < 0)) {
    return { catalog, gaps: ["production_construction_effective_definition_invalid"] };
  }
  return { catalog: { ...catalog, siteDefinition: { researchedLevel: level, cost: { ...definition.resources },
    configuredPayment: definition.costType === PaymentType.PayImmediately ? "immediate" : "per_successful_tick",
    requiredWorkMs: definition.productionTime } } satisfies AiRuntimeConstructionCatalogV1, gaps: [] };
}
