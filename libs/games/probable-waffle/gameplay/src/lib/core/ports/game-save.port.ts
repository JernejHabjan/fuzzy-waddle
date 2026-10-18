import type { GameSaveRecord, SaveGameRequest } from "@fuzzy-waddle/probable-waffle-protocol";

export abstract class GameSavePort {
  abstract save(request: SaveGameRequest): Promise<GameSaveRecord>;
}
