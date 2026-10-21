import { expect, type Browser, type Page } from "@playwright/test";
import { startMultiplayerTestMatch } from "./skirmish-ai-multiplayer-match";
import { observeMultiplayerPeer } from "./skirmish-ai-multiplayer-observation";
import { captureNativeContinuationBoundary } from "./skirmish-ai-native-continuation-boundary";
import { nativeTransferHookAction } from "./skirmish-ai-native-transfer-hooks";
import { prepareNativePeerCheckpoint } from "./skirmish-ai-native-peer-checkpoint";
import { installRuntimeErrorListeners } from "./skirmish-ai-runtime-error-listeners";
import { multiplayerAuthorityProbe } from "./skirmish-ai-multiplayer-authority-probe";
import { nativeDebugWorldDigest } from "./skirmish-ai-native-debug-comparison";

/** Reconnect uses the real host snapshot; promotion then restores that actual checkpoint without multiplayer save/load. */
export async function runNativeProfileTransfer(browser: Browser, options: {
  seed: number; aiFaction: "Tivara" | "Skaduwee"; aiDifficulty: "Easy" | "Normal" | "Hard";
  lateDeliveryOrder?: "command_then_receipt" | "receipt_then_command"
}, afterTransfer?: (page: Page) => Promise<void>) {
  if (process.env.AI_MULTIPLAYER_E2E !== "1") throw new Error("native_profile_transfer_requires_real_multiplayer_config");
  const match = await startMultiplayerTestMatch(browser, { ...options,
    ...(options.lateDeliveryOrder ? { authorityProbe: true as const } : {}) });
  const aiErrors: string[] = [];
  installRuntimeErrorListeners(match.host, aiErrors);
  installRuntimeErrorListeners(match.peer, aiErrors);
  try {
    const { original, snapshotBrainDigest, snapshotCadenceDigest, peerEpoch } = await prepareNativePeerCheckpoint(match);
    const retained = options.lateDeliveryOrder ? await multiplayerAuthorityProbe(match.peer, "pin") : undefined;
    await match.hostContext.close();
    await expect.poll(async () => (await nativeTransferHookAction(match.peer)).promoted,
      { timeout: 60_000 }).toBe(true);
    await match.peer.waitForFunction(() => window.__fuzzyWaddleAiRuntimePartsV1?.(3)?.controller.isDecisionBoundarySettled());
    const promoted = await captureNativeContinuationBoundary(match.peer, 3);
    const promotedEpoch = (await observeMultiplayerPeer(match.peer, 3)).relay.authorityEpoch;
    let lateEpochReplay: { order: NonNullable<typeof options.lateDeliveryOrder>;
      retained: Awaited<ReturnType<typeof multiplayerAuthorityProbe>>;
      before: Awaited<ReturnType<typeof multiplayerAuthorityProbe>>;
      after: Awaited<ReturnType<typeof multiplayerAuthorityProbe>>;
      beforeContinuation: Awaited<ReturnType<typeof captureNativeContinuationBoundary>>;
      afterContinuation: Awaited<ReturnType<typeof captureNativeContinuationBoundary>>;
      beforeEffectDigest: string; afterEffectDigest: string } | undefined;
    if (options.lateDeliveryOrder && retained) {
      const before = await multiplayerAuthorityProbe(match.peer);
      const beforeContinuation = await captureNativeContinuationBoundary(match.peer, 3);
      const beforeEffectDigest = await nativeDebugWorldDigest(match.peer, true);
      for (const action of options.lateDeliveryOrder === "command_then_receipt" ?
        ["redeliver", "receipt"] as const : ["receipt", "redeliver"] as const)
        await multiplayerAuthorityProbe(match.peer, action);
      lateEpochReplay = { order: options.lateDeliveryOrder, retained, before, beforeContinuation,
        afterContinuation: await captureNativeContinuationBoundary(match.peer, 3),
        after: await multiplayerAuthorityProbe(match.peer), beforeEffectDigest,
        afterEffectDigest: await nativeDebugWorldDigest(match.peer, true) };
    }
    await nativeTransferHookAction(match.peer, "resume");
    await expect.poll(async () => (await nativeTransferHookAction(match.peer)).nextDecision !== null,
      { timeout: 30_000 }).toBe(true);
    await match.peer.waitForFunction(() => window.__fuzzyWaddleAiRuntimePartsV1?.(3)?.controller.isDecisionBoundarySettled());
    const next = await captureNativeContinuationBoundary(match.peer, 3);
    const hook = await nativeTransferHookAction(match.peer);
    await afterTransfer?.(match.peer);
    return { humanClients: 2, sourceTick: original.owner.tick, disconnected: hook.disconnected,
      snapshotTick: hook.snapshotTick, snapshotBrainDigest, snapshotCadenceDigest,
      original, promoted, next, originalEpoch: peerEpoch, promotedEpoch, nextDecision: hook.nextDecision, aiErrors: [...aiErrors],
      ...(lateEpochReplay ? { lateEpochReplay } : {}) };
  } finally { await match.dispose(); }
}
