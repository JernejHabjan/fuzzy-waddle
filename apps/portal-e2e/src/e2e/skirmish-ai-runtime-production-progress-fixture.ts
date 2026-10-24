import { ObjectNames, type GameCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeProductionBoundaryState } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-boundary-state";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeProductionQueueV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-queue-v1";
import type { AiRuntimeQueueResourceV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-queue-resource-v1";

/** Invented multi-item liabilities and callback contracts only; never a real paid queue or AI world. */
export function productionProgressFixture(phase: "advanced" | "denied" = "advanced", remainingBeforeMs = 100) {
  const command = { type: "PRODUCTION", tick: 6, playerNumber: 1, actorIds: ["producer"], actorName: ObjectNames.TivaraWorker,
    execution: { schemaVersion: 1, source: "ai", commandId: "purchase", authorityEpoch: 1, sequence: 3,
      commitmentKey: "ai:effect:purchase", intentId: "purchase", effectId: "purchase" } } satisfies GameCommand;
  const item = { itemId: "queue:producer:purchase", identitySource: "command", commandId: "purchase", effectId: "purchase",
    objectName: ObjectNames.TivaraWorker, researchType: null, totalTimeMs: 150, remainingTimeMs: remainingBeforeMs,
    payment: "per_successful_tick", charge: { food: 7 } } satisfies AiRuntimeProductionQueueV1["lanes"][number]["items"][number];
  const advanced = phase === "advanced";
  const next = { ...item, remainingTimeMs: advanced ? Math.max(0, remainingBeforeMs - 50) : remainingBeforeMs };
  const resources = { food: 100, wood: 100, stone: 100, minerals: 100 };
  const afterCash = { ...resources, food: resources.food - (advanced ? 7 : 0) };
  const beforeDue = 11 + 7 * Math.max(1, Math.ceil(remainingBeforeMs / 50));
  const state = (head: typeof item, cash: typeof resources, due: number): AiRuntimeProductionBoundaryState => ({
    resources: cash, brain: null, pendingCommands: [], pendingResourceClaims: null,
    queues: [{ actorId: "producer", objectName: "producer", lanes: [{ laneId: "producer:lane:0", capacity: 3,
      items: [head, { ...item, itemId: "queue:producer:waiting", commandId: "waiting", effectId: "waiting",
        remainingTimeMs: 150, charge: { food: 3 } }] }, { laneId: "producer:lane:1", capacity: 3,
      items: [{ ...item, itemId: "queue:producer:other-lane", commandId: "other-lane", effectId: "other-lane",
        remainingTimeMs: 50, charge: { food: 2 } }] }] }],
    obligations: { food: due, wood: 0, stone: 0, minerals: 0 }, gaps: ["synthetic_saved_brain_missing"]
  });
  const before = state(item, resources, beforeDue);
  const after = { ...state(next, afterCash, beforeDue - (advanced ? 7 : 0)),
    exhaustedProgressItemId: advanced && next.remainingTimeMs === 0 ? next.itemId : undefined };
  const base = { sequence: 0, tick: 10, playerNumber: 1 };
  const progress = { attemptId: 1, actorId: "producer", laneId: "producer:lane:0", deltaMs: 50, remainingBeforeMs,
    item, snapshotRestoreInProgress: false, gaps: [] };
  const resource = { actorId: "producer", ownerNumber: 1, itemId: item.itemId, identitySource: "command", operation: "tick_charge",
    objectName: item.objectName, researchType: null, totalTimeMs: 150, remainingTimeMs: remainingBeforeMs,
    payment: "per_successful_tick", storedPrice: { food: 7 }, refundFactor: 1, cancellationCommand: null,
    originatingCommandContext: { execution: command.execution, playerNumber: 1, actorIds: ["producer"] }, gaps: [],
    emission: { operationId: 4, requested: { food: 7 }, before: resources, snapshotRestoreInProgress: false, phase: "started" }
  } satisfies AiRuntimeQueueResourceV1;
  const facts: AiRuntimeProductionFactV1[] = [
    { ...base, kind: "queue_progress", progress: { ...progress, phase: "started" }, boundaryState: before },
    ...(advanced ? [
      { ...base, kind: "queue_resource" as const, resource },
      { ...base, kind: "queue_resource" as const, resource: { ...resource,
        emission: { ...resource.emission, phase: "callback" as const, callbackOrdinal: 1, amounts: { food: 7 } } } },
      { ...base, kind: "queue_resource" as const, resource: { ...resource, emission: { ...resource.emission,
        phase: "finished" as const, status: "returned" as const, after: afterCash, callbackCount: 1,
        callbackLimitExceeded: false, nestedEmission: false, balanceMatches: true } } }
    ] : [{ ...base, kind: "queue_resource" as const, resource: { ...resource,
      emission: { ...resource.emission, phase: "denied" as const, reason: "insufficient_resources" as const } } }]),
    { ...base, kind: "queue_progress", progress: { ...progress, phase, item: next }, boundaryState: after }
  ];
  const capture = { schemaVersion: 1, kind: "production_authority_capture", startedTick: 0, playerNumber: 1,
    droppedFactCount: 0, droppedSnapshotCount: 0, gaps: ["synthetic_progress_only"], snapshots: [],
    facts: facts.map((fact, index) => ({ ...fact, sequence: index + 1 })) } satisfies AiRuntimeProductionCaptureV1;
  return { capture, command };
}
