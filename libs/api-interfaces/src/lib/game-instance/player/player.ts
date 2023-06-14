import { BasePlayerState } from './player-state';
import { BaseData } from '../data';
import { BasePlayerController } from './player-controller';

export abstract class BasePlayer<
  TPlayerStateData extends BaseData = BaseData,
  TPlayerControllerData extends BaseData = BaseData,
  TPlayerState extends BasePlayerState<TPlayerStateData> = BasePlayerState<TPlayerStateData>,
  TPlayerController extends BasePlayerController<TPlayerControllerData> = BasePlayerController<TPlayerControllerData>
> {
  constructor(
    public userId: string | null,
    public playerState: TPlayerState,
    public playerController: TPlayerController
  ) {}
}
