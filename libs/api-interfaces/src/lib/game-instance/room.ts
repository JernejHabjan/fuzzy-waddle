import { LittleMuncherGameMode } from "./little-muncher/game-mode";
import { LittleMuncherGameInstanceMetadataData } from "./little-muncher/game-instance-medatada";
import { ProbableWaffleGameMode } from "./probable-waffle/game-mode";
import { ProbableWaffleGameInstanceMetadataData } from "./probable-waffle/game-instance-medatada";
import { GameSessionState } from "./session";
import { ProbableWafflePlayer } from "./probable-waffle/player";

interface Room<TGameInstanceMetadataData, TGameMode> {
  gameInstanceMetadataData: TGameInstanceMetadataData;
  gameMode: TGameMode;
  players: {
    userId: string | null;
  }[];
  spectators: {
    userId: string | null;
  }[];
}

interface RoomEvent<TGameInstanceMetadataData, TGameMode> {
  room: Room<TGameInstanceMetadataData, TGameMode>;
  action: RoomAction;
}

export type RoomAction = "added" | "existing" | "removed";

interface SpectatorEvent {
  user_id: string;
  action: SpectatorAction;
}

interface PlayerEvent {
  gameInstanceId: string;
  user_id: string;
  action: PlayerAction;
}

export type SpectatorAction = "joined" | "left";
export type PlayerAction = "joined" | "left";

export enum ProbableWaffleGameInstanceEvent {
  Player = "player",
  Spectator = "spectator",
  LevelStateChange = "level-state-change"
}

export interface LittleMuncherRoom extends Room<LittleMuncherGameInstanceMetadataData, LittleMuncherGameMode> {}

export interface LittleMuncherRoomEvent
  extends RoomEvent<LittleMuncherGameInstanceMetadataData, LittleMuncherGameMode> {}

export interface LittleMuncherSpectatorEvent extends SpectatorEvent {
  room: Room<LittleMuncherGameInstanceMetadataData, LittleMuncherGameMode>;
}

export interface ProbableWaffleRoom extends Room<ProbableWaffleGameInstanceMetadataData, ProbableWaffleGameMode> {}

export interface ProbableWaffleRoomEvent
  extends RoomEvent<ProbableWaffleGameInstanceMetadataData, ProbableWaffleGameMode> {}

export interface ProbableWafflePlayerEvent extends PlayerEvent {
  player: ProbableWafflePlayer;
}

export interface ProbableWaffleSpectatorEvent extends SpectatorEvent {
  gameInstanceId: string;
}

export interface ProbableWaffleLevelStateChangeEvent {
  sessionState: GameSessionState;
  gameInstanceId: string;
}
