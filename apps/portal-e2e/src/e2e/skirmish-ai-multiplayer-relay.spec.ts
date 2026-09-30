import { expect, test, type Page } from "@playwright/test";
import { createMultiplayerTestIdentities, installMultiplayerIdentity } from "./skirmish-ai-multiplayer-auth";
import { observeMultiplayerPeer } from "./skirmish-ai-multiplayer-observation";

test.skip(process.env.AI_MULTIPLAYER_E2E !== "1", "Requires local Supabase and the local API relay.");
test.setTimeout(180_000);

async function openOnlineLobby(page: Page): Promise<void> {
  await page.goto("/aota/online");
  await expect(page.getByText("Custom Game", { exact: true })).toBeVisible();
  await page.getByText("Custom Game", { exact: true }).click();
}

test("two authenticated peers run the real relay while only the host owns skirmish AI", async ({ browser }) => {
  const provisioned = await createMultiplayerTestIdentities();
  const hostContext = await browser.newContext();
  const peerContext = await browser.newContext();
  try {
    await installMultiplayerIdentity(hostContext, provisioned.identities[0]);
    await installMultiplayerIdentity(peerContext, provisioned.identities[1]);
    const host = await hostContext.newPage();
    const peer = await peerContext.newPage();
    const lobbyName = `ai-relay-${Date.now()}`;

    await openOnlineLobby(host);
    await host.getByText("Create a game", { exact: true }).click();
    await host.getByLabel("Lobby Name").fill(lobbyName);
    await host.getByRole("button", { name: "Create Lobby" }).click();
    await expect(host).toHaveURL(/\/aota\/lobby/);
    await host.getByText("AI Multiplayer (test only)", { exact: true }).click();
    await host.getByRole("button", { name: /Open player space/ }).click();
    await host.getByRole("button", { name: /Add A\.I\. player/ }).click();

    await openOnlineLobby(peer);
    await peer.getByRole("row", { name: new RegExp(lobbyName) }).click();
    await peer.getByRole("button", { name: "Join", exact: true }).click();
    await expect(peer).toHaveURL(/\/aota\/lobby/);
    await peer.getByRole("button", { name: "Mark as Ready" }).click();
    await host.getByRole("button", { name: "Start Game" }).click();
    await Promise.all([expect(host).toHaveURL(/\/aota\/game/), expect(peer).toHaveURL(/\/aota\/game/)]);
    await Promise.all([host.waitForFunction(() => !!(
      window as unknown as { __fuzzyWaddleAiMultiplayerBrowserTestV1?: unknown }
    ).__fuzzyWaddleAiMultiplayerBrowserTestV1), peer.waitForFunction(() => !!(
      window as unknown as { __fuzzyWaddleAiMultiplayerBrowserTestV1?: unknown }
    ).__fuzzyWaddleAiMultiplayerBrowserTestV1)]);

    await expect.poll(async () => {
      const [local, remote] = await Promise.all([
        observeMultiplayerPeer(host, 3), observeMultiplayerPeer(peer, 3)
      ]);
      const remoteHashes = new Map(remote.hashes.map(({ tick, hash }) => [tick, hash]));
      const shared = local.hashes.filter(({ tick }) => remoteHashes.has(tick));
      const remoteAiCommands = new Set(remote.processedAiCommandIds);
      return {
        relay: local.relay.active && remote.relay.active,
        humans: local.relay.humanPlayerNumbers.length === 2 && remote.relay.humanPlayerNumbers.length === 2,
        hostOwnsAi: local.aiControllerPresent && !remote.aiControllerPresent,
        relayedAiCommand: local.processedAiCommandIds.some((id) => remoteAiCommands.has(id)),
        sharedHashes: shared.length >= 2,
        hashesAgree: shared.every(({ tick, hash }) => remoteHashes.get(tick) === hash)
      };
    }, { timeout: 60_000, intervals: [1_000, 2_000] }).toEqual({
      relay: true, humans: true, hostOwnsAi: true, relayedAiCommand: true,
      sharedHashes: true, hashesAgree: true
    });
  } finally {
    await Promise.allSettled([hostContext.close(), peerContext.close()]);
    await provisioned.dispose();
  }
});
