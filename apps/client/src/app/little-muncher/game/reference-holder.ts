import { LittleMuncherGameMode } from '@fuzzy-waddle/api-interfaces';
import { Game } from 'phaser';
import { GameInstance } from './framework/game-instance';

export class ReferenceHolder {
  static gameRef: Game | null = null;
  static gameModeRef: LittleMuncherGameMode | null = null;
  static gameInstance: GameInstance | null = null;
}
