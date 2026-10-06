import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import { validateRuntimeProductionCommandLineage } from "./skirmish-ai-runtime-production-command-lineage";
import { sameRuntimeProductionCommand } from "./skirmish-ai-runtime-production-command-equality";
import { matchRuntimeProductionDecision } from "./skirmish-ai-runtime-production-decision-lineage";

/**
 * Exact accepted construct -> admission -> stamped receipt. A supplied path resolution fences its interval.
 * Without a path, this is retrospective capture-wide admission lineage, never authority available at the site callback.
 * Native placement/application and site continuity are independently checked by the caller.
 */
export function matchRuntimeConstructionDecision(
  capture: AiRuntimeProductionCaptureV1,
  placement: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>,
  resolution?: Extract<AiRuntimeProductionFactV1, { kind: "spatial_authority" }>
) {
  const failures: string[] = [];
  const gaps: string[] = [];
  let scope: RuntimeProductionCausalityV1["commands"][number] | null = null;
  if (placement.spatial.kind !== "placement") return { scope, failures, gaps };
  const command = placement.spatial.command;
  const execution = command.execution;
  if (execution?.source !== "ai") return { scope, failures, gaps: ["production_spatial_construction_non_ai"] };
  const dispatches = capture.facts.filter((fact) => fact.kind === "intent_dispatch");
  const receipts = dispatches.filter((fact) => fact.event.kind === "finished" && fact.event.receipt.status === "dispatched" &&
    fact.event.receipt.command.execution?.commandId === execution.commandId);
  const receipt = receipts[0];
  if (!receipt || receipt.event.kind !== "finished" || receipt.event.receipt.status !== "dispatched") {
    return { scope, failures, gaps: ["production_spatial_construction_ai_decision_link_missing"] };
  }
  if (receipts.length !== 1 || !sameRuntimeProductionCommand(command, receipt.event.receipt.command)) {
    return { scope, failures: ["production_spatial_construction_receipt_mismatch"], gaps };
  }
  const sameCorrelation = (fact: typeof receipt) => fact.event.playerNumber === receipt.event.playerNumber &&
    fact.event.correlation.intentId === receipt.event.correlation.intentId &&
    fact.event.correlation.effectId === receipt.event.correlation.effectId &&
    fact.event.correlation.commitmentKey === receipt.event.correlation.commitmentKey;
  const previousFinish = dispatches.filter((fact) => fact.sequence < receipt.sequence &&
    fact.event.kind !== "requested" && sameCorrelation(fact)).at(-1);
  const requests = dispatches.filter((fact) => fact.event.kind === "requested" && sameCorrelation(fact) &&
    fact.sequence < receipt.sequence && (!previousFinish || fact.sequence > previousFinish.sequence));
  const request = requests[0];
  if (!request) return { scope, failures, gaps: ["production_spatial_construction_ai_decision_link_missing"] };
  if (requests.length !== 1 || request.sequence >= placement.sequence ||
    (resolution && receipt.sequence >= resolution.sequence)) {
    return { scope, failures: ["production_spatial_construction_dispatch_interval_invalid"], gaps };
  }
  const deliveries = capture.facts.filter((fact) => fact.kind === "command_delivered")
    .filter((fact) => fact.command.execution?.commandId === execution.commandId);
  const outcomes = capture.facts.filter((fact) => fact.kind === "outcome")
    .filter((fact) => fact.outcome.commandId === execution.commandId);
  failures.push(...validateRuntimeProductionCommandLineage(request, receipt, command, deliveries, outcomes));
  const decision = matchRuntimeProductionDecision(request,
    capture.facts.filter((fact) => fact.kind === "decision_selected"), execution.authorityEpoch);
  failures.push(...decision.failures);
  if (!decision.decision) gaps.push("production_spatial_construction_ai_decision_link_missing");
  if (!failures.length && decision.decision && request.event.kind === "requested" && request.event.acceptedIntent) {
    scope = { requestedSequence: request.sequence, requestedTick: request.tick, receiptSequence: receipt.sequence,
      acceptedIntent: request.event.acceptedIntent, decision: decision.decision, requestBoundary: request.boundaryState ?? null,
      command, deliveries, outcomes };
  }
  return { scope, failures: [...new Set(failures)], gaps };
}
