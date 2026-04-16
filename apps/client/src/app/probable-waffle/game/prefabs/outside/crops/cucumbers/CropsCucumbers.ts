
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { GrowthStageInterface } from "../../../../entity/components/tendable/growth-stage.interface";
import { AnimationType } from "../../../../entity/components/animation/animation-type";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
/* END-USER-IMPORTS */

export default class CropsCucumbers extends Phaser.GameObjects.Image implements GrowthStageInterface {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 31.475384202298084, y ?? 44.8523052137885, texture || "crops", frame ?? "crops/cucumbers/4.png");

    this.setInteractive(
      new Phaser.Geom.Rectangle(3, 0, 25.374089232178203, 38.29440201395316),
      Phaser.Geom.Rectangle.Contains
    );
    this.setOrigin(0.48360575632181513, 0.6917093558108981);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  override name = ObjectNames.CropsCucumbers;

  readonly stageFrames: readonly string[] = [
    "crops/cucumbers/4.png",
    "crops/cucumbers/5.png",
    "crops/cucumbers/6.png",
    "crops/cucumbers/7.png"
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
