import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import type { QueueMutationEvent } from "../../../entity/components/queue/queue-mutation-event";
import type { AiRuntimeProductionQueue } from "./ai-runtime-production-queue";

/** Actual push/splice callback. Missing projection/restore authority remains explicit, never a synthetic queue delta. */
export interface AiRuntimeQueueMutation {
  readonly mutationId: number;
  readonly phase: QueueMutationEvent["phase"];
  readonly operation: QueueMutationEvent["operation"];
  readonly actorId: string | null;
  readonly laneId: string | null;
  readonly itemIndex: number;
  readonly item: AiRuntimeProductionQueue["lanes"][number]["items"][number] | null;
  readonly originatingCommandContext: NonNullable<UnifiedQueueItem["commandContext"]> | null;
  readonly cancellationCommand: NonNullable<QueueMutationEvent["cancellationCommand"]> | null;
  readonly snapshotRestoreInProgress: boolean;
  readonly gaps: readonly string[];
}
