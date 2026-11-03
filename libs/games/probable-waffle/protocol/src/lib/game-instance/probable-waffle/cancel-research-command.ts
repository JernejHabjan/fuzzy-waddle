import { ProbableWaffleGameCommandTypes } from "./probable-waffle-game-command-types";
import type { GameCommandBase } from "./game-command-base";
export interface CancelResearchCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.CancelResearch;
}
