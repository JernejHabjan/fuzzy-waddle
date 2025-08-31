import {
  ProbableWaffleGameInstance,
  type ProbableWaffleGameInstanceData,
  type ProbableWaffleGameInstanceMetadataData
} from "@fuzzy-waddle/api-interfaces";
import { type User } from "../../../users/users.service";
import { type GameInstanceServiceInterface } from "./game-instance.service.interface";

export const GameInstanceServiceStub = {
  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined {
    return undefined;
  },
  createGameInstance(gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData, user: User) {
    //
  },
  getGameInstanceData(gameInstanceId: string): ProbableWaffleGameInstanceData | null {
    return null;
  },
  async stopGameInstance(gameInstanceId: string, user: User) {
    //
  }
} satisfies GameInstanceServiceInterface;
