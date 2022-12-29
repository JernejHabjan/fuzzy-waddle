import ComponentService, { IComponent } from './services/component.service';
import UUID = Phaser.Utils.String.UUID;

export abstract class Actor implements IComponent {
  components: ComponentService;
  /**
   * unique name
   */
  readonly name: string;
  protected constructor() {
    this.name = UUID();
    this.components = new ComponentService(this.name);
  }

  init(): void {
    this.components.init();
  }

  start(): void {
    // components get started in ComponentService
  }

  update(time: number, delta: number) {
    this.components.update(time, delta);
  }

  destroy(): void {
    this.components.destroy();
  }
}
