import type { Browser } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import type { RuntimeRequestV1 } from "./skirmish-ai-runtime-request";
import type { NativeLifecycleProof } from "./skirmish-ai-native-lifecycle-proof";
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { retainNativeSceneWork } from "./skirmish-ai-native-retained-work";
import { transitionNativeLifecycle } from "./skirmish-ai-native-lifecycle-transition";
import { runNativeLifecycleMultiplayer } from "./skirmish-ai-native-lifecycle-multiplayer";

/** H-32 keeps first-match history intact; reset ticks and second-match facts belong only to the explicit lifecycle proof. */
export async function runNativeLifecycleVariant(
  browser: Browser, fixture: RuntimeFixtureV1, variant: RuntimeVariantV1, request: RuntimeRequestV1, branch: string
) {
  if (branch === "host_replacement") return runNativeLifecycleMultiplayer(browser, fixture, variant, request);
  let nativeLifecycle: NativeLifecycleProof | undefined,
    originalPresetApplication: AiRuntimePresetApplicationV1 | undefined;
  const result = await runVariant(browser, fixture, variant, request.seed, request.scenarioIds,
    request.sourceRevision, request.fixtureDigest, undefined, async (page) => {
      nativeLifecycle = await transitionNativeLifecycle(page, fixture, variant, branch, 2,
        request.sourceRevision, request.fixtureDigest);
      if (originalPresetApplication && (variant.presetWorld?.events?.length || variant.presetWorld?.routeOutages?.length))
        await page.evaluate((presetApplication) => {
          const host = window.__fuzzyWaddleAiRuntimeBrowserTestV1 as
            { presetApplication?: AiRuntimePresetApplicationV1 } | undefined;
          if (host) host.presetApplication = presetApplication;
        }, originalPresetApplication);
    }, undefined, undefined, async (page) => {
      const pathActorId = branch === "pending_path" ? await page.evaluate(() =>
        window.__fuzzyWaddleAiRuntimeBrowserTestV1?.presetApplication?.createdActorIds["army-0"]) : undefined;
      if (branch === "pending_path" && !pathActorId) throw new Error("lifecycle_original_path_identity_missing");
      await retainNativeSceneWork(page, 2, branch === "paid_queue", pathActorId);
      // Retained queries can record route-outage evidence; collect it before transitioning to the next scene.
      originalPresetApplication = await page.evaluate(() =>
        window.__fuzzyWaddleAiRuntimeBrowserTestV1?.presetApplication);
    });
  if (!nativeLifecycle) throw new Error("native_lifecycle_transition_not_captured");
  return { ...result, nativeLifecycle };
}
