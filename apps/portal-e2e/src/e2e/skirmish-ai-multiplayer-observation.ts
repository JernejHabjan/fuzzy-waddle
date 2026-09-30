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
    const relay = graph.services.find((candidate): candidate is {
      getRelayDiagnostics(): Relay;
      getAuthorityState(): { processedCommandIds: readonly string[] };
    } =>
      !!candidate && typeof (candidate as { getRelayDiagnostics?: unknown }).getRelayDiagnostics === "function" &&
      typeof (candidate as { getAuthorityState?: unknown }).getAuthorityState === "function"
    );
    const hashes = graph.services.find((candidate): candidate is { getRecentHashCheckpoints(): Hashes } =>
      !!candidate && typeof (candidate as { getRecentHashCheckpoints?: unknown }).getRecentHashCheckpoints === "function"
    );
    const handler = graph.systems.find((candidate): candidate is {
      getAiPlayerController(player: number): unknown;
    } => !!candidate && typeof (candidate as { getAiPlayerController?: unknown }).getAiPlayerController === "function");
    if (!relay || !hashes || !handler) throw new Error("multiplayer_observation_service_missing");
    return {
      sceneKey: scene.scene.key,
      relay: relay.getRelayDiagnostics(),
      aiControllerPresent: !!handler.getAiPlayerController(playerNumber),
      processedAiCommandIds: relay.getAuthorityState().processedCommandIds
        .filter((id) => id.startsWith(`${playerNumber}:`)).slice(-16),
      hashes: hashes.getRecentHashCheckpoints()
    };
  }, aiPlayerNumber);
}
