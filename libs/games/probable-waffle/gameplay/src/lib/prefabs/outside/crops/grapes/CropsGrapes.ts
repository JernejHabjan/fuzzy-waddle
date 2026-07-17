
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { GrowthStageInterface } from "../../../../entity/components/tendable/growth-stage.interface";
import { AnimationType } from "../../../../entity/components/animation/animation-type";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
/* END-USER-IMPORTS */

export default class CropsGrapes extends Phaser.GameObjects.Image implements GrowthStageInterface {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 31.568981912365057, y ?? 50.58610852580966, texture || "crops", frame ?? "crops/grapes/0.png");

    this.setInteractive(
      new Phaser.Geom.Rectangle(3, 0, 25.247387403538106, 42.945291313992186),
      Phaser.Geom.Rectangle.Contains
    );
    this.setOrigin(0.48653068476140804, 0.7978908986261047);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  override name = ObjectNames.CropsGrapes;

  readonly stageFrames: readonly string[] = [
    "crops/grapes/0.png",
    "crops/grapes/1.png",
    "crops/grapes/2.png",
    "crops/grapes/3.png"
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
