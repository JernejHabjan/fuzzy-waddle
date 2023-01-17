import { PlayerState } from '../../../player/player-state';
import { GameMode } from '../game-mode/game-mode';
import { VisionManager } from '../../map/vision/vision-manager';
import { Actor } from '../../../entity/actor/actor';

export class MapObject {
  // todo
}

export class GameState {
  constructor(
    public gameMode: GameMode,
    public players: PlayerState[],
    public mapObjects: MapObject[], // todo define further
    public visionManager: VisionManager
  ) {}

  /**
   * Get all actors in the world
   */
  getWorldActors(): Actor[] {
    // todo

    return [];
  }
}
