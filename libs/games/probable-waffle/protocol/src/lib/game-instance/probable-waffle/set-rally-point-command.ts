import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";

import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";

import { ProbableWaffleGameCommandTypes } from "./probable-waffle-game-command-types";
import type { GameCommandBase } from "./game-command-base";
/** Sets a producer's deterministic spawn rally destination. */
export interface SetRallyPointCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.SetRallyPoint;
  readonly tileVec3: Vector3Simple;
  readonly worldVec3: Vector3Simple;
  readonly targetObjectId?: ActorId;
}
