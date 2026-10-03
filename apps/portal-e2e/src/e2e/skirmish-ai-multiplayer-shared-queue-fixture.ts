import { ObjectNames, ResearchType, type GameCommand, type GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiMultiplayerSharedQueueWorldV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-multiplayer-shared-queue-world-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeProductionQueueV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-queue-v1";

/** Synthetic adapter contract input, with deliberately synthetic prices. Never a legal-world or runtime report fixture. */
export function multiplayerSharedQueueFixture(branch: AiMultiplayerSharedQueueWorldV1["branch"]): AiMultiplayerSharedQueueWorldV1 {
  const money = (food: number) => ({ food, wood: 0, stone: 0, minerals: 0 });
  const source = ResearchType.TivaraSlingshotUpgradeLevel2;
  const target = ResearchType.TivaraMacemanUpgradeLevel2;
  const roles = branch === "shared_contention" ? ["train", "research"] as const : ["purchase", "probe", "cancel", "resume"] as const;
  const setup = { tick: 1, playerNumber: 1, producerActorId: "producer", producerObjectName: ObjectNames.Sandhold,
    train: { product: ObjectNames.TivaraWorker, spawnObjectNames: [ObjectNames.TivaraWorkerMale],
      price: { food: 50 }, durationMs: 5000, refundFactor: 0.5 },
    research: { type: source, price: { food: branch === "shared_contention" ? 25 : 50 }, durationMs: 5000, refundFactor: 0.5 },
    replacement: { type: target, price: { food: 48 }, durationMs: 5000, refundFactor: 0.5 },
    refundBudget: money(23), initialResources: money(75) };
  const commands = roles.map((role, index) => ({ role, command: {
    tick: branch === "shared_contention" ? 6 : [6, 10, 11, 15][index], playerNumber: 1, actorIds: ["producer"],
    execution: { schemaVersion: 1, commandId: role, commitmentKey: role, source: "human", authorityEpoch: 0, sequence: index },
    ...(role === "train" ? { type: "PRODUCTION", actorName: ObjectNames.TivaraWorker } :
      role === "cancel" ? { type: "CANCEL_RESEARCH" } :
        { type: "RESEARCH", researchType: role === "probe" || role === "resume" ? target : source })
  } satisfies GameCommand }));
  const commandFor = (role: string) => {
    const command = commands.find((entry) => entry.role === role)?.command;
    if (!command) throw new Error("synthetic_shared_command_missing");
    return command;
  };
  const facts: AiRuntimeProductionFactV1[] = [];
  const append = (fact: AiRuntimeProductionFactV1) => facts.push({ ...fact, sequence: facts.length + 1 });
  const report = (role: string, kind: GameCommandOutcome["kind"], tick: number, worldLinkIds: string[] = []) => {
    const command = commandFor(role);
    append({ sequence: 0, tick, playerNumber: 1, kind: "outcome", scheduledTick: kind === "dispatched" ? command.tick : null,
      outcome: { schemaVersion: 1, kind, reason: kind === "rejected" ? "insufficient_resources" :
        kind === "dispatched" ? "accepted_for_dispatch" : kind === "cancelled" ? "cancelled" : "applied",
        tick: kind === "dispatched" ? command.tick : tick, commandId: role, commitmentKey: role,
        authorityEpoch: 0, sequence: command.execution.sequence, playerNumber: 1, actorIds: ["producer"], worldLinkIds } });
  };
  const deliver = (role: string) => {
    const command = commandFor(role);
    append({ sequence: 0, tick: command.tick, playerNumber: 1, kind: "command_delivered", command });
  };
  const item = (role: string): AiRuntimeProductionQueueV1["lanes"][number]["items"][number] => {
    return { itemId: `queue:producer:${role}`, identitySource: "command", commandId: role, effectId: null,
      objectName: role === "train" ? ObjectNames.TivaraWorker : null,
      researchType: role === "train" ? null : role === "resume" ? target : source,
      totalTimeMs: 5000, remainingTimeMs: 5000, payment: "immediate",
      charge: role === "train" ? setup.train.price : role === "resume" ? setup.replacement.price : setup.research.price };
  };
  const pay = (role: string, tick: number, before: number, after: number, refund = false) => {
    const purchase = commandFor(role);
    const queued = item(role);
    const requested = money(refund ? 23 : before - after);
    const common = { operationId: facts.length + 1, requested, before: money(before), snapshotRestoreInProgress: false };
    const resource = { actorId: "producer", ownerNumber: 1, itemId: queued.itemId, identitySource: "command",
      objectName: queued.objectName, researchType: queued.researchType, totalTimeMs: 5000,
      remainingTimeMs: refund ? 4750 : 5000, payment: "immediate", storedPrice: queued.charge, refundFactor: 0.5,
      operation: refund ? "cancellation_refund" : "immediate_charge",
      originatingCommandContext: { execution: purchase.execution, playerNumber: 1, actorIds: ["producer"] },
      cancellationCommand: refund ? commandFor("cancel") : null, gaps: [] } as const;
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
  const checkpoints: AiMultiplayerSharedQueueWorldV1["checkpoints"][number][] = [];
  const boundary = (name: AiMultiplayerSharedQueueWorldV1["checkpoints"][number]["boundary"], tick: number,
    food: number, queueRoles: string[] = [], completed = false) => checkpoints.push({ boundary: name, snapshot: {
    tick, observation: null, capabilityCatalog: null, economyProduction: null, reservations: [], resources: money(food),
    pendingCommands: [], pendingResourceClaims: money(0), obligations: money(0),
    completedResearch: completed ? [branch === "shared_contention" ? source : target] : [],
    ownedActors: [{ actorId: "producer", objectName: ObjectNames.Sandhold },
      ...(completed && branch === "shared_contention" ? [{ actorId: "new-worker", objectName: ObjectNames.TivaraWorkerMale }] : [])],
    queues: [{ actorId: "producer", objectName: ObjectNames.Sandhold, lanes: [{ laneId: "producer:lane:0", capacity: 5,
      items: queueRoles.map(item) }] }]
  } });
  boundary("ready", 1, 75);
  if (branch === "shared_contention") {
    pay("train", 6, 75, 25); report("train", "applied", 6); deliver("train");
    boundary("paid", 6, 25, ["train"]);
    pay("research", 6, 25, 0); report("research", "applied", 6); deliver("research");
    boundary("contending", 6, 0, ["train", "research"]);
    report("train", "completed", 106, ["new-worker"]);
    append({ sequence: 0, tick: 206, playerNumber: 1, kind: "research_completed", researchType: source });
    report("research", "completed", 206, [`research:${source}`]);
    boundary("completed", 207, 0, [], true); boundary("stable", 227, 0, [], true);
  } else {
    pay("purchase", 6, 75, 25); report("purchase", "applied", 6); deliver("purchase");
    boundary("paid", 6, 25, ["purchase"]);
    report("cancel", "dispatched", 8); boundary("cancel_pending", 8, 25, ["purchase"]);
    report("probe", "rejected", 10); deliver("probe"); boundary("rejected", 10, 25, ["purchase"]);
    pay("purchase", 11, 25, 48, true); report("purchase", "cancelled", 11); report("cancel", "cancelled", 11);
    deliver("cancel"); boundary("refunded", 11, 48);
    pay("resume", 15, 48, 0); report("resume", "applied", 15); deliver("resume"); boundary("resumed", 15, 0, ["resume"]);
    append({ sequence: 0, tick: 115, playerNumber: 1, kind: "research_completed", researchType: target });
    report("resume", "completed", 115, [`research:${target}`]);
    boundary("completed", 116, 0, [], true); boundary("stable", 136, 0, [], true);
  }
  return { branch, state: "complete", failure: null, setup, commands, checkpoints,
    requests: branch === "shared_contention" ? [] : [{ role: "cancel", requestedTick: 8, command: commandFor("cancel") }],
    capture: { schemaVersion: 1, kind: "production_authority_capture", startedTick: 0, playerNumber: 1,
      droppedFactCount: 0, droppedSnapshotCount: 0, gaps: ["navigation_placement_authority"], facts,
      snapshots: checkpoints.map((entry) => entry.snapshot) } };
}
