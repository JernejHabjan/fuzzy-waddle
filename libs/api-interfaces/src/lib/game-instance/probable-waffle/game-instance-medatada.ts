import { GameInstanceMetadata, GameInstanceMetadataData } from "../game-instance-metadata";

export enum ProbableWaffleGameInstanceType {
  Ranked,
  SelfHosted
}

export interface ProbableWaffleGameInstanceMetadataData extends GameInstanceMetadataData {
  type: ProbableWaffleGameInstanceType;
}

export class ProbableWaffleGameInstanceMetadata extends GameInstanceMetadata<ProbableWaffleGameInstanceMetadataData> {}
