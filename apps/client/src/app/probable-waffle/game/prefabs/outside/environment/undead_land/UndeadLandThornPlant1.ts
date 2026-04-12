// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
import { RandomSpriteComponent } from "../../../../entity/components/random-sprite-component";
/* END-USER-IMPORTS */

export default class UndeadLandThornPlant1 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 43.86432902698252,
      y ?? 34.395569382393376,
      texture || "environment_1",
      frame ?? "undead_land/Thorn_plant_shadow1_1.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "40.39496107737608 60.91199572528114 55.56138362806976 24.708277378463983 118.91789073499979 71.43064362334289 84.67113013665923 97.60495350921747 10.795975131667461 91.97869998234722"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5926900705233009, 0.6437153857999482);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    new RandomSpriteComponent(this, [
      "undead_land/Thorn_plant_shadow1_1.png",
      "undead_land/Thorn_plant_shadow1_2.png",
      "undead_land/Thorn_plant_shadow1_3.png",
      "undead_land/Thorn_plant_shadow1_4.png",
      "undead_land/Thorn_plant_shadow1_5.png",
      "undead_land/Thorn_plant_shadow1_6.png"
    ]);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
