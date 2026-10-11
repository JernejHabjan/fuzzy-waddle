import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { getActorComponent } from "../../../data/actor-component";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import type { QueueMutationEvent } from "../../../entity/components/queue/queue-mutation-event";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import type { AiRuntimeQueueMutationV1 } from "./ai-runtime-queue-mutation-v1";
import { captureAiRuntimeProductionItem } from "./ai-runtime-production-item";

/** Reads the affected live handle even when it is outside the lane. Sampling failures never invent an item. */
export function projectAiRuntimeQueueMutation(
  event: QueueMutationEvent,
  identify: (actorId: string, item: UnifiedQueueItem) => string
): AiRuntimeQueueMutationV1 {
  const gaps: string[] = [];
  let actorId: string | null = null;
  let laneId: string | null = null;
  let item: AiRuntimeQueueMutationV1["item"] = null;
  try {
    actorId = getActorComponent(event.producer, IdComponent)?.id ?? null;
    const queue = getActorComponent(event.producer, QueueComponent);
    if (!actorId || !queue || !Number.isSafeInteger(event.queueIndex) || event.queueIndex < 0 ||
      !queue.queues[event.queueIndex]) gaps.push("production_mutation_lane_missing");
    else {
      laneId = `${actorId}:lane:${event.queueIndex}`;
      item = captureAiRuntimeProductionItem(actorId, event.item, identify);
    }
  } catch { gaps.push("production_mutation_projection_unavailable"); }
  return structuredClone({ mutationId: event.mutationId, phase: event.phase, operation: event.operation,
    actorId, laneId, itemIndex: event.itemIndex, item,
    originatingCommandContext: event.item.commandContext ?? null, cancellationCommand: event.cancellationCommand ?? null,
    snapshotRestoreInProgress: isSnapshotApplyInProgress(event.producer.scene), gaps
  } satisfies AiRuntimeQueueMutationV1);
}
