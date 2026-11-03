import { expect, type Page } from "@playwright/test";
import type { GameInstanceClientService } from
  "@fuzzy-waddle/probable-waffle-interface/communicators/game-instance-client.service";

/** Fix the seed through the real lobby metadata relay and wait for both clients; never patch either local world. */
export async function setMultiplayerLobbySeed(host: Page, peer: Page, seed: number) {
  if (!Number.isSafeInteger(seed) || seed < 0) throw new Error("native_peer_seed_invalid");
  await host.evaluate(async (seed) => {
    const element = document.querySelector("probable-waffle-lobby");
    const debug = (window as unknown as { ng?: { getComponent(element: Element): unknown } }).ng;
    const component = element && debug?.getComponent(element) as {
      gameInstanceClientService?: Pick<GameInstanceClientService, "gameInstanceMetadataChanged"> } | null;
    if (!component?.gameInstanceClientService) throw new Error("native_peer_lobby_metadata_owner_unavailable");
    await component.gameInstanceClientService.gameInstanceMetadataChanged("rndSeed", { rndSeed: seed });
  }, seed);
  for (const page of [host, peer]) await expect.poll(() => page.evaluate(() => {
    const element = document.querySelector("probable-waffle-lobby");
    const debug = (window as unknown as { ng?: { getComponent(element: Element): unknown } }).ng;
    const component = element && debug?.getComponent(element) as {
      gameInstanceClientService?: Pick<GameInstanceClientService, "gameInstance"> } | null;
    return component?.gameInstanceClientService?.gameInstance?.gameInstanceMetadata.data.rndSeed;
  }), { timeout: 30_000 }).toBe(seed);
}
