// You can write more code here

/* START OF COMPILED CODE */

import WorkMillCursor from "./WorkMill/WorkMillCursor";
import WorkMillFoundation1 from "./WorkMill/WorkMillFoundation1";
import WorkMillFoundation2 from "./WorkMill/WorkMillFoundation2";
import WorkMillLevel1 from "./WorkMill/WorkMillLevel1";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/building/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class WorkMill extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 96);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-63.89974877636719 -65.64818497632388 -36.35219201632184 -96.09548455321611 16.32646915639647 -69.99779920159419 16.568114391133705 -48.974663779454325 41.215928334332176 -61.781861220528036 51.60667342803349 -53.80756847419912 52.33160913224522 -20.460526080460014 62.72235422594652 -9.103200047809736 60.30590187857412 0.07931887220537703 7.385595471118592 31.25155415330933 -49.64267992687003 27.62687563225073 -59.79177978583411 7.570321149059822 -58.82519884688515 -61.781861220528036"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // workMillCursor
    const workMillCursor = new WorkMillCursor(scene, 0, 0);
    workMillCursor.visible = false;
    this.add(workMillCursor);

    // workMillFoundation1
    const workMillFoundation1 = new WorkMillFoundation1(scene, 0, 0);
    workMillFoundation1.visible = false;
    this.add(workMillFoundation1);

    // workMillFoundation2
    const workMillFoundation2 = new WorkMillFoundation2(scene, 0, 0);
    workMillFoundation2.visible = false;
    this.add(workMillFoundation2);

    // workMillLevel1
    const workMillLevel1 = new WorkMillLevel1(scene, 0, 0);
    this.add(workMillLevel1);

    this.workMillCursor = workMillCursor;
    this.workMillFoundation1 = workMillFoundation1;
    this.workMillFoundation2 = workMillFoundation2;
    this.workMillLevel1 = workMillLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private workMillCursor: WorkMillCursor;
  private workMillFoundation1: WorkMillFoundation1;
  private workMillFoundation2: WorkMillFoundation2;
  private workMillLevel1: WorkMillLevel1;

  /* START-USER-CODE */
  override name = ObjectNames.WorkMill;
  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.workMillCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.workMillCursor.visible = progress === null;
    this.workMillLevel1.visible = progress === 100;
    this.workMillFoundation1.visible = progress !== null && progress < 50;
    this.workMillFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
  };

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
