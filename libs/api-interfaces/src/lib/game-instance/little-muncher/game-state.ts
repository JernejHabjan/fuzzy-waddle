import { BaseGameState } from "../game-state";
import { BaseData } from "../data";

export class LittleMuncherGameState extends BaseGameState<LittleMuncherGameStateData> {
  constructor(data?: LittleMuncherGameStateData) {
    super(data as LittleMuncherGameStateData);
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

export interface LittleMuncherGameStateData extends BaseData {
  climbedHeight: number;
  pause: boolean;
  score: number;
}
