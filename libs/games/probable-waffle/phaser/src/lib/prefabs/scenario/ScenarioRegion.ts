import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { configureScenarioMarker } from "../../campaign/scenario/scenario-marker";
/* END-USER-IMPORTS */

export default class ScenarioRegion extends Phaser.GameObjects.Rectangle {
  constructor(scene: Phaser.Scene, x?: number, y?: number, width?: number, height?: number) {
    super(scene, x ?? 64, y ?? 64, width ?? 128, height ?? 128, 0x00ffff, 0.2);
    this.isStroked = true;

    /* START-USER-CTR-CODE */
    configureScenarioMarker(this);
    /* END-USER-CTR-CODE */
  }

  public scenarioId = "";
  public shape: "rectangle" | "polygon" = "rectangle";
  public polygonPoints = "";
  public elevationPolicy: "any" | "same-level" | "range" = "any";
  public elevation = 0;
  public minimumElevation = 0;
  public maximumElevation = 0;

  /* START-USER-CODE */
  readonly scenarioMarkerKind = "region" as const;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
