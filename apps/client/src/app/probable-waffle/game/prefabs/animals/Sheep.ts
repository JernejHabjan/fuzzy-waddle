// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import { ANIM_SHEEP_IDLE_DOWN, ANIM_SHEEP_IDLE_DOWN_SHEARED } from "./anims/animals";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Sheep extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 49.42203448546586, texture || "animals", frame ?? "sheep/sheep_down.png");

    this.setInteractive(new Phaser.Geom.Circle(29, 39, 17.805288050449516), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.772219288835404);
    this.play("sheep_idle_down");

    /* START-USER-CTR-CODE */
    this.handleWoolParticles(scene);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private woolParticles?: Phaser.GameObjects.Particles.ParticleEmitter;

  private handleWoolParticles(scene: Phaser.Scene) {
    // Add wool particle emitter to the scene
    this.woolParticles = scene.add.particles(0, 0, "animals", {
      frame: ["sheep/effects/wool_1.png", "sheep/effects/wool_2.png"],
      speed: { min: 20, max: 50 },
      lifespan: 1000,
      quantity: 1,
      gravityY: 50,
      scale: { start: 2, end: 1 },
      rotate: { start: 0, end: 360 },
      frequency: 1,
      emitting: false
    });

    let shearedCount = 0;
    const maxShearedCount = 5;

    this.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (shearedCount < maxShearedCount) {
        this.woolParticles?.emitParticleAt(this.x, this.y - 25, Phaser.Math.Between(1, 4));
      }
      shearedCount++;
      if (shearedCount === maxShearedCount) {
        this.play(ANIM_SHEEP_IDLE_DOWN_SHEARED);
        this.woolParticles?.emitParticleAt(this.x, this.y - 20, 50);

        // start timer to reset sheep
        scene.time.delayedCall(5000, () => {
          shearedCount = 0;
          this.play(ANIM_SHEEP_IDLE_DOWN);
          this.woolParticles?.emitParticleAt(this.x, this.y - 20, 50);
        });
      }
    });
  }

  setDepth(value: number): this {
    this.woolParticles?.setDepth(value + 1);
    return super.setDepth(value);
  }

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
