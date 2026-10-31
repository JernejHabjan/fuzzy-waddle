import type { Page } from "@playwright/test";
import { STANDARD_METRICS } from "@fuzzy-waddle/probable-waffle-protocol";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeRequestV1 } from "./skirmish-ai-runtime-request";
import { captureNativeContinuationBoundary } from "./skirmish-ai-native-continuation-boundary";
import { advanceRuntimeFrames } from "./skirmish-ai-runtime-frame-driver";
import { retainNativeSceneWork } from "./skirmish-ai-native-retained-work";
import { transitionNativeLifecycle } from "./skirmish-ai-native-lifecycle-transition";
import { multiplayerAuthorityProbe } from "./skirmish-ai-multiplayer-authority-probe";

/** Keep the original restored/promoted scene until its actual result, then reuse its original realm for the next match. */
export async function runNativeSequenceTail(
  page: Page, playerNumber: number, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1,
  request: RuntimeRequestV1, multiplayer: boolean
) {
  const entry = await captureNativeContinuationBoundary(page, playerNumber);
  await retainNativeSceneWork(page, playerNumber, false);
  if (multiplayer) await multiplayerAuthorityProbe(page, "retain");
  await advanceRuntimeFrames(page, playerNumber, 18000, 1, true);
  await page.waitForFunction((number) =>
    window.__fuzzyWaddleAiRuntimePartsV1?.(number)?.controller.isDecisionBoundarySettled(), playerNumber);
  const terminal = await captureNativeContinuationBoundary(page, playerNumber);
  const score = await readNativeSequenceScore(page, playerNumber);
  if (!["win", "loss", "tie"].includes(score.result ?? "")) throw new Error("native_sequence_authoritative_finish_missing");
  const lifecycle = await transitionNativeLifecycle(page, fixture, variant, multiplayer ? "host_replacement" : "normal",
    playerNumber, request.sourceRevision, request.fixtureDigest);
  return { entry, terminal, score, lifecycle };
}

export async function readNativeSequenceScore(page: Page, playerNumber: number) {
  return page.evaluate(({ number, metrics }) => {
    const parts = window.__fuzzyWaddleAiRuntimePartsV1?.(number);
    if (!parts) throw new Error("native_sequence_terminal_owner_missing");
    const score = parts.getScore(number);
    return { result: score.gameResult, deliveredResources: metrics.resources.reduce((total, key) =>
      total + (score.metrics[key] ?? 0), 0), damageDealt: score.metrics[metrics.damage] ?? 0,
      produced: score.metrics[metrics.produced] ?? 0 };
  }, { number: playerNumber, metrics: { resources: [STANDARD_METRICS.RESOURCES_COLLECTED_WOOD,
    STANDARD_METRICS.RESOURCES_COLLECTED_STONE, STANDARD_METRICS.RESOURCES_COLLECTED_MINERALS],
    damage: STANDARD_METRICS.DAMAGE_DEALT, produced: STANDARD_METRICS.UNITS_PRODUCED } });
}
