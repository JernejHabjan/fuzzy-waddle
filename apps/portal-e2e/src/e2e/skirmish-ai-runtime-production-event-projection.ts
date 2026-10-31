// prettier-ignore
import { AI_RUNTIME_MAX_FACTS } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/append-ai-runtime-production-fact";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionEvidenceV1 } from "./skirmish-ai-runtime-production-evidence";
import { sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";

/** Joins checked physical insertion to its own charge, never a nearby money callback or predicted refund. */
export function projectRuntimeProductionEnqueues(
  capture: AiRuntimeProductionCaptureV1,
  mutations: RuntimeProductionCausalityV1["queueMutations"],
  operations: RuntimeProductionCausalityV1["operations"],
  commands: RuntimeProductionCausalityV1["commands"]
) {
  const events: RuntimeProductionEvidenceV1["events"][number][] = [];
  const failures: string[] = [],
    gaps: string[] = [];
  if (capture.droppedFactCount || capture.facts.length > AI_RUNTIME_MAX_FACTS || mutations.length > 8192 || operations.length > 8192) {
    return { events, failures: ["production_ai_enqueue_event_capture_dropped"], gaps };
  }
  const zero = { food: 0, wood: 0, stone: 0, minerals: 0 };
  for (const mutation of mutations.filter((entry) => entry.operation === "enqueue")) {
    const command = commands.find((scope) => scope.command.execution?.commandId === mutation.commandId);
    const before = capture.facts.find((fact) => fact.sequence === mutation.boundarySequences[0]);
    const charge = operations.find((operation) => operation.operationId === mutation.paymentOperationId);
    const immediate = mutation.item.payment === "immediate";
    const boundary =
      immediate && charge ? capture.facts.find((fact) => fact.sequence === charge.boundarySequences[0]) : before;
    const reserved = immediate ? charge?.reservedUnspentBefore : mutation.reservedUnspentBefore;
    const productKey = mutation.item.objectName ?? mutation.item.researchType;
    if (!["immediate", "per_successful_tick"].includes(mutation.item.payment)) {
      gaps.push("production_ai_enqueue_event_payment_unknown");
      continue;
    }
    if (
      !command?.decision ||
      !boundary?.boundaryState?.unspentClaims ||
      !reserved ||
      !productKey ||
      mutation.reservedUnspentAfter === null ||
      (immediate && !charge)
    ) {
      gaps.push("production_ai_enqueue_event_authority_missing");
      continue;
    }
    if (
      immediate &&
      (!charge ||
        charge.kind !== "immediate_charge" ||
        charge.commandId !== mutation.commandId ||
        charge.itemId !== mutation.item.itemId ||
        charge.actorId !== mutation.actorId ||
        charge.sequence >= mutation.sequence ||
        !sameRuntimeQueueVector(charge.resourcesAfter, mutation.resourcesBefore) ||
        !sameRuntimeQueueVector(charge.obligationsAfter, mutation.obligationsDue))
    ) {
      failures.push("production_ai_enqueue_event_charge_mismatch");
      continue;
    }
    const own = boundary.boundaryState.unspentClaims.entries.filter(
      (entry) =>
        entry.commandId === mutation.commandId &&
        entry.state === "admitted" &&
        entry.intent.intentId === command.acceptedIntent.intentId &&
        entry.intent.effectId === command.acceptedIntent.effectId
    );
    if (own.length !== 1) {
      gaps.push("production_ai_enqueue_event_own_claim_missing");
      continue;
    }
    const ownClaims = own[0]!.intent.claims.filter((claim) => claim.kind === "resource");
    const others = Object.fromEntries(
      Object.values(ResourceType).map((type) => [
        type,
        reserved[type] -
          ownClaims.filter((claim) => claim.resourceType === type).reduce((sum, claim) => sum + claim.amount, 0)
      ])
    );
    if (Object.values(others).some((amount) => !Number.isFinite(amount) || amount < 0)) {
      failures.push("production_ai_enqueue_event_own_claim_invalid");
      continue;
    }
    // The command's own selected budget becomes this event's price/liability. Subtract it once; retain all other claims.
    events.push({
      sequence: mutation.sequence,
      tick: mutation.tick,
      commandId: mutation.commandId,
      effectId: mutation.effectId,
      planId: mutation.planId,
      kind: "enqueue",
      actorId: mutation.actorId,
      productKey,
      itemId: mutation.item.itemId,
      laneId: mutation.laneId,
      createdActorId: null,
      resourcesBefore: immediate ? charge!.resourcesBefore : mutation.resourcesBefore,
      resourcesAfter: mutation.resourcesAfter,
      reservedUnspent: others,
      obligationsDue: immediate ? charge!.obligationsDue : mutation.obligationsDue,
      obligationsAfter: mutation.obligationsAfter,
      charged: immediate ? charge!.charged : zero,
      refundForItemId: null,
      refundAmounts: zero,
      ...(immediate ? {} : { remainingSuccessfulTicks: Math.max(1, Math.ceil(mutation.item.remainingTimeMs / 50)) })
    });
  }
  return structuredClone({
    events: failures.length ? [] : events,
    failures: [...new Set(failures)],
    gaps: [...new Set(gaps)]
  });
}
