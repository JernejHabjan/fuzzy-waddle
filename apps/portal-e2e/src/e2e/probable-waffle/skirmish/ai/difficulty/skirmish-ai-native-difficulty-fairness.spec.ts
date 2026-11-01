import { expect, test } from "@playwright/test";
import { evaluateDifficultyFairnessPairs } from "./skirmish-ai-native-difficulty-fairness";

/** Predicate controls only; a missing native pair must never count as a successful fairness experiment. */
test("difficulty fairness rejects absent and unproven native baseline worlds", () => {
  expect(evaluateDifficultyFairnessPairs([], () => undefined)).toContain("fairness_baseline_missing");
  expect(evaluateDifficultyFairnessPairs([], () => undefined))
    .toContain("fairness_difficulty_changed_native_rules_resources_or_stats");
});
