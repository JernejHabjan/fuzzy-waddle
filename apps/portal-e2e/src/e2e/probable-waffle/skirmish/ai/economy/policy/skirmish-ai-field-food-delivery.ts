import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFact } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";
import { hasNativeSourceDelivery } from "../service/skirmish-ai-source-delivery";

/** Field-specific owner boundary; native extraction/offer/deposit attribution is shared with expansion worlds. */
export function hasNativeFieldFoodDelivery(
  facts: readonly AiRuntimeProductionFact[], fieldId: string, completedAt: number, playerNumber: number
): boolean {
  return hasNativeSourceDelivery(facts, { sourceActorId: fieldId, sourceOwner: playerNumber, playerNumber,
    resourceType: ResourceType.Food, fromTick: completedAt, throughTick: Number.MAX_SAFE_INTEGER });
}
