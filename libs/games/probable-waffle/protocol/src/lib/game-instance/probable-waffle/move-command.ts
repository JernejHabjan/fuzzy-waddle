import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";

import { ProbableWaffleGameCommandTypes } from "./probable-waffle-game-command-types";
import type { GameCommandBase } from "./game-command-base";
export interface MoveCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.Move;
  readonly tileVec3: Vector3Simple;
  readonly worldVec3: Vector3Simple;
  readonly queue: boolean;
}
