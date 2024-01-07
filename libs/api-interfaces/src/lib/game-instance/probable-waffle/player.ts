import { BasePlayer } from "../player/player";
import { BaseData } from "../data";
import { BasePlayerController, BasePlayerControllerData } from "../player/player-controller";
import { BasePlayerState } from "../player/player-state";
import { ResourceType } from "../../probable-waffle/resource-type-definition";
import { PlayerStateAction } from "../../probable-waffle/probable-waffle-player-state-action";

export class ProbableWafflePlayer extends BasePlayer<
  ProbableWafflePlayerStateData,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerState,
  ProbableWafflePlayerController
> {}

export interface ProbableWafflePlayerStateData extends BaseData {
  resources: PlayerStateResources;
  summary: PlayerStateAction[];
}

export class ProbableWafflePlayerState extends BasePlayerState<ProbableWafflePlayerStateData> {
  constructor(data?: ProbableWafflePlayerStateData) {
    super(data as ProbableWafflePlayerStateData);
  }

  override resetData() {
    super.resetData();
    this.data = {
      resources: {
        [ResourceType.Ambrosia]: 0,
        [ResourceType.Minerals]: 0,
        [ResourceType.Stone]: 0,
        [ResourceType.Wood]: 0
      },
      summary: []
    };
  }
}

export class ProbableWafflePlayerController extends BasePlayerController<ProbableWafflePlayerControllerData> {
  constructor(data?: ProbableWafflePlayerControllerData) {
    super(data as ProbableWafflePlayerControllerData);
  }
}

export interface ProbableWafflePlayerControllerData extends BasePlayerControllerData {
  playerDefinition?: PositionPlayerDefinition;
}

export enum ProbableWafflePlayerType {
  Human = 0,
  AI = 1,
  NetworkOpen = 2
}

export enum ProbableWaffleAiDifficulty {
  Easy = 0,
  Medium = 1,
  Hard = 2
}

export interface PlayerLobbyDefinition {
  playerNumber: number;
  playerName?: string;
  playerPosition?: number;
  joined: boolean;
}

export enum FactionType {
  Tivara,
  Skaduwee
}

export interface PositionPlayerDefinition {
  player: PlayerLobbyDefinition;
  team?: number;
  factionType?: FactionType;
  playerType: ProbableWafflePlayerType;
  difficulty?: ProbableWaffleAiDifficulty;
}

export type PlayerStateResources = {
  [key in ResourceType]: number;
};
