// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionEvidenceV1 } from "./skirmish-ai-runtime-production-evidence";

/** Projects checked queue intervals in native observer order. Missing cash/claim boundaries never become zero. */
export function projectRuntimeProductionLifecycleEvents(
  capture: AiRuntimeProductionCaptureV1,
  causal: Pick<
    RuntimeProductionCausalityV1,
    "enqueues" | "operations" | "queueMutations" | "completions" | "cancellations"
  >
) {
  const events: RuntimeProductionEvidenceV1["events"][number][] = [...(causal.enqueues ?? [])];
  const failures: string[] = [],
    gaps: string[] = [];
  const zero = { food: 0, wood: 0, stone: 0, minerals: 0 };
  if (
    capture.droppedFactCount ||
    capture.facts.length > 8192 ||
    [causal.enqueues ?? [], causal.operations, causal.queueMutations, causal.completions, causal.cancellations].some(
      (entries) => entries.length > 8192
    )
  ) {
    return { events: [], failures: ["production_ai_lifecycle_capture_dropped"], gaps };
  }
  const eventAt = (sequence: number, commandId: string, itemId: string) => {
    const fact = capture.facts.find((entry) => entry.sequence === sequence);
    const boundary = fact?.boundaryState;
    const mutation = causal.queueMutations.find(
      (entry) => entry.item.itemId === itemId && entry.operation === "enqueue"
    );
    const productKey = mutation?.item.objectName ?? mutation?.item.researchType;
    if (
      !fact ||
      !boundary?.resources ||
      !boundary.obligations ||
      !boundary.unspentClaims?.resources ||
      !mutation ||
      !productKey ||
      boundary.snapshotRestoreInProgress
    ) {
      gaps.push("production_ai_lifecycle_boundary_missing");
      return null;
    }
    return {
      sequence,
      tick: fact.tick,
      commandId,
      effectId: mutation.effectId,
      planId: mutation.planId,
      actorId: mutation.actorId,
      productKey,
      itemId,
      laneId: mutation.laneId,
      createdActorId: null,
      resourcesBefore: boundary.resources,
      resourcesAfter: boundary.resources,
      reservedUnspent: boundary.unspentClaims.resources,
      obligationsDue: boundary.obligations,
      obligationsAfter: boundary.obligations,
      charged: zero,
      refundForItemId: null,
      refundAmounts: zero
    };
  };
  for (const operation of causal.operations.filter((entry) => entry.kind === "tick_charge")) {
    const base = eventAt(operation.sequence, operation.commandId, operation.itemId);
    if (!base || !operation.reservedUnspentBefore || operation.remainingSuccessfulTicks === null) {
      gaps.push("production_ai_lifecycle_payment_authority_missing");
      continue;
    }
    events.push({
      ...base,
      kind: "pay",
      resourcesBefore: operation.resourcesBefore,
      resourcesAfter: operation.resourcesAfter,
      reservedUnspent: operation.reservedUnspentBefore,
      obligationsDue: operation.obligationsDue,
      obligationsAfter: operation.obligationsAfter,
      charged: operation.charged,
      remainingSuccessfulTicks: operation.remainingSuccessfulTicks
    });
  }
  for (const completion of causal.completions) {
    const base = eventAt(completion.registeredSequence, completion.originatingCommandId, completion.itemId);
    if (!base) continue;
    events.push({ ...base, kind: "complete", createdActorId: completion.createdActor?.actorId ?? null });
  }
  for (const cancellation of causal.cancellations) {
    const request = eventAt(cancellation.requestedSequence, cancellation.commandId, cancellation.item.itemId);
    const removal = eventAt(cancellation.removal.sequence, cancellation.commandId, cancellation.item.itemId);
    const refund = eventAt(cancellation.refund.sequence, cancellation.commandId, cancellation.item.itemId);
    const money = cancellation.refund;
    if (!request || !removal || !refund || !money.reservedUnspentBefore) {
      gaps.push("production_ai_lifecycle_refund_authority_missing");
      continue;
    }
    events.push(
      {
        ...request,
        kind: "cancel_requested",
        effectId: cancellation.effectId,
        planId: cancellation.planId,
        scheduledTick: cancellation.scheduledTick
      },
      { ...removal, kind: "cancel", effectId: cancellation.effectId, planId: cancellation.planId },
      {
        ...refund,
        kind: "refund",
        effectId: cancellation.effectId,
        planId: cancellation.planId,
        resourcesBefore: money.resourcesBefore,
        resourcesAfter: money.resourcesAfter,
        reservedUnspent: money.reservedUnspentBefore,
        obligationsDue: money.obligationsDue,
        obligationsAfter: money.obligationsAfter,
        refundForItemId: cancellation.item.itemId,
        refundAmounts: money.refundAmounts
      }
    );
  }
  events.sort((left, right) => left.sequence - right.sequence);
  if (
    events.some(
      (event, index) =>
        index > 0 &&
        (event.sequence <= (events[index - 1]?.sequence ?? Infinity) ||
          event.tick < (events[index - 1]?.tick ?? Infinity))
    )
  ) {
    failures.push("production_ai_lifecycle_event_order");
  }
  // This checked queue slice does not certify rejected orders, construction, producer losses or strategic usefulness.
  return structuredClone({ events: failures.length ? [] : events, failures, gaps: [...new Set(gaps)] });
}
