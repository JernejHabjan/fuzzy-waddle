import { ResourceType, type GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { sameRuntimeQueueCommand } from "./skirmish-ai-runtime-queue-command-equality";
import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";

function sameClaim(left: AiIntentV1["claims"][number], right: AiIntentV1["claims"][number] | undefined): boolean {
  if (!right || left.claimId !== right.claimId || left.kind !== right.kind) return false;
  switch (left.kind) {
    case "actor": return right.kind === "actor" && left.actorId === right.actorId;
    case "resource": return right.kind === "resource" && left.resourceType === right.resourceType && left.amount === right.amount;
    case "production_slot": return right.kind === "production_slot" && left.producerId === right.producerId && left.slot === right.slot;
    case "site": return right.kind === "site" && left.siteKey === right.siteKey;
    case "cargo_seat": return right.kind === "cargo_seat" && left.transportId === right.transportId && left.seats === right.seats;
    case "effect": return right.kind === "effect" && left.effectId === right.effectId;
  }
}

/** Closed queue payload comparison deliberately ignores execution metadata on the original unstamped request. */
export function isRuntimeQueueCommand(command: { readonly type: string }): boolean {
  return ["PRODUCTION", "RESEARCH", "CANCEL_PRODUCTION", "CANCEL_RESEARCH"].includes(command.type);
}

/** Validates the accepted proposal, actual bus stamp and all observed lifecycle callbacks without guessing a plan. */
export function validateRuntimeProductionCommandLineage(
  request: Extract<AiRuntimeProductionFactV1, { kind: "intent_dispatch" }>,
  receipt: Extract<AiRuntimeProductionFactV1, { kind: "intent_dispatch" }>,
  command: GameCommand,
  deliveries: readonly Extract<AiRuntimeProductionFactV1, { kind: "command_delivered" }>[],
  outcomes: readonly Extract<AiRuntimeProductionFactV1, { kind: "outcome" }>[]
): string[] {
  const failures: string[] = [];
  if (request.event.kind !== "requested") return ["production_ai_request_missing"];
  const event = request.event;
  const intent = event.acceptedIntent;
  const execution = command.execution;
  if (!intent) return ["production_ai_accepted_intent_missing"];
  const claims = event.claims;
  const sameClaims = claims.length === intent.claims.length && claims.every((claim, index) => sameClaim(claim, intent.claims[index]));
  const resourceClaims = Object.values(ResourceType).map((resource) => claims.reduce((sum, claim) =>
    sum + (claim.kind === "resource" && claim.resourceType === resource ? claim.amount : 0), 0));
  const addressedProducer = command.actorIds.length === 1 ? command.actorIds[0] : undefined;
  const matchesIntent = command.type === "PRODUCTION" ? intent.kind === "produce" &&
    intent.producerId === addressedProducer && intent.objectName === command.actorName :
    command.type === "RESEARCH" ? intent.kind === "research" && intent.producerId === addressedProducer &&
      intent.researchType === command.researchType :
      intent.kind === "cancel" && intent.actorId === addressedProducer &&
        (command.type !== "CANCEL_PRODUCTION" || command.queueIndex === intent.queueIndex);
  if (!execution || execution.source !== "ai" || !execution.commandId || execution.schemaVersion !== 1 ||
    !Number.isSafeInteger(execution.authorityEpoch) || execution.authorityEpoch < 0 ||
    !Number.isSafeInteger(execution.sequence) || execution.sequence < 0 ||
    execution.intentId !== event.correlation.intentId || execution.effectId !== event.correlation.effectId ||
    execution.commitmentKey !== event.correlation.commitmentKey ||
    intent.intentId.replace(/^intent:/, "") !== execution.intentId ||
    intent.effectId.replace(/^effect:/, "") !== execution.effectId ||
    event.correlation.commitmentKey !== `ai:${intent.effectId}` || !intent.planId ||
    (intent.demandId !== null && !intent.demandId) || !sameClaims || !matchesIntent ||
    new Set(claims.map((claim) => claim.claimId)).size !== claims.length ||
    claims.some((claim) => !claim.claimId || (claim.kind === "resource" &&
      (!Object.values(ResourceType).includes(claim.resourceType) || !Number.isFinite(claim.amount) || claim.amount < 0))) ||
    resourceClaims.some((amount) => !Number.isFinite(amount)) ||
    !Number.isSafeInteger(event.proposedTick) || event.proposedTick < 0 ||
    event.proposedTick !== intent.proposedTick || event.proposedTick > request.tick ||
    request.tick !== receipt.tick || request.sequence >= receipt.sequence ||
    !Number.isSafeInteger(command.tick) || command.tick < request.tick ||
    command.playerNumber !== request.playerNumber || event.playerNumber !== request.playerNumber ||
    !sameRuntimeQueueCommand({ ...event.command, tick: command.tick, execution }, command)) {
    failures.push("production_ai_request_receipt_lineage");
  }
  const admission = outcomes.filter((fact) => fact.outcome.kind === "dispatched");
  if (admission.length !== 1 || admission.some((fact) => fact.tick !== request.tick ||
    fact.sequence <= request.sequence || fact.sequence >= receipt.sequence ||
    fact.scheduledTick !== command.tick || fact.outcome.tick !== command.tick)) {
    failures.push("production_ai_admission_lineage");
  }
  if (deliveries.length > 1 || deliveries.some((fact) => fact.tick !== command.tick ||
    fact.sequence <= request.sequence || !sameRuntimeQueueCommand(fact.command, command))) {
    failures.push("production_ai_delivery_lineage");
  }
  for (const fact of outcomes) {
    const outcome = fact.outcome;
    if (outcome.commandId !== execution?.commandId || outcome.playerNumber !== command.playerNumber ||
      outcome.commitmentKey !== execution?.commitmentKey ||
      outcome.authorityEpoch !== execution?.authorityEpoch || outcome.sequence !== execution?.sequence ||
      outcome.intentId !== execution?.intentId || outcome.effectId !== execution?.effectId ||
      outcome.actorIds.length !== command.actorIds.length ||
      !outcome.actorIds.every((actorId, index) => actorId === command.actorIds[index]) ||
      fact.sequence <= request.sequence || outcome.reason === "duplicate_command" ||
      outcome.reason === "lost_outcome" || outcome.reason === "outcome_backlog_overflow" ||
      (outcome.kind !== "dispatched" && (fact.scheduledTick !== null || outcome.tick !== fact.tick ||
        (admission[0] && fact.sequence <= admission[0].sequence) ||
        (outcome.kind === "applied" && fact.tick !== command.tick) ||
        (!["rejected", "failed"].includes(outcome.kind) && fact.tick < command.tick)))) {
      failures.push("production_ai_outcome_lineage");
    }
  }
  if (outcomes.some((fact) => fact.outcome.kind !== "dispatched" &&
    !["rejected", "failed"].includes(fact.outcome.kind)) && deliveries.length !== 1) {
    failures.push("production_ai_application_delivery_missing");
  }
  if (["applied", "completed", "cancelled", "rejected", "failed"].some((kind) =>
    outcomes.filter((fact) => fact.outcome.kind === kind).length > 1)) {
    failures.push("production_ai_duplicate_lifecycle");
  }
  return [...new Set(failures)];
}
