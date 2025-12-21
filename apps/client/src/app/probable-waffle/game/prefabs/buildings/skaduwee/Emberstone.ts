// You can write more code here

/* START OF COMPILED CODE */

import EmberstoneCursor from "./Emberstone/EmberstoneCursor";
import EmberstoneFoundation1 from "./Emberstone/EmberstoneFoundation1";
import EmberstoneLevel1 from "./Emberstone/EmberstoneLevel1";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/components/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class Emberstone extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 15.99154048826449, y ?? 54.535253459978904);

		this.setInteractive(new Phaser.Geom.Polygon("-23.458392181796142 -67.23014929027885 0.0015186356688623448 -84.92122957885901 22.3076633473569 -69.53768150183278 26.15355036661346 -6.46513438602522 32.30696959742395 3.1495831621161727 -0.5751191417874324 19.805161133512343 -32.56631031021266 2.9370785174335907"), Phaser.Geom.Polygon.Contains);

		// emberStoneCursor
		const emberStoneCursor = new EmberstoneCursor(scene, 0, 0);
		emberStoneCursor.visible = false;
		this.add(emberStoneCursor);

		// emberStoneFoundation1
		const emberStoneFoundation1 = new EmberstoneFoundation1(scene, 0, 0);
		emberStoneFoundation1.visible = false;
		this.add(emberStoneFoundation1);

		// emberStoneLevel1
		const emberStoneLevel1 = new EmberstoneLevel1(scene, 0, 0);
		this.add(emberStoneLevel1);

		this.emberStoneCursor = emberStoneCursor;
		this.emberStoneFoundation1 = emberStoneFoundation1;
		this.emberStoneLevel1 = emberStoneLevel1;

		/* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
	}

	private emberStoneCursor: EmberstoneCursor;
	private emberStoneFoundation1: EmberstoneFoundation1;
	private emberStoneLevel1: EmberstoneLevel1;

	/* START-USER-CODE */
  override name = ObjectNames.Emberstone;

  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.emberStoneCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.emberStoneCursor.visible = progress === null;
    this.emberStoneLevel1.visible = progress === 100;
    this.emberStoneFoundation1.visible = progress !== null && progress < 100;
    if (this.emberStoneLevel1.visible) {
      this.emberStoneLevel1.start();
    }
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
