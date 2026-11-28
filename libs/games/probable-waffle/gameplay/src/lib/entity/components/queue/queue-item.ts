import type { GameCommandExecution, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ActorId, PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { ProductionQueueItem } from "../production/game-object";

import { QueueItemType } from "./queue-item-type";
export { QueueItemType } from "./queue-item-type";

export interface UnifiedQueueItem {
  type: QueueItemType;

  // Production-specific
  productionData?: ProductionQueueItem;

  // Research-specific
  researchData?: ResearchType;
  /** Original paid research policy; old saves without it use the current definition as a compatibility fallback. */
  researchCost?: { resources: Partial<Record<ResourceType, number>>; refundFactor: number };

  // Shared metadata
  totalTime: number; // For calculating refunds and progress
  remainingTime: number; // Current remaining time for this item
  commandContext?: {
    execution: GameCommandExecution;
    playerNumber: PlayerNumber;
    actorIds: readonly ActorId[];
  };
}
