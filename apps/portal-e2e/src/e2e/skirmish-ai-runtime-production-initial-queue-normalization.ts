import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";
import type { RuntimeProductionInitialQueueV1 } from "./skirmish-ai-runtime-production-initial-queue";
import { isRuntimeProductionBalance } from "./skirmish-ai-runtime-production-balance";
import { normalizeRuntimeScopedQueuePayments, sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";
import { validateRuntimeQueueMutationBoundaries } from "./skirmish-ai-runtime-queue-mutation-boundaries";
import { sameRuntimeQueueCommand } from "./skirmish-ai-runtime-queue-command-equality";

/** Joins actual setup commands to captured physical insertion/money and the tick-zero item, before resource resets. */
export function normalizeRuntimeProductionInitialQueues(
  capture: AiRuntimeProductionCaptureV1, setup: AiRuntimePresetApplicationV1 | undefined
) {
  const items: RuntimeProductionInitialQueueV1[] = [];
  const failures: string[] = [];
  const gaps = new Set<string>();
  if (capture.facts.length > 8192 || (setup && (setup.queueApplications.length > 2048 || setup.initialQueueItems.length > 2048))) {
    return { items, failures: ["production_initial_queue_setup_overflow"], gaps: [] };
  }
  const initial = capture.snapshots[0];
  if (!setup || capture.startedTick !== 0 || initial?.tick !== 0 || !initial.world) {
    return { items, failures, gaps: ["production_initial_queue_provenance_missing"] };
  }
  if (initial.world.snapshotRestoreInProgress || !setup.fixtureId || !setup.sourceRevision || !setup.fixtureDigest ||
    setup.queuedItemCount !== setup.initialQueueItems.length || setup.queueApplications.length !== setup.queuedItemCount ||
    new Set(setup.initialQueueItems.map((entry) => entry.itemId)).size !== setup.initialQueueItems.length ||
    new Set(setup.queueApplications.map((entry) => entry.itemId)).size !== setup.queueApplications.length) {
    return { items, failures: ["production_initial_queue_setup_invalid"], gaps: [] };
  }
  const applications = setup.queueApplications.filter((entry) => entry.command.playerNumber === capture.playerNumber);
  // Subsequent gameplay can charge, finish or refund this same item; it cannot rewrite its paused setup provenance.
  const facts = capture.facts.filter((fact) => fact.tick === 0);
  const physical = initial.queues.flatMap((queue) => queue.lanes.flatMap((lane) => lane.items.map((item) => ({ queue, lane, item }))));
  if (physical.length > 2048) return { items, failures: ["production_initial_queue_physical_overflow"], gaps: [] };
  for (const application of applications) {
    const command = application.command;
    const execution = command.execution;
    const seeded = setup.initialQueueItems.find((entry) => entry.itemId === application.itemId);
    const matches = physical.filter((entry) => entry.item.itemId === application.itemId);
    const match = matches[0];
    const product = command.type === "PRODUCTION" ? command.actorName : command.type === "RESEARCH" ? command.researchType : null;
    const catalog = initial.world.catalog.find((entry) => entry.producerActorId === command.actorIds[0] && entry.productKey === product &&
      entry.kind === (command.type === "PRODUCTION" ? "production" : "research"));
    if (!execution || !seeded || matches.length !== 1 || !match || !catalog || !product || command.tick !== 0 ||
      execution.schemaVersion !== 1 || !execution.commandId || !execution.commitmentKey ||
      !Number.isSafeInteger(execution.sequence) || execution.sequence <= 0 ||
      !Number.isSafeInteger(execution.authorityEpoch) || execution.authorityEpoch < 0 ||
      command.actorIds.length !== 1 || command.actorIds[0] !== match.queue.actorId ||
      seeded.producerActorId !== match.queue.actorId || seeded.producerFixtureActorId !== application.producerFixtureActorId ||
      setup.createdActorIds[application.producerFixtureActorId] !== match.queue.actorId ||
      seeded.objectName !== match.item.objectName || seeded.researchType !== match.item.researchType ||
      seeded.kind !== catalog.kind || match.item.identitySource !== "command" ||
      match.item.commandId !== execution.commandId || match.item.effectId !== (execution.effectId ?? null) ||
      match.item.itemId !== `queue:${match.queue.actorId}:${execution.commandId}` ||
      (command.type === "PRODUCTION" ? match.item.objectName !== command.actorName || match.item.researchType !== null :
        command.type !== "RESEARCH" || match.item.researchType !== command.researchType || match.item.objectName !== null) ||
      match.item.remainingTimeMs !== match.item.totalTimeMs || match.item.totalTimeMs !== catalog.durationMs ||
      match.item.payment !== catalog.payment || !sameRuntimeQueueVector(match.item.charge, catalog.cost) ||
      ![application.resourcesBefore, application.resourcesAfter].every(isRuntimeProductionBalance)) {
      failures.push("production_initial_queue_identity_or_price"); continue;
    }
    const delivered = facts.filter((fact) => fact.kind === "command_delivered" &&
      fact.command.execution?.commandId === execution.commandId);
    const applied = application.outcomes.filter((outcome) => outcome.kind === "applied");
    if (delivered.length !== 1 || delivered[0].kind !== "command_delivered" || delivered[0].tick !== 0 ||
      !sameRuntimeQueueCommand(delivered[0].command, command) || applied.length !== 1 ||
      !isDeepStrictEqual(applied[0]?.worldLinkIds, [command.type === "PRODUCTION" ? match.item.itemId : `research:${product}`]) ||
      application.outcomes.some((outcome) => outcome.commandId !== execution.commandId || outcome.playerNumber !== capture.playerNumber ||
        outcome.tick !== 0 || !isDeepStrictEqual(outcome.actorIds, command.actorIds) ||
        !["dispatched", "applied", "active"].includes(outcome.kind) ||
        !(["schemaVersion", "commitmentKey", "authorityEpoch", "sequence", "intentId", "effectId"] as const)
          .every((key) => outcome[key] === execution[key]) || (outcome.kind === "applied" && outcome.reason !== "applied")) ||
      !application.outcomes.every((outcome) => facts.some((fact) => fact.kind === "outcome" &&
        isDeepStrictEqual(fact.outcome, outcome)))) {
      failures.push("production_initial_queue_native_application"); continue;
    }
    const mutations = facts.filter((fact) => fact.kind === "queue_mutation" &&
      fact.mutation.operation === "enqueue" && fact.mutation.item?.itemId === match.item.itemId);
    const before = mutations.find((fact) => fact.mutation.phase === "before");
    const after = mutations.find((fact) => fact.mutation.phase === "after");
    if (!before || !after) { gaps.add("production_initial_queue_insertion_missing"); continue; }
    if (mutations.length !== 2 || before.tick !== 0 || after.tick !== 0 || after.sequence !== before.sequence + 1 ||
      !Number.isSafeInteger(before.mutation.mutationId) || before.mutation.mutationId <= 0 ||
      !isDeepStrictEqual({ ...before.mutation, phase: "after" }, after.mutation) ||
      !isDeepStrictEqual(before.mutation.item, match.item) || before.mutation.actorId !== match.queue.actorId ||
      before.mutation.laneId !== match.lane.laneId || before.mutation.snapshotRestoreInProgress || before.mutation.gaps.length ||
      before.mutation.cancellationCommand !== null ||
      !isDeepStrictEqual(before.mutation.originatingCommandContext, {
        execution, playerNumber: capture.playerNumber, actorIds: command.actorIds
      })) {
      failures.push("production_initial_queue_insertion_invalid"); continue;
    }
    const boundary = validateRuntimeQueueMutationBoundaries(before, after);
    failures.push(...boundary.failures);
    boundary.gaps.forEach((gap) => gaps.add(gap));
    if (!boundary.boundary) continue;
    const appliedFacts = facts.filter((fact) => fact.kind === "outcome" && fact.outcome.commandId === execution.commandId &&
      fact.outcome.kind === "applied");
    if (appliedFacts.length !== 1 || appliedFacts[0].sequence <= after.sequence) {
      failures.push("production_initial_queue_application_order"); continue;
    }
    const rawPayments = facts.filter((fact) => fact.kind === "queue_resource" &&
      fact.resource.originatingCommandContext?.execution.commandId === execution.commandId);
    const payment = normalizeRuntimeScopedQueuePayments({ ...capture, facts: rawPayments }, [command]);
    failures.push(...payment.failures);
    const charge = payment.payments[0];
    if (match.item.payment === "immediate" && !rawPayments.length) {
      gaps.add("production_initial_queue_paid_authority_missing"); continue;
    }
    if (match.item.payment === "immediate" ? payment.payments.length !== 1 || !charge ||
      charge.resource.operation !== "immediate_charge" || charge.sequence >= before.sequence ||
      charge.resource.itemId !== match.item.itemId || charge.resource.totalTimeMs !== match.item.totalTimeMs ||
      charge.resource.remainingTimeMs !== match.item.totalTimeMs ||
      !sameRuntimeQueueVector(charge.resource.storedPrice, match.item.charge) ||
      !sameRuntimeQueueVector(charge.resource.emission.requested, match.item.charge) ||
      !sameRuntimeQueueVector(charge.resource.emission.before, application.resourcesBefore) ||
      !sameRuntimeQueueVector(charge.resource.emission.after, application.resourcesAfter)
      : rawPayments.length !== 0 || !sameRuntimeQueueVector(application.resourcesBefore, application.resourcesAfter)) {
      failures.push("production_initial_queue_payment_mismatch"); continue;
    }
    if (!sameRuntimeQueueVector(boundary.boundary.resourcesBefore, application.resourcesAfter)) {
      failures.push("production_initial_queue_insertion_cash_mismatch"); continue;
    }
    items.push({ producerActorId: match.queue.actorId, laneId: match.lane.laneId, item: match.item, setupApplication: application,
      insertionSequences: [before.sequence, after.sequence], paymentSequence: charge?.sequence ?? null,
      state: match.item.payment === "immediate" ? "paid_immediate" : "unpaid_per_tick" });
  }
  if (physical.some((entry) => !applications.some((application) => application.itemId === entry.item.itemId))) {
    gaps.add("production_initial_queue_pre_capture_or_uncommanded");
  }
  return structuredClone({ items: failures.length ? [] : items, failures: [...new Set(failures)], gaps: [...gaps].sort() });
}
