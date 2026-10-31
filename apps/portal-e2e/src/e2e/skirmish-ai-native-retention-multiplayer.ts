import { expect, type Browser } from "@playwright/test";
import { digestCanonicalAiValue } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";
import { startMultiplayerTestMatch } from "./skirmish-ai-multiplayer-match";
import { prepareNativePeerCheckpoint } from "./skirmish-ai-native-peer-checkpoint";
import { multiplayerAuthorityProbe } from "./skirmish-ai-multiplayer-authority-probe";
import { pressureNativeRetention } from "./skirmish-ai-native-retention-pressure";
import { installNativeRetentionWitness, nativeRetentionWitnessAction } from "./skirmish-ai-native-retention-witness";
import { readNativeRetentionBoundary } from "./skirmish-ai-native-retention-boundary";
import { nativeDebugWorldDigest } from "./skirmish-ai-native-debug-comparison";
import { captureNativeContinuationBoundary } from "./skirmish-ai-native-continuation-boundary";
import { observeMultiplayerPeer } from "./skirmish-ai-multiplayer-observation";
import { installRuntimeErrorListeners } from "./skirmish-ai-runtime-error-listeners";

/** Both real clients admit and complete ordinary relayed commands before the exact old command is redelivered. */
export async function runNativeRetentionMultiplayer(browser: Browser, options: {
  seed: number; aiFaction: "Tivara" | "Skaduwee"
}) {
  if (process.env.AI_MULTIPLAYER_E2E !== "1") throw new Error("native_retention_requires_real_multiplayer_config");
  const match = await startMultiplayerTestMatch(browser, { ...options, aiDifficulty: "Normal", authorityProbe: true });
  const aiErrors: string[] = [];
  installRuntimeErrorListeners(match.host, aiErrors); installRuntimeErrorListeners(match.peer, aiErrors);
  try {
    const checkpoint = await prepareNativePeerCheckpoint(match, 2400);
    const retained = await multiplayerAuthorityProbe(match.host, "pin");
    const peerRetained = await multiplayerAuthorityProbe(match.peer, "pin");
    if (!retained.original || !retained.originalReceipt || !peerRetained.original ||
        retained.original.commandId !== peerRetained.original.commandId)
      throw new Error("native_retention_real_peers_original_identity_missing_or_different");
    const original = { playerNumber: retained.originalReceipt.playerNumber, execution: retained.original };
    await Promise.all([installNativeRetentionWitness(match.host, 2), installNativeRetentionWitness(match.peer, 2)]);
    const dispatchedIds: string[] = [];
    let actorId: string | null = null;
    for (let offset = 0; offset < 2049; offset += 64) {
      const count = Math.min(64, 2049 - offset), target = offset + count;
      await Promise.all([nativeRetentionWitnessAction(match.host, target), nativeRetentionWitnessAction(match.peer, target)]);
      const dispatched = await pressureNativeRetention(match.peer, count);
      if (dispatched.playerNumber !== 2 || actorId !== null && actorId !== dispatched.actorId)
        throw new Error("native_retention_pressure_owner_or_producer_changed");
      actorId = dispatched.actorId; dispatchedIds.push(...dispatched.commandIds);
      await Promise.all([nativeRetentionWitnessAction(match.host, undefined, true),
        nativeRetentionWitnessAction(match.peer, undefined, true)]);
      await expect.poll(async () => {
        const witnesses = await Promise.all([nativeRetentionWitnessAction(match.host), nativeRetentionWitnessAction(match.peer)]);
        if (witnesses.some((witness) => witness.failed || witness.duplicateCompletions || witness.tick > 2400))
          throw new Error("native_retention_relay_rejection_duplicate_or_ceiling");
        return witnesses.every((witness) => witness.admitted === target && witness.completed === target);
      }, { timeout: 30_000 }).toBe(true);
      await match.host.waitForFunction(() => window.__fuzzyWaddleAiRuntimePartsV1?.(3)?.controller.isDecisionBoundarySettled());
    }
    const hostWitness = await nativeRetentionWitnessAction(match.host), peerWitness = await nativeRetentionWitnessAction(match.peer);
    const beforeHost = await readNativeRetentionBoundary(match.host, original);
    const beforePeer = await readNativeRetentionBoundary(match.peer, original);
    const beforeHostEffects = await nativeDebugWorldDigest(match.host, true);
    const beforePeerEffects = await nativeDebugWorldDigest(match.peer, true);
    const beforeContinuation = await captureNativeContinuationBoundary(match.host, 3);
    await multiplayerAuthorityProbe(match.host, "redeliver");
    await multiplayerAuthorityProbe(match.peer, "redeliver");
    const afterHost = await readNativeRetentionBoundary(match.host, original);
    const afterPeer = await readNativeRetentionBoundary(match.peer, original);
    const afterHostProbe = await multiplayerAuthorityProbe(match.host), afterPeerProbe = await multiplayerAuthorityProbe(match.peer);
    const afterContinuation = await captureNativeContinuationBoundary(match.host, 3);
    return { humanClients: 2, checkpoint, original: retained.original, originalReceipt: retained.originalReceipt,
      dispatchedCount: dispatchedIds.length, dispatchedDigest: digestCanonicalAiValue(dispatchedIds),
      uniqueDispatchedCount: new Set(dispatchedIds).size, pressureActorId: actorId, hostWitness, peerWitness,
      beforeHost, beforePeer, afterHost, afterPeer, afterHostProbe, afterPeerProbe, beforeContinuation, afterContinuation,
      beforeHostEffects, beforePeerEffects, afterHostEffects: await nativeDebugWorldDigest(match.host, true),
      afterPeerEffects: await nativeDebugWorldDigest(match.peer, true),
      hostRelay: (await observeMultiplayerPeer(match.host, 3)).relay,
      peerRelay: (await observeMultiplayerPeer(match.peer, 3)).relay, aiErrors: [...aiErrors] };
  } finally { await match.dispose(); }
}
