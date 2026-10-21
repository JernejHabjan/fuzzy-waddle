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

/** The existing runner owns the match. Bound cases additionally arm/read the same observer for the real human opponent. */
export async function runRegisteredRuntimeVariant(
  browser: Browser, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1, request: RuntimeRequestV1
) {
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
      if (index === (variant.checkpointTicks ?? fixture.recipe.checkpointTicks).length - 1 ||
          checkpoint?.gameResult === "win" && request.scenarioIds.some((id) => fixture.assertions[id]?.requireAiVictory)) {
        opponentCapture = await captureRuntimeHumanAuthority(page, contract.humanPlayerNumber);
        otherOpponentCaptures = await Promise.all((variant.additionalAiPlayers ?? []).map((player) =>
          captureRuntimeProductionAuthority(page, player.playerNumber, undefined, true)));
        if (fixture.assertions["H-20"]?.requiredNativeScenario?.branchByVariant[variant.id] === "dispose")
          nativeDisposal = await captureNativeDisposal(page);
        if (parityBranch) ({ nativeDisposal, nativeDebugParity } = await captureNativeDebugParity(page));
      }
    } : undefined
  );
  return contract ? { ...result, opponentCapture, ...(nativeDisposal ? { nativeDisposal } : {}),
    ...(nativeDebugComparison ? { nativeDebugComparison } : {}),
    ...(nativeDebugParity ? { nativeDebugParity } : {}),
    ...(otherOpponentCaptures?.length ? { otherOpponentCaptures } : {}) } : result;
}
