import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import TivaraGranaryCursor from "./TivaraGranary/TivaraGranaryCursor";
import TivaraGranaryFoundation1 from "./TivaraGranary/TivaraGranaryFoundation1";
import TivaraGranaryFoundation2 from "./TivaraGranary/TivaraGranaryFoundation2";
import TivaraGranaryLevel1 from "./TivaraGranary/TivaraGranaryLevel1";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  ConstructionGameObjectInterfaceComponent
} from "../../../entity/components/construction/construction-game-object-interface-component";
import { setActorData } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class TivaraGranary extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 96);

    this.setInteractive(new Phaser.Geom.Polygon("-64 -48 0 -80 64 -48 64 16 0 48 -64 16"), Phaser.Geom.Polygon.Contains);

    // tivaraGranaryCursor
    const tivaraGranaryCursor = new TivaraGranaryCursor(scene, 0, 0);
    tivaraGranaryCursor.visible = false;
    this.add(tivaraGranaryCursor);

    // tivaraGranaryFoundation1
    const tivaraGranaryFoundation1 = new TivaraGranaryFoundation1(scene, 0, 0);
    tivaraGranaryFoundation1.visible = false;
    this.add(tivaraGranaryFoundation1);

    // tivaraGranaryFoundation2
    const tivaraGranaryFoundation2 = new TivaraGranaryFoundation2(scene, 0, 0);
    tivaraGranaryFoundation2.visible = false;
    this.add(tivaraGranaryFoundation2);

    // tivaraGranaryLevel1
    const tivaraGranaryLevel1 = new TivaraGranaryLevel1(scene, 0, 0);
    this.add(tivaraGranaryLevel1);

    this.tivaraGranaryCursor = tivaraGranaryCursor;
    this.tivaraGranaryFoundation1 = tivaraGranaryFoundation1;
    this.tivaraGranaryFoundation2 = tivaraGranaryFoundation2;
    this.tivaraGranaryLevel1 = tivaraGranaryLevel1;

    /* START-USER-CTR-CODE */
    this.setup();
    /* END-USER-CTR-CODE */
  }

  private tivaraGranaryCursor: TivaraGranaryCursor;
  private tivaraGranaryFoundation1: TivaraGranaryFoundation1;
  private tivaraGranaryFoundation2: TivaraGranaryFoundation2;
  private tivaraGranaryLevel1: TivaraGranaryLevel1;

  /* START-USER-CODE */
  override name = ObjectNames.TivaraGranary;

  private setup() {
    setActorData(
      this,
      [new ConstructionGameObjectInterfaceComponent(this, this.handlePrefabVisibility, this.tivaraGranaryCursor)],
      []
    );
  }

  private handlePrefabVisibility = (progress: number | null) => {
    this.tivaraGranaryCursor.visible = progress === null;
    this.tivaraGranaryLevel1.visible = progress === 100;
    this.tivaraGranaryFoundation1.visible = progress !== null && progress < 50;
    this.tivaraGranaryFoundation2.visible = progress !== null && progress >= 50 && progress < 100;
  };
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
