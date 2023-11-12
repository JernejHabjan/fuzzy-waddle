// You can write more code here

/* START OF COMPILED CODE */

import Phaser from 'phaser';
/* START-USER-IMPORTS */
import {
  ANIM_SKADUWEE_MAGICIAN_FEMALE_CAST_DOWN,
  ANIM_SKADUWEE_MAGICIAN_FEMALE_IDLE_DOWN
} from '../../../../../static/shared-assets/probable-waffle/spritesheets/characters/skaduwee/magician_female/magician_female_anim';
/* END-USER-IMPORTS */

export default class SkaduweeMagicianFemale extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 57.57118202562538);

    this.setInteractive(new Phaser.Geom.Circle(0, 0, 32), Phaser.Geom.Circle.Contains);

    // skaduwee_magician_female_idle_down
    const skaduwee_magician_female_idle_down = scene.add.sprite(0, -25.571183923696843, 'magician_female_idle', 4);
    skaduwee_magician_female_idle_down.play('skaduwee_magician_female_idle_down');
    this.add(skaduwee_magician_female_idle_down);

    /* START-USER-CTR-CODE */
    // Write your code here.
    this.on('pointerdown', () => {
      skaduwee_magician_female_idle_down.setTint(0xff0000); // Tint to red

      // and play anim skaduwee_worker_male_slash_down
      skaduwee_magician_female_idle_down.play(ANIM_SKADUWEE_MAGICIAN_FEMALE_CAST_DOWN, true);
      // after anim complete, remove tint
      skaduwee_magician_female_idle_down.once('animationcomplete', () => {
        skaduwee_magician_female_idle_down.clearTint();
        skaduwee_magician_female_idle_down.play(ANIM_SKADUWEE_MAGICIAN_FEMALE_IDLE_DOWN, true);
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
