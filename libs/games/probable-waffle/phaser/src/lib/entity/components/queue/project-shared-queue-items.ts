import type { SharedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/shared-queue-item";
import { SharedQueueItemType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/shared-queue-item-type";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";
import type { SharedQueue } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/shared-queue";
import { QueueItemType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";

/** On-demand display projection; gameplay identity and lane ordering stay with the shared queue. */
export function projectSharedQueueItems(
  queues: readonly SharedQueue[],
  getProgress: (queue: SharedQueue) => number | null
): SharedQueueItem[] {
  const items: SharedQueueItem[] = [];
  let displayIndex = 0;

  for (const queue of queues) {
    for (let i = 0; i < queue.queuedItems.length; i++) {
      const item = queue.queuedItems[i]!;

      // Calculate progress (only for first item in queue)
      const progress = i === 0 ? getProgress(queue) ?? 0 : 0;

      // Handle production items
      if (item.type === QueueItemType.Production && item.productionData) {
        const actorDefinition = getPwActorDefinition(item.productionData.actorName, null);
        const infoComponent = actorDefinition?.components?.info;
        if (infoComponent?.smallImage) {
          items.push({
            type: SharedQueueItemType.Production,
            id: `production-${displayIndex}`,
            iconData: {
              key: infoComponent.smallImage.key,
              frame: infoComponent.smallImage.frame,
              origin: infoComponent.smallImage.origin
            },
            progressPercent: progress,
            displayIndex: displayIndex++,
            productionData: item.productionData
          });
        }
      }
      // Handle research items
      else if (item.type === QueueItemType.Research && item.researchData) {
        const researchData = researchDefinitions[item.researchData];
        if (researchData && researchData.icon) {
          items.push({
            type: SharedQueueItemType.Research,
            id: `research-${item.researchData}`,
            iconData: {
              key: researchData.icon.key,
              frame: researchData.icon.frame,
              origin: { x: 0.5, y: 0.5 }
            },
            progressPercent: progress,
            displayIndex: displayIndex++,
            researchData: item.researchData
          });
        }
      }
    }
  }

  return items;
}
