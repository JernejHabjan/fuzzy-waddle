import type { RuntimeProductionEvidenceV2 } from "./skirmish-ai-runtime-production-evidence-v2";
import type { RuntimeProductionContractV1 } from "./skirmish-ai-runtime-production-contract";
import { runtimeProductionUsefulOutputs } from "./skirmish-ai-runtime-production-useful-output";
import { evaluateRuntimeProductionPayments } from "./skirmish-ai-runtime-production-refund-evaluation";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { productionActorRetained, productionWorldAt } from "./skirmish-ai-runtime-production-authority-evaluation";

/** Joins operation-time producer definitions to individual items; changing global product prices cannot overwrite history. */
export function evaluateRuntimeProductionQueueAuthority(
  contract: RuntimeProductionContractV1,
  evidence: RuntimeProductionEvidenceV2
) {
  const failures: string[] = [];
  const events = evidence.lifecycle.queues ?? [];
  const enqueues = events.filter((event) => event.kind === "enqueue");
  const controlledRefund = contract.branch === "cancel_pending_refund" && evidence.lifecycle.controlledRefunds?.length;
  if (
    (!enqueues.length && !controlledRefund) ||
    new Set(enqueues.map((event) => event.itemId)).size !== enqueues.length
  ) {
    failures.push("production_v2_enqueue_identity_missing");
  }
  failures.push(...evaluateRuntimeProductionQueuePayments(evidence));
  const useful = runtimeProductionUsefulOutputs(evidence, contract);
  const completed = events.filter((event) => event.kind === "complete");
  const researchBenefit = completed.filter(
    (completion) =>
      evidence.definitions.some(
        (boundary) =>
          boundary.sequence > completion.sequence &&
          boundary.catalog.some(
            (option) =>
              option.kind === "production" &&
              Object.values(researchDefinitions).some(
                (research) =>
                  research.type === completion.productKey &&
                  research.upgradesUnit?.unitType === option.objectName &&
                  research.upgradesUnit.targetLevel === option.effectiveLevel
              ) &&
              useful.some(
                (output) =>
                  output.completion.requestedSequence > completion.sequence &&
                  output.completion.actorId === option.producerActorId &&
                  output.completion.createdActor?.canonicalObjectName === option.productKey &&
                  productionWorldAt(evidence, output.arrivedTick)?.actors.some(
                    (actor) =>
                      actor.identity.actorId === output.completion.createdActor?.actorId &&
                      actor.level === option.effectiveLevel
                  )
              )
          )
      ) &&
      evidence.coverage?.intervals.some(
        (interval) =>
          interval.closedFromTick >= completion.tick &&
          interval.completedResearch.some((key) => key === completion.productKey)
      )
  );
  if (contract.branch === "shared_contention") {
    const unit = enqueues.find((entry) => entry.productKey === contract.productKey);
    const research = enqueues.find(
      (entry) => entry !== unit && researchBenefit.some((completion) => completion.itemId === entry.itemId)
    );
    if (
      !unit ||
      !research ||
      unit.actorId !== research.actorId ||
      unit.laneId !== research.laneId ||
      !useful.some((output) => output.completion.itemId === unit.itemId) ||
      !evidence.decisions.some((decision) =>
        decision.result.acceptedIntents.some((intent) => intent.kind === "produce" && intent.effectId === unit.effectId)
      ) ||
      !evidence.decisions.some((decision) =>
        decision.result.acceptedIntents.some(
          (intent) => intent.kind === "research" && intent.effectId === research.effectId
        )
      )
    )
      failures.push("production_v2_strategic_contention_missing");
    if (events.some((event) => event.kind === "cancel")) failures.push("production_v2_contention_cancelled");
  } else if (contract.branch === "cancel_pending_refund") {
    const controlled = evidence.lifecycle.controlledRefunds;
    if (controlled?.length) {
      const experiment = controlled[0];
      if (controlled.length !== 1 || !experiment) return [...failures, "production_v2_controlled_refund_count_invalid"];
      failures.push(...experiment.failures);
      const commandId = experiment.post?.command.execution?.commandId;
      if (
        !evidence.lifecycle.controlledOutputs?.some(
          (output) =>
            output.commandId === commandId &&
            output.targetActorId &&
            evidence.setup?.roles[output.targetActorId] === `fixture:${contract.usefulRallyActorRole}` &&
            output.arrivedTick + contract.stableForTicks <= contract.latestTick &&
            productionActorRetained(
              evidence,
              output.actorId,
              output.arrivedTick,
              output.arrivedTick + contract.stableForTicks
            )
        )
      ) {
        failures.push("production_v2_controlled_refund_useful_output_missing");
      }
      return [...new Set(failures)];
    }
    const cancellations = events.filter((event) => event.kind === "cancel");
    const cancel = cancellations[0];
    const request = evidence.lifecycle.cancellationRequests.find((entry) => entry.itemId === cancel?.itemId);
    const refunds = events.filter((event) => event.kind === "refund" && event.refundForItemId === cancel?.itemId);
    const refund = refunds[0];
    const paid = evidence.lifecycle.setupPayments.find((entry) => entry.itemId === cancel?.itemId);
    const probe = evidence.lifecycle.rejections.find(
      (entry) =>
        request &&
        refund &&
        entry.sequence > request.sequence &&
        entry.sequence < refund.sequence &&
        entry.reason === "insufficient_resources"
    );
    const productKey =
      probe?.request.type === "PRODUCTION"
        ? probe.request.actorName
        : probe?.request.type === "RESEARCH"
          ? probe.request.researchType
          : null;
    const price =
      probe &&
      evidence.definitions
        .filter((entry) => entry.sequence <= probe.sequence)
        .at(-1)
        ?.catalog.find(
          (entry) => entry.productKey === productKey && entry.producerActorId === probe.request.actorIds[0]
        );
    const multiplier = price?.payment === "per_successful_tick" ? Math.max(1, price.durationTicks) : 1;
    const available = (resource: ResourceType) =>
      probe?.resourcesBefore && probe.reservedUnspentBefore && probe.obligationsBefore
        ? probe.resourcesBefore[resource] - probe.reservedUnspentBefore[resource] - probe.obligationsBefore[resource]
        : Number.NaN;
    const short =
      price &&
      Object.values(ResourceType).some((resource) => (price.cost[resource] ?? 0) * multiplier > available(resource));
    const covered =
      price &&
      refund &&
      Object.values(ResourceType).every(
        (resource) =>
          (price.cost[resource] ?? 0) * multiplier <= available(resource) + (refund.refundAmounts[resource] ?? 0)
      );
    if (
      cancellations.length !== 1 ||
      refunds.length !== 1 ||
      !cancel ||
      !request ||
      !refund ||
      !paid ||
      !probe ||
      !short ||
      !covered ||
      !Object.values(ResourceType).some((resource) => paid.resourcesBefore[resource] > paid.resourcesAfter[resource]) ||
      request.commandId !== cancel.commandId ||
      request.effectId !== cancel.effectId ||
      request.sequence >= cancel.sequence ||
      request.scheduledTick <= request.requestTick ||
      refund.tick < request.scheduledTick ||
      refund.tick !== cancel.tick ||
      !Object.values(refund.refundAmounts).some((amount) => amount > 0) ||
      !useful.some(
        (output) =>
          output.completion.requestedSequence > refund.sequence &&
          output.completion.createdActor?.canonicalObjectName === productKey
      )
    ) {
      failures.push("production_v2_pending_refund_experiment_missing");
    }
  } else failures.push("production_v2_queue_branch_invalid");
  return [...new Set(failures)];
}

/** All production branches keep the same operation-time cash, stored-price and physical-lane checks. */
export function evaluateRuntimeProductionQueuePayments(evidence: RuntimeProductionEvidenceV2): string[] {
  const failures: string[] = [];
  const events = evidence.lifecycle.queues;
  const enqueues = events.filter((event) => event.kind === "enqueue");
  for (const enqueue of enqueues) {
    const definition = evidence.definitions
      .filter(
        (boundary) =>
          boundary.sequence <= enqueue.sequence &&
          boundary.catalog.some(
            (entry) => entry.producerActorId === enqueue.actorId && entry.productKey === enqueue.productKey
          )
      )
      .at(-1)
      ?.catalog.find((entry) => entry.producerActorId === enqueue.actorId && entry.productKey === enqueue.productKey);
    if (!definition) {
      failures.push("production_v2_item_definition_missing");
      continue;
    }
    failures.push(
      ...evaluateRuntimeProductionPayments({
        catalog: [
          {
            productKey: definition.productKey,
            kind: definition.kind,
            cost: definition.cost,
            payment: definition.payment,
            durationTicks: definition.durationTicks
          }
        ],
        events: events.filter((event) => event.itemId === enqueue.itemId)
      })
    );
  }
  if (
    evidence.coverage?.intervals.some((interval) =>
      interval.queues.some((queue) =>
        queue.lanes.some(
          (lane) =>
            lane.capacity <= 0 ||
            lane.itemIds.length > lane.capacity ||
            new Set(lane.itemIds).size !== lane.itemIds.length
        )
      )
    )
  ) {
    failures.push("production_v2_shared_lane_overbooked");
  }
  return [...new Set(failures)];
}
