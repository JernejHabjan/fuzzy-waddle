import { expect, test } from "@playwright/test";
import { startMultiplayerTestMatch } from "./skirmish-ai-multiplayer-match";
import { multiplayerQueueWorld } from "./skirmish-ai-multiplayer-queue-world";
import { normalizeMultiplayerQueueBoundary } from "./skirmish-ai-multiplayer-queue-normalization";
import { observeMultiplayerPeer } from "./skirmish-ai-multiplayer-observation";
import type { AiMultiplayerQueueWorldV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-multiplayer-queue-world-v1";

test.skip(process.env.AI_MULTIPLAYER_E2E !== "1", "Requires local Supabase and the local API relay.");
test.setTimeout(180_000);

test("a relayed purchase probe is rejected while cancellation is buffered, before real refund credit on both peers",
  async ({ browser }, testInfo) => {
    const match = await startMultiplayerTestMatch(browser, { queueWorld: true });
    let host: AiMultiplayerQueueWorldV1 | null = null;
    let peer: AiMultiplayerQueueWorldV1 | null = null;
    const comparisons = new Map<number, boolean>();
    const observe = async () => {
      [host, peer] = await Promise.all([multiplayerQueueWorld(match.host), multiplayerQueueWorld(match.peer)]);
      expect(host.failure).toBeNull();
      expect(peer.failure).toBeNull();
      return [host.state, peer.state];
    };
    try {
      await expect.poll(observe, { timeout: 30_000 }).toEqual(["ready", "ready"]);
      [host, peer] = await Promise.all([multiplayerQueueWorld(match.host), multiplayerQueueWorld(match.peer)]);
      expect(host.setup).toEqual(peer.setup);
      await multiplayerQueueWorld(match.host, "start");
      await expect.poll(observe, { timeout: 45_000, intervals: [250, 500, 1000] }).toEqual(["complete", "complete"]);
      [host, peer] = await Promise.all([multiplayerQueueWorld(match.host), multiplayerQueueWorld(match.peer)]);
      const localProof = normalizeMultiplayerQueueBoundary(host, true);
      const remoteProof = normalizeMultiplayerQueueBoundary(peer, false);
      expect(localProof.failures).toEqual([]);
      expect(remoteProof.failures).toEqual([]);
      expect(host.commands).toEqual(peer.commands);
      // Sequence is observer-local; shared tick/identity/scoped cash must agree without pretending callbacks are identical.
      const sharedPayments = (proof: typeof localProof) => proof.payments.map(({ sequence, ...payment }) => {
        void sequence;
        return payment;
      });
      expect(sharedPayments(localProof)).toEqual(sharedPayments(remoteProof));
      expect(host.checkpoints.filter((entry) => entry.boundary !== "cancel_pending"))
        .toEqual(peer.checkpoints);
      await testInfo.attach("skirmish-multiplayer-queue-normalized.json", {
        body: Buffer.from(JSON.stringify({ kind: "shared_queue_authority_boundary", localProof, remoteProof,
          limitations: ["AI strategy and full PRO-07 acceptance remain separate"] })), contentType: "application/json"
      });
      const completionTick = host.checkpoints.find((entry) => entry.boundary === "complete")?.snapshot.tick ?? Infinity;
      await expect.poll(async () => {
        const [local, remote] = await Promise.all([
          observeMultiplayerPeer(match.host, 3), observeMultiplayerPeer(match.peer, 3)
        ]);
        const hashes = new Map(remote.hashes.map(({ tick, hash }) => [tick, hash]));
        for (const { tick, hash } of local.hashes) {
          if (tick > completionTick && hashes.has(tick)) comparisons.set(tick, hashes.get(tick) === hash);
        }
        expect([...comparisons.values()]).not.toContain(false);
        return { relay: local.relay.active && remote.relay.active, sharedTicks: comparisons.size >= 2 };
      }, { timeout: 20_000, intervals: [500, 1000] }).toEqual({ relay: true, sharedTicks: true });
    } finally {
      try {
        await testInfo.attach("skirmish-multiplayer-queue-raw.json", {
          body: Buffer.from(JSON.stringify({ schemaVersion: 1, lobbyName: match.lobbyName, host, peer,
            checkpointComparisons: [...comparisons].slice(-16) })), contentType: "application/json"
        });
      } finally {
        await match.dispose();
      }
    }
  });
