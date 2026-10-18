import type { SyncGameSaveDto } from "./game-save.dto";
import type { GameSaveServerServiceInterface } from "./game-save.service.interface";

export const GameSaveServerServiceStub = {
  list: async (_userId: string) => [],
  upsert: async (_userId: string, _dto: SyncGameSaveDto) => undefined
} satisfies GameSaveServerServiceInterface;
