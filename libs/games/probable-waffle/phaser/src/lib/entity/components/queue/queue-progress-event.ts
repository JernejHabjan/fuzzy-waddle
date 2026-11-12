import type Phaser from "phaser";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";

export const QUEUE_PROGRESS_EVENT = "queue-progress";

/** Local live-handle diagnostic around one real queue attempt, before progress callbacks/completion/removal. */
export interface QueueProgressEvent {
  readonly producer: Phaser.GameObjects.GameObject;
  readonly item: UnifiedQueueItem;
  /** Scene-local attempt identity, never persisted or relayed. */
  readonly attemptId: number;
  readonly phase: "started" | "advanced" | "denied" | "threw";
  readonly deltaMs: number;
  readonly remainingBeforeMs: number;
}
