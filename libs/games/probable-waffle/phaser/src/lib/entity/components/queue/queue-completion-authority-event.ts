import type Phaser from "phaser";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";

export const QUEUE_COMPLETION_AUTHORITY_EVENT = "queue-completion-authority";

/** Local observation of the actual creation/registration call, after physical removal and before terminal reporting. */
export interface QueueCompletionAuthorityEvent {
  readonly producer: Phaser.GameObjects.GameObject;
  /** Original removed live handle; no lookup of a replacement queue head. */
  readonly item: UnifiedQueueItem;
  /** Scene-local callback interval, never persisted or relayed. */
  readonly completionId: number;
  readonly phase: "before" | "after" | "threw";
  /** Actual returned object from SceneActorCreator; null for research, before, throws or failed creation. */
  readonly createdActor: Phaser.GameObjects.GameObject | null;
  /** Actual TechTreeService membership at this callback; null for production or absent owner/service. */
  readonly researchRegistered: boolean | null;
}
