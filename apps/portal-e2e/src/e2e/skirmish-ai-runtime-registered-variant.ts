import type { Browser } from "@playwright/test";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeRequestV1 } from "./skirmish-ai-runtime-request";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { captureRuntimeHumanAuthority } from "./skirmish-ai-runtime-human-capture";
import { captureRuntimeProductionAuthority } from "./skirmish-ai-runtime-production-capture";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import { captureNativeDisposal } from "./skirmish-ai-native-disposal";
import type { NativeDisposalEvidence } from "./skirmish-ai-native-disposal-evidence";
import { armNativeDebugComparison, captureNativeDebugComparison } from "./skirmish-ai-native-debug-comparison";
import type { NativeDebugComparisonProof } from "./skirmish-ai-native-debug-comparison-proof";
import { armNativeDebugParity, captureNativeDebugParity } from "./skirmish-ai-native-debug-parity";
import type { NativeDebugParityProof } from "./skirmish-ai-native-debug-parity-proof";
import { exerciseDebug } from "./skirmish-ai-debug-panel-exercise";
import { runNativeLifecycleVariant } from "./skirmish-ai-native-lifecycle-runner";
import { runNativeImportVariant } from "./skirmish-ai-native-import-runner";
import { runNativeSaveVariant } from "./skirmish-ai-native-save-runner";
import { runNativeProfileVariant } from "./skirmish-ai-native-profile-runner";
import { runNativeProfileTransfer } from "./skirmish-ai-native-profile-transfer";
import { cancelNativeOriginalProduction } from "./skirmish-ai-native-cancel-original-production";
import { runNativeRetentionVariant } from "./skirmish-ai-native-retention-runner";
import { runNativeSequenceVariant } from "./skirmish-ai-native-sequence-runner";

/** The existing runner owns the match. Bound cases additionally arm/read the same observer for the real human opponent. */
export async function runRegisteredRuntimeVariant(
  browser: Browser, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1, request: RuntimeRequestV1
) {
  const sequenceBranch = fixture.assertions["SEQ-08"]?.requiredNativeScenario?.branchByVariant[variant.id];
  if (request.scenarioIds.includes("SEQ-08") && sequenceBranch)
    return runNativeSequenceVariant(browser, fixture, variant, request, sequenceBranch);
  const retentionBranch = fixture.assertions["H-09"]?.requiredNativeScenario?.branchByVariant[variant.id];
  if (request.scenarioIds.includes("H-09") && retentionBranch)
    return runNativeRetentionVariant(browser, fixture, variant, request, retentionBranch);
  const profileBranch = fixture.assertions["D-02"]?.requiredNativeScenario?.branchByVariant[variant.id];
  if (request.scenarioIds.includes("D-02") && profileBranch)
    return runNativeProfileVariant(browser, fixture, variant, request, profileBranch);
  const saveBranch = fixture.assertions["H-31"]?.requiredNativeScenario?.branchByVariant[variant.id];
  if (request.scenarioIds.includes("H-31") && saveBranch)
    return runNativeSaveVariant(browser, fixture, variant, request, saveBranch);
  const lifecycleBranch = fixture.assertions["H-32"]?.requiredNativeScenario?.branchByVariant[variant.id];
  if (request.scenarioIds.includes("H-32") && lifecycleBranch)
    return runNativeLifecycleVariant(browser, fixture, variant, request, lifecycleBranch);
  const importBranch = fixture.assertions["DBG-05"]?.requiredNativeScenario?.branchByVariant[variant.id];
  if (request.scenarioIds.includes("DBG-05") && importBranch)
    return runNativeImportVariant(browser, fixture, variant, request, importBranch);
  const contract = (request.scenarioIds.includes("EXP-02") ? fixture.assertions["EXP-02"]?.requiredExpansionPressure : undefined) ??
    request.scenarioIds.map((id) => fixture.assertions[id]?.requiredNativeScenario).find((binding) => binding !== undefined);
  let opponentCapture: AiRuntimeProductionCaptureV1 | undefined;
  let otherOpponentCaptures: AiRuntimeProductionCaptureV1[] | undefined;
  let nativeDisposal: NativeDisposalEvidence | undefined;
  let nativeDebugComparison: NativeDebugComparisonProof | undefined;
  let nativeDebugParity: NativeDebugParityProof | undefined;
  let nativeCancellation: Awaited<ReturnType<typeof cancelNativeOriginalProduction>> | undefined;
  let nativeProfileTransfer: Awaited<ReturnType<typeof runNativeProfileTransfer>> | undefined;
  const lateBranch = fixture.assertions["H-08"]?.requiredNativeScenario?.branchByVariant[variant.id];
  const debugBranch = fixture.assertions["DBG-04"]?.requiredNativeScenario?.branchByVariant[variant.id];
  const parityBranch = fixture.assertions["DBG-06"]?.requiredNativeScenario?.branchByVariant[variant.id];
  const result = await runVariant(browser, fixture, variant, request.seed, request.scenarioIds,
    request.sourceRevision, request.fixtureDigest, contract ? async (page, index, checkpoint?: RuntimeCheckpointV1) => {
      if (index === -1) {
        if (debugBranch) await armNativeDebugComparison(page);
        if (parityBranch) await armNativeDebugParity(page, request.sourceRevision, request.dirtySourceDigest);
        await captureRuntimeHumanAuthority(page, contract.humanPlayerNumber, contract.latestTick);
        for (const player of variant.additionalAiPlayers ?? [])
          await captureRuntimeProductionAuthority(page, player.playerNumber, contract.latestTick, true);
      }
      if (parityBranch) await exerciseDebug(page,
        parityBranch === "shown" ? "shown" : parityBranch === "filtered" ? "filtered" :
        parityBranch === "exporting" ? "exported" : "hidden", index, parityBranch === "shown");
      if (index === 0 && debugBranch) nativeDebugComparison = await captureNativeDebugComparison(
        page, debugBranch, request.sourceRevision, request.dirtySourceDigest);
      if (lateBranch === "cancellation_race" && checkpoint?.tick === 199)
        nativeCancellation = await cancelNativeOriginalProduction(page, fixture.recipe.aiPlayerNumber);
      if (index === (variant.checkpointTicks ?? fixture.recipe.checkpointTicks).length - 1 ||
          checkpoint?.gameResult === "win" && request.scenarioIds.some((id) => fixture.assertions[id]?.requireAiVictory)) {
        opponentCapture = await captureRuntimeHumanAuthority(page, contract.humanPlayerNumber);
        otherOpponentCaptures = await Promise.all((variant.additionalAiPlayers ?? []).map((player) =>
          captureRuntimeProductionAuthority(page, player.playerNumber, undefined, true)));
        if (fixture.assertions["H-20"]?.requiredNativeScenario?.branchByVariant[variant.id] === "dispose")
          nativeDisposal = await captureNativeDisposal(page);
        if (parityBranch) ({ nativeDisposal, nativeDebugParity } = await captureNativeDebugParity(page));
      }
    } : undefined, lateBranch?.startsWith("host_") ? async () => {
      nativeProfileTransfer = await runNativeProfileTransfer(browser, { seed: request.seed ?? variant.seed,
        aiFaction: variant.aiFaction, aiDifficulty: variant.difficulty,
        lateDeliveryOrder: lateBranch === "host_command_then_receipt" ? "command_then_receipt" : "receipt_then_command" });
    } : undefined
  );
  return contract ? { ...result, opponentCapture, ...(nativeDisposal ? { nativeDisposal } : {}),
    ...(nativeDebugComparison ? { nativeDebugComparison } : {}),
    ...(nativeDebugParity ? { nativeDebugParity } : {}),
    ...(nativeCancellation ? { nativeCancellation } : {}), ...(nativeProfileTransfer ? { nativeProfileTransfer } : {}),
    ...(otherOpponentCaptures?.length ? { otherOpponentCaptures } : {}) } : result;
}
