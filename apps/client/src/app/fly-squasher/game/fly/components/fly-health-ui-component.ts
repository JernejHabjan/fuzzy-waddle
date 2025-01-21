import { GameObjects } from "phaser";
import { FlyHealthComponent } from "./fly-health-component";
import { IComponent } from "../../../../probable-waffle/game/core/component.service";
import { Actor } from "../../../../probable-waffle/game/entity/actor/actor";

export type FlyHealthBarOptions = {
  spriteDepth: number;
  spriteWidth: number;
  spriteHeight: number;
  spriteObjectCenterX: number;
  spriteObjectCenterY: number;
};

export class FlyHealthUiComponent implements IComponent {
  private healthComponent!: FlyHealthComponent;
  private bar!: GameObjects.Graphics;
  private barWidth = 25;
  private barHeight = 8;
  private barBorder = 2;

  private redThreshold = 0.3;
  private orangeThreshold = 0.5;
  private yellowThreshold = 0.7;

  constructor(
    private readonly actor: Actor,
    private readonly scene: Phaser.Scene,
    private readonly barOptions: () => FlyHealthBarOptions
  ) {}

  private get healthPercentage() {
    return this.healthComponent.getCurrentHealth() / this.healthComponent.healthDefinition.maxHealth;
  }

  private get barXY() {
    if (!this.bar) {
      throw new Error("Bar not initialized");
    }

    // set this health-bar to be above the player center horizontally
    // get gameObject width
    const options = this.barOptions();

    // set bar x to be half of gameObject width
    const x = options.spriteObjectCenterX - this.barWidth / 2;

    return [x, options.spriteObjectCenterY - options.spriteHeight / 2];
  }

  private get barDepth() {
    // set depth to be above player
    return this.barOptions().spriteDepth + 1;
  }

  start() {
    this.healthComponent = this.actor.components.findComponent(FlyHealthComponent);
    this.bar = this.scene.add.graphics();
  }

  /**
   * move bar with player
   */
  update() {
    this.draw();
    this.bar.depth = this.barDepth;
  }

  destroy() {
    this.bar.destroy();
  }

  private draw() {
    if (!this.bar) {
      return;
    }

    this.bar.clear();

    const [x, y] = this.barXY;

    //  BG
    this.bar.fillStyle(0x000000);
    this.bar.fillRect(x, y, this.barWidth, this.barHeight);

    //  Health

    this.bar.fillStyle(0xffffff);
    this.bar.fillRect(
      x + this.barBorder,
      y + this.barBorder,
      this.barWidth - 2 * this.barBorder,
      this.barHeight - 2 * this.barBorder
    );

    if (this.healthPercentage < this.redThreshold) {
      this.bar.fillStyle(0xff0000);
    } else if (this.healthPercentage < this.orangeThreshold) {
      this.bar.fillStyle(0xffa500);
    } else if (this.healthPercentage < this.yellowThreshold) {
      this.bar.fillStyle(0xffff00);
    } else {
      this.bar.fillStyle(0x00ff00);
    }

    const barFilledWidth = Math.floor((this.barWidth - 2 * this.barBorder) * this.healthPercentage);

    this.bar.fillRect(x + this.barBorder, y + this.barBorder, barFilledWidth, this.barHeight - 2 * this.barBorder);
  }

  setVisibility(visibility: boolean) {
    this.bar.setVisible(visibility);
  }
}
