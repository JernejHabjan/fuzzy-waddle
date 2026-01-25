import {
  GameInstanceId,
  ProbableWaffleGameInstance,
  type ProbableWaffleGameInstanceData,
  type ProbableWaffleGameInstanceMetadataData
} from "@fuzzy-waddle/api-interfaces";
import { type GameInstanceServiceInterface } from "./game-instance.service.interface";
import { User } from "@supabase/supabase-js";

export const GameInstanceServiceStub = {
  findGameInstance(gameInstanceId: GameInstanceId): ProbableWaffleGameInstance | undefined {
    return undefined;
  },
  createGameInstance(gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData, user: User) {
    return Promise.resolve();
  },
  getGameInstanceData(gameInstanceId: GameInstanceId): ProbableWaffleGameInstanceData | null {
    return null;
  },
  async stopGameInstance(gameInstanceId: GameInstanceId, user: User) {
    //
  }
} satisfies GameInstanceServiceInterface;
