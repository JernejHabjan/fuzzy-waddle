// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorDataFromName } from "../../../../../data/actor-data";
import { ObjectNames } from "../../../../../data/object-names";
/* END-USER-IMPORTS */

export default class Tree9 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 128, y ?? 346, texture || "outside", frame ?? "foliage/trees/resources/tree9.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "7.082902511161393 1.2876334322518659 64 0 119.42461645248203 1.9747387162966419 125.26501136686261 31.520265930221953 111.17935304394473 43.201055758983124 99.84211585720595 68.96750391066216 121.82948494663874 88.20645186391585 76.13698355766124 109.50671566930386 84.03869432417613 180.27855992591563 61.70777259272097 185.43184955625145 42.81237728148967 180.9656652099604 48.30921955384787 116.72132115177399 9.144218363295714 99.88724169267701 8.113560437228557 86.83224129582631 32.50579802081805 69.99816183672932 6.395797227116617 46.29302953718461"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;
    this.setOrigin(0.5, 0.9008114208215593);

    /* START-USER-CTR-CODE */
    setActorDataFromName(this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Tree9;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
