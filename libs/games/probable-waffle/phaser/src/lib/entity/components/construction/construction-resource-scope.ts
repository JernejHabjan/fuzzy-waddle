import type Phaser from "phaser";
import type { ConstructionStateEnum, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProductionCostDefinition } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/production-cost-definition";

/** Actual native inputs before emission. Live objects/resources are never retained in the serializable record. */
export interface ConstructionResourceScope {
  readonly site: Phaser.GameObjects.GameObject;
  readonly state: ConstructionStateEnum;
  readonly remainingWorkMs: number;
  readonly definition: ProductionCostDefinition;
  readonly operation: "start_charge" | "cancel_refund";
  readonly owner: number | undefined;
  readonly amounts: Partial<Record<ResourceType, number>> | null;
  readonly refundFactor: number | null;
  readonly noEmission?: "skipped" | "denied";
}
