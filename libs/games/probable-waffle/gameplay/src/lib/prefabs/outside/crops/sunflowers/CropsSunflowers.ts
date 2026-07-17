
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { GrowthStageInterface } from "../../../../entity/components/tendable/growth-stage.interface";
import { AnimationType } from "../../../../entity/components/animation/animation-type";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
/* END-USER-IMPORTS */

export default class CropsSunflowers extends Phaser.GameObjects.Image implements GrowthStageInterface {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32.43021011352539,
      y ?? 57.059486153612895,
      texture || "crops",
      frame ?? "crops/sunflowers/16.png"
    );

    this.setInteractive(
      new Phaser.Geom.Rectangle(8, 7, 15.820104173832735, 42.83658177534231),
      Phaser.Geom.Rectangle.Contains
    );
    this.setOrigin(0.513444065221452, 0.9177682357527348);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  override name = ObjectNames.CropsSunflowers;

  readonly stageFrames: readonly string[] = [
    "crops/sunflowers/16.png",
    "crops/sunflowers/17.png",
    "crops/sunflowers/18.png",
    "crops/sunflowers/19.png"
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
