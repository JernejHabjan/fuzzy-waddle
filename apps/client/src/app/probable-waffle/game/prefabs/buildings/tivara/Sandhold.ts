// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { ANIM_TIVARA_BUILDINGS_OLIVAL_SMALL } from "../../../../../../assets/probable-waffle/atlas/anims/tivara/buildings";
import { OwnerComponent } from "../../../entity/actor/components/owner-component";
import { ActorData, ActorDataKey } from "../../../data/actor-data";
/* END-USER-IMPORTS */

export default class Sandhold extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 160, y ?? 240);

    this.setInteractive(
      new Phaser.Geom.Polygon("-154 2 -1 -219 153 0 123 24 119 47 82 64 60 53 5 79 -56 53 -81 58 -119 42 -120 22"),
      Phaser.Geom.Polygon.Contains
    );

    // sandhold_building
    const sandhold_building = scene.add.image(0, -80, "factions", "buildings/tivara/sandhold/sandhold.png");
    this.add(sandhold_building);

    // hover_crystal
    const hover_crystal = scene.add.image(0, -192, "factions", "buildings/tivara/sandhold/sandhold-crystal.png");
    this.add(hover_crystal);

    /* START-USER-CTR-CODE */

    this.setData(ActorDataKey, new ActorData([new OwnerComponent(this)], []));

    (this.getData(ActorDataKey) as ActorData).components.find((c) => c instanceof OwnerComponent)?.setOwner(1);

    // Create a continuous hover effect for hover_crystal
    scene.tweens.add({
      targets: hover_crystal,
      y: "-=4", // move up by 4
      duration: 1000, // takes 1000ms
      ease: "Sine.InOut",
      yoyo: true, // reverse the animation after it completes
      loop: -1 // loop indefinitely
    });

    this.on("pointerdown", () => {
      sandhold_building.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        sandhold_building.clearTint();
      }, 1000);
    });

    // spawn crystal every 4-6 seconds
    scene.time.addEvent({
      delay: Phaser.Math.Between(4000, 6000),
      callback: () => this.spawnCrystal(scene),
      callbackScope: this,
      loop: true
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  spawnCrystal(scene: Phaser.Scene) {
    const span = scene.add.sprite(-48, -48, "factions", "buildings/tivara/olival_small/olival_small-0.png");
    span.scaleX = 0.5;
    span.scaleY = 0.5;
    span.angle = -70;
    span.play(ANIM_TIVARA_BUILDINGS_OLIVAL_SMALL);
    this.add(span);

    scene.tweens.add({
      targets: span,
      duration: 1000,
      x: -112,
      y: 64,
      onComplete: function () {
        span.destroy(); // destroy the sprite after the tween completes
      }
    });
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
