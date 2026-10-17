import type { ObjectNames } from "./object-names";

import { ProbableWaffleGameCommandTypes } from "./probable-waffle-game-command-types";
import type { GameCommandBase } from "./game-command-base";
export interface ProductionCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.Production;
  readonly actorName: ObjectNames;
}
