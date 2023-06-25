import { IComponent } from '../../../../probable-waffle/game/core/component.service';
import { BaseScene } from '../../../../shared/game/phaser/scene/base.scene';
import { Actor } from '../../../../probable-waffle/game/entity/actor/actor';

export class FlySoundComponent implements IComponent {
  constructor(private readonly fly: Actor, private readonly scene: BaseScene) {}

  start() {
    this.scene.sound.play('flying', {
      loop: true
    });
  }

  playHitSound() {
    this.scene.sound.play('tap');
  }

  kill() {
    this.scene.sound.play('squish');
    this.stopFlyingSound();
  }

  destroy() {
    this.stopFlyingSound();
  }

  stopFlyingSound() {
    if (this.scene.sound.get('flying')) {
      this.scene.sound.removeByKey('flying');
    }
  }
}
