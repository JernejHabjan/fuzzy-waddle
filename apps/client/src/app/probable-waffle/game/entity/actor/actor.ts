import { Utils } from 'phaser';
import ComponentService, { IComponent } from '../../core/component.service';

export abstract class Actor implements IComponent {
  components: ComponentService;
  /**
   * unique name
   */
  readonly name: string;
  destroyed = false;
  killed = false;
  /**
   * time until actor is finally destroyed from scene
   */
  despawnTime = 10;

  protected constructor() {
    this.name = Utils.String.UUID();
    this.components = new ComponentService(this.name);
  }

  /**
   * initialize all mandatory actor properties that cannot be set in constructor
   */
  init() {
    // pass
  }

  /**
   * init all components for the actor
   */
  initComponents(): void {
    // pass
  }

  /**
   * as actor is fully initialized, init and start all components
   */
  start(): void {
    this.components.init();
  }

  /**
   * post initialize - to additionally prepare actor for world
   */
  postStart(): void {
    // pass
  }

  addToRegistry(): void {
    // todo call from registration engine
    this.init();
    this.initComponents();
    this.start();
    this.postStart();
  }

  update(time: number, delta: number) {
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
