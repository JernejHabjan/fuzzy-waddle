import type { Browser } from "@playwright/test";
import type { RuntimeFixture } from "../../contracts/skirmish-ai-runtime-fixture";
import type { RuntimeVariant } from "../../setup/skirmish-ai-runtime-variant";
import type { RuntimeRequest } from "../../runner/skirmish-ai-runtime-request";
import type { NativeLifecycleProof } from "./skirmish-ai-native-lifecycle-proof";
import type { AiRuntimePresetApplication } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/presets/setup/ai-runtime-preset-application";
import { runVariant } from "../../runner/skirmish-ai-runtime-variant-runner";
import { retainNativeSceneWork } from "./skirmish-ai-native-retained-work";
import { transitionNativeLifecycle } from "./skirmish-ai-native-lifecycle-transition";
import { runNativeLifecycleMultiplayer } from "../transfer/skirmish-ai-native-lifecycle-multiplayer";

/** H-32 keeps first-match history intact; reset ticks and second-match facts belong only to the explicit lifecycle proof. */
export async function runNativeLifecycleVariant(
  browser: Browser, fixture: RuntimeFixture, variant: RuntimeVariant, request: RuntimeRequest, branch: string
) {
  if (branch === "host_replacement") return runNativeLifecycleMultiplayer(browser, fixture, variant, request);
  let nativeLifecycle: NativeLifecycleProof | undefined,
    originalPresetApplication: AiRuntimePresetApplication | undefined;
  const result = await runVariant(browser, fixture, variant, request.seed, request.scenarioIds,
    request.sourceRevision, request.fixtureDigest, undefined, async (page) => {
      nativeLifecycle = await transitionNativeLifecycle(page, fixture, variant, branch, 2,
        request.sourceRevision, request.fixtureDigest);
      if (originalPresetApplication && (variant.presetWorld?.events?.length || variant.presetWorld?.routeOutages?.length))
        await page.evaluate((presetApplication) => {
          const host = window.__fuzzyWaddleAiRuntimeBrowserTest as
            { presetApplication?: AiRuntimePresetApplication } | undefined;
          if (host) host.presetApplication = presetApplication;
        }, originalPresetApplication);
    }, undefined, undefined, async (page) => {
      const pathActorId = branch === "pending_path" ? await page.evaluate(() =>
        window.__fuzzyWaddleAiRuntimeBrowserTest?.presetApplication?.createdActorIds["army-0"]) : undefined;
      if (branch === "pending_path" && !pathActorId) throw new Error("lifecycle_original_path_identity_missing");
      await retainNativeSceneWork(page, 2, branch === "paid_queue", pathActorId);
      // Retained queries can record route-outage evidence; collect it before transitioning to the next scene.
      originalPresetApplication = await page.evaluate(() =>
        window.__fuzzyWaddleAiRuntimeBrowserTest?.presetApplication);
    });
  if (!nativeLifecycle) throw new Error("native_lifecycle_transition_not_captured");
  return { ...result, nativeLifecycle };
}
