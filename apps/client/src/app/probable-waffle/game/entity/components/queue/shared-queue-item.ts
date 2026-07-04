import type { ResearchType } from "@fuzzy-waddle/api-interfaces";
import type { ProductionQueueItem } from "../production/game-object";
import { SharedQueueItemType } from "./shared-queue-item-type";

export interface SharedQueueItem {
  type: SharedQueueItemType;
  id: string; // Unique identifier for this queue item
  iconData: {
    key: string;
    frame: string;
    origin?: { x: number; y: number };
  };
  progressPercent: number; // 0-100
  displayIndex: number; // Position in the unified queue (0-based)

  // Metadata for different queue types
  productionData?: ProductionQueueItem;
  researchData?: ResearchType;
}
