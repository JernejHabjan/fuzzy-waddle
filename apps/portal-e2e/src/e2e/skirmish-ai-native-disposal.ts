import type { Page } from "@playwright/test";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type { ProbableWaffleScene } from "@fuzzy-waddle/probable-waffle-phaser/core/probable-waffle.scene";
import type { NavigationService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/navigation.service";
import type { ActorIndexSystem } from "@fuzzy-waddle/probable-waffle-phaser/world/services/ActorIndexSystem";
import type { NativeDisposalEvidence } from "./skirmish-ai-native-disposal-evidence";

/** Retain a genuine pending native call, stop its owning scene, and await cancellation in that same realm. */
export async function captureNativeDisposal(page: Page): Promise<NativeDisposalEvidence> {
  return page.evaluate(async () => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1 };
    const host = realm.__fuzzyWaddleAiRuntimeBrowserTestV1;
    const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      ProbableWaffleScene | undefined;
    if (!scene || !host) throw new Error("disposal_live_scene_missing");
    const services: readonly object[] = scene.getSceneGameData().services;
    const navigation = services.find((entry): entry is NavigationService =>
      "getNativeNavigationBoundary" in entry && "findPathFromGameObjectToTile" in entry);
    const index = services.find((entry): entry is ActorIndexSystem => "getOwnedActors" in entry && "getActorById" in entry);
    const id = host.presetApplication?.createdActorIds["army-0"];
    const actor = id && index?.getActorById(id);
    if (!navigation || !actor) throw new Error("disposal_original_actor_or_navigation_missing");
    const before = navigation.getNativeNavigationBoundary();
    let settled = false;
    const pending = navigation.findPathFromGameObjectToTile(actor, { x: 19, y: 27 }).then((result) => {
      settled = true;
      return result;
    });
    await Promise.resolve();
    const pendingBeforeShutdown = !settled;
    scene.scene.stop();
    const outcome = await pending;
    const after = navigation.getNativeNavigationBoundary();
    return { pendingBeforeShutdown, settledWithNull: outcome === null, sceneInactive: !scene.scene.isActive(),
      controllerDetached: !window.__fuzzyWaddleAiRuntimePartsV1?.(2),
      nativeCacheCleared: !!before && !!after && after.groundCacheClear > before.groundCacheClear };
  });
}
