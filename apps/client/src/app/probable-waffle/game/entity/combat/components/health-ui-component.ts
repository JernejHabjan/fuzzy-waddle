import { GameObjects } from "phaser";
import { HealthComponent } from "./health-component";
import { getActorComponent } from "../../../data/actor-component";
import { Subscription } from "rxjs";
import { getGameObjectBounds, getGameObjectDepth, onObjectReady } from "../../../data/game-object-helper";
import { OwnerComponent } from "../../actor/components/owner-component";
import { ActorTranslateComponent } from "../../actor/components/actor-translate-component";

export class HealthUiComponent {
  static ZIndex = 1;
  private healthComponent?: HealthComponent;
  private readonly bar: GameObjects.Graphics;
  private barWidth = 25;
  private barHeight = 8;
  static barBorder = 2;

  private redThreshold = 0.3;
  private orangeThreshold = 0.5;
  private yellowThreshold = 0.7;
  private changedSubscription?: Subscription;
  private actorMovedSubscription?: Subscription;

  private readonly healthColors = {
    red: 0xff0000,
    orange: 0xff8c00, // Darker orange
    yellow: 0xffd700, // Golden yellow for better contrast
    green: 0x00ff00
  };

  private readonly armorColors = {
    red: 0x8b4513, // Saddle brown for damaged armor
    orange: 0x808080, // Gray for moderately worn armor
    yellow: 0xa9a9a9, // Dark gray for lightly worn armor
    green: 0xb8b8b8 // Light steel color for pristine armor
  };

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly type: "health" | "armor"
  ) {
    this.bar = this.gameObject.scene.add.graphics();
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    gameObject.on(OwnerComponent.OwnerColorAppliedEvent, this.draw, this);
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
    this.subscribeActorMove();

    // Calculate the bar width based on the parent object's bounds
    const bounds = getGameObjectBounds(this.gameObject);
    if (bounds) {
      this.barWidth = Math.max(Math.round(bounds.width / 3), 25);
    }

    this.draw();
  }

  private subscribeActorMove() {
    const actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    if (!actorTranslateComponent) return;
    this.actorMovedSubscription = actorTranslateComponent.actorMoved.subscribe(() => {
      this.updateElementPosition();
    });
  }

  private updateElementPosition() {
    if (!this.bar) return;
    const { x, y } = this.getBounds();
    this.bar.x = x;
    this.bar.y = y;
    this.bar.setDepth(this.barDepth);
  }

  private get progressInFraction() {
    if (!this.healthComponent) return 0;
    switch (this.type) {
      case "health":
        return this.healthComponent.healthComponentData.health / this.healthComponent.healthDefinition.maxHealth;
      case "armor":
        return this.healthComponent.healthComponentData.armour / this.healthComponent.healthDefinition.maxArmour!;
    }
  }

  /**
   * Calculate the position and size of the bar based on the gameObject bounds.
   * Ensure that barWidth is set from the parent object's width.
   */
  getBounds(): Phaser.Geom.Rectangle {
    const bounds = getGameObjectBounds(this.gameObject);
    if (!bounds) return new Phaser.Geom.Rectangle(0, 0, this.barWidth, this.barHeight);

    // Ensure the bar width is calculated from the parent object's width
    this.barWidth = Math.max(Math.round(bounds.width / 3), 25);

    const width = this.barWidth;
    const x = bounds.centerX - width / 2;
    let y = bounds.centerY - bounds.height / 2;
    if (this.type === "armor") {
      y += this.barHeight - HealthUiComponent.barBorder;
    }
    return new Phaser.Geom.Rectangle(x, y, width, this.barHeight);
  }

  private get barDepth() {
    return (getGameObjectDepth(this.gameObject) ?? 0) + OwnerComponent.ZIndex + HealthUiComponent.ZIndex;
  }

  destroy() {
    this.bar.destroy();
    this.changedSubscription?.unsubscribe();
    this.actorMovedSubscription?.unsubscribe();
    this.gameObject.off(OwnerComponent.OwnerColorAppliedEvent, this.draw, this);
  }

  private draw() {
    this.bar.clear();

    const bounds = this.getBounds();
    const { width, height } = bounds;

    //  BG
    this.bar.fillStyle(0x000000);
    this.bar.fillRect(0, 0, width, height);

    //  Health or Armor BG
    this.bar.fillStyle(0xffffff);
    this.bar.fillRect(
      HealthUiComponent.barBorder,
      HealthUiComponent.barBorder,
      width - 2 * HealthUiComponent.barBorder,
      height - 2 * HealthUiComponent.barBorder
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

    if (this.progressInFraction < this.redThreshold) {
      this.bar.fillStyle(colors.red);
    } else if (this.progressInFraction < this.orangeThreshold) {
      this.bar.fillStyle(colors.orange);
    } else if (this.progressInFraction < this.yellowThreshold) {
      this.bar.fillStyle(colors.yellow);
    } else {
      this.bar.fillStyle(colors.green);
    }

    const barFilledWidth = Math.floor((width - 2 * HealthUiComponent.barBorder) * this.progressInFraction);

    this.bar.fillRect(
      HealthUiComponent.barBorder,
      HealthUiComponent.barBorder,
      barFilledWidth,
      height - 2 * HealthUiComponent.barBorder
    );
    this.updateElementPosition();
  }

  setVisibility(visible: boolean) {
    this.bar.setVisible(visible);
    this.draw();
  }
}
