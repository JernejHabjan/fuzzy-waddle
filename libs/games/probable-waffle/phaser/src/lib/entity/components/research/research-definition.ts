import type { ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";

/**
 * Defines the structured research definition contract for this module. Its declared surface makes available
 * research explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface ResearchDefinition {
  /**
   * collection value on {@link ResearchDefinition}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  availableResearch: ResearchType[];
}

