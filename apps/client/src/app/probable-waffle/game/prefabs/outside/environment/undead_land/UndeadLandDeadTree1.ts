// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
import { RandomSpriteComponent } from "../../../../entity/components/random-sprite-component";
/* END-USER-IMPORTS */

export default class UndeadLandDeadTree1 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 40.33859458542554,
      y ?? 47.74731531559317,
      texture || "environment_1",
      frame ?? "undead_land/Dead_tree_shadow1_1.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "39.63732500471613 43.40237802287408 67.06183366682299 17.934918728426553 74.31535580391046 26.99668137107649 73.3154786538576 42.828069580246876 85.64729683784294 33.829175229771074 95.61520314217097 39.66580169196572 85.1893656341312 68.63970231007919 88.1098325660314 102.28929939941301 61.32525589004126 107.34299311186398 53.35859152175486 98.12945239374999 33.69165942469456 100.22415522065582 34.65970090242011 91.26484397978777 55.8394739300235 86.2608316710683"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.565145270198637, 0.7480259009030716);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    new RandomSpriteComponent(this, [
      "undead_land/Dead_tree_shadow1_1.png",
      "undead_land/Dead_tree_shadow1_2.png",
      "undead_land/Dead_tree_shadow1_3.png"
    ]);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
