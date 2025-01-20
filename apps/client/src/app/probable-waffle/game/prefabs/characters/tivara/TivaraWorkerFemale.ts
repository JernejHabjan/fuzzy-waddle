// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorDataFromName } from "../../../data/actor-data";
import { PawnAiController } from "../../../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import { ObjectNames } from "../../../data/object-names";
/* END-USER-IMPORTS */

export default class TivaraWorkerFemale extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 57.107040025447624, texture || "worker_female_idle_1", frame ?? 4);

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 32), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.8922974795475218);
    this.play("tivara_worker_female_idle_down");

    /* START-USER-CTR-CODE */
    setActorDataFromName(this);

    new PawnAiController(this); // todo

    this.on("pointerdown", () => {
      // and play anim skaduwee_worker_male_slash_down
      this.play("tivara_worker_female_slash_down", true);
      // after anim complete, remove tint
      this.once("animationcomplete", () => {
        this.clearTint();
        this.play("tivara_worker_female_idle_down", true);
      });
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.TivaraWorkerFemale;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
