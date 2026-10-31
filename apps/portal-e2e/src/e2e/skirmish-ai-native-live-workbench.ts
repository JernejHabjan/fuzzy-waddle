import { expect, type Browser } from "@playwright/test";
import type Phaser from "phaser";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import type { ProbableWaffleScene } from "@fuzzy-waddle/probable-waffle-phaser/core/probable-waffle.scene";
import type { StateHashService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/recovery/state-hash.service";
import type { SimulationTickService } from "@fuzzy-waddle/probable-waffle-phaser/world/services/simulation-tick.service";
import { startMultiplayerTestMatch } from "./skirmish-ai-multiplayer-match";
import { observeMultiplayerPeer } from "./skirmish-ai-multiplayer-observation";
import { installRuntimeAccessor } from "./skirmish-ai-runtime-browser-accessor";
import { installRuntimeErrorListeners } from "./skirmish-ai-runtime-error-listeners";
import { stepNativeReplay } from "./skirmish-ai-native-replay-step";

/** Real live history/bookmark input is synchronous and read-only; both actual peers must keep exchanging matching hashes. */
export async function exerciseNativeLiveWorkbench(browser: Browser, seed: number, aiFaction: "Tivara" | "Skaduwee") {
  if (process.env.AI_MULTIPLAYER_E2E !== "1") throw new Error("native_workbench_requires_real_multiplayer_config");
  const match = await startMultiplayerTestMatch(browser, { seed, aiFaction, aiDifficulty: "Normal" });
  const aiErrors: string[] = [];
  installRuntimeErrorListeners(match.host, aiErrors); installRuntimeErrorListeners(match.peer, aiErrors);
  try {
    await installRuntimeAccessor(match.host);
    await match.host.waitForFunction(() =>
      (window.__fuzzyWaddleAiRuntimePartsV1?.(3)?.controller.getBrainDebugHistory().length ?? 0) >= 4);
    const actions = await match.host.evaluate(() => {
      const host = (window as unknown as { __fuzzyWaddleAiMultiplayerBrowserTestV1?: Pick<AiRuntimeBrowserTestHostV1, "game"> })
        .__fuzzyWaddleAiMultiplayerBrowserTestV1;
      const scene = host?.game.scene.getScenes(true).find((entry) => entry.scene.key === "MapAiMultiplayer") as
        ProbableWaffleScene | undefined;
      const services: readonly object[] = scene?.getSceneGameData().services ?? [];
      const hash = services.find((entry): entry is StateHashService => "captureAuthoritativeProjection" in entry);
      const clock = services.find((entry): entry is SimulationTickService => "currentTick" in entry && "pauseTick" in entry);
      type Label = { telemetryText: Phaser.GameObjects.Text; historyOffset: number; lastTelemetryAt: number;
        refreshTelemetry(now: number): void; bookmarks: { tick: number; decisionSequence: number }[] };
      const hud = host?.game.scene.getScenes(true).find((entry) => entry.scene.key === "HudProbableWaffle") as unknown as
        { aiControllerDebugPanel?: { toggleLabels(): void; playerButtons: Map<number, Phaser.GameObjects.Container>;
          categoryButtons: Map<string, Phaser.GameObjects.Container>; labels: Label[] } } | undefined;
      const panel = hud?.aiControllerDebugPanel;
      if (!scene || !hash || !clock || !panel) throw new Error("native_live_workbench_owners_missing");
      const fingerprint = () => {
        const text = JSON.stringify(hash.captureAuthoritativeProjection(scene));
        let value = 0x811c9dc5;
        for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 0x01000193);
        return `fnv1a32:${(value >>> 0).toString(16).padStart(8, "0")}`;
      };
      const before = fingerprint(), tick = clock.currentTick, pauseReasons = clock.getPauseReasons();
      panel.toggleLabels(); panel.playerButtons.get(3)?.emit("pointerdown"); panel.categoryButtons.get("overview")?.emit("pointerdown");
      const label = panel.labels[0];
      if (!label) throw new Error("native_live_workbench_label_missing");
      label.telemetryText.emit("wheel", { event: { shiftKey: true } }, 0, 1, 0, {});
      label.refreshTelemetry(performance.now());
      const historical = label.historyOffset;
      label.telemetryText.emit("pointerup", { event: { ctrlKey: true } });
      const bookmark = label.bookmarks.at(-1);
      label.telemetryText.emit("wheel", { event: { shiftKey: true } }, 0, -1, 0, {});
      label.telemetryText.emit("pointerup", { event: { altKey: true } });
      label.refreshTelemetry(performance.now());
      return { before, after: fingerprint(), tick, afterTick: clock.currentTick, historical,
        restoredHistory: label.historyOffset, bookmarkCount: label.bookmarks.length,
        bookmarkedTick: bookmark?.tick ?? null, bookmarkedSequence: bookmark?.decisionSequence ?? null,
        pauseReasonsUnchanged: JSON.stringify(pauseReasons) === JSON.stringify(clock.getPauseReasons()) };
    });
    let liveStepBlocker = "";
    try { await stepNativeReplay(match.peer, "tick", 2400); }
    catch (error) { liveStepBlocker = String(error); }
    const beforePeers = await Promise.all([observeMultiplayerPeer(match.host, 3), observeMultiplayerPeer(match.peer, 3)]);
    const lastBefore = Math.max(0, ...beforePeers.flatMap((peer) => peer.hashes.map((entry) => entry.tick)));
    let common: { tick: number; hash: string }[] = [];
    let divergedSharedHashCount = 0;
    await expect.poll(async () => {
      const [host, peer] = await Promise.all([observeMultiplayerPeer(match.host, 3), observeMultiplayerPeer(match.peer, 3)]);
      common = host.hashes.filter((entry) => entry.tick > Math.max(lastBefore, actions.tick) &&
        peer.hashes.some((candidate) => candidate.tick === entry.tick && candidate.hash === entry.hash));
      divergedSharedHashCount = host.hashes.filter((entry) => entry.tick > actions.tick &&
        peer.hashes.some((candidate) => candidate.tick === entry.tick && candidate.hash !== entry.hash)).length;
      return common.length;
    }, { timeout: 60_000 }).toBeGreaterThanOrEqual(2);
    return { humanClients: 2, actions, liveStepBlocker, matchingLaterHashes: common.slice(-2),
      divergedSharedHashCount, aiErrors: [...aiErrors] };
  } finally { await match.dispose(); }
}
