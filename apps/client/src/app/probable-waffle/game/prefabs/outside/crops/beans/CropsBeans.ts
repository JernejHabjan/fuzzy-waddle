
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { GrowthStageInterface } from "../../../../entity/components/tendable/growth-stage.interface";
import { AnimationType } from "../../../../entity/components/animation/animation-type";
import { SoundType } from "../../../../entity/components/actor-audio/sound-type";
/* END-USER-IMPORTS */

export default class CropsBeans extends Phaser.GameObjects.Image implements GrowthStageInterface {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 30.520721081669922, y ?? 48.98618594555339, texture || "crops", frame ?? "crops/beans/8.png");

    this.setInteractive(
      new Phaser.Geom.Rectangle(6, 10, 18.153857824404177, 33.470321000656455),
      Phaser.Geom.Rectangle.Contains
    );
    this.setOrigin(0.4537725338021851, 0.7682627026954331);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  override name = ObjectNames.CropsBeans;

  readonly stageFrames: readonly string[] = [
    "crops/beans/8.png",
    "crops/beans/9.png",
    "crops/beans/10.png",
    "crops/beans/11.png"
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
