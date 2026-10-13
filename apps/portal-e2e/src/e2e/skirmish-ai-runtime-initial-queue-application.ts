import { isDeepStrictEqual } from "node:util";
// prettier-ignore
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
// prettier-ignore
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
// prettier-ignore
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";
import type { RuntimeProductionInitialQueueV1 } from "./skirmish-ai-runtime-production-initial-queue";
import { isRuntimeProductionBalance } from "./skirmish-ai-runtime-production-balance";
import {
  normalizeRuntimeScopedQueuePayments,
  sameRuntimeQueueVector
} from "./skirmish-ai-runtime-scoped-queue-payments";
import { validateRuntimeQueueMutationBoundaries } from "./skirmish-ai-runtime-queue-mutation-boundaries";
import { sameRuntimeQueueCommand } from "./skirmish-ai-runtime-queue-command-equality";

/** Validates one actual paused insertion/payment. The caller retains complete failures and never promotes a partial item. */
export function appendRuntimeInitialQueueApplication(
  application: AiRuntimePresetApplicationV1["queueApplications"][number],
  capture: AiRuntimeProductionCaptureV1,
  setup: AiRuntimePresetApplicationV1,
  initial: AiRuntimeProductionCaptureV1["snapshots"][number] & {
    world: NonNullable<AiRuntimeProductionCaptureV1["snapshots"][number]["world"]>;
  },
  facts: readonly AiRuntimeProductionFactV1[],
  physical: readonly {
    queue: AiRuntimeProductionCaptureV1["snapshots"][number]["queues"][number];
    lane: AiRuntimeProductionCaptureV1["snapshots"][number]["queues"][number]["lanes"][number];
    item: AiRuntimeProductionCaptureV1["snapshots"][number]["queues"][number]["lanes"][number]["items"][number];
  }[],
  items: RuntimeProductionInitialQueueV1[],
  failures: string[],
  gaps: Set<string>
): void {
  const command = application.command;
  const execution = command.execution;
  const seeded = setup.initialQueueItems.find((entry) => entry.itemId === application.itemId);
  const matches = physical.filter((entry) => entry.item.itemId === application.itemId);
  const match = matches[0];
  const product =
    command.type === "PRODUCTION" ? command.actorName : command.type === "RESEARCH" ? command.researchType : null;
  const catalog = initial.world.catalog.find(
    (entry) =>
      entry.producerActorId === command.actorIds[0] &&
      entry.productKey === product &&
      entry.kind === (command.type === "PRODUCTION" ? "production" : "research")
  );
  if (
    !execution ||
    !seeded ||
    matches.length !== 1 ||
    !match ||
    !catalog ||
    !product ||
    command.tick !== 0 ||
    execution.schemaVersion !== 1 ||
    !execution.commandId ||
    !execution.commitmentKey ||
    !Number.isSafeInteger(execution.sequence) ||
    execution.sequence < 0 ||
    !Number.isSafeInteger(execution.authorityEpoch) ||
    execution.authorityEpoch < 0 ||
    command.actorIds.length !== 1 ||
    command.actorIds[0] !== match.queue.actorId ||
    seeded.producerActorId !== match.queue.actorId ||
    seeded.producerFixtureActorId !== application.producerFixtureActorId ||
    setup.createdActorIds[application.producerFixtureActorId] !== match.queue.actorId ||
    seeded.objectName !== match.item.objectName ||
    seeded.researchType !== match.item.researchType ||
    seeded.kind !== catalog.kind ||
    match.item.identitySource !== "command" ||
    match.item.commandId !== execution.commandId ||
    match.item.effectId !== (execution.effectId ?? null) ||
    match.item.itemId !== `queue:${match.queue.actorId}:${execution.commandId}` ||
    (command.type === "PRODUCTION"
      ? match.item.objectName !== command.actorName || match.item.researchType !== null
      : command.type !== "RESEARCH" ||
        match.item.researchType !== command.researchType ||
        match.item.objectName !== null) ||
    match.item.remainingTimeMs !== match.item.totalTimeMs ||
    match.item.totalTimeMs !== catalog.durationMs ||
    match.item.payment !== catalog.payment ||
    !sameRuntimeQueueVector(match.item.charge, catalog.cost) ||
    ![application.resourcesBefore, application.resourcesAfter].every(isRuntimeProductionBalance)
  ) {
    failures.push("production_initial_queue_identity_or_price");
    return;
  }
  const delivered = facts.filter(
    (fact) => fact.kind === "command_delivered" && fact.command.execution?.commandId === execution.commandId
  );
  const deliveredCommand = delivered[0];
  const applied = application.outcomes.filter((outcome) => outcome.kind === "applied");
  if (
    delivered.length !== 1 ||
    deliveredCommand?.kind !== "command_delivered" ||
    deliveredCommand.tick !== 0 ||
    !sameRuntimeQueueCommand(deliveredCommand.command, command) ||
    applied.length !== 1 ||
    !isDeepStrictEqual(applied[0]?.worldLinkIds, [
      command.type === "PRODUCTION" ? match.item.itemId : `research:${product}`
    ]) ||
    application.outcomes.some(
      (outcome) =>
        outcome.commandId !== execution.commandId ||
        outcome.playerNumber !== capture.playerNumber ||
        outcome.tick !== 0 ||
        !isDeepStrictEqual(outcome.actorIds, command.actorIds) ||
        !["dispatched", "applied", "active"].includes(outcome.kind) ||
        !(["schemaVersion", "commitmentKey", "authorityEpoch", "sequence", "intentId", "effectId"] as const).every(
          (key) => outcome[key] === execution[key]
        ) ||
        (outcome.kind === "applied" && outcome.reason !== "applied")
    ) ||
    !application.outcomes.every((outcome) =>
      facts.some((fact) => fact.kind === "outcome" && isDeepStrictEqual(fact.outcome, outcome))
    )
  ) {
    failures.push("production_initial_queue_native_application");
    return;
  }
  const mutations = facts.filter(
    (fact): fact is Extract<AiRuntimeProductionFactV1, { kind: "queue_mutation" }> =>
      fact.kind === "queue_mutation" &&
      fact.mutation.operation === "enqueue" &&
      fact.mutation.item?.itemId === match.item.itemId
  );
  const before = mutations.find((fact) => fact.mutation.phase === "before");
  const after = mutations.find((fact) => fact.mutation.phase === "after");
  if (!before || !after) {
    gaps.add("production_initial_queue_insertion_missing");
    return;
  }
  if (
    mutations.length !== 2 ||
    before.tick !== 0 ||
    after.tick !== 0 ||
    after.sequence !== before.sequence + 1 ||
    !Number.isSafeInteger(before.mutation.mutationId) ||
    before.mutation.mutationId <= 0 ||
    !isDeepStrictEqual({ ...before.mutation, phase: "after" }, after.mutation) ||
    !isDeepStrictEqual(before.mutation.item, match.item) ||
    before.mutation.actorId !== match.queue.actorId ||
    before.mutation.laneId !== match.lane.laneId ||
    before.mutation.snapshotRestoreInProgress ||
    before.mutation.gaps.length ||
    before.mutation.cancellationCommand !== null ||
    !isDeepStrictEqual(before.mutation.originatingCommandContext, {
      execution,
      playerNumber: capture.playerNumber,
      actorIds: command.actorIds
    })
  ) {
    failures.push("production_initial_queue_insertion_invalid");
    return;
  }
  const boundary = validateRuntimeQueueMutationBoundaries(before, after);
  failures.push(...boundary.failures);
  boundary.gaps.forEach((gap) => gaps.add(gap));
  if (!boundary.boundary) return;
  const appliedFacts = facts.filter(
    (fact) =>
      fact.kind === "outcome" && fact.outcome.commandId === execution.commandId && fact.outcome.kind === "applied"
  );
  const appliedFact = appliedFacts[0];
  if (appliedFacts.length !== 1 || !appliedFact || appliedFact.sequence <= after.sequence) {
    failures.push("production_initial_queue_application_order");
    return;
  }
  const rawPayments = facts.filter(
    (fact) =>
      fact.kind === "queue_resource" &&
      fact.resource.originatingCommandContext?.execution.commandId === execution.commandId
  );
  const payment = normalizeRuntimeScopedQueuePayments({ ...capture, facts: rawPayments }, [command]);
  failures.push(...payment.failures);
  const charge = payment.payments[0];
  if (match.item.payment === "immediate" && !rawPayments.length) {
    gaps.add("production_initial_queue_paid_authority_missing");
    return;
  }
  if (
    match.item.payment === "immediate"
      ? payment.payments.length !== 1 ||
        !charge ||
        charge.resource.operation !== "immediate_charge" ||
        charge.sequence >= before.sequence ||
        charge.resource.itemId !== match.item.itemId ||
        charge.resource.totalTimeMs !== match.item.totalTimeMs ||
        charge.resource.remainingTimeMs !== match.item.totalTimeMs ||
        !sameRuntimeQueueVector(charge.resource.storedPrice, match.item.charge) ||
        !sameRuntimeQueueVector(charge.resource.emission.requested, match.item.charge) ||
        !sameRuntimeQueueVector(charge.resource.emission.before, application.resourcesBefore) ||
        !sameRuntimeQueueVector(charge.resource.emission.after, application.resourcesAfter)
      : rawPayments.length !== 0 || !sameRuntimeQueueVector(application.resourcesBefore, application.resourcesAfter)
  ) {
    failures.push("production_initial_queue_payment_mismatch");
    return;
  }
  if (!sameRuntimeQueueVector(boundary.boundary.resourcesBefore, application.resourcesAfter)) {
    failures.push("production_initial_queue_insertion_cash_mismatch");
    return;
  }
  items.push({
    producerActorId: match.queue.actorId,
    laneId: match.lane.laneId,
    item: match.item,
    setupApplication: application,
    insertionSequences: [before.sequence, after.sequence],
    paymentSequence: charge?.sequence ?? null,
    state: match.item.payment === "immediate" ? "paid_immediate" : "unpaid_per_tick"
  });
}
