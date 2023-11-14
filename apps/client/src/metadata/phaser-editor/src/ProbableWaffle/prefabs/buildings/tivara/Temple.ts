// You can write more code here

/* START OF COMPILED CODE */

import Phaser from 'phaser';
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Temple extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 96.3076677868738, y ?? 132.66656040978646);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        '-88.23719084310648 -38.365544262746845 -16.707434009762693 -74.50609893811041 -7.786674255499165 -68.09430286473349 0.018990529481428098 -71.43958777258231 12.006261449273069 -66.14288666848834 18.418057522649974 -73.94855145346894 88.11149310283386 -39.65938114801847 87.94781430359839 46.10289966043604 0.13408547256668157 90.70669843175372 -89.07351207006869 46.93922088739822'
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_temple
    const buildings_tivara_temple = scene.add.image(
      -0.30766778687379315,
      -36.666560409786456,
      'factions',
      'buildings/tivara/temple/temple.png'
    );
    this.add(buildings_tivara_temple);

    // buildings_tivara_temple_temple_olival
    const buildings_tivara_temple_temple_olival = scene.add.image(
      -2,
      -13,
      'factions',
      'buildings/tivara/temple/temple-olival.png'
    );
    this.add(buildings_tivara_temple_temple_olival);

    /* START-USER-CTR-CODE */

    this.bounce(buildings_tivara_temple_temple_olival);
    setTimeout(() => {
      this.addGlow(scene, buildings_tivara_temple_temple_olival);
    }, 1000);
    this.on('pointerdown', () => {
      buildings_tivara_temple.setTint(0xff0000); // Tint to red
    });

    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  private addGlow = (scene: Phaser.Scene, image: Phaser.GameObjects.Image) => {
    // https://labs.phaser.io/view.html?src=src\fx\glow\glow%20fx.js
    if (!image.preFX) return;
    image.preFX.setPadding(32);
    const fx = image.preFX.addGlow();

    //  For PreFX Glow the quality and distance are set in the Game Configuration
    scene.tweens.add({
      targets: fx,
      outerStrength: 1,
      yoyo: true,
      loop: -1,
      ease: 'sine.inout'
    });
  };
  private bounce = (image: Phaser.GameObjects.Image) => {
    // bounce the sprite up and down forever with a 2 seconds duration
    this.scene.tweens.add({
      targets: image,
      y: '-=4', // move up by 4
      duration: 1000, // takes 1000ms
      ease: 'Sine.InOut',
      yoyo: true, // reverse the animation after it completes
      loop: -1 // loop indefinitely
    });
  };

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
