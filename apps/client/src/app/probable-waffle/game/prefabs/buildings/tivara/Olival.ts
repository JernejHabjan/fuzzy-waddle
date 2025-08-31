// You can write more code here

/* START OF COMPILED CODE */

import OlivalCursor from "./Olival/OlivalCursor";
import OlivalFoundation1 from "./Olival/OlivalFoundation1";
import OlivalLevel1 from "./Olival/OlivalLevel1";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/building/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class Olival extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 15.99154048826449, y ?? 54.535253459978904);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-12.788011962835393 -30.360902541923828 0.5188883965774025 -42.99403579453091 13.657346979288771 -31.70843675553525 15.004881192900193 -10.484772891155345 13.994230532691624 5.854079448883155 -14.809313283252527 5.685637672181727 -15.819963943461094 -10.484772891155345"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // olivalCursor
    const olivalCursor = new OlivalCursor(scene, 0, 0);
    olivalCursor.visible = false;
    this.add(olivalCursor);

    // olivalFoundation1
    const olivalFoundation1 = new OlivalFoundation1(scene, 0, 0);
    olivalFoundation1.visible = false;
    this.add(olivalFoundation1);

    // olivalLevel1
    const olivalLevel1 = new OlivalLevel1(scene, 0, 0);
    this.add(olivalLevel1);

    this.olivalCursor = olivalCursor;
    this.olivalFoundation1 = olivalFoundation1;
    this.olivalLevel1 = olivalLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private olivalCursor: OlivalCursor;
  private olivalFoundation1: OlivalFoundation1;
  private olivalLevel1: OlivalLevel1;

  /* START-USER-CODE */
  override name = ObjectNames.Olival;

  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.olivalCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.olivalCursor.visible = progress === null;
    this.olivalLevel1.visible = progress === 100;
    this.olivalFoundation1.visible = progress !== null && progress < 100;
    if (this.olivalLevel1.visible) {
      this.olivalLevel1.start();
    }
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
