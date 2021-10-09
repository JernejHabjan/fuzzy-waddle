import PhaserLogo from "../../objects/phaserLogo";
import FpsText from "../../objects/fpsText";
import { Scenes } from "../scenes";
import { CreateSceneFromObjectConfig } from "../../phaser/phaser";
import VersionText from "../../objects/versionText";
import { AssetsFirst, SceneConfig } from "./assets";
import Phaser from "phaser";

export default class MainScene extends Phaser.Scene implements CreateSceneFromObjectConfig {
  fpsText: FpsText;
  private loadImage!: Phaser.GameObjects.Image;
  private track!: Phaser.Sound.WebAudioSound;

  constructor() {
    super({ key: Scenes.MainScene });
  }

  preload() {
    this.loadImage = this.add.image(0, 0, AssetsFirst.loader).setOrigin(0);

    this.load.image(AssetsFirst.phaserLogo, "assets/img/phaser-logo.png");
    this.load.audio(AssetsFirst.jungle, ["assets/audio/jungle.ogg", "assets/audio/jungle.mp3"]);
  }

  create() {
    this.sound.pauseOnBlur = false;

    this.track = this.sound.add(AssetsFirst.jungle) as Phaser.Sound.WebAudioSound;

    if (this.sound.locked) {
      this.loadImage.setTexture(AssetsFirst.click);

      this.sound.once("unlocked", () => {
        this.startDemo();
      });
    } else {
      this.startDemo();
    }
  }

  startDemo() {
    this.loadImage.setVisible(false);

    new PhaserLogo(this, this.cameras.main.width / 2, 0);
    this.fpsText = new FpsText(this);
    new VersionText(this);

    this.track.once("play", () => {
      // this.bird.anims.playAfterDelay("lay", 2250);
    });

    if (SceneConfig.allowAudio) {
      this.track.play();
    }
  }

  update() {
    // demo might not have started here as sound might be locked still
    this.fpsText?.update();
  }
}
