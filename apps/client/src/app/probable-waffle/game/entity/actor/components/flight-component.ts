import { getGameObjectBounds, onObjectReady } from "../../../data/game-object-helper";
import { HealthComponent } from "../../combat/components/health-component";
import { Subscription } from "rxjs";
import { getActorComponent } from "../../../data/actor-component";
import { ActorTranslateComponent } from "./actor-translate-component";
import Graphics = Phaser.GameObjects.Graphics;

export interface FlightDefinition {
  height: number;
}

export class FlightComponent {
  private verticalLineGraphics?: Graphics;
  private actorMovedSubscription?: Subscription;
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly flightDefinition: FlightDefinition
  ) {
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }
  init() {
    this.drawFlyingUnitVerticalLine();
    this.subscribeActorMove();
    this.updateActorTranslateIndicators();
  }

  private subscribeActorMove() {
    const actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    if (!actorTranslateComponent) return;
    this.actorMovedSubscription = actorTranslateComponent.actorMoved.subscribe(() => {
      this.updateActorTranslateIndicators();
    });
  }

  private updateActorTranslateIndicators() {
    if (this.verticalLineGraphics) {
      const bounds = getGameObjectBounds(this.gameObject);
      if (!bounds) return;
      // Draw from center bottom of the object
      const centerX = bounds.centerX;
      const bottomY = bounds.bottom;
      this.verticalLineGraphics.setPosition(centerX, bottomY);
      this.verticalLineGraphics.setDepth((this.gameObject as any).depth ? (this.gameObject as any).depth - 1 : 0);
    }
  }

  /**
   * Draw a vertical line from the center bottom of the unit down by flight height.
   * At the bottom of the line, draw a dot.
   * The line is behind the game object.
   */
  private drawFlyingUnitVerticalLine() {
    if (this.verticalLineGraphics) {
      this.verticalLineGraphics.destroy();
    }
    const bounds = getGameObjectBounds(this.gameObject);
    if (!bounds) return;
    const centerX = bounds.centerX;
    const bottomY = bounds.bottom;
    const height = this.flightDefinition.height;
    const graphics = this.gameObject.scene.add.graphics();
    graphics.lineStyle(2, 0xffffff, 0.7);
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.lineTo(0, height);
    graphics.closePath();
    graphics.strokePath();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(0, height, 4);
    graphics.setPosition(centerX, bottomY);
    graphics.setDepth((this.gameObject as any).depth ? (this.gameObject as any).depth - 1 : 0);
    this.verticalLineGraphics = graphics;
  }

  private destroy() {
    this.verticalLineGraphics?.destroy();
    this.actorMovedSubscription?.unsubscribe();
  }
}
