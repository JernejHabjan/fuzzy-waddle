import { GameInstanceMetadata, GameInstanceMetadataData } from "../game-instance-metadata";

export enum ProbableWaffleGameInstanceType {
  Matchmaking,
  SelfHosted,
  Skirmish
}

export interface ProbableWaffleGameInstanceMetadataData extends GameInstanceMetadataData {
  type: ProbableWaffleGameInstanceType;
}

export class ProbableWaffleGameInstanceMetadata extends GameInstanceMetadata<ProbableWaffleGameInstanceMetadataData> {}
