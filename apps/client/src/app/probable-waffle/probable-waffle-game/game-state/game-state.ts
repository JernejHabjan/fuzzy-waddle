import { PlayerState } from '../player-state';
import { GameMode } from '../game-mode/game-mode';
import { VisionManager } from '../vision/vision-manager';
import { Actor } from '../actor';

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
