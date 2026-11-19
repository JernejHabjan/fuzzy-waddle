import type { ResearchType } from "./research-type";
import { ProbableWaffleGameCommandTypes } from "./probable-waffle-game-command-types";
import type { GameCommandBase } from "./game-command-base";
export interface ResearchCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.Research;
  readonly researchType: ResearchType;
}
