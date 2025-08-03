import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { OrderType } from "../../../entity/character/ai/order-type";
import { CursorHandler, CursorType } from "./input/cursor.handler";
import { getSceneComponent } from "../../../scenes/components/scene-component-helpers";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { emitEventIssueActorCommandToSelectedActors } from "../../../data/scene-data";
import { SingleSelectionHandler } from "./input/single-selection.handler";
import GameObject = Phaser.GameObjects.GameObject;

export class PlayerActionsHandler {
  private handlingActions?: {
    orderType: OrderType;
  };
  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly hudScene: ProbableWaffleScene
  ) {
    this.bindSceneInput();
    this.scene.onShutdown.subscribe(() => this.destroy());
  }

  private bindSceneInput() {
    this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.pointerHandler, this);
  }

  private pointerHandler(pointer: Phaser.Input.Pointer, gameObjectsUnderCursor: GameObject[]) {
    if (!this.handlingActions) return;

    const cursorHandler = getSceneComponent(this.hudScene, CursorHandler);
    if (cursorHandler) {
      cursorHandler.setCursor(CursorType.Default);
    }

    const { clickedTileXY, interactiveObjectIds } = SingleSelectionHandler.getTileAndGameObjectsOnPointerClick(
      this.scene,
      pointer,
      gameObjectsUnderCursor
    );

    const objectId = interactiveObjectIds.length > 0 ? interactiveObjectIds[0] : undefined;

    this.initiateCommand(clickedTileXY, objectId);

    // reset handling actions after all macro events are handled (all other pointer up events)
    setTimeout(() => {
      this.handlingActions = undefined;
    }, 0);
  }

  private destroy() {
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.pointerHandler, this);
  }

  isHandlingActions(): boolean {
    return !!this.handlingActions;
  }

  startOrderCommand(orderType: OrderType, actors: GameObject[]) {
    this.handlingActions = {
      orderType
    };
    const cursorHandler = getSceneComponent(this.hudScene, CursorHandler);
    if (!cursorHandler) {
      console.warn("CursorHandler not found in scene components");
      return;
    }
    let cursorType: CursorType;
    switch (orderType) {
      case OrderType.Attack:
        cursorType = CursorType.AttackGreen;
        break;
      case OrderType.Gather:
        cursorType = CursorType.ChopGreen;
        break;
      case OrderType.Move:
        cursorType = CursorType.TargetMoveA;
        break;
      case OrderType.ReturnResources:
        cursorType = CursorType.ChopGreen;
        break;
      case OrderType.Repair:
        cursorType = CursorType.BuildGreen;
        break;
      case OrderType.Heal:
        cursorType = CursorType.PotionGreen;
        break;
      case OrderType.EnterContainer:
        cursorType = CursorType.TargetMoveB;
        break;
      case OrderType.Build:
      case OrderType.Stop:
      default:
        // There is no need for a specific cursor type for these actions as they're not two-step actions
        cursorType = CursorType.Default;
        break;
    }
    cursorHandler.setCursor(cursorType);
  }

  private initiateCommand(tileVec2?: Vector2Simple, targetGameObjectId?: string) {
    if (!this.handlingActions) return;
    const { orderType } = this.handlingActions;

    const tileVec3 = tileVec2
      ? {
          x: tileVec2.x,
          y: tileVec2.y,
          z: 0
        }
      : undefined;

    emitEventIssueActorCommandToSelectedActors(this.scene, {
      orderType,
      objectIds: targetGameObjectId ? [targetGameObjectId] : undefined,
      tileVec3
    });
  }
}
