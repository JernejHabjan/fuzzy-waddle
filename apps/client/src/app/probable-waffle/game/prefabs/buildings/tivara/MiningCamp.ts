// You can write more code here

/* START OF COMPILED CODE */

import MiningCampCursor from "./MiningCamp/MiningCampCursor";
import MiningCampFoundation1 from "./MiningCamp/MiningCampFoundation1";
import MiningCampFoundation2 from "./MiningCamp/MiningCampFoundation2";
import MiningCampLevel1 from "./MiningCamp/MiningCampLevel1";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { setActorData } from "../../../data/actor-data";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/components/construction/construction-game-object-interface-component";
/* END-USER-IMPORTS */

export default class MiningCamp extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 96);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-63.89974877636719 -65.64818497632388 -36.35219201632184 -96.09548455321611 16.32646915639647 -69.99779920159419 16.568114391133705 -48.974663779454325 41.215928334332176 -61.781861220528036 51.60667342803349 -53.80756847419912 52.33160913224522 -20.460526080460014 62.72235422594652 -9.103200047809736 60.30590187857412 0.07931887220537703 7.385595471118592 31.25155415330933 -49.64267992687003 27.62687563225073 -59.79177978583411 7.570321149059822 -58.82519884688515 -61.781861220528036"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // miningCampCursor
    const miningCampCursor = new MiningCampCursor(scene, 0, 0);
    miningCampCursor.visible = false;
    this.add(miningCampCursor);

    // miningCampFoundation1
    const miningCampFoundation1 = new MiningCampFoundation1(scene, 0, 0);
    miningCampFoundation1.visible = false;
    this.add(miningCampFoundation1);

    // miningCampFoundation2
    const miningCampFoundation2 = new MiningCampFoundation2(scene, 0, 0);
    miningCampFoundation2.visible = false;
    this.add(miningCampFoundation2);

    // miningCampLevel1
    const miningCampLevel1 = new MiningCampLevel1(scene, 0, 0);
    this.add(miningCampLevel1);

    this.miningCampCursor = miningCampCursor;
    this.miningCampFoundation1 = miningCampFoundation1;
    this.miningCampFoundation2 = miningCampFoundation2;
    this.miningCampLevel1 = miningCampLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private miningCampCursor: MiningCampCursor;
  private miningCampFoundation1: MiningCampFoundation1;
  private miningCampFoundation2: MiningCampFoundation2;
  private miningCampLevel1: MiningCampLevel1;

  /* START-USER-CODE */
  override name = ObjectNames.MiningCamp;
  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.miningCampCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.miningCampCursor.visible = progress === null;
    this.miningCampLevel1.visible = progress === 100;
    this.miningCampFoundation1.visible = progress !== null && progress < 50;
    this.miningCampFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
