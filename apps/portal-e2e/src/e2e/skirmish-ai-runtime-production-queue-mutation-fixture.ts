import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeProductionBoundaryState } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-boundary-state";
import type { AiRuntimeQueueMutationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-queue-mutation-v1";
import { productionOperationFixture } from "./skirmish-ai-runtime-production-operation-fixture";
import { productionRefundOperationFixture } from "./skirmish-ai-runtime-production-refund-operation-fixture";
import { calculateRuntimeQueueLiabilities } from "./skirmish-ai-runtime-queue-liabilities";

/** Invented physical mutation/native lineage contracts only; no live setup, actor creation or AI strategic outcome. */
export function productionQueueMutationFixture(
  kind: "immediate" | "tick" | "completion" | "cancel" = "tick", remaining = 100
) {
  const source = kind === "cancel" ? productionRefundOperationFixture() :
    productionOperationFixture(kind === "immediate" ? "immediate" : "tick", kind === "completion" ? 50 : remaining);
  // Keep the purchased head's lane empty before push; unrelated waiting work has its own unchanged lane.
  const moveWaiting = (queue: NonNullable<AiRuntimeProductionBoundaryState["queues"]>[number]) => {
    const waiting = queue.lanes[0].items.filter((item) => item.commandId === "waiting");
    return { ...queue, lanes: [...queue.lanes.map((lane) => ({ ...lane,
      items: lane.items.filter((item) => item.commandId !== "waiting") })),
      { laneId: "producer:lane:2", capacity: 3, items: waiting }] };
  };
  const capture = { ...source, facts: source.facts.map((fact): AiRuntimeProductionFactV1 => ({ ...fact,
    ...(fact.kind === "queue_changed" ? { queue: moveWaiting(fact.queue) } : {}),
    ...(fact.boundaryState?.queues ? { boundaryState: { ...fact.boundaryState,
      queues: fact.boundaryState.queues.map(moveWaiting) } } : {})
  })) };
  const delivery = capture.facts.find((fact) => fact.kind === "command_delivered" && fact.command.type === "PRODUCTION");
  const physical = capture.facts.find((fact) => fact.kind === "queue_changed");
  const sample = capture.facts.find((fact) => fact.boundaryState);
  if (!delivery || delivery.kind !== "command_delivered" || !physical || physical.kind !== "queue_changed" ||
    !sample?.boundaryState || !delivery.command.execution) throw new Error("synthetic_queue_missing");
  const command = delivery.command;
  const execution = command.execution;
  if (!execution) throw new Error("synthetic_stamp_missing");
  const perTick = kind === "tick" || kind === "completion";
  const item = { ...physical.queue.lanes[0].items[0], remainingTimeMs: 150 };
  const queues = physical.queue.lanes.map((lane, index) => ({ ...lane, items: index === 0 ? [item, ...lane.items.slice(1)] : lane.items }));
  const afterQueues = [{ ...physical.queue, lanes: queues }];
  const beforeQueues = afterQueues.map((queue) => ({ ...queue, lanes: queue.lanes.map((lane) => ({ ...lane,
    items: lane.items.filter((candidate) => candidate.itemId !== item.itemId) })) }));
  const boundary = sample.boundaryState;
  const ledger = boundary.unspentClaims;
  if (!ledger) throw new Error("synthetic_ledger_missing");
  const state = (physicalQueues: typeof beforeQueues, inserted: boolean): AiRuntimeProductionBoundaryState => ({
    ...boundary, queues: physicalQueues, resources: { food: perTick ? 100 : 93, wood: 100, stone: 100, minerals: 100 },
    obligations: calculateRuntimeQueueLiabilities(physicalQueues), exhaustedProgressItemId: undefined,
    unspentClaims: { ...ledger, gaps: [], resources: { food: perTick && !inserted ? 7 : 0, wood: 0, stone: 0, minerals: 0 },
      entries: ledger.entries.map((entry) => ({ ...entry, state: perTick ? inserted ? "queue_liability" : "admitted" : "paid" })) },
    gaps: []
  });
  const mutation: AiRuntimeQueueMutationV1 = { mutationId: 1, phase: "before", operation: "enqueue", actorId: "producer",
    laneId: "producer:lane:0", itemIndex: 0, item, snapshotRestoreInProgress: false, gaps: [], cancellationCommand: null,
    originatingCommandContext: { execution, playerNumber: 1, actorIds: ["producer"] } };
  const pair = (value: AiRuntimeQueueMutationV1, tick: number, left: AiRuntimeProductionBoundaryState,
    right: AiRuntimeProductionBoundaryState): AiRuntimeProductionFactV1[] => [
    { sequence: 0, tick, playerNumber: 1, kind: "queue_mutation", mutation: value, boundaryState: left },
    { sequence: 0, tick, playerNumber: 1, kind: "queue_mutation", mutation: { ...value, phase: "after" }, boundaryState: right }
  ];
  let facts: AiRuntimeProductionFactV1[] = capture.facts.flatMap((fact) => fact === physical ?
    [...pair(mutation, 6, state(beforeQueues, false), state(afterQueues, true)), { ...fact, queue: afterQueues[0] }] : [fact]);
  if (kind === "completion") {
    const advanced = facts.find((fact) => fact.kind === "queue_progress" && fact.progress.phase === "advanced");
    if (!advanced || advanced.kind !== "queue_progress" || !advanced.boundaryState?.queues || !advanced.progress.item) {
      throw new Error("synthetic_advanced_missing");
    }
    const left = advanced.boundaryState;
    const right = { ...left, exhaustedProgressItemId: undefined,
      queues: left.queues.map((queue) => ({ ...queue, lanes: queue.lanes.map((lane) => ({ ...lane,
        items: lane.items.filter((candidate) => candidate.itemId !== item.itemId) })) })) };
    facts.push(...pair({ ...mutation, mutationId: 2, operation: "complete_remove", item: advanced.progress.item }, 10, left, right),
      { sequence: 0, tick: 10, playerNumber: 1, kind: "outcome", scheduledTick: null, outcome: { ...execution,
        schemaVersion: 1, kind: "completed", reason: "applied", tick: 10, playerNumber: 1,
        actorIds: ["producer"], worldLinkIds: ["synthetic-created-actor"] } });
  }
  if (kind === "cancel") {
    const cancel = facts.find((fact) => fact.kind === "command_delivered" && fact.command.type === "CANCEL_PRODUCTION");
    const terminal = facts.find((fact) => fact.kind === "outcome" && fact.outcome.commandId === "purchase" &&
      fact.outcome.kind === "cancelled");
    if (!cancel || cancel.kind !== "command_delivered" || cancel.command.type !== "CANCEL_PRODUCTION" || !terminal) {
      throw new Error("synthetic_cancel_missing");
    }
    const cancelled = { ...item, remainingTimeMs: 100 };
    const left = state(afterQueues.map((queue) => ({ ...queue, lanes: queue.lanes.map((lane) => ({ ...lane,
      items: lane.items.map((candidate) => candidate.itemId === item.itemId ? cancelled : candidate) })) })), true);
    const right = state(beforeQueues, true);
    const removing = { ...mutation, mutationId: 2, operation: "cancel_remove" as const, item: cancelled,
      cancellationCommand: cancel.command };
    facts = facts.flatMap((fact) => fact === terminal ? [...pair(removing, 10, left, right), fact] :
      fact.kind === "outcome" && fact.outcome.commandId === "cancel" && fact.outcome.kind === "applied" ?
        [{ ...fact, outcome: { ...fact.outcome, kind: "cancelled", reason: "cancelled" } }] : [fact]);
  }
  return { ...capture, facts: facts.map((fact, index) => ({ ...fact, sequence: index + 1 })) };
}
