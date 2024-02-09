import { BaseGameState } from "../game-state";
import { BaseData } from "../data";

export class FlySquasherGameState extends BaseGameState<FlySquasherGameStateData> {
  constructor(data?: FlySquasherGameStateData) {
    super(data as FlySquasherGameStateData);
  }

  override resetData() {
    super.resetData();
    this.data = {
      climbedHeight: 0,
      score: 0,
      pause: false
    };
  }
}

export interface FlySquasherGameStateData extends BaseData {
  climbedHeight: number;
  pause: boolean;
  score: number;
}
