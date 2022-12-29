import ComponentService, { IComponent } from './services/component.service';
import UUID = Phaser.Utils.String.UUID;

export abstract class Actor implements IComponent {
  components: ComponentService;
  /**
   * unique name
   */
  readonly name: string;
  private started = false;
  protected constructor() {
    this.name = UUID();
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

  destroy(): void {
    this.components.destroy();
  }
}
