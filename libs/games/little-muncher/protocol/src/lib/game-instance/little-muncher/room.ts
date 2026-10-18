import type { Room, RoomEvent, SpectatorEvent } from "@fuzzy-waddle/platform-game-sessions";
import { LittleMuncherGameMode } from "./game-mode";
import type { LittleMuncherGameInstanceMetadataData } from "./game-instance-medatada";

export interface LittleMuncherRoom extends Room<LittleMuncherGameInstanceMetadataData, LittleMuncherGameMode> {}

export interface LittleMuncherRoomEvent extends RoomEvent<LittleMuncherRoom> {}

export interface LittleMuncherSpectatorEvent extends SpectatorEvent {
  user_id: string;
  room: Room<LittleMuncherGameInstanceMetadataData, LittleMuncherGameMode>;
}
