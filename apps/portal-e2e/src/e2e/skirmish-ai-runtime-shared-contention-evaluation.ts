import type { RuntimeProductionEvidenceV1 } from "./skirmish-ai-runtime-production-evidence";

/** Only the exact train/research pair observed sharing a physical lane can supply its useful completion proof. */
export function evaluateRuntimeSharedContention(
  evidence: RuntimeProductionEvidenceV1,
  enqueued: RuntimeProductionEvidenceV1["events"],
  usefulCompleted: RuntimeProductionEvidenceV1["events"]
): string[] {
  const { snapshots } = evidence;
  const failures: string[] = [];
  const hasItem = (items: readonly string[], id: string | null) => id !== null && items.includes(id);
  const kinds = new Set(
    enqueued.map((event) => evidence.catalog.find((entry) => entry.productKey === event.productKey)?.kind)
  );
  const shared = enqueued.flatMap((train) =>
    evidence.catalog.some((entry) => entry.productKey === train.productKey && entry.kind === "production")
      ? enqueued
          .filter(
            (research) =>
              research.actorId === train.actorId &&
              research.laneId === train.laneId &&
              evidence.catalog.some((entry) => entry.productKey === research.productKey && entry.kind === "research") &&
              snapshots.some((snapshot) =>
                snapshot.producers.some(
                  (producer) =>
                    producer.actorId === train.actorId &&
                    producer.lanes.some(
                      (lane) =>
                        lane.laneId === train.laneId &&
                        hasItem(lane.itemIds, train.itemId) &&
                        hasItem(lane.itemIds, research.itemId)
                    )
                )
              )
          )
          .map((research) => [train, research] as const)
      : []
  );
  if (!shared.length || !kinds.has("production") || !kinds.has("research"))
    failures.push("production_shared_contention_missing");
  if (
    !shared.some((pair) =>
      pair.every((start) =>
        usefulCompleted.some(
          (event) =>
            event.itemId === start.itemId && event.actorId === start.actorId && event.productKey === start.productKey
        )
      )
    )
  ) {
    failures.push("production_useful_train_research_completion_missing");
  }
  if (evidence.events.some((event) => event.kind === "cancel")) failures.push("production_unnecessary_cancellation");
  return failures;
}
