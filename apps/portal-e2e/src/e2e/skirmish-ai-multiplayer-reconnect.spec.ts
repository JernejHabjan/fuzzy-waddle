import { expect, test, type Page } from "@playwright/test";
import { attachMultiplayerEvidence } from "./skirmish-ai-multiplayer-evidence";
import { startMultiplayerTestMatch } from "./skirmish-ai-multiplayer-match";
import { observeMultiplayerPeer, type MultiplayerPeerObservation } from "./skirmish-ai-multiplayer-observation";

test.skip(process.env.AI_MULTIPLAYER_E2E !== "1", "Requires local Supabase and the local API relay.");
test.setTimeout(180_000);

test("a disconnected peer rejoins the same match and converges with the live AI host", async ({ browser }, testInfo) => {
  const match = await startMultiplayerTestMatch(browser);
  let beforePeer: MultiplayerPeerObservation | null = null;
  let afterPeer: MultiplayerPeerObservation | null = null;
  let afterHost: MultiplayerPeerObservation | null = null;
  let resumed: Page | null = null;
  const checkpointComparisons: { tick: number; agrees: boolean }[] = [];
  try {
    await expect.poll(async () => {
      const [host, peer] = await Promise.all([
        observeMultiplayerPeer(match.host, 3), observeMultiplayerPeer(match.peer, 3)
      ]);
      beforePeer = peer;
      return host.processedAiCommandIds.some((id) => peer.processedAiCommandIds.includes(id)) &&
        host.hashes.some(({ tick, hash }) => peer.hashes.some((remote) => remote.tick === tick && remote.hash === hash));
    }, { timeout: 60_000, intervals: [1_000, 2_000] }).toBe(true);

    const lastBeforeTick = Math.max(0, ...beforePeer!.hashes.map(({ tick }) => tick));
    const sameMatchUrl = match.peer.url();
    await match.peer.close();
    resumed = await match.peerContext.newPage();
    await resumed.goto(sameMatchUrl);
    await expect(resumed).toHaveURL(/\/aota\/game/);
    await resumed.waitForFunction(() => !!(
      window as unknown as { __fuzzyWaddleAiMultiplayerBrowserTestV1?: unknown }
    ).__fuzzyWaddleAiMultiplayerBrowserTestV1);

    await expect.poll(async () => {
      const [host, peer] = await Promise.all([
        observeMultiplayerPeer(match.host, 3), observeMultiplayerPeer(resumed!, 3)
      ]);
      afterHost = host;
      afterPeer = peer;
      const hostHashes = new Map(host.hashes.map(({ tick, hash }) => [tick, hash]));
      const shared = peer.hashes.filter(({ tick }) => tick > lastBeforeTick && hostHashes.has(tick));
      for (const { tick, hash } of shared) {
        if (checkpointComparisons.some((checkpoint) => checkpoint.tick === tick)) continue;
        checkpointComparisons.push({ tick, agrees: hostHashes.get(tick) === hash });
      }
      return {
        sameScene: peer.sceneKey === host.sceneKey,
        hostStillOwnsAi: host.aiControllerPresent && !peer.aiControllerPresent,
        aiHistoryRestored: beforePeer!.processedAiCommandIds.some((id) => peer.processedAiCommandIds.includes(id)),
        sharedHashes: shared.length >= 2,
        hashesAgree: checkpointComparisons.every((checkpoint) => checkpoint.agrees)
      };
    }, { timeout: 60_000, intervals: [1_000, 2_000] }).toEqual({
      sameScene: true, hostStillOwnsAi: true, aiHistoryRestored: true, sharedHashes: true, hashesAgree: true
    });
  } finally {
    await attachMultiplayerEvidence(testInfo, {
      lobbyName: match.lobbyName,
      host: afterHost,
      peer: afterPeer,
      peerBeforeInterruption: beforePeer,
      checkpointComparisons
    });
    await match.dispose();
  }
});
