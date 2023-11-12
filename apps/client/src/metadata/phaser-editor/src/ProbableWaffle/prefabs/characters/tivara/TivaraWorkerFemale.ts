// You can write more code here

/* START OF COMPILED CODE */

import Phaser from 'phaser';
/* START-USER-IMPORTS */
import {
  ANIM_TIVARA_WORKER_FEMALE_IDLE_DOWN,
  ANIM_TIVARA_WORKER_FEMALE_SLASH_DOWN
} from '../../../../../../../assets/probable-waffle/spritesheets/characters/tivara/worker_female/worker_female_anims';
/* END-USER-IMPORTS */

export default class TivaraWorkerFemale extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 57.107040025447624, texture || 'worker_female_idle_1', frame ?? 4);

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 32), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.8922974795475218);
    this.play('tivara_worker_female_idle_down');

    /* START-USER-CTR-CODE */
    this.on('pointerdown', () => {
      this.setTint(0xff0000); // Tint to red

      // and play anim skaduwee_worker_male_slash_down
      this.play(ANIM_TIVARA_WORKER_FEMALE_SLASH_DOWN, true);
      // after anim complete, remove tint
      this.once('animationcomplete', () => {
        this.clearTint();
        this.play(ANIM_TIVARA_WORKER_FEMALE_IDLE_DOWN, true);
      });
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
