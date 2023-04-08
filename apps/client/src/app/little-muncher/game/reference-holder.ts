import { Game } from 'phaser';
import { LittleMuncherGameMode } from './framework/game-mode';
import { GameInstance } from './framework/game-instance';

export class ReferenceHolder {
  static gameRef: Game | null = null;
  static gameModeRef: LittleMuncherGameMode | null = null;
  static gameInstance: GameInstance | null = null;
}
