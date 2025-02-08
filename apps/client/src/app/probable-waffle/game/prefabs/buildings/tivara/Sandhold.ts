// You can write more code here

/* START OF COMPILED CODE */

import SandholdLevel1 from "./Sandhold/SandholdLevel1";
import SandholdCursor from "./Sandhold/SandholdCursor";
import SandholdFoundation1 from "./Sandhold/SandholdFoundation1";
import SandholdFoundation2 from "./Sandhold/SandholdFoundation2";
/* START-USER-IMPORTS */
import { ObjectNames } from "../../../data/object-names";
/* END-USER-IMPORTS */

export default class Sandhold extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 160, y ?? 240);

    // sandholdLevel1
    const sandholdLevel1 = new SandholdLevel1(scene, 0, 0);
    this.add(sandholdLevel1);

    // sandholdCursor
    const sandholdCursor = new SandholdCursor(scene, 0, 0);
    sandholdCursor.visible = false;
    this.add(sandholdCursor);

    // sandholdFoundation1
    const sandholdFoundation1 = new SandholdFoundation1(scene, 0, 0);
    sandholdFoundation1.visible = false;
    this.add(sandholdFoundation1);

    // sandholdFoundation2
    const sandholdFoundation2 = new SandholdFoundation2(scene, 0, 0);
    sandholdFoundation2.visible = false;
    this.add(sandholdFoundation2);

    this.sandholdLevel1 = sandholdLevel1;
    this.sandholdCursor = sandholdCursor;
    this.sandholdFoundation1 = sandholdFoundation1;
    this.sandholdFoundation2 = sandholdFoundation2;

    /* START-USER-CTR-CODE */
    sandholdLevel1.setup(this);
    /* END-USER-CTR-CODE */
  }

  public sandholdLevel1: SandholdLevel1;
  public sandholdCursor: SandholdCursor;
  public sandholdFoundation1: SandholdFoundation1;
  public sandholdFoundation2: SandholdFoundation2;

  /* START-USER-CODE */
  name = ObjectNames.Sandhold;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
