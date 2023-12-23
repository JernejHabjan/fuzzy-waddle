// noinspection ES6PreferShortImport
import { ProbableWaffleMapEnum } from "../../probable-waffle/probable-waffle";

export type ProbableWaffleCommunicatorType = "score";

export interface ProbableWaffleCommunicatorScoreEvent {
  score: number;
  level: ProbableWaffleMapEnum;
}

export enum ProbableWaffleGatewayEvent {
  ProbableWaffleRoom = "probable-waffle-room",
  ProbableWaffleAction = "probable-waffle-action"
}
