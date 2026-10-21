import { expect, type Page } from "@playwright/test";
import type { AiRuntimeBrowserTestHostV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-browser-test-host-v1";
import { openNativeGameAction } from "./skirmish-ai-native-game-menu";
import { installRuntimeAccessor } from "./skirmish-ai-runtime-browser-accessor";
import { ProbableWaffleGameInstanceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type GameProbableWaffleScene from
  "@fuzzy-waddle/probable-waffle-phaser/world/scenes/GameProbableWaffleScene";

/** Native shortcut -> renderer snapshot -> encrypted repository. The original world can continue before reload. */
export async function saveNativeMatch(page: Page, playerNumber: number) {
  const previous = await readNativeQuicksaveHeaders(page);
  const boundary = await page.evaluate(({ playerNumber, supportedType }) => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1;
      __nativeSavedGameOwner?: AiRuntimeBrowserTestHostV1["game"]; __nativeSaveRealm?: string };
    const host = realm.__fuzzyWaddleAiRuntimeBrowserTestV1;
    const parts = window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber);
    if (!host || !parts) throw new Error("native_save_original_owner_missing");
    const scene = host.game.scene.getScenes(true).find((entry) => entry.scene.key.startsWith("Map")) as
      GameProbableWaffleScene | undefined;
    if (scene?.baseGameData.gameInstance.gameInstanceMetadata.data.type !== supportedType)
      throw new Error("native_save_requires_single_player_skirmish");
    parts.tickService.pauseTick("manual");
    host.game.loop.wake();
    realm.__nativeSavedGameOwner = host.game;
    realm.__nativeSaveRealm = crypto.randomUUID();
    return { tick: parts.tickService.currentTick, realmId: realm.__nativeSaveRealm };
  }, { playerNumber, supportedType: ProbableWaffleGameInstanceType.Skirmish });
  await page.keyboard.press("Control+s");
  await expect.poll(async () => {
    const headers = await readNativeQuicksaveHeaders(page);
    return headers.some((entry) => !previous.some((old) => old.id === entry.id && old.revision === entry.revision));
  }, { timeout: 30_000 }).toBe(true);
  const saved = (await readNativeQuicksaveHeaders(page)).find((entry) =>
    !previous.some((old) => old.id === entry.id && old.revision === entry.revision));
  if (!saved) throw new Error("native_encrypted_quicksave_missing");
  return { ...boundary, saveId: saved.id, revision: saved.revision };
}

/** Ordinary Load UI replaces Phaser in the retained realm, returning to the actual stored nonzero clock. */
export async function reloadNativeMatch(
  page: Page, playerNumber: number, boundary: Awaited<ReturnType<typeof saveNativeMatch>>
) {
  await openNativeGameAction(page, "load");
  // A fresh runtime context owns exactly one quicksave. Never silently load another row from a reused profile.
  const row = page.locator(".aota-save-row").filter({ hasText: "Quick Save" });
  await expect(row).toHaveCount(1);
  await row.getByRole("button", { name: "Load", exact: true }).click();
  await page.waitForFunction(() => {
    const realm = window as unknown as { __fuzzyWaddleAiRuntimeBrowserTestV1?: AiRuntimeBrowserTestHostV1;
      __nativeSavedGameOwner?: AiRuntimeBrowserTestHostV1["game"] };
    const current = realm.__fuzzyWaddleAiRuntimeBrowserTestV1;
    return !!current && current.game !== realm.__nativeSavedGameOwner;
  }, undefined, { timeout: 120_000 });
  await installRuntimeAccessor(page);
  await page.waitForFunction(({ playerNumber, tick }) =>
    window.__fuzzyWaddleAiRuntimePartsV1?.(playerNumber)?.tickService.currentTick === tick,
  { playerNumber, tick: boundary.tick }, { timeout: 30_000 });
  const sameRealm = await page.evaluate((realmId) => {
    const realm = window as unknown as { __nativeSaveRealm?: string; __nativeSavedGameOwner?: unknown };
    const same = realm.__nativeSaveRealm === realmId;
    delete realm.__nativeSavedGameOwner;
    return same;
  }, boundary.realmId);
  if (!sameRealm) throw new Error("native_save_reload_replaced_browser_realm");
  return { ...boundary, sameRealm };
}

export async function saveAndReloadNativeMatch(page: Page, playerNumber: number) {
  return reloadNativeMatch(page, playerNumber, await saveNativeMatch(page, playerNumber));
}

/** Read metadata only; decoding and migration must still run through the actual game save service on Load. */
async function readNativeQuicksaveHeaders(page: Page): Promise<{ id: string; revision: number }[]> {
  return page.evaluate(async () => {
    const databases = await indexedDB.databases();
    if (!databases.some((database) => database.name === "probable-waffle-db")) return [];
    return new Promise<{ id: string; revision: number }[]>((resolve, reject) => {
      const open = indexedDB.open("probable-waffle-db", 3);
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const database = open.result;
        const transaction = database.transaction("game-saves", "readonly");
        const read = transaction.objectStore("game-saves").getAll();
        transaction.oncomplete = () => database.close();
        transaction.onabort = () => { database.close(); reject(transaction.error); };
        read.onerror = () => reject(read.error);
        read.onsuccess = () => resolve((read.result as { id: string; revision: number; kind: string;
          syncState: string; encodedGameInstanceData?: unknown }[])
          .filter((record) => record.kind === "quicksave" && record.syncState !== "deleted" && !!record.encodedGameInstanceData)
          .map(({ id, revision }) => ({ id, revision })));
      };
    });
  });
}
