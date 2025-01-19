// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorData } from "../../../../data/actor-data";
import { ColliderComponent } from "../../../../entity/actor/components/collider-component";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../../entity/actor/components/object-descriptor-component";
/* END-USER-IMPORTS */

export default class FenceBottom extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 76.52307895592904,
      texture || "outside",
      frame ?? "architecture/obstruction/fence/bottom.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "0.05848429379470588 40.93399167105018 26.439493161552626 53.533876503412166 27.620732364586562 47.62768048824248 35.88940678582412 47.82455368874814 37.26751918936371 53.73074970391782 64.04227445813295 41.32773807206149 64.2382970838032 58.984914103568656 36.775735604827894 72.47738996063043 36.873772788352404 80.11175857167575 27.223540307793005 79.76093887461954 26.984735425367134 72.83559728426924 -0.3352621072166073 59.63694571908751"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.9565384869491129);

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
