import { ProbableWaffleMapEnum } from "@fuzzy-waddle/api-interfaces";

export interface GameSessionServiceInterface {
  createSession(params: {
    gameInstanceId: string;
    gameType: string;
    mapId: ProbableWaffleMapEnum;
    createdByUserId: string;
    humanPlayerCount: number;
  }): Promise<void>;
}
