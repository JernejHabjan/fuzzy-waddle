import {
  GameInstanceDataDto,
  ProbableWaffleAddPlayerDto,
  ProbableWaffleAddSpectatorDto,
  ProbableWaffleChangeGameModeDto,
  ProbableWaffleGameInstance,
  ProbableWaffleGameInstanceData,
  ProbableWaffleGameInstanceMetadataData,
  ProbableWafflePlayerLeftDto,
  ProbableWaffleStartLevelDto
} from "@fuzzy-waddle/api-interfaces";
import { User } from "@supabase/supabase-js";

export interface GameInstanceServiceInterface {
  createGameInstance(gameInstanceMetadataData: ProbableWaffleGameInstanceMetadataData, user: User);
  stopGameInstance(gameInstanceId: string, user: User);
  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined;
  getGameInstanceData(gameInstanceId: string): ProbableWaffleGameInstanceData | null;
}
