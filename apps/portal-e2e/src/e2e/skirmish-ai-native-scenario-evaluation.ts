import { evaluateNativeBundles } from "./skirmish-ai-native-bundle-evaluation";
import { evaluateNativeScarceRecovery } from "./skirmish-ai-native-scarce-recovery-evaluation";
import { evaluateNativeFault } from "./skirmish-ai-native-fault-evaluation";
import { evaluateNativeDifficulty } from "./skirmish-ai-native-difficulty-evaluation";
import { evaluateNativeDifficultyFairness } from "./skirmish-ai-native-difficulty-fairness";
import { evaluateNativeEasyContinuity } from "./skirmish-ai-native-easy-continuity";
import { evaluateNativeChurn } from "./skirmish-ai-native-churn-evaluation";
import { evaluateNativeDifficultyPressure } from "./skirmish-ai-native-difficulty-pressure";
import { evaluateNativeEconomySequence, evaluateNativeSupplySequence } from "./skirmish-ai-native-economy-sequences";
import { evaluateNativeFortificationSequence, evaluateNativeAdaptationSequence } from "./skirmish-ai-native-combat-sequences";
import { evaluateNativeDebugComparison } from "./skirmish-ai-native-debug-comparison-evaluation";
import { evaluateNativeOptionalRelease } from "./skirmish-ai-native-optional-release";
import { evaluateNativeDebugParity } from "./skirmish-ai-native-debug-parity-evaluation";
import { evaluateNativeIslandEstablishment } from "./skirmish-ai-native-island-establishment";
import bindings from "../../../../tools/ai/native-scenario-bindings.json";
import type { RuntimeAssertionV1 } from "./skirmish-ai-runtime-assertion";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeLifecycleProofFailures } from "./skirmish-ai-native-lifecycle-evaluation";
import { nativeImportProofFailures } from "./skirmish-ai-native-import-evaluation";
import { nativeSaveProofFailures } from "./skirmish-ai-native-save-evaluation";
import { nativeProfileTransferFailures } from "./skirmish-ai-native-profile-transfer-evaluation";
import { evaluateNativeLateAuthority } from "./skirmish-ai-native-late-authority";
import { evaluateNativeRetention } from "./skirmish-ai-native-retention-evaluation";
import { nativeSequenceProofFailures } from "./skirmish-ai-native-sequence-evaluation";
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
  if (id === "SEQ-08") {
    if (!contract || contract.schemaVersion !== 1 || contract.scenarioId !== id || contract.latestTick !== 18000 ||
        !branch || !definition.branches.includes(branch) || !variant?.presetWorld || variant.evidenceStop ||
        !fixture?.recipe.requiresMultiplayer || result.presetFixtureId !== variant.presetWorld.fixtureId)
      return ["native_sequence_source_binding_missing_or_drifted"];
    return nativeSequenceProofFailures(branch, result, variant.difficulty);
  }
  if (id === "D-02") {
    if (!contract || contract.schemaVersion !== 1 || contract.scenarioId !== id || contract.latestTick !== 4000 ||
        !branch || !definition.branches.includes(branch) || !variant?.presetWorld || variant.evidenceStop ||
        !fixture?.recipe.requiresMultiplayer || result.presetFixtureId !== variant.presetWorld.fixtureId)
      return ["native_profile_source_binding_missing_or_drifted"];
    const pending = branch.endsWith("pending_plan");
    const saveTick = pending ? 199 : { Easy: 39, Normal: 19, Hard: 9 }[variant.difficulty];
    const failures = nativeSaveProofFailures(pending ? "applied_pending" : "before_apply", result.nativeSave, saveTick);
    const expectedDifficulty = { Easy: 0, Normal: 1, Hard: 2 }[variant.difficulty];
    if (!result.nativeSave || result.nativeSave.saved.profileDifficulty !== expectedDifficulty ||
        result.nativeSave.sourceRevision !== result.productionPreset?.sourceRevision ||
        result.nativeSave.fixtureDigest !== result.productionPreset?.fixtureDigest)
      failures.push("native_profile_save_configuration_or_source_drifted");
    if (branch.endsWith("host_transfer"))
      failures.push(...nativeProfileTransferFailures(variant.difficulty, result.nativeProfileTransfer));
    if (result.aiErrors.length) failures.push("native_profile_save_ai_errors");
    return failures;
  }
  if (id === "H-31") {
    if (!contract || contract.schemaVersion !== 1 || contract.scenarioId !== id || contract.latestTick !== 4000 ||
        !branch || !definition.branches.includes(branch) || !variant?.presetWorld || variant.evidenceStop ||
        fixture?.recipe.requiresMultiplayer || result.presetFixtureId !== variant.presetWorld.fixtureId)
      return ["native_save_source_binding_missing_or_drifted"];
    const failures = nativeSaveProofFailures(branch, result.nativeSave);
    if (result.nativeSave?.sourceRevision !== result.productionPreset?.sourceRevision ||
        result.nativeSave?.fixtureDigest !== result.productionPreset?.fixtureDigest)
      failures.push("native_save_capture_provenance_drifted_from_actual_setup");
    if (result.aiErrors.length) failures.push("native_save_original_match_ai_errors");
    return failures;
  }
  if (id === "DBG-05") {
    if (!contract || contract.schemaVersion !== 1 || contract.scenarioId !== id || contract.latestTick !== 2000 ||
        !branch || !definition.branches.includes(branch) || !variant?.presetWorld || variant.evidenceStop ||
        !fixture?.recipe.requiresMultiplayer || result.presetFixtureId !== variant.presetWorld.fixtureId)
      return ["native_import_source_binding_missing_or_drifted"];
    const failures = nativeImportProofFailures(branch, result.nativeImport);
    if (result.nativeImport?.sourceRevision !== result.productionPreset?.sourceRevision ||
        result.nativeImport?.fixtureDigest !== result.productionPreset?.fixtureDigest)
      failures.push("native_import_capture_provenance_drifted_from_actual_setup");
    if (result.aiErrors.length) failures.push("native_import_world_ai_errors");
    return failures;
  }
  if (id === "H-32") {
    if (!contract || contract.schemaVersion !== 1 || contract.scenarioId !== id || contract.latestTick !== 4000 ||
        !branch || !definition.branches.includes(branch) || !variant || !fixture?.recipe.requiresMultiplayer ||
        variant.evidenceStop || (branch === "host_replacement" ?
          !!variant.presetWorld || !variant.nextMatchPresetWorld || result.presetFixtureId !== null :
          !variant.presetWorld || result.presetFixtureId !== variant.presetWorld.fixtureId))
      return ["native_lifecycle_source_binding_missing_or_drifted"];
    const failures = nativeLifecycleProofFailures(branch, result.nativeLifecycle);
    if (result.aiErrors.length) failures.push("native_lifecycle_original_match_ai_errors");
    return failures;
  }
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
  if (id === "H-05") failures.push(...evaluateNativeOptionalRelease(branch, context));
  else if (id === "H-08") failures.push(...evaluateNativeLateAuthority(branch, context));
  else if (id === "H-09") failures.push(...evaluateNativeRetention(branch, context));
  else if (id === "H-23") failures.push(...evaluateNativeIslandEstablishment(branch, context));
  else if (id === "D-01") failures.push(...evaluateNativeDifficulty(branch, context));
  else if (id === "D-03") failures.push(...evaluateNativeDifficultyFairness(branch, context));
  else if (id === "D-04") failures.push(...evaluateNativeEasyContinuity(context));
  else if (id === "H-20") failures.push(...evaluateNativeChurn(branch, context));
  else if (id === "D-05") failures.push(...evaluateNativeDifficultyPressure(branch, context));
  else if (id === "SEQ-03") failures.push(...evaluateNativeEconomySequence(branch, context));
  else if (id === "SEQ-04") failures.push(...evaluateNativeSupplySequence(branch, context));
  else if (id === "SEQ-06") failures.push(...evaluateNativeFortificationSequence(branch, context, variant.presetWorld));
  else if (id === "SEQ-07") failures.push(...evaluateNativeAdaptationSequence(branch, context));
  else if (id === "DBG-04") failures.push(...evaluateNativeDebugComparison(branch, context.result.nativeDebugComparison,
    context.result.productionPreset?.sourceRevision));
  else if (id === "DBG-06") failures.push(...evaluateNativeDebugParity(context));
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
