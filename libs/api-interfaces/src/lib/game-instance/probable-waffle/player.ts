import { BasePlayer } from "../player/player";
import { BaseData } from "../data";
import { BasePlayerController } from "../player/player-controller";
import { BasePlayerState } from "../player/player-state";

export class ProbableWafflePlayer extends BasePlayer<
  ProbableWafflePlayerStateData,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerState,
  ProbableWafflePlayerController
> {}

export interface ProbableWafflePlayerStateData extends BaseData {
  score: number;
}

export class ProbableWafflePlayerState extends BasePlayerState<ProbableWafflePlayerStateData> {
  constructor(data?: ProbableWafflePlayerStateData) {
    super(data as ProbableWafflePlayerStateData);
  }

  override resetData() {
    super.resetData();
    this.data = {
      score: 0
    };
  }
}

export class ProbableWafflePlayerController extends BasePlayerController<ProbableWafflePlayerControllerData> {
  constructor(data?: ProbableWafflePlayerControllerData) {
    super(data as ProbableWafflePlayerControllerData);
  }
}

export interface ProbableWafflePlayerControllerData {
  playerDefinition: PositionPlayerDefinition;
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

export class PlayerLobbyDefinition {
  constructor(
    public playerNumber: number,
    public playerName: string | null,
    public playerPosition: number | null,
    public joined: boolean
  ) {}
}

export enum FactionType {
  Tivara,
  Skaduwee
}

export class PositionPlayerDefinition {
  constructor(
    public player: PlayerLobbyDefinition,
    public team: number | null = null,
    public factionType: FactionType | null = null,
    public playerType: ProbableWafflePlayerType,
    public playerColor: string,
    public difficulty: ProbableWaffleAiDifficulty | null
  ) {}
}
