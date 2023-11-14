// You can write more code here

/* START OF COMPILED CODE */

import Phaser from 'phaser';
/* START-USER-IMPORTS */
import {
  ANIM_SKADUWEE_BUILDINGS_OWLERY_OWL,
  ANIM_SKADUWEE_BUILDINGS_OWLERY_OWL_FLAP
} from '../../../../../../../assets/probable-waffle/atlas/anims/skaduwee/buildings';
/* END-USER-IMPORTS */

export default class Owlery extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 176);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        '-29.198913756532136 -132.13554367686658 -29.393053965807688 -151.14078501381945 -19.073855503242058 -165.58766286141133 1.0485814987609317 -172.81110178520728 21.686978423892192 -164.8137229767189 30.20031715550884 -150.36684512912703 30.45829711707298 -133.34016766589374 26.008798018194 -123.10624502212163 25.82529643447679 4.115500961156727 20.519498822728373 11.61680103293898 10.456779214239987 14.910054722989713 -8.387950234383709 15.093013261325865 -21.926882071258987 9.60425711124131 -25.22013576130973 3.749583884484423 -24.81325440994174 -123.10624502212163'
      ),
      Phaser.Geom.Polygon.Contains
    );

    // owlery_building
    const owlery_building = scene.add.image(0, -80, 'factions', 'buildings/skaduwee/owlery/owlery.png');
    this.add(owlery_building);

    // skaduwee_buildings_owlery_owl
    const skaduwee_buildings_owlery_owl = scene.add.sprite(
      3,
      -134,
      'factions',
      'buildings/skaduwee/owlery/owlery-owl/owlery-owl-0.png'
    );
    skaduwee_buildings_owlery_owl.play('skaduwee-buildings-owlery-owl');
    this.add(skaduwee_buildings_owlery_owl);

    /* START-USER-CTR-CODE */
    this.on('pointerdown', () => {
      owlery_building.setTint(0xff0000); // Tint to red
    });

    this.flapRandomly(skaduwee_buildings_owlery_owl);

    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  private flapRandomly = (owlSprite: Phaser.GameObjects.Sprite) => {
    if (!this.active) return;
    owlSprite.play(ANIM_SKADUWEE_BUILDINGS_OWLERY_OWL_FLAP, true);
    // on animation end, play default
    owlSprite.once('animationcomplete', () => {
      owlSprite.play(ANIM_SKADUWEE_BUILDINGS_OWLERY_OWL, true);
    });
    const randomDelay = Phaser.Math.Between(20000, 40000);
    setTimeout(() => {
      this.flapRandomly(owlSprite);
    }, randomDelay);
  };
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
