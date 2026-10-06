import type Phaser from "phaser";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import type { ProductionCostDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/production-cost-definition";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { OwnerComponent } from "../owner-component";

/** Native start predicate is preserved verbatim: configured costType does not decide this branch. */
export function startConstructionPayment(
  gameObject: Phaser.GameObjects.GameObject, productionDefinition: ProductionCostDefinition
): void {
  if (productionDefinition.productionTime === PaymentType.PayImmediately) {
    const ownerComponent = getActorComponent(gameObject, OwnerComponent);
    const owner = ownerComponent?.getOwner();
    if (owner === undefined) throw new Error("Owner not found");
    const player = getPlayer(gameObject.scene, owner);
    if (!player) throw new Error("PlayerController not found");

    const canAfford = player.canPayAllResources(productionDefinition.resources);
    if (canAfford) {
      emitResource(gameObject.scene, "resource.removed", productionDefinition.resources, owner);
    } else {
      throw new Error("Cannot afford building costs");
    }
  }
}

/** Resamples progress through the caller exactly as before; no paid-price ledger or cancellation guard is inferred. */
export function refundConstructionPayment(
  gameObject: Phaser.GameObjects.GameObject, productionDefinition: ProductionCostDefinition,
  refundFactor: number, getProgressFraction: () => number
): void {
  const TimeRefundFactor =
    productionDefinition.costType === PaymentType.PayImmediately ? getProgressFraction() : 1.0;
  const actualRefundFactor = refundFactor * TimeRefundFactor;

  // refund costs
  const refundCosts: Partial<Record<ResourceType, number>> = {};
  Object.entries(productionDefinition.resources).forEach(([key, value]) => {
    refundCosts[key as ResourceType] = Math.floor(value * actualRefundFactor);
  });

  const ownerComponent = getActorComponent(gameObject, OwnerComponent);
  const owner = ownerComponent?.getOwner();
  emitResource(gameObject.scene, "resource.added", refundCosts, owner);
}
