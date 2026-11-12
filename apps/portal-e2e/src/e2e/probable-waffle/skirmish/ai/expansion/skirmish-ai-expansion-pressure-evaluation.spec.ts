import { expect, test } from "@playwright/test";
import {
  expansionRecoveryBoundary,
  firstSustainedClearBoundary,
  isAtOrAfterRecoveryBoundary
} from "./skirmish-ai-expansion-pressure-evaluation";

test("withdrawal recovery follows a confirmed clear interval while retreat completion stays separate", () => {
  const clear = firstSustainedClearBoundary([
    { tick: 500, sequence: 2347, dangerous: true, complete: true },
    { tick: 520, sequence: 2491, dangerous: true, complete: true },
    { tick: 600, sequence: 2984, dangerous: false, complete: true },
    { tick: 620, sequence: 3102, dangerous: false, complete: true },
    { tick: 1400, sequence: 7239, dangerous: true, complete: true }
  ], 500, 894);
  const resolution = { resolvedTick: 894, resolvedSequence: 4609 };
  expect(clear).toEqual({ tick: 600, sequence: 2984 });
  expect(expansionRecoveryBoundary("pressure_withdrawn", clear, resolution)).toEqual({ tick: 600, sequence: 2984 });
  expect(expansionRecoveryBoundary("combat_resolved", clear, resolution)).toEqual({ tick: 894, sequence: 4609 });
  expect(isAtOrAfterRecoveryBoundary(600, 2984, { tick: 600, sequence: 2984 })).toBe(true);
  expect(isAtOrAfterRecoveryBoundary(600, 2983, { tick: 600, sequence: 2984 })).toBe(false);
});

test("does not infer a pressure-clear boundary when home danger or native resolution evidence is missing", () => {
  expect(firstSustainedClearBoundary([
    { tick: 500, sequence: 2347, dangerous: true, complete: true },
    { tick: 600, sequence: 2984, dangerous: false, complete: false },
    { tick: 620, sequence: 3102, dangerous: false, complete: true },
    { tick: 640, sequence: 3222, dangerous: true, complete: true }
  ], 500, 894)).toBeUndefined();
  expect(expansionRecoveryBoundary("pressure_withdrawn", undefined, { resolvedTick: 894, resolvedSequence: 4609 })).toBeUndefined();
  expect(expansionRecoveryBoundary("combat_resolved", undefined, {
    resolvedTick: undefined, resolvedSequence: undefined
  })).toBeUndefined();
});
