import { ProbableWaffleMapEnum } from "@fuzzy-waddle/api-interfaces";
import { GameSessionServiceInterface } from "./game-session.service.interface";

export const gameSessionServiceStub = {
  createSession: function (params: {
    gameInstanceId: string;
    gameType: string;
    mapId: ProbableWaffleMapEnum;
    createdByUserId: string;
    humanPlayerCount: number;
  }): Promise<void> {
    return Promise.resolve();
  }
} satisfies GameSessionServiceInterface;
