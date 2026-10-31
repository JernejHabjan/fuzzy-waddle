import { BasePlayerState } from "@fuzzy-waddle/platform-game-sessions";
import { ResourceType } from "../../probable-waffle/resource-type-definition";
import type { ProbableWafflePlayerStateData } from "./probable-waffle-player-state-data";
import { PlayerResourceObservation } from "./player-resource-observation";

export class ProbableWafflePlayerState extends BasePlayerState<ProbableWafflePlayerStateData> {
  constructor(data?: ProbableWafflePlayerStateData) {
    super(data as ProbableWafflePlayerStateData);
  }

  override resetData() {
    PlayerResourceObservation.reset(this);
    super.resetData();
    this.data = {
      resources: {
        [ResourceType.Food]: 200,
        [ResourceType.Wood]: 200,
        [ResourceType.Stone]: 200,
        [ResourceType.Minerals]: 200
      },
      housing: {
        currentHousing: 0,
        maxHousing: 0
      },
      summary: [],
      selection: []
    };
  }
}
