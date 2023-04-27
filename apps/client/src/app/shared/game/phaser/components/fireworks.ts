const { Between } = Phaser.Math;
const { GetRandom } = Phaser.Utils.Array;

/**
 * Thanks to https://github.com/photonstorm/phaser3-examples/pull/396
 */
export class Fireworks {
  emitter1?: Phaser.GameObjects.Particles.ParticleEmitter;
  emitter2?: Phaser.GameObjects.Particles.ParticleEmitter;
  emitter3?: Phaser.GameObjects.Particles.ParticleEmitter;
  renderTexture?: Phaser.GameObjects.RenderTexture;
  tints = Phaser.Display.Color.HSVColorWheel().map(({ r, g, b }) => new Phaser.Display.Color(r, g, b).color);
  private emitter1Event?: Phaser.Time.TimerEvent;
  private emitter2Event?: Phaser.Time.TimerEvent;
  private emitter3Event?: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene) {}

  create() {
    this.renderTexture = this.scene.add
      .renderTexture(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height)
      .setOrigin(0, 0)
      .setBlendMode('ADD');

    const emitterConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      alpha: { start: 1, end: 0, ease: 'Quad.easeOut' },
      angle: { start: 0, end: 360, steps: 100 },
      blendMode: 'SCREEN',
      emitting: false,
      frequency: -1,
      gravityY: 100,
      lifespan: 3000,
      quantity: 500,
      reserve: 500,
      rotate: 45,
      speed: { min: 100, max: 200 }
    };

    this.emitter1 = this.scene.make.particles({ key: '__WHITE', config: emitterConfig }, false);
    this.emitter2 = this.scene.make.particles({ key: '__WHITE', config: emitterConfig }, false);
    this.emitter3 = this.scene.make.particles({ key: '__WHITE', config: emitterConfig }, false);

    if (!this.emitter1 || !this.emitter2 || !this.emitter3) {
      console.error('Could not create fireworks');
      return;
    }
    this.emitter1Event = this.scene.time.addEvent({
      delay: 3000,
      startAt: Between(0, 3000),
      repeat: -1,
      callback: () => this.updateEmitter(this.emitter1 as Phaser.GameObjects.Particles.ParticleEmitter)
    });

    this.emitter2Event = this.scene.time.addEvent({
      delay: 4000,
      startAt: Between(0, 4000),
      repeat: -1,
      callback: () => this.updateEmitter(this.emitter2 as Phaser.GameObjects.Particles.ParticleEmitter)
    });

    this.emitter3Event = this.scene.time.addEvent({
      delay: 5000,
      startAt: Between(0, 5000),
      repeat: -1,
      callback: () => this.updateEmitter(this.emitter3 as Phaser.GameObjects.Particles.ParticleEmitter)
    });
  }

  private updateEmitter(emitter: Phaser.GameObjects.Particles.ParticleEmitter) {
    emitter.particleX = Between(0, this.scene.cameras.main.width);
    emitter.particleY = Between(0, this.scene.cameras.main.height);
    emitter.setParticleTint(GetRandom(this.tints));
    emitter.explode();
  }

  update(time: number, delta: number) {
    this.renderTexture?.fill(0, 0.01 * delta).draw([this.emitter1, this.emitter2, this.emitter3]);
  }

  destroy() {
    this.emitter1?.destroy();
    this.emitter2?.destroy();
    this.emitter3?.destroy();
    this.renderTexture?.destroy();
    this.emitter1Event?.destroy();
    this.emitter2Event?.destroy();
    this.emitter3Event?.destroy();
  }
}
