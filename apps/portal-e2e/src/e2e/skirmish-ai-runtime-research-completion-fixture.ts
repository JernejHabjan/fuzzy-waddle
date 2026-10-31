import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { researchQueueMutationFixture } from "./skirmish-ai-runtime-research-queue-mutation-fixture";

/** Invented immediate-paid research progress/removal, with no cancellation or money at completion. */
export function researchCompletionRemovalFixture() {
  const source = researchQueueMutationFixture();
  const facts = source.facts.filter((fact) => fact.tick < 8);
  const enqueue = facts.find((fact) => fact.kind === "queue_mutation" && fact.mutation.phase === "after");
  const admission = facts.find((fact) => fact.kind === "outcome" && fact.outcome.kind === "dispatched");
  if (!enqueue || enqueue.kind !== "queue_mutation" || !enqueue.mutation.item ||
    !enqueue.boundaryState?.queues || !admission || admission.kind !== "outcome") throw new Error("synthetic_research_enqueue_missing");
  const item = { ...enqueue.mutation.item, remainingTimeMs: 50 };
  const queues = enqueue.boundaryState.queues.map((queue) => ({ ...queue, lanes: queue.lanes.map((lane) => ({ ...lane,
    items: lane.items.map((entry) => entry.itemId === item.itemId ? item : entry) })) }));
  const before = { ...enqueue.boundaryState, queues };
  const next = { ...item, remainingTimeMs: 0 };
  const after = { ...before, exhaustedProgressItemId: item.itemId, queues: queues.map((queue) => ({ ...queue,
    lanes: queue.lanes.map((lane) => ({ ...lane, items: lane.items.map((entry) => entry.itemId === item.itemId ? next : entry) })) })) };
  const removed = { ...after, exhaustedProgressItemId: undefined, queues: after.queues.map((queue) => ({ ...queue,
    lanes: queue.lanes.map((lane) => ({ ...lane, items: lane.items.filter((entry) => entry.itemId !== item.itemId) })) })) };
  const base = { sequence: 0, tick: 10, playerNumber: 1 };
  const progress = { attemptId: 1, actorId: "producer", laneId: "producer:lane:0", deltaMs: 50, remainingBeforeMs: 50,
    snapshotRestoreInProgress: false, gaps: [] };
  const mutation = { ...enqueue.mutation, mutationId: 2, operation: "complete_remove" as const, item: next };
  const completionFacts: AiRuntimeProductionFactV1[] = [
    { ...base, kind: "queue_progress", progress: { ...progress, phase: "started", item }, boundaryState: before },
    { ...base, kind: "queue_progress", progress: { ...progress, phase: "advanced", item: next }, boundaryState: after },
    { ...base, kind: "queue_mutation", mutation: { ...mutation, phase: "before" }, boundaryState: after },
    { ...base, kind: "queue_mutation", mutation: { ...mutation, phase: "after" }, boundaryState: removed },
    { ...base, kind: "outcome", scheduledTick: null, outcome: { ...admission.outcome,
      kind: "completed", reason: "applied", tick: 10, worldLinkIds: [`research:${item.researchType}`] } }
  ];
  return { ...source, facts: [...facts, ...completionFacts].map((fact, index) => ({ ...fact, sequence: index + 1 })) };
}
