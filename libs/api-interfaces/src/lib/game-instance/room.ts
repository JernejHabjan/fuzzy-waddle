import { LittleMuncherGameMode } from "./little-muncher/game-mode";
import type { LittleMuncherGameInstanceMetadataData } from "./little-muncher/game-instance-medatada";
import type { ProbableWaffleGameModeData } from "./probable-waffle/game-mode";
import type { ProbableWaffleGameInstanceMetadataData } from "./probable-waffle/game-instance-medatada";
import type { ProbableWafflePlayerControllerData } from "./probable-waffle/player";
import { ProbableWafflePlayerType } from "./probable-waffle/player";
import type { ProbableWaffleSpectatorData } from "./probable-waffle/spectator";

interface Room<TGameInstanceMetadataData, TGameModeData> {
  gameInstanceMetadataData: TGameInstanceMetadataData;
  gameModeData?: TGameModeData;
}

interface RoomEvent<TRoom> {
  room: TRoom;
  action: RoomAction;
}

interface SpectatorEvent {
  gameInstanceId: string;
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

export enum ProbableWaffleGameInstanceEvent {
  GameFound = "game-found"
}

export interface LittleMuncherRoom extends Room<LittleMuncherGameInstanceMetadataData, LittleMuncherGameMode> {}

export interface LittleMuncherRoomEvent extends RoomEvent<LittleMuncherRoom> {}

export interface LittleMuncherSpectatorEvent extends SpectatorEvent {
  user_id: string;
  room: Room<LittleMuncherGameInstanceMetadataData, LittleMuncherGameMode>;
}

export interface ProbableWaffleRoomPlayer {
  controllerData: ProbableWafflePlayerControllerData;
}

export interface ProbableWaffleRoom extends Room<ProbableWaffleGameInstanceMetadataData, ProbableWaffleGameModeData> {
  players: ProbableWaffleRoomPlayer[];
  spectators: ProbableWaffleSpectatorData[];
}

export interface ProbableWaffleRoomEvent extends RoomEvent<ProbableWaffleRoom> {}

export interface ProbableWaffleGameFoundEvent {
  userIds: string[];
  gameInstanceId: string;
}

export class ProbableWaffleRoomHelper {
  public static getActivatedPlayersInRoom(room: ProbableWaffleRoom): ProbableWaffleRoomPlayer[] {
    return room.players.filter(
      (p) => p.controllerData.playerDefinition?.playerType !== ProbableWafflePlayerType.NetworkOpen
    );
  }
}
