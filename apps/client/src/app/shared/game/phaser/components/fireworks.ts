import { Subscription } from 'rxjs';
import BaseScene from '../scene/base.scene';
import { UpdateEventData } from '../scene/update-event-data';

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
  private subscriptions: Subscription[] = [];

  constructor(private readonly scene: BaseScene, autoStart = false) {
    this.registerEvents(autoStart);
    if (autoStart) {
      this.create();
    }
  }

  private registerEvents(autoStart: boolean) {
    this.subscriptions = [
      ...(autoStart ? [] : [this.scene.onCreate.subscribe(this.create)]),
      this.scene.onUpdate.subscribe(this.update),
      this.scene.onDestroy.subscribe(this.destroy),
      this.scene.onResize.subscribe(this.resize)
    ];
  }

  private create = () => {
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
  };

  private updateEmitter(emitter: Phaser.GameObjects.Particles.ParticleEmitter) {
    emitter.particleX = Between(0, this.scene.cameras.main.width);
    emitter.particleY = Between(0, this.scene.cameras.main.height);
    emitter.setParticleTint(GetRandom(this.tints));
    emitter.setParticleLifespan(Between(3000, 5000));
    emitter.explode();
  }

  private update = (updateEventData: UpdateEventData) => {
    this.renderTexture?.fill(0, 0.01 * updateEventData.delta).draw([this.emitter1, this.emitter2, this.emitter3]);
  };

  destroy = () => {
    this.emitter1?.stop(true);
    this.emitter2?.stop(true);
    this.emitter3?.stop(true);
    this.emitter1?.destroy(true);
    this.emitter2?.destroy(true);
    this.emitter3?.destroy(true);
    this.renderTexture?.destroy(true);
    this.emitter1Event?.destroy();
    this.emitter2Event?.destroy();
    this.emitter3Event?.destroy();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.emitter1 = undefined;
    this.emitter2 = undefined;
    this.emitter3 = undefined;
    this.renderTexture = undefined;
    this.emitter1Event = undefined;
    this.emitter2Event = undefined;
    this.emitter3Event = undefined;
  };

  private resize = () => {
    this.renderTexture?.resize(this.scene.cameras.main.width, this.scene.cameras.main.height);
  };
}
