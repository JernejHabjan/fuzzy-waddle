import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Native carried state at a synchronous boundary; empty cargo may retain a selected type. Never persisted by diagnostics. */
export interface ResourceCargoSample {
  readonly amount: number;
  readonly resourceType: ResourceType | null;
}
