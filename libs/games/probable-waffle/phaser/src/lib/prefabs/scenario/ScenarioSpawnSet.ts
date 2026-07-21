// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { configureScenarioMarker } from "../../campaign/scenario/scenario-marker";
/* END-USER-IMPORTS */

export default class ScenarioSpawnSet extends Phaser.GameObjects.Rectangle {
  constructor(scene: Phaser.Scene, x?: number, y?: number, width?: number, height?: number) {
    super(scene, x ?? 32, y ?? 32, width ?? 64, height ?? 64, 0xff0055, 0.2);
    this.isStroked = true;

    /* START-USER-CTR-CODE */
    configureScenarioMarker(this);
    /* END-USER-CTR-CODE */
  }

  public scenarioId = "";
  public pointIds = "";

  /* START-USER-CODE */
  readonly scenarioMarkerKind = "spawn-set" as const;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
