import { BaseGameState, type BaseData } from "@fuzzy-waddle/platform-game-sessions";

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
