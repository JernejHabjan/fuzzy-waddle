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

export default class FenceRight extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 46.771659868606356,
      y ?? 62.465232849121094,
      texture || "outside",
      frame ?? "architecture/obstruction/fence/right.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "27.862018517515452 79.87111429667429 27.986828979456853 18.963608869270807 35.60026715788229 19.712471640919212 36.22431946758929 28.07477259099305 55.32032014462359 37.685178160480895 57.941339845392996 33.81605384029748 64.05705248052162 35.18896892165289 64.05705248052162 65.39310071147182 57.31728753568599 66.51639486894443 55.69475153044779 62.647270548761014 36.72356131535489 71.75843427048325 35.849888081765094 80.1207352205571"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.7308071854469743, 0.7808154089604854);

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
