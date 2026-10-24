import { expect, test } from "@playwright/test";
import { startMultiplayerTestMatch } from "./skirmish-ai-multiplayer-match";
import { multiplayerAuthorityProbe } from "./skirmish-ai-multiplayer-authority-probe";
import { observeMultiplayerPeer } from "./skirmish-ai-multiplayer-observation";

test.skip(process.env.AI_MULTIPLAYER_E2E !== "1", "Requires local Supabase and the real API relay.");
test.setTimeout(180_000);
type AuthorityProbeSnapshot = Awaited<ReturnType<typeof multiplayerAuthorityProbe>>;

/** H-08 host branch only; cancellation/timeout, codec continuation and second-match branches remain separate obligations. */
test("an original applied AI command cannot reapply after real host promotion", async ({ browser }, testInfo) => {
  const match = await startMultiplayerTestMatch(browser, { authorityProbe: true });
  let before: AuthorityProbeSnapshot | null = null;
  let after: AuthorityProbeSnapshot | null = null;
  try {
    await expect.poll(async () => {
      try {
        before = await multiplayerAuthorityProbe(match.peer, "pin");
        return before.original !== null && before.active && before.applications === 1 && before.failure === null;
      } catch (error) {
        if (String(error).includes("actual_linked_ai_work_missing")) return false;
        throw error;
      }
    }, { timeout: 60_000, intervals: [250, 500] }).toBe(true);
    const pinned = await multiplayerAuthorityProbe(match.peer);
    expect(pinned.original?.source).toBe("ai");
    expect(pinned.original?.intentId).toBeTruthy();
    expect(pinned.original?.effectId).toBeTruthy();
    await match.hostContext.close();
    await expect.poll(async () => {
      const peer = await observeMultiplayerPeer(match.peer, 3);
      return peer.aiControllerPresent && peer.relay.authorityEpoch > pinned.authorityEpoch;
    }, { timeout: 60_000, intervals: [500, 1000] }).toBe(true);
    after = await multiplayerAuthorityProbe(match.peer, "redeliver");
    expect(after.failure).toBeNull();
    expect(after.original).toEqual(pinned.original);
    expect(after.applications).toBe(pinned.applications);
    expect(after.outcomes).toContainEqual(expect.objectContaining({
      commandId: pinned.original?.commandId, kind: "rejected", reason: "stale_authority_epoch",
      authorityEpoch: pinned.original?.authorityEpoch, sequence: pinned.original?.sequence
    }));
    const countBefore = (await observeMultiplayerPeer(match.peer, 3)).processedAiCommandIds;
    await expect.poll(async () => (await observeMultiplayerPeer(match.peer, 3)).processedAiCommandIds
      .some((id) => !countBefore.includes(id)), { timeout: 30_000 }).toBe(true);
  } finally {
    try {
      await testInfo.attach("original-ai-host-fence.json", { body: Buffer.from(JSON.stringify({ before, after,
        limitations: ["One H-08 native branch; not complete scenario acceptance, payment proof or H-31/H-32"] })),
        contentType: "application/json" });
    } finally { await match.dispose(); }
  }
});
