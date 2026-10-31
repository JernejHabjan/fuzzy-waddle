import type { Page } from "@playwright/test";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type { ProbableWaffleScene } from "@fuzzy-waddle/probable-waffle-phaser/core/probable-waffle.scene";
import type { CommandBusService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/multiplayer/command-bus.service";

/** Closed autonomous capture refuses unrecorded human commands rather than pretending a missing input log is empty. */
export async function armNativeReplayInputWitness(page: Page) {
  await page.evaluate(() => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1;
      __nativeReplayInputWitness?: { read(): number; dispose(): void } };
    if (realm.__nativeReplayInputWitness) throw new Error("native_replay_input_witness_already_armed");
    const scene = realm.__fuzzyWaddleAiRuntimeBrowserTestV1?.game.scene.getScenes(true)
      .find((entry) => entry.scene.key.startsWith("Map")) as ProbableWaffleScene | undefined;
    const services: readonly object[] = scene?.getSceneGameData().services ?? [];
    const bus = services.find((entry): entry is CommandBusService => "command$" in entry && "getAuthorityState" in entry);
    if (!scene || !bus) throw new Error("native_replay_input_authority_missing");
    let count = 0;
    const subscription = bus.command$.subscribe((command) => {
      if (command.execution?.source === "human") count++;
    });
    const dispose = () => {
      subscription.unsubscribe(); scene.events.off("shutdown", dispose); delete realm.__nativeReplayInputWitness;
    };
    realm.__nativeReplayInputWitness = { read: () => count, dispose };
    scene.events.once("shutdown", dispose);
  });
}

export async function closeNativeReplayInputWitness(page: Page) {
  return page.evaluate(() => {
    const witness = (window as unknown as { __nativeReplayInputWitness?: { read(): number; dispose(): void } })
      .__nativeReplayInputWitness;
    if (!witness) throw new Error("native_replay_input_witness_missing");
    const count = witness.read(); witness.dispose(); return count;
  });
}
