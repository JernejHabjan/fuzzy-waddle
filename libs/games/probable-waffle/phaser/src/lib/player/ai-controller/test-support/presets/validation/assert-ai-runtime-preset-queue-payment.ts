import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";

/** Checks the isolated synchronous setup operation, before any tick charge or authored balance reset can occur. */
export function assertAiRuntimePresetQueuePayment(
  item: UnifiedQueueItem,
  before: Readonly<Record<ResourceType, number>>,
  after: Readonly<Record<ResourceType, number>>
): void {
  const production = item.productionData?.costData;
  const research = item.researchData ? researchDefinitions[item.researchData] : undefined;
  if (production && ![PaymentType.PayImmediately, PaymentType.PayOverTime].includes(production.costType)) {
    throw new Error("runtime_preset_queue_payment_type_unknown");
  }
  if (!production && !research) throw new Error("runtime_preset_queue_price_missing");
  const storedPrice = production?.resources ?? research?.cost;
  const price = production ? production.costType === PaymentType.PayImmediately ? production.resources : {} : research?.cost;
  for (const resource of Object.values(ResourceType)) {
    const amount = price?.[resource] ?? 0;
    const numeric = [storedPrice?.[resource] ?? 0, amount, before[resource], after[resource]];
    if (!numeric.every((value) => Number.isFinite(value) && value >= 0) ||
      after[resource] !== before[resource] - amount) throw new Error("runtime_preset_queue_payment_mismatch");
  }
}
