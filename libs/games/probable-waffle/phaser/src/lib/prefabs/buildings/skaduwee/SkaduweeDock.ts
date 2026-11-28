import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import SkaduweeDockCursor from "./SkaduweeDock/SkaduweeDockCursor";
import SkaduweeDockFoundation1 from "./SkaduweeDock/SkaduweeDockFoundation1";
import SkaduweeDockFoundation2 from "./SkaduweeDock/SkaduweeDockFoundation2";
import SkaduweeDockLevel1 from "./SkaduweeDock/SkaduweeDockLevel1";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  ConstructionGameObjectInterfaceComponent
} from "../../../entity/components/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class SkaduweeDock extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 96);

    this.setInteractive(new Phaser.Geom.Polygon("-64 -48 0 -80 64 -48 64 16 0 48 -64 16"), Phaser.Geom.Polygon.Contains);

    // skaduweeDockCursor
    const skaduweeDockCursor = new SkaduweeDockCursor(scene, 0, 0);
    skaduweeDockCursor.visible = false;
    this.add(skaduweeDockCursor);

    // skaduweeDockFoundation1
    const skaduweeDockFoundation1 = new SkaduweeDockFoundation1(scene, 0, 0);
    skaduweeDockFoundation1.visible = false;
    this.add(skaduweeDockFoundation1);

    // skaduweeDockFoundation2
    const skaduweeDockFoundation2 = new SkaduweeDockFoundation2(scene, 0, 0);
    skaduweeDockFoundation2.visible = false;
    this.add(skaduweeDockFoundation2);

    // skaduweeDockLevel1
    const skaduweeDockLevel1 = new SkaduweeDockLevel1(scene, 0, 0);
    this.add(skaduweeDockLevel1);

    this.skaduweeDockCursor = skaduweeDockCursor;
    this.skaduweeDockFoundation1 = skaduweeDockFoundation1;
    this.skaduweeDockFoundation2 = skaduweeDockFoundation2;
    this.skaduweeDockLevel1 = skaduweeDockLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private skaduweeDockCursor: SkaduweeDockCursor;
  private skaduweeDockFoundation1: SkaduweeDockFoundation1;
  private skaduweeDockFoundation2: SkaduweeDockFoundation2;
  private skaduweeDockLevel1: SkaduweeDockLevel1;

  /* START-USER-CODE */
  override name = ObjectNames.SkaduweeDock;

  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.skaduweeDockCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.skaduweeDockCursor.visible = progress === null;
    this.skaduweeDockLevel1.visible = progress === 100;
    this.skaduweeDockFoundation1.visible = progress !== null && progress < 50;
    this.skaduweeDockFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
