import type Phaser from "phaser";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { ResearchComponent } from "../../../entity/components/research/research-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { millisecondsToSimulationTicks } from "../observation/ai-observation-values";
import type { AiRuntimeQueueCatalogEntryV1 } from "./ai-runtime-queue-catalog-entry-v1";

/** Enumerates only the real owned producer's advertised options; never the global faction/opponent graph. */
export function captureAiRuntimeQueueCatalog(actor: Phaser.GameObjects.GameObject, actorId: string, playerNumber: number) {
  const catalog: AiRuntimeQueueCatalogEntryV1[] = [];
  const gaps: string[] = [];
  const tech = getSceneService(actor.scene, TechTreeService);
  if (!tech) return { catalog, gaps: ["production_world_tech_authority_missing"] };
  const production = getActorComponent(actor, ProductionComponent);
  const research = getActorComponent(actor, ResearchComponent);
  const products = production?.productionDefinition.availableProduceActors ?? [];
  const researches = research?.availableResearch ?? [];
  if (products.length + researches.length > 128) return { catalog, gaps: ["production_world_options_overflow"] };
  for (const objectName of [...new Set(products)].sort()) {
    // This is the same base lookup used by QueueCommandSystem.handleProductionCommand.
    const cost = getPwActorDefinition(objectName, null)?.components?.productionCost;
    const level = tech.getResearchedLevelForUnit(playerNumber, objectName);
    if (!cost || ![PaymentType.PayImmediately, PaymentType.PayOverTime].includes(cost.costType) ||
      !Number.isSafeInteger(level) || level < 1 || !getPwActorDefinition(objectName, level)) {
      gaps.push("production_world_product_definition_missing"); continue;
    }
    catalog.push({ producerActorId: actorId, productKey: objectName, kind: "production", objectName, researchType: null,
      priceSource: "base_production_definition", effectiveLevel: level, cost: { ...cost.resources },
      payment: cost.costType === PaymentType.PayOverTime ? "per_successful_tick" : "immediate",
      durationMs: cost.productionTime, durationTicks: millisecondsToSimulationTicks(cost.productionTime) });
  }
  for (const researchType of [...new Set(researches)].sort()) {
    const data = researchDefinitions[researchType];
    if (!data) { gaps.push("production_world_research_definition_missing"); continue; }
    catalog.push({ producerActorId: actorId, productKey: researchType, kind: "research", objectName: null, researchType,
      priceSource: "research_definition", effectiveLevel: null, cost: { ...data.cost }, payment: "immediate",
      durationMs: data.researchTime, durationTicks: millisecondsToSimulationTicks(data.researchTime) });
  }
  if (catalog.some((entry) => !Number.isFinite(entry.durationMs) || entry.durationMs < 0 ||
    Object.entries(entry.cost).some(([resource, amount]) => !Object.values(ResourceType).includes(resource as ResourceType) ||
      !Number.isFinite(amount) || amount < 0))) return { catalog: [], gaps: ["production_world_definition_numeric_invalid"] };
  return { catalog, gaps };
}
