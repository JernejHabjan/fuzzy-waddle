import type { Page } from "@playwright/test";
import { digestCanonicalAiValue } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";
import { nativeDebugWorldDigest } from "./skirmish-ai-native-debug-comparison";
import { readNativeSceneOwnership } from "./skirmish-ai-native-scene-ownership";

/** Full private state is reduced locally. Only bounded identity, phase counts and deterministic digests enter reports. */
export async function captureNativeContinuationBoundary(page: Page, playerNumber: number) {
  const owner = await readNativeSceneOwnership(page, playerNumber);
  const capture = await page.evaluate((playerNumber) => {
    const controller = window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber)?.controller;
    const brain = controller?.getBrainState(), saved = controller?.getSaveState();
    if (!brain || !saved?.controllerCadence) throw new Error("native_continuation_state_or_cadence_missing");
    return { brain, cadence: saved.controllerCadence };
  }, playerNumber);
  const brain = capture.brain;
  return { owner, worldDigest: await nativeDebugWorldDigest(page), brainDigest: digestCanonicalAiValue(brain),
    profileVersion: brain.profileVersion, profileDifficulty: brain.profileDifficulty ?? null,
    cadenceDigest: digestCanonicalAiValue(capture.cadence), elapsedMilliseconds: capture.cadence.elapsedMilliseconds,
    recoveryDigest: digestCanonicalAiValue(brain.recovery), recoveryCount: brain.recovery.records.length,
    retryDebt: brain.recovery.records.reduce((total, record) => total + record.attempt, 0),
    oldestFailureTick: brain.recovery.records.length ? Math.min(...brain.recovery.records.map((record) => record.enteredTick)) : null,
    reservationsDigest: digestCanonicalAiValue(brain.reservations), reservationCount: brain.reservations.length,
    pendingOutcomeCount: brain.pendingOutcomes.length, pendingCommandCount: brain.authority.pendingCommandIds.length,
    authorityDigest: digestCanonicalAiValue(brain.authority) };
}
