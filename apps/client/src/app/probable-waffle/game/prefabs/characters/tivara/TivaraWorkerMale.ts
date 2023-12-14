// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class TivaraWorkerMale extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 56.45402439680805, texture || "worker_male_idle_1", frame ?? 4);

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 32), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.8820941312001258);
    this.play("tivara_worker_male_idle_down");

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      this.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        this.clearTint();
      }, 1000);

      // and play anim skaduwee_worker_male_slash_down
      this.play("tivara_worker_male_slash_down", true);
      // after anim complete, remove tint
      this.once("animationcomplete", () => {
        this.clearTint();
        this.play("tivara_worker_male_idle_down", true);
      });

      // spawn blood
      // get random blood splatter 1-5
      const randomBloodSplatter = Math.floor(Math.random() * 5) + 1;
      const blood_splatter_small_1 = this.scene.add.sprite(
        this.x,
        this.y - this.height / 4,
        "effects_1",
        "blood-splatter-small/" + randomBloodSplatter + "/1_0.png"
      );
      blood_splatter_small_1.depth = this.depth + 1;
      blood_splatter_small_1.scaleX = 0.5;
      blood_splatter_small_1.scaleY = 0.5;
      blood_splatter_small_1.play("blood_splatter_small_" + randomBloodSplatter);
      blood_splatter_small_1.once("animationcomplete", () => {
        blood_splatter_small_1.destroy();
      });
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
