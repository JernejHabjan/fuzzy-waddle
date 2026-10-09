import { ResourceType, type GameCommandOutcomeKind } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiMultiplayerSharedQueueWorldV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-multiplayer-shared-queue-world-v1";
import {
  normalizeRuntimeScopedQueuePayments,
  sameRuntimeQueueVector
} from "./skirmish-ai-runtime-scoped-queue-payments";
import { sameRuntimeQueueCommand } from "./skirmish-ai-runtime-queue-command-equality";

/** Distinct technology replacement and real progress-dependent refund, with a future cancellation request on the sender. */
export function evaluateMultiplayerResearchCancellation(
  world: AiMultiplayerSharedQueueWorldV1,
  payments: ReturnType<typeof normalizeRuntimeScopedQueuePayments>["payments"],
  sender: boolean
): string[] {
  const setup = world.setup;
  const capture = world.capture;
  if (!setup || !capture) return ["research_cancellation_capture_missing"];
  const failures: string[] = [];
  const command = (role: AiMultiplayerSharedQueueWorldV1["commands"][number]["role"]) =>
    world.commands.find((entry) => entry.role === role)?.command;
  const [purchase, probe, cancel, resume] = [
    command("purchase"),
    command("probe"),
    command("cancel"),
    command("resume")
  ];
  const id = (role: Parameters<typeof command>[0]) => command(role)?.execution?.commandId;
  const outcomes = capture.facts.filter((fact) => fact.kind === "outcome");
  const result = (role: Parameters<typeof command>[0], kind: GameCommandOutcomeKind) =>
    outcomes.filter((fact) => fact.outcome.commandId === id(role) && fact.outcome.kind === kind);
  const rejection = result("probe", "rejected")[0];
  const cancellation = result("cancel", "cancelled")[0];
  const charge = payments.find(
    (entry) =>
      entry.resource.operation === "immediate_charge" &&
      entry.resource.originatingCommandContext?.execution.commandId === id("purchase")
  );
  const refund = payments.find((entry) => entry.resource.operation === "cancellation_refund");
  const newCharge = payments.find(
    (entry) =>
      entry.resource.operation === "immediate_charge" &&
      entry.resource.originatingCommandContext?.execution.commandId === id("resume")
  );
  const snapshot = (name: AiMultiplayerSharedQueueWorldV1["checkpoints"][number]["boundary"]) =>
    world.checkpoints.find((entry) => entry.boundary === name)?.snapshot;
  const items = (name: Parameters<typeof snapshot>[0]) =>
    snapshot(name)
      ?.queues.filter((queue) => queue.actorId === setup.producerActorId)
      .flatMap((queue) => queue.lanes.flatMap((lane) => lane.items)) ?? [];
  const originalId = purchase?.execution?.commandId
    ? `queue:${setup.producerActorId}:${purchase.execution.commandId}`
    : null;
  if (
    setup.research.type === setup.replacement.type ||
    payments.length !== 3 ||
    !charge ||
    !refund ||
    !newCharge ||
    result("purchase", "applied").length !== 1 ||
    result("purchase", "cancelled").length !== 1 ||
    result("purchase", "completed").length ||
    result("probe", "rejected").length !== 1 ||
    result("probe", "applied").length ||
    rejection?.outcome.reason !== "insufficient_resources" ||
    result("cancel", "cancelled").length !== 1 ||
    result("resume", "applied").length !== 1 ||
    result("resume", "completed").length !== 1 ||
    outcomes.some(
      (fact) =>
        world.commands.some((entry) => entry.command.execution?.commandId === fact.outcome.commandId) &&
        (fact.outcome.kind === "failed" || (fact.outcome.kind === "rejected" && fact.outcome.commandId !== id("probe")))
    )
  ) {
    failures.push("research_cancellation_command_cycle_invalid");
  }
  const value = refund?.resource;
  const before = snapshot("rejected")?.resources;
  const requested = value?.emission.requested;
  if (
    !value ||
    !refund ||
    !charge ||
    !newCharge ||
    !rejection ||
    !cancellation ||
    !purchase ||
    !probe ||
    !cancel ||
    !resume ||
    value.itemId !== originalId ||
    charge.resource.itemId !== originalId ||
    value.originatingCommandContext?.execution.commandId !== id("purchase") ||
    !value.cancellationCommand ||
    !sameRuntimeQueueCommand(value.cancellationCommand, cancel) ||
    newCharge.resource.itemId !== `queue:${setup.producerActorId}:${id("resume")}` ||
    value.remainingTimeMs === null ||
    value.totalTimeMs === null ||
    value.totalTimeMs <= 0 ||
    value.refundFactor === null ||
    refund.tick - purchase.tick > 20 ||
    cancellation.tick !== refund.tick ||
    rejection.tick !== probe.tick ||
    refund.tick !== cancel.tick ||
    newCharge.tick !== resume.tick ||
    charge.sequence >= rejection.sequence ||
    rejection.sequence >= refund.sequence ||
    refund.sequence >= newCharge.sequence ||
    !sameRuntimeQueueVector(snapshot("paid")?.resources, charge.resource.emission.after) ||
    !sameRuntimeQueueVector(before, charge.resource.emission.after) ||
    !sameRuntimeQueueVector(before, value.emission.before) ||
    !sameRuntimeQueueVector(snapshot("refunded")?.resources, value.emission.after) ||
    !sameRuntimeQueueVector(newCharge.resource.emission.before, value.emission.after) ||
    !Object.values(ResourceType).some(
      (resource) => (setup.replacement.price[resource] ?? 0) > (before?.[resource] ?? Infinity)
    ) ||
    !Object.values(ResourceType).every(
      (resource) =>
        (setup.replacement.price[resource] ?? 0) <= (before?.[resource] ?? -1) + (requested?.[resource] ?? 0)
    ) ||
    !Object.values(ResourceType).some((resource) => (requested?.[resource] ?? 0) > 0) ||
    !Object.values(ResourceType).every(
      (resource) =>
        requested?.[resource] ===
        Math.floor(
          (setup.research.price[resource] ?? 0) *
            setup.research.refundFactor *
            (1 - ((value.totalTimeMs ?? 0) - (value.remainingTimeMs ?? 0)) / (value.totalTimeMs ?? 0))
        )
    )
  ) {
    failures.push("research_cancellation_pre_credit_or_refund_invalid");
  }
  if (
    items("paid").length !== 1 ||
    items("paid")[0]?.itemId !== originalId ||
    items("rejected").length !== 1 ||
    items("rejected")[0]?.itemId !== originalId ||
    items("refunded").length ||
    items("resumed").length !== 1 ||
    items("resumed")[0]?.commandId !== id("resume") ||
    snapshot("stable")?.completedResearch.includes(setup.research.type)
  )
    failures.push("research_cancellation_physical_item_missing");
  if (sender) {
    const request = world.requests.find((entry) => entry.role === "cancel");
    const dispatched = result("cancel", "dispatched");
    const dispatch = dispatched[0];
    if (
      !request ||
      !cancel ||
      !probe ||
      !sameRuntimeQueueCommand(request.command, cancel) ||
      request.requestedTick >= probe.tick ||
      probe.tick >= cancel.tick ||
      dispatched.length !== 1 ||
      !dispatch ||
      dispatch.tick !== request.requestedTick ||
      dispatch.scheduledTick !== cancel.tick ||
      dispatch.sequence >= (rejection?.sequence ?? -1) ||
      snapshot("cancel_pending")?.tick !== request.requestedTick ||
      items("cancel_pending").length !== 1 ||
      items("cancel_pending")[0]?.itemId !== originalId ||
      !sameRuntimeQueueVector(snapshot("cancel_pending")?.resources, snapshot("paid")?.resources)
    ) {
      failures.push("research_cancellation_buffered_request_missing");
    }
  } else if (world.requests.length) failures.push("research_cancellation_remote_request_invented");
  return [...new Set(failures)];
}
