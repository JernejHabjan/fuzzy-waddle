import { evaluateNativeBundles } from "./skirmish-ai-native-bundle-evaluation";
import { evaluateNativeScarceRecovery } from "./skirmish-ai-native-scarce-recovery-evaluation";
import { evaluateNativeFault } from "./skirmish-ai-native-fault-evaluation";
import { evaluateNativeDifficulty } from "./skirmish-ai-native-difficulty-evaluation";
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
import { evaluateNativeDomain } from "./skirmish-ai-native-domain-evaluation";
import { evaluateNativeClassic } from "./skirmish-ai-native-classic-evaluation";
import { evaluateNativeRecovery } from "./skirmish-ai-native-recovery-evaluation";
import { evaluateNativeAuthority } from "./skirmish-ai-native-authority-evaluation";
import { evaluateNativeResourcePriority } from "./skirmish-ai-native-resource-priority-evaluation";
import { evaluateNativeRaidStrategy, evaluateNativeComeback, evaluateNativeFinish } from "./skirmish-ai-native-raid-strategy-evaluation";

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
  const extraPlayers = variant?.additionalAiPlayers ?? [];
  if (!contract || contract.schemaVersion !== 1 || contract.scenarioId !== id ||
      contract.latestTick !== definition.latestTick || contract.humanPlayerNumber !== 1 ||
      !branch || !definition.branches.includes(branch) || !variant?.presetWorld ||
      variant.captureConstruction !== true || variant.captureCombat !== true || variant.evidenceStop ||
      result.presetFixtureId !== variant.presetWorld.fixtureId ||
      extraPlayers.length !== (result.otherOpponentCaptures?.length ?? 0) ||
      extraPlayers.some((player) => result.otherOpponentCaptures?.filter((capture) =>
        capture.playerNumber === player.playerNumber).length !== 1)) return ["native_scenario_variant_binding_missing_or_drifted"];
  const win = id === "STRAT-08" ? result.checkpoints.find((checkpoint) => checkpoint.gameResult === "win") : undefined;
  const sealed = result.productionCapture?.frontiers?.closedThroughTick;
  const terminalPrefix = win && sealed !== undefined && sealed >= win.tick && sealed <= contract.latestTick ? sealed : undefined;
  if (id === "STRAT-08" && terminalPrefix === undefined) return ["native_finish_has_no_sealed_authoritative_win_prefix"];
  const context = nativeScenarioContext(result, terminalPrefix ?? contract.latestTick,
    terminalPrefix !== undefined ? contract.latestTick : undefined);
  if (context.failures.length) return context.failures;
  if (id.startsWith("SCOUT-") || id === "H-22") return evaluateNativeScouting(id, branch, context);
  const failures = nativeScoutingFairness(context);
  if (id === "D-01") failures.push(...evaluateNativeDifficulty(branch, context));
  else if (id === "H-11") failures.push(...evaluateNativeScarceRecovery(branch, context));
  else if (id === "H-12") failures.push(...evaluateNativeBundles(branch, context));
  else if (id === "H-30") failures.push(...evaluateNativeFault(branch, context));
  else if (["H-06", "H-07", "H-10"].includes(id)) failures.push(...evaluateNativeAuthority(id, branch, context));
  else if (["H-13", "H-14", "H-15"].includes(id)) failures.push(...evaluateNativeResourcePriority(id, branch, context));
  else if (["H-01", "H-02", "H-03", "H-04", "H-19", "H-24", "H-25", "H-26"].includes(id))
    failures.push(...evaluateNativeRecovery(id, branch, context));
  else if (["STRAT-02", "STRAT-03", "RAID-03"].includes(id)) failures.push(...evaluateNativeRaidStrategy(id, branch, context));
  else if (id === "STRAT-08") failures.push(...evaluateNativeFinish(branch, context));
  else if (id === "STRAT-09") failures.push(...evaluateNativeComeback(branch, context));
  else if (id.startsWith("DOMAIN-")) failures.push(...evaluateNativeDomain(id, branch, context));
  else if (id.startsWith("C-")) failures.push(...evaluateNativeClassic(id, branch, context));
  else if (id.startsWith("STRAT-")) failures.push(...evaluateNativeStrategy(id, branch, context));
  else if (id.startsWith("FIGHT-") || id === "RAID-01") failures.push(...evaluateNativeCombat(id, branch, context));
  else if (id.startsWith("PLACE-")) failures.push(...evaluateNativePlacement(id, branch, context, variant.presetWorld));
  else if (id.startsWith("WALL-") || ["H-27", "H-28"].includes(id))
    failures.push(...evaluateNativeFortification(id, branch, context, variant.presetWorld));
  else if (id === "EXP-01") failures.push(...evaluateExpansionWorld(branch === "served" ? "served" : "expand",
    result, result.opponentCapture, contract.latestTick));
  else failures.push("native_scenario_oracle_missing");
  return [...new Set(failures)];
}
