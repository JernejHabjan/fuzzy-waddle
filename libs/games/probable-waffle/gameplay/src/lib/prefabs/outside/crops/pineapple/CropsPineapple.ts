
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { GrowthStageInterface } from "../../../../entity/components/tendable/growth-stage.interface";
import { AnimationType } from "../../../../entity/components/animation/animation-type";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
/* END-USER-IMPORTS */

export default class CropsPineapple extends Phaser.GameObjects.Image implements GrowthStageInterface {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32.58894577258347,
      y ?? 50.083961964526125,
      texture || "crops",
      frame ?? "crops/pineapple/16.png"
    );

    this.setInteractive(new Phaser.Geom.Circle(17, 20, 8.460999368206362), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5184045553932335, 0.8151238113914414);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  override name = ObjectNames.CropsPineapple;

  readonly stageFrames: readonly string[] = [
    "crops/pineapple/16.png",
    "crops/pineapple/17.png",
    "crops/pineapple/18.png",
    "crops/pineapple/19.png"
  ];
  readonly harvestAnimation = AnimationType.Harvest;
  readonly harvestSound = SoundType.Chop;
  readonly tendAnimation = AnimationType.Dig;

  setStage(stageIndex: number): void {
    const frame = this.stageFrames[stageIndex];
    if (frame !== undefined) this.setFrame(frame);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
