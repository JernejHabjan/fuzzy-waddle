import Phaser from "phaser";
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { configureScenarioMarker } from "../../campaign/scenario/scenario-marker";
/* END-USER-IMPORTS */

export default class ScenarioRoute extends Phaser.GameObjects.Rectangle {
  constructor(scene: Phaser.Scene, x?: number, y?: number, width?: number, height?: number) {
    super(scene, x ?? 32, y ?? 16, width ?? 64, height ?? 32, 0xffaa00, 0.2);
    this.isStroked = true;

    /* START-USER-CTR-CODE */
    configureScenarioMarker(this);
    /* END-USER-CTR-CODE */
  }

  public scenarioId = "";
  public pointIds = "";
  public loop = false;
  public facingAngles = "";

  /* START-USER-CODE */
  readonly scenarioMarkerKind = "route" as const;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
