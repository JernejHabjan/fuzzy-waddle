// You can write more code here

/* START OF COMPILED CODE */

import WatchTowerCursor from "./WatchTower/WatchTowerCursor";
import WatchTowerFoundation1 from "./WatchTower/WatchTowerFoundation1";
import WatchTowerFoundation2 from "./WatchTower/WatchTowerFoundation2";
import WatchTowerLevel1 from "./WatchTower/WatchTowerLevel1";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import {
  ConstructionGameObjectInterfaceComponent
} from "../../../../entity/building/construction/construction-game-object-interface-component";
import { setActorData } from "../../../../data/actor-data";
/* END-USER-IMPORTS */

export default class WatchTower extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 148);

    this.blendMode = Phaser.BlendModes.SKIP_CHECK;

    // watchTowerCursor
    const watchTowerCursor = new WatchTowerCursor(scene, 0, 0);
    watchTowerCursor.visible = false;
    this.add(watchTowerCursor);

    // watchTowerFoundation1
    const watchTowerFoundation1 = new WatchTowerFoundation1(scene, 0, 0);
    watchTowerFoundation1.visible = false;
    this.add(watchTowerFoundation1);

    // watchTowerFoundation2
    const watchTowerFoundation2 = new WatchTowerFoundation2(scene, 0, 0);
    this.add(watchTowerFoundation2);

    // watchTowerLevel1
    const watchTowerLevel1 = new WatchTowerLevel1(scene, 0, 0);
    this.add(watchTowerLevel1);

    this.watchTowerCursor = watchTowerCursor;
    this.watchTowerFoundation1 = watchTowerFoundation1;
    this.watchTowerFoundation2 = watchTowerFoundation2;
    this.watchTowerLevel1 = watchTowerLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private watchTowerCursor: WatchTowerCursor;
  private watchTowerFoundation1: WatchTowerFoundation1;
  private watchTowerFoundation2: WatchTowerFoundation2;
  private watchTowerLevel1: WatchTowerLevel1;

  /* START-USER-CODE */
  name = ObjectNames.WatchTower;
  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.watchTowerCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.watchTowerCursor.visible = progress === null;
    this.watchTowerLevel1.visible = progress === 100;
    this.watchTowerFoundation1.visible = progress !== null && progress < 50;
    this.watchTowerFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
