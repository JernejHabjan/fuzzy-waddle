// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorData } from "../../../../data/actor-data";
import { ColliderComponent } from "../../../../entity/actor/components/collider-component";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../../entity/actor/components/object-descriptor-component";
/* END-USER-IMPORTS */

export default class FenceTopRight extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 48.180276421586086,
      texture || "outside",
      frame ?? "architecture/obstruction/fence/top_right.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "27.613952143696302 19.447666580453163 36.51673502747947 19.310700689933423 36.24280324643998 28.076517683196847 64.0468790219474 42.457936187769654 64.0468790219474 59.57867250273728 36.65370091799921 46.70387879388162 35.557973793841285 51.086787290513335 28.024849815255525 50.675889618954116"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.6022534552698261);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: 0x6e4b1e
        } satisfies ObjectDescriptorDefinition),
        new ColliderComponent()
      ],
      []
    );
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
