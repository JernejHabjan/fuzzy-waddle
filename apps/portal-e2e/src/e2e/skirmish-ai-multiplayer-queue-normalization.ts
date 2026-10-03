import { ResourceType, type GameCommand, type GameCommandOutcomeKind } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiMultiplayerQueueWorldV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-multiplayer-queue-world-v1";

/** Normalizes this narrow real queue experiment. It cannot populate RuntimeProductionEvidenceV1 or clear its AI/fairness gaps. */
export function normalizeMultiplayerQueueBoundary(world: AiMultiplayerQueueWorldV1, requireSenderRequest: boolean) {
  const failures: string[] = [];
  const setup = world.setup;
  const capture = world.capture;
  const roles = ["purchase", "probe", "cancel", "resume"] as const;
  const commands = roles.map((role) => world.commands.find((entry) => entry.role === role)?.command);
  const [, probe, cancel, resume] = commands;
  const ids = commands.map((command) => command?.execution?.commandId);
  const itemId = (id: string | undefined) => setup && id ? `queue:${setup.producerActorId}:${id}` : null;
  const boundary = (name: AiMultiplayerQueueWorldV1["checkpoints"][number]["boundary"]) =>
    world.checkpoints.find((entry) => entry.boundary === name)?.snapshot;
  const [ready, paid, rejected, refunded, resumed, complete] =
    [boundary("ready"), boundary("paid"), boundary("rejected"), boundary("refunded"), boundary("resumed"), boundary("complete")];
  if (world.state !== "complete" || world.failure || !setup || !capture ||
    !ready || !paid || !rejected || !refunded || !resumed || !complete) {
    failures.push("queue_boundary_incomplete");
  }
  if (!setup || !capture) return { failures, payments: [], request: null, rejection: null, completion: null };
  const types = Object.values(ResourceType);
  const vectorEqual = (left: Readonly<Partial<Record<ResourceType, number>>> | null | undefined,
    right: Readonly<Partial<Record<ResourceType, number>>> | null | undefined) => !!left && !!right &&
    types.every((type) => Number.isFinite(left[type] ?? 0) && Number.isFinite(right[type] ?? 0) &&
      (left[type] ?? 0) >= 0 && (right[type] ?? 0) >= 0 && (left[type] ?? 0) === (right[type] ?? 0));
  if (capture.droppedFactCount || capture.droppedSnapshotCount || capture.playerNumber !== setup.playerNumber ||
    capture.facts.some((fact, index) => fact.playerNumber !== setup.playerNumber || !Number.isSafeInteger(fact.sequence) ||
      fact.sequence <= 0 || (index > 0 && fact.sequence <= capture.facts[index - 1].sequence))) {
    failures.push("queue_boundary_capture_incomplete");
  }
  if (world.commands.length !== 4 || ids.some((id) => !id) || new Set(ids).size !== 4 || commands.some((command, index) =>
    !command || command.playerNumber !== setup.playerNumber || command.actorIds.length !== 1 ||
    command.actorIds[0] !== setup.producerActorId || command.execution?.source !== "human" ||
    !Number.isSafeInteger(command.tick) || command.tick < 0 ||
    (index === 2 ? command.type !== "CANCEL_PRODUCTION" || command.queueIndex !== 0
      : command.type !== "PRODUCTION" || command.actorName !== setup.product))) {
    failures.push("queue_boundary_command_lineage_missing");
  }
  for (const command of commands) {
    const delivered = capture.facts.filter((fact) => fact.kind === "command_delivered" &&
      fact.command.execution?.commandId === command?.execution?.commandId);
    if (delivered.length !== 1 || delivered[0]?.kind !== "command_delivered" ||
      !sameQueueCommand(delivered[0].command, command)) failures.push("queue_boundary_delivery_missing");
  }
  const outcomes = capture.facts.filter((fact) => fact.kind === "outcome");
  const outcome = (id: string | undefined, kind: GameCommandOutcomeKind) => outcomes.filter((fact) =>
    fact.outcome.commandId === id && fact.outcome.kind === kind);
  const probeOutcomes = outcome(ids[1], "rejected");
  const cancelOutcomes = outcome(ids[2], "cancelled");
  const completed = outcome(ids[3], "completed");
  const rejection = probeOutcomes[0] ?? null;
  const completion = completed[0] ?? null;
  if (outcomes.some((fact) => {
    const command = commands.find((entry) => entry?.execution?.commandId === fact.outcome.commandId);
    return command && (fact.outcome.actorIds.length !== 1 || fact.outcome.actorIds[0] !== setup.producerActorId ||
      fact.outcome.playerNumber !== setup.playerNumber || fact.outcome.authorityEpoch !== command.execution?.authorityEpoch ||
      fact.outcome.sequence !== command.execution?.sequence || fact.outcome.commitmentKey !== command.execution?.commitmentKey);
  })) failures.push("queue_boundary_outcome_lineage_invalid");
  if (outcome(ids[0], "applied").length !== 1 || outcome(ids[0], "cancelled").length !== 1 ||
    probeOutcomes.length !== 1 || rejection?.outcome.reason !== "insufficient_resources" ||
    cancelOutcomes.length !== 1 || outcome(ids[3], "applied").length !== 1 || completed.length !== 1 ||
    outcome(ids[1], "applied").length || outcomes.some((fact) => ids.includes(fact.outcome.commandId) &&
      (fact.outcome.kind === "failed" || (fact.outcome.kind === "rejected" && fact.outcome.commandId !== ids[1])))) {
    failures.push("queue_boundary_outcome_missing");
  }
  const payments = capture.facts.flatMap((fact) => {
    if (fact.kind !== "queue_resource" || fact.resource.emission.phase !== "finished") return [];
    const resource = fact.resource;
    const emission = fact.resource.emission;
    const context = resource.originatingCommandContext;
    const origin = commands.find((entry) => entry?.execution?.commandId === context?.execution.commandId);
    const matching = capture.facts.filter((candidate) => candidate.kind === "queue_resource" &&
      candidate.resource.emission.operationId === emission.operationId);
    const started = matching.filter((candidate) => candidate.kind === "queue_resource" &&
      candidate.resource.emission.phase === "started");
    const callbacks = matching.filter((candidate) => candidate.kind === "queue_resource" &&
      candidate.resource.emission.phase === "callback");
    if (resource.gaps.length || resource.actorId !== setup.producerActorId || resource.ownerNumber !== setup.playerNumber ||
      !context || !origin || context.playerNumber !== setup.playerNumber || context.actorIds.length !== 1 ||
      context.actorIds[0] !== setup.producerActorId || context.execution.authorityEpoch !== origin.execution?.authorityEpoch ||
      context.execution.sequence !== origin.execution?.sequence || context.execution.commitmentKey !== origin.execution?.commitmentKey ||
      (resource.operation === "cancellation_refund"
        ? !resource.cancellationCommand || !sameQueueCommand(resource.cancellationCommand, cancel)
        : resource.cancellationCommand !== null) ||
      resource.identitySource !== "command" || resource.payment !== "immediate" || resource.objectName !== setup.product ||
      !vectorEqual(resource.storedPrice, setup.price) || resource.refundFactor !== setup.refundFactor ||
      resource.totalTimeMs !== setup.durationMs || emission.status !== "returned" || emission.snapshotRestoreInProgress ||
      emission.callbackCount !== 1 || emission.callbackLimitExceeded || emission.nestedEmission || !emission.balanceMatches ||
      !emission.before || !emission.after || !emission.requested || matching.length !== 3 || started.length !== 1 ||
      callbacks.length !== 1 || started[0].sequence >= callbacks[0].sequence || callbacks[0].sequence >= fact.sequence ||
      matching.some((candidate) => candidate.kind !== "queue_resource" || candidate.resource.gaps.length > 0 ||
        candidate.resource.actorId !== resource.actorId || candidate.resource.ownerNumber !== resource.ownerNumber ||
        candidate.resource.originatingCommandContext?.execution.commandId !==
          resource.originatingCommandContext?.execution.commandId ||
        candidate.resource.cancellationCommand?.execution?.commandId !== resource.cancellationCommand?.execution?.commandId ||
        candidate.resource.itemId !== resource.itemId ||
        candidate.resource.operation !== resource.operation || !vectorEqual(candidate.resource.emission.before, emission.before) ||
        !vectorEqual(candidate.resource.emission.requested, emission.requested) ||
        (candidate.resource.emission.phase === "callback" && !vectorEqual(candidate.resource.emission.amounts, emission.requested)))) {
      failures.push("queue_boundary_scoped_payment_invalid");
    }
    return [{ sequence: fact.sequence, tick: fact.tick, operation: resource.operation, itemId: resource.itemId,
      purchaseCommandId: resource.originatingCommandContext?.execution.commandId ?? null,
      cancellationCommandId: resource.cancellationCommand?.execution?.commandId ?? null,
      resourcesBefore: emission.before, resourcesAfter: emission.after, amounts: emission.requested }];
  });
  const charge = payments.find((payment) => payment.operation === "immediate_charge" && payment.purchaseCommandId === ids[0]);
  const refund = payments.find((payment) => payment.operation === "cancellation_refund");
  const newCharge = payments.find((payment) => payment.operation === "immediate_charge" && payment.purchaseCommandId === ids[3]);
  const refundPrice = Object.fromEntries(types.map((type) => [type, Math.floor((setup.price[type] ?? 0) * setup.refundFactor)]));
  if (payments.length !== 3 || !charge || !refund || !newCharge || charge.itemId !== itemId(ids[0]) ||
    refund.itemId !== itemId(ids[0]) || refund.cancellationCommandId !== ids[2] ||
    newCharge.itemId !== itemId(ids[3]) || !vectorEqual(charge.amounts, setup.price) ||
    !vectorEqual(newCharge.amounts, setup.price) || !vectorEqual(refund.amounts, refundPrice) ||
    !types.some((type) => (refundPrice[type] ?? 0) > 0) ||
    payments.some((payment) => !types.every((type) => payment.resourcesAfter?.[type] ===
      (payment.resourcesBefore?.[type] ?? Number.NaN) +
        (payment.operation === "cancellation_refund" ? 1 : -1) * (payment.amounts?.[type] ?? 0)))) {
    failures.push("queue_boundary_price_or_refund_invalid");
  }
  const request = world.requests.find((entry) => entry.role === "cancel") ?? null;
  const items = (snapshot: typeof paid) => snapshot?.queues.filter((queue) => queue.actorId === setup.producerActorId)
    .flatMap((queue) => queue.lanes.flatMap((lane) => lane.items)) ?? [];
  if (requireSenderRequest) {
    const dispatched = outcome(ids[2], "dispatched");
    const pending = boundary("cancel_pending");
    if (!request || request.command.execution?.commandId !== ids[2] || dispatched.length !== 1 ||
      dispatched[0].tick !== request.requestedTick || dispatched[0].scheduledTick !== cancel?.tick ||
      !Number.isSafeInteger(request.requestedTick) || !pending || pending.tick !== request.requestedTick ||
      !probe || !cancel || request.requestedTick >= probe.tick || probe.tick >= cancel.tick ||
      items(pending).length !== 1 || items(pending)[0]?.itemId !== itemId(ids[0]) ||
      !vectorEqual(pending.resources, paid?.resources) ||
      dispatched[0].sequence >= (rejection?.sequence ?? -1)) failures.push("queue_boundary_pending_request_missing");
  }
  if (items(ready).length || items(paid).length !== 1 || items(paid)[0]?.itemId !== itemId(ids[0]) ||
    items(rejected).length !== 1 || items(rejected)[0]?.itemId !== itemId(ids[0]) || items(refunded).length ||
    items(resumed).length !== 1 || items(resumed)[0]?.itemId !== itemId(ids[3]) || items(complete).length) {
    failures.push("queue_boundary_physical_item_missing");
  }
  if (!charge || !refund || !newCharge || !rejection || !probe || !cancel ||
    charge.tick !== commands[0]?.tick || newCharge.tick !== resume?.tick ||
    rejection.tick !== probe.tick || refund.tick !== cancel.tick || rejection.tick >= refund.tick ||
    rejected?.tick !== rejection.tick || refunded?.tick !== refund.tick || cancelOutcomes[0]?.tick !== refund.tick ||
    charge.sequence >= rejection.sequence || rejection.sequence >= refund.sequence || refund.sequence >= newCharge.sequence ||
    !vectorEqual(ready?.resources, setup.initialResources) || !vectorEqual(paid?.resources, charge.resourcesAfter) ||
    !vectorEqual(rejected?.resources, charge.resourcesAfter) || !vectorEqual(refund.resourcesBefore, rejected?.resources) ||
    !vectorEqual(refunded?.resources, refund.resourcesAfter) || !vectorEqual(newCharge.resourcesBefore, refund.resourcesAfter) ||
    !types.some((type) => (setup.price[type] ?? 0) > (rejected?.resources[type] ?? Number.POSITIVE_INFINITY)) ||
    !types.every((type) => (setup.price[type] ?? 0) <= (rejected?.resources[type] ?? -1) + (refund.amounts?.[type] ?? 0))) {
    failures.push("queue_boundary_pre_credit_probe_missing");
  }
  if (!completion || !complete || completion.outcome.worldLinkIds.length !== 1 ||
    !complete.ownedActors.some((actor) => actor.actorId === completion.outcome.worldLinkIds[0]) ||
    ready?.ownedActors.some((actor) => actor.actorId === completion.outcome.worldLinkIds[0]) ||
    (completion.tick < (resume?.tick ?? Number.POSITIVE_INFINITY))) failures.push("queue_boundary_useful_spawn_missing");
  return { failures: [...new Set(failures)], payments, request, rejection, completion };
}

/** Wire object property order is irrelevant; compare the complete stamped queue payload and execution identity. */
function sameQueueCommand(left: GameCommand, right: GameCommand | undefined): boolean {
  if (!right || left.tick !== right.tick || left.playerNumber !== right.playerNumber ||
    left.actorIds.length !== right.actorIds.length ||
    left.actorIds.some((actorId, index) => actorId !== right.actorIds[index]) ||
    !(["schemaVersion", "commandId", "commitmentKey", "source", "authorityEpoch", "sequence", "intentId", "effectId"] as const)
      .every((key) => left.execution?.[key] === right.execution?.[key])) return false;
  return (left.type === "PRODUCTION" && right.type === "PRODUCTION" && left.actorName === right.actorName) ||
    (left.type === "CANCEL_PRODUCTION" && right.type === "CANCEL_PRODUCTION" && left.queueIndex === right.queueIndex);
}
