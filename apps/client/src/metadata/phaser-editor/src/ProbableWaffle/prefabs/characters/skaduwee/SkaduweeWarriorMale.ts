// You can write more code here

/* START OF COMPILED CODE */

import Phaser from 'phaser';
/* START-USER-IMPORTS */
import {
  ANIM_SKADUWEE_WARRIOR_MALE_IDLE_DOWN,
  ANIM_SKADUWEE_WARRIOR_MALE_SMASH_DOWN
} from '../../../../../static/shared-assets/probable-waffle/spritesheets/characters/skaduwee/warrior_male/warrior_male_anims';
/* END-USER-IMPORTS */

export default class SkaduweeWarriorMale extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 57.77331682786765);

    this.setInteractive(new Phaser.Geom.Circle(0, 0, 32), Phaser.Geom.Circle.Contains);

    // skaduwee_warrior_male_idle_down
    const skaduwee_warrior_male_idle_down = scene.add.sprite(0, -25.773318048605454, 'warrior_male_idle', 4);
    skaduwee_warrior_male_idle_down.play('skaduwee_warrior_male_idle_down');
    this.add(skaduwee_warrior_male_idle_down);

    /* START-USER-CTR-CODE */
    // Write your code here.
    this.on('pointerdown', () => {
      skaduwee_warrior_male_idle_down.setTint(0xff0000); // Tint to red

      // and play anim skaduwee_worker_male_slash_down
      skaduwee_warrior_male_idle_down.play(ANIM_SKADUWEE_WARRIOR_MALE_SMASH_DOWN, true);
      // after anim complete, remove tint
      skaduwee_warrior_male_idle_down.once('animationcomplete', () => {
        skaduwee_warrior_male_idle_down.clearTint();
        skaduwee_warrior_male_idle_down.play(ANIM_SKADUWEE_WARRIOR_MALE_IDLE_DOWN, true);
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
