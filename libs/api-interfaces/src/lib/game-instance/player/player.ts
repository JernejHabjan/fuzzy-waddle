import { BasePlayerState } from "./player-state";
import type { BaseData } from "../data";
import { BasePlayerController, type BasePlayerControllerData } from "./player-controller";

export abstract class BasePlayer<
  TPlayerStateData extends BaseData = BaseData,
  TPlayerControllerData extends BasePlayerControllerData = BasePlayerControllerData,
  TPlayerState extends BasePlayerState<TPlayerStateData> = BasePlayerState<TPlayerStateData>,
  TPlayerController extends BasePlayerController<TPlayerControllerData> = BasePlayerController<TPlayerControllerData>
> {
  constructor(
    public playerState: TPlayerState,
    public playerController: TPlayerController
  ) {}
}
