import { LittleMuncherGameMode } from "./little-muncher/game-mode";
import { LittleMuncherGameInstanceMetadataData } from "./little-muncher/game-instance-medatada";
import { ProbableWaffleGameMode } from "./probable-waffle/game-mode";
import { ProbableWaffleGameInstanceMetadataData } from "./probable-waffle/game-instance-medatada";
import { GameSessionState } from "./session";
import { ProbableWafflePlayer, ProbableWafflePlayerControllerData } from "./probable-waffle/player";
import { ProbableWaffleSpectator } from "./probable-waffle/spectator";

interface Room<TGameInstanceMetadataData, TGameMode> {
  gameInstanceMetadataData: TGameInstanceMetadataData;
  gameMode: TGameMode;
}

interface RoomEvent<TRoom> {
  room: TRoom;
  action: RoomAction;
}

export type RoomAction = "added" | "removed" | "changed";

interface SpectatorEvent {
  gameInstanceId: string;
  user_id: string;
  action: SpectatorAction;
}

interface PlayerEvent {
  gameInstanceId: string;
  user_id: string | null;
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

export interface LittleMuncherRoomEvent extends RoomEvent<LittleMuncherRoom> {}

export interface LittleMuncherSpectatorEvent extends SpectatorEvent {
  room: Room<LittleMuncherGameInstanceMetadataData, LittleMuncherGameMode>;
}

export interface ProbableWaffleRoom extends Room<ProbableWaffleGameInstanceMetadataData, ProbableWaffleGameMode> {
  players: {
    userId: string | null;
    controllerData: ProbableWafflePlayerControllerData;
  }[];
  spectators: {
    userId: string | null;
  }[];
}

export interface ProbableWaffleRoomEvent extends RoomEvent<ProbableWaffleRoom> {}

export interface ProbableWafflePlayerEvent extends PlayerEvent {
  player: ProbableWafflePlayer;
}

export interface ProbableWaffleSpectatorEvent extends SpectatorEvent {
  spectator: ProbableWaffleSpectator;
}

export interface ProbableWaffleLevelStateChangeEvent {
  sessionState: GameSessionState;
  gameInstanceId: string;
}
