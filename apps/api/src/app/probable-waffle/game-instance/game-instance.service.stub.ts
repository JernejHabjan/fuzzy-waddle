import {
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceMetadataData
} from "@fuzzy-waddle/api-interfaces";
import { User } from "../../../users/users.service";
import { GameInstanceServiceInterface } from "./game-instance.service.interface";

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
