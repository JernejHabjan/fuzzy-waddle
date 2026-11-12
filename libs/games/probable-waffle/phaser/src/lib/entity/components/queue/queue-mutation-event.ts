import type Phaser from "phaser";
import type { CancelProductionCommand, CancelResearchCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";

export const QUEUE_MUTATION_EVENT = "queue-mutation";

/** Local live-handle observation around the actual push/splice, before UI, refund or terminal callbacks. */
export interface QueueMutationEvent {
  readonly producer: Phaser.GameObjects.GameObject;
  readonly item: UnifiedQueueItem;
  /** Scene-local identity; never saved, relayed or used to deduplicate gameplay. */
  readonly mutationId: number;
  readonly phase: "before" | "after" | "threw";
  readonly operation: "enqueue" | "cancel_remove" | "complete_remove";
  /** Physical lane and affected position at mutation time, not the display queue index. */
  readonly queueIndex: number;
  readonly itemIndex: number;
  /** Applied cancellation carried separately from the original purchased item. */
  readonly cancellationCommand?: CancelProductionCommand | CancelResearchCommand;
}
