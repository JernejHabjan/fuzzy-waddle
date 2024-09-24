import { HealthComponent } from "../../../../entity/combat/components/health-component";
import { getActorComponent } from "../../../../data/actor-component";
import { ActorTranslateComponent } from "../../../../entity/actor/components/actor-translate-component";
import { Subscription } from "rxjs";
import { getGameObjectDepth, getGameObjectTransform } from "../../../../data/game-object-helper";
import { OwnerComponent } from "../../../../entity/actor/components/owner-component";
import { HealthUiComponent } from "../../../../entity/combat/components/health-ui-component";

export class NodeDebugger {
  static readonly ZIndex = 1;
  private actorMovedSubscription?: Subscription;
  private textNode?: Phaser.GameObjects.Text;
  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    this.gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    this.gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    this.gameObject.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, this.init, this);
  }

  private init() {
    this.subscribeActorMove();
    this.createTextNode();
    this.updateOwnerUiElementPosition();
  }

  private createTextNode() {
    const textNode = this.gameObject.scene.add.text(0, 0, "", {
      color: "#000",
      stroke: "#fff",
      strokeThickness: 3
    });
    textNode.setOrigin(0.5, 1);
    textNode.text = "";
    textNode.setStyle({ align: "center" });
    textNode.visible = false;

    this.textNode = textNode;
  }

  updateText(text: string) {
    this.textNode?.setText(text);
    this.textNode?.setVisible(true);
  }

  private subscribeActorMove() {
    const actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    if (!actorTranslateComponent) return;
    this.actorMovedSubscription = actorTranslateComponent.actorMoved.subscribe(() => {
      this.updateOwnerUiElementPosition();
    });
  }

  private updateOwnerUiElementPosition() {
    const gameObjectTransform = getGameObjectTransform(this.gameObject);
    if (!gameObjectTransform || !this.textNode) return;
    const { x, y } = gameObjectTransform;
    this.textNode.setPosition(x, y - 50);
    this.textNode.depth = this.textNodeDepth;
  }

  private get textNodeDepth() {
    return (
      (getGameObjectDepth(this.gameObject) ?? 0) +
      OwnerComponent.ZIndex +
      HealthUiComponent.ZIndex +
      NodeDebugger.ZIndex
    );
  }

  private destroy() {
    this.actorMovedSubscription?.unsubscribe();
    this.textNode?.destroy();
  }
}
