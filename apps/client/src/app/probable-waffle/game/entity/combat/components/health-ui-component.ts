import { IComponent } from '../../../core/component.service';
import { Actor } from '../../actor/actor';
import { SpriteRepresentationComponent } from '../../actor/components/sprite-representable-component';
import HealthComponent from './health-component';

export class HealthUiComponent implements IComponent {
  private healthComponent!: HealthComponent;
  private bar!: Phaser.GameObjects.Graphics;
  private barWidth = 25;
  private barHeight = 8;
  private barBorder = 2;

  private redThreshold = 0.3;
  private orangeThreshold = 0.5;
  private yellowThreshold = 0.7;
  private sprite!: Phaser.GameObjects.Sprite;

  constructor(private readonly actor: Actor) {}

  private get healthPercentage() {
    return this.healthComponent.getCurrentHealth() / this.healthComponent.healthDefinition.maxHealth;
  }

  start() {
    this.healthComponent = this.actor.components.findComponent(HealthComponent);
    this.sprite = this.actor.components.findComponent(SpriteRepresentationComponent).sprite;
    const scene = this.sprite.scene; // todo maybe add this to UI scene instead
    this.bar = scene.add.graphics();
  }

  /**
   * move bar with player
   */
  update(time: number, delta: number) {
    this.draw();
    this.bar.depth = this.barDepth;
  }

  private get barXY() {
    if (!this.bar) {
      throw new Error('Bar not initialized');
    }

    // set this health-bar to be above the player center horizontally
    // get gameObject width
    const { height, x: objectCenterX, y: objectCenterY } = this.sprite;

    // set bar x to be half of gameObject width
    const x = objectCenterX - this.barWidth / 2;

    return [x, objectCenterY - height / 2];
  }

  private get barDepth() {
    // set depth to be above player
    return this.sprite.depth + 1;
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

  destroy() {
    this.bar.destroy();
  }
}
