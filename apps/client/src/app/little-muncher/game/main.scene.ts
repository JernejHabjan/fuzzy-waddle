import { Scene } from 'phaser';
import { CreateSceneFromObjectConfig } from '../../shared/game/phaser/scene-config.interface';
import { Scenes } from './const/scenes';

export default class MainScene extends Scene implements CreateSceneFromObjectConfig {
  constructor() {
    super({ key: Scenes.MainScene });
  }

  init() {}

  create() {
    this.add.text(100, 100, 'Hello World!');
  }
}
