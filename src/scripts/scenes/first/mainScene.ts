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

    const phaserLogo = new PhaserLogo(this, this.cameras.main.width / 2, 400);
    this.fpsText = new FpsText(this);
    new VersionText(this);

    // const platforms = this.physics.add.staticGroup();
    //
    // platforms.create(400, 568, "ground").setScale(2).refreshBody();
    //
    // platforms.create(600, 400, "ground");
    // platforms.create(50, 250, "ground");
    // platforms.create(750, 220, "ground");
    //
    // const circle = this.add.circle(200, phaserLogo.height + 20, 80, 0x6666ff);
    // circle.setInteractive().on("pointerdown", () => {
    //   circle.set(-400);
    // });

    // if (circle.body) {
    //   (circle.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    // }
    // (circle.body as Phaser.Physics.Arcade.Body).setBounce(0.6, 0);
    //(circle.body as Phaser.Physics.Arcade.Body).setInteractive();
    //.on("pointerdown", () => {
    //  this.setVelocityY(-400);
    //});

    //this.physics.add.existing(circle);
    //this.physics.world.enable(circle);
    // this.physics.world.enable(circle);

    // this.physics.add.collider(phaserLogo, circle);

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
