import { ObjectNames, ResourceType, ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { QueueItemType, type UnifiedQueueItem } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";
import { assertAiRuntimePresetQueuePayment } from "./assert-ai-runtime-preset-queue-payment";

it("checks every shared resource, including unexpected spending outside the item's price", () => {
  const item: UnifiedQueueItem = { type: QueueItemType.Production, totalTime: 100, remainingTime: 100,
    productionData: { actorName: ObjectNames.TivaraWorker, costData: { costType: PaymentType.PayImmediately,
      productionTime: 100, refundFactor: 1, resources: { [ResourceType.Food]: 35 } } } };
  const before: Record<ResourceType, number> = { food: 100, wood: 100, stone: 100, minerals: 100 };
  expect(() => assertAiRuntimePresetQueuePayment(item, before, { ...before, food: 65 })).not.toThrow();
  for (const after of [{ ...before }, { ...before, food: 65, wood: 99 }, { ...before, food: -1 }, { ...before, food: NaN }]) {
    expect(() => assertAiRuntimePresetQueuePayment(item, before, after)).toThrow("runtime_preset_queue_payment_mismatch");
  }
});

it("takes research's price from the shared definition", () => {
  const type = ResearchType.TivaraMacemanUpgradeLevel2;
  const definition = researchDefinitions[type];
  const item: UnifiedQueueItem = { type: QueueItemType.Research, researchData: type,
    totalTime: definition.researchTime, remainingTime: definition.researchTime };
  const before: Record<ResourceType, number> = { food: 1000, wood: 1000, stone: 1000, minerals: 1000 };
  const after = { ...before };
  for (const resource of Object.values(ResourceType)) after[resource] -= definition.cost[resource] ?? 0;
  expect(() => assertAiRuntimePresetQueuePayment(item, before, after)).not.toThrow();
  expect(() => assertAiRuntimePresetQueuePayment(item, before, before)).toThrow("runtime_preset_queue_payment_mismatch");
});
