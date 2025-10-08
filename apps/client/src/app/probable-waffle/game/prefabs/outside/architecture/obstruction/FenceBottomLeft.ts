// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorData } from "../../../../data/actor-data";
import { ColliderComponent } from "../../../../entity/components/movement/collider-component";
import {
  ObjectDescriptorComponent,
  type ObjectDescriptorDefinition
} from "../../../../entity/components/object-descriptor-component";
/* END-USER-IMPORTS */

export default class FenceBottomLeft extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 77.24595799900686,
      texture || "outside",
      frame ?? "architecture/obstruction/fence/bottom_left.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-0.18004548509920681 40.93908259529123 26.91572216656336 53.5715688653231 29.844994345121478 46.06530890776793 36.802015769197 47.71302450820687 36.802015769197 79.75193896118626 27.281881188883126 79.75193896118626 27.098801677723245 73.52723558175026 0.18611353722055668 59.24703371127945"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.9655744749875858);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: 0x6e4b1e
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
