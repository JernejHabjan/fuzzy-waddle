import { GameInstanceMetadataData } from "./game-instance-metadata";
import { BaseGameMode } from "./game-mode";
import { LittleMuncherGameMode } from "./little-muncher/game-mode";
import { LittleMuncherGameInstanceMetadataData } from "./little-muncher/game-instance-medatada";
import { ProbableWaffleGameMode } from "./probable-waffle/game-mode";
import { ProbableWaffleGameInstanceMetadataData } from "./probable-waffle/game-instance-medatada";

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

interface SpectatorEvent<TGameInstanceMetadataData, TGameMode> {
  room: Room<TGameInstanceMetadataData, TGameMode>;
  user_id: string;
  action: SpectatorAction;
}

export type SpectatorAction = "joined" | "left";

export enum GatewaySpectatorEvent {
  Spectator = "room-spectator"
}

export interface LittleMuncherRoom extends Room<LittleMuncherGameInstanceMetadataData, LittleMuncherGameMode> {}

export interface LittleMuncherRoomEvent
  extends RoomEvent<LittleMuncherGameInstanceMetadataData, LittleMuncherGameMode> {}

export interface LittleMuncherSpectatorEvent
  extends SpectatorEvent<LittleMuncherGameInstanceMetadataData, LittleMuncherGameMode> {}

export interface ProbableWaffleRoom extends Room<ProbableWaffleGameInstanceMetadataData, ProbableWaffleGameMode> {}

export interface ProbableWaffleRoomEvent
  extends RoomEvent<ProbableWaffleGameInstanceMetadataData, ProbableWaffleGameMode> {}

export interface ProbableWaffleSpectatorEvent
  extends SpectatorEvent<ProbableWaffleGameInstanceMetadataData, ProbableWaffleGameMode> {}
