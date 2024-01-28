import { GameInstanceMetadata, GameInstanceMetadataData } from "../game-instance-metadata";

export enum ProbableWaffleGameInstanceType {
  Matchmaking,
  SelfHosted,
  Skirmish,
  InstantGame,
  Replay
}

export interface GameInstanceMetadataStartOptions {
  loadFromSave?: boolean;
}

export interface ProbableWaffleGameInstanceMetadataData extends GameInstanceMetadataData {
  type: ProbableWaffleGameInstanceType;
  visibility: ProbableWaffleGameInstanceVisibility;
  name: string;
  startOptions: GameInstanceMetadataStartOptions;
}

export class ProbableWaffleGameInstanceMetadata extends GameInstanceMetadata<ProbableWaffleGameInstanceMetadataData> {
  isReplay(): boolean {
    return this.data.type === ProbableWaffleGameInstanceType.Replay;
  }

  isStartupLoad(): boolean {
    return this.data.startOptions.loadFromSave ?? false;
  }
}

export enum ProbableWaffleGameInstanceVisibility {
  Public = "public",
  Private = "private"
}
