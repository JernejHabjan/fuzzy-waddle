import type Phaser from "phaser";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";
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
      items: lane.queuedItems.map((item) => {
        const cost = item.productionData?.costData;
        const research = item.researchData ? researchDefinitions[item.researchData] : undefined;
        return {
          itemId: identify(actorId, item),
          identitySource: item.commandContext ? "command" as const : "capture_local" as const,
          commandId: item.commandContext?.execution.commandId ?? null,
          effectId: item.commandContext?.execution.effectId ?? null,
          objectName: item.productionData?.actorName ?? null, researchType: item.researchData ?? null,
          totalTimeMs: item.totalTime, remainingTimeMs: item.remainingTime,
          payment: cost ? cost.costType === PaymentType.PayOverTime ? "per_successful_tick" as const : "immediate" as const
            : research ? "immediate" as const : "unknown" as const,
          charge: { ...(cost?.resources ?? research?.cost ?? {}) }
        };
      })
    }))
  };
}
