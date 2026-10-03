import { FlySquasherLevelEnum } from "../../fly-squasher/fly-squasher";

export type FlySquasherCommunicatorType = "score";

export interface FlySquasherCommunicatorScoreEvent {
  score: number;
  level: FlySquasherLevelEnum;
}

export enum FlySquasherGatewayEvent {
  FlySquasherAction = "fly-squasher-action"
}
