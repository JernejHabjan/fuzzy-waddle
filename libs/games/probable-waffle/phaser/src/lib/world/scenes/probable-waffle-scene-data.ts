import type { ProbableWaffleGameData } from "../../core/probable-waffle-game-data";
import { BehaviorSubject } from "rxjs";

export interface ProbableWaffleSceneData {
  baseGameData: ProbableWaffleGameData;
  systems: any[];
  components: any[];
  services: any[];
  initializers: {
    sceneInitialized: BehaviorSubject<boolean>;
  };
}
