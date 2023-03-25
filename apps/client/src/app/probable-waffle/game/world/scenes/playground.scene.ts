import { Scenes } from './scenes';
import { CreateSceneFromObjectConfig } from './interfaces/scene-config.interface';
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
