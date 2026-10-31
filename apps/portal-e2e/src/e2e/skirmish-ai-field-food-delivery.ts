import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { hasNativeSourceDelivery } from "./skirmish-ai-source-delivery";

/** Field-specific owner boundary; native extraction/offer/deposit attribution is shared with expansion worlds. */
export function hasNativeFieldFoodDelivery(
  facts: readonly AiRuntimeProductionFactV1[], fieldId: string, completedAt: number, playerNumber: number
): boolean {
  return hasNativeSourceDelivery(facts, { sourceActorId: fieldId, sourceOwner: playerNumber, playerNumber,
    resourceType: ResourceType.Food, fromTick: completedAt, throughTick: Number.MAX_SAFE_INTEGER });
}
