import { expect, test } from "@playwright/test";
import { observeMultiplayerPeer } from "./skirmish-ai-multiplayer-observation";
import type { MultiplayerPeerObservation } from "./skirmish-ai-multiplayer-observation";
import { attachMultiplayerEvidence } from "./skirmish-ai-multiplayer-evidence";
import { startMultiplayerTestMatch } from "./skirmish-ai-multiplayer-match";

test.skip(process.env.AI_MULTIPLAYER_E2E !== "1", "Requires local Supabase and the local API relay.");
test.setTimeout(180_000);

test("two authenticated peers run the real relay while only the host owns skirmish AI", async ({ browser }, testInfo) => {
  const match = await startMultiplayerTestMatch(browser);
  const evidence: {
    lobbyName: string;
    host: MultiplayerPeerObservation | null;
    peer: MultiplayerPeerObservation | null;
    checkpointComparisons: { tick: number; agrees: boolean }[];
  } = { lobbyName: match.lobbyName, host: null, peer: null, checkpointComparisons: [] };
  try {
    await expect.poll(async () => {
      const [local, remote] = await Promise.all([
        observeMultiplayerPeer(match.host, 3), observeMultiplayerPeer(match.peer, 3)
      ]);
      evidence.host = local;
      evidence.peer = remote;
      const remoteHashes = new Map(remote.hashes.map(({ tick, hash }) => [tick, hash]));
      const shared = local.hashes.filter(({ tick }) => remoteHashes.has(tick));
      for (const { tick, hash } of shared) {
        if (evidence.checkpointComparisons.some((checkpoint) => checkpoint.tick === tick)) continue;
        evidence.checkpointComparisons.push({ tick, agrees: remoteHashes.get(tick) === hash });
      }
      const remoteAiCommands = new Set(remote.processedAiCommandIds);
      return {
        relay: local.relay.active && remote.relay.active,
        humans: local.relay.humanPlayerNumbers.length === 2 && remote.relay.humanPlayerNumbers.length === 2,
        hostOwnsAi: local.aiControllerPresent && !remote.aiControllerPresent,
        relayedAiCommand: local.processedAiCommandIds.some((id) => remoteAiCommands.has(id)),
        sharedHashes: shared.length >= 2,
        hashesAgree: evidence.checkpointComparisons.every((checkpoint) => checkpoint.agrees)
      };
    }, { timeout: 60_000, intervals: [1_000, 2_000] }).toEqual({
      relay: true, humans: true, hostOwnsAi: true, relayedAiCommand: true,
      sharedHashes: true, hashesAgree: true
    });
  } finally {
    await attachMultiplayerEvidence(testInfo, evidence);
    await match.dispose();
  }
});
