import { LittleMuncherBoost, LittleMuncherPosition } from "./data";
import { BasePlayer } from "../player/player";
import { BaseData } from "../data";
import { BasePlayerController, BasePlayerControllerData } from "../player/player-controller";
import { BasePlayerState } from "../player/player-state";

export class LittleMuncherPlayer extends BasePlayer<
  LittleMuncherPlayerStateData,
  LittleMuncherPlayerControllerData,
  LittleMuncherPlayerState,
  LittleMuncherPlayerController
> {}

export interface LittleMuncherPlayerStateData extends BaseData {
  score: number;
  position: LittleMuncherPosition;
  boost: LittleMuncherBoost;
}

export class LittleMuncherPlayerState extends BasePlayerState<LittleMuncherPlayerStateData> {
  constructor(data?: LittleMuncherPlayerStateData) {
    super(data as LittleMuncherPlayerStateData);
  }

  override resetData() {
    super.resetData();
    this.data = {
      score: 0,
      position: new LittleMuncherPosition(),
      boost: new LittleMuncherBoost()
    };
  }
}

export class LittleMuncherPlayerController extends BasePlayerController<LittleMuncherPlayerControllerData> {
  constructor(data?: LittleMuncherPlayerControllerData) {
    super(data as LittleMuncherPlayerControllerData);
  }
}

export interface LittleMuncherPlayerControllerData extends BasePlayerControllerData {}
