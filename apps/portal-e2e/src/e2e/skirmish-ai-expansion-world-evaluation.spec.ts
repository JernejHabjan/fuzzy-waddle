import { expect, test } from "@playwright/test";
import { expansionEffectMatchesExecution } from "./skirmish-ai-expansion-world-evaluation";

test("matches the accepted expansion effect to its native command lineage", () => {
  expect(expansionEffectMatchesExecution("effect:expansion:1", { effectId: "expansion:1" })).toBe(true);
  expect(expansionEffectMatchesExecution("effect:expansion:1", { effectId: "expansion:2" })).toBe(false);
  expect(expansionEffectMatchesExecution("effect:expansion:1", undefined)).toBe(false);
});
