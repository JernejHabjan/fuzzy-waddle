export default class VersionText extends Phaser.GameObjects.Text {
  /**
   * display the Phaser.VERSION in scene
   */
  constructor(scene: Phaser.Scene) {
    super(scene, scene.cameras.main.width - 15, 15, `Phaser v${Phaser.VERSION}`, {
      color: "#000000",
      fontSize: "24px"
    });
    scene.add.existing(this);
    this.setOrigin(1, 0);
  }
}
