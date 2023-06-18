import { BaseScene } from '../../../shared/game/phaser/scene/base.scene';

// prefab combined in Phaser Editor 2D
export class Croissants extends Phaser.GameObjects.Container {
  private readonly towel: Phaser.GameObjects.Image;
  private readonly plate: Phaser.GameObjects.Image;
  private readonly croissant_bottom: Phaser.GameObjects.Image;
  private readonly croissant_top: Phaser.GameObjects.Image;

  constructor(scene: BaseScene, x?: number, y?: number) {
    super(scene, x ?? 102, y ?? 91);
    this.width = 250;
    this.height = 190;

    // towel
    this.towel = scene.add.image(25, 38, 'croissants-spritesheet', 'croissants/towel');
    this.add(this.towel);

    // plate
    this.plate = scene.add.image(30, 26, 'croissants-spritesheet', 'croissants/plate');
    this.add(this.plate);

    // croissant_bottom
    this.croissant_bottom = scene.add.image(54, 0, 'croissants-spritesheet', 'croissants/croissant');
    this.croissant_bottom.angle = 132;
    this.add(this.croissant_bottom);

    // croissant_top
    this.croissant_top = scene.add.image(0, 1, 'croissants-spritesheet', 'croissants/croissant');
    this.add(this.croissant_top);

    this.tween();
  }

  private tween() {
    this.scene.tweens.add({
      targets: this.plate,
      y: this.plate.y - Phaser.Math.Between(5, 10),
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
      duration: Phaser.Math.Between(3000, 5000)
    });

    this.scene.tweens.add({
      targets: this.croissant_bottom,
      y: this.plate.y - Phaser.Math.Between(10, 20),
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
      duration: Phaser.Math.Between(3000, 5000)
    });

    this.scene.tweens.add({
      targets: this.croissant_top,
      y: this.plate.y - Phaser.Math.Between(10, 20),
      ease: Phaser.Math.Easing.Sine.InOut,
      yoyo: true,
      repeat: -1,
      duration: Phaser.Math.Between(3000, 5000)
    });
  }

  override destroy(fromScene?: boolean) {
    this.scene.tweens.killTweensOf([this.croissant_bottom, this.croissant_top, this.plate]);
    super.destroy(fromScene);
  }
}
