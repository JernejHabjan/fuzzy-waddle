import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

/** Test-owned declaration frozen at capture installation. Floors/date never move to the first successful delivery. */
export interface AiRuntimeResourceServiceIntervalV1 {
  readonly intervalId: string;
  readonly beneficiary: number;
  readonly resourceType: ResourceType;
  /** Fixed source cohort. Its subtotal cannot represent all income received by the beneficiary. */
  readonly actorIds: readonly string[];
  readonly need: { readonly intentId: string; readonly effectId: string; readonly selectedTick: number };
  readonly startTick: number;
  readonly endTick: number;
  readonly runCeilingTick: number;
  readonly windowTicks: number;
  readonly minimumUsefulDelivery: number;
  /** Required only for a nonintegral last window; both its actual duration and floor must be declared. */
  readonly finalWindow?: { readonly ticks: number; readonly minimumUsefulDelivery: number };
}
