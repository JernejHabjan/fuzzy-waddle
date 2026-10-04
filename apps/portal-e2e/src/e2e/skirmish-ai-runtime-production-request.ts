import { isDeepStrictEqual } from "node:util";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";

/** Validates the unstamped accepted request itself; admission rejection must never manufacture a bus command. */
export function validateRuntimeProductionRequest(request: Extract<AiRuntimeProductionFactV1, { kind: "intent_dispatch" }>) {
  if (request.event.kind !== "requested") return ["production_ai_request_missing"];
  const event = request.event;
  const intent = event.acceptedIntent;
  if (!intent) return ["production_ai_accepted_intent_missing"];
  const command = event.command;
  const producer = command.actorIds.length === 1 ? command.actorIds[0] : undefined;
  const matches = command.type === "PRODUCTION" ? intent.kind === "produce" &&
    intent.producerId === producer && intent.objectName === command.actorName :
    command.type === "RESEARCH" ? intent.kind === "research" &&
      intent.producerId === producer && intent.researchType === command.researchType :
    command.type === "CANCEL_PRODUCTION" ? intent.kind === "cancel" &&
      intent.actorId === producer && intent.queueIndex === command.queueIndex :
    command.type === "CANCEL_RESEARCH" && intent.kind === "cancel" && intent.actorId === producer;
  if (!matches || !producer || command.playerNumber !== request.playerNumber || event.playerNumber !== request.playerNumber ||
    !intent.planId || (intent.demandId !== null && !intent.demandId) ||
    event.correlation.intentId !== intent.intentId.replace(/^intent:/, "") ||
    event.correlation.effectId !== intent.effectId.replace(/^effect:/, "") ||
    !event.correlation.intentId || !event.correlation.effectId || event.correlation.commitmentKey !== `ai:${intent.effectId}` ||
    !isDeepStrictEqual(event.claims, intent.claims) ||
    new Set(event.claims.map((claim) => claim.claimId)).size !== event.claims.length ||
    event.claims.some((claim) => !claim.claimId || (claim.kind === "resource" &&
      (!Object.values(ResourceType).includes(claim.resourceType) || !Number.isFinite(claim.amount) || claim.amount < 0))) ||
    Object.values(ResourceType).some((type) => !Number.isFinite(event.claims.reduce((sum, claim) =>
      sum + (claim.kind === "resource" && claim.resourceType === type ? claim.amount : 0), 0))) ||
    !Number.isSafeInteger(event.proposedTick) || event.proposedTick < 0 ||
    event.proposedTick !== intent.proposedTick || event.proposedTick > request.tick) {
    return ["production_ai_request_receipt_lineage"];
  }
  return [];
}
