// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
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
    this.handleSheepRandomRotation();
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private woolParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private direction: "up" | "right" | "down" | "left" = "down";
  private sheared = false;
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
        this.woolParticles?.emitParticleAt(this.x, this.y - 20, 50);
        this.sheared = true;
        this.playSheepAnimation();
        // start timer to reset sheep
        scene.time.delayedCall(5000, () => {
          shearedCount = 0;
          this.woolParticles?.emitParticleAt(this.x, this.y - 20, 50);
          this.sheared = false;
          this.playSheepAnimation();
        });
      }
    });
  }

  private handleSheepRandomRotation() {
    this.rotateSheepToRandomDirection();
    this.playSheepAnimation();
    this.scene.time.addEvent({
      delay: Phaser.Math.Between(2000, 5000),
      callback: () => {
        this.rotateSheepToRandomDirection();
        this.playSheepAnimation();
      },
      loop: true
    });
  }

  private rotateSheepToRandomDirection() {
    const randomDirection = Phaser.Math.Between(0, 3);
    switch (randomDirection) {
      case 0:
        this.direction = "up";
        break;
      case 1:
        this.direction = "right";
        break;
      case 2:
        this.direction = "down";
        break;
      case 3:
        this.direction = "left";
        break;
    }
  }

  private playSheepAnimation() {
    const anim = "sheep_idle_" + this.direction + (this.sheared ? "_sheared" : "");
    this.play(anim, true);
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
