import PhaserLogo from "../../objects/phaserLogo";
import FpsText from "../../objects/fpsText";
import { Scenes } from "../scenes";
import { CreateSceneFromObjectConfig } from "../../phaser/phaser";
import VersionText from "../../objects/versionText";
import Phaser from "phaser";
import { AssetsLogo, SceneConfig } from "./assets";

export default class MainSceneLogo extends Phaser.Scene implements CreateSceneFromObjectConfig {
  private fpsText: FpsText;
  private loadImage: Phaser.GameObjects.Image;
  private track: Phaser.Sound.WebAudioSound;

  constructor() {
    super({ key: Scenes.MainSceneLogo });
  }

  preload() {
    this.loadImage = this.add.image(0, 0, AssetsLogo.loader).setOrigin(0);

    this.load
      .image(AssetsLogo.phaserLogo, "assets/img/phaser-logo.png")
      .audio(AssetsLogo.jungle, ["assets/audio/jungle.ogg", "assets/audio/jungle.mp3"]);
  }

  create() {
    this.sound.pauseOnBlur = false;

    this.track = this.sound.add(AssetsLogo.jungle) as Phaser.Sound.WebAudioSound;

    if (this.sound.locked) {
      this.loadImage.setTexture(AssetsLogo.click);

      this.sound.once("unlocked", () => {
        this.startDemo();
      });
    } else {
      this.startDemo();
    }
  }

  startDemo() {
    this.loadImage.setVisible(false);

    new PhaserLogo(this, this.cameras.main.width / 2, 400);
    this.fpsText = new FpsText(this);
    new VersionText(this);

    if (SceneConfig.allowAudio) {
      this.track.play();
    }
  }

  update() {
    // demo might not have started here as sound might be locked still
    this.fpsText?.update();
  }
}
