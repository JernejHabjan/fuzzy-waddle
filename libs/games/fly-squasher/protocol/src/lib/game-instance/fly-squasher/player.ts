import {
  BasePlayer,
  type BaseData,
  BasePlayerController,
  type BasePlayerControllerData,
  BasePlayerState
} from "@fuzzy-waddle/platform-game-sessions";

export class FlySquasherPlayer extends BasePlayer<
  FlySquasherPlayerStateData,
  FlySquasherPlayerControllerData,
  FlySquasherPlayerState,
  FlySquasherPlayerController
> {}

export interface FlySquasherPlayerStateData extends BaseData {
  score: number;
}

export class FlySquasherPlayerState extends BasePlayerState<FlySquasherPlayerStateData> {
  constructor(data?: FlySquasherPlayerStateData) {
    super(data as FlySquasherPlayerStateData);
  }

  override resetData() {
    super.resetData();
    this.data = {
      score: 0
    };
  }
}

export class FlySquasherPlayerController extends BasePlayerController<FlySquasherPlayerControllerData> {
  constructor(data?: FlySquasherPlayerControllerData) {
    super(data as FlySquasherPlayerControllerData);
  }
}

export interface FlySquasherPlayerControllerData extends BasePlayerControllerData {}
