// You can write more code here

/* START OF COMPILED CODE */

import Phaser from 'phaser';
/* START-USER-IMPORTS */
import {
  ANIM_SKADUWEE_WORKER_MALE_IDLE_DOWN,
  ANIM_SKADUWEE_WORKER_MALE_SLASH_DOWN
} from '../../../../../static/shared-assets/probable-waffle/spritesheets/characters/skaduwee/worker_male/worker_male_anims';
/* END-USER-IMPORTS */

export default class skaduweeWorkerMale extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 57.56281114690988, texture || 'worker_male_idle', frame ?? 4);

    this.setInteractive(new Phaser.Geom.Ellipse(32, 32, 64, 64), Phaser.Geom.Ellipse.Contains);
    this.setOrigin(0.5, 0.8994189111288416);
    this.play('skaduwee_worker_male_idle_down');

    /* START-USER-CTR-CODE */
    this.on('pointerdown', () => {
      this.setTint(0xff0000); // Tint to red

      // and play anim skaduwee_worker_male_slash_down
      this.play(ANIM_SKADUWEE_WORKER_MALE_SLASH_DOWN);
      // after anim complete, remove tint
      this.once('animationcomplete', () => {
        this.clearTint();
        this.play(ANIM_SKADUWEE_WORKER_MALE_IDLE_DOWN);
      });
    }); // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
