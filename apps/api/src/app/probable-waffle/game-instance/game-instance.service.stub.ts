import {
  ProbableWaffleGameInstance,
  type ProbableWaffleGameInstanceData,
  type ProbableWaffleGameInstanceMetadataData
} from "@fuzzy-waddle/api-interfaces";
import { type GameInstanceServiceInterface } from "./game-instance.service.interface";
import { User } from "@supabase/supabase-js";

export const GameInstanceServiceStub = {
  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined {
    return undefined;
  },
  createGameInstance(gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData, user: User) {
    return Promise.resolve();
  },
  getGameInstanceData(gameInstanceId: string): ProbableWaffleGameInstanceData | null {
    return null;
  },
  async stopGameInstance(gameInstanceId: string, user: User) {
    //
  }
} satisfies GameInstanceServiceInterface;
