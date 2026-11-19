import { ProbableWaffleGameCommandTypes } from "./probable-waffle-game-command-types";
import type { GameCommandBase } from "./game-command-base";
/** Requests the normal mode-owned concession flow for a player. */
export interface ConcedeCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.Concede;
  readonly reason: string;
}
