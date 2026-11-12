import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { QueueItemType, type UnifiedQueueItem } from
  "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { projectAiProductionObligations } from "./ai-production-obligations";

function work(remainingTime: number, costType = PaymentType.PayOverTime): UnifiedQueueItem {
  return {
    type: QueueItemType.Production, totalTime: 150, remainingTime,
    productionData: {
      actorName: ObjectNames.TivaraWorker,
      costData: { costType, productionTime: 150, resources: { [ResourceType.Food]: 7 }, refundFactor: 1 }
    }
  };
}

describe("projectAiProductionObligations", () => {
  it("counts the actual full-vector fixed-tick charges, including a partial final tick", () => {
    expect(projectAiProductionObligations([work(101)])[ResourceType.Food]).toBe(21);
    expect(projectAiProductionObligations([work(51)])[ResourceType.Food]).toBe(14);
    expect(projectAiProductionObligations([work(1)])[ResourceType.Food]).toBe(7);
    expect(projectAiProductionObligations([work(0)])[ResourceType.Food]).toBe(7);
  });

  it("protects waiting work as well as parallel heads without double-counting paid immediate work", () => {
    const items = [work(100), work(150), work(50), work(150, PaymentType.PayImmediately)];
    expect(projectAiProductionObligations(items)[ResourceType.Food]).toBe(42);
    expect(projectAiProductionObligations([...items].reverse())).toEqual(projectAiProductionObligations(items));
    expect(projectAiProductionObligations([])[ResourceType.Food]).toBe(0);
  });

  it("keeps liability while payment stalls, and removes it only when the item leaves the queue", () => {
    const item = work(100);
    const initial = projectAiProductionObligations([item]);
    expect(projectAiProductionObligations([item])).toEqual(initial);
    item.remainingTime -= 50;
    expect(projectAiProductionObligations([item])[ResourceType.Food]).toBe(7);
    expect(projectAiProductionObligations([])[ResourceType.Food]).toBe(0);
  });

  it("rejects malformed authority timing or cost instead of reporting zero unpaid work", () => {
    expect(() => projectAiProductionObligations([work(NaN)])).toThrow("invalid_production_remaining_time");
    expect(() => projectAiProductionObligations([work(-1)])).toThrow("invalid_production_remaining_time");
    const item = work(100);
    if (!item.productionData) throw new Error("fixture_missing_cost");
    item.productionData.costData = { ...item.productionData.costData, resources: { [ResourceType.Food]: -1 } };
    expect(() => projectAiProductionObligations([item])).toThrow("invalid_production_payment_amount");
  });
});
