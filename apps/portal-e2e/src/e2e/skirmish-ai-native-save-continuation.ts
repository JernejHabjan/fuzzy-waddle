import type { Page } from "@playwright/test";
import { digestCanonicalAiValue } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";
import { reloadNativeMatch, type saveNativeMatch } from "./skirmish-ai-native-save-reload";
import { armNativeDecisionTrace, closeNativeDecisionTrace } from "./skirmish-ai-native-decision-trace";
import { captureNativeContinuationBoundary } from "./skirmish-ai-native-continuation-boundary";
import { advanceRuntimeFrames } from "./skirmish-ai-runtime-frame-driver";
import { captureNativeDebugWorldProjection } from "./skirmish-ai-native-debug-comparison";
import { nativeDebugProjectionDifferences } from "./skirmish-ai-native-world-projection-diff";
import type { NativeSaveProof } from "./skirmish-ai-native-save-proof";

/** Rewind only after the untouched original continuation has been sealed; replay actual frames from the real save. */
export async function replayNativeSavedContinuation(
  page: Page, playerNumber: number, branch: string, sourceRevision: string, fixtureDigest: string,
  save: Awaited<ReturnType<typeof saveNativeMatch>>,
  saved: Awaited<ReturnType<typeof captureNativeContinuationBoundary>>,
  premises: NativeSaveProof["premises"], resumedSimulationTimeScale = 1, savedWorldProjection?: unknown
): Promise<NativeSaveProof> {
  const control = await captureNativeContinuationBoundary(page, playerNumber);
  const controlTrace = await closeNativeDecisionTrace(page);
  const reloaded = await reloadNativeMatch(page, playerNumber, save);
  const restored = await captureNativeContinuationBoundary(page, playerNumber);
  const restoredWorldProjection = await captureNativeDebugWorldProjection(page);
  const restoreWorldDifferences = savedWorldProjection === undefined ? [] :
    nativeDebugProjectionDifferences(savedWorldProjection, restoredWorldProjection);
  await armNativeDecisionTrace(page, playerNumber);
  await advanceRuntimeFrames(page, playerNumber, control.owner.tick, resumedSimulationTimeScale);
  await page.waitForFunction((playerNumber) =>
    window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber)?.controller.isDecisionBoundarySettled(), playerNumber);
  const resumed = await captureNativeContinuationBoundary(page, playerNumber);
  const resumedTrace = await closeNativeDecisionTrace(page);
  let firstTraceDifference: NativeSaveProof["firstTraceDifference"] = null;
  for (let index = 0; index < Math.max(controlTrace.records.length, resumedTrace.records.length); index++) {
    const left = controlTrace.records[index] ?? null, right = resumedTrace.records[index] ?? null;
    if (digestCanonicalAiValue(left) !== digestCanonicalAiValue(right)) {
      firstTraceDifference = { index, control: left, resumed: right };
      break;
    }
  }
  const firstTraceInputDifferences = controlTrace.firstInput && resumedTrace.firstInput ?
    nativeDebugProjectionDifferences(controlTrace.firstInput, resumedTrace.firstInput, 80) : [];
  return { sourceRevision, fixtureDigest, branch, premises, sameRealm: reloaded.sameRealm, saveId: reloaded.saveId,
    saveRevision: reloaded.revision, resumedSimulationTimeScale, saved, restored, control, resumed,
    controlTraceCount: controlTrace.records.length, resumedTraceCount: resumedTrace.records.length,
    controlTraceDigest: digestCanonicalAiValue(controlTrace.records), resumedTraceDigest: digestCanonicalAiValue(resumedTrace.records),
    traceOverflow: controlTrace.overflow || resumedTrace.overflow, restoreWorldDifferences, firstTraceInputDifferences,
    firstTraceDifference };
}
