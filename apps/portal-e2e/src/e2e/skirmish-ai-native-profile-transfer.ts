import { expect, type Browser } from "@playwright/test";
import type { ProbableWaffleScene } from "@fuzzy-waddle/probable-waffle-phaser/core/probable-waffle.scene";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import { digestCanonicalAiValue } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";
import { startMultiplayerTestMatch } from "./skirmish-ai-multiplayer-match";
import { observeMultiplayerPeer } from "./skirmish-ai-multiplayer-observation";
import { installRuntimeAccessor } from "./skirmish-ai-runtime-browser-accessor";
import { captureNativeContinuationBoundary } from "./skirmish-ai-native-continuation-boundary";
import { installNativeTransferHooks, nativeTransferHookAction } from "./skirmish-ai-native-transfer-hooks";
import { installRuntimeErrorListeners } from "./skirmish-ai-runtime-error-listeners";

/** Reconnect uses the real host snapshot; promotion then restores that actual checkpoint without multiplayer save/load. */
export async function runNativeProfileTransfer(browser: Browser, options: {
  seed: number; aiFaction: "Tivara" | "Skaduwee"; aiDifficulty: "Easy" | "Normal" | "Hard"
}) {
  if (process.env.AI_MULTIPLAYER_E2E !== "1") throw new Error("native_profile_transfer_requires_real_multiplayer_config");
  const match = await startMultiplayerTestMatch(browser, options);
  const aiErrors: string[] = [];
  installRuntimeErrorListeners(match.host, aiErrors);
  installRuntimeErrorListeners(match.peer, aiErrors);
  try {
    await installRuntimeAccessor(match.host);
    await installRuntimeAccessor(match.peer);
    await match.host.waitForFunction(() =>
      (window.__fuzzyWaddleAiRuntimePartsV1?.(3)?.controller.getBrainState()?.scheduler.decisionSequence ?? 0) >= 3);
    await match.host.evaluate(() => {
      const parts = window.__fuzzyWaddleAiRuntimePartsV1?.(3);
      if (!parts) throw new Error("native_profile_original_host_controller_missing");
      parts.tickService.pauseTick("manual");
    });
    await match.host.waitForFunction(() => window.__fuzzyWaddleAiRuntimePartsV1?.(3)?.controller.isDecisionBoundarySettled());
    const original = await captureNativeContinuationBoundary(match.host, 3);
    if (original.owner.tick >= 4000) throw new Error("native_profile_transfer_exceeded_original_ceiling");
    const beforePeer = await observeMultiplayerPeer(match.peer, 3);
    if (beforePeer.aiControllerPresent || new Set(beforePeer.relay.humanPlayerNumbers).size !== 2)
      throw new Error("native_profile_transfer_requires_two_distinct_real_clients");
    await installNativeTransferHooks(match.peer);
    await expect.poll(async () => (await nativeTransferHookAction(match.peer)).disconnected,
      { timeout: 30_000 }).toBe(true);
    await nativeTransferHookAction(match.peer, "reconnect");
    await expect.poll(async () => (await nativeTransferHookAction(match.peer)).snapshotTick,
      { timeout: 60_000 }).toBe(original.owner.tick);
    const actualSnapshot = await match.peer.evaluate(() => {
      const realm = window as unknown as {
        __fuzzyWaddleAiMultiplayerBrowserTestV1?: Pick<AiRuntimeBrowserTestHostV1, "game"> };
      const scene = realm.__fuzzyWaddleAiMultiplayerBrowserTestV1?.game.scene.getScenes(true)
        .find((entry) => entry.scene.key === "MapAiMultiplayer") as ProbableWaffleScene | undefined;
      const state = scene?.players.find((player) => player.playerNumber === 3)?.playerState.data.aiBehaviorTreeState;
      if (!state?.brainState || !state.controllerCadence) throw new Error("native_profile_reconnect_ai_continuation_missing");
      return { brain: state.brainState, cadence: state.controllerCadence };
    });
    const snapshotBrainDigest = digestCanonicalAiValue(actualSnapshot.brain);
    const snapshotCadenceDigest = digestCanonicalAiValue(actualSnapshot.cadence);
    const peerEpoch = (await observeMultiplayerPeer(match.peer, 3)).relay.authorityEpoch;
    await match.hostContext.close();
    await expect.poll(async () => (await nativeTransferHookAction(match.peer)).promoted,
      { timeout: 60_000 }).toBe(true);
    await match.peer.waitForFunction(() => window.__fuzzyWaddleAiRuntimePartsV1?.(3)?.controller.isDecisionBoundarySettled());
    const promoted = await captureNativeContinuationBoundary(match.peer, 3);
    const promotedEpoch = (await observeMultiplayerPeer(match.peer, 3)).relay.authorityEpoch;
    await nativeTransferHookAction(match.peer, "resume");
    await expect.poll(async () => (await nativeTransferHookAction(match.peer)).nextDecision !== null,
      { timeout: 30_000 }).toBe(true);
    await match.peer.waitForFunction(() => window.__fuzzyWaddleAiRuntimePartsV1?.(3)?.controller.isDecisionBoundarySettled());
    const next = await captureNativeContinuationBoundary(match.peer, 3);
    const hook = await nativeTransferHookAction(match.peer);
    return { humanClients: 2, sourceTick: original.owner.tick, disconnected: hook.disconnected,
      snapshotTick: hook.snapshotTick, snapshotBrainDigest, snapshotCadenceDigest,
      original, promoted, next, originalEpoch: peerEpoch, promotedEpoch, nextDecision: hook.nextDecision, aiErrors: [...aiErrors] };
  } finally { await match.dispose(); }
}
