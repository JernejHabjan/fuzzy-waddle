import { ProbableWaffleMapEnum } from "@fuzzy-waddle/probable-waffle-protocol";

export interface GameSessionServiceInterface {
  createSession(params: {
    gameInstanceId: string;
    gameType: string;
    mapId: ProbableWaffleMapEnum;
    createdByUserId: string;
    humanPlayerCount: number;
  }): Promise<void>;
}
