import type { Page } from "@playwright/test";
import type { ProbableWaffleScene } from "@fuzzy-waddle/probable-waffle-phaser/core/probable-waffle.scene";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type { SimulationTickService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/simulation-tick.service";
import type { AiRuntimeDecisionRepro } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-decision-repro";

/** Real transport disconnect/reconnect and native scene event boundaries; never edit a snapshot, epoch or AI state. */
export async function installNativeTransferHooks(page: Page) {
  await page.evaluate(() => {
    const realm = window as unknown as { __fuzzyWaddleAiMultiplayerBrowserTestV1?: Pick<AiRuntimeBrowserTestHostV1, "game">;
      __nativeTransfer?: { disconnected: boolean; snapshotTick: number | null; promoted: boolean;
        nextDecision: { tick: number; sequence: number } | null; reconnect(): void; resume(): void } };
    const scene = realm.__fuzzyWaddleAiMultiplayerBrowserTestV1?.game.scene.getScenes(true)
      .find((entry) => entry.scene.key === "MapAiMultiplayer") as ProbableWaffleScene | undefined;
    const clock = scene?.getSceneGameData().services.find((entry): entry is SimulationTickService =>
      "currentTick" in entry && "pauseTick" in entry && "resumeTick" in entry);
    const communicator = scene?.baseGameData.communicator;
    if (!scene || !clock || !communicator?.activeSocket || !communicator.hostMigrated)
      throw new Error("native_transfer_real_socket_or_services_missing");
    const socket = communicator.activeSocket;
    const state = { disconnected: false, snapshotTick: null as number | null, promoted: false,
      nextDecision: null as { tick: number; sequence: number } | null,
      reconnect: () => socket.connect(), resume: () => {
        clock.resumeTick();
        scene.game.loop.wake();
      } };
    realm.__nativeTransfer = state;
    const lost = () => { state.disconnected = true; };
    const applied = (event: { tick?: number }) => {
      if (!state.disconnected || event.tick === undefined) return;
      state.snapshotTick = event.tick;
      clock.pauseTick();
    };
    const migration = communicator.hostMigrated.on.subscribe((event) => {
      if (event.currentHostUserId !== scene.userId) return;
      state.promoted = true;
      clock.pauseTick();
    });
    const selected = (capture: AiRuntimeDecisionRepro) => {
      if (!state.promoted || state.nextDecision || capture.payload.observation.playerNumber !== 3) return;
      const result = capture.payload.expectedResult;
      if (!result) throw new Error("native_transfer_next_selected_result_missing");
      state.nextDecision = { tick: capture.payload.observation.tick, sequence: result.nextState.scheduler.decisionSequence };
      clock.pauseTick();
    };
    scene.events.on("local-connection-lost", lost);
    scene.events.on("reconnect-snapshot-applied", applied);
    scene.events.on("ai-runtime-decision-repro", selected);
    scene.events.once("shutdown", () => {
      migration.unsubscribe();
      scene.events.off("local-connection-lost", lost);
      scene.events.off("reconnect-snapshot-applied", applied);
      scene.events.off("ai-runtime-decision-repro", selected);
      delete realm.__nativeTransfer;
    });
    socket.disconnect();
  });
}

export async function nativeTransferHookAction(page: Page, action: "read" | "reconnect" | "resume" = "read") {
  return page.evaluate((action) => {
    const state = (window as unknown as { __nativeTransfer?: { disconnected: boolean; snapshotTick: number | null;
      promoted: boolean; nextDecision: { tick: number; sequence: number } | null; reconnect(): void; resume(): void } }).__nativeTransfer;
    if (!state) throw new Error("native_transfer_hooks_missing");
    if (action === "reconnect") state.reconnect();
    if (action === "resume") state.resume();
    return { disconnected: state.disconnected, snapshotTick: state.snapshotTick, promoted: state.promoted,
      nextDecision: state.nextDecision };
  }, action);
}
