import { expect, test } from "@playwright/test";
import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import { isEvidenceStopSafe, nextEvidenceStopState } from "./skirmish-ai-runtime-evidence-stop";

const positive: RuntimeAssertionV1 = {
  maximumTick: 1000, minimumDecisions: 10, minimumAppliedCommands: 1,
  requiredAiFactions: ["Tivara"], minimumMilitaryCount: 3
};

function state(input: Partial<Parameters<typeof nextEvidenceStopState>[0]> = {}) {
  return nextEvidenceStopState({
    config: { earliestTick: 200, stableForTicks: 200 }, role: "subject", assertions: [positive],
    tick: 200, pendingEventTicks: [], allPredicatesSatisfied: true, satisfiedSinceTick: null,
    ...input
  });
}

test("positive evidence needs a sustained interval, not one passing checkpoint", () => {
  expect(state()).toEqual({ satisfiedSinceTick: 200, stop: false });
  expect(state({ tick: 400, satisfiedSinceTick: 200 })).toEqual({ satisfiedSinceTick: 200, stop: true });
  expect(state({ tick: 300, satisfiedSinceTick: 200, allPredicatesSatisfied: false }))
    .toEqual({ satisfiedSinceTick: null, stop: false });
});

test("pending perturbations and paired controls cannot stop early", () => {
  expect(state({ tick: 400, satisfiedSinceTick: 200, pendingEventTicks: [500] }).stop).toBe(false);
  expect(state({ tick: 400, satisfiedSinceTick: 200, role: "control" }).stop).toBe(false);
});

test("absence, temporal, terminal and lifecycle assertions retain the full horizon", () => {
  expect(isEvidenceStopSafe(positive)).toBe(true);
  for (const addition of [
    { maximumMilitaryProducerCount: 2 }, { requireProductionStopsAtTarget: true },
    { requireAiVictory: true }, { requireProducerReplacementAfterLoss: true }
  ]) {
    expect(isEvidenceStopSafe({ ...positive, ...addition })).toBe(false);
    expect(state({ tick: 400, satisfiedSinceTick: 200,
      assertions: [{ ...positive, ...addition }] as RuntimeAssertionV1[] }).stop).toBe(false);
  }
});
