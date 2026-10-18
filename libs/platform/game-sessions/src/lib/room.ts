import type { GameInstanceId } from "./player/player";

export interface Room<TGameInstanceMetadataData, TGameModeData> {
  gameInstanceMetadataData: TGameInstanceMetadataData;
  gameModeData?: TGameModeData;
}

export interface RoomEvent<TRoom> {
  room: TRoom;
  action: RoomAction;
}

export interface SpectatorEvent {
  gameInstanceId: GameInstanceId;
  action: SpectatorAction;
}

export type SpectatorAction = "joined" | "left";
export type PlayerAction = "joined" | "left";

export type RoomAction =
  | "added"
  | "removed"
  | "game_instance_metadata"
  | "game_mode"
  | "player.joined"
  | "player.left"
  | "spectator.joined"
  | "spectator.left";
