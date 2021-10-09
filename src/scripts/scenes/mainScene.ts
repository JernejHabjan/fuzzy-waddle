import PhaserLogo from "../objects/phaserLogo";
import FpsText from "../objects/fpsText";
import { Scenes } from "./scenes";
import { CreateSceneFromObjectConfig } from "../phaser/phaser";
import VersionText from "../objects/versionText";

export default class MainScene extends Phaser.Scene implements CreateSceneFromObjectConfig {
  fpsText;

  constructor() {
    super({ key: Scenes.MainScene });
  }

  create() {
    new PhaserLogo(this, this.cameras.main.width / 2, 0);
    this.fpsText = new FpsText(this);
    new VersionText(this);
  }

  update() {
    this.fpsText.update();
  }
}
