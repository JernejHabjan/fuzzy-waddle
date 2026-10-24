import type Phaser from "phaser";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import type { AiRuntimeUnspentClaims } from "./ai-runtime-unspent-claims";
import { getActorComponent } from "../../../data/actor-component";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { OwnerComponent } from "../../../entity/components/owner-component";
import {
  QUEUE_COMPLETION_AUTHORITY_EVENT,
  type QueueCompletionAuthorityEvent
} from "../../../entity/components/queue/queue-completion-authority-event";
import { QUEUE_MUTATION_EVENT, type QueueMutationEvent } from "../../../entity/components/queue/queue-mutation-event";
import { QUEUE_PROGRESS_EVENT, type QueueProgressEvent } from "../../../entity/components/queue/queue-progress-event";
import {
  QUEUE_RESOURCE_EMISSION_EVENT,
  type QueueResourceEmissionEvent
} from "../../../data/queue-resource-emission-event";
import { captureAiRuntimeProductionQueue } from "./ai-runtime-production-queues";
import { projectAiRuntimeQueueCompletion } from "./project-ai-runtime-queue-completion";
import { projectAiRuntimeQueueMutation } from "./project-ai-runtime-queue-mutation";
import { projectAiRuntimeQueueResource } from "./project-ai-runtime-queue-resource";
import { captureAiRuntimeQueueCatalog } from "./capture-ai-runtime-queue-catalog";

/** Owns exact queue callbacks; the parent capture remains the sole sequence/buffer/money authority. */
export class AiRuntimeProductionQueueCapture {
  private disposed = false;
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly identify: (actorId: string, item: UnifiedQueueItem) => string,
    private readonly unspentClaims: AiRuntimeUnspentClaims,
    private readonly boundary: (playerNumber: number) => { sequence: number; tick: number; playerNumber: number },
    private readonly append: (fact: AiRuntimeProductionFactV1, item?: UnifiedQueueItem) => void
  ) {
    scene.events.on(QUEUE_MUTATION_EVENT, this.observeMutation, this);
    scene.events.on(QUEUE_COMPLETION_AUTHORITY_EVENT, this.observeCompletion, this);
    scene.events.on(QUEUE_PROGRESS_EVENT, this.observeProgress, this);
    scene.events.on(QUEUE_RESOURCE_EMISSION_EVENT, this.observeQueueResource, this);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.scene.events.off(QUEUE_MUTATION_EVENT, this.observeMutation, this);
    this.scene.events.off(QUEUE_COMPLETION_AUTHORITY_EVENT, this.observeCompletion, this);
    this.scene.events.off(QUEUE_PROGRESS_EVENT, this.observeProgress, this);
    this.scene.events.off(QUEUE_RESOURCE_EMISSION_EVENT, this.observeQueueResource, this);
  }

  /** The live item can be outside the queue; projecting now preserves its actual handle identity and lineage. */
  private readonly observeQueueResource = (event: QueueResourceEmissionEvent): void => {
    if (this.disposed) return;
    const boundary = this.boundary(event.scope.playerNumber);
    const resource = projectAiRuntimeQueueResource(event, this.identify, boundary.tick);
    this.unspentClaims.observeResource(event.scope.playerNumber, resource);
    this.append({ ...boundary, kind: "queue_resource", resource });
  };

  /** Actual creator/tech authority, sampled separately from prior removal and later native terminal reporting. */
  private readonly observeCompletion = (event: QueueCompletionAuthorityEvent): void => {
    if (this.disposed) return;
    const playerNumber = getActorComponent(event.producer, OwnerComponent)?.getOwner();
    if (playerNumber === undefined) return;
    this.append({
      ...this.boundary(playerNumber),
      kind: "queue_completion",
      completion: projectAiRuntimeQueueCompletion(event, this.identify)
    });
  };

  /** Earliest physical insertion transfers future charges; removal callbacks retain their actual terminal ordering. */
  private readonly observeMutation = (event: QueueMutationEvent): void => {
    if (this.disposed) return;
    const playerNumber = getActorComponent(event.producer, OwnerComponent)?.getOwner();
    if (playerNumber === undefined) return;
    const mutation = projectAiRuntimeQueueMutation(event, this.identify);
    if (event.operation === "enqueue" && event.phase === "after") {
      const queue = captureAiRuntimeProductionQueue(event.producer, this.identify);
      if (queue) this.unspentClaims.observeQueue(playerNumber, queue);
    }
    // A completing head has already consumed its actual last progress attempt before this splice.
    const exhausted =
      event.operation === "complete_remove" && event.phase === "before" && event.item.remainingTime === 0
        ? event.item
        : undefined;
    const definition = mutation.actorId
      ? captureAiRuntimeQueueCatalog(event.producer, mutation.actorId, playerNumber)
      : null;
    this.append(
      {
        ...this.boundary(playerNumber),
        kind: "queue_mutation",
        mutation,
        definitionCatalog: definition?.catalog,
        definitionGaps: definition?.gaps
      },
      exhausted
    );
  };

  /** Samples the actual live head after shared decrement, before progress subscribers or async completion can mutate it. */
  private readonly observeProgress = (event: QueueProgressEvent): void => {
    if (this.disposed) return;
    const playerNumber = getActorComponent(event.producer, OwnerComponent)?.getOwner();
    if (playerNumber === undefined) return;
    let queue: ReturnType<typeof captureAiRuntimeProductionQueue> = null;
    try {
      queue = captureAiRuntimeProductionQueue(event.producer, this.identify);
    } catch {
      /* Missing authority stays explicit. */
    }
    const itemId = queue ? this.identify(queue.actorId, event.item) : null;
    const lane = queue?.lanes.find((candidate) => candidate.items[0]?.itemId === itemId);
    const item = lane?.items[0] ?? null;
    const progress = {
      attemptId: event.attemptId,
      phase: event.phase,
      actorId: queue?.actorId ?? null,
      item,
      laneId: lane?.laneId ?? null,
      deltaMs: event.deltaMs,
      remainingBeforeMs: event.remainingBeforeMs,
      snapshotRestoreInProgress: isSnapshotApplyInProgress(this.scene),
      gaps: item ? [] : ["production_progress_live_head_missing"]
    };
    const exhausted = item && event.phase === "advanced" && event.item.remainingTime === 0 ? event.item : undefined;
    this.append({ ...this.boundary(playerNumber), kind: "queue_progress", progress }, exhausted);
  };
}
