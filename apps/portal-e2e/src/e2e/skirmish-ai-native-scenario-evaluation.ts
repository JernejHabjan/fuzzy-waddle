import bindings from "../../../../tools/ai/native-scenario-bindings.json";
import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { evaluateNativeScouting, nativeScoutingFairness } from "./skirmish-ai-native-scouting-evaluation";
import { evaluateNativeStrategy } from "./skirmish-ai-native-strategy-evaluation";
import { evaluateNativeCombat } from "./skirmish-ai-native-combat-evaluation";
import { evaluateNativePlacement } from "./skirmish-ai-native-placement-evaluation";
import { evaluateNativeFortification } from "./skirmish-ai-native-fortification-evaluation";
import { evaluateExpansionWorld } from "./skirmish-ai-expansion-world-evaluation";

/** Mandatory matrix binding; existing partial owner-world experiments remain explicitly outside full case registration. */
export function evaluateNativeScenarioVariant(
  id: string, assertion: RuntimeAssertionV1, result: RuntimeVariantResultV1, fixture?: RuntimeFixtureV1
): string[] {
  const definition = Object.entries(bindings.cases).find(([scenarioId]) => scenarioId === id)?.[1];
  const contract = assertion.requiredNativeScenario;
  if (!definition) return contract ? ["native_scenario_unknown_contract"] : [];
  if (!fixture && !contract) return [];
  const variant = fixture?.recipe.variants.find((candidate) => candidate.id === result.variantId);
  const branch = contract?.branchByVariant[result.variantId];
  if (!contract || contract.schemaVersion !== 1 || contract.scenarioId !== id ||
      contract.latestTick !== definition.latestTick || contract.humanPlayerNumber !== 1 ||
      !branch || !definition.branches.includes(branch) || !variant?.presetWorld ||
      variant.captureConstruction !== true || variant.captureCombat !== true || variant.evidenceStop ||
      result.presetFixtureId !== variant.presetWorld.fixtureId) return ["native_scenario_variant_binding_missing_or_drifted"];
  const context = nativeScenarioContext(result, contract.latestTick);
  if (context.failures.length) return context.failures;
  if (id.startsWith("SCOUT-") || id === "H-22") return evaluateNativeScouting(id, branch, context);
  const failures = nativeScoutingFairness(context);
  if (id.startsWith("STRAT-")) failures.push(...evaluateNativeStrategy(id, branch, context));
  else if (id.startsWith("FIGHT-") || id === "RAID-01") failures.push(...evaluateNativeCombat(id, branch, context));
  else if (id.startsWith("PLACE-")) failures.push(...evaluateNativePlacement(id, branch, context, variant.presetWorld));
  else if (id.startsWith("WALL-") || ["H-27", "H-28"].includes(id))
    failures.push(...evaluateNativeFortification(id, branch, context, variant.presetWorld));
  else if (id === "EXP-01") failures.push(...evaluateExpansionWorld(branch === "served" ? "served" : "expand",
    result, result.opponentCapture, contract.latestTick));
  else failures.push("native_scenario_oracle_missing");
  return [...new Set(failures)];
}
