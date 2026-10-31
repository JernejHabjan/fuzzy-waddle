import { expect, test } from "@playwright/test";
import { attachMultiplayerEvidence } from "./skirmish-ai-multiplayer-evidence";
import { startMultiplayerTestMatch } from "./skirmish-ai-multiplayer-match";
import { observeMultiplayerPeer, type MultiplayerPeerObservation } from "./skirmish-ai-multiplayer-observation";

test.skip(process.env.AI_MULTIPLAYER_E2E !== "1", "Requires local Supabase and the local API relay.");
test.setTimeout(180_000);

test("a real host disconnect promotes the remaining peer's AI authority", async ({ browser }, testInfo) => {
  const match = await startMultiplayerTestMatch(browser);
  const before: { host: MultiplayerPeerObservation | null; peer: MultiplayerPeerObservation | null } = {
    host: null,
    peer: null
  };
  let afterPeer: MultiplayerPeerObservation | null = null;
  try {
    await expect
      .poll(
        async () => {
          before.host = await observeMultiplayerPeer(match.host, 3);
          return before.host.processedAiCommandIds.length;
        },
        { timeout: 60_000, intervals: [1_000, 2_000] }
      )
      .toBeGreaterThan(0);
    if (!before.host) throw new Error("multiplayer_host_observation_missing");
    const previousEpoch = before.host.relay.authorityEpoch;
    const hostCommands = new Set(before.host.processedAiCommandIds);
    await expect
      .poll(
        async () => {
          before.peer = await observeMultiplayerPeer(match.peer, 3);
          return before.peer.processedAiCommandIds.some((id) => hostCommands.has(id));
        },
        { timeout: 30_000, intervals: [500, 1_000] }
      )
      .toBe(true);
    if (!before.peer) throw new Error("multiplayer_peer_observation_missing");
    const priorPeerCommands = new Set(before.peer.processedAiCommandIds);
    await match.hostContext.close();
    await expect
      .poll(
        async () => {
          const observed = await observeMultiplayerPeer(match.peer, 3);
          afterPeer = observed;
          return {
            relayActive: observed.relay.active,
            promotedAi: observed.aiControllerPresent,
            epochAdvanced: observed.relay.authorityEpoch > previousEpoch,
            continuedAiCommand: observed.processedAiCommandIds.some(
              (id) => !priorPeerCommands.has(id) && id.startsWith(`3:${observed.relay.authorityEpoch}:`)
            )
          };
        },
        { timeout: 60_000, intervals: [500, 1_000] }
      )
      .toEqual({
        relayActive: true,
        promotedAi: true,
        epochAdvanced: true,
        continuedAiCommand: true
      });
  } finally {
    await attachMultiplayerEvidence(testInfo, {
      lobbyName: match.lobbyName,
      host: before.host,
      peer: afterPeer,
      peerBeforeInterruption: before.peer,
      checkpointComparisons: []
    });
    await match.dispose();
  }
});
