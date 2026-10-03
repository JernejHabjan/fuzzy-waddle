import type { GameCommandOutcomeKind } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiMultiplayerSharedQueueWorldV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-multiplayer-shared-queue-world-v1";
import { sameRuntimeQueueCommand } from "./skirmish-ai-runtime-queue-command-equality";
import { normalizeRuntimeScopedQueuePayments, sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";
import { evaluateMultiplayerResearchCancellation } from "./skirmish-ai-multiplayer-research-cancellation-evaluation";

/** Normalizes shared human authority only; raw AI/fairness gaps remain and no RuntimeProductionEvidenceV1 is produced. */
export function normalizeMultiplayerSharedQueueWorld(world: AiMultiplayerSharedQueueWorldV1, sender: boolean) {
  const failures: string[] = [];
  const setup = world.setup;
  const capture = world.capture;
  if (!setup || !capture) return { failures: ["shared_queue_capture_missing"], payments: [], gaps: capture?.gaps ?? [] };
  const roles = world.branch === "shared_contention" ? ["train", "research"] as const
    : ["purchase", "probe", "cancel", "resume"] as const;
  const commands = roles.flatMap((role) => world.commands.filter((entry) => entry.role === role).map((entry) => entry.command));
  const ids = commands.map((command) => command.execution?.commandId);
  if (world.state !== "complete" || world.failure || world.commands.length !== roles.length || commands.length !== roles.length ||
    ids.some((id) => !id) || new Set(ids).size !== roles.length || capture.playerNumber !== setup.playerNumber ||
    capture.droppedFactCount || capture.droppedSnapshotCount || capture.facts.some((fact, index) =>
      fact.playerNumber !== setup.playerNumber || !Number.isSafeInteger(fact.sequence) || fact.sequence <= 0 ||
      (index > 0 && fact.sequence <= capture.facts[index - 1].sequence))) failures.push("shared_queue_capture_incomplete");
  for (const { role, command } of world.commands) {
    const product = role === "train" ? setup.train.product : role === "probe" || role === "resume"
      ? setup.replacement.type : setup.research.type;
    if (!command.execution?.commandId || command.execution.source !== "human" || command.playerNumber !== setup.playerNumber ||
      command.actorIds.length !== 1 || command.actorIds[0] !== setup.producerActorId ||
      !Number.isSafeInteger(command.tick) || command.tick <= setup.tick ||
      (role === "train" ? command.type !== "PRODUCTION" || command.actorName !== product :
        role === "cancel" ? command.type !== "CANCEL_RESEARCH" : command.type !== "RESEARCH" || command.researchType !== product)) {
      failures.push("shared_queue_command_lineage_invalid");
    }
    const deliveries = capture.facts.filter((fact) => fact.kind === "command_delivered" &&
      fact.command.execution?.commandId === command.execution?.commandId);
    if (deliveries.length !== 1 || deliveries[0].kind !== "command_delivered" ||
      !sameRuntimeQueueCommand(deliveries[0].command, command)) failures.push("shared_queue_delivery_missing");
  }
  const outcomes = capture.facts.filter((fact) => fact.kind === "outcome");
  for (const fact of outcomes) {
    const command = commands.find((entry) => entry.execution?.commandId === fact.outcome.commandId);
    if (command && (fact.outcome.playerNumber !== setup.playerNumber || fact.outcome.actorIds.length !== 1 ||
      fact.outcome.actorIds[0] !== setup.producerActorId || fact.outcome.authorityEpoch !== command.execution?.authorityEpoch ||
      fact.outcome.sequence !== command.execution?.sequence || fact.outcome.commitmentKey !== command.execution?.commitmentKey ||
      (fact.outcome.kind !== "dispatched" && (fact.outcome.tick !== fact.tick || fact.tick < command.tick)) ||
      (fact.outcome.kind !== "dispatched" && fact.tick !== command.tick && fact.outcome.kind !== "completed" &&
        !(fact.outcome.kind === "cancelled" && command.type === "RESEARCH")))) failures.push("shared_queue_outcome_lineage_invalid");
  }
  const outcome = (role: AiMultiplayerSharedQueueWorldV1["commands"][number]["role"], kind: GameCommandOutcomeKind) => {
    const id = world.commands.find((entry) => entry.role === role)?.command.execution?.commandId;
    return outcomes.filter((fact) => fact.outcome.commandId === id && fact.outcome.kind === kind);
  };
  const snapshot = (name: AiMultiplayerSharedQueueWorldV1["checkpoints"][number]["boundary"]) =>
    world.checkpoints.find((entry) => entry.boundary === name)?.snapshot;
  const items = (name: Parameters<typeof snapshot>[0]) => snapshot(name)?.queues
    .filter((queue) => queue.actorId === setup.producerActorId).flatMap((queue) => queue.lanes.flatMap((lane) => lane.items)) ?? [];
  const ready = snapshot("ready");
  const completed = snapshot("completed");
  const stable = snapshot("stable");
  for (const entry of world.checkpoints) {
    const observed = items(entry.boundary);
    if (new Set(observed.map((item) => item.itemId)).size !== observed.length) failures.push("shared_queue_item_identity_invalid");
    for (const item of observed) {
      const origin = commands.find((command) => command.execution?.commandId === item.commandId);
      const definition = origin?.type === "PRODUCTION" ? setup.train : origin?.type === "RESEARCH"
        ? origin.researchType === setup.research.type ? setup.research : setup.replacement : null;
      if (!origin || !definition || item.identitySource !== "command" ||
        item.itemId !== `queue:${setup.producerActorId}:${origin.execution?.commandId}` || item.payment !== "immediate" ||
        item.totalTimeMs !== definition.durationMs || !Number.isFinite(item.remainingTimeMs) ||
        item.remainingTimeMs < 0 || item.remainingTimeMs > item.totalTimeMs || !sameRuntimeQueueVector(item.charge, definition.price) ||
        (origin.type === "PRODUCTION" ? item.objectName !== origin.actorName || item.researchType !== null :
          origin.type !== "RESEARCH" || item.researchType !== origin.researchType || item.objectName !== null)) {
        failures.push("shared_queue_item_identity_invalid");
      }
    }
  }
  if (!ready || !completed || !stable || ready.tick !== setup.tick || items("ready").length ||
    !sameRuntimeQueueVector(ready.resources, setup.initialResources) || stable.tick < completed.tick + 20 ||
    items("completed").length || items("stable").length ||
    new Set(world.checkpoints.map((entry) => entry.boundary)).size !== world.checkpoints.length ||
    world.checkpoints.some((entry) =>
      entry.snapshot.observation !== null || entry.snapshot.capabilityCatalog !== null ||
      !entry.snapshot.ownedActors.some((actor) => actor.actorId === setup.producerActorId &&
        actor.objectName === setup.producerObjectName) ||
      entry.snapshot.queues.filter((queue) => queue.actorId === setup.producerActorId).length !== 1 ||
      entry.snapshot.queues.filter((queue) => queue.actorId === setup.producerActorId).some((queue) =>
        queue.objectName !== setup.producerObjectName || queue.lanes.length !== 1 || queue.lanes.some((lane) =>
          lane.laneId !== `${setup.producerActorId}:lane:0` || !Number.isSafeInteger(lane.capacity) || lane.capacity < 2 ||
          lane.items.length > lane.capacity)))) failures.push("shared_queue_physical_boundary_missing");
  const scoped = normalizeRuntimeScopedQueuePayments(capture, commands);
  failures.push(...scoped.failures);
  for (const payment of scoped.payments) {
    const value = payment.resource;
    const definition = value.objectName === setup.train.product ? setup.train :
      value.researchType === setup.research.type ? setup.research :
        value.researchType === setup.replacement.type ? setup.replacement : null;
    if (!definition || !sameRuntimeQueueVector(value.storedPrice, definition.price) ||
      value.totalTimeMs !== definition.durationMs || value.refundFactor !== definition.refundFactor ||
      (value.operation === "immediate_charge" && !sameRuntimeQueueVector(value.emission.requested, definition.price))) {
      failures.push("shared_queue_definition_price_invalid");
    }
  }
  if (world.branch === "cancel_research") {
    failures.push(...evaluateMultiplayerResearchCancellation(world, scoped.payments, sender));
  } else {
    const train = world.commands.find((entry) => entry.role === "train")?.command;
    const research = world.commands.find((entry) => entry.role === "research")?.command;
    const shared = items("contending");
    const trainItem = shared.find((item) => item.commandId === train?.execution?.commandId);
    const researchItem = shared.find((item) => item.commandId === research?.execution?.commandId);
    const trainCharge = scoped.payments.find((payment) =>
      payment.resource.originatingCommandContext?.execution.commandId === train?.execution?.commandId);
    const researchCharge = scoped.payments.find((payment) =>
      payment.resource.originatingCommandContext?.execution.commandId === research?.execution?.commandId);
    if (shared.length !== 2 || !trainItem || !researchItem || trainItem.objectName !== setup.train.product ||
      researchItem.researchType !== setup.research.type || researchItem.remainingTimeMs !== researchItem.totalTimeMs ||
      trainItem.itemId === researchItem.itemId || outcome("train", "applied").length !== 1 ||
      outcome("research", "applied").length !== 1 || outcome("train", "completed").length !== 1 ||
      outcome("research", "completed").length !== 1 || scoped.payments.length !== 2 ||
      scoped.payments.some((payment) => payment.resource.operation !== "immediate_charge") ||
      outcomes.some((fact) => ids.includes(fact.outcome.commandId) && ["cancelled", "rejected", "failed"].includes(fact.outcome.kind))) {
      failures.push("shared_queue_contention_missing");
    }
    if (!trainCharge || !researchCharge || trainCharge.sequence >= researchCharge.sequence ||
      !sameRuntimeQueueVector(ready?.resources, trainCharge.resource.emission.before) ||
      !sameRuntimeQueueVector(snapshot("paid")?.resources, trainCharge.resource.emission.after) ||
      !sameRuntimeQueueVector(researchCharge.resource.emission.before, trainCharge.resource.emission.after) ||
      !sameRuntimeQueueVector(snapshot("contending")?.resources, researchCharge.resource.emission.after) ||
      (outcome("train", "completed")[0]?.tick ?? Infinity) > (completed?.tick ?? -1)) {
      failures.push("shared_queue_contention_cash_invalid");
    }
    const actorId = outcome("train", "completed")[0]?.outcome.worldLinkIds[0];
    if (!actorId || outcome("train", "completed")[0]?.outcome.worldLinkIds.length !== 1 ||
      ready?.ownedActors.some((actor) => actor.actorId === actorId) ||
      ![completed, stable].every((boundary) => boundary?.ownedActors.some((actor) =>
        actor.actorId === actorId && setup.train.spawnObjectNames.some((name) => name === actor.objectName)))) {
      failures.push("shared_queue_new_actor_missing");
    }
  }
  const researchType = world.branch === "shared_contention" ? setup.research.type : setup.replacement.type;
  const completion = outcome(world.branch === "shared_contention" ? "research" : "resume", "completed");
  if (completion.length !== 1 || completion[0].outcome.worldLinkIds.length !== 1 ||
    completion[0].outcome.worldLinkIds[0] !== `research:${researchType}` || completion[0].tick > (completed?.tick ?? -1) ||
    ready?.completedResearch.includes(researchType) || ![completed, stable].every((boundary) =>
      boundary?.completedResearch.includes(researchType)) || !capture.facts.some((fact) =>
        fact.kind === "research_completed" && fact.researchType === researchType && fact.tick === completion[0]?.tick)) {
    failures.push("shared_queue_research_authority_missing");
  }
  return { failures: [...new Set(failures)], payments: scoped.payments, gaps: capture.gaps };
}
