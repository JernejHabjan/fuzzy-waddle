// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorDataFromName } from "../../../data/actor-data";
import { ObjectNames } from "../../../data/object-names";
/* END-USER-IMPORTS */

export default class GeneralWarrior extends Phaser.GameObjects.Sprite {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 32, y ?? 57.554331622949405, texture || "warrior_idle", frame ?? 4);

		this.setInteractive(new Phaser.Geom.Circle(32, 32, 32), Phaser.Geom.Circle.Contains);
		this.setOrigin(0.5, 0.899286430676403);
		this.play("general_warrior_idle_down");

		/* START-USER-CTR-CODE */
    setActorDataFromName(this);

    this.on("pointerdown", () => {
      // and play anim skaduwee_worker_male_slash_down
      this.play("general_warrior_thrust_down", true);
      // after anim complete, remove tint
      this.once("animationcomplete", () => {
        this.clearTint();
        this.play("general_warrior_idle_down", true);
      });
    });
    /* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */
  name = ObjectNames.GeneralWarrior;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
