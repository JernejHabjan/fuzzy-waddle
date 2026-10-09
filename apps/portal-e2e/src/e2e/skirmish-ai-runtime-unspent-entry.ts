import { hasRuntimeRemovedQueueOwnership } from "./skirmish-ai-runtime-removed-queue-ownership";
import { matchRuntimeRejectedAdmission } from "./skirmish-ai-runtime-rejected-admission";
import { isDeepStrictEqual } from "node:util";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type * as Capture from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type * as Facts from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import { sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";

import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type * as Unspent from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-unspent-claims-v1";
/** Reconciles one already validated selection against exact admission, payment, transfer and release boundaries. */
export function reconcileRuntimeUnspentEntry(
  capture: Capture.AiRuntimeProductionCaptureV1,
  fact: Facts.AiRuntimeProductionFactV1,
  entry: Unspent.AiRuntimeUnspentClaimsV1["entries"][number],
  intent: Extract<AiIntentV1, { kind: "produce" | "research" }>,
  prefix: readonly Facts.AiRuntimeProductionFactV1[],
  cutoff: number,
  commands: RuntimeProductionCausalityV1["commands"],
  payments: RuntimeProductionCausalityV1["payments"]
) {
  const failures: string[] = [];
  const gaps: string[] = [];
  const claims = intent.claims.filter((claim) => claim.kind === "resource");
  if (entry.state === "released" && entry.commandId === null) {
    const requests = prefix.filter(
      (candidate) =>
        candidate.kind === "intent_dispatch" &&
        candidate.event.kind === "requested" &&
        isDeepStrictEqual(candidate.event.acceptedIntent, intent) &&
        isDeepStrictEqual(candidate.event.decisionIdentity, entry.identity)
    );
    const releases = requests.flatMap((request) =>
      prefix.flatMap((receipt) => {
        if (
          request.kind !== "intent_dispatch" ||
          receipt.kind !== "intent_dispatch" ||
          receipt.event.kind !== "finished" ||
          receipt.event.receipt.status !== "rejected" ||
          !isDeepStrictEqual(receipt.event.correlation, request.event.correlation) ||
          receipt.sequence <= request.sequence
        )
          return [];
        const matched = matchRuntimeRejectedAdmission(capture, request, receipt);
        return matched.scope ? [matched.scope] : [];
      })
    );
    if (releases.length !== 1) gaps.push("production_ai_operation_rejected_admission_unspent_missing");
    return { failures, gaps };
  }
  const scope = commands.find(
    (command) =>
      isDeepStrictEqual(command.acceptedIntent, intent) &&
      isDeepStrictEqual(command.decision?.decision.identity, entry.identity)
  );
  const admitted = scope?.outcomes.some(
    (outcome) => outcome.sequence <= cutoff && outcome.outcome.kind === "dispatched"
  );
  const terminal = scope?.outcomes.some(
    (outcome) =>
      outcome.sequence <= cutoff && ["failed", "rejected", "cancelled", "completed"].includes(outcome.outcome.kind)
  );
  const payment = payments.find(
    (payment) =>
      payment.sequence <= cutoff &&
      payment.resource.operation === "immediate_charge" &&
      payment.resource.originatingCommandContext?.execution.commandId === entry.commandId
  );
  const price = Object.fromEntries(
    Object.values(ResourceType).map((type) => [
      type,
      claims.reduce((sum, claim) => sum + (claim.resourceType === type ? claim.amount : 0), 0)
    ])
  );
  const paid = !!payment && sameRuntimeQueueVector(payment.resource.storedPrice, price);
  const items =
    fact.boundaryState?.queues?.flatMap((queue) =>
      queue.lanes.flatMap((lane) =>
        lane.items.filter((item) => item.commandId === entry.commandId).map((item) => ({ queue, item }))
      )
    ) ?? [];
  const insertions = prefix.flatMap((candidate) =>
    candidate.kind === "queue_changed"
      ? [
          {
            sequence: candidate.sequence,
            tick: candidate.tick,
            queue: candidate.queue
          }
        ]
      : candidate.kind === "queue_mutation" &&
          candidate.mutation.operation === "enqueue" &&
          candidate.mutation.phase === "after" &&
          candidate.mutation.actorId === intent.producerId &&
          candidate.mutation.item?.commandId === entry.commandId &&
          isDeepStrictEqual(candidate.mutation.originatingCommandContext?.execution, scope?.command.execution)
        ? (candidate.boundaryState?.queues ?? [])
            .filter((queue) => queue.actorId === intent.producerId)
            .map((queue) => ({
              sequence: candidate.sequence,
              tick: candidate.tick,
              queue
            }))
        : []
  );
  const inserted = insertions.some(
    (candidate) =>
      !!scope &&
      candidate.tick === scope.command.tick &&
      scope.outcomes.some(
        (outcome) => outcome.sequence < candidate.sequence && outcome.outcome.kind === "dispatched"
      ) &&
      candidate.queue.actorId === intent.producerId &&
      candidate.queue.lanes.some((lane) =>
        lane.items.some(
          (item) =>
            item.commandId === entry.commandId &&
            item.identitySource === "command" &&
            item.itemId === `queue:${intent.producerId}:${entry.commandId}` &&
            item.payment === "per_successful_tick" &&
            item.effectId === scope?.command.execution?.effectId &&
            item.objectName === (intent.kind === "produce" ? intent.objectName : null) &&
            item.researchType === null &&
            sameRuntimeQueueVector(item.charge, price)
        )
      )
  );
  const owned = items[0];
  const transferred =
    inserted &&
    items.length === 1 &&
    !!owned &&
    owned.queue.actorId === intent.producerId &&
    owned.item.identitySource === "command" &&
    owned.item.itemId === `queue:${intent.producerId}:${entry.commandId}` &&
    owned.item.payment === "per_successful_tick" &&
    owned.item.effectId === scope?.command.execution?.effectId &&
    owned.item.objectName === (intent.kind === "produce" ? intent.objectName : null) &&
    owned.item.researchType === null &&
    sameRuntimeQueueVector(owned.item.charge, price);
  // The exact consumed/removal interval may retire physical liability before its later native terminal.
  const removed =
    entry.state === "queue_liability" &&
    inserted &&
    items.length === 0 &&
    !!scope &&
    hasRuntimeRemovedQueueOwnership(capture, fact, scope, cutoff, commands);
  if (entry.state === "queue_liability" && !transferred && !removed)
    gaps.push("production_ai_operation_queue_transfer_missing");
  if (
    entry.state === "selected"
      ? entry.commandId !== null || admitted
      : !scope?.decision ||
        !admitted ||
        scope.command.execution?.commandId !== entry.commandId ||
        (entry.state === "admitted"
          ? paid || transferred || terminal
          : entry.state === "paid"
            ? !paid ||
              scope?.outcomes.some(
                (outcome) =>
                  outcome.sequence <= cutoff && ["failed", "rejected", "cancelled"].includes(outcome.outcome.kind)
              )
            : entry.state === "queue_liability"
              ? terminal
              : !terminal)
  ) {
    failures.push("production_ai_operation_unspent_state_invalid");
  }
  return { failures, gaps };
}
