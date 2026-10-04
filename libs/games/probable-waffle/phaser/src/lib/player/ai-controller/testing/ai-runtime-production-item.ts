import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";
import type { AiRuntimeProductionQueueV1 } from "./ai-runtime-production-queue-v1";

/** Detached live item, including outside its lane; identity has the same owner as the physical queue projection. */
export function captureAiRuntimeProductionItem(
  actorId: string,
  item: UnifiedQueueItem,
  identify: (actorId: string, item: UnifiedQueueItem) => string
): AiRuntimeProductionQueueV1["lanes"][number]["items"][number] {
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
}
