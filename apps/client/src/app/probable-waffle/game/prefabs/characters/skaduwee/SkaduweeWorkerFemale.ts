// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorData } from "../../../data/actor-data";
import { OwnerComponent } from "../../../entity/actor/components/owner-component";
/* END-USER-IMPORTS */

export default class SkaduweeWorkerFemale extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 58.00236660260104, texture || "worker_female_idle", frame ?? 4);

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 32), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.9062870143450004);
    this.play("skaduwee_worker_female_idle_down");

    /* START-USER-CTR-CODE */
    setActorData(this, [new OwnerComponent(this)], []);

    this.on("pointerdown", () => {
      this.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        this.clearTint();
      }, 1000);

      // and play anim skaduwee_worker_male_slash_down
      this.play("skaduwee_worker_female_slash_down", true);
      // after anim complete, remove tint
      this.once("animationcomplete", () => {
        this.clearTint();
        this.play("skaduwee_worker_female_idle_down", true);
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
