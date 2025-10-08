import { GameObjects } from "phaser";
import { ConstructionSiteComponent } from "./construction-site-component";
import { getActorComponent } from "../../../data/actor-component";
import { Subscription } from "rxjs";
import { getGameObjectBounds, getGameObjectDepth, onObjectReady } from "../../../data/game-object-helper";
import { OwnerComponent } from "../owner-component";
import { HealthComponent } from "../combat/components/health-component";
import { throttle } from "../../../library/throttle";

export class ConstructionProgressUiComponent {
  static ZIndex = 1;
  private constructionSiteComponent?: ConstructionSiteComponent;
  private readonly bar: GameObjects.Graphics;
  private barWidth = 25;
  private barHeight = 8;
  static barBorder = 2;

  private changedSubscription?: Subscription;

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    this.bar = this.gameObject.scene.add.graphics();
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    gameObject.on(OwnerComponent.OwnerColorAppliedEvent, this.draw, this);
  }

  private init() {
    this.constructionSiteComponent = getActorComponent(this.gameObject, ConstructionSiteComponent)!;
    this.changedSubscription = this.constructionSiteComponent.constructionProgressPercentageChanged.subscribe(
      (percentage) => {
        if (percentage === 100) {
          this.destroy();
        } else {
          this.throttleRedraw();
        }
      }
    );

    // Calculate the bar width based on the parent object's bounds
    const bounds = getGameObjectBounds(this.gameObject);
    if (bounds) {
      this.barWidth = Math.max(Math.round(bounds.width / 3), 25);
    }

    this.draw();
  }

  private throttleRedraw = throttle(this.draw.bind(this), 250);

  private updateElementPosition() {
    if (!this.bar) return;
    const { x, y } = this.getBounds();
    this.bar.x = x;
    this.bar.y = y;
    this.bar.setDepth(this.barDepth);
  }

  private get progressInFraction() {
    if (!this.constructionSiteComponent) return 0;
    return this.constructionSiteComponent.progressPercentage / 100;
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
    const y = bounds.centerY - bounds.height / 2;
    return new Phaser.Geom.Rectangle(x, y, width, this.barHeight);
  }

  private get barDepth() {
    return (getGameObjectDepth(this.gameObject) ?? 0) + OwnerComponent.ZIndex + ConstructionProgressUiComponent.ZIndex;
  }

  destroy() {
    this.bar.destroy();
    this.changedSubscription?.unsubscribe();
    this.gameObject.off(OwnerComponent.OwnerColorAppliedEvent, this.draw, this);
    this.gameObject.off(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    this.gameObject.off(HealthComponent.KilledEvent, this.destroy, this);
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
      ConstructionProgressUiComponent.barBorder,
      ConstructionProgressUiComponent.barBorder,
      width - 2 * ConstructionProgressUiComponent.barBorder,
      height - 2 * ConstructionProgressUiComponent.barBorder
    );

    this.bar.fillStyle(0x333333);

    const barFilledWidth = Math.floor(
      (width - 2 * ConstructionProgressUiComponent.barBorder) * this.progressInFraction
    );

    this.bar.fillRect(
      ConstructionProgressUiComponent.barBorder,
      ConstructionProgressUiComponent.barBorder,
      barFilledWidth,
      height - 2 * ConstructionProgressUiComponent.barBorder
    );
    this.updateElementPosition();
  }
}
