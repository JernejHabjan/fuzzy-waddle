
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { GrowthStageInterface } from "../../../../entity/components/tendable/growth-stage.interface";
import { AnimationType } from "../../../../entity/components/animation/animation-type";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
/* END-USER-IMPORTS */

export default class CropsCabbage extends Phaser.GameObjects.Image implements GrowthStageInterface {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 31.68692833330426, y ?? 43.93006833295536, texture || "crops", frame ?? "crops/cabbage/4.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 16, 10.28109453790222), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.4902165104157581, 0.6228146354048549);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  override name = ObjectNames.CropsCabbage;

  readonly stageFrames: readonly string[] = [
    "crops/cabbage/4.png",
    "crops/cabbage/5.png",
    "crops/cabbage/6.png",
    "crops/cabbage/7.png"
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
