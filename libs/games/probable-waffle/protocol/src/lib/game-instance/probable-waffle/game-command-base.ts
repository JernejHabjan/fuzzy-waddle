import type { ActorId, PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";

import type { GameCommandExecution } from "./game-command-execution";
export interface GameCommandBase {
  readonly tick: number;
  readonly playerNumber: PlayerNumber;
  readonly actorIds: readonly ActorId[];
  readonly execution?: GameCommandExecution;
}
