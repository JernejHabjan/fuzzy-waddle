import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/**
 * Represents the resource information that may influence the legacy controller's
 * immediate worker assignment. The brain replaces this narrow compatibility view
 * with a versioned observation and demand ledger.
 */
export interface AiResourceDemandInput {
  readonly resources: Readonly<Record<ResourceType, number>>;
  readonly reserved: Readonly<Record<ResourceType, number>>;
  readonly incomeSmoothed: Readonly<Record<ResourceType, number>>;
}
