import { getCanonicalActorNameCached } from "../../../data/tech-tree/canonical-actor-name";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { getActorComponent } from "../../../data/actor-component";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import type { QueueCompletionAuthorityEvent } from "../../../entity/components/queue/queue-completion-authority-event";
import type { AiRuntimeQueueCompletionV1 } from "./ai-runtime-queue-completion-v1";
import { captureAiRuntimeProductionItem } from "./ai-runtime-production-item";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";

/** The item is already removed. Missing identity or creation projection stays null with its own gap. */
export function projectAiRuntimeQueueCompletion(
  event: QueueCompletionAuthorityEvent, identify: (actorId: string, item: UnifiedQueueItem) => string
): AiRuntimeQueueCompletionV1 {
  const gaps: string[] = [];
  let actorId: string | null = null;
  let item: AiRuntimeQueueCompletionV1["item"] = null;
  let requestedCanonicalObjectName: AiRuntimeQueueCompletionV1["requestedCanonicalObjectName"] = null;
  let createdActor: AiRuntimeQueueCompletionV1["createdActor"] = null;
  try {
    actorId = getActorComponent(event.producer, IdComponent)?.id ?? null;
    if (actorId) item = captureAiRuntimeProductionItem(actorId, event.item, identify);
    else gaps.push("production_completion_producer_identity_missing");
    if (event.item.productionData) requestedCanonicalObjectName = getCanonicalActorNameCached(event.item.productionData.actorName);
    if (event.createdActor) createdActor = captureAiRuntimeCreatedActor(event.createdActor);
  } catch { gaps.push("production_completion_projection_unavailable"); }
  return structuredClone({ completionId: event.completionId, phase: event.phase, actorId, item, createdActor,
    requestedCanonicalObjectName,
    originatingCommandContext: event.item.commandContext ?? null,
    createdActorInProducerScene: event.createdActor ? event.createdActor.scene === event.producer.scene : null,
    researchRegistered: event.researchRegistered,
    snapshotRestoreInProgress: isSnapshotApplyInProgress(event.producer.scene), gaps
  } satisfies AiRuntimeQueueCompletionV1);
}
