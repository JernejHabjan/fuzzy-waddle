
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { GrowthStageInterface } from "../../../../../entity/components/tendable/growth-stage.interface";
import { AnimationType } from "../../../../../entity/components/animation/animation-type";
import { SoundType } from "../../../../../entity/components/actor-audio/sound-type";
/* END-USER-IMPORTS */

export default class GroundChampignons extends Phaser.GameObjects.Image implements GrowthStageInterface {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "crops", frame ?? "ground/champignons/9.png");

    this.setInteractive(new Phaser.Geom.Rectangle(2, 12, 11.267511314512866, 15.573882354433351), Phaser.Geom.Rectangle.Contains);
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  override name = ObjectNames.GroundChampignons;

  readonly harvestAnimation = AnimationType.Thrust;
  readonly harvestSound = SoundType.Chop;
  readonly tendAnimation = AnimationType.Thrust;

  setStage(stageIndex: number): void {
    this.setVisible(stageIndex < 3);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
