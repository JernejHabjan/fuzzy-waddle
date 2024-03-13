// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class SkaduweeOwlFurball extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 8, y ?? 8, texture || "units", frame ?? "skaduwee/owl/projectile/furball/1.png");

    /* START-USER-CTR-CODE */
    // start rotating the furball as it's flying through the air
    this.furballTween = scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 1000,
      repeat: -1
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  private furballTween!: Phaser.Tweens.Tween;

  public destroy(fromScene?: boolean) {
    this.furballTween.destroy();
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
