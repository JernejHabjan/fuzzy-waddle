import Phaser, { GameObjects, Geom, Input } from "phaser";
import HudProbableWaffle from "../../../../scenes/HudProbableWaffle";

export const MULTI_SELECTING = "multiSelecting";

export class MultiSelectionHandler {
  private _multiSelecting = false;
  set multiSelecting(value: boolean) {
    if (this._multiSelecting === value) return;
    this._multiSelecting = value;
    this.hudScene.events.emit(MULTI_SELECTING, value);
  }

  private selection: GameObjects.Rectangle;
  private selectionRect: Geom.Rectangle | null = null;

  constructor(private readonly hudScene: HudProbableWaffle) {
    this.selection = hudScene.add.rectangle(0, 0, 0, 0, 0x1d7196, 0.5);
    this.hudScene.onDestroy.subscribe(() => this.destroy());
    this.setupEvents();
  }

  static gameObjectOverlapsBounds(
    gameObject: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Size,
    bounds: Geom.Rectangle
  ): boolean {
    const boundsRect = new Geom.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
    const gameObjectRect = new Geom.Rectangle(
      gameObject.x - gameObject.width / 2,
      gameObject.y - gameObject.height / 2,
      gameObject.width,
      gameObject.height
    );
    return Geom.Intersects.RectangleToRectangle(boundsRect, gameObjectRect);
  }

  destroy() {
    this.hudScene.input.off(Input.Events.POINTER_DOWN);
    this.hudScene.input.off(Input.Events.POINTER_MOVE);
    this.hudScene.input.off(Input.Events.POINTER_UP);
    this.hudScene.input.off(Input.Events.GAME_OUT);
  }

  private setupEvents() {
    this.hudScene.input.on(Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    this.hudScene.input.on(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.hudScene.input.on(Input.Events.POINTER_UP, this.handlePointerUp, this);
    this.hudScene.input.on(Input.Events.GAME_OUT, () => {
      this.hideSelectionRectangle();
    });
  }

  private handlePointerDown(pointer: Input.Pointer) {
    if (!pointer.leftButtonDown()) return;

    this.selection.x = pointer.worldX;
    this.selection.y = pointer.worldY;
    this.selectionRect = null;
  }

  private hideSelectionRectangle() {
    this.selection.width = 0;
    this.selection.height = 0;
    this.selectionRect = null;
    this.multiSelecting = false;
  }

  private handlePointerUp(pointer: Input.Pointer) {
    const isShiftDown = pointer.event.shiftKey;
    const isCtrlDown = pointer.event.ctrlKey;
    if (!pointer.rightButtonReleased()) {
      this.sendSelection("multiSelect", isShiftDown, isCtrlDown);

      this.hideSelectionRectangle();
    }
    this.multiSelecting = false;
  }

  private handlePointerMove(pointer: Input.Pointer) {
    if (!pointer.leftButtonDown()) {
      return;
    }

    const prevWorldPosition = this.hudScene.cameras.main.getWorldPoint(pointer.prevPosition.x, pointer.prevPosition.y);
    const dx = pointer.worldX - prevWorldPosition.x;
    const dy = pointer.worldY - prevWorldPosition.y;

    this.selection.width += dx;
    this.selection.height += dy;

    // check if rectangle is at least 10x10 (absolute value)
    if (Math.abs(this.selection.width) < 10 || Math.abs(this.selection.height) < 10) {
      return;
    }

    // create a new Rectangle
    this.selectionRect = new Geom.Rectangle(
      this.selection.x,
      this.selection.y,
      this.selection.width,
      this.selection.height
    );

    // check if width or height is negative
    // and then adjust
    if (this.selectionRect.width < 0) {
      this.selectionRect.x += this.selectionRect.width;
      this.selectionRect.width *= -1;
    }
    if (this.selectionRect.height < 0) {
      this.selectionRect.y += this.selectionRect.height;
      this.selectionRect.height *= -1;
    }

    this.multiSelecting = true;
    const isShiftDown = pointer.event.shiftKey;
    const isCtrlDown = pointer.event.ctrlKey;
    // use the new Rectangle to check for overlap
    this.sendSelection("multiSelectPreview", isShiftDown, isCtrlDown);
  }

  private sendSelection(type: "multiSelectPreview" | "multiSelect", shiftKey = false, ctrlKey = false) {
    if (!this.selectionRect) return;
    this.hudScene.communicator.selection!.sendLocally({
      gameInstanceId: this.hudScene.gameInstanceId,
      emitterUserId: this.hudScene.userId,
      type,
      data: {
        button: "left",
        selectedArea: {
          x: this.selectionRect.x,
          y: this.selectionRect.y,
          width: this.selectionRect.width,
          height: this.selectionRect.height
        },
        shiftKey,
        ctrlKey
      }
    });
  }
}
