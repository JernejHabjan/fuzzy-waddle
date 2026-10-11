import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { calculateRuntimeQueueLiabilities } from "./skirmish-ai-runtime-queue-liabilities";
import { isRuntimeProductionBalance } from "./skirmish-ai-runtime-production-balance";
import { sameRuntimeQueueVector } from "./skirmish-ai-runtime-scoped-queue-payments";

/** Independent exact push/splice and all-lane arithmetic. No other lane or cash may change within this physical interval. */
export function validateRuntimeQueueMutationBoundaries(
  before: Extract<AiRuntimeProductionFactV1, { kind: "queue_mutation" }>,
  after: Extract<AiRuntimeProductionFactV1, { kind: "queue_mutation" }>
) {
  const left = before.boundaryState;
  const right = after.boundaryState;
  const value = before.mutation;
  if (!left?.queues || !right?.queues || !left.resources || !right.resources ||
    !left.obligations || !right.obligations || !value.item) {
    return { boundary: null, failures: [], gaps: ["production_ai_mutation_boundary_missing"] };
  }
  const invalid = () => ({ boundary: null, failures: ["production_ai_mutation_physical_boundary_invalid"], gaps: [] });
  if (left.snapshotRestoreInProgress || right.snapshotRestoreInProgress ||
    ![left.resources, right.resources, left.obligations, right.obligations].every(isRuntimeProductionBalance) ||
    !sameRuntimeQueueVector(left.resources, right.resources) ||
    !sameRuntimeQueueVector(calculateRuntimeQueueLiabilities(left.queues, left.exhaustedProgressItemId), left.obligations) ||
    !sameRuntimeQueueVector(calculateRuntimeQueueLiabilities(right.queues, right.exhaustedProgressItemId), right.obligations) ||
    right.exhaustedProgressItemId !== undefined ||
    (value.operation !== "complete_remove" && left.exhaustedProgressItemId !== undefined)) return invalid();
  const expected = structuredClone(left.queues).map((queue) => ({ ...queue,
    lanes: queue.lanes.map((lane) => ({ ...lane, items: [...lane.items] })) }));
  const owner = expected.find((queue) => queue.actorId === value.actorId);
  const lane = owner?.lanes.find((candidate) => candidate.laneId === value.laneId);
  if (!lane || !Number.isSafeInteger(value.itemIndex) || value.itemIndex < 0) return invalid();
  if (value.operation === "enqueue") {
    if (value.itemIndex !== lane.items.length || lane.items.length >= lane.capacity ||
      expected.some((queue) => queue.lanes.some((candidate) => candidate.items.some((item) => item.itemId === value.item?.itemId))) ||
      value.item.remainingTimeMs !== value.item.totalTimeMs) return invalid();
    lane.items.push(value.item);
  } else {
    if (!isDeepStrictEqual(lane.items[value.itemIndex], value.item)) return invalid();
    lane.items.splice(value.itemIndex, 1);
  }
  if (!isDeepStrictEqual(expected, right.queues)) return invalid();
  return { boundary: { resourcesBefore: left.resources, resourcesAfter: right.resources,
    obligationsDue: left.obligations, obligationsAfter: right.obligations,
    boundarySequences: [before.sequence, after.sequence] as const }, failures: [], gaps: [] };
}
