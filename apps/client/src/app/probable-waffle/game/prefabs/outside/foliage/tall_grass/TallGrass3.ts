// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorData } from "../../../../data/actor-data";
import {
  ObjectDescriptorComponent,
  type ObjectDescriptorDefinition
} from "../../../../entity/components/object-descriptor-component";
/* END-USER-IMPORTS */

export default class TallGrass3 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "outside", frame ?? "foliage/tall_grass/tall_grass_3.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "0.1261623050864351 31.528073306065085 30.760418287578194 15.077304473964055 64.03923785424274 31.579198473963004 63.764206287576094 49.731281873961855 32.41060768757809 64.30795490729426 -0.04311717908651502 48.35612404062861"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: null
        } satisfies ObjectDescriptorDefinition)
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
