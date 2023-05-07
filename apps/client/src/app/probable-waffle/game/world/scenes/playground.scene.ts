import { Scenes } from './scenes';
import { CreateSceneFromObjectConfig } from '../../../../shared/game/phaser/scene/scene-config.interface';
import { Scene } from 'phaser';

export default class PlaygroundScene extends Scene implements CreateSceneFromObjectConfig {
  constructor() {
    super({ key: Scenes.PlaygroundScene });
  }

  preload() {
    // pass
  }

  create() {
    // pass
  }
}
