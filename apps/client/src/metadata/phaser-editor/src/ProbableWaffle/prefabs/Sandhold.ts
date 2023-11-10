// You can write more code here

/* START OF COMPILED CODE */

import Phaser from 'phaser';
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Sandhold extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 160, y ?? 160);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        '-155.18823546354855 78.30324261950545 -0.02994250870855808 -145.74275716590668 154.48454010192052 79.59086330792735 110.06162635136468 134.95855291006944 1.2576781797133663 161.35477702271857 -106.90245964772697 136.88998394270232'
      ),
      Phaser.Geom.Polygon.Contains
    );

    // sandhold_building
    const sandhold_building = scene.add.image(0, 0, 'factions', 'buildings/tivara/sandhold/sandhold.png');
    this.add(sandhold_building);

    // hover_crystal
    const hover_crystal = scene.add.image(0, -112, 'factions', 'buildings/tivara/sandhold/sandhold-crystal.png');
    this.add(hover_crystal);

    /* START-USER-CTR-CODE */
    // Create a continuous hover effect for hover_crystal
    scene.tweens.add({
      targets: hover_crystal,
      y: '-=4', // move up by 4
      duration: 1000, // takes 1000ms
      ease: 'Sine.InOut',
      yoyo: true, // reverse the animation after it completes
      loop: -1 // loop indefinitely
    });
    this.spawnCrystal(scene);
    this.on('pointerdown', () => {
      sandhold_building.setTint(0xff0000); // Tint to red
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  spawnCrystal(scene: Phaser.Scene) {
    const span = scene.add.sprite(-50, 30, 'factions', 'buildings/tivara/olival_small/olival_small-0.png');
    span.scaleX = 0.5;
    span.scaleY = 0.5;
    span.angle = -70;
    span.play('tivara_olival_small_buildings/tivara/olival_small/olival_small');
    this.add(span);

    scene.tweens.add({
      targets: span,
      duration: 1000,
      x: -100,
      y: 130,
      onComplete: function () {
        span.destroy(); // destroy the sprite after the tween completes
      }
    });
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
