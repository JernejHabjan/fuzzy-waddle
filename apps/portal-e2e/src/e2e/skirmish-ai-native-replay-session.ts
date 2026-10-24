import type { Browser } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import { prepareRuntimeVariant } from "./skirmish-ai-runtime-variant-setup";
import { advanceRuntimeFrames } from "./skirmish-ai-runtime-frame-driver";
import { saveNativeMatch, reloadNativeMatch } from "./skirmish-ai-native-save-reload";
import { installNativeReplayRecord } from "./skirmish-ai-native-replay-record";
import { nativeReplayCapsuleBlocker, type NativeReplayCapsule } from "./skirmish-ai-native-replay-capsule";
import { captureNativeContinuationBoundary } from "./skirmish-ai-native-continuation-boundary";

/** A distinct browser context loads the untouched real codec record through ordinary Load; no actors/brain are reconstructed. */
export async function openNativeReplaySession(
  browser: Browser, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1, capsule: NativeReplayCapsule,
  sourceRevision: string, fixtureDigest: string
) {
  const blocker = nativeReplayCapsuleBlocker(capsule, sourceRevision, fixtureDigest);
  if (blocker) throw new Error(`native_physical_replay_blocked:${blocker}`);
  const context = await browser.newContext(), page = await context.newPage(), aiErrors: string[] = [];
  try {
    await prepareRuntimeVariant(page, fixture, variant, capsule.saved.owner.seed, sourceRevision, fixtureDigest, false, aiErrors);
    await advanceRuntimeFrames(page, 2, 20);
    await page.waitForFunction(() => window.__fuzzyWaddleAiRuntimePartsV1?.(2)?.controller.isDecisionBoundarySettled());
    const placeholder = await saveNativeMatch(page, 2);
    await installNativeReplayRecord(page, capsule.checkpoint, placeholder.saveId);
    const loaded = await reloadNativeMatch(page, 2, { ...placeholder, saveId: capsule.checkpoint.id,
      revision: capsule.checkpoint.revision, tick: capsule.saved.owner.tick,
      decisionSequence: capsule.saved.owner.decisionSequence ?? -1 });
    const restored = await captureNativeContinuationBoundary(page, 2);
    if (!loaded.sameRealm || restored.worldDigest !== capsule.saved.worldDigest ||
        restored.owner.matchId !== capsule.saved.owner.matchId || restored.profileVersion !== capsule.saved.profileVersion)
      throw new Error("native_physical_replay_original_checkpoint_differs");
    await page.evaluate(() => {
      (window as unknown as { __nativeIsolatedReplay?: boolean }).__nativeIsolatedReplay = true;
    });
    return { context, page, restored, aiErrors };
  } catch (error) { await context.close(); throw error; }
}
