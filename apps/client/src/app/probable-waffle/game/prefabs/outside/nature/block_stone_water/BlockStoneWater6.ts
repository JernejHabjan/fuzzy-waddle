// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorData } from "../../../../data/actor-data";
import { ColliderComponent } from "../../../../entity/actor/components/collider-component";
/* END-USER-IMPORTS */

export default class BlockStoneWater6 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-32 -32 0 -48 32 -32 31.94308756244577 1.2220034195229061 0.28628033313970036 16 -31.98714686381638 0.6221098782742516"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // image_1
    const image_1 = scene.add.image(0, -15.81877943301675, "outside", "nature/block_stone/1.png");
    image_1.setOrigin(0.5, 0.5028315713591133);
    this.add(image_1);

    // outside_nature_block_stone_water_6
    const outside_nature_block_stone_water_6 = scene.add.image(
      0,
      -17.87410141979456,
      "outside",
      "nature/block_stone_water/6.png"
    );
    outside_nature_block_stone_water_6.setOrigin(0.5, 0.470717165742086);
    this.add(outside_nature_block_stone_water_6);

    /* START-USER-CTR-CODE */
    setActorData(this, [new ColliderComponent()], []);
    /* END-USER-CTR-CODE */
  }

  public z: number = 0;

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
