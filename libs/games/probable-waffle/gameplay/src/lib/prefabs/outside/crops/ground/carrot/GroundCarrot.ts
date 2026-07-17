
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { GrowthStageInterface } from "../../../../../entity/components/tendable/growth-stage.interface";
import { AnimationType } from "../../../../../entity/components/animation/animation-type";
import { SoundType } from "../../../../../entity/components/actor-audio/sound-type";
/* END-USER-IMPORTS */

export default class GroundCarrot extends Phaser.GameObjects.Image implements GrowthStageInterface {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 31.538915872648193, y ?? 49.936553334877594, texture || "crops", frame ?? "ground/carrot/0.png");

    this.setInteractive(new Phaser.Geom.Rectangle(2, 2, 10.70759916827163, 25.1165484518495), Phaser.Geom.Rectangle.Contains);
    this.setOrigin(0.47118224204051207, 0.8105172917149248);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  override name = ObjectNames.GroundCarrot;

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
