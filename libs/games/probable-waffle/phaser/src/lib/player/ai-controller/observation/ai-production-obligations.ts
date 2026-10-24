import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { QueueItemType, type UnifiedQueueItem } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";

/**
 * Remaining shared queue liability, including waiting lanes/items. The current QueueComponent charges the entire
 * cost vector on each successful pay-over-time tick; it does not prorate a total price. Failed payment advances
 * neither time nor liability. Immediate production and research are already paid and incur no remaining charge.
 */
export function projectAiProductionObligations(items: readonly UnifiedQueueItem[]): Record<ResourceType, number> {
  const due = Object.fromEntries(Object.values(ResourceType).map((resource) => [resource, 0])) as Record<ResourceType, number>;
  for (const item of items) {
    const cost = item.productionData?.costData;
    if (item.type !== QueueItemType.Production || cost?.costType !== PaymentType.PayOverTime) continue;
    if (!Number.isFinite(item.remainingTime) || item.remainingTime < 0) throw new Error("invalid_production_remaining_time");
    // A zero-time head still enters the payment branch once before completion in the shared queue processor.
    const payments = Math.max(1, Math.ceil(item.remainingTime / SimulationTickService.TICK_INTERVAL_MS));
    for (const resource of Object.values(ResourceType)) {
      const amount = cost.resources[resource] ?? 0;
      if (!Number.isFinite(amount) || amount < 0) throw new Error("invalid_production_payment_amount");
      due[resource] += payments * amount;
      if (!Number.isFinite(due[resource])) throw new Error("production_obligation_overflow");
    }
  }
  return due;
}
