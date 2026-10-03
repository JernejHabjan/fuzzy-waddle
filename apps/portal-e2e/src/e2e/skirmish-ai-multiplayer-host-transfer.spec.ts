import { expect, test } from "@playwright/test";
import { attachMultiplayerEvidence } from "./skirmish-ai-multiplayer-evidence";
import { startMultiplayerTestMatch } from "./skirmish-ai-multiplayer-match";
import { observeMultiplayerPeer, type MultiplayerPeerObservation } from "./skirmish-ai-multiplayer-observation";

test.skip(process.env.AI_MULTIPLAYER_E2E !== "1", "Requires local Supabase and the local API relay.");
test.setTimeout(180_000);

test("a real host disconnect promotes the remaining peer's AI authority", async ({ browser }, testInfo) => {
  const match = await startMultiplayerTestMatch(browser);
  let beforeHost: MultiplayerPeerObservation | null = null;
  let beforePeer: MultiplayerPeerObservation | null = null;
  let afterPeer: MultiplayerPeerObservation | null = null;
  try {
    await expect.poll(async () => {
      beforeHost = await observeMultiplayerPeer(match.host, 3);
      return beforeHost.processedAiCommandIds.length;
    }, { timeout: 60_000, intervals: [1_000, 2_000] }).toBeGreaterThan(0);
    const previousEpoch = beforeHost!.relay.authorityEpoch;
    await expect.poll(async () => {
      beforePeer = await observeMultiplayerPeer(match.peer, 3);
      const hostCommands = new Set(beforeHost!.processedAiCommandIds);
      return beforePeer.processedAiCommandIds.some((id) => hostCommands.has(id));
    }, { timeout: 30_000, intervals: [500, 1_000] }).toBe(true);
    const priorPeerCommands = new Set(beforePeer.processedAiCommandIds);
    await match.hostContext.close();
    await expect.poll(async () => {
      const observed = await observeMultiplayerPeer(match.peer, 3);
      afterPeer = observed;
      return {
        relayActive: observed.relay.active,
        promotedAi: observed.aiControllerPresent,
        epochAdvanced: observed.relay.authorityEpoch > previousEpoch,
        continuedAiCommand: observed.processedAiCommandIds.some((id) =>
          !priorPeerCommands.has(id) && id.startsWith(`3:${observed.relay.authorityEpoch}:`)
        )
      };
    }, { timeout: 60_000, intervals: [500, 1_000] }).toEqual({
      relayActive: true, promotedAi: true, epochAdvanced: true, continuedAiCommand: true
    });
  } finally {
    await attachMultiplayerEvidence(testInfo, {
      lobbyName: match.lobbyName,
      host: beforeHost,
      peer: afterPeer,
      peerBeforeInterruption: beforePeer,
      checkpointComparisons: []
    });
    await match.dispose();
  }
});
