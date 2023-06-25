import { IComponent } from '../../../../probable-waffle/game/core/component.service';
import { BaseScene } from '../../../../shared/game/phaser/scene/base.scene';

export class FlySoundComponent implements IComponent {
  constructor(private readonly scene: BaseScene) {}

  start() {
    this.scene.sound.play('flying', {
      loop: true
    });
  }

  resume() {
    this.scene.sound.get('flying').resume();
  }

  pause() {
    this.scene.sound.get('flying').pause();
  }

  hit() {
    this.scene.sound.play('squish');
  }
}
