import { AssetsLogo } from "../scenes/logo/assets";

export default class PhaserLogo extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetsLogo.phaserLogo);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true, 0, 0.6)
      .setInteractive()
      .on("pointerdown", () => {
        this.setVelocityY(-400);
      });
  }
}
