import { ProbableWaffleLevelEnum } from "./probable-waffle";

export interface ProbableWaffleGameCreate {
  level: ProbableWaffleLevelEnum;
  player_ids: string[];
}

export interface ProbableWaffleGameCreateDto extends ProbableWaffleGameCreate {
  gameInstanceId: string;
}
