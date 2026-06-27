
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { GrowthStageInterface } from "../../../../entity/components/tendable/growth-stage.interface";
import { AnimationType } from "../../../../entity/components/animation/animation-type";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
/* END-USER-IMPORTS */

export default class CropsPumpkin extends Phaser.GameObjects.Image implements GrowthStageInterface {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32.075915342458664, y ?? 41.015788493803065, texture || "crops", frame ?? "crops/pumpkin/12.png");

    this.setInteractive(
      new Phaser.Geom.Rectangle(6, 4, 18.74268562137708, 39.66962822472475),
      Phaser.Geom.Rectangle.Contains
    );
    this.setOrigin(0.5023723544518333, 0.620662749885242);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  override name = ObjectNames.CropsPumpkin;

  readonly stageFrames: readonly string[] = [
    "crops/pumpkin/12.png",
    "crops/pumpkin/13.png",
    "crops/pumpkin/14.png",
    "crops/pumpkin/15.png"
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
