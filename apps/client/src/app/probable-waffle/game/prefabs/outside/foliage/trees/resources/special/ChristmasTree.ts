// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorData } from "../../../../../../data/actor-data";
import { ColliderComponent } from "../../../../../../entity/components/movement/collider-component";
import {
  ObjectDescriptorComponent,
  type ObjectDescriptorDefinition
} from "../../../../../../entity/components/object-descriptor-component";
/* END-USER-IMPORTS */

export default class ChristmasTree extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 108.49244127610987,
      texture || "outside",
      frame ?? "foliage/trees/resources/special/tree_christmas.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "13.213926832923768 55.204565590672786 32.28211534184152 18.33940114009848 44.35863473082276 41.856833634430366 52.62151641802045 75.54396666685172 48.5960099550267 101.18008677328558 37.36696561088625 105.62933075869971 36.51949056604546 114.527818729528 28.25660887884777 114.95155625194839 25.29044622190501 107.1124120871711 7.917207802668841 100.12074296723459"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.8475971974696084);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: 0xc6c209
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
