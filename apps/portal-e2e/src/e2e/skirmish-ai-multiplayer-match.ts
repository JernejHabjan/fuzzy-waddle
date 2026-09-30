import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { createMultiplayerTestIdentities, installMultiplayerIdentity } from "./skirmish-ai-multiplayer-auth";

export interface MultiplayerTestMatch {
  readonly host: Page;
  readonly peer: Page;
  readonly hostContext: BrowserContext;
  readonly peerContext: BrowserContext;
  readonly lobbyName: string;
  readonly dispose: () => Promise<void>;
}

async function openOnlineLobby(page: Page): Promise<void> {
  await page.goto("/aota/online");
  await expect(page.getByText("Custom Game", { exact: true })).toBeVisible();
  await page.getByText("Custom Game", { exact: true }).click();
}

async function waitForMultiplayerGame(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/aota\/game/);
  await page.waitForFunction(() => !!(
    window as unknown as { __fuzzyWaddleAiMultiplayerBrowserTestV1?: unknown }
  ).__fuzzyWaddleAiMultiplayerBrowserTestV1);
}

/** Creates an ordinary public custom lobby with two real humans and one host-owned AI. */
export async function startMultiplayerTestMatch(browser: Browser): Promise<MultiplayerTestMatch> {
  const provisioned = await createMultiplayerTestIdentities();
  const hostContext = await browser.newContext();
  const peerContext = await browser.newContext();
  const dispose = async (): Promise<void> => {
    await Promise.allSettled([hostContext.close(), peerContext.close()]);
    await provisioned.dispose();
  };
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
    await expect(host.locator(".player-card").nth(1).locator(".detail-row")
      .filter({ hasText: "Ready:" }).locator("fa-icon.text-success")).toBeVisible();
    await host.getByRole("button", { name: "Start Game" }).click();
    await Promise.all([waitForMultiplayerGame(host), waitForMultiplayerGame(peer)]);
    return { host, peer, hostContext, peerContext, lobbyName, dispose };
  } catch (error) {
    await dispose();
    throw error;
  }
}
