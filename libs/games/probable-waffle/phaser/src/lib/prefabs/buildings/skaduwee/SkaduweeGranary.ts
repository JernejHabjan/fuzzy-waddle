import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import SkaduweeGranaryCursor from "./SkaduweeGranary/SkaduweeGranaryCursor";
import SkaduweeGranaryFoundation1 from "./SkaduweeGranary/SkaduweeGranaryFoundation1";
import SkaduweeGranaryFoundation2 from "./SkaduweeGranary/SkaduweeGranaryFoundation2";
import SkaduweeGranaryLevel1 from "./SkaduweeGranary/SkaduweeGranaryLevel1";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { ConstructionGameObjectInterfaceComponent } from "../../../entity/components/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class SkaduweeGranary extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 96);

    this.setInteractive(new Phaser.Geom.Polygon("-64 -48 0 -80 64 -48 64 16 0 48 -64 16"), Phaser.Geom.Polygon.Contains);

    // skaduweeGranaryCursor
    const skaduweeGranaryCursor = new SkaduweeGranaryCursor(scene, 0, 0);
    skaduweeGranaryCursor.visible = false;
    this.add(skaduweeGranaryCursor);

    // skaduweeGranaryFoundation1
    const skaduweeGranaryFoundation1 = new SkaduweeGranaryFoundation1(scene, 0, 0);
    skaduweeGranaryFoundation1.visible = false;
    this.add(skaduweeGranaryFoundation1);

    // skaduweeGranaryFoundation2
    const skaduweeGranaryFoundation2 = new SkaduweeGranaryFoundation2(scene, 0, 0);
    skaduweeGranaryFoundation2.visible = false;
    this.add(skaduweeGranaryFoundation2);

    // skaduweeGranaryLevel1
    const skaduweeGranaryLevel1 = new SkaduweeGranaryLevel1(scene, 0, 0);
    this.add(skaduweeGranaryLevel1);

    this.skaduweeGranaryCursor = skaduweeGranaryCursor;
    this.skaduweeGranaryFoundation1 = skaduweeGranaryFoundation1;
    this.skaduweeGranaryFoundation2 = skaduweeGranaryFoundation2;
    this.skaduweeGranaryLevel1 = skaduweeGranaryLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private skaduweeGranaryCursor: SkaduweeGranaryCursor;
  private skaduweeGranaryFoundation1: SkaduweeGranaryFoundation1;
  private skaduweeGranaryFoundation2: SkaduweeGranaryFoundation2;
  private skaduweeGranaryLevel1: SkaduweeGranaryLevel1;

  /* START-USER-CODE */
  override name = ObjectNames.SkaduweeGranary;

  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.skaduweeGranaryCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.skaduweeGranaryCursor.visible = progress === null;
    this.skaduweeGranaryLevel1.visible = progress === 100;
    this.skaduweeGranaryFoundation1.visible = progress !== null && progress < 50;
    this.skaduweeGranaryFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
