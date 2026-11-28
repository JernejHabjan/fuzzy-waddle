import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import SkaduweeSiegeWorkshopCursor from "./SkaduweeSiegeWorkshop/SkaduweeSiegeWorkshopCursor";
import SkaduweeSiegeWorkshopFoundation1 from "./SkaduweeSiegeWorkshop/SkaduweeSiegeWorkshopFoundation1";
import SkaduweeSiegeWorkshopFoundation2 from "./SkaduweeSiegeWorkshop/SkaduweeSiegeWorkshopFoundation2";
import SkaduweeSiegeWorkshopLevel1 from "./SkaduweeSiegeWorkshop/SkaduweeSiegeWorkshopLevel1";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/components/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class SkaduweeSiegeWorkshop extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 96);

    this.setInteractive(new Phaser.Geom.Polygon("-64 -48 0 -80 64 -48 64 16 0 48 -64 16"), Phaser.Geom.Polygon.Contains);

    // skaduweeSiegeWorkshopCursor
    const skaduweeSiegeWorkshopCursor = new SkaduweeSiegeWorkshopCursor(scene, 0, 0);
    skaduweeSiegeWorkshopCursor.visible = false;
    this.add(skaduweeSiegeWorkshopCursor);

    // skaduweeSiegeWorkshopFoundation1
    const skaduweeSiegeWorkshopFoundation1 = new SkaduweeSiegeWorkshopFoundation1(scene, 0, 0);
    skaduweeSiegeWorkshopFoundation1.visible = false;
    this.add(skaduweeSiegeWorkshopFoundation1);

    // skaduweeSiegeWorkshopFoundation2
    const skaduweeSiegeWorkshopFoundation2 = new SkaduweeSiegeWorkshopFoundation2(scene, 0, 0);
    skaduweeSiegeWorkshopFoundation2.visible = false;
    this.add(skaduweeSiegeWorkshopFoundation2);

    // skaduweeSiegeWorkshopLevel1
    const skaduweeSiegeWorkshopLevel1 = new SkaduweeSiegeWorkshopLevel1(scene, 0, 0);
    this.add(skaduweeSiegeWorkshopLevel1);

    this.skaduweeSiegeWorkshopCursor = skaduweeSiegeWorkshopCursor;
    this.skaduweeSiegeWorkshopFoundation1 = skaduweeSiegeWorkshopFoundation1;
    this.skaduweeSiegeWorkshopFoundation2 = skaduweeSiegeWorkshopFoundation2;
    this.skaduweeSiegeWorkshopLevel1 = skaduweeSiegeWorkshopLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private skaduweeSiegeWorkshopCursor: SkaduweeSiegeWorkshopCursor;
  private skaduweeSiegeWorkshopFoundation1: SkaduweeSiegeWorkshopFoundation1;
  private skaduweeSiegeWorkshopFoundation2: SkaduweeSiegeWorkshopFoundation2;
  private skaduweeSiegeWorkshopLevel1: SkaduweeSiegeWorkshopLevel1;

  /* START-USER-CODE */
  override name = ObjectNames.SkaduweeSiegeWorkshop;

  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.skaduweeSiegeWorkshopCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.skaduweeSiegeWorkshopCursor.visible = progress === null;
    this.skaduweeSiegeWorkshopLevel1.visible = progress === 100;
    this.skaduweeSiegeWorkshopFoundation1.visible = progress !== null && progress < 50;
    this.skaduweeSiegeWorkshopFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
