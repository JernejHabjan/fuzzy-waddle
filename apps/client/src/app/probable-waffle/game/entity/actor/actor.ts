import ComponentService, { IComponent } from '../../core/component.service';
import * as Phaser from 'phaser';

export abstract class Actor implements IComponent {
  components: ComponentService;
  /**
   * unique name
   */
  readonly name: string;
  private started = false;
  destroyed = false;
  killed = false;
  /**
   * time until actor is finally destroyed from scene
   */
  despawnTime = 10;

  protected constructor() {
    this.name = Phaser.Utils.String.UUID();
    this.components = new ComponentService(this.name);
  }

  init(): void {
    // pass
  }

  start(): void {
    // as actor is fully initialized, init all components
    this.components.init();
  }

  update(time: number, delta: number) {
    if (!this.started) {
      this.started = true;
      this.start();
    }
    this.components.update(time, delta);
  }

  kill(): void {
    this.killed = true;

    // destroy actor after a delay
    setTimeout(() => {
      this.destroy();
    }, this.despawnTime * 1000);
  }

  destroy(): void {
    this.destroyed = true;
    this.components.destroy();
  }
}
