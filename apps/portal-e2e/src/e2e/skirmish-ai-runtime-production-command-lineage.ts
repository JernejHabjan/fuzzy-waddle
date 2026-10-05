import { validateRuntimeProductionRequest } from "./skirmish-ai-runtime-production-request";
import type { GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { sameRuntimeProductionCommand } from "./skirmish-ai-runtime-production-command-equality";

/** Selects the closed queue command family for this diagnostic; payload and native execution are validated separately. */
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
  const failures = validateRuntimeProductionRequest(request);
  if (request.event.kind !== "requested") return ["production_ai_request_missing"];
  const event = request.event;
  const intent = event.acceptedIntent;
  const execution = command.execution;
  if (!intent) return ["production_ai_accepted_intent_missing"];
  if (!execution || execution.source !== "ai" || !execution.commandId || execution.schemaVersion !== 1 ||
    !Number.isSafeInteger(execution.authorityEpoch) || execution.authorityEpoch < 0 ||
    !Number.isSafeInteger(execution.sequence) || execution.sequence < 0 ||
    execution.intentId !== event.correlation.intentId || execution.effectId !== event.correlation.effectId ||
    execution.commitmentKey !== event.correlation.commitmentKey ||
    intent.intentId.replace(/^intent:/, "") !== execution.intentId ||
    intent.effectId.replace(/^effect:/, "") !== execution.effectId ||
    request.tick !== receipt.tick || request.sequence >= receipt.sequence ||
    !Number.isSafeInteger(command.tick) || command.tick < request.tick ||
    command.playerNumber !== request.playerNumber || event.playerNumber !== request.playerNumber ||
    !sameRuntimeProductionCommand({ ...event.command, tick: command.tick, execution }, command)) {
    failures.push("production_ai_request_receipt_lineage");
  }
  const admission = outcomes.filter((fact) => fact.outcome.kind === "dispatched");
  if (admission.length !== 1 || admission.some((fact) => fact.tick !== request.tick ||
    fact.sequence <= request.sequence || fact.sequence >= receipt.sequence ||
    fact.scheduledTick !== command.tick || fact.outcome.tick !== command.tick)) {
    failures.push("production_ai_admission_lineage");
  }
  if (deliveries.length > 1 || deliveries.some((fact) =>
    (command.type === "CONSTRUCT" ? fact.tick < command.tick : fact.tick !== command.tick) ||
    fact.sequence <= request.sequence || !sameRuntimeProductionCommand(fact.command, command))) {
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
        (outcome.kind === "applied" && (command.type === "CONSTRUCT" ? fact.tick < command.tick : fact.tick !== command.tick)) ||
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
