import { ObjectNames, ResourceType, type GameCommand, type GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiMultiplayerQueueWorldV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-multiplayer-queue-world-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";

/** Synthetic normalizer regression input only; never passed to a browser, recipe, manifest or runtime evidence report. */
export function multiplayerQueueBoundaryFixture(): AiMultiplayerQueueWorldV1 {
  const money = (food: number) => ({ food, wood: 0, stone: 0, minerals: 0 });
  const price = { [ResourceType.Food]: 50 };
  const roles = ["purchase", "probe", "cancel", "resume"] as const;
  const commands = roles.map((role, index) => ({ role, command: {
    tick: [6, 10, 11, 15][index], playerNumber: 1, actorIds: ["producer"],
    execution: { schemaVersion: 1, commandId: role, commitmentKey: role, source: "human", authorityEpoch: 0, sequence: index },
    ...(role === "cancel" ? { type: "CANCEL_PRODUCTION", queueIndex: 0 }
      : { type: "PRODUCTION", actorName: ObjectNames.TivaraWorker })
  } satisfies GameCommand }));
  const commandFor = (role: typeof roles[number]) => {
    const command = commands.find((entry) => entry.role === role)?.command;
    if (!command) throw new Error("synthetic_command_missing");
    return command;
  };
  const facts: AiRuntimeProductionFactV1[] = [];
  const append = (fact: AiRuntimeProductionFactV1) => facts.push({ ...fact, sequence: facts.length + 1 });
  const report = (role: typeof roles[number], kind: GameCommandOutcome["kind"], tick: number, worldLinkIds: string[] = []) => {
    const command = commandFor(role);
    append({ sequence: 0, tick, playerNumber: 1, kind: "outcome", scheduledTick: kind === "dispatched" ? command.tick : null,
      outcome: { schemaVersion: 1, playerNumber: 1, commandId: role, commitmentKey: role, authorityEpoch: 0,
        sequence: command.execution.sequence, kind, reason: kind === "rejected" ? "insufficient_resources"
          : kind === "dispatched" ? "accepted_for_dispatch" : kind === "cancelled" ? "cancelled" : "applied",
        tick: kind === "dispatched" ? command.tick : tick, actorIds: ["producer"], worldLinkIds } });
  };
  const deliver = (role: typeof roles[number]) => {
    const command = commandFor(role);
    append({ sequence: 0, tick: command.tick, playerNumber: 1, kind: "command_delivered", command });
  };
  const pay = (role: "purchase" | "resume", operationId: number, tick: number, before: number, after: number,
    refund = false) => {
    const purchase = commandFor(role);
    const requested = { food: refund ? 25 : 50 };
    const common = { operationId, requested, before: money(before), snapshotRestoreInProgress: false };
    const resource = {
      actorId: "producer", ownerNumber: 1, itemId: `queue:producer:${role}`, identitySource: "command",
      operation: refund ? "cancellation_refund" : "immediate_charge", objectName: ObjectNames.TivaraWorker, researchType: null,
      totalTimeMs: 5000, remainingTimeMs: 4800, payment: "immediate", storedPrice: price, refundFactor: 0.5,
      originatingCommandContext: { execution: purchase.execution, playerNumber: 1, actorIds: ["producer"] },
      cancellationCommand: refund ? commandFor("cancel") : null, gaps: []
    } as const;
    append({ sequence: 0, tick, playerNumber: 1, kind: "queue_resource", resource: {
      ...resource, emission: { ...common, phase: "started" }
    } });
    append({ sequence: 0, tick, playerNumber: 1, kind: "queue_resource", resource: {
      ...resource, emission: { ...common, phase: "callback", callbackOrdinal: 1, amounts: requested }
    } });
    append({ sequence: 0, tick, playerNumber: 1, kind: "queue_resource", resource: {
      ...resource, emission: { ...common, phase: "finished", status: "returned", after: money(after), callbackCount: 1,
        callbackLimitExceeded: false, nestedEmission: false, balanceMatches: true }
    } });
  };
  pay("purchase", 1, 6, 75, 25);
  report("purchase", "applied", 6);
  deliver("purchase");
  report("cancel", "dispatched", 8);
  report("probe", "rejected", 10);
  deliver("probe");
  report("purchase", "cancelled", 11);
  pay("purchase", 2, 11, 25, 50, true);
  report("cancel", "cancelled", 11);
  deliver("cancel");
  pay("resume", 3, 15, 50, 0);
  report("resume", "applied", 15);
  deliver("resume");
  report("resume", "completed", 115, ["new-worker"]);
  const checkpoint = (boundary: AiMultiplayerQueueWorldV1["checkpoints"][number]["boundary"], tick: number,
    food: number, role?: "purchase" | "resume"): AiMultiplayerQueueWorldV1["checkpoints"][number] => ({
    boundary, snapshot: {
      tick, observation: null, capabilityCatalog: null, economyProduction: null, reservations: [], resources: money(food),
      pendingCommands: [], pendingResourceClaims: money(0), obligations: money(0), completedResearch: [],
      ownedActors: [{ actorId: "producer", objectName: ObjectNames.Sandhold },
        ...(boundary === "complete" ? [{ actorId: "new-worker", objectName: ObjectNames.TivaraWorkerMale }] : [])],
      queues: [{ actorId: "producer", objectName: ObjectNames.Sandhold, lanes: [{ laneId: "producer:lane:0", capacity: 5,
        items: role ? [{ itemId: `queue:producer:${role}`, identitySource: "command", commandId: role, effectId: null,
          objectName: ObjectNames.TivaraWorker, researchType: null, totalTimeMs: 5000, remainingTimeMs: 4800,
          payment: "immediate", charge: price }] : [] }] }]
    }
  });
  const checkpoints = [checkpoint("ready", 1, 75), checkpoint("paid", 6, 25, "purchase"),
    checkpoint("cancel_pending", 8, 25, "purchase"), checkpoint("rejected", 10, 25, "purchase"),
    checkpoint("refunded", 11, 50), checkpoint("resumed", 15, 0, "resume"), checkpoint("complete", 115, 0)];
  const capture: AiRuntimeProductionCaptureV1 = { schemaVersion: 1, kind: "production_authority_capture", startedTick: 0,
    playerNumber: 1, droppedFactCount: 0, droppedSnapshotCount: 0, gaps: ["queue_resource_runtime_authority_unverified"],
    facts, snapshots: checkpoints.map((entry) => entry.snapshot) };
  return { state: "complete", failure: null,
    setup: { tick: 1, playerNumber: 1, producerActorId: "producer", product: ObjectNames.TivaraWorker,
      price, refundFactor: 0.5, durationMs: 5000, initialResources: money(75) }, commands,
    requests: [{ role: "cancel", requestedTick: 8, command: commandFor("cancel") }], checkpoints, capture };
}
