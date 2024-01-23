import { BaseGameState } from "../game-state";
import { BaseData } from "../data";

export class ProbableWaffleGameState extends BaseGameState<ProbableWaffleGameStateData> {
  constructor(data?: ProbableWaffleGameStateData) {
    super(data as ProbableWaffleGameStateData);
  }

  override resetData() {
    super.resetData();
    this.data = {
      actors: [],
      score: 0,
      pause: false
    };
  }
}

export interface ProbableWaffleGameStateData extends BaseData {
  actors: ActorDefinition[];
  pause: boolean;
  score: number;
}

export interface ActorDefinition extends Record<string, any> {
  name: string;
}
