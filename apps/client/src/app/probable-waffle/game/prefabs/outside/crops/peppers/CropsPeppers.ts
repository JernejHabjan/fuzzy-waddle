
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { GrowthStageInterface } from "../../../../entity/components/tendable/growth-stage.interface";
import { AnimationType } from "../../../../entity/components/animation/animation-type";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
/* END-USER-IMPORTS */

export default class CropsPeppers extends Phaser.GameObjects.Image implements GrowthStageInterface {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 31.621740899838485, y ?? 50.710856884490866, texture || "crops", frame ?? "crops/peppers/0.png");

    this.setInteractive(
      new Phaser.Geom.Rectangle(7, 1, 18.446827399365826, 29.717491181808942),
      Phaser.Geom.Rectangle.Contains
    );
    this.setOrigin(0.48817940311995267, 0.8347142776403396);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  override name = ObjectNames.CropsPeppers;

  readonly stageFrames: readonly string[] = [
    "crops/peppers/0.png",
    "crops/peppers/1.png",
    "crops/peppers/2.png",
    "crops/peppers/3.png"
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
