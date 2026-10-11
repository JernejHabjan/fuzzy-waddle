import { captureAiRuntimeProductionItem } from "./ai-runtime-production-item";
import type Phaser from "phaser";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { getActorComponent } from "../../../data/actor-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import type { AiRuntimeProductionQueueV1 } from "./ai-runtime-production-queue-v1";

/** Reads real lane indices and item handles; the caller owns the capture-local identity lifetime. */
export function captureAiRuntimeProductionQueue(
  actor: Phaser.GameObjects.GameObject,
  identify: (actorId: string, item: UnifiedQueueItem) => string
): AiRuntimeProductionQueueV1 | null {
  const actorId = getActorComponent(actor, IdComponent)?.id;
  const queue = getActorComponent(actor, QueueComponent);
  if (!actorId || !queue) return null;
  return {
    actorId, objectName: actor.name,
    lanes: queue.queues.map((lane, index) => ({
      laneId: `${actorId}:lane:${index}`, capacity: queue.queueDefinition.capacityPerQueue,
      items: lane.queuedItems.map((item) => captureAiRuntimeProductionItem(actorId, item, identify))
    }))
  };
}
