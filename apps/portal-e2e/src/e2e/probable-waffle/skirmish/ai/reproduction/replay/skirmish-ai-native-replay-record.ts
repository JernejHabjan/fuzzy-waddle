import type { Page } from "@playwright/test";
import type { EncodedGameSaveRecord } from "@fuzzy-waddle/probable-waffle-protocol";

/** The untouched native codec record stays local to the replay driver; it is never included in a model-facing proof. */
export async function readNativeReplayRecord(page: Page, id: string): Promise<EncodedGameSaveRecord> {
  return page.evaluate(async (id) => {
    if (!(await indexedDB.databases()).some((database) => database.name === "probable-waffle-db"))
      throw new Error("native_replay_original_repository_missing");
    return new Promise<EncodedGameSaveRecord>((resolve, reject) => {
      const open = indexedDB.open("probable-waffle-db", 3);
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const database = open.result;
        if (!database.objectStoreNames.contains("game-saves")) {
          database.close(); reject(new Error("native_replay_original_repository_missing")); return;
        }
        const transaction = database.transaction("game-saves", "readonly");
        const request = transaction.objectStore("game-saves").get(id);
        request.onsuccess = () => {
          if (!request.result || request.result.id !== id) reject(new Error("native_replay_original_record_missing"));
          else resolve(request.result);
        };
        transaction.oncomplete = () => database.close();
        transaction.onabort = () => { database.close(); reject(transaction.error); };
      };
    });
  }, id);
}

/** Only an isolated context initialized by an actual native quicksave may receive the original encoded record. */
export async function installNativeReplayRecord(page: Page, record: EncodedGameSaveRecord, placeholderId: string) {
  await page.evaluate(async ({ record, placeholderId }) => {
    if (!(await indexedDB.databases()).some((database) => database.name === "probable-waffle-db"))
      throw new Error("native_replay_initialized_repository_missing");
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open("probable-waffle-db", 3);
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const database = open.result;
        if (!database.objectStoreNames.contains("game-saves")) {
          database.close(); reject(new Error("native_replay_initialized_repository_missing")); return;
        }
        const transaction = database.transaction("game-saves", "readwrite"), store = transaction.objectStore("game-saves");
        const existing = store.getAll();
        existing.onsuccess = () => {
          if (existing.result.length !== 1 || existing.result[0].id !== placeholderId) {
            transaction.abort(); return;
          }
          store.delete(placeholderId); store.put(record);
        };
        transaction.oncomplete = () => { database.close(); resolve(); };
        transaction.onabort = () => { database.close(); reject(transaction.error ?? new Error("native_replay_context_not_empty")); };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  }, { record, placeholderId });
}
