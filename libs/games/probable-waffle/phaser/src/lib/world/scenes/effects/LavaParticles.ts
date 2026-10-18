import Phaser from "phaser";
export class LavaParticles {
  private particles: Phaser.GameObjects.Particles.ParticleEmitter;

  /**
   * Creates the visual effect and keeps its emission point attached to the actor.
   * Following the actor is important when its persisted transform is restored after construction.
   */
  constructor(scene: Phaser.Scene, target: Phaser.Types.Math.Vector2Like) {
    this.particles = scene.add.particles(target.x, target.y - 32, "outside", {
      frame: ["effects/ember/1.png", "effects/ember/2.png", "effects/ember/3.png"],
      speed: 50,
      lifespan: 500,
      quantity: 1,
      gravityY: -100,
      scale: { start: 1, end: 0 },
      angle: { min: 180, max: 360 },
      // we can use randomness here as it's just visual effect
      frequency: Math.random() * 1000 + 4000
    });
    this.particles.startFollow(target, 0, -32);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setDepth(value: number): this {
    this.particles.setDepth(value + 1);
    return this;
  }

  destroy(): void {
    this.particles.destroy();
  }
}
