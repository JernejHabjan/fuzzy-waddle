import type { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import type { QueueCompletionAuthorityEvent } from "../../../../../entity/components/queue/queue-completion-authority-event";
import type { AiRuntimeProductionQueue } from "./ai-runtime-production-queue";
import type { AiRuntimeCreatedActor } from "../../harness/capture/ai-runtime-created-actor";

/** Detached actual creation/registration interval; completion and strategic usefulness remain distinct. */
export interface AiRuntimeQueueCompletion {
  readonly completionId: number;
  readonly phase: QueueCompletionAuthorityEvent["phase"];
  readonly actorId: string | null;
  readonly item: AiRuntimeProductionQueue["lanes"][number]["items"][number] | null;
  readonly originatingCommandContext: NonNullable<UnifiedQueueItem["commandContext"]> | null;
  /** Canonical family of the actual stored production request, from the same registry as the created actor. */
  readonly requestedCanonicalObjectName: ObjectNames | null;
  readonly createdActor: AiRuntimeCreatedActor | null;
  /** Actual returned object must belong to the producer scene; null when no object was returned. */
  readonly createdActorInProducerScene: boolean | null;
  readonly researchRegistered: boolean | null;
  readonly snapshotRestoreInProgress: boolean;
  readonly gaps: readonly string[];
}
