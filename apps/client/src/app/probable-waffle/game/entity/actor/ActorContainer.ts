// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import Phaser, { Utils } from "phaser";
import { ComponentService, IComponent } from "../../../../../app/probable-waffle/game/core/component.service";
/* END-USER-IMPORTS */

export default class ActorContainer extends Phaser.GameObjects.Container implements IComponent {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    /* START-USER-CTR-CODE */
    this.name = Utils.String.UUID();
    this.components = new ComponentService(this.name);
    // subscribe on scene update and destroy
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.scene.events.on(Phaser.Scenes.Events.DESTROY, this.destroy, this);
    /* END-USER-CTR-CODE */
  }

  public z: number = 0;

  /* START-USER-CODE */
  components: ComponentService;
  destroyed = false;
  killed = false;
  killedAt?: Date;

  /**
   * time until actor is finally destroyed from scene (in sec)
   */
  despawnTime = 10;

  /**
   * initialize all mandatory actor properties that cannot be set in constructor
   */
  init() {}

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
    this.components.start();
  }

  /**
   * post initialize - to additionally prepare actor for world
   */
  postStart(): void {
    // pass
  }

  registerGameObject(): void {
    // todo call from registration engine
    this.init();
    this.initComponents();
    this.start();
    this.postStart();
  }

  override update(time: number, delta: number) {
    super.update(time, delta);
    this.components.update(time, delta);
  }

  kill(): void {
    this.killed = true;
    this.killedAt = new Date();

    // destroy actor after a delay
    setTimeout(() => {
      this.destroy();
    }, this.despawnTime * 1000);
  }

  override destroy(fromScene?: boolean): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.destroy, this);
    super.destroy(fromScene);
    this.destroyed = true;
    this.components.destroy();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
