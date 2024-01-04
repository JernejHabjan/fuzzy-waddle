import { BasePlayer } from "../player/player";
import { BaseData } from "../data";
import { BasePlayerController, BasePlayerControllerData } from "../player/player-controller";
import { BasePlayerState } from "../player/player-state";

export class ProbableWafflePlayer extends BasePlayer<
  ProbableWafflePlayerStateData,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerState,
  ProbableWafflePlayerController
> {}

export interface ProbableWafflePlayerStateData extends BaseData {
  scoreProbableWaffle: number;
}

export class ProbableWafflePlayerState extends BasePlayerState<ProbableWafflePlayerStateData> {
  constructor(data?: ProbableWafflePlayerStateData) {
    super(data as ProbableWafflePlayerStateData);
  }

  override resetData() {
    super.resetData();
    this.data = {
      scoreProbableWaffle: 0
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
