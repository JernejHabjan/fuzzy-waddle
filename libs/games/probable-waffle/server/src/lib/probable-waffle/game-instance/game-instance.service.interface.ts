import type { GameInstanceId } from "@fuzzy-waddle/platform-game-sessions";
import {
  ProbableWaffleGameInstance,
  type ProbableWaffleGameInstanceData,
  type ProbableWaffleGameInstanceMetadataData
} from "@fuzzy-waddle/probable-waffle-protocol";
import { type User } from "@supabase/supabase-js";

export interface GameInstanceServiceInterface {
  createGameInstance(gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData, user: User): Promise<void>;
  stopGameInstance(gameInstanceId: GameInstanceId, user: User): void;
  findGameInstance(gameInstanceId: GameInstanceId): ProbableWaffleGameInstance | undefined;
  getGameInstanceData(gameInstanceId: GameInstanceId): ProbableWaffleGameInstanceData | null;
  getGameInstanceDataForUser(gameInstanceId: GameInstanceId, user: User): ProbableWaffleGameInstanceData | null;
}
