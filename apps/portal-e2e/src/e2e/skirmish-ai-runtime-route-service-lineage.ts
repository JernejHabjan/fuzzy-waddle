import { isDeepStrictEqual } from "node:util";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeRouteOrderLineageV1 } from "./skirmish-ai-runtime-route-order-lineage";
import { matchRuntimeProductionDecision } from "./skirmish-ai-runtime-production-decision-lineage";
import { validateRuntimeProductionCommandLineage } from "./skirmish-ai-runtime-production-command-lineage";
import {
  runtimeRouteOrderHasCommandContext,
  runtimeRouteOrderMatchesCommand,
  sameRuntimeRouteServiceCommand,
  validateRuntimeRouteServiceRequest
} from "./skirmish-ai-runtime-route-service-command";
import {
  runtimeRouteServiceOutcomeActors,
  validateRuntimeRouteServiceLifecycle
} from "./skirmish-ai-runtime-route-service-outcomes";

/** Join only this admitted native order to a stamped shared service dispatch selected before its actual application. */
export function matchRuntimeRouteServiceLineage(
  capture: AiRuntimeProductionCaptureV1,
  admission: RuntimeRouteOrderLineageV1["admission"],
  requestedSequence: number
) {
  const failures: string[] = [],
    gaps: string[] = [];
  let serviceCommand: RuntimeRouteOrderLineageV1["serviceCommand"] = null;
  let selectedDemand: RuntimeRouteOrderLineageV1["selectedDemand"] = null;
  const value = admission?.spatial;
  if (!admission || value?.kind !== "route_order" || !value.order.commandContext) {
    return { failures, gaps: ["production_route_shared_service_command_missing"], serviceCommand, selectedDemand };
  }
  const context = value.order.commandContext;
  const deliveries = capture.facts.filter(
    (fact): fact is Extract<AiRuntimeProductionFactV1, { kind: "command_delivered" }> =>
      fact.kind === "command_delivered" && fact.command.execution?.commandId === context.execution.commandId
  );
  const delivery = deliveries[0];
  if (
    deliveries.length > 1 ||
    (delivery && !runtimeRouteOrderHasCommandContext(value.order, value.source.actorId ?? "", delivery.command))
  ) {
    failures.push("production_route_service_order_command_mismatch");
  }
  if (delivery && delivery.command.type !== "ACTOR_ACTION" && delivery.command.type !== "MOVE") {
    return {
      failures,
      gaps: ["production_route_order_shared_command_family_not_service"],
      serviceCommand,
      selectedDemand
    };
  }
  if (delivery && !runtimeRouteOrderMatchesCommand(value.order, value.source.actorId ?? "", delivery.command)) {
    failures.push("production_route_service_order_command_mismatch");
  }
  if (!delivery || delivery.sequence >= requestedSequence || context.execution.source !== "ai") {
    gaps.push("production_route_shared_service_dispatch_missing");
    return { failures, gaps, serviceCommand, selectedDemand };
  }
  const command = delivery.command;
  const dispatches = capture.facts.filter((fact) => fact.kind === "intent_dispatch");
  const receipts = dispatches.filter(
    (fact) =>
      fact.event.kind === "finished" &&
      fact.event.receipt.status === "dispatched" &&
      fact.event.receipt.command.execution?.commandId === context.execution.commandId
  );
  const receipt = receipts[0];
  if (receipts.length > 1) failures.push("production_route_service_receipt_ambiguous");
  if (!receipt || receipt.event.kind !== "finished" || receipt.event.receipt.status !== "dispatched") {
    return {
      failures,
      gaps: [...gaps, "production_route_service_accepted_intent_missing"],
      serviceCommand,
      selectedDemand
    };
  }
  const sameCorrelation = (fact: typeof receipt) =>
    isDeepStrictEqual(fact.event.correlation, receipt.event.correlation) && fact.playerNumber === receipt.playerNumber;
  const requests = dispatches.filter(
    (fact) => fact.event.kind === "requested" && fact.sequence < receipt.sequence && sameCorrelation(fact)
  );
  const request = requests.at(-1);
  if (!request || request.event.kind !== "requested") {
    failures.push("production_route_service_request_missing");
    return { failures, gaps, serviceCommand, selectedDemand };
  }
  const next = dispatches.find(
    (fact) => fact.sequence > request.sequence && fact.event.kind === "requested" && sameCorrelation(fact)
  );
  const finishes = dispatches.filter(
    (fact) =>
      fact.sequence > request.sequence &&
      (!next || fact.sequence < next.sequence) &&
      fact.event.kind !== "requested" &&
      sameCorrelation(fact)
  );
  if (
    finishes.length !== 1 ||
    finishes[0]?.sequence !== receipt.sequence ||
    !sameRuntimeRouteServiceCommand(command, receipt.event.receipt.command)
  ) {
    failures.push("production_route_service_dispatch_interval_invalid");
  }
  const outcomes = capture.facts.filter(
    (fact): fact is Extract<AiRuntimeProductionFactV1, { kind: "outcome" }> =>
      fact.kind === "outcome" && fact.outcome.commandId === context.execution.commandId
  );
  if (
    !outcomes.some(
      (fact) => fact.outcome.kind === "applied" && fact.outcome.actorIds.includes(value.source.actorId ?? "")
    )
  ) {
    gaps.push("production_route_service_application_outcome_missing");
  }
  failures.push(
    ...validateRuntimeProductionCommandLineage(request, receipt, command, deliveries, outcomes, {
      validateRequest: validateRuntimeRouteServiceRequest,
      sameCommand: sameRuntimeRouteServiceCommand,
      outcomeActors: runtimeRouteServiceOutcomeActors,
      validateLifecycle: validateRuntimeRouteServiceLifecycle
    })
  );
  const decision = matchRuntimeProductionDecision(
    request,
    capture.facts.filter((fact) => fact.kind === "decision_selected"),
    command.execution?.authorityEpoch
  );
  failures.push(...decision.failures);
  if (
    request.sequence >= admission.sequence ||
    command.tick !== admission.tick ||
    request.tick > admission.tick ||
    admission.sequence >= requestedSequence ||
    receipt.sequence >= requestedSequence ||
    !value.sceneActive ||
    value.clockTick === null ||
    value.snapshotRestoreInProgress ||
    !value.source.active ||
    !value.source.alive ||
    !value.source.finished ||
    !value.source.indexed
  ) {
    gaps.push("production_route_service_admission_interval_unavailable");
    return { failures, gaps, serviceCommand, selectedDemand };
  }
  if (failures.length || !request.event.acceptedIntent) return { failures, gaps, serviceCommand, selectedDemand };
  const matchedCommand = {
    requestedSequence: request.sequence,
    requestedTick: request.tick,
    receiptSequence: receipt.sequence,
    acceptedIntent: request.event.acceptedIntent,
    decision: decision.decision,
    requestBoundary: request.boundaryState ?? null,
    command,
    deliveries,
    outcomes
  } satisfies NonNullable<RuntimeRouteOrderLineageV1["serviceCommand"]>;
  serviceCommand = matchedCommand;
  const demandId = matchedCommand.acceptedIntent.demandId;
  if ((decision.decision?.decision.economyProduction.demands.length ?? 0) > 256) {
    failures.push("production_route_service_selected_demand_overflow");
    return { failures, gaps, serviceCommand, selectedDemand };
  }
  const demands =
    decision.decision?.decision.economyProduction.demands.filter((entry) => entry.demandId === demandId) ?? [];
  const demand = demands[0];
  if (
    demands.length > 1 ||
    (demand &&
      (!demand.purpose ||
        !demand.capabilityOrRole ||
        !["actor_count", "population", "cargo_seats", "combat_contribution", "work_per_horizon"].includes(
          demand.unit
        ) ||
        !Number.isFinite(demand.desired) ||
        demand.desired < 0 ||
        [
          demand.satisfiedActorIds,
          demand.queuedIds,
          demand.constructingIds,
          demand.acceptedNotObservedEffectIds,
          demand.preferredObjectNames
        ].some(
          (entries) =>
            entries.length > 256 || entries.some((entry) => !entry) || new Set(entries).size !== entries.length
        ) ||
        Object.entries(demand.resourceObligations).some(
          ([resource, amount]) =>
            !Object.values(ResourceType).includes(resource as ResourceType) || !Number.isFinite(amount) || amount < 0
        )))
  ) {
    failures.push("production_route_service_selected_demand_invalid");
  } else if (demand && decision.decision)
    selectedDemand = { selectedSequence: decision.decision.sequence, selectedTick: decision.decision.tick, demand };
  else gaps.push("production_route_service_dated_demand_missing");
  if (!decision.decision) gaps.push("production_route_service_selected_decision_missing");
  return { failures, gaps, serviceCommand, selectedDemand };
}
