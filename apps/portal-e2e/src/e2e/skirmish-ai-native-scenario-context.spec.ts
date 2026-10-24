import { expect, test } from "@playwright/test";
import { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";

test("a missing original role cannot broaden a target-specific native query", () => {
  // Deliberately incomplete capture: this checks rejection only and supplies no native acceptance evidence.
  const result = { presetCreatedActorIds: { original: "native-original" } } as unknown as RuntimeVariantResultV1;
  const context = nativeScenarioContext(result, 100);
  expect(context.failures.length).toBeGreaterThan(0);
  expect(context.role("original")).toBe("native-original");
  expect(() => context.role("replacement")).toThrow("native_required_actor_role_missing:replacement");
});
