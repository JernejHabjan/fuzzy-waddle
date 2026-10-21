import type { Page } from "@playwright/test";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type GameProbableWaffleScene from
  "@fuzzy-waddle/probable-waffle-phaser/world/scenes/GameProbableWaffleScene";
import type { PlayerAiController } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/player-ai-controller";

/** Read current native owners rather than inferring a controller count from successful commands. */
export async function readNativeSceneOwnership(page: Page, playerNumber: number) {
  return page.evaluate((playerNumber) => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1;
      __fuzzyWaddleAiMultiplayerBrowserTestV1?: Pick<AiRuntimeBrowserTestHostV1, "game"> };
    const host = realm.__fuzzyWaddleAiRuntimeBrowserTestV1 ?? realm.__fuzzyWaddleAiMultiplayerBrowserTestV1;
    const scenes = host?.game.scene.getScenes(true).filter((entry) => entry.scene.key.startsWith("Map")) ?? [];
    const scene = scenes[0] as GameProbableWaffleScene | undefined;
    const handlers = scene?.getSceneGameData().systems.filter((entry) =>
      !!entry && typeof (entry as { getAiPlayerController?: unknown }).getAiPlayerController === "function") ?? [];
    const controllers = handlers.flatMap((handler) => (handler as unknown as {
      aiPlayerControllers: readonly PlayerAiController[] }).aiPlayerControllers);
    const owned = controllers.filter((controller) => controller.player.playerNumber === playerNumber);
    const clock = window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber)?.tickService;
    const metadata = scene?.baseGameData.gameInstance.gameInstanceMetadata.data;
    if (!scene || !metadata || !clock) throw new Error("native_scene_ownership_unavailable");
    return { activeMapScenes: scenes.length, handlerCount: handlers.length, controllerCount: owned.length,
      nativePlayerCount: scene.players.filter((player) => player.playerNumber === playerNumber).length,
      tick: clock.currentTick, seed: metadata.rndSeed, matchId: metadata.gameInstanceId,
      decisionSequence: owned[0]?.getBrainState()?.scheduler.decisionSequence ?? null };
  }, playerNumber);
}
