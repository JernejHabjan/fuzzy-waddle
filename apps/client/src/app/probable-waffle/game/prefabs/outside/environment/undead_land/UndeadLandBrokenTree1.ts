// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { initStaticActor } from "../../../../data/init-static-actor";
import { RandomSpriteComponent } from "../../../../entity/components/random-sprite-component";
/* END-USER-IMPORTS */

export default class UndeadLandBrokenTree1 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 30.28818402963794,
      y ?? 17.187312533482924,
      texture || "environment_1",
      frame ?? "undead_land/Broken_tree_shadow1_1.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "27.516786534046425 59.070761958397426 64.72700467758798 55.81834205926133 92.68477789435457 46.587001846178026 99.97113602640982 75.9479588175671 27.439177209326722 78.05797943770042"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.4866264377315464, 0.5092758791678353);

    /* START-USER-CTR-CODE */
    initStaticActor(this, null);
    new RandomSpriteComponent(this, [
      "undead_land/Broken_tree_shadow1_1.png",
      "undead_land/Broken_tree_shadow1_2.png",
      "undead_land/Broken_tree_shadow1_3.png",
      "undead_land/Broken_tree_shadow1_4.png",
      "undead_land/Broken_tree_shadow1_5.png",
      "undead_land/Broken_tree_shadow1_6.png",
      "undead_land/Broken_tree_shadow1_7.png"
    ]);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
