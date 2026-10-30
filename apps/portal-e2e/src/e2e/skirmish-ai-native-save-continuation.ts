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
import { captureRuntimeProductionAuthority } from "./skirmish-ai-runtime-production-capture";
import {
  armNativeSaveRandomTrace,
  closeNativeSaveRandomTrace,
  captureNativeSaveNavigationDiagnostics,
  type NativeSaveNavigationDiagnostics
} from "./skirmish-ai-native-save-navigation-diagnostics";

/** Rewind only after the untouched original continuation has been sealed; replay actual frames from the real save. */
export async function replayNativeSavedContinuation(
  page: Page, playerNumber: number, branch: string, sourceRevision: string, fixtureDigest: string,
  save: Awaited<ReturnType<typeof saveNativeMatch>>,
  saved: Awaited<ReturnType<typeof captureNativeContinuationBoundary>>,
  premises: NativeSaveProof["premises"], resumedSimulationTimeScale = 1, savedWorldProjection?: unknown,
  savedNavigationDiagnostics?: NativeSaveNavigationDiagnostics
): Promise<NativeSaveProof> {
  const control = await captureNativeContinuationBoundary(page, playerNumber);
  const controlTrace = await closeNativeDecisionTrace(page);
  await armNativeSaveRandomTrace(page);
  const reloaded = await reloadNativeMatch(page, playerNumber, save);
  const randomCalls = await closeNativeSaveRandomTrace(page);
  const restored = await captureNativeContinuationBoundary(page, playerNumber);
  const restoredNavigationDiagnostics = await captureNativeSaveNavigationDiagnostics(page);
  const navigationChangedCells = savedNavigationDiagnostics
    ? savedNavigationDiagnostics.terrainGrid.flatMap((row, y) =>
        row.flatMap((terrainBefore, x) => {
          const terrainAfter = restoredNavigationDiagnostics.terrainGrid[y]?.[x];
          const objectBefore = savedNavigationDiagnostics.objectGrid[y]?.[x] ?? null;
          const objectAfter = restoredNavigationDiagnostics.objectGrid[y]?.[x] ?? null;
          const navigationBefore = savedNavigationDiagnostics.navigationGrid[y]?.[x];
          const navigationAfter = restoredNavigationDiagnostics.navigationGrid[y]?.[x];
          if (terrainAfter === undefined || navigationBefore === undefined || navigationAfter === undefined) return [];
          if (
            terrainBefore === terrainAfter &&
            objectBefore === objectAfter &&
            navigationBefore === navigationAfter
          ) return [];
          return [{ x, y, terrainBefore, terrainAfter, objectBefore, objectAfter, navigationBefore, navigationAfter }];
        })
      ).slice(0, 50)
    : [];
  const changedCellKeys = new Set(navigationChangedCells.map((cell) => `${cell.x},${cell.y}`));
  const affectedColliders = (diagnostics: NativeSaveNavigationDiagnostics) =>
    diagnostics.colliderFootprints.filter((actor) => actor.tiles.some((tile) => changedCellKeys.has(`${tile.x},${tile.y}`)));
  const navigationSummary = (diagnostics: NativeSaveNavigationDiagnostics) => ({
    randomOperationCount: diagnostics.randomOperationCount,
    randomDigest: diagnostics.randomDigest,
    terrainDigest: diagnostics.terrainDigest,
    objectGridDigest: diagnostics.objectGridDigest,
    navigationGridDigest: diagnostics.navigationGridDigest,
    navigationEdgeCount: diagnostics.navigationEdgeCount
  });
  const restoredWorldProjection = await captureNativeDebugWorldProjection(page);
  const restoreWorldDifferences = savedWorldProjection === undefined ? [] :
    nativeDebugProjectionDifferences(savedWorldProjection, restoredWorldProjection);
  await armNativeDecisionTrace(page, playerNumber);
  await advanceRuntimeFrames(page, playerNumber, control.owner.tick, resumedSimulationTimeScale);
  await page.waitForFunction((playerNumber) =>
    window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber)?.controller.isDecisionBoundarySettled(), playerNumber);
  const resumed = await captureNativeContinuationBoundary(page, playerNumber);
  const resumedTrace = await closeNativeDecisionTrace(page);
  const resumedProduction = await captureRuntimeProductionAuthority(page, playerNumber, resumed.owner.tick, true);
  const resumedFacts = resumedProduction.facts.filter((fact) => fact.tick > saved.owner.tick);
  const resumedUsefulWork = {
    tick: resumed.owner.tick,
    advancedQueueAttempts: resumedFacts.filter((fact) =>
      fact.kind === "queue_progress" && fact.progress.phase === "advanced" && fact.progress.deltaMs > 0 &&
      !fact.progress.snapshotRestoreInProgress
    ).length,
    completedQueueItems: resumedFacts.filter((fact) =>
      fact.kind === "queue_completion" && fact.completion.phase === "after" &&
      (fact.completion.createdActor !== null || fact.completion.researchRegistered === true) &&
      !fact.completion.snapshotRestoreInProgress
    ).length,
    nativeDamageEvents: resumedFacts.filter((fact) =>
      fact.kind === "native_damage" && fact.damage.amount > 0 && fact.damage.sceneActive &&
      !fact.damage.snapshotRestoreInProgress
    ).length
  };
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
  const divergentIndex = firstTraceDifference?.index;
  const firstDivergentTraceInputDifferences = divergentIndex !== undefined &&
    controlTrace.retainedInputs[divergentIndex] && resumedTrace.retainedInputs[divergentIndex]
    ? nativeDebugProjectionDifferences(
        controlTrace.retainedInputs[divergentIndex], resumedTrace.retainedInputs[divergentIndex], 120
      )
    : [];
  const divergentActorIndexes = [...new Set(firstDivergentTraceInputDifferences.flatMap(({ path }) => {
    const match = /^\$world\.observation\.actors\[(\d+)\]/.exec(path);
    return match ? [Number(match[1])] : [];
  }))].sort((left, right) => left - right);
  const firstDivergentActors = divergentIndex === undefined
    ? []
    : divergentActorIndexes.flatMap((index) => {
        const controlActor = controlTrace.retainedInputs[divergentIndex]?.observation.actors[index];
        const resumedActor = resumedTrace.retainedInputs[divergentIndex]?.observation.actors[index];
        if (!controlActor || !resumedActor) return [];
        const summarizeActor = (actor: typeof controlActor) => ({
          actorId: String(actor.actorId),
          objectName: actor.objectName,
          owner: actor.owner,
          position: actor.logicalPosition,
          healthPermille: actor.healthPermille,
          combatProfile: actor.combatProfile
        });
        return [{ index, control: summarizeActor(controlActor), resumed: summarizeActor(resumedActor) }];
      });
  return { sourceRevision, fixtureDigest, branch, premises, sameRealm: reloaded.sameRealm, saveId: reloaded.saveId,
    saveRevision: reloaded.revision, resumedSimulationTimeScale, saved, restored, control, resumed,
    controlTraceCount: controlTrace.records.length, resumedTraceCount: resumedTrace.records.length,
    controlTraceDigest: digestCanonicalAiValue(controlTrace.records), resumedTraceDigest: digestCanonicalAiValue(resumedTrace.records),
    traceOverflow: controlTrace.overflow || resumedTrace.overflow, restoreWorldDifferences, firstTraceInputDifferences,
    firstTraceDifference, firstDivergentTraceInputDifferences, firstDivergentActors, resumedUsefulWork,
    ...(savedNavigationDiagnostics
      ? {
          navigationDiagnostics: {
            saved: navigationSummary(savedNavigationDiagnostics),
            restored: navigationSummary(restoredNavigationDiagnostics),
            changedCells: navigationChangedCells,
            randomCalls,
            affectedColliders: {
              saved: affectedColliders(savedNavigationDiagnostics),
              restored: affectedColliders(restoredNavigationDiagnostics)
            }
          }
        }
      : {}) };
}
