// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorData } from "../../../../../data/actor-data";
import { ColliderComponent } from "../../../../../entity/actor/components/collider-component";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../../../entity/actor/components/object-descriptor-component";
/* END-USER-IMPORTS */

export default class RampStoneBottomLeft extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "outside", frame ?? "nature/ramp/stone/bottom_left.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "0 16 12.844166973377895 11.454943302915773 58.421737015571296 39.186647891968654 59.3204496642906 48.43054942165295 34.7984331063781 63.83705197112677 0.1338023700619928 48.0453868579161"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: 0x95a083
        } satisfies ObjectDescriptorDefinition),
        new ColliderComponent(this)
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
