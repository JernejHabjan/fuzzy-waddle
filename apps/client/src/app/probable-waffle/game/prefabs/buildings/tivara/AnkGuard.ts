// You can write more code here

/* START OF COMPILED CODE */

import AnkGuardCursor from "./AnkGuard/AnkGuardCursor";
import AnkGuardFoundation1 from "./AnkGuard/AnkGuardFoundation1";
import AnkGuardFoundation2 from "./AnkGuard/AnkGuardFoundation2";
import AnkGuardLevel1 from "./AnkGuard/AnkGuardLevel1";
/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/building/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class AnkGuard extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 128, y ?? 182.8318108210126);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-72.22985939462845 -86.73420955564553 0.01286537585883707 -123.56383394844298 68.9503674444284 -88.15073357075313 69.89471678783346 -63.12547597051896 110.02956388254862 -46.12718778922783 115.22348527127645 -20.62975551729116 114.75131059957391 17.616392890613866 51.95207926313728 47.835571879575866 0.48504004756136965 65.30603473256951 -101.97686371188792 14.7833448603987 -101.97686371188792 -13.074960770050666 -83.08987684378667 -13.547135441753198"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // ankGuardCursor
    const ankGuardCursor = new AnkGuardCursor(scene, 0, 0);
    ankGuardCursor.visible = false;
    this.add(ankGuardCursor);

    // ankGuardFoundation1
    const ankGuardFoundation1 = new AnkGuardFoundation1(scene, 0, 0);
    ankGuardFoundation1.visible = false;
    this.add(ankGuardFoundation1);

    // ankGuardFoundation2
    const ankGuardFoundation2 = new AnkGuardFoundation2(scene, 0, 0);
    ankGuardFoundation2.visible = false;
    this.add(ankGuardFoundation2);

    // ankGuardLevel1
    const ankGuardLevel1 = new AnkGuardLevel1(scene, 0, 0);
    this.add(ankGuardLevel1);

    this.ankGuardCursor = ankGuardCursor;
    this.ankGuardFoundation1 = ankGuardFoundation1;
    this.ankGuardFoundation2 = ankGuardFoundation2;
    this.ankGuardLevel1 = ankGuardLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private ankGuardCursor: AnkGuardCursor;
  private ankGuardFoundation1: AnkGuardFoundation1;
  private ankGuardFoundation2: AnkGuardFoundation2;
  private ankGuardLevel1: AnkGuardLevel1;

  /* START-USER-CODE */
  override name = ObjectNames.AnkGuard;
  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.ankGuardCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.ankGuardCursor.visible = progress === null;
    this.ankGuardLevel1.visible = progress === 100;
    this.ankGuardFoundation1.visible = progress !== null && progress < 50;
    this.ankGuardFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
  };

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
