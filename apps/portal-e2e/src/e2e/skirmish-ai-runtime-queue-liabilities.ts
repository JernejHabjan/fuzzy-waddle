import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionQueueV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-queue-v1";

/** Independent raw-lane arithmetic; unknown/invalid items cannot supply a complete remaining-charge vector. */
export function calculateRuntimeQueueLiabilities(queues: readonly AiRuntimeProductionQueueV1[], exhaustedItemId?: string) {
  const due: Record<ResourceType, number> = { food: 0, wood: 0, stone: 0, minerals: 0 };
  const identities = new Set<string>();
  let exhaustedFound = exhaustedItemId === undefined;
  if (new Set(queues.map((queue) => queue.actorId)).size !== queues.length || queues.some((queue) =>
    !queue.actorId || new Set(queue.lanes.map((lane) => lane.laneId)).size !== queue.lanes.length ||
    queue.lanes.some((lane) => !lane.laneId || !Number.isSafeInteger(lane.capacity) || lane.capacity <= 0 ||
      lane.items.length > lane.capacity))) return null;
  for (const queue of queues) for (const lane of queue.lanes) for (const [index, item] of lane.items.entries()) {
    if (!item.itemId || identities.has(item.itemId) || item.payment === "unknown" ||
      !Number.isFinite(item.totalTimeMs) || item.totalTimeMs < 0 || !Number.isFinite(item.remainingTimeMs) ||
      item.remainingTimeMs < 0 || item.remainingTimeMs > item.totalTimeMs ||
      Object.entries(item.charge).some(([key, amount]) => !Object.values(ResourceType).some((type) => type === key) ||
        typeof amount !== "number" || !Number.isFinite(amount) || amount < 0)) return null;
    identities.add(item.itemId);
    if (item.itemId === exhaustedItemId) {
      if (index !== 0 || item.remainingTimeMs !== 0) return null;
      exhaustedFound = true;
      continue;
    }
    if (item.payment !== "per_successful_tick") continue;
    // An unprocessed zero-time head/waiting item still owes its one actual shared payment before completion.
    const charges = Math.max(1, Math.ceil(item.remainingTimeMs / 50));
    for (const resource of Object.values(ResourceType)) {
      due[resource] += charges * (item.charge[resource] ?? 0);
      if (!Number.isFinite(due[resource])) return null;
    }
  }
  return exhaustedFound ? due : null;
}
