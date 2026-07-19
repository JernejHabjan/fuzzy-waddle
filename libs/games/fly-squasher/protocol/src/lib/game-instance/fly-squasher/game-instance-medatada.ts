import { GameInstanceMetadata, type GameInstanceMetadataData } from "@fuzzy-waddle/platform-game-sessions";

export interface FlySquasherGameInstanceMetadataData extends GameInstanceMetadataData {}

export class FlySquasherGameInstanceMetadata extends GameInstanceMetadata<FlySquasherGameInstanceMetadataData> {}
