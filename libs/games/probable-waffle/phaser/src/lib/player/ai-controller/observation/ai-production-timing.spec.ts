import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import type {
  ConstructionSiteDefinition
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/construction/construction-site-definition";
import { projectAiProductionTiming } from "./ai-production-timing";

describe("definition production timing", () => {
  const cost = { costType: PaymentType.PayImmediately, productionTime: 10_000, resources: {}, refundFactor: 1 };
  const construction: ConstructionSiteDefinition = {
    consumesBuilders: false, maxAssignedBuilders: 3, maxAssignedRepairers: 3, progressMadeAutomatically: 0.25,
    progressMadePerBuilder: 0.25, repairFactor: 1, initialHealthPercentage: 0.1, refundFactor: 1,
    startImmediately: false, canBeDragPlaced: false
  };

  it("uses fixed-clock durations and the actual one-builder plus automatic work rate", () => {
    expect(projectAiProductionTiming(cost, construction, 2)).toEqual({
      durationTicks: 200, singleBuilderTicks: 400, lanes: 2
    });
  });

  it("does not invent construction work for units, stalled definitions, or missing cost definitions", () => {
    expect(projectAiProductionTiming(cost, undefined, 1)?.singleBuilderTicks).toBeNull();
    expect(projectAiProductionTiming(cost, { ...construction, progressMadeAutomatically: 0,
      progressMadePerBuilder: 0 }, 1)?.singleBuilderTicks).toBeNull();
    expect(projectAiProductionTiming(cost, { ...construction, maxAssignedBuilders: 0 }, 1)?.singleBuilderTicks).toBe(800);
    expect(projectAiProductionTiming(undefined, construction, 1)).toBeUndefined();
  });
});
