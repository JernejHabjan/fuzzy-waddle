import { GameInstanceMetadata, GameInstanceMetadataData } from "../game-instance-metadata";

export enum ProbableWaffleGameInstanceType {
  Matchmaking,
  SelfHosted,
  Skirmish
}

export interface ProbableWaffleGameInstanceMetadataData extends GameInstanceMetadataData {
  type: ProbableWaffleGameInstanceType;
  visibility: ProbableWaffleGameInstanceVisibility;
  name: string;
}

export class ProbableWaffleGameInstanceMetadata extends GameInstanceMetadata<ProbableWaffleGameInstanceMetadataData> {}

export enum ProbableWaffleGameInstanceVisibility {
  Public = "public",
  Private = "private"
}
