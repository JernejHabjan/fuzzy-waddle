// You can write more code here

/* START OF COMPILED CODE */

import SandholdLevel1 from "./Sandhold/SandholdLevel1";
import SandholdCursor from "./Sandhold/SandholdCursor";
import SandholdFoundation1 from "./Sandhold/SandholdFoundation1";
import SandholdFoundation2 from "./Sandhold/SandholdFoundation2";
/* START-USER-IMPORTS */
import { ObjectNames } from "../../../data/object-names";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/building/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
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
    this.setup();
    /* END-USER-CTR-CODE */
  }

  public sandholdLevel1: SandholdLevel1;
  public sandholdCursor: SandholdCursor;
  public sandholdFoundation1: SandholdFoundation1;
  public sandholdFoundation2: SandholdFoundation2;

  /* START-USER-CODE */
  name = ObjectNames.Sandhold;

  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.sandholdCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.sandholdCursor.visible = progress === null;
    this.sandholdLevel1.visible = progress === 100;
    this.sandholdFoundation1.visible = progress !== null && progress < 50;
    this.sandholdFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
