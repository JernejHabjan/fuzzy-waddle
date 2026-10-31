import type { Page } from "@playwright/test";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type { ProbableWaffleScene } from "@fuzzy-waddle/probable-waffle-phaser/core/probable-waffle.scene";
import type { StateHashService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/recovery/state-hash.service";

/** Both state reads and the actual native UI handler share one browser task, excluding unrelated live-peer ticks. */
export async function importThroughNativeUi(page: Page, json: string) {
  return page.evaluate((json) => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1;
      __fuzzyWaddleAiMultiplayerBrowserTestV1?: Pick<AiRuntimeBrowserTestHostV1, "game"> };
    const host = realm.__fuzzyWaddleAiRuntimeBrowserTestV1 ?? realm.__fuzzyWaddleAiMultiplayerBrowserTestV1;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      ProbableWaffleScene | undefined;
    const services: readonly object[] = scene?.getSceneGameData().services ?? [];
    const hash = services.find((entry): entry is StateHashService => "captureAuthoritativeProjection" in entry);
    const root = document.querySelector<HTMLDetailsElement>("[data-ai-runtime-bundle-import]");
    const input = root?.querySelector("textarea"), button = root?.querySelector("button");
    if (!scene || !hash || !root || !input || !button) throw new Error("native_import_surface_or_world_missing");
    root.open = true;
    input.value = json;
    const before = JSON.stringify(hash.captureAuthoritativeProjection(scene));
    button.click();
    const after = JSON.stringify(hash.captureAuthoritativeProjection(scene));
    return { result: root.querySelector<HTMLOutputElement>("output")?.dataset.result ?? "missing",
      nativeWorldUnchanged: before === after, injectedElements: root.querySelectorAll("img,script,iframe,object").length };
  }, json);
}
