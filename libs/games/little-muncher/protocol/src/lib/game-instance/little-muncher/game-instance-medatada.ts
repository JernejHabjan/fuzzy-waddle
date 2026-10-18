import { GameInstanceMetadata, type GameInstanceMetadataData } from "@fuzzy-waddle/platform-game-sessions";

export interface LittleMuncherGameInstanceMetadataData extends GameInstanceMetadataData {}

export class LittleMuncherGameInstanceMetadata extends GameInstanceMetadata<LittleMuncherGameInstanceMetadataData> {}
