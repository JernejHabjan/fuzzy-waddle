import type { Page } from "@playwright/test";

export interface MultiplayerPeerObservation {
  readonly sceneKey: string;
  readonly relay: {
    readonly active: boolean;
    readonly localPlayerNumber: number | null;
    readonly humanPlayerNumbers: readonly number[];
    readonly authorityEpoch: number;
    readonly lastReceivedRelaySequenceByPlayer: Readonly<Record<number, number>>;
  };
  readonly aiControllerPresent: boolean;
  readonly processedAiCommandIds: readonly string[];
  readonly hashes: readonly { readonly tick: number; readonly hash: string }[];
}

/** Reads production relay/hash services from the real Phaser scene, never private test-injected AI state. */
export async function observeMultiplayerPeer(page: Page, aiPlayerNumber: number): Promise<MultiplayerPeerObservation> {
  return page.evaluate((playerNumber) => {
    type Relay = MultiplayerPeerObservation["relay"];
    type Hashes = MultiplayerPeerObservation["hashes"];
    const host = (window as unknown as {
      __fuzzyWaddleAiMultiplayerBrowserTestV1?: {
        game: { scene: { getScenes(active: boolean): {
          scene: { key: string };
          getSceneGameData(): { services: unknown[]; systems: unknown[] };
        }[] } };
      };
    }).__fuzzyWaddleAiMultiplayerBrowserTestV1;
    const scene = host?.game.scene.getScenes(true).find((candidate) => candidate.scene.key === "MapAiMultiplayer");
    if (!scene) throw new Error("multiplayer_test_scene_missing");
    const graph = scene.getSceneGameData();
    const diagnostics = graph.services.find((candidate): candidate is {
      kind: "ai-multiplayer-browser-diagnostics";
      getSnapshot(aiPlayerNumber: number): {
        relay: Relay;
        processedAiCommandIds: readonly string[];
        hashes: Hashes;
      };
    } =>
      !!candidate && (candidate as { kind?: unknown }).kind === "ai-multiplayer-browser-diagnostics" &&
      typeof (candidate as { getSnapshot?: unknown }).getSnapshot === "function"
    );
    const handler = graph.systems.find((candidate): candidate is {
      getAiPlayerController(player: number): unknown;
    } => !!candidate && typeof (candidate as { getAiPlayerController?: unknown }).getAiPlayerController === "function");
    if (!diagnostics || !handler) throw new Error("multiplayer_observation_service_missing");
    const snapshot = diagnostics.getSnapshot(playerNumber);
    return {
      sceneKey: scene.scene.key,
      relay: snapshot.relay,
      aiControllerPresent: !!handler.getAiPlayerController(playerNumber),
      processedAiCommandIds: snapshot.processedAiCommandIds,
      hashes: snapshot.hashes
    };
  }, aiPlayerNumber);
}
