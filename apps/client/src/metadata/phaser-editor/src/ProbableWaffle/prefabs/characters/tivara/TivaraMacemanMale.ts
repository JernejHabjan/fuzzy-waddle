// You can write more code here

/* START OF COMPILED CODE */

import Phaser from 'phaser';
/* START-USER-IMPORTS */
import {
  ANIM_TIVARA_MACEMAN_MALE_IDLE_DOWN,
  ANIM_TIVARA_MACEMAN_MALE_LARGE_SLASH_DOWN
} from '../../../../../../../assets/probable-waffle/spritesheets/characters/tivara/maceman_male/maceman_male_anims';
/* END-USER-IMPORTS */

export default class TivaraMacemanMale extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 57.35487752340556);

    this.setInteractive(new Phaser.Geom.Circle(0, -25.354877574887297, 32), Phaser.Geom.Circle.Contains);

    // tivara_maceman_male_idle_down
    const tivara_maceman_male_idle_down = scene.add.sprite(0, -25.354877523405563, 'maceman_male_idle', 4);
    tivara_maceman_male_idle_down.play('tivara_maceman_male_idle_down');
    this.add(tivara_maceman_male_idle_down);

    /* START-USER-CTR-CODE */
    this.on('pointerdown', () => {
      tivara_maceman_male_idle_down.setTint(0xff0000); // Tint to red

      // and play anim skaduwee_worker_male_slash_down
      tivara_maceman_male_idle_down.play(ANIM_TIVARA_MACEMAN_MALE_LARGE_SLASH_DOWN, true);
      // after anim complete, remove tint
      tivara_maceman_male_idle_down.once('animationcomplete', () => {
        tivara_maceman_male_idle_down.clearTint();
        tivara_maceman_male_idle_down.play(ANIM_TIVARA_MACEMAN_MALE_IDLE_DOWN, true);
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
