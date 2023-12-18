// noinspection ES6PreferShortImport
import { ProbableWaffleLevelEnum } from "../../probable-waffle/probable-waffle";

export type ProbableWaffleCommunicatorType = "score";

export interface ProbableWaffleCommunicatorScoreEvent {
  score: number;
  level: ProbableWaffleLevelEnum;
}

export enum ProbableWaffleGatewayEvent {
  ProbableWaffleAction = "probable-waffle-action"
}
