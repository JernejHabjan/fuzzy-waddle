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
  startLevel(body: ProbableWaffleStartLevelDto, user: User);

  leaveRoom(body: GameInstanceDataDto, user: User);
  findGameInstance(gameInstanceId: string): ProbableWaffleGameInstance | undefined;
  changeGameMode(user: User, body: ProbableWaffleChangeGameModeDto): Promise<void>;
  openPlayerSlot(body: ProbableWaffleAddPlayerDto, user: User): Promise<void>;
  playerLeft(body: ProbableWafflePlayerLeftDto, user: User): Promise<void>;
  addPlayer(body: ProbableWaffleAddPlayerDto, user: User): Promise<void>;
  addSpectator(body: ProbableWaffleAddSpectatorDto, user: User): Promise<void>;
  getGameInstance(gameInstanceId: string, user: User): Promise<ProbableWaffleGameInstanceData | null>;
}
