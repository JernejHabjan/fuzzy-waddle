import { ProbableWaffleGameCommandTypes } from "./probable-waffle-game-command-types";
import type { GameCommandBase } from "./game-command-base";
export interface CancelProductionCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.CancelProduction;
  readonly queueIndex: number;
}
