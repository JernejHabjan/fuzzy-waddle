export default class FireArrow extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 16, y ?? 2, "factions", "weapons/arrow.png");
    this.setTint(0xff6600);
  }
}
