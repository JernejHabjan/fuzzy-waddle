import type { ResearchType } from "@fuzzy-waddle/api-interfaces";
import type { ProductionQueueItem } from "../production/game-object";

export enum QueueItemType {
  Production = 'production',
  Research = 'research'
}

export interface UnifiedQueueItem {
  type: QueueItemType;

  // Production-specific
  productionData?: ProductionQueueItem;

  // Research-specific
  researchData?: ResearchType;

  // Shared metadata
  totalTime: number; // For calculating refunds and progress
  remainingTime: number; // Current remaining time for this item
}
