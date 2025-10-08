// You can write more code here

/* START OF COMPILED CODE */

import InfantryInnCursor from "./InfantryInn/InfantryInnCursor";
import InfantryInnFoundation1 from "./InfantryInn/InfantryInnFoundation1";
import InfantryInnFoundation2 from "./InfantryInn/InfantryInnFoundation2";
import InfantryInnLevel1 from "./InfantryInn/InfantryInnLevel1";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/components/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class InfantryInn extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 128);

    this.setInteractive(new Phaser.Geom.Circle(0, -35, 59.91620797027979), Phaser.Geom.Circle.Contains);

    // infantryInnCursor
    const infantryInnCursor = new InfantryInnCursor(scene, 0, 0);
    infantryInnCursor.visible = false;
    this.add(infantryInnCursor);

    // infantryInnFoundation1
    const infantryInnFoundation1 = new InfantryInnFoundation1(scene, 0, 0);
    infantryInnFoundation1.visible = false;
    this.add(infantryInnFoundation1);

    // infantryInnFoundation2
    const infantryInnFoundation2 = new InfantryInnFoundation2(scene, 0, 0);
    infantryInnFoundation2.visible = false;
    this.add(infantryInnFoundation2);

    // infantryInnLevel1
    const infantryInnLevel1 = new InfantryInnLevel1(scene, 0, 0);
    this.add(infantryInnLevel1);

    this.infantryInnCursor = infantryInnCursor;
    this.infantryInnFoundation1 = infantryInnFoundation1;
    this.infantryInnFoundation2 = infantryInnFoundation2;
    this.infantryInnLevel1 = infantryInnLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private infantryInnCursor: InfantryInnCursor;
  private infantryInnFoundation1: InfantryInnFoundation1;
  private infantryInnFoundation2: InfantryInnFoundation2;
  private infantryInnLevel1: InfantryInnLevel1;

  /* START-USER-CODE */
  override name = ObjectNames.InfantryInn;
  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.infantryInnCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.infantryInnCursor.visible = progress === null;
    this.infantryInnLevel1.visible = progress === 100;
    this.infantryInnFoundation1.visible = progress !== null && progress < 50;
    this.infantryInnFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
    if (this.infantryInnLevel1.visible) {
      this.infantryInnLevel1.start();
    }
  };

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
