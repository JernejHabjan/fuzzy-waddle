import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import TivaraDockCursor from "./TivaraDock/TivaraDockCursor";
import TivaraDockFoundation1 from "./TivaraDock/TivaraDockFoundation1";
import TivaraDockFoundation2 from "./TivaraDock/TivaraDockFoundation2";
import TivaraDockLevel1 from "./TivaraDock/TivaraDockLevel1";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/components/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class TivaraDock extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 96);

    this.setInteractive(new Phaser.Geom.Polygon("-64 -48 0 -80 64 -48 64 16 0 48 -64 16"), Phaser.Geom.Polygon.Contains);

    // tivaraDockCursor
    const tivaraDockCursor = new TivaraDockCursor(scene, 0, 0);
    tivaraDockCursor.visible = false;
    this.add(tivaraDockCursor);

    // tivaraDockFoundation1
    const tivaraDockFoundation1 = new TivaraDockFoundation1(scene, 0, 0);
    tivaraDockFoundation1.visible = false;
    this.add(tivaraDockFoundation1);

    // tivaraDockFoundation2
    const tivaraDockFoundation2 = new TivaraDockFoundation2(scene, 0, 0);
    tivaraDockFoundation2.visible = false;
    this.add(tivaraDockFoundation2);

    // tivaraDockLevel1
    const tivaraDockLevel1 = new TivaraDockLevel1(scene, 0, 0);
    this.add(tivaraDockLevel1);

    this.tivaraDockCursor = tivaraDockCursor;
    this.tivaraDockFoundation1 = tivaraDockFoundation1;
    this.tivaraDockFoundation2 = tivaraDockFoundation2;
    this.tivaraDockLevel1 = tivaraDockLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private tivaraDockCursor: TivaraDockCursor;
  private tivaraDockFoundation1: TivaraDockFoundation1;
  private tivaraDockFoundation2: TivaraDockFoundation2;
  private tivaraDockLevel1: TivaraDockLevel1;

  /* START-USER-CODE */
  override name = ObjectNames.TivaraDock;

  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.tivaraDockCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.tivaraDockCursor.visible = progress === null;
    this.tivaraDockLevel1.visible = progress === 100;
    this.tivaraDockFoundation1.visible = progress !== null && progress < 50;
    this.tivaraDockFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
