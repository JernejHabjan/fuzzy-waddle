import type { Page } from "@playwright/test";
import type { AiMultiplayerSharedQueueWorldV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-multiplayer-shared-queue-world-v1";

/** Operates the explicitly enabled real-scene adapter; reads never sample new facts or advance gameplay. */
export async function multiplayerSharedQueueWorld(
  page: Page, action: "read" | "start" = "read"
): Promise<AiMultiplayerSharedQueueWorldV1> {
  return page.evaluate((operation) => {
    const host = (window as unknown as {
      __fuzzyWaddleAiMultiplayerBrowserTestV1?: {
        game: { scene: { getScenes(active: boolean): {
          scene: { key: string }; getSceneGameData(): { services: unknown[] };
        }[] } };
      };
    }).__fuzzyWaddleAiMultiplayerBrowserTestV1;
    const scene = host?.game.scene.getScenes(true).find((candidate) => candidate.scene.key === "MapAiMultiplayer");
    const diagnostics = scene?.getSceneGameData().services.find((candidate): candidate is {
      kind: "ai-multiplayer-browser-diagnostics";
      startSharedQueueWorld(): void;
      getSnapshot(playerNumber: number): { sharedQueueWorld: AiMultiplayerSharedQueueWorldV1 | null };
    } => !!candidate && (candidate as { kind?: unknown }).kind === "ai-multiplayer-browser-diagnostics");
    if (!diagnostics) throw new Error("multiplayer_shared_queue_diagnostics_missing");
    if (operation === "start") diagnostics.startSharedQueueWorld();
    const world = diagnostics.getSnapshot(3).sharedQueueWorld;
    if (!world) throw new Error("multiplayer_shared_queue_world_missing");
    return world;
  }, action);
}
