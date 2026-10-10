import { ProbableWaffleGameCommandTypes } from "./probable-waffle-game-command-types";
import type { GameCommandBase } from "./game-command-base";
export interface StopCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.Stop;
}
