import { GameObjects } from "phaser";
import { HealthComponent } from "./health-component";
import { getActorComponent } from "../../../data/actor-component";
import { Subscription } from "rxjs";
import { getGameObjectBounds, getGameObjectDepth } from "../../../data/game-object-helper";

export class HealthUiComponent {
  private healthComponent?: HealthComponent;
  private readonly bar: GameObjects.Graphics;
  private barWidth = 25;
  private barHeight = 8;
  private barBorder = 2;

  private redThreshold = 0.3;
  private orangeThreshold = 0.5;
  private yellowThreshold = 0.7;
  private changedSubscription?: Subscription;

  private readonly healthColors = {
    red: 0xff0000,
    orange: 0xffa500,
    yellow: 0xffff00,
    green: 0x00ff00
  };

  private readonly armorColors = {
    // more white-ish colors
    red: 0xff0000,
    orange: 0xffa500,
    yellow: 0xffff00,
    green: 0xffffff
  };

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly type: "health" | "armor"
  ) {
    this.bar = this.gameObject.scene.add.graphics();
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, this.init, this);
  }

  private init() {
    this.healthComponent = getActorComponent(this.gameObject, HealthComponent)!;
    switch (this.type) {
      case "health":
        this.changedSubscription = this.healthComponent.healthChanged.subscribe(() => this.draw());
        break;
      case "armor":
        this.changedSubscription = this.healthComponent.armorChanged.subscribe(() => this.draw());
        break;
    }

    //bar width should be 50% of gameObject width or min 25px
    const bounds = getGameObjectBounds(this.gameObject);
    if (bounds) {
      this.barWidth = Math.max(Math.round(bounds.width / 3), 25);
    }

    this.draw();
  }

  private get percentage() {
    if (!this.healthComponent) return 0;
    switch (this.type) {
      case "health":
        return this.healthComponent.getCurrentHealth() / this.healthComponent.healthDefinition.maxHealth;
      case "armor":
        return this.healthComponent.getCurrentArmor() / this.healthComponent.healthDefinition.maxArmor!;
    }
  }

  private get barXY() {
    const bounds = getGameObjectBounds(this.gameObject);
    if (!bounds) return [0, 0];

    // set this health-bar to be above the player center horizontally

    // set bar x to be half of gameObject width
    const x = bounds.centerX - this.barWidth / 2;
    let y = bounds.centerY - bounds.height / 2;
    if (this.type === "armor") {
      y += this.barHeight - this.barBorder;
    }

    return [x, y];
  }

  private get barDepth() {
    // set depth to be above player
    return (getGameObjectDepth(this.gameObject) ?? 0) + 1;
  }

  /**
   * move bar with player
   * todo - listen to some event instead of updating every frame
   */
  update() {
    this.bar.depth = this.barDepth;
    const [x, y] = this.barXY;
    this.bar.setPosition(x, y);
  }

  destroy() {
    this.bar.destroy();
    this.changedSubscription?.unsubscribe();
  }

  private draw() {
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

    let colors;
    switch (this.type) {
      case "health":
        colors = this.healthColors;
        break;
      case "armor":
        colors = this.armorColors;
        break;
    }

    if (this.percentage < this.redThreshold) {
      this.bar.fillStyle(colors.red);
    } else if (this.percentage < this.orangeThreshold) {
      this.bar.fillStyle(colors.orange);
    } else if (this.percentage < this.yellowThreshold) {
      this.bar.fillStyle(colors.yellow);
    } else {
      this.bar.fillStyle(colors.green);
    }

    const barFilledWidth = Math.floor((this.barWidth - 2 * this.barBorder) * this.percentage);

    this.bar.fillRect(x + this.barBorder, y + this.barBorder, barFilledWidth, this.barHeight - 2 * this.barBorder);
  }

  setVisibility(visibility: boolean) {
    this.bar.setVisible(visibility);
    this.draw();
  }
}
