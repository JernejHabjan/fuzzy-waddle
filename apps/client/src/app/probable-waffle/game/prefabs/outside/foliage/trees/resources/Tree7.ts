// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorDataFromName } from "../../../../../data/actor-data";
import { ObjectNames } from "../../../../../data/object-names";
/* END-USER-IMPORTS */

export default class Tree7 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 64, y ?? 222, texture || "outside", frame ?? "foliage/trees/resources/tree7.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "10.967077192262877 67.17134107643946 33.05175232423061 18.41837899266163 52.219583570844115 73.00502884714791 49.5110856773009 100.09000778258005 36.38528819320687 106.13204154509951 36.59363418501789 114.46588121754016 28.05144852076622 114.88257320116219 26.593026578089102 106.75707952053256 8.050233306908648 96.96481790541479"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;
    this.setOrigin(0.5, 0.86719);

    /* START-USER-CTR-CODE */
    setActorDataFromName(this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Tree7;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
