export class LavaParticles {
  private particles: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.particles = scene.add.particles(x, y - 32, "outside", {
      frame: ["effects/ember/1.png", "effects/ember/2.png", "effects/ember/3.png"],
      speed: 50,
      lifespan: 500,
      quantity: 1,
      gravityY: -100,
      scale: { start: 1, end: 0 },
      angle: { min: 180, max: 360 },
      frequency: Math.random() * 1000 + 4000
    });
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
