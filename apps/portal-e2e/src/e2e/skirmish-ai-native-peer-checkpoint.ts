import { expect } from "@playwright/test";
import type { ProbableWaffleScene } from "@fuzzy-waddle/probable-waffle-phaser/core/probable-waffle.scene";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import { digestCanonicalAiValue } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/canonical-ai-serialization";
import type { MultiplayerTestMatch } from "./skirmish-ai-multiplayer-match";
import { observeMultiplayerPeer } from "./skirmish-ai-multiplayer-observation";
import { installRuntimeAccessor } from "./skirmish-ai-runtime-browser-accessor";
import { captureNativeContinuationBoundary } from "./skirmish-ai-native-continuation-boundary";
import { installNativeTransferHooks, nativeTransferHookAction } from "./skirmish-ai-native-transfer-hooks";

/** Freeze a current host boundary and obtain its real reconnect checkpoint in an ordinary second client. */
export async function prepareNativePeerCheckpoint(match: MultiplayerTestMatch, maximumTick = 4000) {
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
  if (original.owner.tick >= maximumTick) throw new Error("native_peer_checkpoint_exceeded_original_ceiling");
  const beforePeer = await observeMultiplayerPeer(match.peer, 3);
  if (beforePeer.aiControllerPresent || new Set(beforePeer.relay.humanPlayerNumbers).size !== 2)
    throw new Error("native_profile_transfer_requires_two_distinct_real_clients");
  await installNativeTransferHooks(match.peer);
  await expect.poll(async () => (await nativeTransferHookAction(match.peer)).disconnected, { timeout: 30_000 }).toBe(true);
  await nativeTransferHookAction(match.peer, "reconnect");
  await expect.poll(async () => (await nativeTransferHookAction(match.peer)).snapshotTick,
    { timeout: 60_000 }).toBe(original.owner.tick);
  const actualSnapshot = await match.peer.evaluate(() => {
    const realm = window as unknown as { __fuzzyWaddleAiMultiplayerBrowserTestV1?: Pick<AiRuntimeBrowserTestHostV1, "game"> };
    const scene = realm.__fuzzyWaddleAiMultiplayerBrowserTestV1?.game.scene.getScenes(true)
      .find((entry) => entry.scene.key === "MapAiMultiplayer") as ProbableWaffleScene | undefined;
    const state = scene?.players.find((player) => player.playerNumber === 3)?.playerState.data.aiBehaviorTreeState;
    if (!state?.brainState || !state.controllerCadence) throw new Error("native_profile_reconnect_ai_continuation_missing");
    return { brain: state.brainState, cadence: state.controllerCadence };
  });
  return { original, snapshotBrainDigest: digestCanonicalAiValue(actualSnapshot.brain),
    snapshotCadenceDigest: digestCanonicalAiValue(actualSnapshot.cadence),
    peerEpoch: (await observeMultiplayerPeer(match.peer, 3)).relay.authorityEpoch };
}
