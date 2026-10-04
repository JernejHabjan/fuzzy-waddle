import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { validateRuntimeProductionRequest } from "./skirmish-ai-runtime-production-request";
import { matchRuntimeProductionDecision } from "./skirmish-ai-runtime-production-decision-lineage";

/** Exact synchronous admission scope, including input-address rejection with an outcome but no admitted command. */
export function matchRuntimeRejectedAdmission(
  capture: AiRuntimeProductionCaptureV1,
  request: Extract<AiRuntimeProductionFactV1, { kind: "intent_dispatch" }>,
  receipt: Extract<AiRuntimeProductionFactV1, { kind: "intent_dispatch" }>
) {
  const failures = validateRuntimeProductionRequest(request);
  const missing = () => ({ failures: [...new Set(failures)], scope: null });
  if (request.event.kind !== "requested" || receipt.event.kind !== "finished" || receipt.event.receipt.status !== "rejected") {
    failures.push("production_ai_rejected_admission_scope_invalid"); return missing();
  }
  const event = request.event;
  const decision = matchRuntimeProductionDecision(request, capture.facts.filter((fact) => fact.kind === "decision_selected"),
    event.decisionIdentity?.authorityEpoch);
  failures.push(...decision.failures);
  const between = capture.facts.filter((fact) => fact.sequence > request.sequence && fact.sequence < receipt.sequence);
  const outcomes = between.filter((fact): fact is Extract<AiRuntimeProductionFactV1, { kind: "outcome" }> =>
    fact.kind === "outcome" &&
    fact.outcome.playerNumber === event.playerNumber && fact.outcome.intentId === event.correlation.intentId &&
    fact.outcome.effectId === event.correlation.effectId && fact.outcome.commitmentKey === event.correlation.commitmentKey);
  const outcome = outcomes[0] ?? null;
  if (receipt.tick !== request.tick || receipt.playerNumber !== request.playerNumber ||
    receipt.event.playerNumber !== event.playerNumber || request.sequence >= receipt.sequence ||
    !isDeepStrictEqual(receipt.event.correlation, event.correlation) ||
    between.some((fact) => fact.kind === "intent_dispatch" && isDeepStrictEqual(fact.event.correlation, event.correlation)) ||
    outcomes.length > 1 || (outcome && (outcome.outcome.schemaVersion !== 1 || outcome.outcome.kind !== "rejected" ||
      outcome.outcome.reason !== receipt.event.receipt.reason || outcome.tick !== request.tick ||
      outcome.outcome.tick !== request.tick || outcome.scheduledTick !== null || !outcome.outcome.commandId ||
      !Number.isSafeInteger(outcome.outcome.sequence) || outcome.outcome.sequence < 0 ||
      outcome.outcome.authorityEpoch !== event.decisionIdentity?.authorityEpoch || outcome.outcome.worldLinkIds.length !== 0 ||
      !isDeepStrictEqual(outcome.outcome.actorIds, event.command.actorIds)))) {
    failures.push("production_ai_rejected_admission_scope_invalid");
  }
  if (["duplicate_command", "lost_outcome", "outcome_backlog_overflow"].includes(receipt.event.receipt.reason)) {
    failures.push("production_ai_rejection_authority_uncertain");
  }
  // The same retry correlation may have older stamped work. A rejected receipt cannot own its callbacks.
  const id = outcome?.outcome.commandId;
  if (id && capture.facts.some((fact) => (fact.kind === "command_delivered" && fact.command.execution?.commandId === id) ||
    (fact.kind === "outcome" && fact.outcome.commandId === id && fact !== outcome))) {
    failures.push("production_ai_rejected_admission_native_effect");
  }
  if (!decision.decision || !event.acceptedIntent || failures.length) return missing();
  return { failures, scope: { request, receipt, decision: decision.decision, acceptedIntent: event.acceptedIntent, outcome } };
}
