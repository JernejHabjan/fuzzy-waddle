// You can write more code here

/* START OF COMPILED CODE */

import Phaser from 'phaser';
/* START-USER-IMPORTS */
import {
  ANIM_GENERAL_WARRIOR_IDLE_DOWN,
  ANIM_GENERAL_WARRIOR_THRUST_DOWN
} from '../../../../../static/shared-assets/probable-waffle/spritesheets/characters/general/warrior/warrior_anim';
/* END-USER-IMPORTS */

export default class GeneralWarrior extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 57.554331622949405, texture || 'warrior_idle', frame ?? 4);

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 32), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.899286430676403);
    this.play('general_warrior_idle_down');

    /* START-USER-CTR-CODE */
    this.on('pointerdown', () => {
      this.setTint(0xff0000); // Tint to red

      // and play anim skaduwee_worker_male_slash_down
      this.play(ANIM_GENERAL_WARRIOR_THRUST_DOWN, true);
      // after anim complete, remove tint
      this.once('animationcomplete', () => {
        this.clearTint();
        this.play(ANIM_GENERAL_WARRIOR_IDLE_DOWN, true);
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
