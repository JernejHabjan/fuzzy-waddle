// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { configureScenarioMarker } from "../../campaign/scenario/scenario-marker";
/* END-USER-IMPORTS */

export default class ScenarioPoint extends Phaser.GameObjects.Rectangle {
  constructor(scene: Phaser.Scene, x?: number, y?: number, width?: number, height?: number) {
    super(scene, x ?? 16, y ?? 16, width ?? 32, height ?? 32, 0x00ff00, 0.25);
    this.isStroked = true;

    /* START-USER-CTR-CODE */
    configureScenarioMarker(this);
    /* END-USER-CTR-CODE */
  }

  public scenarioId = "";
  public override z = 0;

  /* START-USER-CODE */
  readonly scenarioMarkerKind = "point" as const;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
