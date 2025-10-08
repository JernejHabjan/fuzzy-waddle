import {
  ProbableWaffleGameInstance,
  type ProbableWaffleGameInstanceData,
  type ProbableWaffleGameInstanceMetadataData
} from "@fuzzy-waddle/api-interfaces";
import { type User } from "@supabase/supabase-js";

export interface GameInstanceServiceInterface {
  createGameInstance(gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData, user: User): Promise<void>;
  stopGameInstance(gameInstanceId: string, user: User): void;
  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined;
  getGameInstanceData(gameInstanceId: string): ProbableWaffleGameInstanceData | null;
}
