// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import { setActorData } from "../../../../../data/actor-data";
import { ColliderComponent } from "../../../../../entity/actor/components/collider-component";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RampStoneTopRight extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 32, texture || "outside", frame ?? "nature/ramp/stone/top_right.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "23.4308967376896 26.445948267467557 27.813899875941992 11.314151718739055 33.05703964174182 6.993014134310254 58.72891516579155 15.654663193237603 62.147424458919076 48.25660674115208 30.214115880223066 60.77947285044464 6.942456360454408 46.48253404233564 11.63853115143911 33.959667933043086"
      ),
      Phaser.Geom.Polygon.Contains
    );

    /* START-USER-CTR-CODE */
    setActorData(this, [new ColliderComponent()], []);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
