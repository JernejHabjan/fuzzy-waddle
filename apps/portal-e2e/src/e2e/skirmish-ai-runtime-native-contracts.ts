import type { RuntimeAssertion } from "./skirmish-ai-runtime-assertion";
import type { RuntimeFixture } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantResult } from "./skirmish-ai-runtime-variant-result";
import { evaluateExpansionWorld } from "./skirmish-ai-expansion-world-evaluation";
import { evaluateNativeScenarioVariant } from "./skirmish-ai-native-scenario-evaluation";

/** Focused native delegates keep the general variant evaluator independent of each world's physical proof. */
export function evaluateRuntimeNativeContracts(
  scenarioId: string, assertion: RuntimeAssertion, variant: RuntimeVariantResult, fixture?: RuntimeFixture
): string[] {
  if (scenarioId !== "EXP-02") return evaluateNativeScenarioVariant(scenarioId, assertion, variant, fixture);
  const contract = assertion.requiredExpansionPressure, branch = contract?.branchByVariant[variant.variantId];
  return contract?.latestTick === 3000 && contract.humanPlayerNumber === 1 && branch &&
    ["expand", "home_pressure", "pressure_withdrawn", "combat_resolved"].includes(branch)
    ? evaluateExpansionWorld(branch, variant, variant.opponentCapture) : ["expansion_pressure_variant_binding_missing"];
}
