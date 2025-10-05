// You can write more code here

/* START OF COMPILED CODE */

import SkaduweeOlivalCursor from "./SkaduweeOlival/SkaduweeOlivalCursor";
import SkaduweeOlivalFoundation1 from "./SkaduweeOlival/SkaduweeOlivalFoundation1";
import SkaduweeOlivalLevel1 from "./SkaduweeOlival/SkaduweeOlivalLevel1";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import {
  ConstructionGameObjectInterfaceComponent
} from "../../../entity/building/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class SkaduweeOlival extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 15.99154048826449, y ?? 54.535253459978904);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-12.788011962835393 -30.360902541923828 0.5188883965774025 -42.99403579453091 13.657346979288771 -31.70843675553525 15.004881192900193 -10.484772891155345 13.994230532691624 5.854079448883155 -14.809313283252527 5.685637672181727 -15.819963943461094 -10.484772891155345"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // skaduweeOlivalCursor
    const skaduweeOlivalCursor = new SkaduweeOlivalCursor(scene, 0, 0);
    skaduweeOlivalCursor.visible = false;
    this.add(skaduweeOlivalCursor);

    // skaduweeOlivalFoundation1
    const skaduweeOlivalFoundation1 = new SkaduweeOlivalFoundation1(scene, 0, 0);
    skaduweeOlivalFoundation1.visible = false;
    this.add(skaduweeOlivalFoundation1);

    // skaduweeOlivalLevel1
    const skaduweeOlivalLevel1 = new SkaduweeOlivalLevel1(scene, 0, 0);
    this.add(skaduweeOlivalLevel1);

    this.skaduweeOlivalCursor = skaduweeOlivalCursor;
    this.skaduweeOlivalFoundation1 = skaduweeOlivalFoundation1;
    this.skaduweeOlivalLevel1 = skaduweeOlivalLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private skaduweeOlivalCursor: SkaduweeOlivalCursor;
  private skaduweeOlivalFoundation1: SkaduweeOlivalFoundation1;
  private skaduweeOlivalLevel1: SkaduweeOlivalLevel1;

  /* START-USER-CODE */
  name = ObjectNames.SkaduweeOlival;

  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.skaduweeOlivalCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.skaduweeOlivalCursor.visible = progress === null;
    this.skaduweeOlivalLevel1.visible = progress === 100;
    this.skaduweeOlivalFoundation1.visible = progress !== null && progress < 100;
    if (this.skaduweeOlivalLevel1.visible) {
      this.skaduweeOlivalLevel1.start();
    }
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
