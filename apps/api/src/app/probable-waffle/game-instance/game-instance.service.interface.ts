import {
  GameInstanceId,
  ProbableWaffleGameInstance,
  type ProbableWaffleGameInstanceData,
  type ProbableWaffleGameInstanceMetadataData
} from "@fuzzy-waddle/api-interfaces";
import { type User } from "@supabase/supabase-js";

export interface GameInstanceServiceInterface {
  createGameInstance(gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData, user: User): Promise<void>;
  stopGameInstance(gameInstanceId: GameInstanceId, user: User): void;
  findGameInstance(gameInstanceId: GameInstanceId): ProbableWaffleGameInstance | undefined;
  getGameInstanceData(gameInstanceId: GameInstanceId): ProbableWaffleGameInstanceData | null;
  getGameInstanceDataForUser(gameInstanceId: GameInstanceId, user: User): ProbableWaffleGameInstanceData | null;
}
