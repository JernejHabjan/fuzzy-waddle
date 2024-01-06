import { Subject } from "rxjs";
import { Cameras, GameObjects, Geom, Input, Scene } from "phaser";

export class DEPRECATED_multiSelectionHandler {
  onSelect: Subject<Geom.Rectangle> = new Subject();
  onPreview: Subject<Geom.Rectangle> = new Subject();
  private selection: GameObjects.Rectangle;
  private selectionRect: Geom.Rectangle | null = null;

  constructor(
    scene: Scene,
    private readonly input: Input.InputPlugin,
    private readonly mainCamera: Cameras.Scene2D.Camera
  ) {
    this.selection = scene.add.rectangle(0, 0, 0, 0, 0x1d7196, 0.5).setDepth(Phaser.Math.MAX_SAFE_INTEGER);
    this.setupEvents();
  }

  overlapsBounds(rect: Geom.Rectangle, bounds: Geom.Rectangle): boolean {
    if (!this.selectionRect) return false;
    return Geom.Rectangle.Overlaps(rect, bounds);
  }

  destroy() {
    this.input.off(Input.Events.POINTER_DOWN);
    this.input.off(Input.Events.POINTER_MOVE);
    this.input.off(Input.Events.POINTER_UP);
    this.input.off(Input.Events.GAME_OUT);
  }

  private setupEvents() {
    this.input.on(Input.Events.POINTER_DOWN, this.handlePointerDown, this);
    this.input.on(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    this.input.on(Input.Events.POINTER_UP, this.handlePointerUp, this);
    this.input.on(Input.Events.GAME_OUT, () => {
      this.hideSelectionRectangle();
    });
  }

  private handlePointerDown(pointer: Input.Pointer) {
    if (!pointer.leftButtonDown()) {
      return;
    }

    this.selection.x = pointer.worldX;
    this.selection.y = pointer.worldY;
    this.selectionRect = null;
  }

  private hideSelectionRectangle() {
    this.selection.width = 0;
    this.selection.height = 0;
    this.selectionRect = null;
  }

  private handlePointerUp(pointer: Input.Pointer) {
    if (!pointer.rightButtonReleased()) {
      this.onSelect.next(this.selectionRect as Geom.Rectangle);

      this.hideSelectionRectangle();
    }
  }

  private handlePointerMove(pointer: Input.Pointer) {
    if (!pointer.leftButtonDown()) {
      return;
    }

    const prevWorldPosition = this.mainCamera.getWorldPoint(pointer.prevPosition.x, pointer.prevPosition.y);
    const dx = pointer.worldX - prevWorldPosition.x;
    const dy = pointer.worldY - prevWorldPosition.y;

    this.selection.width += dx;
    this.selection.height += dy;

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

    // use the new Rectangle to check for overlap
    this.onPreview.next(this.selectionRect);
  }
}
