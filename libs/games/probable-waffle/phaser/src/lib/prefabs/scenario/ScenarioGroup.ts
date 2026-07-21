// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { configureScenarioMarker } from "../../campaign/scenario/scenario-marker";
/* END-USER-IMPORTS */

export default class ScenarioGroup extends Phaser.GameObjects.Rectangle {
  constructor(scene: Phaser.Scene, x?: number, y?: number, width?: number, height?: number) {
    super(scene, x ?? 32, y ?? 16, width ?? 64, height ?? 32, 0xaa00ff, 0.2);
    this.isStroked = true;

    /* START-USER-CTR-CODE */
    configureScenarioMarker(this);
    /* END-USER-CTR-CODE */
  }

  public scenarioId = "";
  public memberActorIds = "";
  public requiredTags = "";

  /* START-USER-CODE */
  readonly scenarioMarkerKind = "group" as const;
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
