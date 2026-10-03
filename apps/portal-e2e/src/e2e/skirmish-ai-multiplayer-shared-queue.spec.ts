import { expect, test } from "@playwright/test";
import { startMultiplayerTestMatch } from "./skirmish-ai-multiplayer-match";
import { multiplayerSharedQueueWorld } from "./skirmish-ai-multiplayer-shared-queue-world";
import { normalizeMultiplayerSharedQueueWorld } from "./skirmish-ai-multiplayer-shared-queue-normalization";
import { observeMultiplayerPeer } from "./skirmish-ai-multiplayer-observation";
import type { AiMultiplayerSharedQueueWorldV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-multiplayer-shared-queue-world-v1";

test.skip(process.env.AI_MULTIPLAYER_E2E !== "1", "Requires local Supabase and the local API relay.");
test.setTimeout(180_000);

for (const branch of ["shared_contention", "cancel_research"] as const) {
  test(`distinct shared queue authority world: ${branch}`, async ({ browser }, testInfo) => {
    const match = await startMultiplayerTestMatch(browser, { sharedQueueWorld: branch });
    let host: AiMultiplayerSharedQueueWorldV1 | null = null;
    let peer: AiMultiplayerSharedQueueWorldV1 | null = null;
    const comparisons = new Map<number, boolean>();
    const read = async () => {
      [host, peer] = await Promise.all([multiplayerSharedQueueWorld(match.host), multiplayerSharedQueueWorld(match.peer)]);
      expect(host.failure).toBeNull();
      expect(peer.failure).toBeNull();
      return [host.state, peer.state];
    };
    try {
      await expect.poll(read, { timeout: 30_000 }).toEqual(["ready", "ready"]);
      [host, peer] = await Promise.all([multiplayerSharedQueueWorld(match.host), multiplayerSharedQueueWorld(match.peer)]);
      expect(host.setup).toEqual(peer.setup);
      await multiplayerSharedQueueWorld(match.host, "start");
      await expect.poll(read, { timeout: 90_000, intervals: [250, 500, 1000] }).toEqual(["complete", "complete"]);
      [host, peer] = await Promise.all([multiplayerSharedQueueWorld(match.host), multiplayerSharedQueueWorld(match.peer)]);
      const localProof = normalizeMultiplayerSharedQueueWorld(host, true);
      const remoteProof = normalizeMultiplayerSharedQueueWorld(peer, false);
      expect(localProof.failures).toEqual([]);
      expect(remoteProof.failures).toEqual([]);
      expect(host.commands).toEqual(peer.commands);
      expect(peer.requests).toEqual([]);
      const sharedPayments = (proof: typeof localProof) => proof.payments.map(({ sequence, resource, tick }) => {
        void sequence;
        // Operation IDs and observer sequence are capture-local. Stamped commands/items and actual cash must match.
        const { operationId, ...emission } = resource.emission;
        void operationId;
        return { tick, resource: { ...resource, emission } };
      });
      expect(sharedPayments(localProof)).toEqual(sharedPayments(remoteProof));
      expect(host.checkpoints.filter((entry) => entry.boundary !== "cancel_pending")).toEqual(peer.checkpoints);
      expect(localProof).not.toHaveProperty("productionEvidence");
      await testInfo.attach(`shared-queue-${branch}-normalized.json`, {
        body: Buffer.from(JSON.stringify({ localProof, remoteProof,
          limitations: ["Human shared authority only; committed AI strategy and both-faction PRO-07 remain unproven"] })),
        contentType: "application/json"
      });
      const stableTick = host.checkpoints.find((entry) => entry.boundary === "stable")?.snapshot.tick ?? Infinity;
      await expect.poll(async () => {
        const [local, remote] = await Promise.all([
          observeMultiplayerPeer(match.host, 3), observeMultiplayerPeer(match.peer, 3)
        ]);
        const hashes = new Map(remote.hashes.map(({ tick, hash }) => [tick, hash]));
        for (const { tick, hash } of local.hashes) {
          if (tick > stableTick && hashes.has(tick)) comparisons.set(tick, hash === hashes.get(tick));
        }
        expect([...comparisons.values()]).not.toContain(false);
        return { relay: local.relay.active && remote.relay.active, matched: comparisons.size >= 2 };
      }, { timeout: 20_000, intervals: [500, 1000] }).toEqual({ relay: true, matched: true });
    } finally {
      try {
        await testInfo.attach(`shared-queue-${branch}-raw.json`, {
          body: Buffer.from(JSON.stringify({ host, peer, comparisons: [...comparisons].slice(-16) })),
          contentType: "application/json"
        });
      } finally { await match.dispose(); }
    }
  });
}
