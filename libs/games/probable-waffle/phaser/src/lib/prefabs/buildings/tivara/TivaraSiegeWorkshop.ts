import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import TivaraSiegeWorkshopCursor from "./TivaraSiegeWorkshop/TivaraSiegeWorkshopCursor";
import TivaraSiegeWorkshopFoundation1 from "./TivaraSiegeWorkshop/TivaraSiegeWorkshopFoundation1";
import TivaraSiegeWorkshopFoundation2 from "./TivaraSiegeWorkshop/TivaraSiegeWorkshopFoundation2";
import TivaraSiegeWorkshopLevel1 from "./TivaraSiegeWorkshop/TivaraSiegeWorkshopLevel1";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/components/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class TivaraSiegeWorkshop extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 96);

    this.setInteractive(new Phaser.Geom.Polygon("-64 -48 0 -80 64 -48 64 16 0 48 -64 16"), Phaser.Geom.Polygon.Contains);

    // tivaraSiegeWorkshopCursor
    const tivaraSiegeWorkshopCursor = new TivaraSiegeWorkshopCursor(scene, 0, 0);
    tivaraSiegeWorkshopCursor.visible = false;
    this.add(tivaraSiegeWorkshopCursor);

    // tivaraSiegeWorkshopFoundation1
    const tivaraSiegeWorkshopFoundation1 = new TivaraSiegeWorkshopFoundation1(scene, 0, 0);
    tivaraSiegeWorkshopFoundation1.visible = false;
    this.add(tivaraSiegeWorkshopFoundation1);

    // tivaraSiegeWorkshopFoundation2
    const tivaraSiegeWorkshopFoundation2 = new TivaraSiegeWorkshopFoundation2(scene, 0, 0);
    tivaraSiegeWorkshopFoundation2.visible = false;
    this.add(tivaraSiegeWorkshopFoundation2);

    // tivaraSiegeWorkshopLevel1
    const tivaraSiegeWorkshopLevel1 = new TivaraSiegeWorkshopLevel1(scene, 0, 0);
    this.add(tivaraSiegeWorkshopLevel1);

    this.tivaraSiegeWorkshopCursor = tivaraSiegeWorkshopCursor;
    this.tivaraSiegeWorkshopFoundation1 = tivaraSiegeWorkshopFoundation1;
    this.tivaraSiegeWorkshopFoundation2 = tivaraSiegeWorkshopFoundation2;
    this.tivaraSiegeWorkshopLevel1 = tivaraSiegeWorkshopLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private tivaraSiegeWorkshopCursor: TivaraSiegeWorkshopCursor;
  private tivaraSiegeWorkshopFoundation1: TivaraSiegeWorkshopFoundation1;
  private tivaraSiegeWorkshopFoundation2: TivaraSiegeWorkshopFoundation2;
  private tivaraSiegeWorkshopLevel1: TivaraSiegeWorkshopLevel1;

  /* START-USER-CODE */
  override name = ObjectNames.TivaraSiegeWorkshop;

  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.tivaraSiegeWorkshopCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.tivaraSiegeWorkshopCursor.visible = progress === null;
    this.tivaraSiegeWorkshopLevel1.visible = progress === 100;
    this.tivaraSiegeWorkshopFoundation1.visible = progress !== null && progress < 50;
    this.tivaraSiegeWorkshopFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
