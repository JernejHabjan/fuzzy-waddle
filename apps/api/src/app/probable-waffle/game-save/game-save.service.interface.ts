import type { SyncGameSaveDto } from "./game-save.dto";

/** Authenticated persistence operations for encoded game saves. */
export interface GameSaveServerServiceInterface {
  list(userId: string): Promise<unknown>;
  upsert(userId: string, dto: SyncGameSaveDto): Promise<unknown>;
}
