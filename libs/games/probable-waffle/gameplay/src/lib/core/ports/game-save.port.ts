import type { GameSaveRecord } from "@fuzzy-waddle/probable-waffle-protocol";
import type { SaveGameRequest } from "../save-game-request";

export abstract class GameSavePort {
  abstract save(request: SaveGameRequest): Promise<GameSaveRecord>;
}
