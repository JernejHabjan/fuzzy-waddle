import type { Browser, Page } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeRequestV1 } from "./skirmish-ai-runtime-request";
import type { NativeSaveProof } from "./skirmish-ai-native-save-proof";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { saveNativeMatch } from "./skirmish-ai-native-save-reload";
import { captureNativeContinuationBoundary } from "./skirmish-ai-native-continuation-boundary";
import { armNativeDecisionTrace } from "./skirmish-ai-native-decision-trace";
import { replayNativeSavedContinuation } from "./skirmish-ai-native-save-continuation";
import { captureRuntimeProductionAuthority } from "./skirmish-ai-runtime-production-capture";
import { nativeSavePremises } from "./skirmish-ai-native-save-premises";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";

/** Seal the original autonomous SP interval, rewind the real encrypted save and repeat the same logical ticks. */
export async function runNativeSaveVariant(
  browser: Browser, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1, request: RuntimeRequestV1, branch: string,
  saveTickOverride?: number, afterContinuation?: (page: Page, proof: NativeSaveProof) => Promise<void>,
  beforeReplay?: (page: Page) => Promise<void>
) {
  const player = fixture.recipe.aiPlayerNumber;
  const saveTicks: Readonly<Record<string, number>> = { before_apply: 19, applied_pending: 199, during_active: 119, pause_speed: 599 };
  const saveTick = saveTickOverride ?? saveTicks[branch];
  if (!saveTick) throw new Error("native_save_unknown_branch");
  const world = variant.presetWorld;
  if (!world || world.events?.length || world.controls?.length || world.routeOutages?.length ||
      variant.perturbations?.length || world.receiptFault && world.receiptFault.throughTick > saveTick ||
      world.brainFault && world.brainFault.throughTick > saveTick)
    throw new Error("native_save_has_unreplayed_future_external_inputs");
  let save: Awaited<ReturnType<typeof saveNativeMatch>> | undefined;
  let saved: Awaited<ReturnType<typeof captureNativeContinuationBoundary>> | undefined;
  let premises: NativeSaveProof["premises"] | undefined;
  let nativeSave: NativeSaveProof | undefined;
  const captureSaveBoundary = async (page: Page) => {
    saved = await captureNativeContinuationBoundary(page, player);
    const capture = await captureRuntimeProductionAuthority(page, player);
    const siteId = await page.evaluate(() => (window as unknown as {
      __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1
    }).__fuzzyWaddleAiRuntimeBrowserTestV1?.presetApplication?.createdActorIds["save-paid-site"]);
    premises = nativeSavePremises(capture, saveTick, siteId);
    save = await saveNativeMatch(page, player);
    if (save.tick !== saved.owner.tick) throw new Error("native_save_clock_advanced_during_snapshot");
    await armNativeDecisionTrace(page, player);
  };
  const runVariantInput = branch === "before_apply"
    ? { ...variant, checkpointTicks: [...new Set([...(variant.checkpointTicks ?? fixture.recipe.checkpointTicks), 40])]
      .sort((left, right) => left - right) }
    : variant;
  const result = await runVariant(browser, fixture, runVariantInput, request.seed, request.scenarioIds,
    request.sourceRevision, request.fixtureDigest, async (page, index, checkpoint) => {
      if (index < 0 || checkpoint?.tick !== saveTick) return;
      await captureSaveBoundary(page);
    }, async (page) => {
      if (!save || !saved || !premises) throw new Error("native_save_exact_original_boundary_missing");
      await beforeReplay?.(page);
      nativeSave = await replayNativeSavedContinuation(page, player, branch, request.sourceRevision,
        request.fixtureDigest, save, saved, premises, branch === "pause_speed" ? 2 : 1);
      await afterContinuation?.(page, nativeSave);
    }, undefined, async (page, _index, targetTick) => {
      if (branch !== "before_apply" || targetTick !== saveTick) return false;
      await captureSaveBoundary(page);
      return true;
    });
  if (!nativeSave) throw new Error("native_save_continuation_not_captured");
  // The sealed raw observer stays local; it supplies premises, not a large model-facing report.
  const { productionCapture: _capture, ...compact } = result;
  return { ...compact, nativeSave };
}
