import type { Page } from "@playwright/test";
import type { AiMultiplayerQueueWorldV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-multiplayer-queue-world-v1";

/** Operates only the already opt-in adapter on the real scene; reading never advances its clock or invokes a planner. */
export async function multiplayerQueueWorld(page: Page, action: "read" | "start" = "read"): Promise<AiMultiplayerQueueWorldV1> {
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
      startQueueWorld(): void;
      getSnapshot(playerNumber: number): { queueWorld: AiMultiplayerQueueWorldV1 | null };
    } => !!candidate && (candidate as { kind?: unknown }).kind === "ai-multiplayer-browser-diagnostics");
    if (!diagnostics) throw new Error("multiplayer_queue_diagnostics_missing");
    if (operation === "start") diagnostics.startQueueWorld();
    const world = diagnostics.getSnapshot(3).queueWorld;
    if (!world) throw new Error("multiplayer_queue_world_missing");
    return world;
  }, action);
}
