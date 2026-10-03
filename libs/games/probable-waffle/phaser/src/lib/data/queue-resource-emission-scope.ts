import type Phaser from "phaser";
import type { GameCommand, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";

/** Caller-owned authority inputs. Item/producer are transient handles, never persisted or relayed by the observer. */
export interface QueueResourceEmissionScope {
  readonly producer: Phaser.GameObjects.GameObject;
  /** The actual item, including before its first queue insertion or after its removal for cancellation. */
  readonly item: UnifiedQueueItem;
  readonly playerNumber: number;
  readonly operation: "immediate_charge" | "tick_charge" | "cancellation_refund";
  /** Exact vector passed to the shared emitter; a refund can differ from the item's stored price. */
  readonly amounts: Partial<Record<ResourceType, number>>;
  /** Actual applied cancellation, independent of the command which originally purchased the item. */
  readonly cancellationCommand?: GameCommand;
}
