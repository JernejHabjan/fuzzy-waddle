import * as Phaser from 'phaser';
import { Scenes } from './scenes';
import { CreateSceneFromObjectConfig } from './interfaces/scene-config.interface';

export default class PlaygroundScene extends Phaser.Scene implements CreateSceneFromObjectConfig {
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
