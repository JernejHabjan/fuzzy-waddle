import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { productionQueueMutationFixture } from "./skirmish-ai-runtime-production-queue-mutation-fixture";
import { calculateRuntimeQueueLiabilities } from "./skirmish-ai-runtime-queue-liabilities";

/** Invented exact paid 150 -> 100 ms production cancellation; no live content, strategic AI or relay proof. */
export function productionPerTickCancellationFixture() {
  const purchase = productionQueueMutationFixture("tick", 150);
  const cancel = productionQueueMutationFixture("cancel");
  const advanced = purchase.facts.find((entry) => entry.kind === "queue_progress" && entry.progress.phase === "advanced");
  if (!advanced || advanced.kind !== "queue_progress" || !advanced.progress.item ||
    !advanced.boundaryState?.queues || !advanced.boundaryState.unspentClaims) throw new Error("synthetic_progress_missing");
  const paid = advanced.boundaryState;
  const item = advanced.progress.item;
  const queues = paid.queues;
  if (!queues) throw new Error("synthetic_physical_missing");
  const removedQueues = queues.map((queue) => ({ ...queue, lanes: queue.lanes.map((lane) => ({ ...lane,
    items: lane.items.filter((entry) => entry.itemId !== item.itemId) })) }));
  const removed = { ...paid, queues: removedQueues, obligations: calculateRuntimeQueueLiabilities(removedQueues) };
  const released = { ...removed, unspentClaims: { ...advanced.boundaryState.unspentClaims,
    entries: advanced.boundaryState.unspentClaims.entries.map((entry) => ({ ...entry, state: "released" as const })) } };
  const afterCash = { food: 97, wood: 100, stone: 100, minerals: 100 };
  const selectedCancel = cancel.facts.filter((entry) => entry.tick === 8);
  const effect = cancel.facts.filter((entry) => entry.tick === 10).map((entry): AiRuntimeProductionFactV1 => {
    if (entry.kind === "queue_mutation") return { ...entry, mutation: { ...entry.mutation, item },
      boundaryState: entry.mutation.phase === "before" ? paid : removed };
    if (entry.kind === "queue_resource") {
      const emission = entry.resource.emission;
      return { ...entry, resource: { ...entry.resource, payment: "per_successful_tick", emission: {
        ...emission, requested: { food: 4 },
        ...(emission.phase === "callback" ? { amounts: { food: 4 } } : {}),
        ...(emission.phase === "finished" ? { after: afterCash } : {})
      } }, boundaryState: { ...released, resources: emission.phase === "started" ? paid.resources : afterCash } };
    }
    return entry;
  });
  const firstProgress = purchase.facts.findIndex((entry) => entry.tick === 10);
  const facts = [...purchase.facts.slice(0, firstProgress), ...selectedCancel,
    ...purchase.facts.slice(firstProgress), ...effect];
  return { ...purchase, facts: facts.map((entry, index) => ({ ...entry, sequence: index + 1 })) };
}
